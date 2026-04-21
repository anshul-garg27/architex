"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useUnitList } from "@/hooks/blueprint/useUnitList";
import { useUnitProgressMap } from "@/hooks/blueprint/useUnitProgressMap";
import { UnitCard } from "./UnitCard";
import type { BlueprintUnitListEntry } from "@/hooks/blueprint/useUnitList";
import type { BlueprintUnitState } from "@/db/schema";

const TRACK_ORDER: Array<{ id: string; label: string }> = [
  { id: "foundation", label: "Foundations" },
  { id: "creational", label: "Creational patterns" },
  { id: "structural", label: "Structural patterns" },
  { id: "behavioral", label: "Behavioral patterns" },
  { id: "applied", label: "Applied design" },
];

interface Track {
  id: string;
  label: string;
  units: BlueprintUnitListEntry[];
}

function groupByTrack(units: BlueprintUnitListEntry[]): Track[] {
  const byTag = new Map<string, BlueprintUnitListEntry[]>();
  for (const u of units) {
    const tag = u.tags[0] ?? "other";
    const bucket = byTag.get(tag);
    if (bucket) {
      bucket.push(u);
    } else {
      byTag.set(tag, [u]);
    }
  }
  const tracks: Track[] = TRACK_ORDER.map(({ id, label }) => ({
    id,
    label,
    units: (byTag.get(id) ?? []).slice().sort((a, b) => a.ordinal - b.ordinal),
  })).filter((t) => t.units.length > 0);

  // Any units with an uncategorized tag (shouldn't happen in V1) go
  // into a trailing "Other" track so they're never orphaned.
  const seen = new Set(TRACK_ORDER.map((t) => t.id));
  for (const [tag, list] of byTag.entries()) {
    if (!seen.has(tag)) {
      tracks.push({
        id: tag,
        label: tag[0].toUpperCase() + tag.slice(1),
        units: list.slice().sort((a, b) => a.ordinal - b.ordinal),
      });
    }
  }
  return tracks;
}

/**
 * The curriculum map is the journey home's centerpiece.
 *
 * Layout: one row per track (foundations → creational → structural →
 * behavioral → applied). Inside each track, units ordered by ordinal
 * with a subtle chevron between adjacent cards signaling sequence.
 *
 * Card state (locked / available / in_progress / completed / mastered)
 * comes from `useUnitProgressMap`. Units that have not been touched yet
 * get `available` or `locked` as derived server-side based on prereqs.
 */
export function CurriculumMap() {
  const units = useUnitList();
  const progressMap = useUnitProgressMap();

  const tracks = useMemo(
    () => (units.data ? groupByTrack(units.data) : []),
    [units.data],
  );

  if (units.isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading curriculum"
        className="mx-auto mt-6 w-full max-w-5xl space-y-6"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-foreground/5" />
            <div className="flex gap-3">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="h-[120px] w-64 animate-pulse rounded-xl bg-foreground/5"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (units.error) {
    return (
      <div
        role="alert"
        className="mx-auto mt-6 w-full max-w-5xl rounded-xl border border-red-400/40 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
      >
        Could not load the curriculum: {units.error.message}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="mx-auto mt-6 w-full max-w-5xl rounded-xl border border-border/40 bg-background/40 p-6 text-center text-sm text-foreground-muted">
        The curriculum is empty. Run{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-xs">
          pnpm blueprint:seed-units
        </code>{" "}
        to populate 12 placeholder units.
      </div>
    );
  }

  return (
    <section
      aria-label="Curriculum map"
      className="mx-auto mt-6 w-full max-w-5xl space-y-8"
    >
      {tracks.map((track) => (
        <div key={track.id}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            {track.label}
          </h2>
          <div className="flex flex-wrap items-stretch gap-2">
            {track.units.map((unit, idx) => {
              const progress = progressMap.data?.[unit.slug];
              const state: BlueprintUnitState =
                progress?.state ?? "available";
              const completedSections = progress?.completedSectionCount ?? 0;
              const totalSections =
                progress?.totalSections ?? unit.tags.length; // placeholder; recipe not loaded here
              return (
                <div
                  key={unit.slug}
                  className="flex items-center gap-2"
                >
                  <UnitCard
                    unit={unit}
                    state={state}
                    completedSections={completedSections}
                    totalSections={totalSections}
                  />
                  {idx < track.units.length - 1 && (
                    <ChevronRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-foreground-subtle"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
