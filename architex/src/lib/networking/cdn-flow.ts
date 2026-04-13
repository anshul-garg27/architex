import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — CDN Request Flow Simulation (NET-014)
// ─────────────────────────────────────────────────────────────
//
// Simulates the full request lifecycle through a CDN (Content
// Delivery Network). Demonstrates multiple scenarios:
//
// 1. **Cache Hit**: Client → Edge POP → cached content returned.
// 2. **Cache Miss**: Client → Edge POP → Origin Shield → Origin
//    Server → full fetch path with caching at each tier.
// 3. **Stale Content**: Edge serves stale while revalidating in
//    the background (stale-while-revalidate).
// 4. **Cache Purge**: Invalidation propagates from Origin through
//    Shield to Edge POPs.
//
// The simulation models realistic latency values and shows
// Cache-Control headers, TTL, and stale-while-revalidate at
// each step.
// ─────────────────────────────────────────────────────────────

/**
 * Represents a single step in the CDN request flow.
 */
export interface CDNStep extends ProtocolTimelineEvent {
  /** The type of action being performed. */
  action:
    | 'dns-cname'
    | 'edge-check'
    | 'cache-hit'
    | 'cache-miss'
    | 'shield-check'
    | 'shield-hit'
    | 'shield-miss'
    | 'origin-fetch'
    | 'cache-store'
    | 'response'
    | 'stale-serve'
    | 'background-revalidate'
    | 'purge-origin'
    | 'purge-shield'
    | 'purge-edge'
    | 'purge-confirm';
  /** Simulated latency for this step in milliseconds. */
  latencyMs: number;
  /** HTTP headers relevant to this step (Cache-Control, etc.). */
  headers?: Record<string, string>;
}

/**
 * A SequenceMessage suitable for the shared SequenceDiagram component.
 */
export interface CDNSequenceMessage {
  from: string;
  to: string;
  label: string;
  description: string;
  highlighted?: boolean;
}

/** CDN flow scenario identifiers. */
export type CDNScenario = 'cache-hit' | 'cache-miss' | 'stale-revalidate' | 'cache-purge';

/** Metadata for a CDN scenario. */
export interface CDNScenarioDef {
  id: CDNScenario;
  name: string;
  description: string;
}

/** All available CDN scenarios. */
export const CDN_SCENARIOS: CDNScenarioDef[] = [
  {
    id: 'cache-hit',
    name: 'Cache Hit',
    description: 'Content found at Edge POP, served immediately.',
  },
  {
    id: 'cache-miss',
    name: 'Cache Miss',
    description: 'Full path through Origin Shield to Origin Server.',
  },
  {
    id: 'stale-revalidate',
    name: 'Stale-While-Revalidate',
    description: 'Serve stale content while revalidating in background.',
  },
  {
    id: 'cache-purge',
    name: 'Cache Purge',
    description: 'Invalidation propagates from Origin to all Edge POPs.',
  },
];

// ── Constants ────────────────────────────────────────────────

/** DNS lookup time for CNAME resolution to CDN edge. */
const DNS_CNAME_LATENCY_MS = 15;

/** Time for edge POP to check its local cache. */
const EDGE_CACHE_CHECK_MS = 2;

/** Time to serve cached content from edge (local). */
const CACHE_HIT_SERVE_MS = 5;

/** Network round-trip from edge POP to origin shield. */
const EDGE_TO_SHIELD_LATENCY_MS = 25;

/** Time for origin shield to check its cache. */
const SHIELD_CACHE_CHECK_MS = 3;

/** Time to serve from origin shield cache. */
const SHIELD_HIT_SERVE_MS = 8;

/** Network round-trip from origin shield to origin server. */
const SHIELD_TO_ORIGIN_LATENCY_MS = 80;

/** Time for edge to write response into local cache. */
const CACHE_STORE_MS = 3;

/** Time for shield to write response into its cache. */
const SHIELD_STORE_MS = 4;

/** Time to deliver response from edge to client. */
const EDGE_TO_CLIENT_MS = 10;

