# 16 — Internal Tooling, Scaffolding, Dev Workflow

How a contributor or AI agent gets set up, runs the dev loop, scaffolds new
content, and ships changes. Covers `package.json` scripts, the custom TS
scripts under `architex/scripts/`, the scaffold templates, the `.claude/`
worktree convention, AGENTS.md, the prompts library, Husky, GitHub workflows,
Storybook, and the `SESSION_HANDOFF.md` baton.

---

## 1. Purpose

The repo is a pnpm-managed Next.js 16 app rooted at
`/Users/a0g11b6/Downloads/projects/architex/architex/`. There is also a
**second project root** one level up (`/architex/` itself) that holds the
phase-organized curriculum directories (`01-foundations/` … `07-uber-prep/`),
the master prompt library, and a single top-level scaffold script
(`scripts/scaffold-pattern.ts`). Both directories share one git repo (root at
`/architex/.git`), so worktrees, hooks, and CI all anchor on the outer dir.

| You want to … | Run this | From |
|---|---|---|
| Bring up the app | `pnpm install && pnpm dev` | `architex/architex/` |
| Run the test suite | `pnpm test:run` | `architex/architex/` |
| Type-check | `pnpm typecheck` | `architex/architex/` |
| Lint + format | `pnpm lint && pnpm format` | `architex/architex/` |
| Scaffold a new DB Lab mode | `pnpm scaffold:db-mode --name foo --display "Foo Viz"` | `architex/architex/` |
| Scaffold a new algorithm | `pnpm scaffold:algorithm` (interactive) | `architex/architex/` |
| Scaffold a design pattern stub | `npx tsx scripts/scaffold-pattern.ts "Name" category` | `architex/` (outer) |
| Compile LLD MDX lessons | `pnpm compile:lld-lessons` | `architex/architex/` |
| Build the concept-graph artifact | `pnpm build:concept-graph` | `architex/architex/` |
| Migrate / push the DB schema | `pnpm db:generate` / `db:push` / `db:studio` | `architex/architex/` |
| Snapshot all top-level pages | `bash scripts/capture-screenshots.sh` (Chrome) or `node scripts/ui-tour-screenshots.mjs` (Playwright) | `architex/architex/` |
| Start a parallel feature session | `git worktree add .claude/worktrees/<name> -b feat/<name>` | `architex/` (outer) |

`pnpm install` triggers `husky` via the `prepare` script
(`architex/architex/package.json:27`), which wires up the pre-commit hook in
`architex/architex/.husky/pre-commit`. Node 20 or 22 are the supported
versions; CI exercises both via a matrix
(`.github/workflows/ci.yml:17,50,82`). pnpm version 10 is pinned in CI
(`pnpm/action-setup@v4` with `version: 10`).

No `.env` is required for `pnpm dev` per the README/CONTRIBUTING; Clerk and
Postgres are optional and gated behind env presence checks. Scripts that touch
Postgres (e.g. `seed-lld-lessons-from-json.mjs`) read `.env.local` directly.

---

## 2. `package.json` scripts (every entry)

All scripts live in `architex/architex/package.json:5-28`.

