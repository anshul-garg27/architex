"use client";

/**
 * BidirectionalSyncPanel -- Wires the bidirectional-sync.ts (325 lines) to a
 * split-view UI. UML diagram summary on the left, code editor on the right.
 *
 * - Editing code triggers `syncFromCode()` -> updates diagram summary
 * - Editing diagram triggers `syncFromDiagram()` -> updates code
 * - Uses SyncManager for diff detection (added/removed/modified classes)
 * - Shows diff indicators: green=added, red=removed, yellow=modified
 *
 * Integration: Add to LLDBottomPanelTabs in useLLDModuleImpl.tsx:
 *   import { BidirectionalSyncPanel } from "../panels/BidirectionalSyncPanel";
 *   // Add tab: { id: "bidi-sync", label: "Bidirectional Sync" }
 *   // Render: <BidirectionalSyncPanel /> in the matching tab case
 */

import React, { memo, useState, useCallback, useRef, useMemo } from "react";
import {
  ArrowLeftRight,
  Code2,
  LayoutPanelLeft,
  Plus,
  Minus,
  Pencil,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SyncManager,
  type SyncLanguage,
  type SyncResult,
} from "@/lib/lld/bidirectional-sync";
import type { UMLClass, UMLRelationship } from "@/lib/lld/types";
import { formatMethodParams } from "@/lib/lld/types";

// ── Types ───────────────────────────────────────────────────

interface ClassDiff {
  name: string;
  status: "added" | "removed" | "modified" | "unchanged";
}

interface SyncState {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  code: string;
  diffs: ClassDiff[];
  lastSyncDirection: "code-to-diagram" | "diagram-to-code" | null;
}

// ── Default seed data ───────────────────────────────────────

const SEED_CODE_TS = `interface Observer {
  update(subject: Subject): void;
}

class Subject {
  private observers: Observer[] = [];
  private state: number = 0;

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  notify(): void {
    for (const o of this.observers) {
      o.update(this);
    }
  }

  getState(): number {
    return this.state;
  }
}

class ConcreteObserver implements Observer {
  update(subject: Subject): void {
    console.log("State changed");
  }
}`;

const SEED_CODE_PY = `from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, subject: "Subject") -> None: ...

class Subject:
    def __init__(self) -> None:
        self._observers: list[Observer] = []
        self._state: int = 0

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def notify(self) -> None:
        for o in self._observers:
            o.update(self)

    def get_state(self) -> int:
        return self._state

class ConcreteObserver(Observer):
    def update(self, subject: Subject) -> None:
        print("State changed")`;

// ── Helpers ─────────────────────────────────────────────────

function buildDiffs(
  result: SyncResult,
  allClasses: UMLClass[],
): ClassDiff[] {
  const addedSet = new Set(result.added);
  const removedSet = new Set(result.removed);
  const modifiedSet = new Set(result.modified);

  const diffs: ClassDiff[] = allClasses.map((c) => {
    if (addedSet.has(c.name)) return { name: c.name, status: "added" as const };
    if (modifiedSet.has(c.name)) return { name: c.name, status: "modified" as const };
    return { name: c.name, status: "unchanged" as const };
  });

  // Add removed classes that are no longer in allClasses
  for (const name of result.removed) {
    diffs.push({ name, status: "removed" });
  }

  return diffs;
}

