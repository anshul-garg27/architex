"use client";

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Bug,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";

// ── Challenge data ────────────────────────────────────────────

interface DebugChallenge {
  id: string;
  title: string;
  buggyCode: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const DEBUG_CHALLENGES: DebugChallenge[] = [
  {
    id: "bst-insert-no-base",
    title: "BST Insert: Missing Base Case",
    buggyCode: `function insert(node, value):
  if value < node.value:
    node.left = insert(node.left, value)
  else:
    node.right = insert(node.right, value)
  return node`,
    question:
      "This BST insert crashes on an empty tree. What line is missing?",
    options: [
      "if node is null: return new Node(value)",
      "if value == node.value: return node",
      "if node.left is null: node.left = new Node(value)",
      "return null",
    ],
    correct: 0,
    explanation:
      'Without the base case "if node is null: return new Node(value)", the function tries to access .value on null when the tree is empty or reaches a leaf position.',
  },
  {
    id: "heap-extract-no-bubbledown",
    title: "Heap Extract: Missing Bubble-Down",
    buggyCode: `function extractMin(heap):
  min = heap[0]
  heap[0] = heap[heap.length - 1]
  heap.pop()
  return min`,
    question:
      "After extracting, the heap property is violated. What step is missing?",
    options: [
      "bubbleDown(0) after moving last element to root",
      "bubbleUp(0) after moving last element to root",
      "Sort the entire array after extraction",
      "Swap heap[0] with heap[1] before returning",
    ],
    correct: 0,
    explanation:
      "After placing the last element at the root, it likely violates the min-heap property. bubbleDown(0) sifts it to its correct position by comparing with children and swapping.",
  },
  {
    id: "hash-delete-null",
    title: "Hash Table Delete: Breaking Probe Chain",
    buggyCode: `function delete(table, key):
  idx = hash(key) % capacity
  while table[idx] != null:
    if table[idx].key == key:
      table[idx] = null  // BUG!
      return true
    idx = (idx + 1) % capacity
  return false`,
    question:
      "In open-addressing, setting the slot to null after delete breaks something. What?",
    options: [
      'Subsequent searches for keys that probed through this slot will stop early (false "not found")',
      "The hash function will return wrong indices",
      "The table capacity decreases",
      "Other keys in the same bucket are deleted too",
    ],
    correct: 0,
    explanation:
      'In open-addressing with linear probing, searches follow a probe sequence until finding the key or an empty slot. Setting a deleted slot to null creates a "hole" that terminates probe sequences prematurely. The fix: use a TOMBSTONE sentinel instead of null.',
  },
];

// ── Component ─────────────────────────────────────────────────

const DebuggingChallenges = memo(function DebuggingChallenges() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const challenge = DEBUG_CHALLENGES[challengeIdx];

  const handleSelect = useCallback(
    (idx: number) => {
      if (answered) return;
      setSelectedOption(idx);
      setAnswered(true);
      setAttempts((prev) => prev + 1);
      if (idx === challenge.correct) {
        setScore((prev) => prev + 1);
      }
    },
    [answered, challenge.correct],
  );

  const handleNext = useCallback(() => {
    if (challengeIdx < DEBUG_CHALLENGES.length - 1) {
      setChallengeIdx((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  }, [challengeIdx]);

  const handlePrev = useCallback(() => {
    if (challengeIdx > 0) {
      setChallengeIdx((prev) => prev - 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  }, [challengeIdx]);

  const handleReset = useCallback(() => {
    setChallengeIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setAttempts(0);
  }, []);

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-red-400" />
          <span className="text-xs font-semibold text-foreground">
            {challenge.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          <span className="tabular-nums">
            {challengeIdx + 1} / {DEBUG_CHALLENGES.length}
          </span>
          {attempts > 0 && (
            <span className="font-semibold tabular-nums text-primary">
              Score: {score}/{attempts}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-border">
        <div
          className="h-1 rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${((challengeIdx + (answered ? 1 : 0)) / DEBUG_CHALLENGES.length) * 100}%`,
          }}
        />
      </div>

      {/* Buggy code block */}
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Buggy Code
          </span>
        </div>
        <pre className="overflow-x-auto whitespace-pre text-xs leading-relaxed text-foreground font-mono">
          {challenge.buggyCode}
        </pre>
      </div>

      {/* Question */}
      <p className="text-sm text-foreground">{challenge.question}</p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {challenge.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === challenge.correct;

          let optionClass =
            "border-border bg-elevated hover:bg-elevated/80 text-foreground";
          if (answered && isCorrect) {
            optionClass =
              "border-green-500/50 bg-green-500/10 text-green-400";
          } else if (answered && isSelected && !isCorrect) {
            optionClass = "border-red-500/50 bg-red-500/10 text-red-400";
          }

          return (
            <motion.button
              key={idx}
              whileTap={answered ? {} : { scale: 0.98 }}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                optionClass,
                answered && "cursor-default",
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {answered && isCorrect && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              )}
              {answered && isSelected && !isCorrect && (
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
                selectedOption === challenge.correct
                  ? "border-green-500/30 bg-green-500/5 text-foreground"
                  : "border-amber-500/30 bg-amber-500/5 text-foreground",
              )}
            >
              <span className="font-semibold">
                {selectedOption === challenge.correct
                  ? "Correct! "
                  : "Not quite. "}
              </span>
              {challenge.explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrev}
          disabled={challengeIdx === 0}
          className="flex items-center gap-1 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-3 w-3" />
          Prev
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          className="flex items-center gap-1 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={challengeIdx >= DEBUG_CHALLENGES.length - 1}
          className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </motion.button>
      </div>
    </div>
  );
});

export { DebuggingChallenges };
