/**
 * Simulation Orchestrator (SIM-011 Integration)
 *
 * Bridges the simulation library (TrafficGenerator, queuing models,
 * MetricsCollector, ChaosEngine) to the Zustand stores and React UI.
 *
 * V2 10-Stage Tick Pipeline:
 *   1. Traffic Distribution    - distribute global RPS across entry nodes
 *   2. BFS Propagation         - propagate traffic through graph via BFS
 *   3. Amplification           - apply rule database amplification factors per edge
 *   4. Pressure Update         - update pressure counters for each node
 *   5. Issue Detection         - detect issues from counter thresholds
 *   6. Edge Flow Recording     - record per-edge flow in EdgeFlowTracker
 *   7. Metrics Bus Write       - write NodeSimMetrics to bus (NOT to Zustand per node)
 *   8. Tick Record             - append TickRecord to tickHistory
 *   9. Live Cost Update        - update LiveCostState
 *  10. Time Travel Snapshot    - push snapshot for seek/replay
 *
 * IMPORTANT: This class runs outside React. Access stores via
 * `useCanvasStore.getState()` / `useSimulationStore.getState()`.
 */

import { TrafficGenerator } from './traffic-simulator';
import type { TrafficTimeline } from './traffic-simulator';
import { simulateNode } from './queuing-model';
import { MetricsCollector } from './metrics-collector';
import { ChaosEngine } from './chaos-engine';
import type { ChaosEvent } from './chaos-engine';
import { PressureCounterTracker } from './pressure-counter-tracker';
import { TimeTravel } from './time-travel';
import type { SimulationFrame, NodeStateSnapshot } from './time-travel';
import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';
import type { TrafficConfig } from '@/stores/simulation-store';
import type { Node, Edge } from '@xyflow/react';

// -- V2 subsystem imports (SIM-001 through SIM-010) --
import { buildSignatureCache } from './topology-signature';
import type { TopologySignature } from './topology-signature';
import { createEmptyCounters, updateCounters } from './pressure-counters';
import type { PressureCounters } from './pressure-counters';
import { detectIssues } from './issue-taxonomy';
import type { DetectedIssue } from './issue-taxonomy';
import { RuleDatabase, RULE_DATABASE } from './rule-database';
import type { TopologyProfile } from './rule-database';
import { generateReport, reportToMarkdown } from './report-generator';
import type { TickRecord, SimulationReport } from './report-generator';
import { computeLiveCost } from './cost-model';
import type { CostModelInput, LiveCostState } from './cost-model';
import { EdgeFlowTracker } from './edge-flow-tracker';
import { getNodeServiceRateFromData } from './node-service-rates';
import { SimulationMetricsBus } from './simulation-metrics-bus';
import type { NodeSimMetrics } from './simulation-metrics-bus';
import { NarrativeEngine } from './narrative-engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default tick duration in milliseconds. */
const DEFAULT_TICK_MS = 100;

/** Default simulation duration: 60 seconds. */
const DEFAULT_DURATION_MS = 60_000;

/** Sync node state to canvas store every N ticks (not every tick). */
const CANVAS_SYNC_INTERVAL = 10;

// ---------------------------------------------------------------------------
// Chaos modifier result
// ---------------------------------------------------------------------------

interface ChaosModifiers {
  /** Adjusted service rate after chaos effects. */
  serviceRate: number;
  /** Extra latency injected by chaos events (ms). */
  extraLatency: number;
  /** Whether a chaos event forces errors on this node. */
  forceError: boolean;
}

// ---------------------------------------------------------------------------
// SimulationOrchestrator
// ---------------------------------------------------------------------------

export class SimulationOrchestrator {
  private trafficGenerator: TrafficGenerator;
  private metricsCollector: MetricsCollector;
  private chaosEngine: ChaosEngine;
  private pressureTracker: PressureCounterTracker;
  private timeTravel: TimeTravel;

  // -- V2 subsystems --
  private signatureCache: Map<string, TopologySignature> = new Map();
  private v2PressureCounters: Map<string, PressureCounters> = new Map();
  private edgeFlowTracker: EdgeFlowTracker;
  private tickHistory: TickRecord[] = [];
  private edgeIdLookup: Map<string, string> = new Map();
  private narrativeEngine: NarrativeEngine;
  private ruleDatabase: RuleDatabase;
  private costState: LiveCostState = {
    currentHourlyRate: 0,
    accumulatedCost: 0,
    projectedMonthlyCost: 0,
    costByNode: new Map(),
  };
  private metricsBus: SimulationMetricsBus;

