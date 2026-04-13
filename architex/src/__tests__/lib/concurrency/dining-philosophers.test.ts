import { describe, it, expect } from 'vitest';
import { simulateNaive, simulateOrdered } from '@/lib/concurrency/dining-philosophers';

describe('dining-philosophers', () => {
  it('naive strategy produces waiting states (potential deadlock scenario)', () => {
    const events = simulateNaive(5, 50);
    const waitingEvents = events.filter((e) => e.state === 'waiting');
    expect(waitingEvents.length).toBeGreaterThan(0);
  });

  it('ordered strategy prevents deadlock', () => {
    const events = simulateOrdered(5, 30);
    const deadlockEvents = events.filter((e) => e.deadlock);
    expect(deadlockEvents).toHaveLength(0);
  });

  it('ordered strategy allows at least one philosopher to eat', () => {
    const events = simulateOrdered(5, 30);
    const eatingEvents = events.filter((e) => e.state === 'eating');
    expect(eatingEvents.length).toBeGreaterThan(0);
  });
});