function statusColor(status: ClassDiff["status"]): string {
  switch (status) {
    case "added":
      return "text-emerald-400";
    case "removed":
      return "text-red-400";
    case "modified":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

function statusBg(status: ClassDiff["status"]): string {
  switch (status) {
    case "added":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "removed":
      return "bg-red-500/10 border-red-500/30";
    case "modified":
      return "bg-amber-500/10 border-amber-500/30";
    default:
      return "bg-zinc-800/50 border-zinc-700/50";
  }
}

function StatusIcon({ status }: { status: ClassDiff["status"] }) {
  switch (status) {
    case "added":
      return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
    case "removed":
      return <Minus className="h-3.5 w-3.5 text-red-400" />;
    case "modified":
      return <Pencil className="h-3.5 w-3.5 text-amber-400" />;
    default:
      return <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />;
  }
}

// ── Class Card (Diagram side) ───────────────────────────────

const ClassCard = memo(function ClassCard({
  cls,
  diff,
}: {
  cls: UMLClass;
  diff: ClassDiff;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 transition-colors",
        statusBg(diff.status),
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={diff.status} />
        <span className={cn("text-sm font-semibold", statusColor(diff.status))}>
          {cls.name}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500">
          {cls.stereotype}
        </span>
      </div>

      {cls.attributes.length > 0 && (
        <div className="mt-1.5 border-t border-zinc-700/50 pt-1.5">
          {cls.attributes.map((a) => (
            <div key={a.id} className="text-xs text-zinc-400">
              {a.visibility} {a.name}: {a.type}
            </div>
          ))}
        </div>
      )}

      {cls.methods.length > 0 && (
        <div className="mt-1 border-t border-zinc-700/50 pt-1">
          {cls.methods.map((m) => (
            <div key={m.id} className="text-xs text-zinc-400">
              {m.visibility} {m.name}({formatMethodParams(m.params)}): {m.returnType}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Removed Class Placeholder ───────────────────────────────

const RemovedClassCard = memo(function RemovedClassCard({
  name,
}: {
  name: string;
}) {
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 opacity-60">
      <div className="flex items-center gap-2">
        <Minus className="h-3.5 w-3.5 text-red-400" />
        <span className="text-sm font-semibold text-red-400 line-through">
          {name}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-red-500/60">
          removed
        </span>
      </div>
    </div>
  );
});

// ── Diff Summary Bar ────────────────────────────────────────

const DiffSummary = memo(function DiffSummary({
  diffs,
}: {
  diffs: ClassDiff[];
}) {
  const added = diffs.filter((d) => d.status === "added").length;
  const removed = diffs.filter((d) => d.status === "removed").length;
  const modified = diffs.filter((d) => d.status === "modified").length;

  if (added === 0 && removed === 0 && modified === 0) {
    return (
      <div className="text-xs text-zinc-500 italic">No changes detected</div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {added > 0 && (
        <span className="flex items-center gap-1 text-emerald-400">
          <Plus className="h-3 w-3" /> {added} added
        </span>
      )}
      {removed > 0 && (
        <span className="flex items-center gap-1 text-red-400">
          <Minus className="h-3 w-3" /> {removed} removed
        </span>
      )}
      {modified > 0 && (
        <span className="flex items-center gap-1 text-amber-400">
          <Pencil className="h-3 w-3" /> {modified} modified
        </span>
      )}
    </div>
  );
});

// ── Main Panel ──────────────────────────────────────────────

export const BidirectionalSyncPanel = memo(function BidirectionalSyncPanel() {
  const [language, setLanguage] = useState<SyncLanguage>("typescript");

  const syncManagerRef = useRef<SyncManager>(
    new SyncManager(language, "bidirectional"),
  );

  const [syncState, setSyncState] = useState<SyncState>({
    classes: [],
    relationships: [],
    code: language === "typescript" ? SEED_CODE_TS : SEED_CODE_PY,
    diffs: [],
    lastSyncDirection: null,
  });

  // ── Sync: Code -> Diagram ────────────────────────────────

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      const mgr = syncManagerRef.current;
      const result = mgr.syncFromCode(newCode);

      const classes = result.classes ?? [];
      const relationships = result.relationships ?? [];

      setSyncState({
        classes,
        relationships,
        code: newCode,
        diffs: buildDiffs(result, classes),
        lastSyncDirection: "code-to-diagram",
      });
    },
    [],
  );

  // ── Sync: Diagram -> Code (simulated edit via removing a class) ──

  const handleRemoveClass = useCallback(
    (className: string) => {
      setSyncState((prev) => {
        const newClasses = prev.classes.filter((c) => c.name !== className);
        const removedIds = new Set(
          prev.classes.filter((c) => c.name === className).map((c) => c.id),
        );
        const newRelationships = prev.relationships.filter(
          (r) => !removedIds.has(r.source) && !removedIds.has(r.target),
        );

        const mgr = syncManagerRef.current;
        const result = mgr.syncFromDiagram(newClasses, newRelationships);

        return {
          classes: newClasses,
          relationships: newRelationships,
          code: result.code ?? prev.code,
          diffs: buildDiffs(result, newClasses),
          lastSyncDirection: "diagram-to-code",
        };
      });
    },
    [],
  );

  // ── Initial sync from code ────────────────────────────────

  const handleInitialSync = useCallback(() => {
    const mgr = syncManagerRef.current;
    mgr.reset();
    const seedCode = language === "typescript" ? SEED_CODE_TS : SEED_CODE_PY;
    const result = mgr.syncFromCode(seedCode);

    const classes = result.classes ?? [];
    const relationships = result.relationships ?? [];

    setSyncState({
      classes,
      relationships,
      code: seedCode,
      diffs: buildDiffs(result, classes),
      lastSyncDirection: "code-to-diagram",
    });
  }, [language]);

  // ── Language toggle ───────────────────────────────────────

  const handleLanguageToggle = useCallback(() => {
    const next: SyncLanguage =
      language === "typescript" ? "python" : "typescript";
    setLanguage(next);
    const mgr = new SyncManager(next, "bidirectional");
    syncManagerRef.current = mgr;
    const seedCode = next === "typescript" ? SEED_CODE_TS : SEED_CODE_PY;
    const result = mgr.syncFromCode(seedCode);

    const classes = result.classes ?? [];
    const relationships = result.relationships ?? [];

    setSyncState({
      classes,
      relationships,
      code: seedCode,
      diffs: buildDiffs(result, classes),
      lastSyncDirection: "code-to-diagram",
    });
  }, [language]);

  // ── Diagram class list (sorted: changed first) ───────────

  const sortedDiffs = useMemo(() => {
    const order: Record<ClassDiff["status"], number> = {
      added: 0,
      modified: 1,
      removed: 2,
      unchanged: 3,
    };
    return [...syncState.diffs].sort(
      (a, b) => order[a.status] - order[b.status],
    );
  }, [syncState.diffs]);

  const classMap = useMemo(() => {
    const map = new Map<string, UMLClass>();
    for (const c of syncState.classes) map.set(c.name, c);
    return map;
  }, [syncState.classes]);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Bidirectional Sync
          </h3>
          {syncState.lastSyncDirection && (
            <span className="ml-2 rounded-xl bg-elevated/50 border border-border/30 px-1.5 py-0.5 text-[10px] text-foreground-subtle">
              Last:{" "}
              {syncState.lastSyncDirection === "code-to-diagram"
                ? "Code -> Diagram"
                : "Diagram -> Code"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DiffSummary diffs={syncState.diffs} />

          <button
            onClick={handleLanguageToggle}
            className="rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-xs text-foreground-muted transition-colors hover:bg-accent"
            aria-label={`Switch to ${language === "typescript" ? "Python" : "TypeScript"}`}
          >
            {language === "typescript" ? "TS" : "PY"}
          </button>

          <button
            onClick={handleInitialSync}
            className="rounded-xl border border-border/30 bg-elevated/50 p-1 text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Reset and sync from seed code"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Diagram Summary */}
        <div className="flex w-1/2 flex-col border-r border-border/30">
          <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-1.5">
            <LayoutPanelLeft className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">
              UML Diagram ({syncState.classes.length} classes)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {syncState.classes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-zinc-500">
                <LayoutPanelLeft className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-xs">No classes parsed yet.</p>
                <button
                  onClick={handleInitialSync}
                  className="mt-2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                >
                  Sync from Code
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedDiffs.map((diff) => {
                  if (diff.status === "removed") {
                    return (
                      <RemovedClassCard key={`removed-${diff.name}`} name={diff.name} />
                    );
                  }
                  const cls = classMap.get(diff.name);
                  if (!cls) return null;
                  return (
                    <div key={cls.id} className="group relative">
                      <ClassCard cls={cls} diff={diff} />
                      <button
                        onClick={() => handleRemoveClass(cls.name)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-red-600 p-0.5 text-white shadow group-hover:block"
                        aria-label={`Remove ${cls.name} from diagram`}
                        title="Remove class (triggers diagram-to-code sync)"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-1.5">
            <Code2 className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">
              Code Editor ({language === "typescript" ? "TypeScript" : "Python"})
            </span>
          </div>

          <div className="relative flex-1">
            <textarea
              className={cn(
                "h-full w-full resize-none bg-elevated/30 backdrop-blur-sm p-3 font-mono text-xs text-foreground-muted",
                "placeholder:text-foreground-subtle/40 focus:outline-none focus:ring-1 focus:ring-primary/40",
              )}
              value={syncState.code}
              onChange={handleCodeChange}
              spellCheck={false}
              aria-label={`${language === "typescript" ? "TypeScript" : "Python"} code editor. Edit to sync changes to the diagram.`}
              placeholder={`Write ${language === "typescript" ? "TypeScript" : "Python"} classes here...\nChanges sync to the diagram automatically.`}
            />
          </div>
        </div>
      </div>

      {/* Footer: Relationship Summary */}
      {syncState.relationships.length > 0 && (
        <div className="border-t border-border/30 px-4 py-1.5">
          <div className="flex flex-wrap gap-2 text-[10px] text-foreground-subtle">
            {syncState.relationships.map((r) => (
              <span key={r.id} className="rounded-xl bg-elevated/50 border border-border/30 px-1.5 py-0.5">
                {r.source} {"->"} {r.target}{" "}
                <span className="text-zinc-600">({r.type})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
