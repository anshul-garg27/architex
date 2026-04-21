"use client";

import { Button } from "@/components/ui/button";
import { useDrillHintLadder, type UITier } from "@/hooks/useDrillHintLadder";
import { cn } from "@/lib/utils";

const TIERS: Array<{ key: UITier; label: string; penalty: number }> = [
  { key: "nudge", label: "Nudge", penalty: 3 },
  { key: "hint", label: "Hint", penalty: 10 },
  { key: "reveal", label: "Reveal", penalty: 20 },
];

export function DrillHintLadder({ attemptId }: { attemptId: string }) {
  const {
    remainingBudget,
    consumedTiers,
    canRequestTier,
    requestTier,
    lastHintContent,
    isLoading,
  } = useDrillHintLadder(attemptId);

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
        <span>Hints</span>
        {remainingBudget !== null && <span>Budget · {remainingBudget} left</span>}
      </header>
      <div className="flex gap-2">
        {TIERS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={consumedTiers.includes(t.key) ? "secondary" : "outline"}
            disabled={!canRequestTier(t.key) || isLoading}
            onClick={() => void requestTier(t.key)}
            className={cn(consumedTiers.includes(t.key) && "opacity-70")}
          >
            {t.label}
            <span className="ml-1 text-[10px] opacity-70">-{t.penalty}</span>
          </Button>
        ))}
      </div>
      {lastHintContent && (
        <p className="text-sm text-zinc-300">{lastHintContent}</p>
      )}
    </aside>
  );
}
