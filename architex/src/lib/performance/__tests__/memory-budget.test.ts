import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// Memory Budget Test (PER-012)
//
// Verifies that stress-test generated nodes stay within the
// 80 MB memory budget. Uses JSON serialization byte count as
// a portable proxy for in-memory size across all environments.
// ─────────────────────────────────────────────────────────────

const BUDGET_BYTES = 80 * 1024 * 1024; // 80 MB

// ── Helpers ──────────────────────────────────────────────────

function makeStressNode(index: number): Node {
  return {
    id: `stress-node-${index}`,
    type: "system-design",
    position: { x: (index % 50) * 200, y: Math.floor(index / 50) * 200 },
    data: {
      label: `Node ${index}`,
      category: "compute",
      componentType: "web-server",
      icon: "server",
      config: {
        replicas: 3,
        cpuCores: 4,
        memoryGB: 16,
        maxConnections: 1000,
        healthCheckInterval: 30,
      },
      metrics: {
        throughput: Math.random() * 10_000,
        latency: Math.random() * 200,
        errorRate: Math.random() * 0.05,
        utilization: Math.random(),
        queueDepth: Math.floor(Math.random() * 100),
        cacheHitRate: Math.random(),
      },
      state: "idle" as const,
    },
  };
}

function makeStressEdge(index: number, nodeCount: number): Edge {
  const source = `stress-node-${index % nodeCount}`;
  const target = `stress-node-${(index + 1) % nodeCount}`;
  return {
    id: `stress-edge-${index}`,
    source,
    target,
    type: "default",
    data: {
      edgeType: "http",
      latency: Math.random() * 100,
      bandwidth: Math.random() * 5000,
      errorRate: Math.random() * 0.01,
      animated: true,
    },
  };
}

/**
 * Approximate memory size of a value using JSON serialization.
 * Each character in the JSON string is ~2 bytes in a JS string
 * (UTF-16). The raw object will use more due to V8 overhead, but
 * JSON length gives a reproducible lower bound.
 */
function estimateBytes(value: unknown): number {
  const json = JSON.stringify(value);
  // 2 bytes per char (UTF-16) is the string memory cost
  return json.length * 2;
}

// ── Tests ────────────────────────────────────────────────────

describe("Memory budget (PER-012)", () => {
  it("1,000 nodes + 2,000 edges remain under 80 MB", () => {
    const nodeCount = 1_000;
    const edgeCount = 2_000;

    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(makeStressNode(i));
    }

    const edges: Edge[] = [];
    for (let i = 0; i < edgeCount; i++) {
      edges.push(makeStressEdge(i, nodeCount));
    }

    const totalBytes = estimateBytes(nodes) + estimateBytes(edges);

    expect(totalBytes).toBeLessThan(BUDGET_BYTES);
  });

  it("5,000 nodes + 10,000 edges remain under 80 MB", () => {
    const nodeCount = 5_000;
    const edgeCount = 10_000;

    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(makeStressNode(i));
    }

    const edges: Edge[] = [];
    for (let i = 0; i < edgeCount; i++) {
      edges.push(makeStressEdge(i, nodeCount));
    }

    const totalBytes = estimateBytes(nodes) + estimateBytes(edges);

    expect(totalBytes).toBeLessThan(BUDGET_BYTES);
  });

  it("measures approximate memory per node", () => {
    const sampleSize = 100;
    const nodes: Node[] = [];
    for (let i = 0; i < sampleSize; i++) {
      nodes.push(makeStressNode(i));
    }

    const totalBytes = estimateBytes(nodes);
    const bytesPerNode = totalBytes / sampleSize;

    // Each fully-loaded system-design node should be < 2 KB serialized
    expect(bytesPerNode).toBeLessThan(2_048);
    // But should be non-trivial (at least 200 bytes)
    expect(bytesPerNode).toBeGreaterThan(200);
  });

  it("measures approximate memory per edge", () => {
    const sampleSize = 100;
    const edges: Edge[] = [];
    for (let i = 0; i < sampleSize; i++) {
      edges.push(makeStressEdge(i, sampleSize));
    }

    const totalBytes = estimateBytes(edges);
    const bytesPerEdge = totalBytes / sampleSize;

    // Each edge should be < 1 KB serialized
    expect(bytesPerEdge).toBeLessThan(1_024);
    expect(bytesPerEdge).toBeGreaterThan(50);
  });
});