  /** Adjacency list: nodeId -> downstream nodeIds. */
  private topology: Map<string, string[]> = new Map();

  /** Nodes with no inbound edges (traffic entry points). */
  private entryNodeIds: string[] = [];

  /** Pre-generated traffic timeline for the current run. */
  private timeline: TrafficTimeline | null = null;

  /** Handle for the RAF-based scheduling. */
  private rafId: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Current tick position in the simulation. */
  private currentTick = 0;

  /** Total number of ticks in the current run. */
  private totalTicks = 0;

  /** Duration of each tick in ms (before speed adjustment). */
  private tickMs = DEFAULT_TICK_MS;

  /** Cached nodes/edges from canvas store for the current run. */
  private cachedNodes: Node[] = [];
  private cachedEdges: Edge[] = [];

  constructor() {
    this.trafficGenerator = new TrafficGenerator();
    this.metricsCollector = new MetricsCollector({ windowMs: 10_000 });
    this.chaosEngine = new ChaosEngine();
    this.pressureTracker = new PressureCounterTracker();
    this.timeTravel = new TimeTravel();

    // V2 subsystems
    this.edgeFlowTracker = new EdgeFlowTracker(120);
    this.narrativeEngine = new NarrativeEngine();
    this.ruleDatabase = RULE_DATABASE;
    this.metricsBus = new SimulationMetricsBus();
  }

  // -----------------------------------------------------------------------
  // Topology
  // -----------------------------------------------------------------------

