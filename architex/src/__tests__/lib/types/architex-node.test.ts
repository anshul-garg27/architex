import { describe, it, expect } from "vitest";
import type {
  ArchitexNode,
  ArchitexEdge,
  ArchitexNodeMetrics,
  ArchitexEdgeMetrics,
  ArchitexNodeConfig,
  ArchitexNodeMetadata,
  ArchitexNodeState,
} from "@/lib/types/architex-node";

describe("ArchitexNode type contracts", () => {
  const sampleNode: ArchitexNode = {
    id: "node-1",
    type: "web-server",
    label: "API Gateway",
    position: { x: 100, y: 200 },
    category: "compute",
    config: { instances: 3, maxConnections: 10000, ssl: true },
    metrics: { throughput: 1500, latency: 12, errorRate: 0.01 },
    state: "active",
    metadata: {
      icon: "Globe",
      componentType: "web-server",
      createdAt: "2025-01-01T00:00:00Z",
    },
  };

  it("should satisfy the ArchitexNode interface with all required fields", () => {
    expect(sampleNode.id).toBe("node-1");
    expect(sampleNode.type).toBe("web-server");
    expect(sampleNode.label).toBe("API Gateway");
    expect(sampleNode.position).toEqual({ x: 100, y: 200 });
    expect(sampleNode.category).toBe("compute");
    expect(sampleNode.state).toBe("active");
  });

  it("should carry config as a flexible key-value map", () => {
    const config: ArchitexNodeConfig = sampleNode.config;
    expect(config.instances).toBe(3);
    expect(config.maxConnections).toBe(10000);
    expect(config.ssl).toBe(true);
  });

  it("should carry optional metrics fields", () => {
    const metrics: ArchitexNodeMetrics = sampleNode.metrics;
    expect(metrics.throughput).toBe(1500);
    expect(metrics.latency).toBe(12);
    expect(metrics.cacheHitRate).toBeUndefined();
  });

  it("should carry metadata with icon and componentType", () => {
    const meta: ArchitexNodeMetadata = sampleNode.metadata;
    expect(meta.icon).toBe("Globe");
    expect(meta.componentType).toBe("web-server");
    expect(meta.createdAt).toBe("2025-01-01T00:00:00Z");
    expect(meta.updatedAt).toBeUndefined();
  });

  it("should allow extra metadata keys for extensibility", () => {
    const withExtra: ArchitexNode = {
      ...sampleNode,
      metadata: { ...sampleNode.metadata, team: "platform", priority: 1 },
    };
    expect(withExtra.metadata.team).toBe("platform");
    expect(withExtra.metadata.priority).toBe(1);
  });

  it("should accept all valid node states", () => {
    const states: ArchitexNodeState[] = [
      "idle",
      "active",
      "success",
      "warning",
      "error",
      "processing",
    ];
    states.forEach((state) => {
      const node: ArchitexNode = { ...sampleNode, state };
      expect(node.state).toBe(state);
    });
  });
});

describe("ArchitexEdge type contracts", () => {
  const sampleEdge: ArchitexEdge = {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    type: "data-flow",
    label: "REST API",
    protocol: "http",
    metrics: { latency: 5, bandwidth: 1000 },
    animated: true,
  };

  it("should satisfy the ArchitexEdge interface with all required fields", () => {
    expect(sampleEdge.id).toBe("edge-1");
    expect(sampleEdge.source).toBe("node-1");
    expect(sampleEdge.target).toBe("node-2");
    expect(sampleEdge.type).toBe("data-flow");
    expect(sampleEdge.protocol).toBe("http");
    expect(sampleEdge.animated).toBe(true);
  });

  it("should carry optional label", () => {
    const noLabel: ArchitexEdge = { ...sampleEdge, label: undefined };
    expect(noLabel.label).toBeUndefined();
  });

  it("should carry edge metrics", () => {
    const metrics: ArchitexEdgeMetrics = sampleEdge.metrics;
    expect(metrics.latency).toBe(5);
    expect(metrics.bandwidth).toBe(1000);
    expect(metrics.errorRate).toBeUndefined();
  });
});
