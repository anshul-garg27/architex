# Architex Security & Cryptography — Backend & Data Migration Analysis

**Date**: 2026-04-13
**Scope**: Security module data architecture, backend migration feasibility, and roadmap
**Status**: Analysis only — no code changes

---

## Phase 1: Data Inventory

### 1.1 Static Content (Topic Descriptions, Step Text, Metadata)

The Security module has a fundamentally different architecture from the Algorithms module.
There is NO `AlgorithmConfig` pattern. Instead, content is distributed across:

1. **Topic metadata** — hardcoded in `SecurityModule.tsx:89-145` (TOPICS array, 11 entries)
2. **Step descriptions** — hardcoded INSIDE engine functions as string literals
3. **UI labels** — hardcoded in canvas components (legends, headers, tooltips)
4. **Educational text** — hardcoded in properties panel and bottom panel

**Topic Metadata Inventory:**

| Topic | Description Location | Description Length | Step Count | Total Step Text (est.) |
|-------|---------------------|-------------------|-----------|----------------------|
| OAuth 2.0 (PKCE) | oauth-flows.ts:99-262 | ~2.5 KB | 9 | ~4 KB |
| OAuth 2.0 (Client Creds) | oauth-flows.ts:273-359 | ~1.5 KB | 4 | ~2 KB |
| OAuth 2.0 (Device Auth) | device-auth.ts:51-254 | ~3 KB | 11 | ~5 KB |
| JWT Lifecycle | jwt-engine.ts (live computation) | ~0.5 KB | N/A (live) | ~1 KB |
| JWT Attacks | jwt-attacks.ts:43-279 | ~4 KB | 15 (5x3) | ~6 KB |
| Diffie-Hellman | diffie-hellman.ts:76-163 | ~3 KB | 8 | ~4 KB |
| AES-128 | aes-engine.ts:243-327 | ~2 KB | 41 | ~5 KB |
| HTTPS Flow | https-flow.ts:69-325 | ~5 KB | 6+25 sub | ~8 KB |
| CORS | cors-simulator.ts:162-421 | ~4 KB | 3-7 (dynamic) | ~5 KB |
| Certificate Chain | cert-chain.ts:126-210 | ~2 KB | 3-6 | ~3 KB |
| Password Hashing | password-hashing.ts:84-210 | ~3 KB | 7+table | ~4 KB |
| Rate Limiting | rate-limiting-demo.ts:43-231 | ~2 KB | 45 (3x15) | ~3 KB |
| Web Attacks | web-attacks.ts:44-286 | ~5 KB | 19 (3x~6) | ~7 KB |
| Encryption Comparison | encryption-comparison.ts:46-327 | ~5 KB | 24 (3x~8) | ~7 KB |
| DDoS Simulation | DDoSSimulationVisualizer.tsx:24-98 | ~1 KB | 28 ticks | ~2 KB |
| **TOTAL** | — | **~43 KB** | **~250 steps** | **~66 KB** |

**Total static educational content: ~66 KB** across 13 topics, 250+ steps.

This content is:
- ❌ NOT editable by non-developers (hardcoded in TypeScript)
- ❌ NOT searchable (embedded in engine functions)
- ❌ NOT versionable independently of code
- ❌ NOT translatable (English-only strings in code)
- ✅ Small enough to bundle (66 KB is acceptable)
- ✅ Content rarely changes (security concepts are stable)

### 1.2 Configuration Data (Parameters, Defaults, Options)

