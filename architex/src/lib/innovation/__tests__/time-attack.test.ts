import { afterAll, describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTimeAttackSession,
  startSession,
  tickSession,
  completeSession,
  checkRequirements,
  calculateScore,
  hasMinNodes,
  hasNodeType,
  hasConnection,
  hasMinEdges,
  TIME_ATTACK_CHALLENGES,
  getChallengeById,
  getChallengesByDifficulty,
} from '../time-attack';
import type {
  TimeAttackChallenge,
  TimeAttackSession,
  CanvasSnapshot,
} from '../time-attack';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChallenge(overrides: Partial<TimeAttackChallenge> = {}): TimeAttackChallenge {
  return {
    challengeId: 'test-challenge',
    title: 'Test Challenge',
    description: 'A test challenge.',
    difficulty: 'beginner',
    timeLimit: 60,
    requirements: [
      { id: 'req-min-nodes', label: 'At least 2 nodes', check: { kind: 'hasMinNodes', min: 2 } },
      { id: 'req-db', label: 'Has a database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'req-conn', label: 'Client to server', check: { kind: 'hasConnection', from: 'client', to: 'web-server' } },
    ],
    ...overrides,
  };
}

function makeCanvas(
  nodes: Array<{ id: string; type?: string }> = [],
  edges: Array<{ source: string; target: string }> = [],
): CanvasSnapshot {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: 0, y: 0 },
      data: {},
    })),
    edges: edges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
    })),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Time Attack – session creation', () => {
  it('creates a session with status "waiting"', () => {
    const session = createTimeAttackSession(makeChallenge());
    expect(session.status).toBe('waiting');
    expect(session.startedAt).toBe(0);
  });

  it('sets remainingSeconds to the challenge timeLimit', () => {
    const session = createTimeAttackSession(makeChallenge({ timeLimit: 120 }));
    expect(session.remainingSeconds).toBe(120);
  });

  it('elapsed starts at 0', () => {
    const session = createTimeAttackSession(makeChallenge());
    expect(session.elapsedSeconds).toBe(0);
  });

  it('stores the challenge reference', () => {
    const challenge = makeChallenge({ challengeId: 'my-ch' });
    const session = createTimeAttackSession(challenge);
    expect(session.challenge.challengeId).toBe('my-ch');
  });
});

