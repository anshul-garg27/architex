# 07 — Client State, Hooks, Libs, Providers, Contexts

Module scope: every Zustand store, every custom React hook, the React provider tree from `app/layout.tsx` outward, every React context, the `lib/` utilities consumed from the client, the canonical TypeScript types, and the persistence + worker plumbing those stores rely on.

> Companion ADR: `docs/adr/ADR-001-zustand-over-redux.md`. The architecture-blueprint comments live in `src/stores/STATE_ARCHITECTURE.ts` (1806 lines) — that file is reference-only, no runtime exports beyond an `export {}`.

---

## 1. Purpose — Client-State Philosophy

Architex runs as a **browser-only single-page React app** wrapped in Next.js App Router. State is fragmented across many small Zustand stores, with React Query layered on top for server-derived content. The five guiding rules:

| # | Rule | Where it shows |
|---|---|---|
| 1 | **No global Provider for state.** Stores are vanilla singletons importable anywhere. | `src/stores/index.ts:1-11` (just re-exports — no `<StoreProvider>`) |
| 2 | **Server data lives in TanStack Query, not Zustand.** | `src/providers/QueryProvider.tsx`, `src/hooks/use-content.ts`, `src/hooks/useLLDDesigns.ts` |
| 3 | **Persisted slices are explicit via `partialize`.** Ephemeral runtime state is never persisted. | `src/stores/ui-store.ts:202-219`, `src/stores/canvas-store.ts:359-366` |
| 4 | **Cross-store reads use `useXxxStore.getState()`** (imperative), not subscriptions. | `src/stores/snapshot-store.ts:31`, `src/hooks/use-keyboard-shortcuts.ts:38-44` |
| 5 | **Custom snapshot-based undo, not zundo.** zundo is a `package.json` dependency, but the live implementation is `src/lib/undo/undo-manager.ts`. | `src/lib/undo/undo-manager.ts:22-155`, `src/stores/canvas-store.ts:62-64` |

The architecture document (`src/stores/STATE_ARCHITECTURE.ts`) describes a planned **Command Bus + UndoManager + Adapter** triumvirate. The Command Bus and UndoManager have shipped; the Adapter is partially shipped (`src/lib/adapters/react-flow-adapter.ts`). zundo's `temporal()` wrapper was removed in favour of the in-house manager.

---

## 2. Stores Inventory

All stores live in `src/stores/*.ts`. Index file: `src/stores/index.ts:1-28`.

### 2.1 Per-store summary

| Store | File | Slice / shape (top-level keys) | Persistence | Undo? | Mutators |
|---|---|---|---|---|---|
| `useUIStore` | `src/stores/ui-store.ts:128` | `activeModule`, `recentModules`, `sidebarOpen`, `propertiesPanelOpen`, `bottomPanelOpen`, `bottomPanelTab`, `theme`, `commandPaletteOpen`, `*DialogOpen`, `lldMode`, `recentlyStudied`, `animationSpeed`, `onboardingActive` | `persist` → `localStorage:"architex-ui"`, `partialize` whitelists 13 keys (`ui-store.ts:202-219`) | No | 30+ setters/togglers |
| `useCanvasStore` | `src/stores/canvas-store.ts:144` | `nodes: Node[]`, `edges: Edge[]`, `selectedNodeIds`, `selectedEdgeIds`, `groups`, `namedSnapshots`, `annotations`, `activeDesignId` | `persist` → `localStorage:"architex-canvas"`, partial = `{nodes, edges, groups}` (`canvas-store.ts:359-366`) | Yes — singleton `canvasUndoManager` from `@/lib/undo` (`canvas-store.ts:62`) | `setNodes`, `setEdges`, `addNode`, `addEdge`, `removeNodes`, `removeEdges`, `updateNodeData`, `addAnnotation`, `pushNamedSnapshot`, etc. |
| `useSimulationStore` | `src/stores/simulation-store.ts:116` | `status`, `currentTick`, `totalTicks`, `playbackSpeed`, `trafficConfig`, `metrics`, `metricsHistory`, `activeChaosEvents`, `consoleMessages`, `orchestratorRef`, `heatmapEnabled`, `heatmapMetric`, `traceActive`, `traceType` | None (ephemeral) | No | `play`, `pause`, `stop`, `reset`, `stepForward/Backward`, `setTrafficConfig`, `updateMetrics`, `addChaosEvent`, etc. |
| `useViewportStore` | `src/stores/viewport-store.ts:13` | `x`, `y`, `zoom` | None | No | `setViewport`, `setZoom`, `resetViewport` |
| `useEditorStore` | `src/stores/editor-store.ts:26` | `code`, `language`, `readOnly`, `activeLine`, `highlightedLines` | None | No | `setCode`, `setLanguage`, `setReadOnly`, `setActiveLine`, `setHighlightedLines`, `clearEditor` |
| `useInterviewStore` | `src/stores/interview-store.ts:179` | `activeChallenge`, `challengeStatus`, `timerStartedAt`, `timerDurationMs`, `timerPaused`, `hintsUsed`, `revealedHints`, `aiHintText`, `evaluation`, `activeDrill: ActiveDrill \| null` | **IndexedDB** (DB `architex-interview`, store `session`, key `current`) — manual; not via `persist` middleware. Hydrates only sessions <4h old (`interview-store.ts:332-352`). Auto-persists via `subscribeWithSelector` + microtask debounce (`interview-store.ts:355-375`). | No | `startChallenge`, `submitChallenge`, `setEvaluation`, `useHint`, `revealHint`, `setAiHint`, `toggleTimer`, `resetInterview`, `startDrill`, `pauseDrill`, `resumeDrill`, `submitDrill`, `abandonDrill` |
| `useDrillStore` | `src/stores/drill-store.ts:75` | `attemptId`, `variant`, `persona`, `currentStage`, `stageStartedAt`, `stageProgress`, `stageDurationsMs`, `interviewerTurns`, `hintLog`, `hintPenaltyTotal`, `rubricBreakdown`, `finalScore` | None (server is source of truth — see `useLLDDrillSync`) | No | `reset`, `beginAttempt`, `enterStage`, `mergeStageProgress`, `appendInterviewerTurn`, `recordHintPenalty`, `setRubric` |
| `useProgressStore` | `src/stores/progress-store.ts:37` | `attempts: ChallengeAttempt[]`, `totalXP`, `streakDays`, `lastActiveDate` | `persist` → `localStorage:"architex-progress"` (full state, no `partialize`) | No | `addAttempt`, `addXP`, `updateStreak`; selectors: `getAttemptsByChallenge`, `getBestScore`, `getCompletedCount`, `getAverageScore` |
| `useNotificationStore` | `src/stores/notification-store.ts:49` | `notifications: AppNotification[]` (max 100) | `persist` → `localStorage:"architex-notifications"`, `partialize` strips non-serialisable `action.onClick` callbacks (`notification-store.ts:96-101`) | No | `addNotification`, `markRead`, `markAllRead`, `dismiss`, `clearAll`, `unreadCount` |
| `useCollaborationStore` | `src/stores/collaboration-store.ts:28` | `collaborators: CollaboratorInfo[]`, `isConnected`, `roomId` | None | No | `setCollaborators`, `addCollaborator`, `removeCollaborator`, `updateCursor`, `updateSelection`, `updateStatus`, `setConnected`, `setRoomId`, `reset` |
| `useBillingStore` | `src/stores/billing-store.ts:66` | `currentPlan: PlanId`, `subscription: Subscription`, `usage: UsageSnapshot` | `persist` → `localStorage:"architex:billing-store"` — only `{currentPlan, subscription}` persisted, usage rebuilt from `getAllUsage()` (`billing-store.ts:115`) | No | `setPlan`, `checkFeatureAccess`, `trackUsage`, `refreshUsage`, `resetUsage` + module-level selectors `selectPlanLimits`, `selectPlanName`, `selectIsFeatureAvailable`, `selectUsagePercent` (`billing-store.ts:125-149`) |
| `useCrossModuleStore` | `src/stores/cross-module-store.ts:65` | `pendingBridge: BridgePayload \| null`, `activeContext`, `moduleMastery: Record<module, ModuleMasteryEntry>`, `conceptProgress: Record<id, ConceptProgressEntry>` | `persist` → `localStorage:"architex-cross-module"`, only `{moduleMastery, conceptProgress}` (`cross-module-store.ts:140-144`) | No | `setBridge`, `clearBridge`, `updateModuleMastery`, `markConceptComplete`, `getMasteryForRadar` |
| `useAIStore` | `src/stores/ai-store.ts:80` | `apiKey` (obfuscated base64 reverse), `isConfigured`, `perFeatureState`, `totalCost`, `budgetLimit`, `connectionStatus` | `persist` → `localStorage:"architex-ai-settings"`. Custom `onRehydrateStorage` re-injects key into `ClaudeClient` singleton (`ai-store.ts:200-208`) | No | `setApiKey`, `clearApiKey`, `setBudgetLimit`, `toggleFeature`, `recordUsage`, `isBudgetExceeded`, `isFeatureEnabled`, `testConnection`, `clearCache`, `resetCosts`, `setConnectionStatus` |
| `useSnapshotStore` | `src/stores/snapshot-store.ts:24` | `snapshots: ArchitectureSnapshot[]`, `activeSnapshotId` | `persist` → `localStorage:"architex-snapshots"` (`snapshot-store.ts:69-74`) | No (named-snapshot semantics) | `addSnapshot` (reads `useCanvasStore.getState()`), `removeSnapshot`, `restoreSnapshot` (writes `canvas.setNodes/setEdges`), `reorderSnapshots` |

