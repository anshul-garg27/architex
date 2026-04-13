# PHASE 10: ACCESSIBILITY, PERFORMANCE, SECURITY, ENTERPRISE & MONETIZATION

> **Goal:** Achieve WCAG 2.2 AA compliance, hit all performance targets (FCP <1.2s, LCP <2.5s, INP <100ms, 60fps with 500 nodes), fix all 29 security vulnerabilities, build team and enterprise tiers, self-hosted Docker deployment, Stripe billing, and monetization triggers. This is the hardening phase.

---

## WHAT YOU ARE BUILDING

This is the final phase before production launch. Every corner is audited: accessibility for all users, performance under real-world load, security against all identified threats, enterprise features for team adoption, self-hosting for privacy-conscious users, and monetization infrastructure to sustain the business. Nothing ships without passing this phase.

---

## 1. WCAG 2.2 AA FULL AUDIT

### Keyboard Navigation

```typescript
// lib/accessibility/keyboard-navigation.ts

// Spatial arrow-key navigation between nodes
// Arrow keys move focus to nearest node in that direction
function findNearestNode(
  current: ArchitexNode,
  allNodes: ArchitexNode[],
  direction: 'left' | 'right' | 'up' | 'down'
): ArchitexNode | null {
  const candidates = allNodes.filter(n => {
    if (n.id === current.id) return false;
    const dx = n.position.x - current.position.x;
    const dy = n.position.y - current.position.y;
    switch (direction) {
      case 'left':  return dx < -20;    // threshold to avoid tiny movements
      case 'right': return dx > 20;
      case 'up':    return dy < -20;
      case 'down':  return dy > 20;
    }
  });

  if (candidates.length === 0) return null;

  // Sort by Euclidean distance, pick nearest
  return candidates.sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.position.x - current.position.x, 2) +
      Math.pow(a.position.y - current.position.y, 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.position.x - current.position.x, 2) +
      Math.pow(b.position.y - current.position.y, 2)
    );
    return distA - distB;
  })[0];
}

// Keyboard bindings for canvas:
// Arrow keys: Move focus between nodes (spatial)
// Tab: Move between UI regions (palette -> canvas -> properties -> bottom panel)
// Enter: Select focused node / confirm action
// Escape: Deselect / close panel / cancel drag
// Space: Toggle node expansion / play-pause simulation
// Delete/Backspace: Delete selected node
// Ctrl+A: Select all nodes
// Ctrl+C/V/X: Copy, paste, cut selected nodes
// Ctrl+Z/Y: Undo/redo

// ALL drag operations have keyboard alternatives:
// - Move node: Select + Arrow keys + hold Shift (moves 10px per press, 1px with Ctrl)
// - Connect nodes: Select source node, press 'C', use arrows to pick target, press Enter
// - Resize node: Select, press 'R', use arrows to resize, Enter to confirm
// - Pan canvas: Ctrl+Arrow keys
// - Zoom: Ctrl+Plus / Ctrl+Minus / Ctrl+0 (reset)
```

### Screen Reader Support

```typescript
// components/accessibility/ScreenReaderLayer.tsx

// 1. Text description of every diagram
function DiagramDescription({ nodes, edges }: { nodes: ArchitexNode[], edges: ArchitexEdge[] }) {
  const description = generateDiagramDescription(nodes, edges);
  // Example output:
  // "System architecture diagram with 12 nodes and 15 connections.
  //  API Gateway connects to Auth Service, User Service, and Product Service.
  //  User Service connects to PostgreSQL database (primary-replica).
  //  Product Service connects to Redis cache and Elasticsearch.
  //  All services are behind a load balancer."

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {description}
    </div>
  );
}

// 2. aria-live for state changes
function SimulationAnnouncer({ state }: { state: SimulationState }) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    switch (state.status) {
      case 'running':
        setAnnouncement(`Simulation started. Processing ${state.requestsPerSecond} requests per second.`);
        break;
      case 'paused':
        setAnnouncement('Simulation paused.');
        break;
      case 'completed':
        setAnnouncement(`Simulation complete. Average latency: ${state.avgLatency}ms. Error rate: ${state.errorRate}%.`);
        break;
      case 'error':
        setAnnouncement(`Simulation error: ${state.errorMessage}`);
        break;
    }
  }, [state.status]);

  return <div role="status" aria-live="assertive" className="sr-only">{announcement}</div>;
}

// 3. role="application" on canvas
function AccessibleCanvas({ children, nodes, edges }: any) {
  return (
    <div
      role="application"
      aria-roledescription="system architecture diagram editor"
      aria-label={`Diagram with ${nodes.length} components and ${edges.length} connections`}
      tabIndex={0}
      onKeyDown={handleCanvasKeyboard}
    >
      {children}
    </div>
  );
}

// 4. Node list sidebar as flat navigable alternative
function NodeListSidebar({ nodes, edges }: { nodes: ArchitexNode[], edges: ArchitexEdge[] }) {
  // Flat list of all nodes with their connections
  // Navigable via Tab/Arrow keys
  // Clicking a node in the list selects it on the canvas and scrolls to it

  return (
    <div role="list" aria-label="Diagram components">
      {nodes.map(node => (
        <div
          key={node.id}
          role="listitem"
          tabIndex={0}
          aria-label={`${node.data.label}, ${node.type}, ${getConnectionSummary(node, edges)}`}
          onClick={() => selectAndFocusNode(node.id)}
          onKeyDown={(e) => e.key === 'Enter' && selectAndFocusNode(node.id)}
        >
          <span className="font-medium">{node.data.label}</span>
          <span className="text-[#8B8D98] ml-2">({node.type})</span>
          <ul className="ml-4 text-sm text-[#62636C]">
            {getConnections(node, edges).map(conn => (
              <li key={conn.id}>
                {conn.direction === 'outgoing' ? 'connects to' : 'receives from'} {conn.targetLabel}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Visual Accessibility

```css
/* Colorblind-safe palettes */

