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
  Brain,
  ChevronDown,
} from "lucide-react";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
import type { DSConfig, DSCategory } from "@/lib/data-structures/types";

// ── Types ──────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

type AnswerState = "unanswered" | "correct" | "wrong";

const QUESTIONS_PER_QUIZ = 5;

// ── Utilities ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Place the correct answer among distractors and return [options, correctIdx]. */
function shuffleWithCorrect(correct: string, pool: string[]): [string[], number] {
  const unique = [...new Set([...pool, correct])];
  const distractors = unique.filter((c) => c !== correct);
  const selected = shuffle(distractors).slice(0, 3);
  const options = shuffle([correct, ...selected]);
  return [options, options.indexOf(correct)];
}

// ── Question generator ─────────────────────────────────────────

function generateQuestions(ds: DSConfig): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // 1. Complexity recall: "What is [DS] [operation] complexity?"
  const complexityPool = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n\u00B2)"];
  Object.entries(ds.complexity).forEach(([op, complex]) => {
    const [options, correctIdx] = shuffleWithCorrect(complex, complexityPool);
    questions.push({
      question: `What is the ${op} complexity of ${ds.name}?`,
      options,
      correctIdx,
      explanation:
        ds.complexityIntuition || `${ds.name} ${op} is ${complex}.`,
    });
  });

  // 2. "When to use" question
  if (ds.whenToUse) {
    const allOptions = shuffle([
      ds.whenToUse.use,
      ds.whenToUse.dontUse,
      "When you need O(n\u00B2) performance",
      "Never \u2014 it is obsolete",
    ]);
    questions.push({
      question: `When should you use ${ds.name}?`,
      options: allOptions,
      correctIdx: allOptions.indexOf(ds.whenToUse.use),
      explanation: `Use ${ds.name} for: ${ds.whenToUse.use}. Don't use when: ${ds.whenToUse.dontUse}.`,
    });
  }

  // 3. Category question
  const categories: DSCategory[] = [
    "linear",
    "tree",
    "hash",
    "heap",
    "probabilistic",
    "system",
  ];
  const categoryLabels = categories.map(
    (c) => c.charAt(0).toUpperCase() + c.slice(1),
  );
  const correctCategoryIdx = categories.indexOf(ds.category);
  if (correctCategoryIdx >= 0) {
    questions.push({
      question: `What category does ${ds.name} belong to?`,
      options: categoryLabels,
      correctIdx: correctCategoryIdx,
      explanation: `${ds.name} is a ${ds.category} data structure.`,
    });
  }

  // 4. Difficulty question
  if (ds.difficulty) {
    const difficulties = ["beginner", "intermediate", "advanced", "expert"];
    const difficultyLabels = ["Beginner", "Intermediate", "Advanced", "Expert"];
    const correctDiffIdx = difficulties.indexOf(ds.difficulty);
    if (correctDiffIdx >= 0) {
      questions.push({
        question: `What difficulty level is ${ds.name}?`,
        options: difficultyLabels,
        correctIdx: correctDiffIdx,
        explanation: `${ds.name} is classified as ${ds.difficulty}.`,
      });
    }
  }

  // 5. Common mistakes question (pick one mistake as the "true" answer)
  if (ds.commonMistakes && ds.commonMistakes.length > 0) {
    const mistake = ds.commonMistakes[0];
    const allOptions = shuffle([
      mistake,
      `${ds.name} is always the fastest data structure`,
      `${ds.name} uses no memory overhead`,
      `All operations on ${ds.name} are O(1)`,
    ]);
    questions.push({
      question: `Which statement about ${ds.name} describes a common misconception?`,
      options: allOptions,
      correctIdx: allOptions.indexOf(mistake),
      explanation: mistake,
    });
  }

  return shuffle(questions).slice(0, QUESTIONS_PER_QUIZ);
}

// ── Component ──────────────────────────────────────────────────

