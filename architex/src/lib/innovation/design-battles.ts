// ─────────────────────────────────────────────────────────────
// Architex — Multiplayer Design Battles
// ─────────────────────────────────────────────────────────────
//
// Head-to-head system-design challenges with Elo-based ranking.
// Two players race against a shared timer to meet architecture
// requirements — the one who scores higher wins.
//
// Public API:
//   calculateEloChange(winnerRating, loserRating, kFactor)
//       → { winnerDelta, loserDelta }
//   scoreDesign(design, requirements)
//       → { score, breakdown }
//   createBattleSession(challengeId, players)
//       → BattleSession
//   submitDesign(session, playerId, design)
//       → updated session
//   finalizeBattle(session)
//       → session with winner + Elo deltas
//   BATTLE_CHALLENGES
//       → 10 built-in battle challenge definitions
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';

// ── Types ───────────────────────────────────────────────────

/** A canvas design submitted by a player. */
export interface DesignSnapshot {
  nodes: Node[];
  edges: Edge[];
}

/** A single requirement for a battle challenge. */
export interface BattleRequirement {
  id: string;
  label: string;
  /** Weight for scoring (1 = normal, 2 = high priority). */
  weight: number;
  check: BattleCheck;
}

/** Discriminated union of auto-check descriptors. */
export type BattleCheck =
  | { kind: 'hasMinNodes'; min: number }
  | { kind: 'hasNodeType'; nodeType: string }
  | { kind: 'hasConnection'; from: string; to: string }
  | { kind: 'hasMinEdges'; min: number }
  | { kind: 'hasNodeTypeCount'; nodeType: string; min: number };

