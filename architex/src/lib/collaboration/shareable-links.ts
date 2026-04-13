// ─────────────────────────────────────────────────────────────
// Architex — COL-008 Shareable Links
// ─────────────────────────────────────────────────────────────
//
// Encodes/decodes diagram data into compressed URL-safe strings
// using lz-string. Max URL length enforced at 2048 characters.

import LZString from 'lz-string';
import type { Node, Edge } from '@xyflow/react';

// ── Types ─────────────────────────────────────────────────────

/** The diagram payload embedded in a shareable link. */
export interface ShareableDiagram {
  title: string;
  nodes: Node[];
  edges: Edge[];
  version: number;
}

/** Result of attempting to create a shareable link. */
export type CreateLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Result of parsing a shareable link. */
export type ParseLinkResult =
  | { ok: true; diagram: ShareableDiagram }
  | { ok: false; error: string };

// ── Constants ─────────────────────────────────────────────────

const MAX_URL_LENGTH = 2048;
const SHARE_PARAM = 'd';
const CURRENT_VERSION = 1;

/** Base URL for shareable links. Uses window.location.origin in the browser. */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return 'https://architex.app/';
}

// ── Public API ────────────────────────────────────────────────

/**
 * Create a shareable link from diagram data.
 *
 * Pipeline: diagram -> JSON.stringify -> lz-string compressToEncodedURIComponent -> URL
 */
export function createShareableLink(diagram: ShareableDiagram): CreateLinkResult {
  try {
    const payload: ShareableDiagram = {
      ...diagram,
      version: CURRENT_VERSION,
    };

    const json = JSON.stringify(payload);
    const compressed = LZString.compressToEncodedURIComponent(json);

    if (!compressed) {
      return { ok: false, error: 'Compression failed — diagram may be empty.' };
    }

    const url = `${getBaseUrl()}?${SHARE_PARAM}=${compressed}`;

    if (url.length > MAX_URL_LENGTH) {
      return {
        ok: false,
        error: `URL exceeds maximum length (${url.length} / ${MAX_URL_LENGTH} chars). Simplify the diagram or reduce node count.`,
      };
    }

    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error creating shareable link.',
    };
  }
}

/**
 * Parse a shareable link back into diagram data.
 *
 * Pipeline: URL -> extract param -> decompressFromEncodedURIComponent -> JSON.parse
 */
export function parseShareableLink(url: string): ParseLinkResult {
  try {
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return { ok: false, error: 'Invalid URL format.' };
    }

    const compressed = urlObj.searchParams.get(SHARE_PARAM);

    if (!compressed) {
      return { ok: false, error: `Missing "${SHARE_PARAM}" parameter in URL.` };
    }

    const json = LZString.decompressFromEncodedURIComponent(compressed);

    if (!json) {
      return { ok: false, error: 'Decompression failed — link may be corrupted.' };
    }

    const parsed: unknown = JSON.parse(json);

    if (!isShareableDiagram(parsed)) {
      return { ok: false, error: 'Invalid diagram data in URL.' };
    }

    return { ok: true, diagram: parsed };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error parsing shareable link.',
    };
  }
}

// ── Validation ────────────────────────────────────────────────

function isShareableDiagram(value: unknown): value is ShareableDiagram {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.title === 'string' &&
    Array.isArray(obj.nodes) &&
    Array.isArray(obj.edges) &&
    typeof obj.version === 'number'
  );
}
