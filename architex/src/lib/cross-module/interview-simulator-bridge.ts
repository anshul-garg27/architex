// ─────────────────────────────────────────────────────────────
// Architex — Interview ↔ Simulator Bridge (CROSS-006)
// Connects interview engine to simulation for automated scoring.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from "@xyflow/react";
import type { ScoringDimension } from "@/lib/interview/scoring";
import type { SimulationOrchestrator } from "@/lib/simulation/simulation-orchestrator";

// ── Simulation Score ──────────────────────────────────────────

export interface SimulationScore {
  availabilityPercent: number;
  p99LatencyMs: number;
  peakErrorRate: number;
  peakRps: number;
  costEfficiency: number; // cost per 1000 requests
  incidentCount: number;
  grade: "excellent" | "good" | "adequate" | "poor";
}

// ── SPOF Detection ────────────────────────────────────────────

interface SPOFPattern {
  id: string;
  description: string;
  detect: (nodes: Node[], edges: Edge[]) => boolean;
}

function getData(node: Node): Record<string, unknown> {
  return (node.data ?? {}) as Record<string, unknown>;
}

const SPOF_PATTERNS: SPOFPattern[] = [
  {
    id: "single-db-no-replica",
    description: "Single database with no replica",
    detect: (nodes, edges) => {
      const dbNodes = nodes.filter((n) => {
        const d = getData(n);
        return d.category === "storage" && String(d.componentType ?? "").includes("database");
      });
      if (dbNodes.length !== 1) return false;
      const dbId = dbNodes[0].id;
      // Check if any edge targets a replica of this DB
      const hasReplica = edges.some(
        (e) =>
          e.source === dbId &&
          String((e.data as Record<string, unknown> | undefined)?.edgeType ?? "") === "replication",
      );
      return !hasReplica;
    },
  },
  {
    id: "no-load-balancer",
    description: "No load balancer before service nodes",
    detect: (nodes, _edges) => {
      const hasServices = nodes.some((n) => {
        const d = getData(n);
        return d.category === "compute" || d.category === "services";
      });
      const hasLB = nodes.some((n) => {
        const d = getData(n);
        return d.category === "load-balancing" || String(d.componentType ?? "").includes("load-balancer");
      });
      return hasServices && !hasLB;
    },
  },
  {
    id: "single-cache-no-fallback",
    description: "Single cache with no fallback path",
    detect: (nodes, edges) => {
      const cacheNodes = nodes.filter((n) => {
        const d = getData(n);
        return String(d.componentType ?? "").includes("cache") || String(d.componentType ?? "").includes("redis");
      });
      if (cacheNodes.length !== 1) return false;
      const cacheId = cacheNodes[0].id;
      // Check if any service that uses cache also has direct DB path
      const cacheConsumers = edges
        .filter((e) => e.target === cacheId)
        .map((e) => e.source);
      const dbNodes = nodes.filter((n) => {
        const d = getData(n);
        return d.category === "storage";
      });
      if (dbNodes.length === 0) return false;
      // Check if any consumer has both cache and DB edges
      for (const consumer of cacheConsumers) {
        const hasDirectDB = edges.some(
          (e) =>
            e.source === consumer &&
            dbNodes.some((db) => db.id === e.target),
        );
        if (!hasDirectDB) return true; // No fallback path
      }
      return false;
    },
  },
  {
    id: "no-circuit-breaker",
    description: "No circuit breaker in synchronous request path",
    detect: (nodes, edges) => {
      // Look for sync HTTP edges without a circuit-breaker-like node in between
      const syncEdges = edges.filter((e) => {
        const d = (e.data ?? {}) as Record<string, unknown>;
        return d.edgeType === "http" || d.edgeType === "grpc";
      });
      if (syncEdges.length === 0) return false;
      const hasCircuitBreaker = nodes.some((n) => {
        const d = getData(n);
        return (
          String(d.componentType ?? "").includes("circuit-breaker") ||
          String(d.label ?? "").toLowerCase().includes("circuit breaker")
        );
      });
      return syncEdges.length > 2 && !hasCircuitBreaker;
    },
  },
  {
    id: "no-monitoring",
    description: "No monitoring or observability node in the graph",
    detect: (nodes, _edges) => {
      const hasMonitoring = nodes.some((n) => {
        const d = getData(n);
        return (
          d.category === "observability" ||
          String(d.componentType ?? "").includes("monitor") ||
          String(d.componentType ?? "").includes("prometheus") ||
          String(d.componentType ?? "").includes("grafana") ||
          String(d.componentType ?? "").includes("datadog")
        );
      });
      return nodes.length >= 3 && !hasMonitoring;
    },
  },
  {
    id: "single-entry-point",
    description: "Single entry point with no redundancy",
    detect: (nodes, edges) => {
      const inboundCounts = new Map<string, number>();
      for (const e of edges) {
        inboundCounts.set(e.target, (inboundCounts.get(e.target) ?? 0) + 1);
      }
      const entryNodes = nodes.filter((n) => !inboundCounts.has(n.id));
      // Only one entry point and it is not a load balancer
      if (entryNodes.length !== 1) return false;
      const d = getData(entryNodes[0]);
      return d.category !== "load-balancing";
    },
  },
];