| File | Data | Type | User-Configurable? |
|------|------|------|-------------------|
| SecurityModule.tsx:4584 | Default `active: "oauth"` | State default | No (could be) |
| SecurityModule.tsx:4612-4630 | JWT default header/payload/secret | State defaults | Yes (live editing) |
| SecurityModule.tsx:4639-4642 | DH default params (p=23, g=5, a=4, b=3) | State defaults | Yes (live editing) |
| SecurityModule.tsx:4649-4653 | AES default plaintext/key hex | State defaults | Yes (live editing) |
| SecurityModule.tsx:4663 | HTTPS default domain "api.example.com" | State default | Yes (live editing) |
| SecurityModule.tsx:4671-4675 | CORS default config (origin, target, method, headers, credentials) | State defaults | Yes (config form) |
| SecurityModule.tsx:4703-4704 | Password hash default ("password123", cost=10) | State defaults | Yes (live editing) |
| SecurityModule.tsx:4712-4716 | Rate limiting params (capacity=5, refillRate=0.5, etc.) | State defaults | Partially (properties panel) |
| cors-simulator.ts:162-170 | CORS server config (allowedOrigins, allowedMethods, etc.) | Hardcoded | No (should be configurable) |
| DDoSSimulationVisualizer.tsx:142-143 | serverCapacity=200, mitigationThreshold=250 | Hardcoded | No (identified as gap in audit) |

**Configuration defaults: ~1 KB total.** All small, all reasonable to keep in frontend.

The one exception: **CORS server config** is hardcoded to allow specific origins/methods. This should be user-configurable in the properties panel (partially addressed by existing CORS config form for the REQUEST side, but the SERVER response policy is fixed).

### 1.3 Implementation Logic (Engines, Pure Functions)

| File | Function | Lines | Pure? | CPU-Intensive? | Needs Server? |
|------|----------|-------|-------|---------------|---------------|
| aes-engine.ts | aesEncrypt() | 100 | ✅ | ❌ (<1ms) | ❌ |
| aes-engine.ts | keyExpansion() | 42 | ✅ | ❌ | ❌ |
| diffie-hellman.ts | simulateDH() | 98 | ✅ | ❌ | ❌ |
| diffie-hellman.ts | modPow() | 12 | ✅ | ❌ | ❌ |
| jwt-engine.ts | encodeJWT/decodeJWT/validateJWT | 130 | ✅ | ❌ | ❌ |
| oauth-flows.ts | simulateAuthCodePKCE() | 175 | ✅ | ❌ | ❌ |
| oauth-flows.ts | simulateClientCredentials() | 90 | ✅ | ❌ | ❌ |
| device-auth.ts | simulateDeviceAuth() | 210 | ✅ | ❌ | ❌ |
| https-flow.ts | simulateHTTPSFlow() | 260 | ✅ | ❌ | ❌ |
| cors-simulator.ts | simulateCORS() | 260 | ✅ | ❌ | ❌ |
| cert-chain.ts | simulateCertificateChain() | 85 | ✅ | ❌ | ❌ |
| password-hashing.ts | demonstrateBcrypt() | 80 | ✅ | ❌ | ❌ |
| password-hashing.ts | demonstrateRainbowTable() | 40 | ✅ | ❌ | ❌ |
| rate-limiting-demo.ts | simulateTokenBucket/SlidingWindow/LeakyBucket | 170 | ✅ | ❌ | ❌ |
| web-attacks.ts | simulateXSS/CSRF/SQLInjection | 210 | ✅ | ❌ | ❌ |
| encryption-comparison.ts | simulateSymmetric/Asymmetric/Hybrid | 280 | ✅ | ❌ | ❌ |
| DDoSSimulationVisualizer.tsx | simulateDDoS() | 65 | ✅ | ❌ | ❌ |

**All 17 engine functions are pure, synchronous, <1ms execution, <300 lines.**
None benefit from server-side computation or Web Workers.
**VERDICT: Keep ALL engine logic in frontend.**

### 1.4 User-Generated Data (State, Progress, Saved Configs)

| Store | Data | Persisted? | Where? | Cross-Device? |
|-------|------|-----------|--------|-------------|
| useUIStore | activeModule, theme, panel visibility | Yes | localStorage "architex-ui" | ❌ No |
| useProgressStore | attempts, totalXP, streakDays | Yes | localStorage "architex-progress" | ❌ No |
| useCrossModuleStore | moduleMastery, conceptProgress | Yes | localStorage "architex-cross-module" | ❌ No |
| useSecurityModule (hook) | active topic, stepIndex, input values | No (session only) | React state | ❌ No |

