"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Clock,
  GripVertical,
  Layers,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSnapshotStore } from "@/stores/snapshot-store";
import type { ArchitectureSnapshot } from "@/lib/versioning/snapshots";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Helpers ─────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Snapshot Card ───────────────────────────────────────────

interface SnapshotCardProps {
  snapshot: ArchitectureSnapshot;
  isActive: boolean;
  onRestore: (id: string) => void;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  index: number;
  isDragTarget: boolean;
}

function SnapshotCard({
  snapshot,
  isActive,
  onRestore,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  index,
  isDragTarget,
}: SnapshotCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex shrink-0 cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2 transition-all",
        "min-w-[140px] max-w-[180px]",
        isActive
          ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]"
          : "border-border/60 bg-surface/80 hover:border-border hover:bg-elevated/80",
        isDragTarget && "border-primary/50 bg-primary/5",
      )}
      onClick={() => onRestore(snapshot.id)}
    >
      {/* Drag handle */}
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-60">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(snapshot.id);
        }}
        className="absolute right-1 top-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-red-500/20 group-hover:opacity-100"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-red-400" />
      </button>

      {/* Label */}
      <span className="truncate pr-4 text-xs font-medium text-foreground">
        {snapshot.label}
      </span>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo(snapshot.timestamp)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {formatTimestamp(snapshot.timestamp)}
          </TooltipContent>
        </Tooltip>

        <span className="flex items-center gap-0.5">
          <Layers className="h-2.5 w-2.5" />
          {snapshot.nodeCount}N / {snapshot.edgeCount}E
        </span>
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.5)]" />
      )}
    </div>
  );
}

// ── Save Snapshot Inline Input ───────────────────────────────

function SaveSnapshotInput({
  onSave,
  onCancel,
}: {
  onSave: (label: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  const refCallback = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) {
        node.focus();
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [],
  );

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-surface/90 px-2 py-1.5">
      <input
        ref={refCallback}
        type="text"
        placeholder="Snapshot label..."
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        aria-label="Snapshot label"
        className="w-[120px] bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        onClick={handleSubmit}
        disabled={!label.trim()}
        className="rounded px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
      >
        Save
      </button>
      <button
        onClick={onCancel}
        className="rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main Timeline ───────────────────────────────────────────

export const EvolutionTimeline = memo(function EvolutionTimeline() {
  const snapshots = useSnapshotStore((s) => s.snapshots);
  const activeSnapshotId = useSnapshotStore((s) => s.activeSnapshotId);
  const addSnapshot = useSnapshotStore((s) => s.addSnapshot);
  const removeSnapshot = useSnapshotStore((s) => s.removeSnapshot);
  const restore = useSnapshotStore((s) => s.restoreSnapshot);
  const reorderSnapshots = useSnapshotStore((s) => s.reorderSnapshots);

  const [isAdding, setIsAdding] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(
    (label: string) => {
      addSnapshot(label);
      setIsAdding(false);
      // Scroll to end after adding
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      });
    },
    [addSnapshot],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragFromIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderSnapshots(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, dragOverIndex, reorderSnapshots]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "pointer-events-auto",
          "absolute bottom-16 left-1/2 z-40 -translate-x-1/2",
          "flex items-center gap-2",
          "rounded-xl border border-border bg-surface/90 shadow-xl backdrop-blur-lg",
          "px-3 py-2",
          "max-w-[80vw]",
        )}
      >
        {/* Save snapshot button */}
        {!isAdding ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsAdding(true)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  "border border-dashed border-border text-muted-foreground",
                  "hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                Snapshot
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Save current state</TooltipContent>
          </Tooltip>
        ) : (
          <SaveSnapshotInput
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Snapshot cards (scrollable) */}
        {snapshots.length > 0 && (
          <>
            <div className="h-6 w-px shrink-0 bg-border/60" />
            <div
              ref={scrollRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-none"
              style={{ maxWidth: "calc(80vw - 160px)" }}
            >
              {snapshots.map((snap, idx) => (
                <SnapshotCard
                  key={snap.id}
                  snapshot={snap}
                  isActive={snap.id === activeSnapshotId}
                  onRestore={restore}
                  onRemove={removeSnapshot}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  index={idx}
                  isDragTarget={dragOverIndex === idx && dragFromIndex !== idx}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {snapshots.length === 0 && !isAdding && (
          <span className="text-[11px] text-muted-foreground">
            No snapshots yet
          </span>
        )}
      </div>
    </TooltipProvider>
  );
});
