import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — DNS Resolution Simulation
// ─────────────────────────────────────────────────────────────
//
// HOOK: "Every URL triggers an invisible quest — 4 servers,
// trillions of queries/day, and a misconfigured TTL can vanish
// your service for an hour."
//
// INTUITION — chain of address books analogy:
//   Root server    = country directory (knows where .com, .org live)
//   TLD server     = state directory   (knows where example.com lives)
//   Authoritative  = exact address     (IS the source of truth)
//   No single server needs to know everything — each only knows
//   the next step, like asking for directions one hop at a time.
//
// Simulates the full DNS resolution chain:
//   client (stub resolver)
//     -> recursive resolver
//       -> root nameserver
//         -> TLD nameserver
//           -> authoritative nameserver
//
// Supports A, AAAA, CNAME, MX, and NS record types, multi-level
// CNAME chains, and TTL-based caching at the recursive resolver.
//
// Every call to resolve() produces an ordered list of DNSQuery
// events suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/** Supported DNS record types. */
export type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS';

/**
 * A single event in the DNS resolution timeline.
 *
 * Each event represents a query or response between two components
 * in the DNS hierarchy: client, recursive-resolver, root, tld,
 * or authoritative nameserver.
 */
export interface DNSQuery extends ProtocolTimelineEvent {
  /** DNS record type being queried. */
  queryType: DNSRecordType;
  /** The domain name being resolved. */
  domain: string;
  /** Response data (present only on response events). */
  response?: {
    /** Resolved IPv4/IPv6 address (for A/AAAA). */
    ip?: string;
    /** CNAME target (for CNAME records). */
    cname?: string;
    /** Time-to-live in seconds. */
    ttl: number;
  };
  /** Whether this response was served from cache. */
  cached: boolean;
}

// ── Simulated Zone Data ──────────────────────────────────────

/** Simulated record in the zone database. */
interface ZoneRecord {
  type: DNSRecordType;
  value: string;
  ttl: number;
}

/** Pre-configured zone data for simulation. */
const ZONE_DATA: Record<string, ZoneRecord[]> = {
  'example.com': [
    { type: 'A', value: '93.184.216.34', ttl: 3600 },
    { type: 'AAAA', value: '2606:2800:220:1:248:1893:25c8:1946', ttl: 3600 },
    { type: 'MX', value: 'mail.example.com', ttl: 7200 },
    { type: 'NS', value: 'ns1.example.com', ttl: 86400 },
  ],
  'www.example.com': [
    { type: 'CNAME', value: 'example.com', ttl: 1800 },
  ],
  'api.example.com': [
    { type: 'A', value: '93.184.216.35', ttl: 300 },
  ],
  'cdn.example.com': [
    { type: 'CNAME', value: 'cdn.cloudfront.net', ttl: 600 },
  ],
  'cdn.cloudfront.net': [
    { type: 'A', value: '52.85.132.67', ttl: 60 },
  ],
  'mail.example.com': [
    { type: 'A', value: '93.184.216.36', ttl: 3600 },
  ],
  'app.service.example.com': [
    { type: 'CNAME', value: 'lb.service.example.com', ttl: 300 },
  ],
  'lb.service.example.com': [
    { type: 'CNAME', value: 'us-east.elb.amazonaws.com', ttl: 60 },
  ],
  'us-east.elb.amazonaws.com': [
    { type: 'A', value: '54.239.28.85', ttl: 60 },
  ],
  'google.com': [
    { type: 'A', value: '142.250.80.46', ttl: 300 },
    { type: 'AAAA', value: '2607:f8b0:4004:800::200e', ttl: 300 },
    { type: 'MX', value: 'smtp.google.com', ttl: 3600 },
    { type: 'NS', value: 'ns1.google.com', ttl: 86400 },
  ],
};

/** Maximum CNAME chain depth before we stop (prevents loops). */
const MAX_CNAME_DEPTH = 8;

// ── Column name mapping for sequence diagrams ──────────────

/** Maps internal component names to short display names for the diagram. */
export const DNS_COLUMN_MAP: Record<string, string> = {
  'client': 'Client',
  'recursive-resolver': 'Recursive',
  'root': 'Root NS',
  'tld': 'TLD NS',
  'authoritative': 'Auth NS',
};

/** Ordered columns for the DNS resolution sequence diagram. */
export const DNS_SEQUENCE_COLUMNS = ['Client', 'Recursive', 'Root NS', 'TLD NS', 'Auth NS'];

// ── Sequence diagram helpers ────────────────────────────────