### 2.2 Middleware patterns audited

The codebase uses two Zustand middlewares from the `zustand/middleware` package and one from `zustand/shallow`:

| Middleware | Usage sites |
|---|---|
| `persist` | `ai-store.ts:81`, `billing-store.ts:67`, `canvas-store.ts:145`, `cross-module-store.ts:66`, `notification-store.ts:50`, `progress-store.ts:38`, `snapshot-store.ts:25`, `ui-store.ts:129` |
| `subscribeWithSelector` | `interview-store.ts:179` only (used to drive IndexedDB persistence subscriber) |
| `shallow` (helper, not middleware) | `interview-store.ts:374` — `equalityFn` for the persistence subscriber |
| `devtools` | **Not used.** ADR-001 acknowledges this trade-off. |

There is no `temporal()` import anywhere in the live tree (`stores/STATE_ARCHITECTURE.ts:1611,1685` mentions it only as removal notes). zundo remains in `package.json:79` but is unreferenced from runtime code.

### 2.3 Consumers per store (high level)

| Store | Primary readers |
|---|---|
| `useUIStore` | Workspace shell (`app/page.tsx`), every keyboard-shortcut hook, `useDocumentTitle`, `useAnimationSpeed`, `useLLDModeSync`, `useLLDPreferencesSync`, theme-provider sync (`components/providers/theme-provider.tsx:14`) |
| `useCanvasStore` | `DesignCanvas` and React Flow integrations, `useSaveStatus`, `useAutoLayout`, `useChallengeAutosave`, `useKeyboardNodeOps`, `useBuildKeyboardShortcuts`, `useAISuggestions`, `useLLDDesignSync`, `snapshot-store` (cross-store) |
| `useSimulationStore` | Simulation panel, `usePerformanceMonitor`, `use-keyboard-shortcuts` (Space → play/pause), `use-notification-triggers` |
| `useViewportStore` | `LODProvider` (`contexts/LODContext.tsx:71`), `usePinchZoom`, `useTwoFingerPan`, `useViewportCulling` |
| `useEditorStore` | Code panels in algorithm + LLD modules (read-only mostly) |
| `useInterviewStore` | Interview module, `useDrillTimingHeatmap`, `useLLDDrillSync` (server heartbeat) |
| `useDrillStore` | LLD drill flow, `useDrillStage`, `useDrillInterviewer`, `useDrillHintLadder`, `useDrillTimingHeatmap` |
| `useProgressStore` | XP HUD, dashboard tiles, `progress-sync-subscriber` (server sync) |
| `useNotificationStore` | Notification bell, `useNotifications` hook, `use-notification-triggers` |
| `useAIStore` | AI settings panel, `useAISuggestions`, hint ladder |
| `useBillingStore` | Plan UI, paywall checks |
| `useCrossModuleStore` | Bridge consumer/panel, mastery radar |
| `useCollaborationStore` | Presence overlay |
| `useSnapshotStore` | Version history panel |

---

## 3. Provider Tree

The Next.js root layout instantiates the provider stack. Top-down, from `src/app/layout.tsx:64-98`:

```
<html>
  <body>
    <Wrapper>                                     ← src/app/layout.tsx:69 — Clerk gated by NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      <ThemeProvider>                             ← src/components/providers/theme-provider.tsx:23 — wraps next-themes; ThemeSynchronizer one-way syncs ui-store.theme → next-themes
        <MotionProvider>                          ← src/components/providers/MotionProvider.tsx:25
          <ReducedMotionProvider>                 ← src/providers/ReducedMotionProvider.tsx:36 — OS media query + localStorage:"architex-a11y-reduce-animations"
            <MotionConfigBridge>                  ← src/components/providers/MotionProvider.tsx:15 — feeds motion/react MotionConfig
              <AnalyticsProvider>                 ← src/components/providers/AnalyticsProvider.tsx:70 — initialises PostHog (real or noop) on mount
                <QueryProvider>                   ← src/providers/QueryProvider.tsx:15
                  <QueryClientProvider client>    ← @tanstack/react-query, staleTime 5min, gcTime 30min, networkMode offlineFirst, retry 2, refetchOnWindowFocus off
                    {children}                    ← page tree mounts here
                    <InstallPrompt />             ← PWA
                    <UpdateToast />               ← PWA
                    <ToastContainer />            ← global toasts
                    {dev && <ReactQueryDevtools />}
                  </QueryClientProvider>
                </QueryProvider>
              </AnalyticsProvider>
            </MotionConfigBridge>
          </ReducedMotionProvider>
        </MotionProvider>
      </ThemeProvider>
    </Wrapper>
  </body>
</html>
```

### 3.1 Provider call-outs

