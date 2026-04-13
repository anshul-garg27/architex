import { describe, it, expect } from 'vitest';
import {
  ALL_TRACKS,
  TRACK_NODES,
  SKILL_NODES,
  checkUnlockable,
  getTrackProgress,
  getTrackEdges,
  createInitialProgress,
  type SkillTrack,
  type UserProgress,
} from '@/lib/innovation/skill-tree';

// ── Helper ──────────────────────────────────────────────────

/** Creates progress with specified unlocked nodes and XP. */
function makeProgress(unlockedIds: string[], xp: number): UserProgress {
  return {
    unlockedNodes: new Set(unlockedIds),
    availableXp: xp,
  };
}

// ── Data Completeness ───────────────────────────────────────

describe('skill-tree data completeness', () => {
  it('defines exactly 5 tracks', () => {
    expect(ALL_TRACKS).toHaveLength(5);
  });

  it.each(ALL_TRACKS)('track "%s" has 8-10 nodes', (track) => {
    const nodes = TRACK_NODES[track];
    expect(nodes.length).toBeGreaterThanOrEqual(8);
    expect(nodes.length).toBeLessThanOrEqual(10);
  });

  it('all node IDs are unique across all tracks', () => {
    const allIds = Object.keys(SKILL_NODES);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it.each(ALL_TRACKS)(
    'track "%s" nodes all have required fields populated',
    (track) => {
      for (const node of TRACK_NODES[track]) {
        expect(node.id.length).toBeGreaterThan(0);
        expect(node.name.length).toBeGreaterThan(0);
        expect(node.description.length).toBeGreaterThan(0);
        expect(node.track).toBe(track);
        expect(Array.isArray(node.prerequisites)).toBe(true);
        expect(typeof node.xpRequired).toBe('number');
        expect(node.xpRequired).toBeGreaterThanOrEqual(0);
        expect(typeof node.column).toBe('number');
        expect(typeof node.row).toBe('number');
      }
    },
  );

  it.each(ALL_TRACKS)(
    'track "%s" prerequisite IDs all reference existing nodes',
    (track) => {
      for (const node of TRACK_NODES[track]) {
        for (const prereq of node.prerequisites) {
          expect(SKILL_NODES[prereq]).toBeDefined();
        }
      }
    },
  );

  it.each(ALL_TRACKS)(
    'track "%s" has at least one root node (no prerequisites)',
    (track) => {
      const roots = TRACK_NODES[track].filter(
        (n) => n.prerequisites.length === 0,
      );
      expect(roots.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(ALL_TRACKS)(
    'track "%s" forms a valid DAG (no cycles)',
    (track) => {
      const nodes = TRACK_NODES[track];
      const visited = new Set<string>();
      const visiting = new Set<string>();

      function dfs(nodeId: string): boolean {
        if (visiting.has(nodeId)) return false; // cycle
        if (visited.has(nodeId)) return true;
        visiting.add(nodeId);
        const node = SKILL_NODES[nodeId];
        if (node) {
          for (const prereq of node.prerequisites) {
            if (!dfs(prereq)) return false;
          }
        }
        visiting.delete(nodeId);
        visited.add(nodeId);
        return true;
      }

      for (const node of nodes) {
        expect(dfs(node.id)).toBe(true);
      }
    },
  );

  it('SKILL_NODES flat map contains all nodes from all tracks', () => {
    let totalNodes = 0;
    for (const track of ALL_TRACKS) {
      totalNodes += TRACK_NODES[track].length;
    }
    expect(Object.keys(SKILL_NODES).length).toBe(totalNodes);
  });
});

// ── checkUnlockable ─────────────────────────────────────────

describe('checkUnlockable', () => {
  it('returns true for a root node with 0 XP requirement and enough XP', () => {
    const progress = makeProgress([], 0);
    expect(checkUnlockable('arch-fundamentals', progress)).toBe(true);
  });

  it('returns false for a node that is already unlocked', () => {
    const progress = makeProgress(['arch-fundamentals'], 1000);
    expect(checkUnlockable('arch-fundamentals', progress)).toBe(false);
  });

  it('returns false when prerequisites are not met', () => {
    const progress = makeProgress([], 1000);
    // arch-api-design requires arch-fundamentals
    expect(checkUnlockable('arch-api-design', progress)).toBe(false);
  });

  it('returns true when all prerequisites are met and XP is sufficient', () => {
    const progress = makeProgress(['arch-fundamentals'], 100);
    expect(checkUnlockable('arch-api-design', progress)).toBe(true);
  });

  it('returns false when prerequisites are met but XP is insufficient', () => {
    const progress = makeProgress(['arch-fundamentals'], 50);
    // arch-api-design requires 100 XP
    expect(checkUnlockable('arch-api-design', progress)).toBe(false);
  });

  it('returns false for a non-existent node ID', () => {
    const progress = makeProgress([], 9999);
    expect(checkUnlockable('does-not-exist', progress)).toBe(false);
  });

  it('handles multiple prerequisites correctly', () => {
    // arch-microservices requires arch-caching, arch-messaging, arch-load-balancing
    const incomplete = makeProgress(
      ['arch-fundamentals', 'arch-api-design', 'arch-caching', 'arch-messaging'],
      400,
    );
    expect(checkUnlockable('arch-microservices', incomplete)).toBe(false);

    const complete = makeProgress(
      [
        'arch-fundamentals',
        'arch-api-design',
        'arch-caching',
        'arch-messaging',
        'arch-load-balancing',
      ],
      400,
    );
    expect(checkUnlockable('arch-microservices', complete)).toBe(true);
  });

  it('returns true for 0 XP requirement when prerequisites are met', () => {
    // Root nodes with xpRequired=0
    const progress = makeProgress([], 0);
    expect(checkUnlockable('db-fundamentals', progress)).toBe(true);
    expect(checkUnlockable('dist-fundamentals', progress)).toBe(true);
    expect(checkUnlockable('perf-fundamentals', progress)).toBe(true);
    expect(checkUnlockable('sec-fundamentals', progress)).toBe(true);
  });
});

// ── getTrackProgress ────────────────────────────────────────

describe('getTrackProgress', () => {
  it('returns 0 for a track with no unlocked nodes', () => {
    const progress = makeProgress([], 0);
    expect(getTrackProgress('architecture', progress)).toBe(0);
  });

  it('returns 100 when all nodes in a track are unlocked', () => {
    const allArchIds = TRACK_NODES['architecture'].map((n) => n.id);
    const progress = makeProgress(allArchIds, 0);
    expect(getTrackProgress('architecture', progress)).toBe(100);
  });

  it('returns a percentage between 0 and 100 for partial progress', () => {
    const nodes = TRACK_NODES['databases'];
    const halfIds = nodes.slice(0, Math.floor(nodes.length / 2)).map((n) => n.id);
    const progress = makeProgress(halfIds, 0);
    const pct = getTrackProgress('databases', progress);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it('ignores unlocked nodes from other tracks', () => {
    // Unlock all architecture nodes but check databases track
    const allArchIds = TRACK_NODES['architecture'].map((n) => n.id);
    const progress = makeProgress(allArchIds, 0);
    expect(getTrackProgress('databases', progress)).toBe(0);
  });

  it('returns a rounded integer', () => {
    const nodes = TRACK_NODES['security'];
    // Unlock 3 of 10 = 30%
    const threeIds = nodes.slice(0, 3).map((n) => n.id);
    const progress = makeProgress(threeIds, 0);
    const pct = getTrackProgress('security', progress);
    expect(Number.isInteger(pct)).toBe(true);
  });
});

// ── getTrackEdges ───────────────────────────────────────────

describe('getTrackEdges', () => {
  it('returns edges as [from, to] pairs', () => {
    const edges = getTrackEdges('architecture');
    expect(edges.length).toBeGreaterThan(0);
    for (const [from, to] of edges) {
      expect(typeof from).toBe('string');
      expect(typeof to).toBe('string');
      expect(SKILL_NODES[from]).toBeDefined();
      expect(SKILL_NODES[to]).toBeDefined();
    }
  });

  it('returns empty array for a non-existent track', () => {
    expect(getTrackEdges('nonexistent' as SkillTrack)).toEqual([]);
  });

  it.each(ALL_TRACKS)('track "%s" edges match prerequisite relationships', (track) => {
    const edges = getTrackEdges(track);
    const nodes = TRACK_NODES[track];

    // Every prerequisite should produce an edge
    let expectedCount = 0;
    for (const node of nodes) {
      expectedCount += node.prerequisites.length;
    }
    expect(edges.length).toBe(expectedCount);
  });
});

// ── createInitialProgress ───────────────────────────────────

describe('createInitialProgress', () => {
  it('creates progress with empty unlocked set and default 0 XP', () => {
    const p = createInitialProgress();
    expect(p.unlockedNodes.size).toBe(0);
    expect(p.availableXp).toBe(0);
  });

  it('accepts a starting XP value', () => {
    const p = createInitialProgress(500);
    expect(p.availableXp).toBe(500);
  });
});
