"use client";

/**
 * PatternComparisonOverlay — Full-screen side-by-side comparison of two patterns (LLD-404).
 *
 * Features:
 *   - Two dropdowns to select Pattern A and Pattern B
 *   - Side-by-side compact class diagrams (class names, attributes, methods)
 *   - Statistics: class count, relationship count
 *   - confusedWith difference text when the pair references each other
 *   - whenToUse comparison for each pattern
 *   - Pre-selects confusedWith suggestions from the current pattern
 *   - Responsive: stacks vertically on < 1024px
 */

import React, { memo, useState, useMemo, useCallback } from "react";
import {
  X,
  Columns2,
  ChevronDown,
  Layers,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern, UMLClass, UMLRelationship } from "@/lib/lld";
import { CATEGORY_LABELS } from "../constants";

// ── Types ───────────────────────────────────────────────────

interface PatternComparisonOverlayProps {
  patterns: DesignPattern[];
  initialPatternA: DesignPattern | null;
  onExit: () => void;
}

// ── Helpers ─────────────────────────────────────────────────

function countByType(rels: UMLRelationship[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rels) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
  }
  return counts;
}

function stereotypeColor(s: UMLClass["stereotype"]): string {
  switch (s) {
    case "interface": return "var(--lld-stereo-interface)";
    case "abstract": return "var(--lld-stereo-abstract)";
    case "enum": return "var(--lld-stereo-enum)";
    default: return "var(--lld-stereo-class)";
  }
}

const VISIBILITY_SYM: Record<string, string> = { "+": "+", "-": "\u2212", "#": "#", "~": "~" };

// ── Mini Class Diagram ──────────────────────────────────────