  /**
   * Build an adjacency list from canvas nodes and edges.
   * Also builds the V2 signature cache and edge ID lookup.
   */
  buildTopology(nodes: Node[], edges: Edge[]): void {
    this.topology.clear();
    this.entryNodeIds = [];
    this.cachedNodes = nodes;
    this.cachedEdges = edges;

    // Initialize every node in the adjacency list
    for (const node of nodes) {
      this.topology.set(node.id, []);
    }

    const hasInbound = new Set<string>();

    // Build edge ID lookup: "source->target" -> edgeId
    this.edgeIdLookup.clear();
    for (const edge of edges) {
      const downstreamList = this.topology.get(edge.source);
      if (downstreamList) {
        downstreamList.push(edge.target);
      }
      hasInbound.add(edge.target);
      this.edgeIdLookup.set(`${edge.source}->${edge.target}`, edge.id);
    }

    // Entry nodes: client category, or no inbound edges
    for (const node of nodes) {
      const data = node.data as Record<string, unknown> | undefined;
      const isClient = data?.category === 'client';
      if (isClient || !hasInbound.has(node.id)) {
        this.entryNodeIds.push(node.id);
      }
    }

    if (this.entryNodeIds.length === 0 && nodes.length > 0) {
      this.entryNodeIds.push(nodes[0].id);
    }

    // V2: Build signature cache for all nodes
    this.signatureCache = buildSignatureCache(nodes, edges);

    // V2: Initialize pressure counters for all nodes
    for (const node of nodes) {
      if (!this.v2PressureCounters.has(node.id)) {
        this.v2PressureCounters.set(node.id, createEmptyCounters());
      }
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Start a new simulation run.
   */
  start(
    trafficConfig: TrafficConfig,
    speed: number = 1,
    durationMs: number = DEFAULT_DURATION_MS,
  ): void {
    const { nodes, edges } = useCanvasStore.getState();

    if (nodes.length === 0) {
      useSimulationStore.getState().setStatus('error');
      return;
    }

    this.buildTopology(nodes, edges);

    this.tickMs = DEFAULT_TICK_MS;
    this.timeline = this.trafficGenerator.generate(
      trafficConfig,
      durationMs,
      this.tickMs,
    );
    this.totalTicks = this.timeline.ticks.length;
    this.currentTick = 0;

    // Reset all subsystems
    this.metricsCollector.reset();
    this.chaosEngine.clearAll();
    this.pressureTracker.resetAll();
    this.timeTravel.clear();
    this.v2PressureCounters.clear();
    this.edgeFlowTracker.reset();
    this.metricsBus.reset();
    this.tickHistory = [];
    this.costState = {
      currentHourlyRate: 0,
      accumulatedCost: 0,
      projectedMonthlyCost: 0,
      costByNode: new Map(),
    };

    // Initialize V2 pressure counters for all nodes
    for (const node of nodes) {
      this.v2PressureCounters.set(node.id, createEmptyCounters());
    }

    const simStore = useSimulationStore.getState();
    simStore.setTotalTicks(this.totalTicks);
    simStore.setTick(0);
    simStore.setStatus('running');

    simStore.addConsoleMessage(
      'info',
      `Simulation started. ${this.totalTicks} ticks at ${this.tickMs}ms`,
    );

    this.startInterval(speed);
  }

  /** Pause the simulation, preserving current state. */
  pause(): void {
    this.clearInterval();
    useSimulationStore.getState().setStatus('paused');
  }

  /** Resume a paused simulation. */
  resume(speed: number = 1): void {
    if (!this.timeline) return;
    useSimulationStore.getState().setStatus('running');
    this.startInterval(speed);
  }

  /** Stop the simulation and reset all state. */
  stop(): void {
    this.clearInterval();

    useSimulationStore
      .getState()
      .addConsoleMessage('info', `Simulation stopped at tick ${this.currentTick}`);

    this.metricsCollector.reset();
    this.chaosEngine.clearAll();
    this.pressureTracker.resetAll();
    this.timeTravel.clear();
    this.v2PressureCounters.clear();
    this.edgeFlowTracker.reset();
    this.metricsBus.reset();
    this.tickHistory = [];
    this.currentTick = 0;
    this.timeline = null;

    const canvasStore = useCanvasStore.getState();
    for (const node of canvasStore.nodes) {
      canvasStore.updateNodeData(node.id, {
        state: 'idle',
        metrics: undefined,
      });
    }

    const edges = canvasStore.edges;
    canvasStore.setEdges(
      edges.map((e) => ({
        ...e,
        animated: false,
        data: e.data ? { ...e.data, animated: false } : e.data,
      })),
    );

    const simStore = useSimulationStore.getState();
    simStore.setTick(0);
    simStore.setStatus('idle');
    simStore.updateMetrics({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p90LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      throughputRps: 0,
      errorRate: 0,
      elapsedMs: 0,
    });
  }

  /** Advance exactly one tick, then pause. */
  step(): void {
    if (!this.timeline) return;
    if (this.currentTick >= this.totalTicks) return;

    this.processTick(this.currentTick);
    this.currentTick++;

    const simStore = useSimulationStore.getState();
    simStore.setTick(this.currentTick);

    if (this.currentTick >= this.totalTicks) {
      simStore.setStatus('completed');
    } else {
      simStore.setStatus('paused');
    }
  }

  /** Change playback speed while running. */
  setSpeed(speed: number): void {
    if (this.intervalId !== null || this.rafId !== null) {
      this.clearInterval();
      this.startInterval(speed);
    }
  }

  // -----------------------------------------------------------------------
  // V2 Public Methods
  // -----------------------------------------------------------------------

  /**
   * Seek to a specific tick by replaying from tickHistory.
   * Restores simulation state to exactly that tick.
   */
  seekTo(tick: number): void {
    const targetTick = Math.max(0, Math.min(tick, this.tickHistory.length - 1));
    if (targetTick < 0 || this.tickHistory.length === 0) return;

    this.currentTick = targetTick;

    // Restore time-travel frame
    const frame = this.timeTravel.getFrame(targetTick);
    if (frame) {
      const canvasStore = useCanvasStore.getState();
      for (const [nodeId, snapshot] of frame.nodeStates) {
        canvasStore.updateNodeData(nodeId, {
          state: snapshot.state,
          metrics: {
            utilization: snapshot.utilization,
            latency: snapshot.latency,
            errorRate: snapshot.errorRate,
          },
        });
      }

      const simStore = useSimulationStore.getState();
      simStore.setTick(targetTick);
      simStore.updateMetrics(frame.globalMetrics);
    }
  }

  /**
   * Run N ticks synchronously (for interview scoring / what-if analysis).
   * Returns a full simulation report.
   */
  runSync(ticks: number): SimulationReport {
    if (!this.timeline) {
      // Generate a short timeline if none exists
      const { nodes, edges } = useCanvasStore.getState();
      if (nodes.length > 0) {
        this.buildTopology(nodes, edges);
        const simStore = useSimulationStore.getState();
        this.tickMs = DEFAULT_TICK_MS;
        this.timeline = this.trafficGenerator.generate(
          simStore.trafficConfig,
          ticks * this.tickMs,
          this.tickMs,
        );
        this.totalTicks = this.timeline.ticks.length;
      }
    }

    const ticksToRun = Math.min(ticks, this.totalTicks - this.currentTick);
    for (let i = 0; i < ticksToRun; i++) {
      if (this.currentTick >= this.totalTicks) break;
      this.processTick(this.currentTick);
      this.currentTick++;
    }

    // Generate report from tick history
    const nodeMetrics = new Map<string, { avgUtilization: number; peakUtilization: number; totalIssues: number; issueCodes: string[] }>();
    for (const node of this.cachedNodes) {
      const busMetrics = this.metricsBus.read(node.id);
      nodeMetrics.set(node.id, {
        avgUtilization: busMetrics?.utilization ?? 0,
        peakUtilization: busMetrics?.utilization ?? 0,
        totalIssues: 0,
        issueCodes: [],
      });
    }

    return generateReport(
      this.tickHistory,
      this.cachedNodes,
      this.cachedEdges,
      nodeMetrics,
      [],
    );
  }

  // -----------------------------------------------------------------------
  // V2 Accessors
  // -----------------------------------------------------------------------

  /** Get the metrics bus for external consumers. */
  getMetricsBus(): SimulationMetricsBus {
    return this.metricsBus;
  }

  /** Get the edge flow tracker. */
  getEdgeFlowTracker(): EdgeFlowTracker {
    return this.edgeFlowTracker;
  }

  /** Get the current tick history. */
  getTickHistory(): TickRecord[] {
    return this.tickHistory;
  }

  /** Get the current live cost state. */
  getCostState(): LiveCostState {
    return this.costState;
  }

  /** Get the narrative engine. */
  getNarrativeEngine(): NarrativeEngine {
    return this.narrativeEngine;
  }

  // -----------------------------------------------------------------------
  // Chaos injection
  // -----------------------------------------------------------------------

  injectChaos(eventTypeId: string, targetNodeIds: string[]): ChaosEvent {
    const event = this.chaosEngine.injectEvent(eventTypeId, targetNodeIds, {
      timestampMs: this.currentTick * this.tickMs,
    });
    const simStore = useSimulationStore.getState();
    simStore.addChaosEvent(event.instanceId);

    const eventType = this.chaosEngine.getEventType(eventTypeId);
    const eventName = eventType?.name ?? eventTypeId;
    simStore.addConsoleMessage(
      'warn',
      `Chaos: ${eventName} injected on ${targetNodeIds.length} node${targetNodeIds.length !== 1 ? 's' : ''}`,
    );

    return event;
  }

  removeChaos(instanceId: string): void {
    this.chaosEngine.removeEvent(instanceId);
    useSimulationStore.getState().removeChaosEvent(instanceId);
  }

  getChaosEngine(): ChaosEngine {
    return this.chaosEngine;
  }

  getTimeTravel(): TimeTravel {
    return this.timeTravel;
  }

  // -----------------------------------------------------------------------
  // 10-Stage Tick Pipeline (V2)
  // -----------------------------------------------------------------------

  private processTick(tickIndex: number): void {
    if (!this.timeline) return;

    const tick = this.timeline.ticks[tickIndex];
    if (!tick) return;

    const timestampMs = tick.timestampMs;
    const incomingRequests = tick.requestCount;

    // Expire chaos events
    this.chaosEngine.expireEvents(timestampMs);

    // Sync active chaos events to store
    const activeIds = this.chaosEngine
      .getActiveEvents()
      .map((e) => e.instanceId);
    const simStore = useSimulationStore.getState();
    simStore.clearChaosEvents();
    for (const id of activeIds) {
      simStore.addChaosEvent(id);
    }

    const canvasStore = useCanvasStore.getState();
    const nodeMap = new Map<string, Node>();
    for (const n of canvasStore.nodes) {
      nodeMap.set(n.id, n);
    }

    // =====================================================================
    // STAGE 1: Traffic Distribution
    // =====================================================================
    const nodeArrivals = new Map<string, number>();
    const entryCount = this.entryNodeIds.length || 1;
    const perEntry = incomingRequests / entryCount;
    for (const entryId of this.entryNodeIds) {
      nodeArrivals.set(entryId, perEntry);
    }

    // =====================================================================
    // STAGE 2: BFS Propagation
    // =====================================================================
    const visited = new Set<string>();
    const queue = [...this.entryNodeIds];

    // Per-node results collected during BFS for later stages
    const nodeResults = new Map<string, {
      arrivalCount: number;
      utilization: number;
      effectiveLatency: number;
      success: boolean;
      forceError: boolean;
      queueDepth: number;
      throughput: number;
      errorRate: number;
    }>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const data = node.data as Record<string, unknown> | undefined;
      if (!data) continue;

      const arrivalCount = nodeArrivals.get(nodeId) ?? 0;
      const arrivalRate = arrivalCount / this.tickMs;

      // Use the extracted single-source-of-truth service rate (SIM-008)
      const baseServiceRate = getNodeServiceRateFromData(data);
      const serverCount = this.getNodeServerCount(data);

      // Apply chaos modifiers
      const chaos = this.applyChaosModifiers(nodeId, baseServiceRate);

      // Apply chaos pressure effects (legacy tracker)
      const chaosEvents = this.chaosEngine.getEventsForNode(nodeId);
      for (const chaosEvt of chaosEvents) {
        const evtType = this.chaosEngine.getEventType(chaosEvt.eventTypeId);
        if (evtType?.pressureEffects) {
          this.pressureTracker.applyEffects(nodeId, evtType.pressureEffects);
        }
      }

      // ===================================================================
      // STAGE 3: Amplification (apply rule database factors)
      // ===================================================================
      let amplifiedArrivalRate = arrivalRate;
      let amplifiedServiceRate = chaos.serviceRate;
      let extraErrorAmp = 1.0;

      const signature = this.signatureCache.get(nodeId);
      if (signature) {
        const profile = this.ruleDatabase.lookup(signature);
        if (profile && profile.propagationRules.length > 0) {
          for (const rule of profile.propagationRules) {
            if (Math.random() < rule.probability) {
              amplifiedArrivalRate *= rule.amplification.trafficAmplification;
              amplifiedServiceRate *= (1 - rule.amplification.capacityDegradation);
              extraErrorAmp *= rule.amplification.errorAmplification;
            }
          }
        }
      }

      // Run queuing model with amplified values
      const result = simulateNode(
        amplifiedArrivalRate,
        Math.max(amplifiedServiceRate, 0.00001),
        serverCount,
      );

      const forceError = chaos.forceError;
      const utilization = result.utilization;
      const effectiveLatency = isFinite(result.avgSystemTime)
        ? result.avgSystemTime + chaos.extraLatency
        : 10_000;
      const isOverloaded = utilization >= 1;
      const success = !forceError && !isOverloaded;

      // Record requests in metrics collector
      const requestCountForNode = Math.max(1, Math.round(arrivalCount));
      for (let i = 0; i < requestCountForNode; i++) {
        this.metricsCollector.recordRequest(
          nodeId,
          effectiveLatency,
          success,
          timestampMs,
        );
      }

      const throughput = isFinite(result.utilization)
        ? arrivalCount / (this.tickMs / 1000)
        : 0;
      const queueDepth = isFinite(result.avgQueueLength)
        ? result.avgQueueLength
        : 999;
      const errorRate = success ? 0 : Math.min(1, extraErrorAmp);

      // Store results for later stages
      nodeResults.set(nodeId, {
        arrivalCount,
        utilization: Math.min(utilization, 1),
        effectiveLatency: isFinite(effectiveLatency) ? effectiveLatency : 10_000,
        success,
        forceError,
        queueDepth,
        throughput,
        errorRate,
      });

      // Propagate to downstream nodes
      const downstream = this.topology.get(nodeId) ?? [];
      if (downstream.length > 0 && success) {
        const perDownstream = arrivalCount / downstream.length;
        for (const downId of downstream) {
          const existing = nodeArrivals.get(downId) ?? 0;
          nodeArrivals.set(downId, existing + perDownstream);
          if (!visited.has(downId)) {
            queue.push(downId);
          }
        }
      }
    }

    // =====================================================================
    // STAGE 4: Pressure Update
    // =====================================================================
    const allDetectedIssues: DetectedIssue[] = [];

    for (const [nodeId, res] of nodeResults) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const data = node.data as Record<string, unknown> | undefined;
      const componentType = (data?.componentType as string) ?? '';

      const prevCounters = this.v2PressureCounters.get(nodeId) ?? createEmptyCounters();
      const chaosEvts = this.chaosEngine.getEventsForNode(nodeId);
      const chaosIds = chaosEvts.map((e) => e.eventTypeId);

      const newCounters = updateCounters(prevCounters, {
        nodeId,
        componentType,
        utilization: res.utilization,
        queueDepth: res.queueDepth,
        latencyMs: res.effectiveLatency,
        errorRate: res.errorRate,
        hasChaos: chaosIds.length > 0,
        chaosIds,
        tick: tickIndex,
      });

      this.v2PressureCounters.set(nodeId, newCounters);

      // ===================================================================
      // STAGE 5: Issue Detection
      // ===================================================================
      const sig = this.signatureCache.get(nodeId);
      if (sig) {
        const nodeLabel = (data?.label as string) ?? componentType ?? nodeId;
        const issues = detectIssues(nodeId, nodeLabel, componentType, newCounters, sig, tickIndex);
        allDetectedIssues.push(...issues);
      }
    }

    // Log detected issues to console
    for (const issue of allDetectedIssues) {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        simStore.addConsoleMessage(
          'error',
          `[${issue.issueCode}] ${issue.nodeLabel}: ${issue.narrative.slice(0, 120)}`,
        );
      }
    }

