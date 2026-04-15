"use client";

/**
 * ContextualBottomTabs — context-aware bottom panel that shows the RIGHT tabs
 * based on the current LLD mode and selected item.
 *
 * Replaces the static LLDBottomPanelTabs which showed all 7 tabs regardless of context.
 */

import React, { memo, useState, useMemo, useEffect, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import type { DesignPattern, SOLIDDemo, LLDProblem, UMLClass, UMLRelationship } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";

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
const WalkthroughPlayer = lazy(() => import("./WalkthroughPlayer").then(m => ({ default: m.WalkthroughPlayer })));
const AutoGrader = lazy(() => import("./AutoGrader").then(m => ({ default: m.AutoGrader })));
const MermaidEditor = lazy(() => import("./MermaidEditor"));
const SOLIDViolationSpotter = lazy(() => import("./SOLIDViolationSpotter"));

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
    { id: "dsl-editor", label: "DSL Editor" },
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
    { id: "grade", label: "Grade" },
    { id: "solution", label: "Reference Solution" },
    { id: "related", label: "Related Problems" },
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
  onSelectProblem?: (problem: LLDProblem) => void;
  onDiagramUpdate?: (classes: UMLClass[], relationships: UMLRelationship[]) => void;
}

// ── Visited-patterns localStorage helper ───────────────────

const VISITED_KEY = "lld-visited-patterns";

function getVisitedPatterns(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markPatternVisited(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const visited = getVisitedPatterns();
    visited.add(slug);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
  } catch {
    // Silently ignore storage errors
  }
}

// ── Difficulty badge helpers ───────────────────────────────

const DIFFICULTY_BADGE: Record<string, { label: string; className: string }> = {
  easy: { label: "Easy", className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
  medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  hard: { label: "Hard", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
};

function getDifficultyBadge(difficulty: number): { label: string; className: string } {
  if (difficulty <= 2) return DIFFICULTY_BADGE.easy;
  if (difficulty <= 3) return DIFFICULTY_BADGE.medium;
  return DIFFICULTY_BADGE.hard;
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
  onSelectProblem,
  onDiagramUpdate,
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

  // Smart tab defaulting: first visit = Explain, return visit = Quiz
  useEffect(() => {
    // Determine slug for visit tracking (patterns and problems have slugs)
    const slug = activePattern?.id ?? activeProblem?.slug ?? null;

    if (slug && (mode === "pattern" || mode === "problem")) {
      const visited = getVisitedPatterns();
      if (visited.has(slug)) {
        // Return visit: default to Quiz tab (index 1)
        setActiveTabId(tabs[1]?.id ?? tabs[0]?.id ?? "explain");
      } else {
        // First visit: default to first tab, mark as visited
        markPatternVisited(slug);
        setActiveTabId(tabs[0]?.id ?? "explain");
      }
    } else {
      // Non-pattern/problem modes: always default to first tab
      setActiveTabId(tabs[0]?.id ?? "explain");
    }
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
                <div className="flex h-full flex-col">
                  <WalkthroughPlayer pattern={activePattern} />
                  <div className="flex flex-1 min-h-0">
                    <div className={cn("h-full overflow-hidden", classes.length > 0 ? "w-1/2 border-r border-border/30" : "w-full")}>
                      <LLDBottomPanel pattern={activePattern} classCount={classes.length} relationshipCount={relationships.length} />
                    </div>
                    {classes.length > 0 && (
                      <div className="h-full w-1/2 overflow-hidden">
                        <GeneratedCodePanel classes={classes} relationships={relationships} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {resolvedTabId === "quiz" && <PatternQuizFiltered pattern={activePattern} />}
              {resolvedTabId === "confused" && <ConfusedWithTab pattern={activePattern} onLoadPattern={onLoadPattern} />}
              {resolvedTabId === "scenario" && <ScenarioChallenge />}
              {resolvedTabId === "interview" && <InterviewPrepTab pattern={activePattern} />}
              {resolvedTabId === "challenge" && <DailyChallenge />}
              {resolvedTabId === "simulate" && <PatternBehavioralSimulator />}
              {resolvedTabId === "dsl-editor" && onDiagramUpdate && (
                <MermaidEditor classes={classes} relationships={relationships} onDiagramUpdate={onDiagramUpdate} />
              )}
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
                <SOLIDViolationSpotter principle={activeDemo.principle} />
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
              {resolvedTabId === "grade" && activeProblem && (
                <AutoGrader
                  problem={activeProblem}
                  userClasses={classes}
                  userRelationships={relationships}
                  referenceClasses={activeProblem.starterClasses}
                  referenceRelationships={activeProblem.starterRelationships}
                />
              )}
              {resolvedTabId === "solution" && (
                <div className="flex-1 overflow-auto px-4 py-3">
                  {activeProblem?.referenceSolution ? (
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground-muted font-mono">{activeProblem.referenceSolution}</pre>
                  ) : (
                    <p className="text-xs text-foreground-subtle">Reference solution will be available after you submit your attempt.</p>
                  )}
                </div>
              )}
              {resolvedTabId === "related" && (
                <RelatedProblemsPanel problem={activeProblem} onSelectProblem={onSelectProblem} />
              )}
              {resolvedTabId === "interview" && (
                <div className="flex-1 overflow-auto px-4 py-3">
                  {activeProblem?.interviewScript ? (
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground-muted">{activeProblem.interviewScript}</pre>
                  ) : activeProblem?.designWalkthrough ? (
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground-muted">{activeProblem.designWalkthrough}</pre>
                  ) : (
                    <p className="text-xs text-foreground-subtle">Interview mode coming soon.</p>
                  )}
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

// ── Related Problems Sub-Panel ─────────────────────────────

function RelatedProblemsPanel({
  problem,
  onSelectProblem,
}: {
  problem: LLDProblem;
  onSelectProblem?: (problem: LLDProblem) => void;
}) {
  const { problems: allProblems } = useLLDDataContext();

  const relatedItems = useMemo(() => {
    if (!problem.relatedProblems?.length || !allProblems.length) return [];
    return problem.relatedProblems
      .map((slug) => allProblems.find((p) => p.slug === slug))
      .filter((p): p is LLDProblem => p != null);
  }, [problem.relatedProblems, allProblems]);

  if (relatedItems.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">No related problems found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4 py-3 space-y-3 overflow-auto">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
        Related Problems
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {relatedItems.map((rp) => {
          const badge = getDifficultyBadge(rp.difficulty);
          return (
            <button
              key={rp.id}
              onClick={() => onSelectProblem?.(rp)}
              className="flex flex-col gap-2 rounded-xl border border-border/30 bg-elevated/50 px-3.5 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.08)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate">
                  {rp.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              </div>
              {rp.keyPatterns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rp.keyPatterns.slice(0, 4).map((pat) => (
                    <span
                      key={pat}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary"
                    >
                      {pat}
                    </span>
                  ))}
                  {rp.keyPatterns.length > 4 && (
                    <span className="text-[9px] text-foreground-subtle">
                      +{rp.keyPatterns.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