| Script | Command | One-line description |
|---|---|---|
| `dev` | `next dev` | Start the Next.js dev server on port 3000 with HMR. |
| `build` | `next build` | Production Next.js build into `.next/`. |
| `start` | `next start` | Serve the previously built app (used by Lighthouse CI). |
| `lint` | `eslint` | Run ESLint over the workspace using `eslint.config.mjs`. |
| `typecheck` | `tsc --noEmit` | Type-check without emitting JS — pre-commit gate. |
| `type-check` | `tsc --noEmit` | Alias of `typecheck` (kept for compatibility / muscle memory). |
| `format` | `prettier --write "src/**/*.{ts,tsx}"` | Format only `src/**` with Prettier (`.prettierrc`). |
| `format:check` | `prettier --check "src/**/*.{ts,tsx}"` | Verify formatting without writing — used in code review. |
| `test` | `vitest` | Watch-mode Vitest (interactive, useful in TDD). |
| `test:run` | `vitest run` | One-shot Vitest run — used by CI (`ci.yml:76`). |
| `storybook` | `storybook dev -p 6006` | Storybook dev server on `localhost:6006`. |
| `analyze` | `ANALYZE=true pnpm build` | Build with `@next/bundle-analyzer` enabled (visualize chunk sizes). |
| `scaffold:db-mode` | `tsx scripts/scaffold-db-mode.ts` | Generate a new Database Design Lab mode (engine + tests + barrel). |
| `scaffold:algorithm` | `tsx scripts/new-algorithm.ts` | Interactive: scaffold a new algorithm + test under `src/lib/algorithms/`. |
| `db:generate` | `drizzle-kit generate` | Emit a new SQL migration into `drizzle/` from schema diff. |
| `db:migrate` | `drizzle-kit migrate` | Apply pending migrations to the configured database. |
| `db:push` | `drizzle-kit push` | Push the current schema directly (skip migrations — dev only). |
| `db:studio` | `drizzle-kit studio` | Launch the Drizzle Studio GUI. |
| `db:seed` | `tsx src/db/seeds/index.ts` | Run the seed script that populates `users`, `achievements`, etc. |
| `compile:lld-lessons` | `tsx scripts/compile-lld-lessons.ts` | Compile MDX LLD lessons into JSONB and upsert into `module_content`. |
| `build:concept-graph` | `tsx scripts/build-concept-graph.ts` | Generate `src/lib/lld/concept-graph.ts` (committed, typed, zero-DB lookups). |
| `prepare` | `husky` | Auto-run by pnpm post-install — installs the git hooks. |

`lint-staged` config (`package.json:29-34`) runs `eslint --fix` then
`prettier --write` on every staged `.ts`/`.tsx`. The pre-commit hook itself,
however, does **not** invoke `lint-staged` — see §8.

---

## 3. Custom scripts

All TS scripts run via `tsx` (a `node --loader` shim for TypeScript) — there's
no separate compile step. The `.mjs` script uses native ESM and avoids `tsx` to
sidestep "Node 25 + tsx ESM toolchain issues" (the comment in
`seed-lld-lessons-from-json.mjs:7-12`).

### 3.1 `architex/architex/scripts/`

