Now I have a complete picture of the entire architecture. Let me deliver the comprehensive blueprint.

---

# Mode Architecture Blueprint: 7 Modes x 13 Modules

## Patterns and Conventions Found

**Layout contract** (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/workspace-layout.tsx:21-28`): `WorkspaceLayout` accepts four named slots — `sidebar`, `canvas`, `properties`, `bottomPanel`. The layout is completely slot-driven. Changing what mode renders means changing what is passed into these slots, not restructuring the layout component itself.

**Module content protocol** (`/Users/anshullkgarg/Desktop/system_design/architex/src/app/page.tsx:23`): Modules communicate their slot content upward through an `onContent(c: ModuleContent)` callback. The `ModuleContent` shape from `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/module-content.ts` includes `sidebar | canvas | properties | bottomPanel | mockOverlay | confirmDialog | breadcrumb`.

**How modules currently handle internal sub-modes**: `useLLDModuleImpl.tsx` uses local `useState` to select among pattern/solid/problem/sequence/state-machine modes. This is per-module local state, not global. The `ContextualBottomTabs` component then reads that local state through props to switch tab configurations.

**Global UI store** (`/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ui-store.ts:30-118`): Persists to `localStorage` under `architex-ui`. Currently owns: `activeModule`, `recentModules`, `sidebarOpen`, `propertiesPanelOpen`, `bottomPanelOpen`, `bottomPanelTab`, `recentlyStudied`. There is NO mode field today.

**Module registration** (`/Users/anshullkgarg/Desktop/system_design/architex/src/app/page.tsx:95-112`): `MODULE_COMPONENTS` maps `ModuleType` string keys to dynamic wrapper components. All 13 modules are covered. Adding mode does not touch this map.

**Visit-based smart default** (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/ContextualBottomTabs.tsx:216-234`): Already uses `localStorage` `lld-visited-patterns` to default returning visitors to the Quiz tab instead of Explain. The smart mode routing system should follow this exact same pattern but elevated to a store.

**Progress data** (`/Users/anshullkgarg/Desktop/system_design/architex/src/stores/progress-store.ts`): `useProgressStore` tracks `ChallengeAttempt[]`, `totalXP`, `streakDays`. It does NOT track per-module-per-topic progress at granular enough resolution for smart mode routing. This store must be extended.

