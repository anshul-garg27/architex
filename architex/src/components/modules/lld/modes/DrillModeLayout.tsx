"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { useLLDDrillSync } from "@/hooks/useLLDDrillSync";
import { DrillStageStepper } from "@/components/modules/lld/drill-mode/DrillStageStepper";
import { DrillTimer } from "@/components/modules/lld/drill-mode/DrillTimer";
import { DrillSubmitBar } from "@/components/modules/lld/drill-mode/DrillSubmitBar";
import { DrillHintLadder } from "@/components/modules/lld/drill-mode/DrillHintLadder";
import { DrillVariantPicker } from "@/components/modules/lld/drill-mode/DrillVariantPicker";
import { DrillResultsScreen } from "@/components/modules/lld/drill-mode/DrillResultsScreen";
import { DrillResumePrompt } from "@/components/modules/lld/drill-mode/DrillResumePrompt";
import { ClarifyStage } from "@/components/modules/lld/drill-mode/stages/ClarifyStage";
import { RubricStage } from "@/components/modules/lld/drill-mode/stages/RubricStage";
import { CanvasStage } from "@/components/modules/lld/drill-mode/stages/CanvasStage";
import { WalkthroughStage } from "@/components/modules/lld/drill-mode/stages/WalkthroughStage";
import { ReflectionStage } from "@/components/modules/lld/drill-mode/stages/ReflectionStage";
import { VARIANT_CONFIG, type DrillVariant } from "@/lib/lld/drill-variants";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { RubricBreakdown } from "@/lib/lld/drill-rubric";

function readProblemIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URL(window.location.href).searchParams.get("lld");
  if (!p) return null;
  const [kind, id] = p.split(":", 2);
  return kind === "problem" && id ? id : null;
}

/** Drop the `?lld=problem:<id>` selection so the problem list shows. */
function clearProblemSelection(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("lld");
  window.history.replaceState(null, "", url.toString());
}

interface ActiveDrillRow {
  id: string;
  problemId: string;
  variant: DrillVariant;
  currentStage: DrillStage;
  startedAt: string;
  durationLimitMs: number;
}

