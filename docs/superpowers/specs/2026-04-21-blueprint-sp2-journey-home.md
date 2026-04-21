# Blueprint SP2 · Journey Home Spec

> **Parent:** `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md`
> **Predecessor:** `docs/superpowers/specs/2026-04-21-blueprint-sp1-foundation.md`
> **Status:** Approved, ready for plan + implementation
> **Date:** 2026-04-21
> **Scope:** First user-facing UI — Journey home, curriculum map, unit cards, resume card, progress dashboard, streak pill

---

## 1. Purpose

SP1 shipped the scaffolding. SP2 makes Blueprint *feel like a course*. By the end of SP2 a user lands on `/modules/blueprint` and sees:

- A welcome banner on first visit
- Their current resume card (or a "start here" call-to-action if they haven't begun)
- A curriculum map laying out all 12 units with visual state (available / in_progress / completed / mastered / locked)
- A streak pill showing their daily habit
- A progress dashboard reachable from the top nav

Still no unit interior (that's SP3) and no toolkit (SP4–6), but the home screen is alive and the mental model is set: *this is a course, here is your progress, here is where you're headed*.

## 2. What ships

### 2.1 Data hooks (TanStack Query)

**File:** `src/hooks/blueprint/useUnitList.ts`
- GET `/api/blueprint/units` via React Query
- 1-hour staleTime (units rarely change)
- Returns `{ units, isLoading, error }`

**File:** `src/hooks/blueprint/useProgressSummary.ts`
- GET `/api/blueprint/progress/summary`
- 30s staleTime — streak + counts are user-live
- Returns typed summary row

**File:** `src/hooks/blueprint/useResumeState.ts`
- Composes `useJourneyStateSync`'s cached store values with `useProgressSummary`
- Returns the "resume target": `{ unitSlug, sectionId, label }` — last active unit if any; otherwise `null` (fresh user)

**File:** `src/hooks/blueprint/useUnitProgressMap.ts`
- GET `/api/blueprint/progress/units` (NEW API route) — per-user list of unit states
- Returns `Record<unitSlug, UnitProgressView>` — used by CurriculumMap to color nodes

### 2.2 One new API route

**File:** `src/app/api/blueprint/progress/units/route.ts`
- GET — returns `{ rows: Array<{unitSlug, state, completedSectionCount, totalSections, masteredAt, completedAt, lastSeenAt}> }`
- Joins `blueprint_user_progress` + `blueprint_units` by `unit_id`
- For units with no progress row yet, derives `state` from prereq check (locked vs available)
- Cap at 50 rows (one course has 12 units; headroom for future multi-course support)

### 2.3 Journey components

**File:** `src/components/modules/blueprint/journey/WelcomeBanner.tsx`
- Shows on first visit (server state `welcomeDismissedAt == null` AND store `welcomeDismissed === false`)
- 3-option choice: "Start the course" / "Drill a problem" / "Browse patterns"
- Each choice:
  - Fires `blueprintWelcomeDismissed({ action })`
  - Persists `welcomeDismissedAt = now()`
  - Routes to appropriate destination (unit 1 / toolkit/problems / toolkit/patterns)
- "Close" X in corner — dismisses without action
- Fires `blueprintWelcomeShown` on first render

**File:** `src/components/modules/blueprint/journey/ResumeCard.tsx`
- If `resumeState` is null: renders "Start with Unit 1 →" CTA
- If `resumeState` present: large card with unit title, section title, progress bar, "Continue →" button
- Fires `blueprintResumeClicked` on click
- Navigates to `/modules/blueprint/unit/<slug>` with section hash if present

**File:** `src/components/modules/blueprint/journey/StreakPill.tsx`
- Small pill showing `{streakDays}d` streak + "0 due today" review-due count (real due count lands SP6)
- Placed top-right of the journey home; also shown on the breadcrumb row via StatusBar future work (not SP2)

**File:** `src/components/modules/blueprint/journey/UnitCard.tsx`
- Single unit presentation: ordinal badge + title + summary + duration + difficulty + tags
- Progress ring when `state === "in_progress"`
- Checkmark + gold tint when `mastered`; slate checkmark when `completed`
- Lock icon + gray when `locked`
- Hover → ring + chevron
- Clickable (routes to `/unit/<slug>`) unless `locked` (soft gate — shows tooltip "complete prereqs first")
- Fires `blueprintUnitOpened({ unitSlug, entry: "map" })` on click

**File:** `src/components/modules/blueprint/journey/CurriculumMap.tsx`
- Renders the 12 units in curriculum order (ordinal ASC)
- V1 layout: **vertical tracks** grouped by `tags[0]` (foundation / creational / structural / behavioral / applied)
- Each track is a horizontal row of UnitCards
- Prerequisite lines drawn between units with SVG (optional in V1 — can render track-only if graph is noisy)
- Responsive: on < 1024 wide, shows only the "open-desktop" landing per §L6
- Skeleton while loading

**File:** `src/components/modules/blueprint/journey/JourneyHomePage.tsx`
- Composes: WelcomeBanner + [ResumeCard + StreakPill] + CurriculumMap
- Calls all four data hooks
- Handles the loading/error states per-section

**File:** `src/app/modules/blueprint/page.tsx` (MODIFY)
- Replaces the `BlueprintComingSoon` placeholder with `<JourneyHomePage />`

### 2.4 Progress dashboard

**File:** `src/components/modules/blueprint/progress/ProgressDashboard.tsx`
- Three stat cards: Units Completed / Patterns Mastered / Total Time
- Streak streak with a 30-day calendar heat strip
- Quick links to `progress/patterns` | `progress/problems` | `progress/streak`

**File:** `src/components/modules/blueprint/progress/PatternMasteryGrid.tsx`
- Grid of all 36 patterns (from shared LLD catalog) × user's FSRS state per pattern
- Each cell shows pattern name + mastery level (introduced / completed / mastered) as a color ring
- Filter: by category (creational / structural / behavioral)
- Click cell → routes to `/modules/blueprint/toolkit/patterns/<slug>` (opens in toolkit)

**File:** `src/components/modules/blueprint/progress/ProblemHistoryList.tsx`
- List of problem drill attempts, sorted by date desc
- Each row: problem name, sub-mode, score, date, time-taken
- Empty state: "No drills yet — try one from the toolkit"
- Click row → routes to `/modules/blueprint/toolkit/problems/<slug>`

**File:** `src/components/modules/blueprint/progress/StreakDetail.tsx`
- Full-year calendar heat map of active days
- Longest streak / current streak / target hit days
- Minimal; most value lands in SP10

**File:** `src/app/modules/blueprint/progress/page.tsx` (MODIFY)
- Replaces placeholder with `<ProgressDashboard />`

**File:** `src/app/modules/blueprint/progress/patterns/page.tsx` (MODIFY)
- Replaces placeholder with `<PatternMasteryGrid />`

**File:** `src/app/modules/blueprint/progress/problems/page.tsx` (MODIFY)
- Replaces placeholder with `<ProblemHistoryList />`

**File:** `src/app/modules/blueprint/progress/streak/page.tsx` (MODIFY)
- Replaces placeholder with `<StreakDetail />`

### 2.5 TanStack Query provider

**File:** `src/components/modules/blueprint/BlueprintQueryProvider.tsx` (if not already present in shell)
- Wrap the Blueprint subtree with a `QueryClientProvider` scoped per-session
- `BlueprintShell` (from SP1) modified to include it

### 2.6 One-line augmentation of the StatusBar

**File:** `src/components/modules/blueprint/shell/StatusBar.tsx` (MODIFY)
- Add a second slot: "Streak: `{streakDays}`d · Due: `{dueCount}`" (due count stays at 0 in SP2; wires up in SP6)
- Reads from `useProgressSummary`; gracefully handles unauthenticated (hides streak if no user)

## 3. Out of scope in SP2

- Unit interior rendering (SP3)
- Inline section widgets (SP3)
- Canvas embeds (SP3/SP4)
- Drill/review interiors (SP5/SP6)
- Pattern mastery ring animations (polish SP10)
- Prerequisite edge SVG rendering polish (can be simple lines in SP2, beautified SP10)
- Motion on card appearance (SP10)
- Mobile layouts (V1 desktop-only)
- First-visit analytics deep-dive (covered by existing `blueprintWelcomeShown`)

## 4. Design notes

**Curriculum map layout (V1):**

```
┌────────────────────────────────────────────────────┐
│ Foundations                                         │
│ ┌───────┐  ┌────────┐  ┌────────────┐              │
│ │ Unit1 │→ │ Unit 2 │→ │  Unit 3    │              │
│ └───────┘  └────────┘  └────────────┘              │
│                                                     │
│ Creational                                          │
│ ┌───────┐  ┌────────┐                              │
│ │ Unit4 │→ │ Unit 5 │                              │
│ └───────┘  └────────┘                              │
│                                                     │
│ Structural                                          │
│ ┌───────┐  ┌────────┐  ┌────────┐                  │
│ │ Unit6 │→ │ Unit 7 │→ │ Unit 8 │                  │
│ └───────┘  └────────┘  └────────┘                  │
│                                                     │
│ Behavioral                                          │
│ ┌───────┐  ┌────────┐  ┌────────┐                  │
│ │ Unit9 │→ │Unit 10 │→ │Unit 11 │                  │
│ └───────┘  └────────┘  └────────┘                  │
│                                                     │
│ Applied                                             │
│ ┌──────────┐                                        │
│ │ Unit 12  │                                        │
│ └──────────┘                                        │
└────────────────────────────────────────────────────┘
```

Tracks come from `tags[0]`. Within a track, units ordered by `ordinal`. Arrows between adjacent ordinal numbers. Prerequisite-across-tracks drawn as longer curves.

**Card visual state matrix:**

| State | Border | Background | Text | Icon |
|---|---|---|---|---|
| locked | slate-300 dashed | slate-50 | slate-500 | Lock |
| available | slate-200 | white | slate-900 | (none) |
| in_progress | indigo-400 | indigo-50 | slate-900 | Progress ring |
| completed | sage-500 | sage-50 | sage-900 | Checkmark (sage) |
| mastered | gold-500 | gold-50 | gold-900 | Star (gold) |

**Streak pill:**
- `0 days` → gray
- `1–6 days` → indigo
- `7+ days` → gold

**Resume card large enough to be the primary CTA:**
- Full-width card below welcome banner
- Min 160px tall
- Headline: "Continue: Unit 3 · Meet Builder"
- Subtitle: "Section 2 of 4 · 7 min left"
- Progress bar
- `Continue →` button right-aligned

## 5. Data flow

```
page load
  │
  ▼
JourneyHomePage
  ├─► useUnitList        → GET /api/blueprint/units        (cached 1h)
  ├─► useProgressSummary → GET /api/blueprint/progress/summary (cached 30s)
  ├─► useUnitProgressMap → GET /api/blueprint/progress/units   (cached 30s)
  └─► useResumeState     → derives from store + summary

Render cascade:
  WelcomeBanner         (reads journey-state from store)
  ResumeCard            (reads resumeState)
  StreakPill            (reads progressSummary.streakDays)
  CurriculumMap         (reads unitList × unitProgressMap)
```

Server writes (not new in SP2 but exercised):
- WelcomeBanner dismissal → PATCH `/api/blueprint/journey-state` (existing)
- Unit click → routes to unit page; no PATCH yet (unit state updates come from Unit Renderer SP3)

## 6. Verification

After SP2:
- Visit `/modules/blueprint` with zero progress → welcome banner + "Start unit 1" CTA + curriculum map with all units `available` (for first unit) or `locked` (for others, except the linearized visible ones — first in each track unlocked if predecessor track's last unit is complete)
- Dismiss welcome via "Start the course" → routes to `/unit/what-is-a-pattern`; welcome never shows again
- Visit `/modules/blueprint/progress` → three stat cards populate (zeros), streak 0, heat map empty
- Click `/progress/patterns` → mastery grid with all 36 patterns shown "introduced" state (no FSRS data yet)
- Click `/progress/problems` → empty state copy
- Streak pill: "0d · 0 due"
- All data fetches use TanStack Query (check devtools)
- All state-altering actions fire typed analytics events
- Type / lint / build / e2e all green

## 7. Design decisions (resolved at spec time)

- **TanStack Query scope:** Single `QueryClient` per Blueprint shell mount. Cache survives route changes within Blueprint.
- **Prerequisite gating:** **Soft gate** — we show all units, but `locked` state disables the click with a tooltip explaining prereqs. Matches §9.4 graduation states from vision.
- **Track grouping fallback:** Units without `tags[0]` fall into an "Other" track (shouldn't happen in V1 but defensive).
- **Mastery gold:** use `tailwindcss-3 yellow-500 + amber-400 ring` as a V1 approximation. SP10 polishes.
- **Progress ring size:** 24px in card, 48px in resume card.
- **Progress map query:** A single endpoint returns one row per unit the user has touched. Units without rows get `available`/`locked` from prereq check client-side — avoids N+1.
- **Empty-state copy:** "Start your first unit →" / "You haven't drilled anything yet." / "A streak starts with a single day." — hand-authored, not lorem.

---

*End of SP2 spec.*
