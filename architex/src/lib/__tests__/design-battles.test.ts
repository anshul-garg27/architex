import { describe, it, expect } from 'vitest';
import {
  calculateEloChange,
  scoreDesign,
  createBattleSession,
  submitDesign,
  finalizeBattle,
  createEloRating,
  applyEloResult,
  getBattleChallengeById,
  getBattleChallengesByDifficulty,
  BATTLE_CHALLENGES,
  type DesignSnapshot,
  type BattleRequirement,
  type BattleChallenge,
} from '../innovation/design-battles';

// ── Helpers ────────────────────────────────────────────────

function makeDesign(
  nodeTypes: string[],
  edgeCount: number = 0,
): DesignSnapshot {
  const nodes = nodeTypes.map((type, i) => ({
    id: `n-${i}`,
    type,
    position: { x: i * 100, y: 0 },
    data: { label: type },
  }));

  const edges = Array.from({ length: edgeCount }, (_, i) => ({
    id: `e-${i}`,
    source: nodes[i % nodes.length].id,
    target: nodes[(i + 1) % nodes.length].id,
  }));

  return { nodes, edges };
}

// ── Elo Calculation ────────────────────────────────────────

describe('calculateEloChange', () => {
  it('returns positive delta for winner, negative for loser', () => {
    const { winnerDelta, loserDelta } = calculateEloChange(1200, 1200);
    expect(winnerDelta).toBeGreaterThan(0);
    expect(loserDelta).toBeLessThan(0);
  });

  it('gives equal and opposite deltas for equally-rated players', () => {
    const { winnerDelta, loserDelta } = calculateEloChange(1200, 1200);
    expect(winnerDelta).toBe(-loserDelta);
  });

  it('gives a smaller gain when a stronger player beats a weaker one', () => {
    const strongBeatsWeak = calculateEloChange(1600, 1200);
    const equalMatch = calculateEloChange(1200, 1200);
    expect(strongBeatsWeak.winnerDelta).toBeLessThan(equalMatch.winnerDelta);
  });

  it('gives a larger gain when a weaker player beats a stronger one', () => {
    const upset = calculateEloChange(1200, 1600);
    const equalMatch = calculateEloChange(1200, 1200);
    expect(upset.winnerDelta).toBeGreaterThan(equalMatch.winnerDelta);
  });

  it('respects custom k-factor', () => {
    const low = calculateEloChange(1200, 1200, 16);
    const high = calculateEloChange(1200, 1200, 64);
    expect(high.winnerDelta).toBeGreaterThan(low.winnerDelta);
  });

  it('returns zero-sum deltas (sum of winner + loser is 0 or close)', () => {
    const { winnerDelta, loserDelta } = calculateEloChange(1350, 1150);
    // Due to rounding the sum may be -1, 0, or 1
    expect(Math.abs(winnerDelta + loserDelta)).toBeLessThanOrEqual(1);
  });

  it('handles very large rating differences', () => {
    const { winnerDelta, loserDelta } = calculateEloChange(2400, 800);
    // Winner is so much stronger that they gain almost nothing
    expect(winnerDelta).toBeLessThanOrEqual(2);
    expect(loserDelta).toBeGreaterThanOrEqual(-2);
  });

  it('handles very small rating differences', () => {
    const { winnerDelta } = calculateEloChange(1200, 1199);
    // Nearly equal — delta should be near k/2
    expect(winnerDelta).toBeGreaterThan(10);
  });
});

// ── Elo Rating records ─────────────────────────────────────

describe('EloRating helpers', () => {
  it('creates a fresh Elo record with default rating', () => {
    const elo = createEloRating();
    expect(elo.rating).toBe(1200);
    expect(elo.wins).toBe(0);
    expect(elo.losses).toBe(0);
    expect(elo.history).toHaveLength(0);
  });

  it('creates a fresh Elo record with custom rating', () => {
    const elo = createEloRating(1500);
    expect(elo.rating).toBe(1500);
  });

  it('applies a win result correctly', () => {
    const elo = createEloRating(1200);
    const updated = applyEloResult(elo, 1200, 'win', 16);
    expect(updated.rating).toBe(1216);
    expect(updated.wins).toBe(1);
    expect(updated.losses).toBe(0);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].result).toBe('win');
  });

  it('applies a loss result correctly', () => {
    const elo = createEloRating(1200);
    const updated = applyEloResult(elo, 1200, 'loss', -16);
    expect(updated.rating).toBe(1184);
    expect(updated.wins).toBe(0);
    expect(updated.losses).toBe(1);
  });
});

// ── Design Scoring ─────────────────────────────────────────

