"use client";

import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplySectionParams } from "@/lib/blueprint/section-types";

const EXERCISE_LABEL: Record<string, string> = {
  "draw-classes": "Draw the classes",
  "connect-classes": "Connect the classes",
  "identify-pattern": "Name the pattern",
};

interface Props {
  title: string;
  params: ApplySectionParams;
  isCompleted: boolean;
  onComplete: () => void;
}

/**
 * Apply section — V1 renders an instruction panel and an honor-system
 * "Mark as done" button. The embedded canvas integration lands with
 * the Patterns Library in SP4 (that sub-project replaces the
 * <CanvasPlaceholder> with a real <LLDCanvas>).
 */
export function ApplySection({
  title,
  params,
  isCompleted,
  onComplete,
}: Props) {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-terracotta-500/15 text-terracotta-700 dark:text-terracotta-300">
          <Pencil className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Apply · {EXERCISE_LABEL[params.exercise] ?? params.exercise}
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      <p className="mb-4 text-sm leading-relaxed text-foreground">
        {params.instructions}
      </p>

      <div className="relative flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
        <div className="max-w-md">
          <p className="text-sm font-medium text-foreground-muted">
            Canvas integration lands in SP4.
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Draw this out in a notebook or sketch mentally, then mark the
            section done. The real inline canvas comes with the Patterns
            Library.
          </p>
          {params.patternSlug && (
            <p className="mt-3 text-[10px] uppercase tracking-wider text-foreground-subtle">
              Referenced pattern: {params.patternSlug}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          disabled={isCompleted}
          onClick={onComplete}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            isCompleted
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-indigo-500 text-white hover:bg-indigo-600",
          )}
        >
          {isCompleted ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Marked done
            </>
          ) : (
            "Mark as done"
          )}
        </button>
      </div>
    </div>
  );
}
