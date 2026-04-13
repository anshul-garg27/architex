# ADR-005: Vitest over Jest for Testing

**Status:** Accepted

**Date:** 2024

## Context

Architex needs a testing framework for:

- Unit tests for algorithm implementations (sorting, graph, tree, DP, string, backtracking, geometry).
- Unit tests for simulation engines (cascade, queuing model, traffic simulator).
- Unit tests for data structures (bloom filter, B+ tree, heap, trie, segment tree).
- Unit tests for Zustand stores (canvas, UI, simulation).
- Component tests for React components (nodes, overlays).
- Persistence and undo/redo tests.

The codebase uses TypeScript, path aliases (`@/`), and modern ES module syntax throughout.

Options considered:

1. **Jest** -- The default testing framework for many React projects. Requires `ts-jest` or `@swc/jest` for TypeScript, `moduleNameMapper` for path aliases, and a separate `jest.config.js`. Known for slow startup in large TypeScript projects.
2. **Vitest** -- A Vite-native test runner that shares configuration with Vite/ESBuild. Native TypeScript and ESM support. Compatible with Jest's API (`describe`, `it`, `expect`). Faster cold starts.

## Decision

Use **Vitest v4** as the sole testing framework.

## Rationale

1. **Shared resolve configuration.** Vitest reads the same path alias config, eliminating duplication:

   ```ts
   // vitest.config.ts
   import { defineConfig } from 'vitest/config';
   import path from 'path';

   export default defineConfig({
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: ['./src/__tests__/setup.ts'],
       include: ['src/**/*.test.{ts,tsx}'],
     },
     resolve: {
       alias: { '@': path.resolve(__dirname, './src') },
     },
   });
   ```

   With Jest, the same `@/` alias would need a separate `moduleNameMapper` entry.

2. **Native TypeScript.** Vitest handles `.ts` and `.tsx` files without a separate transform plugin. No `ts-jest`, no `@swc/jest`, no `babel.config.js`.

3. **Jest-compatible API.** All existing tests use `describe`, `it`, `expect`, and `beforeEach` -- the same API Jest provides. Migration cost is zero:

   ```ts
   // src/lib/algorithms/sorting/__tests__/sorting-comprehensive.test.ts
   import { describe, it, expect } from 'vitest';
   import { bubbleSort } from '../bubble-sort';

   describe('bubbleSort', () => {
     it('sorts a reverse-sorted array', () => {
       const result = bubbleSort([5, 4, 3, 2, 1]);
       expect(result.finalState).toEqual([1, 2, 3, 4, 5]);
     });
   });
   ```

4. **jsdom environment.** Component tests (e.g., `src/components/canvas/nodes/system-design/__tests__/SystemDesignNodes.test.tsx`) need a DOM environment. Vitest supports `environment: 'jsdom'` natively, configured once in `vitest.config.ts`.

5. **Fast feedback loop.** Vitest's watch mode (`pnpm test`) uses Vite's HMR to re-run only affected tests. Cold start is under 1 second for the 20+ test files in the project.

6. **globals: true.** With `globals: true`, `describe`, `it`, and `expect` are available without explicit imports, matching Jest's default behavior. The codebase uses explicit imports from `vitest` for clarity, but both patterns work.

7. **Testing Library integration.** `@testing-library/react` and `@testing-library/jest-dom` work with Vitest. The setup file at `src/__tests__/setup.ts` configures jest-dom matchers.

8. **UI mode.** The `@vitest/ui` dev dependency enables a browser-based test dashboard for interactive debugging, which is useful for complex algorithm step-by-step verification.

## Consequences

### Positive

- Single config file (`vitest.config.ts`) covers all test needs.
- No additional transform plugins for TypeScript or path aliases.
- Fast execution: the full test suite runs in seconds.
- Familiar API for developers coming from Jest.
- Interactive UI mode available via `pnpm test -- --ui`.

### Negative

- Vitest is less established than Jest in enterprise environments (acceptable for this project).
- Some Jest-specific plugins (e.g., `jest-styled-components`) don't have Vitest equivalents (not relevant -- no styled-components in use).
- Vitest v4 is relatively new; occasional breaking changes between major versions are possible.

## References

- Vitest config: `vitest.config.ts`
- Test setup: `src/__tests__/setup.ts`
- Algorithm tests: `src/lib/algorithms/sorting/__tests__/`, `src/lib/algorithms/graph/__tests__/`
- Store tests: `src/stores/__tests__/`
- Simulation tests: `src/lib/simulation/__tests__/`
- Data structure tests: `src/lib/data-structures/__tests__/`
- Component tests: `src/components/canvas/nodes/system-design/__tests__/`, `src/components/canvas/nodes/lld/__tests__/`
- Package scripts: `"test": "vitest"`, `"test:run": "vitest run"` in `package.json`
- Packages: `vitest` ^4.1.4, `@vitest/ui` ^4.1.4, `jsdom` ^29.0.2 in `package.json`
