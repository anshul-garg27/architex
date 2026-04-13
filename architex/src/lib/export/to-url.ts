import type { Node, Edge } from '@xyflow/react';
import LZString from 'lz-string';

// ─────────────────────────────────────────────────────────────
// Shareable URL Encoding via lz-string
// ─────────────────────────────────────────────────────────────

/** Maximum nodes for URL-hash encoding (keeps URLs reasonable). */
const MAX_URL_NODES = 30;

/**
 * Minimal representation for URL encoding — strips visual-only fields
 * to keep the compressed payload as small as possible.
 */
interface CompactDiagram {
  n: Array<{
    id: string;
    t: string;
    x: number;
    y: number;
    d: Record<string, unknown>;
  }>;
  e: Array<{
    id: string;
    s: string;
    t: string;
    sh?: string;
    th?: string;
    tp: string;
    d?: Record<string, unknown>;
  }>;
}

/**
 * Compress nodes and edges into a URI-safe encoded string.
 */
export function encodeToURL(nodes: Node[], edges: Edge[]): string {
  const compact: CompactDiagram = {
    n: nodes.map((n) => ({
      id: n.id,
      t: n.type ?? 'default',
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      d: n.data as Record<string, unknown>,
    })),
    e: edges.map((e) => {
      const mapped: CompactDiagram['e'][number] = {
        id: e.id,
        s: e.source,
        t: e.target,
        tp: e.type ?? 'default',
      };
      if (e.sourceHandle != null) mapped.sh = e.sourceHandle;
      if (e.targetHandle != null) mapped.th = e.targetHandle;
      if (e.data != null) mapped.d = e.data as Record<string, unknown>;
      return mapped;
    }),
  };

  const json = JSON.stringify(compact);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress an encoded string back into nodes and edges.
 * Returns `null` if decompression or parsing fails.
 */
export function decodeFromURL(
  encoded: string,
): { nodes: Node[]; edges: Edge[] } | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    const compact = JSON.parse(json) as CompactDiagram;

    const nodes: Node[] = compact.n.map((n) => ({
      id: n.id,
      type: n.t,
      position: { x: n.x, y: n.y },
      data: n.d,
    }));

    const edges: Edge[] = compact.e.map((e) => {
      const edge: Edge = {
        id: e.id,
        source: e.s,
        target: e.t,
        type: e.tp,
      };
      if (e.sh != null) edge.sourceHandle = e.sh;
      if (e.th != null) edge.targetHandle = e.th;
      if (e.d != null) edge.data = e.d;
      return edge;
    });

    return { nodes, edges };
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL with the diagram encoded in the hash fragment.
 *
 * For diagrams exceeding `MAX_URL_NODES` nodes the hash is still generated,
 * but consumers should consider using JSON export instead for very large
 * diagrams — browsers may truncate extremely long URLs.
 */
export function generateShareableURL(
  nodes: Node[],
  edges: Edge[],
  baseUrl?: string,
): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://architex.dev');
  const encoded = encodeToURL(nodes, edges);

  if (nodes.length > MAX_URL_NODES) {
    // Still encode, but warn via console in dev
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] Diagram has ${nodes.length} nodes — URL may be very long. Consider JSON export for sharing.`,
      );
    }
  }

  return `${base}/share#d=${encoded}`;
}
