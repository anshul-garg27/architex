# SD Phase 0 · Foundations & Pre-flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Architex surface so SD Phase 1 (mode scaffolding + 13 new tables + 10+ new API routes) can be built on a verified baseline. No SD user-visible features ship in this phase. At the end of Phase 0 every `/api/sd/*` route shell returns 501 with an auth guard in front of it, every chaos-engine WebSocket handshake validates a Clerk session, MDX input is sanitized against XSS, rate limits enforce per-user quotas, Sentry scrubs SD-specific payloads, simulation-engine performance has a signed-off baseline, `.next/analyze` sizes are recorded, and the feature-flag registry has the six SD rollout flags declared.

**Architecture:** Phase 0 touches six existing surfaces and creates one net-new namespace.
- *Extends* `src/middleware.ts` rate-limit path (adds composite `ip|userId` keying for `/api/sd/*`).
- *Extends* `src/lib/security/rate-limiter.ts` (sliding-window primitive alongside the current token-bucket).
- *Extends* `src/lib/auth.ts` (adds `requireSDAuth()` wrapper that returns both clerk id and resolved user UUID to save one DB hop per SD route).
- *Extends* `src/features/flags/registry.ts` (the registry created in LLD Phase 6 Task 9 — adds SD flags; does NOT move the file).
- *Extends* `src/lib/security/pii-scrubber.ts` via a new `sanitizeSDEventPayload()` helper.
- *Creates* `src/app/api/sd/**` route shells (14 endpoints, all returning 501 Not Implemented with auth + rate-limit wiring in place).
- *Creates* `src/lib/sd/mdx-sanitizer.ts` — deterministic MDX AST sanitizer that runs before any user-authored MDX is rendered in Learn or Review mode.
- *Creates* `src/lib/sd/ws-auth.ts` — WebSocket handshake auth helper for the chaos-engine streaming endpoint that Phase 3 will use.
- *Creates* `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md` — captured typecheck / lint / test / build / bundle / sim-engine perf numbers.

**Tech Stack:** Next.js 16 App Router (canary), React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Clerk v7, Vitest, Testing Library, `@next/bundle-analyzer`, `rehype-sanitize` + `hast-util-sanitize` (new deps for MDX safety), `@sentry/nextjs` (to be added; config stub only in this phase), `isomorphic-dompurify` (defense in depth for any raw-HTML escape hatch).

**Prerequisite:** LLD Phase 1 through Phase 6 are merged to `main` — this plan relies on the feature-flag registry Task 9 delivers and the `requireAuth()` hardening done in LLD Phase 1 pre-flight. If any LLD phase is outstanding, stop and resolve that first.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md`:
- §15 AI Integration — drives the Anthropic SDK usage guards in Step 6.
- §21 Data Model — confirms 13 new SD tables; only the route *shells* ship here, table creation is Phase 1.
- §23 Phase 0 — canonical scope. This plan is the executable form of §23.
- §24 Rollout Plan — drives the feature-flag shape in Task 9.

---

## Pre-flight checklist (~2 hours)

Run before Task 1. Establishes the numbers we must not regress beyond.

- [ ] **Verify LLD shell is green on `main`**

  ```bash
  cd architex
  git fetch origin
  git log --oneline origin/main -1
  ```
  Expected: last commit message starts with `chore: Phase 1 complete` or later (i.e. LLD shell merged). If you still see `spec(sd): §29 complete` as the tip, LLD Phase 1 hasn't landed yet — do not proceed.

- [ ] **Confirm you are on a fresh branch off `main`**

  ```bash
  git checkout -b sd/phase-0-foundations
  git status
  ```
  Expected: `nothing to commit, working tree clean`.

- [ ] **Install any pending deps**

  ```bash
  pnpm install --frozen-lockfile
  ```
  Expected: zero new installs (lockfile should already match `main`). If anything resolves new, stop — someone's package.json drifted.

- [ ] **Snapshot baseline counts**

  Record into `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md` (we will create this file formally in Task 2):

  ```bash
  cd architex
  pnpm typecheck 2>&1 | tee /tmp/sd-phase0-typecheck.log
  pnpm lint 2>&1 | tee /tmp/sd-phase0-lint.log
  pnpm test:run 2>&1 | tee /tmp/sd-phase0-test.log
  pnpm build 2>&1 | tee /tmp/sd-phase0-build.log
  ```
  Expected: all four commands exit 0. Capture the **final tallies** (typecheck errors, lint errors + warnings, test files + passing tests, build bundle totals) into the baseline doc as Task 2 will ask for exact numbers.

- [ ] **Run the existing simulation engine against the canonical design**

  ```bash
  cd architex
  pnpm test:run -- src/lib/simulation/__tests__/engine-benchmark.test.ts --reporter=json > /tmp/sd-phase0-sim-bench.json
  ```
  Expected: JSON output with `durationMs`, `peakMemoryMB`, and `p99LatencyMs` fields on the `canonical-shard` suite. We will compare Phase 1+ runs against these numbers. If the benchmark file doesn't exist yet, create the skeleton in Task 7; do not block Phase 0 on historical benchmark absence.

- [ ] **Open `.next/analyze` reports and screenshot the totals**

  ```bash
  cd architex
  pnpm analyze
  open .next/analyze/client.html .next/analyze/nodejs.html .next/analyze/edge.html
  ```
  Expected: three HTML pages load. Capture the "Stat size" and "Parsed size" totals into Task 2's baseline doc.

- [ ] **Commit nothing yet**

  Phase 0 commits begin in Task 1. The pre-flight log files live in `/tmp/` only.

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── src/
│   ├── app/api/sd/                                               # NEW namespace
│   │   ├── concepts/route.ts                                     # NEW (501)
│   │   ├── concepts/[slug]/route.ts                              # NEW (501)
│   │   ├── problems/route.ts                                     # NEW (501)
│   │   ├── problems/[slug]/route.ts                              # NEW (501)
│   │   ├── diagrams/route.ts                                     # NEW (501)
│   │   ├── diagrams/[id]/route.ts                                # NEW (501)
│   │   ├── simulations/route.ts                                  # NEW (501)
│   │   ├── simulations/[id]/route.ts                             # NEW (501)
│   │   ├── simulations/[id]/stream/route.ts                      # NEW (501 — WS upgrade lives here)
│   │   ├── drill-attempts/route.ts                               # NEW (501)
│   │   ├── drill-attempts/[id]/route.ts                          # NEW (501)
│   │   ├── drill-attempts/active/route.ts                        # NEW (501)
│   │   ├── chaos-events/route.ts                                 # NEW (501)
│   │   ├── real-incidents/route.ts                               # NEW (501)
│   │   └── __tests__/sd-route-shells.test.ts                     # NEW
│   ├── lib/
│   │   ├── auth.ts                                               # MODIFY (+ requireSDAuth helper)
│   │   ├── security/
│   │   │   ├── rate-limiter.ts                                   # MODIFY (+ sliding-window primitive)
│   │   │   ├── __tests__/rate-limiter-sliding.test.ts            # NEW
│   │   │   ├── pii-scrubber.ts                                   # MODIFY (+ sanitizeSDEventPayload)
│   │   │   └── __tests__/pii-scrubber-sd.test.ts                 # NEW
│   │   └── sd/                                                   # NEW namespace
│   │       ├── mdx-sanitizer.ts                                  # NEW
│   │       ├── ws-auth.ts                                        # NEW
│   │       └── __tests__/
│   │           ├── mdx-sanitizer.test.ts                         # NEW
│   │           └── ws-auth.test.ts                               # NEW
│   ├── features/flags/
│   │   └── registry.ts                                           # MODIFY (+ 6 sd.* flag entries)
│   ├── middleware.ts                                             # MODIFY (sd-specific composite rate-limit key)
│   └── instrumentation.ts                                        # NEW (Sentry init stub)
├── sentry.client.config.ts                                       # NEW
├── sentry.server.config.ts                                       # NEW
├── sentry.edge.config.ts                                         # NEW
└── docs/superpowers/baselines/
    └── 2026-04-20-sd-phase-0-baseline.md                         # NEW
```

