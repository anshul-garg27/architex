"use client";

import React, { memo, useMemo, useState } from "react";
import {
  BarChart3,
  Columns2,
  Eye,
  Code2,
  Star,
  ChevronDown,
  ChevronRight,
  Activity,
  Variable,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComparisonState } from "@/components/canvas/panels/AlgorithmPanel";
import type {
  AnimationStep,
  AlgorithmConfig,
  AlgorithmResult,
} from "@/lib/algorithms";
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
} from "@/lib/algorithms";

// Static combined array
const ALL_ALGORITHMS: AlgorithmConfig[] = [
  ...SORTING_ALGORITHMS, ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS, ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
];

// ── Complexity Chart Component ──────────────────────────────

const CHART_SIZES = [10, 20, 50, 100] as const;
const BAR_COLORS = { theoretical: '#3b82f6', actual: '#f59e0b' };

/** Compute theoretical comparison counts for sorting at scale. */
function theoreticalComparisons(algoId: string, n: number): number {
  switch (algoId) {
    case 'bubble-sort':
    case 'selection-sort':
      return (n * (n - 1)) / 2;
    case 'insertion-sort':
      return (n * (n - 1)) / 4;
    case 'merge-sort':
      return n > 1 ? n * Math.ceil(Math.log2(n)) : 0;
    case 'quick-sort':
      return n > 1 ? Math.round(2 * n * Math.log(n)) : 0;
    case 'heap-sort':
      return n > 1 ? Math.round(2 * n * Math.log2(n)) : 0;
    default:
      return 0;
  }
}

/** Get actual comparisons from the last step of an algorithm result. */
function actualComparisons(result: AlgorithmResult): number {
  const steps = result.steps;
  if (steps.length === 0) return 0;
  return steps[steps.length - 1].complexity.comparisons;
}

// ── ALG-332: Extract variables from step description ───────
function extractVariables(step: AnimationStep, category: string): Record<string, string> {
  const vars: Record<string, string> = {};

  const compareMatch = step.description.match(/Compare.*?(\w+)\[(\d+)\]=(\d+).*?(\w+)\[(\d+)\]=(\d+)/);
  if (compareMatch) {
    vars['Comparing'] = `arr[${compareMatch[2]}]=${compareMatch[3]} vs arr[${compareMatch[5]}]=${compareMatch[6]}`;
  }

  const swapMatch = step.description.match(/[Ss]wap.*?(\d+).*?(\d+)/);
  if (swapMatch && !compareMatch) {
    vars['Swapping'] = `${swapMatch[1]} <-> ${swapMatch[2]}`;
  }

  const pivotMatch = step.description.match(/[Pp]ivot[=: ]+(\d+)/);
  if (pivotMatch) {
    vars['Pivot'] = pivotMatch[1];
  }

  const distMatch = step.description.match(/dist\[(\w+)\]\s*=\s*(\d+)/);
  if (distMatch) {
    vars['Distance'] = `${distMatch[1]} = ${distMatch[2]}`;
  }

  const visitMatch = step.description.match(/(?:Visit|Extract|Dequeue|Process)\s+(?:node\s+)?(\w+)/i);
  if (visitMatch) {
    vars['Current Node'] = visitMatch[1];
  }

  if (step.milestone) {
    vars['Milestone'] = step.milestone;
  }

  return vars;
}

