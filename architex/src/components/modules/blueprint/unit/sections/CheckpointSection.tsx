"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { McqSingleWidget } from "../widgets/McqSingleWidget";
import { McqMultiWidget } from "../widgets/McqMultiWidget";
import { FillBlankWidget } from "../widgets/FillBlankWidget";
import { ClickTargetWidget } from "../widgets/ClickTargetWidget";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import {
  blueprintCheckpointStarted,
  blueprintCheckpointPassed,
} from "@/lib/analytics/blueprint-events";
import type { CheckpointSectionParams } from "@/lib/blueprint/section-types";

interface Props {
  unitSlug: string;
  title: string;
  params: CheckpointSectionParams;
  isCompleted: boolean;
  onComplete: (score: number) => void;
}

/**
 * Checkpoint — a mixed sequence of 3–5 widgets. The section is
 * "complete" when the user's correct-count across all widgets meets
 * or exceeds `passThreshold` (fraction of total).
 *
 * Users can re-submit any individual widget. Score is the fraction
 * of widgets currently marked correct × 100.
 */
export function CheckpointSection({
  unitSlug,
  title,
  params,
  isCompleted,
  onComplete,
}: Props) {
  const { track } = useBlueprintAnalytics();
  const startedRef = useRef(false);
  const [results, setResults] = useState<Record<number, { correct: boolean; attempts: number }>>({});

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track(blueprintCheckpointStarted({ unitSlug }));
  }, [unitSlug, track]);

  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.correct).length,
    [results],
  );
  const total = params.exercises.length;
  const fraction = total > 0 ? correctCount / total : 0;
  const score = Math.round(fraction * 100);
  const passed = fraction >= params.passThreshold;

  const handleResult = (
    idx: number,
    r: { correct: boolean; attempts: number },
  ) => {
    setResults((prev) => ({ ...prev, [idx]: r }));
  };

  // Fire passed event + onComplete when we cross the threshold.
  useEffect(() => {
    if (passed && !isCompleted && total > 0) {
      const maxAttempts = Math.max(
        ...Object.values(results).map((r) => r.attempts),
        1,
      );
      track(
        blueprintCheckpointPassed({
          unitSlug,
          score,
          attempts: maxAttempts,
        }),
      );
      onComplete(score);
    }
  }, [passed, isCompleted, total, results, score, unitSlug, track, onComplete]);

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
          <Flag className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Checkpoint · {total} exercises · pass at{" "}
            {Math.round(params.passThreshold * 100)}%
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      <div className="mb-5 flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-foreground-muted">
            Score · {correctCount} / {total} correct
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                passed ? "bg-emerald-500" : "bg-indigo-500",
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        {passed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passed
          </span>
        )}
      </div>

      <ol className="space-y-4">
        {params.exercises.map((ex, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-border/50 bg-background/60 p-4"
          >
            <p className="mb-2 text-[10px] uppercase tracking-wider text-foreground-muted">
              Exercise {idx + 1} of {total}
            </p>
            {ex.kind === "mcq-single" && (
              <McqSingleWidget
                widget={ex}
                onSubmit={(r) => handleResult(idx, r)}
                locked={false}
              />
            )}
            {ex.kind === "mcq-multi" && (
              <McqMultiWidget
                widget={ex}
                onSubmit={(r) => handleResult(idx, r)}
                locked={false}
              />
            )}
            {ex.kind === "fill-blank" && (
              <FillBlankWidget
                widget={ex}
                onSubmit={(r) => handleResult(idx, r)}
                locked={false}
              />
            )}
            {ex.kind === "click-target" && (
              <ClickTargetWidget
                widget={ex}
                onSubmit={(r) => handleResult(idx, r)}
                locked={false}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
