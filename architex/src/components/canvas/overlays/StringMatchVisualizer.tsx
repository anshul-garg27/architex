'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { duration, springs } from '@/lib/constants/motion';
import {
  STRING_CHAR_STATE_COLORS as CHAR_STATE_COLORS,
  STRING_CHAR_STATE_TEXT as CHAR_STATE_TEXT,
} from '@/lib/algorithms/visualization-colors';

// ── Constants ────────────────────────────────────────────────

const CHAR_WIDTH = 28;
const CHAR_HEIGHT = 36;
const CHAR_GAP = 2;

type CharState = 'default' | 'comparing' | 'sorted' | 'swapping' | 'active' | 'found';

// ── Types ────────────────────────────────────────────────────

export interface StringMatchVisualizerProps {
  text: string;
  pattern: string;
  step: AnimationStep | null;
  failureFunction?: number[];
  hashValues?: { patternHash?: number; windowHash?: number };
  className?: string;
  height?: number;
}

// ── Helpers ──────────────────────────────────────────────────

function getCharState(
  prefix: string,
  index: number,
  mutations: VisualMutation[],
): CharState {
  for (const m of mutations) {
    if (m.targetId === `${prefix}-${index}` && m.property === 'highlight') {
      const val = String(m.to) as CharState;
      if (val in CHAR_STATE_COLORS) return val;
    }
  }
  return 'default';
}

function getPatternOffset(mutations: VisualMutation[]): number | null {
  for (const m of mutations) {
    if (m.targetId === 'pattern-offset' && m.property === 'position') {
      return Number(m.to);
    }
  }
  return null;
}

function getHashLabel(
  targetId: string,
  mutations: VisualMutation[],
): string | null {
  for (const m of mutations) {
    if (m.targetId === targetId && m.property === 'label') {
      return String(m.to);
    }
  }
  return null;
}

function getFailureState(
  index: number,
  mutations: VisualMutation[],
): { state: CharState; label: string | null } {
  let state: CharState = 'default';
  let label: string | null = null;

  for (const m of mutations) {
    if (m.targetId === `failure-${index}`) {
      if (m.property === 'highlight') {
        const raw = String(m.to);
        if (raw === 'computing') state = 'comparing';
        else if (raw === 'computed') state = 'sorted';
        else if (raw in CHAR_STATE_COLORS) state = raw as CharState;
      }
      if (m.property === 'label') {
        label = String(m.to);
      }
    }
  }

  return { state, label };
}

// ── Component ────────────────────────────────────────────────

export const StringMatchVisualizer = memo(function StringMatchVisualizer({
  text,
  pattern,
  step,
  failureFunction,
  hashValues,
  className,
  height = 320,
}: StringMatchVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const mutations = step?.mutations ?? [];
  const patternOffset = getPatternOffset(mutations) ?? 0;

  // Hash display
  const hashPatLabel = getHashLabel('hash-pattern', mutations);
  const hashWinLabel = getHashLabel('hash-window', mutations);

  if (!text || !pattern) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-elevated',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">Enter text and pattern to visualize</p>
      </div>
    );
  }

  const textChars = text.split('');
  const patternChars = pattern.split('');
  const totalWidth = Math.max(textChars.length, patternChars.length + patternOffset) * (CHAR_WIDTH + CHAR_GAP);

  return (
    <div
      className={cn(
        'relative overflow-auto rounded-lg border border-border bg-elevated p-4',
        className,
      )}
      style={{ height }}
    >
      <div className="flex flex-col items-start gap-4" style={{ minWidth: totalWidth + 60 }}>
        {/* Text row */}
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Text
          </div>
          <div className="flex" style={{ gap: CHAR_GAP }}>
            {textChars.map((ch, i) => {
              const state = getCharState('text', i, mutations);
              return (
                <motion.div
                  key={`text-${i}`}
                  className="flex flex-col items-center"
                  style={{ width: CHAR_WIDTH }}
                >
                  <motion.div
                    className="flex items-center justify-center rounded-md font-mono text-sm font-semibold"
                    style={{ width: CHAR_WIDTH, height: CHAR_HEIGHT }}
                    initial={false}
                    animate={{
                      backgroundColor: CHAR_STATE_COLORS[state],
                      color: CHAR_STATE_TEXT[state],
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.normal }}
                  >
                    {ch}
                  </motion.div>
                  <span className="mt-0.5 text-[8px] font-mono text-foreground-subtle">
                    {i}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pattern row (slides via offset) */}
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Pattern
          </div>
          <motion.div
            className="flex"
            style={{ gap: CHAR_GAP }}
            initial={false}
            animate={{
              marginLeft: patternOffset * (CHAR_WIDTH + CHAR_GAP),
            }}
            transition={shouldReduceMotion ? { duration: 0 } : springs.smooth}
          >
            {patternChars.map((ch, i) => {
              const state = getCharState('pattern', i, mutations);
              return (
                <motion.div
                  key={`pattern-${i}`}
                  className="flex items-center justify-center rounded-md font-mono text-sm font-semibold"
                  style={{ width: CHAR_WIDTH, height: CHAR_HEIGHT }}
                  initial={false}
                  animate={{
                    backgroundColor: CHAR_STATE_COLORS[state],
                    color: CHAR_STATE_TEXT[state],
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.normal }}
                >
                  {ch}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Failure function table (KMP) */}
        {failureFunction && failureFunction.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Failure Function
            </div>
            <div className="flex" style={{ gap: CHAR_GAP }}>
              {failureFunction.map((val, i) => {
                const { state, label } = getFailureState(i, mutations);
                const displayVal = label != null ? label : String(val);
                return (
                  <motion.div
                    key={`failure-${i}`}
                    className="flex flex-col items-center"
                    style={{ width: CHAR_WIDTH }}
                  >
                    <div className="text-[8px] font-mono text-foreground-subtle mb-0.5">
                      {patternChars[i] ?? ''}
                    </div>
                    <motion.div
                      className="flex items-center justify-center rounded-md font-mono text-xs font-semibold"
                      style={{ width: CHAR_WIDTH, height: CHAR_HEIGHT - 4 }}
                      initial={false}
                      animate={{
                        backgroundColor: CHAR_STATE_COLORS[state],
                        color: CHAR_STATE_TEXT[state],
                      }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.normal }}
                    >
                      {displayVal}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hash display (Rabin-Karp) */}
        {hashValues && (
          <div className="flex gap-6">
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Pattern Hash
              </span>
              <div className="mt-0.5 font-mono text-sm font-bold text-primary">
                {hashPatLabel ?? hashValues.patternHash ?? '—'}
              </div>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Window Hash
              </span>
              <div className="mt-0.5 font-mono text-sm font-bold text-amber-500">
                {hashWinLabel ?? hashValues.windowHash ?? '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex gap-3">
        {(
          [
            ['sorted', 'Match'],
            ['swapping', 'Mismatch'],
            ['active', 'Current'],
            ['found', 'Full Match'],
          ] as const
        ).map(([state, label]) => (
          <div key={state} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: CHAR_STATE_COLORS[state] }}
            />
            <span className="text-[8px] text-foreground-subtle">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