| File | Lines | Purpose | When run | Side effects |
|---|---|---|---|---|
| `scaffold-db-mode.ts` | 209 | Generate boilerplate for a new Database Design Lab visualization mode (engine class + Vitest test scaffold + barrel-export append). | Manual: `pnpm scaffold:db-mode --name <kebab> --display "<title>"`. | Writes `src/lib/database/<name>-viz.ts` and `__tests__/<name>-viz.test.ts`; appends to `src/lib/database/index.ts`. Refuses to overwrite existing files (`scaffold-db-mode.ts:160-167`). |
| `new-algorithm.ts` | 146 | Interactive prompts (algorithm name, ID, category, complexities) → emit a new algorithm source file + `__tests__` skeleton conforming to `AlgorithmConfig` / `AnimationStep` shape. | Manual: `pnpm scaffold:algorithm` (or with `--help`). | Creates `src/lib/algorithms/<category>/<id>.ts` and matching test. Prints next-steps checklist (`new-algorithm.ts:135-141`). Does **not** touch the category barrel — that's a manual step. |
| `compile-lld-lessons.ts` | 295 | MDX lesson → `LessonPayload` JSONB compiler. Reads `content/lld/lessons/*.mdx`, parses frontmatter via `gray-matter`, splits the body on `<!-- Section: <id> -->` delimiters into the 8 fixed section IDs, compiles each section through `@mdx-js/mdx` in `function-body` output mode, extracts heading anchors + `<Concept id>` / `<Class id>` JSX refs, validates the 4-checkpoint contract (recall/apply/compare/create), then **upserts a `module_content` row** keyed by `(moduleId='lld', contentType='lesson', slug)`. | Manual after editing MDX: `pnpm compile:lld-lessons` (or `--slug=foo` for one, or `--dry` to skip DB). | DB upsert into `module_content`. With `--json-out`, also writes `content/lld/compiled/<slug>.json` (gitignored — `.gitignore:46-47`). Errors are aggregated and printed at end so one bad lesson doesn't block others. |
| `build-concept-graph.ts` | 157 | Read every `content/lld/concepts/*.concepts.yaml` and emit the typed cross-link maps (`conceptToPatterns`, `patternToConcepts`, `conceptToRelated`, `patternConfusedWith`) plus accessor helpers as a **committed** TS file. Header comment marks it `AUTO-GENERATED — Do not edit by hand`. | Manual when concept YAML changes: `pnpm build:concept-graph`. | Overwrites `src/lib/lld/concept-graph.ts`. Zero runtime DB cost; all lookups are O(1) on these maps (`build-concept-graph.ts:8-12`). |
| `enrich-patterns.ts` | 142 | One-shot data-migration helper: walks a curated `CONFUSED_WITH` map and adds `confusedWith: [...]` entries to each pattern in `src/lib/lld/patterns.ts` that lacks one. | Manual: `npx tsx scripts/enrich-patterns.ts`. | In-place edit of `patterns.ts`. Curated dataset is hand-written for interview-critical patterns (singleton, facade, saga, circuit-breaker, retry, rate-limiter, thread-pool, etc.) — see `enrich-patterns.ts:18-90`. Effectively a one-off content backfill, not a recurring tool. |
| `seed-lld-lessons-from-json.mjs` | 103 | Pair script for `compile-lld-lessons --json-out`. Reads pre-compiled JSON from `content/lld/compiled/`, opens a raw `pg` connection (no Drizzle), and upserts the same `module_content` rows. Exists because the in-script Drizzle path hits Node 25 + tsx ESM resolution issues. | Manual: `node scripts/seed-lld-lessons-from-json.mjs`. | DB upsert. Reads `DATABASE_URL` from env, falling back to a homemade `.env.local` parser (`seed-lld-lessons-from-json.mjs:21-34`). |
| `capture-screenshots.sh` | 58 | Bash wrapper around headless Chrome that captures desktop (1440×900) + mobile (390×844) PNGs of 18 top-level routes (`/`, `/pricing`, `/blog`, …, `/sign-in`) for use in the CODEMAPS doc set. | Manual after `pnpm dev`: `bash scripts/capture-screenshots.sh`. | Writes PNGs to `docs/CODEMAPS/screenshots/`. Uses `--virtual-time-budget=8000` to wait for animations / data fetch. |
| `ui-tour-screenshots.mjs` | 196 | Playwright-based version of the same idea — captures the same routes plus collects `<h1>`, nav items, and main-content metadata into a JSON manifest. Ran for the `09-ui-tour.md` doc. | Manual: `node scripts/ui-tour-screenshots.mjs` (requires `playwright` installed). | Writes PNGs + a structured results manifest to `docs/CODEMAPS/screenshots/`. |

### 3.2 Top-level `scripts/` (outer dir)

`/Users/a0g11b6/Downloads/projects/architex/scripts/` holds exactly one file:

| File | Lines | Purpose |
|---|---|---|
| `scaffold-pattern.ts` | 222 | Stand-alone CLI: `npx tsx scripts/scaffold-pattern.ts "Pattern Name" category` → prints a fully-shaped `DesignPattern` object (with `TODO:` placeholders for description, analogy, summary, `youAlreadyUseThis`, etc.) to stdout. Categories restricted to `creational | structural | behavioral | modern | resilience | concurrency | ai-agent` (`scaffold-pattern.ts:15-23`). Output is meant to be copy-pasted into `src/lib/lld/patterns.ts`. Tagged `LLD-165` in the header — written as a one-off scaffolder, kept for repeat use. |

---

## 4. Templates

`architex/architex/templates/system-design/` holds **55 JSON system-design
template files** (16,340 lines total — `wc -l` over the directory). Each is a
serialized `Template` object with `id`, `name`, `description`, `difficulty`,
`category`, `tags`, `nodes`, `edges`, and (often) `learnSteps`.

Selected entries:

| Template | LOC |
|---|---|
| `web-crawler.json` | 579 |
| `url-shortener.json` | 561 |
| `twitter-fanout.json` | 621 (largest non-listed) |
| `typeahead.json` | 493 |
| `youtube.json` | 258 |
| `uber-dispatch.json` | 223 |
| `workflow-engine.json` | 192 |

Discovery: `find architex/architex/templates/system-design -name '*.json'`.
These files are **content**, not scaffold inputs — at runtime, the template
loader (`src/lib/templates/`) reads them to populate the canvas.

