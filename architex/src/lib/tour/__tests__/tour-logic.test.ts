import { describe, expect, test } from 'vitest';
import {
  buildTourHighlightCss,
  clampStepIndex,
  escapeCssAttr,
  getStepHighlights,
  getTourSteps,
  isLastStep,
} from '@/lib/tour/tour-logic';
import type { DiagramTemplate, LearnStep } from '@/lib/templates/types';

function makeTemplate(learnSteps?: LearnStep[]): DiagramTemplate {
  return {
    id: 't',
    name: 'T',
    description: '',
    difficulty: 1,
    category: 'classic',
    tags: [],
    nodes: [],
    edges: [],
    ...(learnSteps ? { learnSteps } : {}),
  };
}

const step = (
  nodes: string[] = [],
  edges: string[] = [],
): LearnStep => ({
  title: 's',
  description: 'd',
  highlightNodes: nodes,
  highlightEdges: edges,
});

describe('getTourSteps', () => {
  test('returns [] for null template', () => {
    expect(getTourSteps(null)).toEqual([]);
  });

  test('returns [] when template has no learnSteps', () => {
    expect(getTourSteps(makeTemplate())).toEqual([]);
  });

  test('returns authored steps when present', () => {
    const steps = [step(['a']), step(['b'])];
    expect(getTourSteps(makeTemplate(steps))).toEqual(steps);
  });
});

describe('clampStepIndex', () => {
  test('clamps below zero to 0', () => {
    expect(clampStepIndex(-3, 5)).toBe(0);
  });

  test('clamps past the end to total - 1', () => {
    expect(clampStepIndex(99, 5)).toBe(4);
  });

  test('passes through in-range indices', () => {
    expect(clampStepIndex(2, 5)).toBe(2);
  });

  test('returns 0 for empty tours', () => {
    expect(clampStepIndex(3, 0)).toBe(0);
  });

  test('truncates fractional indices and handles NaN', () => {
    expect(clampStepIndex(1.9, 5)).toBe(1);
    expect(clampStepIndex(Number.NaN, 5)).toBe(0);
  });
});

describe('isLastStep', () => {
  test('true on the final step', () => {
    expect(isLastStep(4, 5)).toBe(true);
  });

  test('false mid-tour', () => {
    expect(isLastStep(2, 5)).toBe(false);
  });

  test('false for empty tours', () => {
    expect(isLastStep(0, 0)).toBe(false);
  });

  test('single-step tour is immediately the last step', () => {
    expect(isLastStep(0, 1)).toBe(true);
  });
});

describe('escapeCssAttr', () => {
  test('escapes double quotes and backslashes', () => {
    expect(escapeCssAttr('a"b\\c')).toBe('a\\"b\\\\c');
  });

  test('leaves plain slugs untouched', () => {
    expect(escapeCssAttr('web-server')).toBe('web-server');
  });
});

describe('getStepHighlights', () => {
  test('normalizes a missing step to empty lists', () => {
    expect(getStepHighlights(null)).toEqual({ nodeIds: [], edgeIds: [] });
  });

  test('normalizes missing arrays defensively', () => {
    const malformed = { title: 's', description: 'd' } as LearnStep;
    expect(getStepHighlights(malformed)).toEqual({ nodeIds: [], edgeIds: [] });
  });

  test('passes through authored ids', () => {
    expect(getStepHighlights(step(['a'], ['e1']))).toEqual({
      nodeIds: ['a'],
      edgeIds: ['e1'],
    });
  });
});

describe('buildTourHighlightCss', () => {
  test('returns empty string when nothing is highlighted', () => {
    expect(buildTourHighlightCss({ nodeIds: [], edgeIds: [] })).toBe('');
  });

  test('dims non-highlighted nodes via :not chains', () => {
    const css = buildTourHighlightCss({
      nodeIds: ['cache', 'database'],
      edgeIds: [],
    });
    expect(css).toContain(
      '.react-flow__node:not([data-id="cache"]):not([data-id="database"])',
    );
    expect(css).toContain('opacity: 0.16');
  });

  test('keeps highlighted edges at full opacity via :not chains', () => {
    const css = buildTourHighlightCss({ nodeIds: ['a'], edgeIds: ['e-1'] });
    expect(css).toContain('.react-flow__edge:not([data-id="e-1"])');
  });

  test('dims ALL edges when a step highlights only nodes', () => {
    const css = buildTourHighlightCss({ nodeIds: ['a'], edgeIds: [] });
    expect(css).toContain('.react-flow__edge {');
    expect(css).toMatch(/\.react-flow__edge \{ opacity: 0\.12/);
  });

  test('adds a glow rule per highlighted node', () => {
    const css = buildTourHighlightCss({ nodeIds: ['a', 'b'], edgeIds: [] });
    expect(css).toContain('.react-flow__node[data-id="a"] { filter: drop-shadow');
    expect(css).toContain('.react-flow__node[data-id="b"] { filter: drop-shadow');
  });

  test('escapes hostile ids inside attribute selectors', () => {
    const css = buildTourHighlightCss({
      nodeIds: ['a"] *{}'],
      edgeIds: [],
    });
    expect(css).toContain('[data-id="a\\"] *{}"]');
  });
});
