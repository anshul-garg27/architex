"use client";

import React, { memo, useState, useCallback, useMemo, useRef, useEffect, Component, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Play,
  Code2,
  Link2,
  Printer,
  Camera,
  MoreHorizontal,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/components/ui/toast";
import { RecordButton } from "@/components/shared/RecordButton";
import { AlgorithmPanel } from "@/components/canvas/panels/AlgorithmPanel";
import type { ComparisonState } from "@/components/canvas/panels/AlgorithmPanel";
import { useFirstEncounter } from "@/hooks/useFirstEncounter";
import type {
  AnimationStep,
  ElementState,
  AlgorithmConfig,
  AlgorithmResult,
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
  // Demo runners
  bubbleSort,
  bfs,
  SAMPLE_GRAPH_FOR_ALGORITHM,
  bstInsert,
  BALANCED_BST,
  fibonacciDP,
  kmpSearch,
  solveNQueens,
  convexHull,
  SAMPLE_POINTS,
  PlaybackController,
} from "@/lib/algorithms";

// ── Extracted sub-components (ALG-167) ────────────────────
import { AlgorithmCanvas, parseStepMutations } from "@/components/modules/algorithm/AlgorithmCanvas";
import { AlgorithmProperties } from "@/components/modules/algorithm/AlgorithmProperties";
import { AlgorithmBottomPanel } from "@/components/modules/algorithm/AlgorithmBottomPanel";

// ── Phase 1: "Make it Feel Alive" ─────────────────────────
import { useAlgorithmSound } from "@/hooks/useAlgorithmSound";
import { SoundToggle } from "@/components/ui/SoundToggle";

// ── Floating transport bar ────────────────────────────────
import { TimelineScrubber } from "@/components/canvas/overlays/TimelineScrubber";

// ── Keyboard shortcut sheet ──────────────────────────────
import { KeyboardShortcutSheet } from "@/components/canvas/overlays/KeyboardShortcutSheet";
import { soundEngine } from "@/lib/audio/sound-engine";

// Static combined array — avoids re-creating on every render
const ALL_ALGORITHMS = [
  ...SORTING_ALGORITHMS, ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS, ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
];

// ── Types ───────────────────────────────────────────────────

/**
 * Algorithm module state -- a union of all visualization type states.
 *
 * When visualizationType === 'array': uses currentArray, elementStates, comparison
 * When visualizationType === 'graph': uses currentGraph
 * When visualizationType === 'tree': uses currentTree, heapArray, treeAlgoId
 * When visualizationType === 'dp': uses currentDPTable, dpAlgoId
 * When visualizationType === 'string': uses stringText, stringPattern, stringAlgoId, failureFunction
 * When visualizationType === 'backtracking': uses backtrackingAlgoId, backtrackingGridSize
 * When visualizationType === 'geometry': uses geometryPoints, geometryAlgoId
 *
 * TODO: Refactor to discriminated union (see ALG-252 original spec) for compile-time safety.
 */
interface AlgorithmModuleState {
  currentArray: number[];
  elementStates: ElementState[];
  currentStep: AnimationStep | null;
  stepIndex: number;
  selectedAlgoId: string;
  visualizationType: 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry';
  currentGraph: Graph | null;
  currentTree: TreeNode | null;
  heapArray: number[] | null;
  treeAlgoId: string | null;
  currentDPTable: DPTable | null;
  dpAlgoId: string | null;
  stringText: string | null;
  stringPattern: string | null;
  stringAlgoId: string | null;
  failureFunction: number[] | null;
  // Backtracking
  backtrackingAlgoId: string | null;
  backtrackingGridSize: number;
  // Geometry
  geometryPoints: Point2D[] | null;
  geometryAlgoId: string | null;
  // Comparison mode
  comparison: ComparisonState;
  // Separate array state for comparison algorithm (ALG-149)
  comparisonArray: number[];
}

// ── ALG-252: Type guards for visualization state ──────────

/** Type guard: is this a sorting/array visualization state? */
function isSortingView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'array';
}

/** Type guard: is this a graph visualization state? */
function isGraphView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'graph';
}

/** Type guard: is this a tree visualization state? */
function isTreeView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'tree';
}

/** Type guard: is this a DP visualization state? */
function isDPView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'dp';
}

/** Type guard: is this a string-matching visualization state? */
function isStringView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'string';
}

/** Type guard: is this a backtracking visualization state? */
function isBacktrackingView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'backtracking';
}

/** Type guard: is this a geometry visualization state? */
function isGeometryView(state: AlgorithmModuleState): boolean {
  return state.visualizationType === 'geometry';
}

// Suppress unused-vars for type guards (exported for future use by ALG-252 refactor)
void isSortingView; void isGraphView; void isTreeView; void isDPView;
void isStringView; void isBacktrackingView; void isGeometryView;

// ── ALG-332: Extract variables from step data ─────────────

