# Security Review — Architex

**Date:** 2026-05-07  
**Reviewer:** Security Agent (claude-sonnet-4-6)  
**Scope:** API route handlers, middleware, authentication, rate limiting, CSP/headers, Drizzle queries, prompt injection, LZString handling, secrets management  
**Branch:** `main` (HEAD `280c9c4`)  
**Methodology:** Static analysis — all `src/app/api/**/route.ts` files read in full, plus `src/middleware.ts`, `src/lib/security/`, `src/lib/auth.ts`, `src/lib/ai/prompt-safety.ts`, `src/lib/collaboration/shareable-links.ts`, `src/lib/export/to-url.ts`, `next.config.ts`, `vercel.json`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 7 |
| INFORMATIONAL | 3 |
| **Total** | **18** |

Dependency audit was not completed — `pnpm audit` failed due to network unavailability during analysis (`ENOTFOUND registry.npmjs.org`). Run `pnpm audit --audit-level=high` separately before release.

No hardcoded secrets were found. Drizzle ORM parameterization is applied consistently and correctly — no SQL injection vectors were identified. Svix webhook verification is implemented correctly. The auth system (Clerk v7) is generally well-applied. The three HIGH findings are concrete, exploitable issues that should be fixed before any public launch.

---

## Critical Findings

None.

---

## High Findings

### HIGH-1 — Client-Controlled Grade Score (Broken Access Control / Business Logic Bypass)

**OWASP:** A01:2021 Broken Access Control  
**File:** `src/app/api/lld/drill-attempts/[id]/route.ts:82–89`

The `PATCH` handler with `action: "submit"` accepts `gradeScore` (number) and `gradeBreakdown` (unknown object) directly from the request body and writes them to the database without any server-side validation, recomputation, or sanity check.

```typescript
// route.ts lines 82-89
if (typeof body.gradeScore === "number") {
  updates.gradeScore = body.gradeScore;
}
if (body.gradeBreakdown) {
  updates.gradeBreakdown = body.gradeBreakdown;
}
```

Any authenticated user can send:

```bash
curl -X PATCH /api/lld/drill-attempts/<their-attempt-id> \
  -H "Authorization: Bearer <valid-clerk-token>" \
  -d '{"action":"submit","gradeScore":1.0,"gradeBreakdown":{"fabricated":true}}'
```

This allows self-awarding perfect scores on any drill attempt without actually completing it correctly. The FSRS scheduling algorithm downstream will receive fraudulent input, corrupting spaced-repetition state.

**Fix:** `gradeScore` must be computed server-side from the stored conversation transcript and an authoritative rubric, never accepted from the client. The client should only submit the conversation turn; the server derives the grade.

---

### HIGH-2 — No Authentication on `POST /api/evaluate` (Broken Authentication)

**OWASP:** A07:2021 Identification and Authentication Failures  
**File:** `src/app/api/evaluate/route.ts:100` (no `requireAuth()` call anywhere in file)

The evaluate endpoint accepts arbitrary `nodes`, `edges`, and `challenge` data and runs heuristic evaluation logic. There is no authentication check — any unauthenticated client can POST to this endpoint with no credentials.

The current implementation has AI calls stubbed out (commented), so the immediate computational cost is low. However:

1. The route is publicly reachable on production via the middleware's default allow-all-unguarded behavior (it is not on the public allowlist, meaning middleware _would_ protect it IF `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set, but see MEDIUM-2 for the conditional auth issue).
2. When the AI stub is uncommented, this becomes a free, unauthenticated LLM evaluation service.
3. Even heuristic evaluation logic can be abused for scraping and automated probing.

**Fix:** Add `const { userId } = await requireAuth();` at the top of the handler, before any processing.

---

### HIGH-3 — No Authentication on `POST /api/hint` (Broken Authentication)

**OWASP:** A07:2021 Identification and Authentication Failures  
**File:** `src/app/api/hint/route.ts:75` (no `requireAuth()` call anywhere in file)

Identical pattern to HIGH-2. The hint endpoint accepts a `challengeId` (and optionally `nodes`/`edges`) and returns a hint. No auth check is present. The AI path is also currently stubbed, but the endpoint is open.

**Fix:** Add `const { userId } = await requireAuth();` at the top of the handler.

---

## Medium Findings

