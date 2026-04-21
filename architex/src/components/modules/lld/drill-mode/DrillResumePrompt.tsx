"use client";

import { Button } from "@/components/ui/button";

export function DrillResumePrompt({
  problemTitle,
  remainingMinutes,
  onResume,
  onAbandon,
}: {
  problemTitle: string;
  remainingMinutes: number;
  onResume: () => void;
  onAbandon: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h3 className="text-lg font-semibold text-zinc-100">Drill in progress</h3>
      <p className="mt-2 text-sm text-zinc-400">
        You have an active drill on <strong>{problemTitle}</strong> with{" "}
        {remainingMinutes} minutes remaining.
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={onResume}>Resume</Button>
        <Button variant="ghost" onClick={onAbandon} className="text-rose-300">
          Abandon
        </Button>
      </div>
    </div>
  );
}
