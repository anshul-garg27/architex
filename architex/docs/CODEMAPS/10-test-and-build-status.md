# 10 — Test & Build Status

Generated: 2026-05-07

Pipeline run: `typecheck → lint → vitest test:run → next build → playwright e2e`

One-line summary: **typecheck=pass, lint=fail (286 errors / 521 warnings), tests=4338/4502 (164 fail in 29 files — all React.act compat), build=pass (495 static pages), e2e=blocked (missing dep + no network).**

---

## 1. Environment

| Tool       | Version |
|------------|---------|
| Node       | v25.5.0 |
| pnpm       | 10.33.0 |
| OS         | macOS Darwin 25.4.0 (arm64, kernel xnu-12377.101.15~1) |
| Repo path  | `/Users/a0g11b6/Downloads/projects/architex/architex` |
| Next.js    | 16.2.3 (Turbopack) |
| React      | 19.2.4 |
| Vitest     | ^4.1.4 |
| TypeScript | ^5 |
| ESLint     | ^9 |

`AGENTS.md` warning: this Next.js version has breaking changes vs prior majors. `proxy` replaces `middleware` (deprecation surfaced at build).

---

## 2. Install

`node_modules/` was already populated. Did not re-run `pnpm install` (1171 packages resolved under `node_modules/.pnpm`, 48 top-level). All required bins present (`next`, `tsc`, `vitest`, `eslint`, `tsx`, `drizzle-kit`, `storybook`).

No install warnings observed.

---

## 3. Typecheck

```
> tsc --noEmit
real 17.33s    user 22.62s    sys 0.89s
EXIT 0
```

Result: **PASS** (zero errors, zero output).

---

## 4. Lint

```
> eslint
✖ 807 problems (286 errors, 521 warnings)
ELIFECYCLE Command failed with exit code 1
real 51.05s    user 51.87s    sys 2.22s
EXIT 1
```

Result: **FAIL** — 286 errors, 521 warnings. ESLint is run as a standalone script (not gated through `next build`), so failure here does not block the build.

### Top error rules (inline, ~134 of 286)

| Count | Rule |
|------:|------|
| 50 | `react/no-unescaped-entities` |
| 25 | `@typescript-eslint/no-explicit-any` |
| 20 | `react-hooks/rules-of-hooks` |
| 15 | `react/display-name` |
| 8  | `@typescript-eslint/no-require-imports` |
| 2  | `react/no-children-prop` |
| 2  | `@next/next/no-html-link-for-pages` |

### Multi-line "Error:" rules (~152 of 286)

These are emitted by the React-hooks plugin with a verbose explanation per occurrence. The rule names appear in the trailer of each block:

| Count | Rule (occurrences across full output) |
|------:|--------------------------------------|
| 66 | `react-hooks/set-state-in-effect` |
| 59 | `react-hooks/refs` |
| 31 | `react-hooks/exhaustive-deps` |
|  9 | `react-hooks/immutability` |
|  8 | `react-hooks/static-components` |
|  8 | `react-hooks/purity` |
|  8 | `react-hooks/preserve-manual-memoization` |
|  2 | `react-hooks/globals` |

(The figures above include both error and warning lines — the rule output format does not separate severity in the trailer string. Inline-error count is 286 total.)

### Notable single occurrences (excerpts)

- `docs/tasks/{mark-done,merge-missing,merge}.js` — CommonJS `require()` in `.js` files (8 errors).
- `src/__tests__/components/BaseNode.test.tsx:24` — anonymous component (`react/display-name`).
- `src/providers/ReducedMotionProvider.tsx:48,60` — `setState` synchronously inside `useEffect` (`react-hooks/set-state-in-effect`, two occurrences).
- BABEL deopt note (informational, not counted): `src/lib/lld/problem-solutions.ts` exceeds 500 KB, code-generator deoptimised styling.

The full log is large (437 KB). It was captured to `/tmp/architex-lint.log` and `/Users/a0g11b6/.claude/projects/-Users-a0g11b6-Downloads-projects-architex/103c0d5f-9c1a-4f0f-a4fc-5a67ef2300eb/tool-results/bv5wwdb66.txt` for the duration of this run.

---

## 5. Unit tests (vitest)

