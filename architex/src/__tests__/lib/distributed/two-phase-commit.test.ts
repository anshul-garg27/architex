import { describe, it, expect } from 'vitest';
import { simulate2PC } from '@/lib/distributed/two-phase-commit';

describe('Two-Phase Commit', () => {
  it('all vote yes -> commit', () => {
    const steps = simulate2PC(3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.phase).toBe('commit');
    expect(lastStep.participants.every((p) => p.committed)).toBe(true);
    expect(lastStep.participants.every((p) => p.vote === 'yes')).toBe(true);
  });

  it('one no -> abort', () => {
    const steps = simulate2PC(3, 1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.phase).toBe('abort');
    expect(lastStep.participants.every((p) => !p.committed)).toBe(true);
    expect(lastStep.participants[1].vote).toBe('no');
  });

  it('throws for zero participants', () => {
    expect(() => simulate2PC(0)).toThrow();
  });
});