**User progress data: ~2-5 KB in localStorage.** Currently NOT wired (mastery always 0), but once wired (SEC-206), this data becomes valuable and worth persisting to a database for cross-device access.

### 1.5 Production Security Utilities (NOT visualization)

| File | Purpose | Lines | Used By Module? | Used By Platform? |
|------|---------|-------|----------------|------------------|
| csp.ts | CSP header builder | 95 | ❌ | ✅ middleware.ts |
| cors.ts | CORS header config | 81 | ❌ | ✅ middleware.ts |
| csrf.ts | CSRF token management | 183 | ❌ | ✅ (ready for API routes) |
| ssrf.ts | SSRF URL validation | 149 | ❌ | ✅ (ready for API routes) |
| oauth.ts | Redirect URI validation | 108 | ❌ | ✅ (ready for auth flow) |
| auth-errors.ts | Generic auth error messages | 94 | ❌ | ✅ (ready for auth) |
| decompression-guard.ts | Zip bomb prevention | 149 | ❌ | ✅ (ready for upload) |
| rate-limiter.ts | Production rate limiter | 151 | ❌ | ✅ middleware.ts |
| sanitize.ts | XSS/SVG/Markdown sanitization | 212 | ❌ | ✅ content rendering |

**These 9 files (1,322 lines) are platform infrastructure, NOT visualization content.**
They are correctly placed in `lib/security/` and do NOT need migration.
They should stay exactly where they are — they're used by middleware and API routes.

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE (Neon PostgreSQL via Drizzle)

```
CANDIDATE: Topic Catalog (names, descriptions, difficulty, tags, prerequisites)
CURRENTLY: Hardcoded in SecurityModule.tsx:89-145 (TOPICS array)
WHY MOVE:
  ✅ Content writers can update without code deploy
  ✅ Needs to be searchable/filterable (for Cmd+K search across all content)
  ✅ Needs versioning/history (track content changes)
  ✅ Needs localization (same schema, different language)
  ❌ NOT performance-critical (only 13 items, <2 KB)
  ❌ Content changes rarely (security concepts are stable)
DB TABLE: NEW — security_topics (or shared module_topics table)
MIGRATION EFFORT: M
PRIORITY: P3 — benefit is real but small for 13 items. Higher priority for
  modules with 60+ items (Algorithms has 83).
```

```
CANDIDATE: User Progress & Mastery (per-topic completion, XP, streaks)
CURRENTLY: localStorage via useProgressStore + useCrossModuleStore
WHY MOVE:
  ✅ Needs to persist across devices (login on laptop, continue on phone)
  ✅ Needs to be shared (leaderboards, social proof "42K students learned OAuth")
  ✅ Analytics (which topics are most completed/abandoned)
  ✅ Enables features: streak emails, weekly recap, "continue where you left off"
DB TABLE: EXISTING — progress table (src/db/schema/progress.ts) already has
  userId, moduleId, conceptId, score, completedAt — PERFECT fit
MIGRATION EFFORT: S (schema exists, just need API routes + client hooks)
PRIORITY: P1 — this is the HIGHEST priority backend migration. It enables
  retention features that can't exist with localStorage alone.
```

```
CANDIDATE: Step Descriptions & Educational Text
CURRENTLY: Hardcoded inside engine functions as string template literals
WHY MOVE:
  ✅ Content writers can update descriptions without touching code
  ✅ Enables i18n (translate to Spanish, Hindi, etc.)
  ✅ Enables A/B testing (try different descriptions, measure learning)
  ✅ Enables community contributions (submit better explanations)
  ❌ Tightly coupled to engine logic (descriptions reference computed values)
  ❌ 66 KB total — small enough for bundle
  ❌ Would add API latency to step-by-step playback
DB TABLE: NEW — security_step_content
MIGRATION EFFORT: L (descriptions use template literals with computed values like
  `${alicePublic}` — extracting them requires a content template system)
PRIORITY: P3 — high effort, moderate benefit. Only worthwhile if i18n or
  community content is a priority. Keep in frontend for now.
```

