"use client";

import { useState } from "react";
import { Check, Calendar } from "lucide-react";
import type { RetainSectionParams } from "@/lib/blueprint/section-types";
import { cn } from "@/lib/utils";

/**
 * Retain section — previews the FSRS cards that will enter the user's
 * review queue and lets them "Schedule" (a no-op confirmation in SP3;
 * SP6 wires up real FSRS writes).
 *
 * Section stays incomplete until the user clicks Schedule.
 */
export function RetainSection({
  title,
  params,
  isCompleted,
  onComplete,
}: {
  title: string;
  params: RetainSectionParams;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sage-500/15 text-sage-700 dark:text-sage-300">
          <Calendar className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Retain
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      {params.recap && (
        <p className="mb-5 rounded-md border border-border/40 bg-background/60 px-4 py-3 text-sm leading-relaxed text-foreground-muted">
          {params.recap}
        </p>
      )}

      <ol className="space-y-3">
        {params.cards.map((c, idx) => (
          <li
            key={c.id}
            className="overflow-hidden rounded-lg border border-border/60 bg-background/60"
          >
            <button
              type="button"
              onClick={() =>
                setRevealed((r) => ({ ...r, [c.id]: !r[c.id] }))
              }
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-foreground/5"
              aria-expanded={Boolean(revealed[c.id])}
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted tabular-nums">
                #{(idx + 1).toString().padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {c.front}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-foreground-subtle">
                  {c.entityType} · {c.entitySlug}
                </p>
                {revealed[c.id] && (
                  <p className="mt-2 rounded-md border border-indigo-300/30 bg-indigo-50/60 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
                    {c.back}
                  </p>
                )}
              </div>
              <span className="mt-1 shrink-0 text-[10px] text-foreground-subtle">
                {revealed[c.id] ? "Hide" : "Reveal"}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-end gap-3">
        <p className="flex-1 text-xs text-foreground-muted">
          These cards will enter your review queue on a spaced schedule.
          You&apos;ll see the first one again in a few days.
        </p>
        <button
          type="button"
          disabled={isCompleted}
          onClick={onComplete}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            isCompleted
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-indigo-500 text-white hover:bg-indigo-600",
          )}
        >
          {isCompleted ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Scheduled
            </>
          ) : (
            <>Schedule {params.cards.length} card{params.cards.length === 1 ? "" : "s"}</>
          )}
        </button>
      </div>
    </div>
  );
}
