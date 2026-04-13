import { describe, it, expect } from 'vitest';
import { fifoPageReplacement, lruPageReplacement } from '@/lib/os/page-replacement';

describe('page-replacement', () => {
  const refString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3];

  it('FIFO counts the correct number of page faults', () => {
    const result = fifoPageReplacement(refString, 3);
    expect(result.totalFaults).toBeGreaterThan(0);
    expect(result.totalHits).toBe(refString.length - result.totalFaults);
  });

  it('LRU evicts the least recently used page', () => {
    // Reference: [1, 2, 3, 1, 4] with 3 frames
    // After 1,2,3 loaded, reference 1 (hit), then 4 evicts 2 (LRU)
    const result = lruPageReplacement([1, 2, 3, 1, 4], 3);
    const evictionEvent = result.events.find((e) => e.replacedPage !== undefined);
    expect(evictionEvent).toBeDefined();
    expect(evictionEvent!.replacedPage).toBe(2);
  });

  it('hitRate + faultRate equals 1', () => {
    const result = fifoPageReplacement(refString, 3);
    expect(result.hitRate + result.faultRate).toBeCloseTo(1);
  });
});