**Existing Learn Mode component** (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/interview/LearnMode.tsx`): A fully functional step-based walkthrough component already exists. It accepts a `Walkthrough` object and emits `onHighlightChange` for canvas node pulsing. This is the exact canvas-linked learning UI needed for Learn mode in every module.

**SRS system** (`/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/srs.ts`): Spaced repetition exists. The smart routing logic for "user has due SRS cards → prompt Review mode" can call into this library directly.

---

## Architecture Decision

**Mode state is per-module-instance, stored globally with module as namespace key.**

The rationale: modes must survive module switching (a user switches from LLD to System Design and back, the LLD mode should be remembered), so mode cannot live in local `useState` inside the module hook. But mode is meaningless without a module context (Learn mode in LLD is structurally different from Learn mode in Algorithms), so mode cannot be a single global scalar. The correct shape is `Record<ModuleType, AppMode>` persisted in `ui-store`, with the active module's mode derivable in one line.

This avoids creating a new store. It slots into the existing `useUIStore` with its existing persist configuration, costing one new field in localStorage.

**Mode switching is implemented as a "slot provider" pattern, not a router.**

Each module's wrapper hook (`useLLDModule`, `useSystemDesignModule`, etc.) already assembles `{ sidebar, canvas, properties, bottomPanel }` as JSX and passes it to `onContent`. Mode-aware slot selection is added inside that hook, before the `onContent` call. This is the minimal-invasive integration path. No new component wrapping WorkspaceLayout is needed.

**The `ModeSwitcher` UI component is injected into the existing `DesktopActivityBar` as a second column — not a new panel.**

The ActivityBar is 48px wide today. The correct placement is a horizontal strip above the StatusBar or a secondary vertical strip to the right of the module icons, sharing the sidebar rail. Given the `workspace-layout.tsx` structure, the cleanest slot is as a prop to `WorkspaceLayout` named `modeSwitcher` that renders between the ActivityBar and the sidebar panel group. Alternatively (and simpler), the ModeSwitcher renders inside the sidebar header of each module component — every module's `LLDSidebar`, `SystemDesignSidebar`, etc. already has a header row.

The decision: place `ModeSwitcher` as a fixed horizontal bar immediately below the breadcrumb bar (already exists at line 157 in `workspace-layout.tsx`), spanning full width. This makes mode globally visible without touching the ActivityBar or per-module sidebars.

---

## Component Design

### 1. Mode Store Extension

**File:** `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ui-store.ts`

Add to `UIState` interface:

```typescript
export type AppMode = 'learn' | 'simulate' | 'practice' | 'quiz' | 'assessment' | 'review' | 'ai';

// Per-module mode map — each module remembers the last mode the user was in
moduleModes: Partial<Record<ModuleType, AppMode>>;
setModuleMode: (module: ModuleType, mode: AppMode) => void;
getActiveMode: (module: ModuleType) => AppMode;
```

The initial value for `moduleModes` is `{}` (empty partial record). `getActiveMode` returns `moduleModes[module] ?? 'learn'` — defaulting to Learn mode on first visit, consistent with the existing `lld-visited-patterns` pattern.

Add to the `partialize` list so it persists: `moduleModes: state.moduleModes`.

The `setActiveModule` action (line 158-163 of ui-store.ts) should NOT reset the mode — modes persist across module navigation.

### 2. Mode Progress Tracker (new file)

**File:** `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/mode-progress-store.ts`

This store holds the data that drives smart mode routing. It is separate from `progress-store.ts` because the shape is fundamentally different — topic-level mode completion, not challenge-level attempt records.

```typescript
export interface TopicModeEntry {
  module: ModuleType;
  topicId: string;           // e.g. "observer", "consistent-hashing", "b-tree"
  learnCompletedAt: number | null;
  practiceAttempts: number;
  lastQuizScore: number | null;   // 0-100
  lastAssessmentScore: number | null;
  srsNextReview: number | null;   // epoch ms, from srs.ts
}

interface ModeProgressState {
  entries: TopicModeEntry[];
  markLearnComplete: (module: ModuleType, topicId: string) => void;
  recordQuizScore: (module: ModuleType, topicId: string, score: number) => void;
  recordAssessmentScore: (module: ModuleType, topicId: string, score: number) => void;
  incrementPracticeAttempts: (module: ModuleType, topicId: string) => void;
  scheduleSrsReview: (module: ModuleType, topicId: string, nextReviewMs: number) => void;
  getEntry: (module: ModuleType, topicId: string) => TopicModeEntry | null;
  getDueReviewCount: (module: ModuleType) => number;
}
```

Persisted to `localStorage` under `architex-mode-progress`. The entries array is kept sparse — only topics the user has actually interacted with appear.

### 3. Smart Mode Router (new file)

**File:** `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/mode/smart-mode-router.ts`

```typescript
export function getDefaultMode(
  module: ModuleType,
  topicId: string,
  progress: ModeProgressState,
  currentTime: number = Date.now()
): AppMode
```

Decision tree:
1. If `progress.getDueReviewCount(module) > 0` AND `topicId` has `srsNextReview <= currentTime` → return `'review'`
2. If `entry.lastQuizScore !== null && entry.lastQuizScore < 60` → return `'learn'` (failed quiz = re-learn)
3. If `entry.learnCompletedAt === null` → return `'learn'` (first visit)
4. If `entry.practiceAttempts === 0` → return `'practice'` (learned but never practiced)
5. If `entry.lastAssessmentScore === null` → return `'assessment'` (practiced but never assessed)
6. → return `'practice'` (returning expert user)

This function is pure (no side effects), making it trivially testable.

### 4. ModeSwitcher Component (new file)

**File:** `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/ModeSwitcher.tsx`

Responsibilities:
- Render the 7 mode tabs as a horizontal pill strip
- Read current mode from `useUIStore(s => s.getActiveMode(s.activeModule))`
- Call `useUIStore(s => s.setModuleMode)` on click
- Show a badge on "Review" when `getDueReviewCount > 0`
- Disable modes that are not available for the current module (e.g., Simulate mode is irrelevant for the Review mode module)
- Accept a `disabledModes: AppMode[]` prop from each module so modules can opt out of modes they don't support

Mode icons (from `lucide-react`): Learn → `BookOpen`, Simulate → `Play`, Practice → `PenTool`, Quiz → `HelpCircle`, Assessment → `ClipboardCheck`, Review → `RotateCcw`, AI → `Bot`.

The component is a `memo`-wrapped functional component following the existing button pattern from `activity-bar.tsx` — `role="listbox"`, `aria-selected`, keyboard navigation via `ArrowLeft`/`ArrowRight`.

The component renders as:
```
[Learn] [Simulate] [Practice] [Quiz] [Assessment] [Review ●3] [AI]
```

Position in layout: as a new optional prop `modeSwitcherBar?: ReactNode` on `WorkspaceLayout`. It renders between the breadcrumb strip (line 156-160) and the main panel group (line 163). Both desktop and mobile layouts add this slot, but mobile only shows it when `sidebarOpen` is true (the BottomSheet header).

### 5. Mode-Aware Slot Selection in useLLDModule

**File:** `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx`

The hook currently assembles `sidebar`, `canvas`, `properties`, `bottomPanel` at lines 872-1032 and returns them at line 1112.

Add at the top of the function body:

```typescript
const activeMode = useUIStore(s => s.getActiveMode('lld'));
```

Then create a `getModeSlots(mode: AppMode)` function that returns the appropriate ReactNode for each slot. The current JSX assembly becomes the `practice` mode branch (since the current UX is exactly "editable canvas + palette sidebar + checklist bottom panel").

The full mode-to-slot mapping for LLD:

**Learn:** `sidebar = <LLDSidebar mode="patterns" ... />` (collapsed pattern list), `canvas = <LLDCanvas ... highlightedNodeIds={learnHighlights} readOnly />`, `properties = <LessonColumn walkthrough={activeWalkthrough} onHighlightChange={setLearnHighlights} />`, `bottomPanel = null`

The `properties` panel slot in Learn mode becomes a right-side lesson column — a reuse of the existing `LearnMode` component from `/Users/anshullkgarg/Desktop/system_design/architex/src/components/interview/LearnMode.tsx`, with `walkthrough` prop driven by `getWalkthroughForChallenge(activeProblem?.id)` or a pattern-specific walkthrough.

**Simulate:** `sidebar = <SimParamsPanel />`, `canvas = <LLDCanvas + particle overlays />`, `properties = <MetricsPanel />`, `bottomPanel = <EventLog />`

The existing `PatternBehavioralSimulator` component (already lazy-loaded in `ContextualBottomTabs`) moves from the bottom panel into the canvas area for Simulate mode.

**Practice:** Current full implementation unchanged — this IS the existing default behavior. No code changes needed in the canvas/sidebar assembly for this mode.

**Quiz:** `sidebar = null` (UIStore `sidebarOpen = false`), `canvas = <LLDCanvas readOnly />`, `properties = <QuizCard />`, `bottomPanel = <QuizProgressBar />`

The existing `PatternQuizFiltered` component moves from ContextualBottomTabs into the properties slot.

**Assessment:** `sidebar = null`, `canvas = <LLDCanvas readOnly />`, `properties = <RubricPanel />`, `bottomPanel = <FeedbackPanel />`

The existing `AutoGrader` + `PracticeAssessment` components are reused here.

**Review:** `sidebar = null`, `canvas = null` (hidden), `properties = <FlashcardStack />`, `bottomPanel = <SRSStats />`

The existing `Flashcards` panel (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/Flashcards.tsx`) moves into the properties slot as full height.

