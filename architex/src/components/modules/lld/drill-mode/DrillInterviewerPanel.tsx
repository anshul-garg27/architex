"use client";

import { useState } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { useDrillInterviewer } from "@/hooks/useDrillInterviewer";
import { Button } from "@/components/ui/button";

export function DrillInterviewerPanel({
  attemptId,
}: {
  attemptId: string;
}) {
  const turns = useDrillStore((s) => s.interviewerTurns);
  const { pending, isStreaming, error, sendMessage } =
    useDrillInterviewer(attemptId);
  const [input, setInput] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {turns.map((t) => (
          <div
            key={t.seq}
            className={
              t.role === "interviewer"
                ? "rounded-lg bg-zinc-900/60 p-3 text-sm text-zinc-100"
                : "ml-8 rounded-lg bg-violet-500/10 p-3 text-sm text-violet-100"
            }
          >
            {t.content}
          </div>
        ))}
        {pending && (
          <div className="rounded-lg bg-zinc-900/60 p-3 text-sm text-zinc-300">
            {pending}
            <span className="ml-1 animate-pulse">...</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>
      <form
        className="flex gap-2 border-t border-zinc-800 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || isStreaming) return;
          void sendMessage(input.trim());
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the interviewer..."
          disabled={isStreaming}
        />
        <Button type="submit" disabled={!input.trim() || isStreaming}>
          Send
        </Button>
      </form>
    </div>
  );
}