/* IBM palette (default for node categories) */
:root[data-palette="ibm"] {
  --node-color-1: #648FFF;  /* blue */
  --node-color-2: #785EF0;  /* purple */
  --node-color-3: #DC267F;  /* magenta */
  --node-color-4: #FE6100;  /* orange */
  --node-color-5: #FFB000;  /* gold */
}

/* Wong palette (alternative) */
:root[data-palette="wong"] {
  --node-color-1: #E69F00;  /* orange */
  --node-color-2: #56B4E9;  /* sky blue */
  --node-color-3: #009E73;  /* teal */
  --node-color-4: #F0E442;  /* yellow */
  --node-color-5: #0072B2;  /* blue */
  --node-color-6: #D55E00;  /* vermillion */
  --node-color-7: #CC79A7;  /* pink */
}

/* prefers-reduced-motion: set ALL animations to 0ms */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Disable particle effects entirely */
  .particle-layer { display: none !important; }

  /* Disable animated edges */
  .react-flow__edge-path { animation: none !important; }

  /* Disable confetti */
  canvas.confetti-canvas { display: none !important; }
}

/* prefers-contrast: more -> high contrast theme */
@media (prefers-contrast: more) {
  :root {
    --bg-base: #000000;
    --bg-surface: #0A0A0A;
    --text-primary: #FFFFFF;
    --text-secondary: #CCCCCC;
    --border-default: #666666;
    --border-hover: #999999;
    --border-focus: #FFFFFF;
  }

  .react-flow__node {
    border-width: 2px;
    border-color: #FFFFFF;
  }

  .react-flow__edge-path {
    stroke-width: 2.5;
  }
}

/* forced-colors -> Windows High Contrast mode */
@media (forced-colors: active) {
  .react-flow__node {
    border: 2px solid ButtonText;
    background: Canvas;
    color: CanvasText;
    forced-color-adjust: none;
  }

  .react-flow__edge-path {
    stroke: LinkText;
  }

  .react-flow__handle {
    background: Highlight;
    border: 2px solid ButtonText;
  }

  button, [role="button"] {
    border: 2px solid ButtonText;
  }
}

