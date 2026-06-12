'use client';

/**
 * PredictionModal (Predict-Run-Compare loop)
 *
 * Shown by the CanvasToolbar play intercept before a fresh simulation
 * run: a ~20-second form where the user locks a falsifiable prediction
 * (first bottleneck, p99/error/cost bands, confidence 1-5) before the
 * system reveals what actually happens.
 *
 * Both [Skip & run] and [Lock prediction & Run] start the simulation;
 * Lock stores a PredictionRecord first so PredictionResultCard can
 * grade it after the run completes.
 */

import { memo, useCallback, useState } from 'react';
import { Crosshair, Lock, Play } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { usePredictionStore } from '@/stores/prediction-store';
import {
  BAND_ORDER,
  BAND_TITLES,
  P99_BAND_LABELS,
  ERROR_BAND_LABELS,
  COST_BAND_LABELS,
  type Band,
  type Confidence,
} from '@/lib/simulation/prediction-scoring';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Constants ────────────────────────────────────────────────

/** Sentinel for the "nothing saturates" bottleneck claim. */
const NO_BOTTLENECK = '__none__';

const CONFIDENCE_LEVELS: Confidence[] = [1, 2, 3, 4, 5];

const CONFIDENCE_HINTS: Partial<Record<Confidence, string>> = {
  1: 'Guess',
  3: 'Leaning',
  5: 'Certain',
};

/** Semantic selected styles per band — color carries meaning, not decoration. */
const BAND_SELECTED_CLASSES: Record<Band, string> = {
  healthy: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  elevated: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  concerning: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  critical: 'border-red-500/50 bg-red-500/10 text-red-400',
};

// ── Segmented radio group ────────────────────────────────────

interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
  selectedClass?: string;
}

interface SegmentedGroupProps<T extends string | number> {
  groupLabel: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columnsClass: string;
}

function SegmentedGroup<T extends string | number>({
  groupLabel,
  options,
  value,
  onChange,
  columnsClass,
}: SegmentedGroupProps<T>) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') delta = 1;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') delta = -1;
      if (delta === 0) return;
      e.preventDefault();

      const idx = options.findIndex((o) => o.value === value);
      const next = (idx + delta + options.length) % options.length;
      onChange(options[next].value);

      const radios =
        e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios[next]?.focus();
    },
    [options, value, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      onKeyDown={handleKeyDown}
      className={cn('grid gap-1', columnsClass)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg border px-1.5 py-1.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? (option.selectedClass ??
                  'border-primary/50 bg-primary/15 text-primary')
                : 'border-border bg-surface/40 text-muted-foreground hover:bg-surface/80 hover:text-foreground',
            )}
          >
            <span className="text-xs font-medium leading-none">
              {option.label}
            </span>
            {option.hint !== undefined && (
              <span className="text-[10px] leading-none opacity-70">
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Field label ──────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

// ── Band field helper ────────────────────────────────────────

function bandOptions(labels: Record<Band, string>): SegmentedOption<Band>[] {
  return BAND_ORDER.map((band) => ({
    value: band,
    label: BAND_TITLES[band],
    hint: labels[band],
    selectedClass: BAND_SELECTED_CLASSES[band],
  }));
}

// ── Form (mounted fresh on every dialog open) ────────────────

/**
 * Field state lives here, inside DialogContent. Radix unmounts the
 * content when the dialog closes, so every open starts from a clean
 * form without effect-driven resets.
 */
function PredictionForm() {
  const closeModal = usePredictionStore((s) => s.closeModal);
  const setPending = usePredictionStore((s) => s.setPending);
  const clear = usePredictionStore((s) => s.clear);
  const nodes = useCanvasStore((s) => s.nodes);

  const [bottleneck, setBottleneck] = useState<string>('');
  const [p99, setP99] = useState<Band>('elevated');
  const [errors, setErrors] = useState<Band>('healthy');
  const [cost, setCost] = useState<Band>('elevated');
  const [confidence, setConfidence] = useState<Confidence>(3);

  const handleSkip = useCallback(() => {
    clear(); // stale predictions must never grade a run they weren't made for
    closeModal();
    useSimulationStore.getState().play();
  }, [clear, closeModal]);

  const handleLockAndRun = useCallback(() => {
    if (bottleneck === '') return;
    setPending({
      firstBottleneckNodeId: bottleneck === NO_BOTTLENECK ? null : bottleneck,
      p99Band: p99,
      errorBand: errors,
      costBand: cost,
      confidence,
      predictedAt: Date.now(),
    });
    closeModal();
    useSimulationStore.getState().play();
  }, [bottleneck, p99, errors, cost, confidence, setPending, closeModal]);

  return (
    <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Crosshair className="h-4 w-4" />
            </span>
            Call your shot
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Before the run: what will this architecture actually do? Lock a
            falsifiable prediction — being confidently wrong here is where the
            learning happens.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* ── Bottleneck claim ── */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Which component saturates first?</FieldLabel>
            <Select value={bottleneck} onValueChange={setBottleneck}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pick a component…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BOTTLENECK}>
                  Nothing saturates — it holds
                </SelectItem>
                {nodes.map((node) => {
                  const label =
                    ((node.data as Record<string, unknown> | undefined)
                      ?.label as string | undefined) ?? node.id;
                  return (
                    <SelectItem key={node.id} value={node.id}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ── Band claims ── */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>p99 latency lands…</FieldLabel>
            <SegmentedGroup
              groupLabel="Predicted p99 latency band"
              options={bandOptions(P99_BAND_LABELS)}
              value={p99}
              onChange={setP99}
              columnsClass="grid-cols-4"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Error rate lands…</FieldLabel>
            <SegmentedGroup
              groupLabel="Predicted error rate band"
              options={bandOptions(ERROR_BAND_LABELS)}
              value={errors}
              onChange={setErrors}
              columnsClass="grid-cols-4"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Run cost lands…</FieldLabel>
            <SegmentedGroup
              groupLabel="Predicted hourly cost band"
              options={bandOptions(COST_BAND_LABELS)}
              value={cost}
              onChange={setCost}
              columnsClass="grid-cols-4"
            />
          </div>

          {/* ── Confidence ── */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>How sure are you?</FieldLabel>
            <SegmentedGroup
              groupLabel="Prediction confidence, 1 to 5"
              options={CONFIDENCE_LEVELS.map((level) => ({
                value: level,
                label: String(level),
                hint: CONFIDENCE_HINTS[level] ?? ' ',
              }))}
              value={confidence}
              onChange={setConfidence}
              columnsClass="grid-cols-5"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <Play className="h-3.5 w-3.5" />
            Skip &amp; run
          </Button>
          <Button
            size="sm"
            disabled={bottleneck === ''}
            onClick={handleLockAndRun}
          >
            <Lock className="h-3.5 w-3.5" />
            Lock prediction &amp; Run
          </Button>
        </DialogFooter>
    </>
  );
}

// ── Main modal ───────────────────────────────────────────────

export const PredictionModal = memo(function PredictionModal() {
  const modalOpen = usePredictionStore((s) => s.modalOpen);
  const closeModal = usePredictionStore((s) => s.closeModal);
  const nodeCount = useCanvasStore((s) => s.nodes.length);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeModal();
    },
    [closeModal],
  );

  if (nodeCount === 0) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-5 rounded-xl bg-surface/95 backdrop-blur-lg">
        <PredictionForm />
      </DialogContent>
    </Dialog>
  );
});
