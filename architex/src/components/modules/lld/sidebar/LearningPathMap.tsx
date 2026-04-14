"use client";

/**
 * LearningPathMap — compact 6-column grid showing all 36 patterns
 * with mastery status, color-coded tiles, prerequisite tooltips,
 * and a stats bar.
 *
 * Fetches from /api/learning-path?module=lld via TanStack Query.
 */

import React, { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern, PatternCategory } from "@/lib/lld";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ── Types ───────────────────────────────────────────────────

interface LearningPathNode {
  id: string;
  name: string;
  category: PatternCategory;
  difficulty: number;
  tier: number;
  prerequisites: string[];
  isMastered: boolean;
  isUnlocked: boolean;
  unmetPrerequisites: string[];
}

interface LearningPathResponse {
  path: LearningPathNode[];
  count: number;
  module: string;
}

// ── Category color stripe map ───────────────────────────────

const CATEGORY_STRIPE_COLORS: Record<PatternCategory, string> = {
  creational: "var(--lld-stereo-class)",
  structural: "var(--lld-stereo-interface)",
  behavioral: "var(--lld-stereo-abstract)",
  modern: "var(--lld-stereo-enum)",
  resilience: "var(--lld-solid-srp)",
  concurrency: "var(--lld-solid-ocp)",
  "ai-agent": "var(--lld-solid-lsp)",
};

// ── Tile status helpers ─────────────────────────────────────

type TileStatus = "not-started" | "started" | "mastered" | "gold" | "locked";

function getTileStatus(node: LearningPathNode): TileStatus {
  if (!node.isUnlocked && node.unmetPrerequisites.length > 0) return "locked";
  if (node.isMastered && node.prerequisites.length > 0 && node.isUnlocked) return "gold";
  if (node.isMastered) return "mastered";
  // "started" requires some interaction — since the API only tracks mastery,
  // we approximate: unlocked + not mastered + has prerequisites = likely started
  // For a pure not-started vs started distinction we'd need view tracking;
  // for now, treat all non-mastered unlocked as "not-started".
  return "not-started";
}

const STATUS_CLASSES: Record<TileStatus, string> = {
  "not-started":
    "border-border/30 bg-elevated/50 text-foreground-muted",
  started:
    "border-primary/40 bg-primary/5 text-primary ring-1 ring-primary/30",
  mastered:
    "border-green-500/40 bg-green-500/10 text-green-400",
  gold:
    "border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.15)]",
  locked:
    "border-border/20 bg-elevated/30 text-foreground-subtle opacity-60",
};

// ── Abbreviate long names ───────────────────────────────────

function abbreviate(name: string, maxLen = 16): string {
  if (name.length <= maxLen) return name;
  // Common abbreviations
  const abbrevs: Record<string, string> = {
    "Chain of Responsibility": "Chain/Resp",
    "Template Method": "Template M.",
    "Abstract Factory": "Abs. Factory",
    "Factory Method": "Factory M.",
    "Circuit Breaker": "Circuit Brk",
    "Rate Limiter": "Rate Lim.",
    "Thread Pool": "Thread Pool",
    "Producer Consumer": "Prod/Cons",
    "Multi-Agent Orchestration": "Multi-Agent",
    "Event Sourcing": "Evt Source",
  };
  if (abbrevs[name]) return abbrevs[name];
  return name.slice(0, maxLen - 1) + "\u2026";
}

// ── Fetch helper ────────────────────────────────────────────

async function fetchLearningPath(): Promise<LearningPathResponse> {
  const res = await fetch("/api/learning-path?module=lld");
  if (!res.ok) {
    throw new Error(`Failed to fetch learning path: ${res.status}`);
  }
  return res.json();
}

// ── Stats bar ───────────────────────────────────────────────

const StatsBar = memo(function StatsBar({
  nodes,
  dueCount,
}: {
  nodes: LearningPathNode[];
  dueCount: number;
}) {
  const mastered = nodes.filter((n) => n.isMastered).length;
  const total = nodes.length;

  return (
    <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
      <span className="text-[10px] font-medium text-foreground-muted">
        <span className="text-green-400 font-semibold">{mastered}</span>
        <span className="text-foreground-subtle">/{total} mastered</span>
      </span>
      {dueCount > 0 && (
        <span className="text-[10px] font-medium text-violet-400">
          {dueCount} due for review
        </span>
      )}
    </div>
  );
});

// ── Pattern Tile ────────────────────────────────────────────

const PatternTile = memo(function PatternTile({
  node,
  nameMap,
  onSelect,
}: {
  node: LearningPathNode;
  nameMap: Map<string, string>;
  onSelect: (patternId: string) => void;
}) {
  const status = getTileStatus(node);
  const stripeColor = CATEGORY_STRIPE_COLORS[node.category];
  const isLocked = status === "locked";

  const tooltipContent = useMemo(() => {
    if (!isLocked) return node.name;
    const prereqNames = node.unmetPrerequisites
      .map((id) => nameMap.get(id) ?? id)
      .join(", ");
    return `${node.name}\nRequires: ${prereqNames}`;
  }, [isLocked, node.name, node.unmetPrerequisites, nameMap]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => !isLocked && onSelect(node.id)}
          disabled={isLocked}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center transition-all",
            "min-h-[44px] w-full",
            STATUS_CLASSES[status],
            !isLocked && "hover:bg-accent/50 hover:text-foreground cursor-pointer",
            isLocked && "cursor-not-allowed",
          )}
        >
          {/* Category color stripe */}
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
            style={{ backgroundColor: stripeColor }}
          />
          {isLocked ? (
            <Lock className="h-3 w-3 mb-0.5" />
          ) : null}
          <span className="text-[10px] font-medium leading-tight truncate w-full px-0.5">
            {abbreviate(node.name)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[200px] text-xs whitespace-pre-line"
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
});

// ── Main Component ──────────────────────────────────────────

interface LearningPathMapProps {
  onSelectPattern: (pattern: DesignPattern) => void;
  patterns: DesignPattern[];
  dueReviewCount?: number;
}

export const LearningPathMap = memo(function LearningPathMap({
  onSelectPattern,
  patterns,
  dueReviewCount = 0,
}: LearningPathMapProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["learning-path", "lld"],
    queryFn: fetchLearningPath,
    staleTime: 60_000,
  });

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.path) {
      for (const node of data.path) {
        map.set(node.id, node.name);
      }
    }
    return map;
  }, [data]);

  const patternMap = useMemo(
    () => new Map(patterns.map((p) => [p.id, p])),
    [patterns],
  );

  const handleSelect = (patternId: string) => {
    const pattern = patternMap.get(patternId);
    if (pattern) onSelectPattern(pattern);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.path) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">
          Failed to load learning path.
        </p>
      </div>
    );
  }

  const nodes = data.path;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <StatsBar nodes={nodes} dueCount={dueReviewCount} />
        <div className="px-1">
          <div className="grid grid-cols-4 gap-1.5">
            {nodes.map((node) => (
              <PatternTile
                key={node.id}
                node={node}
                nameMap={nameMap}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-2 border-t border-border/30">
          <LegendItem color="border-border/30 bg-elevated/50" label="Not started" />
          <LegendItem color="border-green-500/40 bg-green-500/10" label="Mastered" />
          <LegendItem color="border-amber-400/40 bg-amber-400/10" label="Gold" />
          <LegendItem color="border-border/20 bg-elevated/30 opacity-60" label="Locked" />
        </div>
      </div>
    </TooltipProvider>
  );
});

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", color)} />
      <span className="text-[9px] text-foreground-subtle">{label}</span>
    </div>
  );
}
