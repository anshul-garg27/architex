'use client';

/**
 * PostSimulationReport (UI-005)
 *
 * BottomPanel tab that renders the full simulation report after
 * the simulation completes. Uses report-generator.ts output and
 * renders key sections: executive summary, incident timeline,
 * root cause analysis, cost impact, and recommendations.
 *
 * Provides an export button to download the report as markdown.
 */

import { memo, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Download,
  FileText,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import {
  generateReport,
  reportToMarkdown,
  type SimulationReport,
  type NodeSimMetrics as ReportNodeSimMetrics,
} from '@/lib/simulation/report-generator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDollars(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// PostSimulationReport
// ---------------------------------------------------------------------------

export const PostSimulationReport = memo(function PostSimulationReport() {
  const status = useSimulationStore((s) => s.status);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const report = useMemo<SimulationReport | null>(() => {
    if (status !== 'completed' || !orchestratorRef) return null;

    const tickHistory = orchestratorRef.getTickHistory();
    if (tickHistory.length === 0) return null;

    // Build per-node metrics from tick history
    const metricsMap = new Map<string, ReportNodeSimMetrics>();
    const nodeUtilAccum = new Map<string, { sum: number; count: number; peak: number; issues: string[] }>();

    for (const tick of tickHistory) {
      for (const evt of tick.nodeEvents) {
        const accum = nodeUtilAccum.get(evt.nodeId) ?? { sum: 0, count: 0, peak: 0, issues: [] };
        accum.issues.push(evt.issueCode);
        nodeUtilAccum.set(evt.nodeId, accum);
      }
    }

    for (const [nodeId, accum] of nodeUtilAccum) {
      metricsMap.set(nodeId, {
        avgUtilization: accum.count > 0 ? accum.sum / accum.count : 0,
        peakUtilization: accum.peak,
        totalIssues: accum.issues.length,
        issueCodes: [...new Set(accum.issues)],
      });
    }

    // Get chaos log from the engine
    const chaosEngine = orchestratorRef.getChaosEngine();
    const chaosLog = chaosEngine
      .getActiveEvents()
      .map((e) => ({
        tick: 0,
        eventTypeId: e.eventTypeId,
        targetNodeIds: e.targetNodeIds,
      }));

    return generateReport(tickHistory, nodes, edges, metricsMap, chaosLog);
  }, [status, orchestratorRef, nodes, edges]);

  const handleExport = useCallback(() => {
    if (!report) return;
    const markdown = reportToMarkdown(report);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  if (!report) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Run a simulation to see the report.
      </div>
    );
  }

  const { summary, incidentTimeline, rootCauses, costImpact, recommendations, nodeBreakdown } = report;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Simulation Report
          </span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Download className="h-3 w-3" />
          Export .md
        </button>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {/* Executive Summary */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <BarChart3 className="h-3.5 w-3.5" />
            Executive Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <SummaryCard label="Ticks" value={String(summary.totalTicks)} />
            <SummaryCard label="Peak RPS" value={summary.peakRps.toFixed(0)} />
            <SummaryCard
              label="Peak Error"
              value={formatPercent(summary.peakErrorRate)}
              alert={summary.peakErrorRate > 0.05}
            />
            <SummaryCard
              label="Peak P99"
              value={`${summary.peakLatencyMs.toFixed(0)}ms`}
            />
            <SummaryCard
              label="Incidents"
              value={String(summary.totalIncidents)}
              alert={summary.totalIncidents > 0}
            />
            <SummaryCard
              label="Availability"
              value={`${summary.availabilityPercent.toFixed(1)}%`}
            />
            <SummaryCard
              label="Duration"
              value={`${(summary.durationMs / 1000).toFixed(0)}s`}
            />
          </div>
        </section>

        {/* Incident Timeline */}
        {incidentTimeline.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              <AlertTriangle className="h-3.5 w-3.5" />
              Incident Timeline ({incidentTimeline.length})
            </h3>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-elevated">
                  <tr className="border-b border-border text-left text-foreground-muted">
                    <th className="px-2 py-1.5 font-medium">Tick</th>
                    <th className="px-2 py-1.5 font-medium">Time</th>
                    <th className="px-2 py-1.5 font-medium">Node</th>
                    <th className="px-2 py-1.5 font-medium">Issue</th>
                    <th className="px-2 py-1.5 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentTimeline.slice(0, 50).map((evt, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 transition-colors hover:bg-elevated/50"
                    >
                      <td className="px-2 py-1 font-mono tabular-nums text-foreground">
                        {evt.tick}
                      </td>
                      <td className="px-2 py-1 font-mono tabular-nums text-foreground-muted">
                        {evt.timestamp}
                      </td>
                      <td className="px-2 py-1 text-foreground">{evt.nodeLabel}</td>
                      <td className="px-2 py-1 font-mono text-foreground-muted">
                        {evt.issueCode}
                      </td>
                      <td className="px-2 py-1">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                            evt.severity === 'critical' && 'bg-severity-critical/20 text-severity-critical',
                            evt.severity === 'high' && 'bg-severity-high/20 text-severity-high',
                            evt.severity === 'medium' && 'bg-severity-medium/20 text-severity-medium',
                            evt.severity === 'low' && 'bg-severity-low/20 text-severity-low',
                          )}
                        >
                          {evt.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Root Cause Analysis */}
        {rootCauses.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              <Shield className="h-3.5 w-3.5" />
              Root Causes ({rootCauses.length})
            </h3>
            <div className="space-y-2">
              {rootCauses.slice(0, 10).map((rc, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-elevated p-3"
                >
                  <div className="mb-1 text-xs font-semibold text-foreground">
                    {rc.issueCode}
                  </div>
                  <p className="mb-2 text-[11px] text-foreground-muted">
                    {rc.narrative}
                  </p>
                  {rc.propagationChain.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="font-medium text-foreground-muted">
                        Chain:
                      </span>
                      {rc.propagationChain.map((node, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && (
                            <ArrowRight className="h-2.5 w-2.5 text-foreground-muted" />
                          )}
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                            {node}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cost Impact */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <DollarSign className="h-3.5 w-3.5" />
            Cost Impact
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SummaryCard
              label="Hourly"
              value={formatDollars(costImpact.estimatedHourlyCost)}
            />
            <SummaryCard
              label="Monthly"
              value={formatDollars(costImpact.projectedMonthlyCost)}
            />
          </div>
          {costImpact.costByComponent.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-elevated">
                  <tr className="border-b border-border text-left text-foreground-muted">
                    <th className="px-2 py-1.5 font-medium">Component</th>
                    <th className="px-2 py-1.5 text-right font-medium">$/hr</th>
                  </tr>
                </thead>
                <tbody>
                  {costImpact.costByComponent.slice(0, 10).map((comp, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-2 py-1 text-foreground">
                        {comp.nodeLabel}
                      </td>
                      <td className="px-2 py-1 text-right font-mono tabular-nums text-foreground">
                        {formatDollars(comp.hourlyCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            Recommendations
          </h3>
          <ol className="list-inside list-decimal space-y-1.5">
            {recommendations.map((rec, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-foreground"
              >
                {rec}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  value: string;
  alert?: boolean;
}

function SummaryCard({ label, value, alert }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        alert
          ? 'border-severity-critical/40 bg-severity-critical/10'
          : 'border-border bg-elevated',
      )}
    >
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
