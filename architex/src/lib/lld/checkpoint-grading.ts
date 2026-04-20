/**
 * Pure grading engine for Learn-mode checkpoints.
 *
 * Every grader returns { correct, points, maxPoints, … } plus type-specific
 * diagnostic fields (missing / extra / wrongStatements / etc.) so the UI
 * can render actionable feedback.
 *
 * FSRS rating mapping (Phase 3 will read this):
 *   attempts=1, correct          → "easy"   (4)
 *   attempts=2, correct          → "good"   (3)
 *   attempts=3, correct          → "hard"   (2)
 *   attempts=3, still wrong      → "again"  (1)
 */

import type {
  ApplyCheckpoint,
  CompareCheckpoint,
  CreateCheckpoint,
  RecallCheckpoint,
} from "./lesson-types";

export type FsrsRating = "again" | "hard" | "good" | "easy";

export interface BaseGrade {
  correct: boolean;
  points: number;
  maxPoints: number;
}

export function deriveFsrsRating(
  attempts: number,
  correct: boolean,
): FsrsRating {
  if (!correct) return "again";
  if (attempts <= 1) return "easy";
  if (attempts === 2) return "good";
  return "hard";
}

// ── Recall ────────────────────────────────────────────────────

export interface RecallGrade extends BaseGrade {
  pickedId: string | null;
}

export function gradeRecallCheckpoint(
  checkpoint: RecallCheckpoint,
  pickedId: string | null,
): RecallGrade {
  const picked = checkpoint.options.find((o) => o.id === pickedId);
  const correct = !!picked?.isCorrect;
  return {
    correct,
    points: correct ? 1 : 0,
    maxPoints: 1,
    pickedId,
  };
}

// ── Apply ─────────────────────────────────────────────────────

export interface ApplyGrade extends BaseGrade {
  missing: string[];
  extra: string[];
}

export function gradeApplyCheckpoint(
  checkpoint: ApplyCheckpoint,
  selected: Set<string> | string[],
): ApplyGrade {
  const chosen =
    selected instanceof Set ? selected : new Set<string>(selected);
  const correctSet = new Set(checkpoint.correctClassIds);

  const missing = checkpoint.correctClassIds.filter((id) => !chosen.has(id));
  const extra = Array.from(chosen).filter((id) => !correctSet.has(id));

  const correct = missing.length === 0 && extra.length === 0;
  return {
    correct,
    points: correct ? checkpoint.correctClassIds.length : Math.max(
      0,
      checkpoint.correctClassIds.length - missing.length - extra.length,
    ),
    maxPoints: checkpoint.correctClassIds.length,
    missing,
    extra,
  };
}

// ── Compare ───────────────────────────────────────────────────

export interface CompareGrade extends BaseGrade {
  wrongStatementIds: string[];
}

export function gradeCompareCheckpoint(
  checkpoint: CompareCheckpoint,
  picks: Record<string, "left" | "right" | "both" | undefined>,
): CompareGrade {
  const wrong: string[] = [];
  let points = 0;
  for (const s of checkpoint.statements) {
    if (picks[s.id] === s.correct) {
      points++;
    } else {
      wrong.push(s.id);
    }
  }
  return {
    correct: wrong.length === 0 && checkpoint.statements.length > 0,
    points,
    maxPoints: checkpoint.statements.length,
    wrongStatementIds: wrong,
  };
}

// ── Create ────────────────────────────────────────────────────

export interface CreateGrade extends BaseGrade {
  matchedNames: string[];
  missingNames: string[];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function gradeCreateCheckpoint(
  checkpoint: CreateCheckpoint,
  userClassNames: string[],
): CreateGrade {
  const userNorm = new Set(userClassNames.map(normalize).filter(Boolean));
  const refNames = checkpoint.referenceSolution.classes.map((c) => c.name);
  const refNorm = refNames.map(normalize);

  const matched: string[] = [];
  const missing: string[] = [];
  for (let i = 0; i < refNorm.length; i++) {
    if (userNorm.has(refNorm[i])) matched.push(refNames[i]);
    else missing.push(refNames[i]);
  }

  const maxPoints = checkpoint.rubric.reduce((sum, r) => sum + r.points, 0) ||
    refNames.length;
  // Simple scoring: proportional to matched/total.
  const ratio = refNames.length === 0 ? 0 : matched.length / refNames.length;
  const points = Math.round(ratio * maxPoints);

  return {
    correct: missing.length === 0 && matched.length > 0,
    points,
    maxPoints,
    matchedNames: matched,
    missingNames: missing,
  };
}