There are **no Handlebars/EJS-style scaffold templates** in this repo. The
two scaffold scripts (`scaffold-db-mode.ts`, `new-algorithm.ts`,
`scaffold-pattern.ts`) inline their templates as plain string literals — see
e.g. `scaffold-db-mode.ts:57-95` (engine template) and `:98-129` (test
template).

CONTRIBUTING.md documents the manual process for adding a new system-design
template (`CONTRIBUTING.md:213-222`): edit `src/lib/templates/index.ts`, add
metadata, test by loading from the command palette.

---

## 5. Agent harness — `.claude/`

The repo's top-level `.claude/` directory is **scoped to worktrees only**.
There are no `.claude/settings.json`, `.claude/hooks/`, or `.claude/agents/`
files committed to the repo — the agent harness configuration is taken
entirely from the user's global `~/.claude/` install.

### 5.1 Layout

```
architex/.claude/
└── worktrees/
    └── blueprint-module/      # git worktree on branch feat/blueprint-module
        ├── .git               # gitfile pointing at /architex/.git/worktrees/blueprint-module
        ├── .progress-phase-1.md
        ├── .progress-phase-2.md
        ├── .progress-phase-3.md
        ├── BUILD_PLAN.md
        ├── MEGA_PROMPT.md
        ├── ONBOARDING.md
        └── …                  # full mirrored project tree (architex/, docs/, etc.)
```

### 5.2 Worktree convention

`/architex/.git/worktrees/blueprint-module/HEAD` →
`ref: refs/heads/feat/blueprint-module`. The worktree sits **outside** the
default tree so the main session and a parallel session can each run
`pnpm dev` against their own checkout without colliding on `.next/` or
`node_modules/`.

The convention (per the user-memory note `feedback_worktree_pr_workflow`):
**when another session is on `main`, always branch + worktree + PR; never
share the main worktree.** Spawn pattern from outer dir:

```bash
git worktree add .claude/worktrees/<feature-name> -b feat/<feature-name>
cd .claude/worktrees/<feature-name>
# ... work happens here in a separate Claude session ...
git push -u origin feat/<feature-name>
gh pr create
```

### 5.3 `.superpowers/`

Top-level `.superpowers/brainstorm/<id>/` directories are artifacts produced
by the **superpowers brainstorm skill** (`/Users/a0g11b6/.claude/plugins/...`).
Each session is a directory of HTML "screens" + a JSON `state` log of click
events on those screens. They appear here because the brainstorm tool
scaffolds its workspace into the active project root.

Five brainstorm sessions are present:
- `17003-…`, `26797-…`, `30645-…`, `64431-…`, `66922-…`
Each holds a `content/` directory of HTML mockups (e.g.
`03-persona-select.html`, `06-modes-detail.html`, `47-batch14-rebuild.html`)
and a `state/` directory of click-event JSON. These are scratch / exploratory
artifacts, not production assets.

### 5.4 No agent definitions in-tree

There are no committed `.claude/agents/*.md` or `.claude/commands/*.md` files
in this repo. AGENTS.md (§6) is the only agent-targeting file in-tree, and it
is loaded by the user's global Claude config via the `@AGENTS.md` import in
`architex/architex/CLAUDE.md`.

---

## 6. AGENTS.md — the only in-tree AI directive

`architex/architex/CLAUDE.md` is a single line:

```
@AGENTS.md
```

`architex/architex/AGENTS.md` is two lines (the entire content):

> **# This is NOT the Next.js you know**
>
> This version has breaking changes — APIs, conventions, and file structure
> may all differ from your training data. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing any code. Heed deprecation
> notices.

That's the whole AI-facing directive: *don't trust pre-2026 Next.js training
data; always consult `node_modules/next/dist/docs/` first.* Next.js 16.2.3
(see `package.json:69`) is recent enough to predate most model training
cutoffs, hence the warning.

---

## 7. Prompts library

There are **two prompt directories** with non-overlapping purposes.

### 7.1 Outer `architex/prompts/` — phase planning prompts

10 files, one per build phase:

