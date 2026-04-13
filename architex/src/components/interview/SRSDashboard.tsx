"use client";

import React, { memo, useMemo } from "react";
import { BookOpen, Play, Brain, Flame, Clock, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDueCards, getRetentionStats } from "@/lib/interview/srs";
import type { ReviewCard } from "@/lib/interview/srs";

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a 365-day activity map from review cards. */
function buildActivityHeatmap(
  cards: ReviewCard[],
): { date: string; count: number }[] {
  const now = new Date();
  const dayMap = new Map<string, number>();

  // Initialize 365 days
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(key, 0);
  }

  // Count reviews per day
  for (const card of cards) {
    if (card.lastReview) {
      const d = card.lastReview instanceof Date ? card.lastReview : new Date(card.lastReview);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    }
  }

  return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
}

/** Get the intensity level (0-4) for a review count. */
function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  "bg-zinc-800/60",
  "bg-emerald-900/60",
  "bg-emerald-700/60",
  "bg-emerald-500/60",
  "bg-emerald-400/80",
];

/** Format a relative time for next review. */
function formatNextReviewTime(cards: ReviewCard[]): string {
  if (cards.length === 0) return "No cards";

  const now = new Date();
  const dueCards = getDueCards(cards, now);
  if (dueCards.length > 0) return "Now";

  // Find the soonest upcoming review
  let soonest: Date | null = null;
  for (const card of cards) {
    const nextReview = card.nextReview instanceof Date ? card.nextReview : new Date(card.nextReview);
    if (nextReview.getTime() > now.getTime()) {
      if (!soonest || nextReview.getTime() < soonest.getTime()) {
        soonest = nextReview;
      }
    }
  }

  if (!soonest) return "No upcoming";

  const diffMs = soonest.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// ── Activity Heatmap ─────────────────────────────────────────────────

const ActivityHeatmap = memo(function ActivityHeatmap({
  cards,
}: {
  cards: ReviewCard[];
}) {
  const activity = useMemo(() => buildActivityHeatmap(cards), [cards]);

  // Group by weeks (7 days per column)
  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    // Pad the start to align with Sunday
    const firstDate = activity.length > 0 ? new Date(activity[0].date) : new Date();
    const startDay = firstDate.getDay(); // 0 = Sunday
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: "", count: -1 }); // placeholder
    }

    for (const day of activity) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [activity]);

  const totalReviews = useMemo(
    () => activity.reduce((sum, d) => sum + d.count, 0),
    [activity],
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Review Activity (365 days)
        </p>
        <p className="text-[10px] text-zinc-500">
          {totalReviews} total reviews
        </p>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                if (day.count < 0) {
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className="h-[10px] w-[10px]"
                    />
                  );
                }
                const level = getIntensityLevel(day.count);
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "h-[10px] w-[10px] rounded-[2px] transition-colors",
                      INTENSITY_COLORS[level],
                    )}
                    title={`${day.date}: ${day.count} reviews`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="mt-1.5 flex items-center justify-end gap-1">
        <span className="text-[9px] text-zinc-600">Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className={cn("h-[8px] w-[8px] rounded-[1px]", color)}
          />
        ))}
        <span className="text-[9px] text-zinc-600">More</span>
      </div>
    </div>
  );
});

// ── Mastery Distribution Bar ─────────────────────────────────────────

