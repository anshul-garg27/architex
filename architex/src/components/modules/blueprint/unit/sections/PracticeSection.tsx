"use client";

import Link from "next/link";
import { Timer, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PracticeSectionParams } from "@/lib/blueprint/section-types";

interface Props {
  title: string;
  params: PracticeSectionParams;
  isCompleted: boolean;
  onComplete: () => void;
}

/**
 * Practice section — V1 renders the problem framing + a link out to
 * the Problems Workspace (SP5) for the actual drill experience. When
 * the user returns, they mark the section done by hand. SP5 will
 * eventually wire up auto-completion via a drill_submitted hook.
 */
export function PracticeSection({
  title,
  params,
  isCompleted,
  onComplete,
}: Props) {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-plum-500/15 text-plum-700 dark:text-plum-300">
          <Timer className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
            Practice
          </p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </header>

      <div className="rounded-xl border border-border/50 bg-background/60 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
              Problem
            </p>
            <p className="text-base font-semibold text-foreground">
              {params.problemSlug}
            </p>
            <p className="mt-2 text-xs text-foreground-muted">
              Suggested timer: {params.timerMinutes} min
              {params.reducedScope ? ` · ${params.reducedScope}` : ""}
            </p>
          </div>
          <Link
            href={`/modules/blueprint/toolkit/problems/${params.problemSlug}/drill`}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-indigo-400/60"
          >
            Open in drill mode
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground-muted">
        The Problems Workspace opens in a new tab. Come back here when
        you&apos;re done and mark the section complete.
      </p>

      <div className="mt-5 flex items-center justify-end">
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
              Practiced
            </>
          ) : (
            "I finished drilling"
          )}
        </button>
      </div>
    </div>
  );
}