**Design rationale for splits:**
- `src/app/api/sd/**` route shells are split per HTTP resource to follow Next.js App Router conventions and to let Phase 1 fill them one by one without merge conflicts across teams.
- `src/lib/sd/` is a new namespace so that SD-only security primitives (MDX sanitizer, WebSocket auth) don't bleed into the global `lib/security/` surface, which must stay minimal and audited.
- Sentry configs are three separate files because `@sentry/nextjs` requires distinct client / server / edge entry points; `instrumentation.ts` wires them.
- The baseline doc lives under `docs/superpowers/baselines/` (not `plans/`) because it is a living record, updated each phase.

---

## Table of Contents

- [Task 1: Create baseline doc scaffold + capture pre-flight numbers](#task-1-create-baseline-doc-scaffold--capture-pre-flight-numbers)
- [Task 2: Record simulation-engine perf baseline](#task-2-record-simulation-engine-perf-baseline)
- [Task 3: Record bundle-size baseline](#task-3-record-bundle-size-baseline)
- [Task 4: Add sliding-window rate-limit primitive](#task-4-add-sliding-window-rate-limit-primitive)
- [Task 5: Wire composite (IP + userId) rate-limit key for `/api/sd/*`](#task-5-wire-composite-ip--userid-rate-limit-key-for-apisd)
- [Task 6: Add `requireSDAuth()` helper](#task-6-add-requiresdauth-helper)
- [Task 7: Create 14 `/api/sd/*` route shells (501 + auth guards)](#task-7-create-14-apisd-route-shells-501--auth-guards)
- [Task 8: WebSocket auth pattern for chaos-engine streams](#task-8-websocket-auth-pattern-for-chaos-engine-streams)
- [Task 9: Feature-flag registry extension — six SD flags](#task-9-feature-flag-registry-extension--six-sd-flags)
- [Task 10: MDX sanitizer for Learn + Review rendering](#task-10-mdx-sanitizer-for-learn--review-rendering)
- [Task 11: Sentry PII scrubbing for SD payloads](#task-11-sentry-pii-scrubbing-for-sd-payloads)
- [Task 12: Final verification + Phase 0 sign-off](#task-12-final-verification--phase-0-sign-off)

---

## Task 1: Create baseline doc scaffold + capture pre-flight numbers

**Files:**
- Create: `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md`

**Design intent:** One Markdown file that records every number Phase 1+ must compare against. Phase 0 populates Sections A-C; Phase 1 adds Section D (post-Phase-1 deltas), etc. This file is append-only — numbers go in, numbers never come out.

- [ ] **Step 1: Make the parent directory**

  ```bash
  mkdir -p docs/superpowers/baselines
  ```
  Expected: creates `docs/superpowers/baselines/`. No output on success.

- [ ] **Step 2: Write the baseline doc**

  Create `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md`:

  ````markdown
  # SD Phase 0 Baseline Snapshot

  > Recorded at the start of SD Phase 0 to give every later phase a numeric anchor.
  >
  > **Rule:** When a later phase adds a section, the numbers from earlier sections are **frozen**. If a regression happens, the team opens a bug — they do not edit the earlier numbers away.

  ## Section A · Build & test baseline (Phase 0 Task 1)

  | Metric                      | Value | Captured from |
  | --------------------------- | ----- | ------------- |
  | `pnpm typecheck` duration   | TODO  | /tmp/sd-phase0-typecheck.log |
  | `pnpm typecheck` errors     | TODO  | "" |
  | `pnpm lint` duration        | TODO  | /tmp/sd-phase0-lint.log |
  | `pnpm lint` errors          | TODO  | "" |
  | `pnpm lint` warnings        | TODO  | "" |
  | `pnpm test:run` duration    | TODO  | /tmp/sd-phase0-test.log |
  | `pnpm test:run` test files  | TODO  | "" |
  | `pnpm test:run` tests       | TODO  | "" |
  | `pnpm test:run` failures    | TODO  | "" |
  | `pnpm build` duration       | TODO  | /tmp/sd-phase0-build.log |
  | `pnpm build` exit code      | TODO  | "" |

  ## Section B · Simulation engine perf baseline (Phase 0 Task 2)

  | Metric                              | Value | Scenario      |
  | ----------------------------------- | ----- | ------------- |
  | `canonical-shard` sim duration (ms) | TODO  | 10k DAU, validate activity |
  | `canonical-shard` peak memory (MB)  | TODO  | "" |
  | `canonical-shard` p99 tick (ms)     | TODO  | "" |
  | `canonical-shard` fps target        | 60    | constant — do not edit |
  | `chaos-storm` sim duration (ms)     | TODO  | 1M DAU, chaos activity, 10 events |
  | `chaos-storm` peak memory (MB)      | TODO  | "" |
  | `chaos-storm` p99 tick (ms)         | TODO  | "" |

  ## Section C · Bundle-size baseline (Phase 0 Task 3)

  | Bundle                           | Stat size | Parsed size |
  | -------------------------------- | --------- | ----------- |
  | `.next/analyze/client.html`      | TODO      | TODO        |
  | `.next/analyze/nodejs.html`      | TODO      | TODO        |
  | `.next/analyze/edge.html`        | TODO      | TODO        |

  **Threshold rule:** Phase 1+ must not increase client parsed size by more than **+25 KB gzipped** per phase without a written exception in the phase plan.

  ## Section D · Placeholder for Phase 1 (do not fill now)

  _Populated by the engineer closing out SD Phase 1._
  ````

- [ ] **Step 3: Fill Section A from the pre-flight logs**

  For each row in Section A, open the corresponding log file in `/tmp/` and replace `TODO` with the measured value. Example:

  ```bash
  grep -c "^" /tmp/sd-phase0-typecheck.log   # rough duration proxy = line count if timed
  grep -c "error TS" /tmp/sd-phase0-typecheck.log
  ```

  Concrete replacements: open the Markdown table in your editor, type the numbers, save. Do NOT guess — if a value is absent from the log, re-run the pre-flight step to capture it.

- [ ] **Step 4: Run typecheck to confirm the doc is pure Markdown (no accidental code imports)**

  ```bash
  pnpm typecheck
  ```
  Expected: unchanged from pre-flight — Markdown files don't enter the TypeScript graph.

- [ ] **Step 5: Commit**

  ```bash
  git add docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md
  git commit -m "$(cat <<'EOF'
  docs(sd-phase-0): scaffold baseline doc + capture Section A numbers

  One append-only file that later phases compare against. Section A holds
  typecheck/lint/test/build counts; Sections B-C filled by Tasks 2 and 3.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Record simulation-engine perf baseline

**Files:**
- Create: `architex/src/lib/simulation/__tests__/engine-benchmark.test.ts`
- Modify: `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md` (Section B)

**Design intent:** A repeatable Vitest harness that loads the existing simulation engine with a fixed canonical design, runs it for a fixed sim duration, and emits three numbers: sim-duration-ms, peak-memory-MB, p99-tick-ms. Future phases re-run this test and diff against Section B.

- [ ] **Step 1: Write the failing test**

  Create `architex/src/lib/simulation/__tests__/engine-benchmark.test.ts`:

  ```typescript
  /**
   * SD Phase 0 · Sim-engine perf harness (Task 2).
   *
   * Deterministic benchmark over a canonical design and a chaos-storm design.
   * Emits structured JSON on stdout for later diff. Kept cheap enough to run
   * in CI (<5s wall time).
   */

  import { describe, it, expect } from "vitest";
  import {
    createSimulationEngine,
    CANONICAL_SHARD_DESIGN,
    CHAOS_STORM_DESIGN,
  } from "@/lib/simulation";

  function runBench(
    design: typeof CANONICAL_SHARD_DESIGN,
    durationSimSeconds: number,
  ) {
    const engine = createSimulationEngine({ design, seed: 1_234_567 });
    const tickMs: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    const wallStart = performance.now();

    for (let t = 0; t < durationSimSeconds * 1000; t += 16) {
      const tickStart = performance.now();
      engine.tick(16);
      tickMs.push(performance.now() - tickStart);
    }

    const wallEnd = performance.now();
    const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;

    tickMs.sort((a, b) => a - b);
    const p99 = tickMs[Math.floor(tickMs.length * 0.99)] ?? 0;

    return {
      durationMs: Math.round(wallEnd - wallStart),
      peakMemoryMB: Math.round(memoryAfter - memoryBefore),
      p99LatencyMs: Number(p99.toFixed(2)),
    };
  }

  describe("SD Phase 0 · sim-engine benchmark", () => {
    it("canonical-shard runs under a 5-second budget", () => {
      const result = runBench(CANONICAL_SHARD_DESIGN, 60);
      // Emit machine-readable line for docs capture
      console.log(
        `[BENCH] canonical-shard ${JSON.stringify(result)}`,
      );
      expect(result.durationMs).toBeLessThan(5_000);
    });

    it("chaos-storm runs under an 8-second budget", () => {
      const result = runBench(CHAOS_STORM_DESIGN, 60);
      console.log(
        `[BENCH] chaos-storm ${JSON.stringify(result)}`,
      );
      expect(result.durationMs).toBeLessThan(8_000);
    });
  });
  ```

- [ ] **Step 2: Verify the test fails for the right reason**

  ```bash
  pnpm test:run -- engine-benchmark
  ```
  Expected: FAIL with `Cannot find module '@/lib/simulation'` OR `CANONICAL_SHARD_DESIGN is not exported`. That's the signal — existing engine doesn't export these constants yet, so we add them next.

- [ ] **Step 3: Add the two canonical designs**

  Open `architex/src/lib/simulation/index.ts`. Append:

  ```typescript
  /**
   * SD Phase 0 · Canonical designs used by the perf benchmark.
   * Keep these objects FROZEN — editing them invalidates the baseline.
   */
  export const CANONICAL_SHARD_DESIGN = Object.freeze({
    id: "phase0-canonical-shard",
    nodes: [
      { id: "lb", type: "load-balancer", capacity: 10_000 },
      { id: "web1", type: "web-server", capacity: 2_000 },
      { id: "web2", type: "web-server", capacity: 2_000 },
      { id: "db", type: "primary-db", capacity: 500, latencyMs: 5 },
      { id: "cache", type: "redis", capacity: 20_000, latencyMs: 1 },
    ],
    edges: [
      { from: "lb", to: "web1" },
      { from: "lb", to: "web2" },
      { from: "web1", to: "cache" },
      { from: "web2", to: "cache" },
      { from: "web1", to: "db" },
      { from: "web2", to: "db" },
    ],
    scale: "10k-dau",
  });

  export const CHAOS_STORM_DESIGN = Object.freeze({
    id: "phase0-chaos-storm",
    nodes: [
      ...CANONICAL_SHARD_DESIGN.nodes,
      { id: "queue", type: "message-queue", capacity: 50_000 },
      { id: "worker", type: "worker", capacity: 1_000 },
    ],
    edges: [
      ...CANONICAL_SHARD_DESIGN.edges,
      { from: "web1", to: "queue" },
      { from: "queue", to: "worker" },
    ],
    scale: "1M-dau",
    chaosEvents: [
      "db-slow-query",
      "cache-eviction-storm",
      "lb-instance-crash",
    ],
  });
  ```

  If `createSimulationEngine` is not yet exported from the barrel, add:

  ```typescript
  export { createSimulationEngine } from "./engine";
  ```

- [ ] **Step 4: Run the benchmark and capture output**

  ```bash
  pnpm test:run -- engine-benchmark --reporter=verbose 2>&1 | tee /tmp/sd-phase0-sim-bench.log
  ```
  Expected: PASS · two `[BENCH]` lines in the log with JSON shapes `{durationMs, peakMemoryMB, p99LatencyMs}`.

- [ ] **Step 5: Transcribe numbers into Section B of the baseline doc**

  Open `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md`. For each row in Section B, replace `TODO` with the corresponding value from the two `[BENCH]` lines. Save.

- [ ] **Step 6: Commit**

  ```bash
  git add architex/src/lib/simulation/__tests__/engine-benchmark.test.ts architex/src/lib/simulation/index.ts docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md
  git commit -m "$(cat <<'EOF'
  perf(sd-phase-0): capture sim-engine baseline · canonical-shard + chaos-storm

  Two frozen canonical designs drive a Vitest benchmark that emits
  durationMs, peakMemoryMB, and p99LatencyMs per scenario. Numbers landed
  in Section B of the Phase 0 baseline doc.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Record bundle-size baseline

**Files:**
- Create: `architex/scripts/capture-bundle-size.ts`
- Modify: `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md` (Section C)

**Design intent:** A tsx script that parses `.next/analyze/*.html` via regex, extracts the "Stat size" and "Parsed size" totals, and prints them as JSON. Runs after `pnpm analyze`. Stored as a script so Phase 1+ can diff with one shared tool.

- [ ] **Step 1: Write the capture script**

  Create `architex/scripts/capture-bundle-size.ts`:

  ```typescript
  /**
   * SD Phase 0 · Bundle-size capture (Task 3).
   *
   * Reads .next/analyze/{client,nodejs,edge}.html, extracts the two total-size
   * numbers rendered by webpack-bundle-analyzer, and prints JSON for the
   * baseline doc.
   *
   * Usage: `pnpm tsx scripts/capture-bundle-size.ts`
   */

  import { readFileSync, existsSync } from "node:fs";
  import { resolve } from "node:path";

  const ANALYZE_DIR = resolve(process.cwd(), ".next/analyze");
  const REPORTS = ["client", "nodejs", "edge"] as const;

  type BundleSize = {
    name: string;
    statSize: string | null;
    parsedSize: string | null;
  };

  function extract(html: string): {
    statSize: string | null;
    parsedSize: string | null;
  } {
    // webpack-bundle-analyzer embeds a window.chartData JSON blob.
    const chartMatch = html.match(
      /window\.chartData\s*=\s*(\[[\s\S]*?\]);/m,
    );
    if (!chartMatch?.[1]) return { statSize: null, parsedSize: null };
    try {
      const data = JSON.parse(chartMatch[1]) as Array<{
        statSize: number;
        parsedSize: number;
      }>;
      const stat = data.reduce((a, b) => a + b.statSize, 0);
      const parsed = data.reduce((a, b) => a + b.parsedSize, 0);
      return {
        statSize: `${(stat / 1024).toFixed(1)} KB`,
        parsedSize: `${(parsed / 1024).toFixed(1)} KB`,
      };
    } catch {
      return { statSize: null, parsedSize: null };
    }
  }

  const results: BundleSize[] = REPORTS.map((name) => {
    const path = resolve(ANALYZE_DIR, `${name}.html`);
    if (!existsSync(path)) {
      return { name, statSize: null, parsedSize: null };
    }
    const html = readFileSync(path, "utf8");
    return { name, ...extract(html) };
  });

  console.log(JSON.stringify(results, null, 2));

  if (results.some((r) => r.statSize === null)) {
    process.exit(1);
  }
  ```

- [ ] **Step 2: Run the analyzer + capture script**

  ```bash
  cd architex
  pnpm analyze
  pnpm tsx scripts/capture-bundle-size.ts > /tmp/sd-phase0-bundle.json
  cat /tmp/sd-phase0-bundle.json
  ```
  Expected: JSON array with three entries, each with non-null `statSize` and `parsedSize`. If any entry is null, the analyze build didn't emit that report — re-run `pnpm analyze`.

- [ ] **Step 3: Transcribe into Section C of the baseline doc**

  Open `docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md`. Replace each `TODO` in Section C with the corresponding entry from the JSON. Save.

- [ ] **Step 4: Commit**

  ```bash
  git add architex/scripts/capture-bundle-size.ts docs/superpowers/baselines/2026-04-20-sd-phase-0-baseline.md
  git commit -m "$(cat <<'EOF'
  perf(sd-phase-0): capture bundle-size baseline for client, nodejs, edge

  Script reuses webpack-bundle-analyzer output and emits JSON. Section C
  of the Phase 0 baseline now has the three bundle totals. Phase 1+ will
  re-run this script and diff against Section C.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Add sliding-window rate-limit primitive

**Files:**
- Modify: `architex/src/lib/security/rate-limiter.ts`
- Create: `architex/src/lib/security/__tests__/rate-limiter-sliding.test.ts`

**Design intent:** Existing rate limiter is a token-bucket keyed by IP. SD routes need a sliding-window limiter keyed by composite `ip|userId`, because drill-attempt POSTs are bursty (one burst at submit time) but we want to allow one burst per user without letting a single IP abuse the endpoint across many users. Add the primitive here; Task 5 wires it.

- [ ] **Step 1: Write the failing test**

  Create `architex/src/lib/security/__tests__/rate-limiter-sliding.test.ts`:

  ```typescript
  import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
  import { createSlidingWindowLimiter } from "@/lib/security/rate-limiter";

  describe("sliding-window rate limiter", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("allows up to maxRequests inside the window", () => {
      const limiter = createSlidingWindowLimiter({
        maxRequests: 3,
        windowMs: 1000,
      });
      expect(limiter.checkLimit("k").allowed).toBe(true);
      expect(limiter.checkLimit("k").allowed).toBe(true);
      expect(limiter.checkLimit("k").allowed).toBe(true);
      expect(limiter.checkLimit("k").allowed).toBe(false);
    });

    it("recovers capacity as the window slides", () => {
      const limiter = createSlidingWindowLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });
      limiter.checkLimit("k"); // t=0
      limiter.checkLimit("k"); // t=0
      expect(limiter.checkLimit("k").allowed).toBe(false);

      vi.advanceTimersByTime(1001);
      expect(limiter.checkLimit("k").allowed).toBe(true);
    });

    it("isolates keys", () => {
      const limiter = createSlidingWindowLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });
      expect(limiter.checkLimit("a").allowed).toBe(true);
      expect(limiter.checkLimit("b").allowed).toBe(true);
      expect(limiter.checkLimit("a").allowed).toBe(false);
    });

    it("exposes remaining and resetAt", () => {
      const limiter = createSlidingWindowLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });
      const r1 = limiter.checkLimit("k");
      expect(r1.remaining).toBe(4);
      expect(r1.resetAt).toBeGreaterThan(Date.now());
    });
  });
  ```

- [ ] **Step 2: Run — verify failure**

  ```bash
  pnpm test:run -- rate-limiter-sliding
  ```
  Expected: FAIL with `createSlidingWindowLimiter is not a function`.

- [ ] **Step 3: Implement the primitive**

  Open `architex/src/lib/security/rate-limiter.ts`. At the bottom, append:

  ```typescript
  // ─────────────────────────────────────────────────────────────
  // Sliding-window limiter (SD Phase 0 Task 4)
  // ─────────────────────────────────────────────────────────────

  export interface SlidingWindowOptions {
    maxRequests: number;
    windowMs: number;
  }

  interface WindowRecord {
    timestamps: number[];
  }

  export function createSlidingWindowLimiter(
    options: SlidingWindowOptions,
  ): RateLimiter {
    const { maxRequests, windowMs } = options;
    const windows = new Map<string, WindowRecord>();

    const CLEANUP_INTERVAL_MS = 60_000;
    const cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - windowMs;
      for (const [key, record] of windows) {
        const kept = record.timestamps.filter((t) => t >= cutoff);
        if (kept.length === 0) windows.delete(key);
        else record.timestamps = kept;
      }
    }, CLEANUP_INTERVAL_MS);

    if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
      (cleanupTimer as { unref: () => void }).unref();
    }

    return {
      checkLimit: (key: string): RateLimitResult => {
        const now = Date.now();
        const cutoff = now - windowMs;
        const record = windows.get(key) ?? { timestamps: [] };
        record.timestamps = record.timestamps.filter((t) => t >= cutoff);

        if (record.timestamps.length >= maxRequests) {
          const oldest = record.timestamps[0] ?? now;
          return {
            allowed: false,
            remaining: 0,
            resetAt: oldest + windowMs,
          };
        }

        record.timestamps.push(now);
        windows.set(key, record);
        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - record.timestamps.length),
          resetAt: now + windowMs,
        };
      },
      reset: (key: string) => {
        windows.delete(key);
      },
      destroy: () => {
        clearInterval(cleanupTimer);
        windows.clear();
      },
      size: () => windows.size,
    };
  }
  ```

- [ ] **Step 4: Run — expect PASS**

  ```bash
  pnpm test:run -- rate-limiter-sliding
  ```
  Expected: PASS · 4 assertions.

- [ ] **Step 5: Commit**

  ```bash
  git add architex/src/lib/security/rate-limiter.ts architex/src/lib/security/__tests__/rate-limiter-sliding.test.ts
  git commit -m "$(cat <<'EOF'
  feat(security): add sliding-window rate-limit primitive

  Complements the existing token-bucket limiter. SD route shells (Task 5)
  will key this by composite ip|userId so bursty per-user traffic doesn't
  starve a shared IP pool.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Wire composite (IP + userId) rate-limit key for `/api/sd/*`

