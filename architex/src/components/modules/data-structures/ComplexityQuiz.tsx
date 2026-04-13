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
  Zap,
  Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface QuizQuestion {
  ds: string;
  op: string;
  answer: string;
}

interface ActiveQuestion extends QuizQuestion {
  options: string[];
  correctIdx: number;
}

type AnswerState = "unanswered" | "correct" | "wrong";

// ── Full Question Bank ─────────────────────────────────────────

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { ds: "Array", op: "Access", answer: "O(1)" },
  { ds: "Array", op: "Insert", answer: "O(n)" },
  { ds: "BST", op: "Search (avg)", answer: "O(log n)" },
  { ds: "BST", op: "Search (worst)", answer: "O(n)" },
  { ds: "Hash Table", op: "Insert (avg)", answer: "O(1)" },
  { ds: "Hash Table", op: "Worst case", answer: "O(n)" },
  { ds: "Heap", op: "Extract Min", answer: "O(log n)" },
  { ds: "Heap", op: "Build", answer: "O(n)" },
  { ds: "Bloom Filter", op: "Insert", answer: "O(k)" },
  { ds: "Trie", op: "Search", answer: "O(m)" },
  { ds: "B+ Tree", op: "Range Query", answer: "O(log n + k)" },
  { ds: "Skip List", op: "Search (avg)", answer: "O(log n)" },
  { ds: "Fibonacci Heap", op: "Insert", answer: "O(1)" },
  { ds: "Union-Find", op: "Union", answer: "O(\u03B1(n))" },
  { ds: "Count-Min Sketch", op: "Query", answer: "O(d)" },
];

const COMPLEXITY_POOL = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n\u00B2)",
  "O(k)",
  "O(m)",
  "O(d)",
  "O(\u03B1(n))",
  "O(log n + k)",
];

const QUESTIONS_PER_QUIZ = 10;

// ── Utilities ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(correct: string, count: number): string[] {
  const pool = COMPLEXITY_POOL.filter((c) => c !== correct);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}

function buildQuiz(): ActiveQuestion[] {
  const selected = shuffle(QUIZ_QUESTIONS).slice(0, QUESTIONS_PER_QUIZ);
  return selected.map((q) => {
    const distractors = pickDistractors(q.answer, 3);
    const allOptions = shuffle([q.answer, ...distractors]);
    const correctIdx = allOptions.indexOf(q.answer);
    return { ...q, options: allOptions, correctIdx };
  });
}

// ── Component ──────────────────────────────────────────────────

const ComplexityQuiz = memo(function ComplexityQuiz() {
  const [questions, setQuestions] = useState<ActiveQuestion[]>(() =>
    buildQuiz(),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  // Timer state
  const [startTime] = useState(() => Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  const q = questions[currentIdx];

  const handleSelect = useCallback(
    (idx: number) => {
      if (answerState !== "unanswered") return;
      setSelectedOption(idx);
      if (idx === q.correctIdx) {
        setAnswerState("correct");
        setScore((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setAnswerState("wrong");
        setStreak(0);
      }
    },
    [answerState, q.correctIdx],
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setEndTime(Date.now());
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setAnswerState("unanswered");
      setSelectedOption(null);
    }
  }, [currentIdx, questions.length]);

  const handleReset = useCallback(() => {
    const newQuiz = buildQuiz();
    setQuestions(newQuiz);
    setCurrentIdx(0);
    setAnswerState("unanswered");
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
    setEndTime(null);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!endTime) return null;
    return Math.round((endTime - startTime) / 1000);
  }, [endTime, startTime]);

  // ── Finished screen ──

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
        <Trophy
          className={cn(
            "h-10 w-10",
            pct === 100
              ? "text-yellow-400"
              : pct >= 70
                ? "text-primary"
                : "text-foreground-muted",
          )}
        />
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {score} / {questions.length}
          </p>
          {elapsedSeconds !== null && (
            <div className="flex items-center justify-center gap-1 text-xs text-foreground-muted">
              <Clock className="h-3 w-3" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-1 text-xs text-foreground-muted">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>
              Best streak: {bestStreak}
            </span>
          </div>
          <p className="text-sm text-foreground-muted pt-1">
            {pct === 100
              ? "Flawless! You know your complexities cold."
              : pct >= 70
                ? "Strong recall. Brush up on the ones you missed."
                : "Keep drilling \u2014 complexity recall is a muscle."}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <RotateCcw className="h-4 w-4" />
          New Quiz
        </motion.button>
      </div>
    );
  }

  // ── Question screen ──

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Progress + score + streak */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>
          {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="h-3 w-3" />
              <span className="font-semibold tabular-nums">{streak}</span>
            </span>
          )}
          <span className="font-semibold tabular-nums text-primary">
            Score: {score}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-border">
        <div
          className="h-1 rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${((currentIdx + (answerState !== "unanswered" ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          What is the complexity of{" "}
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
            {q.ds}
          </span>{" "}
          <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs font-semibold text-foreground">
            {q.op}
          </span>
          ?
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrectOption = idx === q.correctIdx;
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
              key={idx}
              whileTap={answered ? {} : { scale: 0.97 }}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-mono font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                optionClass,
                answered && "cursor-default",
              )}
            >
              {opt}
              {answered && isCorrectOption && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
              )}
              {answered && isSelected && !isCorrectOption && (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Correct answer callout for wrong answers */}
      <AnimatePresence>
        {answerState === "wrong" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <span className="text-xs text-foreground-muted">
                Correct answer:{" "}
                <span className="font-mono font-semibold text-amber-400">
                  {q.answer}
                </span>
              </span>
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
          {currentIdx + 1 >= questions.length ? "See Results" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
});

export { ComplexityQuiz };
