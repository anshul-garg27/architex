import { describe, test, expect } from 'vitest';

// parseStepMutations is defined inside AlgorithmModule.tsx and not exported.
// We'll test it by reimplementing the logic here (same regex pattern).

function parseStepMutations(mutations: Array<{targetId: string; property: string; to: string | number}>, arrayLength: number) {
  const states = Array.from({ length: arrayLength }, () => 'default');
  for (const mutation of mutations) {
    const match = mutation.targetId.match(/^(?:element-)?(\d+)$/);
    if (!match) continue;
    const idx = parseInt(match[1], 10);
    if (idx < 0 || idx >= arrayLength) continue;
    if (mutation.property === 'fill' || mutation.property === 'highlight') {
      const value = String(mutation.to).toLowerCase();
      if (value === 'comparing') states[idx] = 'comparing';
      else if (value === 'swapping') states[idx] = 'swapping';
      else if (value === 'sorted') states[idx] = 'sorted';
      else if (value === 'pivot') states[idx] = 'pivot';
      else if (value === 'active') states[idx] = 'active';
      else if (value === 'found') states[idx] = 'found';
    }
  }
  return states;
}

describe('parseStepMutations', () => {
  test('parses element-N format', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'highlight', to: 'comparing' },
      { targetId: 'element-2', property: 'highlight', to: 'sorted' },
    ], 5);
    expect(result[0]).toBe('comparing');
    expect(result[1]).toBe('default');
    expect(result[2]).toBe('sorted');
  });

  test('parses plain number format (legacy)', () => {
    const result = parseStepMutations([
      { targetId: '3', property: 'highlight', to: 'swapping' },
    ], 5);
    expect(result[3]).toBe('swapping');
  });

  test('ignores non-matching targetIds', () => {
    const result = parseStepMutations([
      { targetId: 'node-A', property: 'highlight', to: 'comparing' },
      { targetId: 'dp-2-3', property: 'highlight', to: 'sorted' },
    ], 5);
    expect(result.every(s => s === 'default')).toBe(true);
  });

  test('ignores out of bounds', () => {
    const result = parseStepMutations([
      { targetId: 'element-10', property: 'highlight', to: 'comparing' },
    ], 5);
    expect(result.every(s => s === 'default')).toBe(true);
  });

  test('empty mutations returns all default', () => {
    expect(parseStepMutations([], 3)).toEqual(['default', 'default', 'default']);
  });

  test('handles all valid state types', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'fill', to: 'comparing' },
      { targetId: 'element-1', property: 'fill', to: 'swapping' },
      { targetId: 'element-2', property: 'fill', to: 'sorted' },
      { targetId: 'element-3', property: 'fill', to: 'pivot' },
      { targetId: 'element-4', property: 'fill', to: 'active' },
      { targetId: 'element-5', property: 'fill', to: 'found' },
    ], 6);
    expect(result).toEqual(['comparing', 'swapping', 'sorted', 'pivot', 'active', 'found']);
  });

  test('ignores non-fill/highlight properties', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'position', to: 'comparing' },
      { targetId: 'element-1', property: 'opacity', to: 'swapping' },
      { targetId: 'element-2', property: 'label', to: 'sorted' },
    ], 3);
    expect(result.every(s => s === 'default')).toBe(true);
  });

  test('last mutation wins for same index', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'highlight', to: 'comparing' },
      { targetId: 'element-0', property: 'highlight', to: 'sorted' },
    ], 3);
    expect(result[0]).toBe('sorted');
  });

  test('handles case-insensitive state values', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'highlight', to: 'COMPARING' },
      { targetId: 'element-1', property: 'highlight', to: 'Swapping' },
    ], 3);
    expect(result[0]).toBe('comparing');
    expect(result[1]).toBe('swapping');
  });

  test('ignores unknown state values', () => {
    const result = parseStepMutations([
      { targetId: 'element-0', property: 'highlight', to: 'unknown-state' },
      { targetId: 'element-1', property: 'highlight', to: 'visited' },
    ], 3);
    expect(result[0]).toBe('default');
    expect(result[1]).toBe('default');
  });

  test('handles negative index in targetId', () => {
    // regex ^(?:element-)?(\d+)$ won't match negative numbers (no hyphen before digits allowed by element- prefix)
    const result = parseStepMutations([
      { targetId: 'element--1', property: 'highlight', to: 'comparing' },
    ], 5);
    expect(result.every(s => s === 'default')).toBe(true);
  });
});
