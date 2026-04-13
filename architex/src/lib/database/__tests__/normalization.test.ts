import { describe, it, expect } from 'vitest';
import {
  computeClosure,
  findCandidateKeys,
  determineNormalForm,
  decomposeTo3NF,
} from '../normalization';
import type { FunctionalDependency } from '../types';

// ── Normalization Engine Tests ────────────────────────────────

describe('computeClosure', () => {
  it('computes basic transitive closure: {A} with A→B, B→C → {A,B,C}', () => {
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B'] },
      { lhs: ['B'], rhs: ['C'] },
    ];

    const closure = computeClosure(['A'], fds);

    expect(closure).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    expect(closure).toHaveLength(3);
  });

  it('returns just the input attributes when no FDs apply', () => {
    const fds: FunctionalDependency[] = [
      { lhs: ['X'], rhs: ['Y'] },
    ];

    const closure = computeClosure(['A'], fds);
    expect(closure).toEqual(['A']);
  });

  it('handles empty attribute set', () => {
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B'] },
    ];

    const closure = computeClosure([], fds);
    expect(closure).toEqual([]);
  });
});

describe('findCandidateKeys', () => {
  it('finds correct candidate keys for StudentCourse example', () => {
    // Relation: StudentCourse(Student, Course, Grade)
    // FDs: {Student, Course} → Grade
    const attrs = ['Student', 'Course', 'Grade'];
    const fds: FunctionalDependency[] = [
      { lhs: ['Student', 'Course'], rhs: ['Grade'] },
    ];

    const keys = findCandidateKeys(attrs, fds);

    expect(keys).toHaveLength(1);
    expect(keys[0].sort()).toEqual(['Course', 'Student']);
  });

  it('finds multiple candidate keys when they exist', () => {
    // R(A, B, C) with A→B and B→A (A and B are interchangeable)
    // Plus we need A or B to determine C: A→C
    const attrs = ['A', 'B', 'C'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B', 'C'] },
      { lhs: ['B'], rhs: ['A', 'C'] },
    ];

    const keys = findCandidateKeys(attrs, fds);

    // Both {A} and {B} are candidate keys
    expect(keys).toHaveLength(2);
    const keyStrs = keys.map((k) => k.join(','));
    expect(keyStrs).toContain('A');
    expect(keyStrs).toContain('B');
  });
});

describe('determineNormalForm', () => {
  it('returns "1NF" for a relation in 1NF only', () => {
    // R(A, B, C) with key {A, B} and partial dependency B→C
    const attrs = ['A', 'B', 'C'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['B'], rhs: ['C'] }, // partial dependency: B is a proper subset of key {A,B}
    ];
    const keys = [['A', 'B']];

    const nf = determineNormalForm(attrs, fds, keys);
    expect(nf).toBe('1NF');
  });

  it('returns "3NF" for a relation in 3NF but not BCNF', () => {
    // Classic 3NF-not-BCNF example:
    // R(A, B, C) with FDs: AB→C, C→B
    // Candidate keys: {A, B} and {A, C}
    // C→B: C is not a superkey, but B is prime (part of key {A,B}) → 3NF holds
    // C→B: C is not a superkey → BCNF fails
    const attrs = ['A', 'B', 'C'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] },
    ];
    const keys = findCandidateKeys(attrs, fds);

    const nf = determineNormalForm(attrs, fds, keys);
    expect(nf).toBe('3NF');
  });

  it('returns "BCNF" for a BCNF relation', () => {
    // R(A, B, C) with A→B, A→C; key is {A}
    const attrs = ['A', 'B', 'C'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B'] },
      { lhs: ['A'], rhs: ['C'] },
    ];
    const keys = [['A']];

    const nf = determineNormalForm(attrs, fds, keys);
    expect(nf).toBe('BCNF');
  });
});

describe('decomposeTo3NF', () => {
  it('produces a lossless decomposition', () => {
    // R(A, B, C, D) with A→B, B→C
    // Candidate key: {A, D}
    const attrs = ['A', 'B', 'C', 'D'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B'] },
      { lhs: ['B'], rhs: ['C'] },
    ];

    const decomposition = decomposeTo3NF(attrs, fds);

    // Should produce at least 2 relations
    expect(decomposition.length).toBeGreaterThanOrEqual(2);

    // Every original attribute should appear in at least one sub-relation
    const allDecompAttrs = new Set(decomposition.flatMap((r) => r.attributes));
    for (const attr of attrs) {
      expect(allDecompAttrs.has(attr)).toBe(true);
    }

    // At least one relation should contain a candidate key
    const candidateKeys = findCandidateKeys(attrs, fds);
    const hasKey = decomposition.some((rel) =>
      candidateKeys.some((ck) =>
        ck.every((a) => rel.attributes.includes(a)),
      ),
    );
    expect(hasKey).toBe(true);
  });

  it('produces relations with meaningful names', () => {
    const attrs = ['A', 'B', 'C'];
    const fds: FunctionalDependency[] = [
      { lhs: ['A'], rhs: ['B', 'C'] },
    ];

    const decomposition = decomposeTo3NF(attrs, fds);

    for (const rel of decomposition) {
      expect(rel.name).toMatch(/^R\d+$/);
    }
  });
});
