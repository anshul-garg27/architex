"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { McqSingleWidget as Spec } from "@/lib/blueprint/section-types";

interface Props {
  widget: Spec;
  onSubmit: (result: { correct: boolean; attempts: number; pickedId: string }) => void;
  /** Locked means the question already reported completion. */
  locked: boolean;
}

export function McqSingleWidget({ widget, onSubmit, locked }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showReveal, setShowReveal] = useState(false);

  const correct = picked === widget.correctId;

  const handleSubmit = () => {
    if (picked == null) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setShowReveal(true);
    onSubmit({ correct, attempts: nextAttempts, pickedId: picked });
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">
        {widget.prompt}
      </p>
      <ul className="space-y-2" role="radiogroup" aria-label={widget.prompt}>
        {widget.options.map((o) => {
          const isPicked = picked === o.id;
          const isCorrect = o.id === widget.correctId;
          const feedback =
            showReveal && isPicked ? (isCorrect ? "correct" : "wrong") : null;
          return (
            <li key={o.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={locked || (showReveal && correct)}
                onClick={() => setPicked(o.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  feedback === "correct"
                    ? "border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/30"
                    : feedback === "wrong"
                      ? "border-red-400/60 bg-red-50/60 dark:bg-red-950/30"
                      : isPicked
                        ? "border-indigo-400/60 bg-indigo-50/60 dark:bg-indigo-950/30"
                        : "border-border/60 bg-background/60 hover:border-indigo-400/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isPicked
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-foreground/30",
                  )}
                  aria-hidden
                >
                  {feedback === "correct" && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                  {feedback === "wrong" && <X className="h-3 w-3 text-white" />}
                </span>
                <div className="flex-1">
                  <span className={cn(feedback === "wrong" && "line-through opacity-80")}>
                    {o.label}
                  </span>
                  {showReveal && feedback === "wrong" && o.whyWrong && (
                    <p className="mt-1 text-xs text-red-800 dark:text-red-200">
                      {o.whyWrong}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-foreground-muted">
          {attempts === 0 && "Pick one."}
          {attempts > 0 && correct && (
            <span className="text-emerald-700 dark:text-emerald-300">
              Correct — {attempts} attempt{attempts === 1 ? "" : "s"}.
            </span>
          )}
          {attempts > 0 && !correct && (
            <span className="text-red-700 dark:text-red-300">
              Not quite — try again.
            </span>
          )}
        </p>
        {!locked && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={picked == null || (showReveal && correct)}
            className={cn(
              "rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-600 disabled:bg-foreground/10 disabled:text-foreground-muted",
            )}
          >
            {showReveal && correct ? "Nice" : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
