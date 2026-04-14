"use client";

/**
 * WalkthroughPlayer — step-by-step walkthrough for a design pattern.
 *
 * Fetches walkthrough data from the content API (content_type: 'pattern-walkthrough')
 * and displays steps with title, description, and key insight. Falls back to the
 * pattern description if no walkthrough exists.
 */

import { memo, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Footprints, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/hooks/use-content";
import type { ContentDetailItem } from "@/hooks/use-content";
import type { DesignPattern } from "@/lib/lld";

interface WalkthroughStep {
  title: string;
  description: string;
  keyInsight?: string;
}

interface WalkthroughPlayerProps {
  pattern: DesignPattern;
}

export const WalkthroughPlayer = memo(function WalkthroughPlayer({
  pattern,
}: WalkthroughPlayerProps) {
  const { data, isLoading } = useCatalog("lld", "pattern-walkthrough", { full: true });
  const [stepIndex, setStepIndex] = useState(0);

  // Find walkthrough for this pattern by slug (pattern.id matches slug)
  const walkthrough = useMemo(() => {
    if (!data?.items) return null;
    const item = data.items.find(
      (i) => (i as unknown as ContentDetailItem).slug === pattern.id,
    ) as unknown as ContentDetailItem | undefined;
    if (!item?.content) return null;
    const steps = (item.content.steps ?? item.content.walkthrough) as WalkthroughStep[] | undefined;
    return steps && steps.length > 0 ? steps : null;
  }, [data, pattern.id]);

  // Reset step when pattern changes
  const patternId = pattern.id;
  const [prevPatternId, setPrevPatternId] = useState(patternId);
  if (patternId !== prevPatternId) {
    setStepIndex(0);
    setPrevPatternId(patternId);
  }

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span className="text-[10px] text-foreground-subtle">Loading walkthrough...</span>
        </div>
      </div>
    );
  }

  if (!walkthrough) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 text-foreground-subtle/50" />
          <span className="text-[10px] text-foreground-subtle">No walkthrough available</span>
        </div>
      </div>
    );
  }

  const step = walkthrough[stepIndex];
  const total = walkthrough.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <div className="border-b border-border/30 px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Footprints className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Walkthrough
          </span>
        </div>
        <span className="text-[10px] text-foreground-subtle">
          Step {stepIndex + 1} of {total}
        </span>
      </div>

      {/* Step content */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {step.description}
        </p>
        {step.keyInsight && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm px-3 py-2">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] font-medium leading-relaxed text-amber-300">
              {step.keyInsight}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStepIndex((i) => i - 1)}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
            isFirst
              ? "border-border/20 text-foreground-subtle/40 cursor-not-allowed"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <ChevronLeft className="h-3 w-3" /> Previous
        </button>

        {/* Step dots */}
        <div className="flex gap-1">
          {walkthrough.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIndex
                  ? "w-4 bg-gradient-to-r from-primary to-violet-400"
                  : "w-1.5 bg-border/50 hover:bg-border",
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setStepIndex((i) => i + 1)}
          disabled={isLast}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
            isLast
              ? "border-border/20 text-foreground-subtle/40 cursor-not-allowed"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
});