    // =====================================================================
    // STAGE 6: Edge Flow Recording
    // =====================================================================
    for (const edge of canvasStore.edges) {
      const sourceRes = nodeResults.get(edge.source);
      if (sourceRes) {
        const fanOut = (this.topology.get(edge.source) ?? []).length || 1;
        const edgeRequests = sourceRes.arrivalCount / fanOut;
        this.edgeFlowTracker.recordEdgeFlow(edge.id, edgeRequests, timestampMs);
      }
    }

    // =====================================================================
    // STAGE 7: Metrics Bus Write (NOT to Zustand per node)
    // =====================================================================
    for (const [nodeId, res] of nodeResults) {
      const busState: NodeSimMetrics['state'] = res.forceError
        ? 'down'
        : res.utilization >= 0.85
          ? 'critical'
          : res.utilization >= 0.6
            ? 'degraded'
            : 'healthy';

      this.metricsBus.write(nodeId, {
        throughput: res.throughput,
        latency: res.effectiveLatency,
        errorRate: res.errorRate,
        utilization: res.utilization,
        queueDepth: res.queueDepth,
        state: busState,
      });
    }

    // Notify bus subscribers (for RAF-based UI consumers)
    this.metricsBus.notify();

    // Sync node state to canvas store periodically (not every tick)
    const shouldSyncCanvas = tickIndex % CANVAS_SYNC_INTERVAL === 0 || tickIndex === this.totalTicks - 1;
    if (shouldSyncCanvas) {
      for (const [nodeId, res] of nodeResults) {
        const nodeState = this.mapUtilizationToState(res.utilization, res.forceError);
        canvasStore.updateNodeData(nodeId, {
          state: nodeState,
          metrics: {
            throughput: res.throughput,
            latency: res.effectiveLatency,
            errorRate: res.errorRate,
            utilization: res.utilization,
            queueDepth: res.queueDepth,
          },
        });
      }

      // Update edge animations
      const updatedEdges = canvasStore.edges.map((edge) => {
        const sourceRes = nodeResults.get(edge.source);
        const sourceState = sourceRes
          ? this.mapUtilizationToState(sourceRes.utilization, sourceRes.forceError)
          : 'idle';
        const shouldAnimate =
          sourceState === 'active' ||
          sourceState === 'warning' ||
          sourceState === 'error';

        const edgeRps = this.edgeFlowTracker.getEdgeRps(edge.id, 5000);

        return {
          ...edge,
          animated: shouldAnimate,
          data: edge.data
            ? { ...edge.data, animated: shouldAnimate, throughput: isFinite(edgeRps) ? edgeRps : 0 }
            : edge.data,
        };
      });
      canvasStore.setEdges(updatedEdges);
    }

