"use client";

/**
 * WalkthroughPlayer -- step-by-step walkthrough for a design pattern
 * with interactive checkpoints (Brilliant.org style).
 *
 * Fetches walkthrough data + checkpoint data from the content API and
 * displays steps with title, description, key insight, and optional
 * checkpoint questions. Users must answer checkpoints correctly to proceed.
 *
 * Checkpoint types: multiple-choice, click-class, fill-blank, order-steps
 */

import { memo, useState, useMemo, useCallback, useEffect, useRef, type DragEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Lightbulb,
  CheckCircle2,
  XCircle,
  GripVertical,
  Trophy,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/hooks/use-content";
import type { ContentDetailItem } from "@/hooks/use-content";
import type { DesignPattern } from "@/lib/lld";

// ── Checkpoint types ────────────────────────────────────────

interface WalkthroughCheckpoint {
  type: "multiple-choice" | "click-class" | "fill-blank" | "order-steps";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctClassIds?: string[];
  blankTemplate?: string;
  answers?: string[];
  items?: string[];
  correctOrder?: number[];
  explanation: string;
}

interface WalkthroughStep {
  title: string;
  description: string;
  keyInsight?: string;
  checkpoint?: WalkthroughCheckpoint;
}

interface StepCheckpointData {
  stepNumber: number;
  checkpoint: WalkthroughCheckpoint;
}

// ── Props ───────────────────────────────────────────────────

interface WalkthroughPlayerProps {
  pattern: DesignPattern;
  /** Callback to highlight clickable classes on the canvas for click-class checkpoints. */
  onHighlightClasses?: (classIds: string[]) => void;
  /** Callback when the user clicks a class on the canvas (used for click-class answers). */
  onClassClicked?: string | null;
}

// ── Checkpoint state per step ───────────────────────────────

type CheckpointStatus = "unanswered" | "correct" | "incorrect" | "revealed";

interface CheckpointState {
  status: CheckpointStatus;
  attempts: number;
  selectedOption?: number;
  filledAnswers?: string[];
  orderedItems?: number[];
}

// ── Sub-components ──────────────────────────────────────────

/** Multiple-choice checkpoint */
function MultipleChoiceCheckpoint({
  checkpoint,
  state,
  onAnswer,
}: {
  checkpoint: WalkthroughCheckpoint;
  state: CheckpointState;
  onAnswer: (index: number) => void;
}) {
  const { options = [], correctIndex = 0 } = checkpoint;
  const isAnswered = state.status === "correct" || state.status === "revealed";

  return (
    <div className="space-y-2">
      {options.map((option, i) => {
        const isSelected = state.selectedOption === i;
        const isCorrect = i === correctIndex;
        const showResult = isAnswered || (state.status === "incorrect" && isSelected);

        return (
          <button
            key={i}
            onClick={() => !isAnswered && onAnswer(i)}
            disabled={isAnswered}
            className={cn(
              "w-full text-left rounded-lg border px-3 py-2 text-[11px] transition-all",
              isAnswered && isCorrect
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : showResult && !isCorrect
                  ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                  : isSelected
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/30 bg-elevated/30 text-foreground-muted hover:bg-elevated/60 hover:text-foreground",
              isAnswered && "cursor-default",
            )}
          >
            <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px] font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            {option}
            {isAnswered && isCorrect && (
              <CheckCircle2 className="ml-auto inline h-3.5 w-3.5 text-emerald-400" />
            )}
            {showResult && !isCorrect && isSelected && (
              <XCircle className="ml-auto inline h-3.5 w-3.5 text-red-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Click-class checkpoint */
function ClickClassCheckpoint({
  checkpoint,
  state,
}: {
  checkpoint: WalkthroughCheckpoint;
  state: CheckpointState;
}) {
  const isAnswered = state.status === "correct" || state.status === "revealed";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2",
          isAnswered
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-primary/30 bg-primary/5 animate-pulse",
        )}
      >
        <MousePointerClick
          className={cn(
            "h-4 w-4 shrink-0",
            isAnswered ? "text-emerald-400" : "text-primary",
          )}
        />
        <span className="text-[11px] text-foreground-muted">
          {isAnswered
            ? "Correct class selected!"
            : "Click the correct class on the canvas above"}
        </span>
      </div>
      {state.status === "incorrect" && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          That is not the right class. Try again! ({2 - state.attempts} {2 - state.attempts === 1 ? "retry" : "retries"} left)
        </p>
      )}
    </div>
  );
}

/** Fill-in-the-blank checkpoint */
function FillBlankCheckpoint({
  checkpoint,
  state,
  onAnswer,
}: {
  checkpoint: WalkthroughCheckpoint;
  state: CheckpointState;
  onAnswer: (answers: string[]) => void;
}) {
  const { blankTemplate = "", answers: correctAnswers = [] } = checkpoint;
  const isAnswered = state.status === "correct" || state.status === "revealed";
  const [localAnswers, setLocalAnswers] = useState<string[]>(
    state.filledAnswers ?? correctAnswers.map(() => ""),
  );

  // Split template by blanks
  const parts = blankTemplate.split("___");
  const blankCount = parts.length - 1;

  const handleSubmit = () => {
    onAnswer(localAnswers);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/30 bg-elevated/30 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {parts.map((part: string, i: number) => (
            <span key={i}>
              {part}
              {i < blankCount && (
                isAnswered ? (
                  <span
                    className={cn(
                      "inline-block min-w-[80px] rounded border-b-2 px-1 font-semibold",
                      state.status === "correct" || state.status === "revealed"
                        ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "border-red-500 text-red-700 dark:text-red-300",
                    )}
                  >
                    {state.status === "revealed" ? correctAnswers[i] : localAnswers[i]}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={localAnswers[i] ?? ""}
                    onChange={(e: { target: { value: string } }) => {
                      const next = [...localAnswers];
                      next[i] = e.target.value;
                      setLocalAnswers(next);
                    }}
                    placeholder={`blank ${i + 1}`}
                    className="inline-block w-[120px] rounded border border-border/40 bg-surface/50 px-1.5 py-0.5 text-[11px] text-foreground placeholder:text-foreground-subtle/40 focus:border-primary/50 focus:outline-none"
                  />
                )
              )}
            </span>
          ))}
        </p>
      </div>
      {!isAnswered && (
        <button
          onClick={handleSubmit}
          disabled={localAnswers.some((a: string) => !a.trim())}
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      )}
      {state.status === "incorrect" && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Not quite right. Try again! ({2 - state.attempts} {2 - state.attempts === 1 ? "retry" : "retries"} left)
        </p>
      )}
    </div>
  );
}

/** Order-steps checkpoint (drag to reorder) */
function OrderStepsCheckpoint({
  checkpoint,
  state,
  onAnswer,
}: {
  checkpoint: WalkthroughCheckpoint;
  state: CheckpointState;
  onAnswer: (order: number[]) => void;
}) {
  const { items = [], correctOrder = [] } = checkpoint;
  const isAnswered = state.status === "correct" || state.status === "revealed";

  // Track the user's ordering as indices into the original items array
  const [userOrder, setUserOrder] = useState<number[]>(() => {
    if (state.orderedItems) return state.orderedItems;
    // Shuffle items for initial presentation
    const indices = items.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (isAnswered) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index || isAnswered) return;
    const next = [...userOrder];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setUserOrder(next);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const moveItem = (fromIdx: number, direction: -1 | 1) => {
    if (isAnswered) return;
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= userOrder.length) return;
    const next = [...userOrder];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    setUserOrder(next);
  };

  const handleSubmit = () => {
    onAnswer(userOrder);
  };

  return (
    <div className="space-y-2">
      {userOrder.map((itemIdx: number, posIdx: number) => {
        const isCorrectPosition =
          isAnswered && correctOrder[posIdx] === itemIdx;
        const showCorrectPosition =
          state.status === "revealed" && correctOrder[posIdx] !== itemIdx;

        return (
          <div
            key={itemIdx}
            draggable={!isAnswered}
            onDragStart={() => handleDragStart(posIdx)}
            onDragOver={(e: DragEvent<HTMLDivElement>) => handleDragOver(e, posIdx)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] transition-all",
              dragIndex === posIdx && "opacity-50",
              isCorrectPosition
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : showCorrectPosition
                  ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                  : "border-border/30 bg-elevated/30 text-foreground-muted",
              !isAnswered && "cursor-grab active:cursor-grabbing",
            )}
          >
            {!isAnswered && (
              <div className="flex flex-col -my-1">
                <button
                  onClick={() => moveItem(posIdx, -1)}
                  disabled={posIdx === 0}
                  className="text-foreground-subtle/50 hover:text-foreground-subtle disabled:opacity-20 p-0 leading-none text-[8px]"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(posIdx, 1)}
                  disabled={posIdx === userOrder.length - 1}
                  className="text-foreground-subtle/50 hover:text-foreground-subtle disabled:opacity-20 p-0 leading-none text-[8px]"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            )}
            <GripVertical className="h-3 w-3 shrink-0 text-foreground-subtle/40" />
            <span className="mr-1 text-[10px] font-bold text-foreground-subtle/60">
              {posIdx + 1}.
            </span>
            <span className="flex-1">{items[itemIdx]}</span>
            {isCorrectPosition && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            )}
            {showCorrectPosition && (
              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            )}
          </div>
        );
      })}
      {!isAnswered && (
        <button
          onClick={handleSubmit}
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary/20"
        >
          Check Order
        </button>
      )}
      {state.status === "incorrect" && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Not in the right order. Try again! ({2 - state.attempts} {2 - state.attempts === 1 ? "retry" : "retries"} left)
        </p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export const WalkthroughPlayer = memo(function WalkthroughPlayer({
  pattern,
  onHighlightClasses,
  onClassClicked,
}: WalkthroughPlayerProps) {
  const { data, isLoading } = useCatalog("lld", "pattern-walkthrough", { full: true });
  const { data: checkpointData } = useCatalog("lld", "walkthrough-checkpoint", { full: true });
  const [stepIndex, setStepIndex] = useState(0);
  const [checkpointStates, setCheckpointStates] = useState<Record<number, CheckpointState>>({});
  const [showExplanation, setShowExplanation] = useState<number | null>(null);
  const [flashGreen, setFlashGreen] = useState(false);

  // Find walkthrough for this pattern by slug
  const walkthrough = useMemo(() => {
    if (!data?.items) return null;
    const item = data.items.find(
      (i: unknown) => (i as ContentDetailItem).slug === pattern.id,
    ) as unknown as ContentDetailItem | undefined;
    if (!item?.content) return null;
    const steps = (item.content.steps ?? item.content.walkthrough) as WalkthroughStep[] | undefined;
    return steps && steps.length > 0 ? steps : null;
  }, [data, pattern.id]);

  // Find checkpoints for this pattern
  const checkpoints = useMemo(() => {
    if (!checkpointData?.items) return null;
    const item = checkpointData.items.find(
      (i: unknown) => (i as ContentDetailItem).slug === pattern.id,
    ) as unknown as ContentDetailItem | undefined;
    if (!item?.content) return null;
    return (item.content.checkpoints ?? []) as StepCheckpointData[];
  }, [checkpointData, pattern.id]);

  // Merge checkpoints into walkthrough steps
  const stepsWithCheckpoints = useMemo(() => {
    if (!walkthrough) return null;
    if (!checkpoints || checkpoints.length === 0) return walkthrough;

    return walkthrough.map((step: WalkthroughStep, i: number) => {
      const stepNum = i + 1; // steps are 1-indexed in seed data
      const cp = checkpoints.find((c: StepCheckpointData) => c.stepNumber === stepNum);
      if (cp) {
        return { ...step, checkpoint: cp.checkpoint };
      }
      return step;
    });
  }, [walkthrough, checkpoints]);

  // Reset state when pattern changes
  const patternId = pattern.id;
  const [prevPatternId, setPrevPatternId] = useState(patternId);
  if (patternId !== prevPatternId) {
    setStepIndex(0);
    setCheckpointStates({});
    setShowExplanation(null);
    setFlashGreen(false);
    setPrevPatternId(patternId);
  }

  // Calculate score
  const scoreInfo = useMemo(() => {
    if (!stepsWithCheckpoints) return { total: 0, passed: 0 };
    const total = stepsWithCheckpoints.filter((s: WalkthroughStep) => s.checkpoint).length;
    const allStates = Object.values(checkpointStates) as CheckpointState[];
    const passed = allStates.filter(
      (s) => s.status === "correct",
    ).length;
    return { total, passed };
  }, [stepsWithCheckpoints, checkpointStates]);

  // Current step checkpoint
  const currentCheckpoint = stepsWithCheckpoints?.[stepIndex]?.checkpoint ?? null;
  const currentCheckpointState = checkpointStates[stepIndex] ?? {
    status: "unanswered" as CheckpointStatus,
    attempts: 0,
  };

  // Handle highlight for click-class checkpoints
  const prevHighlightRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (!onHighlightClasses) return;
    if (
      currentCheckpoint?.type === "click-class" &&
      currentCheckpointState.status === "unanswered"
    ) {
      // Don't reveal the answer - just signal that click-class is active
      // The parent should make ALL classes clickable
      if (prevHighlightRef.current !== null) return; // already set
      onHighlightClasses([]); // empty = "make all clickable"
      prevHighlightRef.current = [];
    } else {
      if (prevHighlightRef.current !== null) {
        onHighlightClasses([]); // clear
        prevHighlightRef.current = null;
      }
    }
  }, [currentCheckpoint, currentCheckpointState.status, onHighlightClasses]);

  // Handle canvas class clicks for click-class checkpoints
  useEffect(() => {
    if (
      !onClassClicked ||
      !currentCheckpoint ||
      currentCheckpoint.type !== "click-class" ||
      currentCheckpointState.status === "correct" ||
      currentCheckpointState.status === "revealed"
    ) {
      return;
    }

    const correctIds = currentCheckpoint.correctClassIds ?? [];
    const isCorrect = correctIds.includes(onClassClicked);

    handleCheckpointAnswer(isCorrect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClassClicked]);

  // Central answer handler
  const handleCheckpointAnswer = useCallback(
    (isCorrect: boolean) => {
      setCheckpointStates((prev: Record<number, CheckpointState>) => {
        const current = prev[stepIndex] ?? { status: "unanswered" as CheckpointStatus, attempts: 0 };
        if (current.status === "correct" || current.status === "revealed") return prev;

        if (isCorrect) {
          setFlashGreen(true);
          setTimeout(() => setFlashGreen(false), 600);
          setShowExplanation(stepIndex);
          return {
            ...prev,
            [stepIndex]: { ...current, status: "correct", attempts: current.attempts + 1 },
          };
        }

        const newAttempts = current.attempts + 1;
        if (newAttempts >= 2) {
          // Max retries reached - reveal the answer
          setShowExplanation(stepIndex);
          return {
            ...prev,
            [stepIndex]: { ...current, status: "revealed", attempts: newAttempts },
          };
        }

        return {
          ...prev,
          [stepIndex]: { ...current, status: "incorrect", attempts: newAttempts },
        };
      });
    },
    [stepIndex],
  );

  // Multiple-choice handler
  const handleMCAnswer = useCallback(
    (index: number) => {
      if (!currentCheckpoint) return;
      const isCorrect = index === currentCheckpoint.correctIndex;
      setCheckpointStates((prev: Record<number, CheckpointState>) => ({
        ...prev,
        [stepIndex]: {
          ...(prev[stepIndex] ?? { status: "unanswered" as CheckpointStatus, attempts: 0 }),
          selectedOption: index,
        },
      }));
      handleCheckpointAnswer(isCorrect);
    },
    [currentCheckpoint, stepIndex, handleCheckpointAnswer],
  );

  // Fill-blank handler
  const handleFillBlankAnswer = useCallback(
    (answers: string[]) => {
      if (!currentCheckpoint) return;
      const correctAnswers = currentCheckpoint.answers ?? [];
      const isCorrect = answers.every(
        (a: string, i: number) =>
          a.trim().toLowerCase() === (correctAnswers[i] ?? "").toLowerCase(),
      );
      setCheckpointStates((prev: Record<number, CheckpointState>) => ({
        ...prev,
        [stepIndex]: {
          ...(prev[stepIndex] ?? { status: "unanswered" as CheckpointStatus, attempts: 0 }),
          filledAnswers: answers,
        },
      }));
      handleCheckpointAnswer(isCorrect);
    },
    [currentCheckpoint, stepIndex, handleCheckpointAnswer],
  );

  // Order-steps handler
  const handleOrderAnswer = useCallback(
    (order: number[]) => {
      if (!currentCheckpoint) return;
      const correctOrder = currentCheckpoint.correctOrder ?? [];
      const isCorrect = order.every((val: number, i: number) => val === correctOrder[i]);
      setCheckpointStates((prev: Record<number, CheckpointState>) => ({
        ...prev,
        [stepIndex]: {
          ...(prev[stepIndex] ?? { status: "unanswered" as CheckpointStatus, attempts: 0 }),
          orderedItems: order,
        },
      }));
      handleCheckpointAnswer(isCorrect);
    },
    [currentCheckpoint, stepIndex, handleCheckpointAnswer],
  );

  // Can proceed to next step?
  const canProceed = !currentCheckpoint ||
    currentCheckpointState.status === "correct" ||
    currentCheckpointState.status === "revealed";

  // ── Render ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span className="text-[10px] text-foreground-subtle">Loading walkthrough...</span>
        </div>
      </div>
    );
  }

  if (!stepsWithCheckpoints) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 text-foreground-subtle/50" />
          <span className="text-[10px] text-foreground-subtle">No walkthrough available</span>
        </div>
      </div>
    );
  }

  const step = stepsWithCheckpoints[stepIndex];
  const total = stepsWithCheckpoints.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <div
      className={cn(
        "border-b border-border/30 px-4 py-3 space-y-3 transition-colors duration-500",
        flashGreen && "bg-emerald-500/5",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Footprints className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Walkthrough
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Score tracker */}
          {scoreInfo.total > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {scoreInfo.passed}/{scoreInfo.total}
              </span>
            </div>
          )}
          <span className="text-[10px] text-foreground-subtle">
            Step {stepIndex + 1} of {total}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {step.description}
        </p>
        {step.keyInsight && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-600/20 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 backdrop-blur-sm px-3 py-2">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] font-medium leading-relaxed text-amber-800 dark:text-amber-300">
              {step.keyInsight}
            </p>
          </div>
        )}
      </div>

      {/* Checkpoint */}
      {currentCheckpoint && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold text-primary">
            {currentCheckpoint.question}
          </p>

          {currentCheckpoint.type === "multiple-choice" && (
            <MultipleChoiceCheckpoint
              checkpoint={currentCheckpoint}
              state={currentCheckpointState}
              onAnswer={handleMCAnswer}
            />
          )}

          {currentCheckpoint.type === "click-class" && (
            <ClickClassCheckpoint
              checkpoint={currentCheckpoint}
              state={currentCheckpointState}
            />
          )}

          {currentCheckpoint.type === "fill-blank" && (
            <FillBlankCheckpoint
              checkpoint={currentCheckpoint}
              state={currentCheckpointState}
              onAnswer={handleFillBlankAnswer}
            />
          )}

          {currentCheckpoint.type === "order-steps" && (
            <OrderStepsCheckpoint
              checkpoint={currentCheckpoint}
              state={currentCheckpointState}
              onAnswer={handleOrderAnswer}
            />
          )}

          {/* Explanation (shown after answering) */}
          {showExplanation === stepIndex && (
            <div
              className={cn(
                "mt-2 rounded-lg border px-3 py-2",
                currentCheckpointState.status === "correct"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-amber-500/20 bg-amber-500/5",
              )}
            >
              <p
                className={cn(
                  "text-[10px] leading-relaxed",
                  currentCheckpointState.status === "correct"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-800 dark:text-amber-300",
                )}
              >
                {currentCheckpointState.status === "correct" && (
                  <span className="font-semibold">Correct! </span>
                )}
                {currentCheckpointState.status === "revealed" && (
                  <span className="font-semibold">Here is the answer: </span>
                )}
                {currentCheckpoint.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setStepIndex((i: number) => i - 1);
            setShowExplanation(null);
          }}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
            isFirst
              ? "border-border/20 text-foreground-subtle/40 cursor-not-allowed"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <ChevronLeft className="h-3 w-3" /> Previous
        </button>

        {/* Step dots */}
        <div className="flex gap-1">
          {stepsWithCheckpoints.map((s: WalkthroughStep, i: number) => {
            const cpState = checkpointStates[i];
            const hasCheckpoint = !!s.checkpoint;
            const isPassed = cpState?.status === "correct";
            const isRevealed = cpState?.status === "revealed";

            return (
              <button
                key={i}
                onClick={() => {
                  // Allow clicking to previously visited steps
                  if (i <= stepIndex || !stepsWithCheckpoints[i - 1]?.checkpoint ||
                      checkpointStates[i - 1]?.status === "correct" ||
                      checkpointStates[i - 1]?.status === "revealed") {
                    setStepIndex(i);
                    setShowExplanation(null);
                  }
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex
                    ? "w-4 bg-gradient-to-r from-primary to-violet-400"
                    : hasCheckpoint && isPassed
                      ? "w-2 bg-emerald-500"
                      : hasCheckpoint && isRevealed
                        ? "w-2 bg-amber-500"
                        : "w-1.5 bg-border/50 hover:bg-border",
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            );
          })}
        </div>

        <button
          onClick={() => {
            if (canProceed) {
              setStepIndex((i: number) => i + 1);
              setShowExplanation(null);
            }
          }}
          disabled={isLast || !canProceed}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
            isLast || !canProceed
              ? "border-border/20 text-foreground-subtle/40 cursor-not-allowed"
              : "border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
});
