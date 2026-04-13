/**
 * Chaos Engineering Event System
 *
 * Defines 30+ typed chaos events across five categories (infrastructure,
 * network, data, traffic, dependency) and provides a ChaosEngine class
 * to inject, remove, and query active events during simulation.
 *
 * Each event type carries metadata: severity, default duration, affected
 * node types, and a human-readable description.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Categories of chaos events. */
export type ChaosCategory =
  | 'infrastructure'
  | 'network'
  | 'data'
  | 'traffic'
  | 'dependency'
  | 'application'
  | 'security'
  | 'resource'
  | 'external'
  | 'cache';

/** Severity levels from least to most impactful. */
export type ChaosSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Node types that can be targeted by chaos events. */
export type NodeType =
  | 'load-balancer'
  | 'api-server'
  | 'web-server'
  | 'worker'
  | 'database'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'cdn'
  | 'dns'
  | 'gateway'
  | 'service';

// ---------------------------------------------------------------------------
// V2 Chaos Types — Amplification, Pressure, Visual
// ---------------------------------------------------------------------------

/** Pressure counter names for the 35 system-design pressure counters. */
export type PressureCounterName =
  | 'cpu' | 'memory' | 'disk' | 'network' | 'connections'
  | 'threads' | 'fileDescriptors' | 'iops' | 'bandwidth' | 'queueDepth'
  | 'cacheEvictions' | 'gcPause' | 'heapUsage' | 'swapUsage' | 'contextSwitches'
  | 'pageFaults' | 'tlbMisses' | 'branchMisses' | 'socketBacklog' | 'diskLatency'
  | 'replicationLag' | 'lockContention' | 'deadlockCount' | 'openTransactions' | 'walSize'
  | 'indexBloat' | 'vacuumLag' | 'connectionPoolUsage' | 'requestQueueDepth' | 'errorBudget'
  | 'retryRate' | 'circuitBreakerTrips' | 'rateLimitHits' | 'timeoutRate' | 'saturation';

/** How chaos escalates and affects node behavior. */
export interface AmplificationFactors {
  /** Multiplier for error rate increase (1 = normal, 5 = 5x errors). */
  errorAmplification: number;
  /** Multiplier for latency increase (1 = normal, 10 = 10x slower). */
  latencyAmplification: number;
  /** Multiplier for traffic volume (1 = normal, 3 = 3x traffic). */
  trafficAmplification: number;
  /** Fraction of requests to drop silently (0 = none, 1 = all). */
  dropFraction: number;
  /** Fraction of capacity lost (0 = full capacity, 1 = zero capacity). */
  capacityDegradation: number;
}

/** Visual indicator for the UI when chaos is active. */
export interface VisualIndicator {
  /** CSS animation to apply to affected nodes. */
  animation: 'shake' | 'pulse' | 'flash' | 'glitch' | 'fade';
  /** Hex color for the chaos indicator. */
  color: string;
  /** Lucide icon name for the chaos badge. */
  icon: string;
}

/** Effect on a specific pressure counter when chaos is active. */
export interface PressureCounterEffect {
  /** Which pressure counter to affect. */
  counter: PressureCounterName;
  /** Delta added to the counter each tick while chaos is active. */
  delta: number;
}

/** How the chaos event behaves over time. */
export type DurationType = 'transient' | 'sustained' | 'escalating';

/** Definition of a chaos event type (immutable catalog entry). */
export interface ChaosEventType {
  /** Unique identifier for this event type. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Event category. */
  category: ChaosCategory;
  /** What this event does and how it affects the system. */
  description: string;
  /** Default duration in milliseconds. */
  defaultDurationMs: number;
  /** Default severity. */
  defaultSeverity: ChaosSeverity;
  /** Node types that this event can target. */
  affectedNodeTypes: readonly NodeType[];

  // ── V2 fields (optional for backward compatibility) ──

  /** How this event amplifies errors, latency, traffic, and capacity. */
  amplification?: AmplificationFactors;
  /** Visual indicator for the UI. */
  visual?: VisualIndicator;
  /** Pressure counter effects applied each tick while active. */
  pressureEffects?: PressureCounterEffect[];
  /** Temporal behavior: transient (brief), sustained (constant), or escalating (worsening). */
  durationType?: DurationType;
  /** For escalating type: factor multiplied per tick (e.g. 1.02 = 2% worse each tick). */
  escalationRate?: number;
}

/** An active chaos event instance targeting specific nodes. */
export interface ChaosEvent {
  /** Unique instance ID (generated at injection time). */
  instanceId: string;
  /** The event type ID from the catalog. */
  eventTypeId: string;
  /** Node IDs this event is applied to. */
  targetNodeIds: string[];
  /** When this event was injected (ms since epoch or simulation time). */
  injectedAtMs: number;
  /** Duration in ms. Null means indefinite until manual removal. */
  durationMs: number | null;
  /** Severity override (defaults to the catalog entry). */
  severity: ChaosSeverity;
}

// ---------------------------------------------------------------------------
// Chaos Event Catalog (73 events across 10 categories)
// ---------------------------------------------------------------------------

