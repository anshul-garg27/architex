// ─────────────────────────────────────────────────────────────
// Architex — ARP (Address Resolution Protocol) Simulation
// ─────────────────────────────────────────────────────────────
//
// Simulates ARP operation on a local subnet, including:
// - ARP request broadcast (Layer 2 broadcast to all devices)
// - ARP reply unicast (target responds with its MAC address)
// - ARP cache management with TTL expiry
// - Gratuitous ARP for IP conflict detection
//
// ARP bridges Layer 2 (Data Link / MAC) and Layer 3 (Network / IP),
// allowing hosts to discover the hardware address needed to frame
// an IP packet for delivery on a local Ethernet segment.
//
// Every operation produces an ordered list of ARPEvent objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * Actors involved in ARP exchanges.
 *
 * - `requester`: The host that needs to resolve an IP to a MAC address.
 * - `target`: The host that owns the requested IP and sends a reply.
 * - `all-devices`: Represents all devices on the broadcast domain
 *   (used for broadcast frames).
 */
export type ARPActor = 'requester' | 'target' | 'all-devices';

/**
 * ARP operation types.
 *
 * - `request-broadcast`: ARP Request sent as Ethernet broadcast (ff:ff:ff:ff:ff:ff).
 * - `reply-unicast`: ARP Reply sent unicast back to the requester.
 * - `cache-update`: An ARP cache entry is created or updated.
 * - `gratuitous`: Gratuitous ARP — a host announces its own IP-to-MAC mapping,
 *   used for IP conflict detection and cache refresh.
 */
export type ARPEventType =
  | 'request-broadcast'
  | 'reply-unicast'
  | 'cache-update'
  | 'gratuitous';

/**
 * A single event in the ARP simulation timeline.
 *
 * Each event captures who sent the frame, who receives it,
 * the ARP operation type, and relevant addressing information.
 */
export interface ARPEvent {
  /** Simulation tick (monotonically increasing). */
  tick: number;
  /** Actor that initiated this event. */
  from: ARPActor;
  /** Actor that receives this event. */
  to: ARPActor;
  /** The ARP operation type. */
  type: ARPEventType;
  /** Human-readable explanation of this step. */
  description: string;
  /** MAC address relevant to this event (sender or resolved). */
  macAddress?: string;
  /** IP address relevant to this event. */
  ipAddress?: string;
}

/**
 * A single entry in the ARP cache table.
 */
export interface ARPCacheEntry {
  /** The IP address mapped by this entry. */
  ip: string;
  /** The resolved MAC address. */
  mac: string;
  /** Time-to-live in seconds before this entry expires. */
  ttl: number;
}

// ── Constants ────────────────────────────────────────────────

/** Default ARP cache TTL in seconds (typical Linux default). */
const DEFAULT_CACHE_TTL = 300;

/** Ethernet broadcast address. */
const BROADCAST_MAC = 'ff:ff:ff:ff:ff:ff';

/** ARP request sender uses 00:00:00:00:00:00 as target MAC (unknown). */
const UNKNOWN_MAC = '00:00:00:00:00:00';

// ── Helpers ──────────────────────────────────────────────────

/** Capitalizes the first character of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Simulates ARP (Address Resolution Protocol) operations.
 *
 * Supports three core operations:
 * 1. **resolve()** — Standard ARP request/reply to map an IP to a MAC address.
 * 2. **gratuitousARP()** — Announces own IP-to-MAC mapping for conflict detection.
 * 3. **getCacheEntries()** — Inspects the current ARP cache.
 *
 * @example
 * ```ts
 * const arp = new ARPSimulation();
 * const events = arp.resolve(
 *   '192.168.1.10', 'aa:bb:cc:dd:ee:01',
 *   '192.168.1.20'
 * );
 * for (const e of events) {
 *   console.log(`[${e.tick}] ${e.from} -> ${e.to}: ${e.description}`);
 * }
 * ```
 */
