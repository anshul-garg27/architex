'use client';

/**
 * ScenarioVerdictCard (Survive This Incident — post-run verdict)
 *
 * Rendered inside the PostSimulationReport tab when a chaos scenario was
 * armed for the run. Shows:
 *   - PASS / FAIL hero verdict from the scenario store
 *   - per-SLA rows (target vs measured, penalty on breach)
 *   - which injected chaos event broke what (correlated with the
 *     orchestrator's tick-history issue events)
 *   - incident playbook steps as "what an on-call would have done"
 *
 * Renders null when no scenario was armed or no verdict exists yet.
 */

import { memo, useMemo } from 'react';
import {
  ClipboardList,
  ShieldCheck,
  ShieldX,
  Siren,
  Wrench,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScenarioStore } from '@/stores/scenario-store';
import { useTemplateMetaStore } from '@/stores/template-meta-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { SIM_TICK_MS, type SlaCheckResult } from '@/lib/simulation/scenario-runner';
import type { ScenarioInjectionRecord } from '@/stores/scenario-store';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') return `${value.toFixed(value < 10 ? 1 : 0)}ms`;
  if (unit === '%') return `${value.toFixed(2)}%`;
  return `${value.toFixed(0)} ${unit}`;
}

function formatTarget(check: SlaCheckResult): string {
  const symbol = check.comparator === 'lte' ? '≤' : '≥';
  return `${symbol} ${formatValue(check.target, check.unit)}`;
}

const RUNBOOK_SEVERITY_CHIP: Record<string, string> = {
  critical: 'bg-severity-critical/20 text-severity-critical',
  high: 'bg-severity-high/20 text-severity-high',
  medium: 'bg-severity-medium/20 text-severity-medium',
  low: 'bg-severity-low/20 text-severity-low',
};

// ---------------------------------------------------------------------------
// Issue correlation
// ---------------------------------------------------------------------------

interface CorrelatedIssue {
  nodeId: string;
  nodeLabel: string;
  issueCode: string;
}

interface InjectionImpact {
  injection: ScenarioInjectionRecord;
  issues: CorrelatedIssue[];
}

const MAX_ISSUES_PER_INJECTION = 6;

// ---------------------------------------------------------------------------
// SLA row
// ---------------------------------------------------------------------------

