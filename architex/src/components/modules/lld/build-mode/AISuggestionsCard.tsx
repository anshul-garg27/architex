"use client";

import { memo, useCallback, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  onDismiss: () => void;
}

export const AISuggestionsCard = memo(function AISuggestionsCard({
  onDismiss,
}: Props) {
  const [intent, setIntent] = useState("");
  const mutation = useAISuggestions();
  const addNode = useCanvasStore((s) => s.addNode);

  const acceptSuggestion = useCallback(
    (name: string, kind: string) => {
      // Event-handler scope — Date.now / crypto are intentionally
      // invoked lazily at click time so each "Add" creates a fresh node.
      const id = `sug-${Date.now()}`;
      const x = 120 + Math.random() * 240;
      const y = 120 + Math.random() * 240;
      addNode({
        id,
        type: "class",
        position: { x, y },
        data: { label: name, kind },
      });
    },
    [addNode],
  );

  return (
    <aside
      aria-label="AI node suggestions"
      className="absolute right-4 top-4 z-30 w-80 rounded-xl border border-border/30 bg-elevated/90 p-3 shadow-lg backdrop-blur-sm"
    >
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
          <span className="text-xs font-semibold text-foreground">
            What&apos;s missing?
          </span>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="rounded-md p-0.5 text-foreground-muted hover:bg-foreground/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={2}
        placeholder="(optional) What are you designing?"
        className="w-full resize-none rounded-md border border-border/30 bg-background/60 p-2 text-xs outline-none focus:border-primary/40"
      />

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(intent || undefined)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/80 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            Thinking...
          </>
        ) : (
          "Ask Haiku"
        )}
      </button>

      {mutation.isError && (
        <p className="mt-2 text-[11px] text-red-400">
          {mutation.error.message}
        </p>
      )}

      {mutation.data && mutation.data.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {mutation.data.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-border/20 bg-background/40 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {s.suggestedName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    acceptSuggestion(s.suggestedName, s.suggestedKind)
                  }
                  className="rounded-md border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                >
                  Add
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-foreground-muted">
                {s.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
});
