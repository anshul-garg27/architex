# 01 — Canvas + LLD (Low-Level Design) Core

> **Module**: React Flow design canvas + LLD problem catalog + drill mode + AI drill interviewer.
>
> **Scope**: every page, store, hook, API route, schema, e2e spec, and template that contributes to the LLD interactive design experience and the timed-interview drill.
>
> **Status**: descriptive. This doc captures what IS in the code today; it does not propose changes.

---

## 1. Purpose & Product Role

The Canvas + LLD module is where the learner *does the work*: it is the surface that turns reading a pattern into building a design and being graded on it. There are three intertwined personas of the surface:

1. **Browse / Learn** — `lld-problems/` SEO pages let any visitor (no auth) skim the 33 LLD interview problems, see difficulty, key patterns, and follow a CTA into the studio.
2. **Build** — the React-Flow-based **DesignCanvas** (`src/components/canvas/DesignCanvas.tsx`) lets an authenticated user drag system-design components from a palette, draw edges, save named **designs** (`lld_designs`) with **snapshots** (`lld_design_snapshots`) and free-floating **annotations** (`lld_design_annotations`).
3. **Drill** — a 5-stage timed interview pipeline (clarify → rubric → canvas → walkthrough → reflection) backed by `lld_drill_attempts` + `lld_drill_interviewer_turns`. A Claude-backed *interviewer persona* streams turns over SSE, hints have a tier-ladder economy, and a 6-axis rubric grades the final submission with an AI-authored **postmortem**.

In short: this module is the *practice surface* of architex. Schema rows here represent every meaningful learner action — read a pattern section, bookmark a heading, save a design checkpoint, take a hint, finish a drill.

Cited entry points:
- `src/app/lld-problems/page.tsx:54-90` — public catalog
- `src/app/lld-problems/[slug]/page.tsx:112-393` — public per-problem page (SEO + JSON-LD)
- `src/components/canvas/DesignCanvas.tsx:66-385` — the React Flow surface
- `src/components/modules/lld/modes/DrillModeLayout.tsx:181-243` — the drill shell
- `src/db/schema/lld-drill-attempts.ts:28-89` — drill attempt row

---

## 2. High-Level Architecture (page → store → API → DB)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            BROWSER (Next.js client)                          │
│                                                                              │
│  ┌─────────────────────┐     ┌──────────────────────┐    ┌────────────────┐  │
│  │ lld-problems/       │     │ DesignCanvas         │    │ DrillModeLayout│  │
│  │  page.tsx (SEO)     │     │  (React Flow v12)    │    │  (5-stage FSM) │  │
│  │  [slug]/page.tsx    │     │  + ComponentPalette  │    │  + Stepper     │  │
│  │  (static gen)       │     │  + Toolbar/Overlays  │    │  + HintLadder  │  │
│  └─────────────────────┘     └──────────┬───────────┘    └────────┬───────┘  │
│                                         │                          │          │
│                                         ▼                          ▼          │
│      ┌──────────────────┬──────────────────┬──────────────────┬──────────┐    │
│      │ canvas-store     │ viewport-store   │ ui-store         │ drill-   │    │
│      │ (Zustand persist)│ (xy/zoom)        │ (panels/dialogs) │ store    │    │
│      │ + UndoManager    │                  │                  │ (FSM)    │    │
│      └────────┬─────────┴──────────────────┴──────────────────┴────┬─────┘    │
│               │                                                     │          │
│      localStorage:                                                  │          │
│      "architex-canvas" (nodes/edges/groups)                         │          │
│      "architex-snapshots" (snapshot-store)                          │          │
└────────────────────────────────────────────────────────────────────┼─────────┘
                                                                     │
                                                                     ▼ fetch / SSE
┌────────────────────────────────────────────────────────────────────────────────┐
│                           Next.js App Router (server)                          │
│                                                                                │
│   /api/lld/                                                                    │
│     designs, designs/[id], .../snapshots, .../annotations                      │
│     drill-attempts, drill-attempts/[id], drill-attempts/active                 │
│       drill-attempts/[id]/{turn,grade,stage,hint,postmortem,resume}            │
│     drill-interviewer/[id]/stream  (POST persist + GET SSE delta-text-done)    │
│     templates-library, lessons/[slug], learn-progress, .../[patternSlug]       │
│     bookmarks, .../[id], concept-reads, explain-inline, ai/suggest-nodes       │
│                                                                                │
│   Auth gate: requireAuth() (Clerk) → resolveUserId() (clerkId → users.id UUID) │
│   AI:        ClaudeClient singleton (claude-haiku-4-5 / sonnet for personas)   │
└──────────────────────────────────────────┬─────────────────────────────────────┘
                                           │
                                           ▼ Drizzle (Neon PostgreSQL)
                  ┌─────────────────────────────────────────────────┐
                  │ lld_designs            lld_design_snapshots     │
                  │ lld_design_annotations lld_templates_library    │
                  │ lld_drill_attempts     lld_drill_interviewer_   │
                  │ lld_bookmarks          turns                    │
                  │ lld_concept_reads      lld_learn_progress       │
                  │ ai_usage  (rate limit + cost tracking)          │
                  │ module_content (lessons, JSONB schemaVersion=1) │
                  └─────────────────────────────────────────────────┘
