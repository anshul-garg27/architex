# How to Add a New Node Type

This guide covers adding a new system-design canvas node to Architex. A "node" is a draggable component on the React Flow canvas representing an infrastructure component (e.g., database, load balancer, message queue).

## Prerequisites

- Familiarity with React Flow v12 custom nodes and the Architex `BaseNode` component.
- An understanding of the palette, simulation, and SLA subsystems.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/components/canvas/nodes/system-design/YourNode.tsx` | Custom node component |
| 2 | `src/components/canvas/nodes/system-design/index.ts` | Register in `systemDesignNodeTypes` |
| 3 | `src/lib/palette-items.ts` | Add to drag-and-drop palette |
| 4 | `src/lib/simulation/what-if-engine.ts` | Add service rate + cost |
| 5 | `src/lib/simulation/sla-calculator.ts` | Add base availability |
| 6 | `src/components/shared/command-palette.tsx` | (Optional) Add quick-add command |

---

## Step 1: Create the node component

All system-design nodes extend `BaseNode`, which provides:

- Level-of-detail rendering (full / simplified / dot) based on zoom level.
- Category-based color theming via CSS custom properties.
- State indicator dot (idle, active, error, etc.).
- Throughput metrics badge.
- Source and target handles on all four sides.
- Context menu integration.

Create `src/components/canvas/nodes/system-design/YourNode.tsx`:

```tsx
// src/components/canvas/nodes/system-design/YourNode.tsx
'use client';

import React, { memo } from 'react';
import { Atom } from 'lucide-react';            // pick a fitting icon
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

/**
 * Default configuration values for YourNode.
 * These are used by the palette and command palette when creating new instances.
 */
export const YOUR_NODE_DEFAULTS = {
  instances: 1,
  maxConnections: 5000,
  processingTimeMs: 10,
} as const;

const YourNode = memo(function YourNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Atom size={16} />}
    />
  );
});

YourNode.displayName = 'YourNode';

export default YourNode;
```

### BaseNode props explained

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | React Flow node ID, passed through for context menu |
| `data` | `SystemDesignNodeData` | Node payload (label, category, config, metrics, state) |
| `selected` | `boolean` | Whether the node is selected on canvas |
| `icon` | `ReactNode` | Icon rendered in the node header |

The `SystemDesignNodeData` interface is defined in `src/lib/types.ts`:

```ts
export interface SystemDesignNodeData extends Record<string, unknown> {
  label: string;
  category: NodeCategory;
  componentType: string;
  icon: string;
  config: Record<string, number | string | boolean>;
  metrics?: {
    throughput?: number;
    latency?: number;
    errorRate?: number;
    utilization?: number;
    queueDepth?: number;
    cacheHitRate?: number;
  };
  state: 'idle' | 'active' | 'success' | 'warning' | 'error' | 'processing';
}
```

### Choosing a category

The `NodeCategory` type determines the node's color on the canvas. Pick the most appropriate one:

| Category | Color Variable | Use for |
|----------|---------------|---------|
| `compute` | `--node-compute` (blue) | Servers, functions, workers |
| `load-balancing` | `--node-networking` (purple) | LBs, gateways, proxies |
| `storage` | `--node-storage` (green) | Databases, caches, object stores |
| `messaging` | `--node-messaging` (orange) | Queues, pub/sub, event buses |
| `networking` | `--node-networking` (purple) | DNS, CDN edges, firewalls |
| `processing` | `--node-processing` (pink) | Batch, stream, ML inference |
| `client` | `--node-client` (cyan) | Browser, mobile, external APIs |
| `observability` | `--node-observability` (amber) | Metrics, logs, tracing |
| `security` | `--node-security` (red) | Auth, rate limiters, secret mgmt |

These colors are defined as CSS custom properties in `src/app/globals.css` and referenced in `BaseNode.tsx`.

---

## Step 2: Register in systemDesignNodeTypes

Open `src/components/canvas/nodes/system-design/index.ts` and add three things:

### 2a. Import the component

```ts
import YourNode from './YourNode';
```

### 2b. Add to the named exports

```ts
export {
  // ... existing exports ...
  YourNode,
};
```

### 2c. Export defaults constant

```ts
export { YOUR_NODE_DEFAULTS } from './YourNode';
```

### 2d. Add to the nodeTypes map

```ts
export const systemDesignNodeTypes = {
  // ... existing entries ...
  'your-node': YourNode,
} as const;
```

The key in `systemDesignNodeTypes` is the `type` string used in node data and palette items. It must be a unique kebab-case identifier. This map is consumed by `DesignCanvas.tsx`:

```ts
// src/components/canvas/DesignCanvas.tsx
const nodeTypes = systemDesignNodeTypes as unknown as NodeTypes;
// ...
<ReactFlow nodeTypes={nodeTypes} ... />
```

---

## Step 3: Add to the palette

Open `src/lib/palette-items.ts` and add a `PaletteItem` entry to the `PALETTE_ITEMS` array. Place it under the appropriate category comment:

```ts
// src/lib/palette-items.ts

