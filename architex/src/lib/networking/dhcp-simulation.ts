// ─────────────────────────────────────────────────────────────
// Architex — DHCP (Dynamic Host Configuration Protocol) Simulation
// ─────────────────────────────────────────────────────────────
//
// Simulates the DHCP protocol lifecycle including:
// - DORA flow: Discover -> Offer -> Request -> Acknowledge
// - Lease renewal (Request -> Acknowledge at T1/T2 timers)
// - Explicit lease release
//
// DHCP automates IP address assignment on a network. A client
// with no IP broadcasts a Discover message; the DHCP server
// responds with an Offer; the client formally Requests the
// offered address; and the server Acknowledges with lease details.
//
// Every operation produces an ordered list of DHCPEvent objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * Actors involved in DHCP exchanges.
 *
 * - `client`: The host requesting an IP address (has no IP initially).
 * - `dhcp-server`: The server that manages the IP address pool and leases.
 */
export type DHCPActor = 'client' | 'dhcp-server';

/**
 * DHCP message types.
 *
 * - `discover`: Client broadcasts to find DHCP servers.
 * - `offer`: Server offers an IP address and configuration.
 * - `request`: Client formally requests the offered address.
 * - `acknowledge`: Server confirms the lease.
 * - `release`: Client voluntarily releases its leased IP.
 * - `renew`: Client requests an extension of its current lease.
 */
export type DHCPEventType =
  | 'discover'
  | 'offer'
  | 'request'
  | 'acknowledge'
  | 'release'
  | 'renew';

/**
 * Details of the DHCP configuration offered or confirmed.
 */
export interface DHCPDetails {
  /** The IP address offered or assigned to the client. */
  offeredIP?: string;
  /** The subnet mask for the assigned network. */
  subnetMask?: string;
  /** The default gateway (router) IP address. */
  gateway?: string;
  /** The DNS server IP address(es). */
  dns?: string;
  /** The lease duration in seconds. */
  leaseTime?: number;
}

/**
 * A single event in the DHCP simulation timeline.
 *
 * Each event captures the sender, receiver, message type,
 * a human-readable description, and the configuration details
 * being negotiated.
 */
export interface DHCPEvent {
  /** Simulation tick (monotonically increasing). */
  tick: number;
  /** Actor that sent this message. */
  from: DHCPActor;
  /** Actor that receives this message. */
  to: DHCPActor;
  /** The DHCP message type. */
  type: DHCPEventType;
  /** Human-readable explanation of this step. */
  description: string;
  /** Configuration details included in this message. */
  details: DHCPDetails;
}

// ── Constants ────────────────────────────────────────────────

/** Default lease time in seconds (24 hours). */
const DEFAULT_LEASE_TIME = 86400;

/** Default subnet mask for a /24 network. */
const DEFAULT_SUBNET_MASK = '255.255.255.0';

/** Default gateway IP. */
const DEFAULT_GATEWAY = '192.168.1.1';

/** Primary DNS server IP. */
const DEFAULT_DNS = '8.8.8.8, 8.8.4.4';

/** Broadcast IP address. */
const BROADCAST_IP = '255.255.255.255';

/** Client's initial IP (none). */
const NO_IP = '0.0.0.0';

// ── Helpers ──────────────────────────────────────────────────

/** Capitalizes the first character of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Simulates DHCP (Dynamic Host Configuration Protocol) operations.
 *
 * Supports three core operations:
 * 1. **performDORA()** — Full Discover-Offer-Request-Acknowledge flow.
 * 2. **renewLease()** — Lease renewal at T1/T2 timer expiry.
 * 3. **releaseLease()** — Explicit release of the leased IP.
 *
 * @example
 * ```ts
 * const dhcp = new DHCPSimulation();
 * const events = dhcp.performDORA();
 * for (const e of events) {
 *   console.log(`[${e.tick}] ${e.from} -> ${e.to}: ${e.description}`);
 * }
 * ```
 */
export class DHCPSimulation {
  /** Ordered timeline of all events produced so far. */
  events: DHCPEvent[];

  /** The IP address currently assigned to the client (empty string if none). */
  private assignedIP: string;

  /** The current lease time in seconds. */
  private leaseTime: number;

  /** Monotonically increasing simulation tick counter. */
  private tick: number;

  /** Counter for generating sequential IP offers from the pool. */
  private nextIPOctet: number;

  /** The DHCP server's IP address. */
  private readonly serverIP: string;

