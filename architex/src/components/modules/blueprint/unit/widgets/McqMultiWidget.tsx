"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { McqMultiWidget as Spec } from "@/lib/blueprint/section-types";

interface Props {
  widget: Spec;
  onSubmit: (result: { correct: boolean; attempts: number; pickedIds: string[] }) => void;
  locked: boolean;
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

export function McqMultiWidget({ widget, onSubmit, locked }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showReveal, setShowReveal] = useState(false);

  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const correct = setsEqual(picked, widget.correctIds);

  const handleSubmit = () => {
    if (picked.length === 0) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setShowReveal(true);
    onSubmit({ correct, attempts: nextAttempts, pickedIds: picked });
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">
        {widget.prompt}
      </p>
      <p className="mb-2 text-[10px] uppercase tracking-wider text-foreground-muted">
        Select all that apply
      </p>
      <ul className="space-y-2" aria-label={widget.prompt}>
        {widget.options.map((o) => {
          const isPicked = picked.includes(o.id);
          const isCorrect = widget.correctIds.includes(o.id);
          let feedback: "correct" | "wrong" | null = null;
          if (showReveal) {
            if (isPicked && isCorrect) feedback = "correct";
            else if (isPicked && !isCorrect) feedback = "wrong";
            else if (!isPicked && isCorrect) feedback = "wrong"; // missed
          }
          return (
            <li key={o.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isPicked}
                disabled={locked || (showReveal && correct)}
                onClick={() => toggle(o.id)}
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
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
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
                  <span>{o.label}</span>
                  {showReveal && feedback === "wrong" && o.whyWrong && (
                    <p className="mt-1 text-xs text-red-800 dark:text-red-200">
                      {o.whyWrong}
                    </p>
                  )}
                  {showReveal && !isPicked && isCorrect && (
                    <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
                      This one counts too.
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
          {attempts > 0 && correct && (
            <span className="text-emerald-700 dark:text-emerald-300">
              Correct — {attempts} attempt{attempts === 1 ? "" : "s"}.
            </span>
          )}
          {attempts > 0 && !correct && (
            <span className="text-red-700 dark:text-red-300">
              Not all of them — try again.
            </span>
          )}
        </p>
        {!locked && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={picked.length === 0 || (showReveal && correct)}
            className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-600 disabled:bg-foreground/10 disabled:text-foreground-muted"
          >
            {showReveal && correct ? "Nice" : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