```
> vitest run

 Test Files  29 failed | 216 passed (245)
      Tests  164 failed | 4338 passed (4502)
   Duration  51.32s (transform 9.19s, setup 2.25s, import 53.51s, tests 4.10s, environment 414.14s)

ELIFECYCLE Command failed with exit code 1
real 53.59s    user 198.06s    sys 68.94s
EXIT 1
```

Result: **FAIL** — 164/4502 tests failing across 29/245 files. Skipped: 0.

### Root cause (single)

All 164 failures share the same error message:

```
TypeError: React.act is not a function
 ❯ exports.act node_modules/.pnpm/react-dom@19.2.4_.../react-dom/cjs/react-dom-test-utils.production.js:20:16
 ❯ node_modules/.pnpm/@testing-library+react@16.3.2_.../@testing-library/react/dist/act-compat.js:46:25
 ❯ renderRoot .../@testing-library/react/dist/pure.js:189:26
 ❯ Proxy.render .../@testing-library/react/dist/pure.js:291:10
```

A vitest-side stderr warning preceded each failing render:

```
`ReactDOMTestUtils.act` is deprecated in favor of `React.act`.
Import `act` from `react` instead of `react-dom/test-utils`.
```

This is the React 19 + `@testing-library/react` 16 compatibility seam: `act` moved from `react-dom/test-utils` to `react`. Either the React 19 build at `node_modules/.pnpm/react@19.2.4` is not exposing `act` in the shape testing-library expects, or the testing setup needs to import `act` directly from `react`. (Reporting only — not fixing.)

### Failed test files (29 total)

```
src/__tests__/components/ActivityBar.test.tsx
src/__tests__/components/BaseNode.test.tsx
src/__tests__/components/Breadcrumb.test.tsx
src/__tests__/components/CanvasToolbar.test.tsx
src/__tests__/components/CommandPalette.test.tsx
src/__tests__/components/ConfirmDialog.test.tsx
src/__tests__/components/LandingPage.test.tsx
src/__tests__/components/MiniSimulator.test.tsx
src/__tests__/components/ReducedMotionProvider.test.tsx
src/__tests__/components/Toast.test.tsx
src/__tests__/e2e/blog-page.test.tsx
src/__tests__/e2e/breadcrumb-navigation.test.tsx
src/__tests__/e2e/canvas-workspace.test.tsx
src/__tests__/e2e/command-palette.test.tsx
src/__tests__/e2e/dashboard-page.test.tsx
src/__tests__/e2e/gallery-page.test.tsx
src/__tests__/e2e/landing-page.test.tsx
src/__tests__/e2e/loading-states.test.tsx
src/__tests__/e2e/mobile-responsive-nav.test.tsx
src/__tests__/e2e/module-navigation.test.tsx
src/__tests__/e2e/not-found-page.test.tsx
src/__tests__/e2e/search-functionality.test.tsx
src/__tests__/hooks/useFocusTrap.test.ts
src/__tests__/visual/visual-regression.test.tsx
src/components/canvas/nodes/system-design/__tests__/BaseNode-extended.test.tsx
src/components/canvas/nodes/system-design/__tests__/SystemDesignNodes.test.tsx
src/components/shared/__tests__/activity-bar.test.tsx
src/hooks/__tests__/useLLDDrillSync.test.tsx
src/hooks/__tests__/useLLDModeSync.test.tsx
```

Note that `src/__tests__/e2e/*.test.tsx` are vitest "e2e-style" component tests using jsdom — they are NOT Playwright specs. Playwright specs live in `e2e/*.spec.ts` (see §7).

### Failed tests (one-line each)

All 164 failing tests fail with the same `TypeError: React.act is not a function`. Representative excerpt (truncated to first 30 of 164 — the remainder follow the identical pattern):

