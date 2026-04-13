"use client";

/**
 * SOLID Violation Quiz — identify which SOLID principle is violated in code snippets.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback } from "react";
import { Trophy, Code, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SOLIDPrinciple, SOLIDQuizQuestion } from "@/lib/lld";
import { SOLID_QUIZ_QUESTIONS, getSOLIDDemoByPrinciple } from "@/lib/lld";
import { useQuiz } from "@/hooks/use-quiz";
import {
  PRINCIPLE_COLORS,
  SOLID_PRINCIPLE_LABELS,
  STEREOTYPE_BORDER_COLOR,
} from "../constants";

export const SOLIDQuiz = memo(function SOLIDQuiz() {
  // DB-backed quiz data with static fallback
  const { questions: dbQuestions } = useQuiz("lld", "solid");
  const [questions, setQuestions] = useState<SOLIDQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<SOLIDPrinciple | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const startQuiz = useCallback(() => {
    const shuffled = [...SOLID_QUIZ_QUESTIONS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked: SOLIDQuizQuestion[] = [];
    const countByPrinciple: Record<string, number> = {};
    for (const q of shuffled) {
      const count = countByPrinciple[q.violatedPrinciple] ?? 0;
      if (count < 3) {
        picked.push(q);
        countByPrinciple[q.violatedPrinciple] = count + 1;
      }
      if (picked.length >= 15) break;
    }
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    setQuestions(picked);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    setQuizStarted(true);
    setFeedbackShown(false);
    setShowHint(false);
  }, []);

  const handleAnswer = useCallback(
    (principle: SOLIDPrinciple) => {
      if (feedbackShown) return;
      setSelectedAnswer(principle);
      setFeedbackShown(true);
      setShowHint(false);
      if (principle === questions[currentIdx].violatedPrinciple) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const newStreak = s + 1;
          setBestStreak((best) => Math.max(best, newStreak));
          return newStreak;
        });
      } else {
        setStreak(0);
      }
    },
    [feedbackShown, questions, currentIdx],
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setFeedbackShown(false);
      setShowHint(false);
    }
  }, [currentIdx, questions.length]);

  if (!quizStarted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">SOLID Violation Quiz</h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            You will see code snippets that violate a SOLID principle. Identify which principle
            is being violated. The quiz includes 15 questions (3 per principle).
          </p>
          <button
            onClick={startQuiz}
            className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            Start Quiz (15 Questions)
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const pct = Math.round((score / questions.length) * 100);
    const grade =
      pct >= 90 ? "SOLID Master!" : pct >= 70 ? "Great Job!" : pct >= 50 ? "Getting There!" : "Keep Practicing!";
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_25px_rgba(var(--primary-rgb),0.2)]">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">{grade}</h3>
          <p className="text-sm text-foreground-muted">
            You scored <span className="font-bold text-primary">{score}</span> out of{" "}
            <span className="font-bold">{questions.length}</span> ({pct}%)
          </p>
          <p className="text-xs text-foreground-subtle">
            Best streak: {bestStreak} correct in a row
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(["SRP", "OCP", "LSP", "ISP", "DIP"] as SOLIDPrinciple[]).map((p) => {
              const total = questions.filter((q) => q.violatedPrinciple === p).length;
              return (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    color: PRINCIPLE_COLORS[p],
                    backgroundColor: "color-mix(in srgb, " + PRINCIPLE_COLORS[p] + " 10%, transparent)",
                  }}
                >
                  {p}: {total} Q
                </span>
              );
            })}
          </div>
          <button
            onClick={startQuiz}
            className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const isCorrect = selectedAnswer === q.violatedPrinciple;
  const matchingDemo = getSOLIDDemoByPrinciple(q.violatedPrinciple);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Question {currentIdx + 1}/{questions.length}
        </span>
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] font-medium text-primary">
          Score: {score}
        </span>
        {streak > 1 && (
          <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
            {streak} streak
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="flex-1 border-r border-border/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Code className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Which SOLID principle is violated?
            </span>
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">
              {q.language}
            </span>
          </div>
          <pre className="overflow-auto rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3 text-[11px] leading-relaxed text-foreground-muted">
            <code>{q.code}</code>
          </pre>

          {feedbackShown && matchingDemo && (
            <div className="mt-3 space-y-2">
              <div
                className={cn(
                  "rounded-xl border px-3 py-2 text-[11px] leading-relaxed backdrop-blur-sm",
                  isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                    : "border-red-500/30 bg-red-500/5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]",
                )}
              >
                {isCorrect ? (
                  <p><span className="font-bold">Correct!</span> {q.explanation}</p>
                ) : (
                  <p>
                    <span className="font-bold">Not quite.</span> The violated principle is{" "}
                    <span className="font-bold">{q.violatedPrinciple} ({SOLID_PRINCIPLE_LABELS[q.violatedPrinciple]})</span>.{" "}
                    {q.explanation}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
                  <span className="mb-1 block text-[9px] font-bold uppercase text-red-400">Before (Violation)</span>
                  <div className="flex flex-wrap gap-1">
                    {matchingDemo.beforeClasses.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[9px] text-foreground-muted">
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STEREOTYPE_BORDER_COLOR[c.stereotype] }} />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
                  <span className="mb-1 block text-[9px] font-bold uppercase text-green-400">After (Refactored)</span>
                  <div className="flex flex-wrap gap-1">
                    {matchingDemo.afterClasses.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[9px] text-foreground-muted">
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STEREOTYPE_BORDER_COLOR[c.stereotype] }} />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-64 flex-col gap-3 p-3">
          <p className="text-[11px] font-medium text-foreground-muted">
            Select the violated principle:
          </p>
          <div className="space-y-2">
            {(["SRP", "OCP", "LSP", "ISP", "DIP"] as SOLIDPrinciple[]).map((p) => {
              const isSelected = selectedAnswer === p;
              const isCorrectOpt = p === q.violatedPrinciple;
              let btnClass =
                "w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all";
              if (feedbackShown) {
                if (isCorrectOpt) {
                  btnClass += " border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                } else if (isSelected && !isCorrectOpt) {
                  btnClass += " border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                } else {
                  btnClass += " border-border/30 text-foreground-subtle opacity-50";
                }
              } else {
                btnClass += isSelected
                  ? " border-primary/30 bg-primary/5 backdrop-blur-sm text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                  : " border-border/30 text-foreground-muted hover:bg-accent hover:text-foreground";
              }
              return (
                <button
                  key={p}
                  onClick={() => handleAnswer(p)}
                  className={btnClass}
                  disabled={feedbackShown}
                >
                  <span
                    className="mr-2 inline-flex h-5 w-8 items-center justify-center rounded text-[9px] font-bold"
                    style={{
                      color: PRINCIPLE_COLORS[p],
                      backgroundColor: "color-mix(in srgb, " + PRINCIPLE_COLORS[p] + " 10%, transparent)",
                    }}
                  >
                    {p}
                  </span>
                  {SOLID_PRINCIPLE_LABELS[p]}
                </button>
              );
            })}
          </div>

          {!feedbackShown && (
            <button
              onClick={() => setShowHint((h) => !h)}
              className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1.5 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
            >
              <Lightbulb className="h-3 w-3 text-amber-400" />
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          )}
          {showHint && !feedbackShown && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)] px-2.5 py-2 text-[10px] leading-relaxed text-amber-400">
              {q.hint}
            </div>
          )}

          {feedbackShown && (
            <button
              onClick={handleNext}
              className="w-full rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {currentIdx + 1 >= questions.length ? "See Results" : "Next Question"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
