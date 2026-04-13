import { describe, it, expect } from 'vitest';
import { createCard, scheduleReview } from '@/lib/interview/srs';

describe('SRS scheduling', () => {
  it('scheduleReview with "good" advances interval from 0', () => {
    const card = createCard('Consistent Hashing');
    const updated = scheduleReview(card, 'good');
    expect(updated.interval).toBeGreaterThan(0);
    expect(updated.state).toBe('review');
  });

  it('scheduleReview with "again" keeps interval short', () => {
    const card = createCard('CAP Theorem');
    const updated = scheduleReview(card, 'again');
    expect(updated.interval).toBe(0);
    expect(updated.state).toBe('learning');
    expect(updated.lapses).toBe(1);
  });

  it('scheduleReview with "easy" gives higher stability than "hard"', () => {
    const card = createCard('Load Balancing');
    const easy = scheduleReview(card, 'easy');
    const hard = scheduleReview(card, 'hard');
    expect(easy.stability).toBeGreaterThan(hard.stability);
  });

  it('reps increment on successful review', () => {
    const card = createCard('Sharding');
    const updated = scheduleReview(card, 'good');
    expect(updated.reps).toBe(1);
  });
});
