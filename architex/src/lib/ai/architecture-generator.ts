// ── AIX-011: AI Architecture Generator ──────────────────────────────
//
// Client-side mock architecture generator. Uses keyword-based matching
// to map a natural-language description to one of 8 pre-built reference
// architectures. Returns nodes, edges, and reasoning suitable for
// rendering on a React Flow canvas.
//
// AI-006: Optionally uses Claude Sonnet to generate architectures from
// free-form natural language descriptions when AI is configured.

import type { NodeCategory, EdgeType } from '@/lib/types';
import { ClaudeClient } from './claude-client';
import { PALETTE_ITEMS } from '@/lib/palette-items';

// ── Types ───────────────────────────────────────────────────────────

export interface ArchNode {
  id: string;
  label: string;
  category: NodeCategory;
  componentType: string;
  /** Canvas position */
  x: number;
  y: number;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  edgeType: EdgeType;
  label?: string;
}

export interface GeneratedArchitecture {
  name: string;
  description: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
  reasoning: string;
}

export type ArchitectureKey =
  | 'url-shortener'
  | 'chat-app'
  | 'social-feed'
  | 'e-commerce'
  | 'video-streaming'
  | 'ride-sharing'
  | 'payment-system'
  | 'notification-service';

// ── Keyword mapping ─────────────────────────────────────────────────

interface KeywordMapping {
  keywords: string[];
  key: ArchitectureKey;
}

const KEYWORD_MAPPINGS: KeywordMapping[] = [
  { keywords: ['url', 'shorten', 'short link', 'tiny', 'bitly', 'link'], key: 'url-shortener' },
  { keywords: ['chat', 'messaging', 'instant message', 'whatsapp', 'slack', 'real-time message', 'messenger'], key: 'chat-app' },
  { keywords: ['feed', 'social', 'timeline', 'twitter', 'facebook', 'instagram', 'post', 'newsfeed'], key: 'social-feed' },
  { keywords: ['e-commerce', 'ecommerce', 'shop', 'store', 'cart', 'product', 'amazon', 'marketplace', 'order'], key: 'e-commerce' },
  { keywords: ['video', 'stream', 'youtube', 'netflix', 'media', 'vod', 'hls', 'transcod'], key: 'video-streaming' },
  { keywords: ['ride', 'uber', 'lyft', 'taxi', 'driver', 'trip', 'dispatch', 'cab'], key: 'ride-sharing' },
  { keywords: ['payment', 'pay', 'stripe', 'transaction', 'billing', 'checkout', 'wallet', 'money'], key: 'payment-system' },
  { keywords: ['notification', 'notify', 'alert', 'push', 'email', 'sms', 'webhook'], key: 'notification-service' },
];

// ── Pre-built architectures ─────────────────────────────────────────

function node(
  id: string,
  label: string,
  category: NodeCategory,
  componentType: string,
  x: number,
  y: number,
): ArchNode {
  return { id, label, category, componentType, x, y };
}

function edge(
  id: string,
  source: string,
  target: string,
  edgeType: EdgeType,
  label?: string,
): ArchEdge {
  return { id, source, target, edgeType, ...(label ? { label } : {}) };
}