**Files:**
- Modify: `architex/src/middleware.ts`
- Create: `architex/src/lib/security/__tests__/middleware-sd-rate-limit.test.ts`

**Design intent:** Existing middleware applies the IP-keyed token-bucket to every `/api/*`. For `/api/sd/*` specifically, we layer a second check using the new sliding-window limiter with key = `sd:{ip}|{userId}` so that each (IP, user) pair gets its own quota. This lets us set a stricter per-user quota (e.g. 30/min) without strangling IPs that serve many users.

- [ ] **Step 1: Write the failing test**

  Create `architex/src/lib/security/__tests__/middleware-sd-rate-limit.test.ts`:

  ```typescript
  import { describe, it, expect, beforeEach, vi } from "vitest";
  import { NextRequest } from "next/server";

  // We test the helper extracted in Step 3 directly — middleware.ts itself is
  // tested via integration, not unit, to avoid Clerk mocking drift.
  import { buildSDCompositeKey } from "@/lib/security/sd-rate-limit";

  describe("buildSDCompositeKey", () => {
    it("combines ip and userId with a pipe", () => {
      expect(buildSDCompositeKey("1.2.3.4", "user_abc")).toBe(
        "sd:1.2.3.4|user_abc",
      );
    });

    it("falls back to anon when userId is null", () => {
      expect(buildSDCompositeKey("1.2.3.4", null)).toBe(
        "sd:1.2.3.4|anon",
      );
    });

    it("lowercases the userId to avoid Clerk-case drift", () => {
      expect(buildSDCompositeKey("1.2.3.4", "User_ABC")).toBe(
        "sd:1.2.3.4|user_abc",
      );
    });
  });
  ```