### 2.2 MOVE TO API ROUTE (lazy load via API)

```
CANDIDATE: Security Topic Detail (full metadata for a specific topic)
CURRENTLY: All 13 topics loaded when Security module mounts
WHY API: If topic metadata moves to DB, the sidebar needs a catalog API
  and the canvas needs a detail API. This enables:
  ✅ Lazy loading (only fetch topic when selected)
  ✅ Full-text search across all topics
  ✅ Dynamic meta tags for SEO (per-topic OG tags)
API ROUTE: GET /api/security/topics (catalog)
           GET /api/security/topics/[id] (detail)
METHOD: GET
CACHE: ISR 24 hours (content rarely changes)
RESPONSE: { id, name, description, difficulty, tags, prerequisites }
PRIORITY: P3 — only needed if topic catalog moves to DB
```

```
CANDIDATE: User Progress Sync
CURRENTLY: localStorage (useProgressStore, useCrossModuleStore)
WHY API: Enable cross-device persistence and analytics
API ROUTE: GET /api/progress?module=security (fetch user progress)
           POST /api/progress (save completion/mastery update)
METHOD: GET / POST
AUTH: Required (Clerk — already configured, just commented out)
CACHE: No cache (personalized data)
RESPONSE GET: { mastery: { theory: 45, practice: 20 }, conceptsCompleted: ["oauth", "jwt"], streakDays: 7, totalXP: 350 }
BODY POST: { moduleId: "security", conceptId: "oauth", score: 1.0, action: "completed" }
DB TABLE: progress (existing schema — perfect fit)
PRIORITY: P1 — this is the most impactful API to create
```

### 2.3 KEEP IN FRONTEND (no change)

| Data | Why Keep | Size |
|------|---------|------|
| **All 17 engine functions** (simulateDH, aesEncrypt, etc.) | Pure computation. <1ms execution. No server data needed. Real-time interactive. | ~3,500 lines |
| **All canvas/visualization rendering** | Real-time SVG/HTML rendering. Too latency-sensitive for API. | ~3,000 lines |
| **Topic metadata (TOPICS array)** | Only 13 items, ~2 KB. Not worth the API round-trip for now. | 60 lines |
| **Step descriptions** | Tightly coupled to computed values. Template literal interpolation. | ~66 KB |
| **Configuration defaults** (DH params, AES hex, CORS config) | Session-only state. No persistence needed. | ~1 KB |
| **Production security utilities** (CSP, CORS, CSRF, SSRF, etc.) | Platform infrastructure. Already in correct location. | 1,322 lines |
| **UI state** (active topic, step index, panel visibility) | Session state. Too frequent to sync to server. | — |

### 2.4 MOVE TO WEB WORKER (off main thread)

**No candidates.** All Security engine functions execute in <1ms. None block the UI. Web Workers would add complexity without benefit.

The one edge case: if `aesEncrypt()` is run on very large inputs (not currently possible — clamped to 16 bytes), it could benefit from a Worker. But the current architecture doesn't allow this.

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Tables That Fit

| Table | Schema File | Status | Fits Security Module? |
|-------|------------|--------|----------------------|
| `users` | users.ts | Schema exists, not migrated | ✅ For auth (Clerk sync) |
| `progress` | progress.ts | Schema exists, not migrated | ✅ **PERFECT** — userId + moduleId + conceptId + score |
| `diagrams` | diagrams.ts | Schema exists, not migrated | ❌ Not applicable |
| `templates` | templates.ts | Schema exists, not migrated | ❌ Not applicable |
| `simulations` | simulations.ts | Schema exists, not migrated | ⚠️ Could store DDoS sim configs |
| `gallery` | gallery.ts | Schema exists, not migrated | ⚠️ Could store shared visualizations |

The `progress` table is **already perfectly designed** for Security module progress:
```sql
-- Existing schema (progress.ts:19-49):
-- id: uuid PK
-- userId: uuid FK -> users.id
-- moduleId: varchar(100) -- "security"
-- conceptId: varchar(100) -- "oauth", "jwt", "aes", etc.
-- score: real (0.0 to 1.0)
-- completedAt: timestamp
-- createdAt, updatedAt
```

