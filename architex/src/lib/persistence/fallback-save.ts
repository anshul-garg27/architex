// ─────────────────────────────────────────────────────────────
// FND-043 — beforeunload Fallback Save
// Last-resort persistence via localStorage + LZ-string
// compression for large payloads.
// ─────────────────────────────────────────────────────────────

import { compressToUTF16, decompressFromUTF16 } from "lz-string";

/** localStorage key used for the emergency save. */
export const FALLBACK_LS_KEY = "architex-fallback-save";

/** Byte threshold above which we compress the JSON payload. */
const COMPRESS_THRESHOLD = 8_192; // 8 KB

// ── Write helpers ──────────────────────────────────────────────

interface FallbackPayload {
  /** ISO-8601 timestamp of the save. */
  savedAt: string;
  /** Whether the `data` field is LZ-compressed. */
  compressed: boolean;
  /** JSON string (plain or compressed). */
  data: string;
}

function writeFallback(raw: unknown): void {
  try {
    const json = JSON.stringify(raw);
    const compressed = json.length > COMPRESS_THRESHOLD;
    const payload: FallbackPayload = {
      savedAt: new Date().toISOString(),
      compressed,
      data: compressed ? compressToUTF16(json) : json,
    };
    localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(payload));
  } catch {
    // localStorage might be full or unavailable — nothing we can do.
  }
}

// ── Read helpers ───────────────────────────────────────────────

export interface RecoveryData {
  savedAt: string;
  data: unknown;
}

/**
 * Check whether a fallback save exists in localStorage.
 * Returns the parsed data or `null` if nothing is found / data is corrupt.
 */
export function checkForRecoveryData(): RecoveryData | null {
  try {
    const raw = localStorage.getItem(FALLBACK_LS_KEY);
    if (!raw) return null;

    const payload: FallbackPayload = JSON.parse(raw);
    const json = payload.compressed
      ? decompressFromUTF16(payload.data)
      : payload.data;

    if (!json) return null;

    return {
      savedAt: payload.savedAt,
      data: JSON.parse(json),
    };
  } catch {
    return null;
  }
}

/** Clear the fallback save after the user has accepted or dismissed it. */
export function clearRecoveryData(): void {
  try {
    localStorage.removeItem(FALLBACK_LS_KEY);
  } catch {
    // Ignore
  }
}

// ── Install handler ────────────────────────────────────────────

/**
 * Install a `beforeunload` handler that writes an emergency snapshot to
 * localStorage when the page is closing.
 *
 * Returns a cleanup function that removes the handler.
 */
export function installBeforeUnloadSave(
  getData: () => unknown,
): () => void {
  function handler(_e: BeforeUnloadEvent) {
    writeFallback(getData());
  }

  window.addEventListener("beforeunload", handler);

  return () => {
    window.removeEventListener("beforeunload", handler);
  };
}
