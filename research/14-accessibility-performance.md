# Accessibility & Performance

> WCAG 2.2 compliance blueprint + React/Next.js performance optimization.

---

## ACCESSIBILITY

### Screen Reader Support
- Every diagram needs text alternative: "12 nodes. API Gateway connects to Auth Service..."
- `aria-live="polite"` for state change announcements
- `role="application"` on canvas (handle ALL keyboard events yourself)
- Node list sidebar as flat, navigable alternative

```tsx
<div role="application" aria-roledescription="system architecture diagram editor"
     aria-label={`${name} - ${nodes.length} nodes, ${edges.length} connections`}>
  <ReactFlow ... />
  <div role="status" aria-live="polite" className="sr-only">{statusMessage}</div>
</div>
```

### Keyboard Navigation (Spatial)
```typescript
function findNearestNode(current, allNodes, direction) {
  const candidates = allNodes.filter(n => {
    const dx = n.position.x - current.position.x;
    const dy = n.position.y - current.position.y;
    switch (direction) {
      case 'left': return dx < 0;
      case 'right': return dx > 0;
      case 'up': return dy < 0;
      case 'down': return dy > 0;
    }
  });
  return candidates.sort((a, b) => /* Euclidean distance */)[0] ?? null;
}
```

### WCAG 2.2 Checklist
| Requirement | Criterion | Priority |
|---|---|---|
| Full keyboard navigation | 2.1.1, 2.1.2 | P0 |
| No color-only information | 1.4.1 | P0 |
| Text alternatives | 1.1.1 | P0 |
| Focus visible | 2.4.7 | P0 |
| Sufficient contrast (4.5:1) | 1.4.3, 1.4.11 | P0 |
| Screen reader announcements | 4.1.2, 4.1.3 | P0 |
| Reduced motion support | 2.3.3 | P1 |
| High contrast mode | 1.4.11 | P1 |
| Target size (min 24×24px) | 2.5.8 | P1 |
| Dragging alternatives | 2.5.7 | P1 |

### Colorblind-Safe Palettes
- **IBM:** #648FFF, #785EF0, #DC267F, #FE6100, #FFB000
- **Wong:** #E69F00, #56B4E9, #009E73, #F0E442, #0072B2, #D55E00, #CC79A7

### Media Queries
```css
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }
@media (forced-colors: active) { .node { border: 2px solid ButtonText; background: Canvas; } }
@media (prefers-contrast: more) { :root { --node-border: 2px solid #000; } }
```

---

## PERFORMANCE

### React Optimization
- **Atomic Zustand stores** — separate viewport, nodes, edges, selection, simulation stores
- **React.memo** on ALL custom node/edge components
- **React Compiler** (React 19+) auto-memoizes
- **nodeTypes/edgeTypes outside component** (prevent re-registration)

### React Flow at Scale
- Disable animated edges for > 200 nodes
- `elevateEdgesOnSelect: false` to avoid z-index recalc
- Batch node/edge updates
- `fitView` only on initial load

### Web Workers
- Layout algorithms (dagre, elk, d3-force) → Web Worker via Comlink
- OffscreenCanvas for minimap rendering
- JSON parsing of large diagram files → Worker

### Code Splitting
```tsx
const DiagramEditor = dynamic(() => import('@/components/DiagramEditor'), { ssr: false, loading: () => <DiagramSkeleton /> });
```
- Lazy-load secondary panels (properties, history, minimap)
- Code-split by diagram type

### Performance Targets
| Metric | Target |
|---|---|
| Initial load (TTI) | < 3s on 4G |
| 100 nodes render | < 200ms |
| 1000 nodes render | < 1s |
| Pan/zoom FPS | 60fps |
| Node drag FPS | 60fps |
| Memory (500 nodes) | < 150MB |
| Main chunk (gzipped) | < 200KB |
| Lighthouse Performance | > 90 |

### i18n
- **Library:** `next-intl` (first-class App Router support)
- Don't translate technical terms (API Gateway, Redis, Kafka)
- CSS logical properties for RTL: `padding-inline-start` not `padding-left`
- Diagrams themselves don't flip for RTL (left-to-right data flow is universal)