const ARCHITECTURES: Record<ArchitectureKey, GeneratedArchitecture> = {
  'url-shortener': {
    name: 'URL Shortener',
    description: 'A scalable URL shortening service with caching and analytics.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 0),
      node('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7', 250, 0),
      node('api', 'API Server', 'compute', 'web-server', 500, 0),
      node('cache', 'Redis Cache', 'storage', 'redis', 500, 150),
      node('db', 'PostgreSQL', 'storage', 'postgresql', 500, 300),
      node('analytics', 'Analytics Worker', 'processing', 'worker', 750, 150),
      node('kafka', 'Kafka', 'messaging', 'kafka', 750, 0),
    ],
    edges: [
      edge('e1', 'client', 'lb', 'http', 'HTTPS'),
      edge('e2', 'lb', 'api', 'http'),
      edge('e3', 'api', 'cache', 'cache-lookup'),
      edge('e4', 'api', 'db', 'db-query'),
      edge('e5', 'api', 'kafka', 'event-stream', 'Click Events'),
      edge('e6', 'kafka', 'analytics', 'event-stream'),
    ],
    reasoning:
      'Uses Base62 encoding for short URLs. Redis cache for hot URLs reduces DB load. Kafka decouples click analytics from the write path. Horizontal scaling via stateless API servers behind L7 load balancer.',
  },

  'chat-app': {
    name: 'Chat Application',
    description: 'A real-time chat system with WebSocket connections, message persistence, and presence tracking.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 100),
      node('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7', 250, 100),
      node('ws', 'WebSocket Server', 'compute', 'web-server', 500, 0),
      node('api', 'API Server', 'compute', 'web-server', 500, 200),
      node('redis', 'Redis (Pub/Sub)', 'messaging', 'redis', 750, 0),
      node('db', 'Cassandra', 'storage', 'cassandra', 750, 200),
      node('presence', 'Presence Service', 'compute', 'microservice', 500, 350),
      node('push', 'Push Notification', 'processing', 'worker', 750, 350),
    ],
    edges: [
      edge('e1', 'client', 'lb', 'http'),
      edge('e2', 'lb', 'ws', 'websocket', 'WS Upgrade'),
      edge('e3', 'lb', 'api', 'http'),
      edge('e4', 'ws', 'redis', 'event-stream', 'Pub/Sub'),
      edge('e5', 'api', 'db', 'db-query', 'Store Messages'),
      edge('e6', 'api', 'presence', 'grpc'),
      edge('e7', 'presence', 'redis', 'cache-lookup', 'Heartbeat'),
      edge('e8', 'api', 'push', 'message-queue', 'Offline Users'),
    ],
    reasoning:
      'WebSocket servers maintain persistent connections. Redis Pub/Sub fans out messages across server instances. Cassandra provides high-write-throughput message storage partitioned by conversation_id. Presence service uses Redis with TTL-based heartbeats.',
  },

  'social-feed': {
    name: 'Social Feed',
    description: 'A social media feed system with fan-out-on-write, caching, and search.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 100),
      node('cdn', 'CDN', 'networking', 'cdn', 150, 0),
      node('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7', 300, 100),
      node('api', 'API Server', 'compute', 'web-server', 500, 100),
      node('fanout', 'Fan-out Service', 'processing', 'worker', 500, 250),
      node('feed-cache', 'Feed Cache (Redis)', 'storage', 'redis', 700, 0),
      node('db', 'PostgreSQL', 'storage', 'postgresql', 700, 100),
      node('search', 'Elasticsearch', 'storage', 'elasticsearch', 700, 250),
      node('blob', 'Blob Storage (S3)', 'storage', 's3', 500, 0),
    ],
    edges: [
      edge('e1', 'client', 'cdn', 'http', 'Static Assets'),
      edge('e2', 'client', 'lb', 'http'),
      edge('e3', 'lb', 'api', 'http'),
      edge('e4', 'api', 'feed-cache', 'cache-lookup', 'Read Feed'),
      edge('e5', 'api', 'db', 'db-query'),
      edge('e6', 'api', 'fanout', 'message-queue', 'New Post'),
      edge('e7', 'fanout', 'feed-cache', 'cache-lookup', 'Write Feed'),
      edge('e8', 'api', 'search', 'http', 'Search Query'),
      edge('e9', 'api', 'blob', 'http', 'Upload Media'),
    ],
    reasoning:
      'Fan-out-on-write for normal users pre-computes feeds into Redis sorted sets. Celebrity posts use fan-out-on-read to avoid write amplification. CDN serves static assets. Elasticsearch powers full-text search over posts.',
  },

  'e-commerce': {
    name: 'E-Commerce Platform',
    description: 'An online marketplace with product catalogue, cart, ordering, and payment processing.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 100),
      node('cdn', 'CDN', 'networking', 'cdn', 150, 0),
      node('gateway', 'API Gateway', 'networking', 'api-gateway', 300, 100),
      node('product', 'Product Service', 'compute', 'microservice', 500, 0),
      node('cart', 'Cart Service', 'compute', 'microservice', 500, 100),
      node('order', 'Order Service', 'compute', 'microservice', 500, 200),
      node('payment', 'Payment Service', 'compute', 'microservice', 700, 200),
      node('db-product', 'Product DB', 'storage', 'postgresql', 700, 0),
      node('cache', 'Redis Cache', 'storage', 'redis', 700, 100),
      node('queue', 'Order Queue', 'messaging', 'sqs', 500, 350),
    ],
    edges: [
      edge('e1', 'client', 'cdn', 'http'),
      edge('e2', 'client', 'gateway', 'http'),
      edge('e3', 'gateway', 'product', 'http'),
      edge('e4', 'gateway', 'cart', 'http'),
      edge('e5', 'gateway', 'order', 'http'),
      edge('e6', 'product', 'db-product', 'db-query'),
      edge('e7', 'product', 'cache', 'cache-lookup'),
      edge('e8', 'order', 'payment', 'grpc'),
      edge('e9', 'order', 'queue', 'message-queue', 'Fulfilment'),
    ],
    reasoning:
      'Microservices architecture with an API gateway for routing, rate limiting, and auth. Product catalogue cached in Redis for fast reads. Order processing is asynchronous via SQS to handle payment and fulfilment independently.',
  },

  'video-streaming': {
    name: 'Video Streaming Platform',
    description: 'A video upload, transcoding, and adaptive-bitrate streaming service.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 100),
      node('cdn', 'CDN', 'networking', 'cdn', 200, 0),
      node('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7', 200, 200),
      node('api', 'API Server', 'compute', 'web-server', 400, 100),
      node('upload', 'Upload Service', 'compute', 'microservice', 400, 250),
      node('transcode', 'Transcoder', 'processing', 'worker', 600, 250),
      node('blob', 'Object Storage (S3)', 'storage', 's3', 600, 0),
      node('db', 'Metadata DB', 'storage', 'postgresql', 600, 100),
      node('queue', 'Transcode Queue', 'messaging', 'sqs', 400, 350),
    ],
    edges: [
      edge('e1', 'client', 'cdn', 'http', 'Stream Video'),
      edge('e2', 'client', 'lb', 'http'),
      edge('e3', 'lb', 'api', 'http'),
      edge('e4', 'lb', 'upload', 'http', 'Upload'),
      edge('e5', 'upload', 'blob', 'http', 'Raw Video'),
      edge('e6', 'upload', 'queue', 'message-queue'),
      edge('e7', 'queue', 'transcode', 'message-queue'),
      edge('e8', 'transcode', 'blob', 'http', 'HLS Segments'),
      edge('e9', 'api', 'db', 'db-query'),
    ],
    reasoning:
      'Upload service stores raw video in S3, then enqueues a transcode job. Workers transcode to multiple resolutions (360p, 720p, 1080p) in HLS format. CDN serves video segments for adaptive bitrate playback. Metadata (titles, thumbnails) stored in PostgreSQL.',
  },

  'ride-sharing': {
    name: 'Ride Sharing Platform',
    description: 'A location-aware ride-hailing system with real-time matching and tracking.',
    nodes: [
      node('rider', 'Rider App', 'client', 'mobile-app', 0, 0),
      node('driver', 'Driver App', 'client', 'mobile-app', 0, 250),
      node('gateway', 'API Gateway', 'networking', 'api-gateway', 250, 125),
      node('matching', 'Matching Service', 'compute', 'microservice', 500, 0),
      node('location', 'Location Service', 'compute', 'microservice', 500, 125),
      node('trip', 'Trip Service', 'compute', 'microservice', 500, 250),
      node('redis', 'Geospatial Index (Redis)', 'storage', 'redis', 750, 0),
      node('db', 'PostgreSQL', 'storage', 'postgresql', 750, 250),
      node('kafka', 'Kafka', 'messaging', 'kafka', 750, 125),
    ],
    edges: [
      edge('e1', 'rider', 'gateway', 'http'),
      edge('e2', 'driver', 'gateway', 'http'),
      edge('e3', 'gateway', 'matching', 'http'),
      edge('e4', 'gateway', 'location', 'websocket', 'Location Updates'),
      edge('e5', 'gateway', 'trip', 'http'),
      edge('e6', 'matching', 'redis', 'cache-lookup', 'Geosearch'),
      edge('e7', 'location', 'redis', 'cache-lookup', 'Store Location'),
      edge('e8', 'trip', 'db', 'db-query'),
      edge('e9', 'location', 'kafka', 'event-stream', 'Location Events'),
    ],
    reasoning:
      'Redis GEOSEARCH powers proximity-based driver matching. Location Service receives high-frequency GPS updates over WebSocket and stores in Redis sorted sets. Kafka streams location events for ETA calculation and analytics. Trip Service persists trip lifecycle in PostgreSQL.',
  },

  'payment-system': {
    name: 'Payment System',
    description: 'A payment processing system with idempotency, reconciliation, and ledger.',
    nodes: [
      node('client', 'Client', 'client', 'web-browser', 0, 100),
      node('gateway', 'API Gateway', 'networking', 'api-gateway', 200, 100),
      node('payment-api', 'Payment API', 'compute', 'microservice', 400, 0),
      node('ledger', 'Ledger Service', 'compute', 'microservice', 400, 200),
      node('processor', 'Payment Processor', 'processing', 'worker', 600, 0),
      node('db', 'PostgreSQL (Ledger)', 'storage', 'postgresql', 600, 200),
      node('idempotency', 'Idempotency Store (Redis)', 'storage', 'redis', 400, 100),
      node('queue', 'Payment Queue', 'messaging', 'sqs', 600, 100),
      node('webhook', 'Webhook Delivery', 'processing', 'worker', 800, 100),
    ],
    edges: [
      edge('e1', 'client', 'gateway', 'http'),
      edge('e2', 'gateway', 'payment-api', 'http'),
      edge('e3', 'payment-api', 'idempotency', 'cache-lookup', 'Check Idempotency'),
      edge('e4', 'payment-api', 'queue', 'message-queue'),
      edge('e5', 'queue', 'processor', 'message-queue'),
      edge('e6', 'processor', 'ledger', 'grpc', 'Record Txn'),
      edge('e7', 'ledger', 'db', 'db-query'),
      edge('e8', 'processor', 'webhook', 'message-queue', 'Notification'),
    ],
    reasoning:
      'Idempotency keys in Redis prevent duplicate charges. Payment requests are enqueued for reliable processing. Ledger service uses double-entry bookkeeping in PostgreSQL with serialisable isolation. Webhook delivery runs asynchronously with retry.',
  },

  'notification-service': {
    name: 'Notification Service',
    description: 'A multi-channel notification system supporting push, email, SMS, and in-app messages.',
    nodes: [
      node('producer', 'Producer Service', 'compute', 'microservice', 0, 100),
      node('api', 'Notification API', 'compute', 'web-server', 250, 100),
      node('router', 'Channel Router', 'processing', 'worker', 450, 100),
      node('queue-push', 'Push Queue', 'messaging', 'sqs', 650, 0),
      node('queue-email', 'Email Queue', 'messaging', 'sqs', 650, 100),
      node('queue-sms', 'SMS Queue', 'messaging', 'sqs', 650, 200),
      node('db', 'Preference DB', 'storage', 'postgresql', 450, 250),
      node('push-worker', 'Push Worker', 'processing', 'worker', 850, 0),
      node('email-worker', 'Email Worker', 'processing', 'worker', 850, 100),
      node('sms-worker', 'SMS Worker', 'processing', 'worker', 850, 200),
    ],
    edges: [
      edge('e1', 'producer', 'api', 'http'),
      edge('e2', 'api', 'router', 'message-queue'),
      edge('e3', 'router', 'db', 'db-query', 'Check Prefs'),
      edge('e4', 'router', 'queue-push', 'message-queue'),
      edge('e5', 'router', 'queue-email', 'message-queue'),
      edge('e6', 'router', 'queue-sms', 'message-queue'),
      edge('e7', 'queue-push', 'push-worker', 'message-queue'),
      edge('e8', 'queue-email', 'email-worker', 'message-queue'),
      edge('e9', 'queue-sms', 'sms-worker', 'message-queue'),
    ],
    reasoning:
      'Channel router reads user preferences and fans out to per-channel queues. Each channel has independent workers with its own retry and rate-limiting policy. Dead letter queues capture failed deliveries. Preference DB allows per-user channel opt-in/out.',
  },
};

