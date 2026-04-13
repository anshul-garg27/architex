"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Trophy,
  Lightbulb,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface ScenarioExplanation {
  correct: string;
  wrong: Record<number, string>;
}

interface Scenario {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: ScenarioExplanation;
}

type AnswerState = "unanswered" | "correct" | "wrong";

// ── Question Bank ──────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    question:
      "You need O(1) lookup by username for 100 million users. Which data structure?",
    options: ["Array", "Hash Table", "BST", "Linked List"],
    correct: 1,
    explanation: {
      correct:
        "Hash Table gives O(1) average lookup by computing a hash of the username. Perfect for large-scale key-value access.",
      wrong: {
        0: "Array requires O(n) search unless sorted (then O(log n) binary search), but insert/delete is O(n).",
        2: "BST gives O(log n) which is good but not O(1). Use BST when you need sorted order.",
        3: "Linked List requires O(n) traversal \u2014 far too slow for 100M entries.",
      },
    },
  },
  {
    id: "s2",
    question:
      "A task scheduler must always process the highest-priority task next. Which data structure?",
    options: ["Queue", "Stack", "Heap / Priority Queue", "Array"],
    correct: 2,
    explanation: {
      correct:
        "A Heap (Priority Queue) maintains the highest-priority element at the root, giving O(log n) insert and O(log n) extract-max/min. Ideal for schedulers.",
      wrong: {
        0: "Queue is FIFO \u2014 it processes in arrival order, not by priority.",
        1: "Stack is LIFO \u2014 it processes the most-recent item, not the highest-priority one.",
        3: "Array requires O(n) scan to find the max-priority element each time, making it inefficient for large task sets.",
      },
    },
  },
  {
    id: "s3",
    question:
      "A database needs to store 500GB of sorted data with efficient range scans. Which data structure?",
    options: ["Hash Table", "B+ Tree", "Array", "Trie"],
    correct: 1,
    explanation: {
      correct:
        "B+ Tree stores data in sorted leaf nodes linked together, enabling O(log n) point lookups and efficient sequential range scans. It is the standard index structure in relational databases.",
      wrong: {
        0: "Hash Table provides O(1) point lookups but has no inherent ordering \u2014 range scans require a full table scan.",
        2: "Array supports binary search for lookups but inserting/deleting in sorted order is O(n) \u2014 impractical at 500GB.",
        3: "Trie is optimized for string prefix queries, not general sorted numeric/key range scans at this scale.",
      },
    },
  },
  {
    id: "s4",
    question:
      "Count word frequencies in a 10TB log stream. Memory budget: 100MB. Which data structure?",
    options: ["Hash Map", "Array", "Count-Min Sketch", "BST"],
    correct: 2,
    explanation: {
      correct:
        "Count-Min Sketch is a probabilistic data structure that uses sub-linear memory to approximate frequency counts. Perfect when exact counts are unnecessary and memory is constrained.",
      wrong: {
        0: "Hash Map gives exact counts but would need far more than 100MB to store millions of distinct words from 10TB of logs.",
        1: "Array is not practical for frequency counting of arbitrary string keys without a perfect hash, and would still need large memory.",
        3: "BST requires O(n) memory for n distinct words and O(log n) per operation \u2014 memory blows the budget.",
      },
    },
  },
  {
    id: "s5",
    question:
      "A spell-checker needs instant prefix-based suggestions as the user types. Which data structure?",
    options: ["Hash Table", "BST", "Trie", "Bloom Filter"],
    correct: 2,
    explanation: {
      correct:
        "Trie stores strings character-by-character, enabling O(m) prefix lookups where m is the prefix length. It naturally groups words by shared prefixes \u2014 ideal for autocomplete.",
      wrong: {
        0: "Hash Table gives O(1) exact-key lookup but cannot enumerate all keys sharing a prefix without scanning all entries.",
        1: "BST can do range queries on sorted strings, but prefix enumeration is less natural and slower than a Trie.",
        3: "Bloom Filter tests membership (is this word in the dictionary?) but cannot enumerate matching prefixes.",
      },
    },
  },
];

// ── Shuffle utility ────────────────────────────────────────────

