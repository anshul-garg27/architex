// ─────────────────────────────────────────────────────────────
// Architex — Time Attack Mode
// ─────────────────────────────────────────────────────────────
//
// Timed system-design challenges that test speed and accuracy.
// The user races against a countdown to meet architecture
// requirements on the canvas.
//
// Public API:
//   createTimeAttackSession(challenge) → session with countdown
//   checkRequirements(session, canvas) → met / unmet lists
//   calculateScore(session, canvas)    → numeric score
//   TIME_ATTACK_CHALLENGES             → built-in challenge set
//   Auto-check helpers:
//     hasMinNodes, hasNodeType, hasConnection, hasMinEdges
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';

// ── Types ───────────────────────────────────────────────────

/** A single requirement the user must meet. */
export interface TimeAttackRequirement {
  /** Machine-readable id. */
  id: string;
  /** Human-readable description. */
  label: string;
  /** Auto-check function name + args. */
  check: AutoCheck;
}

/** Discriminated union of auto-check descriptors. */
export type AutoCheck =
  | { kind: 'hasMinNodes'; min: number }
  | { kind: 'hasNodeType'; nodeType: string }
  | { kind: 'hasConnection'; from: string; to: string }
  | { kind: 'hasMinEdges'; min: number }
  | { kind: 'hasNodeTypeCount'; nodeType: string; min: number };

/** A time-attack challenge definition. */
export interface TimeAttackChallenge {
  challengeId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Time limit in seconds. */
  timeLimit: number;
  requirements: TimeAttackRequirement[];
}

/** Snapshot of canvas state for requirement checking. */
export interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

/** Status of an active time-attack session. */
export type SessionStatus = 'waiting' | 'active' | 'completed' | 'expired';

/** An active time-attack session. */
export interface TimeAttackSession {
  challenge: TimeAttackChallenge;
  status: SessionStatus;
  /** Unix ms when the session started (0 if waiting). */
  startedAt: number;
  /** Seconds remaining. */
  remainingSeconds: number;
  /** Elapsed seconds since start. */
  elapsedSeconds: number;
}

/** Result of checking requirements against canvas state. */
export interface RequirementCheckResult {
  met: string[];
  unmet: string[];
  total: number;
  metCount: number;
}

/** Final score for a completed session. */
export interface TimeAttackScore {
  /** 0-100 base score from requirements. */
  requirementScore: number;
  /** 1.0-2.0 multiplier for finishing faster. */
  timeBonus: number;
  /** Final score = requirementScore * timeBonus. */
  finalScore: number;
  /** Requirements detail. */
  requirements: RequirementCheckResult;
  /** Seconds remaining when completed. */
  secondsRemaining: number;
}

// ── Auto-check functions ────────────────────────────────────

/** Canvas has at least `min` nodes. */
export function hasMinNodes(canvas: CanvasSnapshot, min: number): boolean {
  return canvas.nodes.length >= min;
}

/** Canvas has at least one node of the given type. */
export function hasNodeType(canvas: CanvasSnapshot, nodeType: string): boolean {
  return canvas.nodes.some((n) => n.type === nodeType);
}

/** Canvas has a direct edge from `fromType` to `toType`. */
export function hasConnection(canvas: CanvasSnapshot, fromType: string, toType: string): boolean {
  const nodesByType = new Map<string, Set<string>>();
  for (const n of canvas.nodes) {
    if (!n.type) continue;
    const set = nodesByType.get(n.type) ?? new Set<string>();
    set.add(n.id);
    nodesByType.set(n.type, set);
  }
  const fromIds = nodesByType.get(fromType);
  const toIds = nodesByType.get(toType);
  if (!fromIds || !toIds) return false;
  return canvas.edges.some((e) => fromIds.has(e.source) && toIds.has(e.target));
}

/** Canvas has at least `min` edges. */
export function hasMinEdges(canvas: CanvasSnapshot, min: number): boolean {
  return canvas.edges.length >= min;
}

/** Canvas has at least `min` nodes of a specific type. */
function hasNodeTypeCount(canvas: CanvasSnapshot, nodeType: string, min: number): boolean {
  return canvas.nodes.filter((n) => n.type === nodeType).length >= min;
}

