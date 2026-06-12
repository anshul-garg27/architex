import { describe, it, expect } from 'vitest';
import type { ExpectedIssue } from '@/lib/templates/types';
import type { TickRecord } from '../report-generator';
import {
  compareExpectedIssues,
  flattenTickHistory,
  matchExpectedIssue,
  type DetectedIssueEvent,
} from '../expected-issues-matcher';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExpected(overrides: Partial<ExpectedIssue> = {}): ExpectedIssue {
  return {
    id: 'ei-hot-keys',
    title: 'Hot Key Concentration',
    description: 'Viral URLs create hot keys in Redis',
    affectedNodes: ['cache'],
    likelihood: 4,
    impact: 3,
    mitigation: 'Local cache, CDN pinning for viral content',
    ...overrides,
  };
}

function makeEvent(overrides: Partial<DetectedIssueEvent> = {}): DetectedIssueEvent {
  return {
    nodeId: 'cache',
    issueCode: 'CACHE-001',
    severity: 'high',
    tick: 10,
    ...overrides,
  };
}

function makeTick(
  tick: number,
  nodeEvents: TickRecord['nodeEvents'],
): TickRecord {
  return {
    tick,
    timestampMs: tick * 100,
    rpsAtTick: 500,
    globalErrorRate: 0.01,
    avgLatencyMs: 20,
    p99LatencyMs: 80,
    nodeEvents,
  };
}

// ---------------------------------------------------------------------------
// flattenTickHistory
// ---------------------------------------------------------------------------

describe('flattenTickHistory', () => {
  it('returns empty array for empty history', () => {
    expect(flattenTickHistory([])).toEqual([]);
  });

  it('flattens nodeEvents across ticks and tags each with its tick', () => {
    const history = [
      makeTick(1, [{ nodeId: 'cache', issueCode: 'CACHE-001', severity: 'high' }]),
      makeTick(2, []),
      makeTick(3, [
        { nodeId: 'database', issueCode: 'DATA-001', severity: 'critical' },
        { nodeId: 'cache', issueCode: 'CACHE-001', severity: 'medium' },
      ]),
    ];

    const events = flattenTickHistory(history);

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      nodeId: 'cache',
      issueCode: 'CACHE-001',
      severity: 'high',
      tick: 1,
    });
    expect(events[1].tick).toBe(3);
    expect(events[2].tick).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// matchExpectedIssue
// ---------------------------------------------------------------------------

describe('matchExpectedIssue', () => {
  it('marks an issue found when a detected event hits an affected node', () => {
    const match = matchExpectedIssue(makeExpected(), [makeEvent()]);

    expect(match.found).toBe(true);
    expect(match.evidence).toHaveLength(1);
    expect(match.evidence[0].issueCode).toBe('CACHE-001');
    expect(match.evidence[0].nodeId).toBe('cache');
  });

  it('marks an issue not found when no event touches its nodes', () => {
    const match = matchExpectedIssue(makeExpected(), [
      makeEvent({ nodeId: 'web-server' }),
    ]);

    expect(match.found).toBe(false);
    expect(match.evidence).toEqual([]);
  });

  it('never matches an expected issue with empty affectedNodes', () => {
    const match = matchExpectedIssue(makeExpected({ affectedNodes: [] }), [
      makeEvent(),
    ]);

    expect(match.found).toBe(false);
  });

  it('dedupes evidence by (issueCode, nodeId) keeping earliest tick and counting occurrences', () => {
    const match = matchExpectedIssue(makeExpected(), [
      makeEvent({ tick: 12 }),
      makeEvent({ tick: 5 }),
      makeEvent({ tick: 30 }),
    ]);

    expect(match.evidence).toHaveLength(1);
    expect(match.evidence[0].firstSeenTick).toBe(5);
    expect(match.evidence[0].occurrences).toBe(3);
  });

  it('keeps the highest severity seen for deduped evidence', () => {
    const match = matchExpectedIssue(makeExpected(), [
      makeEvent({ severity: 'low', tick: 1 }),
      makeEvent({ severity: 'critical', tick: 9 }),
      makeEvent({ severity: 'medium', tick: 11 }),
    ]);

    expect(match.evidence[0].severity).toBe('critical');
    expect(match.evidence[0].firstSeenTick).toBe(1);
  });

  it('sorts evidence by severity rank, then earliest tick', () => {
    const expected = makeExpected({ affectedNodes: ['cache', 'database'] });
    const match = matchExpectedIssue(expected, [
      makeEvent({ nodeId: 'cache', issueCode: 'CACHE-002', severity: 'medium', tick: 2 }),
      makeEvent({ nodeId: 'database', issueCode: 'DATA-001', severity: 'critical', tick: 8 }),
      makeEvent({ nodeId: 'cache', issueCode: 'CACHE-001', severity: 'medium', tick: 1 }),
    ]);

    expect(match.evidence.map((e) => e.issueCode)).toEqual([
      'DATA-001',
      'CACHE-001',
      'CACHE-002',
    ]);
  });

  it('attaches catalog title and narrative for known issue codes', () => {
    const match = matchExpectedIssue(makeExpected(), [
      makeEvent({ issueCode: 'INFRA-001' }),
    ]);

    expect(match.evidence[0].title).toBe('CPU Throttling');
    expect(match.evidence[0].narrative).toContain('CPU utilization');
  });

  it('returns null title/narrative for unknown issue codes', () => {
    const match = matchExpectedIssue(makeExpected(), [
      makeEvent({ issueCode: 'NOT-A-REAL-CODE' }),
    ]);

    expect(match.found).toBe(true);
    expect(match.evidence[0].title).toBeNull();
    expect(match.evidence[0].narrative).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// compareExpectedIssues
// ---------------------------------------------------------------------------

describe('compareExpectedIssues', () => {
  it('returns zero counts for empty expected issues', () => {
    const result = compareExpectedIssues([], [makeEvent()]);

    expect(result.totalCount).toBe(0);
    expect(result.foundCount).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('counts found vs total across multiple expected issues', () => {
    const expected = [
      makeExpected({ id: 'ei-1', affectedNodes: ['cache'] }),
      makeExpected({ id: 'ei-2', affectedNodes: ['web-server', 'database'] }),
      makeExpected({ id: 'ei-3', affectedNodes: ['cdn'] }),
    ];
    const events = [
      makeEvent({ nodeId: 'cache' }),
      makeEvent({ nodeId: 'database', issueCode: 'DATA-002', severity: 'critical' }),
    ];

    const result = compareExpectedIssues(expected, events);

    expect(result.totalCount).toBe(3);
    expect(result.foundCount).toBe(2);
    expect(result.matches.map((m) => m.found)).toEqual([true, true, false]);
  });

  it('preserves authored order of expected issues', () => {
    const expected = [
      makeExpected({ id: 'b-second', affectedNodes: ['x'] }),
      makeExpected({ id: 'a-first', affectedNodes: ['cache'] }),
    ];

    const result = compareExpectedIssues(expected, [makeEvent()]);

    expect(result.matches.map((m) => m.expected.id)).toEqual([
      'b-second',
      'a-first',
    ]);
  });

  it('does not mutate its inputs', () => {
    const expected = [makeExpected()];
    const events = [makeEvent({ tick: 3 }), makeEvent({ tick: 1 })];
    const expectedSnapshot = JSON.parse(JSON.stringify(expected));
    const eventsSnapshot = JSON.parse(JSON.stringify(events));

    compareExpectedIssues(expected, events);

    expect(expected).toEqual(expectedSnapshot);
    expect(events).toEqual(eventsSnapshot);
  });
});
