"use client";

import { Target } from "lucide-react";
import { McqSingleWidget } from "../widgets/McqSingleWidget";
import { McqMultiWidget } from "../widgets/McqMultiWidget";
import { FillBlankWidget } from "../widgets/FillBlankWidget";
import { ClickTargetWidget } from "../widgets/ClickTargetWidget";
import type { InteractSectionParams } from "@/lib/blueprint/section-types";

interface Props {
  title: string;
  params: InteractSectionParams;
  isCompleted: boolean;
  onResult: (result: {
    correct: boolean;
    attempts: number;
    score: number;
  }) => void;
}

/**
 * Dispatches to a widget component based on widget.kind and surfaces
 * the result to the parent unit page.
 *
 * score = 100 when correct on first attempt; decays 20 per additional
 * attempt down to a floor of 40. Authors can override via rubric in
 * future passes.
 */
export function InteractSection({
  title,
  params,
  isCompleted,
  onResult,
}: Props) {
  const handleResult = (r: { correct: boolean; attempts: number }) => {
    if (!r.correct) return;
    const score = Math.max(40, 100 - Math.max(0, r.attempts - 1) * 20);
    onResult({ ...r, score });
  };

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Target className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Quick check
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      <div className="rounded-xl border border-border/50 bg-background/60 p-4">
        {params.widget.kind === "mcq-single" && (
          <McqSingleWidget
            widget={params.widget}
            onSubmit={handleResult}
            locked={isCompleted}
          />
        )}
        {params.widget.kind === "mcq-multi" && (
          <McqMultiWidget
            widget={params.widget}
            onSubmit={handleResult}
            locked={isCompleted}
          />
        )}
        {params.widget.kind === "fill-blank" && (
          <FillBlankWidget
            widget={params.widget}
            onSubmit={handleResult}
            locked={isCompleted}
          />
        )}
        {params.widget.kind === "click-target" && (
          <ClickTargetWidget
            widget={params.widget}
            onSubmit={handleResult}
            locked={isCompleted}
          />
        )}
      </div>
    </div>
  );
}
