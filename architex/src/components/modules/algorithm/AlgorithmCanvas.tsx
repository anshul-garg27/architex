"use client";

import React, { memo, useMemo } from "react";
import { AlgorithmWelcome } from "@/components/canvas/overlays/AlgorithmWelcome";
import { ArrayVisualizer } from "@/components/canvas/overlays/ArrayVisualizer";
import { GraphVisualizer } from "@/components/canvas/overlays/GraphVisualizer";
import { TreeVisualizer } from "@/components/canvas/overlays/TreeVisualizer";
import { DPVisualizer } from "@/components/canvas/overlays/DPVisualizer";
import { StringMatchVisualizer } from "@/components/canvas/overlays/StringMatchVisualizer";
import { GridVisualizer } from "@/components/canvas/overlays/GridVisualizer";
import { GeometryVisualizer } from "@/components/canvas/overlays/GeometryVisualizer";
import { SortCelebration } from "@/components/canvas/overlays/SortCelebration";
import { DotPlotVisualizer } from "@/components/canvas/overlays/DotPlotVisualizer";
import { ColorMapVisualizer } from "@/components/canvas/overlays/ColorMapVisualizer";
import { ViewToggle, useVisualizationView } from "@/components/canvas/overlays/ViewToggle";
import { LiveDashboard } from "@/components/canvas/overlays/LiveDashboard";
import { AlgorithmRace } from "@/components/canvas/overlays/AlgorithmRace";
import { DangerOverlay, isDangerZone } from "@/components/canvas/overlays/DangerOverlay";
import type { ComparisonState } from "@/components/canvas/panels/AlgorithmPanel";
import type {
  AnimationStep,
  ElementState,
  AlgorithmConfig,
  Graph,
  TreeNode,
  DPTable,
  Point2D,
} from "@/lib/algorithms";
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
  SAMPLE_SUDOKU,
} from "@/lib/algorithms";

// Static combined array — avoids re-creating on every render
const ALL_ALGORITHMS: AlgorithmConfig[] = [
  ...SORTING_ALGORITHMS, ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS, ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
];

/** Parse step mutations into element states for the array visualizer. */
export function parseStepMutations(
  step: AnimationStep,
  arrayLength: number,
): ElementState[] {
  const states: ElementState[] = Array.from(
    { length: arrayLength },
    () => "default" as ElementState,
  );

  for (const mutation of step.mutations) {
    const match = mutation.targetId.match(/^(?:element-)?(\d+)$/);
    if (!match) continue;
    const idx = parseInt(match[1], 10);
    if (idx < 0 || idx >= arrayLength) continue;

    if (mutation.property === "fill" || mutation.property === "highlight") {
      const value = String(mutation.to).toLowerCase();
      if (value.includes("blue") || value === "comparing") {
        states[idx] = "comparing";
      } else if (value.includes("red") || value === "swapping") {
        states[idx] = "swapping";
      } else if (value.includes("green") || value === "sorted") {
        states[idx] = "sorted";
      } else if (value.includes("purple") || value === "pivot") {
        states[idx] = "pivot";
      } else if (value.includes("amber") || value === "active") {
        states[idx] = "active";
      } else if (value.includes("cyan") || value === "found") {
        states[idx] = "found";
      }
    }
  }

  return states;
}

export interface AlgorithmCanvasProps {
  values: number[];
  states: ElementState[];
  visualizationType: 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry';
  graph: Graph | null;
  tree: TreeNode | null;
  heapArray: number[] | null;
  treeAlgoId: string | null;
  dpTable: DPTable | null;
  stringText: string | null;
  stringPattern: string | null;
  stringAlgoId: string | null;
  failureFunction: number[] | null;
  backtrackingAlgoId: string | null;
  backtrackingGridSize: number;
  geometryPoints: Point2D[] | null;
  step: AnimationStep | null;
  comparison: ComparisonState;
  comparisonArray: number[];
  onDemoRequest?: (category: string) => void;
  dpTestMode?: boolean;
  onDPTestAnswer?: (correct: boolean) => void;
  // Phase 1: "Make it Feel Alive"
  algorithmId?: string;
  isPlaying?: boolean;
  showCelebration?: boolean;
  onCelebrationDismiss?: () => void;
  latestResult?: import('@/lib/algorithms').AlgorithmResult | null;
}

