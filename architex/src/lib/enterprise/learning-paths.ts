// ─────────────────────────────────────────────────────────────
// Architex — Learning Path Engine
// ─────────────────────────────────────────────────────────────
//
// Five pre-built learning paths with ordered modules, time
// estimates, and prerequisite tracking. Pure functions — no
// side effects, no backend required.

import type { LearningPath, PathModule } from './types';

// ── Pre-built Paths ───────────────────────────────────────────

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'system-design-fundamentals',
    name: 'System Design Fundamentals',
    description:
      'Build a solid foundation in system design principles — from single-server architectures to horizontally scalable systems.',
    createdBy: 'architex',
    modules: [
      { moduleId: 'sd-requirements',       order: 1, required: true,  estimatedMinutes: 45  },
      { moduleId: 'sd-capacity-estimation', order: 2, required: true,  estimatedMinutes: 60  },
      { moduleId: 'sd-api-design',          order: 3, required: true,  estimatedMinutes: 50  },
      { moduleId: 'sd-database-schema',     order: 4, required: true,  estimatedMinutes: 55  },
      { moduleId: 'sd-caching-basics',      order: 5, required: false, estimatedMinutes: 40  },
      { moduleId: 'sd-load-balancing',      order: 6, required: true,  estimatedMinutes: 45  },
      { moduleId: 'sd-horizontal-scaling',  order: 7, required: true,  estimatedMinutes: 50  },
      { moduleId: 'sd-monitoring-basics',   order: 8, required: false, estimatedMinutes: 35  },
    ],
  },
  {
    id: 'distributed-systems-deep-dive',
    name: 'Distributed Systems Deep Dive',
    description:
      'Master consensus, replication, partitioning, and failure handling in large-scale distributed systems.',
    createdBy: 'architex',
    modules: [
      { moduleId: 'ds-cap-theorem',         order: 1,  required: true,  estimatedMinutes: 60  },
      { moduleId: 'ds-consistency-models',   order: 2,  required: true,  estimatedMinutes: 70  },
      { moduleId: 'ds-replication',          order: 3,  required: true,  estimatedMinutes: 65  },
      { moduleId: 'ds-partitioning',         order: 4,  required: true,  estimatedMinutes: 60  },
      { moduleId: 'ds-consensus-raft',       order: 5,  required: true,  estimatedMinutes: 90  },
      { moduleId: 'ds-distributed-txns',     order: 6,  required: true,  estimatedMinutes: 75  },
      { moduleId: 'ds-vector-clocks',        order: 7,  required: false, estimatedMinutes: 50  },
      { moduleId: 'ds-crdt',                 order: 8,  required: false, estimatedMinutes: 55  },
      { moduleId: 'ds-gossip-protocols',     order: 9,  required: false, estimatedMinutes: 45  },
      { moduleId: 'ds-failure-detection',    order: 10, required: true,  estimatedMinutes: 40  },
    ],
  },
  {
    id: 'interview-crash-course',
    name: 'Interview Crash Course (2 weeks)',
    description:
      'A focused 2-week sprint covering the highest-value system design interview topics with timed practice.',
    createdBy: 'architex',
    modules: [
      { moduleId: 'ic-framework',            order: 1, required: true,  estimatedMinutes: 30  },
      { moduleId: 'ic-url-shortener',        order: 2, required: true,  estimatedMinutes: 60  },
      { moduleId: 'ic-rate-limiter',         order: 3, required: true,  estimatedMinutes: 55  },
      { moduleId: 'ic-chat-system',          order: 4, required: true,  estimatedMinutes: 70  },
      { moduleId: 'ic-news-feed',            order: 5, required: true,  estimatedMinutes: 65  },
      { moduleId: 'ic-notification-system',  order: 6, required: true,  estimatedMinutes: 60  },
      { moduleId: 'ic-search-autocomplete',  order: 7, required: false, estimatedMinutes: 50  },
      { moduleId: 'ic-timed-practice',       order: 8, required: true,  estimatedMinutes: 120 },
    ],
  },
  {
    id: 'backend-architecture',
    name: 'Backend Architecture',
    description:
      'Deep dive into backend building blocks — databases, messaging, caching layers, and API gateway patterns.',
    createdBy: 'architex',
    modules: [
      { moduleId: 'ba-rest-vs-grpc',         order: 1, required: true,  estimatedMinutes: 45  },
      { moduleId: 'ba-sql-nosql',            order: 2, required: true,  estimatedMinutes: 60  },
      { moduleId: 'ba-indexing-sharding',     order: 3, required: true,  estimatedMinutes: 55  },
      { moduleId: 'ba-message-queues',        order: 4, required: true,  estimatedMinutes: 50  },
      { moduleId: 'ba-event-driven',          order: 5, required: true,  estimatedMinutes: 55  },
      { moduleId: 'ba-caching-strategies',    order: 6, required: true,  estimatedMinutes: 50  },
      { moduleId: 'ba-api-gateway',           order: 7, required: false, estimatedMinutes: 40  },
      { moduleId: 'ba-observability',         order: 8, required: false, estimatedMinutes: 45  },
      { moduleId: 'ba-circuit-breaker',       order: 9, required: false, estimatedMinutes: 35  },
    ],
  },
  {
    id: 'full-stack-design',
    name: 'Full Stack Design',
    description:
      'End-to-end system design spanning frontend architecture, backend services, data layer, and deployment.',
    createdBy: 'architex',
    modules: [
      { moduleId: 'fs-frontend-arch',        order: 1, required: true,  estimatedMinutes: 50  },
      { moduleId: 'fs-bff-pattern',          order: 2, required: true,  estimatedMinutes: 40  },
      { moduleId: 'fs-auth-patterns',        order: 3, required: true,  estimatedMinutes: 55  },
      { moduleId: 'fs-real-time',            order: 4, required: true,  estimatedMinutes: 60  },
      { moduleId: 'fs-cdn-static-assets',    order: 5, required: false, estimatedMinutes: 35  },
      { moduleId: 'fs-ssr-csr-isr',          order: 6, required: true,  estimatedMinutes: 50  },
      { moduleId: 'fs-microservices',        order: 7, required: true,  estimatedMinutes: 65  },
      { moduleId: 'fs-ci-cd-deploy',         order: 8, required: false, estimatedMinutes: 45  },
    ],
  },
];