function shuffleOptionOrder(optionCount: number): number[] {
  const indices = Array.from({ length: optionCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// ── Component ──────────────────────────────────────────────────

const ScenarioChallenges = memo(function ScenarioChallenges() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Pre-generate shuffled option orders for each scenario
  const [shuffledOrders, setShuffledOrders] = useState<number[][]>(() =>
    SCENARIOS.map((s) => shuffleOptionOrder(s.options.length)),
  );

  const scenario = SCENARIOS[currentIdx];
  const order = shuffledOrders[currentIdx];

  // Map from shuffled display index to original option index
  const getOriginalIdx = useCallback(
    (displayIdx: number) => order[displayIdx],
    [order],
  );

  const handleSelect = useCallback(
    (displayIdx: number) => {
      if (answerState !== "unanswered") return;
      const originalIdx = getOriginalIdx(displayIdx);
      setSelectedOption(displayIdx);
      if (originalIdx === scenario.correct) {
        setAnswerState("correct");
        setScore((prev) => prev + 1);
      } else {
        setAnswerState("wrong");
      }
    },
    [answerState, getOriginalIdx, scenario.correct],
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= SCENARIOS.length) {
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setAnswerState("unanswered");
      setSelectedOption(null);
    }
  }, [currentIdx]);

  const handleReset = useCallback(() => {
    setCurrentIdx(0);
    setAnswerState("unanswered");
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
    setShuffledOrders(
      SCENARIOS.map((s) => shuffleOptionOrder(s.options.length)),
    );
  }, []);

  // Build explanation text for wrong answer
  const explanationText = useMemo(() => {
    if (answerState === "unanswered" || selectedOption === null) return "";
    const originalIdx = getOriginalIdx(selectedOption);
    if (answerState === "correct") return scenario.explanation.correct;
    return (
      scenario.explanation.wrong[originalIdx] +
      "\n\nCorrect: " +
      scenario.options[scenario.correct] +
      " \u2014 " +
      scenario.explanation.correct
    );
  }, [answerState, selectedOption, getOriginalIdx, scenario]);

  // ── Finished screen ──

  if (finished) {
    const pct = Math.round((score / SCENARIOS.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
        <Trophy
          className={cn(
            "h-10 w-10",
            pct === 100
              ? "text-yellow-400"
              : pct >= 60
                ? "text-primary"
                : "text-foreground-muted",
          )}
        />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {score} / {SCENARIOS.length}
          </p>
          <p className="text-sm text-foreground-muted">
            {pct === 100
              ? "Perfect score! You nailed every scenario."
              : pct >= 60
                ? "Solid performance. Review the ones you missed."
                : "Keep practicing \u2014 understanding trade-offs takes time."}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </motion.button>
      </div>
    );
  }

  // ── Question screen ──

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Progress + score */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>
          Question {currentIdx + 1} / {SCENARIOS.length}
        </span>
        <span className="font-semibold tabular-nums text-primary">
          Score: {score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-border">
        <div
          className="h-1 rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${((currentIdx + (answerState !== "unanswered" ? 1 : 0)) / SCENARIOS.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <p className="text-sm font-medium leading-relaxed text-foreground">
        {scenario.question}
      </p>

      {/* Options */}
      <div className="grid gap-2">
        {order.map((originalIdx, displayIdx) => {
          const isSelected = selectedOption === displayIdx;
          const isCorrectOption = originalIdx === scenario.correct;
          const answered = answerState !== "unanswered";

          let optionClass =
            "border-border bg-elevated hover:bg-elevated/80 text-foreground";
          if (answered && isCorrectOption) {
            optionClass =
              "border-green-500/50 bg-green-500/10 text-green-400";
          } else if (answered && isSelected && !isCorrectOption) {
            optionClass = "border-red-500/50 bg-red-500/10 text-red-400";
          }

          return (
            <motion.button
              key={originalIdx}
              whileTap={answered ? {} : { scale: 0.98 }}
              onClick={() => handleSelect(displayIdx)}
              disabled={answered}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                optionClass,
                answered && "cursor-default",
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                {String.fromCharCode(65 + displayIdx)}
              </span>
              {scenario.options[originalIdx]}
              {answered && isCorrectOption && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-400" />
              )}
              {answered && isSelected && !isCorrectOption && (
                <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {answerState !== "unanswered" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex gap-2 rounded-lg border p-3",
                answerState === "correct"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <Lightbulb
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  answerState === "correct"
                    ? "text-green-400"
                    : "text-amber-400",
                )}
              />
              <p className="whitespace-pre-line text-xs leading-relaxed text-foreground-muted">
                {explanationText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {answerState !== "unanswered" && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          {currentIdx + 1 >= SCENARIOS.length ? "See Results" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
});

export { ScenarioChallenges };