| File | Role |
|---|---|
| `PHASE-01-FOUNDATION.md` | Phase 1: app shell, tech-stack install, panels, canvas, command palette, auth, DB, stores, persistence, theme, CI/CD. |
| `PHASE-02-SYSTEM-DESIGN-SIMULATOR.md` | Phase 2: SDS module. |
| `PHASE-03-ALGORITHMS-DATA-STRUCTURES.md` | Phase 3: algorithms + DS modules. |
| `PHASE-04-LLD-DATABASE-DISTRIBUTED.md` | Phase 4: LLD + Database Lab + Distributed Playground. |
| `PHASE-05-NETWORKING-OS-CONCURRENCY-SECURITY-ML.md` | Phase 5: networking, OS, concurrency, security, ML modules. |
| `PHASE-06-INTERVIEW-ENGINE-AI.md` | Phase 6: interview engine + Anthropic/AI integration. |
| `PHASE-07-COLLABORATION-COMMUNITY.md` | Phase 7: multi-user, comments, gallery. |
| `PHASE-08-DESKTOP-EXPORT-SEARCH-PLUGINS.md` | Phase 8: desktop wrapper, export pipelines, search, plugins. |
| `PHASE-09-LANDING-SEO-LAUNCH.md` | Phase 9: landing page, SEO, launch surface. |
| `PHASE-10-ACCESSIBILITY-PERFORMANCE-ENTERPRISE.md` | Phase 10: a11y, perf budgets, enterprise polish. |

These are the **bootstrap prompts** — paste each into a fresh Claude session
to drive a phase from zero.

### 7.2 Inner `architex/architex/prompts/` — operator prompts

26 prompts split into three buckets.

**Audit suite (numbered 1-11, with `0-completeness-gate.md` as the
adversarial QA reviewer):**

| File | Role |
|---|---|
| `0-completeness-gate.md` | Adversarial reviewer — proves a previous audit was incomplete. *"You must NOT trust the previous agent's work. Verify independently."* |
| `1mega-audit-v3.md` | Top-level mega-audit shell (latest version). |
| `mega-audit.md` | Earlier mega-audit (kept for diff). |
| `2content-curriculum-audit.md` | Curriculum coverage. |
| `3concept-quality-audit.md` | Concept clarity / pedagogy. |
| `4implementation-quality-audit.md` | Code-level quality. |
| `5practice-assessment-audit.md` | Practice problems / drills. |
| `6features-innovation-audit.md` | Differentiation / novelty. |
| `7visualization-simulation-audit.md` | Canvas / simulation quality. |
| `8platform-audit.md` | Cross-cutting platform. |
| `9data-architecture-audit.md` | DB schema / data layer. |
| `10developer-experience-audit.md` | DX / dev loop. |
| `11onboarding-tutorial-audit.md` | Onboarding flow. |
| `module-deep-audit.md` | Drilldown: single-module deep audit. |
| `quick-audit-template.md` | Lightweight quick-pass template. |

**UI generation pipeline (the `00x` prefix):**

| File | Role |
|---|---|
| `001UI-VISION-TEMPLATE.md` | Capture intent + audience for a UI surface. |
| `002UI-SPEC-GENERATOR.md` | Vision → component spec. |
| `003STITCH-MODE1-POLISH.md` | Spec → polished implementation (mode 1: refine existing). |
| `003STITCH-MODE2-REIMAGINE.md` | Spec → polished implementation (mode 2: reimagine from scratch). |
| `004FRONTEND-REVAMP.md` | End-to-end frontend revamp prompt. |

**Plan / execute / migrate:**

| File | Role |
|---|---|
| `MASTER-PLAN-FROM-ANALYSIS.md` | "Read 24 analysis docs → emit a single prioritized master execution plan." Staff-engineer voice. |
| `EXECUTE-TASKS.md` | Lead-engineer prompt: read `docs/tasks/tasks.json`, batch by file conflicts, dispatch parallel agents. |
| `BACKEND-DATA-MIGRATION-ANALYZER.md` | Per-module backend-migration analyzer. |
| `FIX-DATA-STRUCTURES-MODULE.md` | Targeted fix prompt for the DS module. |
| `task-creation-from-audit.md` | Audit JSON → task entries. |

The two directories don't overlap: outer is **scaffolding the project**;
inner is **operating it**.

---

## 8. Pre-commit / Husky

`architex/architex/.husky/pre-commit` is one line:

```
pnpm lint && pnpm typecheck
```

