"use client";

/**
 * Interview Practice Mode — timer, assessment, and setup components.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useEffect, useCallback } from "react";
import { Timer, Trophy, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LLDProblem } from "@/lib/lld";
import type { PracticeTimerOption } from "../constants";

// ── Practice Timer Bar ───────────────────────────────────

export const PracticeTimerBar = memo(function PracticeTimerBar({
  startTime,
  timerMinutes,
  onSubmit,
  onCancel,
}: {
  startTime: number;
  timerMinutes: PracticeTimerOption;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMs = timerMinutes * 60 * 1000;
  const elapsedMs = now - startTime;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const fraction = elapsedMs / totalMs;

  useEffect(() => {
    if (remainingMs <= 0) {
      onSubmit();
    }
  }, [remainingMs, onSubmit]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const timerColor =
    fraction >= 0.9
      ? "text-red-400"
      : fraction >= 0.75
        ? "text-amber-400"
        : "text-foreground";

  const barColor =
    fraction >= 0.9
      ? "bg-red-500"
      : fraction >= 0.75
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="flex items-center gap-3 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
      <Timer className="h-4 w-4 text-primary" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        Practice Mode
      </span>
      <div className="flex-1">
        <div className="h-1.5 w-full rounded-full bg-border">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", barColor)}
            style={{ width: `${Math.max(0, (1 - fraction)) * 100}%` }}
          />
        </div>
      </div>
      <span className={cn("font-mono text-sm font-bold tabular-nums", timerColor)}>
        {display}
      </span>
      <button
        onClick={onSubmit}
        className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
      >
        Submit
      </button>
      <button
        onClick={onCancel}
        className="rounded-xl border border-border/30 bg-elevated/50 px-2 py-1.5 text-[11px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
        title="Exit practice mode"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

// ── Practice Assessment ──────────────────────────────────

export const PracticeAssessment = memo(function PracticeAssessment({
  problem,
  checkedHints,
  onToggleHint,
  onRetry,
  onExit,
}: {
  problem: LLDProblem;
  checkedHints: Set<number>;
  onToggleHint: (idx: number) => void;
  onRetry: () => void;
  onExit: () => void;
}) {
  const score = problem.hints.length > 0
    ? Math.round((checkedHints.size / problem.hints.length) * 100)
    : 0;

  const gradeLabel =
    score >= 90
      ? "Excellent!"
      : score >= 70
        ? "Good job!"
        : score >= 50
          ? "Getting there!"
          : "Keep practicing!";

  const gradeColor =
    score >= 90
      ? "text-green-400"
      : score >= 70
        ? "text-blue-400"
        : score >= 50
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Trophy className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Self-Assessment: {problem.name}
        </span>
        <span className={cn("ml-auto text-sm font-bold", gradeColor)}>
          {score}% -- {gradeLabel}
        </span>
      </div>
      <div className="flex flex-1 overflow-auto">
        <div className="flex-1 border-r border-border/30 px-4 py-3">
          <p className="mb-3 text-[11px] text-foreground-muted">
            Check off each item your solution covers. Compare your diagram with the reference solution on the right.
          </p>
          <div className="space-y-2">
            {problem.hints.map((hint, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 transition-colors hover:bg-accent/50"
              >
                <input
                  type="checkbox"
                  checked={checkedHints.has(i)}
                  onChange={() => onToggleHint(i)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <span className={cn(
                  "text-[11px] leading-relaxed",
                  checkedHints.has(i)
                    ? "text-foreground line-through opacity-70"
                    : "text-foreground-muted",
                )}>
                  {hint}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Retry Problem
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 px-3 py-2 text-[11px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
            >
              Exit Practice Mode
            </button>
          </div>
        </div>
        <div className="w-72 px-4 py-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Requirements
          </h3>
          <ul className="space-y-1.5">
            {problem.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground-muted">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/60" />
                {req}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Score
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500",
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-bold text-foreground">{score}%</span>
            </div>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              {checkedHints.size} of {problem.hints.length} items covered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