/**
 * Detect single points of failure in the canvas graph.
 * Returns a list of human-readable SPOF descriptions.
 */
export function detectSinglePointsOfFailure(
  nodes: Node[],
  edges: Edge[],
): string[] {
  if (nodes.length === 0) return [];
  const spofs: string[] = [];
  for (const pattern of SPOF_PATTERNS) {
    if (pattern.detect(nodes, edges)) {
      spofs.push(pattern.description);
    }
  }
  return spofs;
}

// ── Auto-Scoring ──────────────────────────────────────────────

/**
 * Run the simulation for N ticks synchronously and return a SimulationScore.
 * Uses the orchestrator's `runSync` method and reads store metrics afterwards.
 */
export function autoScoreWithSimulation(
  orchestrator: SimulationOrchestrator,
  ticks: number,
): SimulationScore {
  // Run ticks using the orchestrator's synchronous run method
  orchestrator.runSync(ticks);

  // Read accumulated metrics from the simulation store
  const { useSimulationStore } = require("@/stores/simulation-store") as {
    useSimulationStore: { getState: () => { metrics: { p99LatencyMs: number; errorRate: number; throughputRps: number; totalRequests: number; failedRequests: number } } };
  };
  const metrics = useSimulationStore.getState().metrics;

  const availabilityPercent =
    metrics.totalRequests > 0
      ? ((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100
      : 100;

  const costPerRequest = 0.0001; // simplified cost model
  const costEfficiency = costPerRequest * 1000;

  const incidentCount = metrics.errorRate > 0.05 ? Math.ceil(metrics.errorRate * 10) : 0;

  const grade = gradeFromAvailability(availabilityPercent, metrics.p99LatencyMs);

  return {
    availabilityPercent: Math.round(availabilityPercent * 100) / 100,
    p99LatencyMs: metrics.p99LatencyMs,
    peakErrorRate: metrics.errorRate,
    peakRps: metrics.throughputRps,
    costEfficiency,
    incidentCount,
    grade,
  };
}

function gradeFromAvailability(
  avail: number,
  p99: number,
): SimulationScore["grade"] {
  if (avail >= 99.9 && p99 < 200) return "excellent";
  if (avail >= 99.5 && p99 < 500) return "good";
  if (avail >= 99.0 && p99 < 1000) return "adequate";
  return "poor";
}

// ── Auto-Feedback Generation ──────────────────────────────────

/**
 * Generate human-readable feedback bullets from SPOF analysis,
 * simulation results, and scoring dimensions.
 */
export function generateAutoFeedback(
  spofs: string[],
  score: SimulationScore,
  _dimensions: ScoringDimension[],
): string[] {
  const feedback: string[] = [];

  // SPOF feedback
  if (spofs.length > 0) {
    feedback.push(
      `Found ${spofs.length} single point(s) of failure: ${spofs.join("; ")}.`,
    );
    feedback.push(
      "Add redundancy (replicas, load balancers, fallback paths) to eliminate SPOFs.",
    );
  } else {
    feedback.push("No single points of failure detected -- good redundancy design.");
  }

  // Availability feedback
  if (score.availabilityPercent >= 99.9) {
    feedback.push(
      `Excellent availability: ${score.availabilityPercent}%. Meets four-nines target.`,
    );
  } else if (score.availabilityPercent >= 99.0) {
    feedback.push(
      `Availability at ${score.availabilityPercent}%. Consider adding replicas or auto-failover to reach 99.9%.`,
    );
  } else {
    feedback.push(
      `Low availability: ${score.availabilityPercent}%. Critical: add redundancy, health checks, and failover mechanisms.`,
    );
  }

  // Latency feedback
  if (score.p99LatencyMs > 500) {
    feedback.push(
      `P99 latency is ${score.p99LatencyMs}ms. Consider adding caching, CDN, or optimizing hot-path algorithms.`,
    );
  } else if (score.p99LatencyMs > 200) {
    feedback.push(
      `P99 latency at ${score.p99LatencyMs}ms. Acceptable but could benefit from caching or connection pooling.`,
    );
  }

  // Error rate feedback
  if (score.peakErrorRate > 0.05) {
    feedback.push(
      `Peak error rate of ${(score.peakErrorRate * 100).toFixed(1)}% is concerning. Add circuit breakers and retry logic.`,
    );
  }

  // Grade feedback
  const gradeLabels: Record<SimulationScore["grade"], string> = {
    excellent: "Strong hire -- system demonstrates production-grade resilience.",
    good: "Hire -- solid design with minor improvements possible.",
    adequate: "Borderline -- key reliability gaps need addressing.",
    poor: "No hire -- fundamental design issues with availability and fault tolerance.",
  };
  feedback.push(gradeLabels[score.grade]);

  return feedback;
}
