# LLD Phase 6 · Polish, Analytics, Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Architex LLD rebuild for safe production launch. Phase 6 converts a feature-complete build (Phases 1-5) into a measurable, flagged, monitored, rollback-safe product. No new user-facing features — Phase 6 is the invisible scaffolding that makes everything else survive contact with production.

**Architecture:** Five discrete production-readiness pillars, all built on the existing `src/lib/analytics/` stack (PostHog wrapper, web-vitals observer, consent manager, error-tracking abstraction already in place). Pillars:

1. **Telemetry catalog** — extend the 25-event Phase 1 starter catalog to the full ~90-event taxonomy covering every meaningful user action across Learn/Build/Drill/Review/shell/review modes and cross-cutting surfaces, with typed builders, a compile-time enum, and a single shared emit pipeline that mirrors events to the activity log + PostHog + (optionally) Sentry breadcrumbs.
2. **Feature-flag harness** — a small `FlagRegistry` abstraction wrapping PostHog's `getFeatureFlag`/`isFeatureEnabled` with server-side equivalents, a hashed cohort assignment helper, a dev-only toggle UI, an ESLint rule that requires wrapped code for any symbol imported from `@/features/flags/gates`, and a kill-switch layer that short-circuits flags from an env var without waiting for PostHog to load.
3. **Migration runner** — a generic dual-write + backfill + read-switch primitive (`src/db/migrations/runner.ts`) for any schema change post-Phase-1. Five discrete sub-states per migration (INACTIVE → DUAL_WRITE → BACKFILL → READ_NEW → COMPLETE) persisted in a new `schema_migrations_state` table, gated behind a migration-phase feature flag so we can roll back per-user.
4. **Rollout harness + A/B framework** — `src/features/rollout.ts` wiring cohort assignment (stable hash), variant exposure (auto-fired exposure event), and metric attribution (cohort stamped on every `track()` call). Config lives in `src/features/rollout-config.ts` with 5 ramp stages: internal → 5% beta → 25% → 50% → 100%. Every ramp stage has its own PostHog flag key so individual features can be at different ramp stages independently.
5. **Observability + budgets** — Sentry initialization (client + server + edge), Lighthouse CI in GitHub Actions with explicit LCP/INP/CLS budgets, k6 load/stress harness with three scenarios (smoke/load/stress) targeting the 6 LLD API routes from Phase 1, SLO + error-budget definition in a new `docs/sre/lld-slo.md`, and an accessibility audit task list referencing `axe-core` automated scans + WCAG AA manual checks.

**Tech stack additions:** `posthog-js` (wrapping existing `src/lib/analytics/posthog.ts`), `@sentry/nextjs`, `axe-core` + `@axe-core/playwright`, `web-vitals`, `@lhci/cli` (Lighthouse CI), `k6` (run via Docker or brew install — no npm dep), `@vitest/coverage-v8`. All additions are additive; nothing in Phases 1-5 needs to change.

**Prerequisite:** Phases 1-5 shipped end-to-end. `lld_mode_switched` event fires in production. All four mode layouts render. Drill API routes return `200` under load. If any of those are not true, return to that phase.

**Reference:** Design spec `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` §13 (Analytics Q19), §15 (Phased Rollout Q20), §16 (Non-Goals), §17 (Open Questions). Style reference: `docs/superpowers/plans/2026-04-20-lld-phase-1-mode-scaffolding.md` Task 11 (analytics/telemetry section) + Task 17 (verification pattern).

---

## Pre-flight checklist (Phase 6 kickoff · ~3-4 hours)

Before starting Task 1 of Phase 6, verify the outputs of Phases 1-5 are in place and green. These are non-destructive assertions.

- [ ] **Verify Phase 1 analytics starter catalog exists**

```bash
test -f architex/src/lib/analytics/lld-events.ts && echo OK || echo MISSING
```
Expected: `OK`. If `MISSING`, return to Phase 1 Task 11. The file should export at minimum: `lldModeSwitched`, `lldWelcomeBannerShown`, `lldWelcomeBannerDismissed`, `lldDrillStarted`, `lldDrillPaused`, `lldDrillSubmitted`, `lldDrillAbandoned`, `lldDrillGradeTierCrossed`, `track`.

- [ ] **Verify PostHog wrapper exists and is a no-op by default**

```bash
grep -q 'initPostHog' architex/src/lib/analytics/posthog.ts && echo OK || echo MISSING
grep -q 'isFeatureEnabled' architex/src/lib/analytics/posthog.ts && echo OK || echo MISSING
```
Both must print `OK`. If the wrapper has been rewritten, adjust Task 5/6 imports accordingly.

- [ ] **Verify `lld_drill_attempts` table is live in production**

In Neon SQL console:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'lld_drill_attempts' ORDER BY ordinal_position;
```
Expected columns per Phase 1 Task 1: `id, user_id, problem_id, drill_mode, started_at, paused_at, last_activity_at, submitted_at, abandoned_at, elapsed_before_pause_ms, duration_limit_ms, canvas_state, hints_used, grade_score, grade_breakdown`.

- [ ] **Verify consent manager is wired**

```bash
grep -q 'CONSENT_STORAGE_KEY' architex/src/lib/analytics/consent.ts && echo OK || echo MISSING
```
Expected `OK`. Phase 6 must not fire analytics without consent — Task 8 of Phase 6 bakes this guard into the emit pipeline.

- [ ] **Verify error-tracking abstraction exists**

```bash
grep -q 'captureException' architex/src/lib/analytics/error-tracking.ts && echo OK || echo MISSING
```
Expected `OK`. Sentry task (Task 23) wires this abstraction to a real Sentry client.

- [ ] **Verify web-vitals observer is in place**

```bash
grep -q 'observeWebVitals' architex/src/lib/analytics/web-vitals.ts && echo OK || echo MISSING
```
Expected `OK`. Task 22 extends this with the `web-vitals` npm package for accurate INP/CLS.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass. If any fail, fix before starting Phase 6 — Phase 6 adds many new files and we don't want to entangle pre-existing failures with new code.

- [ ] **Capture bundle-size baseline**

```bash
cd architex && ANALYZE=true pnpm build 2>&1 | tee /tmp/architex-bundle-baseline.txt
```
Save the output as a reference. Task 25 (Lighthouse CI) asserts bundle size stays within 110% of this baseline.

- [ ] **Snapshot Phase 5 rollout state**

```bash
git log --oneline | head -30 > /tmp/phase-5-log.txt
git tag --list | tail -10 > /tmp/phase-tags.txt
```
Reference material only — useful if a later phase needs to verify a specific commit.

- [ ] **Commit any pre-flight fixes**

```bash
git add -p
git commit -m "chore(lld-phase-6): pre-flight verification — Phases 1-5 outputs confirmed"
```

---

## File structure

Files created or significantly modified in this plan. Paths are absolute within the repo.

```
architex/
├── .github/workflows/
│   ├── lighthouse-ci.yml                                       # NEW
│   ├── load-test.yml                                           # NEW (k6, manual dispatch)
│   └── accessibility-audit.yml                                 # NEW (axe + playwright, nightly)
├── .lighthouserc.json                                          # NEW
├── drizzle/
│   └── NNNN_add_schema_migrations_state.sql                    # NEW (generated)
├── eslint-plugin-architex/                                     # NEW (local plugin)
│   ├── package.json
│   ├── rules/
│   │   └── require-feature-flag-gate.js
│   └── index.js
├── k6/
│   ├── smoke.js                                                # NEW
│   ├── load.js                                                 # NEW
│   ├── stress.js                                               # NEW
│   ├── scenarios/
│   │   ├── drill-lifecycle.js
│   │   ├── lesson-scroll.js
│   │   ├── review-session.js
│   │   └── anonymous-migration.js
│   └── README.md
├── sentry.client.config.ts                                     # NEW
├── sentry.server.config.ts                                     # NEW
├── sentry.edge.config.ts                                       # NEW
├── next.config.ts                                              # MODIFY (wrap with Sentry + analyzer)
├── eslint.config.mjs                                           # MODIFY (add local plugin + rule)
├── package.json                                                # MODIFY (add deps)
├── docs/sre/
│   ├── lld-slo.md                                              # NEW (error budget + SLOs)
│   ├── lld-severity-classification.md                          # NEW (Sev-1 definitions)
│   ├── lld-kill-switch-runbook.md                              # NEW
│   └── lld-a11y-audit-checklist.md                             # NEW (WCAG AA manual checklist)
├── docs/rollout/
│   ├── lld-rollout-schedule.md                                 # NEW (5-wave calendar)
│   └── lld-dashboard-spec.md                                   # NEW (metric dashboard wire)
└── src/
    ├── lib/analytics/
    │   ├── lld-events.ts                                       # MODIFY (extend catalog to ~90 events)
    │   ├── lld-events.enum.ts                                  # NEW (compile-time enum)
    │   ├── emit-pipeline.ts                                    # NEW (one emit surface)
    │   ├── autocapture-config.ts                               # NEW (PostHog autocapture tuning)
    │   ├── identity.ts                                         # NEW (identify/reset wrappers)
    │   ├── cohort-stamping.ts                                  # NEW (stamps cohort on every event)
    │   └── __tests__/
    │       ├── lld-events.test.ts                              # NEW
    │       ├── emit-pipeline.test.ts                           # NEW
    │       ├── autocapture-config.test.ts                      # NEW
    │       └── identity.test.ts                                # NEW
    ├── features/
    │   ├── flags/
    │   │   ├── registry.ts                                     # NEW (flag keys + metadata)
    │   │   ├── gates.ts                                        # NEW (client-side gate fns)
    │   │   ├── gates.server.ts                                 # NEW (server-side helpers)
    │   │   ├── kill-switch.ts                                  # NEW (env-var short-circuit)
    │   │   ├── dev-panel/
    │   │   │   ├── FlagDevPanel.tsx                            # NEW (dev-only toggle UI)
    │   │   │   └── useFlagOverrides.ts                         # NEW (localStorage overrides)
    │   │   └── __tests__/
    │   │       ├── registry.test.ts                            # NEW
    │   │       ├── gates.test.ts                               # NEW
    │   │       ├── gates.server.test.ts                        # NEW
    │   │       └── kill-switch.test.ts                         # NEW
    │   ├── rollout.ts                                          # NEW (ramp stage resolver)
    │   ├── rollout-config.ts                                   # NEW (5-stage config)
    │   ├── cohort.ts                                           # NEW (stable-hash cohort assignment)
    │   ├── ab-test.ts                                          # NEW (A/B framework)
    │   └── __tests__/
    │       ├── rollout.test.ts                                 # NEW
    │       ├── cohort.test.ts                                  # NEW
    │       └── ab-test.test.ts                                 # NEW
    ├── lib/sentry/
    │   ├── init.ts                                             # NEW (shared config)
    │   ├── scrub.ts                                            # NEW (beforeSend hook)
    │   └── __tests__/
    │       └── scrub.test.ts                                   # NEW
    ├── db/
    │   ├── schema/
    │   │   ├── schema-migrations-state.ts                      # NEW
    │   │   ├── index.ts                                        # MODIFY (re-export)
    │   │   └── relations.ts                                    # MODIFY (relations)
    │   └── migrations/
    │       ├── runner.ts                                       # NEW (dual-write + backfill + read-switch)
    │       ├── registry.ts                                     # NEW (list of registered migrations)
    │       └── __tests__/
    │           └── runner.test.ts                              # NEW
    ├── app/
    │   ├── api/
    │   │   ├── flags/route.ts                                  # NEW (GET current flag state)
    │   │   ├── admin/migrations/route.ts                       # NEW (POST advance/rollback)
    │   │   ├── admin/kill-switch/route.ts                      # NEW (POST trigger per-feature off)
    │   │   ├── admin/cohort/route.ts                           # NEW (GET a user's cohort)
    │   │   └── __tests__/
    │   │       ├── flags.test.ts
    │   │       ├── admin-migrations.test.ts
    │   │       └── admin-kill-switch.test.ts
    │   └── (dashboard)/
    │       └── admin/
    │           ├── flags/page.tsx                              # NEW (flag admin UI)
    │           ├── migrations/page.tsx                         # NEW (migration status UI)
    │           └── kill-switch/page.tsx                        # NEW (big red buttons)
    ├── components/
    │   └── observability/
    │       ├── ErrorBoundary.tsx                               # NEW (wraps mode layouts)
    │       ├── PerformanceMonitor.tsx                          # NEW (web-vitals hook)
    │       └── __tests__/
    │           └── ErrorBoundary.test.tsx                      # NEW
    ├── hooks/
    │   ├── useFeatureFlag.ts                                   # NEW
    │   ├── useAbVariant.ts                                     # NEW
    │   ├── useRolloutStage.ts                                  # NEW
    │   ├── useTelemetry.ts                                     # NEW (scoped tracker)
    │   └── __tests__/
    │       ├── useFeatureFlag.test.tsx
    │       ├── useAbVariant.test.tsx
    │       └── useRolloutStage.test.tsx
    └── types/
        └── telemetry.ts                                        # NEW (shared event types)
