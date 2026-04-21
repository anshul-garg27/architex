"use client";

import { memo } from "react";
import { StickyNote } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export const AnnotationToolbar = memo(function AnnotationToolbar() {
  const addAnnotation = useCanvasStore((s) => s.addAnnotation);

  return (
    <button
      type="button"
      onClick={() =>
        addAnnotation({
          kind: "sticky-note",
          nodeId: null,
          x: 120 + Math.random() * 200,
          y: 120 + Math.random() * 200,
          body: "",
          color: "amber",
          meta: {},
        })
      }
      className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      aria-label="Add sticky note"
    >
      <StickyNote className="h-3.5 w-3.5" />
      Note
    </button>
  );
});
