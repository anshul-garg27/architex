'use client';

/**
 * PredictionResultCard (Predict-Run-Compare loop)
 *
 * Rendered at the top of PostSimulationReport after a completed run.
 * When a pending PredictionRecord exists it derives the actual RunOutcome
 * from the orchestrator (tick history, per-node utilization, final
 * metrics, live cost) and grades the prediction via
 * prediction-store.scoreAgainstRun, then renders per-claim verdict rows
 * and the confidence-aware coaching line.
 *
 * Renders null when there is nothing to show (no prediction made).
 */

import { memo, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  Crosshair,
  Flame,
  Lightbulb,
  RotateCcw,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { usePredictionStore } from '@/stores/prediction-store';
import {
  deriveRunOutcome,
  type CalibrationTone,
  type ClaimScore,
  type NodeUtilization,
  type Verdict,
} from '@/lib/simulation/prediction-scoring';

// ---------------------------------------------------------------------------
// Verdict presentation
// ---------------------------------------------------------------------------

const VERDICT_META: Record<
  Verdict,
  { label: string; className: string }
> = {
  correct: { label: 'Correct', className: 'text-emerald-400' },
  'near-miss': { label: 'Near miss', className: 'text-amber-400' },
  wrong: { label: 'Wrong', className: 'text-red-400' },
};

function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  if (verdict === 'correct') return <Check className="h-3.5 w-3.5" />;
  if (verdict === 'wrong') return <X className="h-3.5 w-3.5" />;
  return (
    <span aria-hidden className="text-sm font-bold leading-none">
      {'≈'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Calibration presentation
// ---------------------------------------------------------------------------

const TONE_META: Record<
  CalibrationTone,
  { icon: React.ReactNode; className: string }
> = {
  win: {
    icon: <Trophy className="h-3.5 w-3.5" />,
    className: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  },
  underconfident: {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    className: 'border-primary/30 bg-primary/5 text-primary',
  },
  mixed: {
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    className: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  },
  miss: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: 'border-border bg-elevated text-foreground-muted',
  },
  hypercorrection: {
    icon: <Flame className="h-3.5 w-3.5" />,
    className: 'border-red-500/40 bg-red-500/10 text-red-400',
  },
};

// ---------------------------------------------------------------------------
// Claim row
// ---------------------------------------------------------------------------

function ClaimRow({ claim }: { claim: ClaimScore }) {
  const meta = VERDICT_META[claim.verdict];
  return (
    <div className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0">
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
          claim.verdict === 'correct' && 'bg-emerald-500/15',
          claim.verdict === 'near-miss' && 'bg-amber-500/15',
          claim.verdict === 'wrong' && 'bg-red-500/15',
          meta.className,
        )}
        title={meta.label}
      >
        <VerdictGlyph verdict={claim.verdict} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          {claim.label}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
          <span className="text-foreground-muted">{claim.predicted}</span>
          <span aria-hidden className="text-foreground-muted">
            {'→'}
          </span>
          <span className="font-medium text-foreground">{claim.actual}</span>
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 text-[10px] font-semibold uppercase tracking-wider',
          meta.className,
        )}
      >
        {meta.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PredictionResultCard
// ---------------------------------------------------------------------------

export const PredictionResultCard = memo(function PredictionResultCard() {
  const status = useSimulationStore((s) => s.status);
  const metrics = useSimulationStore((s) => s.metrics);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);

  const pending = usePredictionStore((s) => s.pending);
  const lastScored = usePredictionStore((s) => s.lastScored);
  const scoreAgainstRun = usePredictionStore((s) => s.scoreAgainstRun);
  const clear = usePredictionStore((s) => s.clear);
  const openModal = usePredictionStore((s) => s.openModal);

  // Grade the pending prediction once the run has completed.
  useEffect(() => {
    if (status !== 'completed' || !pending || !orchestratorRef) return;

    const bus = orchestratorRef.getMetricsBus();
    const nodeUtilizations: NodeUtilization[] = nodes.map((node) => {
      const data = node.data as Record<string, unknown> | undefined;
      const nodeMetrics = data?.metrics as
        | Record<string, unknown>
        | undefined;
      const fromCanvas =
        typeof nodeMetrics?.utilization === 'number'
          ? nodeMetrics.utilization
          : undefined;
      return {
        nodeId: node.id,
        utilization: fromCanvas ?? bus.read(node.id)?.utilization ?? 0,
      };
    });

    const nodeLabels: Record<string, string> = {};
    for (const node of nodes) {
      const data = node.data as Record<string, unknown> | undefined;
      nodeLabels[node.id] =
        typeof data?.label === 'string' ? data.label : node.id;
    }

    const outcome = deriveRunOutcome({
      ticks: orchestratorRef.getTickHistory().map((tick) => ({
        nodeEvents: tick.nodeEvents.map((evt) => ({
          nodeId: evt.nodeId,
          severity: evt.severity,
        })),
      })),
      nodeUtilizations,
      p99LatencyMs: metrics.p99LatencyMs,
      errorRate: metrics.errorRate,
      costPerHour: orchestratorRef.getCostState().currentHourlyRate,
    });

    scoreAgainstRun(outcome, nodeLabels);
  }, [status, pending, orchestratorRef, nodes, metrics, scoreAgainstRun]);

  if (!lastScored) return null;

  const { claims, accuracy, calibration, calibrationTone, prediction } =
    lastScored;
  const tone = TONE_META[calibrationTone];
  const accuracyPercent = Math.round(accuracy * 100);

  const handleNewPrediction = () => {
    clear();
    openModal();
  };

  return (
    <section aria-label="Prediction versus reality">
      <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-primary" />
          Prediction vs Reality
        </span>
        <span className="flex items-center gap-2 normal-case tracking-normal">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
            Confidence {prediction.confidence}/5
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums',
              accuracy >= 0.75 && 'bg-emerald-500/15 text-emerald-400',
              accuracy >= 0.4 && accuracy < 0.75 && 'bg-amber-500/15 text-amber-400',
              accuracy < 0.4 && 'bg-red-500/15 text-red-400',
            )}
          >
            {accuracyPercent}% accurate
          </span>
        </span>
      </h3>

      {/* Per-claim verdicts */}
      <div className="overflow-hidden rounded-lg border border-border bg-elevated">
        {claims.map((claim) => (
          <ClaimRow key={claim.claim} claim={claim} />
        ))}
      </div>

      {/* Confidence-aware coaching line */}
      <div
        className={cn(
          'mt-2 flex items-start gap-2 rounded-lg border px-3 py-2.5',
          tone.className,
        )}
      >
        <span className="mt-0.5 shrink-0">{tone.icon}</span>
        <p className="text-xs leading-relaxed">{calibration}</p>
      </div>

      {/* New prediction affordance */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleNewPrediction}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          New prediction
        </button>
      </div>
    </section>
  );
});