// ── Lookup helper ─────────────────────────────────────────────

/** Get a learning path by its ID. Returns `undefined` if not found. */
export function getPathById(pathId: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === pathId);
}

// ── Progress calculation ──────────────────────────────────────

/**
 * Compute the completion percentage for a learning path given a set
 * of completed module IDs.
 *
 * Only **required** modules count toward the percentage unless all
 * required modules are done — then optional modules fill the gap.
 */
export function getPathProgress(
  path: LearningPath,
  completedModuleIds: string[],
): number {
  if (path.modules.length === 0) return 100;

  const completed = new Set(completedModuleIds);
  const total = path.modules.length;
  const done = path.modules.filter((m) => completed.has(m.moduleId)).length;

  return Math.round((done / total) * 100);
}

/**
 * Get the total estimated time for a learning path in minutes.
 */
export function getPathTotalMinutes(path: LearningPath): number {
  return path.modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);
}

/**
 * Get the remaining estimated time in minutes for incomplete modules.
 */
export function getPathRemainingMinutes(
  path: LearningPath,
  completedModuleIds: string[],
): number {
  const completed = new Set(completedModuleIds);
  return path.modules
    .filter((m) => !completed.has(m.moduleId))
    .reduce((sum, m) => sum + m.estimatedMinutes, 0);
}

// ── Next-module recommendation ────────────────────────────────

/**
 * Return the next recommended module in a learning path.
 *
 * Strategy:
 *   1. Walk modules in order.
 *   2. Return the first incomplete required module.
 *   3. If all required modules are done, return the first incomplete optional.
 *   4. If everything is done, return `null`.
 */
export function getNextRecommendedModule(
  path: LearningPath,
  completedModuleIds: string[],
): PathModule | null {
  const completed = new Set(completedModuleIds);
  const sorted = [...path.modules].sort((a, b) => a.order - b.order);

  // First pass: find first incomplete required module
  const nextRequired = sorted.find(
    (m) => m.required && !completed.has(m.moduleId),
  );
  if (nextRequired) return nextRequired;

  // Second pass: find first incomplete optional module
  const nextOptional = sorted.find((m) => !completed.has(m.moduleId));
  return nextOptional ?? null;
}
