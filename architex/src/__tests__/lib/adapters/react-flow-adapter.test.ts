import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import type { ArchitexNode, ArchitexEdge } from "@/lib/types/architex-node";
import {
  toReactFlowNode,
  fromReactFlowNode,
  toReactFlowEdge,
  fromReactFlowEdge,
  toReactFlowNodes,
  fromReactFlowNodes,
  toReactFlowEdges,
  fromReactFlowEdges,
} from "@/lib/adapters/react-flow-adapter";

// ── Test Data ──────────────────────────────────────────────

const sampleNode: ArchitexNode = {
  id: "node-1",
  type: "web-server",
  label: "API Server",
  position: { x: 100, y: 200 },
  category: "compute",
  config: { instances: 3, maxConnections: 10000, ssl: true },
  metrics: { throughput: 1500, latency: 12, errorRate: 0.01 },
  state: "active",
  metadata: {
    icon: "Globe",
    componentType: "web-server",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-06-15T12:00:00Z",
  },
};

const sampleNodeWithExtras: ArchitexNode = {
  ...sampleNode,
  id: "node-2",
  metadata: {
    ...sampleNode.metadata,
    team: "platform",
    priority: 1,
  },
};

const sampleEdge: ArchitexEdge = {
  id: "edge-1",
  source: "node-1",
  target: "node-2",
  type: "data-flow",
  label: "REST API",
  protocol: "http",
  metrics: { latency: 5, bandwidth: 1000, errorRate: 0.001 },
  animated: true,
};

const sampleEdgeMinimal: ArchitexEdge = {
  id: "edge-2",
  source: "node-2",
  target: "node-3",
  type: "data-flow",
  protocol: "grpc",
  metrics: {},
  animated: false,
};

// ── Node round-trip tests ──────────────────────────────────

describe("Node adapters", () => {
  describe("toReactFlowNode", () => {
    it("should produce a valid React Flow node with all data fields", () => {
      const rfNode = toReactFlowNode(sampleNode);

      expect(rfNode.id).toBe("node-1");
      expect(rfNode.type).toBe("web-server");
      expect(rfNode.position).toEqual({ x: 100, y: 200 });

      const data = rfNode.data as Record<string, unknown>;
      expect(data.label).toBe("API Server");
      expect(data.category).toBe("compute");
      expect(data.componentType).toBe("web-server");
      expect(data.icon).toBe("Globe");
      expect(data.config).toEqual({
        instances: 3,
        maxConnections: 10000,
        ssl: true,
      });
      expect(data.metrics).toEqual({
        throughput: 1500,
        latency: 12,
        errorRate: 0.01,
      });
      expect(data.state).toBe("active");
      expect(data.createdAt).toBe("2025-01-01T00:00:00Z");
      expect(data.updatedAt).toBe("2025-06-15T12:00:00Z");
    });

    it("should include extra metadata in the data payload", () => {
      const rfNode = toReactFlowNode(sampleNodeWithExtras);
      const data = rfNode.data as Record<string, unknown>;
      expect(data.team).toBe("platform");
      expect(data.priority).toBe(1);
    });
  });

  describe("fromReactFlowNode", () => {
    it("should reconstruct an ArchitexNode from a React Flow node", () => {
      const rfNode: Node = {
        id: "node-1",
        type: "database",
        position: { x: 300, y: 400 },
        data: {
          label: "PostgreSQL",
          category: "storage",
          componentType: "database",
          icon: "Database",
          config: { engine: "postgres", replicas: 2 },
          metrics: { throughput: 500 },
          state: "idle",
          createdAt: "2025-02-01T00:00:00Z",
        },
      };

      const node = fromReactFlowNode(rfNode);
      expect(node.id).toBe("node-1");
      expect(node.type).toBe("database");
      expect(node.label).toBe("PostgreSQL");
      expect(node.position).toEqual({ x: 300, y: 400 });
      expect(node.category).toBe("storage");
      expect(node.config).toEqual({ engine: "postgres", replicas: 2 });
      expect(node.metrics).toEqual({ throughput: 500 });
      expect(node.state).toBe("idle");
      expect(node.metadata.icon).toBe("Database");
      expect(node.metadata.componentType).toBe("database");
      expect(node.metadata.createdAt).toBe("2025-02-01T00:00:00Z");
    });

    it("should apply defaults for missing data fields", () => {
      const bare: Node = {
        id: "bare-1",
        position: { x: 0, y: 0 },
        data: {},
      };

      const node = fromReactFlowNode(bare);
      expect(node.label).toBe("");
      expect(node.category).toBe("compute");
      expect(node.state).toBe("idle");
      expect(node.config).toEqual({});
      expect(node.metrics).toEqual({});
      expect(node.metadata.icon).toBe("Box");
    });
  });

  describe("round-trip: ArchitexNode -> RF -> ArchitexNode", () => {
    it("should preserve all fields through a full round-trip", () => {
      const rfNode = toReactFlowNode(sampleNode);
      const roundTripped = fromReactFlowNode(rfNode);

      expect(roundTripped.id).toBe(sampleNode.id);
      expect(roundTripped.type).toBe(sampleNode.type);
      expect(roundTripped.label).toBe(sampleNode.label);
      expect(roundTripped.position).toEqual(sampleNode.position);
      expect(roundTripped.category).toBe(sampleNode.category);
      expect(roundTripped.config).toEqual(sampleNode.config);
      expect(roundTripped.metrics).toEqual(sampleNode.metrics);
      expect(roundTripped.state).toBe(sampleNode.state);
      expect(roundTripped.metadata.icon).toBe(sampleNode.metadata.icon);
      expect(roundTripped.metadata.componentType).toBe(
        sampleNode.metadata.componentType,
      );
      expect(roundTripped.metadata.createdAt).toBe(
        sampleNode.metadata.createdAt,
      );
      expect(roundTripped.metadata.updatedAt).toBe(
        sampleNode.metadata.updatedAt,
      );
    });

    it("should preserve extra metadata keys through round-trip", () => {
      const rfNode = toReactFlowNode(sampleNodeWithExtras);
      const roundTripped = fromReactFlowNode(rfNode);

      expect(roundTripped.metadata.team).toBe("platform");
      expect(roundTripped.metadata.priority).toBe(1);
    });
  });

  describe("round-trip: RF Node -> ArchitexNode -> RF Node", () => {
    it("should preserve core React Flow fields", () => {
      const original: Node = {
        id: "rf-1",
        type: "cache",
        position: { x: 50, y: 75 },
        data: {
          label: "Redis",
          category: "storage",
          componentType: "cache",
          icon: "Zap",
          config: { maxMemoryMB: 512 },
          metrics: { cacheHitRate: 0.95 },
          state: "success",
        },
      };

      const architexNode = fromReactFlowNode(original);
      const restored = toReactFlowNode(architexNode);

      expect(restored.id).toBe(original.id);
      expect(restored.type).toBe(original.type);
      expect(restored.position).toEqual(original.position);

      const origData = original.data as Record<string, unknown>;
      const restoredData = restored.data as Record<string, unknown>;
      expect(restoredData.label).toBe(origData.label);
      expect(restoredData.category).toBe(origData.category);
      expect(restoredData.componentType).toBe(origData.componentType);
      expect(restoredData.icon).toBe(origData.icon);
      expect(restoredData.config).toEqual(origData.config);
      expect(restoredData.metrics).toEqual(origData.metrics);
      expect(restoredData.state).toBe(origData.state);
    });
  });
});

