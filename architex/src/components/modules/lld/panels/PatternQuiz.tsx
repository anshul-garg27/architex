"use client";

/**
 * Pattern Identification Quiz — test pattern recognition skills from UML diagrams.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback } from "react";
import { Trophy, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern, UMLRelationshipType } from "@/lib/lld";
import { DESIGN_PATTERNS } from "@/lib/lld";
import { RelationshipDefs } from "../canvas/LLDCanvas";
import {
  CLASS_BOX_WIDTH,
  CLASS_HEADER_HEIGHT,
  ROW_HEIGHT,
  SECTION_PAD,
  STEREOTYPE_BORDER_COLOR,
  STEREOTYPE_LABEL,
  classBoxHeight,
  classCenter,
  borderPoint,
} from "../constants";

// ── Quiz Types & Generation ──────────────────────────────

interface QuizQuestion {
  pattern: DesignPattern;
  options: DesignPattern[];
  correctIndex: number;
}

function generateQuizQuestions(count: number): QuizQuestion[] {
  const allPatterns = [...DESIGN_PATTERNS];
  for (let i = allPatterns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPatterns[i], allPatterns[j]] = [allPatterns[j], allPatterns[i]];
  }
  const selected = allPatterns.slice(0, Math.min(count, allPatterns.length));

  return selected.map((correctPattern) => {
    const sameCategory = DESIGN_PATTERNS.filter(
      (p) => p.id !== correctPattern.id && p.category === correctPattern.category,
    );
    const otherCategory = DESIGN_PATTERNS.filter(
      (p) => p.id !== correctPattern.id && p.category !== correctPattern.category,
    );
    for (let i = sameCategory.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sameCategory[i], sameCategory[j]] = [sameCategory[j], sameCategory[i]];
    }
    for (let i = otherCategory.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherCategory[i], otherCategory[j]] = [otherCategory[j], otherCategory[i]];
    }
    const distractors: DesignPattern[] = [];
    const fromSame = sameCategory.slice(0, Math.min(2, sameCategory.length));
    distractors.push(...fromSame);
    const remaining = 3 - distractors.length;
    distractors.push(...otherCategory.slice(0, remaining));
    if (distractors.length < 3) {
      const allOther = DESIGN_PATTERNS.filter(
        (p) => p.id !== correctPattern.id && !distractors.some((d) => d.id === p.id),
      );
      distractors.push(...allOther.slice(0, 3 - distractors.length));
    }

    const options = [...distractors.slice(0, 3)];
    const correctIndex = Math.floor(Math.random() * 4);
    options.splice(correctIndex, 0, correctPattern);

    return { pattern: correctPattern, options, correctIndex };
  });
}

const QUIZ_HINTS: Record<string, string> = {
  creational: "Look at how objects are being constructed or instantiated.",
  structural: "Look at how classes are composed or connected together.",
  behavioral: "Look at how responsibilities are delegated between objects.",
  modern: "Look for event-driven, reactive, or plugin-based structures.",
  resilience: "Look for fault tolerance, fallbacks, or retry mechanisms.",
  concurrency: "Look for thread-safety, locking, or parallel execution patterns.",
};

// ── PatternQuiz Component ────────────────────────────────

export const PatternQuiz = memo(function PatternQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);

  const startQuiz = useCallback(() => {
    const q = generateQuizQuestions(8);
    setQuestions(q);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setQuizStarted(true);
    setFeedbackShown(false);
  }, []);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (feedbackShown) return;
      setSelectedAnswer(idx);
      setFeedbackShown(true);
      if (idx === questions[currentIdx].correctIndex) {
        setScore((s) => s + 1);
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
    }
  }, [currentIdx, questions.length]);

  if (!quizStarted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Pattern Identification Quiz</h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            Test your pattern recognition skills! You will see a UML diagram without
            its name and must identify which design pattern it represents.
          </p>
          <button
            onClick={startQuiz}
            className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            Start Quiz (8 Questions)
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const pct = Math.round((score / questions.length) * 100);
    const grade =
      pct >= 90 ? "Pattern Master!" : pct >= 70 ? "Great Job!" : pct >= 50 ? "Getting There!" : "Keep Practicing!";
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
          <div className="flex gap-1">
            {questions.map((q, i) => (
              <div
                key={q.pattern.id}
                className="flex h-8 w-8 items-center justify-center rounded text-[9px] font-medium"
                style={{
                  backgroundColor: `${STEREOTYPE_BORDER_COLOR[q.pattern.classes[0]?.stereotype ?? "class"]}18`,
                  color: STEREOTYPE_BORDER_COLOR[q.pattern.classes[0]?.stereotype ?? "class"],
                }}
                title={q.pattern.name}
              >
                {i + 1}
              </div>
            ))}
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
  const isCorrect = selectedAnswer === q.correctIndex;

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
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="flex-1 border-r border-border/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              {feedbackShown ? q.pattern.name : "??? Pattern"}
            </span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
              {q.pattern.category}
            </span>
          </div>
          <svg
            viewBox={(() => {
              const cs = q.pattern.classes;
              if (cs.length === 0) return "0 0 400 200";
              let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
              for (const c of cs) {
                mnX = Math.min(mnX, c.x);
                mnY = Math.min(mnY, c.y);
                mxX = Math.max(mxX, c.x + CLASS_BOX_WIDTH);
                mxY = Math.max(mxY, c.y + classBoxHeight(c));
              }
              const p = 40;
              return `${mnX - p} ${mnY - p} ${mxX - mnX + CLASS_BOX_WIDTH + p * 2} ${mxY - mnY + p * 3}`;
            })()}
            className="h-full w-full"
            style={{ minHeight: 120, maxHeight: 200 }}
          >
            <RelationshipDefs />
            {q.pattern.relationships.map((rel) => {
              const srcCls = q.pattern.classes.find((c) => c.id === rel.source);
              const tgtCls = q.pattern.classes.find((c) => c.id === rel.target);
              if (!srcCls || !tgtCls) return null;
              const sc = classCenter(srcCls);
              const tc = classCenter(tgtCls);
              const s = borderPoint(srcCls, tc.cx, tc.cy);
              const t = borderPoint(tgtCls, sc.cx, sc.cy);
              const isDashed = rel.type === "dependency" || rel.type === "realization";
              const hasDiamond = rel.type === "composition" || rel.type === "aggregation";
              const markerMap: Record<UMLRelationshipType, string> = {
                inheritance: "url(#arrow-inheritance)",
                realization: "url(#arrow-realization)",
                association: "url(#arrow-association)",
                dependency: "url(#arrow-dependency)",
                composition: "",
                aggregation: "",
              };
              return (
                <g key={rel.id}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke="var(--lld-canvas-border)" strokeWidth="1.5"
                    strokeDasharray={isDashed ? "6 4" : undefined}
                    markerEnd={markerMap[rel.type] || undefined}
                    markerStart={hasDiamond ? `url(#arrow-${rel.type})` : undefined}
                  />
                </g>
              );
            })}
            {q.pattern.classes.map((cls) => {
              const bc = STEREOTYPE_BORDER_COLOR[cls.stereotype];
              const h = classBoxHeight(cls);
              const hasStereo = STEREOTYPE_LABEL[cls.stereotype].length > 0;
              return (
                <g key={cls.id}>
                  <rect x={cls.x} y={cls.y} width={CLASS_BOX_WIDTH} height={h} rx={4}
                    fill="var(--lld-canvas-bg)" stroke={bc} strokeWidth={1.5} />
                  {hasStereo && (
                    <text x={cls.x + CLASS_BOX_WIDTH / 2} y={cls.y + 14}
                      textAnchor="middle" fill={bc} fontSize="11" fontFamily="monospace">
                      {`\u00AB${STEREOTYPE_LABEL[cls.stereotype]}\u00BB`}
                    </text>
                  )}
                  <text x={cls.x + CLASS_BOX_WIDTH / 2}
                    y={hasStereo ? cls.y + 16 + 10 : cls.y + 22}
                    textAnchor="middle" fill="var(--lld-canvas-text)" fontSize="13" fontWeight="700">
                    {feedbackShown ? cls.name : "???"}
                  </text>
                  {cls.attributes.map((_, ai) => (
                    <rect key={`a-${ai}`}
                      x={cls.x + 10}
                      y={cls.y + (hasStereo ? 16 : 0) + CLASS_HEADER_HEIGHT + SECTION_PAD + ai * ROW_HEIGHT + 4}
                      width={CLASS_BOX_WIDTH - 20}
                      height={8}
                      rx={2}
                      fill={feedbackShown ? "transparent" : "color-mix(in srgb, var(--lld-canvas-text-subtle) 10%, transparent)"}
                    />
                  ))}
                  {cls.methods.map((_, mi) => (
                    <rect key={`m-${mi}`}
                      x={cls.x + 10}
                      y={cls.y + (hasStereo ? 16 : 0) + CLASS_HEADER_HEIGHT + SECTION_PAD + cls.attributes.length * ROW_HEIGHT + SECTION_PAD + mi * ROW_HEIGHT + 4}
                      width={CLASS_BOX_WIDTH - 20}
                      height={8}
                      rx={2}
                      fill={feedbackShown ? "transparent" : "color-mix(in srgb, var(--lld-canvas-text-subtle) 10%, transparent)"}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex w-72 flex-col gap-3 p-3">
          <p className="text-[11px] font-medium text-foreground-muted">
            Which pattern does this UML diagram represent?
          </p>
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === q.correctIndex;
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
                  key={opt.id}
                  onClick={() => handleAnswer(idx)}
                  className={btnClass}
                  disabled={feedbackShown}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.name}
                </button>
              );
            })}
          </div>

          {feedbackShown && (() => {
            const chosenPattern = selectedAnswer !== null ? q.options[selectedAnswer] : null;
            // Find confusedWith entry: does the correct pattern list the user's choice?
            const confusedEntry = !isCorrect && chosenPattern
              ? q.pattern.confusedWith?.find((c) => c.patternId === chosenPattern.id)
              : null;
            // Or reverse: does the chosen pattern list the correct one?
            const reverseEntry = !isCorrect && chosenPattern && !confusedEntry
              ? chosenPattern.confusedWith?.find((c) => c.patternId === q.pattern.id)
              : null;
            const differenceText = confusedEntry?.difference ?? reverseEntry?.difference ?? null;

            return (
              <div
                className={cn(
                  "rounded-xl border px-3 py-2 text-[11px] leading-relaxed backdrop-blur-sm",
                  isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                    : "border-red-500/30 bg-red-500/5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]",
                )}
              >
                {isCorrect ? (
                  <p>
                    <span className="font-bold">Correct!</span> The key tell is the{" "}
                    {q.pattern.relationships.length > 0
                      ? `${q.pattern.relationships[0].type} relationship`
                      : "class structure"}{" "}
                    pattern with {q.pattern.classes.length} participants.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p>
                      <span className="font-bold">Not quite.</span> The answer is{" "}
                      <span className="font-bold">{q.pattern.name}</span>, not{" "}
                      {chosenPattern?.name ?? "that"}.{" "}
                      {QUIZ_HINTS[q.pattern.category] ?? "Look at the relationship types and class hierarchy."}
                    </p>
                    {differenceText && (
                      <p className="rounded border border-red-500/20 bg-red-500/5 px-2 py-1 text-[10px] text-red-300">
                        <span className="font-semibold">Key difference:</span> {differenceText}
                      </p>
                    )}
                    {!differenceText && chosenPattern && (
                      <p className="text-[10px] text-red-300">
                        {q.pattern.name} uses {q.pattern.classes.length} participants with{" "}
                        {q.pattern.relationships.length > 0
                          ? `a ${q.pattern.relationships[0].type} relationship`
                          : "a distinct class structure"}.{" "}
                        {chosenPattern.name} is a {chosenPattern.category} pattern with a different structural intent.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

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
