"use client";

import { Button } from "@/components/ui/button";
import { useDrillStage } from "@/hooks/useDrillStage";

export function DrillSubmitBar({
  onSubmit,
  onPause,
  onAbandon,
}: {
  onSubmit: () => void;
  onPause: () => void;
  onAbandon: () => void;
}) {
  const { isTerminal, gate, advance } = useDrillStage();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/60 px-4 py-3 backdrop-blur">
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onPause}>
          Pause
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAbandon}
          className="text-rose-300"
        >
          Give up
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {!gate.satisfied && (
          <span className="text-xs text-amber-300">{gate.reason}</span>
        )}
        {isTerminal ? (
          <Button onClick={onSubmit} disabled={!gate.satisfied}>
            Submit drill
          </Button>
        ) : (
          <Button onClick={advance} disabled={!gate.satisfied}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
