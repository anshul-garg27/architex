# ADR-002: React Flow v12 for Canvas Rendering

**Status:** Accepted

**Date:** 2024

## Context

Architex's core feature is an interactive canvas where users drag, drop, and connect infrastructure components to build system-design diagrams. The canvas must support:

- Custom node rendering with multiple visual fidelity levels (LOD).
- Bidirectional edges with custom styling and animation.
- Drag-and-drop from a palette onto the canvas.
- Snap-to-grid alignment.
- Minimap, zoom controls, and viewport tracking.
- Programmatic node/edge manipulation from the simulation engine.
- Performance with 30+ nodes and 50+ edges.

Options considered:

1. **React Flow v12 (@xyflow/react)** -- Purpose-built for node-based UIs in React. Provides handles, edges, minimap, controls, selection, and drag-and-drop out of the box.
2. **D3.js** -- Extremely flexible but low-level. Would require building node layout, edge routing, selection, drag-and-drop, and zoom from scratch.
3. **Cytoscape.js** -- Graph visualization library, but oriented toward data visualization rather than interactive editors. Limited React integration.
4. **Custom Canvas/SVG** -- Maximum control but enormous development cost for basic interaction features.

## Decision

Use **React Flow v12** (`@xyflow/react` ^12.10.2) as the canvas rendering library.

## Rationale

1. **Custom node components.** React Flow lets each node type be a standard React component. Architex defines 32 custom node types in `src/components/canvas/nodes/system-design/`, all extending `BaseNode.tsx`. Each is a `memo`-wrapped component that receives typed props:

   ```tsx
   // src/components/canvas/nodes/system-design/CacheNode.tsx
   const CacheNode = memo(function CacheNode(props: NodeProps<SystemDesignNode>) {
     return (
       <BaseNode
         id={props.id}
         data={props.data}
         selected={props.selected ?? false}
         icon={<Zap size={16} />}
       />
     );
   });
   ```

2. **Node type registry.** The `systemDesignNodeTypes` map in `src/components/canvas/nodes/system-design/index.ts` is passed directly to React Flow's `nodeTypes` prop, enabling automatic type-based rendering:

   ```tsx
   // src/components/canvas/DesignCanvas.tsx
   const nodeTypes = systemDesignNodeTypes as unknown as NodeTypes;
   <ReactFlow nodeTypes={nodeTypes} ... />
   ```

3. **Handle system.** `BaseNode` defines 8 handles (4 source + 4 target, one per side) using React Flow's `<Handle>` component. This enables connections from any side of any node, which is essential for organic architecture diagrams.

4. **Custom edge types.** The `DataFlowEdge` component in `src/components/canvas/edges/DataFlowEdge.tsx` renders animated edges with protocol labels (HTTP, gRPC, WebSocket). LLD edges (inheritance, composition, etc.) are in `src/components/canvas/edges/lld/`.

5. **Built-in features used.** The codebase uses React Flow's `Background` (dot grid), `Controls` (zoom buttons), `MiniMap`, snap-to-grid, and viewport change callbacks -- all of which would need to be built from scratch with D3 or Canvas.

6. **Level-of-Detail rendering.** `BaseNode` implements three LOD tiers based on zoom level (read from `viewport-store`):
   - `full` (zoom > 0.6): Full node with icon, label, state dot, metrics badge.
   - `simplified` (zoom 0.3-0.6): Compact label-only rectangle.
   - `dot` (zoom < 0.3): Colored circle.

7. **Drag-and-drop from palette.** The `ComponentPalette` implements HTML5 drag-and-drop. The `DesignCanvas` handles the `onDrop` event to create new nodes at the drop position using React Flow's `screenToFlowPosition()`.

## Consequences

### Positive

- 32 node types implemented with consistent behavior in under 1000 lines of shared code (`BaseNode`).
- Rich interaction (selection, multi-select, copy/paste, alignment guides) with minimal custom code.
- Active maintenance and TypeScript-first API from the xyflow team.
- `ReactFlowProvider` is scoped to just the system-design canvas, not the entire app.

### Negative

- React Flow is a significant dependency (~100KB). It only loads for the system-design module canvas.
- Custom overlays (heatmap, particle layer, request trace) required creative composition on top of React Flow's viewport system.
- The `as unknown as NodeTypes` cast is needed because React Flow's generic types and Architex's stricter types don't perfectly align.

## References

- Canvas component: `src/components/canvas/DesignCanvas.tsx`
- Node types registry: `src/components/canvas/nodes/system-design/index.ts`
- BaseNode: `src/components/canvas/nodes/system-design/BaseNode.tsx`
- Edge types: `src/components/canvas/edges/index.ts`
- Palette items: `src/lib/palette-items.ts`
- Package: `@xyflow/react` ^12.10.2 in `package.json`
