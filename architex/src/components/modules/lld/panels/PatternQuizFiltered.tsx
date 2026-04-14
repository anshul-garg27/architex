"use client";

/**
 * PatternQuizFiltered — adaptive quiz filtered to the current pattern.
 *
 * Tracks performance in localStorage per pattern and adjusts difficulty:
 *   Easy  (streak < 2)  — category, basic facts, predictionPrompts
 *   Medium (streak 2-4) — whenToUse, confusedWith comparisons
 *   Hard  (streak 5+)   — commonMistakes, anti-patterns, tradeoffs
 */

import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
import {
  Trophy,
  ChevronRight,
  RotateCcw,
  HelpCircle,
  Flame,
  Zap,
  Brain,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";
import { CATEGORY_LABELS } from "../constants";

// ── Mastery Persistence ─────────────────────────────────────

interface QuizMastery {
  correct: number;
  total: number;
  streak: number;
}

function getMastery(patternId: string): QuizMastery {
  try {
    const raw = localStorage.getItem(`architex-quiz-mastery:${patternId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted — reset
  }
  return { correct: 0, total: 0, streak: 0 };
}

function setMastery(patternId: string, mastery: QuizMastery): void {
  localStorage.setItem(
    `architex-quiz-mastery:${patternId}`,
    JSON.stringify(mastery),
  );
}

// ── Difficulty ──────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";

function getDifficulty(streak: number): Difficulty {
  if (streak >= 5) return "hard";
  if (streak >= 2) return "medium";
  return "easy";
}

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  easy: { label: "Easy", color: "text-green-400 border-green-500/30 bg-green-500/10", icon: Zap },
  medium: { label: "Medium", color: "text-amber-400 border-amber-400/30 bg-amber-400/10", icon: Brain },
  hard: { label: "Hard", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: Star },
};

// ── Quiz Item ───────────────────────────────────────────────

interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

// ── Shuffle helper ──────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Question Generators ─────────────────────────────────────

function buildEasyQuestions(
  pattern: DesignPattern,
  allPatterns: DesignPattern[],
): QuizItem[] {
  const items: QuizItem[] = [];
  const allCategories = [
    "creational", "structural", "behavioral", "modern", "resilience", "concurrency", "ai-agent",
  ] as const;

  // Category identification
  const wrongCats = allCategories.filter((c) => c !== pattern.category);
  const shuffledCats = shuffleArray(wrongCats);
  const catOptions = shuffleArray([
    CATEGORY_LABELS[pattern.category],
    CATEGORY_LABELS[shuffledCats[0] as keyof typeof CATEGORY_LABELS],
    CATEGORY_LABELS[shuffledCats[1] as keyof typeof CATEGORY_LABELS],
  ]);
  items.push({
    question: `What category does the ${pattern.name} pattern belong to?`,
    options: catOptions,
    correctIndex: catOptions.indexOf(CATEGORY_LABELS[pattern.category]),
    explanation: `${pattern.name} is a ${CATEGORY_LABELS[pattern.category].toLowerCase()} pattern.`,
    difficulty: "easy",
  });

  // Difficulty level identification
  const diffLabels = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];
  const correctDiffLabel = diffLabels[pattern.difficulty - 1] ?? "Intermediate";
  const wrongDiffs = diffLabels.filter((d) => d !== correctDiffLabel);
  const diffOptions = shuffleArray([correctDiffLabel, ...shuffleArray(wrongDiffs).slice(0, 2)]);
  items.push({
    question: `What is the difficulty level of the ${pattern.name} pattern?`,
    options: diffOptions,
    correctIndex: diffOptions.indexOf(correctDiffLabel),
    explanation: `${pattern.name} has a difficulty of ${pattern.difficulty}/5 (${correctDiffLabel}).`,
    difficulty: "easy",
  });

  // Basic predictionPrompts
  if (pattern.predictionPrompts && pattern.predictionPrompts.length > 0) {
    const prompt = pattern.predictionPrompts[0];
    items.push({
      question: prompt.question,
      options: ["True", "False"],
      correctIndex: prompt.answer.toLowerCase().startsWith("true") ? 0 : 1,
      explanation: prompt.answer,
      difficulty: "easy",
    });
  }

  return items;
}

function buildMediumQuestions(
  pattern: DesignPattern,
  allPatterns: DesignPattern[],
): QuizItem[] {
  const items: QuizItem[] = [];

  // "When would you use this pattern?"
  if (pattern.whenToUse.length > 0) {
    const correctUse = pattern.whenToUse[0];
    // Grab whenToUse from other patterns as distractors
    const otherUses = allPatterns
      .filter((p) => p.id !== pattern.id && p.whenToUse.length > 0)
      .map((p) => p.whenToUse[0]);
    const distractors = shuffleArray(otherUses).slice(0, 2);
    if (distractors.length >= 2) {
      const options = shuffleArray([correctUse, ...distractors]);
      items.push({
        question: `When would you use the ${pattern.name} pattern?`,
        options,
        correctIndex: options.indexOf(correctUse),
        explanation: `${pattern.name}: ${correctUse}`,
        difficulty: "medium",
      });
    }
  }

  // confusedWith comparisons
  if (pattern.confusedWith && pattern.confusedWith.length > 0) {
    for (const confused of pattern.confusedWith.slice(0, 2)) {
      const other = allPatterns.find((p) => p.id === confused.patternId);
      if (!other) continue;
      items.push({
        question: `Which pattern is described: "${pattern.description}"?`,
        options: shuffleArray([pattern.name, other.name]),
        correctIndex: 0, // recalculated below
        explanation: `Key difference: ${confused.difference}`,
        difficulty: "medium",
      });
      // Fix correctIndex after shuffle
      const last = items[items.length - 1];
      last.correctIndex = last.options.indexOf(pattern.name);
    }
  }

  // Additional predictionPrompts (beyond the first)
  if (pattern.predictionPrompts && pattern.predictionPrompts.length > 1) {
    for (const prompt of pattern.predictionPrompts.slice(1, 3)) {
      items.push({
        question: prompt.question,
        options: ["True", "False"],
        correctIndex: prompt.answer.toLowerCase().startsWith("true") ? 0 : 1,
        explanation: prompt.answer,
        difficulty: "medium",
      });
    }
  }

  return items;
}

function buildHardQuestions(
  pattern: DesignPattern,
  allPatterns: DesignPattern[],
): QuizItem[] {
  const items: QuizItem[] = [];

  // "When NOT to use this pattern?"
  if (pattern.whenNotToUse.length > 0) {
    const correctAntiUse = pattern.whenNotToUse[0];
    // Mix in actual whenToUse as distractors
    const distractors = pattern.whenToUse.slice(0, 2);
    if (distractors.length >= 1) {
      const options = shuffleArray([correctAntiUse, ...distractors]);
      items.push({
        question: `When should you NOT use the ${pattern.name} pattern?`,
        options,
        correctIndex: options.indexOf(correctAntiUse),
        explanation: `Avoid ${pattern.name} when: ${correctAntiUse}`,
        difficulty: "hard",
      });
    }
  }

  // Common mistakes
  if (pattern.commonMistakes && pattern.commonMistakes.length > 0) {
    const mistake = pattern.commonMistakes[0];
    const nonMistakes = [
      `Using ${pattern.name} for its intended purpose`,
      `Following the standard ${pattern.name} implementation`,
    ];
    const options = shuffleArray([mistake, ...nonMistakes]);
    items.push({
      question: `Which is a common mistake when implementing the ${pattern.name} pattern?`,
      options,
      correctIndex: options.indexOf(mistake),
      explanation: `Common mistake: ${mistake}`,
      difficulty: "hard",
    });
  }

  // Tradeoffs analysis
  if (pattern.tradeoffs) {
    items.push({
      question: `Which describes a key tradeoff of the ${pattern.name} pattern?`,
      options: shuffleArray([
        pattern.tradeoffs,
        "No tradeoffs — this pattern is always beneficial",
        "Only adds complexity without any benefits",
      ]),
      correctIndex: 0, // recalculated below
      explanation: `Tradeoff: ${pattern.tradeoffs}`,
      difficulty: "hard",
    });
    const last = items[items.length - 1];
    last.correctIndex = last.options.indexOf(pattern.tradeoffs);
  }

  return items;
}

// ── Build Quiz ──────────────────────────────────────────────

function buildAdaptiveQuiz(
  pattern: DesignPattern,
  allPatterns: DesignPattern[],
  difficulty: Difficulty,
): QuizItem[] {
  let items: QuizItem[] = [];

  switch (difficulty) {
    case "easy":
      items = buildEasyQuestions(pattern, allPatterns);
      break;
    case "medium":
      items = [
        ...buildMediumQuestions(pattern, allPatterns),
        // Include 1 easy question as warm-up
        ...buildEasyQuestions(pattern, allPatterns).slice(0, 1),
      ];
      break;
    case "hard":
      items = [
        ...buildHardQuestions(pattern, allPatterns),
        // Include 1 medium question for variety
        ...buildMediumQuestions(pattern, allPatterns).slice(0, 1),
      ];
      break;
  }

  // Fallback: if we have no questions, generate a basic one
  if (items.length === 0) {
    items = buildEasyQuestions(pattern, allPatterns);
  }

  return shuffleArray(items);
}

// ── Component ───────────────────────────────────────────────

interface PatternQuizFilteredProps {
  pattern: DesignPattern;
}

export const PatternQuizFiltered = memo(function PatternQuizFiltered({
  pattern,
}: PatternQuizFilteredProps) {
  const { patterns } = useLLDDataContext();

  const [mastery, setMasteryState] = useState<QuizMastery>(() =>
    getMastery(pattern.id),
  );
  const difficulty = getDifficulty(mastery.streak);
  const diffMeta = DIFFICULTY_META[difficulty];

  const questions = useMemo(
    () => buildAdaptiveQuiz(pattern, patterns, difficulty),
    [pattern, patterns, difficulty],
  );

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(mastery.streak);
  const [finished, setFinished] = useState(false);

  // Reset state when pattern changes
  useEffect(() => {
    const m = getMastery(pattern.id);
    setMasteryState(m);
    setCurrent(0);
    setSelected(null);
    setSessionScore(0);
    setSessionStreak(m.streak);
    setFinished(false);
  }, [pattern.id]);

  const question = questions[current];
  if (!question) return null;

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      const isCorrect = idx === question.correctIndex;

      const updated: QuizMastery = {
        correct: mastery.correct + (isCorrect ? 1 : 0),
        total: mastery.total + 1,
        streak: isCorrect ? mastery.streak + 1 : 0,
      };
      setMastery(pattern.id, updated);
      setMasteryState(updated);

      if (isCorrect) {
        setSessionScore((s) => s + 1);
        setSessionStreak((s) => s + 1);
      } else {
        setSessionStreak(0);
      }
    },
    [selected, question, mastery, pattern.id],
  );

  const handleNext = useCallback(() => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, questions.length]);

  const handleReset = useCallback(() => {
    setCurrent(0);
    setSelected(null);
    setSessionScore(0);
    setFinished(false);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">
          No quiz questions available for {pattern.name}.
        </p>
      </div>
    );
  }

  if (finished) {
    const newDifficulty = getDifficulty(mastery.streak);
    const newDiffMeta = DIFFICULTY_META[newDifficulty];
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
        <Trophy className="h-8 w-8 text-primary" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            Quiz Complete: {pattern.name}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Score: {sessionScore}/{questions.length}
          </p>
          {mastery.streak >= 2 && (
            <p className="text-xs mt-1 flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-orange-400 font-semibold">
                {mastery.streak} correct in a row!
              </span>
            </p>
          )}
          <p className="text-[10px] text-foreground-subtle mt-2">
            Next quiz: <span className={cn("font-semibold", newDiffMeta.color.split(" ")[0])}>{newDiffMeta.label}</span> difficulty
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-background/60 px-3 py-1.5 text-[11px] font-medium text-foreground-muted backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  const DiffIcon = diffMeta.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Quiz: {pattern.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Difficulty badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
              diffMeta.color,
            )}
          >
            <DiffIcon className="h-2.5 w-2.5" />
            {diffMeta.label}
          </span>
          <span className="text-[10px] text-foreground-subtle">
            {current + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Streak counter */}
      {sessionStreak >= 2 && (
        <div className="flex items-center gap-1.5 border-b border-border/30 px-4 py-1.5 bg-orange-500/5">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400">
            {sessionStreak} correct in a row!
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {/* Question difficulty indicator */}
        {question.difficulty !== difficulty && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium",
              DIFFICULTY_META[question.difficulty].color,
            )}
          >
            {DIFFICULTY_META[question.difficulty].label}
          </span>
        )}
        <p className="text-xs leading-relaxed text-foreground">
          {question.question}
        </p>
        <div className="grid gap-2">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === question.correctIndex;
            const showResult = selected !== null;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-xs transition-all",
                  showResult && isCorrect
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : showResult && isSelected && !isCorrect
                      ? "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-accent hover:text-foreground",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-foreground-muted">
              {question.explanation}
            </p>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 rounded-xl border border-border/30 bg-background/60 px-3 py-1.5 text-[10px] font-medium text-foreground-muted backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground"
            >
              {current + 1 >= questions.length ? "Finish" : "Next"}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