- [ ] **Step 2: Run — verify failure**

  ```bash
  pnpm test:run -- middleware-sd-rate-limit
  ```
  Expected: FAIL `Cannot find module '@/lib/security/sd-rate-limit'`.

- [ ] **Step 3: Extract the helper + limiter singleton**

  Create `architex/src/lib/security/sd-rate-limit.ts`:

  ```typescript
  /**
   * SD Phase 0 · Composite rate-limit key for /api/sd/*.
   *
   * Key shape: `sd:{ip}|{userId}` or `sd:{ip}|anon` when unauthenticated.
   * Limiter is a sliding-window at 30 requests per 60 seconds (tunable via
   * SD_RATE_LIMIT_MAX / SD_RATE_LIMIT_WINDOW_MS env vars).
   */

  import { createSlidingWindowLimiter } from "./rate-limiter";

  const DEFAULT_MAX = 30;
  const DEFAULT_WINDOW_MS = 60_000;

  let singleton: ReturnType<typeof createSlidingWindowLimiter> | null = null;

  export function getSDRateLimiter() {
    if (!singleton) {
      const max = Number(process.env.SD_RATE_LIMIT_MAX ?? DEFAULT_MAX);
      const windowMs = Number(
        process.env.SD_RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS,
      );
      singleton = createSlidingWindowLimiter({
        maxRequests: max,
        windowMs,
      });
    }
    return singleton;
  }

  export function buildSDCompositeKey(
    ip: string,
    userId: string | null,
  ): string {
    const normalizedUser = userId?.toLowerCase() ?? "anon";
    return `sd:${ip}|${normalizedUser}`;
  }
  ```

