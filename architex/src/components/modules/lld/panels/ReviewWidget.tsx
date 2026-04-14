"use client";

/**
 * ReviewWidget — FSRS spaced-repetition review session UI.
 *
 * Shows due items one at a time with rating buttons. Compact design
 * suitable for sidebar placement or as a floating widget.
 */

import { memo, useState, useEffect } from "react";
import { RotateCcw, Brain, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReviewSession } from "@/hooks/use-due-reviews";
import { Rating } from "@/lib/fsrs";
import { DESIGN_PATTERNS } from "@/lib/lld";

const RATING_BUTTONS = [
  { rating: Rating.Again, label: "Again", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
  { rating: Rating.Hard, label: "Hard", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20" },
  { rating: Rating.Good, label: "Good", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
  { rating: Rating.Easy, label: "Easy", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
] as const;

export const ReviewWidget = memo(function ReviewWidget() {
  const { currentItem, remaining, total, isComplete, isLoading, isSubmitting, submitReview } =
    useReviewSession("lld");
  const [showAnswer, setShowAnswer] = useState(false);

  // Reset answer visibility when item changes
  const currentConceptId = currentItem?.conceptId;
  useEffect(() => {
    setShowAnswer(false);
  }, [currentConceptId]);

  // Look up pattern info for the current review item
  const pattern = currentConceptId
    ? DESIGN_PATTERNS.find((p) => p.id === currentConceptId)
    : null;

  const prompt = pattern?.predictionPrompts?.[0] ?? null;
  const reviewed = total - remaining;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 animate-pulse text-primary" />
          <span className="text-xs text-foreground-subtle">Loading reviews...</span>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return null;
  }

  if (isComplete) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-400" />
          <span className="text-xs font-semibold text-green-400">All caught up!</span>
        </div>
        <p className="mt-1 text-[10px] text-foreground-subtle">
          You reviewed {total} item{total !== 1 ? "s" : ""} this session.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Review
          </span>
        </div>
        <span className="text-[10px] text-foreground-subtle">
          {reviewed + 1} of {total} remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-300"
          style={{ width: `${total > 0 ? (reviewed / total) * 100 : 0}%` }}
        />
      </div>

      {/* Current item */}
      {pattern && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">{pattern.name}</p>
          {prompt && (
            <div className="space-y-1.5">
              <p className="text-[11px] leading-relaxed text-foreground-muted">
                {prompt.question}
              </p>
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Show Answer <ChevronRight className="h-3 w-3" />
                </button>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
                  <p className="text-[11px] leading-relaxed text-foreground-muted">
                    {prompt.answer}
                  </p>
                </div>
              )}
            </div>
          )}
          {!prompt && (
            <p className="text-[11px] text-foreground-subtle italic">
              {pattern.description}
            </p>
          )}
        </div>
      )}

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {RATING_BUTTONS.map(({ rating, label, color, bg }) => (
          <button
            key={rating}
            onClick={() => {
              if (currentConceptId) {
                submitReview(currentConceptId, rating);
                setShowAnswer(false);
              }
            }}
            disabled={isSubmitting}
            className={cn(
              "rounded-lg border py-1.5 text-[10px] font-semibold transition-all disabled:opacity-50",
              bg,
              color,
            )}
          >
            {isSubmitting ? (
              <RotateCcw className="mx-auto h-3 w-3 animate-spin" />
            ) : (
              label
            )}
          </button>
        ))}
      </div>
    </div>
  );
});
