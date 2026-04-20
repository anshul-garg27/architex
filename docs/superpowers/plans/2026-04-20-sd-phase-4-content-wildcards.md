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

## Pre-flight checklist (~2 hours)

- [ ] **Phases 0-3 merged**

```bash
cd architex && git log --oneline | grep -E "sd-phase-(0|1|2|3)" | head -8
```
Expected: at least one commit per phase (Phases 0-3).

- [ ] **`SDShell`, `sd-store`, four mode layouts exist**

```bash
ls architex/src/components/modules/sd/modes/
# Expected: LearnModeLayout.tsx BuildModeLayout.tsx SimulateModeLayout.tsx
#           DrillModeLayout.tsx ReviewModeLayout.tsx (stub)
```

- [ ] **Waves 1-3 content seeded (17 concepts + 13 problems + 10 incidents)**

```bash
cd architex && pnpm tsx -e "
import { db } from './src/db/client';
import { moduleContent } from './src/db/schema';
import { and, eq } from 'drizzle-orm';
const c = await db.select().from(moduleContent)
  .where(and(eq(moduleContent.moduleId, 'sd'), eq(moduleContent.contentType, 'concept')));
const p = await db.select().from(moduleContent)
  .where(and(eq(moduleContent.moduleId, 'sd'), eq(moduleContent.contentType, 'problem')));
const i = await db.select().from(moduleContent)
  .where(and(eq(moduleContent.moduleId, 'sd'), eq(moduleContent.contentType, 'incident')));
console.log('concepts:', c.length, 'problems:', p.length, 'incidents:', i.length);
"
```
Expected: `concepts: 17 problems: 13 incidents: 10`.

- [ ] **`ts-fsrs` already installed (from LLD Phase 5)**

```bash
cat architex/package.json | grep ts-fsrs
```
Expected: `"ts-fsrs": "^4.x.x"`.

