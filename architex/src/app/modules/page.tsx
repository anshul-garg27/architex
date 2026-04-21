"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Binary,
  Boxes,
  PenTool,
  Compass,
  Database,
  Network,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Brain,
  Trophy,
  Share2,
  Search,
  ArrowUpDown,
  Filter,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, easing, getStaggerDelay, slideUp } from "@/lib/constants/motion";
import { getModuleProgress } from "@/lib/progress/module-progress";
import type { ModuleType } from "@/stores/ui-store";

// ── Module definitions ─────────────────────────────────────────

type ModuleCategory = "Learning" | "Practice" | "Tools";

interface ModuleDefinition {
  id: ModuleType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  category: ModuleCategory;
  /**
   * If set, the card links here directly instead of routing through the
   * home-page module switcher. Used for modules that have their own
   * dedicated route tree (Blueprint).
   */
  href?: string;
}

const MODULES: ModuleDefinition[] = [
  {
    id: "system-design",
    label: "System Design",
    description: "Drag-and-drop architecture canvas with simulation and chaos testing",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bgGradient: "from-blue-500/10 to-blue-600/5",
    category: "Learning",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    description: "Step-through sorting, graph, tree, DP, and string algorithm visualizations",
    icon: Binary,
    color: "text-violet-400",
    bgGradient: "from-violet-500/10 to-violet-600/5",
    category: "Learning",
  },
  {
    id: "data-structures",
    label: "Data Structures",
    description: "Interactive arrays, linked lists, hash tables, BSTs, heaps, and more",
    icon: Boxes,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/10 to-emerald-600/5",
    category: "Learning",
  },
  {
    id: "lld",
    label: "Low-Level Design",
    description: "SOLID principles, design patterns, and class diagram generators",
    icon: PenTool,
    color: "text-amber-400",
    bgGradient: "from-amber-500/10 to-amber-600/5",
    category: "Learning",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    description: "A structured course in object-oriented design. 12 hand-authored units.",
    icon: Compass,
    color: "text-indigo-400",
    bgGradient: "from-indigo-500/10 to-sky-500/5",
    category: "Learning",
    href: "/modules/blueprint",
  },
  {
    id: "database",
    label: "Database",
    description: "Normalization, B-tree indexing, query plans, and transaction simulation",
    icon: Database,
    color: "text-green-400",
    bgGradient: "from-green-500/10 to-green-600/5",
    category: "Learning",
  },
  {
    id: "distributed",
    label: "Distributed Systems",
    description: "CAP theorem, consistent hashing, Raft, gossip protocols, CRDTs",
    icon: Network,
    color: "text-cyan-400",
    bgGradient: "from-cyan-500/10 to-cyan-600/5",
    category: "Learning",
  },
  {
    id: "networking",
    label: "Networking",
    description: "TCP state machine, TLS handshake, HTTP comparison, WebSocket lifecycle",
    icon: Globe,
    color: "text-purple-400",
    bgGradient: "from-purple-500/10 to-purple-600/5",
    category: "Learning",
  },
  {
    id: "os",
    label: "OS Concepts",
    description: "Page replacement, memory management, deadlock detection, scheduling",
    icon: Cpu,
    color: "text-orange-400",
    bgGradient: "from-orange-500/10 to-orange-600/5",
    category: "Learning",
  },
  {
    id: "concurrency",
    label: "Concurrency",
    description: "Producer-consumer, dining philosophers, event loop, thread lifecycle",
    icon: Layers,
    color: "text-teal-400",
    bgGradient: "from-teal-500/10 to-teal-600/5",
    category: "Learning",
  },
  {
    id: "security",
    label: "Security",
    description: "OAuth flows, JWT engine, AES encryption, Diffie-Hellman, HTTPS",
    icon: ShieldCheck,
    color: "text-red-400",
    bgGradient: "from-red-500/10 to-red-600/5",
    category: "Learning",
  },
  {
    id: "ml-design",
    label: "ML Design",
    description: "Neural networks, ML pipelines, serving patterns, and datasets",
    icon: Brain,
    color: "text-pink-400",
    bgGradient: "from-pink-500/10 to-pink-600/5",
    category: "Learning",
  },
  {
    id: "interview",
    label: "Interview Prep",
    description: "Timed challenges with rubric scoring, hints, and estimation pad",
    icon: Trophy,
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/10 to-yellow-600/5",
    category: "Practice",
  },
  {
    id: "knowledge-graph",
    label: "Knowledge Graph",
    description: "Explore concept relationships and prerequisite maps across modules",
    icon: Share2,
    color: "text-indigo-400",
    bgGradient: "from-indigo-500/10 to-indigo-600/5",
    category: "Tools",
  },
];

