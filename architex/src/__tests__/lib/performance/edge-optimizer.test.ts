import { describe, it, expect } from 'vitest';
import {
  shouldAnimateEdges,
  getEdgeStyle,
  DEFAULT_EDGE_PERFORMANCE_CONFIG,
  type EdgePerformanceConfig,
} from '@/lib/performance/edge-optimizer';

describe('shouldAnimateEdges', () => {
  it('returns true when node count is below threshold', () => {
    expect(shouldAnimateEdges(10)).toBe(true);
    expect(shouldAnimateEdges(100)).toBe(true);
    expect(shouldAnimateEdges(199)).toBe(true);
  });

  it('returns true when node count equals threshold', () => {
    expect(shouldAnimateEdges(200)).toBe(true);
  });

  it('returns false when node count exceeds threshold', () => {
    expect(shouldAnimateEdges(201)).toBe(false);
    expect(shouldAnimateEdges(500)).toBe(false);
    expect(shouldAnimateEdges(1000)).toBe(false);
  });

  it('respects a custom threshold', () => {
    expect(shouldAnimateEdges(50, 50)).toBe(true);
    expect(shouldAnimateEdges(51, 50)).toBe(false);
  });

  it('handles zero nodes', () => {
    expect(shouldAnimateEdges(0)).toBe(true);
  });
});

describe('getEdgeStyle', () => {
  it('returns full styling for small diagrams', () => {
    const style = getEdgeStyle(50);
    expect(style.animated).toBe(true);
    expect(style.showParticles).toBe(true);
    expect(style.useGradient).toBe(true);
    expect(style.strokeWidth).toBe(DEFAULT_EDGE_PERFORMANCE_CONFIG.defaultStrokeWidth);
  });

  it('disables gradient but keeps animation between gradient and animation thresholds', () => {
    // gradientThreshold = 150, animationThreshold = 200
    const style = getEdgeStyle(160);
    expect(style.animated).toBe(true);
    expect(style.showParticles).toBe(true);
    expect(style.useGradient).toBe(false);
    expect(style.strokeWidth).toBe(DEFAULT_EDGE_PERFORMANCE_CONFIG.defaultStrokeWidth);
  });

  it('disables everything for large diagrams', () => {
    const style = getEdgeStyle(300);
    expect(style.animated).toBe(false);
    expect(style.showParticles).toBe(false);
    expect(style.useGradient).toBe(false);
    expect(style.strokeWidth).toBe(DEFAULT_EDGE_PERFORMANCE_CONFIG.reducedStrokeWidth);
  });

  it('respects custom config', () => {
    const custom: EdgePerformanceConfig = {
      animationThreshold: 50,
      gradientThreshold: 30,
      defaultStrokeWidth: 3,
      reducedStrokeWidth: 0.5,
    };

    const small = getEdgeStyle(20, custom);
    expect(small.animated).toBe(true);
    expect(small.useGradient).toBe(true);
    expect(small.strokeWidth).toBe(3);

    const large = getEdgeStyle(60, custom);
    expect(large.animated).toBe(false);
    expect(large.useGradient).toBe(false);
    expect(large.strokeWidth).toBe(0.5);
  });

  it('returns correct values at exact thresholds', () => {
    // At exactly the threshold, we are NOT over it
    const atAnimation = getEdgeStyle(200);
    expect(atAnimation.animated).toBe(true);
    expect(atAnimation.showParticles).toBe(true);

    const atGradient = getEdgeStyle(150);
    expect(atGradient.useGradient).toBe(true);
  });
});
