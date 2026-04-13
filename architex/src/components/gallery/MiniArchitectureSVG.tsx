"use client";

// ─────────────────────────────────────────────────────────────
// Architex — UIUX-047 Mini Architecture SVG Thumbnails
// Lightweight SVG topology diagrams for gallery cards.
// Uses CSS variables (--node-*) so colors adapt to themes.
// ─────────────────────────────────────────────────────────────

interface NodeDef {
  x: number;
  y: number;
  color: string;
  shape?: "circle" | "rect" | "diamond";
}

interface EdgeDef {
  from: number;
  to: number;
}

interface LayoutDef {
  nodes: NodeDef[];
  edges: EdgeDef[];
}

// ── Architecture layouts ────────────────────────────────────

const LAYOUTS: Record<string, LayoutDef> = {
  // CDN / video streaming: client -> CDN -> origin + edge caches -> storage
  cdn: {
    nodes: [
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 50, y: 28, color: "var(--node-networking)" },
      { x: 20, y: 48, color: "var(--node-compute)" },
      { x: 50, y: 48, color: "var(--node-compute)" },
      { x: 80, y: 48, color: "var(--node-compute)" },
      { x: 35, y: 70, color: "var(--node-processing)" },
      { x: 65, y: 70, color: "var(--node-processing)" },
      { x: 50, y: 90, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 7 },
    ],
  },

  // Chat system: clients -> LB -> WebSocket servers -> Redis pub/sub -> DB
  chat: {
    nodes: [
      { x: 20, y: 8, color: "var(--node-client)" },
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 80, y: 8, color: "var(--node-client)" },
      { x: 50, y: 30, color: "var(--node-networking)" },
      { x: 25, y: 52, color: "var(--node-compute)" },
      { x: 75, y: 52, color: "var(--node-compute)" },
      { x: 50, y: 72, color: "var(--node-messaging)", shape: "diamond" },
      { x: 50, y: 92, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
    ],
  },

  // Event-driven / e-commerce: API -> event bus -> consumers -> DBs
  "event-driven": {
    nodes: [
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 50, y: 26, color: "var(--node-networking)" },
      { x: 50, y: 46, color: "var(--node-messaging)", shape: "diamond" },
      { x: 15, y: 66, color: "var(--node-compute)" },
      { x: 50, y: 66, color: "var(--node-compute)" },
      { x: 85, y: 66, color: "var(--node-compute)" },
      { x: 15, y: 88, color: "var(--node-storage)" },
      { x: 50, y: 88, color: "var(--node-storage)" },
      { x: 85, y: 88, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 7 },
      { from: 5, to: 8 },
    ],
  },

  // Social feed: fan-out with cache layer
  "social-feed": {
    nodes: [
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 50, y: 26, color: "var(--node-networking)" },
      { x: 25, y: 44, color: "var(--node-compute)" },
      { x: 75, y: 44, color: "var(--node-compute)" },
      { x: 50, y: 60, color: "var(--node-messaging)", shape: "rect" },
      { x: 25, y: 78, color: "var(--node-processing)" },
      { x: 75, y: 78, color: "var(--node-storage)" },
      { x: 50, y: 92, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
    ],
  },

  // Data pipeline: sources -> ingestion -> processing -> analytics -> storage
  "data-pipeline": {
    nodes: [
      { x: 15, y: 10, color: "var(--node-client)" },
      { x: 50, y: 10, color: "var(--node-client)" },
      { x: 85, y: 10, color: "var(--node-client)" },
      { x: 50, y: 30, color: "var(--node-messaging)", shape: "diamond" },
      { x: 30, y: 52, color: "var(--node-processing)" },
      { x: 70, y: 52, color: "var(--node-processing)" },
      { x: 50, y: 72, color: "var(--node-compute)" },
      { x: 50, y: 92, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
    ],
  },

  // Infrastructure / K8s: control plane -> nodes -> pods -> services
  infrastructure: {
    nodes: [
      { x: 50, y: 8, color: "var(--node-security)", shape: "rect" },
      { x: 50, y: 28, color: "var(--node-observability)" },
      { x: 20, y: 48, color: "var(--node-compute)", shape: "rect" },
      { x: 50, y: 48, color: "var(--node-compute)", shape: "rect" },
      { x: 80, y: 48, color: "var(--node-compute)", shape: "rect" },
      { x: 20, y: 72, color: "var(--node-networking)" },
      { x: 50, y: 72, color: "var(--node-networking)" },
      { x: 80, y: 72, color: "var(--node-networking)" },
      { x: 50, y: 92, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 7 },
      { from: 6, to: 8 },
    ],
  },

  // Ride matching: clients -> LB -> matching engine -> geospatial + pricing -> DB
  "ride-matching": {
    nodes: [
      { x: 25, y: 8, color: "var(--node-client)" },
      { x: 75, y: 8, color: "var(--node-client)" },
      { x: 50, y: 26, color: "var(--node-networking)" },
      { x: 50, y: 44, color: "var(--node-compute)", shape: "diamond" },
      { x: 20, y: 64, color: "var(--node-processing)" },
      { x: 50, y: 64, color: "var(--node-processing)" },
      { x: 80, y: 64, color: "var(--node-observability)" },
      { x: 35, y: 88, color: "var(--node-storage)" },
      { x: 65, y: 88, color: "var(--node-messaging)", shape: "diamond" },
    ],
    edges: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 7 },
      { from: 5, to: 7 },
      { from: 6, to: 8 },
    ],
  },

  // Rate limiter: clients -> gateway -> limiter -> backend + Redis
  "rate-limiter": {
    nodes: [
      { x: 25, y: 10, color: "var(--node-client)" },
      { x: 75, y: 10, color: "var(--node-client)" },
      { x: 50, y: 30, color: "var(--node-networking)" },
      { x: 50, y: 50, color: "var(--node-security)", shape: "diamond" },
      { x: 80, y: 50, color: "var(--node-messaging)" },
      { x: 50, y: 72, color: "var(--node-compute)" },
      { x: 50, y: 92, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 5, to: 6 },
    ],
  },

  // Notification system: API -> router -> channels (push/email/SMS) -> queues -> delivery
  notification: {
    nodes: [
      { x: 50, y: 8, color: "var(--node-compute)" },
      { x: 50, y: 28, color: "var(--node-networking)" },
      { x: 15, y: 48, color: "var(--node-messaging)" },
      { x: 50, y: 48, color: "var(--node-messaging)" },
      { x: 85, y: 48, color: "var(--node-messaging)" },
      { x: 15, y: 70, color: "var(--node-processing)" },
      { x: 50, y: 70, color: "var(--node-processing)" },
      { x: 85, y: 70, color: "var(--node-processing)" },
      { x: 50, y: 90, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 7 },
      { from: 6, to: 8 },
    ],
  },

  // Payment processing: client -> gateway -> auth + fraud -> processor -> ledger
  payment: {
    nodes: [
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 50, y: 26, color: "var(--node-networking)" },
      { x: 25, y: 44, color: "var(--node-security)", shape: "diamond" },
      { x: 75, y: 44, color: "var(--node-security)", shape: "diamond" },
      { x: 50, y: 62, color: "var(--node-compute)" },
      { x: 25, y: 82, color: "var(--node-storage)" },
      { x: 75, y: 82, color: "var(--node-observability)" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
    ],
  },

  // ML pipeline: data sources -> feature store -> training + serving -> model store
  "ml-pipeline": {
    nodes: [
      { x: 20, y: 8, color: "var(--node-client)" },
      { x: 80, y: 8, color: "var(--node-client)" },
      { x: 50, y: 26, color: "var(--node-storage)", shape: "rect" },
      { x: 25, y: 48, color: "var(--node-processing)" },
      { x: 75, y: 48, color: "var(--node-compute)" },
      { x: 25, y: 70, color: "var(--node-observability)" },
      { x: 75, y: 70, color: "var(--node-networking)" },
      { x: 50, y: 90, color: "var(--node-storage)" },
    ],
    edges: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 7 },
    ],
  },

  // Analytics: sources -> stream ingest -> batch + stream processing -> warehouse + dashboard
  analytics: {
    nodes: [
      { x: 15, y: 8, color: "var(--node-client)" },
      { x: 50, y: 8, color: "var(--node-client)" },
      { x: 85, y: 8, color: "var(--node-client)" },
      { x: 50, y: 28, color: "var(--node-messaging)", shape: "diamond" },
      { x: 25, y: 50, color: "var(--node-processing)" },
      { x: 75, y: 50, color: "var(--node-processing)" },
      { x: 50, y: 72, color: "var(--node-storage)", shape: "rect" },
      { x: 50, y: 92, color: "var(--node-observability)" },
    ],
    edges: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
    ],
  },
};