/* Focus ring: 2px solid, always visible on keyboard navigation */
:focus-visible {
  outline: 2px solid var(--border-focus, #6E56CF);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Never show focus ring on mouse click (only keyboard) */
:focus:not(:focus-visible) {
  outline: none;
}

/* Minimum contrast: 4.5:1 for normal text, 3:1 for large text */
/* All text colors verified against backgrounds:
   --text-primary (#EDEDEF) on --bg-base (#0C0D0F) = 18.2:1
   --text-secondary (#8B8D98) on --bg-base (#0C0D0F) = 5.8:1
   --text-tertiary (#62636C) on --bg-base (#0C0D0F) = 3.7:1 (used only for labels, 14px+ bold = large text)
*/
```

### Motor Accessibility

```css
/* Touch targets: minimum 44x44px */
.react-flow__handle {
  width: 20px;    /* visible size */
  height: 20px;
  /* But the hit area is larger: */
  padding: 12px;  /* makes effective hit area 44x44px */
}

button, [role="button"], .clickable {
  min-width: 44px;
  min-height: 44px;
}

/* Generous hit areas on drag handles */
.drag-handle {
  /* Visual: 8px handle */
  /* Hit area: 44px via padding */
  padding: 18px;
  margin: -18px;
}

/* Node resize handles */
.resize-handle {
  width: 12px;
  height: 12px;
  /* Invisible padding expands hit area */
  box-shadow: 0 0 0 16px transparent;
}
```

---

## 2. PERFORMANCE TARGETS

### Target Numbers

```
Metric                    Target        Measurement
------                    ------        -----------
First Contentful Paint    < 1.2s        Lighthouse (desktop)
Largest Contentful Paint  < 2.5s        Lighthouse (desktop)
Interaction to Next Paint < 100ms       Lighthouse (desktop)
Time to Interactive       < 3s          Lighthouse (desktop)
100 nodes render          < 200ms       Performance.measure()
500 nodes render          < 500ms       Performance.measure()
Pan/zoom/drag             60fps         PerformanceObserver(longtask)
WASM initial load         < 500ms       Performance.measure()
Initial JS bundle         < 250KB gz    size-limit CI check
Lighthouse desktop        95+           Lighthouse CI
Lighthouse mobile         90+           Lighthouse CI
```

### React Optimization

```typescript
// 1. React.memo ALL custom nodes and edges
const ServiceNode = React.memo(function ServiceNode({ data }: NodeProps<ServiceNodeData>) {
  return (
    <div className="service-node">
      <Handle type="target" position={Position.Left} />
      <div className="label">{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

// 2. Static nodeTypes/edgeTypes OUTSIDE component (prevent re-registration)
// WRONG:
// function Canvas() {
//   const nodeTypes = { service: ServiceNode };  // recreated every render!
//   return <ReactFlow nodeTypes={nodeTypes} />;
// }

// CORRECT:
const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  cache: CacheNode,
  queue: QueueNode,
  'load-balancer': LoadBalancerNode,
  cdn: CDNNode,
  'api-gateway': ApiGatewayNode,
  client: ClientNode,
  storage: StorageNode,
  monitoring: MonitoringNode,
};
// Define ONCE at module level, pass to <ReactFlow nodeTypes={nodeTypes} />

// 3. Batched updates
// When loading a diagram, use batch operations:
import { batch } from 'zustand';

function loadDiagram(data: DiagramData) {
  // DON'T: Set nodes then edges (2 state updates = 2 renders)
  // DO: Batch into single update
  useCanvasStore.setState({
    nodes: data.nodes,
    edges: data.edges,
  });
}

// 4. Level of Detail (LOD) at zoom thresholds
function useLOD(zoom: number) {
  return useMemo(() => {
    if (zoom < 0.3) return 'minimal';     // Labels only, no icons/details
    if (zoom < 0.7) return 'standard';    // Labels + basic shapes
    return 'detailed';                     // Full detail with ports, metrics, badges
  }, [zoom]);
}

// LOD rendering in custom nodes:
const ServiceNode = React.memo(function ServiceNode({ data }: NodeProps) {
  const zoom = useStore(state => state.transform[2]);
  const lod = useLOD(zoom);

  return (
    <div className="service-node">
      {lod === 'minimal' && <span>{data.label}</span>}
      {lod === 'standard' && (
        <>
          <Icon name={data.icon} size={16} />
          <span>{data.label}</span>
        </>
      )}
      {lod === 'detailed' && (
        <>
          <Handle type="target" position={Position.Left} />
          <Icon name={data.icon} size={20} />
          <span>{data.label}</span>
          <MetricsBadge metrics={data.metrics} />
          <Handle type="source" position={Position.Right} />
        </>
      )}
    </div>
  );
});

// 5. Disable animated edges when > 200 nodes
function useAnimatedEdges(nodeCount: number) {
  return nodeCount <= 200;
}

// 6. OffscreenCanvas for minimap
// Render minimap on a separate OffscreenCanvas to avoid
// main thread blocking during pan/zoom
function MinimapWorker() {
  // Use OffscreenCanvas + transferControlToOffscreen()
  // Worker renders simplified node rectangles
  // Updated at 10fps (not 60fps) to save CPU
}

// 7. Particle path pre-computation cache
const pathCache = new Map<string, Path2D>();

function getParticlePath(edgeId: string, points: Point[]): Path2D {
  const key = `${edgeId}-${points.map(p => `${p.x},${p.y}`).join('-')}`;
  if (pathCache.has(key)) return pathCache.get(key)!;

  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y);
  }
  pathCache.set(key, path);
  return path;
}

// 8. Zustand atomic selectors (NEVER subscribe to full array)
// WRONG:
// const nodes = useCanvasStore(state => state.nodes);
// This re-renders whenever ANY node changes

// CORRECT:
// Subscribe to individual node or derived value:
const nodeCount = useCanvasStore(state => state.nodes.length);
const selectedNodeIds = useCanvasStore(state => state.selectedNodes);
const specificNode = useCanvasStore(state => state.nodes.find(n => n.id === nodeId));
```

### Lazy Loading Strategy

```typescript
// 9. Lazy-load heavy dependencies
// Monaco Editor (~2MB): load only when code panel opens
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// WASM module: load on first simulation
const loadWasm = lazy(() => import('../wasm/simulation'));

// Bottom panels: load when first opened
const MetricsPanel = lazy(() => import('./panels/MetricsPanel'));
const CodePanel = lazy(() => import('./panels/CodePanel'));
const TimelinePanel = lazy(() => import('./panels/TimelinePanel'));

// 10. Tree-shake D3 (only import d3-force, not all of D3)
// WRONG: import * as d3 from 'd3';           // 500KB+
// CORRECT: import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';  // ~15KB
```

### Bundle Analysis CI

```typescript
// .size-limit.json
[
  {
    "path": ".next/static/chunks/main-*.js",
    "limit": "250 KB",
    "gzip": true
  },
  {
    "path": ".next/static/chunks/pages/index-*.js",
    "limit": "100 KB",
    "gzip": true
  },
  {
    "path": ".next/static/chunks/wasm-*.wasm",
    "limit": "500 KB"
  }
]

// CI workflow:
// - Run `pnpm size-limit` on every PR
// - Fail if any bundle exceeds limit
// - Report size diff in PR comment via size-limit/action
```

---

## 3. SECURITY AUDIT (29 VULNERABILITIES)

### All Vulnerabilities from research/43-security-threat-model.md

#### 5 CRITICAL Fixes (Must fix before launch)

```typescript
// FIX 1.1: requireAuth() on EVERY server boundary
// lib/auth.ts
import { auth } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return userId;
}

// EVERY API route, server action, and server component that accesses
// user data MUST call requireAuth():
// app/api/evaluate/route.ts:     const userId = await requireAuth();
// app/api/hint/route.ts:         const userId = await requireAuth();
// app/api/generate/route.ts:     const userId = await requireAuth();
// app/api/community/*/route.ts:  const userId = await requireAuth();
// app/api/gamification/*/route.ts: const userId = await requireAuth();
// app/api/srs/*/route.ts:        const userId = await requireAuth();
// ... EVERY SINGLE ONE


// FIX 1.2: PartyKit JWT auth
// Already implemented in Phase 7 party/diagram.ts
// Verify: EVERY onConnect validates Clerk JWT
// Verify: Invalid/expired tokens get conn.close(4001)


// FIX 2.1: XSS sanitization with DOMPurify + Zod
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Sanitize all user-provided strings before storage AND rendering
const nodeDataSchema = z.object({
  label: z.string().max(100).transform(s => DOMPurify.sanitize(s)),
  description: z.string().max(500).optional().transform(s => s ? DOMPurify.sanitize(s) : s),
  config: z.record(z.unknown()),
});

// Apply at WRITE boundary (API routes that accept user content):
// - Node creation/update
// - Comment creation
// - Design title/description
// - Profile bio


// FIX 4.2: API key protection
// NEVER prefix Anthropic/Resend/etc keys with NEXT_PUBLIC_
// CI check to prevent accidental exposure:
// .github/workflows/ci.yml:
//   - name: Check for exposed API keys
//     run: |
//       if grep -r "NEXT_PUBLIC_.*API_KEY\|NEXT_PUBLIC_.*SECRET" .env* src/ app/ lib/ 2>/dev/null; then
//         echo "ERROR: API keys must not be prefixed with NEXT_PUBLIC_"
//         exit 1
//       fi


// FIX 8.1: Sentry scrubbing
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // ... other config
  beforeSend(event) {
    // Scrub sensitive data from error reports
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    if (event.request?.data) {
      // Remove any field that might contain secrets
      const data = typeof event.request.data === 'string'
        ? JSON.parse(event.request.data)
        : event.request.data;
      delete data.apiKey;
      delete data.token;
      delete data.password;
      event.request.data = JSON.stringify(data);
    }
    // Scrub environment variables from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => {
        if (b.data) {
          delete b.data.ANTHROPIC_API_KEY;
          delete b.data.RESEND_API_KEY;
          delete b.data.DATABASE_URL;
        }
        return b;
      });
    }
    return event;
  },
});
```

#### CSP Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval'",            // WASM needs this
      "style-src 'self' 'unsafe-inline'",                 // Tailwind needs inline
      "img-src 'self' data: https: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.architex.dev wss://architex-collab.partykit.dev https://*.clerk.accounts.dev https://*.posthog.com https://*.sentry.io",
      "frame-src 'self'",                                 // plugins get iframes
      "frame-ancestors 'self'",                           // prevent clickjacking
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

// Apply in next.config.js:
// async headers() {
//   return [{ source: '/:path*', headers: securityHeaders }];
// }
```

