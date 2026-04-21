"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  AUTO_LAYOUT_PRESETS,
  circularLayout,
  computeGenericDagreLayout,
  type AutoLayoutPresetId,
} from "@/lib/lld/auto-layout-presets";

/**
 * Returns a function that applies an auto-layout preset to the canvas
 * store's nodes. Edges are unchanged (Dagre routing points are an
 * enhancement for later phases).
 */
export function useAutoLayout() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useCallback(
    (presetId: AutoLayoutPresetId) => {
      const preset = AUTO_LAYOUT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      if (preset.options === "circular") {
        const updates = circularLayout(nodes);
        const byId = new Map(updates.map((u) => [u.id, u.position]));
        setNodes(
          nodes.map((n) => ({ ...n, position: byId.get(n.id) ?? n.position })),
        );
        return;
      }

      const positioned = computeGenericDagreLayout(nodes, edges, preset.options);
      setNodes(positioned);
    },
    [nodes, edges, setNodes],
  );
}