const ComplexityComparisonChart = memo(function ComplexityComparisonChart({
  algoId,
  result,
}: {
  algoId: string;
  result: AlgorithmResult;
}) {
  const isSorting = result.config.category === 'sorting';
  if (!isSorting) return null;

  const measuredN = result.finalState.length;
  const measuredComps = actualComparisons(result);

  const dataPoints = useMemo(() => {
    const pts: Array<{ n: number; theoretical: number; actual: number | null }> = CHART_SIZES.map((n) => ({
      n,
      theoretical: theoreticalComparisons(algoId, n),
      actual: null,
    }));

    const matchIdx = pts.findIndex((p) => p.n === measuredN);
    if (matchIdx >= 0) {
      pts[matchIdx].actual = measuredComps;
    } else {
      pts.push({
        n: measuredN,
        theoretical: theoreticalComparisons(algoId, measuredN),
        actual: measuredComps,
      });
      pts.sort((a, b) => a.n - b.n);
    }

    return pts;
  }, [algoId, measuredN, measuredComps]);

  const maxVal = Math.max(
    ...dataPoints.map((d) => Math.max(d.theoretical, d.actual ?? 0)),
    1,
  );

  return (
    <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <BarChart3 className="h-3 w-3 text-foreground-subtle" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Comparisons at Scale
        </span>
      </div>

      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {dataPoints.map((dp) => {
          const theoH = Math.max((dp.theoretical / maxVal) * 70, 2);
          const actH = dp.actual !== null ? Math.max((dp.actual / maxVal) * 70, 2) : 0;

          return (
            <div key={dp.n} className="flex flex-1 flex-col items-center gap-0.5">
              <div className="flex items-end gap-px" style={{ height: 70 }}>
                <div
                  className="w-2 rounded-t-sm"
                  style={{ height: theoH, backgroundColor: BAR_COLORS.theoretical }}
                  title={`Theoretical: ${dp.theoretical}`}
                />
                {dp.actual !== null && (
                  <div
                    className="w-2 rounded-t-sm"
                    style={{ height: actH, backgroundColor: BAR_COLORS.actual }}
                    title={`Actual: ${dp.actual}`}
                  />
                )}
              </div>
              <span className="text-[8px] font-mono text-foreground-subtle">
                n={dp.n}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center gap-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.theoretical }} />
          <span className="text-[8px] text-foreground-subtle">Theoretical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.actual }} />
          <span className="text-[8px] text-foreground-subtle">Measured</span>
        </div>
      </div>
    </div>
  );
});

// ── Properties Panel ────────────────────────────────────────

export interface AlgorithmPropertiesProps {
  step: AnimationStep | null;
  stepIndex: number;
  selectedAlgoId: string;
  result: AlgorithmResult | null;
  comparison: ComparisonState;
  recentAlgos: Array<{id: string; name: string; timestamp: number}>;
  mastery: Record<string, number>;
}

