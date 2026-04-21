"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useResumeState } from "@/hooks/blueprint/useResumeState";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import { blueprintResumeClicked } from "@/lib/analytics/blueprint-events";

/**
 * Large horizontal card that sits above the curriculum map.
 *
 * Three states:
 *   - loading: render a subtle skeleton
 *   - no resume target: render a "Start here" CTA pointing to unit 1
 *   - has target: render unit title + section progress + Continue CTA
 */
export function ResumeCard() {
  const { target, isLoading } = useResumeState();
  const { track } = useBlueprintAnalytics();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading resume state"
        className="mx-auto my-4 h-32 w-full max-w-5xl animate-pulse rounded-2xl border border-border/30 bg-background/40"
      />
    );
  }

  if (!target) {
    return (
      <Link
        href="/modules/blueprint/unit/what-is-a-pattern"
        className="group mx-auto my-4 flex w-full max-w-5xl items-center justify-between gap-6 rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/5 to-sky-500/5 px-6 py-5 transition-colors hover:from-indigo-500/10"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
            <Play className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-500">
              Start here
            </p>
            <p className="text-base font-semibold text-foreground">
              Unit 1 · What is a design pattern?
            </p>
            <p className="text-xs text-foreground-muted">
              A 45-minute introduction.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:gap-2 transition-all dark:text-indigo-300">
          Start
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  const progressPct =
    target.totalSections > 0
      ? Math.round((target.completedSections / target.totalSections) * 100)
      : 0;

  return (
    <Link
      href={`/modules/blueprint/unit/${target.unitSlug}`}
      onClick={() =>
        track(
          blueprintResumeClicked({
            unitSlug: target.unitSlug,
            sectionId: target.sectionId,
          }),
        )
      }
      className="group mx-auto my-4 block w-full max-w-5xl rounded-2xl border border-border/40 bg-background/60 p-5 transition-colors hover:border-indigo-400/60"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-indigo-500">
            Continue
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-foreground">
            Unit {target.unitOrdinal} · {target.unitTitle}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Section {target.completedSections + 1} of {target.totalSections}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white group-hover:bg-indigo-600 transition-colors">
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
