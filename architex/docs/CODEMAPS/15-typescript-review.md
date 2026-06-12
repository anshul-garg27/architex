# TypeScript / Type-Design Review

**Scope:** `tsconfig.json`, `src/types/`, `src/db/schema/`, API routes, Zustand stores, React component props, discriminated unions, branded types, async return types, suppression comments.

**Typecheck result:** `tsc --noEmit` exits 0 — no compiler errors.

**ESLint result:** process terminated abnormally (likely OOM on 1545-file codebase with default ESLint config). Individual file lint was used for targeted checks.

---

## 1. Summary

The codebase is in better shape than a typical Next.js project of this size. `strict: true` is enabled and the compiler is satisfied. The Zustand stores are consistently typed (`create<T>()()`), the drill-mode FSM is a genuine discriminated-union win, and Drizzle schema types are cleanly inferred and barrel-exported.

The main concerns cluster in three areas:

1. **JSONB columns are typed `unknown` at the DB boundary** — only one of the ~20 JSONB columns uses `.$type<>()`, so every column read from `lldDrillAttempts`, `diagrams`, `simulationRuns`, etc. returns `unknown` at runtime but the code suppresses this with repeated `as <T>` casts in every API route that reads those columns.

2. **API request bodies are cast, not parsed** — every route does `(await request.json()) as { ... }` or `(await request.json().catch(() => ({}))) as { ... }`. There is no Zod or equivalent anywhere in `src/app/api`. These casts are trust assertions, not runtime guarantees.

3. **`any[]` propagates through the LLD sequence/state-machine example pipeline** — `LLDDataContext.tsx`, `LLDSidebar.tsx`, `LLDBottomPanels.tsx`, `LLDProperties.tsx`, and `ContextualBottomTabs.tsx` all declare `example: { id: string; name: string; [key: string]: any } | null` instead of using the concrete `SequenceDiagramData` / `StateMachineData` types that already exist in `src/lib/lld/`.

Major wins: the drill stage FSM (`DrillStage`, `GatePredicate`, `canAdvance`) is exemplary. The simulation store's `SimulationStatus` discriminated union is well-formed. Drizzle's `$inferSelect` / `$inferInsert` pattern is used correctly. Zustand stores are consistently typed.

---

## 2. `tsconfig` Posture

| Flag | Value | Notes |
|---|---|---|
| `strict` | `true` | Enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict` |
| `noEmit` | `true` | Correct for a Next.js app |
| `isolatedModules` | `true` | Required for Turbopack/SWC compatibility |
| `exactOptionalPropertyTypes` | **absent** | Warning — see §8 concern #1 |
| `noUncheckedIndexedAccess` | **absent** | Warning — see §8 concern #2 |
| `noPropertyAccessFromIndexSignature` | **absent** | Low impact given the above |
| `allowJs` | `true` | Needed; the repo has `.js` files |
| `skipLibCheck` | `true` | Standard for Next.js; masks issues in declaration files |
| `moduleResolution` | `bundler` | Correct for Next.js 15 / Turbopack |
| `target` | `ES2017` | Conservative; `ES2022` would enable native class fields and remove some downlevelling |

**Absent strictness flags of note:**

`exactOptionalPropertyTypes` would catch a class of bug that currently exists in this codebase: `DrillStageProgress` has `selfGrade?: number | null`, and the gate predicate in `drill-stages.ts:91` checks `p.selfGrade === null || p.selfGrade === undefined`. With `exactOptionalPropertyTypes`, passing `{}` (which is the default for `body.progress ?? {}` in `stage/route.ts:80`) to `canAdvance` would surface a missing-key vs. `undefined` distinction that is currently silently ignored.

`noUncheckedIndexedAccess` would flag the repeated `STAGE_ORDER[idx + 1]` and `STAGE_ORDER[idx - 1]` accesses in `drill-stages.ts:107-113` (already guarded but the null-coalescing `?? null` is needed because of the index access — the flag would make this intent clearer and enforce it elsewhere).

---

## 3. Type-Sharing Patterns

### 3a. Drizzle Schema — Inference Style

The schema uses two Drizzle inference styles in parallel with no consistency:

- **Modern** (`$inferSelect` / `$inferInsert`): used in `lld-drill-attempts.ts`, `lld-concept-reads.ts`, `lld-design-annotations.ts`, `lld-learn-progress.ts`, `lld-templates-library.ts`.
- **Legacy** (`InferSelectModel` / `InferInsertModel` from `drizzle-orm`): used in `diagrams.ts`, `simulations.ts`, `gallery.ts`, `ai-usage.ts`, `progress.ts`, `achievements.ts`.

Both produce identical types. The inconsistency is cosmetic but signals two eras of authorship and will confuse contributors who don't know both are equivalent.

### 3b. JSONB Column Typing

Only **one** of approximately 20 JSONB columns is typed via `.$type<>()`:

```
src/db/schema/lld-learn-progress.ts:58  sectionProgress.$type<SectionProgressMap>()
```

Every other JSONB column — `canvasState`, `stages`, `hintLog`, `rubricBreakdown`, `postmortem`, `config`, `results`, `data`, `preferences`, etc. — is inferred as `unknown` (Drizzle's default for `jsonb()`), which is technically correct but forces every API route that reads those columns to cast the result. The pattern that results is:

```ts
// src/app/api/lld/drill-attempts/[id]/stage/route.ts:111
const existingStages =
  (attempt.stages as Record<string, { durationMs?: number; progress?: unknown }>) ?? {};