type SortKey = "name" | "progress" | "recently-used";

const CATEGORY_OPTIONS: ModuleCategory[] = ["Learning", "Practice", "Tools"];

// ── Progress Bar ───────────────────────────────────────────────

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: duration.deliberate, ease: easing.out, delay: 0.3 }}
        className="h-full rounded-full bg-primary"
      />
    </div>
  );
}

// ── Module Card ────────────────────────────────────────────────

function ModuleCard({
  module,
  progress,
  isNew,
  index,
}: {
  module: ModuleDefinition;
  progress: { percentage: number; explored: number; total: number; lastVisited: string | null };
  isNew: boolean;
  index: number;
}) {
  const Icon = module.icon;

  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("gridItems", index),
      }}
    >
      <Link
        href={module.href ?? "/"}
        className={cn(
          "group relative flex flex-col gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:shadow-lg",
          "bg-gradient-to-br",
          module.bgGradient,
        )}
      >
        {/* New badge */}
        {isNew && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            NEW
          </span>
        )}

        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-surface/80", module.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">{module.label}</h3>
            <span className="text-[10px] text-foreground-subtle">{module.category}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-foreground-muted">
          {module.description}
        </p>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-foreground-subtle">
              {progress.explored}/{progress.total} features
            </span>
            <span className="text-[10px] font-medium text-foreground-muted">
              {progress.percentage}%
            </span>
          </div>
          <ProgressBar percentage={progress.percentage} />
        </div>

        {/* Hover indicator */}
        <div className="flex items-center gap-1 text-xs text-foreground-subtle transition-colors group-hover:text-primary">
          <span>Enter module</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Modules Page ───────────────────────────────────────────────

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ModuleCategory | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [progressMap, setProgressMap] = useState<
    Record<string, { percentage: number; explored: number; total: number; lastVisited: string | null; visitCount: number }>
  >({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const map: typeof progressMap = {};
    for (const mod of MODULES) {
      const p = getModuleProgress(mod.id);
      map[mod.id] = p;
    }
    setProgressMap(map);
    setLoaded(true);
  }, []);

  const filteredModules = useMemo(() => {
    let result = [...MODULES];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (categoryFilter !== "All") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    // Sort
    if (sortKey === "name") {
      result.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortKey === "progress") {
      result.sort((a, b) => {
        const pa = progressMap[a.id]?.percentage ?? 0;
        const pb = progressMap[b.id]?.percentage ?? 0;
        return pb - pa;
      });
    } else if (sortKey === "recently-used") {
      result.sort((a, b) => {
        const la = progressMap[a.id]?.lastVisited ?? "";
        const lb = progressMap[b.id]?.lastVisited ?? "";
        return lb.localeCompare(la);
      });
    }

    return result;
  }, [searchQuery, categoryFilter, sortKey, progressMap]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.moderate, ease: easing.out }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Modules</h1>
              <p className="mt-1 text-sm text-foreground-muted">
                {MODULES.length} interactive engineering modules
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-foreground-muted transition-colors hover:text-foreground"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Filters row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search modules"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-foreground-subtle" />
            <div className="flex rounded-lg border border-border bg-surface">
              <button
                onClick={() => setCategoryFilter("All")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg",
                  categoryFilter === "All"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                All
              </button>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "border-l border-border px-3 py-1.5 text-xs font-medium transition-colors last:rounded-r-lg",
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-foreground-subtle" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort modules"
              className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="recently-used">Recently Used</option>
            </select>
          </div>
        </motion.div>

        {/* Module grid */}
        {filteredModules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                progress={progressMap[mod.id] ?? { percentage: 0, explored: 0, total: 0, lastVisited: null }}
                isNew={(progressMap[mod.id]?.visitCount ?? 0) === 0}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-10 w-10 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">No modules match your search</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("All");
              }}
              className="text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