#### CORS Configuration

```typescript
// middleware.ts (or individual API routes)
const ALLOWED_ORIGINS = [
  'https://architex.dev',
  'https://www.architex.dev',
  'https://embed.architex.dev',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
].filter(Boolean);

function corsHeaders(origin: string) {
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
```

#### Rate Limiting (Arcjet)

```typescript
// lib/rate-limit.ts
import arcjet, { tokenBucket, detectBot } from '@arcjet/next';

// Different rate limits for different endpoints:
export const evaluationLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({ mode: 'LIVE', refillRate: 5, interval: 60, capacity: 10 }),  // 5/min, burst 10
    detectBot({ mode: 'LIVE', allow: [] }),
  ],
});

export const hintLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({ mode: 'LIVE', refillRate: 10, interval: 60, capacity: 20 }),  // 10/min
  ],
});

export const communityLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({ mode: 'LIVE', refillRate: 30, interval: 60, capacity: 60 }),  // 30/min
  ],
});

export const ogImageLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({ mode: 'LIVE', refillRate: 20, interval: 60, capacity: 40 }),
  ],
});

// Usage in route:
// const decision = await evaluationLimiter.protect(req);
// if (decision.isDenied()) return Response.json({ error: 'Rate limited' }, { status: 429 });
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install
      - run: pnpm build
      - uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: '.lighthouserc.json'
          uploadArtifacts: true

# .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/problems/design-url-shortener"]
    }
  }
}
```

---

## 4. TEAM TIER

### Shared Workspaces

```typescript
// Team workspaces use the same Yjs collaboration from Phase 7
// but with team-scoped rooms and persistent state

interface TeamWorkspace {
  id: string;
  teamId: string;
  name: string;
  description: string;
  members: TeamMember[];
  diagrams: DiagramRef[];
  createdAt: Date;
}

interface TeamMember {
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
}

// Team rooms: Yjs room ID = `team-${teamId}-${diagramId}`
// PartyKit validates: user is member of team AND has correct role
```

### Team Progress Dashboard (Manager View)

```typescript
// app/(main)/team/dashboard/page.tsx
interface TeamDashboard {
  teamId: string;
  summary: {
    totalMembers: number;
    activeThisWeek: number;
    challengesCompletedThisWeek: number;
    avgScore: number;
    topPerformer: { name: string; score: number };
  };
  memberProgress: MemberProgress[];
  skillHeatmap: SkillHeatmapData;    // module x member matrix
  weeklyTrend: WeeklyTrendData[];
}

interface MemberProgress {
  userId: string;
  name: string;
  avatar: string;
  level: number;
  challengesCompleted: number;
  avgScore: number;
  streak: number;
  weakAreas: string[];              // modules scoring below team avg
  recentActivity: ActivityItem[];
}

// Skill heatmap: rows = team members, columns = modules
// Cell color = competency level (red → yellow → green)
// Click cell to see individual member's scores in that module
```

### Mock Interview Pairing

```typescript
// lib/team/interview-pairing.ts
interface InterviewPairing {
  id: string;
  teamId: string;
  interviewer: string;       // userId
  candidate: string;         // userId
  challengeId: string;
  scheduledAt: Date;
  duration: number;          // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  feedback: InterviewFeedback | null;
}

// Matching algorithm:
// 1. Pair members who haven't paired recently (fairness)
// 2. Pair stronger member as interviewer with weaker as candidate
// 3. Random challenge at candidate's current level
// 4. Both join same Yjs room — interviewer can see candidate's work
// 5. After session, interviewer fills feedback form
```

### Custom Learning Paths

```typescript
// Admin creates curricula for the team
interface LearningPath {
  id: string;
  teamId: string;
  title: string;            // "New Hire Onboarding" or "Senior Engineer Readiness"
  description: string;
  createdBy: string;        // admin userId
  modules: LearningPathModule[];
  deadline: Date | null;
  assignedTo: string[];     // userIds
}

interface LearningPathModule {
  order: number;
  type: 'challenge' | 'concept' | 'lesson';
  itemId: string;
  required: boolean;
}

// Team leaderboard: same as global but scoped to team members only
// Separate from global leaderboard
```

### SSO (SAML/OIDC)

```typescript
// For teams with 10+ members
// Clerk supports SAML SSO out of the box:
// - Admin configures SAML provider (Okta, Azure AD, Google Workspace)
// - Clerk handles SAML flow, maps SAML attributes to user profile
// - Team members log in via company SSO, auto-assigned to team

// Configuration in Clerk dashboard:
// Organization > SSO > Add SAML Connection
// Provide: Metadata URL, Entity ID, ACS URL
// Map attributes: email, firstName, lastName, role
```