// ── Check dispatcher ────────────────────────────────────────

function runAutoCheck(check: AutoCheck, canvas: CanvasSnapshot): boolean {
  switch (check.kind) {
    case 'hasMinNodes':
      return hasMinNodes(canvas, check.min);
    case 'hasNodeType':
      return hasNodeType(canvas, check.nodeType);
    case 'hasConnection':
      return hasConnection(canvas, check.from, check.to);
    case 'hasMinEdges':
      return hasMinEdges(canvas, check.min);
    case 'hasNodeTypeCount':
      return hasNodeTypeCount(canvas, check.nodeType, check.min);
  }
}

// ── Session management ──────────────────────────────────────

/** Create a new time-attack session from a challenge definition. */
export function createTimeAttackSession(challenge: TimeAttackChallenge): TimeAttackSession {
  return {
    challenge,
    status: 'waiting',
    startedAt: 0,
    remainingSeconds: challenge.timeLimit,
    elapsedSeconds: 0,
  };
}

/** Start the session countdown (mutates nothing — returns new session). */
export function startSession(session: TimeAttackSession): TimeAttackSession {
  return {
    ...session,
    status: 'active',
    startedAt: Date.now(),
    remainingSeconds: session.challenge.timeLimit,
    elapsedSeconds: 0,
  };
}

/** Tick the session — call every second. Returns a new session. */
export function tickSession(session: TimeAttackSession): TimeAttackSession {
  if (session.status !== 'active') return session;
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  const remaining = Math.max(0, session.challenge.timeLimit - elapsed);
  return {
    ...session,
    elapsedSeconds: elapsed,
    remainingSeconds: remaining,
    status: remaining === 0 ? 'expired' : 'active',
  };
}

/** Mark the session as completed (user submitted or all requirements met). */
export function completeSession(session: TimeAttackSession): TimeAttackSession {
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return {
    ...session,
    status: 'completed',
    elapsedSeconds: elapsed,
    remainingSeconds: Math.max(0, session.challenge.timeLimit - elapsed),
  };
}

// ── Requirement checking ────────────────────────────────────

/** Check which requirements are met / unmet for the current canvas. */
export function checkRequirements(
  session: TimeAttackSession,
  canvas: CanvasSnapshot,
): RequirementCheckResult {
  const met: string[] = [];
  const unmet: string[] = [];
  for (const req of session.challenge.requirements) {
    if (runAutoCheck(req.check, canvas)) {
      met.push(req.id);
    } else {
      unmet.push(req.id);
    }
  }
  return { met, unmet, total: session.challenge.requirements.length, metCount: met.length };
}

// ── Scoring ─────────────────────────────────────────────────

/**
 * Calculate score:
 *   base = (met / total) * 100
 *   timeBonus = 1 + (remainingSeconds / timeLimit)   → range [1.0, 2.0]
 *   finalScore = base * timeBonus
 */
export function calculateScore(
  session: TimeAttackSession,
  canvas: CanvasSnapshot,
): TimeAttackScore {
  const result = checkRequirements(session, canvas);
  const base = result.total > 0 ? (result.metCount / result.total) * 100 : 0;
  const timeFraction = session.remainingSeconds / session.challenge.timeLimit;
  const timeBonus = 1 + timeFraction;
  return {
    requirementScore: Math.round(base),
    timeBonus: Math.round(timeBonus * 100) / 100,
    finalScore: Math.round(base * timeBonus),
    requirements: result,
    secondsRemaining: session.remainingSeconds,
  };
}

// ── Built-in challenges ─────────────────────────────────────

