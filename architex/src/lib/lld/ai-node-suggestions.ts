/**
 * Haiku-powered node-gap analyzer for Build-mode canvases.
 *
 * Given a snapshot of the current ArchitexNode graph, returns 3-7
 * structured "what's likely missing" suggestions. Each suggestion
 * includes a reason, a suggested class name, and optional relation
 * hints to existing classes. Designed for the Ask Architect button
 * in Build mode; runs on Haiku to stay fast + cheap.
 */

import type { Node, Edge } from "@xyflow/react";
import { ClaudeClient } from "@/lib/ai/claude-client";

export interface NodeSuggestion {
  id: string; // stable hash of name + reason, client-side dedup key
  suggestedName: string;
  suggestedKind: "class" | "interface" | "enum" | "component" | "service";
  reason: string; // 1-2 sentence rationale
  relatedTo: string[]; // node IDs in the current graph the suggestion connects to
  confidence: "low" | "medium" | "high";
}

export interface SuggestNodesInput {
  nodes: Pick<Node, "id" | "data">[];
  edges: Pick<Edge, "source" | "target" | "data">[];
  intent?: string; // optional user note: "this is a parking lot"
}

const SYSTEM_PROMPT = `You are a senior software designer auditing a UML class diagram a user is sketching in the Architex LLD studio. Your task: identify 3-7 likely-missing classes / interfaces / components.

Rules:
- Stay concrete. Suggest names the user would recognise from textbook design (e.g. "Observer", "ParkingSpotFactory", "PaymentGateway").
- Do not suggest primitive utility classes (Logger, Util) unless the user has none.
- Prefer suggestions that enable future pattern application.
- Each suggestion: suggestedName, suggestedKind, reason (<=180 chars), relatedTo (array of existing node IDs, can be empty), confidence.

Return ONLY valid JSON matching:
{ "suggestions": NodeSuggestion[] }`;

export function buildUserPrompt(input: SuggestNodesInput): string {
  const compactNodes = input.nodes.map((n) => ({
    id: n.id,
    label: (n.data as { label?: string } | undefined)?.label ?? n.id,
  }));
  const compactEdges = input.edges.map((e) => ({
    s: e.source,
    t: e.target,
    kind: (e.data as { kind?: string } | undefined)?.kind ?? "assoc",
  }));
  const intent = input.intent?.slice(0, 400) ?? "(no stated intent)";

  return [
    "User intent:",
    intent,
    "",
    "Existing nodes:",
    JSON.stringify(compactNodes),
    "",
    "Existing edges:",
    JSON.stringify(compactEdges),
    "",
    "Suggest 3-7 missing nodes now. JSON only.",
  ].join("\n");
}

export async function suggestNodes(
  input: SuggestNodesInput,
): Promise<NodeSuggestion[]> {
  const userMessage = buildUserPrompt(input);
  const client = ClaudeClient.getInstance();

  if (!client.isConfigured()) {
    // No API key — return empty suggestions rather than throwing.
    return [];
  }

  const response = await client.call({
    model: "claude-haiku-4-5",
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 800,
  });

  try {
    const parsed = JSON.parse(response.text) as {
      suggestions: NodeSuggestion[];
    };
    const seen = new Set<string>();
    return parsed.suggestions
      .filter((s) => {
        const key = `${s.suggestedName}|${s.reason}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return Boolean(s.suggestedName) && Boolean(s.reason);
      })
      .slice(0, 7)
      .map((s, i) => ({
        ...s,
        id: `sug-${i}-${s.suggestedName.toLowerCase().replace(/\s+/g, "-")}`,
        suggestedKind: s.suggestedKind ?? "class",
        relatedTo: Array.isArray(s.relatedTo) ? s.relatedTo : [],
        confidence: s.confidence ?? "medium",
      }));
  } catch (err) {
    console.warn("[ai-node-suggestions] parse failed:", err);
    return [];
  }
}
