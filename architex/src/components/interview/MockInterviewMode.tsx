"use client";

import React, { memo, useEffect, useRef, useState, useMemo } from "react";
import {
  CheckCircle,
  Circle,
  Send,
  X,
  GripVertical,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useInterviewStore } from "@/stores/interview-store";
import { useCanvasStore } from "@/stores/canvas-store";
import type { ChallengeDefinition } from "@/lib/interview/challenges";
import { checkRequirement, checkChecklistItem } from "@/components/interview/ChallengeOverlay";
import { DesignCanvas } from "@/components/canvas/DesignCanvas";
import { ComponentPalette } from "@/components/canvas/panels/ComponentPalette";
import ScoreDisplay from "@/components/interview/ScoreDisplay";
import type { SystemDesignNodeData } from "@/lib/types";

// ── Countdown timer (counts down from total, not up) ────────

type TimerColor = "green" | "yellow" | "red" | "overtime";

function getTimerColor(remainingMs: number, totalMs: number): TimerColor {
  if (remainingMs <= 0) return "overtime";
  const ratio = remainingMs / totalMs;
  if (ratio > 0.5) return "green";
  if (ratio > 0.25) return "yellow";
  return "red";
}

function timerColorClasses(color: TimerColor): string {
  switch (color) {
    case "green":
      return "text-emerald-400";
    case "yellow":
      return "text-amber-400";
    case "red":
      return "text-red-400";
    case "overtime":
      return "text-red-500 animate-pulse";
  }
}

function CountdownTimer({
  timerStartedAt,
  timerPaused,
  totalMs,
}: {
  timerStartedAt: number | null;
  timerPaused: boolean;
  totalMs: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    if (!timerStartedAt) {
      setElapsed(0);
      pausedElapsedRef.current = 0;
      return;
    }

    if (timerPaused) {
      pausedElapsedRef.current = elapsedRef.current;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startRef = Date.now() - pausedElapsedRef.current * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef) / 1000));
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStartedAt, timerPaused]);

  const totalSeconds = Math.floor(totalMs / 1000);
  const remaining = totalSeconds - elapsed;
  const isOvertime = remaining < 0;

  const displaySeconds = Math.abs(remaining);
  const mm = Math.floor(displaySeconds / 60);
  const ss = displaySeconds % 60;

  const color = getTimerColor(remaining * 1000, totalMs);

  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          "font-mono text-5xl font-bold tracking-tight tabular-nums",
          timerColorClasses(color),
        )}
      >
        {isOvertime && "+"}
        {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs text-zinc-500">
        {isOvertime ? "overtime" : "remaining"}
      </span>
    </div>
  );
}

// ── Floating mini palette ───────────────────────────────────

const FloatingPalette = memo(function FloatingPalette() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={cn(
        "absolute bottom-4 left-4 z-50 transition-all duration-200",
        open ? "w-64" : "w-auto",
      )}
    >
      {open ? (
        <div className="flex max-h-[50vh] flex-col rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
            <span className="text-xs font-semibold text-zinc-300">
              Components
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-zinc-400 hover:text-zinc-200"
              title="Collapse palette"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ComponentPalette />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur-sm hover:bg-zinc-800"
          title="Open component palette"
        >
          <GripVertical className="h-3.5 w-3.5" />
          Components
        </button>
      )}
    </div>
  );
});

// ── Requirements panel (left side) ──────────────────────────

const RequirementsPanel = memo(function RequirementsPanel({
  challenge,
}: {
  challenge: ChallengeDefinition;
}) {
  const nodes = useCanvasStore((s) => s.nodes);

  const typedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: n.data as SystemDesignNodeData,
      })),
    [nodes],
  );

  const requirementStatus = useMemo(
    () =>
      challenge.requirements.map((req) => ({
        text: req,
        met: checkRequirement(req, typedNodes),
      })),
    [challenge.requirements, typedNodes],
  );

  const checklistStatus = useMemo(
    () =>
      challenge.checklist.map((item) => ({
        text: item,
        met: checkChecklistItem(item, typedNodes),
      })),
    [challenge.checklist, typedNodes],
  );

  const metCount = requirementStatus.filter((r) => r.met).length;
  const checklistMetCount = checklistStatus.filter((c) => c.met).length;

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-zinc-950">
      {/* Title */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-lg font-bold text-zinc-100">
          {challenge.title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          {challenge.description}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Requirements */}
        <div className="mb-5">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Requirements ({metCount}/{challenge.requirements.length})
          </h3>
          <ul className="space-y-2">
            {requirementStatus.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {req.met ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                )}
                <span
                  className={cn(
                    req.met
                      ? "text-emerald-300 line-through opacity-70"
                      : "text-zinc-200",
                  )}
                >
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Checklist */}
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Checklist ({checklistMetCount}/{challenge.checklist.length})
          </h3>
          <ul className="space-y-2">
            {checklistStatus.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {item.met ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                )}
                <span
                  className={cn(
                    item.met
                      ? "text-emerald-300 line-through opacity-70"
                      : "text-zinc-400",
                  )}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

// ── Mock Interview Mode ─────────────────────────────────────

export interface MockInterviewModeProps {
  challenge: ChallengeDefinition;
  onSubmit: () => void;
  onCancel: () => void;
  /** When set, the interview is over and we show results instead of the canvas. */
  resultScores: Record<string, number> | null;
  onTryAgain: () => void;
  onBackToChallenges: () => void;
}

const MockInterviewMode = memo(function MockInterviewMode({
  challenge,
  onSubmit,
  onCancel,
  resultScores,
  onTryAgain,
  onBackToChallenges,
}: MockInterviewModeProps) {
  const timerStartedAt = useInterviewStore((s) => s.timerStartedAt);
  const timerPaused = useInterviewStore((s) => s.timerPaused);

  // Escape key to cancel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const totalMs = challenge.timeMinutes * 60 * 1000;

  // Results view (still full-screen)
  if (resultScores) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950">
        <div className="mx-auto w-full max-w-2xl p-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-zinc-100">
            Mock Interview Results
          </h2>
          <ScoreDisplay
            scores={resultScores}
            onTryAgain={onTryAgain}
            onNextChallenge={onBackToChallenges}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950">
      {/* ── Top bar: timer centered, exit right ── */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
        {/* Left: challenge name */}
        <div className="w-48">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Mock Interview
          </span>
        </div>

        {/* Center: countdown */}
        <CountdownTimer
          timerStartedAt={timerStartedAt}
          timerPaused={timerPaused}
          totalMs={totalMs}
        />

        {/* Right: submit + exit */}
        <div className="flex w-48 items-center justify-end gap-2">
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            title="Exit mock interview (Esc)"
          >
            <X className="h-4 w-4" />
            Exit
          </button>
        </div>
      </div>

      {/* ── Main area: requirements left 30%, canvas right 70% ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Requirements panel (left 30%) */}
        <div className="w-full md:w-[30%] shrink-0">
          <RequirementsPanel challenge={challenge} />
        </div>

        {/* Canvas area (right 70%) */}
        <div className="relative flex-1">
          <ReactFlowProvider>
            <DesignCanvas />
          </ReactFlowProvider>
          <FloatingPalette />
        </div>
      </div>
    </div>
  );
});

MockInterviewMode.displayName = "MockInterviewMode";

export default MockInterviewMode;