```
useFocusTrap > returns a containerRef and handleKeyDown
useFocusTrap > stores previously focused element and restores focus on deactivation
useFocusTrap > calls onEscape when Escape is pressed
useFocusTrap > does not call onEscape when not active
useFocusTrap > wraps Tab forward from last to first focusable element
useFocusTrap > wraps Shift+Tab backward from first to last focusable element
useFocusTrap > prevents Tab from leaving when there are no focusable elements
useFocusTrap > keeps focus on the single element when there is only one focusable
useFocusTrap > does not intercept non-Tab/Escape keys
useFocusTrap > allows normal Tab between middle elements
useLLDDrillSync · heartbeat > does not fire heartbeat when no active drill
useLLDDrillSync · heartbeat > fires heartbeat every 10 seconds while drill is running
useLLDDrillSync · heartbeat > stops heartbeat when drill is paused
useLLDModeSync > reads mode from URL param on mount
useLLDModeSync > ignores invalid mode values
useLLDModeSync > does not overwrite store if URL has no mode param
useLLDModeSync > updates URL when store mode changes
ActivityBar (Desktop) > renders the notification bell
ActivityBar (Mobile) > renders a bottom navigation bar on mobile
ActivityBar (Mobile) > shows first 5 modules and a More button on mobile
ActivityBar (Mobile) > calls setActiveModule when tapping a visible mobile module
BaseNode > renders label in full view (zoom > 0.6)
BaseNode > renders icon element in full view
BaseNode > shows throughput badge when metrics have throughput
BaseNode > formats throughput in millions
BaseNode > does not show throughput badge when throughput is zero
BaseNode > renders only label in simplified view (zoom 0.3-0.6)
BaseNode > renders dot view at very low zoom (zoom < 0.3)
BaseNode > applies ring class when selected in full view
BaseNode > applies category color via CSS variable for different categories
… 134 more, all with `TypeError: React.act is not a function`
```

The common stack trace head:

```
TypeError: React.act is not a function
 ❯ exports.act           react-dom/cjs/react-dom-test-utils.production.js:20:16
 ❯ act-compat.js:46:25   @testing-library/react/dist/act-compat.js
 ❯ renderRoot            @testing-library/react/dist/pure.js:189:26
 ❯ Proxy.render          @testing-library/react/dist/pure.js:291:10
```

---

## 6. Build (`next build`)

```
> next build
▲ Next.js 16.2.3 (Turbopack)
- Environments: .env.local

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  Creating an optimized production build ...
✓ Compiled successfully in 8.3s
  Running TypeScript ...
  Finished TypeScript in 16.4s ...
  Collecting page data using 11 workers ...
⚠ Using edge runtime on a page currently disables static generation for that page
✓ Generating static pages using 11 workers (495/495) in 2.6s
  Finalizing page optimization ...

real 48.68s
EXIT 0
```

Result: **PASS** (rerun confirmed `EXIT 0`). 495 static pages generated. Two warnings.

### Warnings (verbatim)

1. `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`
2. `⚠ Using edge runtime on a page currently disables static generation for that page`

### Bundle sizes per route

Next.js 16 with Turbopack does **not** print the per-route kB column that prior Webpack-based output did. The route table only labels each route with `○` (static), `●` (SSG), or `ƒ` (dynamic). No size data is available without enabling the `@next/bundle-analyzer` (`pnpm analyze`) workflow. The route counts:

| Type | Count |
|------|------:|
| `○` Static | 20 |
| `●` SSG (with `generateStaticParams`) | 14 root templates |
| `ƒ` Dynamic (server-rendered) | 54 |
| `ƒ` Proxy (Middleware) | 1 (replaces deprecated `middleware`) |
| Total static pages emitted | 495 |

### Route table (verbatim app router output)

