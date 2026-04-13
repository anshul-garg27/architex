import { describe, it, expect } from 'vitest';
import { calculateOverallScore, generateFeedback } from '@/lib/interview/scoring';

describe('scoring', () => {
  const scores: Record<string, number> = {
    functional: 8,
    api: 7,
    dataModel: 6,
    scalability: 9,
    reliability: 5,
    tradeoffs: 7,
  };

  it('calculateOverallScore returns a value between 1 and 10', () => {
    const overall = calculateOverallScore(scores);
    expect(overall).toBeGreaterThanOrEqual(1);
    expect(overall).toBeLessThanOrEqual(10);
  });

  it('calculateOverallScore returns 0 for empty scores', () => {
    expect(calculateOverallScore({})).toBe(0);
  });

  it('generateFeedback returns non-empty strengths', () => {
    const feedback = generateFeedback(scores);
    expect(feedback.strengths.length).toBeGreaterThan(0);
  });

  it('generateFeedback returns improvements for low-scoring dimensions', () => {
    const feedback = generateFeedback(scores);
    expect(feedback.improvements.length).toBeGreaterThan(0);
    expect(feedback.nextSteps.length).toBeGreaterThan(0);
  });
});
