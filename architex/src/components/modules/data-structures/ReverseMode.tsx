"use client";

import React, { memo, useState, useCallback } from "react";
import {
  Puzzle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

import { buildBST } from "@/lib/data-structures/bst-ds";
import type { BSTNode } from "@/lib/data-structures/bst-ds";
import { simpleHash } from "@/lib/data-structures/hash-table";

// ── Heap simulation for validation ────────────────────────────

function buildMinHeap(values: number[]): number[] {
  const data: number[] = [];
  for (const v of values) {
    data.push(v);
    let idx = data.length - 1;
    while (idx > 0) {
      const p = Math.floor((idx - 1) / 2);
      if (data[idx] < data[p]) {
        [data[idx], data[p]] = [data[p], data[idx]];
        idx = p;
      } else {
        break;
      }
    }
  }
  return data;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// ── BST shape comparison ──────────────────────────────────────

function bstShape(node: BSTNode | null): string {
  if (!node) return "()";
  return `(${node.value},${bstShape(node.left)},${bstShape(node.right)})`;
}

// ── Puzzle definitions ────────────────────────────────────────

type PuzzleType = "free-input" | "multiple-choice";

interface ReversePuzzle {
  id: string;
  ds: string;
  title: string;
  description: string;
  type: PuzzleType;
  targetDisplay: string;
  choices?: string[];
  validate: (input: string) => { correct: boolean; explanation: string };
  hint: string;
}

const REVERSE_PUZZLES: ReversePuzzle[] = [
  {
    id: "heap-order",
    ds: "heap",
    title: "Reconstruct Heap Insertions",
    description:
      'This min-heap contains [2, 5, 3, 8, 7]. Enter an insertion order that produces this exact heap.',
    type: "free-input",
    targetDisplay: "[2, 5, 3, 8, 7]",
    hint: "The root (2) must be inserted at some point. Think about which elements could have been inserted first without changing the final positions.",
    validate: (input: string) => {
      const nums = input
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      const target = [2, 5, 3, 8, 7];

      if (nums.length !== 5) {
        return {
          correct: false,
          explanation: "Enter exactly 5 comma-separated numbers.",
        };
      }

      const sorted = [...nums].sort((a, b) => a - b);
      const targetSorted = [...target].sort((a, b) => a - b);
      if (!arraysEqual(sorted, targetSorted)) {
        return {
          correct: false,
          explanation: `Your values must be the same set: {${targetSorted.join(", ")}}.`,
        };
      }

      const result = buildMinHeap(nums);
      if (arraysEqual(result, target)) {
        return {
          correct: true,
          explanation: `Inserting [${nums.join(", ")}] produces exactly [${target.join(", ")}].`,
        };
      }
      return {
        correct: false,
        explanation: `Inserting [${nums.join(", ")}] produces [${result.join(", ")}], not [${target.join(", ")}]. Try a different order.`,
      };
    },
  },
  {
    id: "bst-shape",
    ds: "bst",
    title: "Which Order Built This BST?",
    description:
      "A BST has root 10, left child 5 (with left child 2), and right child 15. Which insertion order created it?",
    type: "multiple-choice",
    targetDisplay: "BST: 10 -> L:5(L:2) R:15",
    choices: [
      "10, 5, 15, 2",
      "2, 5, 10, 15",
      "10, 15, 2, 5",
      "5, 2, 10, 15",
    ],
    hint: "The first inserted value always becomes the root of a BST.",
    validate: (input: string) => {
      // The target shape: root=10, left=5(left=2), right=15
      const targetShape = bstShape(buildBST([10, 5, 15, 2]));

      const nums = input
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));

      const candidateTree = buildBST(nums);
      const candidateShape = bstShape(candidateTree);

      if (candidateShape === targetShape) {
        return {
          correct: true,
          explanation: `Inserting [${nums.join(", ")}] creates the exact BST shape. The root must be 10 (first inserted), then 5 goes left, 15 goes right, and 2 goes left of 5.`,
        };
      }
      return {
        correct: false,
        explanation: `Inserting [${nums.join(", ")}] creates a different shape. Remember: the first value becomes the root.`,
      };
    },
  },
  {
    id: "hash-function",
    ds: "hash-table",
    title: "Identify the Hash Function",
    description:
      'Keys "a", "b", "c" hash to buckets 1, 2, 3 respectively (capacity = 8). Which hash function is being used?',
    type: "multiple-choice",
    targetDisplay: 'a->1, b->2, c->3',
    choices: [
      "charCode % 8",
      "charCode * 31 % 8",
      "(charCode - 96) % 8",
      "djb2 % 8",
    ],
    hint: "'a' has charCode 97. Try: 97 % 8 = 1, 98 % 8 = 2, 99 % 8 = 3. Which formula matches?",
    validate: (input: string) => {
      const trimmed = input.trim().toLowerCase();
      // The answer is charCode % 8: a=97%8=1, b=98%8=2, c=99%8=3
      if (
        trimmed.includes("charcode % 8") ||
        trimmed === "charcode % 8" ||
        trimmed === "0"
      ) {
        return {
          correct: true,
          explanation:
            'charCode % 8: "a"=97%8=1, "b"=98%8=2, "c"=99%8=3. The simplest hash function -- just modular arithmetic on the ASCII code.',
        };
      }
      // Also accept if they literally clicked the first option
      if (trimmed === "charcode % 8" || input === "charCode % 8") {
        return {
          correct: true,
          explanation:
            'Correct! charCode % 8 maps each single character to its ASCII code mod 8.',
        };
      }
      return {
        correct: false,
        explanation:
          'Try computing each: "a" is ASCII 97. 97 % 8 = 1, 98 % 8 = 2, 99 % 8 = 3. Which formula gives these results?',
      };
    },
  },
];

