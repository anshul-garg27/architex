import { describe, it, expect } from 'vitest';
import { CAPCluster } from '@/lib/distributed/cap-theorem';

describe('CAP theorem cluster', () => {
  it('CP rejects writes on minority partition', () => {
    const cluster = new CAPCluster('CP');
    cluster.write('node-0', 'x', '1');
    cluster.createPartition(['node-0'], ['node-1', 'node-2']);
    const result = cluster.write('node-0', 'x', '99');
    expect(result.success).toBe(false);
    expect(result.error).toContain('minority');
  });

  it('AP accepts writes on both sides of a partition', () => {
    const cluster = new CAPCluster('AP');
    cluster.createPartition(['node-0'], ['node-1', 'node-2']);
    const r1 = cluster.write('node-0', 'x', 'left');
    const r2 = cluster.write('node-1', 'x', 'right');
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(cluster.hasDivergence()).toBe(true);
  });
});
