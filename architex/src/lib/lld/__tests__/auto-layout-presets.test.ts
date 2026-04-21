import { describe, it, expect } from "vitest";
import {
  AUTO_LAYOUT_PRESETS,
  circularLayout,
  computeGenericDagreLayout,
} from "@/lib/lld/auto-layout-presets";
import type { Node, Edge } from "@xyflow/react";

describe("auto-layout-presets", () => {
  it("exposes four presets with unique ids", () => {
    const ids = AUTO_LAYOUT_PRESETS.map((p) => p.id);
    expect(ids).toEqual(["left-right", "top-down", "layered", "circular"]);
    expect(new Set(ids).size).toBe(4);
  });

  it("circularLayout arranges N nodes on a circle", () => {
    const nodes: Node[] = Array.from({ length: 4 }, (_, i) => ({
      id: `n${i}`,
      type: "class",
      position: { x: 0, y: 0 },
      data: {},
    }));
    const out = circularLayout(nodes, 100, { x: 0, y: 0 });
    expect(out).toHaveLength(4);
    // All points lie on the circle (within floating-point tolerance)
    for (const p of out) {
      const r = Math.hypot(p.position.x, p.position.y);
      expect(Math.abs(r - 100)).toBeLessThan(0.01);
    }
  });

  it("circularLayout on empty input returns []", () => {
    expect(circularLayout([])).toEqual([]);
  });

  it("computeGenericDagreLayout assigns positions and preserves ids", () => {
    const nodes: Node[] = [
      { id: "a", type: "class", position: { x: 0, y: 0 }, data: {} },
      { id: "b", type: "class", position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: "e1", source: "a", target: "b" }];
    const out = computeGenericDagreLayout(nodes, edges, {
      rankDir: "TB",
      nodeSep: 60,
      rankSep: 100,
    });
    expect(out.map((n) => n.id)).toEqual(["a", "b"]);
    // One node must be above the other vertically (rankDir: TB)
    const yA = out.find((n) => n.id === "a")!.position.y;
    const yB = out.find((n) => n.id === "b")!.position.y;
    expect(Math.abs(yA - yB)).toBeGreaterThan(0);
  });

  it("computeGenericDagreLayout handles empty nodes", () => {
    expect(computeGenericDagreLayout([], [], { rankDir: "TB", nodeSep: 60, rankSep: 100 })).toEqual([]);
  });
});
