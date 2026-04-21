"use client";

import Link from "next/link";
import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import { blueprintUnitOpened } from "@/lib/analytics/blueprint-events";
import type { BlueprintUnitState } from "@/db/schema";
import type { BlueprintUnitListEntry } from "@/hooks/blueprint/useUnitList";

interface Props {
  unit: BlueprintUnitListEntry;
  state: BlueprintUnitState;
  completedSections: number;
  totalSections: number;
}

const STATE_TONE: Record<BlueprintUnitState, string> = {
  locked:
    "border-border/40 bg-background/30 text-foreground-subtle opacity-60 [&[aria-disabled='true']]:cursor-not-allowed",
  available: "border-border/60 bg-background hover:border-indigo-400/60",
  in_progress:
    "border-indigo-400/60 bg-indigo-500/5 hover:border-indigo-400 hover:bg-indigo-500/10",
  completed:
    "border-emerald-400/40 bg-emerald-500/5 hover:border-emerald-400",
  mastered:
    "border-amber-400/50 bg-amber-500/5 hover:border-amber-400",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function UnitCard({
  unit,
  state,
  completedSections,
  totalSections,
}: Props) {
  const { track } = useBlueprintAnalytics();

  const isClickable = state !== "locked";
  const href = `/modules/blueprint/unit/${unit.slug}`;
  const progressPct =
    totalSections > 0
      ? Math.round((completedSections / totalSections) * 100)
      : 0;

  const innerContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground-muted tabular-nums">
              #{unit.ordinal.toString().padStart(2, "0")}
            </span>
            {state === "locked" && (
              <Lock
                aria-label="Locked"
                className="h-3 w-3 text-foreground-subtle"
              />
            )}
            {state === "completed" && (
              <Check
                aria-label="Completed"
                className="h-3.5 w-3.5 text-emerald-600"
              />
            )}
            {state === "mastered" && (
              <Star
                aria-label="Mastered"
                className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
              />
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold leading-tight text-foreground">
            {unit.title}
          </h3>
        </div>
      </div>
      {unit.summary && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground-muted">
          {unit.summary}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-foreground-muted">
        <span>{unit.durationMinutes} min</span>
        <span className="opacity-50">·</span>
        <span>{DIFFICULTY_LABEL[unit.difficulty] ?? unit.difficulty}</span>
      </div>
      {state === "in_progress" && totalSections > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/5">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-indigo-600 tabular-nums">
            {progressPct}%
          </span>
        </div>
      )}
    </>
  );

  const className = cn(
    "flex min-h-[120px] w-64 flex-col rounded-xl border px-3 py-3 transition-colors",
    STATE_TONE[state],
  );

  if (!isClickable) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${unit.title} — locked`}
        title="Complete prerequisite units first."
        className={className}
      >
        {innerContent}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`Open ${unit.title}`}
      onClick={() =>
        track(
          blueprintUnitOpened({
            unitSlug: unit.slug,
            entry: "map",
          }),
        )
      }
      className={className}
    >
      {innerContent}
    </Link>
  );
}
