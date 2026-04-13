# 16 - Developer Experience, Legal, and Operations

> 54 tasks across 3 categories.
> Based on audit of `package.json`, project root, and missing files.

---

## Audit Results: What Exists vs What's Missing

| File/Directory | Exists? | Notes |
|---------------|---------|-------|
| `README.md` | Yes | Content unknown (not read in this audit) |
| `CONTRIBUTING.md` | **No** | Contributors have no guide |
| `LICENSE` | **No** | Project has no license -- legally ambiguous |
| `.github/` | **No** | No CI/CD, no issue templates, no PR templates |
| `.env.example` | **No** | New developers can't configure the app |
| `package.json` scripts | Minimal | Only: `dev`, `build`, `start`, `lint` |
| `tests/` | **No** | No test files anywhere |
| `drizzle.config.ts` | Yes | Database ORM config exists at repo root |
| `drizzle/` | Yes | Database schema/migrations directory |

---

## Category 1: Developer Experience (24 tasks)

### 1.1 README Rewrite (1 task)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 1 | Rewrite `README.md` | Must include: project description, feature overview, tech stack table, screenshots/GIFs, quick start (3 commands), development setup, architecture overview (link to docs), contributing link, license badge, deployment guide. Target: 200-400 lines. | P0 |

### 1.2 CONTRIBUTING.md (1 task)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 2 | Create `CONTRIBUTING.md` | Sections: Prerequisites (Node 20+, pnpm), Getting Started, Project Structure, Code Style (ESLint + Prettier config), Commit Convention (Conventional Commits), Branch Strategy (feature/*, fix/*, docs/*), PR Process (template, review expectations, CI checks), Architecture Decision Records (link), Module Development Guide (how to add a new module). | P0 |

### 1.3 Architecture Decision Records (8 tasks)

| # | Task | Title | Description | Priority |
|---|------|-------|-------------|----------|
| 3 | ADR-001 | State Management: Zustand over Redux | Why Zustand was chosen. Multiple stores vs single store. Middleware strategy (zundo). | P1 |
| 4 | ADR-002 | Canvas Engine: React Flow | Why @xyflow/react over alternatives (Konva, Fabric, custom SVG). Custom node/edge types. | P1 |
| 5 | ADR-003 | Module Architecture Pattern | How modules are isolated (per-module hooks). The useModuleContent pattern. Why not route-based modules. | P1 |
| 6 | ADR-004 | WASM Simulation Engine | Why Rust/WASM for simulation instead of pure JS. Performance benchmarks. Fallback strategy. | P1 |
| 7 | ADR-005 | Adapter Pattern for Canvas State | Why canonical ArchitexNode/ArchitexEdge types separate from React Flow Node/Edge. Conversion boundaries. | P1 |
| 8 | ADR-006 | Command Bus over Event Emitter | Why synchronous command dispatch instead of pub/sub. Atomic multi-store updates. Audit log. | P1 |
| 9 | ADR-007 | IndexedDB over LocalStorage for Persistence | Why Dexie/IndexedDB for project storage. Size limits comparison. Schema versioning. | P2 |
| 10 | ADR-008 | Custom Undo/Redo over Zundo | Problems with zundo (drag creates 60 entries/sec, single-store only). Custom UndoManager design. | P2 |

**ADR Template:**

```markdown
# ADR-NNN: Title

## Status
Accepted | Proposed | Superseded

## Context
What is the issue we're seeing?

## Decision
What did we decide to do?

## Consequences
What becomes easier or harder?
```

### 1.4 Issue and PR Templates (4 tasks)

| # | Task | File | Description | Priority |
|---|------|------|-------------|----------|
| 11 | Bug report template | `.github/ISSUE_TEMPLATE/bug_report.yml` | Fields: description, reproduction steps, expected behavior, screenshots, browser/OS, Architex version. | P0 |
| 12 | Feature request template | `.github/ISSUE_TEMPLATE/feature_request.yml` | Fields: problem statement, proposed solution, alternatives considered, module affected. | P0 |
| 13 | PR template | `.github/pull_request_template.md` | Sections: Summary, Related issue, Type of change (bug fix/feature/refactor), Checklist (tests, lint, docs, screenshots). | P0 |
| 14 | Good First Issue template | `.github/ISSUE_TEMPLATE/good_first_issue.yml` | Fields: description, files to modify, expected behavior, difficulty estimate, mentor contact. | P1 |

