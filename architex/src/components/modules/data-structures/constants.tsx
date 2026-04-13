"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Play,
  Hash,
  Binary,
  Layers,
  TreePine,
} from "lucide-react";
import type { DSCategory, DSStep, DSHighlightState } from "@/lib/data-structures";

// ── Category icons + grouping ──────────────────────────────

export const CATEGORY_META: Record<DSCategory, { label: string; icon: React.ReactNode }> = {
  linear: { label: "Linear", icon: <Layers className="h-3 w-3" /> },
  tree: { label: "Tree", icon: <TreePine className="h-3 w-3" /> },
  hash: { label: "Hash", icon: <Hash className="h-3 w-3" /> },
  heap: { label: "Heap", icon: <Layers className="h-3 w-3" /> },
  probabilistic: { label: "Probabilistic", icon: <Binary className="h-3 w-3" /> },
  system: { label: "System", icon: <Boxes className="h-3 w-3" /> },
};

// ── Highlight colors ───────────────────────────────────────

export const DS_COLORS: Record<DSHighlightState, string> = {
  default: "var(--ds-default)",
  comparing: "var(--ds-comparing)",
  visiting: "var(--ds-visiting)",
  visited: "var(--ds-visited)",
  inserting: "var(--ds-inserting)",
  done: "var(--ds-done)",
  deleting: "var(--ds-deleting)",
  shifting: "var(--ds-shifting)",
  found: "var(--ds-found)",
  hashing: "var(--ds-hashing)",
  "already-set": "var(--ds-already-set)",
  setting: "var(--ds-setting)",
  "not-found": "var(--ds-not-found)",
  updating: "var(--ds-updating)",
  targeting: "var(--ds-comparing)",
  merging: "var(--ds-visiting)",
  splitting: "var(--ds-shifting)",
  rotating: "var(--ds-inserting)",
  rebalancing: "var(--ds-shifting)",
  "in-flight": "var(--ds-visiting)",
  miss: "var(--ds-not-found)",
  receiving: "var(--ds-done)",
  sending: "var(--ds-inserting)",
  removed: "var(--ds-deleting)",
};

// Resolved hex values for contexts requiring computed colors (SVG opacity tricks, etc.)
export const DS_COLORS_HEX: Record<DSHighlightState, string> = {
  default: "#6b7280",
  comparing: "#3b82f6",
  visiting: "#f59e0b",
  visited: "#86efac",
  inserting: "#a855f7",
  done: "#22c55e",
  deleting: "#ef4444",
  shifting: "#f97316",
  found: "#06b6d4",
  hashing: "#ec4899",
  "already-set": "#6b7280",
  setting: "#a855f7",
  "not-found": "#ef4444",
  updating: "#f59e0b",
  targeting: "#3b82f6",
  merging: "#f59e0b",
  splitting: "#f97316",
  rotating: "#a855f7",
  rebalancing: "#f97316",
  "in-flight": "#f59e0b",
  miss: "#ef4444",
  receiving: "#22c55e",
  sending: "#a855f7",
  removed: "#ef4444",
};

/** Returns a hex color with 25% opacity (the "40" hex alpha) for highlight backgrounds.
 *  Falls back to DS_COLORS_HEX since CSS var() cannot be concatenated with hex alpha. */
export function dsColorBg(hl: DSHighlightState, fallback = "transparent"): string {
  if (hl === "default") return fallback;
  const hex = DS_COLORS_HEX[hl] ?? DS_COLORS_HEX.default;
  return hex + "40";
}

// ── Legend states per DS category (DST-161) ──────────────

