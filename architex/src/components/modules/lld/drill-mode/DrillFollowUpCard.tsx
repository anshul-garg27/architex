"use client";

import { Button } from "@/components/ui/button";

export function DrillFollowUpCard({
  suggestions,
  onRetry,
  onLearnPattern,
  onNextProblem,
}: {
  suggestions: string[];
  onRetry: () => void;
  onLearnPattern: (pattern: string) => void;
  onNextProblem: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        What&apos;s next
      </h4>
      <ul className="mt-2 space-y-1 text-sm text-zinc-200">
        {suggestions.map((s, i) => (
          <li key={i}>- {s}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRetry}>
          Retry this drill
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLearnPattern("strategy")}
        >
          Open Learn mode
        </Button>
        <Button size="sm" variant="ghost" onClick={onNextProblem}>
          Next problem
        </Button>
      </div>
    </div>
  );
}
