// ── AI Evaluation API Route ─────────────────────────────────────────
//
// POST /api/evaluate
// Accepts a serialized diagram + challenge definition, returns an AI
// evaluation with scores, feedback, strengths, improvements, and
// follow-up questions.
//
// When ANTHROPIC_API_KEY is not configured, falls back to heuristic
// scoring so the pipeline works end-to-end without an API key.

import { NextResponse } from 'next/server';
import {
  serializeDiagramForAI,
  buildEvaluationPrompt,
  type ChallengeDefinition,
} from '@/lib/ai/serialize-diagram';
import {
  parseEvaluationResponse,
  type AIEvaluation,
} from '@/lib/ai/parse-evaluation';
import type { Node, Edge } from '@xyflow/react';
import { sanitizeUserInput } from '@/lib/ai/prompt-safety';

// ── Request / Response types ────────────────────────────────────────

interface EvaluateRequestBody {
  nodes: Node[];
  edges: Edge[];
  challenge: ChallengeDefinition;
}

// ── Heuristic fallback ──────────────────────────────────────────────

function buildHeuristicEvaluation(
  nodes: Node[],
  edges: Edge[],
  challenge: ChallengeDefinition,
): AIEvaluation {
  // Simple heuristic: score based on component count, connection
  // density, and variety relative to challenge difficulty.
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const uniqueTypes = new Set(
    nodes.map((n) => {
      const data = n.data as Record<string, unknown> | undefined;
      return (data?.componentType as string) ?? n.type ?? 'unknown';
    }),
  ).size;

  // Base scores scale with diagram complexity
  const complexityScore = Math.min(10, Math.round(3 + nodeCount * 0.5 + uniqueTypes * 0.3));
  const connectivityScore = Math.min(10, Math.round(3 + (edgeCount / Math.max(nodeCount, 1)) * 3));

  // Difficulty modifier: harder challenges need more components
  const diffMod = challenge.difficulty >= 4 ? -1 : challenge.difficulty <= 2 ? 1 : 0;

  const clamp = (v: number) => Math.max(1, Math.min(10, v));

  return {
    scores: {
      functional: clamp(complexityScore + diffMod),
      api: clamp(connectivityScore + diffMod),
      dataModel: clamp(complexityScore - 1 + diffMod),
      scalability: clamp(Math.round(complexityScore * 0.7) + diffMod),
      reliability: clamp(Math.round(connectivityScore * 0.8) + diffMod),
      tradeoffs: clamp(Math.round((complexityScore + connectivityScore) / 2 - 2) + diffMod),
    },
    feedback: [
      'AI evaluation requires an ANTHROPIC_API_KEY environment variable. Showing heuristic scores instead.',
      `Detected ${nodeCount} components of ${uniqueTypes} distinct types with ${edgeCount} connections.`,
    ],
    strengths: [
      ...(uniqueTypes >= 4 ? ['Good variety of component types in the architecture.'] : []),
      ...(edgeCount >= nodeCount ? ['Components are well-connected with clear data flow paths.'] : []),
      ...(nodeCount >= 5 ? ['Sufficient component count for a non-trivial architecture.'] : []),
    ],
    improvements: [
      ...(uniqueTypes < 3 ? ['Consider adding more diverse component types (caching, messaging, etc.).'] : []),
      ...(edgeCount < nodeCount - 1 ? ['Some components appear disconnected — ensure all parts are integrated.'] : []),
      ...(!nodes.some((n) => {
        const d = n.data as Record<string, unknown> | undefined;
        return (d?.componentType as string)?.includes('cache');
      }) ? ['Consider adding a caching layer to improve read performance.'] : []),
      ...(!nodes.some((n) => {
        const d = n.data as Record<string, unknown> | undefined;
        const ct = (d?.componentType as string) ?? '';
        return ct.includes('queue') || ct.includes('pub-sub') || ct.includes('event');
      }) ? ['Consider adding asynchronous messaging for reliability and decoupling.'] : []),
    ],
    followUpQuestions: [
      'What happens when your primary database receives 10x the expected write load?',
      'How would you handle a regional outage affecting one of your availability zones?',
      'What is your strategy for data consistency across services?',
    ],
  };
}

// ── Route handler ───────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: EvaluateRequestBody;

  try {
    body = (await request.json()) as EvaluateRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 },
    );
  }

  const { nodes, edges, challenge } = body;

  if (!nodes || !edges || !challenge) {
    return NextResponse.json(
      { error: 'Request must include "nodes", "edges", and "challenge" fields.' },
      { status: 400 },
    );
  }

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return NextResponse.json(
      { error: '"nodes" and "edges" must be arrays.' },
      { status: 400 },
    );
  }

  if (nodes.length > 200 || edges.length > 400) {
    return NextResponse.json(
      { error: 'Payload too large: max 200 nodes and 400 edges.' },
      { status: 400 },
    );
  }

  // Sanitize user-controlled text before it reaches any LLM prompt
  challenge.title = sanitizeUserInput(challenge.title);
  challenge.requirements = challenge.requirements.map((r) => sanitizeUserInput(r));

  // ── Check for API key ─────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return heuristic-based evaluation
    const heuristic = buildHeuristicEvaluation(nodes, edges, challenge);
    return NextResponse.json(heuristic, { status: 200 });
  }

  // ── AI-powered evaluation ─────────────────────────────────────
  // Serialize the diagram and build the prompt
  const serialized = serializeDiagramForAI(nodes, edges);
  const _prompt = buildEvaluationPrompt(serialized, challenge);

  // TODO: Call Claude API when key is available
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 2048,
  //   messages: [{ role: 'user', content: prompt }],
  // });
  // const text = response.content[0].type === 'text' ? response.content[0].text : '';
  // const parsed = parseEvaluationResponse(text);
  // if ('error' in parsed) {
  //   return NextResponse.json({ ...buildHeuristicEvaluation(nodes, edges, challenge), aiError: parsed.error }, { status: 200 });
  // }
  // return NextResponse.json(parsed, { status: 200 });

  // For now, return heuristic scores even when key is present
  // (actual API integration will replace this block)
  const heuristic = buildHeuristicEvaluation(nodes, edges, challenge);

  // Suppress unused variable warnings for the serialization pipeline
  void _prompt;
  void parseEvaluationResponse;

  return NextResponse.json(heuristic, { status: 200 });
}