### MEDIUM-1 — In-Memory Rate Limiter Not Shared Across Serverless Instances

**OWASP:** A05:2021 Security Misconfiguration  
**File:** `src/lib/security/rate-limiter.ts`

The token-bucket rate limiter uses an in-process `Map` to track per-IP and per-user request counts. On Vercel's serverless runtime, each cold-started function instance maintains its own independent bucket. A client that fans requests across multiple instances (which happens naturally under load) can exceed the nominal limit by a factor equal to the number of concurrent instances.

This means the "100 req/min per IP" middleware limit and the per-user AI limits (10/hour or 30/hour in DB) enforced in-memory are best-effort under production load. The DB-based AI rate limits stored in Postgres (`user_ai_usage` table) are globally consistent and are the stronger control for AI endpoints.

**Impact:** Rate limiting is effective against concentrated burst traffic to a single cold-started instance, but not against distributed abuse at production scale.

**Fix:** Replace in-memory buckets with a Redis-backed rate limiter (e.g., `@upstash/ratelimit`) for the middleware IP check. The DB-based per-user AI limits are already durable and do not need changing.

---

### MEDIUM-2 — Auth Enforcement Conditional on Environment Variable Presence

**OWASP:** A05:2021 Security Misconfiguration  
**Files:** `src/middleware.ts:104`, `src/app/api/ai/explain/route.ts:361–367`, `src/app/api/lld/explain-inline/route.ts` (similar block)

In `src/middleware.ts`:

```typescript
// middleware.ts line 104
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !isPublicRoute(req)) {
  await auth.protect();
}
```

If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is absent (a misconfigured deployment, a stripped environment, or a staging environment without Clerk configured), **no routes are protected** — the entire application becomes unauthenticated.

The same pattern is repeated in AI route files for their own auth blocks. The design intent is to allow local development without Clerk, but the guard is the publishable key (which should always be present in any real deployment) rather than `NODE_ENV === 'development'`.

**Impact:** A deployment with a missing or incorrectly named env var silently removes all authentication. This is a latent risk.

**Fix:** Invert the guard. Use `NODE_ENV === 'development'` for the dev bypass (as `src/lib/auth.ts` already does with `DEV_CLERK_ID`). In middleware, always call `auth.protect()` on non-public routes; the dev bypass in `requireAuth()` already handles local development. If the Clerk key is absent in production, fail loudly at startup rather than silently opening all routes.

---

### MEDIUM-3 — `Math.random()` Fallback in Nonce Generation

**OWASP:** A02:2021 Cryptographic Failures  
**File:** `src/lib/security/csp.ts:87–95`

```typescript
// csp.ts
function generateNonce(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString("base64");
  }
  // Fallback for environments without crypto
  return Buffer.from(Math.random().toString()).toString("base64");
}
```

`Math.random()` is not a cryptographically secure PRNG. A CSP nonce generated with `Math.random()` can be predicted, defeating the nonce-based XSS protection.

In the current deployment (Vercel Edge Runtime), `crypto` is available and the fallback does not trigger. However, the fallback is architecturally present and could activate in an unexpected runtime (local mock server, test environment, alternative deployment target).

**Fix:** Remove the `Math.random()` fallback entirely. Replace with:

```typescript
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}
```

If `crypto` is unavailable, throw rather than silently falling back.

---

### MEDIUM-4 — Decompression Guard Utility Never Applied to LZString Paths

**OWASP:** A04:2021 Insecure Design  
**Files:** `src/lib/security/decompression-guard.ts`, `src/lib/collaboration/shareable-links.ts`, `src/lib/export/to-url.ts`

A `decompression-guard.ts` utility exists that implements bomb detection (ratio check, max output size). It is never imported or called from either LZString decompression site.

LZString decompression occurs client-side in the browser (`decompressFromEncodedURIComponent`). A crafted URL with a highly compressed payload could expand to a very large string in the client's memory, causing tab crash or slow UI in the browser.

**Impact:** Client-side denial-of-service only. Server memory is not at risk. A malicious user sharing a link with an oversized compressed payload could cause the recipient's browser tab to become unresponsive.

**Fix:** Apply the decompression guard before calling `LZString.decompressFromEncodedURIComponent()` in both `shareable-links.ts` and `to-url.ts`. The guard should check the compressed size before decompression, and discard decompressed output exceeding a reasonable threshold (e.g., 1 MB for diagram state).

