import { describe, it, expect } from 'vitest';
import {
  assessSkills,
  getReadinessScore,
  getStrongestSkills,
  getWeakestSkills,
  ASSESSED_SKILLS,
  SKILL_LABELS,
} from '../skill-assessment';
import type {
  ChallengeRecord,
  ModuleRecord,
  SkillAssessment,
} from '../types';

// ── Test fixtures ─────────────────────────────────────────────

const challengeHistory: ChallengeRecord[] = [
  { challengeId: 'c1', category: 'system-design',   score: 80, completedAt: '2025-03-01T00:00:00Z' },
  { challengeId: 'c2', category: 'architecture',    score: 90, completedAt: '2025-03-02T00:00:00Z' },
  { challengeId: 'c3', category: 'database',        score: 70, completedAt: '2025-03-03T00:00:00Z' },
  { challengeId: 'c4', category: 'distributed',     score: 60, completedAt: '2025-03-04T00:00:00Z' },
  { challengeId: 'c5', category: 'caching',         score: 50, completedAt: '2025-03-05T00:00:00Z' },
  { challengeId: 'c6', category: 'messaging',       score: 40, completedAt: '2025-03-06T00:00:00Z' },
  { challengeId: 'c7', category: 'security',        score: 30, completedAt: '2025-03-07T00:00:00Z' },
  { challengeId: 'c8', category: 'performance',     score: 75, completedAt: '2025-03-08T00:00:00Z' },
  { challengeId: 'c9', category: 'rest',            score: 85, completedAt: '2025-03-09T00:00:00Z' },
];

const moduleHistory: ModuleRecord[] = [
  { moduleId: 'm1', category: 'system-design',   completionPercent: 100, timeSpentMinutes: 120 },
  { moduleId: 'm2', category: 'database',        completionPercent: 80,  timeSpentMinutes: 90 },
  { moduleId: 'm3', category: 'distributed',     completionPercent: 50,  timeSpentMinutes: 60 },
  { moduleId: 'm4', category: 'caching',         completionPercent: 70,  timeSpentMinutes: 45 },
  { moduleId: 'm5', category: 'security',        completionPercent: 40,  timeSpentMinutes: 30 },
  { moduleId: 'm6', category: 'rest',            completionPercent: 90,  timeSpentMinutes: 80 },
];

// ── ASSESSED_SKILLS constant ──────────────────────────────────

describe('ASSESSED_SKILLS', () => {
  it('contains exactly 8 skills', () => {
    expect(ASSESSED_SKILLS).toHaveLength(8);
  });

  it('includes all expected skill names', () => {
    const expected = [
      'architecture',
      'databases',
      'distributed-systems',
      'caching',
      'messaging',
      'security',
      'performance',
      'api-design',
    ];
    for (const skill of expected) {
      expect(ASSESSED_SKILLS).toContain(skill);
    }
  });
});

describe('SKILL_LABELS', () => {
  it('has a label for every assessed skill', () => {
    for (const skill of ASSESSED_SKILLS) {
      expect(SKILL_LABELS[skill]).toBeDefined();
      expect(typeof SKILL_LABELS[skill]).toBe('string');
      expect(SKILL_LABELS[skill].length).toBeGreaterThan(0);
    }
  });
});

// ── assessSkills ──────────────────────────────────────────────

describe('assessSkills', () => {
  it('returns a SkillAssessment with all 8 skills', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    expect(result.skills).toHaveLength(8);
    expect(result.userId).toBe('u1');
    expect(result.assessedAt).toBeDefined();
  });

  it('defaults userId to anonymous', () => {
    const result = assessSkills([], []);
    expect(result.userId).toBe('anonymous');
  });

  it('computes architecture score from matching challenges and modules', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    const arch = result.skills.find((s) => s.skill === 'architecture');
    expect(arch).toBeDefined();
    // Challenges: system-design(80) + architecture(90) -> avg=85
    // Modules: system-design(100) -> avg=100
    // Weighted: 85*0.6 + 100*0.4 = 51 + 40 = 91
    expect(arch!.score).toBe(91);
    expect(arch!.level).toBe('expert');
  });

  it('computes databases score correctly', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    const db = result.skills.find((s) => s.skill === 'databases');
    expect(db).toBeDefined();
    // Challenge: database(70) -> avg=70
    // Module: database(80) -> avg=80
    // Weighted: 70*0.6 + 80*0.4 = 42 + 32 = 74
    expect(db!.score).toBe(74);
    expect(db!.level).toBe('advanced');
  });

  it('uses only challenge score when no modules match', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    const msg = result.skills.find((s) => s.skill === 'messaging');
    expect(msg).toBeDefined();
    // Only challenge: messaging(40) -> score=40
    expect(msg!.score).toBe(40);
    expect(msg!.level).toBe('intermediate');
  });

  it('uses only module score when no challenges match', () => {
    // Create a scenario with only module data for a skill
    const modulesOnly: ModuleRecord[] = [
      { moduleId: 'x1', category: 'kafka', completionPercent: 80, timeSpentMinutes: 60 },
    ];
    const result = assessSkills([], modulesOnly, 'u1');
    const msg = result.skills.find((s) => s.skill === 'messaging');
    expect(msg).toBeDefined();
    expect(msg!.score).toBe(80);
  });

  it('returns score 0 for skills with no matching data', () => {
    const result = assessSkills([], [], 'u1');
    for (const skill of result.skills) {
      expect(skill.score).toBe(0);
      expect(skill.level).toBe('beginner');
    }
  });

  it('clamps scores to 0-100 range', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    for (const skill of result.skills) {
      expect(skill.score).toBeGreaterThanOrEqual(0);
      expect(skill.score).toBeLessThanOrEqual(100);
    }
  });

  it('assigns correct levels based on score thresholds', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    for (const skill of result.skills) {
      if (skill.score >= 85) expect(skill.level).toBe('expert');
      else if (skill.score >= 65) expect(skill.level).toBe('advanced');
      else if (skill.score >= 40) expect(skill.level).toBe('intermediate');
      else expect(skill.level).toBe('beginner');
    }
  });

  it('sets overallReadiness based on average score', () => {
    const result = assessSkills(challengeHistory, moduleHistory, 'u1');
    expect(['Ready', 'Almost Ready', 'Needs Practice']).toContain(
      result.overallReadiness,
    );
  });
});