### 1.5 NPM Scripts (10 tasks)

Current scripts: `dev`, `build`, `start`, `lint`.

| # | Task | Script | Command | Priority |
|---|------|--------|---------|----------|
| 15 | Add `typecheck` | `"typecheck": "tsc --noEmit"` | Type-check without emitting files. | P0 |
| 16 | Add `format` | `"format": "prettier --write \"src/**/*.{ts,tsx,css}\""` | Auto-format all source files. Requires installing Prettier. | P0 |
| 17 | Add `format:check` | `"format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""` | CI-friendly format check. | P0 |
| 18 | Add `test` | `"test": "vitest"` | Unit tests. Requires installing Vitest. | P0 |
| 19 | Add `test:coverage` | `"test:coverage": "vitest --coverage"` | Test coverage report. | P1 |
| 20 | Add `test:e2e` | `"test:e2e": "playwright test"` | E2E tests. Requires installing Playwright. | P1 |
| 21 | Add `analyze` | `"analyze": "ANALYZE=true next build"` | Bundle analysis with @next/bundle-analyzer. | P1 |
| 22 | Add `storybook` | `"storybook": "storybook dev -p 6006"` | Component development environment. Requires Storybook setup. | P2 |
| 23 | Add `wasm:build` | `"wasm:build": "cd wasm && wasm-pack build --target web --out-dir ../public/wasm"` | Build WASM module. Requires Rust toolchain. | P2 |
| 24 | Add `db:generate` | `"db:generate": "drizzle-kit generate"` | Generate Drizzle migrations. Already has drizzle.config.ts. | P1 |

---

## Category 2: Legal (14 tasks)

### 2.1 License (1 task)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 25 | Create `LICENSE` with AGPL-3.0 | AGPL-3.0 is recommended for SaaS products that want to remain open source while requiring network users to share modifications. Alternative: MIT if fully open, or BSL 1.1 for delayed open source. Decision needed. | P0 |

**License Comparison:**

| License | Commercial Use | Modification | Distribution | Network Use | Patent Grant |
|---------|---------------|--------------|--------------|-------------|--------------|
| MIT | Yes | Yes | Yes | No copyleft | No |
| AGPL-3.0 | Yes | Yes (must share) | Yes (must share) | Must share | Yes |
| BSL 1.1 | No (until change date) | Yes | Yes | No (until change date) | No |

### 2.2 Terms of Service (3 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 26 | Draft Terms of Service | Sections: Acceptance, Account Terms, Acceptable Use, Service Availability (no SLA for free tier), Intellectual Property (user retains ownership of diagrams), Limitation of Liability, Termination, Governing Law. | P1 |
| 27 | Create Terms of Service page | `/terms` route. Render markdown or static HTML. Version date. | P1 |
| 28 | Add Terms acceptance flow | Checkbox on signup: "I agree to the Terms of Service". Store acceptance timestamp. | P2 |

### 2.3 Privacy Policy (3 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 29 | Draft Privacy Policy | Sections: Data Collection (what we collect), Data Usage (how we use it), Data Storage (where), Data Retention (how long), Third Parties (Stripe, PostHog, Sentry), User Rights (access, deletion, export), Children's Privacy (not for under 13). | P1 |
| 30 | Create Privacy Policy page | `/privacy` route. Version date. "Last updated" timestamp. | P1 |
| 31 | Add Privacy link to footer/StatusBar | Visible on every page per GDPR/CCPA requirements. | P1 |

### 2.4 Cookie Policy (2 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 32 | Draft Cookie Policy | Categories: Essential (auth session), Functional (theme preference, panel state), Analytics (PostHog), Marketing (none currently). Duration. How to opt out. | P2 |
| 33 | Cookie consent banner | GDPR-compliant banner: "We use cookies for..." with Accept/Reject/Customize buttons. Store preference in localStorage. Block non-essential cookies until consent. | P2 |