---

## 5. ENTERPRISE TIER

### Custom Content Modules

```typescript
// Enterprise customers can upload company-specific problems
interface CustomContent {
  id: string;
  organizationId: string;
  type: 'challenge' | 'template' | 'lesson';
  title: string;
  content: any;              // same schema as public content
  visibility: 'organization'; // only visible to org members
  createdBy: string;
  createdAt: Date;
}

// Admin portal: /enterprise/content
// - Upload challenges (JSON or form builder)
// - Upload templates
// - Reorder learning paths
// - Tag with internal categories
```

### Skills Assessment

```typescript
// Track engineer readiness across dimensions
interface SkillsAssessment {
  userId: string;
  organizationId: string;
  assessedAt: Date;
  dimensions: {
    systemDesign: number;        // 0-100
    algorithms: number;
    dataStructures: number;
    lld: number;
    database: number;
    distributed: number;
    networking: number;
    os: number;
    concurrency: number;
    security: number;
    mlDesign: number;
  };
  readinessLevel: 'not-ready' | 'developing' | 'ready' | 'exceeds';
  recommendations: string[];
}

// Auto-calculated from:
// - Challenge scores (weighted by difficulty)
// - SRS mastery levels
// - Number of completed challenges per module
// - Trend (improving, stable, declining)

// Manager report: "3 of 5 engineers are interview-ready for L5 system design"
```

### LMS Integration (SCORM/LTI)

```typescript
// SCORM (Sharable Content Object Reference Model)
// - Package Architex lessons as SCORM 1.2 or 2004 modules
// - Track: completion, score, time spent
// - Export: SCORM manifest (imsmanifest.xml)
// - LMS systems: Moodle, Canvas, Cornerstone, Workday Learning

// LTI (Learning Tools Interoperability)
// - LTI 1.3 provider: Architex embeds in LMS
// - Deep linking: link directly to specific challenges
// - Grade passback: send scores back to LMS gradebook
// - Configuration: provide LTI credentials to LMS admin

interface LTIConfig {
  issuer: string;
  clientId: string;
  deploymentId: string;
  publicKeyUrl: string;
  authUrl: string;
  tokenUrl: string;
}
```

### SOC 2 Compliance Path

```
SOC 2 Type II Requirements:

1. Security
   - [x] Encryption at rest (Neon Postgres TDE)
   - [x] Encryption in transit (TLS everywhere)
   - [x] Auth + RBAC (Clerk)
   - [x] Input validation (Zod)
   - [x] Rate limiting (Arcjet)
   - [ ] Penetration testing (schedule annually)
   - [ ] Vulnerability scanning (Snyk/Dependabot)

2. Availability
   - [x] Multi-region deployment (Vercel edge)
   - [x] Database backups (Neon automated)
   - [ ] SLA documentation (99.9%)
   - [ ] Incident response plan
   - [ ] Status page (Betteruptime or similar)

3. Confidentiality
   - [x] Data classification policy
   - [x] Access controls per role
   - [x] API key management
   - [ ] Data retention policy (document)
   - [ ] Vendor assessment (Clerk, Neon, Vercel, Anthropic)

4. Processing Integrity
   - [x] Input validation on all endpoints
   - [x] Audit logging (PostHog events)
   - [ ] Data processing documentation
   - [ ] Change management process

5. Privacy
   - [ ] Privacy policy
   - [ ] GDPR deletion cascade (Inngest workflow from research/43)
   - [ ] Data Processing Agreement with all vendors
   - [ ] Cookie consent banner
   - [ ] Data export (user request)

Timeline: ~6-12 months for Type II (continuous monitoring period)
Cost: ~$20-50K for auditor
```

### Additional Enterprise Features

```
- Dedicated success manager (human, for $25+/user/mo accounts)
- SLA 99.9% with credits for downtime
- Invoice billing NET 30/60 (Stripe invoicing)
- Custom branding / white-label:
  - Replace logo
  - Custom color scheme (CSS variables)
  - Custom domain (CNAME to architex)
  - Remove "Powered by Architex" footer
- API access: programmatic access to all features
  - REST API with API key auth
  - Webhook events for completion, scoring
  - Batch operations for bulk user management
- On-premise deployment (see Section 6: Self-Hosted Docker)
```

---

## 6. SELF-HOSTED DOCKER

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build Rust WASM modules
FROM rust:1.77-slim AS wasm-builder
WORKDIR /wasm
RUN cargo install wasm-pack
COPY wasm/ ./
RUN wasm-pack build --target web --release

# Stage 2: Build Next.js application
FROM node:20-slim AS nextjs-builder
WORKDIR /app
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Copy WASM output from Stage 1
COPY --from=wasm-builder /wasm/pkg ./public/wasm/

# Build Next.js (standalone output mode)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=nextjs-builder /app/public ./public
COPY --from=nextjs-builder /app/.next/standalone ./
COPY --from=nextjs-builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://architex:${POSTGRES_PASSWORD}@postgres:5432/architex
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=http://localhost:3000
      - UMAMI_URL=http://umami:3001
      # No Clerk, no PostHog, no Anthropic (replaced with self-hosted alternatives)
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=architex
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=architex
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U architex"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      - DATABASE_URL=postgresql://architex:${POSTGRES_PASSWORD}@postgres:5432/umami
      - DATABASE_TYPE=postgresql
    ports:
      - "3001:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### Self-Hosted Replacements

