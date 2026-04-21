"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LLDDesign } from "@/db/schema";

async function listDesigns(
  status: "active" | "archived" = "active",
): Promise<LLDDesign[]> {
  const res = await fetch(`/api/lld/designs?status=${status}`);
  if (!res.ok) throw new Error(`List designs failed: ${res.status}`);
  const json = (await res.json()) as { designs: LLDDesign[] };
  return json.designs;
}

async function createDesign(body: {
  name: string;
  description?: string;
  templateId?: string;
}): Promise<LLDDesign> {
  const res = await fetch("/api/lld/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Create design failed: ${res.status}`);
  const json = (await res.json()) as { design: LLDDesign };
  return json.design;
}

export function useLLDDesigns(status: "active" | "archived" = "active") {
  return useQuery({
    queryKey: ["lld-designs", status],
    queryFn: () => listDesigns(status),
    staleTime: 30 * 1000,
  });
}

export function useCreateLLDDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDesign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lld-designs"] });
    },
  });
}
