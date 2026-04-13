"use client";

import React, { memo, useMemo, useState } from "react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Clock,
  Star,
  History,
  BarChart3,
  Target,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import type { ChallengeAttempt } from "@/stores/progress-store";
import { CHALLENGES } from "@/lib/interview/challenges";
import { SCORING_DIMENSIONS, calculateOverallScore } from "@/lib/interview/scoring";

// ── Helpers ───────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score < 4) return "text-red-400";
  if (score < 6) return "text-amber-400";
  if (score < 8) return "text-yellow-300";
  return "text-emerald-400";
}

function getBarColor(score: number): string {
  if (score < 4) return "bg-red-500";
  if (score < 6) return "bg-amber-500";
  if (score < 8) return "bg-yellow-400";
  return "bg-emerald-500";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          iconClass ?? "bg-blue-500/15",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-zinc-100">{value}</p>
        <p className="text-[11px] text-zinc-500">{label}</p>
        {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
      </div>
    </div>
  );
}

// ── Trend Arrow ───────────────────────────────────────────────────

function TrendArrow({ attempts }: { attempts: ChallengeAttempt[] }) {
  if (attempts.length < 2) {
    return <Minus className="h-4 w-4 text-zinc-500" />;
  }

  // Compare the average of the first half vs. second half of attempts
  const mid = Math.floor(attempts.length / 2);
  const firstHalf = attempts.slice(0, mid);
  const secondHalf = attempts.slice(mid);

  const avgFirst =
    firstHalf.reduce((s, a) => s + a.score, 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((s, a) => s + a.score, 0) / secondHalf.length;

  if (avgSecond > avgFirst + 0.3) {
    return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  }
  if (avgSecond < avgFirst - 0.3) {
    return <TrendingDown className="h-4 w-4 text-red-400" />;
  }
  return <Minus className="h-4 w-4 text-zinc-500" />;
}

// ── Per-dimension average bar chart ───────────────────────────────

function DimensionBarChart({ attempts }: { attempts: ChallengeAttempt[] }) {
  const averages = useMemo(() => {
    if (attempts.length === 0) return [];

    return SCORING_DIMENSIONS.map((dim) => {
      const values = attempts
        .map((a) => a.scores[dim.id])
        .filter((v): v is number => v != null);

      const avg =
        values.length > 0
          ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
          : 0;

      return { id: dim.id, name: dim.name, avg };
    });
  }, [attempts]);

  if (averages.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-500">
        No dimension data yet. Complete a challenge to see your breakdown.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {averages.map((dim) => (
        <div key={dim.id} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-zinc-400">
            {dim.name}
          </span>
          <div className="flex-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getBarColor(dim.avg),
                )}
                style={{ width: `${dim.avg * 10}%` }}
              />
            </div>
          </div>
          <span
            className={cn(
              "w-10 text-right text-xs font-semibold",
              getScoreColor(dim.avg),
            )}
          >
            {dim.avg.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Best score per difficulty ─────────────────────────────────────

function BestByDifficulty({ attempts }: { attempts: ChallengeAttempt[] }) {
  const byDifficulty = useMemo(() => {
    const result: Record<number, number> = {};

    for (const a of attempts) {
      const ch = CHALLENGES.find((c) => c.id === a.challengeId);
      if (!ch) continue;
      const d = ch.difficulty;
      if (result[d] == null || a.score > result[d]) {
        result[d] = a.score;
      }
    }

    return result;
  }, [attempts]);

  const levels = [1, 2, 3, 4, 5] as const;

  return (
    <div className="flex gap-2">
      {levels.map((d) => {
        const best = byDifficulty[d];
        return (
          <div
            key={d}
            className="flex flex-1 flex-col items-center rounded-lg border border-zinc-800 bg-zinc-900/50 py-2"
          >
            <div className="mb-1 flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-2 w-2",
                    i < d ? "fill-amber-400 text-amber-400" : "text-zinc-700",
                  )}
                />
              ))}
            </div>
            {best != null ? (
              <span
                className={cn(
                  "text-sm font-bold",
                  getScoreColor(best),
                )}
              >
                {best.toFixed(1)}
              </span>
            ) : (
              <span className="text-sm text-zinc-600">--</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Recent attempts list ──────────────────────────────────────────

function RecentAttempts({ attempts }: { attempts: ChallengeAttempt[] }) {
  const recent = useMemo(
    () => [...attempts].reverse().slice(0, 10),
    [attempts],
  );

  if (recent.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-500">
        No attempts yet. Start a challenge!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {recent.map((a, i) => {
        const ch = CHALLENGES.find((c) => c.id === a.challengeId);
        return (
          <div
            key={`${a.challengeId}-${a.completedAt}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                getScoreColor(a.score),
                a.score >= 8
                  ? "bg-emerald-500/15"
                  : a.score >= 6
                    ? "bg-yellow-400/15"
                    : "bg-red-500/15",
              )}
            >
              {a.score.toFixed(1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">
                {ch?.title ?? a.challengeId}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>{formatDate(a.completedAt)}</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTime(a.timeSpentSeconds)}
                </span>
                {a.hintsUsed > 0 && <span>{a.hintsUsed} hints</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ProgressDashboard ────────────────────────────────────────

export interface ProgressDashboardProps {
  className?: string;
}

const ProgressDashboard = memo(function ProgressDashboard({
  className,
}: ProgressDashboardProps) {
  const attempts = useProgressStore((s) => s.attempts);
  const totalXP = useProgressStore((s) => s.totalXP);
  const streakDays = useProgressStore((s) => s.streakDays);
  const getCompletedCount = useProgressStore((s) => s.getCompletedCount);
  const getAverageScore = useProgressStore((s) => s.getAverageScore);

  const completedCount = useMemo(() => getCompletedCount(), [getCompletedCount, attempts]);
  const averageScore = useMemo(() => getAverageScore(), [getAverageScore, attempts]);
  const totalChallenges = CHALLENGES.length;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="h-5 w-5 text-blue-400" />}
          iconClass="bg-blue-500/15"
          label="Challenges Completed"
          value={`${completedCount} / ${totalChallenges}`}
        />
        <StatCard
          icon={
            <div className="flex items-center gap-0.5">
              <Target className="h-5 w-5 text-amber-400" />
              <TrendArrow attempts={attempts} />
            </div>
          }
          iconClass="bg-amber-500/15"
          label="Average Score"
          value={averageScore > 0 ? averageScore.toFixed(1) : "--"}
          sub={attempts.length > 0 ? `across ${attempts.length} attempts` : undefined}
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-purple-400" />}
          iconClass="bg-purple-500/15"
          label="Total XP"
          value={totalXP.toLocaleString()}
        />
        <StatCard
          icon={
            <Flame
              className={cn(
                "h-5 w-5",
                streakDays > 0
                  ? "text-orange-400 animate-pulse"
                  : "text-zinc-600",
              )}
            />
          }
          iconClass={
            streakDays > 0 ? "bg-orange-500/15" : "bg-zinc-800"
          }
          label="Day Streak"
          value={streakDays > 0 ? `${streakDays} days` : "No streak"}
          sub={
            streakDays > 0
              ? "Keep it going!"
              : "Start practicing today"
          }
        />
      </div>

      {/* ── Best score per difficulty ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          Best Score by Difficulty
        </h3>
        <BestByDifficulty attempts={attempts} />
      </div>

      {/* ── Per-dimension averages ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
          Average Dimension Scores
        </h3>
        <DimensionBarChart attempts={attempts} />
      </div>

      {/* ── Recent attempts ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <History className="h-3.5 w-3.5 text-emerald-400" />
          Recent Attempts
        </h3>
        <RecentAttempts attempts={attempts} />
      </div>
    </div>
  );
});

ProgressDashboard.displayName = "ProgressDashboard";

// ── Attempt History Modal (inline popover) ────────────────────────

export interface AttemptHistoryProps {
  challengeId: string;
  onClose: () => void;
}

export const AttemptHistory = memo(function AttemptHistory({
  challengeId,
  onClose,
}: AttemptHistoryProps) {
  const getAttemptsByChallenge = useProgressStore(
    (s) => s.getAttemptsByChallenge,
  );
  const attempts = useProgressStore((s) =>
    s.attempts.filter((a) => a.challengeId === challengeId),
  );
  const challenge = CHALLENGES.find((c) => c.id === challengeId);

  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">
            {challenge?.title ?? challengeId} - History
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">No attempts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">
          {challenge?.title ?? challengeId} - History
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Close
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {[...attempts].reverse().map((a, i) => (
          <div
            key={`${a.completedAt}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2"
          >
            <span
              className={cn(
                "text-sm font-bold",
                getScoreColor(a.score),
              )}
            >
              {a.score.toFixed(1)}
            </span>
            <div className="min-w-0 flex-1 text-[10px] text-zinc-500">
              <span>{formatDate(a.completedAt)}</span>
              {" | "}
              <span>{formatTime(a.timeSpentSeconds)}</span>
              {a.hintsUsed > 0 && ` | ${a.hintsUsed} hints`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AttemptHistory.displayName = "AttemptHistory";

export default ProgressDashboard;
