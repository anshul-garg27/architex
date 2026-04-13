import { describe, it, expect, beforeAll } from 'vitest';
import {
  createMockSession,
  startSession,
  moveToFeedback,
  completeSession,
  generateFeedback,
  getGuideForChallenge,
  INTERVIEWER_GUIDES,
  type MockChallenge,
  type RubricScore,
  type MockInterviewSession,
  type InterviewFeedback,
} from '../mock-interview';

// ── Test fixtures ─────────────────────────────────────────────

const MOCK_CHALLENGE: MockChallenge = {
  id: 'url-shortener',
  title: 'URL Shortener',
  description: 'Design a URL shortening service.',
  difficulty: 'beginner',
};

const UNKNOWN_CHALLENGE: MockChallenge = {
  id: 'unknown-challenge',
  title: 'Custom Challenge',
  description: 'A custom challenge without a guide.',
  difficulty: 'intermediate',
};

const HIGH_SCORES: RubricScore[] = [
  { categoryId: 'requirements',  score: 18 },
  { categoryId: 'hld',           score: 22 },
  { categoryId: 'deep-dive',     score: 23 },
  { categoryId: 'scalability',   score: 14 },
  { categoryId: 'communication', score: 13 },
];

const LOW_SCORES: RubricScore[] = [
  { categoryId: 'requirements',  score: 5 },
  { categoryId: 'hld',           score: 8 },
  { categoryId: 'deep-dive',     score: 6 },
  { categoryId: 'scalability',   score: 3 },
  { categoryId: 'communication', score: 4 },
];

const MIXED_SCORES: RubricScore[] = [
  { categoryId: 'requirements',  score: 18 },
  { categoryId: 'hld',           score: 20 },
  { categoryId: 'deep-dive',     score: 10 },
  { categoryId: 'scalability',   score: 5 },
  { categoryId: 'communication', score: 14 },
];

// ── INTERVIEWER_GUIDES constant ──────────────────────────────

describe('INTERVIEWER_GUIDES', () => {
  it('contains exactly 5 guides', () => {
    expect(INTERVIEWER_GUIDES).toHaveLength(5);
  });

  it('each guide has non-empty phases, hints, and scoringRubric', () => {
    for (const guide of INTERVIEWER_GUIDES) {
      expect(guide.phases.length).toBeGreaterThan(0);
      expect(guide.hints.length).toBeGreaterThan(0);
      expect(guide.scoringRubric.length).toBeGreaterThan(0);
    }
  });

  it('each guide phase has a name, duration, and prompts', () => {
    for (const guide of INTERVIEWER_GUIDES) {
      for (const phase of guide.phases) {
        expect(phase.name.length).toBeGreaterThan(0);
        expect(phase.durationMinutes).toBeGreaterThan(0);
        expect(phase.prompts.length).toBeGreaterThan(0);
      }
    }
  });

  it('each rubric category has a positive maxScore', () => {
    for (const guide of INTERVIEWER_GUIDES) {
      for (const cat of guide.scoringRubric) {
        expect(cat.maxScore).toBeGreaterThan(0);
      }
    }
  });
});

// ── getGuideForChallenge ─────────────────────────────────────

describe('getGuideForChallenge', () => {
  it('returns the guide for a known challenge', () => {
    const guide = getGuideForChallenge('url-shortener');
    expect(guide).toBeDefined();
    expect(guide!.challengeId).toBe('url-shortener');
    expect(guide!.title).toContain('URL Shortener');
  });

  it('returns undefined for an unknown challenge', () => {
    expect(getGuideForChallenge('nonexistent')).toBeUndefined();
  });

  it('finds all 5 built-in guides', () => {
    const ids = ['url-shortener', 'rate-limiter', 'notification-system', 'chat-system', 'news-feed'];
    for (const id of ids) {
      expect(getGuideForChallenge(id)).toBeDefined();
    }
  });
});

// ── createMockSession ────────────────────────────────────────

describe('createMockSession', () => {
  it('creates a session with default values', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'candidate');
    expect(session.id).toMatch(/^mock-/);
    expect(session.challengeId).toBe('url-shortener');
    expect(session.role).toBe('candidate');
    expect(session.status).toBe('waiting');
    expect(session.timeLimit).toBe(45);
    expect(session.startedAt).toBe(0);
    expect(session.feedback).toBeNull();
  });

  it('assigns correct ids based on role=interviewer', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'interviewer');
    expect(session.interviewerId).toBe('self');
    expect(session.candidateId).toBe('peer');
  });

  it('assigns correct ids based on role=candidate', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'candidate');
    expect(session.interviewerId).toBe('peer');
    expect(session.candidateId).toBe('self');
  });

  it('respects custom options', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'candidate', {
      interviewerId: 'user-A',
      candidateId: 'user-B',
      timeLimit: 60,
    });
    expect(session.interviewerId).toBe('user-A');
    expect(session.candidateId).toBe('user-B');
    expect(session.timeLimit).toBe(60);
  });

  it('attaches the guide for a known challenge', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'candidate');
    expect(session.guide).not.toBeNull();
    expect(session.guide!.challengeId).toBe('url-shortener');
  });

  it('sets guide to null for an unknown challenge', () => {
    const session = createMockSession(UNKNOWN_CHALLENGE, 'candidate');
    expect(session.guide).toBeNull();
  });

  it('generates unique session IDs', () => {
    const s1 = createMockSession(MOCK_CHALLENGE, 'candidate');
    const s2 = createMockSession(MOCK_CHALLENGE, 'interviewer');
    expect(s1.id).not.toBe(s2.id);
  });
});

