"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas-store";

interface SyncArgs {
  designId: string | null;
}

interface PersistSnapshotBody {
  canvasState: Record<string, unknown>;
  kind: "auto" | "named";
  label?: string | null;
  note?: string | null;
  nodeCount: number;
  edgeCount: number;
}

async function persistSnapshot(
  designId: string,
  body: PersistSnapshotBody,
): Promise<unknown> {
  const res = await fetch(`/api/lld/designs/${designId}/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`snapshot sync failed: ${res.status}`);
  return res.json();
}

/**
 * When bound to an active design:
 *  - Every new namedSnapshot is persisted immediately.
 *  - An auto-save fires 30s after the last canvas mutation.
 *
 * No-ops until `designId` is non-null.
 */
export function useLLDDesignSync({ designId }: SyncArgs): void {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const namedSnapshots = useCanvasStore((s) => s.namedSnapshots);

  const mutation = useMutation({
    mutationFn: ({
      designId: id,
      body,
    }: {
      designId: string;
      body: PersistSnapshotBody;
    }) => persistSnapshot(id, body),
    networkMode: "offlineFirst",
    retry: 2,
  });

  // Persist new named snapshots (immediate).
  const lastNamedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!designId) return;
    const latest = namedSnapshots[0];
    if (!latest || latest.id === lastNamedIdRef.current) return;
    lastNamedIdRef.current = latest.id;
    mutation.mutate({
      designId,
      body: {
        canvasState: {
          nodes: latest.nodes,
          edges: latest.edges,
          groups: latest.groups,
        },
        kind: "named",
        label: latest.label,
        note: latest.note,
        nodeCount: latest.nodes.length,
        edgeCount: latest.edges.length,
      },
    });
  }, [namedSnapshots, designId, mutation]);

  // Auto-save 30s after last mutation.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!designId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      mutation.mutate({
        designId,
        body: {
          canvasState: { nodes, edges },
          kind: "auto",
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
      });
    }, 30_000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, designId, mutation]);
}
