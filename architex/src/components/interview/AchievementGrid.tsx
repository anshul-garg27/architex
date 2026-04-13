"use client";

import React, { memo, useState, useMemo } from "react";
import {
  Lock,
  Rocket,
  GraduationCap,
  BookOpen,
  Eye,
  Lightbulb,
  Code,
  Database,
  TrendingUp,
  Shield,
  Scale,
  CircleDot,
  Flame,
  Calendar,
  CalendarCheck,
  Trophy,
  Star,
  Zap,
  Brain,
  Mountain,
  Compass,
  Crown,
  Clock,
  Award,
  Timer,
  ShieldCheck,
  LayoutGrid,
  Boxes,
  FileStack,
  Map,
  HardDrive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/lib/interview/achievements";
import type { Achievement } from "@/lib/interview/achievements";

// ── Icon mapping ──────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Rocket,
  GraduationCap,
  BookOpen,
  Eye,
  Lightbulb,
  Code,
  Database,
  TrendingUp,
  Shield,
  Scale,
  CircleDot,
  Flame,
  Calendar,
  CalendarCheck,
  Trophy,
  Star,
  Zap,
  Brain,
  Mountain,
  Compass,
  Crown,
  Clock,
  Award,
  Timer,
  ShieldCheck,
  LayoutGrid,
  Boxes,
  FileStack,
  Map,
  HardDrive,
  // Aliases for missing icons
  Bomb: Zap,
  Puzzle: Compass,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star;
}

// ── Category tabs ─────────────────────────────────────────────────

type CategoryFilter = "all" | Achievement["category"];

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "learning", label: "Learning" },
  { value: "design", label: "Design" },
  { value: "streak", label: "Streak" },
  { value: "mastery", label: "Mastery" },
  { value: "exploration", label: "Exploration" },
  { value: "social", label: "Social" },
];

// ── Category color mapping ────────────────────────────────────────

const CATEGORY_COLORS: Record<Achievement["category"], { bg: string; text: string }> = {
  learning: { bg: "bg-blue-500/15", text: "text-blue-400" },
  design: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  streak: { bg: "bg-orange-500/15", text: "text-orange-400" },
  mastery: { bg: "bg-purple-500/15", text: "text-purple-400" },
  exploration: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  social: { bg: "bg-pink-500/15", text: "text-pink-400" },
};

// ── Achievement Card ──────────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  earnedDate?: string;
}

const AchievementCard = memo(function AchievementCard({
  achievement,
  unlocked,
  earnedDate,
}: AchievementCardProps) {
  const Icon = getIcon(achievement.icon);
  const colors = CATEGORY_COLORS[achievement.category];

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-xl border p-3 transition-all duration-200",
        unlocked
          ? "border-zinc-700 bg-zinc-900/70 hover:border-zinc-600"
          : "border-zinc-800/50 bg-zinc-900/40 opacity-60",
      )}
    >
      {/* Icon and lock state */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            unlocked ? colors.bg : "bg-zinc-800",
          )}
        >
          {unlocked ? (
            <Icon className={cn("h-4.5 w-4.5", colors.text)} />
          ) : (
            <Lock className="h-4 w-4 text-zinc-600" />
          )}
        </div>
        <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
          +{achievement.xpReward} XP
        </span>
      </div>

      {/* Name & description */}
      <div>
        <h4
          className={cn(
            "text-sm font-semibold",
            unlocked ? "text-zinc-100" : "text-zinc-500",
          )}
        >
          {achievement.name}
        </h4>
        <p
          className={cn(
            "mt-0.5 text-xs leading-relaxed",
            unlocked ? "text-zinc-400" : "text-zinc-600",
          )}
        >
          {achievement.description}
        </p>
      </div>

      {/* Earned date or condition hint */}
      {unlocked && earnedDate ? (
        <p className="text-[10px] text-zinc-500">Earned {earnedDate}</p>
      ) : (
        <p className="text-[10px] italic text-zinc-600">{achievement.condition}</p>
      )}
    </div>
  );
});

// ── AchievementGrid ───────────────────────────────────────────────

export interface AchievementGridProps {
  earnedIds: string[];
  earnedDates?: Record<string, string>;
  className?: string;
}

const AchievementGrid = memo(function AchievementGrid({
  earnedIds,
  earnedDates = {},
  className,
}: AchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const earnedSet = useMemo(() => new Set(earnedIds), [earnedIds]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).length,
    [earnedSet],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Achievements</h3>
        <span className="text-xs text-zinc-500">
          {unlockedCount} / {ACHIEVEMENTS.length} unlocked
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeCategory === tab.value
                ? "bg-primary text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            unlocked={earnedSet.has(achievement.id)}
            earnedDate={earnedDates[achievement.id]}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-xs text-zinc-500">
          No achievements in this category yet.
        </p>
      )}
    </div>
  );
});

AchievementGrid.displayName = "AchievementGrid";

export default AchievementGrid;
