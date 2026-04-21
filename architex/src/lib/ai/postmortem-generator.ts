/**
 * AI-014: Drill postmortem generator
 *
 * One Sonnet call after drill submission. Produces a strict-JSON
 * postmortem that the UI splits into sections: TL;DR, strengths, gaps,
 * pattern commentary, tradeoff analysis, canonical diff, follow-ups.
 */

import type { RubricBreakdown } from "@/lib/lld/drill-rubric";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { DrillVariant } from "@/lib/lld/drill-variants";
import type { InterviewerPersona } from "@/lib/ai/interviewer-prompts";

export interface PostmortemInput {
  problemId: string;
  problemTitle: string;
  variant: DrillVariant;
  persona: InterviewerPersona;
  rubric: RubricBreakdown;
  finalScore: number; // 0-100
  stageDurationsMs: Record<DrillStage, number>;
  canvasSummary: string;
  canonical: {
    patternsExpected: string[];
    keyTradeoffs: string[];
  } | null;
}

export interface PostmortemOutput {
  tldr: string;
  strengths: string[];
  gaps: string[];
  patternCommentary: string;
  tradeoffAnalysis: string;
  canonicalDiff: string[];
  followUps: string[];
}

export interface PostmortemRequest {
  model: "claude-sonnet-4-20250514";
  system: string;
  user: string;
  maxTokens: number;
}

export class PostmortemParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostmortemParseError";
  }
}

const SYSTEM_PROMPT = `
You are a senior engineer writing a post-drill review for a candidate who
just finished a timed LLD (low-level design) whiteboard interview.

Your writing principles:
- Direct, humane, specific. No padding.
- Highlight strengths honestly. Don't damn with faint praise.
- Name 1-3 specific gaps. Give concrete "next time, do X" advice.
- Never lecture. Never repeat the rubric mechanically.

Output STRICT JSON with this shape:

{
  "tldr": "<=220 chars, one sentence",
  "strengths": ["<=3 bullets, each <=120 chars"],
  "gaps": ["<=3 bullets, each <=160 chars"],
  "patternCommentary": "<=240 chars, one short paragraph",
  "tradeoffAnalysis": "<=240 chars, one short paragraph",
  "canonicalDiff": ["<=4 bullets"],
  "followUps": ["<=3 bullets"]
}

No prose outside the JSON.
`.trim();

export function buildPostmortemPrompt(
  input: PostmortemInput,
): PostmortemRequest {
  const rubricLines = Object.entries(input.rubric)
    .map(([axis, result]) => `  - ${axis}: ${result.score}/100`)
    .join("\n");

  const timingLines = Object.entries(input.stageDurationsMs)
    .map(([stage, ms]) => `  - ${stage}: ${Math.round(ms / 1000)}s`)
    .join("\n");

  const canonicalBlock = input.canonical
    ? `Canonical reference expected patterns: ${input.canonical.patternsExpected.join(
        ", ",
      )}.
Canonical key tradeoffs:\n${input.canonical.keyTradeoffs
        .map((t) => `  - ${t}`)
        .join("\n")}`
    : "No canonical reference solution available for this problem.";

  const user = `
Problem: "${input.problemTitle}" (id: ${input.problemId})
Variant: ${input.variant}
Interviewer persona: ${input.persona}
Final score: ${input.finalScore}/100

6-axis rubric breakdown:
${rubricLines}

Per-stage time spent:
${timingLines}

Canvas summary at submit: ${input.canvasSummary}

${canonicalBlock}

Write the postmortem as STRICT JSON.
`.trim();

  return {
    model: "claude-sonnet-4-20250514",
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 900,
  };
}

const REQUIRED_KEYS: (keyof PostmortemOutput)[] = [
  "tldr",
  "strengths",
  "gaps",
  "patternCommentary",
  "tradeoffAnalysis",
  "canonicalDiff",
  "followUps",
];

function stripFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const firstNewline = trimmed.indexOf("\n");
    const last = trimmed.lastIndexOf("```");
    if (firstNewline !== -1 && last > firstNewline) {
      return trimmed.slice(firstNewline + 1, last).trim();
    }
  }
  return trimmed;
}

export function parsePostmortemResponse(raw: string): PostmortemOutput {
  const text = stripFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PostmortemParseError("Postmortem response was not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new PostmortemParseError("Postmortem must be a JSON object.");
  }
  const obj = parsed as Record<string, unknown>;
  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) {
      throw new PostmortemParseError(`Postmortem missing required key: ${key}`);
    }
  }
  return {
    tldr: String(obj.tldr),
    strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
    gaps: Array.isArray(obj.gaps) ? obj.gaps.map(String) : [],
    patternCommentary: String(obj.patternCommentary),
    tradeoffAnalysis: String(obj.tradeoffAnalysis),
    canonicalDiff: Array.isArray(obj.canonicalDiff)
      ? obj.canonicalDiff.map(String)
      : [],
    followUps: Array.isArray(obj.followUps) ? obj.followUps.map(String) : [],
  };
}
