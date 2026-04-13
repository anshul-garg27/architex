import { describe, it, expect } from 'vitest';
import { simulatePaxos } from '@/lib/distributed/paxos';

describe('Paxos consensus', () => {
  it('single proposer learns value', () => {
    const steps = simulatePaxos(1, 3);
    const learnStep = steps.find((s) => s.phase === 'learn');
    expect(learnStep).toBeDefined();
    expect(learnStep!.value).toBe('v1');
    expect(learnStep!.description).toContain('learned');
  });

  it('competing proposers resolve to a single value', () => {
    const steps = simulatePaxos(2, 5);
    const learnStep = steps.find((s) => s.phase === 'learn');
    expect(learnStep).toBeDefined();
    expect(learnStep!.value).toBe('v2');
    expect(learnStep!.proposalNumber).toBe(2);
  });

  it('throws for zero proposers or acceptors', () => {
    expect(() => simulatePaxos(0, 3)).toThrow();
    expect(() => simulatePaxos(1, 0)).toThrow();
  });
});
