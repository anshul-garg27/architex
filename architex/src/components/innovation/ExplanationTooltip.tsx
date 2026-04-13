'use client';

// ─────────────────────────────────────────────────────────────
// ExplanationTooltip — Alt+Hover Contextual Help
// ─────────────────────────────────────────────────────────────
//
// A large floating tooltip that appears when the user holds
// Alt and hovers over a canvas node. Shows:
//   - What this component is
//   - When to use it
//   - Trade-offs
//   - Alternatives (links to deeper learning)
//
// The tooltip is positioned near the mouse cursor and uses
// motion for smooth enter/exit transitions.
// ─────────────────────────────────────────────────────────────

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/constants/motion';
import {
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  getExplanation,
  getEdgeExplanation,
  type NodeExplanation,
  type EdgeExplanation,
} from '@/lib/innovation/explanation-mode';

// ── Types ──────────────────────────────────────────────────

export interface ExplanationTooltipProps {
  /** The node type currently being hovered (null = hidden). */
  nodeType: string | null;
  /** OR an edge type (null = hidden). */
  edgeType?: string | null;
  /** Pixel position for the tooltip anchor. */
  position: { x: number; y: number };
  /** Whether Alt key is currently held. */
  altHeld: boolean;
  /** Optional callback when an alternative is clicked. */
  onAlternativeClick?: (nodeType: string) => void;
  /** Optional callback to navigate to a concept page. */
  onLearnMore?: (nodeType: string) => void;
  className?: string;
}

/**
 * Hook that tracks whether the Alt key is held down.
 * Use this in parent components to feed the `altHeld` prop.
 */
export function useAltKey(): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setHeld(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setHeld(false);
    };
    const onBlur = () => setHeld(false);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return held;
}

// ── Constants ──────────────────────────────────────────────

/** Tooltip width. */
const TT_WIDTH = 340;
/** Offset from cursor. */
const TT_OFFSET = 16;

// ── Component ──────────────────────────────────────────────

export const ExplanationTooltip = memo(function ExplanationTooltip({
  nodeType,
  edgeType,
  position,
  altHeld,
  onAlternativeClick,
  onLearnMore,
  className,
}: ExplanationTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  // Determine what to show
  const nodeExpl: NodeExplanation | undefined = nodeType ? getExplanation(nodeType) : undefined;
  const edgeExpl: EdgeExplanation | undefined = edgeType ? getEdgeExplanation(edgeType) : undefined;
  const isVisible = altHeld && (!!nodeExpl || !!edgeExpl);

  // Adjust position so tooltip stays within viewport
  const adjustPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x + TT_OFFSET;
    let y = position.y + TT_OFFSET;

    // Prevent right overflow
    if (x + TT_WIDTH > vw - 16) {
      x = position.x - TT_WIDTH - TT_OFFSET;
    }
    // Prevent bottom overflow (estimate 300px height)
    if (y + 300 > vh - 16) {
      y = Math.max(16, vh - 316);
    }
    setAdjustedPos({ x, y });
  }, [position]);

  useEffect(() => {
    adjustPosition();
  }, [adjustPosition]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: duration.fast }}
          style={{
            position: 'fixed',
            left: adjustedPos.x,
            top: adjustedPos.y,
            width: TT_WIDTH,
            zIndex: 9999,
          }}
          className={cn(
            'pointer-events-none rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md',
            className,
          )}
        >
          {/* ══════════════════════════════════════════════ */}
          {/* NODE EXPLANATION */}
          {/* ══════════════════════════════════════════════ */}
          {nodeExpl && (
            <div className="flex flex-col gap-3">
              {/* Title */}
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-100">{nodeExpl.title}</h3>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed text-zinc-400">{nodeExpl.description}</p>

              {/* Use Cases */}
              <div>
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  When to use
                </div>
                <ul className="flex flex-col gap-0.5">
                  {nodeExpl.useCases.map((uc) => (
                    <li key={uc} className="text-xs text-zinc-400">
                      <span className="mr-1 text-zinc-600">-</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-offs */}
              <div>
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Trade-offs
                </div>
                <ul className="flex flex-col gap-0.5">
                  {nodeExpl.tradeoffs.map((t) => (
                    <li key={t} className="text-xs text-zinc-400">
                      <span className="mr-1 text-zinc-600">-</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Alternatives */}
              {nodeExpl.alternatives.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    <ArrowRightLeft className="h-3 w-3 text-indigo-400" />
                    Alternatives
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {nodeExpl.alternatives.map((alt) => {
                      const altExpl = getExplanation(alt);
                      return (
                        <button
                          key={alt}
                          onClick={() => onAlternativeClick?.(alt)}
                          className="pointer-events-auto rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                        >
                          {altExpl?.title ?? alt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Learn more link */}
              {onLearnMore && (
                <button
                  onClick={() => onLearnMore(nodeExpl.nodeType)}
                  className="pointer-events-auto mt-1 flex items-center gap-1 self-start text-[10px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  <BookOpen className="h-3 w-3" />
                  Learn more
                </button>
              )}

              {/* Alt hint */}
              <div className="flex items-center gap-1 border-t border-zinc-800 pt-2 text-[10px] text-zinc-600">
                <Lightbulb className="h-3 w-3" />
                Hold Alt and hover over nodes for explanations
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* EDGE EXPLANATION */}
          {/* ══════════════════════════════════════════════ */}
          {!nodeExpl && edgeExpl && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-100">{edgeExpl.title}</h3>
              </div>

              <p className="text-xs leading-relaxed text-zinc-400">{edgeExpl.description}</p>

              <div>
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Use cases
                </div>
                <ul className="flex flex-col gap-0.5">
                  {edgeExpl.useCases.map((uc) => (
                    <li key={uc} className="text-xs text-zinc-400">
                      <span className="mr-1 text-zinc-600">-</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Trade-offs
                </div>
                <ul className="flex flex-col gap-0.5">
                  {edgeExpl.tradeoffs.map((t) => (
                    <li key={t} className="text-xs text-zinc-400">
                      <span className="mr-1 text-zinc-600">-</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-1 border-t border-zinc-800 pt-2 text-[10px] text-zinc-600">
                <Lightbulb className="h-3 w-3" />
                Hold Alt and hover over edges for explanations
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
