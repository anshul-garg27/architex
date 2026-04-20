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