export const TIME_ATTACK_CHALLENGES: TimeAttackChallenge[] = [
  {
    challengeId: 'basic-web-app',
    title: 'Basic Web Application',
    description: 'Build a simple client-server architecture with a database.',
    difficulty: 'beginner',
    timeLimit: 120,
    requirements: [
      { id: 'client', label: 'Add a Client node', check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'web-server', label: 'Add a Web Server', check: { kind: 'hasNodeType', nodeType: 'web-server' } },
      { id: 'database', label: 'Add a Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'min-edges', label: 'Connect components (2+ edges)', check: { kind: 'hasMinEdges', min: 2 } },
    ],
  },
  {
    challengeId: 'load-balanced-api',
    title: 'Load-Balanced API',
    description: 'Design an API with load balancing and caching.',
    difficulty: 'beginner',
    timeLimit: 180,
    requirements: [
      { id: 'client', label: 'Add a Client node', check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'lb', label: 'Add a Load Balancer', check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'servers', label: 'Add 2+ Web Servers', check: { kind: 'hasNodeTypeCount', nodeType: 'web-server', min: 2 } },
      { id: 'cache', label: 'Add a Cache layer', check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'db', label: 'Add a Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'edges', label: 'Wire it up (5+ edges)', check: { kind: 'hasMinEdges', min: 5 } },
    ],
  },
  {
    challengeId: 'event-driven-system',
    title: 'Event-Driven System',
    description: 'Build an event-driven architecture with message queues and workers.',
    difficulty: 'intermediate',
    timeLimit: 240,
    requirements: [
      { id: 'api-gw', label: 'Add an API Gateway', check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'queue', label: 'Add a Message Queue', check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'workers', label: 'Add 2+ Workers', check: { kind: 'hasNodeTypeCount', nodeType: 'worker', min: 2 } },
      { id: 'db', label: 'Add a Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'conn-api-queue', label: 'Connect API Gateway to Queue', check: { kind: 'hasConnection', from: 'api-gateway', to: 'message-queue' } },
      { id: 'min-nodes', label: 'At least 6 nodes total', check: { kind: 'hasMinNodes', min: 6 } },
      { id: 'edges', label: 'Wire it up (6+ edges)', check: { kind: 'hasMinEdges', min: 6 } },
    ],
  },
  {
    challengeId: 'microservices-setup',
    title: 'Microservices Architecture',
    description: 'Design a microservices system with API gateway, services, and inter-service communication.',
    difficulty: 'intermediate',
    timeLimit: 300,
    requirements: [
      { id: 'client', label: 'Add a Client', check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'api-gw', label: 'Add an API Gateway', check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'services', label: 'Add 3+ App Servers (services)', check: { kind: 'hasNodeTypeCount', nodeType: 'app-server', min: 3 } },
      { id: 'mq', label: 'Add a Message Queue', check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'db', label: 'Add a Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'cache', label: 'Add a Cache', check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'min-nodes', label: 'At least 8 nodes total', check: { kind: 'hasMinNodes', min: 8 } },
      { id: 'edges', label: 'Wire it up (8+ edges)', check: { kind: 'hasMinEdges', min: 8 } },
    ],
  },
  {
    challengeId: 'cdn-optimized-site',
    title: 'CDN-Optimized Website',
    description: 'Build a globally distributed website with CDN, DNS, and edge caching.',
    difficulty: 'intermediate',
    timeLimit: 240,
    requirements: [
      { id: 'client', label: 'Add a Client', check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'dns', label: 'Add DNS', check: { kind: 'hasNodeType', nodeType: 'dns' } },
      { id: 'cdn', label: 'Add a CDN', check: { kind: 'hasNodeType', nodeType: 'cdn' } },
      { id: 'lb', label: 'Add a Load Balancer', check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'server', label: 'Add a Web Server', check: { kind: 'hasNodeType', nodeType: 'web-server' } },
      { id: 'storage', label: 'Add Object Storage', check: { kind: 'hasNodeType', nodeType: 'storage' } },
      { id: 'conn-dns-cdn', label: 'Connect DNS to CDN', check: { kind: 'hasConnection', from: 'dns', to: 'cdn' } },
      { id: 'edges', label: 'Wire it up (6+ edges)', check: { kind: 'hasMinEdges', min: 6 } },
    ],
  },
  {
    challengeId: 'real-time-analytics',
    title: 'Real-Time Analytics Pipeline',
    description: 'Design a stream processing pipeline for real-time analytics.',
    difficulty: 'advanced',
    timeLimit: 300,
    requirements: [
      { id: 'event-bus', label: 'Add an Event Bus', check: { kind: 'hasNodeType', nodeType: 'event-bus' } },
      { id: 'stream', label: 'Add a Stream Processor', check: { kind: 'hasNodeType', nodeType: 'stream-processor' } },
      { id: 'tsdb', label: 'Add a Time-Series DB', check: { kind: 'hasNodeType', nodeType: 'timeseries-db' } },
      { id: 'cache', label: 'Add a Cache for fast reads', check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'api', label: 'Add API Gateway for queries', check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'metrics', label: 'Add a Metrics Collector', check: { kind: 'hasNodeType', nodeType: 'metrics-collector' } },
      { id: 'min-nodes', label: 'At least 8 nodes total', check: { kind: 'hasMinNodes', min: 8 } },
      { id: 'edges', label: 'Wire it up (8+ edges)', check: { kind: 'hasMinEdges', min: 8 } },
    ],
  },
  {
    challengeId: 'secure-api-platform',
    title: 'Secure API Platform',
    description: 'Build a production-grade API platform with security layers.',
    difficulty: 'advanced',
    timeLimit: 360,
    requirements: [
      { id: 'client', label: 'Add a Client', check: { kind: 'hasNodeType', nodeType: 'client' } },
      { id: 'dns', label: 'Add DNS', check: { kind: 'hasNodeType', nodeType: 'dns' } },
      { id: 'firewall', label: 'Add a Firewall', check: { kind: 'hasNodeType', nodeType: 'firewall' } },
      { id: 'rate-limiter', label: 'Add a Rate Limiter', check: { kind: 'hasNodeType', nodeType: 'rate-limiter' } },
      { id: 'api-gw', label: 'Add an API Gateway', check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'lb', label: 'Add a Load Balancer', check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'servers', label: 'Add 2+ App Servers', check: { kind: 'hasNodeTypeCount', nodeType: 'app-server', min: 2 } },
      { id: 'db', label: 'Add a Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'secret', label: 'Add a Secret Manager', check: { kind: 'hasNodeType', nodeType: 'secret-manager' } },
      { id: 'min-nodes', label: 'At least 10 nodes total', check: { kind: 'hasMinNodes', min: 10 } },
      { id: 'edges', label: 'Wire it up (10+ edges)', check: { kind: 'hasMinEdges', min: 10 } },
    ],
  },
  {
    challengeId: 'ml-inference-pipeline',
    title: 'ML Inference Pipeline',
    description: 'Design an ML serving infrastructure with batch and real-time paths.',
    difficulty: 'advanced',
    timeLimit: 360,
    requirements: [
      { id: 'api-gw', label: 'Add an API Gateway', check: { kind: 'hasNodeType', nodeType: 'api-gateway' } },
      { id: 'lb', label: 'Add a Load Balancer', check: { kind: 'hasNodeType', nodeType: 'load-balancer' } },
      { id: 'ml', label: 'Add ML Inference node', check: { kind: 'hasNodeType', nodeType: 'ml-inference' } },
      { id: 'cache', label: 'Add a prediction Cache', check: { kind: 'hasNodeType', nodeType: 'cache' } },
      { id: 'queue', label: 'Add a Message Queue (batch path)', check: { kind: 'hasNodeType', nodeType: 'message-queue' } },
      { id: 'batch', label: 'Add Batch Processor', check: { kind: 'hasNodeType', nodeType: 'batch-processor' } },
      { id: 'storage', label: 'Add model Storage', check: { kind: 'hasNodeType', nodeType: 'storage' } },
      { id: 'db', label: 'Add a results Database', check: { kind: 'hasNodeType', nodeType: 'database' } },
      { id: 'min-nodes', label: 'At least 9 nodes total', check: { kind: 'hasMinNodes', min: 9 } },
      { id: 'edges', label: 'Wire it up (9+ edges)', check: { kind: 'hasMinEdges', min: 9 } },
    ],
  },
];

/** O(1) challenge lookup. */
const challengeMap = new Map(TIME_ATTACK_CHALLENGES.map((c) => [c.challengeId, c]));

/** Get a challenge by its ID. */
export function getChallengeById(id: string): TimeAttackChallenge | undefined {
  return challengeMap.get(id);
}

/** Get challenges filtered by difficulty. */
export function getChallengesByDifficulty(
  difficulty: TimeAttackChallenge['difficulty'],
): TimeAttackChallenge[] {
  return TIME_ATTACK_CHALLENGES.filter((c) => c.difficulty === difficulty);
}