/**
 * Converts an array of DNSQuery events to the SequenceMessage format
 * used by the NetworkingModule sequence diagram renderer.
 *
 * Each event is mapped to a from/to/label/description object with:
 * - Cache hits labeled with "CACHE HIT" and TTL
 * - Responses labeled with IP, CNAME target, or "Referral"
 * - Queries labeled with record type and domain
 *
 * @param events - Array of DNSQuery events from the resolver.
 * @returns Array of objects with from, to, label, description fields.
 */
export function dnsToSequenceMessages(
  events: DNSQuery[],
): Array<{ from: string; to: string; label: string; description: string }> {
  return events.map((e) => ({
    from: DNS_COLUMN_MAP[e.from] ?? e.from,
    to: DNS_COLUMN_MAP[e.to] ?? e.to,
    label: e.cached
      ? `CACHE HIT (TTL: ${e.response?.ttl ?? '?'}s)`
      : e.response
        ? `${e.response.ip ?? e.response.cname ?? 'Referral'} (TTL: ${e.response.ttl}s)`
        : `${e.queryType} ${e.domain}`,
    description: e.description,
  }));
}

/**
 * Row background color function for DNS sequence diagram.
 *
 * - Cache hits: green (#22c55e)
 * - Responses: blue (#3b82f6)
 * - Queries: undefined (no background)
 *
 * @param events - The DNS event array.
 * @param index - Row index to get the background color for.
 * @returns CSS color string or undefined.
 */
export function dnsRowBackground(
  events: DNSQuery[],
  index: number,
): string | undefined {
  const ev = events[index];
  if (!ev) return undefined;
  if (ev.cached) return '#22c55e';
  if (ev.response) return '#3b82f6';
  return undefined;
}

/**
 * Pre-built DNS resolution scenarios demonstrating different record types.
 * Each scenario runs a sequence of resolutions that showcase A, AAAA, CNAME,
 * MX, and NS queries through the full resolver chain.
 */
export interface DNSScenario {
  /** Unique identifier for this scenario. */
  id: string;
  /** Human-readable scenario name. */
  name: string;
  /** Description of what this scenario demonstrates. */
  description: string;
  /** Domain to resolve. */
  domain: string;
  /** Record type to query. */
  queryType: DNSRecordType;
}

export const DNS_SCENARIOS: DNSScenario[] = [
  {
    id: 'a-record',
    name: 'A Record (IPv4)',
    description: 'Standard IPv4 address resolution through the full DNS hierarchy.',
    domain: 'example.com',
    queryType: 'A',
  },
  {
    id: 'aaaa-record',
    name: 'AAAA Record (IPv6)',
    description: 'IPv6 address resolution for dual-stack hosts.',
    domain: 'example.com',
    queryType: 'AAAA',
  },
  {
    id: 'cname-chain',
    name: 'CNAME Chain',
    description: 'Resolution that follows a CNAME alias before resolving to an A record.',
    domain: 'www.example.com',
    queryType: 'A',
  },
  {
    id: 'deep-cname',
    name: 'Deep CNAME Chain',
    description: 'Multi-hop CNAME chain: app -> lb -> ELB, common in cloud deployments.',
    domain: 'app.service.example.com',
    queryType: 'A',
  },
  {
    id: 'ns-record',
    name: 'NS Record',
    description: 'Nameserver delegation record lookup.',
    domain: 'example.com',
    queryType: 'NS',
  },
  {
    id: 'cdn-cname',
    name: 'CDN CNAME',
    description: 'CDN resolution via CNAME to CloudFront, typical for static assets.',
    domain: 'cdn.example.com',
    queryType: 'A',
  },
];

// ── Cache Entry ──────────────────────────────────────────────

interface CacheEntry {
  record: ZoneRecord;
  domain: string;
  insertedAtTick: number;
}

/**
 * Simulates DNS resolution with full recursive resolver chain.
 *
 * The resolver walks the DNS hierarchy (root -> TLD -> authoritative)
 * on cache misses, follows CNAME chains, and caches responses based
 * on TTL values.
 *
 * @example
 * ```ts
 * const dns = new DNSResolver();
 * const queries = dns.resolve('www.example.com');
 * for (const q of queries) {
 *   console.log(`[${q.tick}] ${q.from} -> ${q.to}: ${q.domain} (${q.queryType})`);
 * }
 * ```
 */
export class DNSResolver {
  /** Recursive resolver cache (domain+type -> entry). */
  private cache: Map<string, CacheEntry>;
  /** Ordered log of all queries and responses. */
  private queryLog: DNSQuery[];
  /** Monotonically increasing tick counter. */
  private tick: number;

