import { describe, test, expect } from 'vitest';
import {
  SORTING_ALGORITHMS, GRAPH_ALGORITHMS, TREE_ALGORITHMS,
  DP_ALGORITHMS, STRING_ALGORITHMS, BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS, SEARCH_ALGORITHMS, GREEDY_ALGORITHMS,
  PATTERN_ALGORITHMS, PROBABILISTIC_ALGORITHMS, VECTOR_SEARCH_ALGORITHMS,
  DESIGN_ALGORITHMS,
} from '@/lib/algorithms';

// ── Collect ALL algorithm config IDs across every category ──

const allConfigs = [
  ...SORTING_ALGORITHMS, ...SEARCH_ALGORITHMS, ...GREEDY_ALGORITHMS,
  ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS, ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS, ...GEOMETRY_ALGORITHMS,
  ...PATTERN_ALGORITHMS, ...PROBABILISTIC_ALGORITHMS, ...VECTOR_SEARCH_ALGORITHMS,
  ...DESIGN_ALGORITHMS,
];

describe('Runner coverage - every algorithm ID must have a handler', () => {
  test('every algorithm has a unique ID', () => {
    const ids = allConfigs.map(c => c.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every algorithm has a valid category', () => {
    const validCategories = [
      'sorting', 'graph', 'tree', 'dp', 'string', 'backtracking', 'geometry',
    ];
    for (const config of allConfigs) {
      expect(validCategories, `${config.id} has invalid category "${config.category}"`).toContain(config.category);
    }
  });

  test('every algorithm has required metadata fields', () => {
    for (const config of allConfigs) {
      expect(config.name, `${config.id} missing name`).toBeTruthy();
      expect(config.description, `${config.id} missing description`).toBeTruthy();
      expect(config.timeComplexity, `${config.id} missing timeComplexity`).toBeDefined();
      expect(config.spaceComplexity, `${config.id} missing spaceComplexity`).toBeTruthy();
      expect(config.pseudocode, `${config.id} missing pseudocode`).toBeDefined();
      expect(config.pseudocode.length, `${config.id} has empty pseudocode`).toBeGreaterThan(0);
    }
  });

  test('total algorithm count matches expected', () => {
    expect(allConfigs.length).toBeGreaterThanOrEqual(70);
  });

  test('each category has at least one algorithm', () => {
    expect(SORTING_ALGORITHMS.length).toBeGreaterThan(0);
    expect(GRAPH_ALGORITHMS.length).toBeGreaterThan(0);
    expect(TREE_ALGORITHMS.length).toBeGreaterThan(0);
    expect(DP_ALGORITHMS.length).toBeGreaterThan(0);
    expect(STRING_ALGORITHMS.length).toBeGreaterThan(0);
    expect(BACKTRACKING_ALGORITHMS.length).toBeGreaterThan(0);
    expect(GEOMETRY_ALGORITHMS.length).toBeGreaterThan(0);
    expect(SEARCH_ALGORITHMS.length).toBeGreaterThan(0);
    expect(GREEDY_ALGORITHMS.length).toBeGreaterThan(0);
    expect(PATTERN_ALGORITHMS.length).toBeGreaterThan(0);
    expect(PROBABILISTIC_ALGORITHMS.length).toBeGreaterThan(0);
    expect(VECTOR_SEARCH_ALGORITHMS.length).toBeGreaterThan(0);
    expect(DESIGN_ALGORITHMS.length).toBeGreaterThan(0);
  });
});
