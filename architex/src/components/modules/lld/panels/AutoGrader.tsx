"use client";

/**
 * AutoGrader -- rubric-based auto-grading panel for LLD problems.
 *
 * Compares the user's canvas diagram against the reference solution
 * and problem metadata, producing a scored rubric across 4 categories:
 *   1. Required Classes (40 pts)
 *   2. Relationships (30 pts)
 *   3. Pattern Usage (20 pts)
 *   4. Completeness (10 pts)
 *
 * Features:
 *   - Animated grading progress bar
 *   - Color-coded score (green >80, yellow >60, red <60)
 *   - Category breakdown with expand/collapse
 *   - Per-item checkmarks/crosses
 *   - Score history in localStorage
 *   - "Show Reference Solution" button
 */

import { memo, useState, useCallback, useEffect, useMemo } from "react";
import {
  Award,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Eye,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UMLClass, UMLRelationship, LLDProblem } from "@/lib/lld";
import {
  gradeDiagram,
  type GradingResult,
  type GradingCategory,
} from "@/lib/lld/grading-engine";

// ── Props ───────────────────────────────────────────────────

interface AutoGraderProps {
  problem: LLDProblem;
  /** User's current canvas classes */
  userClasses: UMLClass[];
  /** User's current canvas relationships */
  userRelationships: UMLRelationship[];
  /** Reference solution classes (from diagram template or problem starterClasses) */
  referenceClasses: UMLClass[];
  /** Reference solution relationships */
  referenceRelationships: UMLRelationship[];
  /** Callback to overlay the reference diagram on the canvas */
  onShowReference?: () => void;
}

// ── Score History ───────────────────────────────────────────

interface ScoreHistoryEntry {
  score: number;
  timestamp: number;
  classCount: number;
  relCount: number;
}