export class ARPSimulation {
  /** Ordered timeline of all events produced so far. */
  events: ARPEvent[];

  /** The ARP cache mapping IP addresses to MAC addresses. */
  private cache: Map<string, { mac: string; ttl: number }>;

  /** Monotonically increasing simulation tick counter. */
  private tick: number;

  constructor() {
    this.events = [];
    this.cache = new Map();
    this.tick = 0;
  }

  // ── Standard ARP Resolution ─────────────────────────────

  /**
   * Performs a standard ARP resolution: broadcast request followed by unicast reply.
   *
   * Simulates the following sequence:
   * 1. Requester broadcasts ARP Request to all devices on the subnet.
   * 2. All non-target devices receive and ignore the broadcast.
   * 3. Target device recognizes its own IP and sends a unicast ARP Reply.
   * 4. Requester updates its ARP cache with the resolved mapping.
   *
   * @param senderIP - IP address of the requesting host.
   * @param senderMAC - MAC address of the requesting host.
   * @param targetIP - IP address to resolve.
   * @returns The ARP events describing the resolution.
   */
  resolve(senderIP: string, senderMAC: string, targetIP: string): ARPEvent[] {
    const resolveEvents: ARPEvent[] = [];

    // Derive a deterministic target MAC from the target IP
    const targetMAC = this.deriveMACFromIP(targetIP);

    // Step 1: Requester broadcasts ARP Request
    resolveEvents.push(
      this.recordEvent('requester', 'all-devices', 'request-broadcast', [
        `ARP Request broadcast: "Who has ${targetIP}? Tell ${senderIP}."`,
        `Sender MAC: ${senderMAC}, Sender IP: ${senderIP}.`,
        `Target MAC: ${UNKNOWN_MAC} (unknown), Target IP: ${targetIP}.`,
        `Frame sent to Ethernet broadcast address ${BROADCAST_MAC}.`,
        'Every device on the local subnet receives this frame.',
      ], senderMAC, targetIP),
    );

    // Step 2: All non-target devices receive and discard
    resolveEvents.push(
      this.recordEvent('all-devices', 'all-devices', 'request-broadcast', [
        `All devices on the subnet receive the ARP broadcast.`,
        `Each device checks: "Is ${targetIP} my IP address?"`,
        'Non-matching devices silently discard the frame.',
        'Only the device owning the target IP will respond.',
      ], BROADCAST_MAC, targetIP),
    );

    // Step 3: Target responds with unicast ARP Reply
    resolveEvents.push(
      this.recordEvent('target', 'requester', 'reply-unicast', [
        `ARP Reply (unicast): "${targetIP} is at ${targetMAC}."`,
        `Target sends reply directly to ${senderMAC} (no broadcast needed).`,
        `The reply contains the target's MAC address, completing the resolution.`,
      ], targetMAC, targetIP),
    );

    // Step 4: Requester updates ARP cache
    this.cache.set(targetIP, { mac: targetMAC, ttl: DEFAULT_CACHE_TTL });
    resolveEvents.push(
      this.recordEvent('requester', 'requester', 'cache-update', [
        `ARP cache updated: ${targetIP} -> ${targetMAC} (TTL: ${DEFAULT_CACHE_TTL}s).`,
        'Future packets to this IP can be framed immediately without another ARP request.',
        `Cache entry expires in ${DEFAULT_CACHE_TTL} seconds. After expiry, a new ARP request is needed.`,
      ], targetMAC, targetIP),
    );

    // Also cache the sender's mapping on the target side (ARP is bidirectional learning)
    this.cache.set(senderIP, { mac: senderMAC, ttl: DEFAULT_CACHE_TTL });

    return resolveEvents;
  }

  // ── Gratuitous ARP ──────────────────────────────────────

