"use client";

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "./constants";
import type { ActiveDS } from "./types";
import type { DSConfig, DSCategory } from "@/lib/data-structures/types";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
import { getModuleProgress } from "@/lib/progress/module-progress";
import { BadgeStrip } from "@/components/modules/data-structures/Badges";

// ── DST-168: Lightweight streak hook ──────────────────────────
function useDSStreak(): number {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(parseInt(localStorage.getItem('architex-ds-streak') || '0', 10));
  }, []);
  return streak;
}

const DSSidebar = memo(function DSSidebar({
  activeDS,
  onSelect,
}: {
  activeDS: ActiveDS;
  onSelect: (id: ActiveDS) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const activeRef = useRef<HTMLButtonElement>(null);
  const streak = useDSStreak();

  // DST-099: Read explored features from progress tracking
  const progress = useMemo(() => getModuleProgress("data-structures"), []);
  const exploredSet = useMemo(() => new Set(progress.featuresExplored), [progress.featuresExplored]);

  // DST-200: Filter catalog by search term
  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return DS_CATALOG;
    return DS_CATALOG.filter(ds => ds.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, DSConfig[]> = {};
    for (const ds of filteredCatalog) {
      (groups[ds.category] ??= []).push(ds);
    }
    return groups;
  }, [filteredCatalog]);

  // Auto-expand category containing active DS + scroll into view
  const activeCat = useMemo(() => {
    const ds = DS_CATALOG.find((d) => d.id === activeDS);
    return ds?.category ?? null;
  }, [activeDS]);

  // Ensure active category is never collapsed
  const getCollapsed = useCallback((cat: string) => {
    if (cat === activeCat) return false;
    return collapsed[cat] ?? false;
  }, [collapsed, activeCat]);

  return (
    <nav role="navigation" aria-label="Data structure selector" data-onboarding="ds-sidebar" className="flex h-full flex-col">
      <div className="border-b border-sidebar-border/30 px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Data Structures
        </h2>
        <div className="mt-1 text-[10px] text-foreground-subtle">{DS_CATALOG.length} structures &middot; {progress.explored}/{progress.total} explored</div>
        {streak > 0 && (
          <div className="mt-0.5 text-[10px] text-foreground-subtle">
            \uD83D\uDD25 {streak} day streak
          </div>
        )}
        <BadgeStrip />
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {/* DST-200: Sidebar search/filter */}
        <input
          placeholder="Search..."
          className="w-full h-7 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 text-xs mb-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {Object.entries(grouped).map(([cat, items]) => {
          const meta = CATEGORY_META[cat as DSCategory] ?? { label: cat, icon: null };
          const isCollapsed = getCollapsed(cat);
          const hasActive = items.some((ds) => ds.id === activeDS);

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [cat]: !isCollapsed }))}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider transition-colors hover:bg-accent/50",
                  hasActive ? "bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent" : "text-foreground-muted",
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                )}
                {meta.icon}
                <span className="flex-1">{meta.label}</span>
                <span className="text-[9px] font-normal text-foreground-subtle">{items.length}</span>
              </button>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-2 overflow-hidden"
                  >
                    <div className="space-y-0.5 py-0.5">
                      {items.map((ds) => (
                        <button
                          key={ds.id}
                          ref={ds.id === activeDS ? activeRef : undefined}
                          tabIndex={0}
                          aria-current={activeDS === ds.id ? "true" : undefined}
                          onClick={() => onSelect(ds.id as ActiveDS)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                            activeDS === ds.id
                              ? "bg-primary/10 text-primary font-medium shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                              : "text-foreground-muted hover:bg-accent/50 hover:text-foreground",
                          )}
                    >
                      <span className="flex-1 text-left">{ds.name}</span>
                      {exploredSet.has(ds.id) && (
                        <Check className="h-3 w-3 shrink-0 text-green-500" aria-label="Explored" />
                      )}
                    </button>
                  ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </nav>
  );
});

export { DSSidebar };