- [ ] **Shared FSRS scheduler does NOT yet exist (we will promote LLD's in Task C1)**

```bash
ls architex/src/lib/shared/fsrs-scheduler.ts 2>&1 || echo "absent (expected)"
```

- [ ] **Clerk OAuth strategies confirmed for GitHub + LinkedIn + Notion**

Open Clerk dashboard → Social Connections → verify GitHub + LinkedIn enabled. Notion is not a Clerk-native provider; we will wire Notion OAuth manually in Task I1.

- [ ] **`resend` account exists + domain verified**

```bash
# One-time op, not a scripted step. Confirm:
# 1. https://resend.com/domains → architex.dev verified (SPF + DKIM).
# 2. From-address: digest@architex.dev.
# 3. RESEND_API_KEY in .env.local and in Vercel env.
```

- [ ] **Content authoring calendar approved**

Content lead confirms Opus + editor throughput target: **1.5 pieces/day × 6 weeks = 63 pieces**. We need 23 + 17 + 60 = 100 pieces — so content runs in parallel with engineering and spans the full 6-week window at ~2.3 pieces/day. If throughput slips, the plan's task-order gates (concepts before review cards, problems before Crunch-Mode presets) still let us ship a partial-but-coherent launch. Content lead owns the calendar in Notion.

- [ ] **Baseline passes**

```bash
cd architex && pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```

- [ ] **Commit any fixes**

```bash
git commit -am "fix: pre-flight verification for SD Phase 4"
```

---

## File Structure

```
architex/
├── content/sd/                                                    # NEW — source-of-truth
│   ├── concepts/
│   │   ├── wave-4-messaging-streams/
│   │   │   ├── message-queues-vs-event-streams.mdx                # B1
│   │   │   ├── delivery-semantics.mdx                             # B2
│   │   │   ├── change-data-capture.mdx                            # B3
│   │   │   └── stream-processing.mdx                              # B4
│   │   ├── wave-5-distributed-systems/                            # B5-B9
│   │   ├── wave-6-resilience/                                     # B10-B13
│   │   ├── wave-7-operational/                                    # B14-B18
│   │   └── wave-8-modern/                                         # B19-B23
│   ├── problems/
│   │   ├── domain-2-location-realtime/                            # B24-B28
│   │   ├── domain-3-storage-sync/                                 # B29-B32
│   │   ├── domain-4-commerce-payments/                            # B33-B37
│   │   ├── domain-5-search-discovery/                             # B38-B40
│   │   └── domain-6-infrastructure/                               # B41-B45
│   └── chaos-scenarios/
│       ├── batch-1-compute-network/                               # B46-B50 (20)
│       ├── batch-2-data-state/                                    # B51-B55 (20)
│       └── batch-3-traffic-dependency/                            # B56-B60 (20)
├── content/prompts/                                               # NEW — Opus templates
│   ├── sd-concept-prompt.md                                       # A2
│   ├── sd-problem-prompt.md                                       # A3
│   ├── sd-chaos-prompt.md                                         # A4
│   └── editor-rubric.md                                           # A5
├── scripts/
│   ├── seed-sd-content.ts                                         # A6
│   ├── auto-generate-sd-cards.ts                                  # C8
│   └── validate-sd-content.ts                                     # A7
├── drizzle/
│   ├── NNNN_add_sd_fsrs_cards.sql                                 # C3
│   ├── NNNN_add_user_integrations.sql                             # H2, I2
│   ├── NNNN_add_weekly_digest_sends.sql                           # F1
│   ├── NNNN_add_crunch_plans.sql                                  # J1
│   ├── NNNN_add_profile_pages.sql                                 # E1
│   └── NNNN_add_user_theme_timezone.sql                           # K5
├── package.json                                                   # MODIFY (+5 deps)
└── src/
    ├── db/schema/
    │   ├── sd-fsrs-cards.ts                                       # NEW — C2
    │   ├── user-integrations.ts                                   # NEW — H2, I2
    │   ├── weekly-digest-sends.ts                                 # NEW — F1
    │   ├── crunch-plans.ts                                        # NEW — J1
    │   ├── profile-pages.ts                                       # NEW — E1
    │   ├── users.ts                                               # MODIFY — +theme +timezone
    │   ├── index.ts                                               # MODIFY
    │   └── relations.ts                                           # MODIFY
    ├── lib/shared/
    │   ├── fsrs-scheduler.ts                                      # NEW (promoted) — C1
    │   ├── mastery.ts                                             # NEW — C16
    │   └── integrations/
    │       ├── provider.ts                                        # NEW — interface
    │       ├── github.ts                                          # NEW — H
    │       ├── notion.ts                                          # NEW — I
    │       └── linkedin.ts                                        # NEW — G
    ├── lib/sd/
    │   ├── card-generators/
    │   │   ├── index.ts                                           # NEW
    │   │   ├── from-concept-mcq.ts                                # C4
    │   │   ├── from-concept-primitive.ts                          # C5
    │   │   ├── from-problem-diagram.ts                            # C6
    │   │   └── from-concept-cloze.ts                              # C7
    │   ├── crunch/
    │   │   ├── company-presets.ts                                 # J3
    │   │   ├── plan-generator.ts                                  # J4
    │   │   ├── reshuffler.ts                                      # J5
    │   │   └── ics-export.ts                                      # J8
    │   ├── digest/
    │   │   ├── content-selector.ts                                # F2
    │   │   ├── tier-aware.ts                                      # F8
    │   │   └── render.tsx                                         # F4
    │   └── rollout/
    │       ├── cohort-hash.ts                                     # M2
    │       └── flags.ts                                           # M1
    ├── lib/analytics/sd-events.ts                                 # MODIFY — +digest, +crunch, +review
    ├── app/
    │   ├── api/sd/
    │   │   ├── cards/route.ts                                     # C10
    │   │   ├── cards/due/route.ts                                 # C10
    │   │   ├── cards/[id]/route.ts                                # C10
    │   │   ├── review/submit/route.ts                             # C10
    │   │   ├── mastery/route.ts                                   # C16
    │   │   ├── stats/route.ts                                     # C17
    │   │   ├── crunch/create/route.ts                             # J2
    │   │   ├── crunch/[id]/route.ts                               # J6
    │   │   ├── crunch/[id]/ics/route.ts                           # J8
    │   │   ├── integrations/github/save/route.ts                  # H4
    │   │   ├── integrations/github/pull/route.ts                  # H7
    │   │   ├── integrations/notion/sync/route.ts                  # I4, I5
    │   │   ├── integrations/linkedin/claim/route.ts               # G3
    │   │   └── badge/verify/[claimId]/route.ts                    # G7
    │   ├── api/webhooks/
    │   │   ├── github-save/route.ts                               # H8 conflict webhook
    │   │   └── resend-bounces/route.ts                            # F10
    │   ├── api/cron/
    │   │   ├── weekly-digest/route.ts                             # F5
    │   │   └── notion-sync/route.ts                               # I7
    │   ├── profile/
    │   │   ├── [username]/page.tsx                                # E3
    │   │   ├── [username]/opengraph-image.tsx                     # E8
    │   │   └── settings/integrations/page.tsx                     # H3, I3
    │   ├── crunch/
    │   │   ├── new/page.tsx                                       # J2
    │   │   └── [id]/page.tsx                                      # J6
    │   ├── admin/
    │   │   ├── sd-flags/page.tsx                                  # M9
    │   │   └── digest/preview/page.tsx                            # F7
    │   └── unsubscribe/[token]/page.tsx                           # F6
    ├── components/modules/sd/
    │   ├── modes/ReviewModeLayout.tsx                             # MODIFY — fill stub
    │   ├── review/
    │   │   ├── ReviewCard.tsx                                     # C11
    │   │   ├── ReviewRatingRow.tsx                                # C11
    │   │   ├── SwipeGestureLayer.tsx                              # C12
    │   │   ├── ReviewSessionComplete.tsx                          # C15
    │   │   ├── ReviewEmptyState.tsx                               # C15
    │   │   └── CrossModuleQueueBadge.tsx                          # C14
    │   ├── learn/
    │   │   ├── MobileConceptPage.tsx                              # D3
    │   │   ├── MobileProblemPage.tsx                              # D4
    │   │   ├── MobileCanvas.tsx                                   # D5
    │   │   └── MobileAIChatSheet.tsx                              # D6
    │   ├── portfolio/
    │   │   ├── DesignsGallery.tsx                                 # E4
    │   │   ├── WaveProgressRings.tsx                              # E5
    │   │   ├── CompletedDrillsList.tsx                            # E6
    │   │   ├── StreakBlock.tsx                                    # E7
    │   │   └── LinkedInBadge.tsx                                  # G6
    │   ├── crunch/
    │   │   ├── CrunchEntryForm.tsx                                # J2
    │   │   ├── CompanyPresetSelector.tsx                          # J3
    │   │   ├── CrunchPlanDayCard.tsx                              # J6
    │   │   └── CrunchCompletionCertificate.tsx                    # J9
    │   ├── integrations/
    │   │   ├── GitHubRepoPicker.tsx                               # H3
    │   │   ├── GitHubSaveButton.tsx                               # H4
    │   │   ├── NotionPagePicker.tsx                               # I3
    │   │   ├── NotionSyncNowButton.tsx                            # I6
    │   │   └── LinkedInClaimButton.tsx                            # G2
    │   └── themes/
    │       ├── ThemePickerCard.tsx                                # K6
    │       └── theme-tokens.css                                   # K2-K4
    ├── components/shared/
    │   ├── MobileBottomBar.tsx                                    # D8
    │   ├── OpenOnDesktopCard.tsx                                  # D10
    │   └── FaviconPulse.tsx                                       # L1-L3
    ├── hooks/
    │   ├── useSDReviewQueue.ts                                    # C9
    │   ├── useSDReviewKeyboard.ts                                 # C13
    │   ├── useSwipeGestures.ts                                    # C12
    │   ├── useMobileViewport.ts                                   # D1
    │   ├── useFaviconPulse.ts                                     # L2
    │   ├── useCrunchPlan.ts                                       # J6
    │   └── useIntegration.ts                                      # H, I, G
    ├── stores/
    │   ├── review-store.ts                                        # MODIFY — cross-module
    │   └── theme-store.ts                                         # K5
    └── emails/
        └── weekly-digest.tsx                                      # F4 — React Email
```

**Rationale:**
- `content/sd/` is **outside** `src/` intentionally — it is editable by the content lead without touching the engineering tree, and it is versioned so we can diff an author's changes review-by-review.
- `src/lib/shared/fsrs-scheduler.ts` is the promoted single source of truth for all FSRS logic (LLD, SD, and any future module). Task C1 moves LLD's wrapper; Task C2+ adds SD table.
- `src/lib/sd/card-generators/` mirrors LLD's convention but operates on SD content (concept pages and problem pages).
- `content/prompts/` holds the Opus authoring templates — these are prompts, not code, and they live alongside the content they produce.
- OAuth credentials never leak into src: `user_integrations.tokenCiphertext` stores AES-GCM-encrypted tokens; the encryption key is `ENCRYPTION_KEY_V1` in env, rotated via key-version column.
- Portfolio `[username]/page.tsx` uses App Router's default static rendering with ISR `revalidate = 900` (15 min). Heavy parts (designs gallery images) lazy-load.
- Cron routes (`/api/cron/*`) use Vercel's `vercel.json` cron config (no custom infra). Authenticated via `CRON_SECRET` header.
- Theme tokens live in CSS (not JS) to avoid hydration flash and let the pre-hydration inline script pick the right theme.

---

## Task Group A · Content Authoring Playbook

*Before we write a single concept or problem, we stand up the pipeline that scales Opus authorship from "one-off per piece" to "100 pieces in 6 weeks with editorial quality." This group has zero production code — it's scripts, prompts, and a validation harness. Ship this first; every B-task depends on it.*

---

## Task A1: Authoring pipeline — `content/sd/` folder structure

**Files:** `content/sd/README.md`, folder scaffold, `.gitattributes`

- [ ] **Step 1: Create the folder tree**

```bash
cd architex
mkdir -p content/sd/{concepts,problems,chaos-scenarios}
mkdir -p content/sd/concepts/{wave-4-messaging-streams,wave-5-distributed-systems,wave-6-resilience,wave-7-operational,wave-8-modern}
mkdir -p content/sd/problems/{domain-2-location-realtime,domain-3-storage-sync,domain-4-commerce-payments,domain-5-search-discovery,domain-6-infrastructure}
mkdir -p content/sd/chaos-scenarios/{batch-1-compute-network,batch-2-data-state,batch-3-traffic-dependency}
mkdir -p content/prompts
```

- [ ] **Step 2: Root README**

Create `content/sd/README.md`:

```markdown
# SD Content Source of Truth

All concepts, problems, and chaos scenarios live here as authored MDX files.
Engineering seeds them into Postgres via `scripts/seed-sd-content.ts`.

## Filename convention

- Concepts: `wave-N-<group>/<slug>.mdx` — slug is kebab-case, matches the concept's URL slug.
- Problems: `domain-N-<group>/<slug>.mdx`.
- Chaos scenarios: `batch-N-<group>/<slug>.mdx`.

## Frontmatter schema

Validated by `scripts/validate-sd-content.ts`. See `content/prompts/editor-rubric.md`
for the editorial rubric every piece must pass before the seed will accept it.

## Authorship protocol

1. Content lead drops an Opus prompt into a new issue labeled `opus-authoring`.
2. Opus generates the first draft. Editor passes with inline comments.
3. Opus second draft. Editor final pass.
4. PR merges the MDX file. CI runs `validate-sd-content.ts` and blocks on failure.
5. Nightly seed job (or manual `pnpm db:seed:sd`) inserts rows into `module_content`.
```

- [ ] **Step 3: `.gitattributes` for MDX**

Append to repo root `.gitattributes`:

```
content/**/*.mdx diff=markdown
```

- [ ] **Step 4: Commit**

```bash
git add content/ .gitattributes
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): scaffold content/ folder structure

Three top-level families (concepts / problems / chaos-scenarios), each
with sub-buckets matching spec §5.2, §5.3, and §12.1. MDX source of
truth outside src/ so content-lead authorship does not touch the
engineering tree.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A2: Opus prompt template — concept (8-section format)

**Files:** `content/prompts/sd-concept-prompt.md`

- [ ] **Step 1: Write the prompt template**

Create `content/prompts/sd-concept-prompt.md`:

````markdown
# SD Concept Authoring Prompt (Opus 4.7)

You are Claude Opus 4.7 authoring a System Design concept page for the
Architex SD module. Follow the 8-section format defined in spec §5.4.
Hit each section's word target within ±20%. Write in the Architex
brand voice: clarity over cleverness · specific and concrete · honest
tradeoffs · authoritative without arrogance · numbers are load-bearing.

## Inputs you will receive

- `slug`: kebab-case URL slug
- `title`: the display title
- `wave`: wave number + theme (e.g. "Wave 4 · Messaging & Streams")
- `persona`: R (Rookie) / J (Journeyman) / A (Architect) — set your
  explanatory depth accordingly; default J if unspecified.
- `prerequisites`: 3-5 concepts the reader is assumed to know.
- `bridges-out`: 3-5 concepts or problems this concept is a prerequisite for.
- `referenceNumbers`: a bullet list of specific numbers the reader should
  walk away with (e.g. "Kafka partition: 500MB-1GB typical · p99 append
  ≤10ms at 100k msg/s").

## Output format — MDX with frontmatter

```mdx
---
slug: "<slug>"
title: "<title>"
wave: <wave-number>
waveLabel: "<Wave Label>"
waveOrder: <order-within-wave>
contentType: "concept"
estimatedReadingMinutes: <int, 5-9>
prerequisites: ["<slug1>", "<slug2>", ...]
bridgesOut: [{kind: "concept|problem|pattern|chaos", slug: "<slug>", relevance: "<1-sentence>"}]
wordTargetBySection:
  hook: 60
  analogy: 120
  primitive: 600
  numbers: 80
  tradeoffs: 200
  antiCases: 150
  wild: 150
  bridges: 80
sourceYear: 2026
contentQuality: "polished"
generatedBy: "hybrid"
---

## Hook

<60 words. One concrete scenario. Name a real product or a named scale
(e.g. "WhatsApp delivering 100B messages/day"). End on the question the
concept answers.>

## Analogy

<120 words. One physical-world mapping. Not generic ("it's like X"); a
specific imagined scene. Make it memorable.>

## The Primitive

<500-700 words. Formal definition. How it works. Key invariants.
At least one diagram (Mermaid or SVG sketch description) and at least
one code or pseudo-code block ≤15 lines. Three short subsections allowed.>

## Numbers that matter

<80 words + one table. Single-row numbers strip: typical throughput,
typical latency, cost band, capacity unit. Every number cited inline:
(Kafka, LinkedIn engineering blog, 2023).>

| Metric | Typical | Source |
|--------|---------|--------|
| ... | ... | ... |

## Tradeoffs — what you gain, what you pay

<200 words. One "you gain X, you pay Y" paragraph. Be honest. Call out
the biggest cost by name, don't hide it.>

## When not to use it

<150 words. 2-3 named anti-cases. "Don't use CDC for audit logging; the
CDC stream does not capture WHY a change happened." Concrete.>

## Seen in the wild

<150 words. One named company + year + engineering blog link. Extract a
specific decision that company made. "Stripe uses idempotency keys
scoped by customer-id; a collision across customers is impossible."
(Stripe engineering blog, 2020).>

## Bridges

<5 link cards. Each 1-2 sentences of relevance, not "related article".>

- → **<Concept A>** · <why it connects>
- → **<Problem A>** · <why this concept matters in that problem>
- → **<LLD Pattern>** · <object-model equivalent>
- → **<Chaos event>** · <what breaks if this is misconfigured>
- → **<Concept B>** · <next-step concept>
```

## Rules

1. **Every number has a source.** If you cannot find one, flag the
   sentence with `<!-- NEEDS-SOURCE -->` and the editor will resolve.
2. **No clichés.** Banned: "leverages", "utilizes", "enables", "paradigm
   shift", "industry-leading", "best-in-class".
3. **No self-reference.** Don't say "in this section" or "as we
   discussed". The reader is reading top-to-bottom.
4. **Code is tested.** If you include a code snippet, add a comment
   with the language and any assumed import.
5. **Bridges are asymmetric.** Going *to* a harder concept gets one
   sentence of relevance; going *to* a problem gets the sentence that
   says *how* the concept is used in that problem.
6. **Voice variants.** After the Standard output, produce an ELI5
   version and an ELI-Senior version in separate `---`-delimited
   blocks. The ELI5 version is analogy-led, 600 words total. The
   ELI-Senior version is numbers-led, 400 words total, assumes
   10+ years of experience.

## Deliverable

One MDX file. Three voice variants stacked. Total ~2000 words for
Standard, ~600 for ELI5, ~400 for ELI-Senior. Save at
`content/sd/concepts/<wave-dir>/<slug>.mdx`.
````

- [ ] **Step 2: Commit**

```bash
git add content/prompts/sd-concept-prompt.md
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add Opus concept authoring prompt template

8-section format, voice rules, banned-word list, three voice variants
(Standard / ELI5 / ELI-Senior). Used by content lead for every Wave
4-8 concept.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A3: Opus prompt template — problem (6-pane format)

**Files:** `content/prompts/sd-problem-prompt.md`

- [ ] **Step 1: Write the prompt template**

Create `content/prompts/sd-problem-prompt.md`:

````markdown
# SD Problem Authoring Prompt (Opus 4.7)

Author a System Design problem page using the 6-pane format from
spec §5.5. Word target: 2800 (±300). Three voice variants again.

## Inputs

- `slug`, `title`, `domain` (number + label), `domainOrder`
- `difficulty`: warmup / intermediate / principal
- `prerequisiteConcepts`: 4-8 concept slugs
- `usesPatterns`: 3-5 LLD patterns this problem's design leans on
- `chaosBridges`: 5-8 chaos events the design must withstand
- `scale`: a named scale band (e.g. "500M DAU, 150k ops/sec peak")

## Output format — MDX with frontmatter

```mdx
---
slug: "<slug>"
title: "Design <Product>"
domain: <domain-number>
domainLabel: "<Domain Label>"
domainOrder: <order-within-domain>
difficulty: "warmup|intermediate|principal"
contentType: "problem"
estimatedReadingMinutes: <int, 14-22>
prerequisiteConcepts: ["<slug1>", ...]
usesPatterns: ["<lld-pattern-slug>", ...]
chaosBridges: ["<chaos-slug>", ...]
scale:
  dau: <int>
  qpsPeak: <int>
  storage: "<band>"
  costBand: "<$-$$$$>"
canonicalSolutions: 3
wordTargetByPane:
  statement: 200
  clarify: 400
  napkin: 400
  canonical: 1800   # 600 per solution × 3
  failure: 500
  realworld: 300
sourceYear: 2026
contentQuality: "polished"
generatedBy: "hybrid"
---

## Pane 1 · Problem statement

<200 words. The question as a staff interviewer would state it.
Include scale (DAU, QPS, storage). Clarify scope: "Focus on the
read-path for the home timeline. Assume auth is solved elsewhere.">

## Pane 2 · Clarifying questions to ask

<400 words. 8-12 questions the candidate should ask. Each has a typical
answer in parentheses. Format as a checklist the reader could actually
recite in their own interview.>

- **Is X precise or approximate?** (Approximate — last-known-value is
  fine within 30s.)
- **Should we handle multi-region from the start?** (Single-region v1;
  discuss multi-region tradeoffs before time runs out.)
- ...

## Pane 3 · Napkin math

<400 words. Storage per record. Storage at 1y / 10y. QPS at peak.
Bandwidth (egress). Cache working set (10-80% hot). Write down every
calculation.>

```
Per tweet: 280 chars × 2 (UTF-8 avg) = 560B
+ metadata (user_id 8B, ts 8B, reply_to 8B) = 24B
Total: ~600B per tweet

150B tweets × 600B = 90TB (storage)
Per day: 150k TPS × 86400 = 13B tweets/day (checks out with published numbers)
...
```

## Pane 4 · Canonical design — 2-3 solutions

### Solution A · Fan-out on write (the obvious one)

<600 words. Full architecture walkthrough. Include a Mermaid or SVG
diagram. Explain every box: write path, read path, failure modes,
scaling knobs.>

### Solution B · Fan-out on read (better for whales)

<600 words. Same structure, different tradeoff tree.>

### Solution C · Hybrid with whale-detector queue (optional, Principal-level)

<600 words. The nuanced answer. Include the threshold logic
(whale-detector rules) and why the hybrid wins on both ends.>

## Pane 5 · Failure modes & resilience

<500 words. Thundering herd. Cache stampede. Celebrity-fan-out blowup.
Database hot-key. Each failure mode links to a chaos event the reader
can trigger in Simulate mode. "Try: run the `celebrity-burst` chaos
event on your Solution A — timeline inserts back up within 90s.">

## Pane 6 · Real-world references

<300 words. 4-6 named-company links. Twitter's timeline post. Mastodon's
federation model (contrast). Instagram's cache warmup strategy. Each
link has a year stamp (e.g. 2021) and a one-sentence extract of the
decision the engineer-reader should remember.>

1. **Twitter · 2013 post on timeline pre-compute** — "We gave up on
   strict chronological order to make the cache hit rate workable."
2. ...
```

## Rules

Same as concept prompt, plus:
1. **Always 3 solutions** (2 if the Rookie tier makes 3 absurd).
2. **Every chaos bridge is actionable.** Don't say "might fail" —
   name the failure mode and the chaos event slug.
3. **Napkin math is a calculator trace.** Show the arithmetic so a
   Rookie reader can follow.
4. **One diagram per solution.** Mermaid (preferred) or SVG inline.
5. **Real-world links include year.** "(Twitter engineering blog, 2013)".
6. **Three voice variants.** Standard / ELI5 / ELI-Senior at the bottom.

## Deliverable

One MDX file with three voice variants stacked. Save at
`content/sd/problems/<domain-dir>/<slug>.mdx`. Standard ~2800 words,
ELI5 ~800, ELI-Senior ~600.
````

- [ ] **Step 2: Commit**

```bash
git add content/prompts/sd-problem-prompt.md
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add Opus problem authoring prompt template

6-pane format with 3 canonical solutions per problem. Napkin math as
calculator trace. Chaos bridges are actionable event slugs. Three
voice variants. Used for all 17 Phase 4 problems.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A4: Opus prompt template — chaos scenario

**Files:** `content/prompts/sd-chaos-prompt.md`

- [ ] **Step 1: Write the template**

Create `content/prompts/sd-chaos-prompt.md`:

````markdown
# SD Chaos Scenario Authoring Prompt (Opus 4.7)

Author one chaos scenario for the Architex chaos library (spec §12).
A chaos scenario is a *specific failure event* that the simulation
engine can trigger on a user's architecture. Each scenario has a
narrative template, trigger parameters, and a postmortem hook.

## Inputs

- `slug`: kebab-case event slug (e.g. "redis-hot-shard-meltdown")
- `family`: one of Compute / Network / Data / Dependency / Traffic /
  State / Config (per spec §12.1 taxonomy)
- `severity`: minor / major / catastrophic
- `targetNodeKinds`: which node families this event can fire on
  (`cache`, `db`, `lb`, `queue`, `svc`, `edge`)
- `basedOnIncident`: optional — slug of the real incident this is
  derived from (see §5.6 for the 10 real incidents)

## Output format — MDX with frontmatter

```mdx
---
slug: "<slug>"
title: "<Human-readable title>"
family: "<family>"
severity: "<severity>"
targetNodeKinds: ["<kind1>", "<kind2>"]
basedOnIncident: "<slug-or-null>"
contentType: "chaos-scenario"
cascadeDepth: <1-5>
triggerParams:
  probability: <0-1>
  duration: "<ISO 8601 duration>"
  blastRadius: "single-node|shard|zone|region"
narrativeVariants: 3  # for the margin-narrative cinematic stream
sourceYear: 2026
contentQuality: "polished"
---

## Summary

<60 words. What happens, at what scope, with what user-visible effect.>

## Trigger mechanics (for the sim engine)

```yaml
on:
  nodeKind: <kind>
  probability: <0-1>
effects:
  - latencyMultiplier: <N>
  - cpuSpike: <0-1>
  - errorRate: <0-1>
  - partialFailure: <bool>
cascade:
  - toNodeKind: <kind>
    via: "<edge-kind>"
    condition: "<expr>"
recovery:
  - afterDuration: "<ISO>"
  - requiresAction: "<optional action slug>"
```

## Narrative variants (pick one at sim time)

### Variant 1 · Cinematic

<80 words, serif-style narration for the margin-stream card. Example:
"At 14:32 UTC, a Redis shard swallows a 40MB hot key. The ring
whistles and tilts. p99 latency bleeds through every downstream
dependency within 11 seconds.">

### Variant 2 · Technical

<80 words, dry pager-report style for advanced users who want the
mechanics front-and-center.>

### Variant 3 · Humorous

<80 words, gallows-humor tone for experienced engineers. Avoid
trivializing real outages — this variant is off by default.>

## Postmortem hook

<200 words. After the sim ends, the narrative engine (§12.3) shows a
1-paragraph postmortem synthesized from the user's specific run. This
section is the *template* — it names what signals the postmortem
should surface (RTO, MTTR, blast-radius, cascade-path), not the specific
numbers. The sim engine fills those in at render time.>

## Bridges

- → **Concept**: <slug> · <relevance>
- → **Pattern**: <slug> · <relevance>
- → **Real incident**: <slug-or-null> · <relevance>
```

## Rules

1. **Trigger mechanics are the contract.** The YAML block drives the
   sim engine. Every field must be parseable. If the engine does not
   support a field, do not invent one — extend the engine first.
2. **Three variants.** Cinematic is default. Technical is a power-user
   toggle. Humorous ships off by default.
3. **Based on a real incident when possible.** If the scenario mirrors
   a published postmortem (Facebook BGP 2021, Cloudflare regex 2019,
   etc.), reference it.
4. **Cascade depth ≤5.** Deeper cascades hurt simulation perf and
   narrative coherence.
5. **Recovery is automatic OR requires an action.** Don't leave a
   scenario that never resolves; that is a bug.

## Deliverable

One MDX file per scenario. Save at
`content/sd/chaos-scenarios/<batch-dir>/<slug>.mdx`. ~600 words total.
````

- [ ] **Step 2: Commit**

```bash
git add content/prompts/sd-chaos-prompt.md
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add Opus chaos scenario authoring prompt template

Each scenario: YAML trigger mechanics (sim-engine contract) + 3
narrative variants (cinematic default, technical power-user, humorous
opt-in) + postmortem hook template. Used for all 60 Phase 4 scenarios.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A5: Editor checklist + rubric

**Files:** `content/prompts/editor-rubric.md`

- [ ] **Step 1: Write the rubric**

Create `content/prompts/editor-rubric.md`:

```markdown
# SD Content Editor Rubric

Every concept, problem, or chaos scenario authored by Opus passes
through a human editor before seed. This rubric is the editor's
checklist. Content fails the editorial pass if any required item is
missing.

## Structural checks (required — auto-enforced by `validate-sd-content.ts`)

- [ ] Frontmatter matches schema (see prompt template)
- [ ] All 8 concept sections present (or all 6 problem panes)
- [ ] Word count per section within ±20% of target
- [ ] Three voice variants stacked at bottom (Standard / ELI5 / ELI-Senior)
- [ ] Every `<!-- NEEDS-SOURCE -->` flag resolved
- [ ] Slug in frontmatter matches filename
- [ ] `prerequisites` slugs exist in seeded content OR flag `waveGap: true`
- [ ] `bridgesOut` array has ≥3 entries for concepts, ≥5 for problems

## Voice checks (required — human judgment)

- [ ] No banned clichés (leverages, utilizes, paradigm shift, etc.)
- [ ] No self-reference ("in this section", "as we discussed")
- [ ] No "obviously" or "of course"
- [ ] Numbers have citations with year
- [ ] Tradeoffs paragraph names the cost explicitly
- [ ] Bridges have 1-2 sentence relevance captions (not bare links)

## Technical checks (required — human + CI)

- [ ] Every code snippet is syntactically correct (lint passes)
- [ ] Every Mermaid diagram renders (CI validates)
- [ ] Every cited number has a source link with year stamp
- [ ] At least one tradeoff names a specific anti-case
- [ ] "Seen in the wild" has one named company + blog URL + year

## Content-specific checks

### Concept

- [ ] Hook is concrete and scenario-based
- [ ] Analogy is a specific imagined scene, not generic
- [ ] Numbers strip has at least 3 rows
- [ ] Bridges include at least 1 LLD pattern + 1 chaos event

### Problem

- [ ] 2-3 canonical solutions (Solution C optional for warmup tier)
- [ ] Napkin math shows arithmetic (not just final numbers)
- [ ] Each canonical solution has one diagram
- [ ] Failure modes link to chaos event slugs (actionable)
- [ ] Real-world references include year stamps

### Chaos scenario

- [ ] YAML trigger block is sim-engine-parseable (run `pnpm validate:chaos-yaml <slug>`)
- [ ] Three narrative variants present
- [ ] Cascade depth ≤5
- [ ] Recovery is either automatic or requires a named action
- [ ] If `basedOnIncident`, the real incident slug exists in §5.6

## Discretionary (editor's call — flag, don't block)

- [ ] Does this pull its weight against the 150k-word moat target? (If an editor would skip this page reading another module's page, revise.)
- [ ] Is there a better analogy?
- [ ] Is the humor variant tasteful? (Chaos scenarios only.)
- [ ] Does the ELI5 version add new understanding or just repeat?

## Sign-off

Editor stamps `editorialStatus: "approved"` in frontmatter and merges the PR. CI blocks merge if `editorialStatus` is missing or set to `draft`/`in-review`.

## Target throughput

- 1.5 pieces/day baseline (1 editor, asynchronous)
- 2.5 pieces/day surge (1 editor + 1 Opus session per draft)
- Phase 4 requires 100 pieces ÷ 30 working days = 3.3 pieces/day. We scale to 2 editors for Phase 4 only.
```

- [ ] **Step 2: Commit**

```bash
git add content/prompts/editor-rubric.md
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add editor rubric for Opus-authored content

Three-tier checklist: structural (auto-enforced), voice (human),
technical (human + CI). Per-type sections for concept / problem /
chaos. Phase 4 scales to 2 editors to hit 100-piece target.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A6: Seed script `scripts/seed-sd-content.ts`

**Files:** `architex/scripts/seed-sd-content.ts`, `package.json` (add `db:seed:sd`)

- [ ] **Step 1: Write the failing test** — `architex/scripts/__tests__/seed-sd-content.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseContentFile } from "../seed-sd-content";

