# Contributing to Architex

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git

### Install and Run

```bash
git clone https://github.com/your-org/architex.git
cd architex
pnpm install
pnpm dev
```

Open http://localhost:3000. No environment variables are required for local development.

### Useful Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm lint           # Run ESLint
pnpm typecheck      # Type-check without emitting
pnpm format         # Format code with Prettier
pnpm format:check   # Check formatting without writing
```

---

## How to Add a New Node Type

System design nodes live in the canvas layer and appear in the component palette.

1. **Create the node component** in `src/components/canvas/nodes/system-design/YourNode.tsx`. Extend `BaseNode` and define handles, icon, label, and default config.

2. **Register the node type** in `src/components/canvas/nodes/system-design/index.ts`. Add your node to the `systemDesignNodeTypes` map so React Flow recognizes it.

3. **Add a palette entry** in `src/lib/palette-items.ts`. Define the `type`, `label`, `category`, `icon`, `description`, and `defaultConfig` so the node appears in the drag-and-drop palette.

4. **Add default metrics** (if applicable) in `src/lib/simulation/` so the traffic simulator knows how to model throughput, latency, and error rates for your node.

---

## How to Add a New Algorithm

Algorithm visualizations are organized by category under `src/lib/algorithms/`.

1. **Create the algorithm file** in the appropriate category directory (e.g., `src/lib/algorithms/sorting/yourAlgo.ts`). Return an `AlgorithmResult` with step-by-step `AnimationStep[]`.

2. **Define the step type** in `src/lib/algorithms/types.ts` if your algorithm requires a new step shape not already covered.

3. **Add config to the category's catalog array** and register the algorithm in `src/lib/algorithms/index.ts` so the visualizer can discover it.

4. **Ensure playback compatibility** by conforming to the interface used by `src/lib/algorithms/playback-controller.ts` for play, pause, step-forward, and step-backward controls.

See **[docs/guides/adding-an-algorithm.md](docs/guides/adding-an-algorithm.md)** for the full step-by-step guide with code templates.

For algorithm content quality standards, see [docs/guides/algorithm-content-style.md](docs/guides/algorithm-content-style.md).

---

## How to Add a New Data Structure

Interactive data structure visualizations live under `src/lib/data-structures/`. Adding a DS requires changes in 9 locations across 2--3 files -- the most involved registration process in the codebase.

1. **Create the engine file** in `src/lib/data-structures/your-ds.ts`. Each operation returns a `DSResult` with `DSStep[]` and a state snapshot.

2. **Register in the barrel** -- add exports and a `DS_CATALOG` entry in `src/lib/data-structures/index.ts`.

3. **Update DataStructuresModule.tsx** in all 7 required locations: imports, `ActiveDS` union, `DSModuleState` interface, `INITIAL_STATE`, `DSProperties` switch, `handleOperation` switch, `handleRandom` switch, `handleReset`, and the canvas rendering branch.

4. **Write tests** in `src/lib/data-structures/__tests__/` covering empty state, single element, multiple operations, and invariant preservation.

See **[docs/guides/adding-a-data-structure.md](docs/guides/adding-a-data-structure.md)** for the full step-by-step guide with code templates and exact line references.

---

## How to Add a New Distributed Simulation

Distributed simulations live in the monolithic `DistributedModule.tsx` (4904 lines). Adding a new simulation requires changes in **1 new file** and **3 existing files** across roughly 10 locations. The `saga.ts` engine (122 lines) is a good template to start from.

### 1. Create the engine file

Create `src/lib/distributed/your-sim.ts`. Export a class (for stateful simulations like Raft, Gossip) or a pure function (for step-sequence simulations like Saga, 2PC).

```typescript
// src/lib/distributed/your-sim.ts
export interface YourSimStep {
  phase: string;
  description: string;       // Explain WHY, not just WHAT
  nodes: { id: string; state: string }[];
  messages?: { from: string; to: string; label: string }[];
}

export function simulateYourSim(): YourSimStep[] {
  return [
    {
      phase: "init",
      description: "Coordinator broadcasts PREPARE because it needs all participants to promise before committing.",
      nodes: [{ id: "coordinator", state: "waiting" }],
      messages: [],
    },
    // ... more steps
  ];
}
```

### 2. Add exports to the barrel file

Update `src/lib/distributed/index.ts`:

```typescript
// Your Simulation
export {
  type YourSimStep,
  simulateYourSim,
} from './your-sim';
```

### 3. Update the type union

In `src/components/modules/DistributedModule.tsx`, add your simulation ID to the `DistributedSim` type (around line 53):

```typescript
type DistributedSim =
  | "raft"
  // ... existing entries
  | "your-sim";   // <-- add here
