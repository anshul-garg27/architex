"use client";

import { memo } from "react";
import { useCanvasStore, type CanvasAnnotation } from "@/stores/canvas-store";

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-500/40 bg-amber-100/90 text-slate-900",
  sky: "border-sky-500/40 bg-sky-100/90 text-slate-900",
  emerald: "border-emerald-500/40 bg-emerald-100/90 text-slate-900",
  fuchsia: "border-fuchsia-500/40 bg-fuchsia-100/90 text-slate-900",
};

function StickyNote({ a }: { a: CanvasAnnotation }) {
  const update = useCanvasStore((s) => s.updateAnnotation);
  const del = useCanvasStore((s) => s.deleteAnnotation);
  const colorCls = COLOR_MAP[a.color] ?? COLOR_MAP.amber;

  return (
    <div
      style={{ left: a.x, top: a.y }}
      className={`pointer-events-auto absolute w-48 rounded-md border p-2 shadow ${colorCls}`}
    >
      <textarea
        value={a.body}
        onChange={(e) => update(a.id, { body: e.target.value })}
        rows={3}
        className="w-full resize-none bg-transparent text-xs outline-none"
      />
      <button
        type="button"
        aria-label="Delete annotation"
        onClick={() => del(a.id)}
        className="absolute right-1 top-1 text-[10px] text-slate-700 hover:text-slate-900"
      >
        ×
      </button>
    </div>
  );
}

export const AnnotationLayer = memo(function AnnotationLayer() {
  const annotations = useCanvasStore((s) => s.annotations);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {annotations.map((a) => {
        if (a.kind === "sticky-note") return <StickyNote key={a.id} a={a} />;
        // arrow / circle / text extensions can go here in later phases.
        return null;
      })}
    </div>
  );
});