  constructor() {
    this.cache = new Map();
    this.queryLog = [];
    this.tick = 0;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Resolves a domain name through the full DNS hierarchy.
   *
   * Resolution steps:
   * 1. Client sends query to recursive resolver (stub resolver).
   * 2. Recursive resolver checks its cache.
   * 3. On cache miss, queries root nameserver for the TLD.
   * 4. Root refers to the appropriate TLD nameserver.
   * 5. TLD refers to the authoritative nameserver for the domain.
   * 6. Authoritative responds with the answer.
   * 7. Recursive resolver caches and returns the result to client.
   *
   * If the answer is a CNAME, the resolver follows the chain
   * (up to {@link MAX_CNAME_DEPTH} levels) resolving each target.
   *
   * @param domain - Fully qualified domain name to resolve.
   * @param queryType - Record type (defaults to 'A').
   * @returns Ordered list of DNS query events.
   */
  resolve(domain: string, queryType: DNSRecordType = 'A'): DNSQuery[] {
    const events: DNSQuery[] = [];
    this.resolveRecursive(domain, queryType, events, 0);
    return events;
  }

  /** Returns a copy of the full query log across all calls to resolve(). */
  getQueryLog(): DNSQuery[] {
    return [...this.queryLog];
  }

  /** Clears the recursive resolver cache. */
  clearCache(): void {
    this.cache.clear();
  }

  /** Resets the resolver to its initial state (clears cache and query log). */
  reset(): void {
    this.cache.clear();
    this.queryLog = [];
    this.tick = 0;
  }

  // ── Internal Resolution Logic ─────────────────────────────

  /**
   * Core recursive resolution, following CNAME chains.
   */
  private resolveRecursive(
    domain: string,
    queryType: DNSRecordType,
    events: DNSQuery[],
    cnameDepth: number,
  ): void {
    if (cnameDepth > MAX_CNAME_DEPTH) {
      events.push(this.record({
        from: 'recursive-resolver',
        to: 'client',
        queryType,
        domain,
        cached: false,
        description: `CNAME chain exceeded maximum depth of ${MAX_CNAME_DEPTH}. Resolution aborted.`,
      }));
      return;
    }

    // Step 1: Client -> Recursive resolver (or internal resolver step for CNAME following)
    events.push(this.record({
      from: cnameDepth === 0 ? 'client' : 'recursive-resolver',
      to: 'recursive-resolver',
      queryType,
      domain,
      cached: false,
      description:
        cnameDepth === 0
          ? `Your machine asks its configured resolver "What is the IP of ${domain}?" — like calling directory assistance. The stub resolver on your OS does not resolve anything itself; it delegates entirely to the recursive resolver (usually your ISP or 8.8.8.8).`
          : `Recursive resolver follows CNAME chain internally: resolving "${domain}" (depth ${cnameDepth}).`,
    }));

    // Step 2: Check cache
    const cacheKey = `${domain}:${queryType}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      // Cache hit
      const isA = cached.record.type === 'A' || cached.record.type === 'AAAA';
      events.push(this.record({
        from: 'recursive-resolver',
        to: 'client',
        queryType,
        domain,
        response: {
          ip: isA ? cached.record.value : undefined,
          cname: cached.record.type === 'CNAME' ? cached.record.value : undefined,
          ttl: cached.record.ttl,
        },
        cached: true,
        description: `Cache HIT at recursive resolver. Returning cached ${queryType} record for "${domain}" (TTL: ${cached.record.ttl}s).`,
      }));

      // If cached result is a CNAME, follow it
      if (cached.record.type === 'CNAME') {
        this.resolveRecursive(cached.record.value, queryType, events, cnameDepth + 1);
      }
      return;
    }

    // Step 3: Cache miss — walk the hierarchy
    events.push(this.record({
      from: 'recursive-resolver',
      to: 'recursive-resolver',
      queryType,
      domain,
      cached: false,
      description: `Cache MISS for "${domain}". Starting iterative resolution from root.`,
    }));

    // Step 4: Query root nameserver
    const tld = this.extractTLD(domain);
    events.push(this.record({
      from: 'recursive-resolver',
      to: 'root',
      queryType: 'NS',
      domain,
      cached: false,
      description: `Recursive resolver queries root nameserver for "${domain}".`,
    }));

    // Step 5: Root refers to TLD
    events.push(this.record({
      from: 'root',
      to: 'recursive-resolver',
      queryType: 'NS',
      domain,
      response: { ttl: 172800 },
      cached: false,
      description: `The root says "I don't know, but the .${tld} department is over there." Root servers handle EVERY domain lookup — they are the starting point when cache is empty. There are only 13 root server clusters (a.root-servers.net through m.root-servers.net), replicated globally via anycast.`,
    }));

    // Step 6: Query TLD nameserver
    const authZone = this.extractAuthZone(domain);
    events.push(this.record({
      from: 'recursive-resolver',
      to: 'tld',
      queryType: 'NS',
      domain,
      cached: false,
      description: `Recursive resolver queries ".${tld}" TLD nameserver for "${domain}".`,
    }));

    // Step 7: TLD refers to authoritative
    events.push(this.record({
      from: 'tld',
      to: 'recursive-resolver',
      queryType: 'NS',
      domain,
      response: { ttl: 86400 },
      cached: false,
      description: `TLD nameserver refers to authoritative nameserver for "${authZone}".`,
    }));

    // Step 8: Query authoritative nameserver
    events.push(this.record({
      from: 'recursive-resolver',
      to: 'authoritative',
      queryType,
      domain,
      cached: false,
      description: `Recursive resolver queries authoritative nameserver for ${queryType} record of "${domain}".`,
    }));

    // Step 9: Authoritative responds
    const zoneRecords = ZONE_DATA[domain];
    const matchedRecord = zoneRecords?.find((r) => r.type === queryType);
    const cnameRecord = zoneRecords?.find((r) => r.type === 'CNAME');

    if (matchedRecord) {
      // Direct answer
      const isA = matchedRecord.type === 'A' || matchedRecord.type === 'AAAA';
      events.push(this.record({
        from: 'authoritative',
        to: 'recursive-resolver',
        queryType,
        domain,
        response: {
          ip: isA ? matchedRecord.value : undefined,
          ttl: matchedRecord.ttl,
        },
        cached: false,
        description: `The authoritative server IS the source of truth for "${domain}". Its answer: ${queryType} = ${matchedRecord.value}. The response includes a TTL of ${matchedRecord.ttl}s — how long every server in the chain should cache this answer. Set the TTL too low and you get a flood of queries; set it too high and DNS changes take hours to propagate.`,
      }));

      // Cache the result
      this.cacheRecord(domain, queryType, matchedRecord);

      // Return to client
      events.push(this.record({
        from: 'recursive-resolver',
        to: 'client',
        queryType,
        domain,
        response: {
          ip: isA ? matchedRecord.value : undefined,
          ttl: matchedRecord.ttl,
        },
        cached: false,
        description: `Recursive resolver returns ${queryType} "${domain}" = ${matchedRecord.value} to client. Result cached for ${matchedRecord.ttl}s.`,
      }));
    } else if (cnameRecord) {
      // CNAME response — need to follow the chain
      events.push(this.record({
        from: 'authoritative',
        to: 'recursive-resolver',
        queryType,
        domain,
        response: {
          cname: cnameRecord.value,
          ttl: cnameRecord.ttl,
        },
        cached: false,
        description: `Authoritative nameserver responds: CNAME "${domain}" -> "${cnameRecord.value}" (TTL: ${cnameRecord.ttl}s). Must follow CNAME chain.`,
      }));

      // Cache the CNAME
      this.cacheRecord(domain, queryType, cnameRecord);

      // Follow the CNAME chain
      this.resolveRecursive(cnameRecord.value, queryType, events, cnameDepth + 1);
    } else {
      // NXDOMAIN — domain not found
      events.push(this.record({
        from: 'authoritative',
        to: 'recursive-resolver',
        queryType,
        domain,
        response: { ttl: 300 },
        cached: false,
        description: `Authoritative nameserver responds: NXDOMAIN. No ${queryType} record found for "${domain}".`,
      }));

      events.push(this.record({
        from: 'recursive-resolver',
        to: 'client',
        queryType,
        domain,
        response: { ttl: 300 },
        cached: false,
        description: `Recursive resolver returns NXDOMAIN to client. "${domain}" does not exist.`,
      }));
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  /** Extracts the top-level domain (e.g., "com" from "www.example.com"). */
  private extractTLD(domain: string): string {
    const parts = domain.split('.');
    return parts[parts.length - 1];
  }

  /** Extracts the authoritative zone (e.g., "example.com" from "www.example.com"). */
  private extractAuthZone(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  /** Inserts a record into the recursive resolver cache. */
  private cacheRecord(
    domain: string,
    queryType: DNSRecordType,
    record: ZoneRecord,
  ): void {
    const key = `${domain}:${queryType}`;
    this.cache.set(key, {
      record,
      domain,
      insertedAtTick: this.tick,
    });
  }

  /** Creates a DNSQuery event, appends it to the log, and returns it. */
  private record(
    opts: Omit<DNSQuery, 'tick'>,
  ): DNSQuery {
    this.tick++;
    const query: DNSQuery = {
      tick: this.tick,
      ...opts,
    };
    this.queryLog.push(query);
    return query;
  }
}
