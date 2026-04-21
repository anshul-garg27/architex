"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClickTargetWidget as Spec } from "@/lib/blueprint/section-types";

interface Props {
  widget: Spec;
  onSubmit: (result: { correct: boolean; attempts: number; pickedId: string | null }) => void;
  locked: boolean;
}

/**
 * Click-target widget — abstract positioning over a 100×100 grid. V1
 * renders colored circles at the target coords; a later pass supports
 * `imageSrc` backgrounds. The user clicks one target; feedback shows
 * whether that target was correct.
 */
export function ClickTargetWidget({ widget, onSubmit, locked }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const pickedTarget = widget.targets.find((t) => t.id === picked);
  const correct = pickedTarget?.correct === true;

  const handlePick = (id: string) => {
    if (locked || (revealed && correct)) return;
    setPicked(id);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setRevealed(true);
    const next = widget.targets.find((t) => t.id === id);
    onSubmit({
      correct: next?.correct === true,
      attempts: nextAttempts,
      pickedId: id,
    });
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">
        {widget.prompt}
      </p>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-background/40">
        {widget.imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={widget.imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        )}
        {widget.targets.map((t) => {
          const isPicked = picked === t.id;
          const showFeedback = revealed && isPicked;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => handlePick(t.id)}
              aria-label={t.label}
              disabled={locked || (revealed && correct)}
              style={{
                left: `calc(${t.x}% - ${t.r / 2}%)`,
                top: `calc(${t.y}% - ${t.r / 2}%)`,
                width: `${t.r}%`,
                height: `${t.r}%`,
              }}
              className={cn(
                "absolute flex items-center justify-center rounded-full border-2 text-xs font-medium transition-transform",
                showFeedback
                  ? correct
                    ? "border-emerald-500 bg-emerald-500/25"
                    : "border-red-500 bg-red-500/25"
                  : "border-indigo-400 bg-indigo-400/15 hover:scale-105",
              )}
            >
              {showFeedback ? (
                correct ? (
                  <Check className="h-4 w-4 text-emerald-700" />
                ) : (
                  <X className="h-4 w-4 text-red-700" />
                )
              ) : (
                <span className="text-foreground-muted">{t.label}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-foreground-muted">
        {!revealed && <span>Pick the one you think is right.</span>}
        {revealed && correct && (
          <span className="text-emerald-700 dark:text-emerald-300">
            Correct — {attempts} attempt{attempts === 1 ? "" : "s"}.
          </span>
        )}
        {revealed && !correct && (
          <span className="text-red-700 dark:text-red-300">
            Not that one — look again.
          </span>
        )}
      </div>
    </div>
  );
}
