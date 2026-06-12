'use client';

/**
 * ThresholdVerdictCard (Threshold Coaching)
 *
 * Post-run hero card: never raw numbers first. Each run metric is
 * classified into one of four named bands (healthy / watch / concerning /
 * critical) with one causal sentence per non-healthy metric — preferring
 * the engine's own detected-issue narratives. Raw values stay behind a
 * "show raw numbers" disclosure.
 *
 * Renders null until a simulation has completed with recorded metrics.
 */

import { memo, useId, useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  Eye,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import {
  buildVerdict,
  extractIssueNarratives,
  type IssueSeverity,
  type MetricVerdict,
  type RunVerdict,
  type ThresholdBand,
  type VerdictIssueInput,
} from '@/lib/simulation/threshold-bands';

// ---------------------------------------------------------------------------
// Band styling (severity design tokens from globals.css)
// ---------------------------------------------------------------------------

const BAND_DISPLAY: Record<ThresholdBand, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  concerning: 'Concerning',
  critical: 'Critical',
};

const BAND_CHIP: Record<ThresholdBand, string> = {
  healthy: 'border-severity-low/30 bg-severity-low/10 text-severity-low',
  watch: 'border-severity-medium/30 bg-severity-medium/10 text-severity-medium',
  concerning: 'border-severity-high/30 bg-severity-high/10 text-severity-high',
  critical: 'border-severity-critical/30 bg-severity-critical/10 text-severity-critical',
};

const BAND_DOT: Record<ThresholdBand, string> = {
  healthy: 'bg-severity-low',
  watch: 'bg-severity-medium',
  concerning: 'bg-severity-high',
  critical: 'bg-severity-critical',
};

const BAND_ICON: Record<ThresholdBand, LucideIcon> = {
  healthy: ShieldCheck,
  watch: Eye,
  concerning: AlertTriangle,
  critical: AlertOctagon,
};

const BAND_ICON_COLOR: Record<ThresholdBand, string> = {
  healthy: 'text-severity-low',
  watch: 'text-severity-medium',
  concerning: 'text-severity-high',
  critical: 'text-severity-critical',
};

// ---------------------------------------------------------------------------
// Store -> verdict input assembly
// ---------------------------------------------------------------------------

const ISSUE_SEVERITIES: readonly IssueSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
];

function isIssueSeverity(value: string): value is IssueSeverity {
  return (ISSUE_SEVERITIES as readonly string[]).includes(value);
}

interface NodeUtilizationSummary {
  peakUtilization: number | undefined;
  bottleneckLabel: string | undefined;
}

function readNodeUtilization(nodes: readonly Node[]): NodeUtilizationSummary {
  let peak: number | undefined;
  let label: string | undefined;
  for (const node of nodes) {
    const data = node.data as Record<string, unknown> | undefined;
    const metrics = data?.metrics as Record<string, unknown> | undefined;
    const utilization = metrics?.utilization;
    if (typeof utilization !== 'number' || !Number.isFinite(utilization)) continue;
    if (peak === undefined || utilization > peak) {
      peak = utilization;
      label =
        (data?.label as string | undefined) ??
        (data?.componentType as string | undefined) ??
        node.id;
    }
  }
  return { peakUtilization: peak, bottleneckLabel: label };
}

// ---------------------------------------------------------------------------
// ThresholdVerdictCard
// ---------------------------------------------------------------------------

