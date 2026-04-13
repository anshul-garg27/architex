"use client";

import React, { memo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IsolationLevel } from "@/lib/database";
import type { TransactionStep, CompareResult, PredictionPrompt } from "@/lib/database";

const TransactionStepCard = memo(function TransactionStepCard({
  step,
  isDivergence,
  isCurrent,
  isPast,
}: {
  step: TransactionStep;
  isDivergence?: boolean;
  isCurrent?: boolean;
  isPast?: boolean;
}) {
  const isAnomaly = !!step.anomaly;

  const anomalyLabel: Record<string, string> = {
    "dirty-read": "DIRTY READ",
    "non-repeatable-read": "NON-REPEATABLE READ",
    "phantom-read": "PHANTOM READ",
    "write-skew": "WRITE SKEW",
    "lost-update": "LOST UPDATE",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all",
        isAnomaly
          ? "animate-pulse border-red-500/30 bg-red-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          : isDivergence
            ? "border-amber-500/30 bg-amber-500/5 backdrop-blur-sm"
            : "border-border/30 bg-elevated/50 backdrop-blur-sm",
        isCurrent && "border-l-[3px] border-l-primary scale-[1.02]",
        isPast && "opacity-60",
      )}
      style={isAnomaly ? { animationDuration: "1.5s", animationIterationCount: "3" } : undefined}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[10px] text-foreground-subtle">
          t={step.tick}
        </span>
        {isAnomaly && (
          <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="h-3 w-3" />
            {anomalyLabel[step.anomaly!]}
          </span>
        )}
        {isDivergence && !isAnomaly && (
          <span className="flex items-center gap-1 rounded-full bg-amber-800/50 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            DIVERGENCE
          </span>
        )}
      </div>
      <p className="mb-1 font-mono text-xs text-foreground">
        {step.action}
      </p>
      <p className="text-[11px] text-foreground-muted">{step.description}</p>
    </div>
  );
});

// ── Prediction Overlay ───────────────────────────────────────

const PredictionOverlay = memo(function PredictionOverlay({
  prompt,
  selectedOption,
  onSelect,
}: {
  prompt: PredictionPrompt;
  selectedOption: number | null;
  onSelect: (idx: number) => void;
}) {
  const hasAnswered = selectedOption !== null;
  const isCorrect = hasAnswered && prompt.options[selectedOption]?.correct;

  return (
    <div className="mx-auto mb-4 w-full max-w-xl rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-5 shadow-[0_0_15px_rgba(110,86,207,0.05)]">
      <div className="mb-3 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
          Prediction Challenge
        </span>
      </div>
      <p className="mb-4 text-sm text-foreground">{prompt.question}</p>
      <div className="space-y-2">
        {prompt.options.map((opt, i) => {
          const selected = selectedOption === i;
          const showCorrect = hasAnswered && opt.correct;
          const showWrong = selected && !opt.correct;
          return (
            <button
              key={i}
              onClick={() => !hasAnswered && onSelect(i)}
              disabled={hasAnswered}
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                !hasAnswered && "cursor-pointer hover:bg-primary/10",
                !hasAnswered && "border-primary/30 bg-primary/5 text-foreground",
                showCorrect && "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
                showWrong && "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
                hasAnswered && !showCorrect && !showWrong && "border-border/50 bg-elevated/50 text-foreground-subtle opacity-60",
              )}
            >
              <span className="flex items-center gap-2">
                {showCorrect && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                {showWrong && <XCircle className="h-4 w-4 text-red-400" />}
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {hasAnswered && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-3 text-xs",
            isCorrect
              ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300"
              : "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300",
          )}
        >
          <p className="mb-1 font-bold">
            {isCorrect ? "Correct!" : "Not quite..."}
          </p>
          <p className="text-foreground-muted">{prompt.explanation}</p>
        </div>
      )}
    </div>
  );
});

// ── Level Label Map ──────────────────────────────────────────

