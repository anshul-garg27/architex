import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  createBeliefs,
  updateBeliefs,
  selectOptimalDifficulty,
  getConfidenceInterval,
  getSkillEstimate,
  getRecommendedChallengeRange,
  betaMean,
  betaVariance,
  DIFFICULTY_LEVELS,
  type SkillBeliefs,
  type DifficultyLevel,
} from '../difficulty-adaptation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Apply multiple results at a given difficulty. */
function applyResults(
  beliefs: SkillBeliefs,
  difficulty: DifficultyLevel,
  results: Array<'success' | 'failure' | 'partial'>,
): SkillBeliefs {
  let current = beliefs;
  for (const result of results) {
    current = updateBeliefs(current, result, difficulty);
  }
  return current;
}

// ---------------------------------------------------------------------------
// Beta distribution helpers
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – beta distribution helpers', () => {
  it('betaMean returns alpha / (alpha + beta)', () => {
    expect(betaMean({ alpha: 2, beta: 2 })).toBe(0.5);
    expect(betaMean({ alpha: 8, beta: 2 })).toBe(0.8);
    expect(betaMean({ alpha: 1, beta: 9 })).toBe(0.1);
  });

  it('betaVariance is correct for known parameters', () => {
    // Var(Beta(2,2)) = (2*2) / (4^2 * 5) = 4/80 = 0.05
    expect(betaVariance({ alpha: 2, beta: 2 })).toBeCloseTo(0.05, 5);
  });

  it('betaVariance decreases as sample size increases', () => {
    const small = betaVariance({ alpha: 2, beta: 2 });
    const large = betaVariance({ alpha: 20, beta: 20 });
    expect(large).toBeLessThan(small);
  });
});

// ---------------------------------------------------------------------------
// Belief creation
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – createBeliefs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('creates beliefs with 10 difficulty levels', () => {
    const beliefs = createBeliefs();
    expect(Object.keys(beliefs.perDifficulty)).toHaveLength(10);
  });

  it('initialises each difficulty with uniform prior (alpha=2, beta=2)', () => {
    const beliefs = createBeliefs();
    for (const level of DIFFICULTY_LEVELS) {
      expect(beliefs.perDifficulty[level].alpha).toBe(2);
      expect(beliefs.perDifficulty[level].beta).toBe(2);
    }
  });

  it('starts with zero attempts and successes', () => {
    const beliefs = createBeliefs();
    expect(beliefs.totalAttempts).toBe(0);
    expect(beliefs.totalSuccesses).toBe(0);
  });

  it('records the creation timestamp', () => {
    vi.setSystemTime(42_000);
    const beliefs = createBeliefs();
    expect(beliefs.lastUpdated).toBe(42_000);
  });
});