function StartDrillPanel() {
  const beginAttempt = useDrillStore((s) => s.beginAttempt);
  const enterStage = useDrillStore((s) => s.enterStage);
  const [variant, setVariant] = useState<DrillVariant>("timed-mock");
  const [problemId, setProblemId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<string | null>(null);
  const [resumable, setResumable] = useState<ActiveDrillRow | null>(null);

  // DrillResumePrompt wiring: when nothing is in the store, check the
  // server for an in-flight attempt (e.g. after a tab reload).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lld/drill-attempts/active");
        if (!res.ok) return;
        const { active } = (await res.json()) as {
          active: ActiveDrillRow | null;
        };
        if (!cancelled && active) setResumable(active);
      } catch {
        // Non-fatal — the user can still start a fresh drill.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProblemId(readProblemIdFromUrl());
    const onPop = () => setProblemId(readProblemIdFromUrl());
    window.addEventListener("popstate", onPop);
    // Reflect URL changes triggered by react-router replaceState calls.
    const id = window.setInterval(
      () => setProblemId(readProblemIdFromUrl()),
      500,
    );
    return () => {
      window.removeEventListener("popstate", onPop);
      window.clearInterval(id);
    };
  }, []);

  async function onStart() {
    if (!problemId) return;
    setStarting(true);
    setError(null);
    setActiveConflict(null);
    try {
      const res = await fetch("/api/lld/drill-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          variant,
          durationLimitMs: VARIANT_CONFIG[variant].defaultDurationMs,
        }),
      });
      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setActiveConflict(
          data.error ?? "A drill is already active. Abandon it to start fresh.",
        );
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { attempt } = (await res.json()) as { attempt: { id: string } };
      beginAttempt({
        attemptId: attempt.id,
        variant,
        persona: "generic",
        problemId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  async function onResume() {
    if (!resumable) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/lld/drill-attempts/${resumable.id}/resume`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { attempt } = (await res.json()) as {
        attempt: {
          id: string;
          problemId: string;
          variant: DrillVariant;
          currentStage: DrillStage;
        };
      };
      beginAttempt({
        attemptId: attempt.id,
        variant: attempt.variant,
        persona: "generic",
        problemId: attempt.problemId,
      });
      if (attempt.currentStage !== "clarify") {
        enterStage(attempt.currentStage);
      }
    } catch (err) {
      // Drop back to the start panel with the failure visible.
      setResumable(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  async function onAbandonResumable() {
    if (!resumable) return;
    try {
      await fetch(`/api/lld/drill-attempts/${resumable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" }),
      });
    } finally {
      setResumable(null);
    }
  }

  async function onAbandonActive() {
    setStarting(true);
    try {
      // Look up the active drill id, then PATCH abandon.
      const res = await fetch("/api/lld/drill-attempts/active");
      if (res.ok) {
        const { active } = (await res.json()) as {
          active: { id: string } | null;
        };
        if (active?.id) {
          await fetch(`/api/lld/drill-attempts/${active.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abandon" }),
          });
        }
      }
      setActiveConflict(null);
      // Retry start.
      await onStart();
    } finally {
      setStarting(false);
    }
  }

  if (resumable) {
    const elapsedMs =
      Date.now() - new Date(resumable.startedAt).getTime();
    const remainingMinutes = Math.max(
      0,
      Math.round((resumable.durationLimitMs - elapsedMs) / 60_000),
    );
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <DrillResumePrompt
          problemTitle={resumable.problemId}
          remainingMinutes={remainingMinutes}
          onResume={() => void onResume()}
          onAbandon={() => void onAbandonResumable()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h2 className="text-xl font-semibold text-foreground">
          Start a drill
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          5 stages · 6-axis rubric · streaming interviewer persona.
        </p>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Problem
          </div>
          <div className="mt-1 text-sm">
            {problemId ? (
              <code className="rounded bg-zinc-900 px-2 py-1 text-zinc-200">
                {problemId}
              </code>
            ) : (
              <span className="text-amber-400">
                Select a problem in the left sidebar to continue.
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
            Variant
          </div>
          <DrillVariantPicker current={variant} onSelect={setVariant} />
        </div>

        {error ? (
          <div className="mt-4 rounded border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {activeConflict ? (
          <div className="mt-4 rounded border border-amber-500/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
            <div>{activeConflict}</div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={onAbandonActive}
                disabled={starting}
                className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                Abandon &amp; start new
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onStart}
            disabled={!problemId || starting}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-violet-500"
          >
            {starting ? "Starting…" : "Start drill"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const DrillModeLayout = memo(function DrillModeLayout() {
  const currentStage = useDrillStore((s) => s.currentStage);
  const attemptId = useDrillStore((s) => s.attemptId);
  const rubricBreakdown = useDrillStore((s) => s.rubricBreakdown);
  const finalScore = useDrillStore((s) => s.finalScore);
  const setRubric = useDrillStore((s) => s.setRubric);
  const reset = useDrillStore((s) => s.reset);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  // Heartbeat keeps last_activity_at fresh so the server's 30-min
  // stale-drill sweep doesn't abandon an attempt mid-canvas-work.
  // (It self-stops once rubricBreakdown is set post-grade.)
  useLLDDrillSync();

  async function submitForGrade() {
    if (!attemptId || grading) return;
    setGrading(true);
    setGradeError(null);
    try {
      // Use the self-grade picked in the reflection stage; 3 only if unset.
      const selfGrade =
        useDrillStore.getState().stageProgress.reflection?.selfGrade ?? 3;
      const res = await fetch(`/api/lld/drill-attempts/${attemptId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfGrade }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      // Both fresh grades and the idempotent already-graded branch
      // return { rubric, finalScore, band }.
      const data = (await res.json()) as {
        rubric: RubricBreakdown | null;
        finalScore: number | null;
      };
      if (!data.rubric || typeof data.finalScore !== "number") {
        throw new Error("Grade response was missing the rubric");
      }
      setRubric(data.rubric, data.finalScore);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : String(err));
    } finally {
      setGrading(false);
    }
  }

  const stageScreen = useMemo(() => {
    switch (currentStage) {
      case "clarify":
        return attemptId ? <ClarifyStage attemptId={attemptId} /> : null;
      case "rubric":
        return <RubricStage />;
      case "canvas":
        return <CanvasStage />;
      case "walkthrough":
        return <WalkthroughStage />;
      case "reflection":
        return <ReflectionStage />;
    }
  }, [currentStage, attemptId]);

  if (!attemptId) {
    return <StartDrillPanel />;
  }

  // Graded → swap the stage layout for the results screen.
  if (rubricBreakdown !== null && finalScore !== null) {
    return (
      <DrillResultsScreen
        attemptId={attemptId}
        onStartNew={() => reset()}
        onBackToProblems={() => {
          clearProblemSelection();
          reset();
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/40">
        <DrillStageStepper currentStage={currentStage} />
        <div className="px-4">
          <DrillTimer />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <main className="min-w-0 flex-1">{stageScreen}</main>
        <aside className="w-64 border-l border-zinc-800 bg-zinc-950/30 p-3">
          <DrillHintLadder attemptId={attemptId} />
        </aside>
      </div>
      {gradeError ? (
        <div className="border-t border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-200">
          Grading failed: {gradeError} — try submitting again.
        </div>
      ) : null}
      {grading ? (
        <div className="border-t border-violet-500/30 bg-violet-950/20 px-4 py-2 text-sm text-violet-200">
          Grading your drill…
        </div>
      ) : null}
      <DrillSubmitBar
        onSubmit={() => {
          void submitForGrade();
        }}
        onPause={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause" }),
          });
        }}
        onAbandon={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abandon" }),
          }).finally(() => reset());
        }}
      />
    </div>
  );
});
