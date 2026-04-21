"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ListChecks } from "lucide-react";
import { useUnit } from "@/hooks/blueprint/useUnit";
import { useUnitProgress } from "@/hooks/blueprint/useUnitProgress";
import { useUnitList } from "@/hooks/blueprint/useUnitList";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import { blueprintUnitCompleted } from "@/lib/analytics/blueprint-events";

interface Props {
  unitSlug: string;
}

export function UnitCompletion({ unitSlug }: Props) {
  const { data: unit } = useUnit(unitSlug);
  const { progress, markUnitCompleted } = useUnitProgress(unitSlug);
  const { data: allUnits } = useUnitList();
  const { track } = useBlueprintAnalytics();

  useEffect(() => {
    // Fire completion once progress + unit data are ready.
    if (!unit || !progress) return;
    if (progress.state !== "completed") {
      markUnitCompleted();
      track(
        blueprintUnitCompleted({
          unitSlug,
          totalTimeMs: progress.totalTimeMs ?? 0,
        }),
      );
    }
  }, [unit, progress, markUnitCompleted, track, unitSlug]);

  const nextUnit = (() => {
    if (!unit || !allUnits) return null;
    const idx = allUnits.findIndex((u) => u.slug === unit.slug);
    return idx >= 0 && idx < allUnits.length - 1 ? allUnits[idx + 1] : null;
  })();

  if (!unit) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-foreground-muted">Loading…</p>
      </div>
    );
  }

  const totalSections = unit.recipeJson?.sections?.length ?? 0;
  const correctCount = Object.values(progress?.sectionStates ?? {}).filter(
    (s) => s.score != null && s.score >= 70,
  ).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
        Unit complete
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold italic text-foreground">
        {unit.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-foreground-muted">
        Nicely done. The cards you scheduled will surface on a spaced
        rhythm so it sticks.
      </p>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3 text-left">
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
            Sections
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {totalSections}
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3 text-left">
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
            Strong scores
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {correctCount}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        {nextUnit ? (
          <Link
            href={`/modules/blueprint/unit/${nextUnit.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            Next: Unit {nextUnit.ordinal} · {nextUnit.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <p className="text-sm text-foreground-muted">
            You&apos;ve reached the end of the curriculum.
          </p>
        )}
        <Link
          href="/modules/blueprint"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground"
        >
          <ListChecks className="h-3.5 w-3.5" />
          Back to the curriculum map
        </Link>
      </div>
    </div>
  );
}
