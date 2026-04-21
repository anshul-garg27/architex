"use client";

import { useEffect, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";

export function WalkthroughStage() {
  const merge = useDrillStore((s) => s.mergeStageProgress);
  const [text, setText] = useState("");

  useEffect(() => {
    merge({ walkthroughChars: text.length });
  }, [text, merge]);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Stage 4 · Narrate
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          Walk us through the happy path end-to-end. Name the pattern, call
          out tradeoffs, explain why this shape over alternatives.
        </p>
      </header>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 font-mono text-sm text-zinc-100"
        placeholder="A user arrives at the gate. We call assignSpot() on ParkingLot, which..."
      />
      <div className="text-xs text-zinc-500">{text.length} chars</div>
    </div>
  );
}
