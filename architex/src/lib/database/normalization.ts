/**
 * Database Design Lab — Normalization Engine (DBL-012 to DBL-014)
 *
 * Provides attribute closure computation, candidate key discovery,
 * normal form determination, and lossless-join 3NF decomposition.
 */

import type { FunctionalDependency } from "./types";

// ── Helpers ───────────────────────────────────────────────────

/** Set equality for string arrays (order-insensitive). */
function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

/** Check if `sub` is a subset of `superset`. */
function isSubset(sub: string[], superset: string[]): boolean {
  const s = new Set(superset);
  return sub.every((x) => s.has(x));
}

/** Check if `sub` is a proper subset of `superset`. */
function isProperSubset(sub: string[], superset: string[]): boolean {
  return isSubset(sub, superset) && sub.length < superset.length;
}

/** Deduplicated union of two arrays. */
function union(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

// ── Attribute Closure ─────────────────────────────────────────

/**
 * Compute the attribute closure of the given attributes under the FDs.
 * Uses a fixed-point algorithm: repeatedly add RHS attributes when LHS
 * is already in the closure, until no new attributes can be added.
 *
 * @param attributes - Starting set of attributes (e.g., ["A", "B"])
 * @param fds - Functional dependencies to apply
 * @returns The closure set (all attributes determinable from the input),
 *   sorted alphabetically
 *
 * @example
 * computeClosure(["A"], [{ lhs: ["A"], rhs: ["B"] }, { lhs: ["B"], rhs: ["C"] }])
 * // returns ["A", "B", "C"]
 */
export function computeClosure(
  attributes: string[],
  fds: FunctionalDependency[],
): string[] {
  let closure = [...new Set(attributes)].sort();
  let changed = true;

  while (changed) {
    changed = false;
    for (const fd of fds) {
      if (isSubset(fd.lhs, closure)) {
        for (const attr of fd.rhs) {
          if (!closure.includes(attr)) {
            closure = union(closure, [attr]);
            changed = true;
          }
        }
      }
    }
  }

  return closure;
}

// ── Candidate Keys ────────────────────────────────────────────

/**
 * Find all candidate keys for a relation given its attributes and FDs.
 * A candidate key is a minimal set of attributes whose closure covers
 * all attributes in the relation.
 *
 * Uses a power-set approach pruned by:
 *  1. Attributes that never appear on the RHS of any FD must be in every key.
 *  2. Start from that mandatory core and expand outward.
 *  3. Falls back to a greedy heuristic when remaining attributes exceed 15.
 *
 * @param attributes - All attributes in the relation (e.g., ["A", "B", "C", "D"])
 * @param fds - Functional dependencies defined on the relation
 * @returns Array of candidate keys, each key being a sorted string array.
 *   For example, [["A", "B"], ["C"]] means {A,B} and {C} are both candidate keys.
 *
 * @example
 * findCandidateKeys(["A", "B", "C"], [{ lhs: ["A"], rhs: ["B", "C"] }])
 * // returns [["A"]]
 */
export function findCandidateKeys(
  attributes: string[],
  fds: FunctionalDependency[],
): string[][] {
  const allAttrs = [...new Set(attributes)].sort();
  const rhsAttrs = new Set(fds.flatMap((fd) => fd.rhs));

  // Attributes that MUST be in every key (never determined by any FD)
  const mustInclude = allAttrs.filter((a) => !rhsAttrs.has(a));

  // If the mandatory core already determines everything, that is the only key
  const mustClosure = computeClosure(mustInclude, fds);
  if (setsEqual(mustClosure, allAttrs)) {
    return [mustInclude.sort()];
  }

  // Remaining attributes to consider adding
  const remaining = allAttrs.filter((a) => !mustInclude.includes(a));

  // Guard: 2^16 = 65536 subsets is manageable, but 2^16+ is too many.
  // With >15 remaining attributes, fall back to a greedy heuristic.
  if (remaining.length > 15) {
    // Greedy heuristic: try adding one attribute at a time to the must-include core,
    // picking the attribute that expands the closure the most, until we have a superkey.
    // This produces one candidate key (possibly not all of them).
    const greedyKey = [...mustInclude];
    const unused = [...remaining];

    while (true) {
      const closure = computeClosure(greedyKey, fds);
      if (setsEqual(closure, allAttrs)) break;

      // Pick the attribute that maximizes closure expansion
      let bestAttr = "";
      let bestSize = 0;
      for (const attr of unused) {
        const trial = computeClosure([...greedyKey, attr], fds);
        if (trial.length > bestSize) {
          bestSize = trial.length;
          bestAttr = attr;
        }
      }

      if (bestAttr === "") {
        // Safety: add all remaining if greedy gets stuck
        greedyKey.push(...unused);
        break;
      }

      greedyKey.push(bestAttr);
      unused.splice(unused.indexOf(bestAttr), 1);
    }

    // Minimize the greedy key: try removing each non-must-include attribute
    const minimalKey = [...greedyKey].sort();
    for (let i = minimalKey.length - 1; i >= 0; i--) {
      if (mustInclude.includes(minimalKey[i])) continue;
      const reduced = [...minimalKey.slice(0, i), ...minimalKey.slice(i + 1)];
      const closure = computeClosure(reduced, fds);
      if (setsEqual(closure, allAttrs)) {
        minimalKey.splice(i, 1);
      }
    }

    return [minimalKey];
  }

  const candidates: string[][] = [];

  // Try subsets of `remaining` in order of increasing size
  const limit = 1 << remaining.length;
  for (let mask = 0; mask < limit; mask++) {
    const subset: string[] = [];
    for (let i = 0; i < remaining.length; i++) {
      if (mask & (1 << i)) {
        subset.push(remaining[i]);
      }
    }
    const candidate = union(mustInclude, subset);

    // Prune: skip if a superset of an already-found key
    if (candidates.some((ck) => isSubset(ck, candidate) && ck.length < candidate.length)) {
      continue;
    }

    const closure = computeClosure(candidate, fds);
    if (setsEqual(closure, allAttrs)) {
      // Make sure no proper subset was already found as a key
      if (!candidates.some((ck) => isSubset(ck, candidate))) {
        candidates.push(candidate.sort());
      }
    }
  }

  return candidates;
}

// ── Normal Form Detection ─────────────────────────────────────

/**
 * Determine the highest normal form (1NF through BCNF) satisfied by
 * a relation. Checks BCNF first, then 3NF, then 2NF, returning the
 * strongest form that holds. Assumes atomic attributes (1NF baseline).
 *
 * @param attributes - All attributes in the relation
 * @param fds - Functional dependencies defined on the relation
 * @param candidateKeys - Pre-computed candidate keys (from {@link findCandidateKeys})
 * @returns The highest normal form: "BCNF", "3NF", "2NF", or "1NF"
 *
 * @example
 * determineNormalForm(
 *   ["A", "B", "C"],
 *   [{ lhs: ["A"], rhs: ["B", "C"] }],
 *   [["A"]],
 * )
 * // returns "BCNF"
 */
export function determineNormalForm(
  attributes: string[],
  fds: FunctionalDependency[],
  candidateKeys: string[][],
): "1NF" | "2NF" | "3NF" | "BCNF" {
  const allAttrs = new Set(attributes);

  // All prime attributes (attributes that belong to at least one candidate key)
  const primeAttrs = new Set(candidateKeys.flat());

  // ── Check BCNF ──────────────────────────────────────────────
  // Every non-trivial FD X -> Y must have X as a superkey.
  let isBCNF = true;
  for (const fd of fds) {
    // Skip trivial FDs (rhs subset of lhs)
    const nonTrivialRhs = fd.rhs.filter((a) => !fd.lhs.includes(a));
    if (nonTrivialRhs.length === 0) continue;

    const closure = computeClosure(fd.lhs, fds);
    if (!setsEqual(closure, [...allAttrs])) {
      isBCNF = false;
      break;
    }
  }
  if (isBCNF) return "BCNF";

  // ── Check 3NF ───────────────────────────────────────────────
  // For every non-trivial FD X -> A, either X is a superkey
  // or A is a prime attribute.
  let is3NF = true;
  for (const fd of fds) {
    const nonTrivialRhs = fd.rhs.filter((a) => !fd.lhs.includes(a));
    if (nonTrivialRhs.length === 0) continue;

    const closure = computeClosure(fd.lhs, fds);
    const isSuperkey = setsEqual(closure, [...allAttrs]);
    if (!isSuperkey) {
      for (const a of nonTrivialRhs) {
        if (!primeAttrs.has(a)) {
          is3NF = false;
          break;
        }
      }
    }
    if (!is3NF) break;
  }
  if (is3NF) return "3NF";

  // ── Check 2NF ───────────────────────────────────────────────
  // No non-prime attribute is functionally dependent on a proper
  // subset of any candidate key.
  let is2NF = true;
  outer: for (const fd of fds) {
    const nonTrivialRhs = fd.rhs.filter((a) => !fd.lhs.includes(a));
    if (nonTrivialRhs.length === 0) continue;

    // Only check if LHS is a proper subset of some candidate key
    for (const ck of candidateKeys) {
      if (isProperSubset(fd.lhs, ck)) {
        // If any non-trivial RHS attribute is non-prime, 2NF violated
        for (const a of nonTrivialRhs) {
          if (!primeAttrs.has(a)) {
            is2NF = false;
            break outer;
          }
        }
      }
    }
  }
  if (is2NF) return "2NF";

  return "1NF";
}

// ── 3NF Decomposition ─────────────────────────────────────────

/**
 * Decompose a relation into Third Normal Form (3NF) using the
 * lossless-join, dependency-preserving synthesis algorithm:
 *  1. Compute a minimal cover of the FDs.
 *  2. Group FDs by their LHS.
 *  3. Create one sub-relation per group (LHS + RHS attributes).
 *  4. If no resulting relation contains a candidate key, add one.
 *
 * @param attributes - All attributes in the original relation
 * @param fds - Functional dependencies defined on the relation
 * @returns Array of decomposed relations, each with a generated name
 *   (R1, R2, ...), its attributes, and the FDs that apply within it
 */
export function decomposeTo3NF(
  attributes: string[],
  fds: FunctionalDependency[],
): Array<{ name: string; attributes: string[]; fds: FunctionalDependency[] }> {
  // Step 1: Compute minimal cover (simplified: merge same-LHS, remove redundant)
  const minCover = computeMinimalCover(fds);

  // Step 2: Group by LHS
  const groups = new Map<string, { lhs: string[]; rhs: string[] }>();
  for (const fd of minCover) {
    const key = fd.lhs.slice().sort().join(",");
    const existing = groups.get(key);
    if (existing) {
      existing.rhs = union(existing.rhs, fd.rhs);
    } else {
      groups.set(key, { lhs: [...fd.lhs], rhs: [...fd.rhs] });
    }
  }

  // Step 3: Build relations
  const result: Array<{
    name: string;
    attributes: string[];
    fds: FunctionalDependency[];
  }> = [];
  let idx = 1;
  for (const [, group] of groups) {
    const relAttrs = union(group.lhs, group.rhs);
    const relFds = minCover.filter(
      (fd) =>
        isSubset(fd.lhs, relAttrs) && isSubset(fd.rhs, relAttrs),
    );
    result.push({
      name: `R${idx}`,
      attributes: relAttrs,
      fds: relFds,
    });
    idx++;
  }

  // Step 4: Ensure at least one relation contains a candidate key
  const allCandidateKeys = findCandidateKeys(attributes, fds);
  const hasKey = result.some((rel) =>
    allCandidateKeys.some((ck) => isSubset(ck, rel.attributes)),
  );

  if (!hasKey && allCandidateKeys.length > 0) {
    const ck = allCandidateKeys[0];
    result.push({
      name: `R${idx}`,
      attributes: ck.sort(),
      fds: [],
    });
  }

  return result;
}

// ── BCNF Decomposition ───────────────────────────────────────

/**
 * Decompose a relation into Boyce-Codd Normal Form (BCNF) using
 * the standard recursive algorithm (Silberschatz Ch7 / CLRS-style).
 *
 * For each violating FD X -> Y (where X is not a superkey), split
 * into R1 = X union Y and R2 = R minus (Y minus X), then recurse.
 * Guarantees lossless-join but may NOT preserve all functional
 * dependencies (unlike 3NF synthesis).
 *
 * @param attributes - All attributes in the original relation
 * @param fds - Functional dependencies defined on the relation
 * @returns Array of BCNF-compliant sub-relations with names, attributes,
 *   and projected FDs. Duplicate relations are removed.
 */
export function decomposeToBCNF(
  attributes: string[],
  fds: FunctionalDependency[],
): Array<{ name: string; attributes: string[]; fds: FunctionalDependency[] }> {
  const allAttrs = [...new Set(attributes)].sort();

  // Project FDs onto a subset of attributes:
  // For each FD X → Y where X ⊆ subset, compute X+ under
  // the original FDs, intersect with subset, and produce
  // singleton FDs for the non-trivial results.
  function projectFDs(
    subset: string[],
    originalFDs: FunctionalDependency[],
  ): FunctionalDependency[] {
    const subsetSet = new Set(subset);
    const projected: FunctionalDependency[] = [];
    const seen = new Set<string>();

    // For every subset of `subset` as a potential LHS, compute closure
    // and generate projected FDs. For efficiency, only consider
    // LHS sets that appear as LHS of some original FD (or subsets thereof).
    // A practical approach: iterate original FD LHSs that are within subset.
    for (const fd of originalFDs) {
      if (!isSubset(fd.lhs, subset)) continue;
      const closure = computeClosure(fd.lhs, originalFDs);
      const projectedRhs = closure.filter(
        (a) => subsetSet.has(a) && !fd.lhs.includes(a),
      );
      for (const attr of projectedRhs) {
        const key = `${fd.lhs.slice().sort().join(",")}->${attr}`;
        if (!seen.has(key)) {
          seen.add(key);
          projected.push({ lhs: [...fd.lhs], rhs: [attr] });
        }
      }
    }

    return projected;
  }

  // Recursive decomposition
  function decompose(
    relAttrs: string[],
    relFDs: FunctionalDependency[],
  ): string[][] {
    const sortedAttrs = [...new Set(relAttrs)].sort();

    // Find a violating FD: X → Y where X is not a superkey
    for (const fd of relFDs) {
      const nonTrivialRhs = fd.rhs.filter((a) => !fd.lhs.includes(a));
      if (nonTrivialRhs.length === 0) continue;

      const closure = computeClosure(fd.lhs, relFDs);
      const isSuperkey = setsEqual(
        closure.filter((a) => sortedAttrs.includes(a)),
        sortedAttrs,
      );

      if (!isSuperkey) {
        // Decompose: R1 = X ∪ Y, R2 = R − (Y − X)
        const r1Attrs = union(fd.lhs, nonTrivialRhs);
        const yMinusX = nonTrivialRhs.filter((a) => !fd.lhs.includes(a));
        const r2Attrs = sortedAttrs.filter((a) => !yMinusX.includes(a));

        const r1FDs = projectFDs(r1Attrs, fds);
        const r2FDs = projectFDs(r2Attrs, fds);

        // Recurse on both sub-relations
        return [...decompose(r1Attrs, r1FDs), ...decompose(r2Attrs, r2FDs)];
      }
    }

    // No violation found — this relation is in BCNF
    return [sortedAttrs];
  }

  // Run decomposition
  const projectedFDs = projectFDs(allAttrs, fds);
  const decomposed = decompose(allAttrs, projectedFDs);

  // Remove duplicate relations
  const seen = new Set<string>();
  const unique: string[][] = [];
  for (const rel of decomposed) {
    const key = rel.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rel);
    }
  }

  // Build result with names and projected FDs for each relation
  return unique.map((relAttrs, idx) => {
    const relFDs = projectFDs(relAttrs, fds);
    return {
      name: `R${idx + 1}`,
      attributes: relAttrs,
      fds: relFDs,
    };
  });
}