export const ThresholdVerdictCard = memo(function ThresholdVerdictCard() {
  const status = useSimulationStore((s) => s.status);
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const consoleMessages = useSimulationStore((s) => s.consoleMessages);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);

  const [showRaw, setShowRaw] = useState(false);
  const headingId = useId();

  const verdict = useMemo<RunVerdict | null>(() => {
    if (status !== 'completed' || metricsHistory.length === 0) return null;

    // Worst-case observed values across the run (windowed snapshots).
    let peakP50 = 0;
    let peakP99 = 0;
    let peakErrorRate = 0;
    for (const snapshot of metricsHistory) {
      if (snapshot.p50LatencyMs > peakP50) peakP50 = snapshot.p50LatencyMs;
      if (snapshot.p99LatencyMs > peakP99) peakP99 = snapshot.p99LatencyMs;
      if (snapshot.errorRate > peakErrorRate) peakErrorRate = snapshot.errorRate;
    }

    // Whole-run completion fraction: what share of requests made it through.
    const final = metricsHistory[metricsHistory.length - 1];
    const deliveredRatio =
      final.totalRequests > 0
        ? final.successfulRequests / final.totalRequests
        : undefined;

    const { peakUtilization, bottleneckLabel } = readNodeUtilization(nodes);

    const costState = orchestratorRef?.getCostState();
    const costPerHour =
      costState && costState.currentHourlyRate > 0
        ? costState.currentHourlyRate
        : undefined;

    // Detected issues from the engine, enriched with the console-stream
    // narratives the orchestrator logged during the run.
    const narrativeByCode = extractIssueNarratives(consoleMessages);
    const labelByNodeId = new Map<string, string>();
    for (const node of nodes) {
      const data = node.data as Record<string, unknown> | undefined;
      labelByNodeId.set(
        node.id,
        (data?.label as string | undefined) ??
          (data?.componentType as string | undefined) ??
          node.id,
      );
    }

    const issues: VerdictIssueInput[] = [];
    const tickHistory = orchestratorRef?.getTickHistory() ?? [];
    for (const tick of tickHistory) {
      for (const evt of tick.nodeEvents) {
        if (!isIssueSeverity(evt.severity)) continue;
        issues.push({
          issueCode: evt.issueCode,
          nodeLabel: labelByNodeId.get(evt.nodeId) ?? evt.nodeId,
          severity: evt.severity,
          narrative: narrativeByCode.get(evt.issueCode),
        });
      }
    }

    return buildVerdict(
      {
        p50LatencyMs: peakP50,
        p99LatencyMs: peakP99,
        errorRate: peakErrorRate,
        peakUtilization,
        bottleneckLabel,
        costPerHour,
        deliveredRatio,
      },
      issues,
    );
  }, [status, metricsHistory, consoleMessages, orchestratorRef, nodes]);

  if (!verdict) return null;

  const HeaderIcon = BAND_ICON[verdict.worstBand];

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl border border-border bg-elevated"
    >
      {/* Verdict header */}
      <div className="relative border-b border-border/60 px-4 py-3">
        <div
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 w-0.5',
            BAND_DOT[verdict.worstBand],
          )}
        />
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h3
            id={headingId}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted"
          >
            <HeaderIcon
              className={cn('h-3.5 w-3.5', BAND_ICON_COLOR[verdict.worstBand])}
            />
            Verdict
          </h3>
          <BandChip band={verdict.worstBand} />
        </div>
        <p className="text-sm font-medium leading-snug text-foreground">
          {verdict.headline}
        </p>
      </div>

      {/* Per-metric band rows */}
      <ul className="divide-y divide-border/40">
        {verdict.metrics.map((metric) => (
          <MetricRow key={metric.kind} metric={metric} showRaw={showRaw} />
        ))}
      </ul>

      {/* Raw-number disclosure */}
      <div className="border-t border-border/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          aria-expanded={showRaw}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-200',
              showRaw && 'rotate-180',
            )}
          />
          {showRaw ? 'Hide raw numbers' : 'Show raw numbers'}
        </button>
      </div>
    </section>
  );
});

// ---------------------------------------------------------------------------
// MetricRow
// ---------------------------------------------------------------------------

interface MetricRowProps {
  metric: MetricVerdict;
  showRaw: boolean;
}

function MetricRow({ metric, showRaw }: MetricRowProps) {
  return (
    <li className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30">
      <BandChip band={metric.band} className="mt-0.5 w-24 justify-center" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {metric.metricLabel}
          </span>
          <span
            aria-hidden={!showRaw}
            className={cn(
              'font-mono text-[11px] tabular-nums text-foreground-muted transition-opacity duration-200',
              showRaw ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
            )}
          >
            {metric.formattedValue}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground-muted">
          {metric.causalSentence ?? metric.explanation}
        </p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// BandChip
// ---------------------------------------------------------------------------

interface BandChipProps {
  band: ThresholdBand;
  className?: string;
}

function BandChip({ band, className }: BandChipProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        BAND_CHIP[band],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', BAND_DOT[band])} />
      {BAND_DISPLAY[band]}
    </span>
  );
}