```

This cast is repeated in `/grade/route.ts`, `/postmortem/route.ts`, and `/stream/route.ts`. A `.$type<StagesMap>()` on the column would eliminate all of them and move the trust boundary to the schema declaration where it belongs.

### 3c. API Request/Response Types — No Shared Contracts

Request body types are defined inline as anonymous object types directly inside each route handler:

```ts
// src/app/api/lld/drill-attempts/route.ts:31
const body = (await request.json().catch(() => ({}))) as {
  problemId?: string;
  drillMode?: string;
  variant?: string;
  durationLimitMs?: number;
};
```

There are no exported request/response type contracts shared between server (API routes) and client (hooks, store actions). Client-side callers that call `fetch('/api/lld/drill-attempts', { body: JSON.stringify(...) })` have no compile-time check that the payload matches what the route handler expects.

`src/hooks/useDrillInterviewer.ts`, `src/hooks/useLearnProgress.ts`, and the various drill-mode client hooks call these routes with hand-typed payloads.

No Zod (or equivalent) validation library is present anywhere in `src/app/api`.

---

## 4. `any` / `as` / `ts-ignore` Audit

### Suppression comment count by directory

| Location | `@ts-expect-error` | `@ts-ignore` | `eslint-disable @typescript-eslint/no-explicit-any` | `eslint-disable react-hooks/exhaustive-deps` |
|---|---|---|---|---|
| `src/middleware.ts` | 1 | 0 | 0 | 0 |
| `src/app/layout.tsx` | 0 | 0 | 1 | 0 |
| `src/app/api/og/` | 0 | 0 | 0 | 0 (next/next/no-img) |
| `src/lib/performance/lazy-loader.ts` | 3 | 0 | 3 | 0 |
| `src/components/innovation/` | 0 | 0 | 0 | 4 |
| `src/components/modules/lld/` | 0 | 0 | 7 | 9 |
| `src/components/canvas/` | 0 | 0 | 1 | 4 |
| `src/components/shared/` | 0 | 0 | 0 | 1 |
| `src/components/ai/` | 0 | 0 | 0 | 1 |
| `src/components/analytics/` | 0 | 0 | 0 | 1 |
| `src/components/interview/` | 0 | 0 | 0 | 1 |
| `src/__tests__/` | 1 | 0 | 14 | 0 |
| `src/hooks/` | 0 | 0 | 2 | 1 |
| **Total** | **5** | **0** | **28** | **22** |

### Hotspots — explicit `any` in application code

**`src/components/modules/lld/LLDDataContext.tsx:20-23`** — two `any[]` fields in the context value type (`sequenceExamples: any[]`, `stateMachineExamples: any[]`). Concrete types `SequenceDiagramData` and `StateMachineData` already exist in `src/lib/lld/`.

**`src/components/modules/lld/sidebar/LLDSidebar.tsx:758-779`** — `SequenceExample` and `StateMachineExample` are defined with `[key: string]: any` index signatures, and the props `onSelectSequence` / `onSelectStateMachine` accept `any`. This bleeds `any` into every call site.

**`src/components/modules/lld/panels/LLDBottomPanels.tsx:228,284`** / **`LLDProperties.tsx:670,798`** / **`ContextualBottomTabs.tsx:111-112`** — all use the same loose `{ id: string; name: string; [key: string]: any } | null` prop type for `example` / `activeSequence` / `activeStateMachine`, then cast `.data.participants` and `.data.states` members back to `any` inline.

**`src/components/modules/lld/hooks/useLLDData.ts:77`** — the `mapItem = (item: any)` function merges API item + content JSONB, then casts the result to the concrete types. This is the adapter between API mode and static data, and is the correct place to narrow.

**`src/lib/lld/patterns.ts:1731`** — `private listeners = new Map<keyof T, Set<(...args: any[]) => void>>()` inside `TypedEventEmitter`. The public `on`/`emit` API is correctly generic; the private `any` is an implementation-level escape hatch, not ideal but low impact.

**`src/lib/lld/solid-demos.ts:930,1411`** — demo code strings embed `any[]` as a type annotation and `any` in method signatures. These are strings shown to users as code examples, not real TypeScript code in the codebase — low impact but confusing to scan.

### `as` cast hotspots

**API routes — repeated JSONB column casts** (7+ sites):
- `src/app/api/lld/drill-attempts/[id]/stage/route.ts:78` — `attempt.currentStage as DrillStage`
- `src/app/api/lld/drill-attempts/[id]/stage/route.ts:111` — `attempt.stages as Record<string, ...>`
- `src/app/api/lld/drill-attempts/[id]/grade/route.ts:75,122,138` — multiple casts on JSONB fields
- `src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:74,86,91,160` — four casts in one route

**Double-cast (`as unknown as`) — 14 sites**:
- `src/app/api/lld/drill-attempts/[id]/grade/route.ts:138` — `result.rubric as unknown as Record<string, unknown>` to satisfy Drizzle's `.set()` type
- `src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:160` — same pattern for `postmortem`
- `src/components/canvas/DesignCanvas.tsx:54-55` — `systemDesignNodeTypes as unknown as NodeTypes` and `systemDesignEdgeTypes as unknown as EdgeTypes`
- `src/components/knowledge-graph/ConceptGraph.tsx:164-165` — same pattern for ReactFlow node/edge types
- `src/components/shared/ModuleRenderer.tsx:66-102` — 9 consecutive `m.XxxModule as unknown as LazyModule` casts in the dynamic import factory

**Embed pages — `any[]` casts for JSONB content** (3 pages):
- `src/app/embed/lld/problem/[id]/page.tsx:30-31`
- `src/app/embed/lld/solid/[id]/page.tsx:30-31`
- `src/app/embed/lld/pattern/[id]/page.tsx:44-45`

---

## 5. State-Machine Type Design

### Drill Mode Lifecycle — STRONG

The drill FSM is the strongest type design in the codebase.

`src/lib/lld/drill-stages.ts` defines:
- `DrillStage` as a string literal union (sourced from the DB schema, re-exported cleanly)
- `STAGE_ORDER` as `readonly DrillStage[]`
- `GatePredicate` as `(progress: DrillStageProgress) => GateResult`
- `GATES: Record<DrillStage, GatePredicate>` — exhaustive record keyed on the union; adding a stage without updating `GATES` is a compile error
- `canAdvance`, `nextStage`, `previousStage` — all return `DrillStage | null` (not `string`)

The `DrillStoreState` in `src/stores/drill-store.ts` uses these types directly. The `isStage` type guard in `stage/route.ts:28` correctly narrows `unknown → DrillStage` before any comparison.

**One inconsistency:** `DrillMode` (`"interview" | "guided" | "speed"`) is defined in three places independently:
- `src/stores/interview-store.ts:114` — local `DrillMode` type
- `src/lib/analytics/lld-events.ts:17` — another local `DrillMode` type  
- `src/app/api/lld/drill-attempts/route.ts:17` — the Phase-1→Phase-4 mapping lives in the API route as a runtime `Record<string, string>`, not tied to either type

`DrillVariant` (`"exam" | "timed-mock" | "study"`) correctly lives in `src/db/schema/lld-drill-attempts.ts` and is re-exported from `src/lib/lld/drill-variants.ts`. `DrillMode` should be removed and replaced by `DrillVariant` everywhere, or explicitly declared as a deprecated alias.

### Simulation Status — GOOD

`SimulationStatus = "idle" | "running" | "paused" | "completed" | "error"` in `src/stores/simulation-store.ts` is a proper discriminated union. The `play()` action guards on `status === "paused"` before branching, which is correct narrowing.

No exhaustive switch guard is used on `SimulationStatus` in any action dispatcher (the `setStatus` action accepts the full union), but there is no complex match-on-status logic that would benefit from `assertNever`.

### Interview / Challenge Status — ADEQUATE

`ChallengeStatus = "not-started" | "in-progress" | "submitted" | "evaluated"` in `src/stores/interview-store.ts:70` is cleanly defined. The store actions transition between states by name. No compile-time enforcement that you can only call `submitChallenge` when `challengeStatus === "in-progress"`, but this is typical for Zustand.

---

## 6. Generic and Utility Types

### What is present

- `Partial<Record<DrillStage, StageProgressBag>>` in `DrillStoreState` — correct use for sparse stage progress
- `Omit<DrillStoreState, "reset" | "beginAttempt" | ...>` for the `initialState()` return type — the idiomatic Zustand pattern; well-executed
- `Record<DrillVariant, DrillVariantConfig>` in `drill-variants.ts` — exhaustive keyed record
- `Record<RubricAxis, RubricAxisResult>` — same; exhaustive
- `Partial<TrafficConfig>` in `setTrafficConfig` — correct
- `ImportFn<T extends ComponentType<any>>` in `lazy-loader.ts` — generic wrapper; the `any` bound on `ComponentType` is idiomatic React (React's own `ComponentType` is generic over props which default to `any`)
- `lazyComponent<P extends Record<string, any>>` — the `any` in the constraint is a React idiom; a tighter constraint (`Record<string, unknown>`) would be more precise but could break call sites that pass specific prop objects

### Missing utility types

- No `Readonly<>` guards on shared data constants (`STAGE_ORDER`, `RUBRIC_AXES`, `VARIANT_CONFIG`). These are `as const` or `readonly` arrays/objects, which is adequate, but could be surfaced more explicitly.
- No `ReturnType<>` references in the API layer — response shape types are inferred at call sites via `await response.json()`, giving `any`.
- No `Awaited<ReturnType<...>>` to derive concrete DB row types from query functions — this would eliminate several of the JSONB casts.

---

## 7. Component Props Review

### Naming and style

Prop interfaces are consistently named `XxxProps` and placed at the component's file level. Public-facing innovation and canvas components export their interfaces; private/local components keep them private. This is correct.

### Optionality

No systematic overuse of `?`. Most required props are non-optional.

### `children` typing

`children: ReactNode` is used consistently (61 instances). No `JSX.Element` children types were found, which is correct.

### `React.FC` usage

Only one instance: `src/components/modules/database/canvases/ACIDCanvas.tsx:201` — used as a value type in a `Record<ACIDProperty, React.FC<{ className?: string }>>` map, which is appropriate.

### `example` prop pattern — WEAK

The `example` prop in `SequenceBottomPanel`, `StateMachineBottomPanel`, `SequencePropertiesPanel`, and `StateMachinePropertiesPanel` is typed as `{ id: string; name: string; [key: string]: any } | null`. The index signature `[key: string]: any` makes all property accesses untyped. The concrete types `SequenceDiagramData` and `StateMachineData` exist in `src/lib/lld/sequence-diagram.ts` and `src/lib/lld/state-machine.ts` respectively. The correct prop type for `SequenceBottomPanel` would be:

```ts
// What it should be
interface SequenceExample {
  id: string;
  name: string;
  description?: string;
  data: SequenceDiagramData;
}
example: SequenceExample | null;
```

### `EmbedUMLCanvas` — GOOD

`src/app/embed/lld/_components/EmbedUMLCanvas.tsx` correctly types `classes: UMLClass[]` and `relationships: UMLRelationship[]`. The cast problem is in the calling page component, not in the canvas itself.

---

## 8. Top 20 Type-Design Concerns

| # | File | Issue | Severity |
|---|---|---|---|
| 1 | `tsconfig.json` | `exactOptionalPropertyTypes` not set. The `DrillStageProgress` gate check `p.selfGrade === null \|\| p.selfGrade === undefined` and the `body.progress ?? {}` default in stage advancement would benefit from the flag. | Warning |
| 2 | `tsconfig.json` | `noUncheckedIndexedAccess` not set. `STAGE_ORDER[idx + 1]` returns `DrillStage` not `DrillStage \| undefined`; the null-coalescing guard in `drill-stages.ts:108` compensates but this is not enforced elsewhere. | Warning |
| 3 | `src/db/schema/lld-drill-attempts.ts` | `stages`, `hintLog`, `rubricBreakdown`, `postmortem`, `canvasState` are untyped JSONB columns. Every route that reads them casts the result (7+ cast sites). Use `.$type<StagesMap>()` etc. to push the trust boundary to the schema. | Warning |
| 4 | `src/db/schema/diagrams.ts:32` / `src/db/schema/simulations.ts:30` | `data: jsonb("data")` and `config: jsonb("config")` are untyped. Diagram `data` carries `{ nodes: Node[], edges: Edge[] }` — a well-known shape that should be `.$type<DiagramData>()`. | Warning |
| 5 | `src/app/api/lld/drill-attempts/route.ts:31` (and 20+ other routes) | `request.json()` cast without parse validation. All routes cast the parsed body to an inline type. No Zod or equivalent. A malformed or adversarial body silently produces `undefined` fields rather than a 400. | Warning |
| 6 | `src/app/api/lld/drill-attempts/[id]/route.ts:66` | `const updates: Record<string, unknown> = { ... }` then passed to `.set(updates)`. Drizzle's `.set()` expects a typed partial, not `Record<string, unknown>`. This bypasses column-type checking; a typo in a column name would silently succeed at compile time. | Warning |
| 7 | `src/components/modules/lld/LLDDataContext.tsx:20-23` | `sequenceExamples: any[]` and `stateMachineExamples: any[]` in the context value type. Should be typed with the existing `SequenceDiagramExample` and `StateMachineExample` array element shapes. | Warning |
| 8 | `src/components/modules/lld/sidebar/LLDSidebar.tsx:758-779` | `SequenceExample` and `StateMachineExample` local types use `[key: string]: any`. The `onSelectSequence: (example: any) => void` prop dissolves all type safety at the selection call site. | Warning |
| 9 | `src/components/modules/lld/panels/LLDBottomPanels.tsx:228,284` / `LLDProperties.tsx:670,798` | `example: { id: string; name: string; [key: string]: any } \| null` prop in 4+ components. The concrete `data.participants` and `data.states` sub-arrays are then each `(p: any)` in `.map()` callbacks. | Warning |
| 10 | `src/app/api/lld/drill-attempts/[id]/grade/route.ts:138` | `result.rubric as unknown as Record<string, unknown>` — double cast to satisfy Drizzle's `.set()`. Signals a type mismatch between `RubricBreakdown` and the schema column type. Fix: type the column with `.$type<RubricBreakdown>()` and update `.set()`. | Warning |
| 11 | `src/app/api/lld/drill-attempts/[id]/postmortem/route.ts:160` | Same double-cast pattern: `postmortem as unknown as Record<string, unknown>`. | Warning |
| 12 | `src/stores/interview-store.ts:114` / `src/lib/analytics/lld-events.ts:17` | `DrillMode = "interview" \| "guided" \| "speed"` is defined independently in two files. Neither imports the other. One is the Phase-1 domain type; the other is an analytics type. Both should alias or import `DrillVariant` from the canonical schema location, or the legacy type should be explicitly declared deprecated. | Warning |
| 13 | `src/app/api/lld/drill-attempts/[id]/resume/route.ts:58` | `new Date(attempt.pausedAt!).getTime()` — non-null assertion on a nullable column. Line 57 checks `wasPaused = attempt.pausedAt !== null` and line 58 is inside `if (wasPaused)`, so the assertion is safe — but TypeScript doesn't narrow class properties through a `const` boolean intermediate. An explicit `if (attempt.pausedAt !== null)` block would eliminate the `!`. | Informational |
| 14 | `src/app/api/lld/drill-attempts/[id]/stage/route.ts:78` | `const current = attempt.currentStage as DrillStage` — `attempt.currentStage` is inferred as `string` (Drizzle `varchar` column type). The `isStage` guard is called on the *incoming* `targetStage` but not on `currentStage`, which is assumed to already be a valid stage because it came from the DB. Adding `.$type<DrillStage>()` to the column would eliminate this cast entirely. | Informational |
| 15 | `src/components/shared/ModuleRenderer.tsx:66-102` | Nine consecutive `m.XxxModule as unknown as LazyModule` casts. These exist because each dynamically imported module export has a specific component type that doesn't match the generic `LazyModule` type alias. Fixing the `LazyModule` generic or the import factory would eliminate all nine. | Informational |
| 16 | `src/components/canvas/DesignCanvas.tsx:54-55` / `src/components/knowledge-graph/ConceptGraph.tsx:164-165` | `systemDesignNodeTypes as unknown as NodeTypes` — ReactFlow's `NodeTypes` is `Record<string, ComponentType<any>>` and the project's node type map uses more specific component types. This is a React Flow version-specific typing issue; the double cast is a known workaround. Document the reason or track the upstream issue. | Informational |
| 17 | `src/app/api/lld/drill-attempts/[id]/route.ts:34-40` | `action` is parsed from a `body.action?: string` field and validated against a `Set`, which is correct. However `const updates: Record<string, unknown>` then populates fields by string name (`updates.pausedAt = now`). Drizzle does not validate the keys at compile time when the argument is `Record<string, unknown>`. A typed partial `Partial<typeof lldDrillAttempts.$inferInsert>` would add column-name safety. | Informational |
| 18 | `src/lib/performance/lazy-loader.ts:99,104,109` | Three `@ts-expect-error` comments on modules that "don't exist yet" (`@/components/editors/monaco-editor`, `@/components/visualizations/graph-3d`, `@/components/storybook/preview`). These are speculative import factories for modules that have not been built. They should either be removed until the modules exist, or documented as placeholder architecture. | Informational |
| 19 | `src/app/api/webhooks/clerk/route.ts:61,66-67,81` | Clerk webhook payload fields accessed as `data.id as string`, `data.first_name as string | null` — untyped `Record<string, unknown>` payload from a third-party webhook. Using `@clerk/nextjs/server`'s typed Webhook payload (via `svix` + Clerk's event types) would eliminate all casts. The existing stub in `src/types/missing-deps.d.ts` shows Clerk types are partially available. | Informational |
| 20 | `src/app/api/lld/drill-attempts/[id]/route.ts:58` | A `console.log` trace statement is present in the `abandon` action path for debugging a production issue. This is deliberate (comment says "TEMP") but should be removed after the root cause is identified. | Informational |

---

## 9. Out of Scope

The following were observed but not reviewed in depth:

- **E2E tests** (`src/__tests__/e2e/`) — excluded from `tsconfig.json` via the `exclude` array
- **Playwright config** (`playwright.config.ts`) — explicitly excluded
- **Story files** (`**/*.stories.tsx`) — excluded
- **Seed scripts** (`src/db/seeds/`) — server-side scripts; `console.log` in seeds is intentional
- **`src/lib/lld/solid-demos.ts`** — the `console.log` calls are inside string literals used as code example snippets for educational display, not runtime code
- **Bundle analysis / performance** — outside the type-design scope
- **Security review** of API routes beyond type-boundary concerns
- **ReactFlow node/edge generic typing** — the `as unknown as NodeTypes` pattern is a known upstream ReactFlow v12 typing limitation; fixing it requires either extending `NodeTypes` in the project or waiting for upstream changes