| Provider | File | Purpose | Side effects |
|---|---|---|---|
| `ClerkProvider` (conditional) | required from `@clerk/nextjs` only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; otherwise replaced with passthrough wrapper | Auth | `src/app/layout.tsx:16-24` uses `require()` so the import is skipped when env is empty |
| `ThemeProvider` | `src/components/providers/theme-provider.tsx:23-34` | next-themes wrapper, attribute=`class`, defaultTheme `dark`, system enabled, transitions disabled | Inside, `ThemeSynchronizer` (`:12-21`) reads `ui-store.theme` and pushes into `useTheme()` |
| `MotionProvider` | `src/components/providers/MotionProvider.tsx:25-31` | Wraps `ReducedMotionProvider` and `MotionConfigBridge` | None directly; bridge passes `prefersReduced ? "always" : "never"` to motion's `MotionConfig` |
| `ReducedMotionProvider` | `src/providers/ReducedMotionProvider.tsx:36-95` | Combines OS `prefers-reduced-motion` (`matchMedia`) with toolbar override | Persists toolbar override to `localStorage:"architex-a11y-reduce-animations"` |
| `AnalyticsProvider` | `src/components/providers/AnalyticsProvider.tsx:70-115` | Initialises PostHog (real if `NEXT_PUBLIC_POSTHOG_KEY` else noop fallback) | One-shot `useEffect` guarded by `useRef` |
| `QueryProvider` | `src/providers/QueryProvider.tsx:15-48` | Memoises a `QueryClient` per render via `useState` factory | Calls `initProgressSync()` (subscribes to `useProgressStore`) and `migrateLocalStorageToDb()` once on mount (`:35-38`) |

### 3.2 Side-effect modules pulled in at layout import time

`src/app/layout.tsx:1` imports `@/lib/fix-stuck-module` for its side effect: rewrites a corrupted `localStorage["ui-store"]` activeModule (`data-structures` → `system-design`) before React mounts (`src/lib/fix-stuck-module.ts:4-17`).

---

## 4. Hooks Inventory

All hooks live in `src/hooks/`. Total: 51 hook files plus a `__tests__` folder. Naming convention is mixed (kebab-case `use-*.ts` and camelCase `useXxx.ts` — both exported as default-style camelCase functions).

### 4.1 Server-data hooks (TanStack Query)

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useCatalog` / `useContentDetail` | `use-content.ts:?` | List + detail content rows, `staleTime: Infinity` | Module-data wrappers |
| `useTemplates` | `use-templates.ts` | `{ templates, blueprints }` — switches API↔static via `NEXT_PUBLIC_SYSDESIGN_USE_API` | System design module |
| `useDSData` | `use-ds-data.ts` | DS catalog (gated by `NEXT_PUBLIC_DS_USE_API`) | DS module |
| `useAlgorithmData` | `use-algorithm-data.ts` | Algorithm config catalog (gated by `NEXT_PUBLIC_ALGORITHMS_USE_API`) | Algorithm module |
| `useModuleData` | `use-module-data.ts` | Generic catalog for module + content type | Database, Networking, Security modules |
| `useQuiz` | `use-quiz.ts` | Quiz questions for `(module, type)` | Quiz UI |
| `useSearch` | `use-search.ts` | Debounced cross-module search via `useDeferredValue` | Command palette |
| `useDueReviews` / `useReviewSession` | `use-due-reviews.ts` | FSRS-backed spaced-repetition queue + rating mutation | Review flow |
| `useProgressSync` | `use-progress-sync.ts` | localStorage-first + debounced API mutation | Progress dashboards |
| `useLLDDesigns` | `useLLDDesigns.ts` | CRUD on `/api/lld/designs` (list/create/update/archive) | LLD Build mode |
| `useLLDTemplatesLibrary` | `useLLDTemplatesLibrary.ts` | Filtered server-side templates listing | LLD templates panel |
| `useLessonPayload` | `useLessonPayload.ts` | Compiled `LessonPayload` per pattern slug, in-memory module cache | LLD Learn mode |
| `useAISuggestions` | `useAISuggestions.ts` | Mutation: POST canvas → suggestions | LLD AI assistant |

### 4.2 Server-sync side-effect hooks (mutations driven by Zustand changes)

| Hook | File | Trigger | Effect |
|---|---|---|---|
| `useLLDPreferencesSync` | `useLLDPreferencesSync.ts:1-?` | `ui-store.lldMode` / `lldWelcomeBannerDismissed` changes | `PATCH /api/user-preferences/lld` |
| `useLLDDesignSync` | `useLLDDesignSync.ts:1-?` | Canvas mutations + `designId` | `POST /api/lld/designs/{id}/snapshots` |
| `useLLDDrillSync` | `useLLDDrillSync.ts:1-?` | `interview-store.activeDrill` running | 10s heartbeat → `PATCH /api/lld/drill-attempts/{id}` |
| `useLLDModeSync` | `useLLDModeSync.ts:1-?` | URL search-param `?mode=` ↔ `ui-store.lldMode` | Two-way sync |
| `useChallengeAutosave` | `use-challenge-autosave.ts:1-?` | Canvas changes | localStorage autosave keyed per-challenge |

### 4.3 Store / canvas / interaction hooks

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useUndoRedo` | `useUndoRedo.ts:10-51` | `{undo, redo, canUndo, canRedo, undoStackSize, redoStackSize}` via `useSyncExternalStore` over `UndoManager` | Toolbar undo/redo buttons |
| `useCommandBus` | `useCommandBus.ts:19-32` | `{dispatch, history}` — wraps `commandBus` singleton | Command palette, template loader |
| `useKeyboardShortcuts` (`use-keyboard-shortcuts`) | `use-keyboard-shortcuts.ts:21-192` | `void` — installs window keydown listener | Mounted at workspace level |
| `useBuildKeyboardShortcuts` | `useBuildKeyboardShortcuts.ts` | `void` — Build-mode-specific shortcuts | LLD Build mode |
| `useKeyboardNodeOps` | `useKeyboardNodeOps.ts` | `void` — arrow-key node nudge / Enter to edit | Canvas |
| `useAutoLayout` | `useAutoLayout.ts:14-?` | Function: `(presetId) => void`, applies layout preset to canvas | LLD Auto-layout button |
| `useUiStore`/`useCanvasStore` etc. | (re-exported from `src/stores/index.ts`) | Zustand hooks proper | Components |
| `useViewportCulling` | `useViewportCulling.ts:?` | `Set<nodeId>` of visible nodes via spatial-grid culling | Large-canvas optimisation |
| `useNodeHover` | `useNodeHover.ts:?` | Hover info + RF mouse handlers + style getter | Canvas |
| `useCanvasChart` | `use-canvas-chart.ts:?` | Lifecycle wrapper for Canvas 2D charts (DPR scaling, RAF, 10Hz throttle) | Metrics charts |
| `usePinchZoom` | `usePinchZoom.ts:?` | Touch-pinch handlers, momentum, clamp 0.1–4 | Mobile canvas |
| `useTwoFingerPan` | `useTwoFingerPan.ts:?` | Touch-pan handlers, momentum | Mobile canvas |
| `useFocusTrap` | `useFocusTrap.ts:29-106` | `{containerRef, handleKeyDown}` | Modals/dialogs |
| `useSafeAreaInsets` | `useSafeAreaInsets.ts:?` | `{top, bottom, left, right}` from `env(safe-area-inset-*)` | iOS PWA layout |
| `useMediaQuery` / `useIsMobile` / `useIsTablet` / `useIsDesktop` | `use-media-query.ts:28-54` | `boolean` via `useSyncExternalStore` | Responsive components |

