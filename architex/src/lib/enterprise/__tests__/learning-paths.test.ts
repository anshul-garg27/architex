import { describe, it, expect } from 'vitest';
import {
  LEARNING_PATHS,
  getPathById,
  getPathProgress,
  getPathTotalMinutes,
  getPathRemainingMinutes,
  getNextRecommendedModule,
} from '../learning-paths';
import type { LearningPath } from '../types';

// ── Test fixture ──────────────────────────────────────────────

const testPath: LearningPath = {
  id: 'test-path',
  name: 'Test Path',
  description: 'A path for testing',
  createdBy: 'test',
  modules: [
    { moduleId: 'mod-1', order: 1, required: true,  estimatedMinutes: 30 },
    { moduleId: 'mod-2', order: 2, required: true,  estimatedMinutes: 60 },
    { moduleId: 'mod-3', order: 3, required: false, estimatedMinutes: 45 },
    { moduleId: 'mod-4', order: 4, required: true,  estimatedMinutes: 50 },
  ],
};

// ── LEARNING_PATHS constant ───────────────────────────────────

describe('LEARNING_PATHS', () => {
  it('contains exactly 5 pre-built paths', () => {
    expect(LEARNING_PATHS).toHaveLength(5);
  });

  it('includes all expected path names', () => {
    const names = LEARNING_PATHS.map((p) => p.name);
    expect(names).toContain('System Design Fundamentals');
    expect(names).toContain('Distributed Systems Deep Dive');
    expect(names).toContain('Interview Crash Course (2 weeks)');
    expect(names).toContain('Backend Architecture');
    expect(names).toContain('Full Stack Design');
  });

  it('every path has at least one module', () => {
    for (const path of LEARNING_PATHS) {
      expect(path.modules.length).toBeGreaterThan(0);
    }
  });

  it('every module has a positive estimatedMinutes', () => {
    for (const path of LEARNING_PATHS) {
      for (const mod of path.modules) {
        expect(mod.estimatedMinutes).toBeGreaterThan(0);
      }
    }
  });

  it('module orders are sequential within each path', () => {
    for (const path of LEARNING_PATHS) {
      const sorted = [...path.modules].sort((a, b) => a.order - b.order);
      sorted.forEach((mod, i) => {
        expect(mod.order).toBe(i + 1);
      });
    }
  });

  it('each path has a unique id', () => {
    const ids = LEARNING_PATHS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── getPathById ───────────────────────────────────────────────

describe('getPathById', () => {
  it('returns the correct path for a valid id', () => {
    const result = getPathById('system-design-fundamentals');
    expect(result).toBeDefined();
    expect(result!.name).toBe('System Design Fundamentals');
  });

  it('returns undefined for an unknown id', () => {
    expect(getPathById('nonexistent-path')).toBeUndefined();
  });
});

// ── getPathProgress ───────────────────────────────────────────

describe('getPathProgress', () => {
  it('returns 0 when no modules are completed', () => {
    expect(getPathProgress(testPath, [])).toBe(0);
  });

  it('returns 100 when all modules are completed', () => {
    expect(
      getPathProgress(testPath, ['mod-1', 'mod-2', 'mod-3', 'mod-4']),
    ).toBe(100);
  });

  it('returns correct percentage for partial completion', () => {
    // 2 out of 4 = 50%
    expect(getPathProgress(testPath, ['mod-1', 'mod-2'])).toBe(50);
  });

  it('returns 25% for one out of four modules', () => {
    expect(getPathProgress(testPath, ['mod-1'])).toBe(25);
  });

  it('ignores module IDs not in the path', () => {
    expect(getPathProgress(testPath, ['mod-1', 'unknown-mod'])).toBe(25);
  });

  it('returns 100 for an empty path (edge case)', () => {
    const emptyPath: LearningPath = {
      id: 'empty',
      name: 'Empty',
      description: '',
      createdBy: 'test',
      modules: [],
    };
    expect(getPathProgress(emptyPath, [])).toBe(100);
  });
});

// ── getPathTotalMinutes ───────────────────────────────────────

describe('getPathTotalMinutes', () => {
  it('sums all module estimated minutes', () => {
    // 30 + 60 + 45 + 50 = 185
    expect(getPathTotalMinutes(testPath)).toBe(185);
  });

  it('returns 0 for an empty path', () => {
    const emptyPath: LearningPath = {
      id: 'empty',
      name: 'Empty',
      description: '',
      createdBy: 'test',
      modules: [],
    };
    expect(getPathTotalMinutes(emptyPath)).toBe(0);
  });
});

// ── getPathRemainingMinutes ───────────────────────────────────

describe('getPathRemainingMinutes', () => {
  it('returns full total when nothing is completed', () => {
    expect(getPathRemainingMinutes(testPath, [])).toBe(185);
  });

  it('returns 0 when everything is completed', () => {
    expect(
      getPathRemainingMinutes(testPath, ['mod-1', 'mod-2', 'mod-3', 'mod-4']),
    ).toBe(0);
  });

  it('subtracts completed module times', () => {
    // Total 185 - mod-1 (30) = 155
    expect(getPathRemainingMinutes(testPath, ['mod-1'])).toBe(155);
  });
});

// ── getNextRecommendedModule ──────────────────────────────────

describe('getNextRecommendedModule', () => {
  it('returns the first required module when nothing is completed', () => {
    const next = getNextRecommendedModule(testPath, []);
    expect(next).not.toBeNull();
    expect(next!.moduleId).toBe('mod-1');
  });

  it('skips completed modules and returns next required', () => {
    const next = getNextRecommendedModule(testPath, ['mod-1']);
    expect(next).not.toBeNull();
    expect(next!.moduleId).toBe('mod-2');
  });

  it('skips optional modules in favor of required ones', () => {
    // mod-1 and mod-2 done (both required). mod-3 is optional, mod-4 is required.
    const next = getNextRecommendedModule(testPath, ['mod-1', 'mod-2']);
    expect(next).not.toBeNull();
    expect(next!.moduleId).toBe('mod-4');
  });

  it('returns optional module when all required are done', () => {
    const next = getNextRecommendedModule(testPath, [
      'mod-1',
      'mod-2',
      'mod-4',
    ]);
    expect(next).not.toBeNull();
    expect(next!.moduleId).toBe('mod-3');
  });

  it('returns null when all modules are completed', () => {
    const next = getNextRecommendedModule(testPath, [
      'mod-1',
      'mod-2',
      'mod-3',
      'mod-4',
    ]);
    expect(next).toBeNull();
  });

  it('returns null for an empty path', () => {
    const emptyPath: LearningPath = {
      id: 'empty',
      name: 'Empty',
      description: '',
      createdBy: 'test',
      modules: [],
    };
    expect(getNextRecommendedModule(emptyPath, [])).toBeNull();
  });
});
