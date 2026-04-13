// ── AI Hint API Route ───────────────────────────────────────────────
//
// POST /api/hint
// Accepts a serialized diagram + challenge definition, returns a
// contextual hint based on what the user has built so far.
//
// When ANTHROPIC_API_KEY is not configured, returns a fallback message.

import { NextResponse } from "next/server";
import {
  serializeDiagramForAI,
  type ChallengeDefinition,
} from "@/lib/ai/serialize-diagram";
import type { Node, Edge } from "@xyflow/react";
import { sanitizeUserInput } from "@/lib/ai/prompt-safety";

// ── Request types ──────────────────────────────────────────────────

interface HintRequestBody {
  nodes: Node[];
  edges: Edge[];
  challenge: ChallengeDefinition;
}

// ── Heuristic fallback hint ────────────────────────────────────────

function buildHeuristicHint(
  nodes: Node[],
  edges: Edge[],
  challenge: ChallengeDefinition,
): string {
  const serialized = serializeDiagramForAI(nodes, edges);
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const types = serialized.nodeTypes;

  if (nodeCount === 0) {
    return `You haven't added any components yet. Start by thinking about the core requirements: ${challenge.requirements[0] ?? "the main functionality"}. What component would handle the primary user request?`;
  }

  if (edgeCount < nodeCount - 1) {
    return `You have ${nodeCount} components but only ${edgeCount} connections. Some components appear disconnected. Consider how data flows between ${types.slice(0, 3).join(", ")}${types.length > 3 ? ", etc." : ""}.`;
  }

  const hasCaching = types.some((t) => t.toLowerCase().includes("cache"));
  const hasLB = types.some(
    (t) =>
      t.toLowerCase().includes("load-balancer") ||
      t.toLowerCase().includes("api-gateway"),
  );
  const hasQueue = types.some(
    (t) =>
      t.toLowerCase().includes("queue") ||
      t.toLowerCase().includes("pub-sub") ||
      t.toLowerCase().includes("event"),
  );

  if (!hasCaching && challenge.difficulty >= 2) {
    return `Your architecture has ${nodeCount} components with good connectivity. Consider adding a caching layer to reduce read latency and database load. Where would a cache have the most impact in your current design?`;
  }

  if (!hasLB && nodeCount >= 3) {
    return `With ${nodeCount} components, think about how traffic gets distributed. A load balancer or API gateway could help manage incoming requests and provide a single entry point.`;
  }

  if (!hasQueue && challenge.difficulty >= 3) {
    return `Your design handles synchronous flows well. For the "${challenge.title}" problem, consider where asynchronous processing could improve reliability. What operations could be decoupled using a message queue?`;
  }

  return `Your architecture looks like it covers the basics with ${nodeCount} components. Review each requirement carefully: ${challenge.requirements.map((r, i) => `(${i + 1}) ${r}`).join(" ")}. Are there any gaps?`;
}

// ── Route handler ──────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: HintRequestBody;

  try {
    body = (await request.json()) as HintRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const { nodes, edges, challenge } = body;

  if (!nodes || !edges || !challenge) {
    return NextResponse.json(
      {
        error:
          'Request must include "nodes", "edges", and "challenge" fields.',
      },
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
    // Return a heuristic hint with a note about the missing key
    const hint = buildHeuristicHint(nodes, edges, challenge);
    return NextResponse.json(
      {
        hint,
        isAI: false,
        message: "AI hints require an ANTHROPIC_API_KEY",
      },
      { status: 200 },
    );
  }

  // ── AI-powered hint ──────────────────────────────────────────
  const serialized = serializeDiagramForAI(nodes, edges);

  const prompt = `You are an expert system design interviewer giving a contextual hint to a candidate.

## Challenge
**${challenge.title}** (Difficulty: ${challenge.difficulty}/5, Time limit: ${challenge.timeMinutes} min)

### Requirements
${challenge.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Candidate's Current Diagram
${serialized.summary}

### Component Types
${serialized.nodeTypes.map((t) => `- ${t}`).join("\n")}

### Connections
${serialized.connections.length > 0 ? serialized.connections.map((c) => `- ${c}`).join("\n") : "(none)"}

## Instructions
Give ONE specific, actionable hint to help the candidate improve their design. The hint should:
1. Reference what they've already built
2. Point toward a specific gap or improvement
3. Be 2-3 sentences maximum
4. NOT give away the full solution

Respond with ONLY the hint text, no JSON, no markdown formatting.`;

  // TODO: Call Claude API when integration is complete
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 256,
  //   messages: [{ role: 'user', content: prompt }],
  // });
  // const hintText = response.content[0].type === 'text' ? response.content[0].text : '';

  // For now, return heuristic hint even when key is present
  void prompt;
  const hint = buildHeuristicHint(nodes, edges, challenge);
  return NextResponse.json({ hint, isAI: false }, { status: 200 });
}
