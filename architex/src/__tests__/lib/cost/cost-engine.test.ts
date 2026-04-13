import { describe, it, expect } from 'vitest';
import { calculateInfrastructureCost } from '@/lib/cost/cost-engine';

describe('Cost engine', () => {
  it('empty canvas costs $0', () => {
    const estimate = calculateInfrastructureCost([], []);
    expect(estimate.totalMonthlyCost).toBe(0);
    expect(estimate.components).toHaveLength(0);
    expect(estimate.dataTransferCost).toBe(0);
  });

  it('adding a database node increases total cost above $0', () => {
    const nodes = [
      {
        id: 'db-1',
        type: 'system-design',
        position: { x: 0, y: 0 },
        data: { componentType: 'database', label: 'Postgres', config: {} },
      },
    ];
    const estimate = calculateInfrastructureCost(nodes, []);
    expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
    expect(estimate.components).toHaveLength(1);
    expect(estimate.components[0].nodeType).toBe('database');
  });
});
