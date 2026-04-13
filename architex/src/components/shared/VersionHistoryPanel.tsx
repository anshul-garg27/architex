"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  ChevronRight,
  Clock,
  GitCompare,
  History,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { VersionEntry } from "@/lib/version-history/history-manager";
import type { DiagramDiff } from "@/lib/version-history/diff-engine";

// ─────────────────────────────────────────────────────────────
// VersionHistoryPanel (INF-022)
//
// Slide-out panel showing the diagram version timeline.
// Each entry displays label, timestamp, change summary, and a
// restore button. Supports diff between any two versions and
// manual snapshot creation.
// ─────────────────────────────────────────────────────────────

// ── Props ────────────────────────────────────────────────────

export interface VersionHistoryPanelProps {
  /** All version entries (sorted ascending by timestamp). */
  versions: VersionEntry[];
  /** Called when the user requests a restore. */
  onRestore: (id: string) => void;
  /** Called when the user requests a manual snapshot. */
  onCreateSnapshot: () => void;
  /** Called to compute a diff between two versions. */
  onDiff: (id1: string, id2: string) => Promise<DiagramDiff | null>;
}

// ── Helpers ──────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

function changeSummary(entry: VersionEntry): string {
  const { nodes, edges } = entry.snapshot;
  return `${nodes.length} node${nodes.length !== 1 ? "s" : ""}, ${edges.length} edge${edges.length !== 1 ? "s" : ""}`;
}

// ── Diff Summary Sub-component ───────────────────────────────

function DiffSummary({ diff }: { diff: DiagramDiff }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-sidebar p-3 text-xs">
      <h4 className="font-medium text-foreground">Differences</h4>
      {diff.summary.map((line, i) => (
        <p key={i} className="text-foreground-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

// ── Version Row ──────────────────────────────────────────────

interface VersionRowProps {
  entry: VersionEntry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
}

const VersionRow = memo(function VersionRow({
  entry,
  isSelected,
  onSelect,
  onRestore,
}: VersionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-foreground-muted hover:bg-accent/30",
      )}
    >
      {/* Timeline dot */}
      <div className="mt-1 flex flex-col items-center">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isSelected ? "bg-primary" : "bg-foreground-muted",
          )}
        />
        <div className="mt-1 h-6 w-px bg-border" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {entry.label}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(entry.id);
            }}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs text-foreground-muted opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
            aria-label={`Restore ${entry.label}`}
          >
            <RotateCcw className="h-3 w-3" />
            Restore
          </button>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
          <Clock className="h-3 w-3" />
          <span>{formatTimestamp(entry.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-xs text-foreground-muted">
          {changeSummary(entry)}
        </p>
      </div>
    </button>
  );
});

// ── Main Panel ───────────────────────────────────────────────

export const VersionHistoryPanel = memo(function VersionHistoryPanel({
  versions,
  onRestore,
  onCreateSnapshot,
  onDiff,
}: VersionHistoryPanelProps) {
  const open = useUIStore((s) => s.versionHistoryPanelOpen);
  const setOpen = useUIStore((s) => s.setVersionHistoryPanelOpen);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [diff, setDiff] = useState<DiagramDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Reset selection when panel closes
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setDiff(null);
    }
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      // Keep at most 2 selected (for diff)
      const next = [...prev, id];
      return next.length > 2 ? next.slice(-2) : next;
    });
    setDiff(null);
  }, []);

  // Compute diff when two versions are selected
  const handleDiff = useCallback(async () => {
    if (selectedIds.length !== 2) return;
    setDiffLoading(true);
    try {
      const result = await onDiff(selectedIds[0], selectedIds[1]);
      setDiff(result);
    } finally {
      setDiffLoading(false);
    }
  }, [selectedIds, onDiff]);

  // Show versions in reverse chronological order (newest first)
  const sortedVersions = useMemo(
    () => [...versions].reverse(),
    [versions],
  );

  const handleBackdropClick = useCallback(() => setOpen(false), [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Slide-out panel from right */}
      <div className="absolute bottom-0 right-0 top-0 w-full max-w-sm">
        <div className="flex h-full flex-col border-l border-border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Version History
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <button
              type="button"
              onClick={onCreateSnapshot}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Camera className="h-3 w-3" />
              Create Snapshot
            </button>

            {selectedIds.length === 2 && (
              <button
                type="button"
                onClick={handleDiff}
                disabled={diffLoading}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                <GitCompare className="h-3 w-3" />
                {diffLoading ? "Computing..." : "Compare"}
              </button>
            )}
          </div>

          {/* Diff view */}
          {diff && (
            <div className="border-b border-border px-4 py-3">
              <DiffSummary diff={diff} />
            </div>
          )}

          {/* Selection hint */}
          {selectedIds.length === 1 && (
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs text-foreground-muted">
              <ChevronRight className="h-3 w-3" />
              Select one more version to compare
            </div>
          )}

          {/* Version timeline */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {sortedVersions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-3 h-8 w-8 text-foreground-muted" />
                <p className="text-sm text-foreground-muted">
                  No versions yet
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Create a snapshot to start tracking changes
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedVersions.map((entry) => (
                  <VersionRow
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedIds.includes(entry.id)}
                    onSelect={handleSelect}
                    onRestore={onRestore}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