/** Full catalog of available chaos event types. */
export const CHAOS_EVENTS: readonly ChaosEventType[] = [
  // ═══════════════════════════════════════════════════════════════
  // Infrastructure (10 events: 6 original + 4 new)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'node-crash',
    name: 'Node Crash',
    category: 'infrastructure',
    description: 'Immediately terminates the node process, simulating an unexpected crash. The node stops serving all requests until restarted.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Skull' },
    pressureEffects: [{ counter: 'cpu', delta: 0 }, { counter: 'connections', delta: -100 }],
    durationType: 'transient',
  },
  {
    id: 'node-slow',
    name: 'Node Slowdown',
    category: 'infrastructure',
    description: 'Degrades node performance by 5-10x, simulating resource contention or garbage collection pauses.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'service'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 8, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.8 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Snail' },
    pressureEffects: [{ counter: 'cpu', delta: 40 }, { counter: 'gcPause', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'node-restart',
    name: 'Node Restart',
    category: 'infrastructure',
    description: 'Gracefully restarts the node. Causes a brief outage during shutdown and startup (cold-start penalty).',
    defaultDurationMs: 10_000,
    defaultSeverity: 'low',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'service'],
    amplification: { errorAmplification: 5, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.9 },
    visual: { animation: 'flash', color: '#3B82F6', icon: 'RotateCw' },
    pressureEffects: [{ counter: 'connections', delta: -50 }],
    durationType: 'transient',
  },
  {
    id: 'disk-full',
    name: 'Disk Full',
    category: 'infrastructure',
    description: 'Fills disk to capacity, causing write failures. Database nodes may become read-only; log writes fail.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database', 'storage', 'api-server', 'worker'],
    amplification: { errorAmplification: 5, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.7 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'HardDrive' },
    pressureEffects: [{ counter: 'disk', delta: 50 }, { counter: 'iops', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'cpu-spike',
    name: 'CPU Spike',
    category: 'infrastructure',
    description: 'Drives CPU utilization to 95%+, causing increased latency for all requests processed by this node.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'database', 'service'],
    amplification: { errorAmplification: 1.2, latencyAmplification: 5, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.6 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Cpu' },
    pressureEffects: [{ counter: 'cpu', delta: 45 }, { counter: 'contextSwitches', delta: 20 }],
    durationType: 'sustained',
  },
  {
    id: 'memory-pressure',
    name: 'Memory Pressure',
    category: 'infrastructure',
    description: 'Consumes available memory, triggering swap usage and potential OOM kills. Causes severe latency degradation.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'cache', 'database', 'service'],
    amplification: { errorAmplification: 3, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.8 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'MemoryStick' },
    pressureEffects: [{ counter: 'memory', delta: 50 }, { counter: 'swapUsage', delta: 30 }, { counter: 'gcPause', delta: 20 }],
    durationType: 'escalating',
    escalationRate: 1.03,
  },
  // New infrastructure events
  {
    id: 'kernel-panic',
    name: 'Kernel Panic',
    category: 'infrastructure',
    description: 'Operating system kernel panic causes immediate node death. No graceful shutdown; in-flight requests are lost.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'database', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'AlertOctagon' },
    pressureEffects: [{ counter: 'cpu', delta: 100 }, { counter: 'memory', delta: 100 }],
    durationType: 'transient',
  },
  {
    id: 'firmware-corruption',
    name: 'Firmware Corruption',
    category: 'infrastructure',
    description: 'Corrupted firmware on storage controller causes silent data path errors and intermittent I/O failures.',
    defaultDurationMs: 180_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['database', 'storage'],
    amplification: { errorAmplification: 4, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0.2, capacityDegradation: 0.5 },
    visual: { animation: 'glitch', color: '#9333EA', icon: 'CircuitBoard' },
    pressureEffects: [{ counter: 'disk', delta: 60 }, { counter: 'iops', delta: 40 }, { counter: 'diskLatency', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'hypervisor-failure',
    name: 'Hypervisor Failure',
    category: 'infrastructure',
    description: 'Virtualization hypervisor crash takes down all VMs on the host. Multiple nodes go offline simultaneously.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'database', 'cache', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'ServerCrash' },
    pressureEffects: [{ counter: 'cpu', delta: 100 }, { counter: 'memory', delta: 100 }, { counter: 'connections', delta: -100 }],
    durationType: 'transient',
  },
  {
    id: 'clock-skew',
    name: 'Clock Skew',
    category: 'infrastructure',
    description: 'System clock drifts by 5-30 seconds, breaking TLS handshakes, token validation, and distributed consensus.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'database', 'cache', 'service'],
    amplification: { errorAmplification: 3, latencyAmplification: 1.5, trafficAmplification: 1, dropFraction: 0.15, capacityDegradation: 0.2 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Clock' },
    pressureEffects: [{ counter: 'errorBudget', delta: 10 }],
    durationType: 'sustained',
  },

  // ═══════════════════════════════════════════════════════════════
  // Network (19 events: 5 original + 14 new)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'network-partition',
    name: 'Network Partition',
    category: 'network',
    description: 'Isolates target nodes from the rest of the network. Simulates a split-brain scenario where nodes cannot communicate.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'database', 'cache', 'queue', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Unplug' },
    pressureEffects: [{ counter: 'network', delta: 100 }, { counter: 'connections', delta: -100 }],
    durationType: 'sustained',
  },
  {
    id: 'latency-injection',
    name: 'Latency Injection',
    category: 'network',
    description: 'Adds 200-500ms artificial latency to all network calls to/from the target nodes.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'database', 'cache', 'queue', 'storage', 'gateway', 'service'],
    amplification: { errorAmplification: 1, latencyAmplification: 5, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.1 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Timer' },
    pressureEffects: [{ counter: 'network', delta: 20 }, { counter: 'requestQueueDepth', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'packet-loss',
    name: 'Packet Loss',
    category: 'network',
    description: 'Randomly drops 10-30% of network packets, causing retransmissions and increased latency.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'database', 'cache', 'queue', 'gateway', 'service'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 3, trafficAmplification: 1.3, dropFraction: 0.2, capacityDegradation: 0.3 },
    visual: { animation: 'flash', color: '#F97316', icon: 'WifiOff' },
    pressureEffects: [{ counter: 'network', delta: 25 }, { counter: 'retryRate', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'dns-failure',
    name: 'DNS Failure',
    category: 'network',
    description: 'DNS resolution fails for the target nodes, preventing new connections from being established.',
    defaultDurationMs: 20_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['dns', 'api-server', 'web-server', 'gateway', 'service'],
    amplification: { errorAmplification: 8, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.9, capacityDegradation: 0.9 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Globe' },
    pressureEffects: [{ counter: 'network', delta: 50 }, { counter: 'errorBudget', delta: 20 }],
    durationType: 'transient',
  },
  {
    id: 'bandwidth-throttle',
    name: 'Bandwidth Throttle',
    category: 'network',
    description: 'Limits network bandwidth to 1 Mbps, causing queuing of large payloads and timeout of streaming requests.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'storage', 'cdn', 'gateway', 'service'],
    amplification: { errorAmplification: 1.2, latencyAmplification: 4, trafficAmplification: 1, dropFraction: 0.05, capacityDegradation: 0.5 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Gauge' },
    pressureEffects: [{ counter: 'bandwidth', delta: 40 }, { counter: 'requestQueueDepth', delta: 20 }],
    durationType: 'sustained',
  },
  // New network events
  {
    id: 'bgp-leak',
    name: 'BGP Route Leak',
    category: 'network',
    description: 'Border Gateway Protocol route leak misdirects traffic through unintended AS paths, causing latency spikes and potential blackholes.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['load-balancer', 'gateway', 'cdn', 'dns'],
    amplification: { errorAmplification: 3, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0.4, capacityDegradation: 0.6 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'Route' },
    pressureEffects: [{ counter: 'network', delta: 60 }, { counter: 'bandwidth', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'mtls-cert-expiry',
    name: 'mTLS Certificate Expiry',
    category: 'network',
    description: 'Mutual TLS certificates expire, breaking service-to-service authentication. All inter-service calls fail.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'gateway', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'ShieldOff' },
    pressureEffects: [{ counter: 'errorBudget', delta: 30 }, { counter: 'connections', delta: -80 }],
    durationType: 'sustained',
  },
  {
    id: 'dns-amplification',
    name: 'DNS Amplification Attack',
    category: 'network',
    description: 'Amplified DNS response flood overwhelms network bandwidth and DNS infrastructure.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['dns', 'load-balancer', 'gateway'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 50, dropFraction: 0.3, capacityDegradation: 0.7 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Zap' },
    pressureEffects: [{ counter: 'bandwidth', delta: 80 }, { counter: 'network', delta: 60 }],
    durationType: 'transient',
  },
  {
    id: 'tcp-syn-flood',
    name: 'TCP SYN Flood',
    category: 'network',
    description: 'SYN flood exhausts the TCP backlog, preventing new legitimate connections from completing the handshake.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'gateway'],
    amplification: { errorAmplification: 5, latencyAmplification: 3, trafficAmplification: 20, dropFraction: 0.6, capacityDegradation: 0.8 },
    visual: { animation: 'flash', color: '#EF4444', icon: 'ShieldAlert' },
    pressureEffects: [{ counter: 'socketBacklog', delta: 60 }, { counter: 'connections', delta: -40 }],
    durationType: 'sustained',
  },
  {
    id: 'vlan-misconfiguration',
    name: 'VLAN Misconfiguration',
    category: 'network',
    description: 'VLAN tagging error isolates nodes onto the wrong network segment, breaking connectivity to dependent services.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'database', 'cache', 'service'],
    amplification: { errorAmplification: 8, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.9, capacityDegradation: 0.9 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'Network' },
    pressureEffects: [{ counter: 'network', delta: 80 }, { counter: 'errorBudget', delta: 25 }],
    durationType: 'sustained',
  },
  {
    id: 'arp-spoofing',
    name: 'ARP Spoofing',
    category: 'network',
    description: 'ARP cache poisoning redirects traffic through a malicious intermediary, causing data interception and increased latency.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'database', 'gateway', 'service'],
    amplification: { errorAmplification: 2, latencyAmplification: 4, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.3 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'Eye' },
    pressureEffects: [{ counter: 'network', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'ssl-renegotiation',
    name: 'SSL Renegotiation Storm',
    category: 'network',
    description: 'Excessive SSL renegotiation requests consume CPU and memory on TLS-terminating nodes.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0.05, capacityDegradation: 0.4 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Lock' },
    pressureEffects: [{ counter: 'cpu', delta: 35 }, { counter: 'connections', delta: -20 }],
    durationType: 'sustained',
  },
  {
    id: 'ipv6-tunnel-failure',
    name: 'IPv6 Tunnel Failure',
    category: 'network',
    description: 'IPv6-over-IPv4 tunnel collapses, breaking connectivity for dual-stack services relying on IPv6.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['gateway', 'load-balancer', 'api-server'],
    amplification: { errorAmplification: 3, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.5 },
    visual: { animation: 'flash', color: '#F97316', icon: 'Unplug' },
    pressureEffects: [{ counter: 'network', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'websocket-flood',
    name: 'WebSocket Flood',
    category: 'network',
    description: 'Massive number of WebSocket connections opened simultaneously, exhausting server resources and file descriptors.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'gateway'],
    amplification: { errorAmplification: 3, latencyAmplification: 4, trafficAmplification: 10, dropFraction: 0.3, capacityDegradation: 0.7 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Plug' },
    pressureEffects: [{ counter: 'connections', delta: 80 }, { counter: 'fileDescriptors', delta: 60 }, { counter: 'memory', delta: 20 }],
    durationType: 'escalating',
    escalationRate: 1.05,
  },
  {
    id: 'grpc-deadline-exceeded',
    name: 'gRPC Deadline Exceeded',
    category: 'network',
    description: 'gRPC deadlines expire before responses arrive, causing cascading cancellations through the call chain.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'service', 'gateway'],
    amplification: { errorAmplification: 4, latencyAmplification: 1, trafficAmplification: 1.5, dropFraction: 0.4, capacityDegradation: 0.3 },
    visual: { animation: 'flash', color: '#F97316', icon: 'TimerOff' },
    pressureEffects: [{ counter: 'timeoutRate', delta: 30 }, { counter: 'retryRate', delta: 20 }],
    durationType: 'sustained',
  },
  {
    id: 'http2-stream-reset',
    name: 'HTTP/2 Stream Reset',
    category: 'network',
    description: 'HTTP/2 multiplexed streams are forcibly reset (RST_STREAM), breaking in-flight requests on shared connections.',
    defaultDurationMs: 20_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway'],
    amplification: { errorAmplification: 3, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.2 },
    visual: { animation: 'flash', color: '#F59E0B', icon: 'RefreshCwOff' },
    pressureEffects: [{ counter: 'connections', delta: -30 }, { counter: 'retryRate', delta: 15 }],
    durationType: 'transient',
  },
  {
    id: 'quic-migration-failure',
    name: 'QUIC Migration Failure',
    category: 'network',
    description: 'QUIC connection migration fails during client IP change, dropping active sessions and requiring full reconnect.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'low',
    affectedNodeTypes: ['load-balancer', 'gateway', 'cdn'],
    amplification: { errorAmplification: 2, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.2, capacityDegradation: 0.1 },
    visual: { animation: 'flash', color: '#F59E0B', icon: 'ArrowRightLeft' },
    pressureEffects: [{ counter: 'connections', delta: -15 }],
    durationType: 'transient',
  },
  {
    id: 'tls13-downgrade',
    name: 'TLS 1.3 Downgrade',
    category: 'network',
    description: 'Forced TLS version downgrade to 1.2/1.1 increases handshake latency and exposes weaker cipher suites.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway', 'cdn'],
    amplification: { errorAmplification: 1, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.15 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'ShieldAlert' },
    pressureEffects: [{ counter: 'cpu', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'network-namespace-isolation',
    name: 'Network Namespace Isolation',
    category: 'network',
    description: 'Container network namespace becomes isolated from the host, breaking all external connectivity for affected pods.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Container' },
    pressureEffects: [{ counter: 'network', delta: 100 }, { counter: 'connections', delta: -100 }],
    durationType: 'sustained',
  },

  // ═══════════════════════════════════════════════════════════════
  // Application (10 new events)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'classloader-leak',
    name: 'ClassLoader Leak',
    category: 'application',
    description: 'JVM classloader leak causes permgen/metaspace exhaustion, leading to OOM and increasingly long GC pauses.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.6 },
    visual: { animation: 'pulse', color: '#A855F7', icon: 'Bug' },
    pressureEffects: [{ counter: 'memory', delta: 30 }, { counter: 'heapUsage', delta: 40 }, { counter: 'gcPause', delta: 25 }],
    durationType: 'escalating',
    escalationRate: 1.04,
  },
  {
    id: 'jit-deoptimization',
    name: 'JIT Deoptimization',
    category: 'application',
    description: 'JIT compiler invalidates hot code paths, falling back to interpreted execution with 10-50x latency increase.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 1, latencyAmplification: 20, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.5 },
    visual: { animation: 'flash', color: '#F97316', icon: 'Zap' },
    pressureEffects: [{ counter: 'cpu', delta: 40 }, { counter: 'contextSwitches', delta: 15 }],
    durationType: 'transient',
  },
  {
    id: 'serialization-bomb',
    name: 'Serialization Bomb',
    category: 'application',
    description: 'Deeply nested object graph triggers exponential deserialization, consuming all CPU and memory.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 5, latencyAmplification: 100, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.9 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'Bomb' },
    pressureEffects: [{ counter: 'cpu', delta: 90 }, { counter: 'memory', delta: 80 }, { counter: 'heapUsage', delta: 70 }],
    durationType: 'transient',
  },
  {
    id: 'regex-catastrophic-backtrack',
    name: 'Regex Catastrophic Backtracking',
    category: 'application',
    description: 'Evil regex input causes exponential backtracking, pinning a thread at 100% CPU for seconds per request.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'service'],
    amplification: { errorAmplification: 2, latencyAmplification: 50, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.8 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Regex' },
    pressureEffects: [{ counter: 'cpu', delta: 80 }, { counter: 'threads', delta: -10 }],
    durationType: 'sustained',
  },
  {
    id: 'goroutine-leak',
    name: 'Goroutine Leak',
    category: 'application',
    description: 'Goroutines accumulate without cleanup, consuming memory and file descriptors until the process OOMs.',
    defaultDurationMs: 180_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 2, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.5 },
    visual: { animation: 'pulse', color: '#A855F7', icon: 'Layers' },
    pressureEffects: [{ counter: 'memory', delta: 25 }, { counter: 'fileDescriptors', delta: 30 }, { counter: 'threads', delta: 20 }],
    durationType: 'escalating',
    escalationRate: 1.02,
  },
  {
    id: 'async-deadlock',
    name: 'Async Deadlock',
    category: 'application',
    description: 'Async/await deadlock freezes the task scheduler. New requests queue indefinitely while existing ones never complete.',
    defaultDurationMs: 20_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.8, capacityDegradation: 0.95 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'Lock' },
    pressureEffects: [{ counter: 'threads', delta: -50 }, { counter: 'requestQueueDepth', delta: 80 }, { counter: 'deadlockCount', delta: 5 }],
    durationType: 'sustained',
  },
  {
    id: 'event-loop-starvation',
    name: 'Event Loop Starvation',
    category: 'application',
    description: 'Synchronous computation blocks the Node.js event loop, preventing I/O callbacks from executing.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'service'],
    amplification: { errorAmplification: 3, latencyAmplification: 20, trafficAmplification: 1, dropFraction: 0.2, capacityDegradation: 0.9 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Hourglass' },
    pressureEffects: [{ counter: 'cpu', delta: 60 }, { counter: 'requestQueueDepth', delta: 50 }],
    durationType: 'sustained',
  },
  {
    id: 'fiber-starvation',
    name: 'Fiber Starvation',
    category: 'application',
    description: 'Virtual thread / fiber pool exhausted. All fibers blocked on I/O, no capacity for new requests.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 4, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.8 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Layers' },
    pressureEffects: [{ counter: 'threads', delta: -40 }, { counter: 'requestQueueDepth', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'signal-handler-crash',
    name: 'Signal Handler Crash',
    category: 'application',
    description: 'Custom signal handler crashes, preventing graceful shutdown. Node enters zombie state, consuming resources without serving.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 8, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.9, capacityDegradation: 0.95 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'Skull' },
    pressureEffects: [{ counter: 'cpu', delta: 30 }, { counter: 'memory', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'stack-overflow',
    name: 'Stack Overflow',
    category: 'application',
    description: 'Infinite recursion or deep call stack causes stack overflow, crashing the thread or process.',
    defaultDurationMs: 10_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'worker', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'AlertTriangle' },
    pressureEffects: [{ counter: 'memory', delta: 50 }, { counter: 'threads', delta: -20 }],
    durationType: 'transient',
  },

  // ═══════════════════════════════════════════════════════════════
  // Data Layer (6 original + 13 new = 19 events)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'db-failover',
    name: 'Database Failover',
    category: 'data',
    description: 'Primary database fails over to a replica. Causes a brief period of write unavailability and potential stale reads.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 5, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.7 },
    visual: { animation: 'flash', color: '#EF4444', icon: 'Database' },
    pressureEffects: [{ counter: 'replicationLag', delta: 20 }, { counter: 'connections', delta: -30 }],
    durationType: 'transient',
  },
  {
    id: 'replication-lag',
    name: 'Replication Lag',
    category: 'data',
    description: 'Introduces 5-30 second replication lag between primary and replicas, causing stale reads on read replicas.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Clock' },
    pressureEffects: [{ counter: 'replicationLag', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'cache-eviction-storm',
    name: 'Cache Eviction Storm',
    category: 'data',
    description: 'Mass eviction of cached entries, causing a thundering herd of requests to hit the backing database.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 3, dropFraction: 0, capacityDegradation: 0.8 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Trash2' },
    pressureEffects: [{ counter: 'cacheEvictions', delta: 80 }, { counter: 'memory', delta: -30 }],
    durationType: 'transient',
  },
  {
    id: 'hot-partition',
    name: 'Hot Partition',
    category: 'data',
    description: 'Concentrates 80% of traffic onto a single database partition/shard, causing throttling and increased latency.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database', 'cache'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.7 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Flame' },
    pressureEffects: [{ counter: 'cpu', delta: 30 }, { counter: 'diskLatency', delta: 25 }, { counter: 'lockContention', delta: 20 }],
    durationType: 'sustained',
  },
  {
    id: 'deadlock',
    name: 'Database Deadlock',
    category: 'data',
    description: 'Simulates a deadlock between concurrent transactions, causing affected queries to time out after detection.',
    defaultDurationMs: 10_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 4, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.6 },
    visual: { animation: 'shake', color: '#F97316', icon: 'Lock' },
    pressureEffects: [{ counter: 'lockContention', delta: 50 }, { counter: 'deadlockCount', delta: 10 }, { counter: 'openTransactions', delta: 20 }],
    durationType: 'transient',
  },
  {
    id: 'data-corruption',
    name: 'Data Corruption',
    category: 'data',
    description: 'Silent data corruption in a subset of records. Reads return incorrect data until detected and repaired.',
    defaultDurationMs: 300_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['database', 'storage'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'FileWarning' },
    pressureEffects: [{ counter: 'errorBudget', delta: 50 }],
    durationType: 'sustained',
  },
  // New data-layer events
  {
    id: 'write-skew-anomaly',
    name: 'Write Skew Anomaly',
    category: 'data',
    description: 'Concurrent transactions read overlapping data and write disjoint sets, violating application invariants despite serializable isolation.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 3, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.1 },
    visual: { animation: 'glitch', color: '#A855F7', icon: 'GitBranch' },
    pressureEffects: [{ counter: 'openTransactions', delta: 15 }, { counter: 'lockContention', delta: 10 }],
    durationType: 'sustained',
  },
  {
    id: 'phantom-read',
    name: 'Phantom Read',
    category: 'data',
    description: 'Range queries return different row sets within the same transaction due to concurrent inserts.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'flash', color: '#F59E0B', icon: 'Eye' },
    pressureEffects: [{ counter: 'openTransactions', delta: 10 }],
    durationType: 'transient',
  },
  {
    id: 'wal-corruption',
    name: 'WAL Corruption',
    category: 'data',
    description: 'Write-ahead log corruption prevents crash recovery. Database must replay from last known good backup.',
    defaultDurationMs: 300_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.8, capacityDegradation: 0.9 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'FileX' },
    pressureEffects: [{ counter: 'walSize', delta: 100 }, { counter: 'disk', delta: 50 }],
    durationType: 'sustained',
  },
  {
    id: 'vacuum-stall',
    name: 'Vacuum Stall',
    category: 'data',
    description: 'PostgreSQL autovacuum stalls due to long-running transactions, causing table bloat and degraded scan performance.',
    defaultDurationMs: 180_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.3 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Trash' },
    pressureEffects: [{ counter: 'vacuumLag', delta: 40 }, { counter: 'disk', delta: 20 }, { counter: 'indexBloat', delta: 15 }],
    durationType: 'escalating',
    escalationRate: 1.01,
  },
  {
    id: 'index-bloat',
    name: 'Index Bloat',
    category: 'data',
    description: 'B-tree indexes accumulate dead tuples and become bloated, increasing scan times and disk usage.',
    defaultDurationMs: 300_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 4, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.3 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'ListTree' },
    pressureEffects: [{ counter: 'indexBloat', delta: 30 }, { counter: 'disk', delta: 15 }, { counter: 'diskLatency', delta: 10 }],
    durationType: 'escalating',
    escalationRate: 1.01,
  },
  {
    id: 'replication-slot-overflow',
    name: 'Replication Slot Overflow',
    category: 'data',
    description: 'Logical replication slot falls behind, accumulating WAL segments and threatening disk exhaustion.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 2, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.2 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'ArrowDownToLine' },
    pressureEffects: [{ counter: 'walSize', delta: 60 }, { counter: 'disk', delta: 40 }, { counter: 'replicationLag', delta: 50 }],
    durationType: 'escalating',
    escalationRate: 1.03,
  },
  {
    id: 'sequence-exhaustion',
    name: 'Sequence Exhaustion',
    category: 'data',
    description: 'Auto-increment sequence reaches max value. New inserts fail with unique constraint violations.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.5, capacityDegradation: 0.5 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'Hash' },
    pressureEffects: [{ counter: 'errorBudget', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'foreign-key-cascade-storm',
    name: 'Foreign Key Cascade Storm',
    category: 'data',
    description: 'Deleting a parent row triggers cascading deletes across multiple tables, locking rows and blocking concurrent writes.',
    defaultDurationMs: 20_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 2, latencyAmplification: 15, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.6 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Workflow' },
    pressureEffects: [{ counter: 'lockContention', delta: 60 }, { counter: 'iops', delta: 40 }, { counter: 'openTransactions', delta: 30 }],
    durationType: 'transient',
  },
  {
    id: 'materialized-view-stale',
    name: 'Materialized View Stale',
    category: 'data',
    description: 'Materialized view refresh fails or takes too long, serving stale aggregations to downstream queries.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Table' },
    pressureEffects: [{ counter: 'cpu', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'partition-prune-failure',
    name: 'Partition Prune Failure',
    category: 'data',
    description: 'Query planner fails to prune irrelevant partitions, scanning all partitions and consuming excessive I/O.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 8, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.4 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Search' },
    pressureEffects: [{ counter: 'iops', delta: 50 }, { counter: 'diskLatency', delta: 25 }],
    durationType: 'sustained',
  },
  {
    id: 'histogram-skew',
    name: 'Histogram Skew',
    category: 'data',
    description: 'Outdated column statistics cause query planner to choose suboptimal plans with nested loop joins on large tables.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 1, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.3 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'BarChart' },
    pressureEffects: [{ counter: 'cpu', delta: 25 }, { counter: 'iops', delta: 20 }],
    durationType: 'sustained',
  },
  {
    id: 'compaction-storm',
    name: 'Compaction Storm',
    category: 'data',
    description: 'LSM-tree compaction runs simultaneously on all levels, consuming all I/O bandwidth and stalling writes.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['database', 'storage'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 8, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.7 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Layers' },
    pressureEffects: [{ counter: 'iops', delta: 80 }, { counter: 'diskLatency', delta: 50 }, { counter: 'disk', delta: 20 }],
    durationType: 'transient',
  },
  {
    id: 'tombstone-accumulation',
    name: 'Tombstone Accumulation',
    category: 'data',
    description: 'Excessive tombstones in Cassandra/ScyllaDB cause read amplification and timeout on range queries.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['database'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.3 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Skull' },
    pressureEffects: [{ counter: 'iops', delta: 30 }, { counter: 'memory', delta: 15 }],
    durationType: 'escalating',
    escalationRate: 1.02,
  },

  // ═══════════════════════════════════════════════════════════════
  // Cache (11 new events)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cache-stampede',
    name: 'Cache Stampede',
    category: 'cache',
    description: 'Popular cache key expires and thousands of concurrent requests all attempt to regenerate it simultaneously.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache', 'database'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 50, dropFraction: 0, capacityDegradation: 0.5 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Zap' },
    pressureEffects: [{ counter: 'cpu', delta: 40 }, { counter: 'connections', delta: 50 }],
    durationType: 'transient',
  },
  {
    id: 'hot-shard',
    name: 'Hot Shard',
    category: 'cache',
    description: 'Consistent hashing places disproportionate load on a single cache shard, causing it to saturate.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 2, latencyAmplification: 4, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.6 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Flame' },
    pressureEffects: [{ counter: 'cpu', delta: 50 }, { counter: 'memory', delta: 30 }, { counter: 'saturation', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'serialization-mismatch',
    name: 'Serialization Mismatch',
    category: 'cache',
    description: 'Cache client and server disagree on serialization format, causing deserialization failures on every read.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'flash', color: '#EF4444', icon: 'FileCode' },
    pressureEffects: [{ counter: 'errorBudget', delta: 30 }],
    durationType: 'sustained',
  },
  {
    id: 'ttl-thundering-herd',
    name: 'TTL Thundering Herd',
    category: 'cache',
    description: 'Batch of cache keys with identical TTL all expire at once, triggering a simultaneous stampede to the database.',
    defaultDurationMs: 20_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache', 'database'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 20, dropFraction: 0, capacityDegradation: 0.4 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Timer' },
    pressureEffects: [{ counter: 'cacheEvictions', delta: 60 }, { counter: 'connections', delta: 40 }],
    durationType: 'transient',
  },
  {
    id: 'cache-aside-race',
    name: 'Cache-Aside Race',
    category: 'cache',
    description: 'Race condition in cache-aside pattern: stale data written to cache after a concurrent update, serving outdated values.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'RefreshCw' },
    pressureEffects: [{ counter: 'errorBudget', delta: 10 }],
    durationType: 'sustained',
  },
  {
    id: 'write-behind-lag',
    name: 'Write-Behind Lag',
    category: 'cache',
    description: 'Write-behind cache cannot flush to database fast enough. Buffer grows until writes are lost on crash.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.2 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'ArrowDownToLine' },
    pressureEffects: [{ counter: 'queueDepth', delta: 40 }, { counter: 'memory', delta: 20 }],
    durationType: 'escalating',
    escalationRate: 1.02,
  },
  {
    id: 'near-cache-inconsistency',
    name: 'Near-Cache Inconsistency',
    category: 'cache',
    description: 'Local near-cache and remote cache diverge. Application reads stale data from near-cache while remote has been updated.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['cache', 'api-server'],
    amplification: { errorAmplification: 1, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0 },
    visual: { animation: 'pulse', color: '#F59E0B', icon: 'Split' },
    pressureEffects: [{ counter: 'errorBudget', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'distributed-lock-contention',
    name: 'Distributed Lock Contention',
    category: 'cache',
    description: 'Redis/Zookeeper distributed lock hotspot causes all instances to queue on a single lock, creating a serialization bottleneck.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache', 'service'],
    amplification: { errorAmplification: 2, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.7 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Lock' },
    pressureEffects: [{ counter: 'lockContention', delta: 60 }, { counter: 'requestQueueDepth', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'cache-topology-change',
    name: 'Cache Topology Change',
    category: 'cache',
    description: 'Adding/removing cache nodes triggers rehashing. During rebalance, many keys are temporarily unavailable.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 3, latencyAmplification: 3, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.4 },
    visual: { animation: 'flash', color: '#F97316', icon: 'Network' },
    pressureEffects: [{ counter: 'cacheEvictions', delta: 30 }, { counter: 'connections', delta: -20 }],
    durationType: 'transient',
  },
  {
    id: 'memory-fragmentation-cascade',
    name: 'Memory Fragmentation Cascade',
    category: 'cache',
    description: 'Severe memory fragmentation causes Redis to use 3x actual data size. OOM killer triggered despite low logical usage.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 3, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.5 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'MemoryStick' },
    pressureEffects: [{ counter: 'memory', delta: 60 }, { counter: 'cacheEvictions', delta: 20 }],
    durationType: 'escalating',
    escalationRate: 1.02,
  },
  {
    id: 'eviction-policy-thrash',
    name: 'Eviction Policy Thrash',
    category: 'cache',
    description: 'Working set exceeds cache capacity. LRU evicts recently-needed keys that are immediately re-fetched, creating a thrashing loop.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['cache'],
    amplification: { errorAmplification: 1, latencyAmplification: 3, trafficAmplification: 2, dropFraction: 0, capacityDegradation: 0.5 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'RefreshCw' },
    pressureEffects: [{ counter: 'cacheEvictions', delta: 50 }, { counter: 'cpu', delta: 15 }],
    durationType: 'sustained',
  },

  // ═══════════════════════════════════════════════════════════════
  // Traffic (10 events: 7 original + 3 new)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'traffic-spike',
    name: 'Traffic Spike',
    category: 'traffic',
    description: 'Sudden 10x increase in incoming request rate, overwhelming capacity and causing queue buildup.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'gateway'],
    amplification: { errorAmplification: 2, latencyAmplification: 3, trafficAmplification: 10, dropFraction: 0, capacityDegradation: 0.2 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'TrendingUp' },
    pressureEffects: [{ counter: 'requestQueueDepth', delta: 50 }, { counter: 'connections', delta: 40 }],
    durationType: 'transient',
  },
  {
    id: 'thundering-herd',
    name: 'Thundering Herd',
    category: 'traffic',
    description: 'Simultaneous reconnection of thousands of clients after a brief outage, creating a massive burst of requests.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'cache', 'gateway'],
    amplification: { errorAmplification: 3, latencyAmplification: 5, trafficAmplification: 20, dropFraction: 0.1, capacityDegradation: 0.3 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Users' },
    pressureEffects: [{ counter: 'connections', delta: 80 }, { counter: 'requestQueueDepth', delta: 60 }],
    durationType: 'transient',
  },
  {
    id: 'retry-storm',
    name: 'Retry Storm',
    category: 'traffic',
    description: 'Cascading retries from clients and intermediate services amplify traffic by 3-5x during a partial outage.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway', 'service'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 2, trafficAmplification: 4, dropFraction: 0, capacityDegradation: 0.4 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'RefreshCw' },
    pressureEffects: [{ counter: 'retryRate', delta: 60 }, { counter: 'requestQueueDepth', delta: 30 }],
    durationType: 'escalating',
    escalationRate: 1.05,
  },
  {
    id: 'slow-consumer',
    name: 'Slow Consumer',
    category: 'traffic',
    description: 'A downstream consumer processes messages at 10% of normal speed, causing queue backpressure and backlog growth.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['queue', 'worker', 'service'],
    amplification: { errorAmplification: 1, latencyAmplification: 10, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.9 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Snail' },
    pressureEffects: [{ counter: 'queueDepth', delta: 60 }, { counter: 'memory', delta: 15 }],
    durationType: 'escalating',
    escalationRate: 1.02,
  },
  {
    id: 'hot-key',
    name: 'Hot Key',
    category: 'traffic',
    description: 'A single key receives disproportionate traffic (e.g., viral content), overwhelming the shard/partition that owns it.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['cache', 'database', 'api-server'],
    amplification: { errorAmplification: 1.5, latencyAmplification: 4, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.6 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'Key' },
    pressureEffects: [{ counter: 'cpu', delta: 30 }, { counter: 'saturation', delta: 25 }],
    durationType: 'sustained',
  },
  {
    id: 'ddos',
    name: 'DDoS Attack',
    category: 'traffic',
    description: 'Distributed denial-of-service attack flooding the entry point with 50-100x normal traffic from many source IPs.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['load-balancer', 'cdn', 'dns', 'gateway'],
    amplification: { errorAmplification: 5, latencyAmplification: 10, trafficAmplification: 80, dropFraction: 0.5, capacityDegradation: 0.8 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'ShieldAlert' },
    pressureEffects: [{ counter: 'bandwidth', delta: 90 }, { counter: 'connections', delta: 90 }, { counter: 'cpu', delta: 50 }],
    durationType: 'sustained',
  },
  {
    id: 'connection-exhaustion',
    name: 'Connection Exhaustion',
    category: 'traffic',
    description: 'All available connections in the connection pool are consumed, causing new requests to queue or fail immediately.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'database', 'cache', 'service'],
    amplification: { errorAmplification: 8, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.7, capacityDegradation: 0.95 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Unplug' },
    pressureEffects: [{ counter: 'connections', delta: 100 }, { counter: 'connectionPoolUsage', delta: 100 }],
    durationType: 'sustained',
  },
  // New traffic events
  {
    id: 'flash-crowd',
    name: 'Flash Crowd',
    category: 'traffic',
    description: 'Viral event causes organic traffic to spike 100x within seconds. Unlike DDoS, all traffic is legitimate.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['load-balancer', 'api-server', 'web-server', 'cdn', 'gateway'],
    amplification: { errorAmplification: 2, latencyAmplification: 5, trafficAmplification: 100, dropFraction: 0, capacityDegradation: 0.3 },
    visual: { animation: 'shake', color: '#EF4444', icon: 'Flame' },
    pressureEffects: [{ counter: 'requestQueueDepth', delta: 80 }, { counter: 'connections', delta: 60 }, { counter: 'bandwidth', delta: 40 }],
    durationType: 'transient',
  },
  {
    id: 'api-version-mismatch',
    name: 'API Version Mismatch',
    category: 'traffic',
    description: 'Clients send requests using a deprecated API version. Server returns 400/406 errors for incompatible payloads.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'gateway'],
    amplification: { errorAmplification: 5, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.1 },
    visual: { animation: 'flash', color: '#F97316', icon: 'GitCompare' },
    pressureEffects: [{ counter: 'errorBudget', delta: 20 }],
    durationType: 'sustained',
  },
  {
    id: 'webhook-retry-storm',
    name: 'Webhook Retry Storm',
    category: 'traffic',
    description: 'Failed webhook deliveries trigger exponential retries across thousands of endpoints, amplifying outbound traffic.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'worker', 'queue'],
    amplification: { errorAmplification: 2, latencyAmplification: 3, trafficAmplification: 5, dropFraction: 0, capacityDegradation: 0.4 },
    visual: { animation: 'pulse', color: '#EF4444', icon: 'Webhook' },
    pressureEffects: [{ counter: 'retryRate', delta: 50 }, { counter: 'queueDepth', delta: 40 }, { counter: 'connections', delta: 30 }],
    durationType: 'escalating',
    escalationRate: 1.04,
  },

  // ═══════════════════════════════════════════════════════════════
  // Dependency (9 events: 6 original + 3 new)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'api-timeout',
    name: 'API Timeout',
    category: 'dependency',
    description: 'External API calls time out after 30 seconds, blocking threads and degrading response times.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'gateway', 'service'],
    amplification: { errorAmplification: 3, latencyAmplification: 30, trafficAmplification: 1, dropFraction: 0, capacityDegradation: 0.3 },
    visual: { animation: 'pulse', color: '#F97316', icon: 'TimerOff' },
    pressureEffects: [{ counter: 'timeoutRate', delta: 40 }, { counter: 'threads', delta: -20 }],
    durationType: 'sustained',
  },
  {
    id: 'api-down',
    name: 'API Down',
    category: 'dependency',
    description: 'External dependency is completely unavailable. All calls return connection refused or 503.',
    defaultDurationMs: 120_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['api-server', 'gateway', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'ServerOff' },
    pressureEffects: [{ counter: 'errorBudget', delta: 50 }, { counter: 'circuitBreakerTrips', delta: 10 }],
    durationType: 'sustained',
  },
  {
    id: 'config-error',
    name: 'Configuration Error',
    category: 'dependency',
    description: 'Invalid configuration deployed (e.g., wrong DB connection string). Affected nodes fail to initialize or process requests.',
    defaultDurationMs: 30_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'worker', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'glitch', color: '#DC2626', icon: 'Settings' },
    pressureEffects: [{ counter: 'errorBudget', delta: 40 }],
    durationType: 'sustained',
  },
  {
    id: 'certificate-expiry',
    name: 'Certificate Expiry',
    category: 'dependency',
    description: 'TLS certificate expires, causing all HTTPS connections to fail with certificate validation errors.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'critical',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway', 'cdn'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 1, capacityDegradation: 1 },
    visual: { animation: 'shake', color: '#DC2626', icon: 'ShieldX' },
    pressureEffects: [{ counter: 'errorBudget', delta: 50 }, { counter: 'connections', delta: -100 }],
    durationType: 'sustained',
  },
  {
    id: 'rate-limit-hit',
    name: 'Rate Limit Hit',
    category: 'dependency',
    description: 'Third-party API rate limit exceeded. Subsequent calls return 429 responses until the quota resets.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['api-server', 'gateway', 'service'],
    amplification: { errorAmplification: 8, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.8, capacityDegradation: 0.8 },
    visual: { animation: 'flash', color: '#F97316', icon: 'Ban' },
    pressureEffects: [{ counter: 'rateLimitHits', delta: 50 }, { counter: 'errorBudget', delta: 15 }],
    durationType: 'sustained',
  },
  {
    id: 'service-discovery-failure',
    name: 'Service Discovery Failure',
    category: 'dependency',
    description: 'Service registry (Consul/etcd/ZooKeeper) becomes unavailable. New service instances cannot be discovered; stale endpoints used.',
    defaultDurationMs: 45_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'load-balancer', 'gateway', 'service'],
    amplification: { errorAmplification: 5, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.3, capacityDegradation: 0.5 },
    visual: { animation: 'glitch', color: '#EF4444', icon: 'SearchX' },
    pressureEffects: [{ counter: 'errorBudget', delta: 20 }, { counter: 'connections', delta: -20 }],
    durationType: 'sustained',
  },
  // New dependency events
  {
    id: 'sdk-version-mismatch',
    name: 'SDK Version Mismatch',
    category: 'dependency',
    description: 'Client SDK version is incompatible with the deployed API. Serialization errors on every call.',
    defaultDurationMs: 90_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'service'],
    amplification: { errorAmplification: 10, latencyAmplification: 1, trafficAmplification: 1, dropFraction: 0.9, capacityDegradation: 0.1 },
    visual: { animation: 'flash', color: '#EF4444', icon: 'Package' },
    pressureEffects: [{ counter: 'errorBudget', delta: 35 }],
    durationType: 'sustained',
  },
  {
    id: 'certificate-rotation',
    name: 'Certificate Rotation',
    category: 'dependency',
    description: 'Automated certificate rotation replaces the active cert. Brief window where old and new certs coexist, causing handshake failures.',
    defaultDurationMs: 15_000,
    defaultSeverity: 'medium',
    affectedNodeTypes: ['load-balancer', 'api-server', 'gateway'],
    amplification: { errorAmplification: 3, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.1, capacityDegradation: 0.1 },
    visual: { animation: 'flash', color: '#F59E0B', icon: 'KeyRound' },
    pressureEffects: [{ counter: 'connections', delta: -15 }],
    durationType: 'transient',
  },
  {
    id: 'feature-flag-flip',
    name: 'Feature Flag Flip',
    category: 'dependency',
    description: 'Feature flag service returns wrong flag value, enabling an untested code path in production.',
    defaultDurationMs: 60_000,
    defaultSeverity: 'high',
    affectedNodeTypes: ['api-server', 'web-server', 'service'],
    amplification: { errorAmplification: 5, latencyAmplification: 2, trafficAmplification: 1, dropFraction: 0.2, capacityDegradation: 0.3 },
    visual: { animation: 'glitch', color: '#A855F7', icon: 'Flag' },
    pressureEffects: [{ counter: 'errorBudget', delta: 25 }],
    durationType: 'sustained',
  },
] as const;

/** Map from event type ID to its catalog entry for O(1) lookup. */
const CHAOS_EVENT_MAP: ReadonlyMap<string, ChaosEventType> = new Map(
  CHAOS_EVENTS.map((e) => [e.id, e]),
);

// ---------------------------------------------------------------------------
// ChaosEngine
// ---------------------------------------------------------------------------

/**
 * Generate a unique instance ID for a chaos event.
 *
 * Uses a class field on ChaosEngine instead of a module-level mutable counter,
 * avoiding shared mutable state across instances.
 *
 * @param eventTypeId - The event type ID, used as prefix
 * @param counter - The current counter value from the ChaosEngine instance
 * @returns Unique instance ID string
 */
function generateInstanceId(eventTypeId: string, counter: number): string {
  return `${eventTypeId}-${counter}-${Date.now().toString(36)}`;
}

/**
 * Chaos Engineering engine for injecting, tracking, and removing failure events.
 *
 * @example
 *   const engine = new ChaosEngine();
 *   const event = engine.injectEvent('network-partition', ['db-primary', 'db-replica-1']);
 *   console.log(engine.getActiveEvents()); // [{ instanceId: '...', ... }]
 *   engine.removeEvent(event.instanceId);
 */
export class ChaosEngine {
  private activeEvents: Map<string, ChaosEvent> = new Map();
  private instanceCounter = 0;

  /**
   * Inject a chaos event targeting specific nodes.
   *
   * Looks up the event type from the catalog, creates an active instance,
   * and returns it.
   *
   * @param eventTypeId   - ID of the event type from CHAOS_EVENTS catalog
   * @param targetNodeIds - Array of node IDs to apply the chaos to
   * @param options       - Optional overrides for duration and severity
   * @returns The created ChaosEvent instance
   * @throws Error if eventTypeId is not found in the catalog
   */
  injectEvent(
    eventTypeId: string,
    targetNodeIds: string[],
    options: {
      durationMs?: number | null;
      severity?: ChaosSeverity;
      timestampMs?: number;
    } = {},
  ): ChaosEvent {
    const eventType = CHAOS_EVENT_MAP.get(eventTypeId);
    if (!eventType) {
      throw new Error(
        `Unknown chaos event type: "${eventTypeId}". ` +
          `Available types: ${CHAOS_EVENTS.map((e) => e.id).join(', ')}`,
      );
    }

    const event: ChaosEvent = {
      instanceId: generateInstanceId(eventTypeId, ++this.instanceCounter),
      eventTypeId,
      targetNodeIds: [...targetNodeIds],
      injectedAtMs: options.timestampMs ?? Date.now(),
      durationMs: options.durationMs !== undefined
        ? options.durationMs
        : eventType.defaultDurationMs,
      severity: options.severity ?? eventType.defaultSeverity,
    };

    this.activeEvents.set(event.instanceId, event);
    return event;
  }

  /**
   * Remove an active chaos event by its instance ID.
   *
   * @param instanceId - The unique instance ID of the event to remove
   * @returns True if the event was found and removed, false otherwise
   */
  removeEvent(instanceId: string): boolean {
    return this.activeEvents.delete(instanceId);
  }

  /**
   * Get all currently active chaos events.
   *
   * @returns Array of active ChaosEvent instances
   */
  getActiveEvents(): ChaosEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Get active chaos events affecting a specific node.
   *
   * @param nodeId - The node ID to check
   * @returns Array of chaos events targeting that node
   */
  getEventsForNode(nodeId: string): ChaosEvent[] {
    return this.getActiveEvents().filter((e) =>
      e.targetNodeIds.includes(nodeId),
    );
  }

  /**
   * Check whether a specific node is currently affected by any chaos event.
   *
   * @param nodeId - The node ID to check
   * @returns True if at least one active event targets this node
   */
  isNodeAffected(nodeId: string): boolean {
    for (const event of this.activeEvents.values()) {
      if (event.targetNodeIds.includes(nodeId)) return true;
    }
    return false;
  }

  /**
   * Remove all expired events based on the current timestamp.
   *
   * Events with a null durationMs are indefinite and never auto-expire.
   *
   * @param nowMs - Current timestamp in milliseconds
   * @returns Number of events that were expired and removed
   */
  expireEvents(nowMs: number): number {
    let removed = 0;
    for (const [id, event] of this.activeEvents) {
      if (
        event.durationMs !== null &&
        nowMs >= event.injectedAtMs + event.durationMs
      ) {
        this.activeEvents.delete(id);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Remove all active chaos events.
   */
  clearAll(): void {
    this.activeEvents.clear();
  }

  /**
   * Get the full catalog of available chaos event types.
   *
   * @returns Read-only array of all ChaosEventType definitions
   */
  getEventCatalog(): readonly ChaosEventType[] {
    return CHAOS_EVENTS;
  }

  /**
   * Look up a single event type by its ID.
   *
   * @param eventTypeId - The event type ID
   * @returns The ChaosEventType definition, or undefined if not found
   */
  getEventType(eventTypeId: string): ChaosEventType | undefined {
    return CHAOS_EVENT_MAP.get(eventTypeId);
  }

  /**
   * Get event types filtered by category.
   *
   * @param category - The chaos category to filter by
   * @returns Array of matching ChaosEventType definitions
   */
  getEventsByCategory(category: ChaosCategory): ChaosEventType[] {
    return CHAOS_EVENTS.filter((e) => e.category === category);
  }
}