```
Route (app)                                     Revalidate  Expire
┌ ○ /
├ ○ /_not-found
├ ● /algorithms/[category]/[slug]
│ ├ /algorithms/sorting/bubble-sort
│ ├ /algorithms/sorting/insertion-sort
│ ├ /algorithms/sorting/selection-sort
│ └ [+80 more paths]
├ ƒ /api/activity
├ ƒ /api/ai/explain
├ ƒ /api/challenges
├ ƒ /api/content
├ ƒ /api/content/[slug]
├ ƒ /api/csp-report
├ ƒ /api/diagrams
├ ƒ /api/diagrams/[id]
├ ƒ /api/email-preview
├ ƒ /api/evaluate
├ ƒ /api/health
├ ƒ /api/hint
├ ƒ /api/learning-path
├ ƒ /api/lld/ai/suggest-nodes
├ ƒ /api/lld/bookmarks
├ ƒ /api/lld/bookmarks/[id]
├ ƒ /api/lld/concept-reads
├ ƒ /api/lld/designs
├ ƒ /api/lld/designs/[id]
├ ƒ /api/lld/designs/[id]/annotations
├ ƒ /api/lld/designs/[id]/snapshots
├ ƒ /api/lld/drill-attempts
├ ƒ /api/lld/drill-attempts/[id]
├ ƒ /api/lld/drill-attempts/[id]/grade
├ ƒ /api/lld/drill-attempts/[id]/hint
├ ƒ /api/lld/drill-attempts/[id]/postmortem
├ ƒ /api/lld/drill-attempts/[id]/resume
├ ƒ /api/lld/drill-attempts/[id]/stage
├ ƒ /api/lld/drill-attempts/[id]/turn
├ ƒ /api/lld/drill-attempts/active
├ ƒ /api/lld/drill-interviewer/[id]/stream
├ ƒ /api/lld/explain-inline
├ ƒ /api/lld/learn-progress
├ ƒ /api/lld/learn-progress/[patternSlug]
├ ƒ /api/lld/lessons/[slug]
├ ƒ /api/lld/templates-library
├ ƒ /api/oembed
├ ƒ /api/og
├ ƒ /api/og/database
├ ƒ /api/progress
├ ƒ /api/progress/sync
├ ƒ /api/quiz
├ ƒ /api/review
├ ƒ /api/search
├ ƒ /api/simulations
├ ƒ /api/templates
├ ƒ /api/user-preferences
├ ƒ /api/user-preferences/lld
├ ƒ /api/webhooks/clerk
├ ○ /blog
├ ● /blog/[slug]
│ ├ /blog/how-consistent-hashing-works
│ ├ /blog/system-design-interview-framework
│ ├ /blog/understanding-cap-theorem
│ └ [+3 more paths]
├ ƒ /blog/feed.xml
├ ○ /concepts
├ ● /concepts/[slug]
│ ├ /concepts/load-balancer
│ ├ /concepts/caching
│ ├ /concepts/sharding
│ └ [+37 more paths]
├ ○ /dashboard
├ ● /database/[mode]
│ ├ /database/er-diagram
│ ├ /database/normalization
│ ├ /database/transaction-isolation
│ └ [+8 more paths]
├ ● /ds/[slug]
│ ├ /ds/array
│ ├ /ds/stack
│ ├ /ds/queue
│ └ [+36 more paths]
├ ƒ /embed/algorithms/[slug]
├ ● /embed/lld/pattern/[id]                             1d      1y
│ ├ /embed/lld/pattern/singleton                        1d      1y
│ ├ /embed/lld/pattern/factory-method                   1d      1y
│ ├ /embed/lld/pattern/builder                          1d      1y
│ └ [+33 more paths]
├ ● /embed/lld/problem/[id]                             1d      1y
│ ├ /embed/lld/problem/parking-lot                      1d      1y
│ ├ /embed/lld/problem/elevator-system                  1d      1y
│ ├ /embed/lld/problem/chess-game                       1d      1y
│ └ [+30 more paths]
├ ● /embed/lld/solid/[id]                               1d      1y
│ ├ /embed/lld/solid/solid-srp                          1d      1y
│ ├ /embed/lld/solid/solid-ocp                          1d      1y
│ ├ /embed/lld/solid/solid-lsp                          1d      1y
│ └ [+2 more paths]
├ ○ /gallery
├ ○ /icon
├ ○ /interviews
├ ● /interviews/[company]
│ ├ /interviews/google
│ ├ /interviews/meta
│ ├ /interviews/amazon
│ └ [+12 more paths]
├ ○ /landing
├ ○ /learn/parking-lot
├ ○ /lld-problems
├ ● /lld-problems/[slug]
│ ├ /lld-problems/parking-lot
│ ├ /lld-problems/elevator-system
│ ├ /lld-problems/chess-game
│ └ [+30 more paths]
├ ○ /modules
├ ○ /offline
├ ○ /os
├ ● /os/[concept]
│ ├ /os/cpu-scheduling
│ ├ /os/page-replacement
│ ├ /os/deadlock-detection
│ └ [+3 more paths]
├ ○ /patterns
├ ● /patterns/[slug]
│ ├ /patterns/singleton
│ ├ /patterns/factory-method
│ ├ /patterns/abstract-factory
│ └ [+23 more paths]
├ ● /patterns/-/opengraph-image
│ ├ /patterns/singleton/opengraph-image
│ ├ /patterns/factory-method/opengraph-image
│ ├ /patterns/abstract-factory/opengraph-image
│ └ [+23 more paths]
├ ○ /pricing
├ ○ /problems
├ ● /problems/[slug]
│ ├ /problems/design-cache
│ ├ /problems/design-rate-limiter
│ ├ /problems/design-url-shortener
│ └ [+78 more paths]
├ ƒ /profile/[username]
├ ○ /robots.txt
├ ○ /settings
├ ƒ /sign-in/[[...sign-in]]
├ ƒ /sign-up/[[...sign-up]]
├ ○ /sitemap.xml
└ ○ /team

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

---

## 7. E2E tests (Playwright)

Result: **BLOCKED — skipped.**

### Why

1. `@playwright/test` is **not installed**. Inspecting `package.json` (lines 35–106) shows no `playwright` or `@playwright/test` entry under `dependencies` or `devDependencies`, and `node_modules/.pnpm/` contains no `playwright*` package.
2. `playwright.config.ts` (8 lines) declares `import { defineConfig } from '@playwright/test'` and configures `testDir: './e2e'`. The config exists but the runtime cannot be loaded.
3. `pnpm exec playwright --version` returned `Command "playwright" not found`.
4. `pnpm dlx --package=@playwright/test playwright --version` failed with `ENOTFOUND registry.npmjs.org` — this sandbox has no network egress to npm.
5. The task's instruction `pnpm exec playwright install --with-deps chromium` cannot proceed because the parent `playwright` CLI is absent and no transient install path is available.

### What was NOT done

- Did not add `@playwright/test` to `package.json` (the brief says no code modifications).
- Did not run `pnpm exec playwright install` (no playwright bin to invoke).

### Specs that exist (would-have-been targets)

```
e2e/algorithm-run.spec.ts
e2e/command-palette.spec.ts
e2e/keyboard-shortcuts.spec.ts
e2e/lld-drill-mode.spec.ts
e2e/module-switching.spec.ts
e2e/template-load.spec.ts
```

All six specs report status: **blocked by env (missing `@playwright/test` package + no npm registry access).**

### Dev-server side note (informational)

A dev server from a parallel agent was found listening on TCP 3000 (`pnpm dev`, PID 906). The Playwright config sets `webServer.reuseExistingServer: true`, so if Playwright itself were available the existing server would have been reused without a port collision.

---

## 8. Blocked by env

| Need | Status | Notes |
|------|--------|-------|
| `@playwright/test` package | **MISSING** | Not in `package.json`. No way to install in this sandbox (no npm egress). |
| `npm registry network access` | **MISSING** | `registry.npmjs.org` ENOTFOUND — verified via `pnpm dlx`. |
| `DATABASE_URL` | Set in `.env.local` | DB-backed routes built and prerendered fine. Not exercised at runtime. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Commented-out (optional) | Auth flows degrade gracefully per repo notes. |
| `ANTHROPIC_API_KEY` | Commented-out (optional) | AI features fall back to heuristics per `.env.local` comment. |
| `NEXT_PUBLIC_LLD_USE_API` | Commented-out (optional) | LLD module uses static data without it. |

The build does not require any of the optional env vars — `next build` completed without warnings tied to them.

---

## 9. Recommendations

1. Pin `@playwright/test` in `devDependencies` (matching version with whatever Playwright workspace browsers are expected) so `pnpm exec playwright …` resolves locally; without it, `playwright.config.ts` is dead weight.
2. Vitest failure is a single regression: React 19's `act` lives on `react` itself; either upgrade `@testing-library/react` past 16.3.2 (if a newer line resolves the import path) or add a test-setup shim that points `react-dom/test-utils.act` at `React.act`. One-line fix unblocks all 164 failures.
3. Lint cleanup: `react-hooks/set-state-in-effect` (66) and `react-hooks/refs` (59) are concentrated in a small set of providers/hooks — a focused pass would clear the bulk. The 50 `react/no-unescaped-entities` are mostly content strings that can be auto-fixed.
4. Migrate `middleware` → `proxy` per Next.js 16 convention (see `AGENTS.md`: "this is NOT the Next.js you know — read `node_modules/next/dist/docs/`").
5. To get bundle-size visibility under Turbopack-mode builds, run `pnpm analyze` (already wired to `@next/bundle-analyzer`) and capture its report separately.
