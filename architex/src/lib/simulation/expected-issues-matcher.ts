/**
 * Expected Issues Matcher (TPL teaching layer)
 *
 * Pure logic that compares a template's authored `simulation.expectedIssues`
 * against the issues a simulation run actually surfaced (tick history
 * `nodeEvents`). Used by ExpectedIssuesCard to render the post-run
 * "The simulation surfaced N of M known bottlenecks" teaching moment.
 *
 * Matching strategy: a detected issue event is evidence for an expected
 * issue when the event's nodeId is one of the expected issue's
 * `affectedNodes`. Template node IDs are preserved on canvas load, so node
 * overlap is the most reliable signal available — issue codes are
 * engine-taxonomy identifiers (INFRA-001…) while expected issues are
 * free-text, so code-level matching would be guesswork.
 */

import type { ExpectedIssue } from '@/lib/templates/types';
import type { TickRecord } from './report-generator';
import { ISSUE_CATALOG } from './issue-taxonomy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single detected issue occurrence, flattened out of tick history. */
export interface DetectedIssueEvent {
  nodeId: string;
  issueCode: string;
  severity: string;
  tick: number;
}

/** Aggregated evidence that an expected issue actually surfaced. */
export interface MatchedEvidence {
  issueCode: string;
  nodeId: string;
  /** Highest severity observed for this (issueCode, nodeId) pair. */
  severity: string;
  /** Earliest tick at which this evidence appeared. */
  firstSeenTick: number;
  /** How many ticks reported this (issueCode, nodeId) pair. */
  occurrences: number;
  /** Catalog title for the issue code, when the engine knows it. */
  title: string | null;
  /** Engine narrative (catalog root-cause description) for the code. */
  narrative: string | null;
}

/** Comparison result for one expected issue. */
export interface ExpectedIssueMatch {
  expected: ExpectedIssue;
  found: boolean;
  /** Evidence sorted by severity (critical first), then earliest tick. */
  evidence: MatchedEvidence[];
}

/** Full comparison of a template's expected issues vs a run. */
export interface ExpectedIssuesComparison {
  matches: ExpectedIssueMatch[];
  foundCount: number;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function severityRank(severity: string): number {
  return SEVERITY_RANK[severity] ?? 0;
}

/** Lazy code → catalog entry lookup (built once per module). */
const ISSUE_BY_CODE = new Map(ISSUE_CATALOG.map((issue) => [issue.code, issue]));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Flatten orchestrator tick history into a list of detected issue events. */
export function flattenTickHistory(
  tickHistory: readonly TickRecord[],
): DetectedIssueEvent[] {
  return tickHistory.flatMap((record) =>
    record.nodeEvents.map((evt) => ({
      nodeId: evt.nodeId,
      issueCode: evt.issueCode,
      severity: evt.severity,
      tick: record.tick,
    })),
  );
}

/**
 * Compare authored expected issues against detected issue events.
 *
 * Returns one match entry per expected issue (in authored order), with
 * deduplicated evidence and overall found/total counts.
 */
export function compareExpectedIssues(
  expectedIssues: readonly ExpectedIssue[],
  events: readonly DetectedIssueEvent[],
): ExpectedIssuesComparison {
  const matches = expectedIssues.map((expected) =>
    matchExpectedIssue(expected, events),
  );

  return {
    matches,
    foundCount: matches.filter((m) => m.found).length,
    totalCount: matches.length,
  };
}

/** Match a single expected issue against detected events. */
export function matchExpectedIssue(
  expected: ExpectedIssue,
  events: readonly DetectedIssueEvent[],
): ExpectedIssueMatch {
  const affected = new Set(expected.affectedNodes);

  // Aggregate matching events by (issueCode, nodeId)
  const byKey = new Map<
    string,
    { issueCode: string; nodeId: string; severity: string; firstSeenTick: number; occurrences: number }
  >();

  for (const evt of events) {
    if (!affected.has(evt.nodeId)) continue;

    const key = `${evt.issueCode}::${evt.nodeId}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, {
        issueCode: evt.issueCode,
        nodeId: evt.nodeId,
        severity: evt.severity,
        firstSeenTick: evt.tick,
        occurrences: 1,
      });
    } else {
      byKey.set(key, {
        ...prev,
        severity:
          severityRank(evt.severity) > severityRank(prev.severity)
            ? evt.severity
            : prev.severity,
        firstSeenTick: Math.min(prev.firstSeenTick, evt.tick),
        occurrences: prev.occurrences + 1,
      });
    }
  }

  const evidence: MatchedEvidence[] = [...byKey.values()]
    .map((agg) => {
      const catalogEntry = ISSUE_BY_CODE.get(agg.issueCode);
      return {
        ...agg,
        title: catalogEntry?.title ?? null,
        narrative: catalogEntry?.cause ?? null,
      };
    })
    .sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        a.firstSeenTick - b.firstSeenTick ||
        a.issueCode.localeCompare(b.issueCode),
    );

  return {
    expected,
    found: evidence.length > 0,
    evidence,
  };
}