// ── Compute ──  (or whichever category)
{
  type: "your-node",                    // must match systemDesignNodeTypes key
  label: "Your Component",
  category: "compute",                  // must match NodeCategory
  icon: "Atom",                         // lucide-react icon name as string
  description: "Short description of what this component does",
  defaultConfig: {
    instances: 1,
    maxConnections: 5000,
    processingTimeMs: 10,
  },
},
```

The `type` field must exactly match the key you added to `systemDesignNodeTypes` in Step 2d. The `icon` string is the PascalCase name of a lucide-react icon (used for serialization; the actual React component is in your node file).

The `ComponentPalette` in `src/components/canvas/panels/ComponentPalette.tsx` reads `PALETTE_ITEMS`, groups them by category using `groupByCategory()`, and renders them as draggable items.

---

## Step 4: Add simulation config

The simulation engine needs to know how to model your node's performance. Two files need updates:

### 4a. What-If Engine service rate

Open `src/lib/simulation/what-if-engine.ts` and add your component type to the `getNodeServiceRate()` switch statement:

```ts
// src/lib/simulation/what-if-engine.ts

function getNodeServiceRate(data: Record<string, unknown>): number {
  // ...
  switch (componentType) {
    // ... existing cases ...
    case 'your-node':
      return 1 / 10;   // 1 request per 10ms = 100 rps per instance
    default:
      return 1 / 1;
  }
}
```

The service rate is expressed as requests per millisecond (`1 / processingTimeMs`).

### 4b. What-If Engine cost estimate

In the same file, add to the `baseCosts` record in `estimateNodeCost()`:

```ts
const baseCosts: Record<string, number> = {
  // ... existing entries ...
  'your-node': 60,      // estimated monthly cost in USD per instance
};
```

---

## Step 5: Add SLA availability

Open `src/lib/simulation/sla-calculator.ts` and add your component type to the `COMPONENT_AVAILABILITY` record:

```ts
// src/lib/simulation/sla-calculator.ts

const COMPONENT_AVAILABILITY: Record<string, number> = {
  // ... existing entries ...
  'your-node': 0.999,   // 3 nines per single instance
};
```

This value represents the probability that a single instance is available at any given time. The SLA calculator uses the formula `1 - (1 - A)^N` for replicated instances.

Guidelines for availability values:

| Availability | Nines | Annual downtime | Typical for |
|-------------|-------|-----------------|-------------|
| 0.999 | 3 | 8.77 hours | Servers, workers |
| 0.9995 | ~3.5 | 4.38 hours | Databases |
| 0.9999 | 4 | 52.6 minutes | LBs, gateways, managed services |
| 0.99999 | 5 | 5.26 minutes | Object storage (S3) |

---

## Step 6 (Optional): Add a quick-add command

To let users add your node from the command palette (`Cmd+K`), open `src/components/shared/command-palette.tsx` and add an entry in the "Add Component" group:

```ts
{
  id: "add-your-node",
  label: "Add Your Component",
  icon: Atom,
  action: () => {
    const { addNode } = useCanvasStore.getState();
    addNode({
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "your-node",
      position: { x: 400 + Math.random() * 200, y: 300 + Math.random() * 200 },
      data: {
        label: "Your Component",
        category: "compute",
        componentType: "your-node",
        icon: "Atom",
        config: { instances: 1, maxConnections: 5000, processingTimeMs: 10 },
        metrics: {},
        state: "idle",
      },
    });
  },
  group: "Add Component",
},
```

---

## Verification checklist

1. `pnpm typecheck` passes with no errors.
2. Your node appears in the sidebar palette under the correct category.
3. Dragging it onto the canvas creates a node with the correct icon and color.
4. Selecting the node shows properties in the right panel.
5. Connecting edges to/from your node works (handles are inherited from BaseNode).
6. The simulation engine processes your node (check the metrics overlay).
7. The SLA calculator includes your node in availability calculations.
8. (If added) The command palette "Add Your Component" entry creates a node.

---

## Testing

Add a test case to the existing node test suite at `src/components/canvas/nodes/system-design/__tests__/SystemDesignNodes.test.tsx`. The standard pattern tests that the node renders without crashing and displays the correct label:

```tsx
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import YourNode from '../YourNode';

describe('YourNode', () => {
  const defaultProps = {
    id: 'test-your-node',
    data: {
      label: 'Test Component',
      category: 'compute' as const,
      componentType: 'your-node',
      icon: 'Atom',
      config: { instances: 1 },
      state: 'idle' as const,
    },
    selected: false,
    type: 'your-node',
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    zIndex: 0,
  };

  it('renders without crashing', () => {
    render(
      <ReactFlowProvider>
        <YourNode {...defaultProps} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
```