describe('scoreDesign', () => {
  const reqs: BattleRequirement[] = [
    { id: 'client', label: 'Add Client', weight: 1, check: { kind: 'hasNodeType', nodeType: 'client' } },
    { id: 'server', label: 'Add Server', weight: 2, check: { kind: 'hasNodeType', nodeType: 'web-server' } },
    { id: 'db', label: 'Add Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
    { id: 'edges', label: '2+ edges', weight: 1, check: { kind: 'hasMinEdges', min: 2 } },
  ];

  it('scores a perfect design correctly', () => {
    const design = makeDesign(['client', 'web-server', 'database'], 2);
    const result = scoreDesign(design, reqs);
    expect(result.score).toBe(50); // (1+2+1+1)*10
    expect(result.maxScore).toBe(50);
    expect(result.percentage).toBe(100);
    expect(result.breakdown.every((b) => b.met)).toBe(true);
  });

  it('scores an empty design as zero', () => {
    const design = makeDesign([], 0);
    const result = scoreDesign(design, reqs);
    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('scores a partial design correctly', () => {
    // Has client and server but no database, no edges
    const design = makeDesign(['client', 'web-server'], 0);
    const result = scoreDesign(design, reqs);
    expect(result.score).toBe(30); // client(10) + server(20)
    expect(result.percentage).toBe(60);
    const metIds = result.breakdown.filter((b) => b.met).map((b) => b.requirementId);
    expect(metIds).toContain('client');
    expect(metIds).toContain('server');
    expect(metIds).not.toContain('db');
    expect(metIds).not.toContain('edges');
  });

  it('handles weighted requirements in the breakdown', () => {
    const design = makeDesign(['web-server'], 0);
    const result = scoreDesign(design, reqs);
    const serverItem = result.breakdown.find((b) => b.requirementId === 'server');
    expect(serverItem?.met).toBe(true);
    expect(serverItem?.points).toBe(20); // weight 2 * 10
    expect(serverItem?.weight).toBe(2);
  });

  it('scores hasMinNodes check correctly', () => {
    const minNodeReqs: BattleRequirement[] = [
      { id: 'nodes', label: '3+ nodes', weight: 1, check: { kind: 'hasMinNodes', min: 3 } },
    ];
    expect(scoreDesign(makeDesign(['a', 'b', 'c']), minNodeReqs).score).toBe(10);
    expect(scoreDesign(makeDesign(['a', 'b']), minNodeReqs).score).toBe(0);
  });

  it('scores hasConnection check correctly', () => {
    const connReqs: BattleRequirement[] = [
      { id: 'conn', label: 'Connect A to B', weight: 1, check: { kind: 'hasConnection', from: 'client', to: 'web-server' } },
    ];
    const design: DesignSnapshot = {
      nodes: [
        { id: 'n1', type: 'client', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'web-server', position: { x: 100, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };
    expect(scoreDesign(design, connReqs).score).toBe(10);
  });

  it('handles hasNodeTypeCount check', () => {
    const countReqs: BattleRequirement[] = [
      { id: 'multi', label: '2+ servers', weight: 1, check: { kind: 'hasNodeTypeCount', nodeType: 'web-server', min: 2 } },
    ];
    expect(scoreDesign(makeDesign(['web-server', 'web-server']), countReqs).score).toBe(10);
    expect(scoreDesign(makeDesign(['web-server']), countReqs).score).toBe(0);
  });

  it('returns empty breakdown for no requirements', () => {
    const result = scoreDesign(makeDesign(['client']), []);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });
});

// ── Battle Session ─────────────────────────────────────────

describe('Battle session management', () => {
  const challenge = BATTLE_CHALLENGES[0];

  it('creates a session with two players', () => {
    const session = createBattleSession(challenge, { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
    expect(session.status).toBe('active');
    expect(session.players).toHaveLength(2);
    expect(session.players[0].id).toBe('p1');
    expect(session.players[1].id).toBe('p2');
    expect(session.winnerId).toBeNull();
    expect(session.challengeId).toBe(challenge.id);
  });

  it('submits a design for a player', () => {
    const session = createBattleSession(challenge, { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
    const design = makeDesign(['client', 'web-server'], 1);
    const updated = submitDesign(session, 'p1', design);
    expect(updated.players[0].design).toBeDefined();
    expect(updated.players[0].design?.nodes).toHaveLength(2);
    expect(updated.players[1].design).toBeNull();
  });

  it('finalizes a battle and determines a winner', () => {
    let session = createBattleSession(challenge, { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
    const goodDesign = makeDesign(['client', 'web-server', 'database'], 3);
    const badDesign = makeDesign(['client'], 0);
    session = submitDesign(session, 'p1', goodDesign);
    session = submitDesign(session, 'p2', badDesign);
    const finalized = finalizeBattle(session);
    expect(finalized.status).toBe('completed');
    expect(finalized.winnerId).toBe('p1');
  });

  it('computes Elo deltas when ratings are provided', () => {
    let session = createBattleSession(challenge, { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
    session = submitDesign(session, 'p1', makeDesign(['client', 'web-server', 'database'], 3));
    session = submitDesign(session, 'p2', makeDesign(['client'], 0));
    const finalized = finalizeBattle(session, { p1: 1200, p2: 1200 });
    expect(finalized.eloDelta).toBeDefined();
    expect(finalized.eloDelta?.winnerId).toBe('p1');
    expect(finalized.eloDelta?.winnerDelta).toBeGreaterThan(0);
    expect(finalized.eloDelta?.loserDelta).toBeLessThan(0);
  });

  it('handles a tie by earliest submitter', () => {
    let session = createBattleSession(challenge, { id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
    const sameDesign = makeDesign(['client'], 0);
    // p1 submits first
    session = submitDesign(session, 'p1', sameDesign);
    session = submitDesign(session, 'p2', sameDesign);
    const finalized = finalizeBattle(session);
    // Both score the same; p1 submitted first
    expect(finalized.winnerId).toBe('p1');
  });
});

// ── Challenge lookup ───────────────────────────────────────

describe('Challenge lookups', () => {
  it('gets a challenge by ID', () => {
    const c = getBattleChallengeById('battle-basic-web');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Basic Web Stack');
  });

  it('returns undefined for unknown ID', () => {
    expect(getBattleChallengeById('nonexistent')).toBeUndefined();
  });

  it('filters challenges by difficulty', () => {
    const beginners = getBattleChallengesByDifficulty('beginner');
    expect(beginners.length).toBeGreaterThan(0);
    expect(beginners.every((c) => c.difficulty === 'beginner')).toBe(true);
  });

  it('has exactly 10 built-in challenges', () => {
    expect(BATTLE_CHALLENGES).toHaveLength(10);
  });
});