Husky is installed via the `prepare: husky` lifecycle script
(`package.json:27`). On `pnpm install`, Husky writes the `.husky/_/` runtime
and registers `.husky/pre-commit` as the active hook.

The hook **does not** run `lint-staged`, even though
`package.json:29-34` configures `lint-staged` to `eslint --fix` + `prettier
--write` on staged TS/TSX. The configuration is present but not currently
wired — likely an in-flight migration. The effective gate is just **lint over
the whole tree + tsc**, which is the same gate CI enforces (§9).

There is no commit-msg hook → conventional-commits format
(`CONTRIBUTING.md:257-286`) is policy, not enforced.

---

## 9. CI workflows — `architex/architex/.github/workflows/`

Four workflows, all on a Node 20/22 matrix where applicable.

### 9.1 `ci.yml` — main quality gate

| Trigger | Jobs |
|---|---|
| Push to `main` or PR targeting `main` | `quality`, `test`, `build` |

| Job | Steps | Notes |
|---|---|---|
| `quality` | `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` | Matrix: Node 20 + Node 22. Concurrency group `ci-${{ github.ref }}` cancels in-progress runs on the same branch (`ci.yml:9-11`). |
| `test` | `needs: quality`. `pnpm install` → `pnpm test:run` (Vitest one-shot). | Matrix: Node 20 + Node 22. |
| `build` | `needs: quality`. `pnpm install` → `pnpm build` with `NEXT_TELEMETRY_DISABLED=1`. | Matrix: Node 20 + Node 22. |

pnpm 10 is installed via `pnpm/action-setup@v4`. The pnpm store is cached
keyed on `pnpm-lock.yaml` hash + Node version
(`ci.yml:34-40`).

### 9.2 `bundle-size.yml` — PR-only

| Trigger | Job |
|---|---|
| PR to `main` | Build, then `andresz1/size-limit-action@v1` against `.size-limit.json`. |

`.size-limit.json` defines three budgets:

| Bundle | Path glob | Limit (gzipped) |
|---|---|---|
| Main bundle | `.next/static/chunks/main-*.js` | 250 KB |
| Framework bundle | `.next/static/chunks/framework-*.js` | 250 KB |
| Page chunks | `.next/static/chunks/app/**/page-*.js` | 100 KB |

The action posts a comment on the PR with the deltas vs. base.

### 9.3 `lighthouse-ci.yml` — PR-only

| Trigger | Job |
|---|---|
| PR to `main` | Build → start Next.js (`pnpm start &`) → wait on `/api/health` (`curl --retry 10`) → run `treosh/lighthouse-ci-action@v12` against `localhost:3000`. |

Asserts via `configJson` (lighthouse-ci.yml:43-55):

| Category | Min score |
|---|---|
| Performance | 0.9 |
| Accessibility | 0.95 |
| Best Practices | 0.9 |
| SEO | 0.9 |

Posts a markdown table on the PR with traffic-light emoji per category, plus
a link to the full report. Artifacts retained 14 days.

### 9.4 `dependency-audit.yml` — scheduled

| Trigger | Job |
|---|---|
| `cron: "0 2 * * 0"` (Sunday 02:00 UTC) + manual `workflow_dispatch` | `pnpm audit --audit-level=high`. On non-zero exit, opens an issue titled "🔒 Dependency audit: high-severity vulnerabilities found (\<date\>)" labeled `security, dependencies` (uses `actions/github-script@v7`). |

### 9.5 `branch-protection.md`

Not a workflow — a documented **manual** branch-protection config
(`.github/branch-protection.md`). Required status checks: `quality`, `test`,
`build`. Linear history required, force-push disabled, squash + rebase merge
strategies, head branches auto-deleted on merge.

### 9.6 Issue / PR templates

`.github/ISSUE_TEMPLATE/`:

| File | Purpose |
|---|---|
| `bug_report.yml` | Bug report form with module dropdown (12 modules + Other), browser, screenshots. |
| `feature_request.yml` | Feature request with affected-module dropdown. |
| `new_algorithm.yml` | Submit a new algorithm: name, category, difficulty, complexity, pseudocode, viz notes, test cases, references. |
| `new_data_structure.yml` | Submit a new DS: name, category (`linear/tree/hash/heap/probabilistic/system`), operations, why-it-matters, references. |
| `new_template.yml` | Submit a system-design template: name, category, complexity, components, diagram. |

