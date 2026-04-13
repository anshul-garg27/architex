'use client';

import { memo, useCallback, useRef, useState } from 'react';
import {
  X,
  GitCompareArrows,
  Plus,
  Minus,
  Pencil,
  Upload,
  ChevronDown,
  ChevronRight,
  FileJson,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useSnapshotStore } from '@/stores/snapshot-store';
import {
  diffArchitectures,
  type DiffResult,
} from '@/lib/simulation/architecture-diff';
import { importFromJSON, type DiagramJSON } from '@/lib/export/to-json';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ────────────────────────────────────────────────────

interface DiffPanelProps {
  onClose: () => void;
}

// ── Section for collapsible diff groups ─────────────────────

interface DiffSectionProps {
  title: string;
  count: number;
  variant: 'added' | 'removed' | 'modified';
  children: React.ReactNode;
}

function DiffSection({ title, count, variant, children }: DiffSectionProps) {
  const [open, setOpen] = useState(true);

  const variantStyles = {
    added: {
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    removed: {
      badge: 'bg-red-500/15 text-red-400 border-red-500/30',
      dot: 'bg-red-400',
    },
    modified: {
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
    },
  }[variant];

  if (count === 0) return null;

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-foreground">{title}</span>
        <Badge
          className={cn(
            'ml-auto h-5 min-w-[20px] justify-center rounded-full border px-1.5 text-[10px]',
            variantStyles.badge,
          )}
        >
          {count}
        </Badge>
      </button>
      {open && <div className="ml-5 flex flex-col gap-1 pb-2">{children}</div>}
    </div>
  );
}

// ── Main panel ──────────────────────────────────────────────

export const DiffPanel = memo(function DiffPanel({ onClose }: DiffPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const snapshots = useSnapshotStore((s) => s.snapshots);

  const [result, setResult] = useState<DiffResult | null>(null);
  const [compareSource, setCompareSource] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare with a snapshot
  const handleCompareSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (!snapshot) return;

      const diff = diffArchitectures(
        snapshot.nodes,
        snapshot.edges,
        nodes,
        edges,
      );
      setResult(diff);
      setCompareSource(snapshot.label);
      setDropdownOpen(false);
    },
    [snapshots, nodes, edges],
  );

  // Compare with imported JSON
  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string) as DiagramJSON;
          const imported = importFromJSON(json);
          const diff = diffArchitectures(
            imported.nodes,
            imported.edges,
            nodes,
            edges,
          );
          setResult(diff);
          setCompareSource(json.name || file.name);
          setDropdownOpen(false);
        } catch {
          // Silently handle parse errors
        }
      };
      reader.readAsText(file);

      // Reset so the same file can be re-imported
      e.target.value = '';
    },
    [nodes, edges],
  );

  const hasSnapshots = snapshots.length > 0;
  const totalChanges = result
    ? result.addedNodes.length +
      result.removedNodes.length +
      result.modifiedNodes.length +
      result.addedEdges.length +
      result.removedEdges.length
    : 0;

  return (
    <div
      className={cn(
        'pointer-events-auto',
        'absolute right-4 top-4 z-50',
        'flex w-full max-w-[340px] flex-col',
        'rounded-xl border border-border bg-surface/95 shadow-2xl backdrop-blur-lg',
        'max-h-[calc(100vh-120px)] overflow-hidden',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-foreground">
            Architecture Diff
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Compare source selector ── */}
      <div className="border-b border-border px-4 py-3">
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Compare with
        </label>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-border bg-surface/60 px-3 py-2 text-left text-sm transition-colors',
              'hover:border-primary/40',
            )}
          >
            <span
              className={cn(
                compareSource
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {compareSource || 'Select snapshot or import JSON...'}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-10 w-full rounded-lg border border-border bg-surface shadow-xl">
              {/* Snapshots */}
              {hasSnapshots && (
                <div className="border-b border-border p-1">
                  <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Snapshots
                  </span>
                  {snapshots.map((snap) => (
                    <button
                      key={snap.id}
                      onClick={() => handleCompareSnapshot(snap.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
                    >
                      <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate text-foreground">
                        {snap.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {snap.nodeCount}n / {snap.edgeCount}e
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Import JSON */}
              <div className="p-1">
                <button
                  onClick={handleImportJSON}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
                >
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">Import JSON file...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          aria-label="Import JSON file for diff comparison"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Scrollable content ── */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3">
          {!result ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Select a snapshot or import a JSON file to compare against the
              current canvas.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Summary */}
              <div className="rounded-lg bg-sky-500/5 px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-sky-400">
                    Summary
                  </span>
                  <Badge
                    className={cn(
                      'h-5 rounded-full border px-1.5 text-[10px]',
                      totalChanges === 0
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                        : 'border-sky-500/30 bg-sky-500/15 text-sky-400',
                    )}
                  >
                    {totalChanges === 0
                      ? 'Identical'
                      : `${totalChanges} change${totalChanges !== 1 ? 's' : ''}`}
                  </Badge>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {result.summary.map((line, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Added nodes */}
              <DiffSection
                title="Added Nodes"
                count={result.addedNodes.length}
                variant="added"
              >
                {result.addedNodes.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                  >
                    <Plus className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">{name}</span>
                  </div>
                ))}
              </DiffSection>

              {/* Removed nodes */}
              <DiffSection
                title="Removed Nodes"
                count={result.removedNodes.length}
                variant="removed"
              >
                {result.removedNodes.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                  >
                    <Minus className="h-3 w-3 text-red-400" />
                    <span className="text-red-300">{name}</span>
                  </div>
                ))}
              </DiffSection>

              {/* Modified nodes */}
              <DiffSection
                title="Modified Nodes"
                count={result.modifiedNodes.length}
                variant="modified"
              >
                {result.modifiedNodes.map((mod, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 rounded-md border border-amber-500/10 bg-amber-500/5 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Pencil className="h-3 w-3 text-amber-400" />
                      <span className="font-medium text-amber-300">
                        {mod.id}
                      </span>
                    </div>
                    <ul className="ml-5 flex flex-col gap-0.5">
                      {mod.changes.map((change, j) => (
                        <li
                          key={j}
                          className="text-[11px] text-muted-foreground"
                        >
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </DiffSection>

              {/* Added edges */}
              <DiffSection
                title="Added Connections"
                count={result.addedEdges.length}
                variant="added"
              >
                {result.addedEdges.map((desc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                  >
                    <Plus className="h-3 w-3 text-emerald-400" />
                    <span className="truncate text-emerald-300">{desc}</span>
                  </div>
                ))}
              </DiffSection>

              {/* Removed edges */}
              <DiffSection
                title="Removed Connections"
                count={result.removedEdges.length}
                variant="removed"
              >
                {result.removedEdges.map((desc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                  >
                    <Minus className="h-3 w-3 text-red-400" />
                    <span className="truncate text-red-300">{desc}</span>
                  </div>
                ))}
              </DiffSection>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
