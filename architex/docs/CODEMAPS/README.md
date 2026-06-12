# CODEMAPS

Module-by-module deep-dive of the architex codebase, plus reviews and a live UI tour. Authored 2026-05-07 by a 19-agent parallel team. ~13k lines + 21 screenshots.

This directory is the entry point for understanding the repo end-to-end. The 18 sibling docs sit alongside `EXISTING-DOCS-INDEX.md`, which catalogs the 200+ pre-existing docs across `architex/docs/`, the parent `docs/`, and `docs/superpowers/`.

---

## Reading orders

**Newcomer (1 hour)** — `00` → `09` (UI tour) → `17` (patterns) → `EXISTING-DOCS-INDEX` → spot-pick a module.

**Contributor onboarding** — `17` (patterns) → `06` (API/data) → `07` (state/libs) → `16` (tooling) → the module they'll touch.

**Code reviewer / architect** — `11` (security) → `12` (db) → `13` (perf) → `14` (a11y) → `15` (typescript) → `10` (test/build status).

**Product / strategy** — `00` (study materials) → `09` (UI tour) → `EXISTING-DOCS-INDEX` (Strategy / Vision section).

---

## Module deep-dives (descriptive)

| # | Doc | Lines | Covers |
|---|-----|------:|--------|
| 00 | [study-materials](./00-study-materials.md) | 581 | Curriculum tiers 01–07, 30 HLD problems, 10 LLD problems, research/, top-level prompts/scripts, BUILD_PLAN, MEGA_PROMPT |
| 01 | [canvas-and-lld](./01-canvas-and-lld.md) | 1092 | React-Flow canvas, LLD problem catalog, drill-mode lifecycle, AI drill interviewer (SSE), snapshot/annotation system, 8 lld_* tables, ~25 `/api/lld/*` routes |
| 02 | [learn-content-pipeline](./02-learn-content-pipeline.md) | 1053 | Modules→lessons→concepts hierarchy, MDX pipeline, knowledge graph, compile-lld-lessons + build-concept-graph scripts, seed flow, content caching |
| 03 | [interactive-learning](./03-interactive-learning.md) | 951 | Database playground, algorithms visualizer, DS/OS/patterns modules, custom `SimulationOrchestrator` engine, diagram persistence, unused-comlink-worker quirk |
| 04 | [auth-user-billing](./04-auth-user-billing.md) | 810 | Clerk middleware (conditional), svix webhook→users sync, dashboard/profile/settings/team, achievements, progress + activity dual-write, AI usage table, no-Stripe billing stub |
| 05 | [ai-and-collaboration](./05-ai-and-collaboration.md) | 970 | Anthropic SDK usage, prompt taxonomy, streaming drill-interviewer, hint/explain/evaluate/review/suggest-nodes endpoints, ml-design module, collab components |
| 06 | [api-and-data](./06-api-and-data.md) | 1173 | Dual-driver Drizzle (Neon HTTP + node-pg), 6 migrations, 22 schemas, full ~50-route inventory, OG/oembed/email-preview, CSP/middleware, dev auth bypass |
| 07 | [state-and-libs](./07-state-and-libs.md) | 526 | Zustand stores, zundo undo, hooks inventory, lib utilities, contexts, providers tree, persistence-boundary map (LS / IndexedDB / Postgres / URL) |
| 08 | [public-and-infra](./08-public-and-infra.md) | 719 | Landing/pricing/blog/gallery/embed/interviews, SEO, PWA, mobile, e2e suite (6 specs), Storybook, CI workflows, Dockerfile, vercel.json, build config |
| 09 | [ui-tour](./09-ui-tour.md) | 572 | **v2** Playwright tour with 205 screenshots covering path routes + SPA module switching (LLD 4 modes × 3 patterns, 22 patterns build mode, 22 data structures with hash routing, 13 modules via keyboard switcher, command palette, drill flow, mobile). v1 was wrong — assumed path routing for SPA modules. |
| 18 | [other-modules](./18-other-modules.md) | 723 | Modules wave-1 missed: system-design, distributed, networking, concurrency, security, interview + the innovation subsystem (skill-tree, time-attack, architecture-gallery — **dark code**, built but not wired in) + cross-module bridge system |
| 16 | [internal-tooling](./16-internal-tooling.md) | 582 | package.json scripts, scaffolding scripts, AGENTS.md, prompts library, .claude harness, husky/CI/Storybook |
| 17 | [architecture-patterns](./17-architecture-patterns.md) | 888 | Cross-cutting house style: naming, data flow, error envelopes, auth pattern, validation, persistence boundary, server/client split, streaming/worker patterns, ADR pointers |