### 2.5 GDPR Implementation (5 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 34 | Data export (Right to Portability) | API endpoint: `GET /api/user/data-export` -- Returns ZIP with: user profile, all projects (JSON), all settings, activity log. | P1 |
| 35 | Account deletion (Right to Erasure) | API endpoint: `DELETE /api/user/account` -- Deletes: user record, all projects, all snapshots, Stripe customer, PostHog user. 30-day grace period. | P1 |
| 36 | Consent management | Track consent per category (analytics, marketing). API to update consent. Respect "Do Not Track" header. | P2 |
| 37 | Data Processing Agreement | DPA template for team/enterprise customers. Sub-processors list (Vercel, Stripe, Sentry, PostHog). | P2 |
| 38 | GDPR audit log | Log all data access, modification, deletion events. Immutable append-only log. 2-year retention. | P2 |

---

## Category 3: Operations (16 tasks)

### 3.1 Environment Configuration (3 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 39 | Create `.env.example` | Document all environment variables with descriptions and example values. | P0 |

**Proposed `.env.example` contents:**

```bash
# ── App ──────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Architex

# ── Database ─────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/architex

# ── Authentication (future) ──────────────────
# AUTH_SECRET=generate-with-openssl-rand-base64-32
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# ── Stripe (future) ─────────────────────────
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── Monitoring ───────────────────────────────
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_AUTH_TOKEN=
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ── Collaboration (future) ───────────────────
# PARTYKIT_URL=
# PARTYKIT_TOKEN=
```

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 40 | Environment validation | Use `zod` to validate environment variables at build time. Fail fast with clear error messages for missing required vars. Create `src/lib/env.ts`. | P1 |
| 41 | Environment guide | Document which variables are required per deployment target (local, preview, production). Add to CONTRIBUTING.md. | P1 |

### 3.2 CI/CD Pipeline (5 tasks)

| # | Task | File | Description | Priority |
|---|------|------|-------------|----------|
| 42 | Lint + Typecheck workflow | `.github/workflows/ci.yml` | On push/PR: `npm run lint`, `npm run typecheck`. Fail PR if either fails. | P0 |
| 43 | Test workflow | `.github/workflows/test.yml` | On push/PR: `npm run test`. Upload coverage to Codecov. | P0 |
| 44 | Build verification | `.github/workflows/build.yml` | On push to main: `npm run build`. Verify production build succeeds. | P0 |
| 45 | E2E test workflow | `.github/workflows/e2e.yml` | On PR: Run Playwright tests against preview deployment. | P1 |
| 46 | Dependency audit | `.github/workflows/audit.yml` | Weekly: `npm audit`. Create issue if vulnerabilities found. | P2 |

### 3.3 Deployment (4 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 47 | Deployment checklist document | Create `docs/deployment-checklist.md`. Steps: verify env vars, run migrations, build, smoke test, monitor errors for 30 min. | P1 |
| 48 | Vercel configuration | `vercel.json` with: build command, output directory, environment variable groups, preview branch settings, serverless function regions. | P1 |
| 49 | Preview deployments | Configure Vercel preview deployments for PRs. Add comment bot with preview URL. | P1 |
| 50 | Production deployment guardrails | Branch protection on `main`: require PR, require CI pass, require 1 approval, no force push. | P0 |

### 3.4 Monitoring & Alerting (2 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 51 | Uptime monitoring | Configure uptime check (UptimeRobot, Better Uptime, or Vercel Analytics). Alert on: site down > 1 min, response time > 3s. Notification: Slack + email. | P1 |
| 52 | Error alerting | Sentry alert rules: new error type -> Slack notification. Error spike (10x baseline in 5 min) -> PagerDuty/email. Weekly error digest. | P1 |

### 3.5 Cost Management (2 tasks)