// ── Edge round-trip tests ──────────────────────────────────

describe("Edge adapters", () => {
  describe("toReactFlowEdge", () => {
    it("should produce a valid React Flow edge with data", () => {
      const rfEdge = toReactFlowEdge(sampleEdge);

      expect(rfEdge.id).toBe("edge-1");
      expect(rfEdge.source).toBe("node-1");
      expect(rfEdge.target).toBe("node-2");
      expect(rfEdge.type).toBe("data-flow");
      expect(rfEdge.label).toBe("REST API");
      expect(rfEdge.animated).toBe(true);

      const data = rfEdge.data as Record<string, unknown>;
      expect(data.edgeType).toBe("http");
      expect(data.latency).toBe(5);
      expect(data.bandwidth).toBe(1000);
      expect(data.errorRate).toBe(0.001);
      expect(data.animated).toBe(true);
    });

    it("should handle minimal edge without label", () => {
      const rfEdge = toReactFlowEdge(sampleEdgeMinimal);
      expect(rfEdge.label).toBeUndefined();
      expect(rfEdge.animated).toBe(false);
    });
  });

  describe("fromReactFlowEdge", () => {
    it("should reconstruct an ArchitexEdge from a React Flow edge", () => {
      const rfEdge: Edge = {
        id: "e-1",
        source: "a",
        target: "b",
        type: "data-flow",
        label: "gRPC",
        data: {
          edgeType: "grpc",
          latency: 2,
          bandwidth: 5000,
          animated: false,
        },
      };

      const edge = fromReactFlowEdge(rfEdge);
      expect(edge.id).toBe("e-1");
      expect(edge.source).toBe("a");
      expect(edge.target).toBe("b");
      expect(edge.type).toBe("data-flow");
      expect(edge.label).toBe("gRPC");
      expect(edge.protocol).toBe("grpc");
      expect(edge.metrics.latency).toBe(2);
      expect(edge.metrics.bandwidth).toBe(5000);
      expect(edge.animated).toBe(false);
    });

    it("should apply defaults for missing data fields", () => {
      const bare: Edge = {
        id: "e-bare",
        source: "x",
        target: "y",
      };

      const edge = fromReactFlowEdge(bare);
      expect(edge.type).toBe("data-flow");
      expect(edge.protocol).toBe("http");
      expect(edge.animated).toBe(false);
      expect(edge.metrics).toEqual({
        latency: undefined,
        bandwidth: undefined,
        errorRate: undefined,
      });
    });
  });

  describe("round-trip: ArchitexEdge -> RF -> ArchitexEdge", () => {
    it("should preserve all fields through a full round-trip", () => {
      const rfEdge = toReactFlowEdge(sampleEdge);
      const roundTripped = fromReactFlowEdge(rfEdge);

      expect(roundTripped.id).toBe(sampleEdge.id);
      expect(roundTripped.source).toBe(sampleEdge.source);
      expect(roundTripped.target).toBe(sampleEdge.target);
      expect(roundTripped.type).toBe(sampleEdge.type);
      expect(roundTripped.label).toBe(sampleEdge.label);
      expect(roundTripped.protocol).toBe(sampleEdge.protocol);
      expect(roundTripped.metrics).toEqual(sampleEdge.metrics);
      expect(roundTripped.animated).toBe(sampleEdge.animated);
    });

    it("should preserve minimal edge through round-trip", () => {
      const rfEdge = toReactFlowEdge(sampleEdgeMinimal);
      const roundTripped = fromReactFlowEdge(rfEdge);

      expect(roundTripped.id).toBe(sampleEdgeMinimal.id);
      expect(roundTripped.source).toBe(sampleEdgeMinimal.source);
      expect(roundTripped.target).toBe(sampleEdgeMinimal.target);
      expect(roundTripped.protocol).toBe(sampleEdgeMinimal.protocol);
      expect(roundTripped.animated).toBe(sampleEdgeMinimal.animated);
    });
  });

  describe("round-trip: RF Edge -> ArchitexEdge -> RF Edge", () => {
    it("should preserve core React Flow fields", () => {
      const original: Edge = {
        id: "rf-e-1",
        source: "n1",
        target: "n2",
        type: "data-flow",
        label: "WebSocket",
        animated: true,
        data: {
          edgeType: "websocket",
          latency: 1,
          animated: true,
        },
      };

      const architexEdge = fromReactFlowEdge(original);
      const restored = toReactFlowEdge(architexEdge);

      expect(restored.id).toBe(original.id);
      expect(restored.source).toBe(original.source);
      expect(restored.target).toBe(original.target);
      expect(restored.type).toBe(original.type);
      expect(restored.label).toBe(original.label);
      expect(restored.animated).toBe(original.animated);
    });
  });
});