    // =====================================================================
    // STAGE 8: Tick Record
    // =====================================================================
    const globalMetrics = this.metricsCollector.getMetrics();
    const tickRecord: TickRecord = {
      tick: tickIndex,
      timestampMs,
      rpsAtTick: incomingRequests / (this.tickMs / 1000),
      globalErrorRate: globalMetrics.errorRate,
      avgLatencyMs: globalMetrics.avgLatencyMs,
      p99LatencyMs: globalMetrics.p99LatencyMs,
      nodeEvents: allDetectedIssues.map((i) => ({
        nodeId: i.nodeId,
        issueCode: i.issueCode,
        severity: i.severity,
      })),
    };
    this.tickHistory.push(tickRecord);

    // Single batched Zustand commit for aggregate metrics
    simStore.updateMetrics(globalMetrics);
    simStore.recordMetricsSnapshot();

    // =====================================================================
    // STAGE 9: Live Cost Update
    // =====================================================================
    const costInputs: CostModelInput[] = [];
    const utilizations = new Map<string, number>();

    for (const node of canvasStore.nodes) {
      const data = node.data as Record<string, unknown> | undefined;
      const config = (data?.config ?? {}) as Record<string, unknown>;
      const res = nodeResults.get(node.id);

      costInputs.push({
        componentType: (data?.componentType as string) ?? 'unknown',
        replicas: typeof config.replicas === 'number' ? config.replicas : 1,
        shards: typeof config.shards === 'number' ? config.shards : 1,
        storageGb: typeof config.storageGb === 'number' ? config.storageGb : 0,
        transferGbPerHour: typeof config.transferGbPerHour === 'number' ? config.transferGbPerHour : 0,
        utilization: res?.utilization ?? 0,
      });
      utilizations.set(String(costInputs.length - 1), res?.utilization ?? 0);
    }