describe("seed-sd-content · parseContentFile", () => {
  it("parses a concept MDX with full frontmatter", () => {
    const mdx = `---
slug: "idempotency"
title: "Idempotency"
wave: 1
waveLabel: "Foundations"
waveOrder: 4
contentType: "concept"
estimatedReadingMinutes: 7
prerequisites: ["request-response"]
bridgesOut:
  - kind: "concept"
    slug: "retries"
    relevance: "idempotent retries are safe"
sourceYear: 2026
contentQuality: "polished"
generatedBy: "hybrid"
editorialStatus: "approved"
---
## Hook
Body.
`;
    const parsed = parseContentFile(mdx, "content/sd/concepts/wave-1-foundations/idempotency.mdx");
    expect(parsed.slug).toBe("idempotency");
    expect(parsed.contentType).toBe("concept");
    expect(parsed.wave).toBe(1);
    expect(parsed.bridgesOut).toHaveLength(1);
  });

  it("throws if frontmatter missing required field", () => {
    const mdx = `---
slug: "foo"
---
Body.
`;
    expect(() => parseContentFile(mdx, "x.mdx")).toThrow(/contentType/i);
  });

  it("throws if editorialStatus is not 'approved'", () => {
    const mdx = `---
slug: "foo"
title: "Foo"
wave: 1
waveLabel: "Foundations"
waveOrder: 1
contentType: "concept"
estimatedReadingMinutes: 5
prerequisites: []
bridgesOut: []
sourceYear: 2026
contentQuality: "polished"
generatedBy: "hybrid"
editorialStatus: "draft"
---
`;
    expect(() => parseContentFile(mdx, "x.mdx")).toThrow(/editorial/i);
  });

  it("throws if slug in frontmatter does not match filename", () => {
    const mdx = `---
slug: "mismatched"
title: "Foo"
wave: 1
waveLabel: "Foundations"
waveOrder: 1
contentType: "concept"
estimatedReadingMinutes: 5
prerequisites: []
bridgesOut: []
sourceYear: 2026
contentQuality: "polished"
generatedBy: "hybrid"
editorialStatus: "approved"
---
`;
    expect(() => parseContentFile(mdx, "content/sd/concepts/wave-1-foundations/different.mdx"))
      .toThrow(/slug.*mismatch/i);
  });
});
```

Run: FAIL (module missing).

- [ ] **Step 2: Create the seed script**

Create `architex/scripts/seed-sd-content.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * SD content seed script.
 * Walks content/sd/**, parses MDX + frontmatter, upserts into module_content.
 * Idempotent: re-running with unchanged content is a no-op.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { db } from "../src/db/client";
import { moduleContent } from "../src/db/schema";
import { sql } from "drizzle-orm";

const CONTENT_ROOT = path.resolve(__dirname, "..", "..", "content", "sd");

export interface ParsedContent {
  slug: string;
  title: string;
  contentType: "concept" | "problem" | "chaos-scenario" | "incident";
  moduleId: "sd";
  wave?: number;
  waveLabel?: string;
  waveOrder?: number;
  domain?: number;
  domainLabel?: string;
  domainOrder?: number;
  estimatedReadingMinutes: number;
  prerequisites: string[];
  bridgesOut: Array<{ kind: string; slug: string; relevance: string }>;
  sourceYear: number;
  contentQuality: "draft" | "polished" | "published";
  generatedBy: "human" | "ai" | "hybrid";
  editorialStatus: "draft" | "in-review" | "approved";
  body: string;
  frontmatter: Record<string, unknown>;
}

const REQUIRED_FIELDS = [
  "slug", "title", "contentType", "estimatedReadingMinutes",
  "prerequisites", "bridgesOut", "sourceYear", "contentQuality",
  "generatedBy", "editorialStatus",
] as const;

export function parseContentFile(source: string, filePath: string): ParsedContent {
  const { data, content } = matter(source);
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      throw new Error(`[${filePath}] missing required frontmatter: ${field}`);
    }
  }
  const slug = String(data.slug);
  const expectedSlug = path.basename(filePath, ".mdx");
  if (slug !== expectedSlug) {
    throw new Error(`[${filePath}] slug mismatch: frontmatter=${slug} filename=${expectedSlug}`);
  }
  if (data.editorialStatus !== "approved") {
    throw new Error(`[${filePath}] editorialStatus is '${data.editorialStatus}', must be 'approved'`);
  }
  return {
    slug,
    title: String(data.title),
    contentType: data.contentType as ParsedContent["contentType"],
    moduleId: "sd",
    wave: data.wave as number | undefined,
    waveLabel: data.waveLabel as string | undefined,
    waveOrder: data.waveOrder as number | undefined,
    domain: data.domain as number | undefined,
    domainLabel: data.domainLabel as string | undefined,
    domainOrder: data.domainOrder as number | undefined,
    estimatedReadingMinutes: Number(data.estimatedReadingMinutes),
    prerequisites: (data.prerequisites as string[]) ?? [],
    bridgesOut: (data.bridgesOut as ParsedContent["bridgesOut"]) ?? [],
    sourceYear: Number(data.sourceYear),
    contentQuality: data.contentQuality as ParsedContent["contentQuality"],
    generatedBy: data.generatedBy as ParsedContent["generatedBy"],
    editorialStatus: data.editorialStatus as ParsedContent["editorialStatus"],
    body: content,
    frontmatter: data as Record<string, unknown>,
  };
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.isFile() && full.endsWith(".mdx")) out.push(full);
  }
  return out;
}

async function main() {
  const files = await walk(CONTENT_ROOT);
  console.log(`[seed-sd-content] found ${files.length} MDX files`);
  const parsed = await Promise.all(files.map(async (f) => {
    const raw = await fs.readFile(f, "utf8");
    return parseContentFile(raw, f);
  }));
  let upserted = 0;
  for (const p of parsed) {
    await db.insert(moduleContent).values({
      moduleId: p.moduleId,
      slug: p.slug,
      title: p.title,
      contentType: p.contentType,
      body: p.body,
      metadata: p.frontmatter as never,
      estimatedReadingMinutes: p.estimatedReadingMinutes,
      sourceYear: p.sourceYear,
      contentQuality: p.contentQuality,
      generatedBy: p.generatedBy,
    }).onConflictDoUpdate({
      target: [moduleContent.moduleId, moduleContent.slug],
      set: {
        title: p.title,
        body: p.body,
        metadata: p.frontmatter as never,
        estimatedReadingMinutes: p.estimatedReadingMinutes,
        sourceYear: p.sourceYear,
        contentQuality: p.contentQuality,
        generatedBy: p.generatedBy,
        updatedAt: sql`now()`,
      },
    });
    upserted += 1;
  }
  console.log(`[seed-sd-content] upserted ${upserted} rows`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 3: Install `gray-matter`**

```bash
cd architex && pnpm add gray-matter
```

- [ ] **Step 4: Add script to `package.json`**

```json
"db:seed:sd": "tsx scripts/seed-sd-content.ts",
```

Run: `pnpm test:run -- seed-sd-content` → PASS.

- [ ] **Step 5: Commit**

```bash
git add architex/scripts/seed-sd-content.ts architex/scripts/__tests__/seed-sd-content.test.ts architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add idempotent seed script for SD content

Walks content/sd/**.mdx, parses frontmatter with gray-matter, enforces
schema + editorialStatus=approved, upserts into module_content keyed
on (moduleId, slug). Four test cases cover happy + three failure modes.
Runnable via pnpm db:seed:sd.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A7: CI check — every content file passes schema + rubric

**Files:** `architex/scripts/validate-sd-content.ts`, `.github/workflows/content-validation.yml`, `package.json`

- [ ] **Step 1: Write the failing test** — `architex/scripts/__tests__/validate-sd-content.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateWordCount, validateBannedWords, validateMermaidBlocks } from "../validate-sd-content";

describe("validate-sd-content", () => {
  it("validates word count within ±20% of target", () => {
    const body = "## Hook\n" + "word ".repeat(50).trim();
    const res = validateWordCount(body, { hook: 60 });
    expect(res.ok).toBe(true); // 50 is within 48-72 band
  });

  it("flags word count outside ±20%", () => {
    const body = "## Hook\n" + "word ".repeat(30);
    const res = validateWordCount(body, { hook: 60 });
    expect(res.ok).toBe(false);
    expect(res.errors).toContainEqual(expect.stringMatching(/hook.*30/i));
  });

  it("flags banned clichés", () => {
    const res = validateBannedWords("This leverages a paradigm shift");
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("validates mermaid blocks are well-formed", () => {
    const body = "```mermaid\nflowchart TB\n  A-->B\n```";
    const res = validateMermaidBlocks(body);
    expect(res.ok).toBe(true);
  });

  it("flags malformed mermaid blocks", () => {
    const body = "```mermaid\nBROKEN\n```";
    const res = validateMermaidBlocks(body);
    expect(res.ok).toBe(false);
  });
});
```

Run: FAIL (module missing).

- [ ] **Step 2: Create the validator** — `architex/scripts/validate-sd-content.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * SD content validator. Three layers:
 *  1. Frontmatter schema (shared with seed script)
 *  2. Word-count bands (±20% per section)
 *  3. Banned-word list + Mermaid block syntax sanity
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.resolve(__dirname, "..", "..", "content", "sd");

const BANNED_WORDS = [
  "leverages", "utilizes", "paradigm shift", "industry-leading",
  "best-in-class", "cutting-edge", "next-generation", "synergy",
  "robust", "seamless", "world-class", "revolutionary",
];

export interface ValidationResult { ok: boolean; errors: string[] }

export function validateWordCount(body: string, targets: Record<string, number>): ValidationResult {
  const errors: string[] = [];
  for (const [section, target] of Object.entries(targets)) {
    const heading = section.replace(/([A-Z])/g, " $1").trim();
    const re = new RegExp(`##\\s+${heading}\\b[\\s\\S]*?(?=##\\s+|$)`, "i");
    const match = body.match(re);
    if (!match) continue;
    const words = match[0].replace(/^##\s+[^\n]+/, "").trim().split(/\s+/).filter(Boolean).length;
    const lo = Math.floor(target * 0.8);
    const hi = Math.ceil(target * 1.2);
    if (words < lo || words > hi) {
      errors.push(`${section}: ${words} words, expected ${lo}-${hi} (target ${target})`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateBannedWords(body: string): ValidationResult {
  const errors: string[] = [];
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(body)) errors.push(`banned word: "${w}"`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateMermaidBlocks(body: string): ValidationResult {
  const errors: string[] = [];
  const blocks = body.match(/```mermaid[\s\S]*?```/g) ?? [];
  for (const [i, block] of blocks.entries()) {
    const inner = block.replace(/```mermaid\n?/, "").replace(/```$/, "");
    if (!/^\s*(flowchart|graph|sequenceDiagram|stateDiagram|erDiagram|classDiagram|journey)/.test(inner)) {
      errors.push(`mermaid block ${i + 1}: missing diagram-type directive`);
    }
  }
  return { ok: errors.length === 0, errors };
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.isFile() && full.endsWith(".mdx")) out.push(full);
  }
  return out;
}

async function main() {
  const files = await walk(CONTENT_ROOT);
  let failed = 0;
  for (const f of files) {
    const raw = await fs.readFile(f, "utf8");
    const { data, content } = matter(raw);
    const targets = (data.wordTargetBySection ?? data.wordTargetByPane ?? {}) as Record<string, number>;
    const results = [
      validateWordCount(content, targets),
      validateBannedWords(content),
      validateMermaidBlocks(content),
    ];
    const errs = results.flatMap((r) => r.errors);
    if (errs.length) {
      console.error(`\n✗ ${path.relative(process.cwd(), f)}`);
      for (const e of errs) console.error(`  ${e}`);
      failed += 1;
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} file(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\n✓ all ${files.length} files passed validation`);
}

if (require.main === module) main();
```

- [ ] **Step 3: Add CI workflow** — `.github/workflows/content-validation.yml`:

```yaml
name: content-validation
on:
  pull_request:
    paths:
      - "content/sd/**"
      - "architex/scripts/validate-sd-content.ts"
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v5
        with: { node-version: "22", cache: "pnpm" }
      - run: cd architex && pnpm install --frozen-lockfile
      - run: cd architex && pnpm tsx scripts/validate-sd-content.ts
```

- [ ] **Step 4: Add `validate:content` script**

```json
"validate:content": "tsx scripts/validate-sd-content.ts",
```

Run: `pnpm test:run -- validate-sd-content` → PASS.

- [ ] **Step 5: Commit**

```bash
git add architex/scripts/validate-sd-content.ts architex/scripts/__tests__/validate-sd-content.test.ts .github/workflows/content-validation.yml architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd-phase-4): add CI validator for Opus-authored content

Three layers: word-count bands (±20%), banned-word scanner (12
clichés), Mermaid block syntax sanity. Runs on every content/sd/**
PR. Blocks merge on failure. Five test cases.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task Group B · Content Authoring (23 Concepts + 17 Problems + 60 Chaos Scenarios)

*These tasks are authoring, not coding. Each task names the piece, passes Opus the correct inputs via the prompt templates from A2-A4, and the editor runs the rubric. Engineering does not block on authoring, but Tasks C4-C8 (card generators) need seeded content before they can produce test fixtures. We run content authoring in parallel with engineering throughout Phase 4.*

*The task bodies below are **prescriptive authoring briefs** — each one includes the concept/problem's `slug`, `title`, `wave/domain`, 3-5 reference numbers Opus must hit, the 3-5 prerequisite concept slugs, and the 5-8 bridge slugs. Opus then fills the 8-section or 6-pane format. This is how the content scales from template to 100 pieces without losing editorial direction.*

---

## Task B1: Wave 4 · `message-queues-vs-event-streams`

- **Slug:** `message-queues-vs-event-streams`
- **Title:** `Message Queues vs Event Streams`
- **Wave:** 4 · Messaging & Streams · Order 1/4
- **Prerequisites:** `request-response` · `statelessness` · `load-balancing`
- **Reference numbers Opus must hit:**
  - RabbitMQ single-queue: 20-50k msg/sec typical, p99 ≤5ms
  - Kafka single-partition: 500k msg/sec on NVMe, 50MB/s write
  - Retention: RabbitMQ default 0 post-ack; Kafka default 168h (7d)
  - Ordering: RabbitMQ per-queue, Kafka per-partition
  - Consumer semantics: RabbitMQ competing consumers; Kafka consumer groups + partition assignment
- **Bridges-out (5):** `delivery-semantics` (concept) · `change-data-capture` (concept) · `design-notification-service` (problem) · `observer-pattern` (LLD) · `dependency-timeout-cascade` (chaos)
- **Editor rubric items specific to this piece:** Must call out *why* Kafka is a log (append-only) and RabbitMQ is a queue (ephemeral). The diagram in Primitive must show both topologies side by side.

- [ ] **Step 1** · Open an issue labeled `opus-authoring` with the above brief. Attach `content/prompts/sd-concept-prompt.md` as context.
- [ ] **Step 2** · Opus produces draft 1. Editor runs `pnpm validate:content` locally and comments inline.
- [ ] **Step 3** · Opus draft 2. Editor stamps `editorialStatus: "approved"`.
- [ ] **Step 4** · PR merges `content/sd/concepts/wave-4-messaging-streams/message-queues-vs-event-streams.mdx`. CI green.
- [ ] **Step 5** · Seed: `pnpm db:seed:sd`. Verify row: `slug=message-queues-vs-event-streams, moduleId=sd`.

---

## Task B2: Wave 4 · `delivery-semantics`

- **Slug:** `delivery-semantics`
- **Title:** `Delivery Semantics — at-most-once, at-least-once, exactly-once`
- **Wave:** 4 · Order 2/4
- **Prerequisites:** `message-queues-vs-event-streams` · `idempotency`
- **Reference numbers:**
  - At-most-once: zero duplicates, data loss possible (fire-and-forget UDP)
  - At-least-once: no loss, duplicates likely (default Kafka producer with ack=1)
  - Exactly-once: Kafka transactions + idempotent producer (KIP-98, 2017) — 30-40% throughput cost
  - Deduplication window: 7 days typical (matches Kafka default retention)
- **Bridges-out:** `idempotency` · `change-data-capture` · `design-stripe-payments` · `saga-pattern` (LLD) · `duplicate-delivery-storm` (chaos)
- **Voice note:** The tradeoffs section must be blunt: exactly-once costs ~30% throughput. Many architects assume it's free.

- [ ] **Step 1-5** (same authoring loop as B1).

---

## Task B3: Wave 4 · `change-data-capture`

- **Slug:** `change-data-capture`
- **Title:** `Change Data Capture (CDC)`
- **Wave:** 4 · Order 3/4
- **Prerequisites:** `replication` · `delivery-semantics` · `message-queues-vs-event-streams`
- **Reference numbers:**
  - Debezium: MySQL binlog / Postgres WAL / MongoDB oplog readers
  - Latency: 50-500ms tail p99 at moderate load
  - Throughput: ~10k changes/sec per connector, linear scale-out
  - Resilience: snapshot-on-startup + streaming; exactly-once via offset commit
  - Anti-case: CDC is not audit log — it captures state changes, not intent
- **Bridges-out:** `outbox-pattern` · `design-dropbox` · `design-onenote-sync` · `replication` · `silent-log-gap` (chaos)

- [ ] **Step 1-5**.

---

## Task B4: Wave 4 · `stream-processing`

- **Slug:** `stream-processing`
- **Title:** `Stream Processing — windowing, watermarks, exactly-once in Kafka/Flink`
- **Wave:** 4 · Order 4/4
- **Prerequisites:** `message-queues-vs-event-streams` · `delivery-semantics` · `distributed-clocks`
- **Reference numbers:**
  - Flink checkpoint interval: 1-60s typical; <1s penalizes throughput
  - Window types: tumbling · sliding · session · global
  - Watermark lag p99: aim for ≤5s late-event tolerance
  - Exactly-once: 2PC via TwoPhaseCommitSinkFunction (Flink), coordinator-less (Kafka Streams transactions)
  - Throughput: 1M events/sec/node on commodity hardware (Flink benchmark, 2023)
- **Bridges-out:** `distributed-clocks` · `design-twitch` · `design-metrics-system` · `windowing-late-event-storm` (chaos) · `observer-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B5: Wave 5 · `consensus-raft-paxos`

- **Slug:** `consensus-raft-paxos`
- **Title:** `Consensus — Raft and Paxos in One Paragraph`
- **Wave:** 5 · Distributed Systems · Order 1/5
- **Prerequisites:** `replication` · `leader-election` (forward-declared) · `quorum-reads-writes` (forward-declared)
- **Reference numbers:**
  - Raft: leader + followers · term-based · log-replication with prevLogIndex matching
  - Paxos: prepare-phase + accept-phase · majority quorum (⌈N/2⌉+1)
  - Latency: 1 round-trip single-region, 2 RT cross-region
  - Throughput ceiling: 10-50k ops/sec/group (etcd benchmark, 2024)
  - Anti-case: do not use consensus for high-write metadata (use gossip + CRDT)
- **Bridges-out:** `leader-election` · `design-distributed-cron` · `chubby-paper` · `split-brain-on-network-partition` (chaos) · `saga-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B6: Wave 5 · `leader-election`

- **Slug:** `leader-election`
- **Title:** `Leader Election`
- **Wave:** 5 · Order 2/5
- **Prerequisites:** `consensus-raft-paxos` · `failure-handling`
- **Reference numbers:**
  - Bully algorithm: O(N²) messages, O(N) time
  - Raft leader election: randomized timeout 150-300ms, one RT per election
  - ZooKeeper-style: ephemeral znodes with sequence; leader = lowest sequence
  - Lease-based: TTL 10-30s typical, renew at 1/3 TTL
  - Split-brain risk: avoid with majority quorum or fencing token
- **Bridges-out:** `consensus-raft-paxos` · `design-distributed-cron` · `design-zoom-meetings` · `gossip-protocols` · `dual-leader-write-conflict` (chaos)

- [ ] **Step 1-5**.

---

## Task B7: Wave 5 · `distributed-clocks`

- **Slug:** `distributed-clocks`
- **Title:** `Distributed Clocks — logical, vector, and hybrid logical clocks`
- **Wave:** 5 · Order 3/5
- **Prerequisites:** `replication` · `consistency-models`
- **Reference numbers:**
  - Lamport logical: monotonic counter, not directly comparable across nodes
  - Vector clocks: O(N) bytes per event, captures causal order
  - HLC (Hybrid Logical Clock): logical + physical, bounded skew to wall clock ±500ms
  - NTP: skew target ±10ms datacenter, ±100ms WAN
  - Google TrueTime: ±7ms worst case, custom hardware + GPS
- **Bridges-out:** `consensus-raft-paxos` · `design-google-maps` · `design-find-friends` · `stream-processing` · `clock-drift-cascade` (chaos)

- [ ] **Step 1-5**.

---

## Task B8: Wave 5 · `gossip-protocols`

- **Slug:** `gossip-protocols`
- **Title:** `Gossip Protocols`
- **Wave:** 5 · Order 4/5
- **Prerequisites:** `distributed-clocks` · `failure-handling`
- **Reference numbers:**
  - Epidemic spreading: O(log N) rounds to converge, N nodes
  - Round interval: 1-3s typical (Cassandra default 1s)
  - Fanout: 3-5 peers per round
  - Convergence at 1000 nodes: ~10s
  - Anti-case: do not use gossip for strongly-consistent metadata (use consensus)
- **Bridges-out:** `consensus-raft-paxos` · `design-metrics-system` · `design-youtube-recommendations` · `quorum-reads-writes` · `gossip-blackhole-split` (chaos)

- [ ] **Step 1-5**.

---

## Task B9: Wave 5 · `quorum-reads-writes`

- **Slug:** `quorum-reads-writes`
- **Title:** `Quorum Reads and Writes`
- **Wave:** 5 · Order 5/5
- **Prerequisites:** `replication` · `consensus-raft-paxos`
- **Reference numbers:**
  - N=3, R=2, W=2 (Cassandra default): overlapping quorums, strong consistency
  - N=3, R=1, W=1: no overlap, eventual consistency
  - W+R > N ⇒ strong consistency; W+R ≤ N ⇒ eventual
  - Latency: dominated by the slowest W-th replica ack
  - Anti-case: do not use W=3 for hot writes (2-of-3 is often enough)
- **Bridges-out:** `replication` · `cap-in-practice` · `design-amazon-checkout` · `design-stripe-payments` · `slow-replica-tail-latency` (chaos)

- [ ] **Step 1-5**.

---

## Task B10: Wave 6 · `circuit-breakers`

- **Slug:** `circuit-breakers`
- **Title:** `Circuit Breakers`
- **Wave:** 6 · Resilience · Order 1/4
- **Prerequisites:** `failure-handling` · `retries-with-jitter` (forward-declared)
- **Reference numbers:**
  - States: closed · open · half-open
  - Trip threshold: 50% error rate over 10s window typical
  - Open timeout: 30-60s before half-open probe
  - Hystrix defaults (2016): 10s window, 20 req minimum, 50% error trip
  - Anti-case: do not wrap a call that has its own retry budget (compounding delay)
- **Bridges-out:** `retries-with-jitter` · `bulkheads-pool-isolation` · `design-stripe-payments` · `design-amazon-checkout` · `dependency-brownout` (chaos)

- [ ] **Step 1-5**.

---

## Task B11: Wave 6 · `retries-with-jitter`

- **Slug:** `retries-with-jitter`
- **Title:** `Retries with Exponential Backoff and Jitter`
- **Wave:** 6 · Order 2/4
- **Prerequisites:** `idempotency` · `circuit-breakers`
- **Reference numbers:**
  - Exponential backoff: `min(cap, base * 2^attempt)`; cap 30-60s
  - Jitter: full-random multiplier 0-1 (AWS blog, 2015)
  - Max attempts: 3-5 for synchronous; 10+ for async queue workers
  - Without jitter: thundering-herd on recovery; with jitter: load spread
  - Anti-case: do not retry non-idempotent calls without a dedup key
- **Bridges-out:** `idempotency` · `circuit-breakers` · `design-stripe-payments` · `thundering-herd-on-recovery` (chaos) · `retry-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B12: Wave 6 · `bulkheads-pool-isolation`

- **Slug:** `bulkheads-pool-isolation`
- **Title:** `Bulkheads and Pool Isolation`
- **Wave:** 6 · Order 3/4
- **Prerequisites:** `circuit-breakers` · `connection-pooling`
- **Reference numbers:**
  - Thread pool per dependency: 20-50 threads typical
  - Semaphore-based: cheap but no timeout
  - Connection pool per DB: 10-30 per service (PgBouncer transaction mode)
  - Goroutine-per-request (Go): up to 10k cheap, 100k+ needs care
  - Anti-case: do not share a single pool across two dependencies with wildly different latency profiles
- **Bridges-out:** `circuit-breakers` · `connection-pooling` · `design-twitch` · `design-zoom-meetings` · `noisy-neighbor-pool-exhaustion` (chaos)

- [ ] **Step 1-5**.

---

## Task B13: Wave 6 · `graceful-degradation`

- **Slug:** `graceful-degradation`
- **Title:** `Graceful Degradation`
- **Wave:** 6 · Order 4/4
- **Prerequisites:** `circuit-breakers` · `caching-strategies` · `bulkheads-pool-isolation`
- **Reference numbers:**
  - Netflix Hystrix fallback: cached · static · empty response
  - Stale-while-revalidate: serve 10-60s stale cache on origin failure
  - Feature-flag-driven shedding: drop 10-50% of optional features under load
  - Anti-case: do not serve stale payment confirmations; financial correctness trumps availability
- **Bridges-out:** `caching-strategies` · `design-amazon-checkout` · `design-netflix-playback` (LLD cross-bridge) · `origin-failure-cache-serves-stale` (chaos) · `null-object-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B14: Wave 7 · `observability-metrics-logs-traces`

- **Slug:** `observability-metrics-logs-traces`
- **Title:** `Observability — Metrics, Logs, Traces, and How They Differ`
- **Wave:** 7 · Operational · Order 1/5
- **Prerequisites:** `request-response` · `statelessness` · `load-balancing`
- **Reference numbers:**
  - Metrics: aggregated, low cardinality, cheap storage (Prometheus at 1-5GB/day/node)
  - Logs: unstructured-to-JSON, high cardinality, 100MB-1GB/day/node typical
  - Traces: per-request span tree, 0.1-1% sampled, 10-50GB/day aggregated
  - USE method: Utilization / Saturation / Errors (Brendan Gregg, 2012)
  - RED method: Rate / Errors / Duration (Tom Wilkie, 2015)
- **Bridges-out:** `sli-slo-sla` · `design-metrics-system` · `design-datadog-pipeline` (from Phase 3) · `alert-storm-on-deploy` (chaos) · `observer-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B15: Wave 7 · `sli-slo-sla`

- **Slug:** `sli-slo-sla`
- **Title:** `SLI · SLO · SLA`
- **Wave:** 7 · Order 2/5
- **Prerequisites:** `observability-metrics-logs-traces`
- **Reference numbers:**
  - SLI: "what you measure" (p99 latency, error rate)
  - SLO: "what you promise internally" (99.9% over 30d)
  - SLA: "what you contract externally" (usually SLO minus a safety margin)
  - 99.9% = 43.2 min/month downtime budget
  - 99.99% = 4.32 min/month
  - Error budget burn: 2x SLO-breach triggers freeze on new deploys
- **Bridges-out:** `observability-metrics-logs-traces` · `incident-response` · `design-amazon-checkout` · `design-stripe-payments` · `slo-burn-alert` (chaos)

- [ ] **Step 1-5**.

---

## Task B16: Wave 7 · `deployment-patterns`

- **Slug:** `deployment-patterns`
- **Title:** `Deployment Patterns — Blue-Green, Canary, Feature Flags, Rollback`
- **Wave:** 7 · Order 3/5
- **Prerequisites:** `load-balancing` · `observability-metrics-logs-traces`
- **Reference numbers:**
  - Blue-green: 2x infra, atomic switch, rollback in seconds
  - Canary: 1-5% → 25% → 50% → 100%, 10-30 min per stage typical
  - Feature flags: per-user or per-cohort rollout, sub-second toggle
  - Rollback: aim for ≤5 min MTTR from detection to 100% pre-deploy
  - Anti-case: do not canary a schema migration; use expand/contract pattern
- **Bridges-out:** `feature-flags-rollout` · `incident-response` · `design-feature-flags` (problem) · `failed-canary-silent-regression` (chaos) · `deployment-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B17: Wave 7 · `capacity-planning-littles-law`

- **Slug:** `capacity-planning-littles-law`
- **Title:** `Capacity Planning — Little's Law in Practice`
- **Wave:** 7 · Order 4/5
- **Prerequisites:** `load-balancing` · `observability-metrics-logs-traces`
- **Reference numbers:**
  - L = λ × W (concurrency = arrival-rate × avg-latency)
  - Example: 10k req/s × 50ms = 500 concurrent in-flight requests
  - Queueing saturation at ~70% utilization (M/M/1 curves)
  - Headroom: aim for 2x peak for noisy-neighbor + burst absorption
  - Anti-case: do not size to average; size to p95 burst
- **Bridges-out:** `observability-metrics-logs-traces` · `backpressure` · `design-uber-dispatch` · `saturation-cliff` (chaos) · `queue-metric-tracking` (LLD)

- [ ] **Step 1-5**.

---

## Task B18: Wave 7 · `incident-response`

- **Slug:** `incident-response`
- **Title:** `Incident Response — The Runbook Shape`
- **Wave:** 7 · Order 5/5
- **Prerequisites:** `observability-metrics-logs-traces` · `sli-slo-sla`
- **Reference numbers:**
  - Detect → Engage → Diagnose → Mitigate → Resolve → Postmortem
  - MTTR target: p50 ≤15 min, p95 ≤60 min for Sev-1
  - Runbook signal-to-noise: <10% false-positive page rate or on-call leaves the team
  - Blameless postmortem within 5 business days
  - Anti-case: do not call an incident resolved until telemetry proves it
- **Bridges-out:** `sli-slo-sla` · `design-datadog-pipeline` · `design-pagerduty-like-system` · `alert-storm-on-deploy` (chaos) · `facebook-bgp-2021` (real incident)

- [ ] **Step 1-5**.

---

## Task B19: Wave 8 · `edge-compute-stateless-at-edge`

- **Slug:** `edge-compute-stateless-at-edge`
- **Title:** `Edge Compute and the Stateless-at-the-Edge Pattern`
- **Wave:** 8 · Modern · Order 1/5
- **Prerequisites:** `cdn-fundamentals` · `statelessness` · `load-balancing`
- **Reference numbers:**
  - Cloudflare Workers: 50ms p99 cold start, sub-ms warm
  - Fastly Compute@Edge: WASM, ~ms cold start
  - AWS Lambda@Edge: 100-300ms cold start (Node/Python)
  - Edge-locations: 200+ POPs (Cloudflare 2024), 400+ (AWS CloudFront)
  - Anti-case: edge is wrong for multi-tenant stateful sessions; keep state in regional DB
- **Bridges-out:** `cdn-fundamentals` · `webassembly-runtime` · `design-google-maps` · `design-shopify-storefront` · `edge-config-push-bug` (chaos)

- [ ] **Step 1-5**.

---

## Task B20: Wave 8 · `webassembly-runtime`

- **Slug:** `webassembly-runtime`
- **Title:** `WebAssembly as a Runtime Boundary`
- **Wave:** 8 · Order 2/5
- **Prerequisites:** `edge-compute-stateless-at-edge`
- **Reference numbers:**
  - Module size: 50KB-500KB typical (vs containers at 100MB+)
  - Cold start: <1ms (vs 100ms+ for Lambda, 1s+ for containers)
  - WASI: system-interface standard for filesystem + network
  - Memory: 4GB max per instance (current limit)
  - Anti-case: WASM is poor for long-lived stateful workers (use traditional server)
- **Bridges-out:** `edge-compute-stateless-at-edge` · `design-shopify-storefront` · `design-feature-flags` · `memory-limit-cascade` (chaos) · `strategy-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B21: Wave 8 · `vector-search-rag`

- **Slug:** `vector-search-rag`
- **Title:** `Vector Search and Retrieval-Augmented Generation (RAG)`
- **Wave:** 8 · Order 3/5
- **Prerequisites:** `caching-strategies` · `observability-metrics-logs-traces`
- **Reference numbers:**
  - Embedding dim: 768-3072 (OpenAI ada-002: 1536; text-embedding-3-large: 3072)
  - HNSW index: 10-50ms p99 at 10M vectors
  - Recall@10 vs. exact: 0.95 typical at default HNSW params
  - Storage: 4 bytes/dim/vector → 1M × 1536 dim = 6GB
  - Anti-case: do not use vector search for exact-match lookups; keyword index is O(1)
- **Bridges-out:** `caching-strategies` · `design-youtube-recommendations` · `design-spotify-discovery` · `ai-as-system-component` · `embedding-drift-on-model-update` (chaos)

- [ ] **Step 1-5**.

---

## Task B22: Wave 8 · `event-sourcing-cqrs`

- **Slug:** `event-sourcing-cqrs`
- **Title:** `Event Sourcing and CQRS`
- **Wave:** 8 · Order 4/5
- **Prerequisites:** `change-data-capture` · `stream-processing` · `replication`
- **Reference numbers:**
  - Event store write: append-only, ~10k events/sec/partition
  - Snapshot cadence: every 100-1000 events typical
  - Projection lag p99: ≤5s for user-facing reads
  - Anti-case: do not event-source a simple CRUD domain; the overhead is real
  - Rehydration cost: O(events_since_snapshot); watch for unbounded growth
- **Bridges-out:** `change-data-capture` · `stream-processing` · `design-google-docs` · `design-whatsapp-sync` · `projection-replay-storm` (chaos) · `command-pattern` (LLD)

- [ ] **Step 1-5**.

---

## Task B23: Wave 8 · `ai-as-system-component`

- **Slug:** `ai-as-system-component`
- **Title:** `AI as a System Component — LLM Behind a Queue`
- **Wave:** 8 · Order 5/5
- **Prerequisites:** `message-queues-vs-event-streams` · `retries-with-jitter` · `vector-search-rag`
- **Reference numbers:**
  - Claude Sonnet p50 latency: 1-3s at 1k tokens; p99 can exceed 30s
  - Retry budget: 3 attempts with exponential backoff typical
  - Rate limits: Anthropic tier-1 = 50 req/min, tier-4 = 4000 req/min
  - Cost: input $3/M, output $15/M tokens (Claude Sonnet 4.7, 2026 rates)
  - Anti-case: do not put LLM on the critical synchronous path without a cached fallback
- **Bridges-out:** `message-queues-vs-event-streams` · `vector-search-rag` · `design-google-search` · `design-spotify-discovery` · `llm-hallucination-retry-loop` (chaos)

- [ ] **Step 1-5**.

---

## Task B24: Domain 2 · `design-uber-dispatch`

- **Slug:** `design-uber-dispatch`
- **Title:** `Design Uber (Dispatch)`
- **Domain:** 2 · Location & Real-time · Order 1/5
- **Difficulty:** Principal
- **Prerequisite concepts:** `distributed-clocks` · `consistent-hashing` · `gossip-protocols` · `load-balancing` · `backpressure`
- **Uses patterns (LLD):** `observer-pattern` · `strategy-pattern` · `chain-of-responsibility`
- **Chaos bridges:** `driver-pool-location-desync` · `surge-compute-saturation` · `gps-spoof-injection` · `dispatch-queue-backpressure` · `map-tile-cdn-miss`
- **Scale band:** 100M DAU, 15M trips/day peak, 5M drivers online concurrently, 50k dispatches/sec peak
- **3 canonical solutions:**
  - A · Geohash + Redis GEO (the obvious): h3 or quadkey shard, driver positions in Redis GEO, dispatcher polls candidate set.
  - B · Spatial index server + gossip (the scale-out answer): dedicated spatial service, gossip for driver state, consistent-hashing across cells.
  - C · Hybrid with whale-cell detector (the Principal answer): normal cells use Solution A; hot cells (airports, stadiums) promoted to Solution B with dedicated Redis shards.

- [ ] **Step 1-5** (authoring loop from B1).

---

## Task B25: Domain 2 · `design-google-maps`

- **Slug:** `design-google-maps`
- **Title:** `Design Google Maps (Tiles + Routing)`
- **Domain:** 2 · Order 2/5
- **Difficulty:** Principal
- **Prerequisite concepts:** `cdn-fundamentals` · `edge-compute-stateless-at-edge` · `caching-strategies` · `distributed-clocks` · `vector-search-rag`
- **Uses patterns:** `decorator-pattern` · `composite-pattern` · `strategy-pattern`
- **Chaos bridges:** `tile-cdn-region-purge` · `route-cache-invalidation-storm` · `search-index-stale` · `traffic-layer-ingestion-gap` · `directions-timeout-cascade`
- **Scale band:** 2B MAU, 100PB tile storage, 1B route-requests/day, 250k req/sec peak
- **3 canonical solutions:**
  - A · Pre-rendered tile pyramid (the classic): zoom 0-20, quadtree, CloudFront-style CDN with 1-year TTL on base tiles.
  - B · Vector tiles + client render (the modern): ship tile data, client GPU renders; 10x smaller payload.
  - C · Hybrid with real-time traffic overlay: Solution A base + vector overlay for live layer, refresh 60-90s.

- [ ] **Step 1-5**.

---

## Task B26: Domain 2 · `design-find-friends`

- **Slug:** `design-find-friends`
- **Title:** `Design Find My Friends (Eventually Consistent Location)`
- **Domain:** 2 · Order 3/5
- **Difficulty:** Intermediate
- **Prerequisite concepts:** `distributed-clocks` · `consistency-models` · `gossip-protocols` · `caching-strategies`
- **Uses patterns:** `observer-pattern` · `publish-subscribe` (LLD)
- **Chaos bridges:** `gps-spoof-injection` · `gossip-blackhole-split` · `push-notification-storm` · `battery-drain-on-chatty-client` · `privacy-mode-read-conflict`
- **Scale band:** 500M DAU, 10M friend-pairs sharing, 1k locations/sec/user burst
- **3 canonical solutions:**
  - A · Polling with TTL (warmup): client polls every 30-60s, cache 2-5 min TTL.
  - B · Pub-sub with delta pushes (core answer): friend pair subscription, updates via push only on movement > 50m.
  - C · Hybrid with ambient presence (Principal): pub-sub for active sessions, periodic snapshot for dormant.

- [ ] **Step 1-5**.

---

## Task B27: Domain 2 · `design-zoom-meetings`

- **Slug:** `design-zoom-meetings`
- **Title:** `Design Zoom-like Video Conferencing`
- **Domain:** 2 · Order 4/5
- **Difficulty:** Principal
- **Prerequisite concepts:** `edge-compute-stateless-at-edge` · `load-balancing` · `backpressure` · `leader-election` · `bulkheads-pool-isolation`
- **Uses patterns:** `mediator-pattern` · `strategy-pattern` · `state-pattern`
- **Chaos bridges:** `sfu-overload-cascade` · `network-jitter-cascade` · `packet-loss-degradation` · `bandwidth-starvation` · `region-failover-disconnect`
- **Scale band:** 300M DAU, 1B meeting-minutes/day, 10k concurrent large meetings (1000+ participants)
- **3 canonical solutions:**
  - A · MCU (Multipoint Control Unit): server mixes streams — simple but CPU-heavy.
  - B · SFU (Selective Forwarding Unit): server relays, client mixes — scales horizontally.
  - C · Hybrid MCU/SFU with cascading SFUs (Principal): multi-region SFU tree for global meetings; fallback to MCU for low-bandwidth clients.

- [ ] **Step 1-5**.

---

## Task B28: Domain 2 · `design-twitch`

- **Slug:** `design-twitch`
- **Title:** `Design Twitch-like Live Streaming`
- **Domain:** 2 · Order 5/5
- **Difficulty:** Principal
- **Prerequisite concepts:** `cdn-fundamentals` · `stream-processing` · `backpressure` · `bulkheads-pool-isolation` · `message-queues-vs-event-streams`
- **Uses patterns:** `pipeline-pattern` · `observer-pattern` · `strategy-pattern`
- **Chaos bridges:** `transcoding-pipeline-stall` · `viewer-spike-origin-overload` · `cdn-edge-eviction-storm` · `chat-flood-backpressure` · `monetization-ad-pod-miss`
- **Scale band:** 30M DAU, 2M concurrent viewers peak, 100k concurrent streamers, 5 Gbps egress/region
- **3 canonical solutions:**
  - A · Origin + CDN with HLS (classic): streamer → origin → transcode ladder → CDN → HLS client, 5-15s latency.
  - B · WebRTC for low-latency interactive: sub-second latency, SFU topology, 10k viewer/stream cap before tree-cascade.
  - C · Hybrid with dual-output: WebRTC for subscribers who want low latency; HLS for mass audience.

- [ ] **Step 1-5**.

---
