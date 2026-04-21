"use client";

import { useEffect } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { useCanvasStore } from "@/stores/canvas-store";

export function CanvasStage() {
  const merge = useDrillStore((s) => s.mergeStageProgress);
  const nodeCount = useCanvasStore((s) => s.nodes.length);
  const edgeCount = useCanvasStore((s) => s.edges.length);

  useEffect(() => {
    merge({
      canvasClassCount: nodeCount,
      canvasEdgeCount: edgeCount,
    });
  }, [nodeCount, edgeCount, merge]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Stage 3 · Design
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {nodeCount} classes · {edgeCount} edges
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center bg-zinc-950/20 p-6 text-sm text-zinc-500">
        Canvas here. Drop UML classes, wire relationships, iterate.
      </div>
    </div>
  );
}