`.github/PULL_REQUEST_TEMPLATE.md` enforces a checklist:
typecheck / lint / no `console.log` / browser-tested / docs updated.

---

## 10. Storybook

`architex/architex/.storybook/main.ts` (8 lines):

```ts
stories: ['../src/**/*.stories.@(ts|tsx)']
addons: ['@storybook/addon-essentials', '@storybook/addon-interactions']
framework: '@storybook/nextjs'
staticDirs: ['../public']
```

`architex/architex/.storybook/preview.ts` (7 lines): imports
`src/app/globals.css` and sets the default background to `#0f1015` (the dark
theme). No light-theme story toggle is wired up.

Run with `pnpm storybook` (port 6006). There is no `pnpm build-storybook`
script committed and no Storybook deploy target — Storybook is
**dev-only**, used for component isolation.

Storybook deps: `@storybook/nextjs ^10.3.5`, `@storybook/react ^10.3.5`,
`@storybook/addon-essentials ^8.6.14`, `@storybook/addon-interactions ^8.6.14`
(`package.json:84-87, 101`).

---

## 11. Quirks

- **Two project roots, one git repo.** The "outer" root
  (`/Users/a0g11b6/Downloads/projects/architex/`) holds curriculum dirs and
  the master phase prompts; the "inner" root (`/architex/architex/`) is the
  Next.js app. `package.json`, Husky, GitHub workflows, and Storybook all
  live in the inner root. Worktrees and the curriculum dirs anchor on the
  outer.

- **`tsx` everywhere except seed-from-json.** Every TS script invokes via
  `tsx`. The single `.mjs` file (`seed-lld-lessons-from-json.mjs`) exists
  specifically because the maintainer hit Node 25 + tsx ESM-resolution issues
  when the in-script Drizzle path tried to import `@neondatabase/serverless`
  + Drizzle. The split keeps the compile path TS-friendly and the seed path
  resilient.

- **`compile:lld-lessons` is a two-stage pipeline.** Stage 1 (the TS script)
  compiles MDX → `LessonPayload` and writes JSON to
  `content/lld/compiled/<slug>.json` (`.gitignore:46-47`). Stage 2 (the
  `.mjs` seeder) reads those JSON files via raw `pg` and upserts. The TS
  script itself can also do the upsert directly when not on Node 25.

- **`build:concept-graph` writes a *committed* TS file.** The output
  (`src/lib/lld/concept-graph.ts`) is checked into git, with a header that
  reads "AUTO-GENERATED … Do not edit by hand" (`build-concept-graph.ts:91-94`).
  Re-run after editing `content/lld/concepts/*.concepts.yaml`. CI does not
  re-run it; staleness is caught only by typecheck if the schema diverges.

- **`enrich-patterns.ts` is a one-shot data backfill.** It is callable via
  `npx tsx scripts/enrich-patterns.ts` but its `CONFUSED_WITH` payload is
  hand-curated (`enrich-patterns.ts:18-90`) — there is no recurring
  source-of-truth, so re-running it is mostly idempotent against the
  original backfill. Treat as historical, not a live tool.

- **lint-staged is configured but not invoked.** `package.json:29-34` lists
  `eslint --fix` + `prettier --write` for staged TS, but the pre-commit hook
  runs `pnpm lint && pnpm typecheck` over the whole tree. Adding
  `npx lint-staged` to the hook is a one-liner that has not been done.

- **AGENTS.md is two lines.** The single in-tree AI directive is:
  *"Don't trust your training data for Next.js — read
  `node_modules/next/dist/docs/` first."* That's it. `CLAUDE.md` does
  nothing more than `@AGENTS.md` import.

- **Worktrees live under `.claude/`, not `worktrees/` or `.git/worktrees/`
  alone.** That's a project-specific convention so a parallel Claude
  session can be discovered via `find .claude/worktrees -maxdepth 1 -type
  d`. The git plumbing is still under `.git/worktrees/` (gitfile linkage in
  `.claude/worktrees/blueprint-module/.git`).