/** A battle challenge definition. */
export interface BattleChallenge {
  id: string;
  title: string;
  description: string;
  requirements: BattleRequirement[];
  /** Time limit in seconds. */
  timeLimit: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/** A player in a battle session. */
export interface Player {
  id: string;
  name: string;
  score: number;
  design: DesignSnapshot | null;
  submittedAt: number | null;
}

/** Battle session status. */
export type BattleStatus = 'waiting' | 'active' | 'completed';

/** An active battle session. */
export interface BattleSession {
  id: string;
  challengeId: string;
  challenge: BattleChallenge;
  players: Player[];
  startTime: number;
  status: BattleStatus;
  winnerId: string | null;
  eloDelta: { winnerId: string; winnerDelta: number; loserId: string; loserDelta: number } | null;
}

/** Elo rating for a player. */
export interface EloRating {
  rating: number;
  wins: number;
  losses: number;
  history: { opponentRating: number; result: 'win' | 'loss'; delta: number; date: number }[];
}

/** Breakdown of a scored design. */
export interface ScoreBreakdown {
  requirementId: string;
  label: string;
  met: boolean;
  weight: number;
  points: number;
}

/** Result of scoring a design. */
export interface DesignScore {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: ScoreBreakdown[];
}

// ── Auto-check functions ────────────────────────────────────

function hasMinNodes(design: DesignSnapshot, min: number): boolean {
  return design.nodes.length >= min;
}

function hasNodeType(design: DesignSnapshot, nodeType: string): boolean {
  return design.nodes.some((n) => n.type === nodeType);
}

function hasConnection(design: DesignSnapshot, fromType: string, toType: string): boolean {
  const nodesByType = new Map<string, Set<string>>();
  for (const n of design.nodes) {
    if (!n.type) continue;
    const set = nodesByType.get(n.type) ?? new Set<string>();
    set.add(n.id);
    nodesByType.set(n.type, set);
  }
  const fromIds = nodesByType.get(fromType);
  const toIds = nodesByType.get(toType);
  if (!fromIds || !toIds) return false;
  return design.edges.some((e) => fromIds.has(e.source) && toIds.has(e.target));
}

function hasMinEdges(design: DesignSnapshot, min: number): boolean {
  return design.edges.length >= min;
}

function hasNodeTypeCount(design: DesignSnapshot, nodeType: string, min: number): boolean {
  return design.nodes.filter((n) => n.type === nodeType).length >= min;
}

/** Dispatch a check against a design snapshot. */
function runCheck(check: BattleCheck, design: DesignSnapshot): boolean {
  switch (check.kind) {
    case 'hasMinNodes':
      return hasMinNodes(design, check.min);
    case 'hasNodeType':
      return hasNodeType(design, check.nodeType);
    case 'hasConnection':
      return hasConnection(design, check.from, check.to);
    case 'hasMinEdges':
      return hasMinEdges(design, check.min);
    case 'hasNodeTypeCount':
      return hasNodeTypeCount(design, check.nodeType, check.min);
  }
}

// ── Elo rating calculation ──────────────────────────────────

/**
 * Calculate Elo rating changes for a head-to-head match.
 *
 * Uses the standard Elo formula:
 *   E_a = 1 / (1 + 10^((R_b - R_a) / 400))
 *   delta = K * (1 - E_a)   for winner
 *   delta = K * (0 - E_b)   for loser
 *
 * @param winnerRating  Current Elo rating of the winner.
 * @param loserRating   Current Elo rating of the loser.
 * @param kFactor       Sensitivity factor (default 32).
 * @returns Deltas for both players (winner positive, loser negative).
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32,
): { winnerDelta: number; loserDelta: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const winnerDelta = Math.round(kFactor * (1 - expectedWinner));
  const loserDelta = Math.round(kFactor * (0 - expectedLoser));

  return { winnerDelta, loserDelta };
}

/** Create a fresh Elo rating record. */
export function createEloRating(initialRating: number = 1200): EloRating {
  return { rating: initialRating, wins: 0, losses: 0, history: [] };
}

/** Apply a match result to an Elo record. */
export function applyEloResult(
  elo: EloRating,
  opponentRating: number,
  result: 'win' | 'loss',
  delta: number,
): EloRating {
  return {
    rating: elo.rating + delta,
    wins: result === 'win' ? elo.wins + 1 : elo.wins,
    losses: result === 'loss' ? elo.losses + 1 : elo.losses,
    history: [
      ...elo.history,
      { opponentRating, result, delta, date: Date.now() },
    ],
  };
}

// ── Design scoring ──────────────────────────────────────────

/**
 * Score a design against a set of requirements.
 * Each met requirement adds its weight in points.
 */
export function scoreDesign(
  design: DesignSnapshot,
  requirements: BattleRequirement[],
): DesignScore {
  const breakdown: ScoreBreakdown[] = [];
  let score = 0;
  let maxScore = 0;

  for (const req of requirements) {
    const met = runCheck(req.check, design);
    const points = met ? req.weight * 10 : 0;
    maxScore += req.weight * 10;
    score += points;
    breakdown.push({
      requirementId: req.id,
      label: req.label,
      met,
      weight: req.weight,
      points,
    });
  }

  return {
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    breakdown,
  };
}

// ── Session management ──────────────────────────────────────

let sessionCounter = 0;

/** Create a new battle session. */
export function createBattleSession(
  challenge: BattleChallenge,
  playerA: { id: string; name: string },
  playerB: { id: string; name: string },
): BattleSession {
  sessionCounter += 1;
  return {
    id: `battle-${sessionCounter}-${Date.now()}`,
    challengeId: challenge.id,
    challenge,
    players: [
      { id: playerA.id, name: playerA.name, score: 0, design: null, submittedAt: null },
      { id: playerB.id, name: playerB.name, score: 0, design: null, submittedAt: null },
    ],
    startTime: Date.now(),
    status: 'active',
    winnerId: null,
    eloDelta: null,
  };
}

/** Submit a design for a player. Returns a new session. */
export function submitDesign(
  session: BattleSession,
  playerId: string,
  design: DesignSnapshot,
): BattleSession {
  const players = session.players.map((p) =>
    p.id === playerId
      ? { ...p, design, submittedAt: Date.now() }
      : p,
  );
  return { ...session, players };
}

/**
 * Finalize the battle: score all submissions, determine winner,
 * compute Elo deltas. Returns the completed session.
 */
export function finalizeBattle(
  session: BattleSession,
  playerRatings?: { [playerId: string]: number },
): BattleSession {
  const requirements = session.challenge.requirements;

  // Score each player's design
  const scored = session.players.map((p) => {
    const design = p.design ?? { nodes: [], edges: [] };
    const result = scoreDesign(design, requirements);
    return { ...p, score: result.score };
  });

  // Determine winner (higher score wins; tie → first submitter wins)
  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: earlier submission wins
    return (a.submittedAt ?? Infinity) - (b.submittedAt ?? Infinity);
  });

  const winner = sorted[0];
  const loser = sorted[1];

  // Compute Elo delta if ratings provided
  let eloDelta: BattleSession['eloDelta'] = null;
  if (playerRatings && winner && loser) {
    const winnerRating = playerRatings[winner.id] ?? 1200;
    const loserRating = playerRatings[loser.id] ?? 1200;
    const { winnerDelta, loserDelta } = calculateEloChange(winnerRating, loserRating);
    eloDelta = {
      winnerId: winner.id,
      winnerDelta,
      loserId: loser.id,
      loserDelta,
    };
  }

  return {
    ...session,
    players: scored,
    status: 'completed',
    winnerId: winner?.id ?? null,
    eloDelta,
  };
}

