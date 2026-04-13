"use client";

import React, { memo, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/interview/leaderboard";
import {
  generateMockLeaderboard,
  calculateRank,
  getLeaderboardSlice,
  insertUserIntoLeaderboard,
} from "@/lib/interview/leaderboard";
import { duration, easing, getStaggerDelay } from "@/lib/constants/motion";

// ── Period tabs ────────────────────────────────────────────────────

const PERIOD_TABS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "all-time", label: "All Time" },
];

// ── Rank badge styles ──────────────────────────────────────────────

function getRankIcon(rank: number): LucideIcon | null {
  if (rank === 1) return Crown;
  if (rank === 2) return Medal;
  if (rank === 3) return Trophy;
  return null;
}

function getRankColors(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "bg-amber-500/20", text: "text-amber-400" };
  if (rank === 2) return { bg: "bg-zinc-400/20", text: "text-zinc-300" };
  if (rank === 3) return { bg: "bg-orange-600/20", text: "text-orange-400" };
  return { bg: "bg-zinc-800", text: "text-zinc-400" };
}

// ── Avatar generator ───────────────────────────────────────────────

function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 60%, 50%), hsl(${h2}, 60%, 40%))`;
}

// ── Leaderboard Row ────────────────────────────────────────────────

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  index,
}: LeaderboardRowProps) {
  const RankIcon = getRankIcon(entry.rank);
  const rankColors = getRankColors(entry.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("listItems", index),
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        entry.isCurrentUser
          ? "border border-blue-500/30 bg-blue-500/10"
          : "hover:bg-zinc-800/50",
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          rankColors.bg,
          rankColors.text,
        )}
      >
        {RankIcon ? <RankIcon className="h-4 w-4" /> : entry.rank}
      </div>

      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: getAvatarGradient(entry.avatarSeed) }}
      >
        {entry.username.slice(0, 2).toUpperCase()}
      </div>

      {/* Name & level */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            entry.isCurrentUser ? "text-blue-300" : "text-zinc-200",
          )}
        >
          {entry.username}
          {entry.isCurrentUser && (
            <span className="ml-1.5 text-[10px] text-blue-400">(You)</span>
          )}
        </p>
        <p className="text-[10px] text-zinc-500">Level {entry.level}</p>
      </div>

      {/* Streak */}
      {entry.streak > 0 && (
        <div className="flex items-center gap-0.5">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] font-medium text-orange-400">
            {entry.streak}
          </span>
        </div>
      )}

      {/* XP */}
      <div className="text-right">
        <p className="flex items-center gap-1 text-xs font-semibold text-zinc-200">
          <Sparkles className="h-3 w-3 text-amber-400" />
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[10px] text-zinc-500">
          {entry.challengesCompleted} solved
        </p>
      </div>
    </motion.div>
  );
});

// ── LeaderboardPanel ──────────────────────────────────────────────

export interface LeaderboardPanelProps {
  userXp: number;
  username: string;
  userLevel: number;
  userStreak: number;
  userChallengesCompleted: number;
  className?: string;
}

const LeaderboardPanel = memo(function LeaderboardPanel({
  userXp,
  username,
  userLevel,
  userStreak,
  userChallengesCompleted,
  className,
}: LeaderboardPanelProps) {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("weekly");
  const [showAll, setShowAll] = useState(false);

  const leaderboard = useMemo(() => {
    const mock = generateMockLeaderboard(50, activePeriod);
    return insertUserIntoLeaderboard(mock, {
      username,
      avatarSeed: `user-${username}`,
      xp: userXp,
      level: userLevel,
      streak: userStreak,
      challengesCompleted: userChallengesCompleted,
      badges: [],
    });
  }, [activePeriod, userXp, username, userLevel, userStreak, userChallengesCompleted]);

  const userRank = useMemo(
    () => calculateRank(userXp, leaderboard),
    [userXp, leaderboard],
  );

  const displayEntries = useMemo(() => {
    if (showAll) {
      return getLeaderboardSlice(leaderboard, userRank, 20);
    }
    // Show top 10
    const top10 = leaderboard.slice(0, 10);
    // If user is outside top 10, also show their neighborhood
    const userInTop = top10.some((e) => e.isCurrentUser);
    if (userInTop) return top10;
    return [
      ...top10,
      ...getLeaderboardSlice(leaderboard, userRank, 3),
    ];
  }, [leaderboard, userRank, showAll]);

  const handleToggleView = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Leaderboard</h3>
        <span className="text-xs text-zinc-500">
          Your rank: #{userRank}
        </span>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-0.5">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActivePeriod(tab.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
              activePeriod === tab.value
                ? "bg-primary text-white"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="flex flex-col gap-1">
        {displayEntries.map((entry, index) => {
          // Show separator if there's a rank gap
          const prevEntry = index > 0 ? displayEntries[index - 1] : null;
          const hasGap = prevEntry != null && entry.rank - prevEntry.rank > 1;

          return (
            <React.Fragment key={`${entry.rank}-${entry.username}`}>
              {hasGap && (
                <div className="flex items-center gap-2 px-3 py-1">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] text-zinc-600">...</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
              )}
              <LeaderboardRow entry={entry} index={index} />
            </React.Fragment>
          );
        })}
      </div>

      {/* Toggle button */}
      <button
        onClick={handleToggleView}
        className="flex items-center justify-center gap-1 rounded-lg bg-zinc-800/50 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      >
        {showAll ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Show Top 10
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show Around You
          </>
        )}
      </button>
    </div>
  );
});

LeaderboardPanel.displayName = "LeaderboardPanel";

export default LeaderboardPanel;