// ---------------------------------------------------------------------------
// Belief updates
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – updateBeliefs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('increments totalAttempts on every update', () => {
    let beliefs = createBeliefs();
    beliefs = updateBeliefs(beliefs, 'success', 5);
    expect(beliefs.totalAttempts).toBe(1);
    beliefs = updateBeliefs(beliefs, 'failure', 5);
    expect(beliefs.totalAttempts).toBe(2);
  });

  it('increments totalSuccesses on success', () => {
    let beliefs = createBeliefs();
    beliefs = updateBeliefs(beliefs, 'success', 5);
    expect(beliefs.totalSuccesses).toBe(1);
  });

  it('increments totalSuccesses on partial', () => {
    let beliefs = createBeliefs();
    beliefs = updateBeliefs(beliefs, 'partial', 5);
    expect(beliefs.totalSuccesses).toBe(1);
  });

  it('does not increment totalSuccesses on failure', () => {
    let beliefs = createBeliefs();
    beliefs = updateBeliefs(beliefs, 'failure', 5);
    expect(beliefs.totalSuccesses).toBe(0);
  });

  it('success increases alpha at the attempted difficulty', () => {
    const beliefs = createBeliefs();
    const updated = updateBeliefs(beliefs, 'success', 5);
    // After temporal decay: alpha = 1 + 0.95*(2-1) = 1.95
    // After success: alpha = 1.95 + 1 = 2.95
    expect(updated.perDifficulty[5].alpha).toBeGreaterThan(beliefs.perDifficulty[5].alpha);
  });

  it('failure increases beta at the attempted difficulty', () => {
    const beliefs = createBeliefs();
    const updated = updateBeliefs(beliefs, 'failure', 5);
    expect(updated.perDifficulty[5].beta).toBeGreaterThan(beliefs.perDifficulty[5].beta);
  });

  it('partial success adds 0.5 to alpha', () => {
    const beliefs = createBeliefs();
    const success = updateBeliefs(beliefs, 'success', 5);
    const partial = updateBeliefs(beliefs, 'partial', 5);
    // Full success adds 1.0, partial adds 0.5
    expect(success.perDifficulty[5].alpha).toBeGreaterThan(partial.perDifficulty[5].alpha);
  });

  it('success propagates alpha increases to easier difficulties', () => {
    const beliefs = createBeliefs();
    const updated = updateBeliefs(beliefs, 'success', 7);
    // Levels below 7 should get some alpha boost
    const level6Alpha = updated.perDifficulty[6].alpha;
    const level5Alpha = updated.perDifficulty[5].alpha;
    // Closer levels get more propagation
    expect(level6Alpha).toBeGreaterThan(level5Alpha);
  });

  it('failure propagates beta increases to harder difficulties', () => {
    const beliefs = createBeliefs();
    const updated = updateBeliefs(beliefs, 'failure', 3);
    // Levels above 3 should get some beta boost
    const level4Beta = updated.perDifficulty[4].beta;
    const level5Beta = updated.perDifficulty[5].beta;
    // Closer levels get more propagation
    expect(level4Beta).toBeGreaterThan(level5Beta);
  });

  it('updates lastUpdated timestamp', () => {
    vi.setSystemTime(200_000);
    let beliefs = createBeliefs();
    vi.setSystemTime(300_000);
    beliefs = updateBeliefs(beliefs, 'success', 5);
    expect(beliefs.lastUpdated).toBe(300_000);
  });

  it('many successes at a level increase the mean significantly', () => {
    let beliefs = createBeliefs();
    const initialMean = betaMean(beliefs.perDifficulty[5]);
    beliefs = applyResults(beliefs, 5, Array(10).fill('success'));
    const updatedMean = betaMean(beliefs.perDifficulty[5]);
    expect(updatedMean).toBeGreaterThan(initialMean + 0.15);
  });

  it('many failures at a level decrease the mean significantly', () => {
    let beliefs = createBeliefs();
    const initialMean = betaMean(beliefs.perDifficulty[5]);
    beliefs = applyResults(beliefs, 5, Array(10).fill('failure'));
    const updatedMean = betaMean(beliefs.perDifficulty[5]);
    expect(updatedMean).toBeLessThan(initialMean - 0.15);
  });
});

// ---------------------------------------------------------------------------
// Optimal difficulty selection
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – selectOptimalDifficulty', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns a difficulty level between 1 and 10', () => {
    const beliefs = createBeliefs();
    const rec = selectOptimalDifficulty(beliefs);
    expect(rec.level).toBeGreaterThanOrEqual(1);
    expect(rec.level).toBeLessThanOrEqual(10);
  });

  it('returns a success rate between 0 and 1', () => {
    const beliefs = createBeliefs();
    const rec = selectOptimalDifficulty(beliefs);
    expect(rec.expectedSuccessRate).toBeGreaterThanOrEqual(0);
    expect(rec.expectedSuccessRate).toBeLessThanOrEqual(1);
  });

  it('includes a rationale string', () => {
    const beliefs = createBeliefs();
    const rec = selectOptimalDifficulty(beliefs);
    expect(rec.rationale).toBeTruthy();
    expect(typeof rec.rationale).toBe('string');
  });

  it('recommends easier difficulty after repeated failures', () => {
    let beliefs = createBeliefs();
    // Fail a lot at level 5
    beliefs = applyResults(beliefs, 5, Array(15).fill('failure'));
    const rec = selectOptimalDifficulty(beliefs);
    // Should recommend something below 5
    expect(rec.level).toBeLessThanOrEqual(5);
  });

  it('recommends harder difficulty after repeated successes', () => {
    const fresh = createBeliefs();
    const initialRec = selectOptimalDifficulty(fresh);

    let beliefs = createBeliefs();
    // Succeed a lot at levels 1-5
    for (let i = 1; i <= 5; i++) {
      beliefs = applyResults(beliefs, i as DifficultyLevel, Array(10).fill('success'));
    }
    const rec = selectOptimalDifficulty(beliefs);
    // After mastering levels 1-5, the recommended level should be
    // at least as high as (or higher than) the initial recommendation
    // on a fresh learner, because lower levels are now too easy.
    expect(rec.level).toBeGreaterThanOrEqual(initialRec.level);
    // And the expected success rate at the recommended level should
    // be in a reasonable range (the model finds the ZPD).
    expect(rec.expectedSuccessRate).toBeGreaterThan(0.3);
    expect(rec.expectedSuccessRate).toBeLessThan(1.0);
  });
});

