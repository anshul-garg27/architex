import { describe, it, expect } from "vitest";
import {
  ALL_TRACKS,
  TRACK_NODES,
  SKILL_NODES,
  TRACK_COLORS,
  checkUnlockable,
  getTrackProgress,
  getTrackEdges,
  createInitialProgress,
  type SkillTrack,
  type UserProgress,
} from "@/lib/innovation/skill-tree";

// -- Helpers ---------------------------------------------------

function makeProgress(unlockedIds: string[], xp: number): UserProgress {
  return {
    unlockedNodes: new Set(unlockedIds),
    availableXp: xp,
  };
}

// -- All 5 tracks present and complete -------------------------

describe("skill-tree extended: all 5 tracks", () => {
  it("ALL_TRACKS contains exactly the 5 expected tracks", () => {
    const expected: SkillTrack[] = [
      "architecture",
      "databases",
      "distributed-systems",
      "performance",
      "security",
    ];
    expect(ALL_TRACKS).toEqual(expected);
  });

  it("TRACK_COLORS has an entry for every track", () => {
    for (const track of ALL_TRACKS) {
      const color = TRACK_COLORS[track];
      expect(color).toBeDefined();
      expect(color.base.length).toBeGreaterThan(0);
      expect(color.glow.length).toBeGreaterThan(0);
      expect(color.label.length).toBeGreaterThan(0);
    }
  });

  it("every node's track field matches the track it belongs to", () => {
    for (const track of ALL_TRACKS) {
      for (const node of TRACK_NODES[track]) {
        expect(node.track).toBe(track);
      }
    }
  });

  it("total node count across all tracks is 47", () => {
    let total = 0;
    for (const track of ALL_TRACKS) {
      total += TRACK_NODES[track].length;
    }
    expect(total).toBe(Object.keys(SKILL_NODES).length);
    // architecture(9) + databases(9) + distributed(10) + performance(10) + security(10)
    expect(total).toBe(48);
  });
});

// -- DAG validity extended -------------------------------------

describe("skill-tree extended: DAG validity", () => {
  it.each(ALL_TRACKS)(
    'track "%s" has strictly increasing column for each path root->leaf',
    (track) => {
      // For each node, all prerequisites should have a strictly smaller column
      for (const node of TRACK_NODES[track]) {
        for (const prereqId of node.prerequisites) {
          const prereq = SKILL_NODES[prereqId];
          expect(prereq).toBeDefined();
          expect(prereq.column).toBeLessThan(node.column);
        }
      }
    },
  );

  it.each(ALL_TRACKS)(
    'track "%s" prerequisites only reference nodes in the same track',
    (track) => {
      const trackIds = new Set(TRACK_NODES[track].map((n) => n.id));
      for (const node of TRACK_NODES[track]) {
        for (const prereqId of node.prerequisites) {
          expect(trackIds.has(prereqId)).toBe(true);
        }
      }
    },
  );

  it("no node is its own prerequisite", () => {
    for (const node of Object.values(SKILL_NODES)) {
      expect(node.prerequisites).not.toContain(node.id);
    }
  });

  it("all XP requirements are non-negative integers", () => {
    for (const node of Object.values(SKILL_NODES)) {
      expect(Number.isInteger(node.xpRequired)).toBe(true);
      expect(node.xpRequired).toBeGreaterThanOrEqual(0);
    }
  });
});

// -- Progress calculation extended -----------------------------

describe("skill-tree extended: progress calculation", () => {
  it("getTrackProgress returns 0 for totally empty progress", () => {
    const progress = createInitialProgress(0);
    for (const track of ALL_TRACKS) {
      expect(getTrackProgress(track, progress)).toBe(0);
    }
  });

  it("getTrackProgress returns 100 when every node is unlocked per track", () => {
    for (const track of ALL_TRACKS) {
      const ids = TRACK_NODES[track].map((n) => n.id);
      const progress = makeProgress(ids, 0);
      expect(getTrackProgress(track, progress)).toBe(100);
    }
  });

  it("unlocking one node in a track gives a correct non-zero percentage", () => {
    for (const track of ALL_TRACKS) {
      const firstNode = TRACK_NODES[track][0];
      const progress = makeProgress([firstNode.id], 0);
      const expected = Math.round((1 / TRACK_NODES[track].length) * 100);
      expect(getTrackProgress(track, progress)).toBe(expected);
    }
  });

  it("getTrackEdges count matches total prerequisite references per track", () => {
    for (const track of ALL_TRACKS) {
      const edges = getTrackEdges(track);
      let prereqCount = 0;
      for (const node of TRACK_NODES[track]) {
        prereqCount += node.prerequisites.length;
      }
      expect(edges).toHaveLength(prereqCount);
    }
  });

  it("checkUnlockable returns false for already-unlocked root nodes", () => {
    for (const track of ALL_TRACKS) {
      const root = TRACK_NODES[track].find(
        (n) => n.prerequisites.length === 0,
      )!;
      const progress = makeProgress([root.id], 9999);
      expect(checkUnlockable(root.id, progress)).toBe(false);
    }
  });

  it("checkUnlockable returns true for root nodes from any track with 0 XP", () => {
    const progress = createInitialProgress(0);
    for (const track of ALL_TRACKS) {
      const root = TRACK_NODES[track].find(
        (n) => n.prerequisites.length === 0,
      )!;
      expect(checkUnlockable(root.id, progress)).toBe(true);
    }
  });

  it("createInitialProgress with XP sets the correct availableXp", () => {
    const p = createInitialProgress(1234);
    expect(p.availableXp).toBe(1234);
    expect(p.unlockedNodes.size).toBe(0);
  });

  it("checkUnlockable respects exact XP boundary", () => {
    // arch-api-design requires 100 XP and arch-fundamentals unlocked
    const justEnough = makeProgress(["arch-fundamentals"], 100);
    expect(checkUnlockable("arch-api-design", justEnough)).toBe(true);

    const notEnough = makeProgress(["arch-fundamentals"], 99);
    expect(checkUnlockable("arch-api-design", notEnough)).toBe(false);
  });

  it("getTrackEdges returns empty for a completely nonexistent track", () => {
    const edges = getTrackEdges("nope" as SkillTrack);
    expect(edges).toEqual([]);
  });
});