// ── Built-in battle challenges ──────────────────────────────

export const BATTLE_CHALLENGES: BattleChallenge[] = [
  {
    id: 'battle-basic-web',
    title: 'Basic Web Stack',
    description: 'Build a client-server architecture with a database faster than your opponent.',
    timeLimit: 120,
    difficulty: 'beginner',
    requirements: [
      { id: 'client', label: 'Add a Client', weight: 1, check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'server', label: 'Add a Web Server', weight: 1, check: { kind: 'hasNodeType', nodeType: 'web-server' } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'edges', label: 'Connect them (2+ edges)', weight: 1, check: { kind: 'hasMinEdges', min: 2 } },
    ],
  },
  {
    id: 'battle-cache-layer',
    title: 'Caching Sprint',
    description: 'Design a read-heavy system with caching layers.',
    timeLimit: 150,
    difficulty: 'beginner',
    requirements: [
      { id: 'client', label: 'Add a Client', weight: 1, check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'cache', label: 'Add a Cache', weight: 2, check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'server', label: 'Add a Web Server', weight: 1, check: { kind: 'hasNodeType', nodeType: 'web-server' } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'edges', label: 'Wire it up (3+ edges)', weight: 1, check: { kind: 'hasMinEdges', min: 3 } },
    ],
  },
  {
    id: 'battle-lb-race',
    title: 'Load Balancer Race',
    description: 'Build a load-balanced API with multiple servers.',
    timeLimit: 180,
    difficulty: 'beginner',
    requirements: [
      { id: 'client', label: 'Add a Client', weight: 1, check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'lb', label: 'Add a Load Balancer', weight: 2, check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'servers', label: 'Add 2+ Web Servers', weight: 2, check: { kind: 'hasNodeTypeCount', nodeType: 'web-server', min: 2 } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'edges', label: 'Wire it up (4+ edges)', weight: 1, check: { kind: 'hasMinEdges', min: 4 } },
    ],
  },
  {
    id: 'battle-event-driven',
    title: 'Event-Driven Duel',
    description: 'Race to build an event-driven architecture with message queues.',
    timeLimit: 240,
    difficulty: 'intermediate',
    requirements: [
      { id: 'api-gw', label: 'Add API Gateway', weight: 1, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'queue', label: 'Add a Message Queue', weight: 2, check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'workers', label: 'Add 2+ Workers', weight: 2, check: { kind: 'hasNodeTypeCount', nodeType: 'worker', min: 2 } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'conn', label: 'Connect API to Queue', weight: 1, check: { kind: 'hasConnection', from: 'api-gateway', to: 'message-queue' } },
      { id: 'edges', label: '6+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 6 } },
    ],
  },
  {
    id: 'battle-microservices',
    title: 'Microservices Showdown',
    description: 'Build a microservices system with API gateway and service mesh.',
    timeLimit: 300,
    difficulty: 'intermediate',
    requirements: [
      { id: 'api-gw', label: 'Add API Gateway', weight: 2, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'services', label: '3+ App Servers', weight: 2, check: { kind: 'hasNodeTypeCount', nodeType: 'app-server', min: 3 } },
      { id: 'mq', label: 'Add a Message Queue', weight: 1, check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'cache', label: 'Add a Cache', weight: 1, check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'nodes', label: '8+ nodes total', weight: 1, check: { kind: 'hasMinNodes', min: 8 } },
      { id: 'edges', label: '8+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 8 } },
    ],
  },
  {
    id: 'battle-cdn-clash',
    title: 'CDN Clash',
    description: 'Design a globally distributed site with CDN and edge caching.',
    timeLimit: 240,
    difficulty: 'intermediate',
    requirements: [
      { id: 'dns', label: 'Add DNS', weight: 1, check: { kind: 'hasNodeType', nodeType: 'dns' } },
      { id: 'cdn', label: 'Add a CDN', weight: 2, check: { kind: 'hasNodeType', nodeType: 'cdn' } },
      { id: 'lb', label: 'Add a Load Balancer', weight: 1, check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'server', label: 'Add a Web Server', weight: 1, check: { kind: 'hasNodeType', nodeType: 'web-server' } },
      { id: 'storage', label: 'Add Object Storage', weight: 1, check: { kind: 'hasNodeType', nodeType: 'storage' } },
      { id: 'conn', label: 'Connect DNS to CDN', weight: 1, check: { kind: 'hasConnection', from: 'dns', to: 'cdn' } },
      { id: 'edges', label: '6+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 6 } },
    ],
  },
  {
    id: 'battle-analytics-arena',
    title: 'Analytics Arena',
    description: 'Build a real-time analytics pipeline under pressure.',
    timeLimit: 300,
    difficulty: 'advanced',
    requirements: [
      { id: 'event-bus', label: 'Add Event Bus', weight: 2, check: { kind: 'hasNodeType', nodeType: 'event-bus' } },
      { id: 'stream', label: 'Add Stream Processor', weight: 2, check: { kind: 'hasNodeType', nodeType: 'stream-processor' } },
      { id: 'tsdb', label: 'Add Time-Series DB', weight: 2, check: { kind: 'hasNodeType', nodeType: 'timeseries-db' } },
      { id: 'cache', label: 'Add a Cache', weight: 1, check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'api', label: 'Add API Gateway', weight: 1, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'nodes', label: '8+ nodes total', weight: 1, check: { kind: 'hasMinNodes', min: 8 } },
      { id: 'edges', label: '8+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 8 } },
    ],
  },
  {
    id: 'battle-security-siege',
    title: 'Security Siege',
    description: 'Build the most secure API platform in the time limit.',
    timeLimit: 360,
    difficulty: 'advanced',
    requirements: [
      { id: 'firewall', label: 'Add a Firewall', weight: 2, check: { kind: 'hasNodeType', nodeType: 'firewall' } },
      { id: 'rate-limiter', label: 'Add Rate Limiter', weight: 2, check: { kind: 'hasNodeType', nodeType: 'rate-limiter' } },
      { id: 'api-gw', label: 'Add API Gateway', weight: 1, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'lb', label: 'Add Load Balancer', weight: 1, check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'servers', label: '2+ App Servers', weight: 1, check: { kind: 'hasNodeTypeCount', nodeType: 'app-server', min: 2 } },
      { id: 'secret', label: 'Add Secret Manager', weight: 2, check: { kind: 'hasNodeType', nodeType: 'secret-manager' } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'nodes', label: '10+ nodes total', weight: 1, check: { kind: 'hasMinNodes', min: 10 } },
      { id: 'edges', label: '10+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 10 } },
    ],
  },
  {
    id: 'battle-ml-mayhem',
    title: 'ML Mayhem',
    description: 'Design an ML inference pipeline with batch and real-time paths.',
    timeLimit: 360,
    difficulty: 'advanced',
    requirements: [
      { id: 'api-gw', label: 'Add API Gateway', weight: 1, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'ml', label: 'Add ML Inference', weight: 2, check: { kind: 'hasNodeType', nodeType: 'ml-inference' } },
      { id: 'cache', label: 'Add Prediction Cache', weight: 1, check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'queue', label: 'Add Message Queue', weight: 1, check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'batch', label: 'Add Batch Processor', weight: 1, check: { kind: 'hasNodeType', nodeType: 'batch-processor' } },
      { id: 'storage', label: 'Add Model Storage', weight: 1, check: { kind: 'hasNodeType', nodeType: 'storage' } },
      { id: 'db', label: 'Add Results DB', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'nodes', label: '9+ nodes total', weight: 1, check: { kind: 'hasMinNodes', min: 9 } },
      { id: 'edges', label: '9+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 9 } },
    ],
  },
  {
    id: 'battle-data-lake',
    title: 'Data Lake Dash',
    description: 'Build a data lake architecture with ingestion, storage, and query layers.',
    timeLimit: 300,
    difficulty: 'advanced',
    requirements: [
      { id: 'api-gw', label: 'Add API Gateway', weight: 1, check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'queue', label: 'Add Message Queue', weight: 1, check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'stream', label: 'Add Stream Processor', weight: 2, check: { kind: 'hasNodeType', nodeType: 'stream-processor' } },
      { id: 'storage', label: 'Add Object Storage', weight: 2, check: { kind: 'hasNodeType', nodeType: 'storage' } },
      { id: 'db', label: 'Add a Database', weight: 1, check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'cache', label: 'Add a Cache', weight: 1, check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'nodes', label: '8+ nodes total', weight: 1, check: { kind: 'hasMinNodes', min: 8 } },
      { id: 'edges', label: '8+ edges total', weight: 1, check: { kind: 'hasMinEdges', min: 8 } },
    ],
  },
];

/** O(1) challenge lookup. */
const challengeMap = new Map(BATTLE_CHALLENGES.map((c) => [c.id, c]));

/** Get a battle challenge by ID. */
export function getBattleChallengeById(id: string): BattleChallenge | undefined {
  return challengeMap.get(id);
}

/** Get battle challenges filtered by difficulty. */
export function getBattleChallengesByDifficulty(
  difficulty: BattleChallenge['difficulty'],
): BattleChallenge[] {
  return BATTLE_CHALLENGES.filter((c) => c.difficulty === difficulty);
}