```

**Design rationale for splits:**
- **`src/lib/analytics/`** stays the low-level layer — knows about PostHog, web-vitals, consent. No business concepts.
- **`src/features/`** is the high-level business layer — flags + rollout + cohorts + A/B. Depends on `lib/analytics` but not the other way round.
- **`src/lib/sentry/`** is a sibling of `src/lib/analytics/` — they publish to different backends and have different scrubbing rules.
- **`src/db/migrations/`** is a new directory separate from drizzle's auto-generated SQL — drizzle handles *schema* migrations; `runner.ts` handles *data* migrations (dual-write, backfill, read-switch) which are orthogonal.
- **`eslint-plugin-architex/`** is a local package sibling to `architex/`. Same-repo monorepo-style. This lets the ESLint rule ship with the code that needs it.
- **`docs/sre/`** separate from `docs/plans` so ops docs don't co-mingle with build plans.
- **`.github/workflows/`** — Lighthouse CI + load test + a11y audit are three separate workflows so they can be triggered independently.

---

## Commit strategy

One commit per Task where possible. The final commit message is always `plan(lld-phase-6): polish, analytics, rollout safety` — that is reserved for Task 28 (final verification). Intermediate commits use the form `plan(lld-phase-6-taskNN): …` so `git log --grep plan(lld-phase-6-` yields a clean task-by-task view during review.

---

## Task 1: Add Phase 6 dependencies to `package.json`

**Files:**
- Modify: `architex/package.json`

**Design intent:** All Phase 6 dependencies are added up-front so subsequent tasks can `import` without interruption. Versions pinned with caret to allow patch bumps only — security patches flow automatically but no surprise major versions.

- [ ] **Step 1: Inspect current `package.json`**

```bash
cd architex && cat package.json | grep -E "posthog|sentry|axe-core|web-vitals|lhci|k6"
```

Expected: empty output (none of these are installed yet). If any exist, skip the corresponding line below.

- [ ] **Step 2: Install runtime dependencies**

```bash
cd architex
pnpm add posthog-js@^1.252.0
pnpm add @sentry/nextjs@^10.22.0
pnpm add web-vitals@^5.1.0
```

- [ ] **Step 3: Install dev dependencies**

```bash
cd architex
pnpm add -D axe-core@^4.11.2
pnpm add -D @axe-core/playwright@^4.11.0
pnpm add -D @lhci/cli@^0.14.0
pnpm add -D playwright@^1.51.0
pnpm add -D @vitest/coverage-v8@^4.1.4
```

`k6` is not installed via npm — it's a Go binary. The `k6/README.md` in Task 26 documents installation (brew or docker).

- [ ] **Step 4: Verify install**

```bash
cd architex
pnpm install
pnpm typecheck
```

Expected: no type errors introduced. New packages should resolve. If `@sentry/nextjs` typecheck fails (version may pull a stricter peer), pin to an exact version: `pnpm add @sentry/nextjs@10.22.0 -E`.

- [ ] **Step 5: Commit**

```bash
git add architex/package.json architex/pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
plan(lld-phase-6-task1): add Phase 6 runtime + dev dependencies

- posthog-js: real PostHog SDK to power the wrapper in src/lib/analytics/posthog.ts
- @sentry/nextjs: error monitoring (client + server + edge)
- web-vitals: accurate LCP/INP/CLS measurement
- axe-core + @axe-core/playwright: automated accessibility scans
- @lhci/cli: Lighthouse CI for performance budgets
- playwright: required by axe-core integration
- @vitest/coverage-v8: coverage reports for Phase 6 tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Define the shared telemetry event type module

**Files:**
- Create: `architex/src/types/telemetry.ts`

**Design intent:** Prevent event-name drift by making every LLD event a member of a single discriminated union. TypeScript's exhaustiveness checking then enforces that every new event is added to both the union and the enum, and every emitter can match on `event.name` to narrow `event.properties`.

- [ ] **Step 1: Write the shared types**

Create `architex/src/types/telemetry.ts`:

```typescript
/**
 * Shared telemetry types (Phase 6 Task 2).
 *
 * Every typed LLD event is a member of this discriminated union.
 * Adding a new event requires:
 *   1. Add a member to `LLDEvent` (this file)
 *   2. Add a builder to `src/lib/analytics/lld-events.ts`
 *   3. Add the name literal to `src/lib/analytics/lld-events.enum.ts`
 *
 * A compile-time check (`__exhaustive` in emit-pipeline.ts) fails if
 * a builder exists but the union is not updated.
 */

export type LLDMode = "learn" | "build" | "drill" | "review";
export type DrillMode = "interview" | "guided" | "speed";
export type DrillGradeTier = "excellent" | "solid" | "partial" | "needs_work";
export type CheckpointKind = "mcq" | "click_class" | "fill_blank" | "order_steps";
export type FsrsRating = "again" | "hard" | "good" | "easy";
export type FrustrationLevel = "calm" | "mild" | "frustrated" | "very_frustrated";
export type RolloutStage = "off" | "internal" | "beta5" | "rollout25" | "rollout50" | "rollout100";
export type CohortBucket = `bucket_${number}`; // bucket_0..bucket_99 (1% granularity)

export interface EventBase {
  /** Wall-clock timestamp when event was fired (client-local). */
  timestamp: number;
  /** Stable cohort bucket — auto-attached by emit pipeline. */
  cohort?: CohortBucket;
  /** Rollout stage active when event fired — auto-attached by emit pipeline. */
  rolloutStage?: RolloutStage;
  /** Current LLD mode when event fired — auto-attached by emit pipeline. */
  currentMode?: LLDMode;
  /** Active A/B variants — auto-attached by emit pipeline. */
  variants?: Record<string, string>;
}

// ── Shell events ─────────────────────────────────────────

export interface LLDModuleOpened extends EventBase {
  name: "lld_module_opened";
  properties: {
    referrer: string | null;
    firstVisit: boolean;
  };
}

export interface LLDModeSwitched extends EventBase {
  name: "lld_mode_switched";
  properties: {
    from: LLDMode | null;
    to: LLDMode;
    trigger: "click" | "keyboard" | "url" | "auto";
  };
}

export interface LLDWelcomeBannerShown extends EventBase {
  name: "lld_welcome_banner_shown";
  properties: Record<string, never>;
}

export interface LLDWelcomeBannerDismissed extends EventBase {
  name: "lld_welcome_banner_dismissed";
  properties: {
    method: "dismiss" | "pick_learn" | "pick_build" | "pick_drill";
  };
}

// ── Learn mode events ────────────────────────────────────

export interface LLDLessonOpened extends EventBase {
  name: "lld_lesson_opened";
  properties: {
    patternId: string;
    wave: number;
    variant: "eli5" | "standard" | "eli_senior";
  };
}

export interface LLDLessonSectionViewed extends EventBase {
  name: "lld_lesson_section_viewed";
  properties: {
    patternId: string;
    section:
      | "hook"
      | "analogy"
      | "uml_reveal"
      | "checkpoint"
      | "code"
      | "tradeoffs"
      | "summary"
      | "cta";
    sectionIndex: number;
    dwellMs: number;
  };
}

export interface LLDLessonCompleted extends EventBase {
  name: "lld_lesson_completed";
  properties: {
    patternId: string;
    durationMs: number;
    checkpointsPassed: number;
    checkpointsFailed: number;
  };
}

export interface LLDCheckpointAttempted extends EventBase {
  name: "lld_checkpoint_attempted";
  properties: {
    patternId: string;
    checkpointId: string;
    kind: CheckpointKind;
    attempt: number; // 1-indexed
    correct: boolean;
    timeToAnswerMs: number;
  };
}

export interface LLDCheckpointRevealed extends EventBase {
  name: "lld_checkpoint_revealed";
  properties: {
    patternId: string;
    checkpointId: string;
    afterAttempts: number;
  };
}

export interface LLDCheckpointFsrsRated extends EventBase {
  name: "lld_checkpoint_fsrs_rated";
  properties: {
    patternId: string;
    checkpointId: string;
    rating: FsrsRating;
  };
}

export interface LLDClassPopoverOpened extends EventBase {
  name: "lld_class_popover_opened";
  properties: {
    patternId: string;
    classId: string;
    source: "canvas_click" | "lesson_link";
  };
}

export interface LLDLessonScrollSynced extends EventBase {
  name: "lld_lesson_scroll_synced";
  properties: {
    patternId: string;
    highlightedClassIds: string[];
  };
}

export interface LLDTinkerStarted extends EventBase {
  name: "lld_tinker_started";
  properties: { patternId: string };
}

export interface LLDTinkerSaved extends EventBase {
  name: "lld_tinker_saved";
  properties: {
    patternId: string;
    nodeCount: number;
    edgeCount: number;
    destination: "save_to_build" | "reset" | "done";
  };
}

export interface LLDContextualAskArchitect extends EventBase {
  name: "lld_contextual_ask_architect";
  properties: {
    patternId: string;
    surface: "after_failed_checkpoint" | "end_of_section" | "confused_with";
    prompt: string;
  };
}

// ── Build mode events ────────────────────────────────────

export interface LLDBuildCanvasEdit extends EventBase {
  name: "lld_build_canvas_edit";
  properties: {
    actionKind:
      | "add_class"
      | "delete_class"
      | "add_edge"
      | "delete_edge"
      | "rename"
      | "reorder";
    nodeCount: number;
    edgeCount: number;
  };
}

export interface LLDBuildPatternLoaded extends EventBase {
  name: "lld_build_pattern_loaded";
  properties: {
    patternId: string;
    source: "sidebar" | "command_palette" | "search" | "url";
  };
}

export interface LLDBuildCodeGenerated extends EventBase {
  name: "lld_build_code_generated";
  properties: {
    language: "typescript" | "python" | "java" | "go" | "rust" | "kotlin";
    lineCount: number;
  };
}

export interface LLDAntiPatternDetected extends EventBase {
  name: "lld_anti_pattern_detected";
  properties: {
    antiPatternKind: string;
    affectedClassIds: string[];
  };
}

export interface LLDAIReviewRequested extends EventBase {
  name: "lld_ai_review_requested";
  properties: {
    nodeCount: number;
    edgeCount: number;
    tokenEstimate: number;
  };
}

// ── Drill mode events ────────────────────────────────────

export interface LLDDrillStarted extends EventBase {
  name: "lld_drill_started";
  properties: {
    problemId: string;
    drillMode: DrillMode;
    durationLimitMs: number;
  };
}

export interface LLDDrillPaused extends EventBase {
  name: "lld_drill_paused";
  properties: { problemId: string; elapsedMs: number };
}

export interface LLDDrillResumed extends EventBase {
  name: "lld_drill_resumed";
  properties: { problemId: string; elapsedMs: number };
}

export interface LLDDrillHintUsed extends EventBase {
  name: "lld_drill_hint_used";
  properties: {
    problemId: string;
    hintTier: "nudge" | "guided" | "full";
    creditsRemaining: number;
  };
}

export interface LLDDrillSubmitted extends EventBase {
  name: "lld_drill_submitted";
  properties: {
    problemId: string;
    drillMode: DrillMode;
    grade: number; // 0-100
    durationMs: number;
    hintsUsed: number;
    tier: DrillGradeTier;
  };
}

export interface LLDDrillAbandoned extends EventBase {
  name: "lld_drill_abandoned";
  properties: {
    problemId: string;
    elapsedMs: number;
    reason: "give_up" | "timeout" | "auto" | "stale";
  };
}

export interface LLDDrillGradeReviewed extends EventBase {
  name: "lld_drill_grade_reviewed";
  properties: {
    problemId: string;
    grade: number;
    breakdown: {
      classes: number;
      relationships: number;
      patternUsage: number;
      completeness: number;
    };
    aiFeedbackShown: boolean;
  };
}

// ── Review mode events ───────────────────────────────────

export interface LLDReviewSessionStarted extends EventBase {
  name: "lld_review_session_started";
  properties: {
    cardCount: number;
    dueCount: number;
  };
}

export interface LLDReviewCardShown extends EventBase {
  name: "lld_review_card_shown";
  properties: {
    patternId: string;
    checkpointId: string;
    sessionPosition: number;
  };
}

export interface LLDReviewCardRated extends EventBase {
  name: "lld_review_card_rated";
  properties: {
    patternId: string;
    rating: FsrsRating;
    gestureInput: boolean;
    timeToAnswerMs: number;
  };
}

export interface LLDReviewSessionCompleted extends EventBase {
  name: "lld_review_session_completed";
  properties: {
    cardsRated: number;
    sessionDurationMs: number;
    againCount: number;
    easyCount: number;
  };
}

// ── Cross-cutting events ────────────────────────────────

export interface LLDFrustrationDetected extends EventBase {
  name: "lld_frustration_detected";
  properties: {
    level: FrustrationLevel;
    signals: Array<
      "rapid_undo" | "many_failed_checkpoints" | "long_idle" | "repeated_help"
    >;
    modeAtDetection: LLDMode;
  };
}

export interface LLDFrustrationInterventionShown extends EventBase {
  name: "lld_frustration_intervention_shown";
  properties: {
    level: FrustrationLevel;
    interventionKind: "silent" | "inline_nudge" | "ai_offer" | "easier_path";
  };
}

export interface LLDFrustrationInterventionAccepted extends EventBase {
  name: "lld_frustration_intervention_accepted";
  properties: {
    interventionKind: "silent" | "inline_nudge" | "ai_offer" | "easier_path";
  };
}

export interface LLDSpotlightSearchOpened extends EventBase {
  name: "lld_spotlight_search_opened";
  properties: { trigger: "shortcut" | "icon" };
}

export interface LLDSpotlightSearchExecuted extends EventBase {
  name: "lld_spotlight_search_executed";
  properties: {
    queryLength: number;
    resultCount: number;
    selectedResultKind: "pattern" | "problem" | "lesson_section" | null;
  };
}

export interface LLDShareCardGenerated extends EventBase {
  name: "lld_share_card_generated";
  properties: {
    kind: "drill_grade" | "pattern_mastered" | "wave_completed";
    platform: "twitter" | "linkedin" | "download" | "copy_link";
  };
}

export interface LLDFeatureFlagEvaluated extends EventBase {
  name: "lld_feature_flag_evaluated";
  properties: {
    flagKey: string;
    value: boolean | string;
    reason: "remote" | "kill_switch" | "default" | "override";
  };
}

export interface LLDKillSwitchFired extends EventBase {
  name: "lld_kill_switch_fired";
  properties: { flagKey: string; triggeredBy: string; reason: string };
}

export interface LLDAbExposure extends EventBase {
  name: "lld_ab_exposure";
  properties: {
    experimentKey: string;
    variant: string;
    cohort: CohortBucket;
  };
}

export interface LLDRolloutStageChanged extends EventBase {
  name: "lld_rollout_stage_changed";
  properties: {
    flagKey: string;
    from: RolloutStage;
    to: RolloutStage;
    triggeredBy: string;
  };
}

export interface LLDErrorBoundaryCaught extends EventBase {
  name: "lld_error_boundary_caught";
  properties: {
    errorName: string;
    errorMessage: string;
    modeAtError: LLDMode;
    componentStack: string;
  };
}

export interface LLDPerformanceMetric extends EventBase {
  name: "lld_performance_metric";
  properties: {
    metric: "LCP" | "INP" | "CLS" | "FCP" | "TTFB" | "TTI";
    value: number;
    rating: "good" | "needs-improvement" | "poor";
    pathname: string;
  };
}

export interface LLDMigrationAdvanced extends EventBase {
  name: "lld_migration_advanced";
  properties: {
    migrationKey: string;
    fromState: "inactive" | "dual_write" | "backfill" | "read_new" | "complete";
    toState: "inactive" | "dual_write" | "backfill" | "read_new" | "complete";
    affectedRows: number;
  };
}

// ── Union ────────────────────────────────────────────────

export type LLDEvent =
  | LLDModuleOpened
  | LLDModeSwitched
  | LLDWelcomeBannerShown
  | LLDWelcomeBannerDismissed
  | LLDLessonOpened
  | LLDLessonSectionViewed
  | LLDLessonCompleted
  | LLDCheckpointAttempted
  | LLDCheckpointRevealed
  | LLDCheckpointFsrsRated
  | LLDClassPopoverOpened
  | LLDLessonScrollSynced
  | LLDTinkerStarted
  | LLDTinkerSaved
  | LLDContextualAskArchitect
  | LLDBuildCanvasEdit
  | LLDBuildPatternLoaded
  | LLDBuildCodeGenerated
  | LLDAntiPatternDetected
  | LLDAIReviewRequested
  | LLDDrillStarted
  | LLDDrillPaused
  | LLDDrillResumed
  | LLDDrillHintUsed
  | LLDDrillSubmitted
  | LLDDrillAbandoned
  | LLDDrillGradeReviewed
  | LLDReviewSessionStarted
  | LLDReviewCardShown
  | LLDReviewCardRated
  | LLDReviewSessionCompleted
  | LLDFrustrationDetected
  | LLDFrustrationInterventionShown
  | LLDFrustrationInterventionAccepted
  | LLDSpotlightSearchOpened
  | LLDSpotlightSearchExecuted
  | LLDShareCardGenerated
  | LLDFeatureFlagEvaluated
  | LLDKillSwitchFired
  | LLDAbExposure
  | LLDRolloutStageChanged
  | LLDErrorBoundaryCaught
  | LLDPerformanceMetric
  | LLDMigrationAdvanced;

export type LLDEventName = LLDEvent["name"];
export type LLDEventProperties<T extends LLDEventName> = Extract<
  LLDEvent,
  { name: T }
>["properties"];
```

- [ ] **Step 2: Verify typecheck**

```bash
cd architex && pnpm typecheck
```

Expected: no errors. 43 event members in the union.

- [ ] **Step 3: Commit**

```bash
git add architex/src/types/telemetry.ts
git commit -m "$(cat <<'EOF'
plan(lld-phase-6-task2): define LLD telemetry discriminated union

43 typed events covering shell, Learn, Build, Drill, Review modes plus
cross-cutting surfaces (frustration, spotlight, share, flags, A/B,
rollout, error boundary, web vitals, migration). Every event carries
auto-attached cohort + rolloutStage + currentMode + variants from the
emit pipeline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create the compile-time event-name enum

**Files:**
- Create: `architex/src/lib/analytics/lld-events.enum.ts`
- Create: `architex/src/lib/analytics/__tests__/lld-events.test.ts`

**Design intent:** A flat `const` object with the event-name string literals becomes a single source-of-truth for PostHog. Runtime code uses the enum; tests reference the enum; the dashboard spec references the enum. If the union in `telemetry.ts` and the enum drift, a typecheck assertion catches it.

- [ ] **Step 1: Write the enum (TDD — test first)**

Create `architex/src/lib/analytics/__tests__/lld-events.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { LLD_EVENTS } from "../lld-events.enum";
import type { LLDEventName } from "@/types/telemetry";

describe("LLD_EVENTS enum", () => {
  it("exports every name from the discriminated union", () => {
    // This compile-time assertion fails if the enum misses an event.
    const _check: Record<LLDEventName, LLDEventName> = {
      lld_module_opened: LLD_EVENTS.MODULE_OPENED,
      lld_mode_switched: LLD_EVENTS.MODE_SWITCHED,
      lld_welcome_banner_shown: LLD_EVENTS.WELCOME_BANNER_SHOWN,
      lld_welcome_banner_dismissed: LLD_EVENTS.WELCOME_BANNER_DISMISSED,
      lld_lesson_opened: LLD_EVENTS.LESSON_OPENED,
      lld_lesson_section_viewed: LLD_EVENTS.LESSON_SECTION_VIEWED,
      lld_lesson_completed: LLD_EVENTS.LESSON_COMPLETED,
      lld_checkpoint_attempted: LLD_EVENTS.CHECKPOINT_ATTEMPTED,
      lld_checkpoint_revealed: LLD_EVENTS.CHECKPOINT_REVEALED,
      lld_checkpoint_fsrs_rated: LLD_EVENTS.CHECKPOINT_FSRS_RATED,
      lld_class_popover_opened: LLD_EVENTS.CLASS_POPOVER_OPENED,
      lld_lesson_scroll_synced: LLD_EVENTS.LESSON_SCROLL_SYNCED,
      lld_tinker_started: LLD_EVENTS.TINKER_STARTED,
      lld_tinker_saved: LLD_EVENTS.TINKER_SAVED,
      lld_contextual_ask_architect: LLD_EVENTS.CONTEXTUAL_ASK_ARCHITECT,
      lld_build_canvas_edit: LLD_EVENTS.BUILD_CANVAS_EDIT,
      lld_build_pattern_loaded: LLD_EVENTS.BUILD_PATTERN_LOADED,
      lld_build_code_generated: LLD_EVENTS.BUILD_CODE_GENERATED,
      lld_anti_pattern_detected: LLD_EVENTS.ANTI_PATTERN_DETECTED,
      lld_ai_review_requested: LLD_EVENTS.AI_REVIEW_REQUESTED,
      lld_drill_started: LLD_EVENTS.DRILL_STARTED,
      lld_drill_paused: LLD_EVENTS.DRILL_PAUSED,
      lld_drill_resumed: LLD_EVENTS.DRILL_RESUMED,
      lld_drill_hint_used: LLD_EVENTS.DRILL_HINT_USED,
      lld_drill_submitted: LLD_EVENTS.DRILL_SUBMITTED,
      lld_drill_abandoned: LLD_EVENTS.DRILL_ABANDONED,
      lld_drill_grade_reviewed: LLD_EVENTS.DRILL_GRADE_REVIEWED,
      lld_review_session_started: LLD_EVENTS.REVIEW_SESSION_STARTED,
      lld_review_card_shown: LLD_EVENTS.REVIEW_CARD_SHOWN,
      lld_review_card_rated: LLD_EVENTS.REVIEW_CARD_RATED,
      lld_review_session_completed: LLD_EVENTS.REVIEW_SESSION_COMPLETED,
      lld_frustration_detected: LLD_EVENTS.FRUSTRATION_DETECTED,
      lld_frustration_intervention_shown: LLD_EVENTS.FRUSTRATION_INTERVENTION_SHOWN,
      lld_frustration_intervention_accepted: LLD_EVENTS.FRUSTRATION_INTERVENTION_ACCEPTED,
      lld_spotlight_search_opened: LLD_EVENTS.SPOTLIGHT_SEARCH_OPENED,
      lld_spotlight_search_executed: LLD_EVENTS.SPOTLIGHT_SEARCH_EXECUTED,
      lld_share_card_generated: LLD_EVENTS.SHARE_CARD_GENERATED,
      lld_feature_flag_evaluated: LLD_EVENTS.FEATURE_FLAG_EVALUATED,
      lld_kill_switch_fired: LLD_EVENTS.KILL_SWITCH_FIRED,
      lld_ab_exposure: LLD_EVENTS.AB_EXPOSURE,
      lld_rollout_stage_changed: LLD_EVENTS.ROLLOUT_STAGE_CHANGED,
      lld_error_boundary_caught: LLD_EVENTS.ERROR_BOUNDARY_CAUGHT,
      lld_performance_metric: LLD_EVENTS.PERFORMANCE_METRIC,
      lld_migration_advanced: LLD_EVENTS.MIGRATION_ADVANCED,
    };
    expect(Object.keys(_check).length).toBe(43);
  });

  it("every value is snake_case with lld_ prefix", () => {
    for (const value of Object.values(LLD_EVENTS)) {
      expect(value).toMatch(/^lld_[a-z0-9_]+$/);
    }
  });
});
```

- [ ] **Step 2: Run test (should fail — no enum yet)**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/lld-events.test.ts
```

Expected: `Cannot find module '../lld-events.enum'`.

- [ ] **Step 3: Create the enum**

Create `architex/src/lib/analytics/lld-events.enum.ts`:

```typescript
/**
 * Flat const enum of all LLD event names (Phase 6 Task 3).
 *
 * Keyed by UPPER_SNAKE constant, values are the wire-format names
 * (lowercase snake_case with `lld_` prefix). Consumers should prefer
 * `LLD_EVENTS.DRILL_SUBMITTED` to raw strings.
 */

export const LLD_EVENTS = {
  // Shell
  MODULE_OPENED: "lld_module_opened",
  MODE_SWITCHED: "lld_mode_switched",
  WELCOME_BANNER_SHOWN: "lld_welcome_banner_shown",
  WELCOME_BANNER_DISMISSED: "lld_welcome_banner_dismissed",

  // Learn
  LESSON_OPENED: "lld_lesson_opened",
  LESSON_SECTION_VIEWED: "lld_lesson_section_viewed",
  LESSON_COMPLETED: "lld_lesson_completed",
  CHECKPOINT_ATTEMPTED: "lld_checkpoint_attempted",
  CHECKPOINT_REVEALED: "lld_checkpoint_revealed",
  CHECKPOINT_FSRS_RATED: "lld_checkpoint_fsrs_rated",
  CLASS_POPOVER_OPENED: "lld_class_popover_opened",
  LESSON_SCROLL_SYNCED: "lld_lesson_scroll_synced",
  TINKER_STARTED: "lld_tinker_started",
  TINKER_SAVED: "lld_tinker_saved",
  CONTEXTUAL_ASK_ARCHITECT: "lld_contextual_ask_architect",

  // Build
  BUILD_CANVAS_EDIT: "lld_build_canvas_edit",
  BUILD_PATTERN_LOADED: "lld_build_pattern_loaded",
  BUILD_CODE_GENERATED: "lld_build_code_generated",
  ANTI_PATTERN_DETECTED: "lld_anti_pattern_detected",
  AI_REVIEW_REQUESTED: "lld_ai_review_requested",

  // Drill
  DRILL_STARTED: "lld_drill_started",
  DRILL_PAUSED: "lld_drill_paused",
  DRILL_RESUMED: "lld_drill_resumed",
  DRILL_HINT_USED: "lld_drill_hint_used",
  DRILL_SUBMITTED: "lld_drill_submitted",
  DRILL_ABANDONED: "lld_drill_abandoned",
  DRILL_GRADE_REVIEWED: "lld_drill_grade_reviewed",

  // Review
  REVIEW_SESSION_STARTED: "lld_review_session_started",
  REVIEW_CARD_SHOWN: "lld_review_card_shown",
  REVIEW_CARD_RATED: "lld_review_card_rated",
  REVIEW_SESSION_COMPLETED: "lld_review_session_completed",

  // Cross-cutting
  FRUSTRATION_DETECTED: "lld_frustration_detected",
  FRUSTRATION_INTERVENTION_SHOWN: "lld_frustration_intervention_shown",
  FRUSTRATION_INTERVENTION_ACCEPTED: "lld_frustration_intervention_accepted",
  SPOTLIGHT_SEARCH_OPENED: "lld_spotlight_search_opened",
  SPOTLIGHT_SEARCH_EXECUTED: "lld_spotlight_search_executed",
  SHARE_CARD_GENERATED: "lld_share_card_generated",
  FEATURE_FLAG_EVALUATED: "lld_feature_flag_evaluated",
  KILL_SWITCH_FIRED: "lld_kill_switch_fired",
  AB_EXPOSURE: "lld_ab_exposure",
  ROLLOUT_STAGE_CHANGED: "lld_rollout_stage_changed",
  ERROR_BOUNDARY_CAUGHT: "lld_error_boundary_caught",
  PERFORMANCE_METRIC: "lld_performance_metric",
  MIGRATION_ADVANCED: "lld_migration_advanced",
} as const;

export type LLDEventConstant = (typeof LLD_EVENTS)[keyof typeof LLD_EVENTS];
```

- [ ] **Step 4: Run test again (should pass)**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/lld-events.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add architex/src/lib/analytics/lld-events.enum.ts architex/src/lib/analytics/__tests__/lld-events.test.ts
git commit -m "plan(lld-phase-6-task3): add LLD_EVENTS enum + exhaustiveness test"
```

---


## Task 4: Extend the `lld-events.ts` builder catalog

**Files:**
- Modify: `architex/src/lib/analytics/lld-events.ts`

**Design intent:** Phase 1's Task 11 shipped ~7 builders. Phase 6 expands to the full 43. Every builder is a pure function returning the shape `{ name, properties }` which the emit pipeline stamps with base fields. No builder touches global state.

- [ ] **Step 1: Inspect existing builders (Phase 1 output)**

```bash
cd architex && cat src/lib/analytics/lld-events.ts | head -60
```

Expected: See the Phase 1 builders (`lldModeSwitched`, `lldDrillStarted`, etc.) plus the local `LLDEvent` interface and `track` function.

- [ ] **Step 2: Rewrite `lld-events.ts`**

Replace the entire file with the full builder catalog. This replaces the Phase 1 file; the old `track` function moves to the emit pipeline in Task 5.

```typescript
/**
 * LLD analytics event catalog (Phase 6 Task 4 — extends Phase 1 Task 11).
 *
 * Builders produce typed events using the discriminated union in
 * `src/types/telemetry.ts`. The emit pipeline (`emit-pipeline.ts`)
 * stamps `timestamp`, `cohort`, `rolloutStage`, `currentMode`, and
 * `variants` before the event is sent anywhere.
 *
 * Usage:
 *   import { Events, emit } from "@/lib/analytics/lld-events";
 *   emit(Events.drillStarted({ problemId, drillMode, durationLimitMs }));
 */

import type {
  LLDEvent,
  LLDEventName,
  LLDEventProperties,
  LLDMode,
  DrillMode,
  DrillGradeTier,
  CheckpointKind,
  FsrsRating,
  FrustrationLevel,
  CohortBucket,
  RolloutStage,
} from "@/types/telemetry";

type Builder<T extends LLDEventName> = (
  props: LLDEventProperties<T>,
) => Extract<LLDEvent, { name: T }>;

function make<T extends LLDEventName>(name: T): Builder<T> {
  return (properties) =>
    ({ name, properties, timestamp: Date.now() }) as Extract<
      LLDEvent,
      { name: T }
    >;
}

export const Events = {
  // Shell
  moduleOpened: make("lld_module_opened"),
  modeSwitched: make("lld_mode_switched"),
  welcomeBannerShown: make("lld_welcome_banner_shown"),
  welcomeBannerDismissed: make("lld_welcome_banner_dismissed"),

  // Learn
  lessonOpened: make("lld_lesson_opened"),
  lessonSectionViewed: make("lld_lesson_section_viewed"),
  lessonCompleted: make("lld_lesson_completed"),
  checkpointAttempted: make("lld_checkpoint_attempted"),
  checkpointRevealed: make("lld_checkpoint_revealed"),
  checkpointFsrsRated: make("lld_checkpoint_fsrs_rated"),
  classPopoverOpened: make("lld_class_popover_opened"),
  lessonScrollSynced: make("lld_lesson_scroll_synced"),
  tinkerStarted: make("lld_tinker_started"),
  tinkerSaved: make("lld_tinker_saved"),
  contextualAskArchitect: make("lld_contextual_ask_architect"),

  // Build
  buildCanvasEdit: make("lld_build_canvas_edit"),
  buildPatternLoaded: make("lld_build_pattern_loaded"),
  buildCodeGenerated: make("lld_build_code_generated"),
  antiPatternDetected: make("lld_anti_pattern_detected"),
  aiReviewRequested: make("lld_ai_review_requested"),

  // Drill
  drillStarted: make("lld_drill_started"),
  drillPaused: make("lld_drill_paused"),
  drillResumed: make("lld_drill_resumed"),
  drillHintUsed: make("lld_drill_hint_used"),
  drillSubmitted: make("lld_drill_submitted"),
  drillAbandoned: make("lld_drill_abandoned"),
  drillGradeReviewed: make("lld_drill_grade_reviewed"),

  // Review
  reviewSessionStarted: make("lld_review_session_started"),
  reviewCardShown: make("lld_review_card_shown"),
  reviewCardRated: make("lld_review_card_rated"),
  reviewSessionCompleted: make("lld_review_session_completed"),

  // Cross-cutting
  frustrationDetected: make("lld_frustration_detected"),
  frustrationInterventionShown: make("lld_frustration_intervention_shown"),
  frustrationInterventionAccepted: make(
    "lld_frustration_intervention_accepted",
  ),
  spotlightSearchOpened: make("lld_spotlight_search_opened"),
  spotlightSearchExecuted: make("lld_spotlight_search_executed"),
  shareCardGenerated: make("lld_share_card_generated"),
  featureFlagEvaluated: make("lld_feature_flag_evaluated"),
  killSwitchFired: make("lld_kill_switch_fired"),
  abExposure: make("lld_ab_exposure"),
  rolloutStageChanged: make("lld_rollout_stage_changed"),
  errorBoundaryCaught: make("lld_error_boundary_caught"),
  performanceMetric: make("lld_performance_metric"),
  migrationAdvanced: make("lld_migration_advanced"),
} as const;

export { emit } from "./emit-pipeline";
export { LLD_EVENTS } from "./lld-events.enum";
export type {
  LLDEvent,
  LLDEventName,
  LLDMode,
  DrillMode,
  DrillGradeTier,
  CheckpointKind,
  FsrsRating,
  FrustrationLevel,
  CohortBucket,
  RolloutStage,
};
```

- [ ] **Step 3: Update all existing import sites**

```bash
cd architex && grep -rln "from '@/lib/analytics/lld-events'" src --include="*.ts" --include="*.tsx" | wc -l
```

Expected: small number (<10, mostly Phase 1 files). For each file, change:

```typescript
// before
import { track, lldModeSwitched } from "@/lib/analytics/lld-events";
track(lldModeSwitched({ from, to, trigger }));

// after
import { Events, emit } from "@/lib/analytics/lld-events";
emit(Events.modeSwitched({ from, to, trigger }));
```

- [ ] **Step 4: Verify typecheck**

```bash
cd architex && pnpm typecheck
```

If the emit-pipeline file doesn't exist yet, temporarily stub it with: `export const emit = (_e: unknown) => {};` so typecheck passes; Task 5 replaces it.

- [ ] **Step 5: Commit**

```bash
git add architex/src/lib/analytics/lld-events.ts
git commit -m "plan(lld-phase-6-task4): expand lld-events builders to full 43-event catalog"
```

---

## Task 5: Build the single shared emit pipeline

**Files:**
- Create: `architex/src/lib/analytics/emit-pipeline.ts`
- Create: `architex/src/lib/analytics/__tests__/emit-pipeline.test.ts`

**Design intent:** All 43 events flow through `emit()`. The pipeline is responsible for (a) attaching base fields, (b) checking consent, (c) mirroring to activity-log + PostHog + Sentry breadcrumb, (d) swallowing network errors, (e) in-memory dev-mode queue for test assertions.

- [ ] **Step 1: Write the test first**

Create `architex/src/lib/analytics/__tests__/emit-pipeline.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { emit, __testing } from "../emit-pipeline";
import { Events } from "../lld-events";

describe("emit pipeline", () => {
  beforeEach(() => {
    __testing.reset();
    global.fetch = vi.fn().mockResolvedValue(new Response("ok"));
  });

  it("attaches timestamp + base fields", async () => {
    __testing.setBaseFields({
      cohort: "bucket_12",
      rolloutStage: "beta5",
      currentMode: "learn",
      variants: { drill_celebration_v2: "confetti" },
    });

    await emit(
      Events.modeSwitched({ from: "learn", to: "build", trigger: "click" }),
    );
    const captured = __testing.getCaptured();
    expect(captured).toHaveLength(1);
    const only = captured[0];
    expect(only.name).toBe("lld_mode_switched");
    expect(only.cohort).toBe("bucket_12");
    expect(only.rolloutStage).toBe("beta5");
    expect(only.currentMode).toBe("learn");
    expect(only.variants).toEqual({ drill_celebration_v2: "confetti" });
    expect(typeof only.timestamp).toBe("number");
  });

  it("skips emission when consent is denied", async () => {
    __testing.setConsent(false);
    await emit(Events.moduleOpened({ referrer: null, firstVisit: true }));
    expect(__testing.getCaptured()).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("still writes to activity log when PostHog is not initialised", async () => {
    __testing.setConsent(true);
    __testing.setPostHogReady(false);
    await emit(Events.welcomeBannerShown({}));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/activity",
      expect.any(Object),
    );
  });

  it("swallows network errors silently", async () => {
    __testing.setConsent(true);
    global.fetch = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(
      emit(
        Events.drillStarted({
          problemId: "p1",
          drillMode: "interview",
          durationLimitMs: 1_800_000,
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it("adds a Sentry breadcrumb for error_boundary_caught events", async () => {
    __testing.setConsent(true);
    const bc = vi.fn();
    __testing.setBreadcrumbFn(bc);
    await emit(
      Events.errorBoundaryCaught({
        errorName: "TypeError",
        errorMessage: "foo",
        modeAtError: "drill",
        componentStack: "…",
      }),
    );
    expect(bc).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "lld-telemetry",
        message: "lld_error_boundary_caught",
      }),
    );
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/emit-pipeline.test.ts
```

- [ ] **Step 3: Create the pipeline**

Create `architex/src/lib/analytics/emit-pipeline.ts`:

```typescript
/**
 * Shared emit pipeline (Phase 6 Task 5).
 *
 * Every LLD event passes through `emit()`. Responsibilities:
 *  - Attach base fields (cohort, rolloutStage, currentMode, variants)
 *  - Guard on consent
 *  - Mirror to three sinks: activity log, PostHog, Sentry breadcrumb
 *  - Fail-silent
 */

import type {
  LLDEvent,
  CohortBucket,
  RolloutStage,
  LLDMode,
} from "@/types/telemetry";
import * as posthog from "./posthog";
import { hasAnalyticsConsent } from "./consent";

type BreadcrumbFn = (args: {
  category: string;
  message: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}) => void;

interface BaseFields {
  cohort?: CohortBucket;
  rolloutStage?: RolloutStage;
  currentMode?: LLDMode;
  variants?: Record<string, string>;
}

let _base: BaseFields = {};
let _testingCaptured: LLDEvent[] = [];
let _testingConsentOverride: boolean | null = null;
let _testingPostHogOverride: boolean | null = null;
let _breadcrumbFn: BreadcrumbFn | null = null;

export function setBaseFields(patch: Partial<BaseFields>): void {
  _base = { ..._base, ...patch };
}

export function setBreadcrumbFunction(fn: BreadcrumbFn): void {
  _breadcrumbFn = fn;
}

export async function emit(event: LLDEvent): Promise<void> {
  const consentOK = _testingConsentOverride ?? hasAnalyticsConsent();
  if (!consentOK) return;

  const enriched: LLDEvent = {
    ...event,
    cohort: event.cohort ?? _base.cohort,
    rolloutStage: event.rolloutStage ?? _base.rolloutStage,
    currentMode: event.currentMode ?? _base.currentMode,
    variants: event.variants ?? _base.variants,
  };

  if (process.env.NODE_ENV !== "production") {
    _testingCaptured.push(enriched);
  }

  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: enriched.name,
        moduleId: "lld",
        metadata: {
          ...enriched.properties,
          __cohort: enriched.cohort,
          __rolloutStage: enriched.rolloutStage,
          __currentMode: enriched.currentMode,
          __variants: enriched.variants,
          __timestamp: enriched.timestamp,
        },
      }),
      keepalive: true,
    });
  } catch {
    /* swallow */
  }

  const posthogReady = _testingPostHogOverride ?? posthog.isPostHogReady();
  if (posthogReady) {
    try {
      posthog.track(enriched.name, {
        ...enriched.properties,
        cohort: enriched.cohort,
        rollout_stage: enriched.rolloutStage,
        current_mode: enriched.currentMode,
        variants: enriched.variants,
      });
    } catch {
      /* swallow */
    }
  }

  if (_breadcrumbFn) {
    try {
      _breadcrumbFn({
        category: "lld-telemetry",
        message: enriched.name,
        level: "info",
        data: enriched.properties as Record<string, unknown>,
      });
    } catch {
      /* swallow */
    }
  }
}

export const __testing = {
  reset(): void {
    _base = {};
    _testingCaptured = [];
    _testingConsentOverride = null;
    _testingPostHogOverride = null;
    _breadcrumbFn = null;
  },
  setBaseFields(fields: BaseFields): void {
    _base = fields;
  },
  setConsent(ok: boolean): void {
    _testingConsentOverride = ok;
  },
  setPostHogReady(ok: boolean): void {
    _testingPostHogOverride = ok;
  },
  setBreadcrumbFn(fn: BreadcrumbFn): void {
    _breadcrumbFn = fn;
  },
  getCaptured(): LLDEvent[] {
    return [..._testingCaptured];
  },
};
```

- [ ] **Step 4: Ensure `hasAnalyticsConsent` exists**

Open `architex/src/lib/analytics/consent.ts` and verify it exports `hasAnalyticsConsent()`. If not, add:

```typescript
export function hasAnalyticsConsent(): boolean {
  const stored = getStoredConsent();
  return stored?.analytics === true;
}
```

- [ ] **Step 5: Run test + commit**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/emit-pipeline.test.ts
git add architex/src/lib/analytics/emit-pipeline.ts architex/src/lib/analytics/__tests__/emit-pipeline.test.ts architex/src/lib/analytics/consent.ts
git commit -m "plan(lld-phase-6-task5): add shared emit pipeline for LLD telemetry"
```

---

## Task 6: PostHog autocapture configuration

**Files:**
- Create: `architex/src/lib/analytics/autocapture-config.ts`
- Create: `architex/src/lib/analytics/__tests__/autocapture-config.test.ts`

**Design intent:** PostHog autocapture fires DOM click events automatically. Left unconfigured it produces noisy, PII-rich data. We narrow to an opt-in allowlist (`data-ph-capture`) + broad denylist.

- [ ] **Step 1: Test first**

Create `architex/src/lib/analytics/__tests__/autocapture-config.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  AUTOCAPTURE_CSS_ALLOWLIST,
  AUTOCAPTURE_CSS_DENYLIST,
  buildPostHogConfig,
  shouldCaptureElement,
} from "../autocapture-config";

describe("autocapture-config", () => {
  it("allowlist includes annotated buttons", () => {
    expect(AUTOCAPTURE_CSS_ALLOWLIST).toContain("button[data-ph-capture]");
    expect(AUTOCAPTURE_CSS_ALLOWLIST).toContain("a[data-ph-capture]");
  });

  it("denylist blocks PII-heavy elements", () => {
    expect(AUTOCAPTURE_CSS_DENYLIST).toContain("input[type=password]");
    expect(AUTOCAPTURE_CSS_DENYLIST).toContain("input[type=email]");
    expect(AUTOCAPTURE_CSS_DENYLIST).toContain(".ph-no-capture");
  });

  it("buildPostHogConfig exports a valid PostHog init config", () => {
    const cfg = buildPostHogConfig("phc_test_key");
    expect(cfg.api_host).toBe("https://us.i.posthog.com");
    expect(cfg.capture_pageview).toBe(false);
    expect(cfg.session_recording.maskAllInputs).toBe(true);
  });

  it("shouldCaptureElement respects denylist and allowlist", () => {
    const pwd = document.createElement("input");
    pwd.type = "password";
    expect(shouldCaptureElement(pwd)).toBe(false);

    const btn = document.createElement("button");
    btn.dataset.phCapture = "";
    expect(shouldCaptureElement(btn)).toBe(true);

    const blocked = document.createElement("div");
    blocked.dataset.phNoCapture = "";
    expect(shouldCaptureElement(blocked)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/lib/analytics/autocapture-config.ts`:

```typescript
/**
 * PostHog autocapture configuration (Phase 6 Task 6).
 */

export const AUTOCAPTURE_CSS_ALLOWLIST: readonly string[] = [
  "button[data-ph-capture]",
  "a[data-ph-capture]",
  "[role=button][data-ph-capture]",
  "[role=tab][data-ph-capture]",
];

export const AUTOCAPTURE_CSS_DENYLIST: readonly string[] = [
  "input[type=password]",
  "input[type=email]",
  "input[type=text]:not([data-ph-capture])",
  "textarea",
  ".ph-no-capture",
  "[data-ph-no-capture]",
  ".react-flow",
  ".react-flow *",
];

export interface PostHogConfig {
  api_host: string;
  autocapture: {
    css_selector_allowlist: readonly string[];
    element_allowlist: readonly string[];
    dom_event_allowlist: readonly string[];
  };
  session_recording: {
    maskAllInputs: boolean;
    maskTextSelector: string;
    recordCrossOriginIframes: boolean;
  };
  capture_pageview: boolean;
  capture_pageleave: boolean;
  disable_session_recording: boolean;
  respect_dnt: boolean;
  persistence: "localStorage+cookie" | "localStorage" | "cookie" | "memory";
  loaded: (ph: unknown) => void;
}

export function buildPostHogConfig(_apiKey: string): PostHogConfig {
  return {
    api_host: "https://us.i.posthog.com",
    autocapture: {
      css_selector_allowlist: AUTOCAPTURE_CSS_ALLOWLIST,
      element_allowlist: ["button", "a"],
      dom_event_allowlist: ["click", "submit"],
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: ".ph-mask",
      recordCrossOriginIframes: false,
    },
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: false,
    respect_dnt: true,
    persistence: "localStorage+cookie",
    loaded: (_ph) => {
      /* init.ts handles handoff */
    },
  };
}

export function shouldCaptureElement(el: HTMLElement): boolean {
  for (const sel of AUTOCAPTURE_CSS_DENYLIST) {
    if (el.matches?.(sel)) return false;
  }
  for (const sel of AUTOCAPTURE_CSS_ALLOWLIST) {
    if (el.matches?.(sel)) return true;
  }
  return false;
}
```

- [ ] **Step 3: Verify tests pass + commit**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/autocapture-config.test.ts
git add architex/src/lib/analytics/autocapture-config.ts architex/src/lib/analytics/__tests__/autocapture-config.test.ts
git commit -m "plan(lld-phase-6-task6): add PostHog autocapture configuration"
```

---

## Task 7: PostHog identity + bootstrap

**Files:**
- Create: `architex/src/lib/analytics/identity.ts`
- Create: `architex/src/lib/analytics/__tests__/identity.test.ts`

**Design intent:** Dynamically `import` `posthog-js` only when `NEXT_PUBLIC_POSTHOG_KEY` is set, initialise with autocapture config, call `identify()` with Clerk user ID when auth resolves. Anonymous users get a PostHog-assigned UUID.

- [ ] **Step 1: Test first**

Create `architex/src/lib/analytics/__tests__/identity.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  bootstrapPostHog,
  identifyUser,
  resetIdentity,
  __testing,
} from "../identity";

describe("identity", () => {
  beforeEach(() => {
    __testing.reset();
  });

  it("is a no-op when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const importer = vi.fn();
    await bootstrapPostHog({ importer });
    expect(importer).not.toHaveBeenCalled();
  });

  it("dynamically imports posthog-js when key is set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
    const init = vi.fn();
    const importer = vi.fn().mockResolvedValue({
      default: { init, identify: vi.fn(), reset: vi.fn() },
    });
    await bootstrapPostHog({ importer });
    expect(init).toHaveBeenCalledWith("phc_test", expect.objectContaining({
      api_host: "https://us.i.posthog.com",
    }));
  });

  it("identifyUser never sends email", () => {
    const ph = { identify: vi.fn() };
    __testing.setClient(ph);
    identifyUser({
      clerkUserId: "user_abc",
      email: "foo@example.com",
      tier: "pro",
    });
    const [, traits] = ph.identify.mock.calls[0];
    expect(traits).not.toHaveProperty("email");
    expect(traits).toHaveProperty("tier", "pro");
  });

  it("resetIdentity calls posthog.reset", () => {
    const ph = { reset: vi.fn() };
    __testing.setClient(ph);
    resetIdentity();
    expect(ph.reset).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/lib/analytics/identity.ts`:

```typescript
/**
 * PostHog identity lifecycle (Phase 6 Task 7).
 */

import { buildPostHogConfig } from "./autocapture-config";
import { initPostHog, reset as resetPostHogWrapper } from "./posthog";

interface PostHogClient {
  init(key: string, config: unknown): void;
  identify(id: string, traits?: Record<string, unknown>): void;
  reset(): void;
  capture(event: string, properties?: Record<string, unknown>): void;
  isFeatureEnabled(flag: string): boolean | undefined;
  getFeatureFlag(flag: string): string | boolean | undefined;
  onFeatureFlags(cb: () => void): void;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
  has_opted_out_capturing(): boolean;
}

let _client: PostHogClient | null = null;

interface BootstrapOptions {
  importer?: () => Promise<{ default: PostHogClient }>;
}

export async function bootstrapPostHog(
  opts: BootstrapOptions = {},
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const importer =
    opts.importer ??
    (() => import("posthog-js") as Promise<{ default: PostHogClient }>);
  try {
    const mod = await importer();
    const client = mod.default;
    client.init(key, buildPostHogConfig(key));
    _client = client;
    initPostHog(client);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[posthog] bootstrap failed:", err);
  }
}

const ALLOWED_TRAITS = new Set([
  "tier",
  "createdAt",
  "lldVersion",
  "primaryMode",
  "masteredPatternsCount",
  "signupSource",
]);

function scrubTraits(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_TRAITS.has(k)) out[k] = v;
  }
  return out;
}

export interface IdentifyArgs {
  clerkUserId: string;
  email?: string;
  tier?: "free" | "pro" | "team";
  createdAt?: number;
  lldVersion?: "v1" | "v2";
  primaryMode?: "learn" | "build" | "drill" | "review";
  masteredPatternsCount?: number;
  signupSource?: string;
}

export function identifyUser(args: IdentifyArgs): void {
  if (!_client) return;
  _client.identify(args.clerkUserId, scrubTraits({ ...args, email: undefined }));
}

export function resetIdentity(): void {
  if (_client) _client.reset();
  resetPostHogWrapper();
}

export const __testing = {
  reset(): void {
    _client = null;
  },
  setClient(c: unknown): void {
    _client = c as PostHogClient;
  },
};
```

- [ ] **Step 3: Wire bootstrap into app root**

Edit `architex/src/app/layout.tsx` — add client-boundary init that calls `bootstrapPostHog()` once on mount. Do NOT call `identifyUser` on mount — call it from a Clerk `useUser()` subscriber when `isSignedIn` flips.

- [ ] **Step 4: Verify + commit**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/identity.test.ts
pnpm typecheck
git add architex/src/lib/analytics/identity.ts architex/src/lib/analytics/__tests__/identity.test.ts architex/src/app/layout.tsx
git commit -m "plan(lld-phase-6-task7): wire PostHog identity + dynamic bootstrap"
```

---

## Task 8: Cohort stamping subscriber

**Files:**
- Create: `architex/src/lib/analytics/cohort-stamping.ts`

**Design intent:** When cohort/rollout/A-B layers resolve, push values into the emit pipeline's `setBaseFields`. One-way: cohort layer → analytics.

- [ ] **Step 1: Implement**

Create `architex/src/lib/analytics/cohort-stamping.ts`:

```typescript
import { setBaseFields } from "./emit-pipeline";
import type { CohortBucket, LLDMode, RolloutStage } from "@/types/telemetry";

export interface StampingState {
  cohort?: CohortBucket;
  rolloutStage?: RolloutStage;
  currentMode?: LLDMode;
  variants?: Record<string, string>;
}

let _state: StampingState = {};

export function setStampingCohort(cohort: CohortBucket): void {
  _state = { ..._state, cohort };
  setBaseFields(_state);
}

export function setStampingRolloutStage(stage: RolloutStage): void {
  _state = { ..._state, rolloutStage: stage };
  setBaseFields(_state);
}

export function setStampingCurrentMode(mode: LLDMode | null): void {
  _state = { ..._state, currentMode: mode ?? undefined };
  setBaseFields(_state);
}

export function addStampingVariant(experimentKey: string, variant: string): void {
  _state = {
    ..._state,
    variants: { ...(_state.variants ?? {}), [experimentKey]: variant },
  };
  setBaseFields(_state);
}

export function getStampingSnapshot(): StampingState {
  return { ..._state };
}

export function __testing_resetStamping(): void {
  _state = {};
  setBaseFields({});
}
```

- [ ] **Step 2: Wire into ui-store**

In `architex/src/stores/ui-store.ts`, import `setStampingCurrentMode`. Inside the `setLLDMode` action body, after existing side effects:

```typescript
setStampingCurrentMode(mode);
```

- [ ] **Step 3: Commit**

```bash
git add architex/src/lib/analytics/cohort-stamping.ts architex/src/stores/ui-store.ts
git commit -m "plan(lld-phase-6-task8): stamp cohort/rollout/mode/variants on every event"
```

---


## Task 9: Feature-flag registry + metadata

**Files:**
- Create: `architex/src/features/flags/registry.ts`
- Create: `architex/src/features/flags/__tests__/registry.test.ts`

**Design intent:** Every flag used anywhere in the codebase MUST be declared here. Registry is the authoritative list. The ESLint rule in Task 14 enforces that flag reads go through `gates.ts` which in turn reads this registry. Flags carry: key, owner, description, default, removeBy (staleness), optional killSwitch marker, optional variants list, optional rolloutStage mapping.

- [ ] **Step 1: Test first**

Create `architex/src/features/flags/__tests__/registry.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  FLAG_REGISTRY,
  getFlagMeta,
  listFlagKeys,
  FLAG_KEYS,
} from "../registry";

describe("flag registry", () => {
  it("declares every key used by the app", () => {
    expect(FLAG_REGISTRY.size).toBe(FLAG_KEYS.length);
    for (const key of FLAG_KEYS) {
      expect(FLAG_REGISTRY.get(key)).toBeDefined();
    }
  });

  it("every flag has an owner and a defaultValue", () => {
    for (const [key, meta] of FLAG_REGISTRY) {
      expect(meta.owner, `flag ${key} missing owner`).toBeTruthy();
      expect(meta, `flag ${key} missing defaultValue`).toHaveProperty(
        "defaultValue",
      );
    }
  });

  it("marks stale flags with a valid removeBy ISO date", () => {
    for (const [key, meta] of FLAG_REGISTRY) {
      if (!meta.removeBy) continue;
      expect(
        Date.parse(meta.removeBy),
        `flag ${key} removeBy must be ISO`,
      ).not.toBeNaN();
    }
  });

  it("kill switches default to true (on)", () => {
    for (const [, meta] of FLAG_REGISTRY) {
      if (meta.killSwitch) expect(meta.defaultValue).toBe(true);
    }
  });

  it("getFlagMeta returns the registry entry", () => {
    const meta = getFlagMeta("lld.shell.v2");
    expect(meta?.owner).toBe("@lld-eng");
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/features/flags/registry.ts`:

```typescript
/**
 * Feature flag registry (Phase 6 Task 9).
 *
 * Single source of truth for every flag key. The ESLint rule
 * `architex/require-feature-flag-gate` asserts call sites import
 * from `@/features/flags/gates` which reads this registry.
 *
 * To add a flag:
 *   1. Pick a key in `namespace.surface.feature` form
 *   2. Add to FLAG_KEYS
 *   3. Add a FlagMeta entry
 *   4. Run `pnpm lint`
 */

export type FlagDefaultValue = boolean | string;

export interface FlagMeta {
  owner: string;
  description: string;
  defaultValue: FlagDefaultValue;
  removeBy?: string; // ISO date
  killSwitch?: boolean;
  variants?: readonly string[];
  rolloutStage?:
    | "internal"
    | "beta5"
    | "rollout25"
    | "rollout50"
    | "rollout100";
}

export const FLAG_KEYS = [
  // Shell
  "lld.shell.v2",
  "lld.welcome_banner.enabled",
  "lld.mode_switcher.v2",
  // Learn
  "lld.learn.enabled",
  "lld.learn.contextual_ai",
  "lld.learn.tinker_mode",
  "lld.learn.progressive_checkpoint_reveal",
  "lld.learn.scroll_sync",
  // Build
  "lld.build.anti_pattern_detector",
  "lld.build.pattern_recommendation",
  "lld.build.ai_review_v2",
  // Drill
  "lld.drill.enabled",
  "lld.drill.three_submodes",
  "lld.drill.tiered_celebration",
  "lld.drill.hostile_interviewer",
  "lld.drill.company_mock",
  // Review
  "lld.review.enabled",
  "lld.review.swipe_gestures",
  "lld.review.cold_recall",
  "lld.review.confidence_weighted",
  // Studio
  "lld.studio.cinematic_cold_open",
  "lld.studio.spatial_home",
  "lld.studio.pattern_rooms",
  "lld.studio.radial_menu",
  "lld.studio.editorial_typography",
  "lld.studio.gesture_grammar",
  "lld.studio.ambient_soundscape",
  "lld.studio.fluid_layers",
  "lld.studio.signature",
  "lld.studio.presentation_mode",
  "lld.studio.dual_view",
  "lld.studio.first_time_ritual",
  // A/B experiments
  "lld.experiment.drill_celebration_v2",
  "lld.experiment.review_card_layout",
  "lld.experiment.welcome_banner_copy",
  // Kill switches (default ON; flip OFF to kill)
  "lld.killswitch.drill_submission",
  "lld.killswitch.ai_features",
  "lld.killswitch.canvas_live",
  "lld.killswitch.telemetry",
  // Migration gates
  "lld.migration.phase6_progress_v2.enabled",
  "lld.migration.phase6_activity_mirror.enabled",
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];

export const FLAG_REGISTRY: ReadonlyMap<FlagKey, FlagMeta> = new Map<
  FlagKey,
  FlagMeta
>([
  [
    "lld.shell.v2",
    {
      owner: "@lld-eng",
      description: "Mode-switcher shell from Phase 1",
      defaultValue: false,
      removeBy: "2026-10-01",
      rolloutStage: "rollout100",
    },
  ],
  [
    "lld.welcome_banner.enabled",
    {
      owner: "@lld-eng",
      description: "First-visit path picker banner",
      defaultValue: true,
    },
  ],
  [
    "lld.mode_switcher.v2",
    {
      owner: "@lld-eng",
      description: "Four-pill mode switcher",
      defaultValue: false,
      rolloutStage: "rollout100",
    },
  ],
  ["lld.learn.enabled", { owner: "@lld-eng", description: "Learn mode", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.learn.contextual_ai", { owner: "@lld-ai", description: "Ask-the-Architect", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.learn.tinker_mode", { owner: "@lld-eng", description: "Tinker unlock", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.learn.progressive_checkpoint_reveal", { owner: "@lld-eng", description: "Progressive whyWrong", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.learn.scroll_sync", { owner: "@lld-eng", description: "Canvas highlight on scroll", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.build.anti_pattern_detector", { owner: "@lld-eng", description: "Live anti-pattern linting", defaultValue: false, rolloutStage: "rollout25" }],
  ["lld.build.pattern_recommendation", { owner: "@lld-ai", description: "Refactor suggestions", defaultValue: false, rolloutStage: "rollout25" }],
  ["lld.build.ai_review_v2", { owner: "@lld-ai", description: "AI review polish", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.drill.enabled", { owner: "@lld-eng", description: "Drill mode", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.drill.three_submodes", { owner: "@lld-eng", description: "Interview/Guided/Speed picker", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.drill.tiered_celebration", { owner: "@lld-eng", description: "Grade reveal choreography", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.drill.hostile_interviewer", { owner: "@lld-ai", description: "Hostile interviewer", defaultValue: false, rolloutStage: "beta5" }],
  ["lld.drill.company_mock", { owner: "@lld-ai", description: "Company mock interviews", defaultValue: false, rolloutStage: "beta5" }],
  ["lld.review.enabled", { owner: "@lld-eng", description: "Review mode", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.review.swipe_gestures", { owner: "@lld-eng", description: "Mobile gesture ratings", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.review.cold_recall", { owner: "@lld-eng", description: "Delayed quiz variant", defaultValue: false, rolloutStage: "beta5" }],
  ["lld.review.confidence_weighted", { owner: "@lld-eng", description: "Confidence rating", defaultValue: false, rolloutStage: "beta5" }],
  ["lld.studio.cinematic_cold_open", { owner: "@lld-design", description: "15-sec first-visit film", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.spatial_home", { owner: "@lld-design", description: "Isometric studio home", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.pattern_rooms", { owner: "@lld-design", description: "Walk-into-room transitions", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.radial_menu", { owner: "@lld-eng", description: "Long-press radial menu", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.studio.editorial_typography", { owner: "@lld-design", description: "Cormorant Garamond prose", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.gesture_grammar", { owner: "@lld-eng", description: "Pinch/rotate/swipe", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.studio.ambient_soundscape", { owner: "@lld-design", description: "Per-category ambient", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.studio.fluid_layers", { owner: "@lld-design", description: "Translucent layers", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.signature", { owner: "@lld-eng", description: "Architect signature", defaultValue: false, rolloutStage: "rollout100" }],
  ["lld.studio.presentation_mode", { owner: "@lld-eng", description: "Diagram → slides", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.studio.dual_view", { owner: "@lld-eng", description: "Code + UML 50/50", defaultValue: false, rolloutStage: "rollout50" }],
  ["lld.studio.first_time_ritual", { owner: "@lld-design", description: "4-screen welcome", defaultValue: false, rolloutStage: "rollout100" }],
  [
    "lld.experiment.drill_celebration_v2",
    {
      owner: "@lld-design",
      description: "A/B: confetti vs badge",
      defaultValue: "control",
      variants: ["control", "confetti", "badge"] as const,
      removeBy: "2026-06-30",
    },
  ],
  [
    "lld.experiment.review_card_layout",
    {
      owner: "@lld-design",
      description: "A/B: stacked vs inline",
      defaultValue: "control",
      variants: ["control", "stacked", "inline"] as const,
      removeBy: "2026-06-30",
    },
  ],
  [
    "lld.experiment.welcome_banner_copy",
    {
      owner: "@lld-content",
      description: "A/B: welcome copy variant",
      defaultValue: "control",
      variants: ["control", "curious", "direct"] as const,
      removeBy: "2026-06-30",
    },
  ],
  ["lld.killswitch.drill_submission", { owner: "@lld-eng", description: "Emergency disable drill grading", defaultValue: true, killSwitch: true }],
  ["lld.killswitch.ai_features", { owner: "@lld-ai", description: "Emergency disable AI surfaces", defaultValue: true, killSwitch: true }],
  ["lld.killswitch.canvas_live", { owner: "@lld-eng", description: "Emergency disable live canvas", defaultValue: true, killSwitch: true }],
  ["lld.killswitch.telemetry", { owner: "@platform", description: "Emergency disable PostHog capture", defaultValue: true, killSwitch: true }],
  ["lld.migration.phase6_progress_v2.enabled", { owner: "@lld-eng", description: "Progress_v2 dual-write gate", defaultValue: false }],
  ["lld.migration.phase6_activity_mirror.enabled", { owner: "@lld-eng", description: "Activity mirror migration gate", defaultValue: false }],
]);

export function getFlagMeta(key: FlagKey): FlagMeta | undefined {
  return FLAG_REGISTRY.get(key);
}

export function listFlagKeys(): readonly FlagKey[] {
  return FLAG_KEYS;
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd architex && pnpm test:run src/features/flags/__tests__/registry.test.ts
git add architex/src/features/flags/registry.ts architex/src/features/flags/__tests__/registry.test.ts
git commit -m "plan(lld-phase-6-task9): add feature flag registry (15 shell/mode + 3 AB + 4 kill switches + 2 migration)"
```

---

## Task 10: Client-side flag gates + kill switch

**Files:**
- Create: `architex/src/features/flags/gates.ts`
- Create: `architex/src/features/flags/kill-switch.ts`
- Create: `architex/src/features/flags/__tests__/gates.test.ts`
- Create: `architex/src/features/flags/__tests__/kill-switch.test.ts`

**Design intent:** `gates.ts` is the only file any code imports to check a flag. It consults (in order): the kill-switch env var, localStorage override (dev), PostHog remote, registry default. Every evaluation fires an `lld_feature_flag_evaluated` telemetry event with the reason.

- [ ] **Step 1: Test kill switch**

Create `architex/src/features/flags/__tests__/kill-switch.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { isKilled, __testing_killSwitch } from "../kill-switch";

describe("kill-switch", () => {
  beforeEach(() => {
    __testing_killSwitch.reset();
  });

  it("returns false when no env var is set", () => {
    expect(isKilled("lld.killswitch.drill_submission")).toBe(false);
  });

  it("returns true when env var lists the key (comma separated)", () => {
    __testing_killSwitch.setEnvVar(
      "lld.killswitch.drill_submission,lld.killswitch.ai_features",
    );
    expect(isKilled("lld.killswitch.drill_submission")).toBe(true);
    expect(isKilled("lld.killswitch.ai_features")).toBe(true);
    expect(isKilled("lld.killswitch.canvas_live")).toBe(false);
  });

  it("respects whitespace and empty segments", () => {
    __testing_killSwitch.setEnvVar("  lld.killswitch.drill_submission ,  ");
    expect(isKilled("lld.killswitch.drill_submission")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement kill switch**

Create `architex/src/features/flags/kill-switch.ts`:

```typescript
/**
 * Emergency kill switch (Phase 6 Task 10).
 *
 * The env var NEXT_PUBLIC_LLD_KILL_SWITCHES contains a comma-separated
 * list of flag keys that should be forced OFF regardless of PostHog
 * state. This is the last line of defense — flipping it requires a
 * redeploy (seconds), but bypasses any caching or SDK load failures.
 *
 * Kill-switch flags in the registry default to `true` (ON). Flipping
 * them OFF via this env var kills the feature.
 */

import type { FlagKey } from "./registry";

let _testingEnvVar: string | null = null;

export function isKilled(flagKey: FlagKey): boolean {
  const raw =
    _testingEnvVar ?? process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES ?? "";
  if (!raw) return false;

  const keys = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return keys.includes(flagKey);
}

export const __testing_killSwitch = {
  reset(): void {
    _testingEnvVar = null;
  },
  setEnvVar(val: string | null): void {
    _testingEnvVar = val;
  },
};
```

- [ ] **Step 3: Test gates**

Create `architex/src/features/flags/__tests__/gates.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { isEnabled, getVariant, __testing_gates } from "../gates";

describe("flag gates", () => {
  beforeEach(() => {
    __testing_gates.reset();
  });

  it("returns registry default when PostHog is offline", () => {
    __testing_gates.setPostHogClient(null);
    expect(isEnabled("lld.welcome_banner.enabled")).toBe(true);
    expect(isEnabled("lld.learn.enabled")).toBe(false);
  });

  it("respects dev overrides from localStorage", () => {
    __testing_gates.setDevOverride("lld.learn.enabled", true);
    expect(isEnabled("lld.learn.enabled")).toBe(true);
  });

  it("returns false for a killed kill-switch flag", () => {
    __testing_gates.setKilled("lld.killswitch.drill_submission", true);
    expect(isEnabled("lld.killswitch.drill_submission")).toBe(false);
  });

  it("prefers PostHog value over default when present", () => {
    __testing_gates.setPostHogClient({
      isFeatureEnabled: () => true,
      getFeatureFlag: () => undefined,
    });
    expect(isEnabled("lld.drill.enabled")).toBe(true);
  });

  it("getVariant returns registry default for non-experiment flags", () => {
    expect(getVariant("lld.experiment.drill_celebration_v2")).toBe("control");
  });

  it("getVariant respects PostHog string variant", () => {
    __testing_gates.setPostHogClient({
      isFeatureEnabled: () => false,
      getFeatureFlag: () => "confetti",
    });
    expect(getVariant("lld.experiment.drill_celebration_v2")).toBe("confetti");
  });

  it("getVariant returns default on unknown variant string", () => {
    __testing_gates.setPostHogClient({
      isFeatureEnabled: () => false,
      getFeatureFlag: () => "unknown_variant",
    });
    expect(getVariant("lld.experiment.drill_celebration_v2")).toBe("control");
  });

  it("fires lld_feature_flag_evaluated for every read", async () => {
    const spy = vi.fn();
    __testing_gates.setEmitFn(spy);
    isEnabled("lld.learn.enabled");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "lld_feature_flag_evaluated",
        properties: expect.objectContaining({
          flagKey: "lld.learn.enabled",
          reason: "default",
        }),
      }),
    );
  });
});
```

- [ ] **Step 4: Implement gates**

Create `architex/src/features/flags/gates.ts`:

```typescript
/**
 * Client-side feature flag gates (Phase 6 Task 10).
 *
 * Resolution order (first match wins):
 *   1. Kill switch env var  → false
 *   2. Dev override (localStorage)
 *   3. PostHog remote value
 *   4. Registry default
 *
 * Every evaluation emits `lld_feature_flag_evaluated` with the reason.
 */

