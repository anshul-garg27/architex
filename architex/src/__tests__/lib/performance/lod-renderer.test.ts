import { describe, it, expect } from 'vitest';
import {
  getLODLevel,
  shouldRenderDetail,
  getVisibleDetails,
  DEFAULT_LOD_CONFIG,
  type LODConfig,
} from '@/lib/performance/lod-renderer';

describe('getLODLevel', () => {
  it('returns "full" when zoom is above fullThreshold', () => {
    expect(getLODLevel(1.0)).toBe('full');
    expect(getLODLevel(0.71)).toBe('full');
    expect(getLODLevel(2.5)).toBe('full');
  });

  it('returns "medium" when zoom is between mediumThreshold and fullThreshold', () => {
    expect(getLODLevel(0.7)).toBe('medium');
    expect(getLODLevel(0.5)).toBe('medium');
    expect(getLODLevel(0.41)).toBe('medium');
  });

  it('returns "low" when zoom is between lowThreshold and mediumThreshold', () => {
    expect(getLODLevel(0.4)).toBe('low');
    expect(getLODLevel(0.3)).toBe('low');
    expect(getLODLevel(0.21)).toBe('low');
  });

  it('returns "minimal" when zoom is below lowThreshold', () => {
    expect(getLODLevel(0.2)).toBe('minimal');
    expect(getLODLevel(0.1)).toBe('minimal');
    expect(getLODLevel(0.0)).toBe('minimal');
  });

  it('respects custom thresholds', () => {
    const custom: LODConfig = {
      fullThreshold: 0.9,
      mediumThreshold: 0.6,
      lowThreshold: 0.3,
    };

    expect(getLODLevel(0.95, custom)).toBe('full');
    expect(getLODLevel(0.8, custom)).toBe('medium');
    expect(getLODLevel(0.5, custom)).toBe('low');
    expect(getLODLevel(0.2, custom)).toBe('minimal');
  });

  it('handles exact boundary values consistently', () => {
    // At exactly the threshold value, we drop to the next tier
    // (thresholds are exclusive upper bounds for the lower tier)
    expect(getLODLevel(DEFAULT_LOD_CONFIG.fullThreshold)).toBe('medium');
    expect(getLODLevel(DEFAULT_LOD_CONFIG.mediumThreshold)).toBe('low');
    expect(getLODLevel(DEFAULT_LOD_CONFIG.lowThreshold)).toBe('minimal');
  });
});

describe('shouldRenderDetail', () => {
  it('shows all details at full zoom', () => {
    expect(shouldRenderDetail(1.0, 'icon')).toBe(true);
    expect(shouldRenderDetail(1.0, 'label')).toBe(true);
    expect(shouldRenderDetail(1.0, 'smallText')).toBe(true);
    expect(shouldRenderDetail(1.0, 'metrics')).toBe(true);
    expect(shouldRenderDetail(1.0, 'shadow')).toBe(true);
    expect(shouldRenderDetail(1.0, 'edgeAnimation')).toBe(true);
    expect(shouldRenderDetail(1.0, 'gradient')).toBe(true);
  });

  it('hides smallText, metrics, shadow, gradient at medium zoom', () => {
    expect(shouldRenderDetail(0.5, 'icon')).toBe(true);
    expect(shouldRenderDetail(0.5, 'label')).toBe(true);
    expect(shouldRenderDetail(0.5, 'smallText')).toBe(false);
    expect(shouldRenderDetail(0.5, 'metrics')).toBe(false);
    expect(shouldRenderDetail(0.5, 'shadow')).toBe(false);
    expect(shouldRenderDetail(0.5, 'gradient')).toBe(false);
  });

  it('shows only label and border at low zoom', () => {
    expect(shouldRenderDetail(0.3, 'label')).toBe(true);
    expect(shouldRenderDetail(0.3, 'border')).toBe(true);
    expect(shouldRenderDetail(0.3, 'icon')).toBe(false);
    expect(shouldRenderDetail(0.3, 'handles')).toBe(false);
    expect(shouldRenderDetail(0.3, 'edgeAnimation')).toBe(false);
  });

  it('shows nothing at minimal zoom', () => {
    expect(shouldRenderDetail(0.1, 'label')).toBe(false);
    expect(shouldRenderDetail(0.1, 'icon')).toBe(false);
    expect(shouldRenderDetail(0.1, 'border')).toBe(false);
    expect(shouldRenderDetail(0.1, 'handles')).toBe(false);
  });
});

describe('getVisibleDetails', () => {
  it('returns a non-empty set at full zoom', () => {
    const details = getVisibleDetails(1.0);
    expect(details.size).toBeGreaterThan(0);
    expect(details.has('icon')).toBe(true);
    expect(details.has('gradient')).toBe(true);
  });

  it('returns an empty set at minimal zoom', () => {
    const details = getVisibleDetails(0.05);
    expect(details.size).toBe(0);
  });

  it('returns a ReadonlySet that cannot be mutated', () => {
    const details = getVisibleDetails(1.0);
    // The Set returned should be the same reference as the internal set,
    // but typed as ReadonlySet so .add/.delete are not available at compile time.
    expect(typeof details.has).toBe('function');
    expect(typeof details[Symbol.iterator]).toBe('function');
  });
});