// ── Batch converter tests ──────────────────────────────────

describe("Batch converters", () => {
  const nodes: ArchitexNode[] = [sampleNode, sampleNodeWithExtras];
  const edges: ArchitexEdge[] = [sampleEdge, sampleEdgeMinimal];

  it("toReactFlowNodes should convert an array of ArchitexNodes", () => {
    const rfNodes = toReactFlowNodes(nodes);
    expect(rfNodes).toHaveLength(2);
    expect(rfNodes[0].id).toBe("node-1");
    expect(rfNodes[1].id).toBe("node-2");
  });

  it("fromReactFlowNodes should convert back to ArchitexNodes", () => {
    const rfNodes = toReactFlowNodes(nodes);
    const restored = fromReactFlowNodes(rfNodes);
    expect(restored).toHaveLength(2);
    expect(restored[0].label).toBe("API Server");
    expect(restored[1].metadata.team).toBe("platform");
  });

  it("toReactFlowEdges should convert an array of ArchitexEdges", () => {
    const rfEdges = toReactFlowEdges(edges);
    expect(rfEdges).toHaveLength(2);
    expect(rfEdges[0].id).toBe("edge-1");
    expect(rfEdges[1].id).toBe("edge-2");
  });

  it("fromReactFlowEdges should convert back to ArchitexEdges", () => {
    const rfEdges = toReactFlowEdges(edges);
    const restored = fromReactFlowEdges(rfEdges);
    expect(restored).toHaveLength(2);
    expect(restored[0].protocol).toBe("http");
    expect(restored[1].protocol).toBe("grpc");
  });

  it("should handle empty arrays gracefully", () => {
    expect(toReactFlowNodes([])).toEqual([]);
    expect(toReactFlowEdges([])).toEqual([]);
    expect(fromReactFlowNodes([])).toEqual([]);
    expect(fromReactFlowEdges([])).toEqual([]);
  });
});
