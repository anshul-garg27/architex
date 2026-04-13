"use client";

import { memo, useCallback, useState } from "react";
import {
  LayoutGrid,
  GitBranch,
  Circle,
  Grid3x3,
  ArrowDownUp,
  ArrowLeftRight,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  computeLayout,
  type LayoutAlgorithm,
} from "@/lib/layout/auto-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// ── Layout options metadata ─────────────────────────────────

const LAYOUT_OPTIONS: {
  algorithm: LayoutAlgorithm;
  label: string;
  icon: React.ElementType;
}[] = [
  { algorithm: "hierarchical", label: "Hierarchical", icon: GitBranch },
  { algorithm: "force-directed", label: "Force-directed", icon: LayoutGrid },
  { algorithm: "circular", label: "Circular", icon: Circle },
  { algorithm: "grid", label: "Grid", icon: Grid3x3 },
];

// ── Component ───────────────────────────────────────────────

export const LayoutPicker = memo(function LayoutPicker() {
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const reactFlow = useReactFlow();

  const applyLayout = useCallback(
    (algorithm: LayoutAlgorithm) => {
      if (nodes.length === 0) return;

      const result = computeLayout(nodes, edges, algorithm, {
        spacing: 200,
        direction,
      });

      // Animate node positions by updating them in the store.
      // ReactFlow will animate via CSS transition when we set the new positions.
      const updatedNodes = nodes.map((node) => {
        const pos = result.positions.get(node.id);
        if (!pos) return node;
        return {
          ...node,
          position: { x: pos.x, y: pos.y },
        };
      });

      setNodes(updatedNodes);

      // Fit view after layout settles
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.15, duration: 400 });
      }, 50);
    },
    [nodes, edges, direction, setNodes, reactFlow],
  );

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "TB" ? "LR" : "TB"));
  }, []);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Auto layout</TooltipContent>
      </Tooltip>

      <DropdownMenuContent side="top" align="center" sideOffset={8}>
        {LAYOUT_OPTIONS.map(({ algorithm, label, icon: Icon }) => (
          <DropdownMenuItem
            key={algorithm}
            onClick={() => applyLayout(algorithm)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleDirection} className="gap-2">
          {direction === "TB" ? (
            <ArrowDownUp className="h-4 w-4" />
          ) : (
            <ArrowLeftRight className="h-4 w-4" />
          )}
          <span>
            Direction: {direction === "TB" ? "Top \u2192 Bottom" : "Left \u2192 Right"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