describe('Time Attack – tick countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('startSession sets status to "active" and records startedAt', () => {
    vi.setSystemTime(10_000);
    const session = startSession(createTimeAttackSession(makeChallenge()));
    expect(session.status).toBe('active');
    expect(session.startedAt).toBe(10_000);
  });

  it('tickSession decrements remaining seconds', () => {
    vi.setSystemTime(0);
    let session = startSession(createTimeAttackSession(makeChallenge({ timeLimit: 10 })));

    vi.setSystemTime(3_000);
    session = tickSession(session);
    expect(session.elapsedSeconds).toBe(3);
    expect(session.remainingSeconds).toBe(7);
    expect(session.status).toBe('active');
  });

  it('tickSession sets status to "expired" when time runs out', () => {
    vi.setSystemTime(0);
    let session = startSession(createTimeAttackSession(makeChallenge({ timeLimit: 5 })));

    vi.setSystemTime(5_000);
    session = tickSession(session);
    expect(session.remainingSeconds).toBe(0);
    expect(session.status).toBe('expired');
  });

  it('tickSession is a no-op for non-active sessions', () => {
    const waiting = createTimeAttackSession(makeChallenge());
    const result = tickSession(waiting);
    expect(result).toBe(waiting); // same reference
  });

  it('completeSession marks status as completed', () => {
    vi.setSystemTime(0);
    let session = startSession(createTimeAttackSession(makeChallenge({ timeLimit: 60 })));

    vi.setSystemTime(20_000);
    session = completeSession(session);
    expect(session.status).toBe('completed');
    expect(session.elapsedSeconds).toBe(20);
    expect(session.remainingSeconds).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// Requirement checking
// ---------------------------------------------------------------------------

describe('Time Attack – requirement checking', () => {
  it('hasMinNodes returns true when enough nodes present', () => {
    const canvas = makeCanvas([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(hasMinNodes(canvas, 3)).toBe(true);
    expect(hasMinNodes(canvas, 4)).toBe(false);
  });

  it('hasNodeType returns true when node of type exists', () => {
    const canvas = makeCanvas([
      { id: 'n1', type: 'web-server' },
      { id: 'n2', type: 'database' },
    ]);
    expect(hasNodeType(canvas, 'database')).toBe(true);
    expect(hasNodeType(canvas, 'cache')).toBe(false);
  });

  it('hasConnection returns true when matching edge exists', () => {
    const canvas = makeCanvas(
      [
        { id: 'c1', type: 'client' },
        { id: 's1', type: 'web-server' },
      ],
      [{ source: 'c1', target: 's1' }],
    );
    expect(hasConnection(canvas, 'client', 'web-server')).toBe(true);
    expect(hasConnection(canvas, 'web-server', 'client')).toBe(false);
  });

  it('hasConnection returns false when types exist but no edge', () => {
    const canvas = makeCanvas([
      { id: 'c1', type: 'client' },
      { id: 's1', type: 'web-server' },
    ]);
    expect(hasConnection(canvas, 'client', 'web-server')).toBe(false);
  });

  it('hasMinEdges checks edge count', () => {
    const canvas = makeCanvas(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
    );
    expect(hasMinEdges(canvas, 2)).toBe(true);
    expect(hasMinEdges(canvas, 3)).toBe(false);
  });

  it('checkRequirements categorizes met and unmet', () => {
    const session = createTimeAttackSession(makeChallenge());
    const canvas = makeCanvas(
      [
        { id: 'c1', type: 'client' },
        { id: 's1', type: 'web-server' },
        { id: 'd1', type: 'database' },
      ],
      [{ source: 'c1', target: 's1' }],
    );

    const result = checkRequirements(session, canvas);
    expect(result.total).toBe(3);
    expect(result.met).toContain('req-min-nodes');
    expect(result.met).toContain('req-db');
    expect(result.met).toContain('req-conn');
    expect(result.metCount).toBe(3);
    expect(result.unmet).toHaveLength(0);
  });

  it('checkRequirements marks unmet when requirements fail', () => {
    const session = createTimeAttackSession(makeChallenge());
    const canvas = makeCanvas([{ id: 'c1', type: 'client' }]);

    const result = checkRequirements(session, canvas);
    expect(result.unmet).toContain('req-min-nodes');
    expect(result.unmet).toContain('req-db');
    expect(result.unmet).toContain('req-conn');
    expect(result.metCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

describe('Time Attack – score calculation', () => {
  it('score is 0 when no requirements met', () => {
    const session: TimeAttackSession = {
      challenge: makeChallenge(),
      status: 'completed',
      startedAt: 0,
      remainingSeconds: 30,
      elapsedSeconds: 30,
    };
    const canvas = makeCanvas([]);
    const score = calculateScore(session, canvas);
    expect(score.requirementScore).toBe(0);
    expect(score.finalScore).toBe(0);
  });

  it('full requirements with time remaining yields score > 100', () => {
    const session: TimeAttackSession = {
      challenge: makeChallenge({ timeLimit: 60 }),
      status: 'completed',
      startedAt: 0,
      remainingSeconds: 30,
      elapsedSeconds: 30,
    };
    const canvas = makeCanvas(
      [
        { id: 'c1', type: 'client' },
        { id: 's1', type: 'web-server' },
        { id: 'd1', type: 'database' },
      ],
      [{ source: 'c1', target: 's1' }],
    );

    const score = calculateScore(session, canvas);
    expect(score.requirementScore).toBe(100);
    // timeBonus = 1 + 30/60 = 1.5
    expect(score.timeBonus).toBe(1.5);
    expect(score.finalScore).toBe(150);
  });

  it('time bonus is 1.0 when no time remaining', () => {
    const session: TimeAttackSession = {
      challenge: makeChallenge({ timeLimit: 60 }),
      status: 'expired',
      startedAt: 0,
      remainingSeconds: 0,
      elapsedSeconds: 60,
    };
    const canvas = makeCanvas(
      [
        { id: 'c1', type: 'client' },
        { id: 's1', type: 'web-server' },
        { id: 'd1', type: 'database' },
      ],
      [{ source: 'c1', target: 's1' }],
    );

    const score = calculateScore(session, canvas);
    expect(score.timeBonus).toBe(1);
    expect(score.finalScore).toBe(100);
  });

  it('partial requirements yield proportional score', () => {
    const session: TimeAttackSession = {
      challenge: makeChallenge({ timeLimit: 60 }),
      status: 'completed',
      startedAt: 0,
      remainingSeconds: 0,
      elapsedSeconds: 60,
    };
    // Only 1 of 3 requirements met (hasMinNodes needs 2, we have 2 nodes)
    const canvas = makeCanvas([
      { id: 'c1', type: 'client' },
      { id: 's1', type: 'web-server' },
    ]);

    const score = calculateScore(session, canvas);
    // met: hasMinNodes (2 >= 2) => 1 of 3 => ~33
    expect(score.requirementScore).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// Built-in challenges data
// ---------------------------------------------------------------------------

describe('Time Attack – built-in challenges', () => {
  it('has 8 built-in challenges', () => {
    expect(TIME_ATTACK_CHALLENGES).toHaveLength(8);
  });

  it('each challenge has unique ID', () => {
    const ids = TIME_ATTACK_CHALLENGES.map((c) => c.challengeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getChallengeById returns correct challenge', () => {
    const ch = getChallengeById('basic-web-app');
    expect(ch).toBeDefined();
    expect(ch!.title).toBe('Basic Web Application');
  });

  it('getChallengeById returns undefined for unknown', () => {
    expect(getChallengeById('nonexistent')).toBeUndefined();
  });

  it('getChallengesByDifficulty filters correctly', () => {
    const beginners = getChallengesByDifficulty('beginner');
    expect(beginners.length).toBeGreaterThan(0);
    for (const c of beginners) {
      expect(c.difficulty).toBe('beginner');
    }
  });

  it('all challenges have at least 1 requirement', () => {
    for (const ch of TIME_ATTACK_CHALLENGES) {
      expect(ch.requirements.length).toBeGreaterThan(0);
    }
  });
});