  /**
   * Performs a Gratuitous ARP broadcast.
   *
   * A Gratuitous ARP is an ARP request/reply where the sender and target
   * IP are the same. It is used for:
   * - IP conflict detection: if another host replies, there is a conflict.
   * - Cache refresh: all devices update their cache with the sender's new mapping.
   *
   * @param ip - The IP address being announced.
   * @param mac - The MAC address being announced.
   * @returns The ARP events describing the gratuitous broadcast.
   */
  gratuitousARP(ip: string, mac: string): ARPEvent[] {
    const gratuitousEvents: ARPEvent[] = [];

    // Step 1: Host broadcasts Gratuitous ARP
    gratuitousEvents.push(
      this.recordEvent('requester', 'all-devices', 'gratuitous', [
        `Gratuitous ARP broadcast: "${ip} is at ${mac}."`,
        `Sender IP = Target IP = ${ip} (this is what makes it "gratuitous").`,
        `Sent to broadcast ${BROADCAST_MAC} so all devices hear it.`,
        'Purpose: announce IP-to-MAC mapping and detect IP conflicts.',
      ], mac, ip),
    );

    // Step 2: All devices update their ARP caches
    gratuitousEvents.push(
      this.recordEvent('all-devices', 'all-devices', 'cache-update', [
        `All devices with an existing entry for ${ip} update their ARP cache.`,
        `New mapping: ${ip} -> ${mac}.`,
        'This is useful after a failover, NIC replacement, or virtual IP migration.',
      ], mac, ip),
    );

    // Step 3: Check for IP conflict (no reply = no conflict)
    gratuitousEvents.push(
      this.recordEvent('requester', 'requester', 'cache-update', [
        `No ARP reply received — no IP conflict detected for ${ip}.`,
        `If another device had replied, it would indicate a duplicate IP address on the subnet.`,
        `The host can safely use ${ip} with MAC ${mac}.`,
      ], mac, ip),
    );

    // Update local cache
    this.cache.set(ip, { mac, ttl: DEFAULT_CACHE_TTL });

    return gratuitousEvents;
  }

  // ── Cache Inspection ────────────────────────────────────

  /**
   * Returns a snapshot of the current ARP cache entries.
   *
   * @returns Array of cache entries with IP, MAC, and remaining TTL.
   */
  getCacheEntries(): ARPCacheEntry[] {
    const entries: ARPCacheEntry[] = [];
    this.cache.forEach((value, ip) => {
      entries.push({ ip, mac: value.mac, ttl: value.ttl });
    });
    return entries;
  }

  // ── Reset ───────────────────────────────────────────────

  /** Resets the simulation to its initial state. */
  reset(): void {
    this.events = [];
    this.cache = new Map();
    this.tick = 0;
  }

  // ── Query ───────────────────────────────────────────────

  /** Returns a copy of the complete event timeline. */
  getAllEvents(): ARPEvent[] {
    return [...this.events];
  }

  // ── Internals ───────────────────────────────────────────

  /**
   * Records an event, appends it to the timeline, and returns it.
   * Description lines are joined with a single space.
   */
  private recordEvent(
    from: ARPActor,
    to: ARPActor,
    type: ARPEventType,
    descriptionLines: string[],
    macAddress?: string,
    ipAddress?: string,
  ): ARPEvent {
    this.tick++;
    const event: ARPEvent = {
      tick: this.tick,
      from,
      to,
      type,
      description: descriptionLines.join(' '),
      macAddress,
      ipAddress,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Derives a deterministic MAC address from an IP address.
   * Used to provide realistic-looking MAC addresses in the simulation.
   *
   * @param ip - The IP address (e.g. "192.168.1.20").
   * @returns A MAC address string (e.g. "aa:bb:cc:00:01:14").
   */
  private deriveMACFromIP(ip: string): string {
    const octets = ip.split('.').map(Number);
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    return `aa:bb:cc:${hex(octets[1])}:${hex(octets[2])}:${hex(octets[3])}`;
  }
}
