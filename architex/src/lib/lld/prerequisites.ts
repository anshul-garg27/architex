// ─────────────────────────────────────────────────────────────
// Architex — Learning Path Prerequisites Engine (LLD-110)
// ─────────────────────────────────────────────────────────────
//
// Builds a DAG from PATTERN_PREREQUISITES and provides:
//   - buildLearningPath(category?) → topologically sorted PatternNode[]
//   - getPrerequisites(patternId) → prerequisite pattern ids
//   - getUnmetPrerequisites(patternId, masteredIds) → unmet prereqs
//
// Uses Kahn's algorithm for topological sort with tier grouping.
// ─────────────────────────────────────────────────────────────

import {
  DESIGN_PATTERNS,
  PATTERN_PREREQUISITES,
} from "./patterns";
import type { PatternCategory } from "./types";

// ── Types ────────────────────────────────────────────────────

export interface PatternNode {
  id: string;
  name: string;
  category: PatternCategory;
  difficulty: number;
  /** Topological tier — 0 = no prerequisites, higher = deeper in DAG. */
  tier: number;
  /** Pattern ids that must be learned before this one. */
  prerequisites: string[];
}

export interface LearningPath {
  nodes: PatternNode[];
  /** Number of tiers (max tier + 1). */
  tierCount: number;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Build a topologically sorted learning path using Kahn's algorithm.
 *
 * Each node is assigned a tier: patterns with no prerequisites are tier 0,
 * patterns whose prerequisites are all in tier N are placed in tier N+1.
 *
 * @param category — optional filter to restrict to one category
 */
export function buildLearningPath(category?: string): PatternNode[] {
  // Collect pattern ids in scope
  const patterns = category
    ? DESIGN_PATTERNS.filter((p) => p.category === category)
    : DESIGN_PATTERNS;

  const ids = new Set(patterns.map((p) => p.id));

  // Build adjacency list and in-degree map scoped to the filtered set.
  // Only include edges where both source and target are in scope.
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // prereq → who depends on it

  for (const id of ids) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const id of ids) {
    const prereqs = (PATTERN_PREREQUISITES[id] ?? []).filter((p) => ids.has(p));
    inDegree.set(id, prereqs.length);
    for (const prereq of prereqs) {
      dependents.get(prereq)!.push(id);
    }
  }

  // Kahn's algorithm with tier tracking
  const tierMap = new Map<string, number>();
  let queue: string[] = [];

  // Seed with zero in-degree nodes (tier 0)
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      tierMap.set(id, 0);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nextQueue: string[] = [];
    for (const id of queue) {
      sorted.push(id);
      for (const dep of dependents.get(id) ?? []) {
        const newDeg = inDegree.get(dep)! - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) {
          tierMap.set(dep, (tierMap.get(id) ?? 0) + 1);
          nextQueue.push(dep);
        }
      }
    }
    queue = nextQueue;
  }

  // Build PatternNode array in topological order
  const patternMap = new Map(DESIGN_PATTERNS.map((p) => [p.id, p]));

  return sorted.map((id) => {
    const p = patternMap.get(id)!;
    const prereqs = (PATTERN_PREREQUISITES[id] ?? []).filter((pid) =>
      ids.has(pid),
    );
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      difficulty: p.difficulty,
      tier: tierMap.get(id) ?? 0,
      prerequisites: prereqs,
    };
  });
}

/**
 * Get direct prerequisite pattern ids for a given pattern.
 */
export function getPrerequisites(patternId: string): string[] {
  return PATTERN_PREREQUISITES[patternId] ?? [];
}

/**
 * Get prerequisite patterns that the learner hasn't mastered yet.
 *
 * @param patternId — the pattern to check prerequisites for
 * @param masteredIds — set of pattern ids the learner has mastered
 */
export function getUnmetPrerequisites(
  patternId: string,
  masteredIds: Set<string>,
): string[] {
  return getPrerequisites(patternId).filter((id) => !masteredIds.has(id));
}