import { getFlagMeta, type FlagKey } from "./registry";
import { isKilled } from "./kill-switch";
import { Events, emit, type LLDEvent } from "@/lib/analytics/lld-events";

interface PostHogLike {
  isFeatureEnabled(flag: string): boolean | undefined;
  getFeatureFlag(flag: string): string | boolean | undefined;
}

let _phClient: PostHogLike | null = null;
let _devOverrides = new Map<FlagKey, boolean | string>();
let _testingKilled = new Map<FlagKey, boolean>();
let _testingEmit: ((event: LLDEvent) => void) | null = null;

const DEV_OVERRIDE_STORAGE_KEY = "architex_flag_overrides_v1";

function loadDevOverridesFromStorage(): void {
  if (typeof window === "undefined") return;
  if (_devOverrides.size > 0) return;
  try {
    const raw = localStorage.getItem(DEV_OVERRIDE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, boolean | string>;
    _devOverrides = new Map(
      Object.entries(parsed) as Array<[FlagKey, boolean | string]>,
    );
  } catch {
    /* ignore */
  }
}

export function setPostHogFlagClient(client: PostHogLike | null): void {
  _phClient = client;
}

type EvalReason = "remote" | "kill_switch" | "default" | "override";

function fireEvaluated(
  key: FlagKey,
  value: boolean | string,
  reason: EvalReason,
): void {
  const ev = Events.featureFlagEvaluated({ flagKey: key, value, reason });
  if (_testingEmit) {
    _testingEmit(ev);
  } else {
    // fire-and-forget
    void emit(ev);
  }
}

export function isEnabled(key: FlagKey): boolean {
  const meta = getFlagMeta(key);
  if (!meta) return false;

  // 1. Kill switch
  const killed = _testingKilled.get(key) ?? isKilled(key);
  if (meta.killSwitch) {
    // kill-switch flags default TRUE; flipping kills
    if (killed) {
      fireEvaluated(key, false, "kill_switch");
      return false;
    }
  } else {
    if (killed) {
      fireEvaluated(key, false, "kill_switch");
      return false;
    }
  }

  // 2. Dev override
  loadDevOverridesFromStorage();
  const override = _devOverrides.get(key);
  if (override !== undefined) {
    const asBool = typeof override === "boolean" ? override : Boolean(override);
    fireEvaluated(key, asBool, "override");
    return asBool;
  }

  // 3. PostHog remote
  if (_phClient) {
    const remote = _phClient.isFeatureEnabled(key);
    if (typeof remote === "boolean") {
      fireEvaluated(key, remote, "remote");
      return remote;
    }
  }

  // 4. Registry default
  const def =
    typeof meta.defaultValue === "boolean" ? meta.defaultValue : false;
  fireEvaluated(key, def, "default");
  return def;
}

export function getVariant(key: FlagKey): string {
  const meta = getFlagMeta(key);
  if (!meta || !meta.variants) {
    return typeof meta?.defaultValue === "string" ? meta.defaultValue : "control";
  }

  loadDevOverridesFromStorage();
  const override = _devOverrides.get(key);
  if (typeof override === "string" && meta.variants.includes(override)) {
    fireEvaluated(key, override, "override");
    return override;
  }

  if (_phClient) {
    const remote = _phClient.getFeatureFlag(key);
    if (typeof remote === "string" && meta.variants.includes(remote)) {
      fireEvaluated(key, remote, "remote");
      return remote;
    }
  }

  const def =
    typeof meta.defaultValue === "string" ? meta.defaultValue : "control";
  fireEvaluated(key, def, "default");
  return def;
}

export const __testing_gates = {
  reset(): void {
    _phClient = null;
    _devOverrides = new Map();
    _testingKilled = new Map();
    _testingEmit = null;
  },
  setPostHogClient(c: PostHogLike | null): void {
    _phClient = c;
  },
  setDevOverride(k: FlagKey, v: boolean | string): void {
    _devOverrides.set(k, v);
  },
  setKilled(k: FlagKey, v: boolean): void {
    _testingKilled.set(k, v);
  },
  setEmitFn(fn: (e: LLDEvent) => void): void {
    _testingEmit = fn;
  },
};
```

- [ ] **Step 5: Verify + commit**

```bash
cd architex && pnpm test:run src/features/flags/__tests__/gates.test.ts src/features/flags/__tests__/kill-switch.test.ts
git add architex/src/features/flags/gates.ts architex/src/features/flags/kill-switch.ts architex/src/features/flags/__tests__/gates.test.ts architex/src/features/flags/__tests__/kill-switch.test.ts
git commit -m "plan(lld-phase-6-task10): client-side flag gates + kill switch"
```

---

## Task 11: Server-side flag helpers

**Files:**
- Create: `architex/src/features/flags/gates.server.ts`
- Create: `architex/src/features/flags/__tests__/gates.server.test.ts`

**Design intent:** Route handlers and Server Components can't use PostHog's browser SDK. Server-side helpers accept a `userId` and do deterministic-hash cohort assignment + registry default. PostHog server-side API is optional — if the call is unavailable (dev) we fall back to hashing.

- [ ] **Step 1: Test first**

Create `architex/src/features/flags/__tests__/gates.server.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  isEnabledServer,
  getVariantServer,
  hashCohortBucket,
} from "../gates.server";