// ── Minimal Cover (helper) ────────────────────────────────────

function computeMinimalCover(
  fds: FunctionalDependency[],
): FunctionalDependency[] {
  // 1. Decompose RHS to singletons
  let cover: FunctionalDependency[] = [];
  for (const fd of fds) {
    for (const a of fd.rhs) {
      cover.push({ lhs: [...fd.lhs], rhs: [a] });
    }
  }

  // 2. Remove extraneous LHS attributes
  for (let i = 0; i < cover.length; i++) {
    const fd = cover[i];
    for (let j = 0; j < fd.lhs.length; j++) {
      if (fd.lhs.length <= 1) break;
      const reduced = [...fd.lhs.slice(0, j), ...fd.lhs.slice(j + 1)];
      const otherFds = [...cover.slice(0, i), { lhs: reduced, rhs: fd.rhs }, ...cover.slice(i + 1)];
      const closure = computeClosure(reduced, otherFds);
      if (closure.includes(fd.rhs[0])) {
        fd.lhs = reduced;
        j--; // re-check position
      }
    }
  }

  // 3. Remove redundant FDs
  const result: FunctionalDependency[] = [];
  for (let i = 0; i < cover.length; i++) {
    const remaining = [...result, ...cover.slice(i + 1)];
    const closure = computeClosure(cover[i].lhs, remaining);
    if (!closure.includes(cover[i].rhs[0])) {
      result.push(cover[i]);
    }
  }

  return result;
}