- [ ] **Step 4: Wire the helper into middleware**

  Open `architex/src/middleware.ts`. Directly **below** the existing rate-limit block (the `if (isApi) { ... }` block that uses `getApiRateLimiter()`), insert:

  ```typescript
  // ── SD-specific per-(ip,userId) rate limit ────────────────
  if (isApi && pathname.startsWith("/api/sd/")) {
    const { getSDRateLimiter, buildSDCompositeKey } = await import(
      "@/lib/security/sd-rate-limit"
    );
    // auth() is imported from @clerk/nextjs at the top; reuse.
    const { userId: clerkUserId } = await (
      auth as unknown as () => Promise<{ userId: string | null }>
    )();
    const compositeKey = buildSDCompositeKey(getClientIP(req), clerkUserId);
    const sdLimiter = getSDRateLimiter();
    const sdResult = sdLimiter.checkLimit(compositeKey);
    if (!sdResult.allowed) {
      const retryAfter = Math.ceil((sdResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many SD requests", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-SD-RateLimit-Remaining": "0",
          },
        },
      );
    }
  }
  ```

  Make sure `auth` from `@clerk/nextjs/server` is imported at the top of the file (it's not currently — the file uses `clerkMiddleware`'s injected `auth` parameter, not the server helper). Add to the imports:

  ```typescript
  // @ts-expect-error -- Clerk v7 conditional exports resolve at runtime only
  import { auth } from "@clerk/nextjs/server";
  ```

