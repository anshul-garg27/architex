// ── Internal linking utilities for cross-page SEO links ──────────────
//
// Concept -> related problems (matches concept slug to challenge concepts)
// Pattern -> related LLD problems (matches pattern title to LLD keyPatterns)
// Problem -> related concepts (matches challenge concepts to concept titles)

import { CONCEPTS, type ConceptDefinition } from "./concepts-data";
import { LLD_PROBLEMS, type LLDProblemDefinition } from "./lld-problems-data";
import { CHALLENGES, type ChallengeDefinition } from "@/lib/interview/challenges";

// ── Concept -> Problems mapping ──────────────────────────────────────

/**
 * Given a concept slug, find system design challenges that reference
 * this concept in their `concepts` array.
 */
export function getRelatedProblemsForConcept(
  conceptSlug: string,
  limit = 4,
): ChallengeDefinition[] {
  const concept = CONCEPTS.find((c) => c.slug === conceptSlug);
  if (!concept) return [];

  const titleLower = concept.title.toLowerCase();

  return CHALLENGES.filter((challenge) =>
    challenge.concepts.some(
      (c) =>
        c.toLowerCase().includes(titleLower) ||
        titleLower.includes(c.toLowerCase()),
    ),
  ).slice(0, limit);
}

// ── Pattern -> LLD Problems mapping ──────────────────────────────────

/**
 * Given a design pattern slug, find LLD problems that list this pattern
 * in their `keyPatterns` array.
 */
export function getRelatedLLDProblemsForPattern(
  patternTitle: string,
  limit = 4,
): LLDProblemDefinition[] {
  const titleLower = patternTitle.toLowerCase();

  return LLD_PROBLEMS.filter((problem) =>
    problem.keyPatterns.some(
      (kp) => kp.toLowerCase() === titleLower,
    ),
  ).slice(0, limit);
}

// ── Problem -> Concepts mapping ──────────────────────────────────────

/**
 * Given a challenge id, find system design concepts that match the
 * challenge's `concepts` array by name.
 */
export function getRelatedConceptsForProblem(
  challengeId: string,
  limit = 4,
): ConceptDefinition[] {
  const challenge = CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) return [];

  const matched: ConceptDefinition[] = [];

  for (const conceptName of challenge.concepts) {
    const nameLower = conceptName.toLowerCase();
    const found = CONCEPTS.find(
      (c) =>
        c.title.toLowerCase() === nameLower ||
        nameLower.includes(c.title.toLowerCase()) ||
        c.title.toLowerCase().includes(nameLower),
    );
    if (found && !matched.some((m) => m.slug === found.slug)) {
      matched.push(found);
    }
    if (matched.length >= limit) break;
  }

  return matched;
}