    this.costState = computeLiveCost(costInputs, utilizations, timestampMs);

    // =====================================================================
    // STAGE 10: Time Travel Snapshot
    // =====================================================================
    const nodeStates = new Map<string, NodeStateSnapshot>();
    for (const [nodeId, res] of nodeResults) {
      nodeStates.set(nodeId, {
        utilization: res.utilization,
        latency: res.effectiveLatency,
        errorRate: res.errorRate,
        state: this.mapUtilizationToState(res.utilization, res.forceError),
      });
    }
    const frame: SimulationFrame = {
      tick: tickIndex,
      nodeStates,
      globalMetrics: { ...globalMetrics },
      activeChaos: [...activeIds],
    };
    this.timeTravel.recordFrame(frame);

    // Legacy: decay pressure counters
    this.pressureTracker.decayAll();
  }

  // -----------------------------------------------------------------------
  // Node property helpers
  // -----------------------------------------------------------------------

  /**
   * Determine the number of parallel servers for a node.
   */
  private getNodeServerCount(data: Record<string, unknown>): number {
    const config = (data.config ?? {}) as Record<string, unknown>;
    if (typeof config.instances === 'number' && config.instances >= 1) {
      return Math.floor(config.instances);
    }
    if (typeof config.replicas === 'number' && config.replicas >= 1) {
      return Math.floor(config.replicas);
    }
    if (typeof config.concurrency === 'number' && config.concurrency >= 1) {
      return Math.floor(config.concurrency);
    }
    if (typeof config.parallelism === 'number' && config.parallelism >= 1) {
      return Math.floor(config.parallelism);
    }
    return 1;
  }

  /**
   * Map a utilization value to a visual node state.
   */
  private mapUtilizationToState(
    utilization: number,
    forceError: boolean,
  ): 'idle' | 'active' | 'warning' | 'error' {
    if (forceError) return 'error';
    if (utilization >= 0.85) return 'error';
    if (utilization >= 0.6) return 'warning';
    if (utilization >= 0.1) return 'active';
    return 'idle';
  }

  /**
   * Apply chaos modifiers for a given node.
   */
  private applyChaosModifiers(
    nodeId: string,
    baseServiceRate: number,
  ): ChaosModifiers {
    if (!this.chaosEngine.isNodeAffected(nodeId)) {
      return { serviceRate: baseServiceRate, extraLatency: 0, forceError: false };
    }

    let serviceRate = baseServiceRate;
    let extraLatency = 0;
    let forceError = false;

    const events = this.chaosEngine.getEventsForNode(nodeId);

    for (const event of events) {
      switch (event.eventTypeId) {
        case 'node-crash':
        case 'api-down':
        case 'certificate-expiry':
        case 'network-partition':
        case 'dns-failure':
        case 'config-error':
          forceError = true;
          serviceRate = 0.00001;
          break;

        case 'node-slow':
        case 'cpu-spike':
        case 'memory-pressure':
        case 'disk-full':
          serviceRate *= 0.1;
          extraLatency += 200;
          break;

        case 'node-restart':
          serviceRate *= 0.2;
          extraLatency += 500;
          break;

        case 'latency-injection':
          extraLatency += 350;
          break;
        case 'bandwidth-throttle':
          extraLatency += 150;
          serviceRate *= 0.5;
          break;
        case 'packet-loss':
          extraLatency += 100;
          serviceRate *= 0.7;
          break;

        case 'db-failover':
          forceError = true;
          extraLatency += 2000;
          break;
        case 'replication-lag':
          extraLatency += 5000;
          break;
        case 'cache-eviction-storm':
          serviceRate *= 0.2;
          extraLatency += 50;
          break;
        case 'hot-partition':
          serviceRate *= 0.3;
          extraLatency += 100;
          break;
        case 'deadlock':
          extraLatency += 3000;
          serviceRate *= 0.4;
          break;
        case 'data-corruption':
          forceError = true;
          break;

        case 'traffic-spike':
        case 'thundering-herd':
        case 'ddos':
          serviceRate *= 0.8;
          break;
        case 'retry-storm':
          serviceRate *= 0.6;
          break;
        case 'slow-consumer':
          serviceRate *= 0.1;
          break;
        case 'hot-key':
          serviceRate *= 0.4;
          break;
        case 'connection-exhaustion':
          forceError = true;
          serviceRate *= 0.05;
          break;

        case 'api-timeout':
          extraLatency += 30_000;
          break;
        case 'rate-limit-hit':
          forceError = true;
          break;
        case 'service-discovery-failure':
          forceError = true;
          extraLatency += 1000;
          break;

        default:
          serviceRate *= 0.5;
          extraLatency += 50;
          break;
      }
    }

    return { serviceRate: Math.max(serviceRate, 0.00001), extraLatency, forceError };
  }

  // -----------------------------------------------------------------------
  // Interval management (RAF-based with setInterval fallback)
  // -----------------------------------------------------------------------

  private startInterval(speed: number): void {
    this.clearInterval();

    const intervalMs = Math.max(10, this.tickMs / speed);

    // Use RAF scheduling when available for smoother performance
    if (typeof requestAnimationFrame !== 'undefined' && intervalMs <= 20) {
      this.scheduleNextTick(speed);
    } else {
      // Fallback to setInterval for slower speeds
      this.intervalId = setInterval(() => {
        this.tickLoop();
      }, intervalMs);
    }
  }

  private scheduleNextTick(speed: number): void {
    this.rafId = requestAnimationFrame(() => {
      if (this.rafId === null) return; // cancelled

      this.tickLoop();

      if (this.currentTick < this.totalTicks && this.rafId !== null) {
        // Process multiple ticks per frame if speed demands it
        const ticksPerFrame = Math.max(1, Math.floor(speed / 10));
        for (let i = 1; i < ticksPerFrame && this.currentTick < this.totalTicks; i++) {
          this.tickLoop();
        }
        this.scheduleNextTick(speed);
      }
    });
  }

  private tickLoop(): void {
    if (this.currentTick >= this.totalTicks) {
      this.clearInterval();
      const completionStore = useSimulationStore.getState();
      const m = completionStore.metrics;
      const errorRate = m.totalRequests > 0
        ? ((m.failedRequests / m.totalRequests) * 100).toFixed(1)
        : '0.0';
      completionStore.addConsoleMessage(
        'info',
        `Simulation completed. ${m.totalRequests} requests, ${errorRate}% error rate`,
      );
      completionStore.setStatus('completed');
      return;
    }

    this.processTick(this.currentTick);
    this.currentTick++;
    useSimulationStore.getState().setTick(this.currentTick);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new SimulationOrchestrator instance.
 *
 * Usage:
 *   const orchestrator = createOrchestrator();
 *   orchestrator.start(trafficConfig, speed);
 */
export function createOrchestrator(): SimulationOrchestrator {
  return new SimulationOrchestrator();
}