### 4.4 Drill / interview hooks

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useDrillStage` | `useDrillStage.ts:?` | `{currentStage, nextStage, previousStage, isTerminal, gate, advance, retreat}` | LLD Drill stage navigator |
| `useDrillInterviewer` | `useDrillInterviewer.ts:?` | `{pending, isStreaming, error, sendMessage}` SSE-backed chat | Drill interviewer panel |
| `useDrillHintLadder` | `useDrillHintLadder.ts:?` | Tier-priced hint reveal logic | Drill hints |
| `useDrillTimingHeatmap` | `useDrillTimingHeatmap.ts:8-?` | `TimingHeatmap \| null` — derived from `useDrillStore.stageDurationsMs` + drill budget | Drill review |

### 4.5 Lesson / learn hooks

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useLessonScrollSync` | `useLessonScrollSync.ts:?` | `{activeSectionId, sectionDepths, completedSectionIds}` via IntersectionObserver | LLD Learn lesson view |
| `useSelectionExplain` | `useSelectionExplain.ts:?` | `{selection, anchorRect, explanation, isAI, isLoading, requestExplanation, clear}` | Learn-mode "explain" popover |
| `useLearnProgress` | `useLearnProgress.ts:?` | Debounced read+PATCH against `/api/lld/learn-progress` | Learn-mode scroll-restore + progress |
| `useBookmarks` | `useBookmarks.ts:?` | CRUD bookmarks with optimistic updates | Learn-mode bookmark strip |

