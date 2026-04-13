"use client";

/**
 * InterviewPrepTab — interview tips and common mistakes for a pattern.
 * Reads pattern.interviewTips[] and pattern.commonMistakes[].
 */

import React, { memo } from "react";
import { Lightbulb, AlertTriangle } from "lucide-react";
import type { DesignPattern } from "@/lib/lld";

interface InterviewPrepTabProps {
  pattern: DesignPattern;
}

export const InterviewPrepTab = memo(function InterviewPrepTab({
  pattern,
}: InterviewPrepTabProps) {
  const tips = pattern.interviewTips ?? [];
  const mistakes = pattern.commonMistakes ?? [];

  if (tips.length === 0 && mistakes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">
          No interview tips available yet for {pattern.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Interview Prep: {pattern.name}
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {tips.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Interview Tips
            </h3>
            <div className="grid gap-2">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3"
                >
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {mistakes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Common Mistakes
            </h3>
            <div className="grid gap-2">
              {mistakes.map((mistake, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-3"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    {mistake}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