```typescript
// Replace managed services with self-hosted alternatives:

// 1. Clerk -> Better Auth (self-hosted auth)
// lib/auth-self-hosted.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: {
    provider: 'pg',
    url: process.env.DATABASE_URL!,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,       // refresh daily
  },
});

// 2. PostHog -> Umami or Plausible (self-hosted analytics)
// Umami: lightweight, GDPR-friendly, no cookies
// Plausible: similar, has more features
// Both run as Docker containers alongside the app

// 3. Neon Postgres -> Standard PostgreSQL
// The docker-compose includes a postgres:16-alpine container
// Drizzle ORM works identically with standard Postgres
// Just change the DATABASE_URL

// 4. Vercel -> Any Node.js hosting
// Next.js standalone output works with any Node.js runtime
// Recommended: Docker on AWS ECS, GCP Cloud Run, or bare metal

// 5. AI features -> Optional (bring your own API key)
// Self-hosted users provide their own Anthropic API key
// Or disable AI features entirely (evaluation, hints, generation)
```

---

## 7. PRICING PAGE & STRIPE INTEGRATION

### Stripe Setup

```typescript
// lib/billing/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Product and Price IDs (create in Stripe dashboard):
const PRICE_IDS = {
  pro_monthly: 'price_xxx_pro_monthly',      // $19/mo
  pro_annual: 'price_xxx_pro_annual',         // $144/yr ($12/mo)
  team_monthly: 'price_xxx_team_monthly',     // $9/user/mo
  team_annual: 'price_xxx_team_annual',       // $9/user/mo billed annually
};

// Checkout flow
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  quantity: number = 1
): Promise<string> {
  const user = await getUserById(userId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{
      price: priceId,
      quantity,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId,
    },
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    billing_address_collection: 'required',
  });

  return session.url!;
}

// Subscription management (customer portal)
export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });
  return session.url;
}

// Webhook handler for subscription events
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await activateSubscription(session.metadata.userId, session.subscription as string);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await updateSubscription(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await cancelSubscription(subscription);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await handlePaymentFailure(invoice);
      break;
    }
  }

  return Response.json({ received: true });
}
```

### Pricing Tiers

```typescript
const PRICING_TIERS = {
  free: {
    name: "Free",
    price: { monthly: 0, annual: 0 },
    limits: {
      simulationsPerMonth: 5,
      aiEvaluationsPerMonth: 3,
      hintsPerDay: 5,
      exportFormats: ['json', 'png'],
      collaboration: false,
      srs: false,
      offlineAccess: false,
    },
  },
  pro: {
    name: "Pro",
    price: { monthly: 19, annual: 144 },  // $12/mo billed annually
    limits: {
      simulationsPerMonth: Infinity,
      aiEvaluationsPerMonth: Infinity,
      hintsPerDay: Infinity,
      exportFormats: ['json', 'png', 'svg', 'pdf', 'mermaid', 'plantuml', 'drawio', 'terraform', 'code'],
      collaboration: true,
      srs: true,
      offlineAccess: true,
    },
  },
  team: {
    name: "Team",
    price: { monthly: 9, annual: 108 },  // $9/user/mo
    minUsers: 3,
    limits: {
      // Everything in Pro plus:
      sharedWorkspaces: true,
      teamDashboard: true,
      mockInterviewPairing: true,
      customLearningPaths: true,
      teamLeaderboard: true,
      sso: true,  // for 10+ users
    },
  },
  enterprise: {
    name: "Enterprise",
    price: { monthly: 'custom', annual: 'custom' },  // ~$25/user/mo
    limits: {
      // Everything in Team plus:
      customContent: true,
      skillsAssessment: true,
      lmsIntegration: true,
      soc2: true,
      dedicatedSupport: true,
      sla: '99.9%',
      invoiceBilling: true,  // NET 30/60
      customBranding: true,
      apiAccess: true,
      onPremise: true,
    },
  },
};
```

### Feature Gating

```typescript
// lib/billing/feature-gate.ts
import { getCurrentSubscription } from './stripe';

export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; reason?: string; upgradeUrl?: string }> {
  const subscription = await getCurrentSubscription(userId);
  const tier = subscription?.tier || 'free';
  const limits = PRICING_TIERS[tier].limits;

  switch (feature) {
    case 'ai_evaluation':
      if (tier === 'free') {
        const used = await getMonthlyUsage(userId, 'ai_evaluation');
        if (used >= limits.aiEvaluationsPerMonth) {
          return { allowed: false, reason: 'Free tier limit: 3 AI evaluations/month', upgradeUrl: '/pricing' };
        }
      }
      return { allowed: true };

    case 'export_mermaid':
    case 'export_terraform':
    case 'export_plantuml':
      if (tier === 'free') {
        return { allowed: false, reason: 'Pro feature: advanced export formats', upgradeUrl: '/pricing' };
      }
      return { allowed: true };

    case 'collaboration':
      if (tier === 'free') {
        return { allowed: false, reason: 'Pro feature: real-time collaboration', upgradeUrl: '/pricing' };
      }
      return { allowed: true };

    case 'srs':
      if (tier === 'free') {
        return { allowed: false, reason: 'Pro feature: spaced repetition', upgradeUrl: '/pricing' };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}
```

---

## 8. MONETIZATION TRIGGERS

### Conversion Triggers