### 4.6 Sound / animation / metadata hooks

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useSound` | `useSound.ts:47-71` | `{play, enabled, setEnabled, volume, setVolume}` over a global `soundEngine` singleton via `useSyncExternalStore` | Sound toggle |
| `useAlgorithmSound` | `useAlgorithmSound.ts:?` | `{playStepSound}` — throttled to 30ms | Algorithm visualiser |
| `useAnimationSpeed` | `useAnimationSpeed.ts:?` | `{speed, multiplier}` from `ui-store.animationSpeed` | Anywhere reading durations |
| `useDocumentTitle` | `useDocumentTitle.ts:28-35` | `void` — sets `document.title = "{ModuleLabel} - Architex"` | Workspace shell |
| `usePerformanceMonitor` | `usePerformanceMonitor.ts:?` | FPS / tick / render-count metrics | Dev overlays |

### 4.7 UX / nudge / persistence-light hooks

| Hook | File | Returns | Used by |
|---|---|---|---|
| `useFirstEncounter` | `useFirstEncounter.ts:?` | `{show, dismiss}` keyed by `featureId` against `localStorage:"architex-first-encounter-{id}"` | Feature tooltips |
| `useInactivityPrompt` | `useInactivityPrompt.ts:?` | `{visible, dismiss}` keyed per modeId per session via `sessionStorage:"architex-inactivity-shown-{mode}"` | Empty-canvas nudge |
| `useNotifications` | `useNotifications.ts:?` | `{notifications, unreadCount, notify, ...}` — convenience wrapper around `useNotificationStore` | Notification triggers |
| `useNotificationTriggers` (`use-notification-triggers`) | `use-notification-triggers.ts:?` | `void` — derives notifications from store transitions | Workspace shell |
| `useRecentCommands` | `useRecentCommands.ts:?` | `{commands, push}` over `localStorage:"architex-recent-commands"` (max 10) via `useSyncExternalStore` pattern | Command palette |
| `useQuizPersistence` | `use-quiz-persistence.ts:21-79` | `{bestScore, saveScore, hasPreviousScore}` — dual-write localStorage + `/api/progress` | Quiz UI |
| `useSaveStatus` | `useSaveStatus.ts:?` | `{status: SaveStatus, lastSavedAt, forceSave}` driven by `createAutoSave` over canvas state | Workspace status bar |

---

## 5. Lib Utilities

`src/lib/` holds 60+ subdirectories. The slice relevant to client-state plumbing falls into nine categories.

### 5.1 Persistence (`src/lib/persistence/`)

| File | Exports |
|---|---|
| `idb-store.ts` | `openDB`, `put`, `get`, `del`, `getAll`, `getDefaultDB`; constants `ARCHITEX_DB_NAME = "architex-db"`, `ARCHITEX_DB_VERSION = 1`, `ARCHITEX_SCHEMA = {projects: "projectId", settings: "settingName"}`. **No Dexie** — hand-written `IDBRequest`/`IDBTransaction` Promise wrappers (`idb-store.ts:20-33`). |
| `auto-save.ts` | `createAutoSave({debounceMs, onSave, onStatusChange, getData})` returns `{markDirty, forceSave, getStatus, isDirty, dispose}` (`auto-save.ts:32-94`). Status state machine: `idle` → `saving` → `saved` / `error`. |
| `hydration.ts` | `hydrateStores`, default-merging shapes for UI/Canvas/Progress/Settings (`hydration.ts:7-50`) |
| `migration.ts` | `migrate(project)` walks a registered chain `v1→v2→v3`. `registerMigration(version, fn)`. `LATEST_VERSION` constant. `MigrationFn` type. Pure-function transforms, no in-place mutation (`migration.ts:7-60`) |
| `fallback-save.ts` | beforeunload-driven last-resort writer to `localStorage:"architex-fallback-save"` with **lz-string compression above 8 KB** (`fallback-save.ts:10-103`). Exports `installBeforeUnloadSave`, `checkForRecoveryData`, `clearRecoveryData`, `FALLBACK_LS_KEY`. |
| `index.ts` | Barrel — see `persistence/index.ts:1-51` for the full surface. |

### 5.2 Undo (`src/lib/undo/`)

| File | Exports | Notes |
|---|---|---|
| `undo-manager.ts:22-155` | `UndoManager<T>` class with `pushSnapshot`, `undo`, `redo`, `clear`, `getCurrent`, `subscribe`, `getStackState`. Dual cap: `maxEntries: 50` default, `maxBytes: 10 MB` default. Eviction in `evict()` (`:136-148`). | `estimateBytes` uses `JSON.stringify().length * 2` (UTF-16 worst case, `:14-20`). |
| `transactions.ts:6-61` | `TransactionManager<T>` — `beginTransaction` / `commitTransaction(finalSnapshot)` / `rollbackTransaction()`. Throws on nested transactions. | Used to coalesce drag operations. |
| `debounce.ts:10-59` | `createDebouncedSnapshot(undoManager, delayMs=500)` and `createDragSnapshot` returning `{onDragStart, onDragEnd}` | Drag end pushes both pre and post snapshots. |
| `index.ts` | Barrel: re-exports the above plus `UndoManagerOptions`, `UndoRedoState`, `DragSnapshotHandle` |

### 5.3 Workers (`src/lib/workers/`)

| File | Role |
|---|---|
| `worker-bridge.ts:60-192` | Generic Promise-based bridge with `{timeout, idleTimeout, fallback}`. Auto-terminates after `idleTimeout = 60 000 ms`. Falls back to **synchronous main-thread handler** when `Worker` is undefined (SSR/test). |
| `types.ts:14-122` | Shared envelope `WorkerMessage<T>{type, payload, id}`, `WorkerResponse<T>{type, payload, id, error?}`. Per-domain payloads: `SimulateTickPayload`, `ComputeAlgoPayload`, `ComputeLayoutPayload`. Union types `AnyWorkerMessage` / `AnyWorkerResponse`. Constants `SIMULATE_TICK`, `COMPUTE_ALGO_STEP`, `COMPUTE_LAYOUT`. |
| `simulation-worker.ts:48` | Off-thread per-tick queueing-model evaluation. |
| `algorithm-worker.ts:38-?` | Sorting registry → step generation off-thread. |
| `layout-worker.ts` | Dagre / spatial layouts off-thread. |
| `minimap-worker.ts:24-?` | OffscreenCanvas minimap renderer; transfers `ImageBitmap` back. |

**No `comlink` import anywhere.** The team rolled their own RPC-style envelope.

### 5.4 Adapters (`src/lib/adapters/`)

`react-flow-adapter.ts` — bidirectional `ArchitexNode ↔ Node` and `ArchitexEdge ↔ Edge` conversion. Used by `canvas-store` (`canvas-store.ts:7-16`) and the export pipeline to keep React Flow internals out of business code.

### 5.5 Types (`src/lib/types/` + `src/lib/types.ts`)

| File | Major exports |
|---|---|
| `types.ts:1-179` | `ModuleType` (12 modules — note `interview` here, no `knowledge-graph`), `NodeCategory` (14 values), `SystemDesignNodeData`, `SystemDesignEdgeData`, `EdgeType`, `NodeShape`, `PaletteItem`, `SimulationCommand`, `SimulationSnapshot`, `SimulationEvent`, `NodeMetrics`, `EdgeMetrics` |
| `types/architex-node.ts:14-89` | Canonical `ArchitexNode`, `ArchitexEdge`, `ArchitexNodeState`, `ArchitexNodeMetrics`, `ArchitexEdgeMetrics`, `ArchitexNodeMetadata`, `ArchitexNodeConfig` |

### 5.6 Compression (`lz-string`)

Used at three sites only:

| Site | Purpose | Threshold |
|---|---|---|
| `lib/persistence/fallback-save.ts:7,33,59` | Compress emergency localStorage payload above 8 KB | `compressToUTF16` / `decompressFromUTF16` |
| `lib/export/to-url.ts:2,61,72` | Encode diagram into URL fragment for share links | `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` |
| `lib/collaboration/shareable-links.ts:8,60,104` | Build/parse `?share=...` collaboration URLs (max 2048 chars) | `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` |

### 5.7 Sync (`src/lib/sync/`)

| File | Role |
|---|---|
| `progress-sync-subscriber.ts:21-46` | Subscribes to `useProgressStore` mutations after dynamic import; debounces `POST /api/progress/sync` by 2 s; gated by `NEXT_PUBLIC_PROGRESS_USE_API`. Initialised from `QueryProvider` (`QueryProvider.tsx:36`). |
| `local-to-db-migration.ts` | One-shot migration from old localStorage progress keys into the new server-backed format. Called once from `QueryProvider.tsx:37`. |
| `sync-bridge.ts` | Generic outbound sync helpers. |

### 5.8 Cross-module bridge (`src/lib/cross-module/`)

`bridge-types.ts` defines `BridgePayload`, `CrossModuleContext`, `ModuleMasteryEntry`, `ConceptProgressEntry`, `ALL_MODULES`, `MODULE_LABELS`. Consumed exclusively by `useCrossModuleStore`.

### 5.9 Other client lib categories (overview)

| Category | Path | Highlights |
|---|---|---|
| AI client | `src/lib/ai/` | `claude-client.ts` singleton, `indexeddb-cache.ts` (cache-key SHA256 of prompt), `request-queue.ts`, `cost-monitor.ts`, persona/scoring/parser modules |
| Audio | `src/lib/audio/` | `sound-engine.ts` lazy-`AudioContext` singleton, `sounds.ts` config |
| Visualization | `src/lib/visualization/` | `canvas-renderer.ts` DPR-aware setup + update throttle |
| Performance | `src/lib/performance/` | `lod-renderer.ts`, `edge-optimizer.ts`, `particle-cache.ts`, `batch-updates.ts`, `d3-imports.ts`, `size-budget.ts`, `stress-test.ts` |
| Versioning | `src/lib/versioning/snapshots.ts` | `createSnapshot(label, nodes, edges)`, `restoreSnapshot()` — used by `useSnapshotStore` |
| FSRS | `src/lib/fsrs.ts` | Card scheduling for `use-due-reviews.ts` |
| Utils | `src/lib/utils.ts:1-6` | `cn(...)` = `twMerge(clsx(...))` — sole helper |
| CSS color util | `src/lib/utils/css-color.ts:6-20` | `getCSSColor(varName)`, `getNodeColor(category)`, `getStateColor(state)` for canvas/SVG paint |
| i18n | `src/lib/i18n/strings.ts` | Single string table |
| Auth | `src/lib/auth.ts:29-?` | `requireAuth()` + `getAuthUser()` server-side Clerk wrappers; falls back to `dev-user-local` when `NODE_ENV === "development"` |
| Templates | `src/lib/templates/` | `index.ts` API + `blueprints/` static templates |
| Command bus | `src/lib/command-bus/` | `command-bus.ts:25-?` — `CommandBus` class with rolling 200-entry history, plus `handlers/`, `register.ts`, `types.ts` |
| Palette | `src/lib/palette-items.ts` | Palette catalog feeding `NodeCategory` |
| PWA | `src/lib/pwa/register-sw.ts` | Service-worker registration |
| Export | `src/lib/export/` | Mermaid, PlantUML, JSON, drawio, terraform, PNG, SVG, PDF, GIF |
| A11y | `src/lib/a11y/` | Color contrast, touch targets, colorblind palette, high-contrast |

---

## 6. React Contexts

Five live React contexts. None of them double-duty as global state — each scopes a narrow concern.

| Context | File | Provided by | Consumed via | Value |
|---|---|---|---|---|
| `AnalyticsContext` | `src/components/providers/AnalyticsProvider.tsx:46` | `<AnalyticsProvider>` mounted in root layout | `useAnalytics()` (`AnalyticsProvider.tsx:60`) | `{track, identify, reset, page, featureFlag, optIn, optOut, hasOptedOut, isReady}` — wraps `lib/analytics/posthog` |
| `ReducedMotionContext` | `src/providers/ReducedMotionProvider.tsx:28` | `<ReducedMotionProvider>` inside `<MotionProvider>` | `useReducedMotion()` (`:108`) returns `boolean`; full access via `useReducedMotionContext()` (`:116`) | `{prefersReducedMotion, toolbarOverride, setToolbarOverride}` |
| `ModuleContext` | `src/providers/ModuleProvider.tsx:54` | `<ModuleProvider moduleType displayName>` wrapping each module's panels | `useModuleContext()`, `useModuleType()`, `useModuleLocalValue<T>(key, fallback)` (`:113-152`) | `{moduleType, displayName, localState, setLocalValue, getLocalValue, resetLocalState}` |
| `LODContext` | `src/contexts/LODContext.tsx:48` | `<LODProvider>` inside the canvas tree (subscribes to `useViewportStore.zoom` once) | `useLOD()` (`:91`); helpers `showMetrics(tier)`, `showDetails(tier)`, `showLabel(tier)`, `isVisible(tier)` (`:99-117`) | `LODTier = "full" \| "reduced" \| "minimal" \| "hidden"` mapped from zoom in `zoomToLODTier(zoom)` (`:37-42`) |
| `LLDDataContext` | `src/components/modules/lld/LLDDataContext.tsx:27` | `<LLDDataProvider value={...}>` at LLD module root | `useLLDDataContext()` (`:41`); throws if outside provider | `{patterns, solidDemos, problems, sequenceExamples, stateMachineExamples, isLoading}` |

Two more contexts exist outside the main module surface (workspace local, not relevant to global state):

- `src/app/learn/parking-lot/_DifficultyContext.tsx` — page-local difficulty selector
- `src/components/ui/tab-bar.tsx` — internal tab-bar context for the headless tab component
- `src/components/modules/SecurityModule.tsx` — internal module-local context

---

## 7. Types — Contract Surface

| Type | Where | Used by |
|---|---|---|
| `ModuleType` | `stores/ui-store.ts:4` (13 values incl. `knowledge-graph`) and `lib/types.ts:8` (12 values, no `knowledge-graph`) — **two definitions diverge** | UI store, page router, document-title hook, all module wrappers |
| `Theme`, `AnimationSpeed`, `LLDMode`, `RecentlyStudiedEntry` | `stores/ui-store.ts:19,21,23,25` | UI store + theme/animation hooks |
| `SimulationStatus`, `HeatmapMetric`, `TraceType`, `TrafficConfig`, `SimulationMetrics`, `ConsoleMessage` | `stores/simulation-store.ts:7-43` | Simulation store, simulation panel, orchestrator |
| `Language` | `stores/editor-store.ts:3` | Editor-store + code panels |
| `ChallengeStatus`, `Difficulty`, `Challenge`, `EvaluationScore`, `RevealedHint`, `HintUsageSummary`, `DrillMode`, `HintTier`, `ActiveDrill` | `stores/interview-store.ts:70-126` | Interview store, drill flow, hint ladder |
| `ChallengeAttempt` | `stores/progress-store.ts:4` | Progress store, challenge submission flow |
| `AppNotification`, `NotificationType`, `NotificationAction` | `stores/notification-store.ts:8-33` | Notification store + UI |
| `NodeGroup`, `CanvasAnnotation`, `NamedCanvasSnapshot` | `stores/canvas-store.ts:20-59` | Canvas store, annotation layer, named-snapshot panel |
| `DrillStoreState`, `HintLogEntry`, `StageProgressBag` | `stores/drill-store.ts:8-49` | Drill store + drill hooks |
| `ArchitexNode`, `ArchitexEdge`, `ArchitexNodeState`, `ArchitexNodeMetrics`, `ArchitexEdgeMetrics`, `ArchitexNodeMetadata`, `ArchitexNodeConfig` | `lib/types/architex-node.ts:14-89` | Canvas store accessors, react-flow-adapter, export pipeline |
| `SystemDesignNodeData`, `SystemDesignEdgeData`, `NodeCategory`, `EdgeType`, `NodeShape`, `PaletteItem`, `SimulationCommand`, `SimulationSnapshot`, `SimulationEvent`, `NodeMetrics`, `EdgeMetrics` | `lib/types.ts:42-178` | RF nodes/edges, simulation engine |
| `Command<T>`, `CommandHandler<T>`, `LoadTemplatePayload`, etc. | `lib/command-bus/types.ts:13-?` | Command bus + dispatcher hooks |
| `SerializedProject`, `MigrationFn` | `lib/persistence/migration.ts:7-26` | Hydration / migration |
| `IDBHandle`, `IDBSchema` | `lib/persistence/idb-store.ts:7-16` | All IndexedDB callers |
| `WorkerMessage<T>`, `WorkerResponse<T>`, payload types | `lib/workers/types.ts:14-122` | All worker bridges |
| `LODTier` | `contexts/LODContext.tsx:27` | All canvas node components |
| `BridgePayload`, `CrossModuleContext`, `ModuleMasteryEntry`, `ConceptProgressEntry` | `lib/cross-module/bridge-types.ts` | Cross-module store + bridge UI |

Single ambient declarations file: `src/types/missing-deps.d.ts` (one file in `src/types/`). All other types are co-located with the modules that own them.

---

## 8. Undo / Redo

### 8.1 Architecture

- **Library status:** `zundo@^2.3.0` is in `package.json:79`. The codebase uses **none of its functions** — no `temporal()` import in `src/`. A custom snapshot-based manager replaces it. `src/stores/STATE_ARCHITECTURE.ts:1611,1685` records the migration ("Remove zundo temporal() from canvas-store").
- **Singleton:** `src/stores/canvas-store.ts:62-64` instantiates `canvasUndoManager = new UndoManager<CanvasSnapshot>({maxEntries: 100})`.
- **Snapshot shape:** `CanvasSnapshot = {nodes: Node[], edges: Edge[], groups: NodeGroup[]}` (`canvas-store.ts:29-33`).

### 8.2 What pushes a snapshot

`canvas-store.ts:135-143` defines `pushSnapshot(state)` and calls it from the start of every mutating action:

| Action | Pushes? | Line |
|---|---|---|
| `setNodes` | Yes | `canvas-store.ts:157` |
| `setEdges` | Yes | `:161` |
| `addNode` | Yes | `:178` |
| `addEdge` | Yes | `:183` |
| `removeNodes` | Yes | `:188` |
| `removeEdges` | Yes | `:201` |
| `updateNodeData` | Yes | `:211` |
| `clearCanvas` | Yes | `:224` |
| `setArchitexNodes/Edges` | Yes | `:276,281` |
| `addArchitexNode/Edge` | Yes | `:286,291` |
| `restoreNamedSnapshot` | Yes (before destructive replace) | `:315` |
| `onNodesChange` / `onEdgesChange` | **No** | `:169-175` (these would fire 60×/sec during drag — deliberately skipped) |
| `setSelectedNodeIds` / `setSelectedEdgeIds` / `clearSelection` | **No** | `:219-222` |
| `addAnnotation` / `updateAnnotation` / `deleteAnnotation` | **No** | `:331-349` |
| `pushNamedSnapshot` / `deleteNamedSnapshot` | **No** | `:296-326` |

### 8.3 Memory limits and eviction

Per `UndoManager.evict()` (`undo-manager.ts:136-148`):
1. Evict from front while `undoStack.length > maxEntries` (default 50, canvas overrides to 100).
2. Evict from front while `totalBytes > maxBytes` (default 10 MB).
3. Byte estimate: `JSON.stringify(snapshot).length * 2` (`undo-manager.ts:14-20`).

### 8.4 Reactive bindings

`useUndoRedo<T>(manager)` (`hooks/useUndoRedo.ts:10-51`) wraps the manager via `useSyncExternalStore`. It memoises the previous `UndoRedoState` in a ref and returns the same object reference when nothing changed, preventing spurious re-renders. Returns `{undo, redo, canUndo, canRedo, undoStackSize, redoStackSize}`.

### 8.5 Transactions and debouncing

- `TransactionManager<T>` (`undo/transactions.ts:6-61`) — `beginTransaction()` captures the pre-state; `commitTransaction(finalSnapshot)` pushes one snapshot covering the whole batch; `rollbackTransaction()` returns the captured pre-state. Nesting throws.
- `createDebouncedSnapshot(manager, 500ms)` (`undo/debounce.ts:10-25`) — only the last call within the window pushes.
- `createDragSnapshot(manager)` (`:38-59`) — returns `{onDragStart, onDragEnd}`. On drag end, **two pushes**: pre-drag then post-drag, so undo restores to pre-drag.

### 8.6 Keyboard

`hooks/use-keyboard-shortcuts.ts:101-110` wires `Cmd/Ctrl+Z` → `useCanvasStore.getState().undo()` and `Cmd/Ctrl+Shift+Z` → `redo()`. The store actions in turn call `canvasUndoManager.undo()` / `redo()` (`canvas-store.ts:235-255`).

---

## 9. Web Workers

### 9.1 Bridge contract (`lib/workers/worker-bridge.ts:60-192`)

```text
WorkerBridge
  send<TReq, TRes>(message: WorkerMessage<TReq>) : Promise<TRes>
  terminate(): void
  isFallback: boolean