export const AlgorithmCanvas = memo(function AlgorithmCanvas({
  values,
  states,
  visualizationType,
  graph,
  tree,
  heapArray,
  treeAlgoId,
  dpTable,
  stringText,
  stringPattern,
  stringAlgoId,
  failureFunction,
  backtrackingAlgoId,
  backtrackingGridSize,
  geometryPoints,
  step,
  comparison,
  comparisonArray,
  onDemoRequest,
  dpTestMode,
  onDPTestAnswer,
  algorithmId,
  isPlaying,
  showCelebration,
  onCelebrationDismiss,
  latestResult,
}: AlgorithmCanvasProps) {
  const allAlgorithms = ALL_ALGORITHMS;
  // Phase 2: Visualization view toggle (bar/dot/colormap)
  const [vizView, setVizView] = useVisualizationView();

  // Compute sudoku given numbers flat array for the visualizer
  const sudokuGivenFlat = useMemo(() => {
    const flat: number[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        flat.push(SAMPLE_SUDOKU[r][c]);
      }
    }
    return flat;
  }, []);

  if (visualizationType === 'backtracking' && backtrackingAlgoId) {
    const gridSize = backtrackingAlgoId === 'sudoku' ? 9 : backtrackingGridSize;
    const mode = backtrackingAlgoId === 'sudoku' ? 'sudoku' as const : 'n-queens' as const;

    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-4xl">
          <GridVisualizer
            size={gridSize}
            mode={mode}
            step={step}
            givenNumbers={mode === 'sudoku' ? sudokuGivenFlat : undefined}
            height={520}
            className="w-full"
          />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  if (visualizationType === 'dp' && dpTable) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-5xl">
          <DPVisualizer
            table={dpTable}
            step={step}
            height={520}
            className="w-full"
            testMode={dpTestMode}
            onTestAnswer={onDPTestAnswer}
          />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  if (visualizationType === 'string' && stringText && stringPattern) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-5xl">
          <StringMatchVisualizer
            text={stringText}
            pattern={stringPattern}
            step={step}
            failureFunction={stringAlgoId === 'kmp' && failureFunction ? failureFunction : undefined}
            hashValues={stringAlgoId === 'rabin-karp' ? { patternHash: undefined, windowHash: undefined } : undefined}
            height={380}
            className="w-full"
          />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  if (visualizationType === 'tree' && tree) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-4xl">
          <TreeVisualizer
            tree={tree}
            step={step}
            height={heapArray ? 560 : 480}
            className="w-full"
            showArrayIndices={treeAlgoId === 'heap-operations'}
            showBalanceFactor={treeAlgoId === 'avl-tree'}
            heapArray={heapArray ?? undefined}
            algorithmId={treeAlgoId ?? algorithmId}
          />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  if (visualizationType === 'geometry' && geometryPoints) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-4xl">
          <GeometryVisualizer points={geometryPoints} step={step} height={480} className="w-full" />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  if (visualizationType === 'graph' && graph) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-4xl">
          <GraphVisualizer graph={graph} step={step} height={480} className="w-full" algorithmId={algorithmId} />
        </div>
        {showCelebration && onCelebrationDismiss && (
          <SortCelebration
            show={showCelebration}
            totalSteps={latestResult?.steps.length ?? 0}
            comparisons={step?.complexity.comparisons ?? 0}
            swaps={step?.complexity.swaps ?? 0}
            algorithmName={latestResult?.config.name}
            onDismiss={onCelebrationDismiss}
          />
        )}
      </div>
    );
  }

  // Sorting visualizer -- with optional comparison side-by-side
  if (comparison.enabled && comparison.comparisonResult && values.length > 0) {
    const compStep = comparison.comparisonStep;

    // Derive comparison element states from the comparison step
    let compStates: ElementState[] = values.map(() => 'default' as ElementState);
    if (compStep) {
      compStates = parseStepMutations(compStep, values.length);
      const hasNonDefault = compStates.some((s) => s !== 'default');
      if (!hasNonDefault) {
        compStates = values.map(() => 'default' as ElementState);
      }
    }

    const compConfig = allAlgorithms.find((a) => a.id === comparison.comparisonAlgoId);

    return (
      <div className="relative flex h-full w-full flex-col bg-background">
        {/* Phase 4: Algorithm Race banner */}
        <AlgorithmRace
          algorithmA={{ name: allAlgorithms.find(a => a.id === algorithmId)?.name ?? 'Algorithm A', id: algorithmId ?? '' }}
          algorithmB={{ name: compConfig?.name ?? 'Algorithm B', id: comparison.comparisonAlgoId }}
          progressA={step && latestResult ? (step.id + 1) / latestResult.steps.length : 0}
          progressB={compStep && comparison.comparisonResult ? (compStep.id + 1) / comparison.comparisonResult.steps.length : 0}
          comparisonsA={step?.complexity.comparisons ?? 0}
          comparisonsB={compStep?.complexity.comparisons ?? 0}
          swapsA={step?.complexity.swaps ?? 0}
          swapsB={compStep?.complexity.swaps ?? 0}
          finishedA={step ? step.id + 1 >= (latestResult?.steps.length ?? Infinity) : false}
          finishedB={compStep ? compStep.id + 1 >= (comparison.comparisonResult?.steps.length ?? Infinity) : false}
          isRacing={isPlaying ?? false}
        />
        {/* Side-by-side visualizers */}
        <div className="flex flex-1">
        {/* Left half: primary algorithm */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold text-foreground">A</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-foreground-muted">
                Steps: {step ? (step.id + 1).toString() : '0'}
              </span>
              {step && (
                <span className="text-[10px] font-mono text-amber-500">
                  {step.complexity.comparisons} cmp | {step.complexity.swaps} swp
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ArrayVisualizer
                values={values}
                states={states}
                height={340}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Right half: comparison algorithm */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-semibold text-primary">
              B {compConfig ? `(${compConfig.name})` : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-foreground-muted">
                Steps: {compStep ? (compStep.id + 1).toString() : '0'}
              </span>
              {compStep && (
                <span className="text-[10px] font-mono text-primary">
                  {compStep.complexity.comparisons} cmp | {compStep.complexity.swaps} swp
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ArrayVisualizer
                values={comparisonArray.length > 0 ? comparisonArray : values}
                states={compStates}
                height={340}
                className="w-full"
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-background p-8">
      {/* ALG-213: Comparison prediction prompt before results */}
      {comparison.enabled && !comparison.comparisonResult && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
          <p className="text-sm font-medium text-primary">
            Predict: Which algorithm will finish with fewer comparisons?
          </p>
        </div>
      )}
      {values.length > 0 ? (
        <div className="relative w-full max-w-4xl">
          {/* Phase 2: View toggle (bar/dot/colormap) */}
          <ViewToggle activeView={vizView} onViewChange={setVizView} />

          {/* Render the selected visualization view */}
          {vizView === 'dots' ? (
            <DotPlotVisualizer
              values={values}
              states={states}
              height={400}
              className="w-full"
              algorithmId={algorithmId}
              isPlaying={isPlaying}
            />
          ) : vizView === 'colormap' ? (
            <ColorMapVisualizer
              values={values}
              states={states}
              height={400}
              className="w-full"
              isPlaying={isPlaying}
            />
          ) : (
            <ArrayVisualizer
              values={values}
              states={states}
              height={400}
              className="w-full"
              algorithmId={algorithmId}
              isPlaying={isPlaying}
            />
          )}

          {/* Phase 3: Living dashboard widgets */}
          {step && isPlaying && (
            <LiveDashboard
              comparisons={step.complexity.comparisons}
              swaps={step.complexity.swaps}
              arraySize={values.length}
              algorithmId={algorithmId ?? ''}
              isPlaying={isPlaying ?? false}
              stepIndex={step.id}
              totalSteps={latestResult?.steps.length ?? 0}
              className="mt-3"
            />
          )}

          {/* Phase 4: Worst-case danger overlay */}
          {step && isPlaying && (
            <DangerOverlay
              active={isDangerZone(step.complexity.comparisons, values.length, algorithmId ?? '')}
              comparisons={step.complexity.comparisons}
              arraySize={values.length}
              algorithmId={algorithmId ?? ''}
            />
          )}

          {/* Phase 1: Sort celebration overlay */}
          {showCelebration && onCelebrationDismiss && (
            <SortCelebration
              show={showCelebration}
              totalSteps={latestResult?.steps.length ?? 0}
              comparisons={step?.complexity.comparisons ?? 0}
              swaps={step?.complexity.swaps ?? 0}
              algorithmName={latestResult?.config.name}
              onDismiss={onCelebrationDismiss}
            />
          )}
        </div>
      ) : (
        <AlgorithmWelcome category={visualizationType} onDemo={onDemoRequest!} />
      )}
    </div>
  );
});