```

Key invariants:
- **One active drill per user** is enforced by a partial unique index on `lld_drill_attempts` (`src/db/schema/lld-drill-attempts.ts:83-85`).
- **Designs are user-scoped by slug** via composite unique index `(user_id, slug)` (`src/db/schema/lld-designs.ts:55`).
- **Snapshots are append-only** — there is no UPDATE; user-named milestones live alongside silent auto-saves (`kind` discriminator).
- **Drill turn ordering** is per-attempt monotonic via `seq` (`src/db/schema/lld-drill-interviewer-turns.ts:38, 49-51`).

---

## 3. Page Routes

The LLD module has **two route trees**: the public SEO pages under `/lld-problems` and the in-app studio under `/` (with `?lld=…` deep links handled by other modules' shells, e.g. `LLDShell` / `BuildModeLayout` / `DrillModeLayout`). The studio itself is mounted by other modules that compose `DesignCanvas`.

| Route | File | Renders | Auth | Params |
|---|---|---|---|---|
| `/lld-problems` | `src/app/lld-problems/page.tsx:54-90` | Static SEO index. `LLD_PROBLEMS` from `src/lib/seo/lld-problems-data.ts` (re-export of `src/lib/lld/problems.ts`). Uses `<SearchableGrid>` with category groups + difficulty badges. | None | none |
| `/lld-problems/[slug]` | `src/app/lld-problems/[slug]/page.tsx:112-393` | Static per-problem page. Calls `getLLDProblemBySlug(slug)`. Emits `LearningResource` + `BreadcrumbList` JSON-LD. CTA `Link href={"/?lld=${problem.slug}"}` opens the studio. `generateStaticParams()` pre-renders all 33 slugs (`L19-24`). | None | `slug` |
| `/lld-problems` (loading) | `src/app/lld-problems/loading.tsx` | Skeleton: header + search bar + 3 category groups × 4 problem rows. | None | none |
| `/?lld=problem:<id>` | composed by other modules | Reads URL param → opens studio with the problem pre-loaded (consumed by `DrillModeLayout`'s `readProblemIdFromUrl()` at `:17-23`). | Required for save/drill | `lld` query param |
| `/modules/lld?mode=drill` | composed by `LLDShell` | Drill-mode entry. The e2e spec at `e2e/lld-drill-mode.spec.ts:21-35` navigates here. | Required | `mode` query param |

All `/api/lld/*` routes (covered in §9) are **not page routes** — they are handlers under `src/app/api/lld/**`. They use the App Router `route.ts` convention with `export async function GET / POST / PATCH / DELETE`.

The studio CTA on `/lld-problems/[slug]` (line 370) intentionally uses `?lld=${problem.slug}` rather than a deep link to a sub-route — the studio is a single-page surface that reads the URL param at mount.

---

## 4. Canvas Component Layers

The system-design canvas is implemented in `src/components/canvas/DesignCanvas.tsx:66-385`. It is `memo`'d and reads from three Zustand stores.

### 4.1 React Flow setup

```tsx
// src/components/canvas/DesignCanvas.tsx:53-60
const nodeTypes = systemDesignNodeTypes as unknown as NodeTypes;
const edgeTypes = systemDesignEdgeTypes as unknown as EdgeTypes;
const defaultSnapGrid: [number, number] = [16, 16];
const defaultEdgeOpts = {
  type: "data-flow" as const,
  data: { edgeType: "http", animated: false },
};
```

Static type maps live **outside** the component to avoid React Flow's "ReactFlow.NodeTypes changed" remount warning (`L53-54`). The cast is acknowledged in `docs/adr/ADR-002-react-flow-v12.md:80-82`.

The `<ReactFlow>` instance is configured with `fitView`, `snapToGrid`, `colorMode` driven by `next-themes`, and `proOptions={{ hideAttribution: true }}` (lines 295-319). `Background` is `BackgroundVariant.Dots` with gap 20, color `var(--canvas-dot)`. `Controls` and `MiniMap` are conditional on `useUIStore.minimapVisible`.

### 4.2 Custom node types (75 entries)

`src/components/canvas/nodes/system-design/index.ts:264-351` exports `systemDesignNodeTypes` — a 75-entry registry mapping React Flow `type` strings to `withErrorBoundary(NodeComponent, name)` (`L251`). Every node component is `memo`-wrapped and shares `BaseNode.tsx` for shape, state dot, level-of-detail rendering, and 4-side handles (8 handles total: 4 source + 4 target — see ADR-002 §3 at `docs/adr/ADR-002-react-flow-v12.md:56-60`).

Node groupings (from index.ts comments):
- **Original 32**: web-server, load-balancer, database, cache, message-queue, api-gateway, cdn, client, storage, app-server, serverless, worker, document-db, wide-column, search-engine, timeseries-db, graph-db, pub-sub, stream-processor, batch-processor, ml-inference, dns, cdn-edge, firewall, mobile-client, third-party-api, metrics-collector, log-aggregator, tracer, event-bus, rate-limiter, secret-manager.
- **Services**: notification-service, search-service, analytics-service, scheduler, service-discovery, config-service, secrets-manager-v2, feature-flags, auth-service-v2.
- **Networking v2**: vpc, subnet, nat-gateway, vpn-gateway, service-mesh, dns-server, ingress-controller.
- **FinTech**: payment-gateway, ledger-service, fraud-detection, hsm.
- **Data Engineering**: etl-pipeline, cdc-service, schema-registry, feature-store, media-processor.
- **AI / LLM**: llm-gateway, tool-registry, memory-fabric, agent-orchestrator, safety-mesh.
- **Security v2**: ddos-shield, siem.
- **DB Internals**: shard-node, primary-node, partition-node, replica-node, input-node, output-node, coordinator-node.

The category-to-shape mapping in `BaseNode.tsx:25-40`:

```ts
// src/components/canvas/nodes/system-design/BaseNode.tsx:25-40
export const CATEGORY_SHAPE: Record<NodeCategory, NodeShape> = {
  compute: 'rectangle',
  'load-balancing': 'hexagon',
  storage: 'cylinder',
  messaging: 'parallelogram',
  networking: 'hexagon',
  processing: 'rectangle',
  client: 'pill',
  observability: 'dashed-rect',
  security: 'octagon',
  services: 'rectangle',
  ...
};
```

State dots come from a `STATE_VAR` map at `BaseNode.tsx:62-70` (`idle`, `active`, `success`, `warning`, `error`, `processing`).

### 4.3 Edge types

`src/components/canvas/edges/index.ts:20-23` defines two edge types:

| `type` | Component | Use |
|---|---|---|
| `data-flow` | `DataFlowEdge` (`src/components/canvas/edges/DataFlowEdge.tsx:52`) | Default for system-design canvases. 9 visual styles keyed off `data.edgeType`: http, grpc, graphql, websocket, message-queue, event-stream, db-query, cache-lookup, replication. Solid vs dashed encodes async vs sync. |
| `crows-foot` | `CrowsFootEdge` (`src/components/canvas/edges/database/CrowsFootEdge.tsx`) | ER-diagram cardinality (one/many/one-or-many/zero-or-one) for the `database` module. |

Edge styles map (`DataFlowEdge.tsx:22-32`):

```ts
const EDGE_STYLES: Record<EdgeType, EdgeVisualStyle> = {
  http: { stroke: 'var(--node-compute)' },
  grpc: { stroke: 'var(--node-networking)' },
  graphql: { stroke: 'var(--node-processing)' },
  websocket: { stroke: 'var(--node-storage)', strokeDasharray: '6 3' },
  'message-queue': { stroke: 'var(--node-messaging)', strokeDasharray: '8 4' },
  ...
};
```

### 4.4 Controls, Panels, Overlays

The canvas overlay layer is dense — **42 components** under `src/components/canvas/overlays/**` plus 7 panels under `src/components/canvas/panels/**`. Highlights:

- **`CanvasContextMenu`** (`overlays/CanvasContextMenu.tsx:34-100`) — Radix context menu wrapping the entire canvas. Right-click adds a top-8 component, pastes a clipboard node, opens the template gallery, exports, fits view, or selects all. Add at viewport center via `reactFlow.getViewport()` (`L60-63`).
- **`NodeContextMenu`** — per-node right-click menu (delete, duplicate, copy).
- **`CanvasToolbar`** (`overlays/CanvasToolbar.tsx`) — top-floating toolbar: tool mode (select / pan / connect), undo/redo, simulation play/pause/stop, zoom in/out/fit, minimap toggle, heatmap toggle, trace, what-if, evolution timeline, export menu.
- **`AlignmentGuides`** (`overlays/AlignmentGuides.tsx`) — pink/purple guides + distance indicators rendered while a node is dragged. Computed in `onNodeDrag` via `findAlignmentGuides()` and `findDistanceIndicators()` (`DesignCanvas.tsx:138-172`).
- **`GroupZones`** (`overlays/GroupZone.tsx`) — auto-fitting bounding boxes for `useCanvasStore.groups`.
- **`ParticleLayer`, `HeatmapOverlay`, `RequestTrace`** — rendered conditionally on `simulationStatus === "running"` (`DesignCanvas.tsx:355-363`).
- **`SimulationDashboard`, `NodeMetricsOverlay`, `ChaosQuickBar`, `CostMonitor`** — only mounted while a simulation is running or paused (`DesignCanvas.tsx:365-372`).
- **`WhatIfPanel`, `DiffPanel`** — local-state toggles wired into the toolbar (`L121-130`).
- **`EvolutionTimeline`, `TimeTravelScrubber`** — versioning UI; `TimeTravelScrubber` is mounted only if `orchestratorRef.getTimeTravel()` is non-null (`L110-118`).
- **`EmptyState`** (`overlays/EmptyState.tsx`) — shown when `nodes.length === 0`.
- **`NodeCreationPulse`, `EdgeCreationAnimation`, `DropZoneHighlight`, `DragGhostPreview`** — micro-feedback animations on add operations.
- **`KeyboardShortcutSheet`, `Spotlight`, `LayoutPicker`** — UX helpers.

Panels (`src/components/canvas/panels/**`):
- `ComponentPalette.tsx` — left-rail draggable palette (`L133-340`); search, keyboard nav (Arrow/Home/End/Enter), drag dataTransfer key `application/architex-node`.
- `PropertiesPanel.tsx`, `ClassPropertiesPanel.tsx`, `ERPalette.tsx` — right-rail context-sensitive editors.
- `BottomPanel.tsx`, `AlgorithmPanel.tsx`, `tabs/PostSimulationReport.tsx` — bottom drawer.

### 4.5 Command palette wiring

`src/components/shared/command-palette.tsx:1-80` (`Command` from `cmdk`) registers a global ⌘K palette. Commands include module switches, sidebar toggles, theme picker, simulation play/pause/stop/reset, recent commands, and template gallery / export / import dialog openers — see lines 61-80 and `useCommands()`.

### 4.6 Keyboard shortcuts

Two layered hooks:

- **Build mode** — `src/hooks/useBuildKeyboardShortcuts.ts:37-104`:
  - `Cmd+N` — new node, `Cmd+Z` / `Cmd+Shift+Z` — undo / redo
  - `Cmd+Shift+T` — open templates, `Cmd+Shift+A` — AI suggestions
  - `Cmd+Shift+L` — auto-layout left-right, `Cmd+Shift+Y` — layered, `Cmd+Shift+O` — circular
  - `Cmd+Shift+S` — capture named snapshot, `Cmd+Shift+P` — export PNG
  - Guarded by `isTextInputTarget()` (`L16-22`) to skip shortcuts while typing.
- **Canvas (LLD class diagram)** — `src/components/modules/lld/hooks/useCanvasKeyboard.ts`:
  - `Cmd+Z` undo, `Cmd+Y` / `Cmd+Shift+Z` redo
  - `Cmd+A` select all, `Cmd+D` duplicate selected, plus zoom in/out/reset and deselect.

### 4.7 Drag-and-drop wiring

`DesignCanvas.tsx:216-289` handles `onDrop`. It supports two payload kinds via `dataTransfer`:

```tsx
// chaos drop (UI-003)
const chaosRaw = e.dataTransfer.getData("application/architex-chaos");
// component drop
const raw = e.dataTransfer.getData("application/architex-node");
```

For component drops, position is computed via `reactFlowRef.current.screenToFlowPosition({x: e.clientX, y: e.clientY})` (`L266-269`) and a new node is created with `data: { label, category, componentType: data.type, icon, config, metrics: {}, state: "idle" }` (`L271-284`).

For chaos drops (from `ChaosQuickBar`), the closest node within `max(width,height)` pixels is found and `orch.injectChaos(eventTypeId, [closestNodeId])` is called (`L233-251`).

---

## 5. State Management

Zustand stores under `src/stores/**`. The canvas uses **four** of them.

### 5.1 `canvas-store.ts` — nodes, edges, groups, snapshots, annotations

- Persists with `persist` middleware to `localStorage` key `architex-canvas` (`canvas-store.ts:359-367`); `partialize` keeps only `nodes`, `edges`, `groups`.
- `setNodes`, `setEdges`, `addNode`, `addEdge`, `removeNodes`, `removeEdges`, `updateNodeData`, `clearCanvas` all call `pushSnapshot(get())` first (`L136-142`) — so undo/redo traverses every mutation.
- The **UndoManager** is the singleton `canvasUndoManager` (`L62-64`):

  ```ts
  // src/stores/canvas-store.ts:62-64
  export const canvasUndoManager = new UndoManager<CanvasSnapshot>({
    maxEntries: 100,
  });
  ```

  Implementation lives at `src/lib/undo/undo-manager.ts`. The store does *not* use the `zundo` middleware directly — it uses a custom `UndoManager` that snapshots `{nodes, edges, groups}`. (The original task description mentions zundo; the actual implementation is a hand-rolled snapshot manager with a 100-entry cap.)
- **Named snapshots** (`L296-326`) — `pushNamedSnapshot(label, note)` pushes a `NamedCanvasSnapshot` onto an in-memory list capped at 50; `restoreNamedSnapshot(id)` pushes the current state onto undo and replaces from the named snapshot.
- **Annotations** (`L331-349`) — sticky-note / arrow / circle / text. Stored client-side; mirrored to `/api/lld/designs/[id]/annotations` for persistence.
- **Adapter helpers** (`L271-294`) — `getArchitexNodes()` / `setArchitexNodes()` convert between React Flow `Node[]` and the canonical `ArchitexNode[]` (defined under `src/lib/types/architex-node.ts`, adapted via `src/lib/adapters/react-flow-adapter.ts`).
- `activeDesignId` (`L113`) ties the in-memory store to a particular `lld_designs.id` so sync hooks know what to persist against.

### 5.2 `viewport-store.ts` — `{x, y, zoom}` only

`src/stores/viewport-store.ts:1-22`. No persist. Updated from React Flow's `onMoveEnd` callback (`DesignCanvas.tsx:203-208`):

```tsx
const onMoveEnd = useCallback(
  (_, viewport: { x: number; y: number; zoom: number }) => {
    setViewport(viewport);
  },
  [setViewport],
);
```

Read by `BaseNode.tsx` to drive level-of-detail rendering (full / simplified / dot — see ADR-002 §6 at `docs/adr/ADR-002-react-flow-v12.md:62-66`).

### 5.3 `snapshot-store.ts` — `architex-snapshots` (persisted)

`src/stores/snapshot-store.ts:24-76`. A *separate* timeline-style snapshot store wired to `src/lib/versioning/snapshots.ts` for the EvolutionTimeline. Persists `snapshots[]` and `activeSnapshotId` to `localStorage`. Distinct from the in-memory `namedSnapshots` on `canvas-store`.

### 5.4 `ui-store.ts` — panel/dialog visibility

`src/stores/ui-store.ts:54-215`. Tracks `exportDialogOpen`, `importDialogOpen`, `templateGalleryOpen`, `timelineVisible`, `minimapVisible`. Setters at `L183-198`. Persists `timelineVisible` and `minimapVisible` (`L213-216`).

### 5.5 `drill-store.ts` — drill FSM client mirror

`src/stores/drill-store.ts:75-147`. Holds `attemptId`, `variant`, `persona`, `currentStage`, `stageStartedAt`, per-stage `stageProgress` and accumulated `stageDurationsMs`, `interviewerTurns`, `hintLog`, `hintPenaltyTotal`, and the eventual `rubricBreakdown` + `finalScore`.

Notable behavior in `enterStage()` (`L89-104`): it computes `spent = now - stageStartedAt` and *adds* it to the *outgoing* stage's `stageDurationsMs`. This is the heatmap input.

```ts
// src/stores/drill-store.ts:89-104
enterStage: (stage) => {
  const now = Date.now();
  const previous = get();
  const prevStage = previous.currentStage;
  const prevStart = previous.stageStartedAt || now;
  const spent = Math.max(0, now - prevStart);
  set({
    currentStage: stage,
    stageStartedAt: now,
    stageDurationsMs: {
      ...previous.stageDurationsMs,
      [prevStage]: (previous.stageDurationsMs[prevStage] ?? 0) + spent,
    },
  });
},
```

`drill-store` is **not** persisted — it's purely a session-scoped client mirror of server state. The server is the source of truth (`/api/lld/drill-attempts/[id]/resume` rehydrates the client on reload).

### 5.6 Other relevant stores (touched but not detailed here)

- `simulation-store.ts` — orchestrator ref, status, heatmap, trace.
- `editor-store.ts`, `ai-store.ts`, `interview-store.ts`, `progress-store.ts`, `notification-store.ts`, `collaboration-store.ts`, `cross-module-store.ts` — see `src/stores/STATE_ARCHITECTURE.ts` for the contract.

There is **no Dexie integration** in this module's path (the original spec mentions Dexie; only `localStorage` is used in canvas-store). Server persistence flows through the API routes in §9.

---

## 6. Drill Mode Lifecycle

The drill is a 5-stage gated FSM with hint economy, AI-streamed interviewer, and a 6-axis grade. The lifecycle below references real call sites.

### 6.1 The 5 stages

`src/lib/lld/drill-stages.ts:18-23` defines:

```ts
export const STAGE_ORDER: readonly DrillStage[] = [
  "clarify",
  "rubric",
  "canvas",
  "walkthrough",
  "reflection",
];
```

Each stage has a *gate predicate* (`gatePredicateFor()` at `:95`) — the gate must pass before the user can advance. UI components for each stage live under `src/components/modules/lld/drill-mode/stages/`: `ClarifyStage.tsx`, `RubricStage.tsx`, `CanvasStage.tsx`, `WalkthroughStage.tsx`, `ReflectionStage.tsx`. The shell `DrillModeLayout.tsx:185-198` switches between them based on `useDrillStore.currentStage`.

### 6.2 Variants

`src/lib/lld/drill-variants.ts:29-60` has three:

| Variant | hintsAllowed | maxHintPenalty | affectsFSRS | defaultDurationMs |
|---|---|---|---|---|
| `exam` | false | 0 | true | 25 min |
| `timed-mock` | true | 30 | true | 30 min |
| `study` | true | null (unlimited) | false | 60 min (soft) |

`POST /api/lld/drill-attempts` (the start endpoint) accepts both Phase-1 names (`interview`, `guided`, `speed`) and Phase-4 names — see the `PHASE1_TO_PHASE4` map at `src/app/api/lld/drill-attempts/route.ts:16-21`.

### 6.3 API call sequence (happy path)

The exact sequence below is taken from the route handlers and the `DrillModeLayout` / `useDrillInterviewer` / `useDrillStage` / `useDrillHintLadder` hooks.

```
START
   │
   │  POST /api/lld/drill-attempts
   │   body: { problemId, variant, durationLimitMs }
   │   → 201 { attempt: { id, ... } } and inserts row in lld_drill_attempts
   │   → 409 { code: "ACTIVE_DRILL_EXISTS" } if a drill is already active
   │     for this user (partial unique index — see §12)
   │
   ▼
CLARIFY stage (currentStage = "clarify")
   │
   │  Each user prompt:
   │    POST /api/lld/drill-attempts/[id]/turn
   │      body: { content, stage }
   │      → 201 { ok: true, seq }
   │      → also delegates to drill-interviewer/[id]/stream POST
   │      (the /turn route is a thin alias — drill-attempts/[id]/turn/route.ts:9-16)
   │
   │  Then:
   │    GET /api/lld/drill-interviewer/[id]/stream
   │      → SSE: data:{"type":"delta","text":"..."} ... data:{"type":"done"}
   │      → server persists interviewer turn after stream completes
   │
   │  Hint use (timed-mock / study only):
   │    POST /api/lld/drill-attempts/[id]/hint
   │      body: { tier: "nudge" | "guided" | "full-explanation", stage }
   │      → enforces TIER_LADDER (must consume in order, scoped per-stage)
   │      → enforces BUDGET_EXHAUSTED if total penalty would exceed cfg.maxHintPenalty
   │      → 403 { code: "EXAM_MODE" } if !cfg.hintsAllowed
   │
   ▼  PATCH /api/lld/drill-attempts/[id]/stage  body: { targetStage: "rubric", progress }
   │  → enforces canAdvance(current, progress); writes stages[current].durationMs
RUBRIC stage  (... same pattern ...)
   ▼
CANVAS stage  — user builds the design; canvasState is auto-PATCH'd onto the attempt
   ▼
WALKTHROUGH stage
   ▼
REFLECTION stage
   │
   │  POST /api/lld/drill-attempts/[id]/grade
   │    body: { walkthroughText, selfGrade }
   │    → loads canvasState + interviewer turns
   │    → calls gradeDrillAttempt() (ai-preferred mode) → 6-axis RubricBreakdown
   │    → applies hintPenalty (capped per variant); stores submittedAt + gradeScore
   │    → 200 { rubric, finalScore, hintPenalty, band }
   │    → idempotent: re-submitting returns { alreadyGraded: true }
   │
   ▼
POST /api/lld/drill-attempts/[id]/postmortem
   → builds PostmortemInput from the now-graded attempt
   → calls Claude (cached 24h via cacheKey "postmortem:<id>")
   → falls back to deterministic rubric-derived postmortem if API key absent
   → idempotent: returns stored postmortem on second call
```

### 6.4 Pause / Resume / Abandon

Lifecycle PATCH endpoint: `src/app/api/lld/drill-attempts/[id]/route.ts:14-95`. Valid `action` values:

- `heartbeat` — touches `lastActivityAt` only.
- `pause` — sets `pausedAt = now`; optional `elapsedBeforePauseMs`.
- `resume` — clears `pausedAt`. (See also the richer `POST .../resume/route.ts` which extends `startedStageAt` so timing accounting ignores pause duration: `src/app/api/lld/drill-attempts/[id]/resume/route.ts:55-71`.)
- `submit` — sets `submittedAt = now` plus optional `gradeScore`, `gradeBreakdown`, `canvasState`.
- `abandon` — sets `abandonedAt = now`. Also emits a trace log (see §12).

Auto-abandon: `GET /api/lld/drill-attempts/active` (`src/app/api/lld/drill-attempts/active/route.ts:13-37`) auto-abandons drills idle for **>30 minutes** (`STALE_THRESHOLD_MS = 30 * 60 * 1000`).

### 6.5 Resume rehydration

`POST /api/lld/drill-attempts/[id]/resume` (`src/app/api/lld/drill-attempts/[id]/resume/route.ts:18-92`) returns:

```ts
{
  attempt: { id, problemId, variant, currentStage, stages, canvasState,
             hintLog, durationLimitMs, elapsedBeforePauseMs },
  turns,                  // all interviewer turns, ordered by seq
  resumedAt: ISO string,
}
```

The `DrillResumePrompt` component (`src/components/modules/lld/drill-mode/DrillResumePrompt.tsx:5-31`) renders a Resume / Abandon choice when an active drill is detected on mount.

### 6.6 Submit bar wiring

`src/components/modules/lld/modes/DrillModeLayout.tsx:218-240` — `DrillSubmitBar` calls grade / pause / abandon directly:

```tsx
<DrillSubmitBar
  onSubmit={() => { void fetch(`/api/lld/drill-attempts/${attemptId}/grade`,
    { method: "POST", ..., body: JSON.stringify({ selfGrade: 3 }) }); }}
  onPause={() => { void fetch(`/api/lld/drill-attempts/${attemptId}`,
    { method: "PATCH", ..., body: JSON.stringify({ action: "pause" }) }); }}
  onAbandon={() => { void fetch(`/api/lld/drill-attempts/${attemptId}`,
    { method: "PATCH", ..., body: JSON.stringify({ action: "abandon" }) }); }}
/>
```

---

## 7. AI Drill Interviewer

The streaming interviewer endpoint is split into POST (persist user turn) + GET (SSE the reply).

### 7.1 Endpoint contract

`src/app/api/lld/drill-interviewer/[id]/stream/route.ts:1-13`:

```
POST /api/lld/drill-interviewer/[id]/stream
  Body: { content: string, stage: DrillStage }
  Persists user turn. Returns { ok: true, seq: number }.

GET  /api/lld/drill-interviewer/[id]/stream
  SSE stream of interviewer reply:
    data: {"type":"delta","text":"..."}
    data: {"type":"done"}
    data: {"type":"error","error":"..."}
```

### 7.2 POST: persist user turn

`route.ts:30-101`:

1. Auth via `requireAuth()` + `resolveUserId()` (same Clerk → users.id pattern as the rest of the LLD APIs).
2. Verifies the attempt is active (not submitted, not abandoned) — `L55-67`.
3. Looks up the largest existing `seq` for the attempt and appends `seq+1`:

   ```ts
   // L74-90
   const [prev] = await db
     .select({ seq: lldDrillInterviewerTurns.seq })
     .from(lldDrillInterviewerTurns)
     .where(eq(lldDrillInterviewerTurns.attemptId, id))
     .orderBy(desc(lldDrillInterviewerTurns.seq))
     .limit(1);
   const seq = (prev?.seq ?? -1) + 1;
   await db.insert(lldDrillInterviewerTurns).values({
     attemptId: id, role: "user", stage, persona: "generic", seq, content,
   });
   ```
4. Bumps `lastActivityAt` on the parent `lld_drill_attempts`.

### 7.3 GET: stream interviewer reply

`route.ts:103-245`:

1. Validates the attempt is active.
2. Loads the full turn history (ASC by `seq`) — `L137-146`.
3. `parseTurnHistory()` (`@/lib/ai/interviewer-persona`) converts rows to `InterviewerTurn[]`.
4. `buildInterviewerRequest({ persona, stage, problemTitle, history })` constructs the model request — system prompt is per-persona and stage-aware.
5. The persona is read from `attempt.gradeBreakdown.persona` (defaulting to `"generic"`) — `L157-159`. The current schema reuses `gradeBreakdown` (a JSONB column) as the persona-store-of-record because there's no dedicated column on `lld_drill_attempts`.
6. Streams via `ReadableStream`. The current implementation does **not** stream token-by-token — it issues a single `client.call(...)` and then emits a single `{type:"delta", text: fullReply}` followed by `{type:"done"}` (`L191-207`). The contract leaves room for true delta streaming.
7. After the stream completes, the interviewer turn is appended to `lld_drill_interviewer_turns` (next `seq+1`) — `L209-225`.
8. If `client.isConfigured()` is false (no `ANTHROPIC_API_KEY`), the stream emits a helpful "configure your key in Settings > AI" string — `L193-198`.

### 7.4 Personas

`src/lib/ai/interviewer-prompts.ts:12-22`:

```ts
export type InterviewerPersona =
  | "generic" | "amazon" | "google" | "meta" | "stripe" | "uber";

export const INTERVIEWER_PERSONAS: readonly InterviewerPersona[] = [...];
```

Each persona has its own system prompt (firm voice, tone, evaluation focus, rubric shorthand) and a stage-specific opener via `stageOpenerFor(persona, stage)` (`:119`).

### 7.5 Hint API

`src/app/api/lld/drill-attempts/[id]/hint/route.ts:14-174`. Key checks in order:

1. **Tier set check** — only `nudge | guided | full-explanation` (`L34-40, 58-65`).
2. **Variant gate** — `403 { code: "EXAM_MODE" }` if `!cfg.hintsAllowed` (`L92-97`).
3. **Tier ladder** — must consume tiers in order, scoped per-stage:

   ```ts
   // L100-114
   const stageLog = hintLog.filter((h) => h.stage === stage);
   const highestIdx = stageLog.reduce(
     (max, h) => Math.max(max, TIER_ORDER.indexOf(h.tier)),
     -1,
   );
   if (TIER_ORDER.indexOf(tier) !== highestIdx + 1) {
     return NextResponse.json(
       { error: "...", code: "TIER_LADDER" }, { status: 409 },
     );
   }
   ```
4. **Budget gate** — `409 { code: "BUDGET_EXHAUSTED" }` if total penalty would exceed `cfg.maxHintPenalty` (`L117-126`).
5. Generates content via `generateHint(...)` (`@/lib/ai/hint-system`).
6. Atomically appends to `hintLog` via JSONB concatenation:

   ```sql
   -- src/app/api/lld/drill-attempts/[id]/hint/route.ts:147-153
   COALESCE(hint_log, '[]'::jsonb) || '<new entry>'::jsonb
   ```

Tier-to-penalty map (`L33-37`): `nudge → 3`, `guided → 10`, `full-explanation → 20`. Penalty is `0` for `study` variant (free hints).

### 7.6 Postmortem generation

`src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:25-174`:

- Requires the drill to be **submitted** (`409` otherwise — `L51-58`).
- Idempotent: returns stored postmortem if `attempt.postmortem` is non-null (`L60-63`).
- Builds a structured `PostmortemInput` from the attempt: persona, variant, rubric, finalScore, per-stage durations, canvas summary, expected canonical patterns/tradeoffs (from `getCanonicalFor(problemId)`).
- Calls `ClaudeClient` with `cacheKey: "postmortem:<id>"` and `cacheTtlMs: 24h` (`L124-126`).
- On parse error or missing API key, falls back to a deterministic **rubric-derived** postmortem that pulls strengths (axes scoring ≥75) and gaps (axes <60) (`L130-156`).

### 7.7 The other AI-touching route

`POST /api/lld/explain-inline` (`src/app/api/lld/explain-inline/route.ts`) — not part of drill, but in scope. Renders 2-3 paragraph plain-English explanations of selected lesson passages via Claude Haiku. Rate-limited per user (30/hr) by counting `aiUsage` rows where `purpose = "lld-explain-inline"` (`L53-67`). Has a `fallbackExplanation()` (`L37-51`) when no API key is set, plus prompt-injection sanitization via `sanitizeUserInput()`.

`POST /api/lld/ai/suggest-nodes` — token-bucket rate-limited (20 per hour, refill 1 per 3 min) AI suggestions for next nodes given current `nodes/edges/intent` (`src/app/api/lld/ai/suggest-nodes/route.ts:13-78`).

---

## 8. Database Schema

All eight LLD tables and their lifecycles. Every table is exported from `src/db/schema/index.ts:48-94` and has a corresponding `<table>Relations` at `:117-124`.

### 8.1 `lld_designs` — saved canvas (Build mode)

`src/db/schema/lld-designs.ts:25-59`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `defaultRandom()` |
| `user_id` | uuid → `users.id` | cascade delete |
| `name` | varchar(160) | display name |
| `slug` | varchar(160) | composite-unique with user_id |
| `description` | text | nullable |
| `template_id` | uuid | optional source template (no FK) |
| `status` | varchar(20) | `draft` \| `active` \| `archived` (default `active`) |
| `is_pinned` | boolean | default false |
| `created_at`, `updated_at`, `last_opened_at` | timestamptz | all default now() |

Indexes: `lld_designs_user_slug_idx` (unique on `user_id, slug`), `lld_designs_user_updated_idx` (`user_id, updated_at`), `lld_designs_user_status_idx` (`user_id, status`).

Lifecycle: `draft` → `active` → `archived`. `GET /api/lld/designs/[id]` bumps `last_opened_at` on every fetch (`src/app/api/lld/designs/[id]/route.ts:46-50`).

### 8.2 `lld_design_snapshots` — append-only history

`src/db/schema/lld-design-snapshots.ts:26-55`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `design_id` | uuid → `lld_designs.id` | cascade delete |
| `user_id` | uuid → `users.id` | cascade delete |
| `kind` | varchar(20) | `auto` \| `named` (default `auto`) |
| `label`, `note` | varchar(200), text | nullable |
| `canvas_state` | jsonb | full React Flow node/edge JSON |
| `node_count`, `edge_count` | integer | denormalized counters |
| `created_at` | timestamptz | append-only |

Indexes: `lld_design_snapshots_design_idx` (`design_id, created_at`), `lld_design_snapshots_user_kind_idx` (`user_id, kind`).

Lifecycle: write-once. The schema doc (`L11`) explicitly says "Snapshots are append-only".

### 8.3 `lld_design_annotations` — floating notes layer

`src/db/schema/lld-design-annotations.ts:26-57`.

| Column | Type | Notes |
|---|---|---|
| `id`, `design_id`, `user_id` | uuid | cascade delete on parent |
| `kind` | varchar(30) | `sticky-note` \| `arrow` \| `circle` \| `text` |
| `node_id` | varchar(100) | nullable; null = floating, else anchored to a canvas node |
| `x`, `y` | real | canvas coords |
| `body` | text | default `""` |
| `color` | varchar(20) | default `"amber"` |
| `meta` | jsonb | shape/size options, default `'{}'` |

Indexes: `lld_design_annotations_design_idx`, `lld_design_annotations_node_idx` (`design_id, node_id`).

### 8.4 `lld_drill_attempts` — drill session row (the heart of drill mode)

`src/db/schema/lld-drill-attempts.ts:28-89`. Phase 4 expanded the original Phase 1 row.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → `users.id` | cascade delete |
| `problem_id` | varchar(100) | not a FK — string slug |
| `drill_mode` | varchar(20) | Phase-1 alias kept for compat |
| `variant` | varchar(20) | Phase-4: `exam` \| `timed-mock` \| `study` |
| `started_at`, `last_activity_at` | timestamptz | `defaultNow()` |
| `paused_at`, `submitted_at`, `abandoned_at` | timestamptz | lifecycle markers |
| `current_stage` | varchar(20) | one of the 5 `DrillStage` values |
| `started_stage_at` | timestamptz | for stage timing heatmap |
| `stages` | jsonb | `{[stage]: {durationMs, progress}}`, default `'{}'` |
| `elapsed_before_pause_ms` | integer | default 0 |
| `duration_limit_ms` | integer | not null |
| `canvas_state` | jsonb | nullable; current canvas for canvas/walkthrough stages |
| `hints_used` | jsonb | Phase-3 legacy, default `'[]'` |
| `hint_log` | jsonb | Phase-4 rich log, default `'[]'` |
| `grade_score` | real | populated on submit |
| `grade_breakdown` | jsonb | aggregated final grade incl. `hintPenalty` |
| `rubric_breakdown` | jsonb | 6-axis grade output |
| `postmortem` | jsonb | AI postmortem JSON |

**Critical index** (`L83-85`):

```ts
uniqueIndex("one_active_drill_per_user")
  .on(t.userId)
  .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
```

This *partial unique* index enforces "one active drill per user". Insertion of a new row while the user already has a non-submitted, non-abandoned row will violate the index and raise SQLSTATE 23505 — see §12.

Other indexes: `drill_history_idx` (`user_id, submitted_at`), `drill_stage_idx` (`user_id, current_stage`).

Lifecycle: `started → (paused ↔ active) → submitted | abandoned`. `submitted` and `abandoned` are mutually exclusive terminal states. `submitted_at` triggers grading/postmortem eligibility.

### 8.5 `lld_drill_interviewer_turns` — chat log

`src/db/schema/lld-drill-interviewer-turns.ts:20-52`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attempt_id` | uuid → `lld_drill_attempts.id` | cascade delete |
| `role` | varchar(20) | `user` \| `interviewer` \| `system` |
| `stage` | varchar(20) | the drill stage at time of turn |
| `persona` | varchar(20) | `generic` \| `amazon` \| `google` \| `meta` \| `stripe` \| `uber` |
| `seq` | integer | per-attempt monotonic, starts at 0 |
| `content` | text | turn body |
| `metadata` | jsonb | optional: token counts, model, latency, cost |
| `created_at` | timestamptz | |

Index: `drill_turn_attempt_seq_idx` (`attempt_id, seq`).

### 8.6 `lld_bookmarks` — heading-anchored notes

`src/db/schema/lld-bookmarks.ts:24-60`.

| Column | Type | Notes |
|---|---|---|
| `id`, `user_id` | uuid | cascade delete |
| `pattern_slug` | varchar(100) | e.g. `singleton` |
| `section_id` | varchar(30) | one of the 8 lesson sections |
| `anchor_id` | varchar(200) | stable slug from MDX frontmatter |
| `anchor_label` | varchar(500) | cached heading text |
| `note` | text | optional, max ~10k |

Indexes: `lld_bookmarks_user_anchor_idx` (unique `user_id, pattern_slug, anchor_id`), `lld_bookmarks_user_recent_idx` (`user_id, created_at`).

The unique index makes `POST /api/lld/bookmarks` a *toggle*: if a row exists, it's deleted (`src/app/api/lld/bookmarks/route.ts:96-114`).

### 8.7 `lld_concept_reads` — append-only impression log

`src/db/schema/lld-concept-reads.ts:21-47`.

| Column | Type | Notes |
|---|---|---|
| `id`, `user_id` | uuid | cascade delete |
| `concept_id` | varchar(100) | from concept-graph (e.g. `lazy-init`) |
| `pattern_slug` | varchar(100) | where the concept was surfaced |
| `section_id` | varchar(30) | which of the 8 sections |
| `read_at` | timestamptz | default now() |

Indexes: `lld_concept_reads_user_concept_idx` (`user_id, concept_id, read_at`), `lld_concept_reads_user_recent_idx` (`user_id, read_at`).

Schema comment (`L8-10`): "Append-only — we do not update existing rows. Keep rows small, index only the two query shapes we support".

### 8.8 `lld_learn_progress` — section-scroll state per (user, pattern)

`src/db/schema/lld-learn-progress.ts:47-98`. Unique `(user_id, pattern_slug)`.

| Column | Type | Notes |
|---|---|---|
| `id`, `user_id` | uuid | cascade delete |
| `pattern_slug` | varchar(100) | |
| `section_progress` | jsonb | `Record<LearnSectionId, {scrollDepth, firstSeenAt, completedAt}>` |
| `last_scroll_y`, `active_section_id` | integer, varchar(30) | resume hints |
| `completed_section_count` | integer | denormalized count |
| `checkpoint_stats` | jsonb | `{[sectionId]: {attempts, correct}}` |
| `completed_at` | timestamptz | nullable; stamped when all 8 sections reach completedAt != null |
| `visit_count` | integer | bumped on `bumpVisit: true` |
| `created_at`, `updated_at` | timestamptz | $onUpdate(now()) |

The 8 section IDs (`L26-34`):

```ts
export type LearnSectionId =
  | "itch" | "definition" | "mechanism" | "anatomy"
  | "numbers" | "uses" | "failure_modes" | "checkpoints";
```

`completedAt` doubles as the FSRS seed for the spaced-repetition scheduler.

### 8.9 `lld_templates_library` — curated blueprint catalog

`src/db/schema/lld-templates-library.ts:27-60`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar(100) | unique |
| `name` | varchar(160) | |
| `description` | text | |
| `category` | varchar(40) | one of: creational, structural, behavioral, architecture, microservices, data, ai |
| `difficulty` | varchar(20) | beginner / intermediate / advanced |
| `tags`, `pattern_ids` | jsonb | string arrays |
| `canvas_state` | jsonb | full nodes/edges payload |
| `thumbnail_svg` | text | nullable inline SVG |
| `is_curated` | boolean | default true |
| `sort_order` | integer | for tab ordering |

Indexes: `lld_templates_library_slug_idx` (unique), `lld_templates_library_category_idx` (`category, sort_order`).

Public — no `user_id` (templates are global). Schema header (`L4-7`) says it's "the authoritative Template Loader source".

---

## 9. API Surface

Every `/api/lld/*` route, with method, params, response, auth, and key SQL. All routes use the App Router convention (`src/app/api/lld/**/route.ts`) and Drizzle for SQL.

| # | Route | Method | Params / Body | Returns | Auth | Key SQL / Notes |
|---|---|---|---|---|---|---|
| 1 | `/api/lld/designs` | POST | body: `{name, description?, templateId?}` | `201 {design}` | Clerk | INSERT `lld_designs (user_id, name, slug=slugify(name)+"-"+rand6, description, template_id)`. `route.ts:19-67` |
| 2 | `/api/lld/designs` | GET | `?status=active|archived` | `{designs[]}` | Clerk | SELECT WHERE `user_id` AND `status`, ORDER BY `last_opened_at DESC` LIMIT 100. `route.ts:69-104` |
| 3 | `/api/lld/designs/[id]` | GET | path: `id` | `{design}` | Clerk | SELECT scoped to owner; UPDATE `last_opened_at = now()`. `:26-63` |
| 4 | `/api/lld/designs/[id]` | PATCH | body: `{name?, description?, status?, isPinned?}` | `{design}` | Clerk | UPDATE scoped to owner. `:65-117` |
| 5 | `/api/lld/designs/[id]` | DELETE | path: `id` | `{ok: true}` | Clerk | DELETE scoped to owner; cascades to snapshots + annotations. `:119-148` |
| 6 | `/api/lld/designs/[id]/snapshots` | POST | body: `{canvasState, label?, note?, kind?, nodeCount?, edgeCount?}` | `201 {snapshot}` | Clerk | Verifies design ownership, INSERTs `lld_design_snapshots`, then UPDATEs parent `updated_at`. `route.ts:11-82` |
| 7 | `/api/lld/designs/[id]/snapshots` | GET | path: `id` | `{snapshots[]}` | Clerk | SELECT WHERE `design_id` AND `user_id` ORDER BY `created_at DESC` LIMIT 100. `:84-120` |
| 8 | `/api/lld/designs/[id]/annotations` | GET | path: `id` | `{annotations[]}` | Clerk | SELECT WHERE design+user, LIMIT 500. `:13-47` |
| 9 | `/api/lld/designs/[id]/annotations` | POST | body: `{kind?, nodeId?, x?, y?, body?, color?, meta?}` | `201 {annotation}` | Clerk | Verifies ownership, INSERT. Default kind = `sticky-note`. `:49-110` |
| 10 | `/api/lld/drill-attempts` | POST | body: `{problemId, variant|drillMode, durationLimitMs}` | `201 {attempt}` or `409 {code: ACTIVE_DRILL_EXISTS}` | Clerk | INSERT; on SQLSTATE 23505 / unique violation against `one_active_drill_per_user`, returns 409 (see §12). `route.ts:23-125` |
| 11 | `/api/lld/drill-attempts` | GET | `?status=completed|abandoned` | `{attempts[]}` | Clerk | SELECT WHERE `user_id` (+ optional `submitted_at IS NOT NULL` / `abandoned_at IS NOT NULL`) LIMIT 100. `route.ts:127-166` |
| 12 | `/api/lld/drill-attempts/active` | GET | none | `{active}` | Clerk | First UPDATE auto-abandons drills with `last_activity_at < now()-30min`, then SELECTs the surviving active row. `route.ts:15-63` |
| 13 | `/api/lld/drill-attempts/[id]` | PATCH | body: `{action: "heartbeat"|"pause"|"resume"|"submit"|"abandon", canvasState?, gradeScore?, gradeBreakdown?, elapsedBeforePauseMs?}` | `{attempt}` | Clerk | UPDATE scoped to owner. Logs trace headers on `abandon` (see §12). `route.ts:14-127` |
| 14 | `/api/lld/drill-attempts/[id]/turn` | POST | body: `{content, stage}` | `201 {ok, seq}` | Clerk | Thin alias — forwards to `drill-interviewer/[id]/stream POST`. `route.ts:9-16` |
| 15 | `/api/lld/drill-attempts/[id]/grade` | POST | body: `{walkthroughText?, selfGrade?}` | `{rubric, finalScore, hintPenalty, band}` or `{alreadyGraded:true, ...}` | Clerk | Idempotent (returns stored if `submittedAt`); 409 if `abandoned_at`; calls `gradeDrillAttempt(...)` then UPDATE attempt with `submittedAt`, `gradeScore`, `gradeBreakdown`, `rubricBreakdown`. `route.ts:22-161` |
| 16 | `/api/lld/drill-attempts/[id]/stage` | PATCH | body: `{targetStage, progress}` | `{ok, currentStage, stages}` | Clerk | Validates `targetStage` is `nextStage(current)` or `previousStage(current)`. If advance: `canAdvance(current, progress)` must hold. UPDATE adds elapsed to outgoing stage's `durationMs`. `route.ts:32-149` |
| 17 | `/api/lld/drill-attempts/[id]/hint` | POST | body: `{tier, stage}` | `{content, followUp, tier, penalty, creditCost}` | Clerk | Variant-gated (`EXAM_MODE`), tier-ladder enforced (`TIER_LADDER`), budget-capped (`BUDGET_EXHAUSTED`). Atomic JSONB append `hint_log = COALESCE(hint_log, '[]') \|\| <new>`. `route.ts:41-174` |
| 18 | `/api/lld/drill-attempts/[id]/postmortem` | POST | none | `{postmortem}` or `{postmortem, cached:true}` | Clerk | Requires `submittedAt`; idempotent; calls Claude with cacheKey `postmortem:<id>`, ttl 24h. Falls back to deterministic version when API not configured. `route.ts:25-174` |
| 19 | `/api/lld/drill-attempts/[id]/resume` | POST | none | `{attempt, turns, resumedAt}` | Clerk | Clears `pausedAt`, extends `startedStageAt` by paused duration. Returns full state for client rehydration. `route.ts:18-104` |
| 20 | `/api/lld/drill-interviewer/[id]/stream` | POST | body: `{content, stage}` | `201 {ok, seq}` | Clerk | Persists user turn at `seq = max(seq) + 1`. `route.ts:30-101` |
| 21 | `/api/lld/drill-interviewer/[id]/stream` | GET | none | `text/event-stream` of `{type:"delta", text}` … `{type:"done"}` | Clerk | Loads full turn history, calls Claude via `ClaudeClient.getInstance()`, persists interviewer reply turn. `route.ts:103-245` |
| 22 | `/api/lld/templates-library` | GET | `?category=...&difficulty=...&q=...` | `{templates[]}` | **None** | Public; SELECT with optional filters; cached `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=86400`. `route.ts:28-81` |
| 23 | `/api/lld/lessons/[slug]` | GET | path: `slug` | `{payload}` or `{payload: null}` | None | Calls `loadLesson(slug)` against `module_content` (`moduleId="lld", contentType="lesson"`). `route.ts:11-33` |
| 24 | `/api/lld/learn-progress` | GET | none | `{rows[]}` | Clerk | Compact list of lesson progress for sidebar. ORDER BY `updated_at DESC` LIMIT 500. `route.ts:13-46` |
| 25 | `/api/lld/learn-progress/[patternSlug]` | GET | path: `patternSlug` | `{progress}` or `{progress: null}` | Clerk | SELECT row by composite unique. `route.ts:62-107` |
| 26 | `/api/lld/learn-progress/[patternSlug]` | PATCH | body: `{sectionProgress?, activeSectionId?, lastScrollY?, checkpointStats?, bumpVisit?}` | `{progress}` | Clerk | UPSERT (`onConflictDoUpdate` on the `(user_id, pattern_slug)` index). Stamps `completed_at` if all 8 sections done. `route.ts:109-235` |
| 27 | `/api/lld/bookmarks` | GET | `?patternSlug=` | `{bookmarks[]}` | Clerk | LIMIT 500 ORDER BY `created_at DESC`. `route.ts:18-56` |
| 28 | `/api/lld/bookmarks` | POST | body: `{patternSlug, sectionId, anchorId, anchorLabel, note?}` | `201 {toggled:"on", bookmark}` or `{toggled:"off", bookmark}` | Clerk | Toggle: existing row → DELETE; missing → INSERT. `route.ts:58-141` |
| 29 | `/api/lld/bookmarks/[id]` | PATCH | body: `{note?}` | `{bookmark}` | Clerk | UPDATE note. `route.ts:11-51` |
| 30 | `/api/lld/bookmarks/[id]` | DELETE | path: `id` | `{deleted}` | Clerk | hard-delete. `route.ts:53-84` |
| 31 | `/api/lld/concept-reads` | POST | body: `{conceptId, patternSlug, sectionId}` | `201 {read}` | Clerk | INSERT into append-only log. `route.ts:16-63` |
| 32 | `/api/lld/explain-inline` | POST | body: `{selection, patternSlug, sectionId, sectionRaw}` | `{explanation, isAI}` | Clerk (optional — see route) | Rate-limited 30/hr via `aiUsage` count; sanitizes input via `sanitizeUserInput()`; deterministic fallback when no API key. `route.ts:84-218` |
| 33 | `/api/lld/ai/suggest-nodes` | POST | body: `{nodes[], edges[], intent?}` | `{suggestions[]}` | Clerk | Token-bucket rate limit (20/hr/user, 1 token / 3 min). `429` returns `X-RateLimit-Reset`. `route.ts:27-78` |

Auth common pattern (used by all auth'd routes):

```ts
const clerkId = await requireAuth();
const userId = await resolveUserId(clerkId);
if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });
```

`requireAuth()` throws `Error("Unauthorized")` on missing session, caught in each route's outer try/catch and turned into a `401`.

---

## 10. Templates & Seeded Content

There are *two* template surfaces:

### 10.1 File-based blueprints (in-bundle)

Under `src/lib/templates/` and `templates/system-design/`:

- **55 system-design JSONs** in `templates/system-design/*.json` — older catalog imported statically into the bundle by `src/lib/templates/index.ts:3-58`. Each file contains `{id, name, description, difficulty, category, tags, nodes[], edges[]}` (e.g. `templates/system-design/url-analytics.json:1-40`).
- **15 v2 "Solution Blueprints"** in `src/lib/templates/blueprints/*.json` — newer catalog with full simulation metadata + design rationale, imported at `index.ts:60-74`.

These power the in-bundle `template-gallery.tsx` (`src/components/shared/template-gallery.tsx:5-43`) which reads from `SYSTEM_DESIGN_TEMPLATES` exported by `@/lib/templates`. Tab grouping uses `template.category: "classic" | "modern" | "infrastructure" | "advanced"`.

### 10.2 DB-driven templates library (`lld_templates_library`)

The DB version is the **authoritative Template Loader source** (per the schema header at `src/db/schema/lld-templates-library.ts:4`). `GET /api/lld/templates-library` is the only entry point; it's public, cached for 5-10 minutes, and is consumed by Build mode's "Template Loader" dock.

The categories the DB version uses (`route.ts:17-25`) are *different* from the in-bundle ones: `creational | structural | behavioral | architecture | microservices | data | ai`.

Seeding lives at `src/db/seeds/lld-templates-library.ts` (referenced in the schema docstring at `L7`). Seed strategy per `LLD_CANVAS_PLAYBOOK.md §17`:

```bash
# from architex/
pnpm db:seed -- --module=lld
# Uses DELETE + INSERT (not upsert) to guarantee content updates.
# Client TanStack Query staleTime is 5 min; clear site data after seeding.
```

---

## 11. Snapshot & Annotation System

There are *three* snapshot mechanisms in different places — easy to confuse.

### 11.1 In-memory undo (canvas-store)

Singleton `canvasUndoManager` (`src/stores/canvas-store.ts:62-64`). Every mutating action calls `pushSnapshot(get())` before applying the change. Capacity 100 entries. Snapshot shape: `{nodes, edges, groups}`.

### 11.2 Named in-memory snapshots (canvas-store)

`pushNamedSnapshot(label, note)` / `restoreNamedSnapshot(id)` / `deleteNamedSnapshot(id)` at `canvas-store.ts:296-326`. Capped at 50 entries. Stored in the `namedSnapshots: NamedCanvasSnapshot[]` field which has shape:

```ts
// canvas-store.ts:37-45
export interface NamedCanvasSnapshot {
  id: string;
  label: string;
  note: string | null;
  createdAt: number;
  nodes: Node[];
  edges: Edge[];
  groups: NodeGroup[];
}
```

These are **not** persisted to localStorage (the persist middleware's `partialize` at `:361-365` only keeps `nodes`, `edges`, `groups`).

### 11.3 Server-side timeline snapshots (snapshot-store + `lld_design_snapshots`)

The `snapshot-store.ts` writes through `createSnapshot()` from `@/lib/versioning/snapshots` and persists `{snapshots, activeSnapshotId}` to `localStorage` key `architex-snapshots`. This drives the EvolutionTimeline.

For **server persistence**, the snapshots flow through `POST /api/lld/designs/[id]/snapshots` which writes a row to `lld_design_snapshots`. The `kind` discriminator separates auto-saves (silent periodic) from named milestones. The schema docstring (`src/db/schema/lld-design-snapshots.ts:6-11`) explicitly says: "Every explicit save (name, Cmd+S, auto-save tick) and every named snapshot writes a new row. Snapshots are append-only; undo/redo mid-session uses the in-memory UndoManager, while the user-visible 'Snapshots' drawer reads from this table."

So the architecture is layered:
- Mid-session undo → `canvasUndoManager` (in-memory only).
- Snapshots drawer / cross-device → `lld_design_snapshots` (DB).
- Live "Save snapshot" button → both (named entry in canvas-store + new row).

Auto-save cadence is implemented client-side and writes via the same `POST .../snapshots` endpoint with `kind: "auto"`.

### 11.4 Annotations

Two layers as well:
- **In-memory** — `canvas-store.annotations` (`L331-349`) — sticky-notes, arrows, circles, text.
- **Server-side** — `lld_design_annotations` table, mirrored via `GET / POST /api/lld/designs/[id]/annotations`.

Each annotation either anchors to a node (`nodeId` set, position relative to that node) or is "floating" at canvas (x, y) coordinates (`nodeId` null). The `kind` discriminates rendering and the `meta` JSONB carries shape/size options.

---

## 12. Quirks & Gotchas

This is the section the recent commit history is most focused on. The git log shows iterative fixes around the drill 409 / abandon flow:

### 12.1 The 409 "ACTIVE_DRILL_EXISTS" / recoverable inline path

The unique partial index `one_active_drill_per_user` (`src/db/schema/lld-drill-attempts.ts:83-85`) raises a Postgres unique-violation when a user tries to start a drill while one is already active. The original implementation matched the error by **substring** in `error.message`, which proved fragile because Drizzle / `pg` wrap errors at multiple levels. Commit `59431e2` fixed this by switching to **SQLSTATE detection**:

```ts
// src/app/api/lld/drill-attempts/route.ts:90-114
const err = error as {
  code?: string; message?: string; constraint?: string;
  cause?: { code?: string; constraint?: string };
};
const code = err.code ?? err.cause?.code;
const constraint = err.constraint ?? err.cause?.constraint ?? "";
const msg = err.message ?? "";
if (
  code === "23505" ||
  constraint.includes("one_active_drill_per_user") ||
  msg.includes("one_active_drill_per_user") ||
  msg.toLowerCase().includes("duplicate key value")
) {
  return NextResponse.json(
    {
      error: "A drill is already active. Submit or abandon it first.",
      code: "ACTIVE_DRILL_EXISTS",
    },
    { status: 409 },
  );
}
```

The client (`src/components/modules/lld/modes/DrillModeLayout.tsx:63-69`) inspects `res.status === 409` and surfaces a recoverable inline UI (commit `3e6100d`):

```tsx
{activeConflict ? (
  <div className="mt-4 rounded border border-amber-500/40 bg-amber-900/20 ...">
    <div>{activeConflict}</div>
    <div className="mt-2 flex gap-2">
      <button onClick={onAbandonActive} ...>
        Abandon &amp; start new
      </button>
    </div>
  </div>
) : null}
```

`onAbandonActive` (`L87-110`) does:
1. `GET /api/lld/drill-attempts/active` to find the active drill's id.
2. `PATCH /api/lld/drill-attempts/<id>` with `action: "abandon"`.
3. Retry `onStart()`.

### 12.2 Abandon trace-logging (still in tree)

Commit `904f751` added a **diagnostic trace log** for the abandon PATCH because some drills were abandoning themselves silently:

```ts
// src/app/api/lld/drill-attempts/[id]/route.ts:54-61
// TEMP: trace who is auto-abandoning drills
if (action === "abandon") {
  const ua = request.headers.get("user-agent") ?? "unknown";
  const referer = request.headers.get("referer") ?? "unknown";
  console.log(
    `[DRILL-ABANDON-TRACE] id=${id} userAgent=${ua} referer=${referer}`,
  );
}
```

The comment marks it `TEMP`. It is still present at the time of writing.

### 12.3 Confirm-before-abandon (commit `47b3d21`)

The `DrillSubmitBar.onAbandon` callback fires immediately. The earlier commit added an explicit confirmation dialog before calling the PATCH — implemented inside `DrillSubmitBar.tsx`. (Specific UI not quoted here; the commit message documents the behavior.)

### 12.4 Auto-abandon at 30 minutes

`GET /api/lld/drill-attempts/active` runs an UPDATE that abandons any drill where `last_activity_at < now() - 30min` BEFORE returning the active row. This means a user who closes their tab and returns 31 minutes later will see "no active drill" — their drill was abandoned by the lookup itself, not by an explicit user action. (`src/app/api/lld/drill-attempts/active/route.ts:13-37`.)

### 12.5 Phase-1 ↔ Phase-4 variant aliasing

`POST /api/lld/drill-attempts` accepts both old (`interview`, `guided`, `speed`) and new (`exam`, `timed-mock`, `study`) names and normalises old → new (`route.ts:15-21, 53-55`). The DB column also retains `drill_mode` for compat alongside the new `variant` column.

### 12.6 React Flow edge re-application after node init

A subtle bug: when nodes and edges are restored simultaneously from `localStorage`, edges with `sourceHandle` / `targetHandle` are silently dropped because the handles haven't yet been registered in the DOM. `DesignCanvas.tsx:91-107` works around this with `useNodesInitialized`:

```tsx
const nodesInitialized = useNodesInitialized();
const edgesReapplied = useRef(false);
useEffect(() => {
  if (nodesInitialized && !edgesReapplied.current) {
    edgesReapplied.current = true;
    const currentEdges = useCanvasStore.getState().edges;
    if (currentEdges.some((e) => e.sourceHandle || e.targetHandle)) {
      useCanvasStore.setState({ edges: [...currentEdges] });
    }
  }
  if (!nodesInitialized) {
    edgesReapplied.current = false;
  }
}, [nodesInitialized]);
```

### 12.7 Postmortem persona stored under `gradeBreakdown.persona`

There's no dedicated `persona` column on `lld_drill_attempts`. Both the streaming endpoint (`drill-interviewer/[id]/stream/route.ts:157-159`) and the postmortem endpoint (`postmortem/route.ts:88-89`) read the persona out of `attempt.gradeBreakdown.persona`, defaulting to `"generic"`. This is a JSONB-as-blackboard pattern and easy to miss.

### 12.8 Slug collisions on rapid design create

`POST /api/lld/designs` appends 6 random hex chars to the slug (`route.ts:42`):

```ts
const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;
```

This sidesteps the unique `(user_id, slug)` index on rapid double-submission of the create form.

### 12.9 Hint tier ladder is per-stage, not global

The check at `hint/route.ts:99-114` filters `hintLog` to the **current stage** before computing the highest tier consumed:

```ts
const stageLog = hintLog.filter((h) => h.stage === stage);
const highestIdx = stageLog.reduce(
  (max, h) => Math.max(max, TIER_ORDER.indexOf(h.tier)), -1,
);
if (TIER_ORDER.indexOf(tier) !== highestIdx + 1) {
  return ... 409 TIER_LADDER ...;
}
```

So a user can take `nudge → guided` in `clarify` and then start fresh from `nudge` again in `canvas`. The penalty *budget*, however, is global per-attempt (`L117-126`).

### 12.10 Idempotent grade + postmortem

Both `POST .../grade` (`L57-64`) and `POST .../postmortem` (`L60-63`) early-return cached state if the attempt was already submitted/grade-reviewed. The postmortem also has Claude-side cache via `cacheKey: "postmortem:<id>"` with `cacheTtlMs: 24h` (`L124-126`).

### 12.11 `useNodesInitialized` is the only React Flow internal API used

The canvas otherwise treats React Flow as a black box. The single internal hook used (`useNodesInitialized` from `@xyflow/react`) is the safety net described above.

### 12.12 The `/turn` endpoint is a thin alias

`drill-attempts/[id]/turn/route.ts` is just:

```ts
import { POST as streamPost } from "@/app/api/lld/drill-interviewer/[id]/stream/route";
export async function POST(request, ctx) { return streamPost(request, ctx); }
```

The duplication is intentional — the client uses the `/turn` URL because it's logically tied to the attempt, while the SSE GET lives under `/drill-interviewer/.../stream` and the same handler must be reachable from both.

### 12.13 SSE "delta" is currently a single chunk, not token-by-token

The current implementation calls `client.call(...)` (non-streaming) and emits the whole reply as one `delta` (`stream/route.ts:191-207`). The contract envelope is delta-stream-shaped; switching to true streaming would require swapping `client.call()` for a streaming variant of `ClaudeClient`.

### 12.14 The canvas-store's UndoManager is *not* zundo

The original module brief and several docs reference `zundo`. The actual implementation is `src/lib/undo/undo-manager.ts` (a hand-rolled snapshot manager). The canvas-store imports `UndoManager` directly (`canvas-store.ts:5`).

---

## 13. Open Questions

These are honest gaps where the code didn't make the answer obvious in this read.

1. **Where does the auto-save tick run?** `lld_design_snapshots.kind = "auto"` is supported by the schema and the POST endpoint, and `LLD_CANVAS_PLAYBOOK.md` mentions it, but I didn't find the client-side timer that fires the auto-save in this pass. It is plausibly inside the LLD module's `BuildModeLayout` or a `useDesignAutoSave` hook outside the directories I traced.
2. **Token-by-token streaming**: the SSE envelope leaves room for true streaming, but the current Claude path is single-shot. Whether there is a feature flag or planned upgrade is not visible in the route file.
3. **`useDrillStage` / `useDrillHintLadder`**: both hooks exist (`src/hooks/useDrillStage.ts`, `src/hooks/useDrillHintLadder.ts`) and are used by drill-mode stage components. I described the server contracts they wrap (§6 and §7) but did not exhaustively trace each hook's internal state.
4. **The "Phase-3" `hints_used` JSONB column**: still present on `lld_drill_attempts` for backward compat. Whether anything still reads it (vs the newer `hint_log`) wasn't fully resolved.
5. **`DesignCanvas` is the system-design canvas** — but the LLD module also has its own UML class-diagram canvas (`LLDCanvas` per `docs/architecture/lld-module.md:54-66`). The two surfaces share concepts (zoom, palette, edges) but use *different* libraries: React Flow for system-design, hand-rolled SVG for LLD class diagrams (per `LLD_CANVAS_PLAYBOOK.md`). The drill mode uses the **system-design `DesignCanvas`** in its `CanvasStage`, even though the LLD problem catalog itself talks about classes and patterns. This separation is real but easy to miss.
6. **`templates-library` v `src/lib/templates/index.ts`**: there are two separate template inventories (in-bundle JSONs vs DB rows) and two separate UI surfaces. Whether the in-bundle gallery is being phased out in favor of the DB version, or whether they coexist by design, is not stated explicitly in the code I read.
7. **`drill_mode` vs `variant` columns**: both are persisted on `lld_drill_attempts` (with `drill_mode` defaulting to `"interview"`). The grade endpoint reads only `variant` (`grade/route.ts:122-124`). There may be older rows where `variant` is missing — the migration story isn't fully visible.
8. **`active_section_id` typing on `lld_learn_progress`**: the column is `varchar(30)` but the schema defines `LearnSectionId` as a strict union. The PATCH handler validates writes (`learn-progress/[patternSlug]/route.ts:188-192`) but reads downstream are typed as `string | null` — validation on the read side wasn't traced.

---

*Generated 2026-05-07 against branch `main`. Recent drill-flow commits: `280c9c4`, `3e6100d`, `904f751`, `59431e2`, `47b3d21` are reflected in §12.*