```

- **Message correlation** by `id` field set via `generateMessageId()` (`worker-bridge.ts:46-51`); response routed back via a `Map<id, PendingRequest>`.
- **Timeout default 30 000 ms.** Per-request timer rejects on expiry (`:172-177`).
- **Idle auto-termination** after `idleTimeout = 60 000 ms` of no in-flight requests (`:141-151`).
- **Fallback mode** — when `Worker` is undefined (SSR/test), `send` invokes the `fallback` handler synchronously on the main thread (`:74-99`).

### 9.2 Worker payloads (`lib/workers/types.ts`)

| Constant | Request payload | Response payload | Worker file |
|---|---|---|---|
| `SIMULATE_TICK = "SIMULATE_TICK"` | `{nodes: {id, arrivalRate, serviceRate, serverCount}[], tickDelta}` | `{nodeResults: {id, metrics}[], tickTimestamp}` | `simulation-worker.ts` |
| `COMPUTE_ALGO_STEP = "COMPUTE_ALGO_STEP"` | `{algorithmName, input: number[], config?}` | `{result: AlgorithmResult}` | `algorithm-worker.ts` |
| `COMPUTE_LAYOUT = "COMPUTE_LAYOUT"` | `{nodes, edges, algorithm: LayoutAlgorithm, options?}` | `{positions: {id, x, y}[]}` | `layout-worker.ts` |
| (separate) | `MinimapNode[]` + viewport | Transferable `ImageBitmap` | `minimap-worker.ts:24-?` |

### 9.3 Comlink

Not used. No `comlink` import or dependency anywhere under `src/`. RPC is hand-rolled over `postMessage`.

---

## 10. Compression Patterns (lz-string)

| Site | Encoder | Decoder | Threshold | Reason |
|---|---|---|---|---|
| `lib/persistence/fallback-save.ts:33,59` | `compressToUTF16` | `decompressFromUTF16` | Compress only when raw JSON ≥ 8 192 bytes (`fallback-save.ts:13`) | Fits more state into the 5 MB localStorage budget; avoids the 30%+ tax for small payloads |
| `lib/export/to-url.ts:61,72` | `compressToEncodedURIComponent` | `decompressFromEncodedURIComponent` | Always | URL-safe, fragments the diagram into a single `?d=...` parameter |
| `lib/collaboration/shareable-links.ts:60,104` | `compressToEncodedURIComponent` | `decompressFromEncodedURIComponent` | Always; max URL 2048 chars (`shareable-links.ts:?`) | Real-time-collab share URLs |

Diagram payload size considerations: full canvas state is `Node[] + Edge[] + groups[]`; for large designs (~100 nodes) raw JSON commonly exceeds 50 KB, which the URL exporter compresses to typically <8 KB encoded. The fallback emergency save preserves up to 10 MB in `UndoManager` plus the canvas itself, so it must compress to fit localStorage.

---

## 11. Persistence Boundary

| Slice / data | Storage | Key | Notes |
|---|---|---|---|
| `useUIStore` partial (`activeModule`, `recentModules`, `recentlyStudied`, panel flags, `theme`, `animationSpeed`, `timelineVisible`, `minimapVisible`, `lldMode`, `lldWelcomeBannerDismissed`) | **localStorage** | `architex-ui` | `partialize` whitelists 13 keys (`ui-store.ts:202-219`) |
| `useCanvasStore` `{nodes, edges, groups}` | **localStorage** | `architex-canvas` | `partialize` keeps only persistable fields (`canvas-store.ts:359-366`); `namedSnapshots`, `annotations`, `selectedNodeIds`, `activeDesignId` are NOT persisted |
| `useProgressStore` (full state) | **localStorage** | `architex-progress` | No `partialize` — full `{attempts, totalXP, streakDays, lastActiveDate}` |
| `useNotificationStore` | **localStorage** | `architex-notifications` | `partialize` strips `action.onClick` callbacks |
| `useSnapshotStore` | **localStorage** | `architex-snapshots` | `{snapshots, activeSnapshotId}` |
| `useCrossModuleStore` `{moduleMastery, conceptProgress}` | **localStorage** | `architex-cross-module` | `pendingBridge`, `activeContext` are ephemeral |
| `useBillingStore` `{currentPlan, subscription}` | **localStorage** | `architex:billing-store` | `usage` is rebuilt from `lib/billing/usage-tracker` on hydration |
| `useAIStore` (full + obfuscated key) | **localStorage** | `architex-ai-settings` | API key obfuscated via `btoa(reverse(key))` (`ai-store.ts:54-64`); `onRehydrateStorage` re-injects into `ClaudeClient` singleton (`ai-store.ts:200-208`) |
| `useInterviewStore` (in-progress drill subset) | **IndexedDB** `architex-interview` / store `session` / key `current` | manual `subscribeWithSelector` + microtask queue + `idb-store.put`/`get` | Restores only sessions <4 h old AND `challengeStatus === "in-progress"` (`interview-store.ts:332-352`); always resumed paused |
| Server progress (FSRS, designs, drill attempts) | **PostgreSQL** via `/api/*` | TanStack Query cache | `gcTime: 30 min`, `staleTime: 5 min` for content; per-hook `staleTime: Infinity` for catalog data |
| `useSimulationStore`, `useViewportStore`, `useEditorStore`, `useDrillStore`, `useCollaborationStore` | **None** | — | All ephemeral runtime state |
| Canvas autosave fallback | **localStorage** `architex-fallback-save` | beforeunload-driven last write, lz-string compressed >8 KB (`fallback-save.ts:7-39`) | Backed by `UndoManager` snapshots in memory |
| Quiz best scores | **localStorage** `architex-quiz-score:{quizType}` | per-quiz dual-write to `/api/progress` (`use-quiz-persistence.ts:12,31-67`) | Plus optimistic local update |
| Recent commands | **localStorage** `architex-recent-commands` | max 10 (`useRecentCommands.ts:5-6`) | Read via `useSyncExternalStore` |
| First-encounter dismissals | **localStorage** `architex-first-encounter-{featureId}` | per-feature flag | One-time tooltips |
| Inactivity-prompt shown flag | **sessionStorage** `architex-inactivity-shown-{modeId}` | per-mode per-session | Empty-canvas nudge dedupe |
| Reduced-motion toolbar override | **localStorage** `architex-a11y-reduce-animations` | `boolean \| null` | `ReducedMotionProvider:14` |
| URL-fragment shared diagram | **URL** `?share=...` (lz-string compressed) | one-shot inbound import | `lib/collaboration/shareable-links.ts` |
| URL-fragment exported diagram | **URL** `?d=...` (lz-string compressed) | one-shot share | `lib/export/to-url.ts` |
| Onboarding completed flag | **localStorage** `architex_onboarding_completed` | read in `ui-store` initialiser | `ui-store.ts:153-155` |
| Stuck-module fix | **localStorage** `ui-store` (legacy key) | rewritten on import side-effect | `lib/fix-stuck-module.ts:6-13` |

The IndexedDB schema is intentionally minimal: only one default DB (`architex-db`) with `projects` and `settings` stores plus the dedicated `architex-interview` DB. There is no Dexie integration; everything goes through the hand-written `idb-store.ts` Promise wrappers.

---

## 12. Quirks

| # | Quirk | Where | Notes |
|---|---|---|---|
| 1 | `ModuleType` is defined twice with **different value sets**: `ui-store.ts:4-17` includes `"knowledge-graph"`; `lib/types.ts:8-20` does not | `stores/ui-store.ts:4-17`, `lib/types.ts:8-20` | Type narrowing across boundaries can reject the union mismatch silently |
| 2 | `useUIStore` reads `localStorage` during initial state (`onboardingActive`) — fine on client, but the surrounding `typeof window !== "undefined"` guard is essential | `stores/ui-store.ts:153-155` | Persisted state and initial state can disagree across hydration |
| 3 | `subscribeWithSelector` selector returns a new object each call, so the explicit `equalityFn: shallow` on the IndexedDB persistence subscriber is required to avoid an infinite loop | `stores/interview-store.ts:357-374` | Without `shallow`, every selector invocation triggers another save and another fire |
| 4 | `useTheme()` and `ui-store.theme` were previously bidirectionally synced — caused infinite update loop. Current sync is **one-way** ui-store → next-themes | `components/providers/theme-provider.tsx:11-21` | Setting next-themes from elsewhere (e.g., a button using `useTheme().setTheme`) does not write back to ui-store |
| 5 | `simulation-store.setPlaybackSpeed` reads state **before** writing, so `setStatus`/`setSpeed` calls don't race | `stores/simulation-store.ts:211-217` | Imperative call ordering matters because the orchestrator lives outside React |
| 6 | Canvas store mutations push snapshots **before** they apply, including for `updateNodeData`. This means simulation tick metrics writes (`updateNodeData(id, {metrics})`) push undo entries during a running simulation | `stores/canvas-store.ts:210-217` | Could spam the undo stack if simulation drives metric updates through this action; per `STATE_ARCHITECTURE.ts:1561-1573` the planned mitigation is a `batchUpdateNodeData` that bypasses |
| 7 | `useCanvasStore.persist` partializes only `{nodes, edges, groups}` — but the store also exposes `namedSnapshots`, `annotations`, `activeDesignId`. These are silently lost on reload | `stores/canvas-store.ts:359-366` | Server-side persistence (`/api/lld/designs/.../snapshots`) covers the per-design case but not the legacy single-canvas autosave |
| 8 | `notification-store.partialize` strips `action.onClick` callbacks before save — restored notifications have an undefined `onClick` after rehydration | `stores/notification-store.ts:96-101` | Click handlers must be re-bound in UI, not relied on from persisted state |
| 9 | `ai-store` API key "obfuscation" is `btoa(reverse(key))` — not encryption, just a token-safety smoke screen | `stores/ai-store.ts:54-64` | Comment explicitly says "defense in depth", not security |
| 10 | `interview-store` IndexedDB persistence uses `queueMicrotask` for debouncing — single subscription captures multiple writes per tick into one persist | `stores/interview-store.ts:355-375` | If many fields change synchronously they coalesce; spread mutations across microtasks defeat this |
| 11 | `fix-stuck-module.ts` is imported as a side-effect at the very top of `app/layout.tsx:1` — it runs **before** React, before the persist middleware reads | `lib/fix-stuck-module.ts:1-17` | Required because the persisted `activeModule = "data-structures"` was unrenderable historically |
| 12 | LODProvider subscribes to `useViewportStore.zoom` once and republishes via context — the explicit pattern from `contexts/LODContext.tsx:9-17` is to "replace ~50 individual viewport store subscriptions" | `contexts/LODContext.tsx:9-17,70-76` | All node components must read from `useLOD()`, not `useViewportStore` directly, or the optimisation is voided |
| 13 | `useSound` exposes a global `soundEngine` singleton via `useSyncExternalStore` with a module-level `snapshot` and `listeners` set — it's a hand-rolled external store | `hooks/useSound.ts:13-43` | Multiple consumers share the same snapshot ref; `emitChange` must be called manually after any setter |
| 14 | `useRecentCommands` follows the same hand-rolled external-store pattern over `localStorage` | `hooks/useRecentCommands.ts:14-?` | Cache is module-scoped; updates outside React (e.g., across tabs) won't propagate |
| 15 | `useInterviewStore` is the only store whose hydration is **asynchronous and conditional** — restores only happen after a `loadInterviewState()` Promise + age + status checks pass | `stores/interview-store.ts:332-352` | Components reading the store on first render see the empty initial state, then a flash of restored content; the timer is always paused on resume |
| 16 | `MaybeClerkProvider` uses `require("@clerk/nextjs")` inside a try/catch so that builds without a Clerk publishable key skip Clerk's "Configure your application" popup | `app/layout.tsx:16-24` | This is the only `require()` call in the layout tree |
| 17 | `QueryProvider` initialises both progress sync and a one-time localStorage→DB migration in a single `useEffect` — order is `initProgressSync()` then `migrateLocalStorageToDb()`, but neither awaits the other | `providers/QueryProvider.tsx:35-38` | If migration fails partially, the sync subscriber will still queue diffs against the un-migrated data |
| 18 | Cross-store consumption uses `useXxxStore.getState()` extensively in non-React code (workers, command-bus handlers, sync subscribers). This breaks reactivity — the consumer must rely on Zustand `subscribe` to be notified | `lib/sync/progress-sync-subscriber.ts:25-45`, `stores/snapshot-store.ts:31` | Consistent with ADR-001 §5; deliberate trade-off |

---

## 13. Open Questions

1. **zundo dependency status.** `zundo@^2.3.0` is in `package.json` but unused. Is it kept for a planned re-introduction (per `STATE_ARCHITECTURE.ts` historical migration notes) or genuinely deletable? Removing it would also remove a transitive Zustand peer pin.
2. **`ModuleType` divergence.** `stores/ui-store.ts` includes `"knowledge-graph"`; `lib/types.ts` does not. Is `lib/types.ts` the canonical "core" set with `knowledge-graph` deliberately excluded as a UI-only surface?
3. **Canvas persistence vs. server snapshots.** `useCanvasStore.persist` saves `{nodes, edges, groups}` to localStorage globally, while LLD designs save per-design snapshots via `useLLDDesignSync` and `pushNamedSnapshot`. Is the localStorage canvas an active-workspace fallback or stale code?
4. **Snapshot push during simulation.** `updateNodeData` pushes a full undo snapshot. With ~30fps tick updates over 50 nodes, this can fill the 100-entry undo stack within 3-4 seconds of running simulation. Is the intended fix the unmerged `batchUpdateNodeData` from `STATE_ARCHITECTURE.ts:1561-1573`?
5. **Worker fallback completeness.** `worker-bridge.ts` provides a synchronous main-thread fallback when `Worker` is undefined, but the simulation/algorithm/layout workers don't expose their handlers as importable functions. Does SSR / test mode actually exercise the fallback path?
6. **Auto-save coverage.** `createAutoSave` exists in `lib/persistence/auto-save.ts` but is wired in only via `useSaveStatus.ts` for canvas. No equivalent runs for editor state, drill state (it has its own server heartbeat), or per-module local state. Is that intentional?
7. **`useInterviewStore` IndexedDB schema versioning.** It opens at `INTERVIEW_DB_VERSION = 1` with a flat shape. There is no migration registered. How will future schema changes be handled — through `lib/persistence/migration.ts`'s chain framework or an ad-hoc bump?
8. **Recent commands cross-tab sync.** `useRecentCommands` caches in module scope and only listens to its own setters. A second tab that pushes a command will not invalidate the first tab's cache. Is that acceptable?
9. **Provider order assumption.** `MotionConfigBridge` reads `useReducedMotion()` which requires `<ReducedMotionProvider>` upstream — both are inside `MotionProvider`. If a future refactor moves either, the dependency is implicit (no provider-required typing).
10. **Cross-store transactions.** The Command Bus has shipped (`lib/command-bus/command-bus.ts:25-?`) but the `TransactionManager` in `lib/undo/transactions.ts` is not yet wired into command-bus handlers. Multi-store changes (load template, reset workspace) currently push multiple snapshots instead of one transactional snapshot.
