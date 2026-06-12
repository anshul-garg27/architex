'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useReactFlow, type Viewport } from '@xyflow/react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  GraduationCap,
  Play,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTemplateMetaStore } from '@/stores/template-meta-store';
import { useSimulationStore } from '@/stores/simulation-store';
import {
  buildTourHighlightCss,
  clampStepIndex,
  getStepHighlights,
  getTourSteps,
  isLastStep,
} from '@/lib/tour/tour-logic';
import type { LearnStep } from '@/lib/templates/types';

// ── Constants ────────────────────────────────────────────────

const TOUR_STYLE_ATTR = 'data-architex-tour-style';
const FIT_VIEW_PADDING = 0.4;
const FIT_VIEW_DURATION_MS = 500;
const VIEWPORT_RESTORE_DURATION_MS = 400;

// ── Progress dots ────────────────────────────────────────────

interface ProgressDotsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

function ProgressDots({ total, current, onSelect }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="tablist"
      aria-label="Tour steps"
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`Go to step ${i + 1}`}
          onClick={() => onSelect(i)}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-150',
            i === current
              ? 'scale-125 bg-primary shadow-[0_0_6px_color-mix(in_srgb,var(--primary)_50%,transparent)]'
              : 'bg-border hover:scale-110 hover:bg-muted-foreground/60',
          )}
        />
      ))}
    </div>
  );
}

// ── Tour card (mounted only while the tour is open) ──────────

interface TourCardProps {
  steps: LearnStep[];
  templateName: string;
  onClose: () => void;
}

function TourCard({ steps, templateName, onClose }: TourCardProps) {
  const reactFlow = useReactFlow();
  const prefersReducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  const total = steps.length;
  const index = clampStepIndex(stepIndex, total);
  const step = steps[index];
  const onFinalStep = isLastStep(index, total);
  const highlights = useMemo(() => getStepHighlights(step), [step]);

  // ── Viewport: capture on open, restore cleanly on close ──
  const initialViewportRef = useRef<Viewport | null>(null);
  useEffect(() => {
    initialViewportRef.current = reactFlow.getViewport();
    return () => {
      const viewport = initialViewportRef.current;
      if (viewport) {
        void reactFlow.setViewport(viewport, {
          duration: VIEWPORT_RESTORE_DURATION_MS,
        });
      }
    };
  }, [reactFlow]);

  // ── Highlight CSS: inject per step, auto-removed on cleanup ──
  useEffect(() => {
    const css = buildTourHighlightCss(highlights);
    if (!css) return;
    const styleEl = document.createElement('style');
    styleEl.setAttribute(TOUR_STYLE_ATTR, '');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [highlights]);

  // ── Camera: ease the viewport onto the step's nodes ──
  useEffect(() => {
    const presentIds = highlights.nodeIds.filter(
      (id) => reactFlow.getNode(id) !== undefined,
    );
    if (presentIds.length === 0) return;
    void reactFlow.fitView({
      nodes: presentIds.map((id) => ({ id })),
      padding: FIT_VIEW_PADDING,
      duration: prefersReducedMotion ? 0 : FIT_VIEW_DURATION_MS,
      maxZoom: 1.1,
    });
  }, [highlights, reactFlow, prefersReducedMotion]);

  // ── Navigation ──
  const goPrev = useCallback(() => {
    setStepIndex((i) => clampStepIndex(i - 1, total));
  }, [total]);

  const goNext = useCallback(() => {
    setStepIndex((i) => clampStepIndex(i + 1, total));
  }, [total]);

  const handleRun = useCallback(() => {
    onClose();
    useSimulationStore.getState().play();
  }, [onClose]);

  // ── Keyboard: ← → navigate, Esc closes ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  const highlightCount = highlights.nodeIds.length + highlights.edgeIds.length;

  return (
    <motion.div
      initial={
        prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }
      }
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-label={`Guided tour: ${templateName}`}
      className={cn(
        'pointer-events-auto',
        'absolute bottom-24 left-1/2 z-40 -translate-x-1/2',
        'flex w-[440px] max-w-[calc(100vw-2rem)] flex-col',
        'rounded-xl border border-border bg-surface/95 shadow-2xl backdrop-blur-lg',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Guided tour
            </div>
            <div className="truncate text-xs font-medium text-muted-foreground">
              {templateName}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            Step {index + 1} of {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Step content ── */}
      <div aria-live="polite" className="px-4 py-3">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {step.title}
        </h3>
        <p className="mt-1.5 max-h-36 overflow-y-auto text-xs leading-relaxed text-muted-foreground">
          {step.description}
        </p>
        {highlightCount > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary/80">
            <Crosshair className="h-3 w-3" />
            Spotlighting {highlightCount}{' '}
            {highlightCount === 1 ? 'element' : 'elements'} on the canvas
          </div>
        )}
      </div>

      {/* ── Footer: prev / dots / next ── */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className={cn(
            'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        <ProgressDots total={total} current={index} onSelect={setStepIndex} />

        {onFinalStep ? (
          <button
            type="button"
            onClick={handleRun}
            className={cn(
              'flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground',
              'shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_35%,transparent)] transition-[background-color,transform]',
              'hover:bg-primary-hover active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            )}
          >
            Run this design
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className={cn(
              'flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary',
              'transition-colors hover:bg-primary/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Public overlay: gates mounting on store state ────────────

/**
 * Floating guided-tour card for the active template's learnSteps.
 * Renders null when no template is loaded, the template has no steps,
 * or the tour is closed. Mount inside DesignCanvas (any descendant of
 * ReactFlowProvider).
 */
export const GuidedTourOverlay = memo(function GuidedTourOverlay() {
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);
  const tourOpen = useTemplateMetaStore((s) => s.tourOpen);
  const closeTour = useTemplateMetaStore((s) => s.closeTour);

  const steps = useMemo(() => getTourSteps(activeTemplate), [activeTemplate]);

  if (!tourOpen || steps.length === 0 || !activeTemplate) return null;

  return (
    <TourCard
      // Remount (and reset to step 0) when the template changes mid-tour.
      key={activeTemplate.id}
      steps={steps}
      templateName={activeTemplate.name}
      onClose={closeTour}
    />
  );
});
