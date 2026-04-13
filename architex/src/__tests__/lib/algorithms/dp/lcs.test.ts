import { describe, it, expect } from 'vitest';
import { lcs } from '@/lib/algorithms/dp/lcs';

describe('LCS', () => {
  it('computes correct LCS length for known inputs', () => {
    const result = lcs('ABCBDAB', 'BDCAB');
    // LCS = "BCAB" (length 4)
    expect(result.finalState[result.finalState.length - 1]).toBe(4);
  });

  it('recovers the correct LCS string', () => {
    const result = lcs('ABCBDAB', 'BDCAB');
    expect(result.lcsString.length).toBe(4);
  });

  it('returns 0 for completely different strings', () => {
    const result = lcs('ABC', 'XYZ');
    expect(result.finalState[result.finalState.length - 1]).toBe(0);
    expect(result.lcsString).toBe('');
  });

  it('handles identical strings', () => {
    const result = lcs('HELLO', 'HELLO');
    expect(result.lcsString).toBe('HELLO');
    expect(result.finalState[result.finalState.length - 1]).toBe(5);
  });
});
