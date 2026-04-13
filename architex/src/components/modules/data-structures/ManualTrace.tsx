"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { DSStep } from "@/lib/data-structures";

// ── DST-150: Manual tracing mode ─────────────────────────────────
// In this mode, the user IS the algorithm. For BST operations,
// directional steps are presented and the user must click the
// correct direction to advance. A running score is tracked.

interface ManualTraceOverlayProps {
  step: DSStep;
  onChoice: (direction: "left" | "right") => void;
  feedback: "correct" | "wrong" | null;
  explanation: string | null;
  score: { correct: number; total: number };
  traceStepIdx: number;
  totalTraceSteps: number;
}

export function ManualTraceOverlay({
  step,
  onChoice,
  feedback,
  explanation,
  score,
  traceStepIdx,
  totalTraceSteps,
}: ManualTraceOverlayProps) {
  // Keyboard shortcuts: left/right arrows or L/R keys
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (feedback) return; // Ignore input during feedback
      if (e.key === "ArrowLeft" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        onChoice("left");
      }
      if (e.key === "ArrowRight" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        onChoice("right");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onChoice, feedback]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px]"
    >
      {/* Score bar */}
      <div className="absolute top-3 right-3 flex items-center gap-2 rounded border border-border bg-elevated px-3 py-1.5 text-xs">
        <span className="text-foreground-muted">Score:</span>
        <span className="font-bold text-green-600 dark:text-green-400">
          {score.correct}
        </span>
        <span className="text-foreground-subtle">/</span>
        <span className="font-bold text-foreground">{score.total}</span>
        {score.total > 0 && (
          <span className="text-foreground-muted ml-1">
            ({Math.round((score.correct / score.total) * 100)}%)
          </span>
        )}
      </div>

      {/* Progress indicator */}
      <div className="absolute top-3 left-3 rounded border border-border bg-elevated px-3 py-1.5 text-xs text-foreground-muted">
        Step {traceStepIdx + 1} / {totalTraceSteps}
      </div>

      {/* Main decision panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="rounded-lg border border-border bg-elevated p-5 shadow-xl max-w-md text-center"
      >
        <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
          Manual Trace Mode
        </p>
        <p className="text-sm font-medium mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-3 rounded px-3 py-1.5 text-sm font-medium ${
                feedback === "correct"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {feedback === "correct" ? "Correct!" : `Wrong. ${explanation ?? ""}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Direction buttons */}
        {!feedback && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onChoice("left")}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-foreground-subtle">&larr;</span>
              Left
              <span className="text-[10px] text-foreground-subtle">L</span>
            </button>
            <button
              onClick={() => onChoice("right")}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Right
              <span className="text-foreground-subtle">&rarr;</span>
              <span className="text-[10px] text-foreground-subtle">R</span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Score summary shown when trace is complete ──────────────────
export function ManualTraceComplete({
  score,
  onClose,
}: {
  score: { correct: number; total: number };
  onClose: () => void;
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-border bg-elevated p-6 shadow-xl max-w-sm text-center"
      >
        <p className="text-lg font-bold mb-1">Trace Complete</p>
        <p className="text-3xl font-bold mb-2">
          <span className="text-green-600 dark:text-green-400">{score.correct}</span>
          <span className="text-foreground-subtle mx-1">/</span>
          <span>{score.total}</span>
        </p>
        <p className="text-sm text-foreground-muted mb-4">
          {pct >= 90
            ? "Excellent! You traced the algorithm perfectly."
            : pct >= 70
              ? "Good work! Keep practicing to master the traversal."
              : pct >= 50
                ? "Getting there. Review the BST property: left < node < right."
                : "Keep practicing! Remember: values less than the node go left, greater go right."}
        </p>
        <button
          onClick={onClose}
          className="rounded border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          Done (Enter)
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Helper: determine which steps in a BST operation are directional ──
export function isDirectionalStep(description: string): boolean {
  const desc = description.toLowerCase();
  return (
    desc.includes("go left") ||
    desc.includes("go right") ||
    desc.includes("search left") ||
    desc.includes("search right")
  );
}

export function getCorrectDirection(description: string): "left" | "right" {
  const desc = description.toLowerCase();
  if (desc.includes("go left") || desc.includes("search left")) return "left";
  return "right";
}