function extractVariables(step: AnimationStep, category: string): Record<string, string> {
  const vars: Record<string, string> = {};

  // Common patterns in step descriptions
  const compareMatch = step.description.match(/Compare.*?(\w+)\[(\d+)\]=(\d+).*?(\w+)\[(\d+)\]=(\d+)/);
  if (compareMatch) {
    vars['Comparing'] = `arr[${compareMatch[2]}]=${compareMatch[3]} vs arr[${compareMatch[5]}]=${compareMatch[6]}`;
  }

  // Swap detection
  const swapMatch = step.description.match(/[Ss]wap.*?(\d+).*?(\d+)/);
  if (swapMatch && !compareMatch) {
    vars['Swapping'] = `${swapMatch[1]} <-> ${swapMatch[2]}`;
  }

  // Pivot detection
  const pivotMatch = step.description.match(/[Pp]ivot[=: ]+(\d+)/);
  if (pivotMatch) {
    vars['Pivot'] = pivotMatch[1];
  }

  // Distance / relaxation for graph algos
  const distMatch = step.description.match(/dist\[(\w+)\]\s*=\s*(\d+)/);
  if (distMatch) {
    vars['Distance'] = `${distMatch[1]} = ${distMatch[2]}`;
  }

  // Node being visited
  const visitMatch = step.description.match(/(?:Visit|Extract|Dequeue|Process)\s+(?:node\s+)?(\w+)/i);
  if (visitMatch) {
    vars['Current Node'] = visitMatch[1];
  }

  vars['Step'] = String(step.id + 1);
  vars['Comparisons'] = String(step.complexity.comparisons);
  vars['Swaps'] = String(step.complexity.swaps);
  vars['Pseudocode Line'] = String(step.pseudocodeLine + 1);

  if (step.milestone) {
    vars['Milestone'] = step.milestone;
  }

  return vars;
}

// ── Sidebar ─────────────────────────────────────────────────

const AlgorithmSidebar = memo(function AlgorithmSidebar({
  onStepChange,
  onArrayChange,
  onGraphChange,
  onTreeChange,
  onDPChange,
  onStringMatchChange,
  onGeometryChange,
  onVisualizationTypeChange,
  onReset,
  onAlgoChange,
  onComparisonChange,
  onResultChange,
  onPlayingChange,
  onPlaybackComplete,
  onExposeControls,
}: {
  onStepChange: (step: AnimationStep, index: number) => void;
  onArrayChange: (arr: number[], states: ElementState[]) => void;
  onGraphChange: (graph: Graph, algoId: string) => void;
  onTreeChange: (tree: TreeNode | null, heapArray: number[] | null, algoId: string) => void;
  onDPChange: (table: DPTable, algoId: string) => void;
  onStringMatchChange: (text: string, pattern: string, algoId: string, failureFunction?: number[]) => void;
  onGeometryChange: (points: Point2D[], algoId: string) => void;
  onVisualizationTypeChange: (type: 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry') => void;
  onReset: () => void;
  onAlgoChange: (id: string) => void;
  onComparisonChange: (state: ComparisonState) => void;
  onResultChange: (result: AlgorithmResult) => void;
  onPlayingChange: (playing: boolean) => void;
  onPlaybackComplete: () => void;
  onExposeControls: (controls: {
    playPause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (index: number) => void;
  }) => void;
}) {
  return (
    <AlgorithmPanel
      onStepChange={onStepChange}
      onArrayChange={onArrayChange}
      onGraphChange={onGraphChange}
      onTreeChange={onTreeChange}
      onDPChange={onDPChange}
      onStringMatchChange={onStringMatchChange}
      onGeometryChange={onGeometryChange}
      onVisualizationTypeChange={onVisualizationTypeChange}
      onReset={onReset}
      onAlgoChange={onAlgoChange}
      onComparisonChange={onComparisonChange}
      onResultChange={onResultChange}
      onPlayingChange={onPlayingChange}
      onPlaybackComplete={onPlaybackComplete}
      onExposeControls={onExposeControls}
    />
  );
});

// ── Error Boundary ─────────────────────────────────────────

class VisualizerErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h3 className="text-lg font-medium text-foreground">Visualization Error</h3>
          <p className="max-w-md text-sm text-foreground-muted">
            Something went wrong rendering the visualization. Try selecting a different algorithm or resetting.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── ALG-262: Onboarding Tour ───────────────────────────────

interface AlgoTourStep {
  title: string;
  description: string;
  position: 'center' | 'right' | 'bottom-left' | 'bottom';
}

const ALGO_TOUR_STEPS: AlgoTourStep[] = [
  {
    title: "Choose an Algorithm",
    description:
      "Start with Bubble Sort in the sidebar dropdown — it's the simplest! Pick any category to explore sorting, graphs, trees, and more.",
    position: 'right',
  },
  {
    title: "Generate & Run",
    description:
      "Click Generate for random data, then Run to watch it animate. Or try a one-click demo from the empty canvas.",
    position: 'right',
  },
  {
    title: "Step Through",
    description:
      "Use the playback controls to step through slowly and understand each operation, or press Play for the full animation.",
    position: 'bottom',
  },
];

const AlgorithmOnboardingTour = memo(function AlgorithmOnboardingTour({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!show) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step >= ALGO_TOUR_STEPS.length - 1) {
          onDismiss();
        } else {
          setStep((s) => s + 1);
        }
      } else if (e.key === 'ArrowLeft' && step > 0) {
        setStep((s) => s - 1);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, step, onDismiss]);

  if (!show) return null;

  const current = ALGO_TOUR_STEPS[step];
  const isLast = step === ALGO_TOUR_STEPS.length - 1;

  const getPositionClasses = () => {
    switch (current.position) {
      case 'right':
        return 'left-4 top-1/3 -translate-y-1/2';
      case 'bottom-left':
        return 'left-4 bottom-20';
      case 'bottom':
        return 'left-1/2 bottom-20 -translate-x-1/2';
      default:
        return 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label="Algorithm module tour">
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} />

      <div className={cn("absolute z-[51] w-80 rounded-xl border border-border bg-surface p-5 shadow-2xl", getPositionClasses())}>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            {current.title}
          </h3>
          <button
            onClick={onDismiss}
            className="ml-auto rounded-md p-1 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-foreground-muted">
          {current.description}
        </p>

        <div className="mb-4 flex items-center justify-center gap-1.5">
          {ALGO_TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === step
                  ? "w-4 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-foreground-subtle/30",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onDismiss();
                } else {
                  setStep((s) => s + 1);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isLast ? 'Got it!' : 'Next'}
              {!isLast && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] text-foreground-subtle">
          Step {step + 1} of {ALGO_TOUR_STEPS.length}
        </div>
      </div>
    </div>
  );
});