| # | Task | Description | Priority |
|---|------|-------------|----------|
| 53 | Cost tracking setup | Document expected costs per service: Vercel (hosting), Neon/Supabase (database), Stripe (2.9% + 30c per transaction), Sentry (free tier), PostHog (free tier: 1M events/mo), PartyKit (collaboration). Set budget alerts. | P2 |
| 54 | Scaling cost model | Estimate costs at: 100, 1K, 10K, 100K monthly active users. Identify cost drivers. Plan for: CDN caching (reduce Vercel bandwidth), edge functions vs serverless, database connection pooling, WASM caching strategy. | P2 |

---

## Task Summary Table

| Category | Subcategory | Task Count | P0 | P1 | P2 |
|----------|-------------|------------|----|----|-----|
| Developer Experience | README | 1 | 1 | 0 | 0 |
| Developer Experience | CONTRIBUTING | 1 | 1 | 0 | 0 |
| Developer Experience | ADRs | 8 | 0 | 6 | 2 |
| Developer Experience | Templates | 4 | 3 | 1 | 0 |
| Developer Experience | NPM Scripts | 10 | 4 | 4 | 2 |
| **DX Subtotal** | | **24** | **9** | **11** | **4** |
| Legal | License | 1 | 1 | 0 | 0 |
| Legal | Terms of Service | 3 | 0 | 2 | 1 |
| Legal | Privacy Policy | 3 | 0 | 3 | 0 |
| Legal | Cookie Policy | 2 | 0 | 0 | 2 |
| Legal | GDPR | 5 | 0 | 2 | 3 |
| **Legal Subtotal** | | **14** | **1** | **7** | **6** |
| Operations | Environment | 3 | 1 | 2 | 0 |
| Operations | CI/CD | 5 | 3 | 1 | 1 |
| Operations | Deployment | 4 | 1 | 3 | 0 |
| Operations | Monitoring | 2 | 0 | 2 | 0 |
| Operations | Cost | 2 | 0 | 0 | 2 |
| **Ops Subtotal** | | **16** | **5** | **8** | **3** |
| **Grand Total** | | **54** | **15** | **26** | **13** |

---

## Implementation Order (P0 items first)

### Sprint 1: Foundation (P0 -- 15 tasks)

1. `LICENSE` (AGPL-3.0) -- Task 25
2. `.env.example` -- Task 39
3. `CONTRIBUTING.md` -- Task 2
4. README.md rewrite -- Task 1
5. `.github/ISSUE_TEMPLATE/bug_report.yml` -- Task 11
6. `.github/ISSUE_TEMPLATE/feature_request.yml` -- Task 12
7. `.github/pull_request_template.md` -- Task 13
8. `typecheck` script -- Task 15
9. `format` + `format:check` scripts -- Tasks 16, 17
10. `test` script (with Vitest setup) -- Task 18
11. CI lint + typecheck workflow -- Task 42
12. CI test workflow -- Task 43
13. CI build verification -- Task 44
14. Branch protection on main -- Task 50

### Sprint 2: Core Infrastructure (P1 -- 26 tasks)

- ADRs 1-6 (Tasks 3-8)
- Good first issue template (Task 14)
- Additional npm scripts: coverage, e2e, analyze, db:generate (Tasks 19-21, 24)
- Terms of Service draft + page (Tasks 26, 27)
- Privacy Policy draft + page + link (Tasks 29-31)
- GDPR: data export + account deletion (Tasks 34, 35)
- Environment validation + guide (Tasks 40, 41)
- E2E workflow (Task 45)
- Deployment: checklist, Vercel config, previews (Tasks 47-49)
- Monitoring: uptime + error alerting (Tasks 51, 52)

### Sprint 3: Polish (P2 -- 13 tasks)

- ADRs 7-8 (Tasks 9, 10)
- Storybook + WASM scripts (Tasks 22, 23)
- Terms acceptance flow (Task 28)
- Cookie policy + consent banner (Tasks 32, 33)
- GDPR: consent management, DPA, audit log (Tasks 36-38)
- Dependency audit workflow (Task 46)
- Cost tracking + scaling model (Tasks 53, 54)
