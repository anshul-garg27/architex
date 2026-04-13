"use client";

import React, { memo, useMemo, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HashBucket, HashIndexState, HashIndexStep } from "@/lib/database";
import { useInactivityPrompt } from "@/hooks/useInactivityPrompt";
import InactivityNudge from "@/components/shared/InactivityNudge";

// ── Animation constants (from database-visual-language.md) ──

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION_ENTRY = "200ms";
const DURATION_MOVEMENT = "300ms";
const DURATION_FLASH = "300ms";

// ── Constants ────────────────────────────────────────────────

export const HASH_BUCKET_W = 120;
export const HASH_BUCKET_H = 32;
export const HASH_ENTRY_H = 24;
export const HASH_BUCKET_GAP = 16;
export const HASH_OVERFLOW_GAP = 24;

// ── Types ────────────────────────────────────────────────────

interface HashIndexCanvasProps {
  state: HashIndexState;
  steps: HashIndexStep[];
  stepIndex: number;
  highlightBucket?: number;
  highlightKey?: string;
  onLoadSample?: () => void;
  // Prediction mode (DBL-130)
  predictionMode?: boolean;
  predictionPaused?: boolean;
  predictionQuestion?: string | null;
  predictionOptions?: Array<{ label: string; bucketIndex: number }>;
  predictionCorrectIndex?: number;
  predictionSelectedOption?: number | null;
  predictionExplanation?: string;
  predictionScore?: { correct: number; total: number };
  onPredictionSelect?: (bucketIndex: number) => void;
  predictionCollisionPhase?: boolean;
  predictionCollisionOptions?: Array<{ label: string; correct: boolean }>;
  predictionCollisionSelected?: number | null;
  predictionCollisionExplanation?: string;
  onPredictionCollisionSelect?: (idx: number) => void;
}

// ── Component ────────────────────────────────────────────────

/** Collect all entry keys from hash state for tracking new entries. */
function collectEntryKeys(st: HashIndexState): Set<string> {
  const keys = new Set<string>();
  for (const bucket of st.buckets) {
    let cur: HashBucket | undefined = bucket;
    while (cur) {
      for (const e of cur.entries) {
        keys.add(`${cur.index}-${e.key}`);
      }
      cur = cur.overflow;
    }
  }
  return keys;
}