const MiniClassDiagram = memo(function MiniClassDiagram({
  classes,
  relationships,
}: {
  classes: UMLClass[];
  relationships: UMLRelationship[];
}) {
  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-foreground-subtle">
        No classes defined
      </div>
    );
  }

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
      {classes.map((c) => {
        const color = stereotypeColor(c.stereotype);
        const inbound = relationships.filter((r) => r.target === c.id).length;
        const outbound = relationships.filter((r) => r.source === c.id).length;
        return (
          <div
            key={c.id}
            className="rounded-lg border bg-surface/80 backdrop-blur-sm overflow-hidden"
            style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}
          >
            {/* Header */}
            <div
              className="px-2.5 py-1.5 text-[10px] font-bold"
              style={{
                color,
                background: `color-mix(in srgb, ${color} 8%, transparent)`,
              }}
            >
              {c.stereotype !== "class" && (
                <span className="mr-1 opacity-60">&laquo;{c.stereotype}&raquo;</span>
              )}
              {c.name}
              {(inbound > 0 || outbound > 0) && (
                <span className="ml-1.5 text-[9px] font-normal opacity-50">
                  ({inbound} in / {outbound} out)
                </span>
              )}
            </div>
            {/* Attributes */}
            {c.attributes.length > 0 && (
              <div className="border-t px-2.5 py-1" style={{ borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}>
                {c.attributes.map((a, i) => (
                  <div key={i} className="truncate text-[9px] text-foreground-muted leading-relaxed">
                    <span className="opacity-50">{VISIBILITY_SYM[a.visibility] ?? a.visibility}</span>{" "}
                    {a.name}: {a.type}
                  </div>
                ))}
              </div>
            )}
            {/* Methods */}
            {c.methods.length > 0 && (
              <div className="border-t px-2.5 py-1" style={{ borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}>
                {c.methods.map((m, i) => (
                  <div key={i} className="truncate text-[9px] text-foreground-muted leading-relaxed">
                    <span className="opacity-50">{VISIBILITY_SYM[m.visibility] ?? m.visibility}</span>{" "}
                    {m.name}()
                    {m.returnType && <span className="opacity-50">: {m.returnType}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ── Pattern Dropdown ────────────────────────────────────────

const PatternDropdown = memo(function PatternDropdown({
  label,
  value,
  patterns,
  suggestedIds,
  onChange,
}: {
  label: string;
  value: DesignPattern | null;
  patterns: DesignPattern[];
  suggestedIds: string[];
  onChange: (p: DesignPattern) => void;
}) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const suggested = suggestedIds.length > 0
      ? patterns.filter((p) => suggestedIds.includes(p.id))
      : [];
    return { suggested, all: patterns };
  }, [patterns, suggestedIds]);

  const handleSelect = useCallback(
    (p: DesignPattern) => {
      onChange(p);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[11px] font-medium transition-all backdrop-blur-sm",
          value
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-accent hover:text-foreground",
        )}
      >
        <span className="truncate">
          {value ? value.name : `Select ${label}...`}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-border/30 bg-elevated shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {grouped.suggested.length > 0 && (
            <>
              <div className="sticky top-0 border-b border-border/20 bg-primary/5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
                Suggested (Commonly Confused)
              </div>
              {grouped.suggested.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors",
                    p.id === value?.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground-muted hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-primary/70">
                    {CATEGORY_LABELS[p.category]}
                  </span>
                  {p.name}
                </button>
              ))}
              <div className="border-b border-border/20" />
            </>
          )}
          <div className="sticky top-0 border-b border-border/20 bg-elevated/80 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground-subtle backdrop-blur-sm">
            All Patterns
          </div>
          {grouped.all.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors",
                p.id === value?.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground-muted hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-primary/70">
                {CATEGORY_LABELS[p.category]}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Stats Card ──────────────────────────────────────────────

function PatternStats({
  pattern,
}: {
  pattern: DesignPattern;
}) {
  const relCounts = countByType(pattern.relationships ?? []);
  return (
    <div className="flex flex-wrap gap-2 text-[10px]">
      <span className="rounded-lg border border-border/30 bg-elevated/50 px-2 py-1 font-medium text-foreground-muted backdrop-blur-sm">
        <Layers className="mr-1 inline h-3 w-3 opacity-50" />
        {pattern.classes?.length ?? 0} classes
      </span>
      {Object.entries(relCounts).map(([type, count]) => (
        <span key={type} className="rounded-lg border border-border/30 bg-elevated/50 px-2 py-1 font-medium text-foreground-muted backdrop-blur-sm">
          {count} {type}
        </span>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export const PatternComparisonOverlay = memo(function PatternComparisonOverlay({
  patterns,
  initialPatternA,
  onExit,
}: PatternComparisonOverlayProps) {
  const [patternA, setPatternA] = useState<DesignPattern | null>(initialPatternA);
  const [patternB, setPatternB] = useState<DesignPattern | null>(() => {
    // Pre-select first confusedWith pattern if available
    if (!initialPatternA?.confusedWith?.length) return null;
    const firstConfusedId = initialPatternA.confusedWith[0].patternId;
    return patterns.find((p) => p.id === firstConfusedId) ?? null;
  });

  // Suggested patterns for dropdowns based on confusedWith
  const suggestedForA = useMemo(() => {
    if (!patternB?.confusedWith) return [];
    return patternB.confusedWith.map((c) => c.patternId);
  }, [patternB]);

  const suggestedForB = useMemo(() => {
    if (!patternA?.confusedWith) return [];
    return patternA.confusedWith.map((c) => c.patternId);
  }, [patternA]);

  // Find bidirectional confusedWith text
  const confusedTextAtoB = useMemo(() => {
    if (!patternA || !patternB) return null;
    return patternA.confusedWith?.find((c) => c.patternId === patternB.id)?.difference ?? null;
  }, [patternA, patternB]);

  const confusedTextBtoA = useMemo(() => {
    if (!patternA || !patternB) return null;
    return patternB.confusedWith?.find((c) => c.patternId === patternA.id)?.difference ?? null;
  }, [patternA, patternB]);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onExit]);

  const bothSelected = patternA !== null && patternB !== null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Columns2 className="h-5 w-5 text-primary" />
          <h1 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-lg font-bold text-transparent">
            Pattern Comparison
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">ESC to exit</span>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-background/60 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-primary">
            Pattern A
          </label>
          <PatternDropdown
            label="Pattern A"
            value={patternA}
            patterns={patterns}
            suggestedIds={suggestedForA}
            onChange={setPatternA}
          />
        </div>
        <div className="flex items-end justify-center py-2 lg:px-4">
          <ArrowRight className="h-4 w-4 text-white/20 rotate-0 lg:rotate-0" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-violet-400">
            Pattern B
          </label>
          <PatternDropdown
            label="Pattern B"
            value={patternB}
            patterns={patterns}
            suggestedIds={suggestedForB}
            onChange={setPatternB}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!bothSelected ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <Columns2 className="h-10 w-10 text-white/10" />
              <p className="text-sm text-white/40">
                Select two patterns above to compare them side by side.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {/* Key Differences banner */}
            {(confusedTextAtoB || confusedTextBtoA) && (
              <div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <h3 className="mb-1 text-[11px] font-bold text-amber-400">
                      Commonly Confused
                    </h3>
                    {confusedTextAtoB && (
                      <p className="text-[11px] leading-relaxed text-amber-300/80">
                        {confusedTextAtoB}
                      </p>
                    )}
                    {confusedTextBtoA && confusedTextBtoA !== confusedTextAtoB && (
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-300/80">
                        {confusedTextBtoA}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-side diagrams */}
            <div className="flex flex-col lg:flex-row">
              {/* Pattern A */}
              <div className="flex-1 border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">
                    {CATEGORY_LABELS[patternA!.category]}
                  </span>
                  <h2 className="text-sm font-bold text-foreground">{patternA!.name}</h2>
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-foreground-muted">
                  {patternA!.description}
                </p>
                <PatternStats pattern={patternA!} />
                <div className="mt-3">
                  <MiniClassDiagram
                    classes={patternA!.classes ?? []}
                    relationships={patternA!.relationships ?? []}
                  />
                </div>
              </div>

              {/* Pattern B */}
              <div className="flex-1 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                    {CATEGORY_LABELS[patternB!.category]}
                  </span>
                  <h2 className="text-sm font-bold text-foreground">{patternB!.name}</h2>
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-foreground-muted">
                  {patternB!.description}
                </p>
                <PatternStats pattern={patternB!} />
                <div className="mt-3">
                  <MiniClassDiagram
                    classes={patternB!.classes ?? []}
                    relationships={patternB!.relationships ?? []}
                  />
                </div>
              </div>
            </div>

            {/* When to Use comparison table */}
            <div className="border-t border-white/10 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  When to Use
                </h3>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Pattern A when to use */}
                <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-3 backdrop-blur-sm">
                  <h4 className="mb-2 text-[10px] font-bold text-primary">
                    {patternA!.name}
                  </h4>
                  <ul className="space-y-1">
                    {(patternA!.whenToUse ?? []).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-muted">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Pattern B when to use */}
                <div className="flex-1 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 backdrop-blur-sm">
                  <h4 className="mb-2 text-[10px] font-bold text-violet-400">
                    {patternB!.name}
                  </h4>
                  <ul className="space-y-1">
                    {(patternB!.whenToUse ?? []).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-muted">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* When NOT to Use comparison */}
            {((patternA!.whenNotToUse?.length ?? 0) > 0 || (patternB!.whenNotToUse?.length ?? 0) > 0) && (
              <div className="border-t border-white/10 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    When NOT to Use
                  </h3>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 p-3 backdrop-blur-sm">
                    <h4 className="mb-2 text-[10px] font-bold text-primary">
                      {patternA!.name}
                    </h4>
                    <ul className="space-y-1">
                      {(patternA!.whenNotToUse ?? []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 p-3 backdrop-blur-sm">
                    <h4 className="mb-2 text-[10px] font-bold text-violet-400">
                      {patternB!.name}
                    </h4>
                    <ul className="space-y-1">
                      {(patternB!.whenNotToUse ?? []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
