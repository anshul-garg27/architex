"use client";

import React, { memo, useState, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface SimulateYourAnswerButtonProps {
  /** Whether a challenge is actively being designed */
  isDesigning: boolean;
  /** Called when the user wants to simulate their current answer */
  onSimulate?: () => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────

function SimulateYourAnswerButtonInner({
  isDesigning,
  onSimulate,
  className,
}: SimulateYourAnswerButtonProps) {
  const [simulating, setSimulating] = useState(false);

  const handleClick = useCallback(() => {
    if (simulating || !isDesigning) return;
    setSimulating(true);
    onSimulate?.();
    // Auto-reset after a brief feedback delay
    setTimeout(() => setSimulating(false), 2000);
  }, [simulating, isDesigning, onSimulate]);

  if (!isDesigning) return null;

  return (
    <button
      onClick={handleClick}
      disabled={simulating}
      className={cn(
        "flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
        simulating
          ? "bg-amber-600/20 text-amber-400 cursor-wait"
          : "border border-amber-600 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20",
        "disabled:opacity-60",
        className,
      )}
    >
      {simulating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          Simulate Your Answer
        </>
      )}
    </button>
  );
}

const SimulateYourAnswerButton = memo(SimulateYourAnswerButtonInner);
export default SimulateYourAnswerButton;