This means: **zero new tables needed** for the MVP backend migration.

### 3.2 New Tables (Only If Topic Catalog Moves to DB)

Only create if/when we decide to move topic metadata to DB (P3 priority):

```typescript
// src/db/schema/security-topics.ts (PROPOSED — not needed for MVP)
import { pgTable, varchar, text, jsonb, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const securityTopics = pgTable("security_topics", {
  id: varchar("id", { length: 50 }).primaryKey(),          // "oauth"
  name: varchar("name", { length: 100 }).notNull(),         // "OAuth 2.0 / OIDC"
  description: text("description").notNull(),                // Full description
  category: varchar("category", { length: 50 }).notNull(),  // "authentication", "cryptography", "web-security"
  difficulty: varchar("difficulty", { length: 20 }),          // "beginner", "intermediate", "advanced"
  sortOrder: integer("sort_order").notNull().default(0),     // Display ordering
  prerequisites: jsonb("prerequisites").$type<string[]>(),   // ["encryption"] for HTTPS
  tags: jsonb("tags").$type<string[]>(),                     // ["owasp", "interview", "2026"]
  realWorldApps: text("real_world_apps"),                     // "Google Sign-In, GitHub OAuth"
  interviewTips: text("interview_tips"),                      // "FAANG asks: which flow for SPAs?"
  commonMistakes: text("common_mistakes"),                    // "Storing tokens in localStorage"
  summary: jsonb("summary").$type<string[]>(),               // 3-bullet takeaway
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 3.3 Data Seeding Strategy (If Catalog Moves to DB)

```
Step 1: Extract TOPICS array from SecurityModule.tsx:89-145
Step 2: Enrich with content from concept quality audit (hooks, analogies, real-world)
Step 3: Create seed: src/db/seeds/security-topics.ts
Step 4: Run: pnpm drizzle-kit generate && pnpm drizzle-kit migrate
Step 5: Run seed script to populate 13 rows
Step 6: Create API routes: GET /api/security/topics, GET /api/security/topics/[id]
Step 7: Update SecurityModule.tsx TOPICS to fetch from API (with SWR/React Query)
Step 8: Remove hardcoded TOPICS array
```

---

## Phase 4: API Design

### Priority 1: User Progress API (enables retention features)

```
ENDPOINT: GET /api/progress?module=security
PURPOSE: Fetch user's Security module progress
AUTH: Required (Clerk)
CACHE: No (personalized)
RESPONSE:
{
  mastery: { theory: 45, practice: 20 },
  conceptsCompleted: ["oauth", "jwt", "diffie-hellman"],
  totalXP: 350,
  streakDays: 7,
  lastActiveDate: "2026-04-13",
  topicProgress: {
    "oauth": { score: 1.0, completedAt: "2026-04-10T..." },
    "jwt": { score: 0.8, completedAt: "2026-04-11T..." }
  }
}
DB TABLE: progress (existing)
MIGRATION FROM: useProgressStore + useCrossModuleStore (localStorage)
                → API fetch on mount + API POST on completion
```

```
ENDPOINT: POST /api/progress
PURPOSE: Record topic completion, XP, mastery update
AUTH: Required (Clerk)
BODY:
{
  moduleId: "security",
  conceptId: "oauth",
  score: 1.0,
  action: "topic_completed" | "practice_completed" | "challenge_solved"
}
RESPONSE: { ok: true, newXP: 360, newStreak: 8 }
DB TABLE: progress (existing)
```

### Priority 2: Security Topic Catalog API (enables SEO + search)

```
ENDPOINT: GET /api/security/topics
PURPOSE: Fetch catalog for sidebar (only if metadata moves to DB)
AUTH: None (public)
CACHE: ISR 1 hour
RESPONSE:
{
  topics: [
    { id: "oauth", name: "OAuth 2.0 / OIDC", category: "authentication", difficulty: "intermediate" },
    { id: "jwt", name: "JWT Lifecycle", category: "authentication", difficulty: "beginner" },
    ...
  ]
}
NOTE: Only needed if we move TOPICS to DB. Otherwise, keep hardcoded.
```

### Priority 3: Shared Visualization API (enables community features)

```
ENDPOINT: POST /api/security/share
PURPOSE: Save a visualization state for sharing
AUTH: Optional (anonymous sharing allowed)
BODY:
{
  topic: "diffie-hellman",
  step: 5,
  params: { p: 23, g: 5, a: 4, b: 3 },
  title: "My DH example"
}
RESPONSE: { shareId: "abc123", url: "architex.dev/s/abc123" }