```typescript
// lib/monetization/conversion-triggers.ts

// Trigger 1: After 5 free simulations
// Show: "You've used 5 of 5 free simulations this month. Upgrade to Pro for unlimited."
// Timing: Immediately after 5th simulation completes
// UI: Modal with score card + upgrade CTA

// Trigger 2: After viewing advanced content preview
// Show: "This is a Pro feature. Start your 7-day free trial to access AI evaluation."
// Timing: When user clicks on a Pro-gated feature
// UI: Overlay on the gated content with blurred preview

// Trigger 3: After 2 weeks of active use
// Show: "You've been practicing for 14 days! Upgrade to Pro to unlock unlimited access and never lose your streak."
// Timing: Day 14 login
// UI: Full-page celebratory modal with progress stats

// Trigger 4: After completing a mock interview
// Show: "Want detailed AI feedback on your design? Upgrade to Pro."
// Timing: After submitting a challenge in free mode (limited feedback)
// UI: Score card with some dimensions locked/blurred

interface ConversionTrigger {
  id: string;
  condition: (user: UserState) => boolean;
  message: string;
  cta: string;
  ctaUrl: string;
  priority: number;        // higher = more important
  cooldown: number;        // seconds before showing again
  maxShows: number;        // max times to show this trigger
}

const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    id: 'free-sim-limit',
    condition: (u) => u.tier === 'free' && u.monthlySimulations >= 5,
    message: "You've used all 5 free simulations this month.",
    cta: "Upgrade to Pro — Unlimited Simulations",
    ctaUrl: '/pricing?ref=sim-limit',
    priority: 10,
    cooldown: 86400,      // once per day
    maxShows: 5,
  },
  {
    id: 'advanced-preview',
    condition: (u) => u.tier === 'free' && u.viewedProFeature,
    message: "This feature is available on Pro.",
    cta: "Start 7-Day Free Trial",
    ctaUrl: '/pricing?ref=pro-preview',
    priority: 8,
    cooldown: 3600,       // once per hour
    maxShows: 10,
  },
  {
    id: 'two-week-active',
    condition: (u) => u.tier === 'free' && u.activeDays >= 14,
    message: "You've been practicing for 2 weeks! Take your learning to the next level.",
    cta: "Upgrade to Pro — Save 20% Annually",
    ctaUrl: '/pricing?ref=2-week',
    priority: 9,
    cooldown: 604800,     // once per week
    maxShows: 3,
  },
  {
    id: 'post-interview',
    condition: (u) => u.tier === 'free' && u.justCompletedChallenge,
    message: "Want AI-powered feedback on your design?",
    cta: "Unlock AI Evaluation",
    ctaUrl: '/pricing?ref=post-interview',
    priority: 7,
    cooldown: 86400,
    maxShows: 5,
  },
];

// Track trigger impressions:
// posthog.capture('conversion_trigger_shown', { triggerId, context })
// posthog.capture('conversion_trigger_clicked', { triggerId, context })
// posthog.capture('conversion_trigger_dismissed', { triggerId, context })
```

### Referral Program

```typescript
// lib/monetization/referrals.ts
interface ReferralProgram {
  // "Give a friend 1 month free, get 1 month free"
  referrerReward: string;      // 1 month Pro free
  refereeReward: string;       // 1 month Pro free
  tiers: ReferralTier[];
}

interface ReferralTier {
  referrals: number;
  reward: string;
}

const REFERRAL_TIERS: ReferralTier[] = [
  { referrals: 1,  reward: "1 month Pro free" },
  { referrals: 3,  reward: "1 month Pro free" },   // cumulative: 4 months
  { referrals: 5,  reward: "1 month Pro free" },   // cumulative: 5+ months
  { referrals: 10, reward: "3 months Pro free" },
  { referrals: 25, reward: "Lifetime Pro + Ambassador badge" },
];

// Implementation:
// 1. Each user gets unique referral link: architex.dev/ref/{code}
// 2. Referee signs up via link -> stored in referral_signups table
// 3. When referee upgrades to paid -> referrer gets credit
// 4. Credit applied as Stripe coupon or subscription extension
// 5. Referral dashboard: /settings/referrals showing stats + link

interface ReferralRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  signedUpAt: Date;
  convertedAt: Date | null;    // when referee upgraded to paid
  rewardApplied: boolean;
}

// Database:
export const referrals = pgTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id),
  refereeId: text('referee_id').notNull().references(() => users.id),
  referralCode: text('referral_code').notNull(),
  signedUpAt: timestamp('signed_up_at').defaultNow(),
  convertedAt: timestamp('converted_at'),
  rewardApplied: boolean('reward_applied').default(false),
});
```

---

## FILES TO CREATE/MODIFY

```
lib/
  accessibility/
    keyboard-navigation.ts          -- Spatial arrow-key navigation
    screen-reader.ts                -- Diagram description generator
    focus-management.ts             -- Focus ring + tab order management
  billing/
    stripe.ts                       -- Stripe client + checkout + portal
    feature-gate.ts                 -- Feature access checking
    subscription.ts                 -- Subscription management
  monetization/
    conversion-triggers.ts          -- Upgrade prompt triggers
    referrals.ts                    -- Referral program logic
  security/
    rate-limit.ts                   -- Arcjet rate limiters
    csp.ts                          -- CSP header configuration
    cors.ts                         -- CORS configuration
    sanitize.ts                     -- DOMPurify + Zod validation
  auth-self-hosted.ts               -- Better Auth for self-hosted mode

components/
  accessibility/
    ScreenReaderLayer.tsx            -- aria-live announcements
    NodeListSidebar.tsx             -- Flat navigable node list
    KeyboardHelp.tsx                -- Keyboard shortcut reference
    SkipNavigation.tsx              -- Skip-to-content links
  billing/
    PricingPage.tsx                 -- Pricing tiers display
    CheckoutButton.tsx              -- Stripe checkout trigger
    SubscriptionManager.tsx         -- Current plan + upgrade/downgrade
    UpgradeModal.tsx                -- Conversion trigger modal
  team/
    TeamDashboard.tsx               -- Manager progress view
    SkillHeatmap.tsx                -- Module x member heatmap
    InterviewPairing.tsx            -- Mock interview scheduler
    LearningPathEditor.tsx          -- Custom curriculum builder

app/
  api/
    webhooks/stripe/route.ts        -- Stripe webhook handler
    billing/
      checkout/route.ts             -- Create checkout session
      portal/route.ts               -- Create portal session
      usage/route.ts                -- Get feature usage
  (main)/
    team/
      dashboard/page.tsx            -- Team dashboard
      members/page.tsx              -- Team member management
      interviews/page.tsx           -- Mock interview scheduling
      paths/page.tsx                -- Learning path management
    settings/
      billing/page.tsx              -- Subscription management
      referrals/page.tsx            -- Referral dashboard
    pricing/page.tsx                -- Public pricing page

src/db/schema/
  billing.ts                        -- Subscriptions, usage, referrals
  team.ts                           -- Teams, members, workspaces

styles/
  accessibility.css                 -- Reduced motion, high contrast, forced colors

Dockerfile                          -- Multi-stage build
docker-compose.yml                  -- Full self-hosted stack

.lighthouserc.json                  -- Lighthouse CI config
.size-limit.json                    -- Bundle size limits

sentry.client.config.ts             -- (modify) Add beforeSend scrubbing
sentry.server.config.ts             -- (modify) Add beforeSend scrubbing
next.config.js                      -- (modify) Add security headers
middleware.ts                       -- (modify) Add CORS + rate limiting
```