function getScoreHistory(problemId: string): ScoreHistoryEntry[] {
  try {
    const key = `architex-grade-history-${problemId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScoreHistory(
  problemId: string,
  entry: ScoreHistoryEntry,
): ScoreHistoryEntry[] {
  try {
    const key = `architex-grade-history-${problemId}`;
    const history = getScoreHistory(problemId);
    history.push(entry);
    // Keep last 20 entries
    const trimmed = history.slice(-20);
    localStorage.setItem(key, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

// ── Sub-components ──────────────────────────────────────────

/** Animated circular score display */
function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const bgColor =
    score >= 80
      ? "stroke-emerald-400"
      : score >= 60
        ? "stroke-amber-400"
        : "stroke-red-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(bgColor, "transition-all duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-xl font-bold", color)}>{score}</span>
      </div>
    </div>
  );
}

/** Category card with expand/collapse */
function CategoryCard({
  category,
  defaultExpanded = false,
}: {
  category: GradingCategory;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const passedCount = category.items.filter((i) => i.passed).length;
  const totalCount = category.items.length;
  const color =
    category.score >= 80
      ? "text-emerald-400"
      : category.score >= 60
        ? "text-amber-400"
        : "text-red-400";
  const barColor =
    category.score >= 80
      ? "bg-emerald-500"
      : category.score >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-lg border border-border/30 bg-elevated/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle" />
          )}
          <span className="text-[11px] font-semibold text-foreground">
            {category.name}
          </span>
          <span className="text-[10px] text-foreground-subtle">
            ({passedCount}/{totalCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-border/30">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: `${category.score}%` }}
            />
          </div>
          <span className={cn("text-[11px] font-bold", color)}>
            {Math.round(category.earnedPoints)}/{category.maxPoints}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/20 px-3 py-2 space-y-1.5">
          {category.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {item.passed ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-foreground-muted">
                  {item.description}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    item.passed ? "text-emerald-300/70" : "text-red-300/70",
                  )}
                >
                  {item.feedback}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-[10px] font-semibold",
                  item.passed ? "text-emerald-400" : "text-red-400/50",
                )}
              >
                +{Math.round(item.points * 10) / 10}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Score history mini chart */
function ScoreHistoryChart({ history }: { history: ScoreHistoryEntry[] }) {
  if (history.length < 2) return null;

  const maxScore = 100;
  const recent = history.slice(-10);
  const trend =
    recent.length >= 2
      ? recent[recent.length - 1].score - recent[recent.length - 2].score
      : 0;

  return (
    <div className="rounded-lg border border-border/30 bg-elevated/30 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-foreground-subtle" />
          <span className="text-[10px] font-semibold text-foreground-subtle">
            Score History
          </span>
        </div>
        {trend !== 0 && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[10px] font-semibold",
              trend > 0 ? "text-emerald-400" : "text-red-400",
            )}
          >
            <TrendingUp
              className={cn(
                "h-3 w-3",
                trend < 0 && "rotate-180",
              )}
            />
            {trend > 0 ? "+" : ""}
            {trend}
          </div>
        )}
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-8">
        {recent.map((entry, i) => {
          const height = Math.max(2, (entry.score / maxScore) * 32);
          const color =
            entry.score >= 80
              ? "bg-emerald-500"
              : entry.score >= 60
                ? "bg-amber-500"
                : "bg-red-500";
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end"
              title={`Score: ${entry.score} (${new Date(entry.timestamp).toLocaleDateString()})`}
            >
              <div
                className={cn("w-full rounded-t", color, "transition-all duration-300")}
                style={{ height: `${height}px` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[9px] text-foreground-subtle/50">
        <Clock className="h-2.5 w-2.5" />
        <span>
          {recent.length} attempt{recent.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export const AutoGrader = memo(function AutoGrader({
  problem,
  userClasses,
  userRelationships,
  referenceClasses,
  referenceRelationships,
  onShowReference,
}: AutoGraderProps) {
  const [result, setResult] = useState<GradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(getScoreHistory(problem.id));
  }, [problem.id]);

  // Reset result when problem changes
  const [prevProblemId, setPrevProblemId] = useState(problem.id);
  if (problem.id !== prevProblemId) {
    setResult(null);
    setIsGrading(false);
    setProgress(0);
    setPrevProblemId(problem.id);
    setHistory(getScoreHistory(problem.id));
  }

  const hasEnoughContent = userClasses.length > 0;

  const handleGrade = useCallback(() => {
    if (isGrading || !hasEnoughContent) return;

    setIsGrading(true);
    setProgress(0);
    setResult(null);

    // Animated progress bar (fake 2s delay for UX)
    const startTime = Date.now();
    const duration = 2000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - pct, 3);
      setProgress(Math.round(eased * 100));

      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        // Run actual grading
        const gradingResult = gradeDiagram({
          userClasses,
          userRelationships,
          referenceClasses,
          referenceRelationships,
          keyPatterns: problem.keyPatterns,
        });

        setResult(gradingResult);
        setIsGrading(false);

        // Save to history
        const newHistory = saveScoreHistory(problem.id, {
          score: gradingResult.totalScore,
          timestamp: Date.now(),
          classCount: userClasses.length,
          relCount: userRelationships.length,
        });
        setHistory(newHistory);
      }
    };

    requestAnimationFrame(tick);
  }, [
    isGrading,
    hasEnoughContent,
    userClasses,
    userRelationships,
    referenceClasses,
    referenceRelationships,
    problem,
  ]);

  // ── No content state ──────────────────────────────────────

  if (!hasEnoughContent && !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
        <Award className="h-8 w-8 text-foreground-subtle/30 mb-3" />
        <p className="text-xs text-foreground-subtle">
          Add classes to your canvas to enable grading.
        </p>
        <p className="text-[10px] text-foreground-subtle/60 mt-1">
          Build your solution for &ldquo;{problem.name}&rdquo; then click Grade.
        </p>
      </div>
    );
  }

  // ── Grading in progress ───────────────────────────────────

  if (isGrading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-xs font-semibold text-foreground mb-3">
          Analyzing your diagram...
        </p>
        <div className="w-48 h-2 rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-foreground-subtle mt-2">
          {progress < 30
            ? "Checking classes..."
            : progress < 60
              ? "Verifying relationships..."
              : progress < 85
                ? "Detecting patterns..."
                : "Finalizing score..."}
        </p>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────

  if (result) {
    return (
      <div className="h-full overflow-auto px-4 py-3 space-y-3">
        {/* Score header */}
        <div className="flex items-center gap-4">
          <ScoreCircle score={result.totalScore} />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">
              {result.totalScore >= 80
                ? "Excellent Work!"
                : result.totalScore >= 60
                  ? "Good Progress"
                  : "Keep Going"}
            </h3>
            <p className="text-[10px] text-foreground-subtle mt-0.5">
              {result.totalScore >= 80
                ? "Your diagram covers most of the required elements."
                : result.totalScore >= 60
                  ? "You have a solid foundation. Check the feedback below to improve."
                  : "Review the rubric below to see what is missing."}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-foreground-subtle">
                {userClasses.length} classes, {userRelationships.length} relationships
              </span>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-2">
          {result.categories.map((cat: GradingCategory, i: number) => (
            <CategoryCard
              key={cat.name}
              category={cat}
              defaultExpanded={i === 0 || !cat.items.every((item: { passed: boolean }) => item.passed)}
            />
          ))}
        </div>

        {/* Score history */}
        <ScoreHistoryChart history={history} />

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleGrade}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <Award className="h-3.5 w-3.5" />
            Re-Grade
          </button>
          {onShowReference && (
            <button
              onClick={onShowReference}
              className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-elevated/50 px-3 py-1.5 text-[10px] font-semibold text-foreground-muted transition-all hover:bg-elevated hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              Show Reference Solution
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Initial state (grade button) ──────────────────────────

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
      <Award className="h-10 w-10 text-primary/50 mb-4" />
      <h3 className="text-sm font-bold text-foreground mb-1">
        Grade My Solution
      </h3>
      <p className="text-[10px] text-foreground-subtle mb-4 max-w-xs">
        Your diagram will be compared against the reference solution for &ldquo;{problem.name}&rdquo;
        across 4 rubric categories.
      </p>
      <button
        onClick={handleGrade}
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Award className="h-4 w-4" />
        Grade My Solution
      </button>

      {/* Show history if there are previous attempts */}
      {history.length > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <ScoreHistoryChart history={history} />
        </div>
      )}
    </div>
  );
});