/** Time for purge propagation to each tier. */
const PURGE_PROPAGATION_MS = 50;

/** Columns for the CDN sequence diagram. */
export const CDN_SEQUENCE_COLUMNS = ['Client', 'DNS', 'Edge POP', 'Origin Shield', 'Origin'];

/**
 * Converts CDN steps to SequenceMessage format for the shared SequenceDiagram.
 */
export function cdnToSequenceMessages(steps: CDNStep[]): CDNSequenceMessage[] {
  return steps.map((s) => ({
    from: s.from,
    to: s.to,
    label: cdnActionLabel(s.action),
    description: s.description,
    highlighted: s.action === 'cache-hit' || s.action === 'shield-hit' || s.action === 'stale-serve',
  }));
}

function cdnActionLabel(action: CDNStep['action']): string {
  switch (action) {
    case 'dns-cname':
      return 'DNS CNAME \u2192 CDN';
    case 'edge-check':
      return 'Cache Lookup';
    case 'cache-hit':
      return 'CACHE HIT';
    case 'cache-miss':
      return 'CACHE MISS';
    case 'shield-check':
      return 'Shield Cache Lookup';
    case 'shield-hit':
      return 'SHIELD HIT';
    case 'shield-miss':
      return 'SHIELD MISS';
    case 'origin-fetch':
      return 'Fetch from Origin';
    case 'cache-store':
      return 'Store in Cache';
    case 'response':
      return 'Response';
    case 'stale-serve':
      return 'Serve Stale';
    case 'background-revalidate':
      return 'Background Revalidate';
    case 'purge-origin':
      return 'Purge Initiated';
    case 'purge-shield':
      return 'Purge Shield';
    case 'purge-edge':
      return 'Purge Edge POPs';
    case 'purge-confirm':
      return 'Purge Complete';
    default:
      return action;
  }
}

/**
 * Returns a background color for the given CDN step action.
 */
export function cdnRowBackground(action: CDNStep['action']): string | undefined {
  switch (action) {
    case 'cache-hit':
    case 'shield-hit':
      return '#22c55e';
    case 'cache-miss':
    case 'shield-miss':
      return '#f59e0b';
    case 'origin-fetch':
      return '#f59e0b';
    case 'cache-store':
      return '#8b5cf6';
    case 'response':
      return '#3b82f6';
    case 'stale-serve':
      return '#f59e0b';
    case 'background-revalidate':
      return '#8b5cf6';
    case 'purge-origin':
    case 'purge-shield':
    case 'purge-edge':
    case 'purge-confirm':
      return '#8b5cf6';
    default:
      return undefined;
  }
}

/**
 * Simulates a CDN request flow for the given scenario.
 *
 * @param scenario - Which CDN scenario to simulate.
 * @returns Ordered array of CDNStep objects for visualization.
 *
 * @example
 * ```ts
 * const hitFlow = simulateCDNFlow('cache-hit');
 * console.log(`Cache hit: ${hitFlow.length} steps`);
 *
 * const missFlow = simulateCDNFlow('cache-miss');
 * console.log(`Cache miss: ${missFlow.length} steps`);
 * ```
 */
export function simulateCDNFlow(scenario: CDNScenario): CDNStep[] {
  switch (scenario) {
    case 'cache-hit':
      return buildCacheHitFlow();
    case 'cache-miss':
      return buildCacheMissFlow();
    case 'stale-revalidate':
      return buildStaleRevalidateFlow();
    case 'cache-purge':
      return buildCachePurgeFlow();
  }
}

// ── Backward-compatible overload ────────────────────────────
// The old API accepted a boolean. This helper preserves it.
/**
 * Backward-compatible helper that maps a boolean to a scenario.
 * @deprecated Use `simulateCDNFlow(scenario)` with a CDNScenario string instead.
 */
export function simulateCDNFlowLegacy(cacheHit: boolean): CDNStep[] {
  return simulateCDNFlow(cacheHit ? 'cache-hit' : 'cache-miss');
}

// ── Scenario Builders ──────────────────────────────────────