export const DS_LEGEND_STATES: Record<string, DSHighlightState[]> = {
  array: ["comparing", "shifting", "inserting", "done", "deleting", "found"],
  stack: ["comparing", "inserting", "done", "deleting", "found"],
  queue: ["comparing", "inserting", "done", "deleting", "found"],
  "linked-list": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "hash-table": ["hashing", "visiting", "comparing", "inserting", "done", "found", "deleting"],
  bst: ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  "bloom-filter": ["hashing", "setting", "already-set"],
  "skip-list": ["comparing", "visiting", "inserting", "done", "found", "deleting"],
  heap: ["comparing", "visiting", "inserting", "done", "deleting", "found", "shifting"],
  trie: ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  "union-find": ["comparing", "visiting", "visited", "inserting", "done", "found"],
  "lsm-tree": ["inserting", "visiting", "comparing", "done", "found", "deleting"],
  "consistent-hash": ["hashing", "visiting", "inserting", "done", "deleting"],
  "merkle-tree": ["comparing", "visiting", "visited", "done", "not-found"],
  "count-min-sketch": ["hashing", "updating", "done", "found"],
  hyperloglog: ["hashing", "updating", "done"],
  deque: ["inserting", "deleting", "done", "found"],
  "circular-buffer": ["inserting", "deleting", "done", "found", "visiting"],
  wal: ["inserting", "visiting", "done", "deleting", "found"],
  rope: ["comparing", "visiting", "inserting", "done", "deleting"],
  "r-tree": ["comparing", "visiting", "inserting", "done", "found"],
  quadtree: ["comparing", "visiting", "inserting", "done", "found"],
  "fibonacci-heap": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "avl-tree": ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  "red-black-tree": ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  "segment-tree": ["comparing", "visiting", "updating", "done", "found"],
  "bplus-tree": ["comparing", "visiting", "inserting", "done", "found", "deleting"],
  "fenwick-tree": ["comparing", "visiting", "updating", "done", "found"],
  "splay-tree": ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  crdt: ["inserting", "updating", "done", "visiting"],
  "vector-clock": ["inserting", "visiting", "done", "comparing"],
  treap: ["comparing", "visiting", "visited", "inserting", "done", "deleting", "found"],
  "binomial-heap": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "b-tree": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "doubly-linked-list": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "priority-queue": ["comparing", "visiting", "inserting", "done", "deleting", "found"],
  "lru-cache": ["comparing", "inserting", "done", "deleting", "found", "shifting"],
  "cuckoo-hash": ["targeting", "comparing", "shifting", "done", "deleting", "found"],
  "monotonic-stack": ["comparing", "inserting", "done", "deleting", "found"],
};

export const DSColorLegend = memo(function DSColorLegend({ activeStates }: { activeStates: DSHighlightState[] }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-border/30">
      {activeStates.map((state) => (
        <div key={state} className="flex items-center gap-1 rounded-lg bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/20">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DS_COLORS[state] }}
          />
          <span className="text-[10px] text-foreground-muted capitalize">{state.replace("-", " ")}</span>
        </div>
      ))}
    </div>
  );
});

// ── Reduced motion support ────────────────────────────────

export const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export const ANIM_DURATION = prefersReducedMotion ? 0 : 0.3;

// ── DST-176: Spring physics animations ───────────────────

export const DS_SPRINGS = {
  snappy: { type: "spring" as const, damping: 25, stiffness: 400 },
  bouncy: { type: "spring" as const, damping: 20, stiffness: 300 },
  smooth: { type: "spring" as const, damping: 30, stiffness: 200 },
  instant: { duration: 0 },
};

export const DS_TRANSITION = prefersReducedMotion ? DS_SPRINGS.instant : DS_SPRINGS.snappy;
export const DS_TRANSITION_BOUNCY = prefersReducedMotion ? DS_SPRINGS.instant : DS_SPRINGS.bouncy;

// ── DST-199: Empty state with demo button ─────────────────

export const DEMO_LABELS: Record<string, string> = {
  bst: "Watch Insert Demo",
  "avl-tree": "Watch Insert Demo",
  "red-black-tree": "Watch Insert Demo",
  heap: "Build a Heap",
  "hash-table": "See Hashing in Action",
  trie: "Watch Prefix Sharing",
};

export const EmptyStateWithDemo = memo(function EmptyStateWithDemo({
  message,
  demoLabel,
  onDemo,
}: {
  message: string;
  demoLabel?: string;
  onDemo?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <p className="text-sm text-foreground-muted">{message}</p>
      {onDemo && demoLabel && (
        <button
          onClick={onDemo}
          className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(110,86,207,0.2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <Play className="h-3 w-3" />
          {demoLabel}
        </button>
      )}
    </div>
  );
});

export function getHighlight(stepIdx: number, steps: DSStep[], targetId: string): DSHighlightState {
  if (stepIdx < 0 || stepIdx >= steps.length) return "default";
  const s = steps[stepIdx];
  for (const m of s.mutations) {
    if (m.targetId === targetId && m.property === "highlight") {
      return String(m.to) as DSHighlightState;
    }
  }
  return "default";
}

// ── DST-155: Inline feedback component ───────────────────

export function DSFeedback({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-sm shadow-lg z-50 backdrop-blur-sm",
        type === 'success' && "bg-green-500/20 text-green-400 border border-green-500/30",
        type === 'error' && "bg-red-500/20 text-red-400 border border-red-500/30",
        type === 'info' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      )}
    >
      {message}
    </motion.div>
  );
}
