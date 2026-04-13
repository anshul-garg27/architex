"use client";

import React, { memo, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronRight, GraduationCap } from "lucide-react";
import { DS_CATALOG } from "@/lib/data-structures/catalog";

// ── Data ────────────────────────────────────────────────────────

type Importance = "essential" | "important" | "know-concept" | "advanced";

interface Topic {
  ds: string;
  importance: Importance;
  leetcodeCount: number;
}

interface Week {
  week: number;
  title: string;
  topics: Topic[];
}

const INTERVIEW_PATH: { weeks: Week[] } = {
  weeks: [
    {
      week: 1,
      title: "Fundamentals",
      topics: [
        { ds: "array", importance: "essential", leetcodeCount: 50 },
        { ds: "hash-table", importance: "essential", leetcodeCount: 80 },
        { ds: "stack", importance: "essential", leetcodeCount: 30 },
        { ds: "queue", importance: "essential", leetcodeCount: 20 },
        { ds: "linked-list", importance: "essential", leetcodeCount: 40 },
        { ds: "doubly-linked-list", importance: "important", leetcodeCount: 15 },
      ],
    },
    {
      week: 2,
      title: "Trees & Heaps",
      topics: [
        { ds: "bst", importance: "essential", leetcodeCount: 60 },
        { ds: "heap", importance: "essential", leetcodeCount: 35 },
        { ds: "priority-queue", importance: "essential", leetcodeCount: 25 },
        { ds: "trie", importance: "important", leetcodeCount: 20 },
        { ds: "lru-cache", importance: "essential", leetcodeCount: 10 },
      ],
    },
    {
      week: 3,
      title: "Advanced Trees & Graphs",
      topics: [
        { ds: "avl-tree", importance: "know-concept", leetcodeCount: 5 },
        { ds: "red-black-tree", importance: "know-concept", leetcodeCount: 0 },
        { ds: "union-find", importance: "important", leetcodeCount: 25 },
        { ds: "monotonic-stack", importance: "important", leetcodeCount: 15 },
        { ds: "segment-tree", importance: "advanced", leetcodeCount: 10 },
      ],
    },
    {
      week: 4,
      title: "System Design DS",
      topics: [
        { ds: "bloom-filter", importance: "important", leetcodeCount: 0 },
        { ds: "consistent-hash", importance: "important", leetcodeCount: 0 },
        { ds: "lsm-tree", importance: "know-concept", leetcodeCount: 0 },
        { ds: "skip-list", importance: "know-concept", leetcodeCount: 0 },
        { ds: "b-tree", importance: "know-concept", leetcodeCount: 0 },
      ],
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────

const IMPORTANCE_CONFIG: Record<
  Importance,
  { label: string; bg: string; text: string }
> = {
  essential: { label: "Essential", bg: "bg-red-500/15", text: "text-red-400" },
  important: {
    label: "Important",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
  },
  "know-concept": {
    label: "Know Concept",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
  },
  advanced: {
    label: "Advanced",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
  },
};

const DS_NAME_MAP: Record<string, string> = Object.fromEntries(
  DS_CATALOG.map((d) => [d.id, d.name]),
);

function dsLabel(id: string): string {
  return DS_NAME_MAP[id] ?? id;
}

// ── Storage key for explored state ──────────────────────────────
const STORAGE_KEY = "architex-interview-explored";

function loadExplored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveExplored(s: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    /* silently fail */
  }
}

// ── Component ───────────────────────────────────────────────────

const InterviewPath = memo(function InterviewPath() {
  const [explored, setExplored] = useState<Set<string>>(loadExplored);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

  const toggle = (ds: string) => {
    setExplored((prev) => {
      const next = new Set(prev);
      if (next.has(ds)) next.delete(ds);
      else next.add(ds);
      saveExplored(next);
      return next;
    });
  };

  const weekProgress = useMemo(
    () =>
      INTERVIEW_PATH.weeks.map((w) => {
        const done = w.topics.filter((t) => explored.has(t.ds)).length;
        return { done, total: w.topics.length, pct: Math.round((done / w.topics.length) * 100) };
      }),
    [explored],
  );

  const totalDone = weekProgress.reduce((a, w) => a + w.done, 0);
  const totalTopics = weekProgress.reduce((a, w) => a + w.total, 0);

  return (
    <div className="flex h-full flex-col gap-3 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            FAANG Interview Prep
          </span>
        </div>
        <span className="text-xs text-foreground-muted">
          {totalDone}/{totalTopics} explored
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.round((totalDone / totalTopics) * 100)}%` }}
        />
      </div>

      {/* Weeks */}
      <div className="flex flex-1 flex-col gap-2 overflow-auto">
        {INTERVIEW_PATH.weeks.map((week, wi) => {
          const progress = weekProgress[wi];
          const isExpanded = expandedWeek === week.week;
          return (
            <div
              key={week.week}
              className="rounded-lg border border-border bg-surface-raised/50"
            >
              {/* Week header */}
              <button
                onClick={() =>
                  setExpandedWeek(isExpanded ? -1 : week.week)
                }
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform duration-200",
                    isExpanded && "rotate-90",
                  )}
                />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                  Week {week.week}: {week.title}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    progress.pct === 100
                      ? "text-green-400"
                      : "text-foreground-muted",
                  )}
                >
                  {progress.done}/{progress.total}
                </span>
              </button>

              {/* Expanded topic list */}
              {isExpanded && (
                <div className="border-t border-border px-3 pb-2 pt-1">
                  {week.topics.map((topic) => {
                    const done = explored.has(topic.ds);
                    const cfg = IMPORTANCE_CONFIG[topic.importance];
                    return (
                      <button
                        key={topic.ds}
                        onClick={() => toggle(topic.ds)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
                          "hover:bg-surface-raised",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-xs font-medium",
                            done
                              ? "text-foreground-muted line-through"
                              : "text-foreground",
                          )}
                        >
                          {dsLabel(topic.ds)}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                            cfg.bg,
                            cfg.text,
                          )}
                        >
                          {cfg.label}
                        </span>
                        {topic.leetcodeCount > 0 && (
                          <span className="text-[10px] text-foreground-muted">
                            {topic.leetcodeCount} LC
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-2">
        {(
          Object.entries(IMPORTANCE_CONFIG) as [
            Importance,
            (typeof IMPORTANCE_CONFIG)[Importance],
          ][]
        ).map(([key, cfg]) => (
          <span
            key={key}
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
              cfg.bg,
              cfg.text,
            )}
          >
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
});

export { InterviewPath };