- **`SESSION_HANDOFF.md` paths are stale.** It still references
  `/Users/anshullkgarg/Desktop/system_design/architex/`. The migration to
  `~/Downloads/projects/architex/` (per `MEMORY.md`
  `project_migration_to_downloads`) was not back-applied to that file. It's
  a quick-start prompt for resuming a session — copy + edit the path before
  pasting.

- **`SECURITY.md` and `LICENSE` exist but `audit-sidebar-deep.md` and
  `audit-snapshot-default.md` are tracked top-level audit reports** (not
  prompts). They live next to `CHANGELOG.md` rather than under `prompts/` or
  `docs/`.

- **The screenshot scripts hardcode the absolute path.** Both
  `capture-screenshots.sh:7` and `ui-tour-screenshots.mjs:12` write to
  `/Users/a0g11b6/Downloads/projects/architex/architex/docs/CODEMAPS/screenshots`.
  They will not work on another machine without an edit.

- **Drizzle `db:push` vs `db:generate` / `db:migrate`.** `db:push` skips the
  migration file step entirely — useful for local iteration but **never**
  for prod. `db:generate` + `db:migrate` is the production path.

- **Lighthouse CI requires `/api/health`.** The workflow `curl --retry`s
  against `http://localhost:3000/api/health` before invoking Lighthouse
  (`lighthouse-ci.yml:30-33`). If that route 500s, every PR's Lighthouse job
  fails with no useful diagnostic.

- **Bundle-size limits are flat thresholds, not deltas.** A change that
  pushes the main bundle from 100 KB to 240 KB still passes the 250 KB gate.

- **Next.js 16.2.3, React 19.2.4.** Both are pre-cutoff for most model
  training; AGENTS.md exists specifically to flag this.

- **`.superpowers/brainstorm/` directories are not gitignored.** Five
  brainstorm sessions are committed (or at least sit in the working tree)
  with full HTML/state artifacts. They are scratch material from the
  superpowers brainstorm skill.

---

## 12. Open questions

- **Why is `lint-staged` configured but unused?** Pre-commit runs the full
  lint over the tree, which is slower than scoped `lint-staged` and hits
  unrelated files. Was this intentional (consistency with CI) or an
  in-flight migration that stalled?

- **Is `enrich-patterns.ts` still meant to be runnable?** The curated
  payload is from one specific moment. If pattern coverage doubles, this
  script silently no-ops on new entries. Is there a planned source-of-truth
  YAML it should consume?

- **Should `SESSION_HANDOFF.md` be regenerated?** Paths are stale, task
  counts are from 2026-04-11. There's no script to refresh it from
  `docs/tasks/tasks.json`; it's a manual artifact. Worth replacing with a
  generator, or accepting it as a one-shot quick-start prompt?

- **Why no committed `.claude/settings.json`?** Hooks (e.g.
  format-on-save, type-check-after-edit) appear in the user's global
  `~/.claude/settings.json` but are not project-scoped. Repo-scoped hooks
  could ensure every contributor (human or AI) gets the same write-time
  behaviour. Conscious decision or just untouched?

- **Is the outer `scripts/scaffold-pattern.ts` deprecated by inner
  generators?** The inner repo has `scaffold:db-mode` and
  `scaffold:algorithm` as `pnpm` scripts; pattern scaffolding remains a raw
  `npx tsx` call from a different directory. Worth promoting to a
  `pnpm scaffold:pattern` entry?

- **`package.json` exposes both `typecheck` and `type-check`.** Both run
  `tsc --noEmit`. Which is the canonical name? CI uses `typecheck` (no
  hyphen), but contributing docs (`CONTRIBUTING.md:28`) cite `typecheck`,
  while some scripts may have been written against `type-check`. Pick one
  and alias the other?

- **No `pnpm build-storybook` / Chromatic.** Storybook is dev-only.
  Intentional (component isolation, no design-review surface), or planned
  follow-up?

- **Where is the `db:seed` pipeline meant to be run?** CI does not run it;
  there's no `db:seed:ci` variant. Local-only by design, or missing from
  the CI matrix?

- **What's the canonical way to run all scaffolders?** Three live in the
  inner repo (`scaffold:db-mode`, `scaffold:algorithm`,
  `compile:lld-lessons`, `build:concept-graph`); one lives in the outer
  repo (`scaffold-pattern.ts`). No single discovery path for "what can I
  scaffold?"