---

## DEPENDENCIES TO INSTALL

```bash
# Security
pnpm add @arcjet/next             # Rate limiting
pnpm add dompurify                # XSS sanitization
pnpm add @types/dompurify -D

# Billing
pnpm add stripe                   # Stripe SDK
pnpm add @stripe/stripe-js        # Stripe client-side

# Self-hosted auth
pnpm add better-auth              # Self-hosted auth alternative

# Self-hosted analytics
# Umami runs as a separate Docker container (no npm package needed)

# Accessibility testing
pnpm add -D axe-core @axe-core/react  # Automated a11y testing
pnpm add -D @testing-library/jest-dom  # Already from Phase 1

# Performance
pnpm add -D @next/bundle-analyzer     # Bundle analysis
pnpm add -D size-limit @size-limit/preset-app  # Already from Phase 1
```

---

## ACCEPTANCE CRITERIA

### Accessibility
- [ ] Arrow keys navigate spatially between nodes on canvas
- [ ] Tab moves between UI regions (palette, canvas, properties, bottom panel)
- [ ] Enter selects focused node, Escape deselects
- [ ] ALL drag operations have keyboard alternatives
- [ ] Screen reader announces diagram description on focus
- [ ] aria-live announces simulation state changes
- [ ] role="application" on canvas with proper aria-roledescription
- [ ] Node list sidebar provides flat navigable alternative
- [ ] Colorblind-safe palette (IBM/Wong) applied by default
- [ ] prefers-reduced-motion removes ALL animations (0ms duration)
- [ ] prefers-contrast: more activates high contrast theme
- [ ] forced-colors compatible with Windows High Contrast
- [ ] Focus ring 2px solid, always visible on keyboard navigation
- [ ] All touch targets minimum 44x44px
- [ ] axe-core automated tests pass with 0 violations

### Performance
- [ ] FCP < 1.2s (Lighthouse desktop)
- [ ] LCP < 2.5s (Lighthouse desktop)
- [ ] INP < 100ms (Lighthouse desktop)
- [ ] TTI < 3s (Lighthouse desktop)
- [ ] 100 nodes render in < 200ms
- [ ] 500 nodes render in < 500ms
- [ ] 60fps maintained during pan, zoom, and drag
- [ ] WASM loads in < 500ms
- [ ] Initial JS bundle < 250KB gzipped
- [ ] Lighthouse desktop 95+, mobile 90+
- [ ] React.memo on ALL custom nodes and edges
- [ ] nodeTypes defined outside component (static)
- [ ] LOD switches at zoom thresholds (0.3, 0.7)
- [ ] Animated edges disabled when > 200 nodes
- [ ] Zustand selectors are atomic (never subscribe to full array)
- [ ] Monaco/WASM/bottom panels are lazy-loaded
- [ ] D3 tree-shaken to d3-force only
- [ ] size-limit CI check passes on every PR
- [ ] Bundle analyzer report generated in CI

### Security
- [ ] requireAuth() on every API route and server action
- [ ] PartyKit validates JWT on every onConnect
- [ ] DOMPurify + Zod sanitization on all user input at write boundary
- [ ] No API keys prefixed with NEXT_PUBLIC_ (CI check)
- [ ] Sentry beforeSend scrubs authorization headers, tokens, env vars
- [ ] CSP headers set on all routes
- [ ] CORS allows only whitelisted origins
- [ ] Rate limiting on all API endpoints via Arcjet
- [ ] HSTS, X-Content-Type-Options, Permissions-Policy headers set
- [ ] All 5 Critical and 14 High vulnerabilities from research/43 resolved

### Team & Enterprise
- [ ] Shared workspaces with team Yjs rooms
- [ ] Team progress dashboard shows member stats + skill heatmap
- [ ] Mock interview pairing matches team members
- [ ] Custom learning paths created by admin
- [ ] Team leaderboard scoped to team members
- [ ] SSO (SAML/OIDC) via Clerk for 10+ user teams
- [ ] Enterprise: custom content upload portal
- [ ] Enterprise: skills assessment auto-calculated from activity
- [ ] Enterprise: SCORM/LTI export for LMS integration

### Self-Hosted Docker
- [ ] Multi-stage Dockerfile builds successfully
- [ ] docker-compose starts app + postgres + umami
- [ ] Better Auth handles signup, login, OAuth
- [ ] Umami tracks page views and events
- [ ] Standard PostgreSQL works with Drizzle ORM
- [ ] App functions without Clerk, PostHog, or Anthropic

### Billing & Monetization
- [ ] Stripe checkout creates subscription
- [ ] Stripe customer portal manages subscription
- [ ] Webhook handles subscription.created, updated, deleted, payment_failed
- [ ] Feature gating enforces free tier limits (5 sims, 3 AI evals)
- [ ] Pro features gated behind subscription check
- [ ] Conversion triggers show at correct moments with cooldowns
- [ ] Referral links generate and track signups
- [ ] Referral rewards apply at 3, 10, 25 referral milestones
- [ ] Pricing page shows Free / Pro ($12/mo annual) / Team ($9/user) / Enterprise