function SlaRow({ check }: { check: SlaCheckResult }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        check.status === 'fail'
          ? 'border-severity-critical/40 bg-severity-critical/10'
          : 'border-border bg-elevated',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {check.name}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-foreground-muted">
          {formatTarget(check)}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
          {check.measured !== null ? formatValue(check.measured, check.unit) : '—'}
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
            check.status === 'pass' && 'bg-state-success/20 text-state-success',
            check.status === 'fail' &&
              'bg-severity-critical/20 text-severity-critical',
            check.status === 'unknown' && 'bg-muted text-foreground-muted',
          )}
        >
          {check.status === 'unknown' ? 'n/a' : check.status}
        </span>
      </div>
      {check.status === 'fail' && check.penalty && (
        <p className="mt-1 text-[10px] text-severity-critical/90">
          Contractual penalty: {check.penalty}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScenarioVerdictCard
// ---------------------------------------------------------------------------

export const ScenarioVerdictCard = memo(function ScenarioVerdictCard() {
  const armedScenario = useScenarioStore((s) => s.armedScenario);
  const verdict = useScenarioStore((s) => s.verdict);
  const injections = useScenarioStore((s) => s.injections);
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);

  // Correlate fired injections with issues detected after each landed.
  const impacts = useMemo<InjectionImpact[]>(() => {
    if (injections.length === 0) return [];

    const labelByNode = new Map<string, string>();
    for (const node of nodes) {
      const data = node.data as Record<string, unknown> | undefined;
      labelByNode.set(node.id, (data?.label as string) ?? node.id);
    }

    const tickHistory = orchestratorRef?.getTickHistory() ?? [];
    const sorted = [...injections].sort(
      (a, b) => a.firedAtSimMs - b.firedAtSimMs,
    );

    return sorted.map((injection, idx) => {
      const windowStart = injection.firedAtSimMs;
      const windowEnd = sorted[idx + 1]?.firedAtSimMs ?? Number.POSITIVE_INFINITY;
      const seen = new Set<string>();
      const issues: CorrelatedIssue[] = [];

      for (const tick of tickHistory) {
        const simMs = tick.tick * SIM_TICK_MS;
        if (simMs < windowStart || simMs >= windowEnd) continue;
        for (const evt of tick.nodeEvents) {
          const key = `${evt.nodeId}:${evt.issueCode}`;
          if (seen.has(key)) continue;
          seen.add(key);
          issues.push({
            nodeId: evt.nodeId,
            nodeLabel: labelByNode.get(evt.nodeId) ?? evt.nodeId,
            issueCode: evt.issueCode,
          });
          if (issues.length >= MAX_ISSUES_PER_INJECTION) break;
        }
        if (issues.length >= MAX_ISSUES_PER_INJECTION) break;
      }

      return { injection, issues };
    });
  }, [injections, orchestratorRef, nodes]);

  if (!armedScenario || !verdict) return null;

  const playbook = activeTemplate?.simulation?.incidentPlaybook;
  const evaluable = verdict.passCount + verdict.failCount;

  return (
    <section
      aria-label="Chaos scenario verdict"
      className="overflow-hidden rounded-xl border border-border"
    >
      {/* Hero verdict */}
      <div
        className={cn(
          'flex items-center gap-3 border-b px-4 py-3',
          verdict.passed
            ? 'border-state-success/30 bg-state-success/10'
            : 'border-severity-critical/30 bg-severity-critical/10',
        )}
      >
        {verdict.passed ? (
          <ShieldCheck className="h-8 w-8 shrink-0 text-state-success" />
        ) : (
          <ShieldX className="h-8 w-8 shrink-0 text-severity-critical" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'text-lg font-bold leading-tight tracking-tight',
              verdict.passed ? 'text-state-success' : 'text-severity-critical',
            )}
          >
            {verdict.passed ? 'SURVIVED' : 'SLA BREACHED'}
          </div>
          <p className="truncate text-[11px] text-foreground-muted">
            {armedScenario.name} · severity {armedScenario.severity}/5 ·{' '}
            {verdict.passCount}/{evaluable} SLA checks met
            {verdict.unknownCount > 0 && ` (${verdict.unknownCount} not measurable)`}
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-surface/40 p-4">
        {/* Per-SLA rows */}
        {verdict.checks.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              <ClipboardList className="h-3.5 w-3.5" />
              SLA scorecard
            </h4>
            <div className="space-y-1.5">
              {verdict.checks.map((check) => (
                <SlaRow
                  key={`${check.source}-${check.name}-${check.metric}`}
                  check={check}
                />
              ))}
            </div>
          </div>
        )}

        {/* What broke */}
        {impacts.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              <Zap className="h-3.5 w-3.5" />
              What the incident broke
            </h4>
            <div className="space-y-2">
              {impacts.map(({ injection, issues }) => (
                <div
                  key={`${injection.wave}-${injection.firedAtSimMs}`}
                  className="rounded-lg border border-border bg-elevated p-3"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-severity-high/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-severity-high">
                      T+{Math.round(injection.firedAtSimMs / 1000)}s
                    </span>
                    <span className="font-semibold text-foreground">
                      {injection.eventName}
                    </span>
                    {injection.wave === 'aftershock' && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase text-foreground-muted">
                        aftershock
                      </span>
                    )}
                    <span className="ml-auto truncate font-mono text-[10px] text-foreground-muted">
                      {injection.targetNodeIds.join(', ')}
                    </span>
                  </div>
                  {issues.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {issues.map((issue) => (
                        <span
                          key={`${issue.nodeId}-${issue.issueCode}`}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground"
                        >
                          {issue.nodeLabel}{' '}
                          <span className="font-mono text-foreground-muted">
                            {issue.issueCode}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[10px] text-foreground-muted">
                      No threshold-level issues detected downstream.
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] italic leading-snug text-foreground-muted">
              Expected: {armedScenario.expectedBehavior}
            </p>
          </div>
        )}

        {/* On-call response */}
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            <Siren className="h-3.5 w-3.5" />
            What an on-call would have done
          </h4>

          {armedScenario.mitigationSteps.length > 0 && (
            <div className="mb-2 rounded-lg border border-border bg-elevated p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Wrench className="h-3 w-3 text-primary" />
                Scenario mitigation
              </div>
              <ol className="list-inside list-decimal space-y-1 text-[11px] text-foreground-muted">
                {armedScenario.mitigationSteps.map((step, i) => (
                  <li key={`${i}-${step}`}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {playbook?.runbooks && playbook.runbooks.length > 0 ? (
            <div className="space-y-2">
              {playbook.runbooks.map((runbook) => (
                <div
                  key={runbook.incident}
                  className="rounded-lg border border-border bg-elevated p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {runbook.incident}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-medium uppercase',
                        RUNBOOK_SEVERITY_CHIP[runbook.severity] ??
                          RUNBOOK_SEVERITY_CHIP.medium,
                      )}
                    >
                      {runbook.severity}
                    </span>
                    {runbook.automatedRecovery && (
                      <span className="rounded bg-state-success/15 px-1.5 py-0.5 text-[9px] font-medium uppercase text-state-success">
                        auto-recovery
                      </span>
                    )}
                  </div>
                  <ol className="mt-1.5 list-inside list-decimal space-y-1 text-[11px] text-foreground-muted">
                    {runbook.steps.map((step, i) => (
                      <li key={`${i}-${step}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            armedScenario.mitigationSteps.length === 0 && (
              <p className="text-[11px] text-foreground-muted">
                No incident playbook defined for this template.
              </p>
            )
          )}
        </div>
      </div>
    </section>
  );
});
