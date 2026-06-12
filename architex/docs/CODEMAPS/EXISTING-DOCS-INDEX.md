# Existing Docs Index

> **READER NOTE (2026-05-07):** Treat cataloged docs as **historical reference, not current truth**. Most were authored 2026-04-12 → 2026-04-21, pre-date the Blueprint pivot, and may carry stale assumptions about routing, module wiring, or schemas. Before acting on any claim, verify against source or against this directory's wave-2 docs — especially `09-ui-tour.md` v2 and `18-other-modules.md`. The Blueprint specs at `/docs/superpowers/specs/2026-04-20-{lld,sd}-architect-studio-rebuild.md` are the canonical "what's being built now."

> Catalog of every markdown doc in the architex repo (excluding study materials in `01-foundations/` through `07-uber-prep/`, the in-flight `docs/CODEMAPS/` set, and `.git`/`node_modules`/`.next`).
> Generated 2026-05-07 from a full `find` sweep + per-doc head reads. Dates are git-last-modified (`git log -1 --format=%cd`); migration mtime (2026-05-01) is ignored.

---

## 1. How to use this index

Architex docs live in three trees that don't always agree:

- `architex/` (the **app**) — owns canonical project docs (CLAUDE, AGENTS, README, ADRs, ARCHITEX_*), the by-module backend-analysis set, and the audit/guide/design corpus under `architex/docs/`.
- `/` (the **monorepo parent**) — owns the build-scaffolding docs that predate the app (BUILD_PLAN, MEGA_PROMPT, ONBOARDING, advanced_system_design_curriculum, uber-interview-prep, the 10 PHASE-*-* prompts, and the `research/` library), plus the post-migration `docs/PROJECT-UNDERSTANDING.md` and the SP-1..SP-6 plans in `docs/superpowers/`.
- `docs/superpowers/specs/` + `docs/superpowers/plans/` — the **Blueprint era** specs/plans (the LLD + SD "Architect's Studio" rebuild) that drive the current execution.

Navigation rules of thumb:

1. **Start at `docs/PROJECT-UNDERSTANDING.md`** for the current ground-truth view (10-agent sweep, post-migration).
2. **Use `architex/docs/CODEMAPS/*` (9 files)** for code-level navigation by surface area (auth, AI, data, UI tour, etc.).
3. **The 12 `architex/docs/architecture/*-backend-analysis.md` files** are the per-module "what data lives where, what could move to DB" reports.
4. **`docs/superpowers/specs/` is the canonical product spec** for the current LLD + SD rebuild; the matching `plans/` are the Phase-by-Phase implementation contracts (LLD P1-P6, SD P0-P5).
5. The **older** vision/build docs (MEGA_PROMPT, BUILD_PLAN, ARCHITEX_PRODUCT_VISION, ONBOARDING, advanced_system_design_curriculum) are still useful as orientation but predate the Blueprint pivot — treat as historical context.
6. The **`architex/prompts/*` set** is reusable audit/spec/master-plan templates, not specs of the product itself.

---

## 2. Categories at a glance