```

### 4. Add to the SIMULATIONS array

In the same file, add an entry to `SIMULATIONS` (around line 72):

```typescript
{
  id: "your-sim",
  name: "Your Simulation",
  description: "Problem it solves. Mechanism it uses.",
},
```

### 5. Add state variables

In the `useDistributedModule` hook, add `useState` variables for your simulation's state (steps array, current step index, engine ref if stateful).

### 6. Add canvas component

Add an inline canvas rendering section in the canvas switch chain (around line 4805). Use SVG or HTML to visualize nodes, messages, and state transitions.

### 7. Add controls section

Add buttons (Play, Step, Reset, etc.) to the controls switch chain (around line 4281).

### 8. Add properties panel content

Add a properties case (around line 2980) with:
- **Key Concepts** -- 3-5 bullet points
- **Used By** -- 3+ real systems (e.g., "Google Spanner, CockroachDB")
- **Summary** -- 3 bullet flashcard

### 9. Wire up the switch chains

Ensure your simulation ID appears in **all three** switch chains:
- Canvas rendering (~line 4805)
- Controls panel (~line 4281)
- Properties panel (~line 2980)

Missing any of these produces a silent blank panel with no error.

### 10. Update progress tracking

Add your simulation's feature key to `MODULE_FEATURES.distributed` in `src/lib/progress/module-progress.ts`.

### 11. Write tests

Add tests in `src/__tests__/lib/distributed/your-sim.test.ts` or `src/lib/distributed/__tests__/your-sim.test.ts`. Cover: empty/initial state, single step, full run, edge cases, and invariant preservation.

### Common Mistakes

- **Forgetting a switch chain entry** -- your sim appears in the sidebar but clicking it shows a blank canvas. No error is thrown. Check all three chains.
- **Forgetting the SIMULATIONS array entry** -- the type accepts the sim ID but nothing appears in the sidebar. The sim is unreachable.
- **Forgetting `module-progress.ts`** -- the simulation works but progress is not tracked. Users never see completion credit.
- **Step descriptions that say WHAT instead of WHY** -- "Node sends PREPARE" is bad. "Coordinator broadcasts PREPARE because it needs all participants to promise before committing" is good.

### Checklist

- [ ] Engine file created with tests
- [ ] Barrel export updated
- [ ] DistributedSim type updated
- [ ] SIMULATIONS array entry added
- [ ] Canvas renders correctly
- [ ] Controls panel with buttons
- [ ] Properties panel with Key Concepts, Used By, Summary
- [ ] Step descriptions explain WHY not just WHAT
- [ ] Progress tracking updated

---

## How to Add a New Design Pattern

Design patterns live in the LLD (Low-Level Design) Studio module. Each pattern is a `DesignPattern` object in `src/lib/lld/patterns.ts` containing UML class definitions, relationships, code samples in TypeScript and Python, real-world examples, and usage guidance.

See **[docs/guides/add-new-pattern.md](docs/guides/add-new-pattern.md)** for the full step-by-step guide with an annotated template, positioning guidelines, and quality checklist.

---

## How to Add a New Template

Templates are pre-built architecture diagrams users can load onto the canvas.

1. **Define the template** in `src/lib/templates/index.ts`. A template is a JSON structure containing nodes, edges, and learn steps that conform to the types in `src/lib/templates/types.ts`.

2. **Add metadata** including a name, description, and category so the template picker can display and filter it.

3. **Test the template** by loading it from the command palette or template browser and verifying that all nodes render and edges connect correctly.

---

## How to Add a New Module

Modules are the top-level learning sections accessible from the activity bar.

1. **Create the module component** in `src/components/modules/YourModule.tsx`. Each module is a self-contained React component that renders its own UI within the editor layout.

2. **Register the module** in `src/components/modules/index.ts`. Export it from the barrel file.

3. **Add an activity bar entry** in the UI store or activity bar configuration so users can navigate to your module. Assign it a Lucide icon and label.

4. **Create supporting logic** under `src/lib/your-module/` for any algorithms, simulators, or data models the module needs.

5. **Add the Zustand store** (if needed) in `src/stores/` for module-specific state that must persist across component unmounts or integrate with undo/redo via zundo.

---

## Branch Naming Conventions

Use the following prefixes:

| Prefix | Purpose |
|---|---|
| `feature/` | New features and modules |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring without behavior change |
| `docs/` | Documentation only |
| `chore/` | Tooling, dependencies, CI |

Examples: `feature/raft-consensus-viz`, `fix/node-drag-offset`, `refactor/store-selectors`.

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

### Types

- **feat** -- New feature
- **fix** -- Bug fix
- **refactor** -- Code change that neither fixes a bug nor adds a feature
- **docs** -- Documentation only
- **style** -- Formatting, missing semicolons, etc.
- **test** -- Adding or updating tests
- **chore** -- Build process, dependencies, CI

### Scopes

Use the area of the codebase affected: `canvas`, `algorithms`, `distributed`, `networking`, `os`, `store`, `ui`, `simulation`, `interview`, etc.

### Examples

```
feat(distributed): add Raft leader election visualization
fix(canvas): correct edge routing on node resize
refactor(store): split editor store into focused slices
docs(contributing): add module creation guide
```
