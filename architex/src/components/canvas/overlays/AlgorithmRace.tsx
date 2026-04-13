'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Flag, Check, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/constants/motion';

// ── Types ────────────────────────────────────────────────────

export interface AlgorithmRaceProps {
  /** Algorithm A config */
  algorithmA: { name: string; id: string };
  /** Algorithm B config */
  algorithmB: { name: string; id: string };
  /** Progress of A (0-1) */
  progressA: number;
  /** Progress of B (0-1) */
  progressB: number;
  /** A's comparison count */
  comparisonsA: number;
  /** B's comparison count */
  comparisonsB: number;
  /** A's swap count */
  swapsA: number;
  /** B's swap count */
  swapsB: number;
  /** Whether A has finished */
  finishedA: boolean;
  /** Whether B has finished */
  finishedB: boolean;
  /** Whether race is active */
  isRacing: boolean;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────

/** Truncate a name to maxLen characters with ellipsis */
function truncateName(name: string, maxLen = 20): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '\u2026';
}

/** Format a number with locale-aware separators */
function formatCount(n: number): string {
  return n.toLocaleString();
}

/** Compute the speedup ratio string, e.g. "6.2x faster!" */
function getSpeedupLabel(
  comparisonsWinner: number,
  comparisonsLoser: number,
): string {
  if (comparisonsWinner === 0 || comparisonsLoser === 0) return '';
  const ratio = comparisonsLoser / comparisonsWinner;
  if (ratio <= 1) return '';
  return `${ratio.toFixed(1)}x faster!`;
}

// ── Determine Race Result ────────────────────────────────────

type RaceResult = 'none' | 'a-wins' | 'b-wins' | 'tie';

function getRaceResult(finishedA: boolean, finishedB: boolean, comparisonsA: number, comparisonsB: number): RaceResult {
  if (!finishedA && !finishedB) return 'none';
  if (finishedA && finishedB) {
    if (comparisonsA < comparisonsB) return 'a-wins';
    if (comparisonsB < comparisonsA) return 'b-wins';
    return 'tie';
  }
  // Only one has finished — the first to finish wins
  if (finishedA) return 'a-wins';
  return 'b-wins';
}

function getResultLabel(result: RaceResult, nameA: string, nameB: string): string {
  switch (result) {
    case 'a-wins': return `${truncateName(nameA, 20)} WINS!`;
    case 'b-wins': return `${truncateName(nameB, 20)} WINS!`;
    case 'tie': return 'TIE!';
    default: return '';
  }
}

// ── Progress Bar Row ─────────────────────────────────────────

interface ProgressRowProps {
  name: string;
  progress: number;
  comparisons: number;
  swaps: number;
  finished: boolean;
  isWinner: boolean;
  /** Bar fill color class */
  fillClass: string;
  shouldReduceMotion: boolean | null;
}

const ProgressRow = memo(function ProgressRow({
  name,
  progress,
  comparisons,
  swaps,
  finished,
  isWinner,
  fillClass,
  shouldReduceMotion,
}: ProgressRowProps) {
  const percent = Math.round(progress * 100);
  const displayName = truncateName(name);

  return (
    <div className="flex items-center gap-3">
      {/* Algorithm name */}
      <span
        className={cn(
          'w-[130px] shrink-0 truncate text-xs font-medium font-mono',
          finished ? 'text-foreground' : 'text-foreground-muted',
        )}
        title={name}
      >
        {displayName}
      </span>

      {/* Progress bar track */}
      <div className="relative flex-1 h-2 rounded-full bg-border/20 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', fillClass)}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : springs.smooth
          }
        />
      </div>

      {/* Stats: percentage + comparisons */}
      <div className="flex items-center gap-2 shrink-0 w-[120px] justify-end">
        <span className="text-xs font-mono text-foreground-muted tabular-nums">
          {percent}%
        </span>
        <span className="text-xs font-mono text-foreground-subtle tabular-nums">
          {formatCount(comparisons)} cmp
        </span>
      </div>

      {/* Finished indicator */}
      <div className="w-[80px] shrink-0 flex items-center justify-end">
        <AnimatePresence mode="wait">
          {finished && (
            <motion.div
              key="finished"
              className={cn(
                'flex items-center gap-1 text-xs font-semibold',
                isWinner ? 'text-green-400' : 'text-foreground-muted',
              )}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.8 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : springs.bouncy
              }
            >
              <Check className="h-3 w-3" />
              <span>FINISHED!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── Component ────────────────────────────────────────────────

export const AlgorithmRace = memo(function AlgorithmRace({
  algorithmA,
  algorithmB,
  progressA,
  progressB,
  comparisonsA,
  comparisonsB,
  swapsA,
  swapsB,
  finishedA,
  finishedB,
  isRacing,
  className,
}: AlgorithmRaceProps) {
  const shouldReduceMotion = useReducedMotion();

  const raceResult = useMemo(
    () => getRaceResult(finishedA, finishedB, comparisonsA, comparisonsB),
    [finishedA, finishedB, comparisonsA, comparisonsB],
  );

  const resultLabel = useMemo(
    () => getResultLabel(raceResult, algorithmA.name, algorithmB.name),
    [raceResult, algorithmA.name, algorithmB.name],
  );

  const speedupLabel = useMemo(() => {
    if (raceResult === 'none' || raceResult === 'tie') return '';
    if (raceResult === 'a-wins') return getSpeedupLabel(comparisonsA, comparisonsB);
    return getSpeedupLabel(comparisonsB, comparisonsA);
  }, [raceResult, comparisonsA, comparisonsB]);

  const bothFinished = finishedA && finishedB;

  if (!isRacing && !bothFinished) return null;

  return (
    <div
      role="region"
      aria-label="Algorithm race comparison"
      className={cn(
        'rounded-xl border border-border/30 bg-background/80 backdrop-blur-xl p-3',
        className,
      )}
    >
      {/* Title row */}
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-3.5 w-3.5 text-foreground-muted" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Algorithm Race
        </span>
      </div>

      {/* Progress rows */}
      <div className="flex flex-col gap-2">
        <ProgressRow
          name={algorithmA.name}
          progress={progressA}
          comparisons={comparisonsA}
          swaps={swapsA}
          finished={finishedA}
          isWinner={raceResult === 'a-wins'}
          fillClass="bg-primary"
          shouldReduceMotion={shouldReduceMotion}
        />
        <ProgressRow
          name={algorithmB.name}
          progress={progressB}
          comparisons={comparisonsB}
          swaps={swapsB}
          finished={finishedB}
          isWinner={raceResult === 'b-wins'}
          fillClass="bg-amber-500"
          shouldReduceMotion={shouldReduceMotion}
        />
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {bothFinished && raceResult !== 'none' && (
          <motion.div
            key="winner-banner"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-border/20 bg-elevated/50 py-2 px-3"
            initial={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.9 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : springs.bouncy
            }
          >
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground">
              {resultLabel}
            </span>

            {/* Stats summary */}
            {speedupLabel && (
              <>
                <span className="text-foreground-subtle">&middot;</span>
                <span className="text-xs text-foreground-muted">
                  {formatCount(comparisonsA)} vs {formatCount(comparisonsB)} comparisons
                  {' '}&mdash; {speedupLabel}
                </span>
              </>
            )}

            {raceResult === 'tie' && (
              <>
                <span className="text-foreground-subtle">&middot;</span>
                <span className="text-xs text-foreground-muted">
                  Both finished with {formatCount(comparisonsA)} comparisons
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