| Category | Count | Where |
|---|---:|---|
| Strategy / Vision | 8 | repo root + `architex/` |
| ADRs | 8 | `architex/docs/adr/` |
| Architecture analyses (backend-migration set) | 12 | `architex/docs/architecture/` + `docs/architecture/` |
| Audits — System Design module | 11 | `architex/docs/audits/system-design-*.md` + `platform-experience-audit.md` |
| Audits — LLD content mega-audit | 15 | `architex/docs/audits/lld-content-mega-audit/` |
| Audits — root-level | 2 | `architex/audit-*.md` |
| Design specs | 9 | `architex/docs/design/` + `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` + `architex/docs/VISUAL_DESIGN_SPEC.md` |
| Guides — adding-a-X | 13 | `architex/docs/guides/` |
| Content strategy | 4 | `architex/docs/CONTENT_STRATEGY.md`, `content-style-guide.md`, `OS_CONTENT_GUIDE.md`, `RESEARCH_INDEX.md` |
| Plans (architex + parent) | 4 | `architex/docs/plans/` + `docs/plans/` |
| Plans (Blueprint / Architect's Studio) | 12 | `docs/superpowers/plans/` |
| Specs (Blueprint / Architect's Studio) | 3 | `docs/superpowers/specs/` |
| Wireframes | 1 | `docs/wireframes/` |
| Project meta (CLAUDE / AGENTS / README / etc.) | 9 | `architex/` + `architex/.github/` |
| Phase prompts (10-phase build plan) | 10 | `prompts/PHASE-01..10-*.md` |
| Reusable prompt templates | 24 | `architex/prompts/` |
| Module-specific deep-dives | 4 | `architex/DS-MODULE-ANALYSIS.md`, `LLD_CANVAS_PLAYBOOK.md`, `ARCHITEX_INTERVIEW_PREP_SPEC.md`, `dbl-snapshot-er.md` |
| Research findings (Architex agents) | 39 | `architex/docs/research-findings/` |
| Research library (parent) | 36 | `research/` + `research/paperdraw/` |
| Module READMEs (in `src/lib/`) | 3 | `architex/src/lib/{distributed,networking,os}/README.md` |
| Phase progress trackers | 6 | `.progress-phase-*.md` (root + `docs/superpowers/plans/`) |

---

## 3. Per-doc summary

### 3.1 Strategy / Vision

| Path | Date | Status | Summary |
|---|---|---|---|
| `architex/ARCHITEX_PRODUCT_VISION.md` | 2026-04-16 | current | Complete product vision compiled from 6 parallel research agents — codebase inventory (1,000+ files, 13 modules), competitive moat (simulation + education + canvas + open source), 25+ research-backed studies. The "what + why" anchor doc. |
| `architex/ARCHITEX_INTERVIEW_PREP_SPEC.md` | 2026-04-16 | current | 350+ feature spec for "the only platform that prepares you for every round" — maps DSA / LLD / HLD / DB / OS / Net / DevOps / Cloud / Security / SRE / Debugging / Testing / Code Review / Behavioral / Resume / Peer Programming features across 8 dimensions (Learning / Simulation / Practice / Assessment / Review / Reference / Social / AI). |
| `BUILD_PLAN.md` (root) | 2026-04-13 | historical | Layered prompt strategy for building Architex from scratch — explains why MEGA_PROMPT can't be one-shotted, defines the 3-layer (Context / Task / Verification) prompt system. Pre-Blueprint era. |
| `MEGA_PROMPT.md` (root) | 2026-04-13 | historical | The original 16,000-word complete technical specification — 12 modules, design principles (simulate-don't-diagram, time-travel, physics-based animation, offline-first), competitor comparison. Now superseded by the Blueprint specs but still the "deepest" vision. |
| `ONBOARDING.md` (root) | 2026-04-13 | current | Operator (Anshul Garg) onboarding card — usage breakdown, top skills/commands, MCP servers to activate, setup checklist. |
| `README.md` (root) | 2026-04-16 | current | Top-level repo README — explains the repo structure (architex app + study folders + research + prompts), points to study materials and Architex. |
| `architex/README.md` | 2026-04-16 | current | App README — Architex pitch ("interactive engineering laboratory"), 13 modules, 240+ algorithms, simulation engine moat, Next.js 16 / React 19 / TS5 / Tailwind v4 / AGPL-3.0. |
| `architex/docs/MASTER-EXECUTION-PLAN.md` | 2026-04-13 | historical | Auto-generated 2026-04-13 master plan from 4 parallel agents reading 24 analysis docs (~19k lines) — 87 unique actions, WSJF-scored, 7-session execution plan. Pre-Blueprint. |

### 3.2 ADRs

All in `architex/docs/adr/`, all dated 2026-04-13, all status "Accepted" (2024 in body but committed 2026-04-13).

| Path | Summary |
|---|---|
| `ADR-001-zustand-over-redux.md` | Zustand v5 chosen over Redux Toolkit / Jotai for 9+ stores — minimal boilerplate, no Provider wrapper, persist middleware, zundo undo/redo. |
| `ADR-002-react-flow-v12.md` | `@xyflow/react` v12 chosen over D3/Cytoscape/custom-canvas for the architecture canvas — handles, edges, minimap, drag-drop out of the box. |
| `ADR-003-tailwind-v4-css-custom-properties.md` | Tailwind v4 + CSS custom properties for theming — supports dark/light/system modes plus node-category, simulation-state, and chart palettes via CSS-native theme. |
| `ADR-004-app-router-over-pages-router.md` | App Router (`app/`) chosen over Pages Router on Next.js 16 — RSC, nested layouts, streaming for the workspace + auth + blog + concept pages + APIs. |
| `ADR-005-vitest-over-jest.md` | Vitest chosen over Jest — Vite-native, faster cold starts, native TS+ESM, Jest-compatible API. |
| `ADR-006-custom-simulation-engine.md` | Custom simulation engine over SimPy/SimJS/server-side — purpose-built for React Flow node graphs, models traffic / queuing / cascade / chaos / SLA / capacity / cost / latency budgets / time-travel. |
| `ADR-007-browser-only-architecture.md` | Browser-only for core (canvas, simulation, persistence, templates); API only for optional features (AI hints, server diagrams, Clerk webhooks). |
| `ADR-008-module-based-architecture.md` | 13 domains as lazy-loaded modules within a single SPA at `/`. No route-level split; all modules behind dynamic imports + suspense. |

### 3.3 Architecture analyses

The "backend & data migration" set — one per module — quantifying static content size, DB-migration feasibility, API design, and bundle-reduction estimates. All dated 2026-04-13 unless noted.

| Path | Date | Summary |
|---|---|---|
| `architex/docs/architecture/algorithm-backend-analysis.md` | 2026-04-13 | Algorithm module data inventory: 240+ algorithms, AlgorithmConfig objects across 8 categories. |
| `architex/docs/architecture/concurrency-backend-analysis.md` | 2026-04-13 | Concurrency module: ~33.5 KB / 855 lines of static content embedded in `ConcurrencyModule.tsx` JSX. |
| `architex/docs/architecture/data-structures-backend-analysis.md` | 2026-04-13 | DS module: 1,336 KB / 26,200 lines / 79 files / 43 catalog entries; 100% frontend, 0 API calls. |
| `architex/docs/architecture/database-backend-analysis.md` | 2026-04-13 | Database module: ~28k lines; 40% educational content (move to DB), 60% computation engines (keep frontend); ~120 KB bundle reduction. |
| `architex/docs/architecture/database-module.md` | 2026-04-13 | 7-mode architecture overview: ER Builder, Normalization, Tx Isolation, B-Tree, Hash, Query Plans, LSM-Tree. |
| `architex/docs/architecture/distributed-backend-analysis.md` | 2026-04-13 | Distributed module: 11 simulations, ~52 KB static content split across 6 files (3 sources of truth for same concepts). |
| `architex/docs/architecture/lld-backend-analysis.md` | 2026-04-13 | LLD module: 1.25 MB / 31,102 lines; 84% (686 KB) is static content; DB infra exists but never migrated. |
| `architex/docs/architecture/ml-design-backend-analysis.md` | 2026-04-13 | ML Design: 334 KB across 6 modes (pipeline templates, serving patterns, CNN, 3 demos); ~40 KB static. |
| `architex/docs/architecture/networking-backend-analysis.md` | 2026-04-13 | Networking module: 20 source files, 10,063 lines, 375 KB; 9 protocols. |
| `architex/docs/architecture/os-concepts-backend-analysis.md` | 2026-04-14 | OS module: inline TS constants in `OSModule.tsx`; 6 concepts, 6 scheduling algos, 4 page algos, 12 syscalls. |
| `architex/docs/architecture/security-backend-analysis.md` | 2026-04-13 | Security module: TOPICS array + step descriptions hardcoded as string literals across 11 topics. |
| `architex/docs/architecture/system-design-backend-analysis.md` | 2026-04-13 | SD module: ~1.2 MB pure static data — 73 chaos events, 80 topology rules, 52 issue types, 75 cost entries, 55 templates, 100+ palette items. ~600 KB bundle reduction available. |
| `docs/architecture/lld-module.md` (parent) | 2026-04-13 | LLD module data-flow + component-tree overview (Mermaid). The parent-tree counterpart to the architex one. |

### 3.4 Audits — System Design (11)

All in `architex/docs/audits/`, all dated 2026-04-12 unless noted.

| Path | Score | Focus |
|---|---|---|
| `platform-experience-audit.md` | mixed | Platform-wide connective tissue — landing, navigation, cross-module flow, design system, infra. |
| `system-design-content-audit.md` | — | Inventories 55 templates + 73 component types; benchmarks against academic syllabi, FAANG data. |
| `system-design-dx-audit.md` | 7.2/10 | DX score; "guides excellent, tooling modern, silent failures devastating" — unregistered nodes render blank. |
| `system-design-features-audit.md` | mixed | Layers 6-10 (Retention 7/10, Community 6/10, Operations 5/10, Discovery 8/10, Innovation 7/10). |
| `system-design-implementation-audit.md` | — | Are simulation engines + visualizations accurate teaching artifacts? Audits 27 sim files + 5 viz components. |
| `system-design-module-audit.md` | — | Mega Audit v3: 185 files, ~30k lines (14k app + 16k templates), full architecture map. |
| `system-design-onboarding-audit.md` | 8/10 | Onboarding "surprisingly excellent" — 6-layer system: tour, contextual tooltips, alt+hover, kbd shortcuts, hints, frustration detection. |
| `system-design-practice-audit.md` | mixed | 47 active learning features already exist vs Bloom's / Testing Effect / Desirable Difficulty / Duolingo mechanics. |
| `system-design-qa-completeness.md` | — | Adversarial review of all 9 audits — finds gaps the auditors missed (12 sim engines not individually reviewed). |
| `system-design-teaching-audit.md` | F | Critical pattern across all 55 templates: zero hooks, no "why should I care?", textbook-style. |
| `system-design-types-audit.md` | — | Type architecture: ~130 types across 18 files; store + naming consistency. |
| `system-design-visual-audit.md` | A- code / mixed live | Code-level visual = world-class; live experience reveals LOD crashes, broken mobile, missing polish. |

### 3.5 Audits — LLD content mega-audit (15)

All in `architex/docs/audits/lld-content-mega-audit/`, all dated 2026-04-14. Pre-audit score 79/100, post-fix score 93/100.

| Path | Role | Findings |
|---|---|---|
| `00-INDEX.md` | Index of all 15 sub-docs |
| `01-code-bug-audit.md` | Audit | 3 patterns leak metadata into TS code strings (P0). |
| `02-diagram-quality-audit.md` | Audit | Observer diagram wrong type, 14 cardinality errors. |
| `03-interview-content-audit.md` | Audit | 26 of 36 patterns missing interview Q&A. |
| `04-quiz-quality-audit.md` | Audit | 33 empty `whyWrong` fields, missing quiz categories. |
| `05-cardinality-audit.md` | Audit | 14 "wraps-one" relationships had wrong 1:* cardinalities. |
| `06-content-completeness-audit.md` | Audit | `confusedWith[]` and `predictionPrompts[]` gaps. |
| `07-problem-design-audit.md` | Audit | Slug mismatches, thin requirements, difficulty distribution skew. |
| `08-frontend-bug-audit.md` | Audit | 5 LLD UI component bugs (null guards, stale state, missing error states). |
| `09-competitor-gap-audit.md` | Audit | Java codegen, walkthroughs, auto-grading gaps vs Refactoring Guru / DesignPatterns.dev / PaperDraw / LeetCode Design / SD Primer. |
| `10-cross-reference-audit.md` | Audit | 2 broken refs, 4 slug mismatches across `relatedPatterns` / `relatedProblems` / `keyPatterns` / `confusedWith`. |
| `11-execution-code-diagrams.md` | Fix | Commit 01d90a7 — 3 code leaks, Observer, 14 cardinalities, 2 cross-refs (+341/-52). |
| `12-execution-quiz-content.md` | Fix | Commit 9f95d41 — 72 whyWrong fills, 21 new quiz questions (+382/-23). |
| `13-execution-interview-enrichment.md` | Fix | Commit 19af966 — 78 Q&A items, 23 confusedWith, 10 predictionPrompts (+2,428). |
| `14-pre-audit-research-agents.md` | Research | UX Researcher (context-aware tabs), Content Strategist (7 new content types), Tech Architect (FSRS-5, search, AI, prereq DAG). Drove `2026-04-14-lld-world-best-design.md`. |

### 3.6 Audits — root-level

| Path | Date | Summary |
|---|---|---|
| `architex/audit-sidebar-deep.md` | 2026-04-13 | Playwright accessibility-tree dump of the sidebar (5 unread notifications snapshot). Raw artifact. |
| `architex/audit-snapshot-default.md` | 2026-04-13 | Playwright a11y-tree default state snapshot (Algorithms active, 2 unread). Raw artifact. |

### 3.7 Design specs

| Path | Date | Summary |
|---|---|---|
| `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` | 2026-04-13 | UI Design System v1.0: design tokens + motion + Linear / Figma / VS Code / Notion / Stripe / Bloomberg / Apple-grade interaction patterns + 4-layer shadow system + roadmap. |
| `architex/docs/VISUAL_DESIGN_SPEC.md` | 2026-04-13 | Visual specs for every canvas component — node anatomy by category, edge animation, micro-interactions, simulation states, LOD, 15 component mockups. |
| `architex/docs/design/ALGORITHM-REVAMP-FINAL.md` | 2026-04-13 | THE prompt — synthesis of 5 design docs + 22 Stitch mockups + 80 engines analyzed. "12 sins of current UI" + revamp plan. |
| `architex/docs/design/algorithm-stitch-polish.md` | 2026-04-13 | Stitch Mode 1 (Polish) prompts — current-state audit of activity bar / sidebar / canvas / properties / bottom panel / globals.css for incremental polish. |
| `architex/docs/design/algorithm-stitch-prompts.md` | 2026-04-13 | 8 copy-pasteable Google Stitch prompts producing screenshot-quality mockups (default state, sorting view, graph view, etc.). |
| `architex/docs/design/algorithm-stitch-reimagine.md` | 2026-04-13 | Stitch Mode 2 (Reimagine) — start-from-zero "most extraordinary algorithm learning experience ever built." |
| `architex/docs/design/algorithm-ui-spec.md` | 2026-04-13 | Pixel-perfect UI spec generated from 21 source files — every value extracted from production code. |
| `architex/docs/design/database-visual-language.md` | 2026-04-13 | Canonical visual tokens for the Database module's SVG visualizations (B-Tree, Hash, LSM, Query Plan, ER). |
| `architex/docs/design/PLAYWRIGHT-AUDIT-RESULTS.md` | 2026-04-13 | Playwright deep audit of Algorithm Visualizer — Phase 1-4 features verified working (bar/dot/colormap, dashboard, scrubber, etc.). |

### 3.8 Guides — adding-a-X (13)

All in `architex/docs/guides/`, all dated 2026-04-13.

| Path | What it covers |
|---|---|
| `add-new-pattern.md` | Adding a `DesignPattern` to `src/lib/lld/patterns.ts` (45-60 min). |
| `adding-a-data-structure.md` | New DS engine + 9 registration locations across 2-3 files. |
| `adding-a-database-mode.md` | New Database mode + engine class + canvas + sidebar + properties (touches `DatabaseModule.tsx` monolith). |
| `adding-a-module.md` | New top-level learning module — `ModuleType` union, module hook, router, activity bar, command palette. |
| `adding-a-node.md` | New system-design canvas node — BaseNode, palette item, simulation service rate, SLA availability. |
| `adding-a-protocol.md` | New networking protocol — engine + `SequenceMessage` type + `NetworkingModule.tsx` switches. |
| `adding-a-template.md` | New SD diagram template — JSON file + barrel registration. |
| `adding-an-algorithm.md` | New algorithm — step-generator + `AlgorithmConfig` + visualizer wiring + tests. |
| `algorithm-content-style.md` | World-Class (Grade A) standard — references 3Blue1Brown, Brilliant, Red Blob Games, Stack Overflow DP guide; description template for every algorithm. |
| `algorithm-ui-vision-2026.md` | "Revolutionary redesign" vision — visualization SHOULD be the explanation, not a data display. |
| `algorithm-ui-vision-full.md` | Production design spec for Algorithm Visualizer — exact CSS, component names, animation params. |
| `ui-visual-style-guide.md` | "2026 Dark Glassmorphism" reference — every visual pattern from the Algorithm module, copy-paste ready. |
| `world-class-algorithm-content.md` | Final-copy descriptions / steps / complexity intuition / mistakes / summaries for every algorithm — paste-ready. |

### 3.9 Content strategy

| Path | Date | Summary |
|---|---|---|
| `architex/docs/CONTENT_STRATEGY.md` | 2026-04-16 | The Copy Bible — brand voice (65% professional, 60% serious, 80% concise, 55% technical, 60% friendly), wrong-vs-right examples, microcopy rules. |
| `architex/docs/content-style-guide.md` | 2026-04-13 | Pattern / SOLID demo / LLD problem section order: Hook → Analogy → ... 6 stages, teaching-not-reference. |
| `architex/docs/OS_CONTENT_GUIDE.md` | 2026-04-13 | OS-specific 8-section template (Hook / Analogy / WHY Steps / Complexity / Edge Case / ... + worked FCFS and LRU examples). |
| `architex/docs/RESEARCH_INDEX.md` | 2026-04-13 | Index of 27 specialized research agents (Wave 1 Core / Wave 2 Quality / Wave 3 Architecture / Wave 4 PhD UI). |

### 3.10 Plans — architex + parent

| Path | Date | Summary |
|---|---|---|
| `architex/docs/plans/2026-04-14-content-audit-results.md` | 2026-04-14 | LLD Content Mega-Audit Results — P0 list (3 code bugs, Observer wrong, 26 missing Q&A, 33 empty whyWrong, 14 cardinalities, etc.). |
| `architex/docs/plans/2026-04-14-lld-world-best-design.md` | 2026-04-14 | LLD World Best — synthesizes the 3 pre-audit Opus agents (UX / Content / Tech) into a unified design: context-aware bottom panel + computed tabs. |
| `docs/plans/2026-04-07-system-design-curriculum.md` (parent) | 2026-04-13 | "Ultimate System Design & LLD Curriculum" — HLD + LLD + DSA combined, pulled from Alex Xu, ByteByteGo, DDIA, Grokking, FAANG eng blogs. |
| `docs/plans/performance-optimization-strategy.md` (parent) | 2026-04-13 | Performance budget + optimization patterns: CWV targets, canvas perf, INP <100ms, monitoring infra. |

### 3.11 Plans — Blueprint / Architect's Studio (12)

All in `docs/superpowers/plans/`, all dated 2026-04-20.

LLD Phases:

| Path | Phase | Goal |
|---|---|---|
| `2026-04-20-lld-phase-1-mode-scaffolding.md` | LLD-1 | 4-mode shell (Learn / Build / Drill / Review), `lld_drill_attempts` partial unique index, DB-first persistence. |
| `2026-04-20-lld-phase-2-learn-mode.md` | LLD-2 | 8-section MDX lesson renderer + cross-link graph + AI explain-inline + 4 checkpoint types + 6 seeded patterns. |
| `2026-04-20-lld-phase-3-build-mode.md` | LLD-3 | 8 canvas upgrades — pattern-library dock, ~60 templates, Haiku "what's missing", Dagre auto-layout, 5 export formats, snapshots, kbd-first, notes/annotations. |
| `2026-04-20-lld-phase-4-drill-mode.md` | LLD-4 | 5-stage gated drill (Clarify → Rubric → Canvas → Walkthrough → Reflection) + 5 personas + 3-tier hints + 6-axis grading + AI postmortem + 3 variants. |
| `2026-04-20-lld-phase-5-review-mode.md` | LLD-5 | FSRS-5 spaced repetition (`ts-fsrs`) — 3 card-generation paths, mastery, daily widget, Anki-style shortcuts. |
| `2026-04-20-lld-phase-6-polish-rollout.md` | LLD-6 | Production hardening — 90-event telemetry, FlagRegistry, migration runner, 5-stage rollout, Sentry + Lighthouse + k6 + a11y. |

SD Phases:

| Path | Phase | Goal |
|---|---|---|
| `2026-04-20-sd-phase-0-foundations.md` | SD-0 | Pre-flight hardening — auth, rate limit, MDX sanitizer, WS auth, 14 `/api/sd/*` 501 shells, 6 SD flags. |
| `2026-04-20-sd-phase-1-mode-scaffolding.md` | SD-1 | 5-mode shell (Learn / Build / Simulate / Drill / Review), 13 new tables, 10+ API shells, cobalt accent. |
| `2026-04-20-sd-phase-2-learn-mode.md` | SD-2 | 8-section concept + 6-pane problem renderers, scroll-sync canvas highlight, 4 checkpoint types, 8 Opus pieces (Wave 1: 5 concepts + 3 problems). |
| `2026-04-20-sd-phase-3-simulate-drill.md` | SD-3 | The flagship — Simulate (wind tunnel) + Drill (5-stage interview clock + 8 personas + 6-axis rubric) + Wave 2-3 content (12 concepts + 10 problems). |
| `2026-04-20-sd-phase-4-content-wildcards.md` | SD-4 | 23 concepts + 17 problems + 60 chaos scenarios + Review mode + mobile + portfolio + email digest + LinkedIn badge + GitHub publish. |
| `2026-04-20-sd-phase-5-polish-saga.md` | SD-5 | Studio-grade polish — blueprint paper, hand-drawn (roughjs), ambient sound, Decade Saga, verbal drill (Whisper), red-team chaos AI, isometric 3D, Full-Stack Loop, F1-F12 + WCAG AA. |

### 3.12 Specs — Blueprint (3)

All in `docs/superpowers/specs/`, all dated 2026-04-20.

| Path | Summary |
|---|---|
| `2026-04-20-lld-architect-studio-rebuild.md` | LLD module Architect's Studio — 16-batch brainstorm consolidation; 4-mode system, 20 locked decisions, content strategy, pedagogical foundation, AI integration. The canonical LLD spec. |
| `2026-04-20-lld-implementation-handoff.md` | LLD handoff prompt — paste into a fresh Claude Code session to execute the rebuild without original brainstorm context. |
| `2026-04-20-sd-architect-studio-rebuild.md` | SD module Architect's Studio — 11-batch brainstorm; "drafting hall + wind tunnel" thesis; LLD studio extended into a second hall via cobalt accent swap. The canonical SD spec. |

### 3.13 Wireframes

| Path | Date | Summary |
|---|---|---|
| `docs/wireframes/architex-wireframe-specs.md` (parent) | 2026-04-13 | Blueprint-level wireframe specs for every screen (landing, dashboard, module selection, SD editor, algo viz, etc.) with design tokens. Pre-Blueprint era, primary palette `#6C5CE7` indigo + `#00CEC9` teal (different from current violet `#7c5cfc`). |

### 3.14 Project meta

| Path | Date | Summary |
|---|---|---|
| `architex/CLAUDE.md` | 2026-04-13 | One-line `@AGENTS.md` import. |
| `architex/AGENTS.md` | 2026-04-13 | Critical: this is **NOT** the canonical Next.js you know — APIs, conventions, file structure may differ from training data. Read `node_modules/next/dist/docs/` first. |
| `architex/CHANGELOG.md` | 2026-04-13 | v0.1.0 (2026-04-11) initial release notes — 13 modules, simulation engine, canvas infra, 6 Zustand stores, Dexie persistence, exports, etc. |
| `architex/CONTRIBUTING.md` | 2026-04-13 | Dev setup (Node 20+, pnpm 9+, no env vars), useful commands, and how-to-add-a-node walkthrough. |
| `architex/SECURITY.md` | 2026-04-13 | Vulnerability reporting (security@architex.dev, 48h response, 0.x supported). |
| `architex/SESSION_HANDOFF.md` | 2026-04-13 | Last updated 2026-04-11 — quick-start prompt for new Claude sessions; 1,157 tasks, 856 done, V2 epic breakdown across 12 phases. Pre-Blueprint, mostly historical. |
| `docs/PROJECT-UNDERSTANDING.md` (parent) | 2026-05-01 | **Most current** — 10-agent post-migration sweep (4 agents wedged on OneDrive). Exec summary, 3 risks, 3 highest-leverage bets. The canonical "where are we" doc. |
| `architex/.github/branch-protection.md` | 2026-04-13 | Recommended GitHub branch protection rules for `main`. |
| `architex/.github/PULL_REQUEST_TEMPLATE.md` | 2026-04-13 | Boilerplate PR template (description, type, module, screenshots). |

### 3.15 Phase prompts (parent `prompts/` — 10-phase build plan)

All in `prompts/`, all dated 2026-04-13. Pre-Blueprint sequential build prompts.

| Path | Scope |
|---|---|
| `PHASE-01-FOUNDATION.md` | Core platform & infra — Next.js skeleton, panels, canvas, command palette, auth, DB, stores, persistence, theme, CI/CD. |
| `PHASE-02-SYSTEM-DESIGN-SIMULATOR.md` | System Design Simulator phase. |
| `PHASE-03-ALGORITHMS-DATA-STRUCTURES.md` | Algorithms + Data Structures phase. |
| `PHASE-04-LLD-DATABASE-DISTRIBUTED.md` | LLD + Database + Distributed phase. |
| `PHASE-05-NETWORKING-OS-CONCURRENCY-SECURITY-ML.md` | Networking + OS + Concurrency + Security + ML phase. |
| `PHASE-06-INTERVIEW-ENGINE-AI.md` | Interview Engine + AI integration. |
| `PHASE-07-COLLABORATION-COMMUNITY.md` | Collaboration + Community. |
| `PHASE-08-DESKTOP-EXPORT-SEARCH-PLUGINS.md` | Desktop + Export + Search + Plugins. |
| `PHASE-09-LANDING-SEO-LAUNCH.md` | Landing + SEO + Launch. |
| `PHASE-10-ACCESSIBILITY-PERFORMANCE-ENTERPRISE.md` | Accessibility + Performance + Enterprise. |

### 3.16 Reusable prompt templates (`architex/prompts/` — 24)

All dated 2026-04-13. Operator-level prompt library for running audits / generating UI specs / planning execution. Not specs of the product itself.

| Path | What it generates |
|---|---|
| `0-completeness-gate.md` | Adversarial QA reviewer — proves prior audit was incomplete. |
| `001UI-VISION-TEMPLATE.md` | "Three people designing" UI vision template (Apple designer + Brilliant CD + Vercel architect). |
| `002UI-SPEC-GENERATOR.md` | Pixel-perfect UI specification document generator. |
| `003STITCH-MODE1-POLISH.md` / `003STITCH-MODE2-REIMAGINE.md` | Stitch Mode 1 (incremental polish) / Mode 2 (start from zero) prompt templates. |
| `004FRONTEND-REVAMP.md` | Frontend revamp execution prompt. |
| `1mega-audit-v3.md` | Three-persona module audit (senior eng + product designer + QA lead). |
| `2content-curriculum-audit.md` | Content + curriculum audit template. |
| `3concept-quality-audit.md` | Concept quality audit. |
| `4implementation-quality-audit.md` | Implementation quality audit. |
| `5practice-assessment-audit.md` | Practice + assessment audit. |
| `6features-innovation-audit.md` | Features + innovation audit. |
| `7visualization-simulation-audit.md` | Visualization + simulation audit. |
| `8platform-audit.md` | Platform-level audit. |
| `9data-architecture-audit.md` | Data architecture audit. |
| `10developer-experience-audit.md` | DX audit. |
| `11onboarding-tutorial-audit.md` | Onboarding + tutorial audit. |
| `BACKEND-DATA-MIGRATION-ANALYZER.md` | Per-module backend & data migration analyzer (drives the 12 architecture analyses). |
| `EXECUTE-TASKS.md` | Lead Engineer role — read task board, group into batches, dispatch agents, review work. |
| `FIX-DATA-STRUCTURES-MODULE.md` | Specific fix prompt for the DS browser-freeze bug — references `DS-MODULE-ANALYSIS.md`. |
| `MASTER-PLAN-FROM-ANALYSIS.md` | Staff Engineer / CTO master-plan synthesizer (drives `MASTER-EXECUTION-PLAN.md`). |
| `mega-audit.md` | "Mega Audit Universal Module Quality Prompt v2" (single copy-paste, full audit + JSON tasks). |
| `module-deep-audit.md` | Module deep-audit template. |
| `quick-audit-template.md` | Quick audit (3 variables: MODULE, EPIC, PATH). |
| `task-creation-from-audit.md` | Senior eng manager — converts audit findings into structured task board entries. |

### 3.17 Module-specific deep-dives

| Path | Date | Summary |
|---|---|---|
| `architex/DS-MODULE-ANALYSIS.md` | 2026-04-13 | Why the Data Structures module freezes the browser — eagerly loads ~24,000 lines / ~820 KB synchronously on main thread. The reason `DataStructuresWrapper.tsx` ships a placeholder. |
| `architex/LLD_CANVAS_PLAYBOOK.md` | 2026-04-15 | "What we built and how to replicate" — Dagre layout, A* edge router, orthogonal routing, BLOCK_PAD = 30px. Blueprint to apply to other modules. |
| `architex/ARCHITEX_INTERVIEW_PREP_SPEC.md` | (covered in 3.1) |
| `dbl-snapshot-er.md` (root) | 2026-04-13 | Raw Playwright accessibility-tree dump of the Database module ER builder — sidebar, palette, examples (E-commerce, Social, Library), entity panel. |

### 3.18 Research findings — Architex agents (39)

In `architex/docs/research-findings/`, all dated 2026-04-13. Outputs from 36 specialized research agents (27 research + 7 compilation + 2 codegen) producing 805 unique tasks.

Index docs (read first):

| Path | Summary |
|---|---|
| `00-MASTER-INDEX.md` | Definitive entry — 805 tasks, 1,850 raw findings, 17 findings files, 40+ deliverables, 29 security vulns, 30 code bugs, 13+ competitors. |
| `AGENT-OUTPUT-INDEX.md` | Newer index (2026-04-16) of the 6 Interview Prep + 6 Product Vision + 3 Design System + N+ research agents. |

Numbered findings (24 files, 01 → 24):

| Path | Topic |
|---|---|
| `01-codebase-gap-analysis.md` | Platform is 8-12% of MEGA_PROMPT, 5/12 modules placeholder-only. |
| `02-code-quality-bugs.md` | 30 bugs (2 critical, 9 high, 12 medium, 7 low) — stale closures, JSON.parse crashes. |
| `03-feature-completeness-qa.md` | 25 working / 11 partial / 3 missing — simulation engine UNWIRED is #1 gap. |
| `04-simulation-wiring-plan.md` | Plan to wire the simulation engine end-to-end. |
| `05-wireframe-gap-analysis.md` | 22 screens spec'd, only 5 partially built, 17 unbuilt. |
| `06-design-system-gaps.md` | 70% tokens missing, 0 shadcn wrappers, 0 landing page. |
| `07-db-infra-audit.md` | 18 tables exist, 0 API routes, 0 jobs, 0 email, 29 security vulns. |
| `08-placeholder-modules-plan.md` | 132 tasks for 5 placeholder modules (DS, LLD, DB, Security, ML). |
| `09-testing-devops-strategy.md` | 106 tasks: 47 unit + 20 component + 12 E2E + CI/CD. |
| `10-accessibility-mobile-pwa.md` | 86 tasks: 27 P0 a11y + 18 mobile + 14 PWA + 12 i18n. |
| `11-innovation-features.md` | 35 breakthrough features (AI / gamification / viz). |
| `12-content-seo-growth.md` | 141 tasks, 300 SEO pages, 5 email sequences. |
| `13-ux-polish-errors.md` | 100 tasks: no toast, no persistence, no error boundaries. |
| `14-architecture-infrastructure.md` | 89 tasks: Dexie/Comlink unused, 0 workers, no middleware. |
| `15-user-journeys.md` | User journey mapping. |
| `16-dx-legal-operations.md` | DX + legal + ops tasks. |
| `17-phase-prompts-573-tasks.md` | 573 granular tasks extracted from all 10 phase files. |
| `18-research-files-audit.md` | Audit of the parent `research/` library. |
| `19-state-architecture-summary.md` | State-architecture summary. |
| `20-visualization-system-inventory.md` | Visualization-system inventory. |
| `21-security-threat-model.md` | Security threat model. |
| `22-scalability-analysis.md` | Scalability analysis. |
| `23-competitive-landscape.md` | Competitive landscape. |
| `24-task-completeness-audit.md` | Task-completeness audit. |

Domain-named agent outputs (interview-prep + product-vision + IA + UF + WOW):

`agent-01-dsa-algorithms.md` … `agent-06-debugging-testing-softskills.md` (6 interview-prep agents — DSA / LLD / HLD / DB+Backend+Concurrency / OS+Net+DevOps+Cloud+Security+SRE / Debugging+Testing+CodeReview+Behavioral+Resume).

`agent-pv-01-product-vision.md` … `agent-pv-06-codebase-audit.md` (6 product-vision agents — Feature Universe / Competitive Moat / Simulation R&D / AI Features / Retention Science / Codebase Inventory).

`agent-ia-01-information-architecture.md` … `agent-ia-10-content-copy.md` (10 IA / design agents — IA / Visual / Components / Frontend / Motion / Responsive / a11y+i18n / Aesthetic Soul / Micro-interactions / Content Copy).

`agent-uf-01-unique-features.md`, `agent-wow-127-features-per-round.md`, `agent-wow-180-features-by-topic.md`, `agent-wow-features-per-module.md` (Unique Features + 3 WOW-feature compilations).

### 3.19 Research library — parent `research/` (36)

In `research/`, all dated 2026-04-13. 21+ parallel research agents covering competitor + tooling + technique landscape.

| Path | Topic |
|---|---|
| `README.md` | Index of the 21+ research agents — Core Platform / Domain-Specific / Implementation / Adversarial / Growth. |
| `01-dsa-visualization-platforms.md` | VisuAlgo / Algorithm Visualizer / USFCA / Red Blob / Python Tutor. |
| `02-system-design-tools.md` | paperdraw / Excalidraw / draw.io / Miro / chaos tools. |
| `03-lld-os-database-tools.md` | PlantUML / Mermaid / StarUML / OSTEP / dbdiagram. |
| `04-tech-stack-recommendations.md` | React Flow / Motion / Monaco / shadcn / Zustand / Dexie / WASM versions + sizes. |
| `05-networking-security-viz.md` | TCP / TLS / DNS / OAuth / JWT / CORS viz tools. |
| `06-concurrency-ml-devops.md` | Thread viz / TF Playground / Argo CD / K8s. |
| `07-interview-gamification.md` | interviewing.io / Pramp / Exponent / Liveblocks / Yjs. |
| `08-distributed-systems-algorithms.md` | Raft / Paxos / CRDTs / consistent hashing / gossip / vector clocks. |
| `09-real-world-case-studies.md` | 55+ system architectures (Netflix / Twitter / Uber / etc.). |
| `10-uiux-developer-tools.md` | Linear / Vercel / Raycast / cmdk / Geist. |
| `11-animation-visualization-techniques.md` | Particle flow / SVG vs Canvas / spring physics / LOD / 60fps. |
| `12-export-sharing-persistence.md` | SnapDOM / lz-string / Yjs / OPFS / oEmbed. |
| `13-competitive-analysis.md` | 20+ platforms with pricing + features + 10 critical market gaps. |
| `14-accessibility-performance.md` | a11y + perf research. |
| `15-testing-deployment.md` | Testing + deployment research. |
| `16-queuing-theory-simulation-math.md` | Little's Law / M/M/c / queuing models. |
| `17-ai-integration-strategy.md` | AI integration strategy. |
| `18-microservices-patterns.md` | Microservices pattern catalog. |
| `19-onboarding-plugins-mobile.md` | Onboarding + plugin + mobile research. |
| `20-advanced-dsa-competitive.md` | Advanced DSA / competitive programming. |
| `21-benchmarks-real-world-numbers.md` | Real-world latency / throughput / capacity benchmarks. |
| `22-architex-design-system.md` | Architex design system reference (palette / type / spacing). |
| `22-auth-security-compliance.md` | Auth / security / compliance. |
| `22-backend-infrastructure.md` | Backend infra. |
| `22-canvas-editor-ui-deep-dive.md` | Canvas editor UI deep-dive. |
| `22-content-pipeline-specification.md` | Content pipeline spec. |
| `22-landing-page-design.md` | Landing page design. |
| `22-search-social-integrations.md` | Search + social integrations. |
| `22-sound-microinteractions-polish.md` | Sound + micro-interactions + polish. |
| `26-monetization-community-strategy.md` | Monetization + community strategy. |
| `31-seo-content-growth.md` | SEO + content growth. |
| `32-analytics-email-notifications.md` | Analytics + email + notifications. |
| `40-devils-advocate-review.md` | Devil's advocate adversarial review. |
| `41-defense-architect-counter.md` | Defense architect counter-review. |
| `42-chief-architect-final-review.md` | Chief architect final review. |
| `43-security-threat-model.md` | Security threat model. |
| `44-scalability-breaking-points.md` | Scalability breaking points. |
| `50-content-growth-task-list.md` | Content + growth task list. |

PaperDraw deep-dive (`research/paperdraw/`):

| Path | Topic |
|---|---|
| `README.md` | PaperDraw research entry — Flutter + WASM + Supabase + Gemini 2.5 Flash, 7,885 users. |
| `PAPERDRAW_COMPLETE_REFERENCE.md` | Full reference (107 components, 35 pressure counters, 73 chaos events). |
| `PAPERDRAW_SYSTEM_DEEP_DIVE.md` | System deep-dive (architecture + pricing + monetization). |
| `CODE_REVERSE_ENGINEERING.md` | Reverse-engineering of compiled Flutter/WASM bundle. |
| `COMPONENT_SETTINGS_LOGIC.md` | Per-component settings logic. |
| `js-analysis.md` | JS analysis. |
| `supabase-analysis.md` | Supabase backend analysis. |
| `features.md` | Feature inventory. |
| `explanations/{ai_agent, banking_ledger, data_analytics, minimal_design, ridesharing, social_feed, sos_uml, url_shortener, video_streaming}.md` | 9 PaperDraw-style example explanations. |

Sister to research:

| Path | Date | Summary |
|---|---|---|
| `architex/docs/PAPERDRAW_VS_ARCHITEX_ANALYSIS.md` | 2026-04-13 | Side-by-side comparison — PD = world-class simulation, Architex = world-class learning platform. PD wins component breadth + chaos + reports; Architex wins education + algorithms + interview prep. |

### 3.20 Module READMEs (in `src/lib/`)

| Path | Date | Summary |
|---|---|---|
| `architex/src/lib/distributed/README.md` | 2026-04-13 | Distributed module — 11 simulations (Raft, Consistent Hashing, Vector Clocks, Gossip, CRDTs, CAP, 2PC, Saga, MapReduce, Lamport, Paxos), engine-style table. |
| `architex/src/lib/networking/README.md` | 2026-04-13 | Networking engines — TCP / TLS / TLS1.3 / DNS / HTTP / WS / CORS / CDN / API / Serialization. |
| `architex/src/lib/os/README.md` | 2026-04-13 | "How to Add a New OS Concept" — 7 registration points, gold-standard FCFS + LRU references. |

### 3.21 Phase progress trackers

| Path | Date | Summary |
|---|---|---|
| `.progress-phase-1.md` (root) | 2026-04-20 | LLD Phase 1 progress (15+ tasks marked done). |
| `.progress-phase-2.md` (root) | 2026-04-21 | LLD Phase 2 progress + 164 React 19 act() pre-existing test failures. |
| `.progress-phase-3.md` (root) | 2026-04-21 | LLD Phase 3 progress (15+ tasks). |
| `.progress-phase-4.md` (root) | 2026-04-21 | LLD Phase 4 progress — 92 new tests, 7 API routes, 2 DB tables/migrations. |
| `docs/superpowers/plans/.progress-phase-1.md` | 2026-04-20 | Phase 1 progress (worktree-local copy). |
| `docs/superpowers/plans/.progress-phase-3.md` | 2026-04-21 | Phase 3 progress (worktree-local copy). |

### 3.22 Sibling root-level

Also documented in `docs/CODEMAPS/EXISTING-DOCS-INDEX.md`'s siblings (the 9 in-flight CODEMAPS files: `02-learn-content-pipeline.md`, `03-interactive-learning.md`, `04-auth-user-billing.md`, `05-ai-and-collaboration.md`, `06-api-and-data.md`, `07-state-and-libs.md`, `08-public-and-infra.md`, `09-ui-tour.md`, `12-database-review.md`). Excluded per scope.

| Path | Date | Summary |
|---|---|---|
| `advanced_system_design_curriculum.md` (root) | 2026-04-13 | Comprehensive advanced system design curriculum — 18 sections covering microservices, cloud-native, stream processing, search, ML, real-time, security, observability, blockchain, mobile, data eng, DevOps, edge/IoT, payments, gaming, cross-cutting. |
| `uber-interview-prep.md` (root) | 2026-04-13 | Uber India interview complete prep guide — process, LeetCode questions (most recent + all-time 300+), 25+ HLD, 30+ LLD, internal-system mapping, DSA patterns, 8-week roadmap. |

---

## 4. Coverage gaps

Topics with **no current doc** (or only outdated ones):

- **Public API / endpoint reference.** Per-route documentation for `/api/lld/*`, `/api/sd/*`, `/api/diagrams`, `/api/ai`, etc. Currently spread across plan docs; no consolidated reference.
- **Operational runbooks.** No on-call / incident-response runbooks for DB / Clerk / AI rate limits / Sentry. Phase 6 SLO doc (`docs/sre/lld-slo.md`) referenced in plans but not yet authored.
- **Per-DB-table reference.** Schema docs exist as Drizzle code but no human-readable "what each table holds, FKs, indexes" reference. The `architex/docs/CODEMAPS/12-database-review.md` partially covers this but lives outside this index's scope.
- **Component / UI catalog.** Storybook stories exist but no narrative catalog mapping component → use-case → which module.
- **Threat model + privacy docs (current).** Old `21-security-threat-model.md` and `43-security-threat-model.md` exist in research-findings but no current SECURITY.md beyond "report a vuln". GDPR / data-retention not documented.
- **Pricing / monetization plan.** `26-monetization-community-strategy.md` is research; no current product-pricing decision.
- **Old-LLD sunset trigger.** Flagged as a top-3 risk in `PROJECT-UNDERSTANDING.md`; no doc commits to a concrete trigger.
- **Two-schema-trees reconciliation.** Flagged as a top-3 risk; no doc explains which of `drizzle/` vs `architex/src/db/schema/` is canonical or how they should merge.
- **AI cost ledger.** Per-feature AI cost budgets are mentioned in SD plans (~$0.015/Learn session, etc.) but no rolled-up AI budget doc.
- **Mobile / responsive baseline.** SD-4 plans mobile Learn but no current "what works on mobile today" doc.
- **i18n strategy.** `agent-ia-07-accessibility-i18n.md` and `10-accessibility-mobile-pwa.md` flag tasks; no i18n decision doc.

---

## 5. Cross-reference table — "I want to understand X → read Y"

| If you want to understand … | Read this first | Then this |
|---|---|---|
| **The current state of the repo** (post-migration) | `docs/PROJECT-UNDERSTANDING.md` | `docs/CODEMAPS/*` (sibling files) |
| **Why the project exists / who it's for** | `architex/ARCHITEX_PRODUCT_VISION.md` | `architex/README.md`, `MEGA_PROMPT.md` |
| **What's currently being built** | `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` + `2026-04-20-sd-architect-studio-rebuild.md` | LLD Phase 1-6 + SD Phase 0-5 plan files |
| **Tech stack decisions** | `architex/docs/adr/ADR-001..008` (8 ADRs) | `architex/AGENTS.md` (warning about Next.js fork) |
| **The LLD module specifically** | `architex/LLD_CANVAS_PLAYBOOK.md` (canvas) + `docs/architecture/lld-module.md` (data flow) | `architex/docs/architecture/lld-backend-analysis.md` (data inventory) |
| **The System Design module** | `architex/docs/audits/system-design-module-audit.md` | The 11 SD audits in `architex/docs/audits/` |
| **The Database module** | `architex/docs/architecture/database-module.md` | `architex/docs/architecture/database-backend-analysis.md`, `architex/docs/design/database-visual-language.md` |
| **The Algorithm visualizer** | `architex/docs/design/ALGORITHM-REVAMP-FINAL.md` | `architex/docs/design/algorithm-ui-spec.md`, `architex/docs/guides/algorithm-ui-vision-2026.md` |
| **The Data Structures freeze bug** | `architex/DS-MODULE-ANALYSIS.md` | `architex/prompts/FIX-DATA-STRUCTURES-MODULE.md`, `architex/docs/architecture/data-structures-backend-analysis.md` |
| **How to add a new module / node / template** | `architex/docs/guides/adding-a-{module,node,template,...}.md` | `architex/CONTRIBUTING.md` |
| **Content style + tone + voice** | `architex/docs/CONTENT_STRATEGY.md` | `architex/docs/content-style-guide.md`, `architex/docs/OS_CONTENT_GUIDE.md`, `architex/docs/guides/algorithm-content-style.md` |
| **Visual / design tokens** | `architex/docs/UI_DESIGN_SYSTEM_SPEC.md` | `architex/docs/VISUAL_DESIGN_SPEC.md`, `architex/docs/guides/ui-visual-style-guide.md` |
| **What the simulation engine does** | `architex/docs/adr/ADR-006-custom-simulation-engine.md` | `architex/docs/architecture/system-design-backend-analysis.md`, `research/16-queuing-theory-simulation-math.md` |
| **What competitors do** | `architex/docs/PAPERDRAW_VS_ARCHITEX_ANALYSIS.md` | `research/13-competitive-analysis.md`, `research/paperdraw/PAPERDRAW_COMPLETE_REFERENCE.md` |
| **Interview prep coverage / spec** | `architex/ARCHITEX_INTERVIEW_PREP_SPEC.md` | `uber-interview-prep.md`, `advanced_system_design_curriculum.md` |
| **What was researched and when** | `architex/docs/research-findings/00-MASTER-INDEX.md` + `AGENT-OUTPUT-INDEX.md` | `research/README.md`, `architex/docs/RESEARCH_INDEX.md` |
| **Why the schema looks the way it does** | `architex/docs/architecture/lld-backend-analysis.md` | `architex/docs/CODEMAPS/12-database-review.md` (out of this index's scope) |
| **What's been done in the LLD rebuild** | `.progress-phase-1.md` … `.progress-phase-4.md` (root) | LLD Phase 1-6 plan files |
| **Performance budget** | `docs/plans/performance-optimization-strategy.md` (parent) | `architex/docs/audits/system-design-visual-audit.md` |
| **Security posture** | `architex/SECURITY.md` (sparse) | `architex/docs/research-findings/21-security-threat-model.md`, `research/43-security-threat-model.md` |
| **Wireframes / planned screens** | `docs/wireframes/architex-wireframe-specs.md` (parent) | `architex/docs/research-findings/05-wireframe-gap-analysis.md` |
| **The 10-phase build plan** (historical) | `BUILD_PLAN.md` (root) | `MEGA_PROMPT.md`, `prompts/PHASE-01-FOUNDATION.md` … `PHASE-10-*.md` |
| **How audits are run** (operator workflow) | `architex/prompts/mega-audit.md` | `architex/prompts/0-completeness-gate.md`, `architex/prompts/MASTER-PLAN-FROM-ANALYSIS.md` |

---

_Last updated 2026-05-07. To regenerate: run `find /Users/a0g11b6/Downloads/projects/architex -name '*.md' -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/.claude/worktrees/*' -not -path '*/01-foundations/*' -not -path '*/02-*/*' -not -path '*/03-*/*' -not -path '*/04-*/*' -not -path '*/05-*/*' -not -path '*/06-*/*' -not -path '*/07-uber-prep/*'` and re-summarize._
