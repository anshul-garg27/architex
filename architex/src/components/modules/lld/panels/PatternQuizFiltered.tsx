"use client";

/**
 * PatternQuizFiltered — quiz filtered to the current pattern.
 * Uses predictionPrompts if available, otherwise generates from confusedWith data.
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import { Trophy, ChevronRight, RotateCcw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";

interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function buildQuiz(pattern: DesignPattern, allPatterns: DesignPattern[]): QuizItem[] {
  const items: QuizItem[] = [];

  // Use predictionPrompts if available
  if (pattern.predictionPrompts && pattern.predictionPrompts.length > 0) {
    for (const prompt of pattern.predictionPrompts) {
      items.push({
        question: prompt.question,
        options: ["True", "False"],
        correctIndex: prompt.answer.toLowerCase().startsWith("true") ? 0 : 1,
        explanation: prompt.answer,
      });
    }
  }

  // Generate from confusedWith data
  if (pattern.confusedWith && pattern.confusedWith.length > 0) {
    for (const confused of pattern.confusedWith) {
      const other = allPatterns.find((p) => p.id === confused.patternId);
      if (!other) continue;
      items.push({
        question: `Which pattern is described: "${pattern.description}"?`,
        options: [pattern.name, other.name],
        correctIndex: 0,
        explanation: confused.difference,
      });
    }
  }

  // Fallback: category identification
  if (items.length === 0) {
    const categories = ["creational", "structural", "behavioral", "modern", "resilience", "concurrency", "ai-agent"] as const;
    const wrongCategories = categories.filter((c) => c !== pattern.category);
    const shuffled = wrongCategories.sort(() => Math.random() - 0.5);
    items.push({
      question: `What category does the ${pattern.name} pattern belong to?`,
      options: [pattern.category, shuffled[0], shuffled[1]].sort(() => Math.random() - 0.5),
      correctIndex: 0, // will be recalculated below
      explanation: `${pattern.name} is a ${pattern.category} pattern.`,
    });
    // Fix correctIndex after shuffle
    const last = items[items.length - 1];
    last.correctIndex = last.options.indexOf(pattern.category);
  }

  return items;
}

interface PatternQuizFilteredProps {
  pattern: DesignPattern;
}

export const PatternQuizFiltered = memo(function PatternQuizFiltered({
  pattern,
}: PatternQuizFilteredProps) {
  const { patterns } = useLLDDataContext();
  const questions = useMemo(() => buildQuiz(pattern, patterns), [pattern, patterns]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      if (idx === question.correctIndex) {
        setScore((s) => s + 1);
      }
    },
    [selected, question],
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
    setScore(0);
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
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
        <Trophy className="h-8 w-8 text-primary" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            Quiz Complete: {pattern.name}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Score: {score}/{questions.length}
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Quiz: {pattern.name}
          </span>
        </div>
        <span className="text-[10px] text-foreground-subtle">
          {current + 1} / {questions.length}
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
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