// ── getReadinessScore ─────────────────────────────────────────

describe('getReadinessScore', () => {
  it('returns "Ready" for score >= 75', () => {
    expect(getReadinessScore(75)).toBe('Ready');
    expect(getReadinessScore(100)).toBe('Ready');
    expect(getReadinessScore(90)).toBe('Ready');
  });

  it('returns "Almost Ready" for score >= 50 and < 75', () => {
    expect(getReadinessScore(50)).toBe('Almost Ready');
    expect(getReadinessScore(74)).toBe('Almost Ready');
    expect(getReadinessScore(60)).toBe('Almost Ready');
  });

  it('returns "Needs Practice" for score < 50', () => {
    expect(getReadinessScore(0)).toBe('Needs Practice');
    expect(getReadinessScore(49)).toBe('Needs Practice');
    expect(getReadinessScore(25)).toBe('Needs Practice');
  });

  it('accepts a SkillAssessment object', () => {
    const assessment: SkillAssessment = {
      userId: 'u1',
      skills: [
        { skill: 'architecture', score: 80, level: 'advanced' },
        { skill: 'databases', score: 80, level: 'advanced' },
        { skill: 'distributed-systems', score: 80, level: 'advanced' },
        { skill: 'caching', score: 80, level: 'advanced' },
        { skill: 'messaging', score: 80, level: 'advanced' },
        { skill: 'security', score: 80, level: 'advanced' },
        { skill: 'performance', score: 80, level: 'advanced' },
        { skill: 'api-design', score: 80, level: 'advanced' },
      ],
      overallReadiness: 'Ready',
      assessedAt: '2025-01-01T00:00:00Z',
    };
    expect(getReadinessScore(assessment)).toBe('Ready');
  });
});

// ── getStrongestSkills ────────────────────────────────────────

describe('getStrongestSkills', () => {
  const assessment: SkillAssessment = {
    userId: 'u1',
    skills: [
      { skill: 'architecture',        score: 90, level: 'expert' },
      { skill: 'databases',           score: 70, level: 'advanced' },
      { skill: 'distributed-systems', score: 50, level: 'intermediate' },
      { skill: 'caching',             score: 40, level: 'intermediate' },
      { skill: 'messaging',           score: 30, level: 'beginner' },
      { skill: 'security',            score: 20, level: 'beginner' },
      { skill: 'performance',         score: 80, level: 'advanced' },
      { skill: 'api-design',          score: 60, level: 'intermediate' },
    ],
    overallReadiness: 'Almost Ready',
    assessedAt: '2025-01-01T00:00:00Z',
  };

  it('returns top 3 skills by default', () => {
    const result = getStrongestSkills(assessment);
    expect(result).toHaveLength(3);
    expect(result[0].skill).toBe('architecture');
    expect(result[1].skill).toBe('performance');
    expect(result[2].skill).toBe('databases');
  });

  it('respects custom count', () => {
    const result = getStrongestSkills(assessment, 2);
    expect(result).toHaveLength(2);
  });

  it('returns sorted in descending score order', () => {
    const result = getStrongestSkills(assessment, 8);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });
});

// ── getWeakestSkills ──────────────────────────────────────────

describe('getWeakestSkills', () => {
  const assessment: SkillAssessment = {
    userId: 'u1',
    skills: [
      { skill: 'architecture',        score: 90, level: 'expert' },
      { skill: 'databases',           score: 70, level: 'advanced' },
      { skill: 'distributed-systems', score: 50, level: 'intermediate' },
      { skill: 'caching',             score: 40, level: 'intermediate' },
      { skill: 'messaging',           score: 30, level: 'beginner' },
      { skill: 'security',            score: 20, level: 'beginner' },
      { skill: 'performance',         score: 80, level: 'advanced' },
      { skill: 'api-design',          score: 60, level: 'intermediate' },
    ],
    overallReadiness: 'Almost Ready',
    assessedAt: '2025-01-01T00:00:00Z',
  };

  it('returns bottom 3 skills by default', () => {
    const result = getWeakestSkills(assessment);
    expect(result).toHaveLength(3);
    expect(result[0].skill).toBe('security');
    expect(result[1].skill).toBe('messaging');
    expect(result[2].skill).toBe('caching');
  });

  it('respects custom count', () => {
    const result = getWeakestSkills(assessment, 1);
    expect(result).toHaveLength(1);
    expect(result[0].skill).toBe('security');
  });

  it('returns sorted in ascending score order', () => {
    const result = getWeakestSkills(assessment, 8);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeLessThanOrEqual(result[i].score);
    }
  });
});
