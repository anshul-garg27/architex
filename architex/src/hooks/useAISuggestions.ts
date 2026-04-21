"use client";

import { useMutation } from "@tanstack/react-query";
import type { NodeSuggestion } from "@/lib/lld/ai-node-suggestions";
import { useCanvasStore } from "@/stores/canvas-store";

async function fetchSuggestions(
  intent: string | undefined,
): Promise<NodeSuggestion[]> {
  const { nodes, edges } = useCanvasStore.getState();
  const res = await fetch("/api/lld/ai/suggest-nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        data: e.data,
      })),
      intent,
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit exceeded");
    throw new Error(`AI suggest failed: ${res.status}`);
  }
  const json = (await res.json()) as { suggestions: NodeSuggestion[] };
  return json.suggestions;
}

export function useAISuggestions() {
  return useMutation({
    mutationFn: (intent?: string) => fetchSuggestions(intent),
    retry: 1,
  });
}