ENDPOINT: GET /api/security/share/[id]
PURPOSE: Load a shared visualization
AUTH: None (public)
CACHE: ISR 24 hours (shared content is immutable)
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
CURRENT STATE:
  SecurityModule.tsx: 5,169 lines = ~200 KB (uncompressed)
  All engine files: ~5,300 lines = ~200 KB
  Total Security bundle: ~400 KB (uncompressed), ~80 KB gzipped

  This is ALREADY acceptable. The Security module is NOT a performance problem.
  (Compare: DataStructuresModule is 235K tokens = ~900 KB uncompressed)

AFTER MIGRATION (if content moves to DB):
  SecurityModule.tsx: ~2,000 lines (after monolith split) = ~80 KB
  Engine files: same (stay in frontend)
  API fetches: ~2 KB per topic on demand
  Savings: ~120 KB from initial bundle

VERDICT: Performance gain is MINIMAL for Security. The module is already
  reasonably sized. Migration is justified by FEATURES, not performance.
```

### Feature Benefits

```
ENABLED BY PROGRESS API (P1):
  ✅ User progress saved across devices (login → see your history)
  ✅ Streak counter works reliably (server-side, not localStorage)
  ✅ Dashboard radar chart populated with real data
  ✅ "Continue where you left off" across devices
  ✅ Social proof: "42,000 students completed OAuth here"
  ✅ Analytics: which topics are most completed/abandoned
  ✅ Weekly recap emails: "This week you learned 3 Security topics!"

ENABLED BY TOPIC CATALOG API (P3):
  ✅ Full-text search across all Security topic descriptions
  ✅ Dynamic SEO meta tags per topic (after URL routing)
  ✅ Content updates without code deploy
  ✅ i18n: same topic in multiple languages
  ✅ A/B testing: try different descriptions
  ✅ Community contributions: submit better explanations

ENABLED BY SHARE API (P3):
  ✅ Share a specific visualization state via URL
  ✅ Embed visualizations in blog posts
  ✅ Professor shares a DH example with class
```

### User Experience Benefits

```
P1 (with Progress API):
  - Log in on laptop, see progress on phone ← BIGGEST UX win
  - "You're on a 7-day streak!" notification
  - Dashboard shows real mastery data

P2 (with URL routing, no backend needed):
  - Share links: architex.dev/m/security/oauth
  - Browser back/forward works
  - Bookmark specific topics

P3 (with Catalog API):
  - Faster search: Cmd+K searches DB, not JS bundle
  - Better SEO: Google indexes each topic individually
```

---

## Phase 6: Migration Roadmap

```
STEP 1: Activate Clerk Auth (prerequisite for all user-specific features)
  - Uncomment ClerkProvider in layout.tsx, middleware.ts, activity-bar.tsx
  - Configure Clerk dashboard with OAuth providers
  - Sync users to DB via webhook → users table
  Effort: M (configuration, not code)
  Blocks: Steps 2-3

STEP 2: Run Drizzle Migrations (create tables in Neon)
  - pnpm drizzle-kit generate
  - pnpm drizzle-kit migrate
  - Verify: users, progress, diagrams, templates, simulations, gallery tables exist
  Effort: S (schemas already written)
  Blocks: Step 3

STEP 3: Create Progress API Routes
  - GET /api/progress?module=security
  - POST /api/progress
  - Wire to Drizzle + progress table
  - Add Clerk auth middleware
  Effort: M
  Blocks: Step 4

