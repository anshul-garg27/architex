"use client";

/**
 * LLD Bottom Panels — explanation panels, generated code, tabbed container.
 * Split from LLDModule.tsx (LLD-037).
 */

import React, { memo, useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import { Code, Copy, Check, AlertTriangle } from "lucide-react";
import { BottomPanelEmptyState } from "@/components/shared/lld-empty-states";
import { cn } from "@/lib/utils";
import type { UMLClass, UMLRelationship, DesignPattern, SOLIDDemo, LLDProblem } from "@/lib/lld";
import { generateTypeScript, generatePython, generateMermaid } from "@/lib/lld";

// Lazy-load heavy tab components — only loaded when user clicks their tab
const PatternBehavioralSimulator = lazy(() => import("@/components/modules/lld/PatternBehavioralSimulator"));
const SequenceDiagramLatencyOverlay = lazy(() => import("@/components/modules/lld/SequenceDiagramLatencyOverlay"));
const PatternQuiz = lazy(() => import("./PatternQuiz").then(m => ({ default: m.PatternQuiz })));
const SOLIDQuiz = lazy(() => import("./SOLIDQuiz").then(m => ({ default: m.SOLIDQuiz })));
const ScenarioChallenge = lazy(() => import("./ScenarioChallenge").then(m => ({ default: m.ScenarioChallenge })));
const DailyChallenge = lazy(() => import("./DailyChallenge").then(m => ({ default: m.DailyChallenge })));
import { STEREOTYPE_BORDER_COLOR, PRINCIPLE_COLORS, DIFFICULTY_COLORS, smStateColor, type LLDBottomTab } from "../constants";

// ── Pattern Bottom Panel ─────────────────────────────────

export const LLDBottomPanel = memo(function LLDBottomPanel({
  pattern,
  classCount,
  relationshipCount,
}: {
  pattern: DesignPattern | null;
  classCount: number;
  relationshipCount: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Pattern Explanation
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {pattern ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                {pattern.category}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {pattern.name}
              </span>
              <span className="text-[11px] text-foreground-subtle">
                {classCount} classes, {relationshipCount} relationships
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground-muted">
              {pattern.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {pattern.classes.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-muted"
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: STEREOTYPE_BORDER_COLOR[c.stereotype] }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {pattern.relationships.map((r) => {
                const src = pattern.classes.find((c) => c.id === r.source);
                const tgt = pattern.classes.find((c) => c.id === r.target);
                if (!src || !tgt) return null;
                return (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-subtle"
                  >
                    {src.name}
                    <span className="text-foreground-muted">
                      {"\u2192"}
                    </span>
                    {tgt.name}
                    <span className="text-primary/60">({r.type})</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center py-6">
            <BottomPanelEmptyState />
          </div>
        )}
      </div>
    </div>
  );
});

// ── SOLID Bottom Panel ───────────────────────────────────

export const LLDSOLIDBottomPanel = memo(function LLDSOLIDBottomPanel({
  demo,
  solidView,
  classCount,
  relationshipCount,
}: {
  demo: SOLIDDemo;
  solidView: "before" | "after";
  classCount: number;
  relationshipCount: number;
}) {
  const principleColor = PRINCIPLE_COLORS[demo.principle];
  const currentClasses = solidView === "before" ? demo.beforeClasses : demo.afterClasses;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          SOLID: {demo.principle}
        </span>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{ color: principleColor, backgroundColor: `${principleColor}15` }}
        >
          {solidView === "before" ? "Before" : "After"}
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              {demo.name}
            </span>
            <span className="text-[11px] text-foreground-subtle">
              {classCount} classes, {relationshipCount} relationships
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {demo.explanation}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentClasses.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-muted"
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STEREOTYPE_BORDER_COLOR[c.stereotype] }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Problem Bottom Panel ─────────────────────────────────

export const LLDProblemBottomPanel = memo(function LLDProblemBottomPanel({
  problem,
  classCount,
  relationshipCount,
}: {
  problem: LLDProblem;
  classCount: number;
  relationshipCount: number;
}) {
  const diffColor = DIFFICULTY_COLORS[problem.difficulty];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          LLD Problem
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{ color: diffColor, backgroundColor: `${diffColor}15` }}
            >
              Level {problem.difficulty}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {problem.name}
            </span>
            <span className="text-[11px] text-foreground-subtle">
              {classCount} starter classes, {relationshipCount} relationships
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {problem.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {problem.starterClasses.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-muted"
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STEREOTYPE_BORDER_COLOR[c.stereotype] }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Sequence Bottom Panel ────────────────────────────────

export const SequenceBottomPanel = memo(function SequenceBottomPanel({
  example,
}: {
  example: { id: string; name: string; [key: string]: any } | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Sequence Diagram
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {example ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                sequence
              </span>
              <span className="text-sm font-semibold text-foreground">
                {example.name}
              </span>
              <span className="text-[11px] text-foreground-subtle">
                {example.data.participants.length} participants, {example.data.messages.length} messages
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground-muted">
              {example.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {example.data.participants.map((p: any) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-muted"
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: p.type === "actor" ? "var(--lld-stereo-interface)" : "var(--lld-canvas-border)" }}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-foreground-subtle">
            Load a sequence diagram to see its details here.
          </p>
        )}
      </div>
    </div>
  );
});

// ── State Machine Bottom Panel ───────────────────────────

export const StateMachineBottomPanel = memo(function StateMachineBottomPanel({
  example,
}: {
  example: { id: string; name: string; [key: string]: any } | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          State Machine
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {example ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                state machine
              </span>
              <span className="text-sm font-semibold text-foreground">
                {example.name}
              </span>
              <span className="text-[11px] text-foreground-subtle">
                {example.data.states.length} states, {example.data.transitions.length} transitions
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground-muted">
              {example.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {example.data.states.map((s: any) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-foreground-muted"
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: smStateColor(s) }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-foreground-subtle">
            Load a state machine to see its details here.
          </p>
        )}
      </div>
    </div>
  );
});

// ── Generated Code Panel ─────────────────────────────────

export const GeneratedCodePanel = memo(function GeneratedCodePanel({
  classes,
  relationships,
}: {
  classes: UMLClass[];
  relationships: UMLRelationship[];
}) {
  const [lang, setLang] = useState<"typescript" | "python" | "mermaid">("typescript");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const code = useMemo(() => {
    if (lang === "typescript") {
      return generateTypeScript(classes, relationships);
    }
    if (lang === "mermaid") {
      return generateMermaid(classes, relationships);
    }
    return generatePython(classes, relationships);
  }, [classes, relationships, lang]);

  const handleCopy = useCallback(() => {
    setCopyError(false);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopyError(true);
      copiedTimerRef.current = setTimeout(() => setCopyError(false), 3000);
    });
  }, [code]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Code className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Generated Code
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setLang("typescript")}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                lang === "typescript"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-subtle hover:text-foreground",
              )}
            >
              TypeScript
            </button>
            <button
              onClick={() => setLang("python")}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                lang === "python"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-subtle hover:text-foreground",
              )}
            >
              Python
            </button>
            <button
              onClick={() => setLang("mermaid")}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                lang === "mermaid"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-subtle hover:text-foreground",
              )}
            >
              Mermaid
            </button>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 rounded-xl border px-2 py-1 text-[10px] font-medium transition-colors",
              copyError
                ? "border-red-500/40 text-red-400"
                : "border-border/30 bg-elevated/50 text-foreground-subtle hover:bg-elevated hover:text-foreground",
            )}
          >
            {copyError ? (
              <>
                <AlertTriangle className="h-3 w-3 text-red-400" />
                Copy failed — use Ctrl+C
              </>
            ) : copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
        <pre className="text-[11px] leading-relaxed text-foreground-muted">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
});

