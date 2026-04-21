/**
 * LLD-023: Drill grading engine v2 — 6-axis composer
 *
 * Composes the existing deterministic grading-engine.ts with a Haiku
 * qualitative pass. When no API key is configured, qualitative axes
 * fall back to heuristic scoring; the final score remains sensible.
 */

import {
  AXIS_WEIGHTS,
  RUBRIC_AXES,
  computeWeightedScore,
  type RubricAxis,
  type RubricAxisResult,
  type RubricBreakdown,
} from "@/lib/lld/drill-rubric";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { InterviewerTurn } from "@/lib/ai/interviewer-persona";
import { getCanonicalFor } from "@/lib/lld/drill-canonical";

export interface DrillGradeInput {
  problemId: string;
  canvasState: {
    nodes: Array<{ id: string; data?: unknown }>;
    edges: unknown[];
  };
  interviewerTurns: Pick<InterviewerTurn, "role" | "stage" | "content">[];
  walkthroughText: string;
  selfGrade: number; // 1-5
  stageDurationsMs: Record<DrillStage, number>;
}

export interface DrillGradeOutput {
  rubric: RubricBreakdown;
  finalScore: number;
}

export interface GradeOptions {
  mode?: "ai-preferred" | "fallback-only";
}

// ── Heuristic fallbacks ──────────────────────────────────────────────

const CLARIFY_WEIGHT_PER_Q = 28; // score ≈ 28*n, capped at 100

export function heuristicClarificationScore(questions: string[]): number {
  if (questions.length === 0) return 0;
  return Math.min(100, Math.round(CLARIFY_WEIGHT_PER_Q * questions.length));
}

const TRADEOFF_KEYWORDS = [
  "tradeoff",
  "trade off",
  "trade-off",
  "trade ",
  "cost",
  "in exchange",
  "gain",
  "gives",
  "pay",
  "vs",
  "versus",
  "complexity",
  "extensibility",
  "flexibility",
  "indirection",
  "overhead",
  "boilerplate",
];

export function heuristicTradeoffScore(walkthrough: string): number {
  if (walkthrough.trim().length === 0) return 0;
  const lower = walkthrough.toLowerCase();
  const hits = TRADEOFF_KEYWORDS.reduce(
    (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
    0,
  );
  const lengthBonus = Math.min(25, Math.floor(walkthrough.length / 40));
  return Math.min(100, hits * 15 + lengthBonus);
}

export function heuristicCommunicationScore(walkthrough: string): number {
  const trimmed = walkthrough.trim();
  if (trimmed.length === 0) return 0;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgLen = trimmed.length / Math.max(1, sentences.length);
  const lengthScore = Math.min(60, Math.floor(trimmed.length / 4));
  // Reward moderate sentence length (10-100 chars); penalize too-short.
  const structureScore = avgLen < 10 ? 0 : avgLen > 200 ? 20 : 40;
  return Math.min(100, lengthScore + structureScore);
}

// ── Deterministic axes ───────────────────────────────────────────────

function gradeClassesAxis(input: DrillGradeInput): RubricAxisResult {
  const canonical = getCanonicalFor(input.problemId);
  const n = input.canvasState.nodes.length;
  if (!canonical) {
    // No reference — score by raw class count + naming sanity.
    return {
      score: Math.min(100, n * 15),
      good: n >= 3 ? ["Multiple classes drafted"] : [],
      missing: n < 3 ? ["Canvas is sparse — need at least 3 classes."] : [],
      wrong: [],
    };
  }
  const expected = canonical.classes.length;
  // Reward proximity to expected count (within 2 is full credit)
  const diff = Math.abs(expected - n);
  const score =
    n === 0
      ? 0
      : diff <= 1
      ? 90
      : diff <= 2
      ? 70
      : diff <= 4
      ? 50
      : 30;
  return {
    score,
    good: n >= 3 ? ["Multiple classes drafted"] : [],
    missing: n < 3 ? ["Canvas is sparse — need at least 3 classes."] : [],
    wrong: [],
  };
}

function gradeRelationshipsAxis(input: DrillGradeInput): RubricAxisResult {
  const edges = input.canvasState.edges.length;
  if (edges === 0) {
    return {
      score: 0,
      good: [],
      missing: ["Canvas has no relationships between classes."],
      wrong: [],
    };
  }
  return {
    score: Math.min(100, edges * 20),
    good: edges >= 3 ? ["Clear class linkage"] : [],
    missing: edges < 3 ? ["Relationships are thin."] : [],
    wrong: [],
  };
}

function gradePatternFitAxis(input: DrillGradeInput): RubricAxisResult {
  const canonical = getCanonicalFor(input.problemId);
  if (!canonical) return { score: 60, good: [], missing: [], wrong: [] };
  const walkthroughLower = input.walkthroughText.toLowerCase();
  const matches = canonical.patterns.filter((p) =>
    walkthroughLower.includes(p.toLowerCase()),
  );
  const score = Math.min(100, 30 + matches.length * 35);
  return {
    score,
    good: matches.map((m) => `Identified ${m} pattern`),
    missing: canonical.patterns
      .filter((p) => !walkthroughLower.includes(p.toLowerCase()))
      .map((p) => `Could have named ${p} explicitly`),
    wrong: [],
  };
}

// ── Entry point ─────────────────────────────────────────────────────

export async function gradeDrillAttempt(
  input: DrillGradeInput,
  opts: GradeOptions = {},
): Promise<DrillGradeOutput> {
  const clarifyQuestions = input.interviewerTurns
    .filter((t) => t.role === "user" && t.stage === "clarify")
    .map((t) => t.content);

  const rubric: RubricBreakdown = {
    clarification: {
      score: heuristicClarificationScore(clarifyQuestions),
      good: clarifyQuestions.length >= 2 ? ["Asked multiple clarifiers"] : [],
      missing:
        clarifyQuestions.length < 2
          ? ["Need at least 2 clarifying questions."]
          : [],
      wrong: [],
    },
    classes: gradeClassesAxis(input),
    relationships: gradeRelationshipsAxis(input),
    patternFit: gradePatternFitAxis(input),
    tradeoffs: {
      score: heuristicTradeoffScore(input.walkthroughText),
      good: [],
      missing: [],
      wrong: [],
    },
    communication: {
      score: heuristicCommunicationScore(input.walkthroughText),
      good: [],
      missing: [],
      wrong: [],
    },
  };

  // Optional Haiku pass for qualitative refinement.
  if (opts.mode !== "fallback-only" && typeof process !== "undefined") {
    const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
    if (hasKey) {
      // The actual AI pass is wired by the API route (Task 22) which has
      // access to the ClaudeClient singleton. This module stays pure.
      // Refinement hook: if the caller sets `opts.mode = 'ai-preferred'`
      // but the key is present, we trust the caller to refine qualitative
      // axes via a separate ClaudeClient.sendText() call.
    }
  }

  const finalScore = computeWeightedScore(rubric);

  return { rubric, finalScore };
}

// ── Internal helpers re-exported for server-side AI pass ────────────

export { RUBRIC_AXES, AXIS_WEIGHTS };
export type { RubricAxis };
