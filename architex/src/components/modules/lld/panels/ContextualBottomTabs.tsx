"use client";

/**
 * ContextualBottomTabs — context-aware bottom panel that shows the RIGHT tabs
 * based on the current LLD mode and selected item.
 *
 * Replaces the static LLDBottomPanelTabs which showed all 7 tabs regardless of context.
 */

import React, { memo, useState, useMemo, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import type { DesignPattern, SOLIDDemo, LLDProblem, UMLClass, UMLRelationship } from "@/lib/lld";

// Reuse existing panels
import {
  LLDBottomPanel,
  LLDSOLIDBottomPanel,
  LLDProblemBottomPanel,
  SequenceBottomPanel,
  StateMachineBottomPanel,
  GeneratedCodePanel,
} from "./LLDBottomPanels";

// Lazy-load heavy tab components
const PatternBehavioralSimulator = lazy(() => import("@/components/modules/lld/PatternBehavioralSimulator"));
const SequenceDiagramLatencyOverlay = lazy(() => import("@/components/modules/lld/SequenceDiagramLatencyOverlay"));
const ScenarioChallenge = lazy(() => import("./ScenarioChallenge").then(m => ({ default: m.ScenarioChallenge })));
const DailyChallenge = lazy(() => import("./DailyChallenge").then(m => ({ default: m.DailyChallenge })));
const SOLIDQuiz = lazy(() => import("./SOLIDQuiz").then(m => ({ default: m.SOLIDQuiz })));
const PatternQuiz = lazy(() => import("./PatternQuiz").then(m => ({ default: m.PatternQuiz })));
const ConfusedWithTab = lazy(() => import("./ConfusedWithTab").then(m => ({ default: m.ConfusedWithTab })));
const InterviewPrepTab = lazy(() => import("./InterviewPrepTab").then(m => ({ default: m.InterviewPrepTab })));
const PatternQuizFiltered = lazy(() => import("./PatternQuizFiltered").then(m => ({ default: m.PatternQuizFiltered })));

// ── Types ───────────────────────────────────────────────────

type LLDMode = "pattern" | "solid" | "problem" | "sequence" | "state-machine" | "none";

interface TabDef {
  id: string;
  label: string;
}

// ── Resilience pattern IDs that get the Simulate tab ────────

const RESILIENCE_SIM_IDS = new Set(["circuit-breaker", "bulkhead", "retry", "rate-limiter"]);

// ── Tab configs per mode ────────────────────────────────────

function getPatternTabs(pattern: DesignPattern): TabDef[] {
  const tabs: TabDef[] = [
    { id: "explain", label: "Explain + Code" },
    { id: "quiz", label: `Quiz: ${pattern.name}` },
    { id: "confused", label: "Confused With" },
    { id: "scenario", label: "Scenario" },
    { id: "interview", label: "Interview" },
    { id: "challenge", label: "Challenge" },
  ];
  if (RESILIENCE_SIM_IDS.has(pattern.id)) {
    tabs.push({ id: "simulate", label: "Simulate" });
  }
  return tabs;
}

function getSolidTabs(demo: SOLIDDemo): TabDef[] {
  return [
    { id: "before-after", label: "Before / After" },
    { id: "quiz", label: `Quiz: ${demo.principle}` },
    { id: "violation", label: "Spot Violation" },
    { id: "patterns", label: "Fix With Pattern" },
  ];
}

function getProblemTabs(_problem: LLDProblem): TabDef[] {
  return [
    { id: "requirements", label: "Requirements" },
    { id: "patterns", label: "Patterns Used" },
    { id: "solution", label: "Reference Solution" },
    { id: "interview", label: "Interview Mode" },
  ];
}

const SEQUENCE_TABS: TabDef[] = [
  { id: "explain", label: "Explanation" },
  { id: "sequence-latency", label: "Sequence Latency" },
];

const STATE_MACHINE_TABS: TabDef[] = [
  { id: "explain", label: "Explanation" },
  { id: "behavioral-sim", label: "Behavioral Simulator" },
];

const NONE_TABS: TabDef[] = [
  { id: "explain", label: "Explanation" },
];

// ── Props ───────────────────────────────────────────────────

interface ContextualBottomTabsProps {
  activePattern: DesignPattern | null;
  activeDemo: SOLIDDemo | null;
  activeProblem: LLDProblem | null;
  activeSequence: { id: string; name: string; [key: string]: any } | null;
  activeStateMachine: { id: string; name: string; [key: string]: any } | null;
  classes: UMLClass[];
  relationships: UMLRelationship[];
  solidView: "before" | "after";
  isPracticeSubmitted: boolean;
  practiceAssessment: React.ReactNode | null;
  onLoadPattern: (pattern: DesignPattern) => void;
}

// ── Component ───────────────────────────────────────────────

export const ContextualBottomTabs = memo(function ContextualBottomTabs({
  activePattern,
  activeDemo,
  activeProblem,
  activeSequence,
  activeStateMachine,
  classes,
  relationships,
  solidView,
  isPracticeSubmitted,
  practiceAssessment,
  onLoadPattern,
}: ContextualBottomTabsProps) {
  const [activeTabId, setActiveTabId] = useState<string>("explain");

  // Determine current mode
  const mode: LLDMode = useMemo(() => {
    if (activeStateMachine) return "state-machine";
    if (activeSequence) return "sequence";
    if (activeDemo) return "solid";
    if (activeProblem) return "problem";
    if (activePattern) return "pattern";
    return "none";
  }, [activePattern, activeDemo, activeProblem, activeSequence, activeStateMachine]);

  // Get tabs for current mode
  const tabs: TabDef[] = useMemo(() => {
    switch (mode) {
      case "pattern": return getPatternTabs(activePattern!);
      case "solid": return getSolidTabs(activeDemo!);
      case "problem": return getProblemTabs(activeProblem!);
      case "sequence": return SEQUENCE_TABS;
      case "state-machine": return STATE_MACHINE_TABS;
      case "none": return NONE_TABS;
    }
  }, [mode, activePattern, activeDemo, activeProblem]);

  // Reset to first tab when mode or item changes
  const modeKey = useMemo(() => {
    if (activePattern) return `pattern:${activePattern.id}`;
    if (activeDemo) return `solid:${activeDemo.id}`;
    if (activeProblem) return `problem:${activeProblem.id}`;
    if (activeSequence) return `sequence:${activeSequence.id}`;
    if (activeStateMachine) return `state-machine:${activeStateMachine.id}`;
    return "none";
  }, [activePattern, activeDemo, activeProblem, activeSequence, activeStateMachine]);

  // Reset active tab when selection changes
  React.useEffect(() => {
    setActiveTabId(tabs[0]?.id ?? "explain");
  }, [modeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure activeTabId is valid for current tabs
  const resolvedTabId = tabs.some((t) => t.id === activeTabId) ? activeTabId : tabs[0]?.id ?? "explain";

  // ── Practice assessment override ──────────────────────────
  if (isPracticeSubmitted && practiceAssessment) {
    return <div className="flex h-full flex-col">{practiceAssessment}</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "relative shrink-0 border-b-2 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap",
              resolvedTabId === tab.id
                ? "border-transparent text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-violet-400"
                : "border-transparent text-foreground-muted hover:text-foreground-subtle",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center py-8 text-xs text-foreground-subtle">Loading...</div>}>
          {/* ── Pattern mode ──────────────────────────── */}
          {mode === "pattern" && activePattern && (
            <>
              {resolvedTabId === "explain" && (
                <div className="flex h-full">
                  <div className={cn("h-full overflow-hidden", classes.length > 0 ? "w-1/2 border-r border-border/30" : "w-full")}>
                    <LLDBottomPanel pattern={activePattern} classCount={classes.length} relationshipCount={relationships.length} />
                  </div>
                  {classes.length > 0 && (
                    <div className="h-full w-1/2 overflow-hidden">
                      <GeneratedCodePanel classes={classes} relationships={relationships} />
                    </div>
                  )}
                </div>
              )}
              {resolvedTabId === "quiz" && <PatternQuizFiltered pattern={activePattern} />}
              {resolvedTabId === "confused" && <ConfusedWithTab pattern={activePattern} onLoadPattern={onLoadPattern} />}
              {resolvedTabId === "scenario" && <ScenarioChallenge />}
              {resolvedTabId === "interview" && <InterviewPrepTab pattern={activePattern} />}
              {resolvedTabId === "challenge" && <DailyChallenge />}
              {resolvedTabId === "simulate" && <PatternBehavioralSimulator />}
            </>
          )}

          {/* ── SOLID mode ────────────────────────────── */}
          {mode === "solid" && activeDemo && (
            <>
              {resolvedTabId === "before-after" && (
                <div className="flex h-full">
                  <div className={cn("h-full overflow-hidden", classes.length > 0 ? "w-1/2 border-r border-border/30" : "w-full")}>
                    <LLDSOLIDBottomPanel demo={activeDemo} solidView={solidView} classCount={classes.length} relationshipCount={relationships.length} />
                  </div>
                  {classes.length > 0 && (
                    <div className="h-full w-1/2 overflow-hidden">
                      <GeneratedCodePanel classes={classes} relationships={relationships} />
                    </div>
                  )}
                </div>
              )}
              {resolvedTabId === "quiz" && <SOLIDQuiz />}
              {resolvedTabId === "violation" && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-xs text-foreground-subtle">Spot Violation exercises coming soon.</p>
                </div>
              )}
              {resolvedTabId === "patterns" && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-xs text-foreground-subtle">Fix With Pattern exercises coming soon.</p>
                </div>
              )}
            </>
          )}

          {/* ── Problem mode ──────────────────────────── */}
          {mode === "problem" && activeProblem && (
            <>
              {resolvedTabId === "requirements" && (
                <div className="flex h-full">
                  <div className={cn("h-full overflow-hidden", classes.length > 0 ? "w-1/2 border-r border-border/30" : "w-full")}>
                    <LLDProblemBottomPanel problem={activeProblem} classCount={classes.length} relationshipCount={relationships.length} />
                  </div>
                  {classes.length > 0 && (
                    <div className="h-full w-1/2 overflow-hidden">
                      <GeneratedCodePanel classes={classes} relationships={relationships} />
                    </div>
                  )}
                </div>
              )}
              {resolvedTabId === "patterns" && (
                <div className="flex h-full flex-col px-4 py-3 space-y-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">Key Patterns</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeProblem.keyPatterns.map((p) => (
                      <span key={p} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resolvedTabId === "solution" && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-xs text-foreground-subtle">Reference solution will be available after you submit your attempt.</p>
                </div>
              )}
              {resolvedTabId === "interview" && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-xs text-foreground-subtle">Interview mode coming soon.</p>
                </div>
              )}
            </>
          )}

          {/* ── Sequence mode ─────────────────────────── */}
          {mode === "sequence" && (
            <>
              {resolvedTabId === "explain" && <SequenceBottomPanel example={activeSequence} />}
              {resolvedTabId === "sequence-latency" && <SequenceDiagramLatencyOverlay />}
            </>
          )}

          {/* ── State Machine mode ────────────────────── */}
          {mode === "state-machine" && (
            <>
              {resolvedTabId === "explain" && <StateMachineBottomPanel example={activeStateMachine} />}
              {resolvedTabId === "behavioral-sim" && <PatternBehavioralSimulator />}
            </>
          )}

          {/* ── No selection ──────────────────────────── */}
          {mode === "none" && (
            <div className="flex h-full">
              <div className="w-full">
                <LLDBottomPanel pattern={null} classCount={classes.length} relationshipCount={relationships.length} />
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
});