**AI:** `sidebar = <AIContextSidebar />` (collapsed), `canvas = <LLDCanvas />` (shared editable), `properties = <ChatPanel />`, `bottomPanel = <ContextBar />`

The existing `AIReviewPanel` (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/canvas/AIReviewPanel.tsx`) expands into the properties slot.

### 6. Mode Transition Logic

Add a `switchMode` action to UIStore that runs the transition logic:

```typescript
switchMode: (module: ModuleType, to: AppMode) => void
```

Implementation:

```typescript
switchMode: (module, to) =>
  set((s) => {
    // Clear mode-specific ephemeral state via a side-effect
    // (each module hook listens for mode changes)
    return {
      moduleModes: { ...s.moduleModes, [module]: to },
      // Mode changes that require panel adjustments:
      sidebarOpen: to === 'quiz' || to === 'assessment' || to === 'review'
        ? false
        : s.sidebarOpen,
      propertiesPanelOpen: to === 'learn' || to === 'quiz' || to === 'assessment' || to === 'review' || to === 'ai'
        ? true
        : s.propertiesPanelOpen,
      bottomPanelOpen: to === 'simulate' || to === 'practice'
        ? true
        : to === 'learn' || to === 'review'
        ? false
        : s.bottomPanelOpen,
    };
  })
```

**State preservation rules:**
- Preserve across mode switches: `activePattern`, `activeDemo`, `activeProblem`, `activeSequence`, `activeStateMachine`, `classes`, `relationships`, `edgePoints`
- Reset on mode switch: `practiceState`, `seqPlayback`, `smSim` (these are mode-specific ephemeral states)
- To trigger reset, each module hook subscribes to mode changes via `useEffect([activeMode])` and clears only the ephemeral state

In `useLLDModuleImpl.tsx`, add:

```typescript
useEffect(() => {
  // When entering Practice mode, reset practice timer
  if (activeMode === 'practice') {
    setPracticeState(null);
  }
  // When entering Simulate mode, clear any SM simulation
  if (activeMode !== 'simulate') {
    setSmSim(null);
  }
  // When entering Learn mode, reset sequence playback
  if (activeMode !== 'simulate') {
    setSeqPlayback(null);
  }
}, [activeMode]);
```

**Animation:** The `PanelTransition` component at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/PanelTransition.tsx` already exists. Wrap the mode-specific slot content in `<PanelTransition key={activeMode}>` to trigger a fade/slide on mode change.

---

## Implementation Map

### Files to Modify

**`/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ui-store.ts`**
- Add `AppMode` type export (line 19 area, after `AnimationSpeed`)
- Add `moduleModes: Partial<Record<ModuleType, AppMode>>` to `UIState` interface
- Add `setModuleMode`, `switchMode`, `getActiveMode` to `UIState` interface
- Add initial values `moduleModes: {}` to the `create` body
- Add implementations of the three new actions
- Add `moduleModes` to the `partialize` list

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/workspace-layout.tsx`**
- Add optional `modeSwitcherBar?: ReactNode` to `WorkspaceLayoutProps` (line 22)
- In `DesktopWorkspaceLayout`, render `modeSwitcherBar` between the breadcrumb div (line 156-160) and the main `<div className="flex flex-1 overflow-hidden">` (line 163)
- In `MobileWorkspaceLayout`, render `modeSwitcherBar` as a sticky bar at the bottom of the BottomSheet when `sidebarOpen`

**`/Users/anshullkgarg/Desktop/system_design/architex/src/app/page.tsx`**
- Import `ModeSwitcher` from the new component
- Add `<ModeSwitcher />` as the `modeSwitcherBar` prop on `WorkspaceLayout` (line 335)

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx`**
- Add `activeMode` from `useUIStore`
- Add `learnHighlights` state `{ nodeIds: string[], edgeIds: string[] }`
- Add `useEffect([activeMode])` for ephemeral state reset
- Replace the JSX assembly section (lines 872-1112) with a `getModeSlots(activeMode)` call that returns `{ sidebar, canvas, properties, bottomPanel }`
- The existing JSX moves into the `practice` and `assess` mode branches
- Add `disabledModes` computation (e.g. `['simulate']` when no active pattern has simulation data) passed to `ModeSwitcher` via the `mockOverlay` slot or via a new `ModeSwitcherConfig` field on `ModuleContent`

**`/Users/anshullkgarg/Desktop/system_design/architex/src/stores/progress-store.ts`**
- Rename to preserve backward compat; add `getDueReviewCount(module)` derived getter calling into srs.ts

### Files to Create

**`/Users/anshullkgarg/Desktop/system_design/architex/src/stores/mode-progress-store.ts`**
- `TopicModeEntry` interface
- `ModeProgressState` interface with 7 action methods
- `useModeProgressStore` Zustand store with `persist` middleware
- Storage key: `architex-mode-progress`

**`/Users/anshullkgarg/Desktop/system_design/architex/src/lib/mode/smart-mode-router.ts`**
- `getDefaultMode(module, topicId, progress, currentTime)` pure function
- Exported for use in module hooks and in the `setActiveModule` action side-effect

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/ModeSwitcher.tsx`**
- `AppMode[]` definition with display metadata (label, icon, keyboard shortcut)
- `ModeSwitcherProps { disabledModes?: AppMode[] }`
- Desktop variant: horizontal pill bar with mode buttons
- Mobile variant: compact icon-only row
- Due review badge on the Review button
- Full keyboard navigation (`ArrowLeft`/`ArrowRight`, `Home`/`End`)
- Calls `useUIStore(s => s.switchMode)` on click

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/modes/LearnModeSlots.tsx`**
- Assembles the Learn mode slot content for LLD
- Returns `{ sidebar, canvas, properties, bottomPanel }`
- Canvas uses `LLDCanvas` in read-only mode with `highlightedNodeIds` prop
- Properties slot renders `LearnMode` walkthrough component from `@/components/interview/LearnMode`

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/modes/QuizModeSlots.tsx`**
- Assembles Quiz mode slots
- Properties slot hosts `PatternQuizFiltered` full-height

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/modes/ReviewModeSlots.tsx`**
- Assembles Review mode slots
- Properties slot hosts `Flashcards` full-height
- Canvas slot is `null` (the panel collapses via `propertiesPanelOpen` and `sidebarOpen` being forced to false)

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/modes/AIModeSlots.tsx`**
- Assembles AI mode slots
- Properties slot hosts expanded `AIReviewPanel`

**`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/modes/index.ts`**
- Barrel export for all mode slot assemblers

---

## Data Flow

```
User clicks "Quiz" in ModeSwitcher
  │
  ▼
useUIStore.switchMode('lld', 'quiz')
  │  ├─ sets moduleModes['lld'] = 'quiz'
  │  ├─ sets sidebarOpen = false
  │  ├─ sets propertiesPanelOpen = true
  │  └─ sets bottomPanelOpen = false (learn/review behavior)
  │
  ▼
useLLDModuleImpl re-renders (activeMode changed)
  │  ├─ useEffect([activeMode]) fires → clears practiceState, seqPlayback, smSim
  │  └─ getModeSlots('quiz') returns QuizModeSlots
  │       ├─ sidebar = null (force sidebarOpen=false via switchMode)
  │       ├─ canvas = <LLDCanvas readOnly pattern={activePattern} />
  │       ├─ properties = <PatternQuizFiltered pattern={activePattern} />
  │       └─ bottomPanel = <QuizProgressBar />
  │
  ▼
onContent({ sidebar, canvas, properties, bottomPanel }) called
  │
  ▼
AppShell.contentMapRef['lld'] updated → forceRender()
  │
  ▼
WorkspaceLayout receives new slot content
  │  ├─ propertiesPanelOpen = true (from switchMode)
  │  ├─ sidebarOpen = false (from switchMode)
  │  └─ Panel Group re-renders: canvas takes full center + properties column
  │
  ▼
QuizProgressBar updates via useModeProgressStore
  │
  ▼
On quiz completion: useModeProgressStore.recordQuizScore('lld', pattern.id, score)
  │  └─ If score < 60: getDefaultMode returns 'learn' next time user visits
```

---

## Build Sequence

**Phase 1: Store Layer (no UI changes, fully safe to merge)**

- [ ] Add `AppMode` type and `moduleModes` field to `UIState` in `ui-store.ts`
- [ ] Implement `setModuleMode`, `switchMode`, `getActiveMode` actions
- [ ] Add `moduleModes` to `partialize`
- [ ] Create `mode-progress-store.ts` with all 7 action methods and persist
- [ ] Create `smart-mode-router.ts` as a pure function with unit tests
- [ ] Export `AppMode` from `src/stores/index.ts`

**Phase 2: ModeSwitcher Component (visible UI, but mode changes have no effect yet)**

- [ ] Create `ModeSwitcher.tsx` with all 7 mode buttons, icons, keyboard nav
- [ ] Add `modeSwitcherBar` prop to `WorkspaceLayout` (both desktop and mobile)
- [ ] Wire `ModeSwitcher` into `AppShell` as the `modeSwitcherBar` prop
- [ ] Verify the bar renders correctly across all 13 modules (placeholder modules show all modes enabled since they ignore mode)
- [ ] Add review-due badge reading from `mode-progress-store`

**Phase 3: LLD Mode Slot Assemblers (mode changes now do something in one module)**

- [ ] Create `modes/LearnModeSlots.tsx` — wire `LearnMode` component into properties slot
- [ ] Create `modes/QuizModeSlots.tsx` — move `PatternQuizFiltered` from ContextualBottomTabs into properties slot
- [ ] Create `modes/ReviewModeSlots.tsx` — move `Flashcards` panel into properties slot
- [ ] Create `modes/AIModeSlots.tsx` — expand `AIReviewPanel` into properties slot
- [ ] Create `modes/index.ts` barrel
- [ ] Refactor `useLLDModuleImpl.tsx` JSX assembly to call `getModeSlots(activeMode)`
- [ ] Add `useEffect([activeMode])` for ephemeral state reset
- [ ] Add `disabledModes` computation and pass to ModeSwitcher (via new `ModuleContent` field or context)

**Phase 4: Assessment and Simulate Mode Slots for LLD**

- [ ] Create `modes/AssessmentModeSlots.tsx` using `AutoGrader` + `PracticeAssessment`
- [ ] Create `modes/SimulateModeSlots.tsx` using `PatternBehavioralSimulator` in canvas area
- [ ] Create `modes/PracticeModeSlots.tsx` (extract from current default assembly)
- [ ] Wire `switchMode` to auto-open bottom panel for simulate/practice modes

**Phase 5: Propagate to Remaining 12 Modules**

For each module, follow the same pattern as LLD Phase 3. The key insight is that each module's wrapper already has a hook that assembles slots. The change is mechanical:

For simpler modules (Networking, OS, Concurrency, Security):
- [ ] Learn mode = existing default canvas (read-only) + right column with walkthrough text
- [ ] Practice mode = existing default (add to canvas, edit freely)
- [ ] Quiz mode = hide canvas, full-height quiz card in properties slot
- [ ] Assessment, Review, AI = same pattern as LLD
- [ ] Simulate mode = only available for modules that have simulators (Distributed, Concurrency, System Design)

For System Design module:
- [ ] Simulate mode = existing simulation (already the "native" mode) → map `simulate` to the existing SimulationCanvas + MetricsPanel
- [ ] Practice mode = existing editable canvas with timer bar

**Phase 6: Smart Mode Routing Integration**

- [ ] Call `getDefaultMode` inside `setActiveModule` in UIStore when switching modules and no explicit mode is set
- [ ] Call `getDefaultMode` inside each module's `handleSelectPattern`/`handleSelectTopic` when a topic is selected and mode has not been explicitly set for that topic
- [ ] Wire `markLearnComplete` into `LearnMode.onComplete` callback
- [ ] Wire `recordQuizScore` into quiz completion callbacks
- [ ] Wire `scheduleSrsReview` into `AutoGrader` result to schedule next SRS review

---

## Critical Details

**Error handling:** Each mode slot assembler should be wrapped in the existing `ErrorBoundary` component already used in `useLLDModuleImpl.tsx` at line 907. The fallback UI already exists.

**State management for `disabledModes`:** The cleanest channel for passing per-module mode availability back to the global `ModeSwitcher` is to extend the `ModuleContent` interface with an optional `availableModes?: AppMode[]` field. The `ModeSwitcher` component reads `useUIStore(s => s.activeModule)` and then reads the content from a new `useModuleModesStore` or simply uses the `contentMapRef` in `AppShell` to look up `availableModes`. Since `AppShell` already has `contentMapRef` and `forceRender`, passing `availableModes` through `ModuleContent` is the zero-new-coupling path.

**Performance:** `getModeSlots(activeMode)` must be memoized. In `useLLDModuleImpl`, wrap with `useMemo([activeMode, activePattern, activeDemo, activeProblem, ...other deps])`. This is critical — the current hook already has expensive JSX that renders 300+ lines of component tree. Without memoization, every mode-unrelated state change would re-run the entire slot assembly.

**Mobile:** `switchMode` already sets `sidebarOpen = false` for Quiz/Assessment/Review modes, which on mobile collapses the BottomSheet. The `ModeSwitcher` renders inside the BottomSheet header for mobile, so it remains accessible. The compact icon-only mobile variant of `ModeSwitcher` should be 44px height minimum per the existing mobile tap target convention in `activity-bar.tsx`.

**Testing:** `smart-mode-router.ts` is a pure function → straightforward unit tests with 7 test cases for each branch of the decision tree. `ModeSwitcher.tsx` follows the same accessibility pattern as `ActivityBar` → same test pattern. Mode integration tests: for each of the 7 modes in LLD, verify the correct components appear in the correct slot slots using React Testing Library.

**SRS integration:** The `srs.ts` library at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/srs.ts` already exists. The `mode-progress-store.ts` stores `srsNextReview` as a timestamp. When `ReviewModeSlots` renders, it calls `getDueItems(module)` from the SRS library to determine which flashcards to show, ordered by urgency.

**URL persistence for mode:** Follow the existing `?lld=pattern:observer` URL pattern. Extend to `?lld=pattern:observer&mode=quiz`. The existing URL write effect in `useLLDModuleImpl.tsx` at line 244-255 should be extended to include the current mode in the URL parameter.

**The `ContextualBottomTabs` component** (`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/ContextualBottomTabs.tsx`) remains intact for Practice mode (the default mode). In Quiz mode and other dedicated modes, the bottom panel is replaced with a simpler mode-specific component rather than the full tab system. This means `ContextualBottomTabs` is used as-is for the `practice` mode branch and becomes unused in all other modes — it does not need to be modified.