export const AlgorithmProperties = memo(function AlgorithmProperties({
  step,
  stepIndex,
  selectedAlgoId,
  result,
  comparison,
  recentAlgos,
  mastery,
}: AlgorithmPropertiesProps) {
  const allAlgorithms = ALL_ALGORITHMS;
  const config = allAlgorithms.find((a) => a.id === selectedAlgoId) ??
    SORTING_ALGORITHMS[0];

  const compConfig = comparison.enabled
    ? allAlgorithms.find((a) => a.id === comparison.comparisonAlgoId) ?? null
    : null;

  const isLive = step !== null && result !== null;
  const [showStaticInfo, setShowStaticInfo] = useState(false);

  // Extract live variables from the current step
  const liveVars = useMemo(() => {
    if (!step) return {};
    return extractVariables(step, config.category);
  }, [step, config.category]);

  // Calculate theoretical worst-case for the current array size
  const arraySize = result?.finalState.length ?? 0;
  const worstCaseOps = useMemo(
    () => theoreticalComparisons(selectedAlgoId, arraySize),
    [selectedAlgoId, arraySize],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Live Execution Trace
              </span>
            </span>
          ) : (
            "Algorithm Info"
          )}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── LIVE MODE ─────────────────────────────────────── */}
        {isLive && step && (
          <>
            {/* Step description banner */}
            <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Step {stepIndex + 1}{result.steps.length > 0 ? ` / ${result.steps.length}` : ''}
                </span>
              </div>
              <p className="font-mono text-xs text-foreground">
                {step.description}
              </p>
            </div>

            {/* Pseudocode with active line arrow */}
            <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Code2 className="h-3 w-3 text-foreground-subtle" />
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Pseudocode
                </span>
              </div>
              <div className="rounded-lg border border-border/20 bg-background/80 p-2">
                {config.pseudocode.map((line, i) => {
                  const isActive = step.pseudocodeLine === i;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "px-2 py-0.5 font-mono text-[11px] leading-relaxed transition-all duration-200",
                        isActive
                          ? "rounded bg-primary/20 text-primary font-medium"
                          : "text-foreground-muted",
                      )}
                    >
                      <span className={cn(
                        "mr-1.5 inline-block w-5 text-right",
                        isActive ? "text-primary" : "text-foreground-subtle opacity-50",
                      )}>
                        {isActive ? "\u2192" : `${i + 1}`}
                      </span>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live variables */}
            <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Variable className="h-3 w-3 text-foreground-subtle" />
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Variables
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(liveVars).map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground-subtle text-xs font-mono shrink-0">
                      {key}
                    </span>
                    <span className="text-foreground font-mono font-medium text-xs text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live complexity counters */}
            <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Gauge className="h-3 w-3 text-foreground-subtle" />
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Complexity
                </span>
              </div>
              {/* Live counters */}
              <div className="mb-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-background/80 border border-border/20 px-2.5 py-1.5 text-center">
                  <span className="block text-[9px] font-medium uppercase tracking-wider text-foreground-subtle">
                    Comparisons
                  </span>
                  <span className="block text-lg font-mono tabular-nums text-amber-500">
                    {step.complexity.comparisons}
                  </span>
                </div>
                <div className="rounded-lg bg-background/80 border border-border/20 px-2.5 py-1.5 text-center">
                  <span className="block text-[9px] font-medium uppercase tracking-wider text-foreground-subtle">
                    Swaps
                  </span>
                  <span className="block text-lg font-mono tabular-nums text-blue-500">
                    {step.complexity.swaps}
                  </span>
                </div>
              </div>
              {/* Theoretical reference */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div>
                  <span className="text-foreground-subtle">Best: </span>
                  <span className="font-mono text-green-500">
                    {config.timeComplexity.best}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-subtle">Current: </span>
                  <span className="font-mono text-amber-500">
                    {step.complexity.comparisons} cmp
                  </span>
                  {arraySize > 0 && (
                    <span className="text-foreground-subtle text-[10px]"> (n={arraySize})</span>
                  )}
                </div>
                <div>
                  <span className="text-foreground-subtle">Worst: </span>
                  <span className="font-mono text-red-500">
                    {config.timeComplexity.worst}
                  </span>
                  {worstCaseOps > 0 && (
                    <span className="text-foreground-subtle text-[10px]"> = {worstCaseOps}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison complexity side-by-side (keep live during playback) */}
            {comparison.enabled && compConfig && (
              <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Columns2 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                    vs {compConfig.name}
                  </span>
                </div>
                {comparison.comparisonResult && comparison.comparisonStep && (
                  <div className="grid grid-cols-2 gap-1 text-center">
                    <div className="rounded bg-background px-1 py-0.5">
                      <span className="block text-[9px] text-foreground-subtle">{config.name}</span>
                      <span className="block font-mono text-xs font-medium text-foreground">
                        {step.complexity.comparisons} cmp
                      </span>
                    </div>
                    <div className="rounded bg-background px-1 py-0.5">
                      <span className="block text-[9px] text-foreground-subtle">{compConfig.name}</span>
                      <span className="block font-mono text-xs font-medium text-foreground">
                        {comparison.comparisonStep.complexity.comparisons} cmp
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible static info toggle */}
            <button
              type="button"
              onClick={() => setShowStaticInfo((v) => !v)}
              className="mb-3 flex w-full items-center gap-1.5 rounded-lg border border-border/30 bg-elevated/30 px-3 py-2 text-left transition-colors hover:bg-elevated/60"
            >
              {showStaticInfo ? (
                <ChevronDown className="h-3 w-3 text-foreground-subtle" />
              ) : (
                <ChevronRight className="h-3 w-3 text-foreground-subtle" />
              )}
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Show Algorithm Info
              </span>
            </button>

            {showStaticInfo && (
              <StaticAlgorithmInfo
                config={config}
                selectedAlgoId={selectedAlgoId}
                mastery={mastery}
                comparison={comparison}
                compConfig={compConfig}
                result={result}
                recentAlgos={recentAlgos}
              />
            )}
          </>
        )}

        {/* ── STATIC MODE (no active step) ──────────────────── */}
        {!isLive && (
          <StaticAlgorithmInfo
            config={config}
            selectedAlgoId={selectedAlgoId}
            mastery={mastery}
            comparison={comparison}
            compConfig={compConfig}
            result={result}
            step={step}
            stepIndex={stepIndex}
            recentAlgos={recentAlgos}
          />
        )}
      </div>
    </div>
  );
});

// ── Static Info Sub-Component ──────────────────────────────
// Extracted so both live (collapsed) and static modes can share it.

interface StaticAlgorithmInfoProps {
  config: AlgorithmConfig;
  selectedAlgoId: string;
  mastery: Record<string, number>;
  comparison: ComparisonState;
  compConfig: AlgorithmConfig | null;
  result: AlgorithmResult | null;
  step?: AnimationStep | null;
  stepIndex?: number;
  recentAlgos: Array<{id: string; name: string; timestamp: number}>;
}

const StaticAlgorithmInfo = memo(function StaticAlgorithmInfo({
  config,
  selectedAlgoId,
  mastery,
  comparison,
  compConfig,
  result,
  step,
  stepIndex,
  recentAlgos,
}: StaticAlgorithmInfoProps) {
  return (
    <>
      {/* Algorithm name and description */}
      <div className="mb-3">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            {config.name}
          </h3>
          {/* ALG-178: Mastery stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5 transition-all",
                  (mastery[selectedAlgoId] || 0) >= i
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]"
                    : "text-foreground-subtle/30",
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-foreground-muted">{config.description}</p>
      </div>

      {config.prerequisites && config.prerequisites.length > 0 && (
        <div className="mb-3 text-xs text-foreground-subtle">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Learn First: </span>
          {config.prerequisites.map(id => {
            const prereq = ALL_ALGORITHMS.find(a => a.id === id);
            return prereq ? prereq.name : id;
          }).join(', ')}
        </div>
      )}

      {config.summary && config.summary.length > 0 && (
        <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Quick Summary</span>
          <ul className="mt-1 space-y-0.5">
            {config.summary.map((s, i) => (
              <li key={i} className="text-xs text-foreground-subtle">{i + 1}. {s}</li>
            ))}
          </ul>
        </div>
      )}

      {config.commonMistakes && config.commonMistakes.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Common Mistakes</span>
          <ul className="mt-1 space-y-1">
            {config.commonMistakes.map((m, i) => (
              <li key={i} className="text-xs text-foreground-muted">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {config.realWorldApps && config.realWorldApps.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Used In</span>
          <ul className="mt-1 space-y-0.5">
            {config.realWorldApps.map((app, i) => (
              <li key={i} className="text-xs text-foreground-subtle">{app}</li>
            ))}
          </ul>
        </div>
      )}
      {config.interviewTips && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Interview Tip</span>
          <p className="mt-1 text-xs text-foreground-muted">{config.interviewTips}</p>
        </div>
      )}
      {config.whenToUse && (
        <div className="mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">When to Use</span>
          <p className="mt-1 text-xs text-foreground-subtle">{config.whenToUse}</p>
        </div>
      )}
      {config.comparisonGuide && (
        <div className="mb-3 rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Comparison Guide</span>
          <p className="mt-1 text-xs text-foreground-muted">{config.comparisonGuide}</p>
        </div>
      )}
      {config.productionNote && (
        <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">In Production</span>
          <pre className="mt-1 whitespace-pre-wrap text-xs font-mono text-foreground-muted">{config.productionNote}</pre>
        </div>
      )}

      {/* Complexity */}
      <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-foreground-subtle" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Complexity
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div>
            <span className="text-foreground-subtle">Best: </span>
            <span className="font-mono text-green-500">
              {config.timeComplexity.best}
            </span>
          </div>
          <div>
            <span className="text-foreground-subtle">Avg: </span>
            <span className="font-mono text-amber-500">
              {config.timeComplexity.average}
            </span>
          </div>
          <div>
            <span className="text-foreground-subtle">Worst: </span>
            <span className="font-mono text-red-500">
              {config.timeComplexity.worst}
            </span>
          </div>
          <div>
            <span className="text-foreground-subtle">Space: </span>
            <span className="font-mono text-blue-500">
              {config.spaceComplexity}
            </span>
          </div>
        </div>
        {config.complexityIntuition && (
          <p className="mt-1.5 text-[11px] text-foreground-subtle italic">
            {config.complexityIntuition}
          </p>
        )}
      </div>

      {/* Comparison complexity side-by-side */}
      {comparison.enabled && compConfig && (
        <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Columns2 className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
              vs {compConfig.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div>
              <span className="text-foreground-subtle">Avg: </span>
              <span className="font-mono text-amber-500">
                {compConfig.timeComplexity.average}
              </span>
            </div>
            <div>
              <span className="text-foreground-subtle">Worst: </span>
              <span className="font-mono text-red-500">
                {compConfig.timeComplexity.worst}
              </span>
            </div>
            <div>
              <span className="text-foreground-subtle">Space: </span>
              <span className="font-mono text-blue-500">
                {compConfig.spaceComplexity}
              </span>
            </div>
            <div>
              {compConfig.stable !== undefined && (
                <span className={cn(
                  "font-mono text-xs",
                  compConfig.stable ? "text-green-500" : "text-amber-500",
                )}>
                  {compConfig.stable ? "Stable" : "Unstable"}
                </span>
              )}
            </div>
          </div>

          {/* Step counter comparison */}
          {comparison.comparisonResult && comparison.comparisonStep && step && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-center">
              <div className="rounded bg-background px-1 py-0.5">
                <span className="block text-[9px] text-foreground-subtle">{config.name}</span>
                <span className="block font-mono text-xs font-medium text-foreground">
                  {step.complexity.comparisons} cmp
                </span>
              </div>
              <div className="rounded bg-background px-1 py-0.5">
                <span className="block text-[9px] text-foreground-subtle">{compConfig.name}</span>
                <span className="block font-mono text-xs font-medium text-foreground">
                  {comparison.comparisonStep.complexity.comparisons} cmp
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Properties */}
      <div className="mb-3 flex gap-2">
        {config.stable !== undefined && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-medium border backdrop-blur-sm transition-all",
              config.stable
                ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                : "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
            )}
          >
            {config.stable ? "Stable" : "Unstable"}
          </span>
        )}
        {config.inPlace !== undefined && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-medium border backdrop-blur-sm transition-all",
              config.inPlace
                ? "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                : "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
            )}
          >
            {config.inPlace ? "In-Place" : "Not In-Place"}
          </span>
        )}
      </div>

      {/* Pseudocode */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Code2 className="h-3 w-3 text-foreground-subtle" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Pseudocode
          </span>
        </div>
        <div className="rounded-xl border border-border/30 bg-background/80 backdrop-blur-sm p-2">
          {config.pseudocode.map((line, i) => (
            <div
              key={i}
              className={cn(
                "px-1 py-0.5 font-mono text-[11px] leading-relaxed transition-colors",
                step && step.pseudocodeLine === i
                  ? "rounded bg-primary/20 text-primary"
                  : "text-foreground-muted",
              )}
            >
              <span className="mr-2 inline-block w-4 text-right text-foreground-subtle opacity-50">
                {i + 1}
              </span>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Complexity comparison chart */}
      {result && config.category === 'sorting' && (
        <div className="mb-3">
          <ComplexityComparisonChart algoId={selectedAlgoId} result={result} />
        </div>
      )}

      {/* Current step detail */}
      {step && (
        <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-foreground-subtle" />
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Step {(stepIndex ?? 0) + 1}
            </span>
          </div>
          <p className="font-mono text-xs text-foreground">
            {step.description}
          </p>
        </div>
      )}

      {/* ALG-267: Recently viewed algorithms */}
      {recentAlgos.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Recently Viewed</span>
          <ul className="mt-1 space-y-0.5">
            {recentAlgos.slice(0, 5).map((a) => (
              <li key={a.id} className={cn("text-xs", a.id === selectedAlgoId ? "text-primary font-medium" : "text-foreground-subtle")}>
                {a.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
});
