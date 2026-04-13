// ── AI evaluation response parser ───────────────────────────────────
//
// Parses the JSON response from the AI model into a typed evaluation
// object. Handles malformed responses gracefully.

import { SCORING_DIMENSIONS } from '@/lib/interview/scoring';

// ── Types ───────────────────────────────────────────────────────────

export interface AIEvaluation {
  /** Per-dimension scores (1-10), keyed by dimension id */
  scores: Record<string, number>;
  /** Specific observations about the architecture */
  feedback: string[];
  /** Concrete strengths identified */
  strengths: string[];
  /** Actionable improvement suggestions */
  improvements: string[];
  /** Follow-up questions to probe deeper understanding */
  followUpQuestions: string[];
}

export interface ParseError {
  error: string;
}

// ── Validation helpers ──────────────────────────────────────────────

const DIMENSION_IDS = new Set(SCORING_DIMENSIONS.map((d) => d.id));

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function clampScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(1, Math.min(10, Math.round(value)));
}

/**
 * Attempt to extract a JSON object from a response string.
 * Handles responses wrapped in markdown code fences or with
 * leading/trailing text.
 */
function extractJSON(raw: string): string {
  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Find the first { and last } to extract the JSON body
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  // Return as-is and let JSON.parse handle the error
  return raw.trim();
}

// ── Main parser ─────────────────────────────────────────────────────

/**
 * Parse an AI model response string into a validated AIEvaluation.
 *
 * Returns the evaluation on success, or a `{ error: string }` on failure.
 * Gracefully handles:
 * - Markdown-fenced JSON
 * - Leading/trailing text around JSON
 * - Missing or extra fields
 * - Out-of-range scores
 */
export function parseEvaluationResponse(
  response: string,
): AIEvaluation | ParseError {
  if (!response || typeof response !== 'string') {
    return { error: 'Empty or non-string response received.' };
  }

  let parsed: unknown;
  try {
    const jsonStr = extractJSON(response);
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    return {
      error: `Failed to parse JSON from AI response: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: 'AI response is not a JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;

  // ── Validate scores ───────────────────────────────────────────
  if (typeof obj.scores !== 'object' || obj.scores === null || Array.isArray(obj.scores)) {
    return { error: 'Missing or invalid "scores" object in AI response.' };
  }

  const rawScores = obj.scores as Record<string, unknown>;
  const scores: Record<string, number> = {};
  const missingDimensions: string[] = [];

  for (const dimId of DIMENSION_IDS) {
    const clamped = clampScore(rawScores[dimId]);
    if (clamped === null) {
      missingDimensions.push(dimId);
    } else {
      scores[dimId] = clamped;
    }
  }

  // Require at least half the dimensions to have valid scores
  if (Object.keys(scores).length < Math.ceil(DIMENSION_IDS.size / 2)) {
    return {
      error: `Too many missing or invalid dimension scores. Missing: ${missingDimensions.join(', ')}.`,
    };
  }

  // Fill missing dimensions with a neutral score of 5
  for (const dim of missingDimensions) {
    scores[dim] = 5;
  }

  // ── Validate string arrays ────────────────────────────────────
  const feedback = isStringArray(obj.feedback) ? obj.feedback : [];
  const strengths = isStringArray(obj.strengths) ? obj.strengths : [];
  const improvements = isStringArray(obj.improvements) ? obj.improvements : [];
  const followUpQuestions = isStringArray(obj.followUpQuestions)
    ? obj.followUpQuestions
    : [];

  return {
    scores,
    feedback,
    strengths,
    improvements,
    followUpQuestions,
  };
}