// ── Puzzle card ───────────────────────────────────────────────

const PuzzleCard = memo(function PuzzleCard({
  puzzle,
}: {
  puzzle: ReversePuzzle;
}) {
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const res = puzzle.validate(input);
    setResult(res);
  }, [input, puzzle]);

  const handleReset = useCallback(() => {
    setInput("");
    setResult(null);
  }, []);

  const handleChoiceSelect = useCallback(
    (choice: string) => {
      setInput(choice);
      const res = puzzle.validate(choice);
      setResult(res);
    },
    [puzzle],
  );

  return (
    <div className="rounded-lg border border-border bg-elevated p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
          {puzzle.ds}
        </span>
        <span className="text-sm font-medium text-foreground">
          {puzzle.title}
        </span>
        {result?.correct && (
          <span className="ml-auto rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
            Solved
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-foreground-muted leading-relaxed">
        {puzzle.description}
      </p>

      {/* Target state display */}
      <div className="rounded bg-background/60 px-2.5 py-1.5 font-mono text-xs text-foreground-muted">
        Target: {puzzle.targetDisplay}
      </div>

      {/* Input: free-input or multiple-choice */}
      {puzzle.type === "free-input" ? (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter comma-separated values..."
          className="w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {puzzle.choices?.map((choice) => {
            const isSelected = input === choice;
            const isCorrectChoice = isSelected && result?.correct;
            const isWrongChoice = isSelected && result && !result.correct;

            return (
              <button
                key={choice}
                onClick={() => handleChoiceSelect(choice)}
                className={cn(
                  "rounded border px-2.5 py-1.5 text-left text-xs font-mono transition-colors",
                  isCorrectChoice
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : isWrongChoice
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border bg-background text-foreground-muted hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isCorrectChoice && <Check className="h-3 w-3 shrink-0" />}
                  {isWrongChoice && <X className="h-3 w-3 shrink-0" />}
                  <span>{choice}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "rounded px-2.5 py-1.5 text-xs",
                result.correct
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400",
              )}
            >
              <p>{result.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {puzzle.type === "free-input" && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="h-3 w-3" />
            Check
          </button>
        )}
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-accent/50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
        <button
          onClick={() => setShowHint((prev) => !prev)}
          className="ml-auto flex items-center gap-1 text-[10px] text-foreground-subtle hover:text-foreground-muted transition-colors"
        >
          <Lightbulb className="h-3 w-3" />
          {showHint ? "Hide Hint" : "Hint"}
          {showHint ? (
            <ChevronDown className="h-2.5 w-2.5" />
          ) : (
            <ChevronRight className="h-2.5 w-2.5" />
          )}
        </button>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1.5 text-xs text-yellow-400/80">
              {puzzle.hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Main component ────────────────────────────────────────────

const ReverseMode = memo(function ReverseMode() {
  return (
    <div className="px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Puzzle className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-medium">Reverse Engineering</span>
        </div>
        <span className="text-[10px] text-foreground-subtle">
          {REVERSE_PUZZLES.length} puzzles
        </span>
      </div>
      <p className="text-[10px] text-foreground-subtle leading-relaxed">
        Given the final state of a data structure, deduce what operations produced it.
        This builds deep intuition for how DS operations compose.
      </p>

      {/* Puzzle cards */}
      <div className="space-y-3">
        {REVERSE_PUZZLES.map((puzzle) => (
          <PuzzleCard key={puzzle.id} puzzle={puzzle} />
        ))}
      </div>
    </div>
  );
});

export { ReverseMode };
