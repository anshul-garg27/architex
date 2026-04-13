// ────────────────────────────────────────────────────────────────
// v1 core template types
// ────────────────────────────────────────────────────────────────

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: 'classic' | 'modern' | 'infrastructure' | 'advanced';
  tags: string[];
  nodes: TemplateNode[];
  edges: TemplateEdge[];
  learnSteps?: LearnStep[];

  /** v2 simulation metadata — optional for backward compatibility */
  simulation?: SimulationMetadata;
  /** v2 engineering rationale — optional for backward compatibility */
  rationale?: EngineeringRationale;
}

export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    category: string;
    componentType: string;
    icon: string;
    config: Record<string, number | string | boolean>;
    state: 'idle';
  };
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'data-flow';
  data: {
    edgeType: string;
    latency?: number;
    animated?: boolean;
  };
}

export interface LearnStep {
  title: string;
  description: string;
  highlightNodes: string[];
  highlightEdges: string[];
}

// ────────────────────────────────────────────────────────────────
// v2 simulation metadata schema (TPL-001)
// ────────────────────────────────────────────────────────────────

/** Top-level simulation metadata attached to a template. */
export interface SimulationMetadata {
  /** Chaos engineering scenarios to inject during simulation */
  chaosScenarios: ChaosScenario[];
  /** Ordered progression of bottlenecks as load increases */
  bottleneckProgression: BottleneckStage[];
  /** Known failure modes and expected issues */
  expectedIssues: ExpectedIssue[];
  /** Monthly cost breakdown by component */
  costBreakdown: CostBreakdown;
  /** Latency, throughput, and availability targets */
  performanceTargets: PerformanceTargets;
  /** Auto-scaling policies */
  scalingPolicies: ScalingPolicy[];
  /** Service level agreements */
  slaDefinitions: SLADefinition[];
  /** Observability and monitoring configuration */
  monitoringConfig: MonitoringConfig;
  /** Incident response playbook */
  incidentPlaybook: IncidentPlaybook;
}

/** A chaos scenario that can be triggered during simulation. */
export interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  /** Which node IDs are affected */
  targetNodes: string[];
  /** Type of failure to inject */
  faultType: 'latency' | 'error' | 'crash' | 'partition' | 'resource-exhaustion' | 'data-corruption';
  /** Severity from 1 (minor) to 5 (catastrophic) */
  severity: 1 | 2 | 3 | 4 | 5;
  /** Expected system behavior during the fault */
  expectedBehavior: string;
  /** How the system should recover */
  mitigationSteps: string[];
}

/** A single stage in the bottleneck progression as RPS increases. */
export interface BottleneckStage {
  /** Requests per second threshold where this bottleneck appears */
  rpsThreshold: number;
  /** Which component becomes the bottleneck */
  bottleneckNode: string;
  /** What resource is saturated */
  metric: 'cpu' | 'memory' | 'disk-io' | 'network' | 'connections' | 'queue-depth';
  /** Description of the bottleneck */
  description: string;
  /** How to resolve it */
  resolution: string;
}

/** A known issue or failure mode in the architecture. */
export interface ExpectedIssue {
  id: string;
  title: string;
  description: string;
  /** Affected nodes */
  affectedNodes: string[];
  /** Likelihood from 1 (rare) to 5 (very likely) */
  likelihood: 1 | 2 | 3 | 4 | 5;
  /** Impact from 1 (minor) to 5 (catastrophic) */
  impact: 1 | 2 | 3 | 4 | 5;
  /** How to mitigate */
  mitigation: string;
}

/** Monthly cost breakdown for the architecture. */
export interface CostBreakdown {
  /** Total monthly cost in USD */
  totalMonthlyCostUsd: number;
  /** Cost per component */
  components: ComponentCost[];
  /** Cost at different traffic tiers */
  scalingCostTiers: ScalingCostTier[];
}

export interface ComponentCost {
  nodeId: string;
  label: string;
  monthlyCostUsd: number;
  costDriver: string;
}

export interface ScalingCostTier {
  label: string;
  rps: number;
  monthlyCostUsd: number;
}

/** Performance targets for the architecture. */
export interface PerformanceTargets {
  /** Default requests per second for simulation */
  defaultRps: number;
  /** Traffic profile shape */
  trafficProfile: 'steady' | 'bursty' | 'diurnal' | 'event-driven';
  /** Target p50 latency in ms */
  p50LatencyMs: number;
  /** Target p99 latency in ms */
  p99LatencyMs: number;
  /** Target availability percentage (e.g. 99.99) */
  availabilityTarget: number;
  /** Maximum error rate percentage */
  maxErrorRatePercent: number;
  /** Throughput target in RPS */
  throughputRps: number;
}

/** An auto-scaling policy for a component. */
export interface ScalingPolicy {
  nodeId: string;
  metric: string;
  threshold: number;
  scaleUpStep: number;
  scaleDownStep: number;
  cooldownSeconds: number;
  minInstances: number;
  maxInstances: number;
}

/** A service level agreement definition. */
export interface SLADefinition {
  name: string;
  metric: string;
  target: number;
  unit: string;
  penalty: string;
}

/** Monitoring and observability configuration. */
export interface MonitoringConfig {
  /** Key metrics to track */
  metrics: MonitoringMetric[];
  /** Alert rules */
  alerts: AlertRule[];
  /** Dashboard panels */
  dashboards: string[];
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  nodeId: string;
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  channel: string;
}

/** Incident response playbook. */
export interface IncidentPlaybook {
  /** Escalation tiers */
  escalationPolicy: EscalationTier[];
  /** Runbook entries for common incidents */
  runbooks: RunbookEntry[];
}

export interface EscalationTier {
  level: number;
  name: string;
  responseTimeMinutes: number;
  contacts: string[];
}

export interface RunbookEntry {
  incident: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  automatedRecovery: boolean;
}

// ────────────────────────────────────────────────────────────────
// v2 engineering rationale
// ────────────────────────────────────────────────────────────────

/** Engineering rationale explaining architecture decisions. */
export interface EngineeringRationale {
  /** Key architectural decisions */
  decisions: ArchitecturalDecision[];
  /** Explicit trade-offs made */
  tradeoffs: Tradeoff[];
  /** Alternative approaches considered */
  alternatives: AlternativeApproach[];
}

export interface ArchitecturalDecision {
  title: string;
  context: string;
  decision: string;
  consequences: string[];
}

export interface Tradeoff {
  dimension: string;
  choice: string;
  benefit: string;
  cost: string;
}

export interface AlternativeApproach {
  name: string;
  description: string;
  prosVsCons: string;
  whyNotChosen: string;
}