function buildCacheHitFlow(): CDNStep[] {
  const steps: CDNStep[] = [];
  let tick = 0;

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'DNS',
    action: 'dns-cname',
    latencyMs: DNS_CNAME_LATENCY_MS,
    description:
      'Client resolves domain via DNS. DNS returns a CNAME record pointing to the CDN edge network (e.g., d1234.cloudfront.net). The client then resolves the CDN hostname to the nearest Edge POP IP via anycast.',
  });

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'Edge POP',
    action: 'edge-check',
    latencyMs: EDGE_CACHE_CHECK_MS,
    description:
      'Request is routed to the nearest CDN Edge POP (Point of Presence). The edge server checks its local cache for a valid copy of the requested resource, matching on URL, headers, and cache key.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Edge POP',
    action: 'cache-hit',
    latencyMs: CACHE_HIT_SERVE_MS,
    description:
      'CACHE HIT: The edge server has a valid cached copy (TTL has not expired, Vary headers match). The resource is served directly from edge memory/SSD without contacting the origin. This is the fast path.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Cache': 'Hit from edge',
      'Age': '1200',
      'CF-Cache-Status': 'HIT',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Client',
    action: 'response',
    latencyMs: EDGE_TO_CLIENT_MS,
    description: `Response served from edge cache. Total latency: ~${DNS_CNAME_LATENCY_MS + EDGE_CACHE_CHECK_MS + CACHE_HIT_SERVE_MS + EDGE_TO_CLIENT_MS}ms. Headers include X-Cache: Hit, Age: <seconds-since-cached>.`,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'Hit from edge',
      'Age': '1200',
    },
  });

  return steps;
}

function buildCacheMissFlow(): CDNStep[] {
  const steps: CDNStep[] = [];
  let tick = 0;

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'DNS',
    action: 'dns-cname',
    latencyMs: DNS_CNAME_LATENCY_MS,
    description:
      'Client resolves domain via DNS. DNS returns a CNAME record pointing to the CDN edge network. The client then resolves the CDN hostname to the nearest Edge POP IP via anycast.',
  });

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'Edge POP',
    action: 'edge-check',
    latencyMs: EDGE_CACHE_CHECK_MS,
    description:
      'Request is routed to the nearest CDN Edge POP. The edge server checks its local cache for a valid copy of the requested resource.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Edge POP',
    action: 'cache-miss',
    latencyMs: EDGE_CACHE_CHECK_MS,
    description:
      'CACHE MISS: No valid cached copy found at this edge location. The resource may have expired (TTL exceeded), never been requested through this POP before, or been invalidated.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Origin Shield',
    action: 'shield-check',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS + SHIELD_CACHE_CHECK_MS,
    description:
      'Edge POP forwards the request to the Origin Shield — a designated CDN POP that acts as a consolidated cache layer between edge POPs and the origin server. Shield checks its cache.',
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Origin Shield',
    action: 'shield-miss',
    latencyMs: SHIELD_CACHE_CHECK_MS,
    description:
      'SHIELD MISS: Origin Shield does not have the resource cached either. The request must go all the way to the origin server. Without Shield, every edge POP miss would hit origin directly.',
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Origin',
    action: 'origin-fetch',
    latencyMs: SHIELD_TO_ORIGIN_LATENCY_MS,
    description:
      'Origin Shield sends a request to the origin server. If-None-Match / If-Modified-Since headers may be sent for conditional requests. The origin server processes the request and generates the response.',
    headers: {
      'If-None-Match': '"abc123"',
      'If-Modified-Since': 'Wed, 21 Oct 2025 07:28:00 GMT',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin',
    to: 'Origin Shield',
    action: 'cache-store',
    latencyMs: SHIELD_STORE_MS,
    description:
      'Origin responds with the full resource. Origin Shield stores it in its cache according to Cache-Control headers. Future requests from any edge POP will hit Shield instead of origin.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'ETag': '"def456"',
      'Vary': 'Accept-Encoding',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Edge POP',
    action: 'cache-store',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS + CACHE_STORE_MS,
    description:
      'Origin Shield forwards the response to the requesting Edge POP. Edge POP stores it in its local cache. s-maxage controls the TTL at shared caches (CDN), while max-age controls browser cache TTL.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'X-Cache': 'Miss from edge, Miss from shield',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Client',
    action: 'response',
    latencyMs: EDGE_TO_CLIENT_MS,
    description: `Response served after full origin fetch. Total latency: ~${DNS_CNAME_LATENCY_MS + EDGE_CACHE_CHECK_MS * 2 + EDGE_TO_SHIELD_LATENCY_MS + SHIELD_CACHE_CHECK_MS * 2 + SHIELD_TO_ORIGIN_LATENCY_MS + SHIELD_STORE_MS + EDGE_TO_SHIELD_LATENCY_MS + CACHE_STORE_MS + EDGE_TO_CLIENT_MS}ms. Subsequent requests to this POP or any POP hitting Shield will be cache hits.`,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'Miss',
      'Age': '0',
    },
  });

  return steps;
}