const MasteryDistribution = memo(function MasteryDistribution({
  cards,
}: {
  cards: ReviewCard[];
}) {
  const breakdown = useMemo(() => {
    const groups = { new: 0, learning: 0, review: 0, relearning: 0 };
    for (const card of cards) {
      groups[card.state]++;
    }
    return groups;
  }, [cards]);

  const total = cards.length;
  if (total === 0) return null;

  const segments: {
    key: ReviewCard["state"];
    label: string;
    count: number;
    color: string;
    textColor: string;
  }[] = [
    { key: "new", label: "New", count: breakdown.new, color: "bg-zinc-500", textColor: "text-zinc-400" },
    { key: "learning", label: "Learning", count: breakdown.learning, color: "bg-blue-500", textColor: "text-blue-400" },
    { key: "relearning", label: "Relearning", count: breakdown.relearning, color: "bg-amber-500", textColor: "text-amber-400" },
    { key: "review", label: "Review", count: breakdown.review, color: "bg-emerald-500", textColor: "text-emerald-400" },
  ];

  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Mastery Distribution
      </p>
      {/* Stacked bar */}
      <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        {segments.map(({ key, count, color }) => {
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={cn("h-full transition-[width] duration-500", color)}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map(({ key, label, count, color, textColor }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <span className={cn("text-[10px] font-medium", textColor)}>
              {label}
            </span>
            <span className="text-[10px] text-zinc-600">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── SRSDashboard ──────────────────────────────────────────────────────

export interface SRSDashboardProps {
  cards: ReviewCard[];
  onStartReview?: () => void;
  className?: string;
}

const SRSDashboard = memo(function SRSDashboard({
  cards,
  onStartReview,
  className,
}: SRSDashboardProps) {
  const stats = useMemo(() => getRetentionStats(cards), [cards]);
  const dueCards = useMemo(() => getDueCards(cards), [cards]);
  const nextReviewTime = useMemo(() => formatNextReviewTime(cards), [cards]);

  // Urgency level for due cards
  const urgencyLevel = useMemo(() => {
    if (dueCards.length === 0) return "none" as const;
    if (dueCards.length <= 5) return "low" as const;
    if (dueCards.length <= 15) return "medium" as const;
    return "high" as const;
  }, [dueCards.length]);

  const urgencyConfig = {
    none: { badge: "bg-zinc-700/50 text-zinc-500", icon: null },
    low: { badge: "bg-blue-500/15 text-blue-400", icon: null },
    medium: { badge: "bg-amber-500/15 text-amber-400 animate-pulse", icon: Zap },
    high: { badge: "bg-red-500/15 text-red-400 animate-pulse", icon: Flame },
  };

  const urgency = urgencyConfig[urgencyLevel];
  const UrgencyIcon = urgency.icon;

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/70 p-4", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Spaced Repetition
          </h3>
        </div>
        {stats.dueToday > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              urgency.badge,
            )}
          >
            {UrgencyIcon && <UrgencyIcon className="h-3 w-3" />}
            {stats.dueToday} due
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Total
          </p>
          <p className="text-lg font-bold text-zinc-100">{stats.totalCards}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Mastered
          </p>
          <p className="text-lg font-bold text-emerald-400">
            {stats.masteredCount}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Retention
          </p>
          <p className="text-lg font-bold text-zinc-100">
            {stats.averageRetention}%
          </p>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Streak
            </p>
          </div>
          <p className="text-lg font-bold text-orange-400">
            {stats.streakDays}d
          </p>
        </div>
      </div>

      {/* Mastery Distribution */}
      {cards.length > 0 && (
        <div className="mb-4">
          <MasteryDistribution cards={cards} />
        </div>
      )}

      {/* Mastery progress bar */}
      {stats.totalCards > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Mastery Progress
            </p>
            <p className="text-xs text-zinc-400">
              {stats.masteredCount} / {stats.totalCards}
            </p>
          </div>
          <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-[width] duration-500"
              style={{
                width: `${(stats.masteredCount / stats.totalCards) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      {cards.length > 0 && (
        <div className="mb-4">
          <ActivityHeatmap cards={cards} />
        </div>
      )}

      {/* Next review indicator */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400">Next review</span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            nextReviewTime === "Now" ? "text-blue-400" : "text-zinc-300",
          )}
        >
          {nextReviewTime}
        </span>
      </div>

      {/* Start Review button */}
      <button
        onClick={onStartReview}
        disabled={dueCards.length === 0}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          dueCards.length > 0
            ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700"
            : "cursor-not-allowed bg-zinc-800 text-zinc-500",
        )}
      >
        {dueCards.length > 0 ? (
          <>
            <Play className="h-4 w-4" />
            Start Review ({dueCards.length}{" "}
            {dueCards.length === 1 ? "card" : "cards"})
          </>
        ) : (
          <>
            <BookOpen className="h-4 w-4" />
            No Reviews Due
          </>
        )}
      </button>
    </div>
  );
});

SRSDashboard.displayName = "SRSDashboard";

export default SRSDashboard;
