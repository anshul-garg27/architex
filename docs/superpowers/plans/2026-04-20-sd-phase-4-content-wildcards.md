# SD Phase 4 · Content Expansion + Wild Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Follow TDD for every code task (write failing test, implement, confirm pass). Content tasks are *authoring* tasks — the "test" is an editorial rubric check.

**Goal:** Ship everything the System Design module needs between SD spec §23 Phase 3 (beta, 30 pieces of content + Simulate + Drill) and SD spec §23 Phase 5 (Architect's Studio polish). Phase 4 is the "content at scale + integrations + wild cards" phase — the phase that turns a polished beta into a shippable, integrated, mobile-ready, full-library product.

Phase 4 delivers the following SD spec commitments in one six-week window (Weeks 17-22, ~200h engineering + ~120h content):

1. **Opus-authored content**: the remaining **23 concepts (Waves 4-8)**, **17 problems (Domains 2-6)**, and **60 chaos scenarios** (up from 10 real incidents + ~13 seeded events). All hand-written by Claude Opus 4.7 with human editor pass (§5.1).
2. **Review mode for SD** with FSRS-5 card generator, 4 card types (MCQ · name-primitive · diagram-spot · cloze), mobile swipe gestures, and per-concept mastery tracking (§10).
3. **Mobile Learn responsive** — full phone/tablet support for concept/problem pages + Review queue (§19.2, Q42).
4. **Portfolio public profile page** at `/profile/[username]`: designs gallery + unified streak + wave-progress rings + completed drills (§19.6 Q46 wild-card #4, §17.3).
5. **Weekly digest email** — 1 incident + 1 concept + 1 recommended drill + 5-minute read (§19.6 wild-card #6).
6. **LinkedIn profile badge** — OAuth-verified "Architex Verified" badge on user's LinkedIn profile, earned by passing FAANG-Ready path threshold (§19.4, §19.6 wild-card #9 scoped to badge-only).
7. **GitHub save + publish integration** — OAuth; users save diagrams + auto-artifacts to their own repo; optional `public: true` makes it discoverable on the portfolio (§19.4).
8. **Notion sync integration** — OAuth; Learn bookmarks + drill rubrics sync to a user-chosen Notion page (§19.4).
9. **Crunch Mode 7-day path generator** — onsite date + target company → calendar-aware daily plan (§19.5, §4.6).
10. **3 color themes** — dark (default) · light (parchment) · earth (parchment+muted-earth). CSS-variable-driven, respects `prefers-color-scheme` (§18.9 Q46, §19.6 wild-card #11).
11. **Chrome tab favicon pulse** for active sim / drill — drives retention when user tabs away mid-run (§18.10 micro-delights, spec-implicit for multitasking students).
12. **Full auth rollout (Waves 4-5)** — authenticated-user cohort ramp 10% → 50% → 100% with deterministic hash, kill switches, and auto-rollback triggers wired (§24 Wave 4-5).

**Architecture:** Builds on SD Phase 1-3 infrastructure (sd_concepts, sd_problems, sd_diagrams, sd_sim_runs, sd_drill_runs, sd_chaos_events tables from §21). Adds five new tables (`sd_fsrs_cards`, `user_integrations`, `weekly_digest_sends`, `crunch_plans`, `profile_pages`) and extends three (`sd_concepts.masteryLevel` lens, `sd_chaos_events` +50 rows, `users.theme` + `users.timezone`). FSRS-5 via the existing `ts-fsrs` wrapper promoted from `src/lib/lld/fsrs-scheduler.ts` → `src/lib/shared/fsrs-scheduler.ts` (shared across modules, as §17.3 demands a unified queue). Integrations follow a uniform `IntegrationProvider` interface; OAuth tokens stored encrypted in `user_integrations.tokenCiphertext`. Content authoring is **non-engineering** — a repeatable Opus → human-editor → Drizzle-seed pipeline introduced in Phase 2 and scaled here. Mobile is CSS-only (no RN, no separate app); Review uses the existing Framer Motion swipe gesture system borrowed from LLD Phase 5. Portfolio is a static-first public page with ISR revalidation on user update.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript 5 strict · Drizzle ORM / PostgreSQL (Neon) · Zustand 5 · TanStack Query 5 · `ts-fsrs@^4` (promoted from LLD Phase 5) · `resend@^4` (new — transactional email) · `cron-parser@^5` (new — digest scheduler) · `@octokit/rest@^22` (new — GitHub) · `@notionhq/client@^3` (new — Notion) · `lucia@^3` or existing Clerk OAuth strategies for GitHub/Notion/LinkedIn · Framer Motion 12 · Vitest · Testing Library · Playwright (smoke).

**Prerequisite:** Phases 0, 1, 2, 3 merged. Assumes `SDShell`, `sd-store`, `LearnModeLayout` + `BuildModeLayout` + `SimulateModeLayout` + `DrillModeLayout` + stub `ReviewModeLayout`, `moduleContent` rows for Waves 1-3 (17 concepts) + 13 problems, the simulation engine from §29 Phase 3 Steps 1-6, and the Clerk auth client ship on main.

**Reference:**
- Spec: `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md` — §5 (content), §10 (Review), §17 (cross-module), §18 (themes, micro-delights), §19 (integrations, mobile, Crunch), §22 (feature catalog), §23 (Phase 4 scope), §24 (Waves 4-5).
- Style reference: `docs/superpowers/plans/2026-04-20-lld-phase-5-review-mode.md` — TDD, `- [ ]` bite-size steps, full code with no placeholders.
- Prior phase: `docs/superpowers/plans/2026-04-20-lld-phase-6-polish-rollout.md` — feature flag + Wave 4/5 rollout pattern.

**Open questions (deferred to Phase 5 or logged):**
- Audio narration (Q46 wild-card #2): deferred to Phase 5 along with ElevenLabs pipeline.
- Architex Verified proctored certification (Q46 #9): Phase 4 ships only the LinkedIn badge; the proctored exam lands in Phase 5.
- Seasons + tournaments (Q46 #3): deferred.
- Google Calendar Crunch-Mode calendar block push (§19.4 integration #7): Phase 4 ships the 7-day plan generator + ICS export; native Google Calendar OAuth push is Phase 6.
- Obsidian vault export (§19.4 #5): Phase 6.
- Public API (§19.4 #8): Phase 6.

---

## Table of Contents

**Pre-flight** (~2h)
- Phases 0-3 merged check
- `ts-fsrs` already installed (from LLD Phase 5)
- Content queue prepared (Opus + editor calendar)
- Baseline passes

**File Structure** — directory tree of everything added or modified

**Task Group A · Content authoring playbook (foundations before any concept/problem authoring)**
- Task A1: Authoring pipeline — the `content/sd/` source-of-truth folder
- Task A2: Opus prompt template · concept (8-section format)
- Task A3: Opus prompt template · problem (6-pane format)
- Task A4: Opus prompt template · chaos scenario
- Task A5: Editor checklist + rubric
- Task A6: Seed script `scripts/seed-sd-content.ts`
- Task A7: CI check — every content file passes schema + rubric

**Task Group B · Content authoring (23 concepts + 17 problems + 60 chaos scenarios)**
- Task B1-B4: Wave 4 Messaging & Streams (4 concepts)
- Task B5-B9: Wave 5 Distributed Systems (5 concepts)
- Task B10-B13: Wave 6 Resilience (4 concepts)
- Task B14-B18: Wave 7 Operational (5 concepts)
- Task B19-B23: Wave 8 Modern (5 concepts)
- Task B24-B28: Domain 2 Location & Real-Time (5 problems)
- Task B29-B32: Domain 3 Storage & Sync (4 problems)
- Task B33-B37: Domain 4 Commerce & Payments (5 problems)
- Task B38-B40: Domain 5 Search & Discovery (3 problems)
- Task B41-B45: Domain 6 Infrastructure (5 problems)
- Task B46-B50: Chaos scenarios batch 1 (20, expanded from 10 incidents)
- Task B51-B55: Chaos scenarios batch 2 (20)
- Task B56-B60: Chaos scenarios batch 3 (20)
- Task B61: Post-authoring verification — all 100 pieces seed cleanly

**Task Group C · Review mode + FSRS for SD**
- Task C1: Promote `fsrs-scheduler.ts` to shared module
- Task C2: Create `sd_fsrs_cards` DB schema
- Task C3: Generate and apply migration
- Task C4: Card generator — MCQ from concept
- Task C5: Card generator — name-the-primitive from concept
- Task C6: Card generator — diagram-spot from problem
- Task C7: Card generator — cloze from concept numbered strip
- Task C8: Auto-card pipeline — run generators on every new content seed
- Task C9: SD review-store (extends shared `review-store` with SD card-type rendering)
- Task C10: API routes — `/api/sd/cards/*`
- Task C11: Review session component — single-card, mobile-first
- Task C12: Mobile swipe gestures (left=Again, down=Hard, up=Good, right=Easy)
- Task C13: Keyboard shortcuts (1-4, Space, AHGE, ↵)
- Task C14: Unified cross-module queue — the shared queue merger
- Task C15: Streak + empty-state + completion summary
- Task C16: Mastery derivation per concept cluster
- Task C17: Review mode stats (retention curve · per-wave mastery)

**Task Group D · Mobile Learn responsive**
- Task D1: Viewport & breakpoint audit
- Task D2: `LearnModeLayout.tsx` mobile breakpoints
- Task D3: Concept page stacked layout
- Task D4: Problem page stacked layout with pane accordion
- Task D5: Canvas → inline SVG on mobile (read-only)
- Task D6: AI chat → bottom sheet on mobile
- Task D7: Checkpoints touch-optimized
- Task D8: Mobile nav — bottom-bar mode switcher
- Task D9: Mobile first-run experience → Review mode default
- Task D10: "Open on desktop" QR card for Build/Simulate/Drill
- Task D11: Mobile smoke — Lighthouse Perf ≥80, a11y ≥95

**Task Group E · Portfolio public profile page**
- Task E1: `profile_pages` schema
- Task E2: Profile privacy settings UI
- Task E3: Public route `/profile/[username]` static-first + ISR
- Task E4: Designs gallery block
- Task E5: Wave-progress rings block
- Task E6: Completed-drills block with rubric badges
- Task E7: Streak + FSRS cards mastery block
- Task E8: LinkedIn-ready OG image generator
- Task E9: Portfolio share button in Build + Drill modes
- Task E10: Username reservation & validation

**Task Group F · Weekly digest email**
- Task F1: `weekly_digest_sends` schema + unsubscribe token
- Task F2: Digest content selector (1 incident + 1 concept + 1 drill)
- Task F3: Resend client wrapper + from-address sender
- Task F4: Digest MJML/React-email template
- Task F5: Cron job — Monday 8am user-local timezone
- Task F6: Unsubscribe flow + preference toggle
- Task F7: Preview route `/admin/digest/preview`
- Task F8: Tier-aware content selection (Rookie/Journeyman/Architect)
- Task F9: Send-limit guard (no resend within 6 days)
- Task F10: Digest analytics (open · click · CTR per block)

**Task Group G · LinkedIn profile badge**
- Task G1: LinkedIn OAuth via Clerk social connection
- Task G2: Badge earning rule — FAANG-Ready path completion
- Task G3: Badge issuance endpoint + signed claim URL
- Task G4: LinkedIn Certification API integration
- Task G5: Revocation flow (if user resets progress)
- Task G6: Badge preview on profile page
- Task G7: Badge verification public endpoint

**Task Group H · GitHub save + publish integration**
- Task H1: GitHub OAuth via Clerk social connection
- Task H2: `user_integrations.github` schema (tokenCiphertext, repoSlug, branch)
- Task H3: Repo picker UI in Build mode
- Task H4: Save diagram as JSON to `/architex/{diagramId}/diagram.json`
- Task H5: Save auto-artifacts (ADR + Runbook) as MDX
- Task H6: Publish toggle → marks repo folder README as discoverable
- Task H7: Pull latest diagram from repo on load (round-trip)
- Task H8: Conflict resolution (Drizzle wins unless user explicitly pulls)
- Task H9: Portfolio discovery — crawl users' public repos for "architex" tag

**Task Group I · Notion sync integration**
- Task I1: Notion OAuth via official OAuth flow
- Task I2: `user_integrations.notion` schema (access token, workspaceId, pageId)
- Task I3: Settings UI — "Pick a Notion page"
- Task I4: Sync job — Learn bookmarks → Notion bullet list
- Task I5: Sync job — Drill rubrics → Notion table
- Task I6: Manual "Sync now" button
- Task I7: Nightly scheduled sync
- Task I8: Rate-limit guard (Notion API 3 req/s)

**Task Group J · Crunch Mode 7-day path generator**
- Task J1: `crunch_plans` schema
- Task J2: Crunch-Mode entry UI — onsite date + target company
- Task J3: Company preset library (FAANG + M7 + hot startups)
- Task J4: 7-day plan generator (deterministic + AI-adjusted)
- Task J5: Calendar-aware reshuffling (skip user's busy days)
- Task J6: Day-detail view + daily checklist
- Task J7: Per-day difficulty auto-tuner (based on yesterday's rubric)
- Task J8: ICS export for calendar apps
- Task J9: Crunch-Mode completion certificate
- Task J10: Mid-plan recalculation if user falls behind

**Task Group K · 3 color themes**
- Task K1: Theme token audit — map every `--sd-*` variable
- Task K2: Midnight (dark default) token set
- Task K3: Parchment (light) token set
- Task K4: Earth (warm sepia + muted earth) token set
- Task K5: `next-themes` wiring + persistence
- Task K6: Theme picker UI in settings
- Task K7: Per-theme canvas rendering verification
- Task K8: WCAG AA contrast audit on all 3 themes
- Task K9: `prefers-color-scheme` media-query default

**Task Group L · Chrome tab favicon pulse**
- Task L1: Dynamic favicon generator (canvas → PNG data URL)
- Task L2: Pulse state machine (idle · running · alert · done)
- Task L3: Wire to active sim run
- Task L4: Wire to active drill timer
- Task L5: Page-visibility-aware throttling
- Task L6: Fallback for browsers without favicon support

**Task Group M · Full auth rollout (Waves 4-5)**
- Task M1: `ROLLOUT.sdAuthenticatedPercent` config surface
- Task M2: `hashCohort(userId)` deterministic bucketing
- Task M3: Wave 4 · ramp to 10%
- Task M4: Wave 4 · ramp to 25%
- Task M5: Wave 4 · ramp to 50%
- Task M6: Wave 5 · ramp to 100%
- Task M7: Auto-rollback telemetry hooks
- Task M8: Opt-out mechanism + preference UI
- Task M9: `/admin/sd-flags` page
- Task M10: Rollback runbook + one-click rollback

**Task Group N · End-to-end verification**
- Task N1: Full typecheck / lint / test / build pass
- Task N2: E2E smoke — new user signs up → completes 1 concept → reviews 5 cards → portfolio live
- Task N3: Mobile smoke on real device (iOS Safari + Android Chrome)
- Task N4: Integration smoke — GitHub save, Notion sync, LinkedIn badge
- Task N5: Theme switch smoke
- Task N6: Email preview & send smoke
- Task N7: Performance regression — no p95 > 200ms LCP regression vs Phase 3
- Task N8: `.progress-phase-4.md` tracker + final commit + tag

**Self-review checklist** — spec coverage, type consistency, content coverage, rollout gates.

**Execution handoff** — subagent-driven vs inline execution.

---
