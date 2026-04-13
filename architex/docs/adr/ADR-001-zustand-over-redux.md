# ADR-001: Zustand over Redux for State Management

**Status:** Accepted

**Date:** 2024

## Context

Architex requires client-side state management for multiple concerns: canvas nodes/edges, simulation state, UI panel visibility, editor preferences, viewport zoom, notifications, interview progress, and snapshot history. The state is spread across many independent slices but must support cross-slice reads (e.g., the simulation engine reads canvas nodes).

The team evaluated three options:

1. **Redux Toolkit** -- Industry standard, large ecosystem, but heavy boilerplate (slices, reducers, selectors, middleware). Redux DevTools are excellent but the setup cost for 10+ stores is significant.
2. **Zustand** -- Minimal API, no providers needed, first-class TypeScript support, built-in `persist` middleware, and the `zundo` temporal middleware for undo/redo. Allows direct store access outside React components via `getState()`.
3. **Jotai / Recoil** -- Atom-based models that work well for fine-grained reactivity but become unwieldy when managing large related state objects (e.g., the entire canvas node array).

## Decision

Use **Zustand v5** as the sole state management library.

## Rationale

1. **Minimal boilerplate.** Each store is a single `create()` call. The codebase has 9 stores (`canvas-store`, `ui-store`, `simulation-store`, `editor-store`, `viewport-store`, `notification-store`, `progress-store`, `interview-store`, `snapshot-store`) -- all defined in under 150 lines each. Redux would require separate slice files, a root reducer, a store configuration, and typed hooks.

2. **No Provider wrapper.** Zustand stores are vanilla JavaScript singletons. They can be imported and used anywhere -- in React components via hooks, in plain utility functions via `getState()`, and in web workers. This is critical for the simulation engine (`src/lib/simulation/`), which reads canvas state imperatively.

3. **Persistence built in.** The `persist` middleware is used by `ui-store.ts` and `canvas-store.ts` to save state to `localStorage` with a `partialize` filter that selects only the fields worth persisting:

   ```ts
   // src/stores/ui-store.ts
   export const useUIStore = create<UIState>()(
     persist(
       (set) => ({ /* ... */ }),
       {
         name: "architex-ui",
         partialize: (state) => ({
           activeModule: state.activeModule,
           sidebarOpen: state.sidebarOpen,
           theme: state.theme,
           // ...
         }),
       },
     ),
   );
   ```

4. **Undo/redo via zundo.** The `zundo` library (a Zustand temporal middleware) provides time-travel undo/redo for the canvas store with zero additional code beyond wrapping the store. This powers the `useUndoRedo` hook at `src/hooks/useUndoRedo.ts`.

5. **Cross-store reads.** The command palette, simulation orchestrator, and what-if engine all read from multiple stores imperatively:

   ```ts
   // src/components/shared/command-palette.tsx
   const { addNode } = useCanvasStore.getState();
   ```

   This pattern is natural in Zustand but requires `thunk` middleware or custom hooks in Redux.

6. **Bundle size.** Zustand is ~2KB gzipped vs. Redux Toolkit at ~12KB. For a browser-only application with no backend, bundle size matters.

## Consequences

### Positive

- Fast iteration: adding a new store takes minutes, not hours.
- Stores are independently testable (see `src/stores/__tests__/`).
- No provider nesting in `layout.tsx` -- the only provider is `ThemeProvider`.

### Negative

- No Redux DevTools by default (though a Zustand devtools middleware exists and can be added).
- Developers familiar only with Redux need to learn Zustand patterns (minimal ramp-up).
- Cross-store subscriptions require manual wiring (not an issue in practice since cross-reads are imperative).

## References

- Store files: `src/stores/*.ts`
- Store tests: `src/stores/__tests__/*.test.ts`
- Undo/redo hook: `src/hooks/useUndoRedo.ts`
- State architecture notes: `src/stores/STATE_ARCHITECTURE.ts`
