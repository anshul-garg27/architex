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
