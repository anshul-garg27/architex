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
