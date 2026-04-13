"use client";

import React, { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  CalendarCheck,
  LayoutGrid,
  Boxes,
  FileStack,
  Map,
  HardDrive,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, getAchievementProgress } from "@/lib/interview/achievements";
import type { Achievement, AchievementRarity, UserStats } from "@/lib/interview/achievements";
import { duration, easing, getStaggerDelay } from "@/lib/constants/motion";

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
  Sparkles,
  // Aliases for missing icons
  Bomb: Zap,
  Puzzle: Compass,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star;
}

// ── Category filter ───────────────────────────────────────────────

type CategoryFilter = "all" | Achievement["category"];

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "learning", label: "Completion" },
  { value: "mastery", label: "Skill" },
  { value: "streak", label: "Streaks" },
  { value: "exploration", label: "Exploration" },
  { value: "design", label: "Design" },
  { value: "social", label: "Social" },
];

// ── Rarity configuration ──────────────────────────────────────────

const RARITY_CONFIG: Record<
  AchievementRarity,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  common: {
    label: "Common",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-700",
    dot: "bg-zinc-400",
  },
  rare: {
    label: "Rare",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  epic: {
    label: "Epic",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  legendary: {
    label: "Legendary",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
};

// ── Category color mapping ────────────────────────────────────────

const CATEGORY_COLORS: Record<Achievement["category"], { bg: string; text: string }> = {
  learning: { bg: "bg-blue-500/15", text: "text-blue-400" },
  design: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  streak: { bg: "bg-orange-500/15", text: "text-orange-400" },
  mastery: { bg: "bg-purple-500/15", text: "text-purple-400" },
  social: { bg: "bg-pink-500/15", text: "text-pink-400" },
  exploration: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
};

// ── Achievement Gallery Card ──────────────────────────────────────

interface GalleryCardProps {
  achievement: Achievement;
  unlocked: boolean;
  earnedDate?: string;
  progress: [number, number] | null;
  index: number;
}

const GalleryCard = memo(function GalleryCard({
  achievement,
  unlocked,
  earnedDate,
  progress,
  index,
}: GalleryCardProps) {
  const Icon = getIcon(achievement.icon);
  const colors = CATEGORY_COLORS[achievement.category];
  const rarity = RARITY_CONFIG[achievement.rarity];

  const progressPct =
    progress != null && progress[1] > 0
      ? Math.min((progress[0] / progress[1]) * 100, 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("gridItems", index),
      }}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 transition-all duration-200",
        unlocked
          ? cn("bg-zinc-900/70 hover:border-zinc-600", rarity.border)
          : "border-zinc-800/50 bg-zinc-900/30 grayscale",
      )}
    >
      {/* Rarity indicator */}
      <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
        <div className={cn("h-1.5 w-1.5 rounded-full", rarity.dot)} />
        <span className={cn("text-[9px] font-medium uppercase tracking-wider", rarity.text)}>
          {rarity.label}
        </span>
      </div>

      {/* Icon and lock state */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            unlocked ? colors.bg : "bg-zinc-800",
          )}
        >
          {unlocked ? (
            <Icon className={cn("h-5 w-5", colors.text)} />
          ) : (
            <Lock className="h-4 w-4 text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4
            className={cn(
              "text-sm font-semibold leading-tight",
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
      </div>

      {/* Progress bar for multi-step achievements */}
      {progress != null && progressPct != null && !unlocked && (
        <div className="flex flex-col gap-1">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className={cn("h-full rounded-full", rarity.bg)}
              style={{
                width: `${progressPct}%`,
                backgroundColor:
                  achievement.rarity === "legendary"
                    ? "rgb(245, 158, 11)"
                    : achievement.rarity === "epic"
                      ? "rgb(168, 85, 247)"
                      : achievement.rarity === "rare"
                        ? "rgb(59, 130, 246)"
                        : "rgb(161, 161, 170)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: duration.slow + 0.1, ease: easing.out }}
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            {progress[0]} / {progress[1]}
          </p>
        </div>
      )}

      {/* Bottom row: XP reward + date/condition */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            unlocked
              ? "bg-amber-500/10 text-amber-400"
              : "bg-zinc-800 text-zinc-500",
          )}
        >
          +{achievement.xpReward} XP
        </span>

        {unlocked && earnedDate ? (
          <p className="text-[10px] text-zinc-500">Earned {earnedDate}</p>
        ) : !unlocked ? (
          <p className="max-w-[60%] truncate text-[10px] italic text-zinc-600">
            {achievement.condition}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
});

// ── AchievementGallery ────────────────────────────────────────────

export interface AchievementGalleryProps {
  earnedIds: string[];
  earnedDates?: Record<string, string>;
  userStats?: UserStats;
  className?: string;
}

const AchievementGallery = memo(function AchievementGallery({
  earnedIds,
  earnedDates = {},
  userStats,
  className,
}: AchievementGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | "all">("all");

  const earnedSet = useMemo(() => new Set(earnedIds), [earnedIds]);

  const filtered = useMemo(() => {
    let result = ACHIEVEMENTS;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (rarityFilter !== "all") {
      result = result.filter((a) => a.rarity === rarityFilter);
    }
    // Sort: unlocked first, then by rarity (legendary first)
    const rarityOrder: Record<AchievementRarity, number> = {
      legendary: 0,
      epic: 1,
      rare: 2,
      common: 3,
    };
    return [...result].sort((a, b) => {
      const aUnlocked = earnedSet.has(a.id) ? 0 : 1;
      const bUnlocked = earnedSet.has(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [activeCategory, rarityFilter, earnedSet]);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).length,
    [earnedSet],
  );

  const totalXpEarned = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).reduce(
        (sum, a) => sum + a.xpReward,
        0,
      ),
    [earnedSet],
  );

  // Count by rarity
  const rarityCounts = useMemo(() => {
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const a of ACHIEVEMENTS) {
      if (earnedSet.has(a.id)) counts[a.rarity]++;
    }
    return counts;
  }, [earnedSet]);

  // Default stats for progress calculation
  const defaultStats: UserStats = useMemo(() => ({
    challengesCompleted: 0,
    challengesByDifficulty: {},
    challengesByCategory: {},
    averageScore: 0,
    perfectScoreCount: 0,
    totalHintsUsed: 0,
    noHintCompletions: 0,
    streakDays: 0,
    longestStreak: 0,
    conceptsMastered: 0,
    totalConcepts: 0,
    chaosEventsSurvived: 0,
    patternsUsed: [],
    fastCompletions: 0,
    sub5MinCompletions: 0,
    totalXp: 0,
    dimensionScores: {},
    earnedAchievementIds: earnedIds,
    modulesVisited: [],
    nodeTypesUsed: [],
    templatesLoaded: 0,
    totalTimePracticedMinutes: 0,
  }), [earnedIds]);

  const stats = userStats ?? defaultStats;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Achievement Gallery
          </h3>
          <p className="text-xs text-zinc-500">
            {unlockedCount} / {ACHIEVEMENTS.length} unlocked ({totalXpEarned.toLocaleString()} XP earned)
          </p>
        </div>

        {/* Rarity breakdown */}
        <div className="flex gap-2">
          {(["common", "rare", "epic", "legendary"] as const).map((r) => {
            const config = RARITY_CONFIG[r];
            return (
              <div
                key={r}
                className="flex items-center gap-1"
              >
                <div className={cn("h-2 w-2 rounded-full", config.dot)} />
                <span className="text-[10px] text-zinc-500">{rarityCounts[r]}</span>
              </div>
            );
          })}
        </div>
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

        {/* Rarity filter pills */}
        <div className="ml-auto flex gap-1">
          {(["all", "common", "rare", "epic", "legendary"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                rarityFilter === r
                  ? r === "all"
                    ? "bg-zinc-700 text-zinc-200"
                    : cn(RARITY_CONFIG[r as AchievementRarity].bg, RARITY_CONFIG[r as AchievementRarity].text)
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {r === "all" ? "All" : RARITY_CONFIG[r as AchievementRarity].label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((achievement, index) => {
            const unlocked = earnedSet.has(achievement.id);
            const progress = !unlocked
              ? getAchievementProgress(achievement, stats)
              : null;

            return (
              <GalleryCard
                key={achievement.id}
                achievement={achievement}
                unlocked={unlocked}
                earnedDate={earnedDates[achievement.id]}
                progress={progress}
                index={index}
              />
            );
          })}
        </div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-xs text-zinc-500">
          No achievements match the selected filters.
        </p>
      )}
    </div>
  );
});

AchievementGallery.displayName = "AchievementGallery";

export default AchievementGallery;
