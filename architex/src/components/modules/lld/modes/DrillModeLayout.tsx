"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { DrillStageStepper } from "@/components/modules/lld/drill-mode/DrillStageStepper";
import { DrillTimer } from "@/components/modules/lld/drill-mode/DrillTimer";
import { DrillSubmitBar } from "@/components/modules/lld/drill-mode/DrillSubmitBar";
import { DrillHintLadder } from "@/components/modules/lld/drill-mode/DrillHintLadder";
import { DrillVariantPicker } from "@/components/modules/lld/drill-mode/DrillVariantPicker";
import { ClarifyStage } from "@/components/modules/lld/drill-mode/stages/ClarifyStage";
import { RubricStage } from "@/components/modules/lld/drill-mode/stages/RubricStage";
import { CanvasStage } from "@/components/modules/lld/drill-mode/stages/CanvasStage";
import { WalkthroughStage } from "@/components/modules/lld/drill-mode/stages/WalkthroughStage";
import { ReflectionStage } from "@/components/modules/lld/drill-mode/stages/ReflectionStage";
import { VARIANT_CONFIG, type DrillVariant } from "@/lib/lld/drill-variants";

function readProblemIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URL(window.location.href).searchParams.get("lld");
  if (!p) return null;
  const [kind, id] = p.split(":", 2);
  return kind === "problem" && id ? id : null;
}

function StartDrillPanel() {
  const beginAttempt = useDrillStore((s) => s.beginAttempt);
  const [variant, setVariant] = useState<DrillVariant>("timed-mock");
  const [problemId, setProblemId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<string | null>(null);

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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
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
      <DrillSubmitBar
        onSubmit={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}/grade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selfGrade: 3 }),
          });
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
          });
        }}
      />
    </div>
  );
});
