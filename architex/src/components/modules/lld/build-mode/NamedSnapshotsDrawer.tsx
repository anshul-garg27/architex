"use client";

import { memo, useState } from "react";
import { Camera, X, Undo2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export const NamedSnapshotsDrawer = memo(function NamedSnapshotsDrawer() {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");

  const snapshots = useCanvasStore((s) => s.namedSnapshots);
  const push = useCanvasStore((s) => s.pushNamedSnapshot);
  const restore = useCanvasStore((s) => s.restoreNamedSnapshot);
  const del = useCanvasStore((s) => s.deleteNamedSnapshot);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open snapshots"
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Camera className="h-3.5 w-3.5" />
        Snapshots ({snapshots.length})
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Snapshots drawer"
          className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border/40 bg-elevated/95 shadow-2xl backdrop-blur-sm"
        >
          <header className="flex items-center justify-between border-b border-border/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Snapshots
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="border-b border-border/20 px-4 py-3 space-y-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Before refactor)"
              className="w-full rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            />
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              placeholder="Optional note"
              className="w-full resize-none rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            />
            <button
              type="button"
              disabled={!newLabel.trim()}
              onClick={() => {
                push(newLabel.trim(), newNote.trim() || null);
                setNewLabel("");
                setNewNote("");
              }}
              className="w-full rounded-md bg-primary/80 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Capture snapshot
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto p-2">
            {snapshots.length === 0 ? (
              <li className="p-4 text-xs text-foreground-muted">
                No snapshots yet.
              </li>
            ) : (
              snapshots.map((s) => (
                <li
                  key={s.id}
                  className="mb-1 rounded-md border border-border/20 bg-background/40 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">
                        {s.label}
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Restore"
                        onClick={() => restore(s.id)}
                        className="rounded-md border border-border/30 px-1.5 py-0.5 text-[10px] hover:bg-foreground/5"
                      >
                        <Undo2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => del(s.id)}
                        className="rounded-md border border-border/30 px-1.5 py-0.5 text-[10px] hover:bg-foreground/5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {s.note && (
                    <p className="mt-1 text-[11px] text-foreground-muted">
                      {s.note}
                    </p>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </>
  );
});