// ── Generator ───────────────────────────────────────────────────────

/**
 * Match a description string to an architecture using keyword-based matching.
 * Returns the matching architecture key, or null if no match is found.
 */
export function matchArchitecture(description: string): ArchitectureKey | null {
  const lower = description.toLowerCase();

  let bestMatch: ArchitectureKey | null = null;
  let bestScore = 0;

  for (const mapping of KEYWORD_MAPPINGS) {
    let score = 0;
    for (const keyword of mapping.keywords) {
      if (lower.includes(keyword)) {
        // Longer keywords are weighted higher to prefer specific matches
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping.key;
    }
  }

  return bestMatch;
}

/**
 * Retrieve a pre-built architecture by key.
 */
export function getArchitecture(key: ArchitectureKey): GeneratedArchitecture {
  return ARCHITECTURES[key];
}

/**
 * Get all available architecture keys.
 */
export function getAvailableArchitectures(): ArchitectureKey[] {
  return Object.keys(ARCHITECTURES) as ArchitectureKey[];
}

/**
 * Generate an architecture from a natural-language description.
 *
 * Uses keyword matching to select a pre-built reference architecture.
 * Returns { nodes, edges, reasoning } suitable for rendering on a canvas.
 *
 * Falls back to 'url-shortener' if no keywords match (simplest design).
 */
export function generateArchitecture(description: string): GeneratedArchitecture {
  const key = matchArchitecture(description);
  if (key) {
    return ARCHITECTURES[key];
  }

  // Fallback: return a generic architecture with a note
  return {
    ...ARCHITECTURES['url-shortener'],
    name: 'Generic Service',
    description: `Could not identify a specific architecture for "${description}". Showing a generic web service as a starting point.`,
    reasoning:
      'No specific architecture matched the description. This generic service includes common patterns: load balancer, API servers, cache, database, and async processing. Modify it to fit your specific requirements.',
  };
}

// ── AI-006: Claude-powered architecture generation ──────────────────

/** Allowlist of valid component types from the palette. */
const ALLOWED_COMPONENT_TYPES = new Set(PALETTE_ITEMS.map((p) => p.type));

/** Map a component type to its palette category. */
const TYPE_TO_CATEGORY = new Map<string, NodeCategory>(
  PALETTE_ITEMS.map((p) => [p.type, p.category]),
);

export interface GenerationConstraints {
  maxNodes?: number;
  requiredComponents?: string[];
  budget?: number;
}

/** Simple dagre-like auto-layout for generated nodes. */
function autoLayout(nodes: ArchNode[]): ArchNode[] {
  const COLS = 4;
  const X_GAP = 250;
  const Y_GAP = 150;
  return nodes.map((n, i) => ({
    ...n,
    x: (i % COLS) * X_GAP,
    y: Math.floor(i / COLS) * Y_GAP,
  }));
}

/**
 * Generate a system design architecture from a natural language
 * description using Claude Sonnet.
 *
 * Falls back to template-based `generateArchitecture` when AI is
 * not configured.
 */
export async function generateArchitectureWithAI(
  description: string,
  constraints?: GenerationConstraints,
): Promise<GeneratedArchitecture> {
  const client = ClaudeClient.getInstance();

  // Fall back to template-based generation
  if (!client.isConfigured()) {
    return generateArchitecture(description);
  }

  const maxNodes = constraints?.maxNodes ?? 12;
  const required = constraints?.requiredComponents ?? [];
  const allowedList = Array.from(ALLOWED_COMPONENT_TYPES).join(', ');

  try {
    const response = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are a senior systems architect. Generate a system design architecture as a JSON object. Only use component types from this allowlist: ${allowedList}`,
      userMessage: `Design a system architecture for: "${description}"

Constraints:
- Maximum ${maxNodes} nodes
${required.length > 0 ? `- Must include: ${required.join(', ')}` : ''}
${constraints?.budget ? `- Budget: $${constraints.budget}/month` : ''}

Return a JSON object (no markdown fences):
{
  "name": "<architecture name>",
  "description": "<1-2 sentence description>",
  "nodes": [
    { "id": "<unique-id>", "label": "<display name>", "componentType": "<from allowlist>", "x": 0, "y": 0 }
  ],
  "edges": [
    { "id": "<edge-id>", "source": "<node-id>", "target": "<node-id>", "edgeType": "<http|grpc|graphql|websocket|message-queue|event-stream|db-query|cache-lookup|replication>", "label": "<optional label>" }
  ],
  "reasoning": "<explanation of design decisions>"
}

Rules:
1. All node IDs must be unique and referenced correctly in edges.
2. All componentType values MUST come from the allowlist.
3. All edge source/target MUST reference existing node IDs.
4. Generate a production-ready architecture, not a toy example.`,
      maxTokens: 2048,
      cacheKey: `archgen:${description.slice(0, 100)}:${maxNodes}`,
      cacheTtlMs: 3_600_000,
    });

    const parsed = JSON.parse(response.text) as {
      name?: string;
      description?: string;
      nodes?: Array<{ id: string; label: string; componentType: string; x?: number; y?: number }>;
      edges?: Array<{ id: string; source: string; target: string; edgeType?: string; label?: string }>;
      reasoning?: string;
    };

    if (!parsed.nodes || !parsed.edges) {
      return generateArchitecture(description);
    }

    // Validate and map nodes
    const nodeIds = new Set(parsed.nodes.map((n) => n.id));
    const validNodes: ArchNode[] = parsed.nodes.map((n) => {
      const componentType = ALLOWED_COMPONENT_TYPES.has(n.componentType)
        ? n.componentType
        : 'web-server'; // fallback
      const category = TYPE_TO_CATEGORY.get(componentType) ?? 'compute';
      return {
        id: n.id,
        label: n.label,
        category,
        componentType,
        x: n.x ?? 0,
        y: n.y ?? 0,
      };
    });

    // Validate edges — only keep those with valid source/target
    const validEdges: ArchEdge[] = (parsed.edges ?? [])
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        edgeType: (e.edgeType ?? 'http') as EdgeType,
        ...(e.label ? { label: e.label } : {}),
      }));

    // Auto-layout for non-overlapping positions
    const layoutNodes = autoLayout(validNodes);

    return {
      name: parsed.name ?? 'AI-Generated Architecture',
      description: parsed.description ?? description,
      nodes: layoutNodes,
      edges: validEdges,
      reasoning: parsed.reasoning ?? 'Generated by Claude AI.',
    };
  } catch {
    // AI call failed — fall back to template-based generation
    return generateArchitecture(description);
  }
}

/**
 * Iteratively refine an existing architecture with an AI instruction.
 * E.g. "add caching" or "add rate limiting".
 *
 * Falls back to returning the existing architecture unmodified if AI
 * is not configured.
 */
export async function refineArchitectureWithAI(
  existing: GeneratedArchitecture,
  instruction: string,
): Promise<GeneratedArchitecture> {
  const client = ClaudeClient.getInstance();
  if (!client.isConfigured()) return existing;

  const allowedList = Array.from(ALLOWED_COMPONENT_TYPES).join(', ');

  try {
    const response = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are a senior systems architect. Modify an existing architecture based on instructions. Only use component types from: ${allowedList}`,
      userMessage: `Current architecture: ${existing.name}
Nodes: ${JSON.stringify(existing.nodes.map((n) => ({ id: n.id, label: n.label, componentType: n.componentType })))}
Edges: ${JSON.stringify(existing.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, edgeType: e.edgeType })))}

Instruction: "${instruction}"

Return the COMPLETE updated architecture as JSON (no markdown fences):
{
  "name": "<name>",
  "description": "<description>",
  "nodes": [...],
  "edges": [...],
  "reasoning": "<what was changed and why>"
}`,
      maxTokens: 2048,
    });

    const parsed = JSON.parse(response.text) as {
      name?: string;
      description?: string;
      nodes?: Array<{ id: string; label: string; componentType: string }>;
      edges?: Array<{ id: string; source: string; target: string; edgeType?: string; label?: string }>;
      reasoning?: string;
    };

    if (!parsed.nodes || !parsed.edges) return existing;

    const nodeIds = new Set(parsed.nodes.map((n) => n.id));
    const validNodes: ArchNode[] = parsed.nodes.map((n) => {
      const componentType = ALLOWED_COMPONENT_TYPES.has(n.componentType) ? n.componentType : 'web-server';
      const category = TYPE_TO_CATEGORY.get(componentType) ?? 'compute';
      return { id: n.id, label: n.label, category, componentType, x: 0, y: 0 };
    });

    const validEdges: ArchEdge[] = parsed.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        edgeType: (e.edgeType ?? 'http') as EdgeType,
        ...(e.label ? { label: e.label } : {}),
      }));

    return {
      name: parsed.name ?? existing.name,
      description: parsed.description ?? existing.description,
      nodes: autoLayout(validNodes),
      edges: validEdges,
      reasoning: parsed.reasoning ?? 'Refined by Claude AI.',
    };
  } catch {
    return existing;
  }
}