// ── Module Export ────────────────────────────────────────────

export function useAlgorithmModule() {
  const [state, setState] = useState<AlgorithmModuleState>({
    currentArray: [],
    elementStates: [],
    currentStep: null,
    stepIndex: 0,
    selectedAlgoId: SORTING_ALGORITHMS[0].id,
    visualizationType: 'array',
    currentGraph: null,
    currentTree: null,
    heapArray: null,
    treeAlgoId: null,
    currentDPTable: null,
    dpAlgoId: null,
    stringText: null,
    stringPattern: null,
    stringAlgoId: null,
    failureFunction: null,
    backtrackingAlgoId: null,
    backtrackingGridSize: 8,
    geometryPoints: null,
    geometryAlgoId: null,
    comparison: {
      enabled: false,
      comparisonAlgoId: SORTING_ALGORITHMS[1]?.id ?? SORTING_ALGORITHMS[0].id,
      comparisonResult: null,
      comparisonStepIndex: 0,
      comparisonStep: null,
    },
    comparisonArray: [],
  });

  // Track the latest result for the properties panel complexity chart
  const [latestResult, setLatestResult] = useState<AlgorithmResult | null>(null);

  // ALG-267: Recently-viewed algorithm tracking
  const [recentAlgos, setRecentAlgos] = useState<Array<{id: string; name: string; timestamp: number}>>(() => {
    try { return JSON.parse(localStorage.getItem('architex-recent-algos') || '[]'); } catch { return []; }
  });

  // ALG-178: Per-algorithm mastery tracking (0-5 stars)
  const [mastery, setMastery] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('architex-algo-mastery') || '{}'); } catch { return {}; }
  });

  // ALG-332: Variables panel toggle
  const [showVariables, setShowVariables] = useState(false);

  // Phase 1: Sound integration
  const { playStepSound, playComplete } = useAlgorithmSound();

  // Phase 1: Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Phase 1: Track playback state for spotlight
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for TimelineScrubber transport controls (bridged from AlgorithmPanel via onExposeControls)
  const scrubberControlsRef = useRef<{
    playPause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (index: number) => void;
  } | null>(null);

  const handleExposeControls = useCallback((controls: {
    playPause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (index: number) => void;
  }) => {
    scrubberControlsRef.current = controls;
  }, []);

  const handleStepChange = useCallback(
    (step: AnimationStep, index: number) => {
      // Phase 1: Play sound for this step
      playStepSound(step);

      setState((prev) => {
        if (prev.visualizationType === 'graph' || prev.visualizationType === 'tree' || prev.visualizationType === 'dp' || prev.visualizationType === 'string' || prev.visualizationType === 'backtracking' || prev.visualizationType === 'geometry') {
          return {
            ...prev,
            currentStep: step,
            stepIndex: index,
          };
        }
        const newStates = parseStepMutations(step, prev.currentArray.length);
        const hasNonDefault = newStates.some((s) => s !== "default");

        // ── Strategy 1: Use arraySnapshot if engine provides it ──
        // This is the most reliable path — the engine tells us the
        // exact array state. No inference, no heuristics.
        let updatedArray = prev.currentArray;

        if (step.arraySnapshot && step.arraySnapshot.length === prev.currentArray.length) {
          // Check if anything actually changed
          const changed = step.arraySnapshot.some((v, i) => v !== prev.currentArray[i]);
          if (changed) {
            updatedArray = step.arraySnapshot;
          }
        } else {
          // ── Strategy 2: Extract position mutations (explicit swaps) ──
          const positionMoves: Array<{ from: number; to: number }> = [];
          for (const mutation of step.mutations) {
            if (mutation.property === 'position') {
              const fromIdx = typeof mutation.from === 'number'
                ? mutation.from
                : parseInt(String(mutation.from), 10);
              const toIdx = typeof mutation.to === 'number'
                ? mutation.to
                : parseInt(String(mutation.to), 10);
              if (!isNaN(fromIdx) && !isNaN(toIdx) && fromIdx >= 0 && fromIdx < prev.currentArray.length && toIdx >= 0 && toIdx < prev.currentArray.length && fromIdx !== toIdx) {
                positionMoves.push({ from: fromIdx, to: toIdx });
              }
            }
          }

          // ── Strategy 3: Infer swap from 'swapping' highlights ──
          if (positionMoves.length === 0) {
            const swappingIndices: number[] = [];
            for (const mutation of step.mutations) {
              if ((mutation.property === 'fill' || mutation.property === 'highlight') &&
                  String(mutation.to).toLowerCase().includes('swapping')) {
                const match = mutation.targetId.match(/^(?:element-)?(\d+)$/);
                if (match) {
                  const idx = parseInt(match[1], 10);
                  if (idx >= 0 && idx < prev.currentArray.length) {
                    swappingIndices.push(idx);
                  }
                }
              }
            }
            const unique = [...new Set(swappingIndices)];
            if (unique.length === 2) {
              positionMoves.push({ from: unique[0], to: unique[1] });
            }
          }

          if (positionMoves.length >= 1) {
            updatedArray = [...prev.currentArray];
            const a = positionMoves[0].from;
            const b = positionMoves[0].to;
            const temp = updatedArray[a];
            updatedArray[a] = updatedArray[b];
            updatedArray[b] = temp;
          }
        }

        const arrayChanged = updatedArray !== prev.currentArray;

        return {
          ...prev,
          currentStep: step,
          stepIndex: index,
          elementStates: hasNonDefault ? newStates : prev.elementStates,
          ...(arrayChanged ? { currentArray: updatedArray } : {}),
        };
      });
    },
    [playStepSound],
  );

  const handleArrayChange = useCallback(
    (arr: number[], states: ElementState[]) => {
      setState((prev) => ({
        ...prev,
        currentArray: arr,
        elementStates: states,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleGraphChange = useCallback(
    (graph: Graph, _algoId: string) => {
      setState((prev) => ({
        ...prev,
        currentGraph: graph,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleTreeChange = useCallback(
    (tree: TreeNode | null, heapArray: number[] | null, algoId: string) => {
      setState((prev) => ({
        ...prev,
        currentTree: tree,
        heapArray,
        treeAlgoId: algoId,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleDPChange = useCallback(
    (table: DPTable, algoId: string) => {
      setState((prev) => ({
        ...prev,
        currentDPTable: table,
        dpAlgoId: algoId,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleStringMatchChange = useCallback(
    (text: string, pattern: string, algoId: string, failureFn?: number[]) => {
      setState((prev) => ({
        ...prev,
        stringText: text,
        stringPattern: pattern,
        stringAlgoId: algoId,
        failureFunction: failureFn ?? null,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleGeometryChange = useCallback(
    (points: Point2D[], algoId: string) => {
      setState((prev) => ({
        ...prev,
        geometryPoints: points,
        geometryAlgoId: algoId,
        currentStep: null,
        stepIndex: 0,
      }));
    },
    [],
  );

  const handleVisualizationTypeChange = useCallback(
    (type: 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry') => {
      setState((prev) => ({
        ...prev,
        visualizationType: type,
      }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentArray: [],
      elementStates: [],
      currentGraph: null,
      currentTree: null,
      heapArray: null,
      treeAlgoId: null,
      currentDPTable: null,
      dpAlgoId: null,
      stringText: null,
      stringPattern: null,
      stringAlgoId: null,
      failureFunction: null,
      backtrackingAlgoId: null,
      backtrackingGridSize: 8,
      geometryPoints: null,
      geometryAlgoId: null,
      currentStep: null,
      stepIndex: 0,
      comparisonArray: [],
    }));
    setLatestResult(null);
    setShowCelebration(false);
  }, []);

  // Phase 1: Playback state tracking
  const handlePlayingChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (playing) setShowCelebration(false);
  }, []);

  // Phase 1: Trigger celebration + completion sound when playback finishes
  const handlePlaybackComplete = useCallback(() => {
    setIsPlaying(false);
    playComplete();
    setShowCelebration(true);
  }, [playComplete]);

  const handleAlgoChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedAlgoId: id,
    }));
    const config = ALL_ALGORITHMS.find((a) => a.id === id);
    setRecentAlgos((prev) => {
      const updated = [{id, name: config?.name || id, timestamp: Date.now()}, ...prev.filter((a) => a.id !== id)].slice(0, 10);
      localStorage.setItem('architex-recent-algos', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleComparisonChange = useCallback((compState: ComparisonState) => {
    setState((prev) => ({
      ...prev,
      comparison: compState,
      comparisonArray: compState.enabled && compState.comparisonResult
        ? [...compState.comparisonResult.finalState]
        : [],
    }));
  }, []);

  // ── ALG-231: Progress store wiring ───────────────────────
  const { addXP, updateStreak } = useProgressStore();
  const { addNotification } = useNotificationStore();
  const runCountRef = useRef(0);

  const handleResultChange = useCallback((result: AlgorithmResult) => {
    setLatestResult(result);

    addXP(5);
    updateStreak();

    runCountRef.current += 1;
    if (runCountRef.current === 1) {
      addNotification({
        type: 'achievement',
        title: 'First Algorithm!',
        message: 'You ran your first algorithm visualization.',
      });
    }

    const algoId = result.config.id;
    setMastery((prev) => {
      const currentLevel = prev[algoId] || 0;
      if (currentLevel < 1) {
        const updated = { ...prev, [algoId]: 1 };
        localStorage.setItem('architex-algo-mastery', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    if (result.config.category === 'backtracking') {
      setState((prev) => ({
        ...prev,
        backtrackingAlgoId: result.config.id,
        backtrackingGridSize: result.config.id === 'sudoku' ? 9 : result.finalState.length,
      }));
    }
  }, [addXP, updateStreak, addNotification]);

  // ── ALG-261: Demo CTA handler ──────────────────────────────
  const demoControllerRef = useRef<PlaybackController | null>(null);

  const handleDemoRequest = useCallback((category: string) => {
    demoControllerRef.current?.destroy();
    demoControllerRef.current = null;

    let result: AlgorithmResult;

    switch (category) {
      case 'sorting': {
        const demoArray = [5, 3, 8, 1, 9, 2, 7, 4];
        result = bubbleSort(demoArray);
        const initStates: ElementState[] = demoArray.map(() => 'default');
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'bubble-sort',
          visualizationType: 'array',
          currentArray: demoArray,
          elementStates: initStates,
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'graph': {
        const sample = SAMPLE_GRAPH_FOR_ALGORITHM['bfs'];
        result = bfs(sample.graph, sample.startNodeId);
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'bfs',
          visualizationType: 'graph',
          currentGraph: sample.graph,
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'tree': {
        result = bstInsert(BALANCED_BST, 5);
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'bst-operations',
          visualizationType: 'tree',
          currentTree: BALANCED_BST,
          heapArray: null,
          treeAlgoId: 'bst-operations',
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'dp': {
        const fibResult = fibonacciDP(10);
        result = fibResult;
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'fibonacci',
          visualizationType: 'dp',
          currentDPTable: fibResult.dpTable ?? null,
          dpAlgoId: 'fibonacci',
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'string': {
        const kmpResult = kmpSearch('ABABCABABABABCABAB', 'ABABCABAB');
        result = kmpResult;
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'kmp',
          visualizationType: 'string',
          stringText: 'ABABCABABABABCABAB',
          stringPattern: 'ABABCABAB',
          stringAlgoId: 'kmp',
          failureFunction: kmpResult.failureFunction ?? null,
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'backtracking': {
        result = solveNQueens(4);
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'n-queens',
          visualizationType: 'backtracking',
          backtrackingAlgoId: 'n-queens',
          backtrackingGridSize: 4,
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      case 'geometry': {
        result = convexHull(SAMPLE_POINTS);
        setState((prev) => ({
          ...prev,
          selectedAlgoId: 'convex-hull',
          visualizationType: 'geometry',
          geometryPoints: SAMPLE_POINTS,
          geometryAlgoId: 'convex-hull',
          currentStep: null,
          stepIndex: 0,
        }));
        break;
      }
      default:
        return;
    }

    setLatestResult(result);
    addXP(5);
    updateStreak();

    if (result.steps.length > 0) {
      const controller = new PlaybackController(result.steps, (step, index) => {
        setState((prev) => {
          if (category === 'sorting') {
            const newStates = parseStepMutations(step, prev.currentArray.length);
            const hasNonDefault = newStates.some((s) => s !== 'default');
            return {
              ...prev,
              currentStep: step,
              stepIndex: index,
              elementStates: hasNonDefault ? newStates : prev.elementStates,
            };
          }
          return {
            ...prev,
            currentStep: step,
            stepIndex: index,
          };
        });
      });
      controller.setSpeed(1);
      controller.play();
      demoControllerRef.current = controller;
    }
  }, [addXP, updateStreak]);

  // ── ALG-234: Share button with URL state encoding ────────
  const handleShare = useCallback(() => {
    try {
      const payload = {
        algoId: state.selectedAlgoId,
        vizType: state.visualizationType,
        array: state.currentArray,
        stepIndex: state.stepIndex,
      };
      const encoded = btoa(JSON.stringify(payload));
      const url = `${window.location.origin}${window.location.pathname}?alg=${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        toast('success', 'Link copied to clipboard!');
      }).catch(() => {
        toast('error', 'Failed to copy link.');
      });
    } catch {
      toast('error', 'Failed to generate share link.');
    }
  }, [state.selectedAlgoId, state.visualizationType, state.currentArray, state.stepIndex]);

  // ── ALG-334: Print-friendly step export ─────────────────
  const handleExportSteps = useCallback(() => {
    if (!latestResult) return;
    const cfg = latestResult.config;
    const steps = latestResult.steps;
    const rows = steps.map((s: AnimationStep, i: number) =>
      `<tr><td>${i+1}</td><td>${s.description}</td><td>${s.complexity.comparisons}</td><td>${s.complexity.swaps}</td></tr>`
    ).join('');
    const blob = new Blob([`<!DOCTYPE html>
<html><head><title>${cfg.name} — Step Trace</title>
<style>body{font-family:system-ui;max-width:800px;margin:auto;padding:2rem}
h1{font-size:1.5rem}table{width:100%;border-collapse:collapse}
td,th{border:1px solid #ddd;padding:4px 8px;text-align:left;font-size:12px}
@media print{body{padding:0}}</style></head>
<body><h1>${cfg.name}</h1>
<p>Complexity: ${cfg.timeComplexity.average} time, ${cfg.spaceComplexity} space</p>
<table><tr><th>#</th><th>Description</th><th>Comparisons</th><th>Swaps</th></tr>
${rows}</table></body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [latestResult]);

  // ── ALG-175: Screenshot export ──────────────────────────
  const handleScreenshot = useCallback(() => {
    const canvas = canvasContainerRef?.current;
    if (!canvas) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>${state.selectedAlgoId} - Step ${state.stepIndex + 1}</title>` +
      `<style>body{margin:0;padding:20px;background:#1a1a2e;color:white;font-family:system-ui}</style></head>` +
      `<body>${canvas.innerHTML}</body></html>`
    );
    printWindow.document.close();
    printWindow.print();
  }, [state.selectedAlgoId, state.stepIndex]);

  // ── ALG-240: Canvas ref for GIF/video export ────────────
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // ── ALG-177: Code-alongside-visualization panel ──────────
  const [showCodePanel, setShowCodePanel] = useState(false);
  const selectedConfig = useMemo(
    () => ALL_ALGORITHMS.find((a) => a.id === state.selectedAlgoId) ?? SORTING_ALGORITHMS[0],
    [state.selectedAlgoId],
  );

  // ── ALG-265: Fullscreen / Presentation Mode ──────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Keyboard shortcut sheet ──────────────────────────────
  const [showShortcutSheet, setShowShortcutSheet] = useState(false);

  // ── Global keyboard shortcuts ────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          scrubberControlsRef.current?.playPause();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Previous milestone — step backward until a milestone step
            // For now, delegates to stepBackward (milestone jump is a future enhancement)
            e.preventDefault();
            scrubberControlsRef.current?.stepBackward();
          } else {
            e.preventDefault();
            scrubberControlsRef.current?.stepBackward();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            scrubberControlsRef.current?.stepForward();
          } else {
            e.preventDefault();
            scrubberControlsRef.current?.stepForward();
          }
          break;
        case 's':
        case 'S':
          soundEngine.setEnabled(!soundEngine.isEnabled());
          break;
        case 'f':
        case 'F':
          setIsFullscreen((prev) => !prev);
          break;
        case '?':
          setShowShortcutSheet(true);
          break;
        case 'Escape':
          if (showShortcutSheet) {
            setShowShortcutSheet(false);
          } else if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutSheet, isFullscreen]);

  // ── ALG-262: First-visit onboarding tour ──────────────────
  const { show: showAlgoTour, dismiss: dismissAlgoTour } = useFirstEncounter('algorithm-module');

  // ── ALG-180: DP Test Mode toggle ──────────────────────────
  const [dpTestMode, setDpTestMode] = useState(false);
  const handleDPTestAnswer = useCallback((correct: boolean) => {
    if (correct) {
      toast('success', 'Correct! That is the next cell to compute.');
    } else {
      toast('error', 'Wrong cell. The correct cell is now highlighted.');
    }
  }, []);

  // ── ALG-179: Recursive call stack depth ───────────────────
  const currentDepth = useMemo(() => {
    if (!state.currentStep) return 0;
    const depthMatch = state.currentStep.description.match(/\(depth (\d+)\)/);
    return depthMatch ? parseInt(depthMatch[1], 10) : 0;
  }, [state.currentStep]);

  return {
    sidebar: (
      <AlgorithmSidebar
        onStepChange={handleStepChange}
        onArrayChange={handleArrayChange}
        onGraphChange={handleGraphChange}
        onTreeChange={handleTreeChange}
        onDPChange={handleDPChange}
        onStringMatchChange={handleStringMatchChange}
        onGeometryChange={handleGeometryChange}
        onVisualizationTypeChange={handleVisualizationTypeChange}
        onReset={handleReset}
        onAlgoChange={handleAlgoChange}
        onComparisonChange={handleComparisonChange}
        onResultChange={handleResultChange}
        onPlayingChange={handlePlayingChange}
        onPlaybackComplete={handlePlaybackComplete}
        onExposeControls={handleExposeControls}
      />
    ),
    canvas: (
      <div
        className={cn(
          "relative h-full w-full",
          isFullscreen && "fixed inset-0 z-50 bg-background"
        )}
        ref={canvasContainerRef}
      >
        {/* ALG-262: Onboarding tour overlay */}
        <AlgorithmOnboardingTour show={showAlgoTour} onDismiss={dismissAlgoTour} />

        {/* ALG-177: Code-alongside-visualization panel */}
        {showCodePanel && (
          <div className="absolute left-0 top-0 bottom-0 z-10 w-80 overflow-auto border-r border-border bg-background/95 backdrop-blur p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Source Code</span>
              <button onClick={() => setShowCodePanel(false)} className="text-foreground-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-md bg-elevated border border-border p-3">
              <pre className="text-[11px] font-mono text-foreground leading-relaxed overflow-auto max-h-96">
                {selectedConfig?.pseudocode.map((line, i) => (
                  <div key={i} className={cn(
                    "px-1",
                    state.currentStep?.pseudocodeLine === i && "bg-primary/20 rounded text-primary"
                  )}>
                    <span className="mr-2 text-foreground-subtle opacity-50">{i+1}</span>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {/* ALG-177: Code panel + ALG-234: Share button + ALG-240: Record button + ALG-265: Present button + ALG-332: Variables toggle */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          {/* Phase 1: Sound toggle */}
          <SoundToggle />
          {/* Fullscreen toggle (most used) */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-popover/90 text-foreground-muted shadow-lg backdrop-blur-sm border border-border",
              "transition-all hover:bg-accent hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Toggle presentation mode"
            title={isFullscreen ? "Exit presentation mode" : "Enter presentation mode"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          {/* ALG-240: Record button */}
          <RecordButton targetRef={canvasContainerRef} />
          {/* Overflow menu for secondary actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-popover/90 text-foreground-muted shadow-lg backdrop-blur-sm border border-border",
                  "transition-all hover:bg-accent hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* ALG-177: Code panel toggle */}
              <DropdownMenuItem onClick={() => setShowCodePanel((p) => !p)}>
                <Code2 className="h-4 w-4" />
                <span>{showCodePanel ? "Hide Code Panel" : "Code Panel"}</span>
              </DropdownMenuItem>
              {/* ALG-332: Variables panel toggle */}
              <DropdownMenuItem onClick={() => setShowVariables((p) => !p)}>
                <BarChart3 className="h-4 w-4" />
                <span>{showVariables ? "Hide Variables" : "Variables"}</span>
              </DropdownMenuItem>
              {/* Share link */}
              <DropdownMenuItem onClick={handleShare}>
                <Link2 className="h-4 w-4" />
                <span>Share Link</span>
              </DropdownMenuItem>
              {/* ALG-334: Export Steps */}
              <DropdownMenuItem
                onClick={handleExportSteps}
                disabled={!latestResult}
              >
                <Printer className="h-4 w-4" />
                <span>Export Steps</span>
              </DropdownMenuItem>
              {/* ALG-175: Screenshot */}
              <DropdownMenuItem onClick={handleScreenshot}>
                <Camera className="h-4 w-4" />
                <span>Screenshot</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <VisualizerErrorBoundary onReset={handleReset}>
          <AlgorithmCanvas
            values={state.currentArray}
            states={state.elementStates}
            visualizationType={state.visualizationType}
            graph={state.currentGraph}
            tree={state.currentTree}
            heapArray={state.heapArray}
            treeAlgoId={state.treeAlgoId}
            dpTable={state.currentDPTable}
            stringText={state.stringText}
            stringPattern={state.stringPattern}
            stringAlgoId={state.stringAlgoId}
            failureFunction={state.failureFunction}
            backtrackingAlgoId={state.backtrackingAlgoId}
            backtrackingGridSize={state.backtrackingGridSize}
            geometryPoints={state.geometryPoints}
            step={state.currentStep}
            comparison={state.comparison}
            comparisonArray={state.comparisonArray}
            onDemoRequest={handleDemoRequest}
            dpTestMode={dpTestMode}
            onDPTestAnswer={handleDPTestAnswer}
            algorithmId={state.selectedAlgoId}
            isPlaying={isPlaying}
            showCelebration={showCelebration}
            onCelebrationDismiss={() => setShowCelebration(false)}
            latestResult={latestResult}
          />
        </VisualizerErrorBoundary>

        {/* Floating transport bar (TimelineScrubber) */}
        {state.currentStep && latestResult && (
          <TimelineScrubber
            totalSteps={latestResult.steps.length}
            currentStep={state.stepIndex}
            milestones={latestResult.steps
              .filter((s) => s.milestone)
              .map((s) => ({ stepIndex: s.id, label: s.milestone! }))}
            isPlaying={isPlaying}
            onScrub={(i) => scrubberControlsRef.current?.jumpToStep(i)}
            onPlayPause={() => scrubberControlsRef.current?.playPause()}
            onStepForward={() => scrubberControlsRef.current?.stepForward()}
            onStepBackward={() => scrubberControlsRef.current?.stepBackward()}
            className="absolute bottom-4 left-4 right-4 z-20"
          />
        )}

        {/* ALG-180: DP Test Mode toggle */}
        {state.visualizationType === 'dp' && state.currentDPTable && (
          <div className="absolute left-4 bottom-4 z-10">
            <button
              onClick={() => setDpTestMode((prev) => !prev)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                dpTestMode
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-background/80 text-foreground-muted border-border backdrop-blur-sm hover:bg-accent",
              )}
            >
              {dpTestMode ? "Test Mode ON" : "Test Mode"}
            </button>
          </div>
        )}

        {/* ALG-179: Recursive call stack panel */}
        {state.currentStep && currentDepth > 0 && (
          <div className="absolute right-4 top-16 z-10 w-32 rounded-lg border border-border bg-background/90 backdrop-blur p-2">
            <span className="text-[9px] font-medium uppercase tracking-wider text-foreground-muted">Call Stack</span>
            <div className="mt-1 flex flex-col-reverse gap-0.5">
              {Array.from({ length: currentDepth + 1 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-mono",
                    i === currentDepth
                      ? "bg-primary/20 text-primary"
                      : "bg-elevated text-foreground-muted",
                  )}
                >
                  depth {i}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALG-332: Variables panel (Python-Tutor-style execution trace) */}
        {state.currentStep && showVariables && (
          <div className="absolute right-4 bottom-16 z-10 w-52 rounded-lg border border-border bg-background/90 backdrop-blur p-2">
            <span className="text-[9px] font-medium uppercase tracking-wider text-foreground-muted">Variables</span>
            <div className="mt-1 space-y-0.5">
              {Object.entries(extractVariables(state.currentStep, state.visualizationType)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[10px]">
                  <span className="text-foreground-subtle">{k}:</span>
                  <span className="font-mono text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALG-157: Step description overlay */}
        {state.currentStep && (
          <div className="absolute left-4 top-4 z-10 max-w-md rounded-lg bg-background/80 px-3 py-2 backdrop-blur-sm border border-border/50">
            <p className="text-xs font-medium text-foreground">
              Step {state.stepIndex + 1}: {state.currentStep.description}
            </p>
          </div>
        )}

        {/* ALG-265: Floating playback controls in fullscreen mode */}
        {isFullscreen && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur px-4 py-2 border border-border shadow-lg">
            <button
              onClick={() => {
                demoControllerRef.current?.stepBackward();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Step backward"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const ctrl = demoControllerRef.current;
                if (ctrl) {
                  ctrl.play();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Play or pause"
            >
              <Play className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                demoControllerRef.current?.stepForward();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Step forward"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {state.currentStep && (
              <span className="ml-2 text-xs font-mono text-foreground-muted">
                Step {state.stepIndex + 1}
              </span>
            )}

            <div className="ml-2 h-4 w-px bg-border" />
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Exit presentation mode"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Keyboard shortcut sheet modal */}
        <KeyboardShortcutSheet
          open={showShortcutSheet}
          onClose={() => setShowShortcutSheet(false)}
        />

        {/* Screen reader step announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {state.currentStep ? `Step ${state.stepIndex + 1}: ${state.currentStep.description}` : 'No algorithm running'}
        </div>
      </div>
    ),
    properties: (
      <AlgorithmProperties
        step={state.currentStep}
        stepIndex={state.stepIndex}
        selectedAlgoId={state.selectedAlgoId}
        result={latestResult}
        comparison={state.comparison}
        recentAlgos={recentAlgos}
        mastery={mastery}
      />
    ),
    bottomPanel: (
      <AlgorithmBottomPanel
        step={state.currentStep}
        stepIndex={state.stepIndex}
        comparison={state.comparison}
        selectedAlgoId={state.selectedAlgoId}
      />
    ),
  };
}

export const AlgorithmModule = memo(function AlgorithmModule() {
  return null; // Module content is provided via useAlgorithmModule hook
});
