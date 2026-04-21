/**
 * AI-013: Streaming Claude wrapper for drill interviewer turns.
 *
 * Composes persona system prompt + chronological chat history and
 * returns a shape the `ClaudeClient.streamText()` can consume. The
 * server route (Task 25) pipes the stream back as SSE to the browser.
 */

import {
  systemPromptFor,
  type InterviewerPersona,
} from "@/lib/ai/interviewer-prompts";
import type { DrillStage } from "@/lib/lld/drill-stages";

export interface InterviewerTurn {
  role: "user" | "interviewer" | "system";
  stage: DrillStage;
  content: string;
  seq: number;
  createdAt: string;
}

export interface InterviewerRequestOptions {
  persona: InterviewerPersona;
  stage: DrillStage;
  problemTitle: string;
  history: InterviewerTurn[];
  /** Max turns to send (both user+interviewer) — defaults to 30. */
  historyCap?: number;
}

export interface InterviewerRequest {
  model: "claude-sonnet-4-20250514";
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
}

export class InterviewerPersonaRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterviewerPersonaRequestError";
  }
}

const DEFAULT_HISTORY_CAP = 30;

function mapRole(turn: InterviewerTurn): "user" | "assistant" {
  // Claude expects alternating user/assistant. Our "interviewer" maps to
  // assistant; "user" stays user; "system" turns (rare — injected hints)
  // are folded into the user message before them and silently dropped.
  if (turn.role === "interviewer") return "assistant";
  return "user";
}

export function parseTurnHistory(
  rows: Array<Pick<InterviewerTurn, "role" | "seq" | "content"> & Partial<InterviewerTurn>>,
): InterviewerTurn[] {
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((r) => ({
      role: r.role,
      stage: (r.stage as DrillStage) ?? "canvas",
      content: r.content,
      seq: r.seq,
      createdAt: r.createdAt ?? new Date(0).toISOString(),
    }));
}

export function buildInterviewerRequest(
  opts: InterviewerRequestOptions,
): InterviewerRequest {
  const cap = opts.historyCap ?? DEFAULT_HISTORY_CAP;
  const trimmed = opts.history.slice(-cap);

  if (trimmed.length === 0) {
    throw new InterviewerPersonaRequestError(
      "Cannot build interviewer request with empty history.",
    );
  }
  const last = trimmed[trimmed.length - 1]!;
  if (last.role !== "user") {
    throw new InterviewerPersonaRequestError(
      `Last turn must be from user, got '${last.role}'.`,
    );
  }

  const messages = trimmed
    .filter((t) => t.role !== "system")
    .map((t) => ({
      role: mapRole(t),
      content: t.content,
    }));

  const system =
    systemPromptFor(opts.persona, opts.stage) +
    `\n\nProblem title: "${opts.problemTitle}".`;

  return {
    model: "claude-sonnet-4-20250514",
    system,
    messages,
    maxTokens: 400, // keep turns terse per BASE_RULES
  };
}