// ── Bottom Panel Tabs ────────────────────────────────────

const LLD_BOTTOM_TABS: { id: LLDBottomTab; label: string }[] = [
  { id: "explanation", label: "Explanation" },
  { id: "behavioral-sim", label: "Behavioral Simulator" },
  { id: "sequence-latency", label: "Sequence Latency" },
  { id: "pattern-quiz", label: "Pattern Quiz" },
  { id: "solid-quiz", label: "SOLID Quiz" },
  { id: "scenario-challenge", label: "Scenario Challenge" },
  { id: "daily-challenge", label: "Daily Challenge" },
];

export const LLDBottomPanelTabs = memo(function LLDBottomPanelTabs({
  explanationPanel,
  codePanel,
}: {
  explanationPanel: React.ReactNode;
  codePanel: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<LLDBottomTab>("explanation");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-0">
        {LLD_BOTTOM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative border-b-2 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
              activeTab === tab.id
                ? "border-transparent text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-violet-400"
                : "border-transparent text-foreground-muted hover:text-foreground-subtle",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === "explanation" && (
          <div className="flex h-full">
            <div className={cn("h-full overflow-hidden", codePanel ? "w-1/2 border-r border-border/30" : "w-full")}>
              {explanationPanel}
            </div>
            {codePanel && (
              <div className="h-full w-1/2 overflow-hidden">
                {codePanel}
              </div>
            )}
          </div>
        )}
        <Suspense fallback={<div className="flex items-center justify-center py-8 text-xs text-foreground-subtle">Loading...</div>}>
          {activeTab === "behavioral-sim" && <PatternBehavioralSimulator />}
          {activeTab === "sequence-latency" && <SequenceDiagramLatencyOverlay />}
          {activeTab === "pattern-quiz" && <PatternQuiz />}
          {activeTab === "solid-quiz" && <SOLIDQuiz />}
          {activeTab === "scenario-challenge" && <ScenarioChallenge />}
          {activeTab === "daily-challenge" && <DailyChallenge />}
        </Suspense>
      </div>
    </div>
  );
});
