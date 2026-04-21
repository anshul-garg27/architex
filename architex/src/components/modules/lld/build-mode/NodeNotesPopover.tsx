"use client";

import { memo, useState, useEffect } from "react";
import { StickyNote, X } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  nodeId: string;
  onClose: () => void;
}

export const NodeNotesPopover = memo(function NodeNotesPopover({
  nodeId,
  onClose,
}: Props) {
  const nodes = useCanvasStore((s) => s.nodes);
  const update = useCanvasStore((s) => s.updateNodeNotes);
  const node = nodes.find((n) => n.id === nodeId);
  const [draft, setDraft] = useState(
    (node?.data as { notes?: string })?.notes ?? "",
  );

  useEffect(() => {
    setDraft((node?.data as { notes?: string })?.notes ?? "");
  }, [nodeId, node]);

  if (!node) return null;

  return (
    <div
      role="dialog"
      aria-label="Node notes"
      className="absolute z-40 w-72 rounded-lg border border-amber-500/30 bg-amber-100/90 p-3 shadow-lg backdrop-blur-sm text-slate-900"
      style={{ left: node.position.x, top: node.position.y + 140 }}
    >
      <header className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <StickyNote className="h-3.5 w-3.5" />
          Notes · {(node.data as { label?: string })?.label ?? node.id}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-md p-0.5 hover:bg-black/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => update(nodeId, draft)}
        rows={5}
        placeholder="Why this class? Invariants? Open questions?"
        className="w-full resize-none rounded-md border border-amber-600/30 bg-white/70 p-2 text-xs outline-none focus:border-amber-600"
      />
    </div>
  );
});