  constructor() {
    this.events = [];
    this.assignedIP = '';
    this.leaseTime = 0;
    this.tick = 0;
    this.nextIPOctet = 100; // Start offering from 192.168.1.100
    this.serverIP = '192.168.1.1';
  }

  // ── DORA Flow ───────────────────────────────────────────

  /**
   * Performs the full DHCP DORA (Discover-Offer-Request-Acknowledge) flow.
   *
   * This is the standard 4-message exchange for obtaining an IP address:
   * 1. **Discover** — Client broadcasts to find DHCP servers.
   * 2. **Offer** — Server offers an available IP and configuration.
   * 3. **Request** — Client broadcasts acceptance of the offered IP.
   * 4. **Acknowledge** — Server confirms the lease with full configuration.
   *
   * @returns The four DORA events.
   * @throws If the client already has an assigned IP (use renewLease instead).
   */
  performDORA(): DHCPEvent[] {
    if (this.assignedIP) {
      throw new Error(
        `Client already has IP ${this.assignedIP}. Use renewLease() or releaseLease() first.`,
      );
    }

    const doraEvents: DHCPEvent[] = [];
    const offeredIP = `192.168.1.${this.nextIPOctet}`;
    this.nextIPOctet++;

    // Step 1: DHCP Discover (client -> broadcast)
    doraEvents.push(
      this.recordEvent('client', 'dhcp-server', 'discover', [
        `DHCP Discover: Client broadcasts "I need an IP address."`,
        `Source IP: ${NO_IP} (client has no IP yet).`,
        `Destination IP: ${BROADCAST_IP} (broadcast to entire subnet).`,
        'The client includes a unique Transaction ID to match replies.',
        'Any DHCP server on the subnet may respond with an offer.',
      ], {}),
    );

    // Step 2: DHCP Offer (server -> client)
    doraEvents.push(
      this.recordEvent('dhcp-server', 'client', 'offer', [
        `DHCP Offer: Server offers IP ${offeredIP} to the client.`,
        `Server IP: ${this.serverIP}.`,
        `Offered configuration: IP ${offeredIP}, Subnet ${DEFAULT_SUBNET_MASK}, Gateway ${DEFAULT_GATEWAY}.`,
        `DNS servers: ${DEFAULT_DNS}. Lease time: ${DEFAULT_LEASE_TIME}s (${DEFAULT_LEASE_TIME / 3600} hours).`,
        'The client may receive offers from multiple DHCP servers and must choose one.',
      ], {
        offeredIP,
        subnetMask: DEFAULT_SUBNET_MASK,
        gateway: DEFAULT_GATEWAY,
        dns: DEFAULT_DNS,
        leaseTime: DEFAULT_LEASE_TIME,
      }),
    );

    // Step 3: DHCP Request (client -> broadcast)
    doraEvents.push(
      this.recordEvent('client', 'dhcp-server', 'request', [
        `DHCP Request: Client broadcasts acceptance of ${offeredIP}.`,
        `Sent as broadcast so all DHCP servers know which offer was accepted.`,
        `Servers whose offers were declined will return those IPs to their pools.`,
        `The Request includes the selected server identifier (${this.serverIP}).`,
      ], {
        offeredIP,
      }),
    );

    // Step 4: DHCP Acknowledge (server -> client)
    this.assignedIP = offeredIP;
    this.leaseTime = DEFAULT_LEASE_TIME;
    doraEvents.push(
      this.recordEvent('dhcp-server', 'client', 'acknowledge', [
        `DHCP Acknowledge: Server confirms lease of ${offeredIP} to the client.`,
        `Lease duration: ${DEFAULT_LEASE_TIME}s (${DEFAULT_LEASE_TIME / 3600} hours).`,
        `T1 renewal timer: ${DEFAULT_LEASE_TIME / 2}s (50% of lease — client unicasts renewal to server).`,
        `T2 rebind timer: ${(DEFAULT_LEASE_TIME * 7) / 8}s (87.5% of lease — client broadcasts renewal).`,
        `Client can now configure its network interface with: IP ${offeredIP}, Mask ${DEFAULT_SUBNET_MASK}, GW ${DEFAULT_GATEWAY}, DNS ${DEFAULT_DNS}.`,
      ], {
        offeredIP,
        subnetMask: DEFAULT_SUBNET_MASK,
        gateway: DEFAULT_GATEWAY,
        dns: DEFAULT_DNS,
        leaseTime: DEFAULT_LEASE_TIME,
      }),
    );

    return doraEvents;
  }

  // ── Lease Renewal ───────────────────────────────────────

