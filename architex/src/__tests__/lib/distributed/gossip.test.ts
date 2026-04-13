import { describe, it, expect } from 'vitest';
import { GossipProtocol } from '@/lib/distributed/gossip';

describe('Gossip protocol', () => {
  it('converges data within bounded rounds', () => {
    const gp = new GossipProtocol(5, 2);
    gp.introduceData('node-0', 'leader', 'node-0');

    for (let i = 0; i < 20; i++) {
      gp.step();
      if (gp.getConvergenceStatus().converged) break;
    }
    expect(gp.getConvergenceStatus().converged).toBe(true);
  });

  it('all alive nodes hold the same value after convergence', () => {
    const gp = new GossipProtocol(4, 2);
    gp.introduceData('node-1', 'key', 'value-42');

    for (let i = 0; i < 30; i++) gp.step();

    for (const node of gp.getNodes()) {
      if (node.alive) {
        expect(node.data.get('key')?.value).toBe('value-42');
      }
    }
  });
});
