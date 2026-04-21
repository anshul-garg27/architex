"use client";

import { useState } from "react";
import { Check, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReflectSectionParams } from "@/lib/blueprint/section-types";

function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Reflect section — a single free-form prompt with a textarea.
 *
 * Minimum-word validation is soft: the user sees a counter but can
 * submit shorter answers. We surface the minimum for transparency,
 * not as a gate.
 */
export function ReflectSection({
  title,
  params,
  isCompleted,
  onComplete,
}: {
  title: string;
  params: ReflectSectionParams;
  isCompleted: boolean;
  onComplete: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const words = countWords(text);
  const meetsMin =
    params.minWords === undefined || words >= params.minWords;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300">
          <PenLine className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Reflect
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      <p className="mb-3 text-sm text-foreground">{params.prompt}</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={params.placeholder ?? "Think in terms of your own code…"}
        rows={6}
        disabled={isCompleted}
        className="w-full resize-y rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={title}
      />

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-foreground-muted">
        <span>
          <span className="tabular-nums">{words}</span> word{words === 1 ? "" : "s"}
          {params.minWords ? (
            <>
              {" "}· aim for {params.minWords}+ {meetsMin ? "✓" : ""}
            </>
          ) : null}
        </span>
        <button
          type="button"
          disabled={isCompleted || !text.trim()}
          onClick={() => onComplete(text)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            isCompleted
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-foreground/10 disabled:text-foreground-muted",
          )}
        >
          {isCompleted ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Saved
            </>
          ) : (
            "Save reflection"
          )}
        </button>
      </div>
    </div>
  );
}