## Reviews (findings)

| # | Doc | Lines | Headline |
|---|-----|------:|----------|
| 10 | [test-and-build-status](./10-test-and-build-status.md) | 480 | `typecheck=pass · lint=286 err / 521 warn · vitest=4338/4502 (164 fail, single React.act shim) · build=pass 495 pages · e2e=blocked (no @playwright/test dep + offline sandbox)` |
| 11 | [security-review](./11-security-review.md) | 528 | 0 critical · 3 high · 5 medium · 7 low · 3 info |
| 12 | [database-review](./12-database-review.md) | 517 | **2 critical** (hint-append read-modify-write race; Neon HTTP driver silently has no transactions) · 5 high (users.email not unique, resolveUserId extra round-trip, learn-progress PATCH race, unbounded `lld_concept_reads`/`lld_design_snapshots`, missing UNIQUE on interviewer turns) |
| 13 | [performance-review](./13-performance-review.md) | 577 | 6 high · 8 med · 5 low · 9 already-good. Top: SSE drill-interviewer buffers full LLM response server-side; `optimizePackageImports` absent; full `nodes[]` subscriptions in 20 components; `@tanstack/react-query-devtools` in `dependencies` |
| 14 | [a11y-review](./14-a11y-review.md) | 477 | 44 findings · 4 blockers · 9 critical. Notables: High Contrast toggle is a no-op (no CSS exists); `role="listbox"` mis-applied to module nav; React Flow nodes lack accessible name; `Cmd+E/T/J/I/Z` shortcuts fire from inside text inputs |
| 15 | [typescript-review](./15-typescript-review.md) | 289 | Strict mode passes; dominant debt is JSONB columns lacking `.$type<>()` (only 1 of ~20 typed) → cascading `as unknown as` in drill/diagram/simulation routes; `LLDDataContext` propagates `any[]` past existing typed shapes |

## Meta

| Doc | Lines | Purpose |
|-----|------:|---------|
| [EXISTING-DOCS-INDEX](./EXISTING-DOCS-INDEX.md) | 512 | Catalog of the 200+ pre-existing markdown docs across three doc trees (`architex/`, parent `docs/`, `docs/superpowers/`). Coverage gaps + cross-reference table. |

---

## Top findings (cross-cut)

Pulled from the reviews so the executive picture lives in one place. All findings cite file:line in the source doc.

### Critical
1. **Hint-append race** — `src/app/api/lld/drill-attempts/[id]/hint/route.ts:100-155` reads then writes a JSONB array without locking. Concurrent hint requests lose data. (12-database-review §3.1)
2. **Neon HTTP driver has no transactions** — `src/db/index.ts` uses `@neondatabase/serverless` HTTP driver; multi-statement Drizzle `.transaction()` calls are silently no-op'd into independent statements. Multiple multi-row writes (e.g., create-attempt + initial-state) are non-atomic. (12-database-review §7.2)
3. **Vitest 164/4502 failing on a single dependency mismatch** — React 19 vs `@testing-library/react@16.3.2` `act` API. One shim or upgrade unblocks all. (10-test-and-build-status)
4. **A11y blockers** — High Contrast toggle is a no-op (no `.high-contrast` CSS exists), `role="listbox"` mis-applied to module navigation, React Flow nodes have no accessible name, blog posts emit multiple `<h1>`. (14-a11y-review)

