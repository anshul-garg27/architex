"use client";

/**
 * Post-drill results screen.
 *
 * Composes the post-drill artifacts into one designed surface:
 *   hero    — DrillGradeReveal (score + band, fed by postmortem TL;DR)
 *   left    — DrillRubricBreakdown + DrillTimingHeatmap
 *   right   — DrillPostmortem + DrillCanonicalCompare
 *   footer  — DrillFollowUpCard
 *
 * The AI postmortem is fetched on mount via the idempotent
 * POST /api/lld/drill-attempts/[id]/postmortem; a shimmer shows while
 * Claude writes, with graceful fallback copy on error.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useDrillStore } from "@/stores/drill-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DrillGradeReveal } from "./DrillGradeReveal";
import { DrillRubricBreakdown } from "./DrillRubricBreakdown";
import { DrillPostmortem } from "./DrillPostmortem";
import { DrillCanonicalCompare } from "./DrillCanonicalCompare";
import { DrillTimingHeatmap } from "./DrillTimingHeatmap";
import { DrillFollowUpCard } from "./DrillFollowUpCard";
import { buildResultsHeatmap } from "@/lib/lld/drill-results-timing";
import { getCanonicalFor } from "@/lib/lld/drill-canonical";
import { VARIANT_CONFIG } from "@/lib/lld/drill-variants";
import type { PostmortemOutput } from "@/lib/ai/postmortem-generator";

type PostmortemState =
  | { status: "loading" }
  | { status: "ready"; pm: PostmortemOutput }
  | { status: "error" };

const DEFAULT_FOLLOW_UPS = [
  "Retry this drill and aim at your weakest rubric axis",
  "Review the canonical pattern in Learn mode",
  "Pick a harder variant once you land two Solid bands in a row",
];

function extractUserClasses(
  nodes: ReadonlyArray<{ data?: unknown }>,
): Array<{ name: string }> {
  const names = nodes
    .map((n) => {
      const d = (n.data ?? {}) as Record<string, unknown>;
      const raw = d.label ?? d.className ?? d.name;
      return typeof raw === "string" ? raw.trim() : "";
    })
    .filter((s) => s.length > 0);
  return Array.from(new Set(names)).map((name) => ({ name }));
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </h3>
  );
}

function PostmortemShimmer() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
        Claude is writing your postmortem…
      </div>
      <Skeleton className="h-4 w-11/12 bg-zinc-800/80" />
      <Skeleton className="h-4 w-3/4 bg-zinc-800/60" />
      <div className="pt-2">
        <Skeleton className="h-3 w-24 bg-zinc-800/50" />
      </div>
      <Skeleton className="h-3.5 w-5/6 bg-zinc-800/60" />
      <Skeleton className="h-3.5 w-2/3 bg-zinc-800/40" />
      <div className="pt-2">
        <Skeleton className="h-3 w-16 bg-zinc-800/50" />
      </div>
      <Skeleton className="h-3.5 w-4/5 bg-zinc-800/60" />
      <Skeleton className="h-3.5 w-3/5 bg-zinc-800/40" />
    </div>
  );
}

function PostmortemFallback() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <p className="text-sm text-zinc-200">
        The written postmortem didn&apos;t come through this time.
      </p>
      <p className="mt-1.5 text-sm text-zinc-500">
        Your grade and rubric are saved. Use the per-axis breakdown to spot
        your weakest area, then run the drill again — the postmortem will
        retry on your next visit to this screen.
      </p>
    </div>
  );
}

export interface DrillResultsScreenProps {
  attemptId: string;
  /** Reset the drill store and return to the start panel (same problem). */
  onStartNew: () => void;
  /** Reset and clear the problem selection — back to the problem list. */
  onBackToProblems: () => void;
}

export function DrillResultsScreen({
  attemptId,
  onStartNew,
  onBackToProblems,
}: DrillResultsScreenProps) {
  const finalScore = useDrillStore((s) => s.finalScore);
  const rubric = useDrillStore((s) => s.rubricBreakdown);
  const stageDurationsMs = useDrillStore((s) => s.stageDurationsMs);
  const variant = useDrillStore((s) => s.variant);
  const problemId = useDrillStore((s) => s.problemId);
  const nodes = useCanvasStore((s) => s.nodes);
  const setLLDMode = useUIStore((s) => s.setLLDMode);

  const [pmState, setPmState] = useState<PostmortemState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    async function loadPostmortem() {
      try {
        const res = await fetch(
          `/api/lld/drill-attempts/${attemptId}/postmortem`,
          { method: "POST" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          postmortem: PostmortemOutput | null;
        };
        if (cancelled) return;
        if (data.postmortem) {
          setPmState({ status: "ready", pm: data.postmortem });
        } else {
          setPmState({ status: "error" });
        }
      } catch {
        if (!cancelled) setPmState({ status: "error" });
      }
    }
    void loadPostmortem();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const heatmap = useMemo(
    () => buildResultsHeatmap(stageDurationsMs, variant),
    [stageDurationsMs, variant],
  );
  const canonical = useMemo(
    () => (problemId ? getCanonicalFor(problemId) : null),
    [problemId],
  );
  const userClasses = useMemo(() => extractUserClasses(nodes), [nodes]);

  // Parent only renders this screen post-grade; guard anyway.
  if (rubric === null || finalScore === null) return null;

  const pm = pmState.status === "ready" ? pmState.pm : null;

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-400">
              Drill complete
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
              {canonical?.title ?? problemId ?? "Results"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {VARIANT_CONFIG[variant].label} · 6-axis rubric
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onBackToProblems}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Back to problems
            </Button>
            <Button
              onClick={onStartNew}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              Start new drill
            </Button>
          </div>
        </header>

        <section className="mt-6" aria-label="Grade">
          <DrillGradeReveal score={finalScore} feedback={pm?.tldr ?? null} />
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <section aria-label="Rubric breakdown">
              <SectionHeading>Rubric breakdown</SectionHeading>
              <DrillRubricBreakdown rubric={rubric} />
            </section>
            <section aria-label="Pacing">
              <SectionHeading>Pacing</SectionHeading>
              <DrillTimingHeatmap heatmap={heatmap} />
            </section>
          </div>

          <div className="space-y-8">
            <section aria-label="Postmortem">
              <SectionHeading>Postmortem</SectionHeading>
              {pmState.status === "loading" && <PostmortemShimmer />}
              {pmState.status === "error" && <PostmortemFallback />}
              {pm && <DrillPostmortem pm={pm} />}
            </section>
            {canonical && (
              <section aria-label="Canonical comparison">
                <SectionHeading>Vs canonical</SectionHeading>
                <DrillCanonicalCompare
                  userClasses={userClasses}
                  canonical={canonical}
                />
              </section>
            )}
          </div>
        </div>

        <footer className="mt-8 border-t border-zinc-800/80 pt-6">
          <DrillFollowUpCard
            suggestions={
              pm && pm.followUps.length > 0 ? pm.followUps : DEFAULT_FOLLOW_UPS
            }
            onRetry={onStartNew}
            onLearnPattern={() => setLLDMode("learn")}
            onNextProblem={onBackToProblems}
          />
        </footer>
      </div>
    </div>
  );
}