---

### MEDIUM-5 — No Content-Length Limit on Drill Interviewer User Messages

**OWASP:** A04:2021 Insecure Design  
**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts`

The `body.content` field (the user's conversational message to the AI interviewer) is written directly to the database and inserted into the Claude prompt with no length limit.

A malicious authenticated user can send a multi-megabyte string as their "message", which is:
1. Stored in the database (potential storage abuse).
2. Passed as a user turn to the Claude prompt (potential prompt bloat driving token costs up dramatically and degrading response quality).

Other AI routes cap inputs (e.g., 30 classes in `/api/ai/explain`, 2000-char selection and 4000-char context in `/api/lld/explain-inline`). This endpoint lacks equivalent guards.

**Fix:** Cap `body.content` at a reasonable limit (e.g., 4000 characters). Trim or reject requests exceeding the cap before DB write and before constructing the Claude prompt.

---

## Low / Informational Findings

### LOW-1 — `detectInjectionAttempt()` Never Called in Route Handlers

**OWASP:** A03:2021 Injection  
**File:** `src/lib/ai/prompt-safety.ts` (function defined), no call sites found in route handlers

`sanitizeUserInput()` is called correctly in the AI routes. `detectInjectionAttempt()` exists alongside it as a detection function (returns boolean) but has no call sites in any route handler. It is dead code from a security standpoint.

The `sanitizeUserInput()` function already strips structural delimiters and escapes special tokens, so the sanitizer provides actual protection. The detection function would add the ability to log or block detected injection attempts before they reach sanitization.

**Fix:** Either call `detectInjectionAttempt()` in routes where prompt injection is a risk and log/reject attempts, or remove the function if the sanitizer is deemed sufficient.

---

### LOW-2 — `metadata` Field in `/api/activity` Has No Size Cap

**OWASP:** A04:2021 Insecure Design  
**File:** `src/app/api/activity/route.ts`

The `metadata` field is typed as `Record<string, unknown>` with no max-size validation before DB insertion. An authenticated user could POST arbitrarily large JSON objects as activity metadata, consuming database storage.

**Fix:** Validate `metadata` byte size before insertion (e.g., reject if `JSON.stringify(metadata).length > 4096`).

---

### LOW-3 — `config` and `results` in `/api/simulations` Have No Size Caps

**OWASP:** A04:2021 Insecure Design  
**File:** `src/app/api/simulations/route.ts`

Same pattern as LOW-2. `config: unknown` and `results: unknown` are accepted and stored without size validation.

**Fix:** Apply size cap before DB insertion. Reject payloads where the serialized config or results exceed a defined limit.

---

### LOW-4 — Bookmark and Content-Read String Fields Have No Length Limits

**OWASP:** A04:2021 Insecure Design  
**File:** `src/app/api/lld/bookmarks/route.ts`

Fields `patternSlug`, `sectionId`, `anchorId`, `anchorLabel`, and `note` are accepted from the request body with no length constraints before DB insertion. While these are authenticated endpoints and the DB column types likely provide implicit limits, explicit application-layer validation is missing.

**Fix:** Add `z.string().max(N)` constraints for each field in a Zod schema. Use the schema to validate before processing.

---

### LOW-5 — Debug `console.log` Logging Request Headers in Production Code

**OWASP:** A09:2021 Security Logging and Monitoring Failures  
**File:** `src/app/api/lld/drill-attempts/[id]/route.ts:57–60`

```typescript
// Temporary trace added to diagnose auto-abandon behavior
console.log("[drill-attempt] PATCH action=abandon", {
  attemptId: id,
  "user-agent": req.headers.get("user-agent"),
  referer: req.headers.get("referer"),
});
```

The git commit message for this code explicitly calls it a "trace log to diagnose auto-abandon". Logging `user-agent` and `referer` headers to server logs on every `action: "abandon"` call is a privacy concern (these are client fingerprinting attributes) and indicates the log was left in after the diagnostic session.

**Fix:** Remove this `console.log`. Use a structured logger with log levels if the diagnostic data is needed again.

---

### LOW-6 — `vercel.json` Security Headers Incomplete vs. Middleware

**OWASP:** A05:2021 Security Misconfiguration  
**File:** `vercel.json`

`vercel.json` defines static security headers that partially duplicate those in `next.config.ts` and `src/middleware.ts`. The `vercel.json` headers are missing:
- `Strict-Transport-Security` (HSTS) — present in `next.config.ts`, absent from `vercel.json`
- `Permissions-Policy` — present in `next.config.ts`, absent from `vercel.json`
- `Content-Security-Policy` — set dynamically in middleware (nonce-based), correctly absent from static configs

On Vercel, `next.config.ts` headers take precedence for Next.js routes, so this duplication gap has no immediate impact. However, the partial duplication creates confusion about which file is authoritative.

**Fix:** Remove the security header block from `vercel.json` entirely (let `next.config.ts` and middleware own all headers), or document which file is canonical for each header.

---

### LOW-7 — `X-XSS-Protection` Header Is Deprecated

**OWASP:** A05:2021 Security Misconfiguration  
**File:** `next.config.ts` and `vercel.json`

Both files set `X-XSS-Protection: 1; mode=block`. This header is deprecated and has been removed from Chrome, Firefox, and Edge. Modern browsers ignore it. MDN explicitly recommends against using it. In older browsers (IE 8+), it could introduce new XSS vulnerabilities via reflection in certain contexts.

**Fix:** Remove `X-XSS-Protection` from both `next.config.ts` and `vercel.json`. Rely on the nonce-based CSP already in place.

---

### INFORMATIONAL-1 — `style-src 'unsafe-inline'` in All CSP Environments

**File:** `src/lib/security/csp.ts`

CSP includes `style-src 'self' 'unsafe-inline'` in all environments including production. This is a known and accepted tradeoff for Tailwind CSS, which generates inline style attributes. It means CSS injection is not blocked by CSP.

**Context:** This is a deliberate architectural tradeoff. No flag required; document the decision in the CSP configuration.

---

### INFORMATIONAL-2 — Public Search Endpoint Has IP Rate Limiting Only

**File:** `src/app/api/search/route.ts`

The public (unauthenticated) search endpoint is covered only by the global middleware IP rate limiter (100 req/min). The search uses a `LIKE` pattern query against the database (`%${query}%`), which is a full-table scan pattern. Under heavy parallel requests, this could produce database load.

The Drizzle `sql` template literal parameterizes the pattern correctly — no SQL injection risk. The `query` is trimmed and requires minimum 2 characters.

**Context:** Acceptable for current scale. Consider a dedicated, more restrictive rate limit on this route (e.g., 20 req/min) and adding a `query` max length cap (e.g., 100 characters) as a defense-in-depth measure when traffic grows.

---

### INFORMATIONAL-3 — Dev Auth Bypass Uses `DEV_CLERK_ID` Constant

**File:** `src/lib/auth.ts:17`

```typescript
const DEV_CLERK_ID = "dev-user-local";
```

When `NODE_ENV === 'development'` and no Clerk session exists, `requireAuth()` returns this hardcoded synthetic user ID. This is correctly gated on `NODE_ENV` and is a standard development convenience pattern.

This is not a vulnerability. It is documented here because the same guard check in middleware uses `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` instead of `NODE_ENV` (see MEDIUM-2), creating an inconsistency in dev-bypass strategy between the two layers.

---

## Per-Route Review Table

| Route | Auth | Rate Limit | Input Validation | Findings |
|-------|------|------------|------------------|----------|
| `GET /api/health` | None (public) | IP-global | N/A | — |
| `GET /api/templates` | None (public) | IP-global | — | — |
| `GET /api/challenges` | None (public) | IP-global | — | — |
| `GET /api/challenges/[id]` | None (public) | IP-global | — | — |
| `GET /api/content/[...path]` | None (public) | IP-global | — | — |
| `GET /api/search` | None (public) | IP-global | query min 2 chars, no max | INFORMATIONAL-2 |
| `POST /api/evaluate` | **NONE** | IP-global | nodes/edges/challenge sanitized | **HIGH-2** |
| `POST /api/hint` | **NONE** | IP-global | challengeId validated | **HIGH-3** |
| `GET /api/ai/explain` | Conditional (MEDIUM-2) | IP-global + DB 10/hr | 30 classes max, sanitized | MEDIUM-2 |
| `POST /api/ai/explain` | Conditional (MEDIUM-2) | IP-global + DB 10/hr | 30 classes max, sanitized | MEDIUM-2 |
| `GET /api/activity` | `requireAuth()` | IP-global | — | — |
| `POST /api/activity` | `requireAuth()` | IP-global | metadata unbounded | LOW-2 |
| `GET /api/simulations` | `requireAuth()` | IP-global | — | — |
| `POST /api/simulations` | `requireAuth()` | IP-global | config/results unbounded | LOW-3 |
| `GET /api/simulations/[id]` | `requireAuth()` | IP-global | — | — |
| `PATCH /api/simulations/[id]` | `requireAuth()` | IP-global | config/results unbounded | LOW-3 |
| `DELETE /api/simulations/[id]` | `requireAuth()` | IP-global | — | — |
| `GET /api/lld/drill-sessions` | `requireAuth()` | IP-global | — | — |
| `POST /api/lld/drill-sessions` | `requireAuth()` | IP-global | — | — |
| `GET /api/lld/drill-attempts` | `requireAuth()` | IP-global | — | — |
| `POST /api/lld/drill-attempts` | `requireAuth()` | IP-global | — | — |
| `GET /api/lld/drill-attempts/[id]` | `requireAuth()` | IP-global | — | — |
| `PATCH /api/lld/drill-attempts/[id]` | `requireAuth()` | IP-global | gradeScore/gradeBreakdown client-supplied | **HIGH-1**, LOW-5 |
| `GET /api/lld/drill-interviewer/[id]/stream` | `requireAuth()` | IP-global | — | — |
| `POST /api/lld/drill-interviewer/[id]/stream` | `requireAuth()` | IP-global | body.content unbounded | MEDIUM-5 |
| `GET /api/lld/explain-inline` | Conditional (MEDIUM-2) | IP-global + DB 30/hr | selection/context capped, sanitized | MEDIUM-2 |
| `POST /api/lld/explain-inline` | Conditional (MEDIUM-2) | IP-global + DB 30/hr | selection/context capped, sanitized | MEDIUM-2 |
| `GET /api/lld/bookmarks` | `requireAuth()` | IP-global | — | — |
| `POST /api/lld/bookmarks` | `requireAuth()` | IP-global | string fields unbounded | LOW-4 |
| `DELETE /api/lld/bookmarks/[id]` | `requireAuth()` | IP-global | — | — |
| `POST /api/lld/concept-reads` | `requireAuth()` | IP-global | string fields unbounded | LOW-4 |
| `GET /api/user/profile` | `requireAuth()` | IP-global | — | — |
| `PATCH /api/user/profile` | `requireAuth()` | IP-global | — | — |
| `GET /api/user/progress` | `requireAuth()` | IP-global | — | — |
| `GET /api/user/stats` | `requireAuth()` | IP-global | — | — |
| `GET /api/oembed` | None (public) | IP-global | URL allowlisted, title escaped | — |
| `POST /api/csp-report` | None (public) | IP-global | body ignored (logged only) | — |
| `POST /api/webhooks/clerk` | Svix sig verification | IP-global | svix-verified | — |

---

## Configuration Review

### `src/middleware.ts`

- Auth enforcement: present but conditional on env var (MEDIUM-2)
- Public route allowlist: `/api/webhooks(.*)`, `/api/health`, `/api/templates`, `/api/challenges`, `/api/content(.*)`, `/api/csp-report`, `/api/oembed(.*)` — reasonable; `/api/evaluate` and `/api/hint` are NOT on this list, meaning middleware would protect them IF the Clerk key is set (HIGH-2 and HIGH-3 depend on the env-conditional guard)
- IP rate limit: 100 req/min in-memory (MEDIUM-1)
- Security headers: applied on every response; includes HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP with nonce

### `next.config.ts`

- Security headers applied via `headers()` for all routes matching `/(.*)`
- Includes: X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection (LOW-7), Referrer-Policy, Permissions-Policy, HSTS
- Does not set CSP (correctly delegated to middleware for nonce support)

### `vercel.json`

- Duplicates some headers from `next.config.ts` without full parity (LOW-6)
- Missing HSTS and Permissions-Policy vs `next.config.ts`
- Font files: `Cache-Control: public, max-age=31536000, immutable` — correct

### `src/lib/security/csp.ts`

- Nonce generation: cryptographically secure in production; Math.random fallback present (MEDIUM-3)
- `style-src 'unsafe-inline'`: present in all envs (INFORMATIONAL-1)
- `script-src`: nonce-based, no `'unsafe-eval'`
- `frame-ancestors 'none'`: set
- `object-src 'none'`: set
- `base-uri 'self'`: set
- `connect-src`: limited to self and configured domains

### `src/lib/auth.ts`

- `requireAuth()`: throws `UnauthorizedError` if no session, correct behavior
- Dev bypass on `NODE_ENV === 'development'`: correctly scoped
- `getAuthenticatedUserId()`: safe wrapper around `requireAuth()`

### Drizzle ORM / SQL

- All queries inspected use Drizzle's parameterized query builders or the `sql` template literal with interpolated values (which Drizzle parameterizes at the driver level)
- No string-concatenated raw SQL found
- No SQL injection vectors identified

### Webhook Verification (`/api/webhooks/clerk/route.ts`)

- Svix `Webhook.verify()` called before body parsing — correct
- Returns 503 if `CLERK_WEBHOOK_SECRET` absent
- Returns 400 if required svix headers absent
- Returns 401 on signature failure
- Implementation is correct

### Prompt Injection (`src/lib/ai/prompt-safety.ts`)

- `sanitizeUserInput()`: strips structural delimiters (`<`, `>`, `|`, backticks), escapes injection tokens (`[INST]`, `<SYS>`, `</s>`, etc.) with zero-width space insertion, truncates to `maxLength`
- Applied to user-controlled fields in AI routes
- `detectInjectionAttempt()`: exists, never called in production code (LOW-1)

---

## Out of Scope

- **Dependency audit:** `pnpm audit` failed due to `ENOTFOUND registry.npmjs.org` during analysis. Run `pnpm audit --audit-level=high` in a networked environment before release. No CVE data was available for the dependency tree.
- **Client-side code:** UI components, React state, client-side rendering logic not reviewed. LZString decompression is client-side only (MEDIUM-4 covers the guard gap).
- **Database schema / migrations:** Column types, constraints, indexes not reviewed.
- **Clerk dashboard configuration:** MFA enforcement, session duration, allowed redirect URIs not reviewed.
- **Vercel project settings:** Environment variable scoping, preview branch access controls, deployment protection not reviewed.
- **Third-party integrations:** Stripe (not found in scope), analytics not reviewed.
- **E2E / penetration testing:** This is a static analysis review only. Dynamic testing was not performed.

---

## Reproduction Notes

### HIGH-1 — Self-Award Perfect Drill Score

Prerequisites: Valid Clerk session token for any user; an existing drill attempt ID belonging to that user.

```bash
curl -X PATCH "https://architex.app/api/lld/drill-attempts/<attempt-id>" \
  -H "Cookie: <clerk-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit",
    "gradeScore": 1.0,
    "gradeBreakdown": {
      "accuracy": 1.0,
      "completeness": 1.0,
      "depth": 1.0
    }
  }'
