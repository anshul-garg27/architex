import { describe, it, expect } from 'vitest';
import { unsafeIncrement, safeIncrement } from '@/lib/concurrency/race-condition';

describe('race-condition', () => {
  it('unsafeIncrement shows a race (finalValue < expectedValue)', () => {
    const result = unsafeIncrement(3, 5);
    expect(result.hasRace).toBe(true);
    expect(result.finalValue).toBeLessThan(result.expectedValue);
  });

  it('safeIncrement shows no race (finalValue === expectedValue)', () => {
    const result = safeIncrement(3, 5);
    expect(result.hasRace).toBe(false);
    expect(result.finalValue).toBe(result.expectedValue);
  });

  it('safeIncrement events contain lock/unlock actions', () => {
    const result = safeIncrement(2, 2);
    const locks = result.events.filter((e) => e.action === 'lock');
    const unlocks = result.events.filter((e) => e.action === 'unlock');
    expect(locks.length).toBe(unlocks.length);
    expect(locks.length).toBe(4); // 2 threads * 2 increments
  });
});