function buildStaleRevalidateFlow(): CDNStep[] {
  const steps: CDNStep[] = [];
  let tick = 0;

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'DNS',
    action: 'dns-cname',
    latencyMs: DNS_CNAME_LATENCY_MS,
    description:
      'Client resolves domain via DNS. CNAME resolves to nearest CDN edge POP.',
  });

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'Edge POP',
    action: 'edge-check',
    latencyMs: EDGE_CACHE_CHECK_MS,
    description:
      'Request arrives at Edge POP. Edge checks cache and finds a stale copy — the max-age TTL has expired, but the stale-while-revalidate window is still open.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Edge POP',
    action: 'stale-serve',
    latencyMs: CACHE_HIT_SERVE_MS,
    description:
      'STALE-WHILE-REVALIDATE: Edge immediately serves the stale cached response to the client. The user gets a fast response with slightly outdated content. The stale-while-revalidate directive allows this behavior.',
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
      'Age': '3650',
      'X-Cache': 'Hit-Stale',
      'Warning': '110 - "Response is Stale"',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Client',
    action: 'response',
    latencyMs: EDGE_TO_CLIENT_MS,
    description: `Stale response served to client immediately. Total user-perceived latency: ~${DNS_CNAME_LATENCY_MS + EDGE_CACHE_CHECK_MS + CACHE_HIT_SERVE_MS + EDGE_TO_CLIENT_MS}ms (same as cache hit). Background revalidation begins in parallel.`,
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
      'Age': '3650',
      'X-Cache': 'Hit-Stale',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Origin Shield',
    action: 'background-revalidate',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS,
    description:
      'BACKGROUND REVALIDATION: Edge POP asynchronously sends a conditional request (If-None-Match with ETag) to Origin Shield to fetch a fresh copy. This happens after the stale response was already sent to the client.',
    headers: {
      'If-None-Match': '"abc123"',
      'If-Modified-Since': 'Wed, 21 Oct 2025 07:28:00 GMT',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Origin',
    action: 'origin-fetch',
    latencyMs: SHIELD_TO_ORIGIN_LATENCY_MS,
    description:
      'Origin Shield forwards the conditional request to origin. If the content has not changed, origin responds with 304 Not Modified (no body, saving bandwidth). If changed, full response is sent.',
  });

  steps.push({
    tick: ++tick,
    from: 'Origin',
    to: 'Origin Shield',
    action: 'cache-store',
    latencyMs: SHIELD_STORE_MS,
    description:
      'Origin responds (200 or 304). Origin Shield updates its cache with the fresh resource and new TTL. The stale-while-revalidate mechanism ensures the next request gets fresh content.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'ETag': '"def789"',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Edge POP',
    action: 'cache-store',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS + CACHE_STORE_MS,
    description:
      'Shield returns the fresh response to Edge POP. Edge updates its local cache with the new resource and reset TTL. Subsequent requests within the new TTL window will be true cache hits.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'Age': '0',
    },
  });

  return steps;
}