  /**
   * Performs a DHCP lease renewal (Request -> Acknowledge).
   *
   * At the T1 timer (50% of lease), the client sends a unicast
   * renewal request directly to the DHCP server. The server responds
   * with an Acknowledge containing the refreshed lease.
   *
   * @returns The two renewal events.
   * @throws If the client has no current lease to renew.
   */
  renewLease(): DHCPEvent[] {
    if (!this.assignedIP) {
      throw new Error(
        'Cannot renew: client has no active lease. Use performDORA() first.',
      );
    }

    const renewEvents: DHCPEvent[] = [];

    // Step 1: Client sends unicast renewal Request
    renewEvents.push(
      this.recordEvent('client', 'dhcp-server', 'renew', [
        `DHCP Renewal Request: Client requests extension of lease for ${this.assignedIP}.`,
        `Sent as unicast directly to server ${this.serverIP} (T1 timer expired at 50% of lease).`,
        'Unlike the initial DORA, renewal is unicast because the client already knows the server.',
        `Current lease remaining: ~${Math.floor(this.leaseTime / 2)}s.`,
      ], {
        offeredIP: this.assignedIP,
      }),
    );

    // Step 2: Server acknowledges with refreshed lease
    this.leaseTime = DEFAULT_LEASE_TIME; // Reset lease
    renewEvents.push(
      this.recordEvent('dhcp-server', 'client', 'acknowledge', [
        `DHCP Acknowledge: Server renews lease for ${this.assignedIP}.`,
        `New lease duration: ${DEFAULT_LEASE_TIME}s (${DEFAULT_LEASE_TIME / 3600} hours).`,
        `All configuration remains the same: Mask ${DEFAULT_SUBNET_MASK}, GW ${DEFAULT_GATEWAY}, DNS ${DEFAULT_DNS}.`,
        'T1 and T2 timers are reset. Client continues using the same IP.',
      ], {
        offeredIP: this.assignedIP,
        subnetMask: DEFAULT_SUBNET_MASK,
        gateway: DEFAULT_GATEWAY,
        dns: DEFAULT_DNS,
        leaseTime: DEFAULT_LEASE_TIME,
      }),
    );

    return renewEvents;
  }

  // ── Lease Release ───────────────────────────────────────

  /**
   * Releases the current DHCP lease.
   *
   * The client sends a unicast Release message to the server,
   * returning the IP address to the server's available pool.
   *
   * @returns The release event.
   * @throws If the client has no current lease to release.
   */
  releaseLease(): DHCPEvent[] {
    if (!this.assignedIP) {
      throw new Error(
        'Cannot release: client has no active lease. Use performDORA() first.',
      );
    }

    const releaseEvents: DHCPEvent[] = [];
    const releasedIP = this.assignedIP;

    // Step 1: Client sends Release to server
    this.assignedIP = '';
    this.leaseTime = 0;
    releaseEvents.push(
      this.recordEvent('client', 'dhcp-server', 'release', [
        `DHCP Release: Client voluntarily releases IP ${releasedIP}.`,
        `Sent as unicast to server ${this.serverIP}.`,
        `Server returns ${releasedIP} to the available address pool.`,
        'Client must remove IP configuration from its network interface.',
        'A new DORA exchange is needed to obtain a new address.',
      ], {
        offeredIP: releasedIP,
      }),
    );

    return releaseEvents;
  }

  // ── Query ───────────────────────────────────────────────

  /** Returns a copy of the complete event timeline. */
  getAllEvents(): DHCPEvent[] {
    return [...this.events];
  }

  /** Returns the currently assigned IP, or empty string if none. */
  getAssignedIP(): string {
    return this.assignedIP;
  }

  /** Returns the remaining lease time in seconds. */
  getLeaseTime(): number {
    return this.leaseTime;
  }

  // ── Reset ───────────────────────────────────────────────

  /** Resets the simulation to its initial state. */
  reset(): void {
    this.events = [];
    this.assignedIP = '';
    this.leaseTime = 0;
    this.tick = 0;
    this.nextIPOctet = 100;
  }

  // ── Internals ───────────────────────────────────────────

  /**
   * Records an event, appends it to the timeline, and returns it.
   * Description lines are joined with a single space.
   */
  private recordEvent(
    from: DHCPActor,
    to: DHCPActor,
    type: DHCPEventType,
    descriptionLines: string[],
    details: DHCPDetails,
  ): DHCPEvent {
    this.tick++;
    const event: DHCPEvent = {
      tick: this.tick,
      from,
      to,
      type,
      description: descriptionLines.join(' '),
      details,
    };
    this.events.push(event);
    return event;
  }
}
