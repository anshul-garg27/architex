"use client";

/**
 * ConfusedWithTab — side-by-side comparison of commonly confused patterns.
 * Reads pattern.confusedWith[] and shows each confused pattern's name,
 * the difference explanation, and a button to load that pattern.
 */

import React, { memo, useCallback } from "react";
import { ArrowRight, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";

interface ConfusedWithTabProps {
  pattern: DesignPattern;
  onLoadPattern: (pattern: DesignPattern) => void;
}

export const ConfusedWithTab = memo(function ConfusedWithTab({
  pattern,
  onLoadPattern,
}: ConfusedWithTabProps) {
  const { patterns } = useLLDDataContext();

  const confusedEntries = pattern.confusedWith ?? [];

  if (confusedEntries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">
          No commonly confused patterns listed for {pattern.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Shuffle className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Commonly Confused With {pattern.name}
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="grid gap-3">
          {confusedEntries.map((entry) => {
            const otherPattern = patterns.find((p) => p.id === entry.patternId);
            return (
              <div
                key={entry.patternId}
                className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {pattern.name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
                    <span className="text-sm font-semibold text-foreground">
                      {otherPattern?.name ?? entry.patternId}
                    </span>
                  </div>
                  {otherPattern && (
                    <button
                      onClick={() => onLoadPattern(otherPattern)}
                      className={cn(
                        "rounded-xl border border-border/30 bg-background/60 px-2.5 py-1 text-[10px] font-medium",
                        "text-foreground-muted backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground",
                      )}
                    >
                      Load {otherPattern.name}
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-foreground-muted">
                  {entry.difference}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
