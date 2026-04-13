"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";

// ── DST-149: Prediction gate overlay ────────────────────────────
// Shown before advancing a step when prediction mode is enabled.
// The user must predict the next algorithm decision (e.g., go left
// or right in a BST) before the step is revealed.

export interface PredictionQuestion {
  question: string;
  options: string[];
  correctIdx: number;
}

export function PredictionOverlay({
  question,
  options,
  onAnswer,
  onSkip,
}: {
  question: string;
  options: string[];
  onAnswer: (idx: number) => void;
  onSkip: () => void;
}) {
  // Allow keyboard shortcuts: 1/2 for options, S for skip
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1" && options.length >= 1) onAnswer(0);
      if (e.key === "2" && options.length >= 2) onAnswer(1);
      if (e.key === "s" || e.key === "S") onSkip();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [options, onAnswer, onSkip]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="rounded-lg border border-border bg-elevated p-4 shadow-xl max-w-sm"
      >
        <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1">
          Predict the next step
        </p>
        <p className="text-sm font-medium mb-3">{question}</p>
        <div className="flex gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <span className="text-[10px] text-foreground-subtle mr-1">{i + 1}</span>
              {opt}
            </button>
          ))}
        </div>
        <button
          onClick={onSkip}
          className="mt-2 block w-full text-center text-xs text-foreground-muted hover:text-foreground transition-colors"
        >
          Skip prediction (S)
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Flash feedback overlay (green/red) ─────────────────────────
export function PredictionFeedback({
  correct,
  onDone,
}: {
  correct: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`absolute inset-0 z-50 flex items-center justify-center ${
        correct
          ? "bg-green-500/10 dark:bg-green-500/15"
          : "bg-red-500/10 dark:bg-red-500/15"
      }`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`rounded-full p-3 ${
          correct
            ? "bg-green-500/20 text-green-600 dark:text-green-400"
            : "bg-red-500/20 text-red-600 dark:text-red-400"
        }`}
      >
        <span className="text-2xl font-bold">{correct ? "Correct!" : "Not quite"}</span>
      </motion.div>
    </motion.div>
  );
}

// ── Step description parser: extract a prediction question ──────
// Returns null if no predictable decision is found in the step.
export function parsePredictionFromStep(
  description: string,
  activeDS: string
): PredictionQuestion | null {
  const desc = description.toLowerCase();

  // BST / AVL / Red-Black / Splay / Treap: directional decisions
  if (
    activeDS === "bst" ||
    activeDS === "avl-tree" ||
    activeDS === "red-black-tree" ||
    activeDS === "splay-tree" ||
    activeDS === "treap"
  ) {
    // Pattern: "{value} < {node} — go left" or "{value} > {node} — go right"
    const goLeftMatch = description.match(
      /(\d+)\s*[<]\s*(\d+)\s*(?:—|--)\s*go left/i
    );
    if (goLeftMatch) {
      return {
        question: `Current node is ${goLeftMatch[2]}. Inserting/searching ${goLeftMatch[1]}. Which direction?`,
        options: ["Left", "Right"],
        correctIdx: 0,
      };
    }

    const goRightMatch = description.match(
      /(\d+)\s*[>]\s*(\d+)\s*(?:—|--)\s*go right/i
    );
    if (goRightMatch) {
      return {
        question: `Current node is ${goRightMatch[2]}. Inserting/searching ${goRightMatch[1]}. Which direction?`,
        options: ["Left", "Right"],
        correctIdx: 1,
      };
    }

    // Also match "search left" / "search right" patterns
    const searchLeftMatch = description.match(
      /(\d+)\s*[<]\s*(\d+)\s*(?:—|--)\s*search left/i
    );
    if (searchLeftMatch) {
      return {
        question: `Searching for ${searchLeftMatch[1]}. Current node is ${searchLeftMatch[2]}. Which direction?`,
        options: ["Left", "Right"],
        correctIdx: 0,
      };
    }

    const searchRightMatch = description.match(
      /(\d+)\s*[>]\s*(\d+)\s*(?:—|--)\s*search right/i
    );
    if (searchRightMatch) {
      return {
        question: `Searching for ${searchRightMatch[1]}. Current node is ${searchRightMatch[2]}. Which direction?`,
        options: ["Left", "Right"],
        correctIdx: 1,
      };
    }
  }

  // Heap: swap decisions during bubble up
  if (activeDS === "heap") {
    const swapMatch = description.match(
      /compare\s+(\d+)\s+with\s+parent\s+(\d+)/i
    );
    if (swapMatch) {
      // Check if the step description says "swap"
      const willSwap = desc.includes("swap");
      return {
        question: `Compare ${swapMatch[1]} with parent ${swapMatch[2]}. Should they swap?`,
        options: ["Yes", "No"],
        correctIdx: willSwap ? 0 : 1,
      };
    }
  }

  return null;
}
