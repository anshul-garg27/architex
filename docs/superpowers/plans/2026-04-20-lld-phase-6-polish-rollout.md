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