const HashIndexCanvas = memo(function HashIndexCanvas({
  state,
  steps,
  stepIndex,
  highlightBucket,
  highlightKey,
  onLoadSample,
  predictionMode,
  predictionPaused,
  predictionQuestion,
  predictionOptions,
  predictionCorrectIndex,
  predictionSelectedOption,
  predictionExplanation,
  predictionScore,
  onPredictionSelect,
  predictionCollisionPhase,
  predictionCollisionOptions,
  predictionCollisionSelected,
  predictionCollisionExplanation,
  onPredictionCollisionSelect,
}: HashIndexCanvasProps) {
  // Track known entry keys for slide-in animation on new entries
  const prevEntryKeysRef = useRef<Set<string>>(new Set());
  const currentEntryKeys = useMemo(() => collectEntryKeys(state), [state]);

  const knownEntryKeys = prevEntryKeysRef.current;

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      prevEntryKeysRef.current = new Set(currentEntryKeys);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentEntryKeys]);

  // Detect if current step is a collision for flash effect
  const currentStep = steps[stepIndex] as HashIndexStep | undefined;
  const isCollisionStep = currentStep?.operation === "collision";
  const collisionBucketIdx = isCollisionStep ? highlightBucket : undefined;

  const isEmpty = state.size === 0 && steps.length === 0;

  const { showPrompt: showInactivityPrompt, dismiss: dismissInactivity } =
    useInactivityPrompt("hash-index", isEmpty);

  if (isEmpty) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated/80 to-background">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
              <rect x="2" y="3" width="5" height="18" rx="1" />
              <rect x="9.5" y="3" width="5" height="18" rx="1" />
              <rect x="17" y="3" width="5" height="18" rx="1" />
              <path d="M4.5 8h0M12 8h0M19.5 8h0" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-2 text-sm font-medium text-foreground">
            O(1) lookup — instant, no matter the table size. See how.
          </p>
          <p className="mb-4 text-xs text-foreground-muted">
            Watch keys get hashed into buckets, with overflow chains for collisions.
          </p>
          {onLoadSample && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Insert sample entries
            </button>
          )}
        </div>
        <InactivityNudge
          show={showInactivityPrompt}
          onDismiss={dismissInactivity}
          message="Not sure where to start? Try inserting 42"
        />
      </div>
    );
  }

  // Compute max chain depth for sizing
  const chainDepths = useMemo(() => {
    return state.buckets.map((bucket) => {
      let depth = 0;
      let cur = bucket.overflow;
      while (cur) {
        depth++;
        cur = cur.overflow;
      }
      return depth;
    });
  }, [state.buckets]);

  // Compute SVG dimensions
  const maxChainDepth = Math.max(0, ...chainDepths);
  const svgWidth = Math.max(
    state.buckets.length * (HASH_BUCKET_W + HASH_BUCKET_GAP) + 60,
    400,
  );
  const maxEntries = Math.max(
    1,
    ...state.buckets.map((b) => {
      let max = b.entries.length;
      let cur = b.overflow;
      while (cur) {
        max = Math.max(max, cur.entries.length);
        cur = cur.overflow;
      }
      return max;
    }),
  );
  const bucketTotalH = HASH_BUCKET_H + maxEntries * HASH_ENTRY_H + 8;
  const svgHeight = Math.max(
    120 + bucketTotalH + (maxChainDepth * (bucketTotalH + HASH_OVERFLOW_GAP)),
    300,
  );

  function renderBucket(
    bucket: HashBucket,
    x: number,
    y: number,
    isOverflow: boolean,
    overflowDepth: number,
  ): React.ReactNode {
    const isHL = bucket.index === highlightBucket;
    const isColliding = bucket.index === collisionBucketIdx;
    const entryH = HASH_ENTRY_H;
    const headerH = HASH_BUCKET_H;
    const totalH = headerH + Math.max(bucket.entries.length, 1) * entryH + 8;

    // Bucket-level transition for smooth highlight/glow changes
    const bucketStyle: React.CSSProperties = {
      transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}, filter ${DURATION_MOVEMENT} ${EASE_OUT}`,
      filter: isHL ? 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' : 'none',
    };

    // Collision flash: amber border stroke via animation
    const collisionStroke = isColliding
      ? 'var(--state-warning, #eab308)'
      : isHL
        ? 'var(--primary)'
        : isOverflow
          ? 'var(--viz-overflow, #6366f1)'
          : 'var(--border)';

    return (
      <g key={`bucket-${bucket.index}-d${overflowDepth}-${x}`} style={bucketStyle}>
        {/* Bucket rectangle */}
        <rect
          x={x}
          y={y}
          width={HASH_BUCKET_W}
          height={totalH}
          rx={6}
          style={{
            fill: isHL ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--surface)',
            stroke: collisionStroke,
            transition: `fill ${DURATION_ENTRY} ${EASE_OUT}, stroke ${DURATION_FLASH} ${EASE_OUT}, stroke-width ${DURATION_ENTRY} ${EASE_OUT}`,
          }}
          strokeWidth={isColliding ? 2.5 : isHL ? 2 : 1}
          strokeDasharray={isOverflow ? "4,2" : undefined}
        />
        {/* Header */}
        <rect
          x={x}
          y={y}
          width={HASH_BUCKET_W}
          height={headerH}
          rx={6}
          style={{
            fill: isHL ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--elevated)',
            transition: `fill ${DURATION_ENTRY} ${EASE_OUT}`,
          }}
        />
        <rect
          x={x}
          y={y + headerH - 6}
          width={HASH_BUCKET_W}
          height={6}
          style={{
            fill: isHL ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--elevated)',
            transition: `fill ${DURATION_ENTRY} ${EASE_OUT}`,
          }}
        />
        <text
          x={x + HASH_BUCKET_W / 2}
          y={y + 20}
          textAnchor="middle"
          style={{
            fill: isHL ? 'var(--primary-light, #93c5fd)' : 'var(--foreground)',
            transition: `fill ${DURATION_ENTRY} ${EASE_OUT}`,
          }}
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
        >
          {isOverflow ? `overflow #${overflowDepth}` : `Bucket ${bucket.index}`}
        </text>

        {/* Entries stacked inside bucket — new entries slide in */}
        {bucket.entries.map((entry, i) => {
          const ey = y + headerH + i * entryH + 4;
          const isEntryHL = isHL && entry.key === highlightKey;
          const entryId = `${bucket.index}-${entry.key}`;
          const isNewEntry = !knownEntryKeys.has(entryId);
          return (
            <g
              key={`entry-${entry.key}-${i}`}
              style={{
                opacity: isNewEntry ? 0 : 1,
                transform: isNewEntry ? 'translateY(-8px)' : 'translateY(0)',
                transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}, transform ${DURATION_ENTRY} ${EASE_OUT}`,
              }}
            >
              {isEntryHL && (
                <rect
                  x={x + 4}
                  y={ey}
                  width={HASH_BUCKET_W - 8}
                  height={entryH - 2}
                  rx={3}
                  style={{
                    fill: 'var(--primary)',
                    transition: `opacity ${DURATION_ENTRY} ${EASE_OUT}`,
                  }}
                  opacity={0.25}
                />
              )}
              <text
                x={x + 8}
                y={ey + 15}
                style={{
                  fill: isEntryHL ? 'var(--primary-light, #93c5fd)' : 'var(--foreground-muted)',
                  transition: `fill ${DURATION_ENTRY} ${EASE_OUT}`,
                }}
                fontSize="10"
                fontFamily="monospace"
                fontWeight={isEntryHL ? "700" : "400"}
              >
                {entry.key}: {entry.value}
              </text>
            </g>
          );
        })}

        {/* Empty placeholder */}
        {bucket.entries.length === 0 && (
          <text
            x={x + HASH_BUCKET_W / 2}
            y={y + headerH + 16}
            textAnchor="middle"
            style={{ fill: 'var(--foreground-subtle)' }}
            fontSize="10"
            fontStyle="italic"
          >
            empty
          </text>
        )}

        {/* Overflow chain arrow + recursive render */}
        {bucket.overflow && (() => {
          const overflowY = y + totalH + HASH_OVERFLOW_GAP;
          return (
            <>
              {/* Arrow from bottom of this bucket to top of overflow */}
              <line
                x1={x + HASH_BUCKET_W / 2}
                y1={y + totalH}
                x2={x + HASH_BUCKET_W / 2}
                y2={overflowY}
                style={{
                  stroke: isHL ? 'var(--viz-overflow, #6366f1)' : 'var(--foreground-subtle)',
                  transition: `stroke ${DURATION_ENTRY} ${EASE_OUT}`,
                }}
                strokeWidth={1.5}
                markerEnd="url(#hash-arrow)"
              />
              {renderBucket(
                bucket.overflow!,
                x,
                overflowY,
                true,
                overflowDepth + 1,
              )}
            </>
          );
        })()}
      </g>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/20 bg-background/60 backdrop-blur-md text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400"/> Hash</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"/> Insert</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> Collision</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"/> Resize</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"/> Delete</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"/> Search</span>
      </div>

      {/* Step description bar — fades in on change */}
      <div aria-live="polite" role="status">
      {currentStep && (
        <div
          key={`step-${stepIndex}`}
          className="flex items-center gap-2 border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2"
          style={{
            animation: `hash-step-fade-in ${DURATION_ENTRY} ${EASE_OUT} both`,
          }}
        >
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              currentStep.operation === "insert"
                ? "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                : currentStep.operation === "hash"
                  ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                  : currentStep.operation === "collision"
                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                    : currentStep.operation === "resize"
                      ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]"
                      : currentStep.operation === "delete"
                        ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                        : "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
            )}
          >
            {currentStep.operation}
          </span>
          <span className="text-xs text-foreground-muted">
            {currentStep.description}
          </span>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            Step {stepIndex + 1}/{steps.length}
          </span>
        </div>
      )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 border-b border-border/30 px-4 py-1.5">
        <span className="text-[10px] text-foreground-subtle">
          Buckets: <span className="font-mono font-semibold text-foreground-muted">{state.buckets.length}</span>
        </span>
        <span className="text-[10px] text-foreground-subtle">
          Entries: <span className="font-mono font-semibold text-foreground-muted">{state.size}</span>
        </span>
        <span className="text-[10px] text-foreground-subtle">
          Load Factor:{" "}
          <span
            className={cn(
              "font-mono font-semibold",
              state.loadFactor > 0.75
                ? "text-red-400"
                : state.loadFactor > 0.5
                  ? "text-amber-400"
                  : "text-green-400",
            )}
          >
            {state.loadFactor.toFixed(2)}
          </span>
        </span>
      </div>

      {/* Keyframes for step fade-in */}
      <style>{`
        @keyframes hash-step-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes hash-step-fade-in {
            from, to { opacity: 1; transform: none; }
          }
        }
      `}</style>

      {/* Prediction overlay (DBL-130) */}
      {predictionMode && predictionPaused && predictionQuestion && !predictionCollisionPhase && onPredictionSelect && (
        <div className="mx-4 mt-3 mb-2 rounded-xl border border-violet-500/30 bg-violet-950/40 p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
              Prediction Challenge
            </span>
            {predictionScore && (
              <span className="ml-auto font-mono text-[10px] text-violet-300">
                Score: {predictionScore.correct}/{predictionScore.total}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-foreground">{predictionQuestion}</p>
          <div className="flex flex-wrap gap-2">
            {(predictionOptions ?? []).map((opt) => {
              const hasAnswered = predictionSelectedOption !== null && predictionSelectedOption !== undefined;
              const selected = predictionSelectedOption === opt.bucketIndex;
              const showCorrect = hasAnswered && opt.bucketIndex === predictionCorrectIndex;
              const showWrong = selected && opt.bucketIndex !== predictionCorrectIndex;
              return (
                <button
                  key={opt.bucketIndex}
                  onClick={() => !hasAnswered && onPredictionSelect(opt.bucketIndex)}
                  disabled={hasAnswered}
                  className={cn(
                    "min-w-[80px] rounded-xl border px-4 py-2.5 text-center text-sm font-mono transition-all",
                    !hasAnswered && "cursor-pointer hover:bg-primary/10",
                    !hasAnswered && "border-primary/30 bg-primary/5 text-foreground",
                    showCorrect && "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
                    showWrong && "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
                    hasAnswered && !showCorrect && !showWrong && "border-border/50 bg-elevated/50 text-foreground-subtle opacity-60",
                  )}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                    {showWrong && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          {predictionSelectedOption !== null && predictionSelectedOption !== undefined && (
            <div
              className={cn(
                "mt-4 rounded-xl border p-3 text-xs",
                predictionSelectedOption === predictionCorrectIndex
                  ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300"
                  : "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300",
              )}
            >
              <p className="mb-1 font-bold">
                {predictionSelectedOption === predictionCorrectIndex ? "Correct!" : "Not quite..."}
              </p>
              <p className="text-foreground-muted">{predictionExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Collision prediction overlay (DBL-130) */}
      {predictionMode && predictionPaused && predictionCollisionPhase && predictionQuestion && onPredictionCollisionSelect && (
        <div className="mx-4 mt-3 mb-2 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Collision Challenge
            </span>
            {predictionScore && (
              <span className="ml-auto font-mono text-[10px] text-amber-300">
                Score: {predictionScore.correct}/{predictionScore.total}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-foreground">{predictionQuestion}</p>
          <div className="space-y-2">
            {(predictionCollisionOptions ?? []).map((opt, i) => {
              const hasAnswered = predictionCollisionSelected !== null && predictionCollisionSelected !== undefined;
              const selected = predictionCollisionSelected === i;
              const showCorrect = hasAnswered && opt.correct;
              const showWrong = selected && !opt.correct;
              return (
                <button
                  key={i}
                  onClick={() => !hasAnswered && onPredictionCollisionSelect(i)}
                  disabled={hasAnswered}
                  className={cn(
                    "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                    !hasAnswered && "cursor-pointer hover:bg-amber-500/10",
                    !hasAnswered && "border-amber-500/30 bg-amber-500/5 text-foreground",
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
          {predictionCollisionSelected !== null && predictionCollisionSelected !== undefined && (
            <div
              className={cn(
                "mt-4 rounded-xl border p-3 text-xs",
                (predictionCollisionOptions ?? [])[predictionCollisionSelected]?.correct
                  ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-300"
                  : "border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-300",
              )}
            >
              <p className="mb-1 font-bold">
                {(predictionCollisionOptions ?? [])[predictionCollisionSelected]?.correct ? "Correct!" : "Not quite..."}
              </p>
              <p className="text-foreground-muted">{predictionCollisionExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* SVG hash table */}
      <div className="flex-1 overflow-auto p-4">
        <svg role="img" aria-label={`Hash index visualization with ${state.buckets.length} buckets`} width={svgWidth} height={svgHeight} className="mx-auto">
          <defs>
            <pattern
              id="hash-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                style={{ stroke: 'var(--elevated)' }}
                strokeWidth="0.5"
              />
            </pattern>
            <marker
              id="hash-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" style={{ fill: 'var(--viz-overflow, #6366f1)' }} />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#hash-grid)" />

          {/* Hash function label */}
          <text x={30} y={25} style={{ fill: 'var(--foreground-muted)' }} fontSize="12" fontWeight="600">
            h(key) = djb2(key) mod {state.buckets.length}
          </text>

          {/* Render buckets in a row */}
          {state.buckets.map((bucket, i) => {
            const bx = 30 + i * (HASH_BUCKET_W + HASH_BUCKET_GAP);
            const by = 45;
            return renderBucket(bucket, bx, by, false, 0);
          })}
        </svg>
      </div>
    </div>
  );
});

export default HashIndexCanvas;