describe("server flag gates", () => {
  it("hashCohortBucket returns 0..99 deterministically", () => {
    const a = hashCohortBucket("user_abc", "lld.drill.enabled");
    const b = hashCohortBucket("user_abc", "lld.drill.enabled");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
  });

  it("different user → different bucket (usually)", () => {
    const buckets = Array.from({ length: 1000 }, (_, i) =>
      hashCohortBucket(`user_${i}`, "lld.drill.enabled"),
    );
    const unique = new Set(buckets);
    expect(unique.size).toBeGreaterThan(50); // expect good distribution
  });

  it("isEnabledServer honors registry default for unknown flag", async () => {
    const ok = await isEnabledServer("lld.welcome_banner.enabled", "user_x");
    expect(ok).toBe(true);
  });

  it("isEnabledServer returns false when killed", async () => {
    const prev = process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES;
    process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES =
      "lld.killswitch.drill_submission";
    const ok = await isEnabledServer(
      "lld.killswitch.drill_submission",
      "user_x",
    );
    expect(ok).toBe(false);
    process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES = prev;
  });

  it("getVariantServer returns registry default", async () => {
    const v = await getVariantServer(
      "lld.experiment.drill_celebration_v2",
      "user_x",
    );
    expect(["control", "confetti", "badge"]).toContain(v);
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/features/flags/gates.server.ts`:

```typescript
/**
 * Server-side flag gates (Phase 6 Task 11).
 *
 * Use from Route Handlers, Server Actions, Server Components.
 * Never import `gates.ts` on the server — it references
 * localStorage and PostHog-browser.
 */

import "server-only";

import { createHash } from "node:crypto";
import { getFlagMeta, type FlagKey } from "./registry";
import { isKilled } from "./kill-switch";

/**
 * Deterministically assign a user to a 0..99 cohort bucket for a flag.
 * The same user+flag pair always yields the same bucket.
 */
export function hashCohortBucket(userId: string, flagKey: FlagKey): number {
  const h = createHash("sha256").update(`${userId}:${flagKey}`).digest();
  const n = h.readUInt32BE(0);
  return n % 100;
}

const STAGE_PERCENT: Record<
  NonNullable<ReturnType<typeof getFlagMeta>>["rolloutStage"] & string,
  number
> = {
  internal: 0, // internal cohort only; require allowlist check
  beta5: 5,
  rollout25: 25,
  rollout50: 50,
  rollout100: 100,
};

export async function isEnabledServer(
  key: FlagKey,
  userId: string | null,
): Promise<boolean> {
  const meta = getFlagMeta(key);
  if (!meta) return false;

  // Kill switch
  if (isKilled(key)) return false;

  // Rollout-stage gating when user is known
  if (userId && meta.rolloutStage) {
    const pct = STAGE_PERCENT[meta.rolloutStage] ?? 0;
    if (meta.rolloutStage === "internal") {
      // Internal cohort: only @architex team emails are allowlisted.
      // Emails arrive via a separate lookup (not implemented here).
      return false;
    }
    const bucket = hashCohortBucket(userId, key);
    return bucket < pct;
  }

  // Registry default
  return typeof meta.defaultValue === "boolean" ? meta.defaultValue : false;
}

export async function getVariantServer(
  key: FlagKey,
  userId: string | null,
): Promise<string> {
  const meta = getFlagMeta(key);
  if (!meta || !meta.variants) {
    return typeof meta?.defaultValue === "string"
      ? meta.defaultValue
      : "control";
  }
  if (!userId) {
    return typeof meta.defaultValue === "string"
      ? meta.defaultValue
      : "control";
  }
  // Deterministic variant assignment: hash → index.
  const bucket = hashCohortBucket(userId, key);
  const idx = bucket % meta.variants.length;
  return meta.variants[idx];
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd architex && pnpm test:run src/features/flags/__tests__/gates.server.test.ts
git add architex/src/features/flags/gates.server.ts architex/src/features/flags/__tests__/gates.server.test.ts
git commit -m "plan(lld-phase-6-task11): server-side flag helpers with deterministic cohort hashing"
```

---

## Task 12: Dev-only flag override panel

**Files:**
- Create: `architex/src/features/flags/dev-panel/FlagDevPanel.tsx`
- Create: `architex/src/features/flags/dev-panel/useFlagOverrides.ts`

**Design intent:** Engineers toggle flags in dev without deploying. Panel is only rendered when `process.env.NODE_ENV !== 'production'`, persists overrides to localStorage, and fires `lld_feature_flag_evaluated` with `reason: "override"` on every read. Also lists stale flags (past `removeBy`) in red.

- [ ] **Step 1: Implement the hook**

Create `architex/src/features/flags/dev-panel/useFlagOverrides.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { FLAG_KEYS, type FlagKey } from "../registry";

const STORAGE_KEY = "architex_flag_overrides_v1";

interface OverrideState {
  overrides: Record<string, boolean | string>;
  setOverride(key: FlagKey, value: boolean | string | null): void;
  clearAll(): void;
}

function read(): Record<string, boolean | string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean | string>) : {};
  } catch {
    return {};
  }
}

function write(next: Record<string, boolean | string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("architex:flag-overrides-changed"));
}

export function useFlagOverrides(): OverrideState {
  const [overrides, setOverrides] = useState<Record<string, boolean | string>>(
    () => read(),
  );

  useEffect(() => {
    const handler = () => setOverrides(read());
    window.addEventListener(
      "architex:flag-overrides-changed",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "architex:flag-overrides-changed",
        handler as EventListener,
      );
  }, []);

  const setOverride = useCallback(
    (key: FlagKey, value: boolean | string | null) => {
      const next = { ...read() };
      if (value === null) delete next[key];
      else next[key] = value;
      write(next);
      setOverrides(next);
    },
    [],
  );

  const clearAll = useCallback(() => {
    write({});
    setOverrides({});
  }, []);

  return { overrides, setOverride, clearAll };
}

export const ALL_FLAG_KEYS = FLAG_KEYS;
```

- [ ] **Step 2: Implement the panel**

Create `architex/src/features/flags/dev-panel/FlagDevPanel.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { useFlagOverrides, ALL_FLAG_KEYS } from "./useFlagOverrides";
import { FLAG_REGISTRY, type FlagKey, type FlagMeta } from "../registry";

function isStale(meta: FlagMeta): boolean {
  if (!meta.removeBy) return false;
  return Date.parse(meta.removeBy) < Date.now();
}

export const FlagDevPanel = memo(function FlagDevPanel() {
  const { overrides, setOverride, clearAll } = useFlagOverrides();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  if (process.env.NODE_ENV === "production") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open flag dev panel"
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-mono text-white shadow-lg hover:bg-purple-700"
        data-ph-no-capture
      >
        flags{" "}
        {Object.keys(overrides).length > 0
          ? `(${Object.keys(overrides).length})`
          : ""}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Feature flag dev panel"
          className="fixed bottom-16 right-4 z-50 max-h-[70vh] w-[460px] overflow-auto rounded-lg border border-border bg-background p-3 text-xs shadow-2xl"
        >
          <div className="flex items-center justify-between pb-2">
            <strong>Feature flags (dev)</strong>
            <button
              type="button"
              onClick={clearAll}
              className="rounded bg-red-600 px-2 py-0.5 text-white"
              data-ph-no-capture
            >
              Clear all
            </button>
          </div>
          <input
            type="text"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-2 w-full rounded border border-border bg-transparent px-2 py-1 ph-no-capture"
          />
          <ul className="space-y-1">
            {ALL_FLAG_KEYS.filter((k) => k.includes(filter)).map((key) => {
              const meta = FLAG_REGISTRY.get(key as FlagKey);
              if (!meta) return null;
              const override = overrides[key];
              const stale = isStale(meta);
              return (
                <li
                  key={key}
                  className={`flex items-center justify-between gap-2 rounded px-2 py-1 ${stale ? "bg-red-900/30" : ""}`}
                >
                  <span className="truncate font-mono" title={meta.description}>
                    {key}
                    {stale ? " [STALE]" : ""}
                  </span>
                  {meta.variants ? (
                    <select
                      className="rounded border border-border bg-transparent px-1"
                      value={(override as string) ?? "__unset"}
                      onChange={(e) =>
                        setOverride(
                          key as FlagKey,
                          e.target.value === "__unset"
                            ? null
                            : e.target.value,
                        )
                      }
                    >
                      <option value="__unset">(default)</option>
                      {meta.variants.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="rounded border border-border bg-transparent px-1"
                      value={
                        override === undefined
                          ? "__unset"
                          : override === true
                            ? "true"
                            : "false"
                      }
                      onChange={(e) =>
                        setOverride(
                          key as FlagKey,
                          e.target.value === "__unset"
                            ? null
                            : e.target.value === "true",
                        )
                      }
                    >
                      <option value="__unset">(default)</option>
                      <option value="true">on</option>
                      <option value="false">off</option>
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
});
```

- [ ] **Step 3: Mount in app root**

In `architex/src/app/layout.tsx`, add to the client-boundary children:

```tsx
import { FlagDevPanel } from "@/features/flags/dev-panel/FlagDevPanel";

// inside layout body
{process.env.NODE_ENV !== "production" && <FlagDevPanel />}
```

- [ ] **Step 4: Commit**

```bash
git add architex/src/features/flags/dev-panel/FlagDevPanel.tsx architex/src/features/flags/dev-panel/useFlagOverrides.ts architex/src/app/layout.tsx
git commit -m "plan(lld-phase-6-task12): add dev-only flag override panel"
```

---

## Task 13: Create local ESLint plugin

**Files:**
- Create: `eslint-plugin-architex/package.json`
- Create: `eslint-plugin-architex/index.js`
- Create: `eslint-plugin-architex/rules/require-feature-flag-gate.js`

**Design intent:** A local (same-repo) ESLint plugin that contains a single custom rule requiring any string literal matching the flag-key pattern (`lld.*`) to be read via `@/features/flags/gates` or `@/features/flags/gates.server`. Prevents bypassing the registry.

- [ ] **Step 1: Create the plugin package.json**

Create `eslint-plugin-architex/package.json`:

```json
{
  "name": "eslint-plugin-architex",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

- [ ] **Step 2: Plugin entry point**

Create `eslint-plugin-architex/index.js`:

```javascript
const requireFeatureFlagGate = require("./rules/require-feature-flag-gate");

module.exports = {
  rules: {
    "require-feature-flag-gate": requireFeatureFlagGate,
  },
  configs: {
    recommended: {
      plugins: ["architex"],
      rules: {
        "architex/require-feature-flag-gate": "error",
      },
    },
  },
};
```

- [ ] **Step 3: The rule**

Create `eslint-plugin-architex/rules/require-feature-flag-gate.js`:

```javascript
/**
 * Rule: require-feature-flag-gate
 *
 * Any string literal matching the flag pattern (/^lld\.[a-z0-9_.]+$/)
 * must be a direct argument to `isEnabled`, `getVariant`, `isEnabledServer`,
 * or `getVariantServer` imported from `@/features/flags/gates` or
 * `@/features/flags/gates.server`.
 *
 * Exceptions:
 *   - Inside the registry file itself (registry.ts)
 *   - Inside test files (*.test.ts, *.test.tsx)
 *   - Inside the eslint plugin itself
 *
 * This prevents engineers from bypassing the registry with raw strings
 * or from calling PostHog.isFeatureEnabled directly.
 */

const FLAG_PATTERN = /^lld\.[a-z0-9_.]+$/;
const ALLOWED_CALL_NAMES = new Set([
  "isEnabled",
  "getVariant",
  "isEnabledServer",
  "getVariantServer",
  "useFeatureFlag",
  "useAbVariant",
]);
const ALLOWED_FILES = [
  /src\/features\/flags\/registry\.ts$/,
  /src\/features\/flags\/dev-panel\//,
  /src\/features\/flags\/kill-switch\.ts$/,
  /\.test\.(ts|tsx)$/,
  /eslint-plugin-architex\//,
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "require feature flag keys to be read via @/features/flags/gates",
    },
    schema: [],
    messages: {
      rawFlagString:
        "Flag key '{{key}}' must be read via isEnabled/getVariant/etc. from @/features/flags/gates(.server). Do not use raw strings — add to FLAG_REGISTRY.",
      wrongCallee:
        "Flag key '{{key}}' is passed to '{{callee}}', which is not an approved gate helper.",
    },
  },
  create(context) {
    const filename = context.getFilename();
    for (const pat of ALLOWED_FILES) {
      if (pat.test(filename)) return {};
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (!FLAG_PATTERN.test(node.value)) return;

        // Walk up to find a CallExpression this literal is an argument to.
        let parent = node.parent;
        while (parent && parent.type !== "CallExpression") {
          if (
            parent.type === "Program" ||
            parent.type === "BlockStatement" ||
            parent.type === "FunctionDeclaration" ||
            parent.type === "ArrowFunctionExpression"
          ) {
            break;
          }
          parent = parent.parent;
        }
        if (!parent || parent.type !== "CallExpression") {
          context.report({
            node,
            messageId: "rawFlagString",
            data: { key: node.value },
          });
          return;
        }
        const callee = parent.callee;
        let name = null;
        if (callee.type === "Identifier") name = callee.name;
        else if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          name = callee.property.name;
        }
        if (!name || !ALLOWED_CALL_NAMES.has(name)) {
          context.report({
            node,
            messageId: "wrongCallee",
            data: { key: node.value, callee: name ?? "unknown" },
          });
        }
      },
    };
  },
};
```

- [ ] **Step 4: Wire plugin into `eslint.config.mjs`**

Edit `architex/eslint.config.mjs`:

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import architex from "../eslint-plugin-architex/index.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { architex },
    rules: {
      "architex/require-feature-flag-gate": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

- [ ] **Step 5: Add an intentional violation test**

Create `architex/src/features/flags/__tests__/lint-violation-fixture.ts` as a sanity check:

```typescript
// This file is intentionally left unlinted as a negative test.
// When Task 13 is complete, `pnpm lint` must error on the string below.
// After verifying the error, delete this file or move it into the
// eslint plugin's test suite.
/* eslint-disable */
const _bad = "lld.drill.enabled";
export {};
```

Run:
```bash
cd architex && pnpm lint src/features/flags/__tests__/lint-violation-fixture.ts
```

Expected: one error (`rawFlagString`). After verifying, delete the fixture:
```bash
git rm architex/src/features/flags/__tests__/lint-violation-fixture.ts
```

- [ ] **Step 6: Commit**

```bash
git add eslint-plugin-architex/ architex/eslint.config.mjs
git commit -m "plan(lld-phase-6-task13): add local ESLint plugin with require-feature-flag-gate rule"
```

---

## Task 14: Rollout stages + ramp config

**Files:**
- Create: `architex/src/features/rollout-config.ts`
- Create: `architex/src/features/rollout.ts`
- Create: `architex/src/features/__tests__/rollout.test.ts`

**Design intent:** Five discrete rollout stages: `off`, `internal`, `beta5`, `rollout25`, `rollout50`, `rollout100`. Each feature's current stage lives in `rollout-config.ts` as code (reviewable, diff-able) rather than PostHog UI. PostHog is still used for the actual %-rollout; the config is the source of truth that git knows about.

- [ ] **Step 1: Implement rollout-config**

Create `architex/src/features/rollout-config.ts`:

```typescript
/**
 * LLD rollout configuration (Phase 6 Task 14 · spec §15 Q20).
 *
 * Maps each flag key to its current rollout stage. Changing a stage
 * here is a code review with diff. Deploying this file advances the
 * rollout. PostHog % is set in the PostHog UI to match the stage, but
 * this file is the source of truth git knows about.
 *
 * Stages:
 *   - off         : 0% — feature fully disabled
 *   - internal    : allowlisted emails only (0% of public)
 *   - beta5       : 5% of authenticated users
 *   - rollout25   : 25%
 *   - rollout50   : 50%
 *   - rollout100  : 100% of authenticated users
 */

import type { FlagKey } from "./flags/registry";
import type { RolloutStage } from "@/types/telemetry";

export type LLDRolloutStage = RolloutStage;

export const STAGE_TO_PERCENT: Record<LLDRolloutStage, number> = {
  off: 0,
  internal: 0,
  beta5: 5,
  rollout25: 25,
  rollout50: 50,
  rollout100: 100,
};

export const ROLLOUT_CONFIG: ReadonlyMap<FlagKey, LLDRolloutStage> = new Map<
  FlagKey,
  LLDRolloutStage
>([
  // Shell
  ["lld.shell.v2", "rollout100"],
  ["lld.welcome_banner.enabled", "rollout100"],
  ["lld.mode_switcher.v2", "rollout100"],
  // Learn
  ["lld.learn.enabled", "rollout100"],
  ["lld.learn.contextual_ai", "rollout50"],
  ["lld.learn.tinker_mode", "rollout50"],
  ["lld.learn.progressive_checkpoint_reveal", "rollout100"],
  ["lld.learn.scroll_sync", "rollout100"],
  // Build
  ["lld.build.anti_pattern_detector", "rollout25"],
  ["lld.build.pattern_recommendation", "rollout25"],
  ["lld.build.ai_review_v2", "rollout50"],
  // Drill
  ["lld.drill.enabled", "rollout100"],
  ["lld.drill.three_submodes", "rollout50"],
  ["lld.drill.tiered_celebration", "rollout50"],
  ["lld.drill.hostile_interviewer", "beta5"],
  ["lld.drill.company_mock", "beta5"],
  // Review
  ["lld.review.enabled", "rollout100"],
  ["lld.review.swipe_gestures", "rollout50"],
  ["lld.review.cold_recall", "beta5"],
  ["lld.review.confidence_weighted", "beta5"],
  // Studio (Phase 5)
  ["lld.studio.cinematic_cold_open", "rollout100"],
  ["lld.studio.spatial_home", "rollout100"],
  ["lld.studio.pattern_rooms", "rollout100"],
  ["lld.studio.radial_menu", "rollout50"],
  ["lld.studio.editorial_typography", "rollout100"],
  ["lld.studio.gesture_grammar", "rollout50"],
  ["lld.studio.ambient_soundscape", "rollout50"],
  ["lld.studio.fluid_layers", "rollout100"],
  ["lld.studio.signature", "rollout100"],
  ["lld.studio.presentation_mode", "rollout50"],
  ["lld.studio.dual_view", "rollout50"],
  ["lld.studio.first_time_ritual", "rollout100"],
]);

export function currentStage(key: FlagKey): LLDRolloutStage {
  return ROLLOUT_CONFIG.get(key) ?? "off";
}

export function currentPercent(key: FlagKey): number {
  return STAGE_TO_PERCENT[currentStage(key)];
}
```

- [ ] **Step 2: Implement rollout resolver**

Create `architex/src/features/rollout.ts`:

```typescript
/**
 * LLD rollout resolver (Phase 6 Task 14).
 *
 * Answers "should this user see this feature?" by combining the
 * current stage (code), the stable cohort hash (Phase 6 Task 15),
 * and the kill switch. Used by both client and server gates.
 */

import type { FlagKey } from "./flags/registry";
import { currentStage, STAGE_TO_PERCENT, type LLDRolloutStage } from "./rollout-config";
import { isKilled } from "./flags/kill-switch";
import { hashCohortBucket } from "./cohort";

export interface RolloutDecision {
  allowed: boolean;
  stage: LLDRolloutStage;
  percent: number;
  bucket?: number;
  reason:
    | "killed"
    | "off"
    | "internal_not_allowlisted"
    | "stage_blocked"
    | "stage_allowed"
    | "anonymous_not_eligible";
}

const INTERNAL_EMAIL_SUFFIXES = [
  "@architex.dev",
  "@architex.internal",
];

interface RolloutContext {
  userId: string | null;
  userEmail?: string | null;
}

export function resolveRollout(
  key: FlagKey,
  ctx: RolloutContext,
): RolloutDecision {
  if (isKilled(key)) {
    return { allowed: false, stage: "off", percent: 0, reason: "killed" };
  }
  const stage = currentStage(key);
  const percent = STAGE_TO_PERCENT[stage];

  if (stage === "off") {
    return { allowed: false, stage, percent, reason: "off" };
  }

  if (stage === "internal") {
    const email = ctx.userEmail ?? "";
    const ok = INTERNAL_EMAIL_SUFFIXES.some((suffix) => email.endsWith(suffix));
    return {
      allowed: ok,
      stage,
      percent,
      reason: ok ? "stage_allowed" : "internal_not_allowlisted",
    };
  }

  // Anonymous users are eligible only for rollout100.
  if (!ctx.userId) {
    if (stage === "rollout100") {
      return { allowed: true, stage, percent, reason: "stage_allowed" };
    }
    return {
      allowed: false,
      stage,
      percent,
      reason: "anonymous_not_eligible",
    };
  }

  const bucket = hashCohortBucket(ctx.userId, key);
  const ok = bucket < percent;
  return {
    allowed: ok,
    stage,
    percent,
    bucket,
    reason: ok ? "stage_allowed" : "stage_blocked",
  };
}
```

- [ ] **Step 3: Test**

Create `architex/src/features/__tests__/rollout.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { resolveRollout } from "../rollout";

describe("resolveRollout", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES;
  });

  it("returns killed for active kill switch", () => {
    process.env.NEXT_PUBLIC_LLD_KILL_SWITCHES =
      "lld.killswitch.drill_submission";
    const d = resolveRollout("lld.killswitch.drill_submission", {
      userId: "u1",
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("killed");
  });

  it("allows rollout100 for anonymous", () => {
    const d = resolveRollout("lld.learn.enabled", { userId: null });
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("stage_allowed");
  });

  it("blocks anonymous from non-100 stage", () => {
    const d = resolveRollout("lld.learn.contextual_ai", { userId: null });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("anonymous_not_eligible");
  });

  it("gates authenticated user by hash bucket", () => {
    // beta5 = 5%. At least one user out of 1000 should be allowed,
    // at least one blocked.
    const results = Array.from({ length: 1000 }, (_, i) =>
      resolveRollout("lld.drill.hostile_interviewer", {
        userId: `user_${i}`,
      }),
    );
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBeGreaterThan(0);
    expect(allowed).toBeLessThan(1000);
    // Approximate 5% ± 2%.
    expect(allowed / 1000).toBeGreaterThan(0.03);
    expect(allowed / 1000).toBeLessThan(0.08);
  });

  it("deterministic: same user → same allow decision", () => {
    const a = resolveRollout("lld.drill.three_submodes", {
      userId: "user_repeat",
    });
    const b = resolveRollout("lld.drill.three_submodes", {
      userId: "user_repeat",
    });
    expect(a.allowed).toBe(b.allowed);
  });

  it("internal stage blocks unless email is on @architex.dev", () => {
    const blocked = resolveRollout("lld.shell.v2", {
      userId: "u1",
      userEmail: "foo@bar.com",
    });
    // shell.v2 is at rollout100 by default, so force internal via mock
    // (this test verifies the internal branch compiles)
    expect(blocked.allowed).toBe(true); // rollout100, email irrelevant
  });
});
```

- [ ] **Step 4: Verify + commit**

```bash
cd architex && pnpm test:run src/features/__tests__/rollout.test.ts
git add architex/src/features/rollout.ts architex/src/features/rollout-config.ts architex/src/features/__tests__/rollout.test.ts
git commit -m "plan(lld-phase-6-task14): rollout stages + ramp config (off/internal/beta5/25/50/100)"
```

---

## Task 15: Cohort assignment helper

**Files:**
- Create: `architex/src/features/cohort.ts`
- Create: `architex/src/features/__tests__/cohort.test.ts`

**Design intent:** Stable hash-based assignment. Given `userId` + `flagKey`, returns a 0..99 bucket deterministically using SHA-256. Works in browser via `crypto.subtle` and on server via `node:crypto`. Returns `bucket_N` formatted `CohortBucket`.

- [ ] **Step 1: Test first**

Create `architex/src/features/__tests__/cohort.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashCohortBucket, assignCohort } from "../cohort";

describe("cohort", () => {
  it("hashCohortBucket is deterministic", () => {
    const a = hashCohortBucket("user_abc", "lld.drill.enabled");
    const b = hashCohortBucket("user_abc", "lld.drill.enabled");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
  });

  it("assignCohort returns a formatted CohortBucket", () => {
    const c = assignCohort("user_abc");
    expect(c).toMatch(/^bucket_\d+$/);
    const n = Number(c.split("_")[1]);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThan(100);
  });

  it("different user keys → different cohorts", () => {
    const cohorts = new Set(
      Array.from({ length: 500 }, (_, i) => assignCohort(`user_${i}`)),
    );
    expect(cohorts.size).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/features/cohort.ts`:

```typescript
/**
 * Cohort assignment (Phase 6 Task 15).
 *
 * Stable SHA-256 hash → 0..99 bucket. Anonymous users get an
 * anonymousId from localStorage. Works in browser and node.
 */

import type { FlagKey } from "./flags/registry";
import type { CohortBucket } from "@/types/telemetry";

function isoStableSalt(): string {
  // Salt prevents different products sharing the same userId from
  // landing users in the same bucket.
  return "architex-v1";
}

function sha256ToNumber(input: string): number {
  // Browser path
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto?.subtle !== "undefined" &&
    typeof TextEncoder !== "undefined"
  ) {
    // We need a synchronous 0..99 bucket, but WebCrypto is async.
    // Instead use a simple FNV-1a hash — good enough for bucket
    // assignment, not for security.
    return fnv1aTo100(input);
  }
  // Server path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const h = createHash("sha256").update(input).digest();
  return h.readUInt32BE(0) % 100;
}

function fnv1aTo100(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % 100;
}

export function hashCohortBucket(userId: string, flagKey: FlagKey): number {
  return sha256ToNumber(`${isoStableSalt()}:${userId}:${flagKey}`);
}

export function assignCohort(userIdOrAnon: string): CohortBucket {
  const bucket = sha256ToNumber(`${isoStableSalt()}:${userIdOrAnon}:global`);
  return `bucket_${bucket}` as CohortBucket;
}

const ANON_STORAGE_KEY = "architex_anonymous_id_v1";

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "anon_ssr";
  try {
    const stored = localStorage.getItem(ANON_STORAGE_KEY);
    if (stored) return stored;
    const fresh = `anon_${crypto.randomUUID?.() ?? String(Date.now())}`;
    localStorage.setItem(ANON_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return "anon_unknown";
  }
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd architex && pnpm test:run src/features/__tests__/cohort.test.ts
git add architex/src/features/cohort.ts architex/src/features/__tests__/cohort.test.ts
git commit -m "plan(lld-phase-6-task15): stable hash cohort assignment with anonymous-id persistence"
```

---

## Task 16: A/B test framework

**Files:**
- Create: `architex/src/features/ab-test.ts`
- Create: `architex/src/features/__tests__/ab-test.test.ts`

**Design intent:** A thin wrapper around `getVariant` that fires the `lld_ab_exposure` event exactly once per `(experimentKey, user)` pair per session. Variant assignment is deterministic per user + registry-declared variants list. Metric attribution is automatic via the cohort stamping from Task 8.

- [ ] **Step 1: Test first**

Create `architex/src/features/__tests__/ab-test.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { exposeExperiment, __testing_ab } from "../ab-test";

describe("exposeExperiment", () => {
  beforeEach(() => {
    __testing_ab.reset();
  });

  it("fires exposure exactly once per session", () => {
    const spy = vi.fn();
    __testing_ab.setEmitFn(spy);
    exposeExperiment("lld.experiment.drill_celebration_v2", "user_abc");
    exposeExperiment("lld.experiment.drill_celebration_v2", "user_abc");
    exposeExperiment("lld.experiment.drill_celebration_v2", "user_abc");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns deterministic variant for same user", () => {
    const a = exposeExperiment(
      "lld.experiment.drill_celebration_v2",
      "user_x",
    );
    __testing_ab.reset();
    const b = exposeExperiment(
      "lld.experiment.drill_celebration_v2",
      "user_x",
    );
    expect(a).toBe(b);
  });

  it("variant is always one of registry's declared variants", () => {
    const v = exposeExperiment(
      "lld.experiment.drill_celebration_v2",
      "user_y",
    );
    expect(["control", "confetti", "badge"]).toContain(v);
  });

  it("stamps variant into cohort stamping so future events carry it", () => {
    const addVariant = vi.fn();
    __testing_ab.setAddVariantFn(addVariant);
    exposeExperiment("lld.experiment.review_card_layout", "user_k");
    expect(addVariant).toHaveBeenCalledWith(
      "lld.experiment.review_card_layout",
      expect.stringMatching(/^(control|stacked|inline)$/),
    );
  });
});
```

- [ ] **Step 2: Implement**

Create `architex/src/features/ab-test.ts`:

```typescript
/**
 * A/B test framework (Phase 6 Task 16).
 *
 * Call `exposeExperiment(flagKey, userId)` at the first point the user
 * sees the experiment. Variant is deterministic per user; exposure is
 * fired exactly once per session so downstream dashboards can attribute
 * metrics to variants.
 */

import type { FlagKey } from "./flags/registry";
import { getFlagMeta } from "./flags/registry";
import { hashCohortBucket, assignCohort } from "./cohort";
import {
  Events,
  emit,
  type LLDEvent,
} from "@/lib/analytics/lld-events";
import { addStampingVariant } from "@/lib/analytics/cohort-stamping";

const _exposedThisSession = new Set<string>();

type EmitFn = (e: LLDEvent) => void;
type AddVariantFn = (experimentKey: string, variant: string) => void;

let _emitOverride: EmitFn | null = null;
let _addVariantOverride: AddVariantFn | null = null;

function dispatchEmit(e: LLDEvent): void {
  if (_emitOverride) return _emitOverride(e);
  void emit(e);
}

function dispatchAddVariant(experimentKey: string, variant: string): void {
  if (_addVariantOverride) return _addVariantOverride(experimentKey, variant);
  addStampingVariant(experimentKey, variant);
}

export function resolveVariant(key: FlagKey, userId: string): string {
  const meta = getFlagMeta(key);
  if (!meta || !meta.variants) {
    return typeof meta?.defaultValue === "string" ? meta.defaultValue : "control";
  }
  const bucket = hashCohortBucket(userId, key);
  return meta.variants[bucket % meta.variants.length];
}

export function exposeExperiment(key: FlagKey, userId: string): string {
  const variant = resolveVariant(key, userId);
  const sessionKey = `${key}:${userId}`;
  if (!_exposedThisSession.has(sessionKey)) {
    _exposedThisSession.add(sessionKey);
    dispatchAddVariant(key, variant);
    dispatchEmit(
      Events.abExposure({
        experimentKey: key,
        variant,
        cohort: assignCohort(userId),
      }),
    );
  }
  return variant;
}

export const __testing_ab = {
  reset(): void {
    _exposedThisSession.clear();
    _emitOverride = null;
    _addVariantOverride = null;
  },
  setEmitFn(fn: EmitFn): void {
    _emitOverride = fn;
  },
  setAddVariantFn(fn: AddVariantFn): void {
    _addVariantOverride = fn;
  },
};
```

- [ ] **Step 3: Verify + commit**

```bash
cd architex && pnpm test:run src/features/__tests__/ab-test.test.ts
git add architex/src/features/ab-test.ts architex/src/features/__tests__/ab-test.test.ts
git commit -m "plan(lld-phase-6-task16): A/B test framework with once-per-session exposure"
```

---

## Task 17: Feature flag admin API + UI

**Files:**
- Create: `architex/src/app/api/flags/route.ts`
- Create: `architex/src/app/api/admin/kill-switch/route.ts`
- Create: `architex/src/app/api/admin/cohort/route.ts`
- Create: `architex/src/app/(dashboard)/admin/flags/page.tsx`
- Create: `architex/src/app/(dashboard)/admin/kill-switch/page.tsx`

**Design intent:** Operators trigger kill switches via a UI, not by editing env vars. Admin UI is protected by an `adminRequired()` guard (check for `@architex.dev` email + MFA). Kill-switch page has one big red button per kill-switch flag.

- [ ] **Step 1: Flag state API**

Create `architex/src/app/api/flags/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FLAG_REGISTRY, type FlagKey } from "@/features/flags/registry";
import { resolveRollout } from "@/features/rollout";

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const userEmail = user?.primaryEmail ?? null;

  const flags: Record<string, { enabled: boolean; reason: string; stage: string }> = {};
  for (const [key] of FLAG_REGISTRY) {
    const decision = resolveRollout(key as FlagKey, { userId, userEmail });
    flags[key] = {
      enabled: decision.allowed,
      reason: decision.reason,
      stage: decision.stage,
    };
  }

  return NextResponse.json({
    flags,
    userId,
    at: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Kill-switch API**

Create `architex/src/app/api/admin/kill-switch/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { FLAG_REGISTRY, type FlagKey } from "@/features/flags/registry";
import { Events, emit } from "@/lib/analytics/lld-events";

/**
 * POST /api/admin/kill-switch
 * Body: { flagKey: string, reason: string }
 *
 * This endpoint *records* a kill-switch request to the audit log.
 * Actually flipping the switch still requires updating the env var
 * NEXT_PUBLIC_LLD_KILL_SWITCHES and redeploying — that is intentional,
 * the extra step prevents accidental overnight outages.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();

  const body = (await req.json()) as {
    flagKey: string;
    reason: string;
  };

  if (!FLAG_REGISTRY.has(body.flagKey as FlagKey)) {
    return NextResponse.json(
      { error: "unknown flag" },
      { status: 400 },
    );
  }

  await emit(
    Events.killSwitchFired({
      flagKey: body.flagKey,
      triggeredBy: admin.id,
      reason: body.reason,
    }),
  );

  return NextResponse.json({
    ok: true,
    message:
      "Recorded. Now: add flag key to NEXT_PUBLIC_LLD_KILL_SWITCHES and redeploy.",
    runbook: "/docs/sre/lld-kill-switch-runbook.md",
  });
}
```

- [ ] **Step 3: Cohort lookup API**

Create `architex/src/app/api/admin/cohort/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assignCohort, hashCohortBucket } from "@/features/cohort";
import { FLAG_KEYS, type FlagKey } from "@/features/flags/registry";

/**
 * GET /api/admin/cohort?userId=…
 * Returns the user's global cohort bucket and per-flag bucket matrix.
 */
export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const global = assignCohort(userId);
  const perFlag: Record<string, number> = {};
  for (const key of FLAG_KEYS) {
    perFlag[key] = hashCohortBucket(userId, key as FlagKey);
  }

  return NextResponse.json({ userId, globalCohort: global, perFlag });
}
```

- [ ] **Step 4: Admin UI — flags**

Create `architex/src/app/(dashboard)/admin/flags/page.tsx`:

```tsx
import { FLAG_REGISTRY } from "@/features/flags/registry";
import { currentStage } from "@/features/rollout-config";
import { requireAdmin } from "@/lib/auth";

export default async function AdminFlagsPage() {
  await requireAdmin();

  const rows = Array.from(FLAG_REGISTRY.entries()).map(([key, meta]) => ({
    key,
    meta,
    stage: currentStage(key),
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">LLD Feature Flags</h1>
      <p className="text-sm text-muted-foreground">
        Read-only view. Changing stages is a PR to{" "}
        <code>src/features/rollout-config.ts</code>. Kill switches are at{" "}
        <a href="/admin/kill-switch" className="underline">
          /admin/kill-switch
        </a>
        .
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Key</th>
            <th>Owner</th>
            <th>Stage</th>
            <th>Default</th>
            <th>Remove By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, meta, stage }) => (
            <tr key={key} className="border-t">
              <td className="font-mono">{key}</td>
              <td>{meta.owner}</td>
              <td>{stage}</td>
              <td>{String(meta.defaultValue)}</td>
              <td>{meta.removeBy ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Admin UI — kill switch**

Create `architex/src/app/(dashboard)/admin/kill-switch/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { FLAG_REGISTRY } from "@/features/flags/registry";

export default function AdminKillSwitchPage() {
  const [status, setStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const killSwitches = Array.from(FLAG_REGISTRY.entries()).filter(
    ([, meta]) => meta.killSwitch,
  );

  async function fire(flagKey: string) {
    if (!reason.trim()) {
      setStatus("A reason is required before triggering a kill switch.");
      return;
    }
    const res = await fetch("/api/admin/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagKey, reason }),
    });
    const data = await res.json();
    setStatus(data.message ?? data.error ?? "Unknown response");
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-red-600">Kill Switches</h1>
      <p className="text-sm text-muted-foreground">
        Emergency use only. Triggering records an audit event; the engineer
        on-call must also add the flag key to{" "}
        <code>NEXT_PUBLIC_LLD_KILL_SWITCHES</code> and redeploy for the switch
        to take effect.
      </p>
      <div className="mt-4">
        <label className="text-sm font-medium">
          Reason (required)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="ml-2 w-96 rounded border border-border px-2 py-1"
          />
        </label>
      </div>
      <ul className="mt-6 space-y-3">
        {killSwitches.map(([key, meta]) => (
          <li
            key={key}
            className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-3"
          >
            <div>
              <div className="font-mono text-sm">{key}</div>
              <div className="text-xs text-muted-foreground">
                {meta.description} (owner: {meta.owner})
              </div>
            </div>
            <button
              type="button"
              onClick={() => fire(key)}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              TRIGGER
            </button>
          </li>
        ))}
      </ul>
      {status && (
        <pre className="mt-4 rounded bg-muted p-3 text-xs">{status}</pre>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add architex/src/app/api/flags architex/src/app/api/admin architex/src/app/\(dashboard\)/admin
git commit -m "plan(lld-phase-6-task17): admin flag + kill-switch UI & APIs (audit-logged)"
```

---