const AutoQuiz = memo(function AutoQuiz() {
  // DS selector state -- defaults to first catalog entry
  const [selectedDSId, setSelectedDSId] = useState<string>(DS_CATALOG[0]?.id ?? "array");
  const [selectorOpen, setSelectorOpen] = useState(false);

  const dsConfig = useMemo(
    () => DS_CATALOG.find((d) => d.id === selectedDSId) ?? DS_CATALOG[0] ?? null,
    [selectedDSId],
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    dsConfig ? generateQuestions(dsConfig) : [],
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  // Track which DS the quiz was built for so we can rebuild on change
  const [quizDS, setQuizDS] = useState<string>(selectedDSId);

  // Rebuild quiz when selected DS changes
  if (selectedDSId !== quizDS) {
    const config = DS_CATALOG.find((d) => d.id === selectedDSId) ?? null;
    setQuizDS(selectedDSId);
    setQuestions(config ? generateQuestions(config) : []);
    setCurrentIdx(0);
    setAnswerState("unanswered");
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
    setStartTime(Date.now());
    setEndTime(null);
  }

  const q = questions[currentIdx] as QuizQuestion | undefined;

  const handleSelect = useCallback(
    (idx: number) => {
      if (answerState !== "unanswered" || !q) return;
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
    [answerState, q],
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
    const config = DS_CATALOG.find((d) => d.id === selectedDSId) ?? null;
    setQuestions(config ? generateQuestions(config) : []);
    setCurrentIdx(0);
    setAnswerState("unanswered");
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
    setStartTime(Date.now());
    setEndTime(null);
  }, [selectedDSId]);

  const handleDSChange = useCallback((id: string) => {
    setSelectedDSId(id);
    setSelectorOpen(false);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!endTime) return null;
    return Math.round((endTime - startTime) / 1000);
  }, [endTime, startTime]);

  // ── No config found ──
  if (!dsConfig || questions.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-8">
        <p className="text-sm text-foreground-muted">
          No quiz questions available for this data structure.
        </p>
      </div>
    );
  }

  // ── DS selector dropdown ──
  const dsSelector = (
    <div className="relative">
      <button
        onClick={() => setSelectorOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-elevated/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <Brain className="h-3.5 w-3.5" />
        {dsConfig.name}
        <ChevronDown className={cn("h-3 w-3 transition-transform", selectorOpen && "rotate-180")} />
      </button>
      {selectorOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-56 overflow-auto rounded-lg border border-border bg-elevated shadow-lg">
          {DS_CATALOG.map((ds) => (
            <button
              key={ds.id}
              onClick={() => handleDSChange(ds.id)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-primary/10",
                ds.id === selectedDSId
                  ? "bg-primary/5 font-semibold text-primary"
                  : "text-foreground-muted",
              )}
            >
              <span className="truncate">{ds.name}</span>
              <span className="ml-auto text-[10px] text-foreground-muted/60 capitalize">
                {ds.category}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Finished screen ──
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
        {dsSelector}
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
          <p className="text-xs text-foreground-muted">
            {dsConfig.name} Quiz
          </p>
          {elapsedSeconds !== null && (
            <div className="flex items-center justify-center gap-1 text-xs text-foreground-muted">
              <Clock className="h-3 w-3" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-1 text-xs text-foreground-muted">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Best streak: {bestStreak}</span>
          </div>
          <p className="text-sm text-foreground-muted pt-1">
            {pct === 100
              ? `Flawless! You know ${dsConfig.name} inside out.`
              : pct >= 70
                ? `Strong recall on ${dsConfig.name}. Review the ones you missed.`
                : `Keep studying ${dsConfig.name} \u2014 repetition builds mastery.`}
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

  if (!q) return null;

  // ── Question screen ──
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Header with DS selector */}
      <div className="flex items-center justify-between">
        {dsSelector}
        <span className="text-xs text-foreground-muted">Quiz Me</span>
      </div>

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
      <p className="text-sm font-medium text-foreground">{q.question}</p>

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
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-left",
                optionClass,
                answered && "cursor-default",
              )}
            >
              <span className="line-clamp-3">{opt}</span>
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

      {/* Explanation callout */}
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
                "flex items-start gap-2 rounded-lg border px-3 py-2",
                answerState === "correct"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <span className="text-xs text-foreground-muted leading-relaxed">
                {q.explanation}
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

export { AutoQuiz };