// ── Session lifecycle ────────────────────────────────────────

describe('session lifecycle', () => {
  it('startSession sets status=active and records startedAt', () => {
    const session = createMockSession(MOCK_CHALLENGE, 'candidate');
    const started = startSession(session);
    expect(started.status).toBe('active');
    expect(started.startedAt).toBeGreaterThan(0);
  });

  it('moveToFeedback sets status=feedback', () => {
    const session = startSession(createMockSession(MOCK_CHALLENGE, 'candidate'));
    const fb = moveToFeedback(session);
    expect(fb.status).toBe('feedback');
  });

  it('completeSession sets status=completed with feedback', () => {
    const session = startSession(createMockSession(MOCK_CHALLENGE, 'candidate'));
    const feedback = generateFeedback(session, HIGH_SCORES);
    const completed = completeSession(session, feedback);
    expect(completed.status).toBe('completed');
    expect(completed.feedback).not.toBeNull();
    expect(completed.feedback!.sessionId).toBe(session.id);
  });
});

// ── generateFeedback ─────────────────────────────────────────

describe('generateFeedback', () => {
  let session: MockInterviewSession;

  beforeAll(() => {
    session = startSession(createMockSession(MOCK_CHALLENGE, 'candidate'));
  });

  it('returns a valid InterviewFeedback object', () => {
    const fb = generateFeedback(session, HIGH_SCORES);
    expect(fb.sessionId).toBe(session.id);
    expect(fb.overallScore).toBeGreaterThan(0);
    expect(fb.maxPossibleScore).toBe(100);
    expect(fb.percentage).toBeGreaterThan(0);
    expect(fb.rubricBreakdown).toHaveLength(5);
  });

  it('computes correct overall score', () => {
    const fb = generateFeedback(session, HIGH_SCORES);
    const expectedTotal = 18 + 22 + 23 + 14 + 13; // 90
    expect(fb.overallScore).toBe(expectedTotal);
    expect(fb.percentage).toBe(90);
  });

  it('returns "Strong Hire" for high scores (>= 85%)', () => {
    const fb = generateFeedback(session, HIGH_SCORES);
    expect(fb.verdict).toBe('Strong Hire');
  });

  it('returns "No Hire" for low scores (< 50%)', () => {
    const fb = generateFeedback(session, LOW_SCORES);
    expect(fb.verdict).toBe('No Hire');
  });

  it('returns "Hire" or "Lean Hire" for mixed scores', () => {
    const fb = generateFeedback(session, MIXED_SCORES);
    expect(['Hire', 'Lean Hire']).toContain(fb.verdict);
  });

  it('identifies strengths (categories >= 75%)', () => {
    const fb = generateFeedback(session, HIGH_SCORES);
    expect(fb.strengths.length).toBeGreaterThan(0);
    for (const s of fb.strengths) {
      expect(s.area.length).toBeGreaterThan(0);
      expect(s.comment.length).toBeGreaterThan(0);
    }
  });

  it('identifies improvements (categories < 50%)', () => {
    const fb = generateFeedback(session, LOW_SCORES);
    expect(fb.improvements.length).toBeGreaterThan(0);
  });

  it('clamps scores to max per category', () => {
    const overflowScores: RubricScore[] = [
      { categoryId: 'requirements',  score: 999 },
      { categoryId: 'hld',           score: 999 },
      { categoryId: 'deep-dive',     score: 999 },
      { categoryId: 'scalability',   score: 999 },
      { categoryId: 'communication', score: 999 },
    ];
    const fb = generateFeedback(session, overflowScores);
    expect(fb.overallScore).toBe(fb.maxPossibleScore);
    expect(fb.percentage).toBe(100);
  });

  it('clamps negative scores to 0', () => {
    const negativeScores: RubricScore[] = [
      { categoryId: 'requirements',  score: -10 },
      { categoryId: 'hld',           score: -5 },
      { categoryId: 'deep-dive',     score: 0 },
      { categoryId: 'scalability',   score: -1 },
      { categoryId: 'communication', score: 0 },
    ];
    const fb = generateFeedback(session, negativeScores);
    expect(fb.overallScore).toBe(0);
    expect(fb.percentage).toBe(0);
  });

  it('handles missing rubric score categories gracefully', () => {
    const partial: RubricScore[] = [
      { categoryId: 'requirements', score: 15 },
    ];
    const fb = generateFeedback(session, partial);
    // Only requirements has a score; others default to 0
    expect(fb.overallScore).toBe(15);
    expect(fb.rubricBreakdown).toHaveLength(5);
  });

  it('generates a non-empty summary', () => {
    const fb = generateFeedback(session, HIGH_SCORES);
    expect(fb.summary.length).toBeGreaterThan(0);
  });

  it('works for a session without a guide (falls back to standard rubric)', () => {
    const noGuideSession = startSession(createMockSession(UNKNOWN_CHALLENGE, 'candidate'));
    const fb = generateFeedback(noGuideSession, HIGH_SCORES);
    expect(fb.rubricBreakdown).toHaveLength(5);
    expect(fb.overallScore).toBe(90);
  });
});