STEP 4: Wire Security Module to Progress API
  - On topic completion → POST /api/progress
  - On module mount → GET /api/progress (populate mastery)
  - Fallback: if no auth, use localStorage (graceful degradation)
  - Update dashboard to read from API instead of localStorage
  Effort: M
  Blocks: Nothing (retention features now work)

STEP 5 (OPTIONAL, P3): Move Topic Catalog to DB
  - Create security_topics table
  - Seed from existing TOPICS array
  - Create API routes
  - Update SecurityModule.tsx to fetch from API
  - Add loading states
  Effort: L
  Benefit: CMS-editable content, i18n, search

STEP 6 (OPTIONAL, P3): Create Share API
  - POST /api/security/share (save state)
  - GET /api/security/share/[id] (load state)
  - Generate short URLs
  Effort: M
  Benefit: Shareability, embeds, community
```

---

## Phase 7: What NOT to Move

```
✅ KEEP IN FRONTEND — DO NOT MOVE:

  Engine functions (17 functions, ~3,500 lines):
    aesEncrypt(), simulateDH(), simulateAuthCodePKCE(), etc.
    Reason: Pure computation, <1ms, real-time interactive.
    Moving to server would add 50-200ms latency PER STEP.

  Canvas/visualization rendering (~3,000 lines):
    OAuthSequenceDiagram, AESCanvas, DiffieHellmanCanvas, etc.
    Reason: Real-time SVG/HTML rendering. Cannot be server-rendered.

  Step descriptions (embedded in engine functions):
    Reason: Tightly coupled to computed values via template literals.
    Extracting would require a template engine. Cost > benefit for 66 KB.

  Production security utilities (9 files, 1,322 lines):
    csp.ts, cors.ts, csrf.ts, ssrf.ts, sanitize.ts, etc.
    Reason: Platform infrastructure. Already server-side where needed.
    These are NOT visualization content.

  UI state (active topic, step index, panel visibility):
    Reason: Session-only, too frequent for API calls.

  Configuration defaults (DH params, AES hex, CORS config):
    Reason: Session-only input values. No persistence needed.

→ MOVE TO BACKEND — RECOMMENDED:

  User progress & mastery (P1):
    → progress table (existing schema)
    → GET/POST /api/progress
    Reason: Cross-device sync, analytics, retention features.

  Topic catalog metadata (P3, optional):
    → security_topics table (new)
    → GET /api/security/topics
    Reason: CMS-editable, searchable, translatable.

  Shared visualization state (P3, optional):
    → New share table
    → POST/GET /api/security/share/[id]
    Reason: Shareable links, embeds, community.
```

---

## Summary: Security Module Backend Migration Priority

| Priority | What | Effort | Benefit | Prerequisite |
|----------|------|--------|---------|-------------|
| **P1** | User progress API (cross-device sync) | M | Enables streaks, mastery, analytics, retention | Clerk auth + DB migration |
| **P2** | Share API (visualization sharing) | M | Enables social sharing, embeds, community | URL routing (PLT-001) |
| **P3** | Topic catalog API (CMS content) | L | Enables i18n, search, A/B testing | DB migration |
| **—** | Engine functions | — | **DO NOT MOVE** — pure frontend, <1ms | — |
| **—** | Step descriptions | — | **DO NOT MOVE** — coupled to computed values | — |
| **—** | Canvas rendering | — | **DO NOT MOVE** — real-time interactive | — |

**The Security module is NOT a performance bottleneck.** At ~400 KB uncompressed (~80 KB gzipped), it's well within acceptable bundle sizes. The Algorithms module (1.1 MB) and DataStructures module (900 KB+) are higher priorities for backend migration.

**The highest-value backend work for Security is the Progress API (P1)** — it unlocks retention features (streaks, mastery, analytics) that are impossible with localStorage alone. This requires Clerk auth activation + Drizzle migration as prerequisites — both of which benefit ALL 13 modules, not just Security.