function buildCachePurgeFlow(): CDNStep[] {
  const steps: CDNStep[] = [];
  let tick = 0;

  steps.push({
    tick: ++tick,
    from: 'Origin',
    to: 'Origin',
    action: 'purge-origin',
    latencyMs: 5,
    description:
      'CACHE PURGE INITIATED: Origin server (or CDN management API) initiates a cache invalidation for a specific URL or path pattern. This is triggered by content update, deployment, or emergency fix. Common methods: purge by URL, purge by tag/surrogate-key, or wildcard purge.',
    headers: {
      'Surrogate-Key': 'product-123 homepage-hero',
      'Fastly-Purge': '1',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin',
    to: 'Origin Shield',
    action: 'purge-shield',
    latencyMs: PURGE_PROPAGATION_MS,
    description:
      'Purge request propagates to Origin Shield. Shield marks the cached resource as invalid. Soft purge (preferred): marks as stale but servable with stale-while-revalidate. Hard purge: immediately removes from cache.',
    headers: {
      'Fastly-Soft-Purge': '1',
      'X-Purge-Status': 'ok',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Edge POP',
    action: 'purge-edge',
    latencyMs: PURGE_PROPAGATION_MS,
    description:
      'Shield propagates the purge to all Edge POPs. In practice, CDN providers use fan-out — Shield notifies all POPs in parallel. With surrogate keys, only resources tagged with the matching key are purged, not the entire cache.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Edge POP',
    action: 'purge-confirm',
    latencyMs: 5,
    description:
      'Edge POPs confirm the purge. Total purge propagation time depends on CDN provider: Fastly ~150ms globally, CloudFront ~60-300s, Akamai ~5-10s. The next request for the purged resource will be a cache miss, triggering a fresh origin fetch.',
    headers: {
      'X-Purge-Status': 'ok',
      'X-Purge-Count': '1',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Client',
    to: 'Edge POP',
    action: 'cache-miss',
    latencyMs: DNS_CNAME_LATENCY_MS + EDGE_CACHE_CHECK_MS,
    description:
      'Next client request arrives at Edge POP. The previously cached resource has been purged. Edge returns a cache miss and must fetch from Origin Shield/Origin. This ensures the client gets the updated content.',
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Origin Shield',
    action: 'shield-check',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS + SHIELD_CACHE_CHECK_MS,
    description:
      'Edge POP forwards request to Origin Shield (also purged). Shield fetches from origin, caches the fresh response, and returns it to Edge POP.',
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Origin',
    action: 'origin-fetch',
    latencyMs: SHIELD_TO_ORIGIN_LATENCY_MS,
    description:
      'Origin Shield fetches the fresh resource from origin. Origin returns the updated content with new Cache-Control headers and ETag.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'ETag': '"new-version-789"',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin',
    to: 'Origin Shield',
    action: 'cache-store',
    latencyMs: SHIELD_STORE_MS,
    description:
      'Origin responds with the fresh resource. Origin Shield stores it in its cache with the new TTL. Future requests from any Edge POP will hit Shield instead of going to Origin.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'ETag': '"new-version-789"',
      'X-Cache': 'Miss (post-purge)',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Origin Shield',
    to: 'Edge POP',
    action: 'cache-store',
    latencyMs: EDGE_TO_SHIELD_LATENCY_MS + CACHE_STORE_MS,
    description:
      'Origin Shield forwards the fresh response to the requesting Edge POP. Edge POP stores it in its local cache with the new TTL. Subsequent requests to this POP will be cache hits with the new version.',
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60',
      'X-Cache': 'Miss (post-purge)',
      'Age': '0',
    },
  });

  steps.push({
    tick: ++tick,
    from: 'Edge POP',
    to: 'Client',
    action: 'response',
    latencyMs: EDGE_TO_CLIENT_MS,
    description:
      'Fresh content delivered to the client after cache purge and re-fetch. The purge-and-refill cycle is complete. Subsequent requests will be cache hits.',
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'Miss',
      'Age': '0',
    },
  });

  return steps;
}
