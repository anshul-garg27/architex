import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInterviewStore } from '../interview-store';
import type { Challenge, EvaluationScore } from '../interview-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'ch-1',
    title: 'Design a URL Shortener',
    difficulty: 3,
    timeMinutes: 45,
    requirements: ['Shorten URLs', 'Redirect'],
    checklistItems: ['API Design', 'Data Model'],
    ...overrides,
  };
}

function makeEvaluation(overrides: Partial<EvaluationScore> = {}): EvaluationScore {
  return {
    functionalRequirements: 8,
    apiDesign: 7,
    dataModel: 9,
    scalability: 6,
    reliability: 7,
    tradeoffAwareness: 8,
    feedback: 'Good work',
    suggestions: ['Consider caching'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('interview-store', () => {
  beforeEach(() => {
    useInterviewStore.getState().resetInterview();
  });

  // ── Initial state ────────────────────────────────────────────

  it('initial challengeStatus is not-started', () => {
    expect(useInterviewStore.getState().challengeStatus).toBe('not-started');
  });

  it('initial activeChallenge is null', () => {
    expect(useInterviewStore.getState().activeChallenge).toBeNull();
  });

  it('initial timerStartedAt is null', () => {
    expect(useInterviewStore.getState().timerStartedAt).toBeNull();
  });

  it('initial hintsUsed is 0 and maxHints is 4', () => {
    const s = useInterviewStore.getState();
    expect(s.hintsUsed).toBe(0);
    expect(s.maxHints).toBe(4);
  });

  // ── startChallenge ───────────────────────────────────────────

  it('startChallenge sets challenge and status to in-progress', () => {
    const challenge = makeChallenge();
    useInterviewStore.getState().startChallenge(challenge);

    const s = useInterviewStore.getState();
    expect(s.activeChallenge).toEqual(challenge);
    expect(s.challengeStatus).toBe('in-progress');
  });

  it('startChallenge sets timer based on timeMinutes', () => {
    const challenge = makeChallenge({ timeMinutes: 30 });
    useInterviewStore.getState().startChallenge(challenge);

    expect(useInterviewStore.getState().timerDurationMs).toBe(30 * 60 * 1000);
  });

  it('startChallenge sets timerStartedAt to a recent timestamp', () => {
    const before = Date.now();
    useInterviewStore.getState().startChallenge(makeChallenge());
    const after = Date.now();

    const started = useInterviewStore.getState().timerStartedAt!;
    expect(started).toBeGreaterThanOrEqual(before);
    expect(started).toBeLessThanOrEqual(after);
  });

  it('startChallenge resets hints, evaluation, and AI hint state', () => {
    // Dirty the state first
    useInterviewStore.getState().useHint();
    useInterviewStore.getState().setEvaluation(makeEvaluation());
    useInterviewStore.getState().setAiHint('some hint');

    useInterviewStore.getState().startChallenge(makeChallenge());

    const s = useInterviewStore.getState();
    expect(s.hintsUsed).toBe(0);
    expect(s.evaluation).toBeNull();
    expect(s.aiHintText).toBeNull();
    expect(s.aiHintLoading).toBe(false);
    expect(s.revealedHints).toEqual([]);
  });

  // ── submitChallenge ──────────────────────────────────────────

  it('submitChallenge transitions status to submitted', () => {
    useInterviewStore.getState().startChallenge(makeChallenge());
    useInterviewStore.getState().submitChallenge();
    expect(useInterviewStore.getState().challengeStatus).toBe('submitted');
  });

  // ── setEvaluation ────────────────────────────────────────────

  it('setEvaluation stores score and transitions to evaluated', () => {
    useInterviewStore.getState().startChallenge(makeChallenge());
    useInterviewStore.getState().submitChallenge();

    const evaluation = makeEvaluation();
    useInterviewStore.getState().setEvaluation(evaluation);

    const s = useInterviewStore.getState();
    expect(s.evaluation).toEqual(evaluation);
    expect(s.challengeStatus).toBe('evaluated');
  });

  // ── useHint ──────────────────────────────────────────────────

  it('useHint increments hintsUsed up to maxHints', () => {
    useInterviewStore.getState().useHint();
    expect(useInterviewStore.getState().hintsUsed).toBe(1);

    useInterviewStore.getState().useHint();
    useInterviewStore.getState().useHint();
    useInterviewStore.getState().useHint();
    expect(useInterviewStore.getState().hintsUsed).toBe(4);

    // Should not exceed maxHints
    useInterviewStore.getState().useHint();
    expect(useInterviewStore.getState().hintsUsed).toBe(4);
  });

  // ── revealHint ───────────────────────────────────────────────

  it('revealHint adds a hint and updates hintsUsed', () => {
    useInterviewStore.getState().revealHint(1, 5);

    const s = useInterviewStore.getState();
    expect(s.revealedHints).toHaveLength(1);
    expect(s.revealedHints[0]).toEqual({ level: 1, pointsCost: 5 });
    expect(s.hintsUsed).toBe(1);
  });

  it('revealHint does not duplicate same level', () => {
    useInterviewStore.getState().revealHint(2, 10);
    useInterviewStore.getState().revealHint(2, 10);

    expect(useInterviewStore.getState().revealedHints).toHaveLength(1);
  });

  it('isHintRevealed returns correct boolean', () => {
    useInterviewStore.getState().revealHint(1, 5);

    expect(useInterviewStore.getState().isHintRevealed(1)).toBe(true);
    expect(useInterviewStore.getState().isHintRevealed(2)).toBe(false);
  });

  // ── getHintUsageSummary ──────────────────────────────────────

  it('getHintUsageSummary computes correct totals', () => {
    useInterviewStore.getState().revealHint(1, 5);
    useInterviewStore.getState().revealHint(2, 10);
    useInterviewStore.getState().revealHint(3, 15);

    const summary = useInterviewStore.getState().getHintUsageSummary();
    expect(summary.totalUsed).toBe(3);
    expect(summary.totalAvailable).toBe(4);
    expect(summary.totalPointsDeducted).toBe(30);
    expect(summary.breakdown).toHaveLength(3);
  });

  // ── AI Hint ──────────────────────────────────────────────────

  it('setAiHint sets text and clears loading', () => {
    useInterviewStore.getState().setAiHintLoading(true);
    useInterviewStore.getState().setAiHint('Try adding a cache layer');

    const s = useInterviewStore.getState();
    expect(s.aiHintText).toBe('Try adding a cache layer');
    expect(s.aiHintLoading).toBe(false);
    expect(s.aiHintError).toBeNull();
  });

  it('setAiHint with error stores the error', () => {
    useInterviewStore.getState().setAiHint(null, 'API error');

    const s = useInterviewStore.getState();
    expect(s.aiHintText).toBeNull();
    expect(s.aiHintError).toBe('API error');
  });

  it('setAiHintLoading updates loading flag', () => {
    useInterviewStore.getState().setAiHintLoading(true);
    expect(useInterviewStore.getState().aiHintLoading).toBe(true);

    useInterviewStore.getState().setAiHintLoading(false);
    expect(useInterviewStore.getState().aiHintLoading).toBe(false);
  });

  // ── toggleTimer ──────────────────────────────────────────────

  it('toggleTimer flips the timerPaused flag', () => {
    expect(useInterviewStore.getState().timerPaused).toBe(false);
    useInterviewStore.getState().toggleTimer();
    expect(useInterviewStore.getState().timerPaused).toBe(true);
    useInterviewStore.getState().toggleTimer();
    expect(useInterviewStore.getState().timerPaused).toBe(false);
  });

  // ── resetInterview ───────────────────────────────────────────

  it('resetInterview returns all state to initial values', () => {
    useInterviewStore.getState().startChallenge(makeChallenge());
    useInterviewStore.getState().useHint();
    useInterviewStore.getState().revealHint(1, 5);
    useInterviewStore.getState().setAiHint('hint text');
    useInterviewStore.getState().toggleTimer();

    useInterviewStore.getState().resetInterview();

    const s = useInterviewStore.getState();
    expect(s.activeChallenge).toBeNull();
    expect(s.challengeStatus).toBe('not-started');
    expect(s.timerStartedAt).toBeNull();
    expect(s.timerDurationMs).toBe(0);
    expect(s.timerPaused).toBe(false);
    expect(s.hintsUsed).toBe(0);
    expect(s.revealedHints).toEqual([]);
    expect(s.aiHintText).toBeNull();
    expect(s.evaluation).toBeNull();
  });
});
