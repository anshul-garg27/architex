"use client";

import { memo } from "react";
import type { LLDTemplatesLibraryEntry } from "@/db/schema";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface Props {
  template: LLDTemplatesLibraryEntry;
}

function difficultyColor(d: string) {
  if (d === "beginner") return "text-emerald-400";
  if (d === "intermediate") return "text-sky-400";
  return "text-fuchsia-400";
}

export const PatternLibraryItem = memo(function PatternLibraryItem({
  template,
}: Props) {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);

  const apply = () => {
    const cs = template.canvasState as {
      nodes?: Array<{
        id: string;
        position: { x: number; y: number };
        data: Record<string, unknown>;
        type?: string;
      }>;
      edges?: Array<{
        id?: string;
        source: string;
        target: string;
        data?: Record<string, unknown>;
        type?: string;
      }>;
    };
    if (Array.isArray(cs.nodes)) {
      setNodes(
        cs.nodes.map((n) => ({
          id: n.id,
          type: n.type ?? "class",
          position: n.position,
          data: n.data ?? {},
        })),
      );
    }
    if (Array.isArray(cs.edges)) {
      setEdges(
        cs.edges.map((e, i) => ({
          id: e.id ?? `e-${i}`,
          source: e.source,
          target: e.target,
          type: e.type ?? "data-flow",
          data: e.data ?? {},
        })),
      );
    }
  };

  return (
    <li>
      <button
        onClick={apply}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ kind: "lld-template", slug: template.slug }),
          );
        }}
        className={cn(
          "w-full rounded-md border border-transparent px-2 py-1.5 text-left transition-colors",
          "hover:border-border/40 hover:bg-elevated/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-foreground">
            {template.name}
          </span>
          <span
            className={cn(
              "shrink-0 text-[9px] uppercase",
              difficultyColor(template.difficulty),
            )}
          >
            {template.difficulty}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-foreground-muted">
          {template.description}
        </p>
      </button>
    </li>
  );
});