const levelLabel: Record<IsolationLevel, string> = {
  "read-uncommitted": "READ UNCOMMITTED",
  "read-committed": "READ COMMITTED",
  "repeatable-read": "REPEATABLE READ",
  serializable: "SERIALIZABLE",
};

// ── Compare View ─────────────────────────────────────────────

const CompareView = memo(function CompareView({
  compareResult,
  stepIndex,
}: {
  compareResult: CompareResult;
  stepIndex: number;
}) {
  const leftVisible = compareResult.left.slice(0, stepIndex + 1);
  const rightVisible = compareResult.right.slice(0, stepIndex + 1);

  const leftT1 = leftVisible.filter((s) => s.tx === "T1");
  const leftT2 = leftVisible.filter((s) => s.tx === "T2");
  const rightT1 = rightVisible.filter((s) => s.tx === "T1");
  const rightT2 = rightVisible.filter((s) => s.tx === "T2");

  const divergeSet = new Set(compareResult.divergenceTicks);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-4">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-400" /> Normal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Anomaly</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Divergence</span>
      </div>

      {/* Level badges side by side */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 text-center">
          <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm shadow-[0_0_8px_rgba(245,158,11,0.1)] px-3 py-1 text-xs font-bold text-amber-400">
            {compareResult.leftLabel}
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className="inline-block rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm shadow-[0_0_8px_rgba(34,197,94,0.1)] px-3 py-1 text-xs font-bold text-green-400">
            {compareResult.rightLabel}
          </span>
        </div>
      </div>

      {/* 4 columns: left T1 | left T2 || right T1 | right T2 */}
      <div className="flex flex-1 gap-2" aria-live="polite" role="status">
        {/* Left pair */}
        <div className="flex-1">
          <div className="mb-2 rounded-xl bg-blue-500/10 py-1 text-center">
            <span className="text-[10px] font-bold text-blue-300">T1</span>
          </div>
          <div className="space-y-2">
            {leftT1.map((step, i) => (
              <TransactionStepCard key={i} step={step} isDivergence={divergeSet.has(step.tick)} isCurrent={i === leftT1.length - 1} isPast={i < leftT1.length - 1} />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2 rounded-xl bg-purple-500/10 py-1 text-center">
            <span className="text-[10px] font-bold text-purple-300">T2</span>
          </div>
          <div className="space-y-2">
            {leftT2.map((step, i) => (
              <TransactionStepCard key={i} step={step} isDivergence={divergeSet.has(step.tick)} isCurrent={i === leftT2.length - 1} isPast={i < leftT2.length - 1} />
            ))}
          </div>
        </div>

        {/* Center divider */}
        <div className="mx-1 flex flex-col items-center justify-center">
          <div className="h-full w-px bg-border" />
          <Columns2 className="my-2 h-4 w-4 text-foreground-subtle" />
          <div className="h-full w-px bg-border" />
        </div>

        {/* Right pair */}
        <div className="flex-1">
          <div className="mb-2 rounded-xl bg-blue-500/10 py-1 text-center">
            <span className="text-[10px] font-bold text-blue-300">T1</span>
          </div>
          <div className="space-y-2">
            {rightT1.map((step, i) => (
              <TransactionStepCard key={i} step={step} isDivergence={divergeSet.has(step.tick)} isCurrent={i === rightT1.length - 1} isPast={i < rightT1.length - 1} />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2 rounded-xl bg-purple-500/10 py-1 text-center">
            <span className="text-[10px] font-bold text-purple-300">T2</span>
          </div>
          <div className="space-y-2">
            {rightT2.map((step, i) => (
              <TransactionStepCard key={i} step={step} isDivergence={divergeSet.has(step.tick)} isCurrent={i === rightT2.length - 1} isPast={i < rightT2.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Divergence summary */}
      {stepIndex >= Math.max(compareResult.left.length, compareResult.right.length) - 1 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
          <p className="text-sm text-amber-300">
            <AlertTriangle className="mb-0.5 mr-1 inline h-4 w-4" />
            {compareResult.leftLabel} shows the anomaly.{" "}
            {compareResult.rightLabel} prevents it.
          </p>
        </div>
      )}
    </div>
  );
});

// ── Main Canvas ──────────────────────────────────────────────

const TransactionCanvas = memo(function TransactionCanvas({
  steps,
  stepIndex,
  level,
  // Compare mode props
  compareMode,
  compareResult,
  compareStepIndex,
  // Prediction mode props
  predictionMode,
  predictionPrompt,
  predictionPaused,
  predictionSelectedOption,
  onPredictionSelect,
  predictionScore,
}: {
  steps: TransactionStep[];
  stepIndex: number;
  level: IsolationLevel;
  // Compare mode
  compareMode?: boolean;
  compareResult?: CompareResult | null;
  compareStepIndex?: number;
  // Prediction mode
  predictionMode?: boolean;
  predictionPrompt?: PredictionPrompt | null;
  predictionPaused?: boolean;
  predictionSelectedOption?: number | null;
  onPredictionSelect?: (idx: number) => void;
  predictionScore?: { correct: number; total: number };
}) {
  // Compare mode view
  if (compareMode && compareResult) {
    return (
      <CompareView
        compareResult={compareResult}
        stepIndex={compareStepIndex ?? 0}
      />
    );
  }

  // Normal single-level view
  const visible = steps.slice(0, stepIndex + 1);
  const t1Steps = visible.filter((s) => s.tx === "T1");
  const t2Steps = visible.filter((s) => s.tx === "T2");

  return (
    <div
      role="img"
      aria-label={`Transaction isolation timeline showing ${levelLabel[level]}`}
      className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-6"
    >
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-400"/> Normal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/> Anomaly</span>
        {predictionMode && predictionScore && (
          <span className="ml-auto flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
            Score: {predictionScore.correct}/{predictionScore.total}
          </span>
        )}
      </div>

      {/* Level badge */}
      <div className="mb-4 text-center">
        <span
          className={cn(
            "inline-block rounded-full border px-3 py-1 text-xs font-bold",
            level === "serializable"
              ? "border-green-500/30 bg-green-500/10 backdrop-blur-sm shadow-[0_0_8px_rgba(34,197,94,0.1)] text-green-400"
              : "border-amber-500/30 bg-amber-500/10 backdrop-blur-sm shadow-[0_0_8px_rgba(245,158,11,0.1)] text-amber-400",
          )}
        >
          {levelLabel[level]}
        </span>
      </div>

      {/* Prediction overlay -- shown when paused before critical step */}
      {predictionMode && predictionPaused && predictionPrompt && onPredictionSelect && (
        <PredictionOverlay
          prompt={predictionPrompt}
          selectedOption={predictionSelectedOption ?? null}
          onSelect={onPredictionSelect}
        />
      )}

      {/* Two side-by-side timelines */}
      <div className="flex flex-1 gap-6" aria-live="polite" role="status">
        {/* T1 column */}
        <div className="flex-1">
          <div className="mb-3 rounded-xl bg-blue-500/10 py-1.5 text-center">
            <span className="text-xs font-bold text-blue-300">
              Transaction T1
            </span>
          </div>
          <div className="space-y-2">
            {t1Steps.map((step, i) => (
              <TransactionStepCard key={i} step={step} isCurrent={i === t1Steps.length - 1} isPast={i < t1Steps.length - 1} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border" />

        {/* T2 column */}
        <div className="flex-1">
          <div className="mb-3 rounded-xl bg-purple-500/10 py-1.5 text-center">
            <span className="text-xs font-bold text-purple-300">
              Transaction T2
            </span>
          </div>
          <div className="space-y-2">
            {t2Steps.map((step, i) => (
              <TransactionStepCard key={i} step={step} isCurrent={i === t2Steps.length - 1} isPast={i < t2Steps.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Serializable success banner */}
      {level === "serializable" && stepIndex >= steps.length - 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            No anomalies -- full serializability maintained
          </span>
        </div>
      )}
    </div>
  );
});

export default TransactionCanvas;
export { TransactionStepCard, PredictionOverlay, CompareView };