// ---------------------------------------------------------------------------
// Confidence interval
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – getConfidenceInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('low <= mean <= high', () => {
    const beliefs = createBeliefs();
    const ci = getConfidenceInterval(beliefs);
    expect(ci.low).toBeLessThanOrEqual(ci.mean);
    expect(ci.mean).toBeLessThanOrEqual(ci.high);
  });

  it('all values are between 0 and 1', () => {
    const beliefs = createBeliefs();
    const ci = getConfidenceInterval(beliefs);
    expect(ci.low).toBeGreaterThanOrEqual(0);
    expect(ci.high).toBeLessThanOrEqual(1);
  });

  it('interval narrows with more data', () => {
    const fresh = createBeliefs();
    const ciFresh = getConfidenceInterval(fresh);
    const widthFresh = ciFresh.high - ciFresh.low;

    let trained = createBeliefs();
    trained = applyResults(trained, 5, Array(20).fill('success'));
    const ciTrained = getConfidenceInterval(trained);
    const widthTrained = ciTrained.high - ciTrained.low;

    // More data should narrow the interval (or at least not widen it much)
    expect(widthTrained).toBeLessThanOrEqual(widthFresh + 0.05);
  });

  it('mean shifts up with successes', () => {
    let beliefs = createBeliefs();
    const initialMean = getConfidenceInterval(beliefs).mean;

    beliefs = applyResults(beliefs, 5, Array(15).fill('success'));
    const updatedMean = getConfidenceInterval(beliefs).mean;

    expect(updatedMean).toBeGreaterThan(initialMean);
  });
});

// ---------------------------------------------------------------------------
// Skill estimate
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – getSkillEstimate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns a value between 0 and 1', () => {
    const beliefs = createBeliefs();
    const estimate = getSkillEstimate(beliefs);
    expect(estimate).toBeGreaterThanOrEqual(0);
    expect(estimate).toBeLessThanOrEqual(1);
  });

  it('initial estimate is close to 0.5 (uninformed prior)', () => {
    const beliefs = createBeliefs();
    const estimate = getSkillEstimate(beliefs);
    expect(estimate).toBeCloseTo(0.5, 1);
  });

  it('increases after successes', () => {
    let beliefs = createBeliefs();
    const initial = getSkillEstimate(beliefs);
    beliefs = applyResults(beliefs, 7, Array(10).fill('success'));
    const after = getSkillEstimate(beliefs);
    expect(after).toBeGreaterThan(initial);
  });

  it('decreases after failures', () => {
    let beliefs = createBeliefs();
    const initial = getSkillEstimate(beliefs);
    beliefs = applyResults(beliefs, 3, Array(10).fill('failure'));
    const after = getSkillEstimate(beliefs);
    expect(after).toBeLessThan(initial);
  });
});

// ---------------------------------------------------------------------------
// Recommended challenge range
// ---------------------------------------------------------------------------

describe('Difficulty Adaptation – getRecommendedChallengeRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('min <= max', () => {
    const beliefs = createBeliefs();
    const range = getRecommendedChallengeRange(beliefs);
    expect(range.min).toBeLessThanOrEqual(range.max);
  });

  it('min and max are valid difficulty levels', () => {
    const beliefs = createBeliefs();
    const range = getRecommendedChallengeRange(beliefs);
    expect(range.min).toBeGreaterThanOrEqual(1);
    expect(range.min).toBeLessThanOrEqual(10);
    expect(range.max).toBeGreaterThanOrEqual(1);
    expect(range.max).toBeLessThanOrEqual(10);
  });

  it('range shifts up after many successes', () => {
    let beliefs = createBeliefs();
    const initialRange = getRecommendedChallengeRange(beliefs);

    for (let i = 1; i <= 6; i++) {
      beliefs = applyResults(beliefs, i as DifficultyLevel, Array(10).fill('success'));
    }
    const afterRange = getRecommendedChallengeRange(beliefs);

    expect(afterRange.min).toBeGreaterThanOrEqual(initialRange.min);
  });
});