### High
- `users.email` not unique — duplicate-account risk. (12-database-review §2.1)
- `resolveUserId` adds a DB round-trip on every authenticated request — LRU cache would eliminate. (12-database-review §3.2 / 13-performance-review)
- Drill-interviewer SSE endpoint **buffers the full LLM response server-side before first byte** — defeats streaming UX. (13-performance-review #1)
- `optimizePackageImports` missing for `lucide-react`, `motion`, `@xyflow/react` — barrel-import bloat in client bundles. (13-performance-review #2)
- `@tanstack/react-query-devtools` in `dependencies` — ships ~40KB to production unless guarded. (13-performance-review)
- ESLint: 286 errors / 521 warnings dominated by `react-hooks/set-state-in-effect` (66), `react-hooks/refs` (59), `react/no-unescaped-entities` (50), `@typescript-eslint/no-explicit-any` (25). (10-test-and-build-status)
- ~~`/algorithms`, `/database`, `/ds`, `/learn` returned 404~~ — **WITHDRAWN** after v2 tour. Bare `/algorithms`, `/database`, `/ds` are 404 by design (only nested `[category]/[slug]` pages exist as Next routes). The interactive product is at `/` driven by Zustand `activeModule` (no URL for module type), with LLD using `?lld=type:slug` and DS using URL hash. See v2 `09-ui-tour.md`.
- E2E suite cannot run: `@playwright/test` not in `package.json` despite `playwright.config.ts` and 6 spec files. (10-test-and-build-status, 08-public-and-infra)
- **Sitemap advertises 404 routes** (bare `/algorithms`, `/database`, `/ds`) — SEO bleed even though sub-routes work. (08-public-and-infra audit, §8.4)
- **e2e spec navigates to nonexistent path** `/modules/lld?mode=drill` — spec would 404 on first load. (08-public-and-infra audit, §14)
- **Algorithm / OS / DS-module deep-link query params are unconsumed** — `?module=`, `?algo=`, `?os-concept=`, `?ds=` are referenced in code/docs but never read. Only `?lld=type:slug` and DS-hash are real URL contracts. (03-interactive-learning audit; 09-ui-tour v2)
- **Cross-module bridge `path` field = dead data** — referenced but never used to navigate. (02-learn-content-pipeline audit, §11.3)
- **Innovation subsystem is dark code** — TimeAttackMode, SkillTree, WarStoryViewer, ArchitectureGallery are completed and tested but never imported outside `innovation/`. (18-other-modules)

### Architectural notes
- **Three doc trees** (`architex/`, parent `docs/`, `docs/superpowers/`) don't always agree. Blueprint pivot at `docs/superpowers/specs/2026-04-20-{lld,sd}-architect-studio-rebuild.md` supersedes pre-Blueprint vision docs but old docs still resident. (EXISTING-DOCS-INDEX)
- **JSONB type debt** — only 1 of ~20 JSONB columns has `.$type<>()` annotation. Cascading `as unknown as` casts in every route that touches `drill_attempts`, `diagrams`, `simulations`. Concrete types already exist in `src/lib/lld/`. (15-typescript-review)
- **Web-worker scaffolding present but unused** — `comlink` is a dependency, worker files exist, no production import path uses them. (03-interactive-learning §quirks)

---

## How this set was generated

19 agents in parallel via the Claude Code Agent tool, each scoped to a single module / review surface. Each wrote one markdown file independently; no inter-agent coordination. This README is the only doc produced from the aggregate.

Refresh by re-running the same 19 prompts (briefs are reproducible from this README's table of contents). Specialized reviewer agents used: `security-reviewer`, `database-reviewer`, `performance-optimizer`, `a11y-architect`, `typescript-reviewer`. Codemap docs used `general-purpose`. UI tour used `e2e-runner`.

Conventions enforced across all docs:
- file:line citations
- markdown tables for inventories
- "Open questions" section per doc
- no refactor suggestions in codemap docs (descriptive only); reviews are the place for findings
- 400–1500 lines per doc

---

## Coverage gaps (acknowledged)

- Live e2e test outcomes — blocked by missing `@playwright/test` dep + offline sandbox.
- Bundle-size per route — Turbopack output doesn't print a per-route table; needs `pnpm analyze`.
- Lighthouse / CWV measurements — out of scope for static-only review.
- Real screen-reader pass — a11y review is static analysis; needs VoiceOver/NVDA for full coverage.
- The two parallel schema trees (`drizzle/schema/lld-*.ts` vs `drizzle/migrations/*.sql`) have not been reconciled.
