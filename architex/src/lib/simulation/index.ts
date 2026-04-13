/**
 * Simulation Engine — Barrel Export
 *
 * Re-exports all simulation modules for convenient single-point imports:
 *
 *   import { simulateNode, TrafficGenerator, MetricsCollector } from '@/lib/simulation';
 */

// Queuing theory models
export {
  mm1Utilization,
  mm1AvgQueueLength,
  mm1AvgWaitTime,
  mm1AvgSystemTime,
  erlangC,
  mmcAvgQueueLength,
  mmcAvgWaitTime,
  mmcAvgSystemTime,
  littlesLaw,
  littlesLawTime,
  estimatePercentile,
  simulateNode,
} from './queuing-model';
export type { NodeSimulationResult } from './queuing-model';

// Traffic generation
export {
  TrafficGenerator,
  generateRequests,
  poissonSample,
} from './traffic-simulator';
export type { TrafficTick, TrafficTimeline } from './traffic-simulator';

// Metrics collection
export { MetricsCollector } from './metrics-collector';
export type { NodeMetrics } from './metrics-collector';

// Chaos engineering
export {
  ChaosEngine,
  CHAOS_EVENTS,
} from './chaos-engine';
export type {
  ChaosCategory,
  ChaosSeverity,
  NodeType,
  ChaosEventType,
  ChaosEvent,
  PressureCounterName,
  AmplificationFactors,
  VisualIndicator,
  PressureCounterEffect,
  DurationType,
} from './chaos-engine';

// Pressure counter tracker
export { PressureCounterTracker } from './pressure-counter-tracker';

// SimMetricsBus (high-performance metrics pipeline)
export { SimMetricsBus } from './sim-metrics-bus';
export type { NodeMetricsSnapshot, MetricsBusSubscriber, MetricField } from './sim-metrics-bus';

// Particle path cache
export { ParticlePathCache } from './particle-path-cache';

// Simulation orchestrator
export {
  SimulationOrchestrator,
  createOrchestrator,
} from './simulation-orchestrator';

// Time-travel debugging
export { TimeTravel } from './time-travel';
export type { SimulationFrame, NodeStateSnapshot } from './time-travel';

// Capacity planning
export {
  estimateCapacity,
  formatEstimate,
} from './capacity-planner';
export type { CapacityInput, CapacityEstimate } from './capacity-planner';

// Architecture diff
export { diffArchitectures } from './architecture-diff';
export type { DiffResult } from './architecture-diff';

// Failure modes
export {
  FAILURE_MODES,
  getFailureMode,
  getFailureModesByCategory,
  getGroupedFailureModes,
  simulateCascade,
} from './failure-modes';
export type {
  FailureCategory,
  FailureSeverity,
  FailureMode,
  CascadeRule,
} from './failure-modes';

// Cascade engine
export { CascadeEngine } from './cascade-engine';
export type {
  CascadeNodeStatus,
  CascadeStep,
  TopologyNode,
  TopologyEdge,
  CascadeConfig,
} from './cascade-engine';

// V2: Topology signatures (SIM-001)
export { computeSignature, signatureToKey, buildSignatureCache } from './topology-signature';
export type { TopologySignature, TopologyTrait } from './topology-signature';

// V2: Pressure counters (SIM-002)
export {
  createEmptyCounters,
  updateCounters,
  COUNTER_THRESHOLDS,
  ALL_COUNTER_NAMES,
} from './pressure-counters';
export type {
  PressureCounters as V2PressureCounters,
  PressureCounterName as V2PressureCounterName,
  CounterUpdateInput,
} from './pressure-counters';

// V2: Issue taxonomy (SIM-003)
export { ISSUE_CATALOG, detectIssues, getIssuesForCounter } from './issue-taxonomy';
export type {
  IssueCategory,
  IssueType,
  DetectedIssue,
} from './issue-taxonomy';

// V2: Rule database (SIM-004)
export { RuleDatabase, RULE_DATABASE } from './rule-database';
export type {
  AmplificationFactors as RuleAmplificationFactors,
  PropagationRule,
  TopologyProfile,
} from './rule-database';

// V2: Report generator (SIM-005)
export { generateReport, reportToMarkdown } from './report-generator';
export type { TickRecord, SimulationReport, ChaosLogEntry } from './report-generator';

// V2: Cost model (SIM-006)
export { computeNodeCost, computeTopologyCost, computeLiveCost, BASE_COST_PER_HOUR } from './cost-model';
export type { CostModelInput, CostBreakdown, LiveCostState } from './cost-model';

// V2: Edge flow tracker (SIM-007)
export { EdgeFlowTracker } from './edge-flow-tracker';

// V2: Node service rates (SIM-008)
export { getNodeServiceRate, getNodeServiceRateFromData, getProcessingTimeMs, getAllComponentTypes } from './node-service-rates';

// V2: Simulation metrics bus (SIM-009)
export { SimulationMetricsBus } from './simulation-metrics-bus';
export type { NodeSimMetrics } from './simulation-metrics-bus';

// V2: Narrative engine (SIM-010)
export { NarrativeEngine, NARRATIVE_TEMPLATES } from './narrative-engine';
export type { NarrativeTemplate, NarrativeContext } from './narrative-engine';