```

Expected (vulnerable): HTTP 200, attempt record updated with gradeScore=1.0.

---

### HIGH-2 — Unauthenticated Evaluate

No credentials required.

```bash
curl -X POST "https://architex.app/api/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [],
    "edges": [],
    "challenge": {
      "id": "test",
      "title": "Test",
      "requirements": ["req1"]
    }
  }'
```

Expected (vulnerable): HTTP 200 with evaluation result.

---

### HIGH-3 — Unauthenticated Hint

No credentials required.

```bash
curl -X POST "https://architex.app/api/hint" \
  -H "Content-Type: application/json" \
  -d '{"challengeId": "any-valid-challenge-id"}'
```

Expected (vulnerable): HTTP 200 with hint content.

---

### MEDIUM-5 — Oversized Drill Message

Prerequisites: Valid Clerk session; active drill session ID.

```bash
python3 -c "print('A' * 500000)" | \
  curl -X POST "https://architex.app/api/lld/drill-interviewer/<session-id>/stream" \
  -H "Cookie: <clerk-session-cookie>" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$(python3 -c "print('A' * 500000)")\"}"
```

Expected (vulnerable): message stored in DB and forwarded to Claude, driving significant token cost.

---

*Report generated by static analysis. No fixes applied. All findings require human verification before remediation.*