- [ ] **Step 5: Run unit test — expect PASS**

  ```bash
  pnpm test:run -- middleware-sd-rate-limit
  ```
  Expected: PASS · 3 assertions.

- [ ] **Step 6: Smoke-test the middleware locally**

  ```bash
  pnpm dev &
  sleep 5
  for i in {1..35}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/sd/concepts; done | sort | uniq -c
  kill %1
  ```
  Expected: ~30 × `501` (route not implemented — Task 7 adds these shells; if they don't exist yet, accept `404` as "route not wired" and continue) followed by 5 × `429` (rate-limit kicks in). If every line is `429`, the limiter is mis-configured; if none are, the key is wrong.

- [ ] **Step 7: Commit**

  ```bash
  git add architex/src/middleware.ts architex/src/lib/security/sd-rate-limit.ts architex/src/lib/security/__tests__/middleware-sd-rate-limit.test.ts
  git commit -m "$(cat <<'EOF'
  feat(security): composite (ip,userId) rate-limit key for /api/sd/*

  Sliding-window at 30 req / 60s per (ip, userId) pair. Falls back to
  sd:{ip}|anon for unauthenticated requests, letting Phase 1's public
  content endpoints (GET /api/sd/concepts) still function. Tunable via
  SD_RATE_LIMIT_MAX and SD_RATE_LIMIT_WINDOW_MS env vars.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Add `requireSDAuth()` helper

**Files:**
- Modify: `architex/src/lib/auth.ts`
- Create: `architex/src/lib/__tests__/auth-sd.test.ts`

**Design intent:** Phase 1 will write 10+ SD route handlers. Each currently repeats `requireAuth` + `resolveUserId` + a null check. `requireSDAuth()` wraps the three-step dance in one call that returns `{clerkId, userId}` or throws a typed error. It also optionally accepts a `featureFlag: FlagKey` argument so routes gated behind flags can fail-closed with a 404 instead of 501/403.

- [ ] **Step 1: Write the failing test**

  Create `architex/src/lib/__tests__/auth-sd.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from "vitest";

  vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
    currentUser: vi.fn(),
  }));

  vi.mock("@/db", () => ({
    getDb: vi.fn(),
    users: {},
  }));

  import { auth, currentUser } from "@clerk/nextjs/server";
  import { requireSDAuth, SDAuthError } from "@/lib/auth";

  describe("requireSDAuth", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("throws SDAuthError('unauthorized') when Clerk returns no userId", async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      await expect(requireSDAuth()).rejects.toThrow(SDAuthError);
      await expect(requireSDAuth()).rejects.toMatchObject({
        kind: "unauthorized",
      });
    });

    it("throws SDAuthError('no-profile') when resolveUserId returns null", async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "clerk_abc",
      });
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(requireSDAuth()).rejects.toMatchObject({
        kind: "no-profile",
      });
    });
  });
  ```

- [ ] **Step 2: Run — verify failure**

  ```bash
  pnpm test:run -- auth-sd
  ```
  Expected: FAIL with `requireSDAuth is not a function`.

- [ ] **Step 3: Implement the helper**

  Open `architex/src/lib/auth.ts`. Append:

  ```typescript
  /**
   * SD Phase 0 · Typed auth wrapper for /api/sd/* handlers.
   *
   * Returns both the Clerk ID and the resolved DB user UUID in one call, so
   * SD routes don't duplicate `requireAuth + resolveUserId + null-check`.
   * Throws a typed SDAuthError which the shared error-handler maps to the
   * correct HTTP status.
   */

  export type SDAuthErrorKind = "unauthorized" | "no-profile";

  export class SDAuthError extends Error {
    constructor(public readonly kind: SDAuthErrorKind, message?: string) {
      super(message ?? kind);
      this.name = "SDAuthError";
    }
  }

  export interface SDAuthContext {
    clerkId: string;
    userId: string;
  }

  export async function requireSDAuth(): Promise<SDAuthContext> {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new SDAuthError("unauthorized");
    const userId = await resolveUserId(clerkId);
    if (!userId) throw new SDAuthError("no-profile");
    return { clerkId, userId };
  }

  /**
   * Map an SDAuthError to the correct HTTP shape. Route handlers use:
   *
   *   try { const ctx = await requireSDAuth(); ... }
   *   catch (e) { return sdAuthErrorResponse(e); }
   */
  export function sdAuthErrorResponse(err: unknown): Response {
    if (err instanceof SDAuthError) {
      if (err.kind === "unauthorized") {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      if (err.kind === "no-profile") {
        return new Response(
          JSON.stringify({ error: "User profile missing" }),
          { status: 404, headers: { "content-type": "application/json" } },
        );
      }
    }
    return new Response(
      JSON.stringify({ error: "Internal" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  ```

- [ ] **Step 4: Run — expect PASS**

  ```bash
  pnpm test:run -- auth-sd
  ```
  Expected: PASS · 2 assertions.

- [ ] **Step 5: Commit**

  ```bash
  git add architex/src/lib/auth.ts architex/src/lib/__tests__/auth-sd.test.ts
  git commit -m "$(cat <<'EOF'
  feat(auth): add requireSDAuth helper + typed SDAuthError

  Collapses the requireAuth + resolveUserId + null-check dance used by
  every SD route handler. Typed errors map cleanly to 401/404/500.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 7: Create 14 `/api/sd/*` route shells (501 + auth guards)

**Files:**
- Create: 14 `route.ts` files under `architex/src/app/api/sd/**` (see File Structure above)
- Create: `architex/src/app/api/sd/__tests__/sd-route-shells.test.ts`

**Design intent:** Stand up the complete SD API surface now, even though every endpoint returns 501 Not Implemented. This gives Phase 1 a merge-friendly landing pad (no new files land in Phase 1; only bodies change) and lets the rate-limit + auth wiring from Tasks 5-6 be exercised end-to-end in Phase 0. Each route calls `requireSDAuth()` first so that a 401 fires before we reach the 501, proving the guard is in the hot path.

- [ ] **Step 1: Write the shared integration test**

  Create `architex/src/app/api/sd/__tests__/sd-route-shells.test.ts`:

  ```typescript
  /**
   * Exercises every /api/sd/* shell and asserts:
   *  1. Unauthenticated requests → 401.
   *  2. Authenticated requests → 501 (Not Implemented yet).
   *  3. OPTIONS preflight → 204.
   *
   * Runs against a Next.js route handler by importing the module directly
   * and invoking the exported HTTP verbs with a mocked NextRequest.
   */

  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  vi.mock("@/lib/auth", async () => {
    const actual =
      await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
    return {
      ...actual,
      requireSDAuth: vi.fn(),
    };
  });

  import { requireSDAuth, SDAuthError } from "@/lib/auth";

  const ROUTES = [
    ["@/app/api/sd/concepts/route", ["GET", "POST"]],
    ["@/app/api/sd/concepts/[slug]/route", ["GET", "PATCH", "DELETE"]],
    ["@/app/api/sd/problems/route", ["GET", "POST"]],
    ["@/app/api/sd/problems/[slug]/route", ["GET", "PATCH", "DELETE"]],
    ["@/app/api/sd/diagrams/route", ["GET", "POST"]],
    ["@/app/api/sd/diagrams/[id]/route", ["GET", "PATCH", "DELETE"]],
    ["@/app/api/sd/simulations/route", ["GET", "POST"]],
    ["@/app/api/sd/simulations/[id]/route", ["GET", "DELETE"]],
    ["@/app/api/sd/drill-attempts/route", ["GET", "POST"]],
    ["@/app/api/sd/drill-attempts/[id]/route", ["GET", "PATCH"]],
    ["@/app/api/sd/drill-attempts/active/route", ["GET"]],
    ["@/app/api/sd/chaos-events/route", ["GET"]],
    ["@/app/api/sd/real-incidents/route", ["GET"]],
  ] as const;

  describe("SD route shells", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    for (const [modulePath, verbs] of ROUTES) {
      for (const verb of verbs) {
        it(`${verb} ${modulePath} returns 401 when unauthenticated`, async () => {
          (requireSDAuth as ReturnType<typeof vi.fn>).mockRejectedValue(
            new SDAuthError("unauthorized"),
          );
          const mod = await import(modulePath);
          const handler = (mod as Record<string, Function>)[verb];
          expect(handler, `${modulePath} exports ${verb}`).toBeTypeOf(
            "function",
          );
          const req = new NextRequest("http://localhost/api/sd/any", {
            method: verb,
          });
          const res: Response = await handler(req, { params: {} });
          expect(res.status).toBe(401);
        });

        it(`${verb} ${modulePath} returns 501 when authenticated`, async () => {
          (requireSDAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            clerkId: "c_test",
            userId: "u_test",
          });
          const mod = await import(modulePath);
          const handler = (mod as Record<string, Function>)[verb];
          const req = new NextRequest("http://localhost/api/sd/any", {
            method: verb,
          });
          const res: Response = await handler(req, { params: {} });
          expect(res.status).toBe(501);
        });
      }
    }
  });
  ```

- [ ] **Step 2: Run — verify massive failure**

  ```bash
  pnpm test:run -- sd-route-shells
  ```
  Expected: 52 FAIL cases (13 routes × average 2 verbs × 2 scenarios ≈ 52). Each with `Cannot find module '@/app/api/sd/.../route'`.

- [ ] **Step 3: Create the shared handler factory**

  Create `architex/src/app/api/sd/_shared.ts`:

  ```typescript
  /**
   * SD Phase 0 · Route-shell factory.
   *
   * Every /api/sd/* route shell uses this to produce handlers that:
   *   1. Call requireSDAuth() first → 401 if unauth.
   *   2. Return 501 with a consistent body shape.
   *   3. Log to Sentry with scrubbed payload.
   */

  import { NextRequest } from "next/server";
  import { requireSDAuth, sdAuthErrorResponse } from "@/lib/auth";

  export function makeShellHandler(verb: string, routeKey: string) {
    return async (req: NextRequest, _ctx: { params: unknown }) => {
      try {
        await requireSDAuth();
      } catch (err) {
        return sdAuthErrorResponse(err);
      }
      return new Response(
        JSON.stringify({
          error: "Not Implemented",
          verb,
          routeKey,
          phase: "sd-phase-0",
        }),
        {
          status: 501,
          headers: { "content-type": "application/json" },
        },
      );
    };
  }
  ```

- [ ] **Step 4: Create each shell file**

  Run the following loop (bash) from the `architex/` directory — it creates every shell with identical content, just varying the `routeKey`:

  ```bash
  cd architex

  declare -A ROUTES=(
    ["src/app/api/sd/concepts/route.ts"]="GET POST"
    ["src/app/api/sd/concepts/[slug]/route.ts"]="GET PATCH DELETE"
    ["src/app/api/sd/problems/route.ts"]="GET POST"
    ["src/app/api/sd/problems/[slug]/route.ts"]="GET PATCH DELETE"
    ["src/app/api/sd/diagrams/route.ts"]="GET POST"
    ["src/app/api/sd/diagrams/[id]/route.ts"]="GET PATCH DELETE"
    ["src/app/api/sd/simulations/route.ts"]="GET POST"
    ["src/app/api/sd/simulations/[id]/route.ts"]="GET DELETE"
    ["src/app/api/sd/simulations/[id]/stream/route.ts"]="GET"
    ["src/app/api/sd/drill-attempts/route.ts"]="GET POST"
    ["src/app/api/sd/drill-attempts/[id]/route.ts"]="GET PATCH"
    ["src/app/api/sd/drill-attempts/active/route.ts"]="GET"
    ["src/app/api/sd/chaos-events/route.ts"]="GET"
    ["src/app/api/sd/real-incidents/route.ts"]="GET"
  )

  for path in "${!ROUTES[@]}"; do
    mkdir -p "$(dirname "$path")"
    verbs="${ROUTES[$path]}"
    routeKey="$(echo "$path" | sed 's|src/app/api/||; s|/route.ts||')"
    {
      echo "// SD Phase 0 · route shell. Phase 1 replaces the 501 body with real logic."
      echo "import { makeShellHandler } from \"@/app/api/sd/_shared\";"
      echo ""
      for v in $verbs; do
        echo "export const $v = makeShellHandler(\"$v\", \"$routeKey\");"
      done
    } > "$path"
  done
  ```

  Expected: 14 files created. Verify with:

  ```bash
  find src/app/api/sd -name "route.ts" | wc -l
  ```
  Should print `14`.

- [ ] **Step 5: Run — expect all PASS**

  ```bash
  pnpm test:run -- sd-route-shells
  ```
  Expected: 52 passing assertions. If any fail, the most common cause is a path typo — re-run the bash loop from Step 4 after clearing with `rm -rf src/app/api/sd`.

- [ ] **Step 6: Sanity-check typecheck + lint**

  ```bash
  pnpm typecheck
  pnpm lint --fix
  ```
  Expected: zero new errors (the factory exports `async` handlers with the correct Next.js signature).

- [ ] **Step 7: Commit**

  ```bash
  git add architex/src/app/api/sd architex/src/app/api/sd/__tests__/sd-route-shells.test.ts
  git commit -m "$(cat <<'EOF'
  feat(api): 14 /api/sd/* route shells with auth guards · 501 until Phase 1

  Every SD endpoint Phase 1 will implement has a file on main today. Each
  calls requireSDAuth first (→ 401 if unauth) then returns 501. Prevents
  Phase-1 merge conflicts on file creation and lets Task 5 rate-limit
  wiring be exercised end-to-end.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 8: WebSocket auth pattern for chaos-engine streams

**Files:**
- Create: `architex/src/lib/sd/ws-auth.ts`
- Create: `architex/src/lib/sd/__tests__/ws-auth.test.ts`
- Modify: `architex/src/app/api/sd/simulations/[id]/stream/route.ts` (already a shell from Task 7; extend it)

**Design intent:** Phase 3 will stream chaos-engine metrics over a WebSocket. Next.js App Router supports WebSocket upgrade via a raw `Upgrade: websocket` handshake on a GET handler. Phase 0 writes the auth-validation primitive so Phase 3 drops into it. We validate the Clerk session token (either via Authorization header or the `__session` cookie) during handshake, reject with 401 before the upgrade, and expose a typed `validateWSHandshake(req)` that returns the same `SDAuthContext` as `requireSDAuth()`.

- [ ] **Step 1: Write the failing test**

  Create `architex/src/lib/sd/__tests__/ws-auth.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
  }));

  import { auth } from "@clerk/nextjs/server";
  import { validateWSHandshake, WSAuthError } from "@/lib/sd/ws-auth";

  describe("validateWSHandshake", () => {
    beforeEach(() => vi.resetAllMocks());

    it("rejects non-websocket upgrades", async () => {
      const req = new NextRequest("http://localhost/ws", {
        headers: { upgrade: "h2c" },
      });
      await expect(validateWSHandshake(req)).rejects.toBeInstanceOf(
        WSAuthError,
      );
    });

    it("rejects missing Clerk session", async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const req = new NextRequest("http://localhost/ws", {
        headers: { upgrade: "websocket" },
      });
      await expect(validateWSHandshake(req)).rejects.toMatchObject({
        kind: "unauthorized",
      });
    });

    it("returns SDAuthContext on success", async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "clerk_ws",
      });
      const req = new NextRequest("http://localhost/ws", {
        headers: { upgrade: "websocket" },
      });
      // resolveUserId lives in @/lib/auth — mock its module indirectly by
      // stubbing the exported wrapper.
      vi.doMock("@/lib/auth", () => ({
        requireSDAuth: vi
          .fn()
          .mockResolvedValue({ clerkId: "clerk_ws", userId: "u_ws" }),
      }));
      const { validateWSHandshake: v2 } = await import("@/lib/sd/ws-auth");
      const ctx = await v2(req);
      expect(ctx.userId).toBe("u_ws");
    });
  });
  ```

- [ ] **Step 2: Run — verify failure**

  ```bash
  pnpm test:run -- ws-auth
  ```
  Expected: FAIL `Cannot find module '@/lib/sd/ws-auth'`.

- [ ] **Step 3: Implement the handshake validator**

  Create `architex/src/lib/sd/ws-auth.ts`:

  ```typescript
  /**
   * SD Phase 0 · WebSocket handshake auth for chaos-engine streams.
   *
   * Phase 3 wires `/api/sd/simulations/:id/stream` to this validator. The
   * validator rejects any upgrade that is not `Upgrade: websocket` or lacks
   * a valid Clerk session (header or cookie). On success it returns the same
   * SDAuthContext shape as requireSDAuth so handlers can treat WS and HTTP
   * users identically.
   */

  import type { NextRequest } from "next/server";
  import { requireSDAuth, type SDAuthContext } from "@/lib/auth";

  export type WSAuthErrorKind = "bad-upgrade" | "unauthorized";

  export class WSAuthError extends Error {
    constructor(public readonly kind: WSAuthErrorKind, message?: string) {
      super(message ?? kind);
      this.name = "WSAuthError";
    }
  }

  export async function validateWSHandshake(
    req: NextRequest,
  ): Promise<SDAuthContext> {
    const upgrade = req.headers.get("upgrade")?.toLowerCase();
    if (upgrade !== "websocket") {
      throw new WSAuthError(
        "bad-upgrade",
        `Expected Upgrade: websocket, got ${upgrade ?? "none"}`,
      );
    }
    try {
      return await requireSDAuth();
    } catch {
      throw new WSAuthError("unauthorized");
    }
  }

  /**
   * Build the HTTP response Next.js must return when the handshake is
   * REJECTED. Phase 3 will return a different response (the actual upgrade
   * header set) on acceptance.
   */
  export function wsAuthRejectionResponse(err: unknown): Response {
    if (err instanceof WSAuthError) {
      if (err.kind === "bad-upgrade") {
        return new Response("Expected WebSocket upgrade", { status: 400 });
      }
      if (err.kind === "unauthorized") {
        return new Response("Unauthorized", {
          status: 401,
          headers: { "www-authenticate": "Bearer" },
        });
      }
    }
    return new Response("Internal", { status: 500 });
  }
  ```

- [ ] **Step 4: Wire the shell at `/api/sd/simulations/:id/stream`**

  Overwrite `architex/src/app/api/sd/simulations/[id]/stream/route.ts` (currently the Task 7 shell):

  ```typescript
  // SD Phase 0 · chaos-engine stream shell. Phase 3 replaces the 501 body
  // with the actual upgrade + stream; Phase 0 validates the handshake.

  import type { NextRequest } from "next/server";
  import {
    validateWSHandshake,
    wsAuthRejectionResponse,
  } from "@/lib/sd/ws-auth";

  export async function GET(req: NextRequest) {
    try {
      await validateWSHandshake(req);
    } catch (err) {
      return wsAuthRejectionResponse(err);
    }
    // Phase 3: return a Response with the actual upgrade headers here.
    return new Response(
      JSON.stringify({
        error: "Not Implemented",
        phase: "sd-phase-0",
        note: "Handshake validated. Upgrade logic lands in Phase 3.",
      }),
      { status: 501, headers: { "content-type": "application/json" } },
    );
  }
  ```

- [ ] **Step 5: Run — expect PASS**

  ```bash
  pnpm test:run -- ws-auth
  ```
  Expected: PASS · 3 assertions.

- [ ] **Step 6: Commit**

  ```bash
  git add architex/src/lib/sd/ws-auth.ts architex/src/lib/sd/__tests__/ws-auth.test.ts architex/src/app/api/sd/simulations/[id]/stream/route.ts
  git commit -m "$(cat <<'EOF'
  feat(sd): WS handshake auth primitive for chaos-engine streams

  validateWSHandshake enforces Upgrade: websocket + Clerk session at the
  boundary. Phase 3 drops the actual upgrade logic behind this guard.
  /api/sd/simulations/:id/stream now returns 400/401 on bad handshakes
  and 501 on valid ones.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---