// Map gallery entry IDs to layout keys
const ID_TO_LAYOUT: Record<string, string> = {
  "g-001": "cdn",
  "g-002": "chat",
  "g-003": "event-driven",
  "g-004": "social-feed",
  "g-005": "ml-pipeline",
  "g-006": "infrastructure",
  "g-007": "ride-matching",
  "g-008": "rate-limiter",
  "g-009": "notification",
  "g-010": "payment",
  "g-011": "social-feed",
  "g-012": "analytics",
};

// ── Node shape renderers ────────────────────────────────────

const NODE_RADIUS = 3.5;

function renderNode(node: NodeDef, index: number) {
  const { x, y, color, shape = "circle" } = node;

  switch (shape) {
    case "rect":
      return (
        <rect
          key={`n-${index}`}
          x={x - 4}
          y={y - 3}
          width={8}
          height={6}
          rx={1.2}
          fill={color}
          opacity={0.85}
        />
      );
    case "diamond":
      return (
        <polygon
          key={`n-${index}`}
          points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`}
          fill={color}
          opacity={0.85}
        />
      );
    default:
      return (
        <circle
          key={`n-${index}`}
          cx={x}
          cy={y}
          r={NODE_RADIUS}
          fill={color}
          opacity={0.85}
        />
      );
  }
}

function renderEdge(edge: EdgeDef, nodes: NodeDef[], index: number) {
  const fromNode = nodes[edge.from];
  const toNode = nodes[edge.to];
  if (!fromNode || !toNode) return null;

  return (
    <line
      key={`e-${index}`}
      x1={fromNode.x}
      y1={fromNode.y}
      x2={toNode.x}
      y2={toNode.y}
      stroke="var(--border)"
      strokeWidth={0.8}
      strokeOpacity={0.5}
    />
  );
}

// ── Component ───────────────────────────────────────────────

interface MiniArchitectureSVGProps {
  /** Gallery entry ID (e.g. "g-001") used to pick the layout. */
  entryId: string;
  className?: string;
}

export function MiniArchitectureSVG({
  entryId,
  className,
}: MiniArchitectureSVGProps) {
  const layoutKey = ID_TO_LAYOUT[entryId] ?? "event-driven";
  const layout = LAYOUTS[layoutKey] ?? LAYOUTS["event-driven"];

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Architecture diagram thumbnail"
    >
      {/* Edges first (below nodes) */}
      {layout.edges.map((edge, i) => renderEdge(edge, layout.nodes, i))}

      {/* Nodes on top */}
      {layout.nodes.map((node, i) => renderNode(node, i))}
    </svg>
  );
}
