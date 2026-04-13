"use client";

import { useCallback, useState, useMemo } from "react";
import type { Node, NodeMouseHandler } from "@xyflow/react";

// ── Types ─────────────────────────────────────────────────────

export interface NodeHoverInfo {
  nodeId: string;
  label: string;
  type: string;
}

export interface UseNodeHoverReturn {
  /** Currently hovered node info, or null */
  hoveredNode: NodeHoverInfo | null;
  /** Attach to ReactFlow's onNodeMouseEnter */
  onNodeMouseEnter: NodeMouseHandler;
  /** Attach to ReactFlow's onNodeMouseLeave */
  onNodeMouseLeave: NodeMouseHandler;
  /** CSS style object for the hovered node (scale + border brightness) */
  getHoverStyle: (nodeId: string) => React.CSSProperties;
}

// ── useNodeHover ──────────────────────────────────────────────

export function useNodeHover(): UseNodeHoverReturn {
  const [hoveredNode, setHoveredNode] = useState<NodeHoverInfo | null>(null);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as Record<string, unknown>;
      setHoveredNode({
        nodeId: node.id,
        label: (data.label as string) ?? node.id,
        type: node.type ?? "unknown",
      });
    },
    [],
  );

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const getHoverStyle = useCallback(
    (nodeId: string): React.CSSProperties => {
      if (hoveredNode?.nodeId !== nodeId) return {};
      return {
        transform: "scale(1.02)",
        filter: "brightness(1.15)",
        transition: "transform 0.15s ease, filter 0.15s ease",
        zIndex: 10,
      };
    },
    [hoveredNode],
  );

  return useMemo(
    () => ({ hoveredNode, onNodeMouseEnter, onNodeMouseLeave, getHoverStyle }),
    [hoveredNode, onNodeMouseEnter, onNodeMouseLeave, getHoverStyle],
  );
}
