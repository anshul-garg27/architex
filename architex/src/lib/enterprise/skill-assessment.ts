// ─────────────────────────────────────────────────────────────
// Architex — Skill Assessment Engine
// ─────────────────────────────────────────────────────────────
//
// Evaluates a user's skill profile across 8 system design
// competencies using their challenge and module history.
// Pure functions — no side effects, no backend required.

import type {
  ChallengeRecord,
  ModuleRecord,
  ReadinessVerdict,
  SkillAssessment,
  SkillLevel,
  SkillScore,
} from './types';

// ── Skill categories ──────────────────────────────────────────

/** The 8 core competencies assessed by the engine. */
export const ASSESSED_SKILLS = [
  'architecture',
  'databases',
  'distributed-systems',
  'caching',
  'messaging',
  'security',
  'performance',
  'api-design',
] as const;

export type AssessedSkill = (typeof ASSESSED_SKILLS)[number];

/** Human-readable labels for each skill. */
export const SKILL_LABELS: Record<AssessedSkill, string> = {
  'architecture':        'Architecture',
  'databases':           'Databases',
  'distributed-systems': 'Distributed Systems',
  'caching':             'Caching',
  'messaging':           'Messaging',
  'security':            'Security',
  'performance':         'Performance',
  'api-design':          'API Design',
};

// ── Category mapping ──────────────────────────────────────────

/**
 * Maps raw challenge/module category strings to the assessed skill.
 * Multiple categories can map to the same skill.
 */
const CATEGORY_TO_SKILL: Record<string, AssessedSkill> = {
  // Architecture
  'system-design':     'architecture',
  'architecture':      'architecture',
  'design-patterns':   'architecture',
  'microservices':     'architecture',

  // Databases
  'database':          'databases',
  'sql':               'databases',
  'nosql':             'databases',
  'indexing':          'databases',
  'sharding':          'databases',

  // Distributed Systems
  'distributed':       'distributed-systems',
  'consensus':         'distributed-systems',
  'replication':       'distributed-systems',
  'partitioning':      'distributed-systems',
  'cap-theorem':       'distributed-systems',

  // Caching
  'caching':           'caching',
  'redis':             'caching',
  'cdn':               'caching',
  'cache-strategies':  'caching',

  // Messaging
  'messaging':         'messaging',
  'message-queues':    'messaging',
  'event-driven':      'messaging',
  'kafka':             'messaging',
  'pubsub':            'messaging',

  // Security
  'security':          'security',
  'auth':              'security',
  'encryption':        'security',
  'oauth':             'security',

  // Performance
  'performance':       'performance',
  'load-balancing':    'performance',
  'scaling':           'performance',
  'optimization':      'performance',
  'monitoring':        'performance',

  // API Design
  'api-design':        'api-design',
  'rest':              'api-design',
  'grpc':              'api-design',
  'graphql':           'api-design',
  'api-gateway':       'api-design',
};

// ── Score thresholds ──────────────────────────────────────────

function scoreToLevel(score: number): SkillLevel {
  if (score >= 85) return 'expert';
  if (score >= 65) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'beginner';
}

// ── Core assessment logic ─────────────────────────────────────

/**
 * Build a SkillAssessment from the user's challenge and module history.
 *
 * Scoring algorithm:
 *   - For each assessed skill, collect all matching challenges and modules.
 *   - Challenge scores contribute 60% weight (direct test of knowledge).
 *   - Module completion contributes 40% weight (exposure-based).
 *   - If no data exists for a skill, it defaults to score 0 (beginner).
 */
export function assessSkills(
  challengeHistory: ChallengeRecord[],
  moduleHistory: ModuleRecord[],
  userId: string = 'anonymous',
): SkillAssessment {
  const skillScores: SkillScore[] = ASSESSED_SKILLS.map((skill) => {
    // Gather matching challenge scores
    const matchingChallenges = challengeHistory.filter(
      (c) => CATEGORY_TO_SKILL[c.category] === skill,
    );
    const challengeAvg =
      matchingChallenges.length > 0
        ? matchingChallenges.reduce((sum, c) => sum + c.score, 0) /
          matchingChallenges.length
        : 0;

    // Gather matching module completion percentages
    const matchingModules = moduleHistory.filter(
      (m) => CATEGORY_TO_SKILL[m.category] === skill,
    );
    const moduleAvg =
      matchingModules.length > 0
        ? matchingModules.reduce((sum, m) => sum + m.completionPercent, 0) /
          matchingModules.length
        : 0;

    // Weighted blend: 60% challenges, 40% modules
    // If only one source has data, use it at full weight
    let score: number;
    if (matchingChallenges.length > 0 && matchingModules.length > 0) {
      score = challengeAvg * 0.6 + moduleAvg * 0.4;
    } else if (matchingChallenges.length > 0) {
      score = challengeAvg;
    } else if (matchingModules.length > 0) {
      score = moduleAvg;
    } else {
      score = 0;
    }

    score = Math.round(Math.min(100, Math.max(0, score)));

    return {
      skill,
      score,
      level: scoreToLevel(score),
    };
  });

  const overallAvg =
    skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length;

  return {
    userId,
    skills: skillScores,
    overallReadiness: getReadinessScore(overallAvg),
    assessedAt: new Date().toISOString(),
  };
}

// ── Readiness verdict ─────────────────────────────────────────

/**
 * Convert an average score (or a full assessment) into a readiness verdict.
 * Accepts either a number (average score) or a SkillAssessment object.
 */
export function getReadinessScore(
  input: number | SkillAssessment,
): ReadinessVerdict {
  const avg =
    typeof input === 'number'
      ? input
      : input.skills.reduce((sum, s) => sum + s.score, 0) /
        input.skills.length;

  if (avg >= 75) return 'Ready';
  if (avg >= 50) return 'Almost Ready';
  return 'Needs Practice';
}

// ── Helpers ───────────────────────────────────────────────────

/** Get the strongest skills (top N by score). */
export function getStrongestSkills(
  assessment: SkillAssessment,
  count: number = 3,
): SkillScore[] {
  return [...assessment.skills]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/** Get the weakest skills (bottom N by score). */
export function getWeakestSkills(
  assessment: SkillAssessment,
  count: number = 3,
): SkillScore[] {
  return [...assessment.skills]
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}
