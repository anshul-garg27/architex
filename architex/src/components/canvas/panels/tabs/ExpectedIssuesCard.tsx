'use client';

/**
 * ExpectedIssuesCard — post-run teaching moment
 *
 * Compares the active template's authored `simulation.expectedIssues`
 * (known failure modes the design author predicted) against the issues
 * the simulation run actually surfaced in its tick history, and renders
 * "The simulation surfaced N of M known bottlenecks in this design"
 * with a per-issue found / not-surfaced breakdown.
 *
 * Renders null when: no template is loaded, the template has no v2
 * expectedIssues metadata, or no completed run exists yet — so it can
 * be mounted unconditionally inside PostSimulationReport.
 */

import { memo, useMemo } from 'react';
import { Check, Crosshair, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useTemplateMetaStore } from '@/stores/template-meta-store';
import {
  compareExpectedIssues,
  flattenTickHistory,
  type ExpectedIssueMatch,
  type ExpectedIssuesComparison,
} from '@/lib/simulation/expected-issues-matcher';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_CHIP_CLASSES: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical',
  high: 'bg-severity-high/15 text-severity-high',
  medium: 'bg-severity-medium/15 text-severity-medium',
  low: 'bg-severity-low/15 text-severity-low',
};

function severityChipClass(severity: string): string {
  return SEVERITY_CHIP_CLASSES[severity] ?? 'bg-muted text-foreground-muted';
}

// ---------------------------------------------------------------------------
// Per-issue row
// ---------------------------------------------------------------------------

function ExpectedIssueRow({ match }: { match: ExpectedIssueMatch }) {
  const { expected, found, evidence } = match;
  const topEvidence = evidence[0];

  return (
    <li
      className={cn(
        'rounded-lg border px-3 py-2.5 transition-colors',
        found
          ? 'border-state-success/30 bg-state-success/[0.04] hover:border-state-success/50'
          : 'border-border bg-elevated hover:border-border/80',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Found / not-found badge */}
        <span
          className={cn(
            'mt-px flex h-4 shrink-0 items-center gap-1 rounded px-1.5 text-[10px] font-medium uppercase tracking-wide',
            found
              ? 'bg-state-success/15 text-state-success'
              : 'bg-muted text-foreground-muted',
          )}
        >
          {found ? (
            <>
              <Check className="h-2.5 w-2.5" />
              found
            </>
          ) : (
            <>
              <Minus className="h-2.5 w-2.5" />
              not surfaced
            </>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h4 className="text-xs font-semibold text-foreground">
              {expected.title}
            </h4>
            <span className="font-mono text-[10px] tabular-nums text-foreground-muted/70">
              L{expected.likelihood} · I{expected.impact}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-foreground-muted">
            {expected.description}
          </p>

          {/* Engine evidence when found */}
          {found && topEvidence && (
            <div className="mt-1.5 rounded-md bg-muted/40 px-2 py-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {evidence.slice(0, 3).map((ev) => (
                  <span
                    key={`${ev.issueCode}-${ev.nodeId}`}
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
                      severityChipClass(ev.severity),
                    )}
                    title={ev.title ?? ev.issueCode}
                  >
                    {ev.issueCode}
                  </span>
                ))}
                <span className="font-mono text-[10px] tabular-nums text-foreground-muted/70">
                  first at tick {topEvidence.firstSeenTick}
                </span>
              </div>
              {topEvidence.narrative && (
                <p className="mt-1 text-[11px] leading-relaxed text-foreground">
                  {topEvidence.title ? `${topEvidence.title}: ` : ''}
                  {topEvidence.narrative}
                </p>
              )}
            </div>
          )}

          {/* Teaching line: the authored mitigation */}
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-muted">
            <span className="font-medium text-foreground-muted/80">
              Mitigation:
            </span>{' '}
            {expected.mitigation}
          </p>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// ExpectedIssuesCard
// ---------------------------------------------------------------------------

export const ExpectedIssuesCard = memo(function ExpectedIssuesCard() {
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);
  const status = useSimulationStore((s) => s.status);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);

  const expectedIssues = activeTemplate?.simulation?.expectedIssues;

  const comparison = useMemo<ExpectedIssuesComparison | null>(() => {
    if (!expectedIssues || expectedIssues.length === 0) return null;
    if (status !== 'completed' || !orchestratorRef) return null;

    const tickHistory = orchestratorRef.getTickHistory();
    if (tickHistory.length === 0) return null;

    return compareExpectedIssues(expectedIssues, flattenTickHistory(tickHistory));
  }, [expectedIssues, status, orchestratorRef]);

  if (!comparison) return null;

  const { matches, foundCount, totalCount } = comparison;

  return (
    <section aria-label="Known bottlenecks check">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        <Crosshair className="h-3.5 w-3.5 text-primary" />
        Known Bottlenecks
      </h3>

      <div className="rounded-lg border border-border bg-elevated p-3">
        {/* Scorecard */}
        <div className="mb-2.5 flex items-center gap-3">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {foundCount}
            <span className="text-foreground-muted">/{totalCount}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground">
              The simulation surfaced {foundCount} of {totalCount} known
              bottleneck{totalCount === 1 ? '' : 's'} in this design.
            </p>
            <div
              className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-valuenow={foundCount}
              aria-label="Known bottlenecks surfaced"
            >
              <div
                className="h-full origin-left rounded-full bg-state-success transition-transform duration-300"
                style={{
                  transform: `scaleX(${totalCount > 0 ? foundCount / totalCount : 0})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Per-issue rows */}
        <ul className="space-y-2">
          {matches.map((match) => (
            <ExpectedIssueRow key={match.expected.id} match={match} />
          ))}
        </ul>
      </div>
    </section>
  );
});
