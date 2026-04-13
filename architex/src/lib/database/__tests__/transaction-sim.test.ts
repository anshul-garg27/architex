import { describe, it, expect } from 'vitest';
import {
  simulateIsolation,
  simulateWriteSkew,
  simulateLostUpdate,
} from '../transaction-sim';

// ── Transaction Isolation Simulator Tests ─────────────────────

describe('simulateIsolation', () => {
  it('"read-uncommitted" produces dirty-read anomaly step', () => {
    const steps = simulateIsolation('read-uncommitted');

    expect(steps.length).toBeGreaterThan(0);
    const anomalyStep = steps.find((s) => s.anomaly === 'dirty-read');
    expect(anomalyStep).toBeDefined();
    expect(anomalyStep!.description).toContain('DIRTY READ');
  });

  it('"read-committed" produces non-repeatable-read anomaly step', () => {
    const steps = simulateIsolation('read-committed');

    expect(steps.length).toBeGreaterThan(0);
    const anomalyStep = steps.find((s) => s.anomaly === 'non-repeatable-read');
    expect(anomalyStep).toBeDefined();
    expect(anomalyStep!.description).toContain('NON-REPEATABLE READ');
  });

  it('"repeatable-read" produces phantom-read anomaly step', () => {
    const steps = simulateIsolation('repeatable-read');

    expect(steps.length).toBeGreaterThan(0);
    const anomalyStep = steps.find((s) => s.anomaly === 'phantom-read');
    expect(anomalyStep).toBeDefined();
    expect(anomalyStep!.description).toContain('PHANTOM READ');
  });

  it('"serializable" produces no anomaly steps', () => {
    const steps = simulateIsolation('serializable');

    expect(steps.length).toBeGreaterThan(0);
    const anomalySteps = steps.filter((s) => s.anomaly !== undefined);
    expect(anomalySteps).toHaveLength(0);
  });
});

describe('simulateWriteSkew', () => {
  it('produces write-skew anomaly step', () => {
    const steps = simulateWriteSkew();

    expect(steps.length).toBeGreaterThan(0);
    const anomalyStep = steps.find((s) => s.anomaly === 'write-skew');
    expect(anomalyStep).toBeDefined();
    expect(anomalyStep!.description).toContain('WRITE SKEW');
  });
});

describe('simulateLostUpdate', () => {
  it('produces lost-update anomaly step', () => {
    const steps = simulateLostUpdate();

    expect(steps.length).toBeGreaterThan(0);
    const anomalyStep = steps.find((s) => s.anomaly === 'lost-update');
    expect(anomalyStep).toBeDefined();
    expect(anomalyStep!.description).toContain('LOST UPDATE');
  });
});
