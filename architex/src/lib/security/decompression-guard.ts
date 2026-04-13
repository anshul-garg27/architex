// ─────────────────────────────────────────────────────────────
// Architex — Decompression Bomb Prevention  (SCR-009)
// ─────────────────────────────────────────────────────────────
//
// Guards against zip-bomb / gzip-bomb style attacks by validating
// the decompressed-to-compressed ratio and enforcing a maximum
// decompressed size.
//
// Applies to shareable link parsing and any endpoint accepting
// compressed payloads.
// ─────────────────────────────────────────────────────────────

/** Default maximum decompressed size: 1 MB. */
export const DEFAULT_MAX_DECOMPRESSED_BYTES = 1_048_576; // 1 MB

/** Maximum allowed decompression ratio (decompressed / compressed). */
export const MAX_DECOMPRESSION_RATIO = 100;

export interface DecompressionValidation {
  /** Whether the compressed payload is considered safe. */
  safe: boolean;
  /** Reason for rejection, if unsafe. */
  reason?: string;
  /** Actual decompression ratio (decompressed / compressed). */
  ratio: number;
  /** Decompressed size in bytes. */
  decompressedSize: number;
}

/**
 * Validates that a compressed payload does not exceed safety thresholds.
 *
 * @param compressedSize    Size of the compressed payload in bytes.
 * @param decompressedSize  Size (or estimated size) of the decompressed output in bytes.
 * @param maxDecompressedBytes  Maximum allowed decompressed size (default: 1 MB).
 * @returns Whether the payload is considered safe.
 */
export function validateCompressedSize(
  compressedSize: number,
  decompressedSize: number,
  maxDecompressedBytes: number = DEFAULT_MAX_DECOMPRESSED_BYTES,
): DecompressionValidation {
  // Guard against zero/negative compressed sizes (would produce infinite ratio)
  if (compressedSize <= 0) {
    return {
      safe: false,
      reason: "Compressed size must be a positive number",
      ratio: Infinity,
      decompressedSize,
    };
  }

  if (decompressedSize < 0) {
    return {
      safe: false,
      reason: "Decompressed size cannot be negative",
      ratio: 0,
      decompressedSize,
    };
  }

  const ratio = decompressedSize / compressedSize;

  // Check decompression ratio — a bomb typically has a ratio > 1000:1
  if (ratio > MAX_DECOMPRESSION_RATIO) {
    return {
      safe: false,
      reason: `Decompression ratio ${ratio.toFixed(1)} exceeds maximum of ${MAX_DECOMPRESSION_RATIO}`,
      ratio,
      decompressedSize,
    };
  }

  // Check absolute decompressed size
  if (decompressedSize > maxDecompressedBytes) {
    return {
      safe: false,
      reason: `Decompressed size ${decompressedSize} bytes exceeds maximum of ${maxDecompressedBytes} bytes`,
      ratio,
      decompressedSize,
    };
  }

  return {
    safe: true,
    ratio,
    decompressedSize,
  };
}

/**
 * Validates a shareable link payload that may contain compressed data.
 *
 * Shareable links encode diagram state as compressed JSON. This function
 * checks that the compressed payload is safe to decompress before parsing.
 *
 * @param compressedPayload  The raw compressed bytes (Uint8Array or similar).
 * @param decompressedSize   Known or estimated decompressed size.
 * @param maxDecompressedBytes  Maximum allowed decompressed size (default: 1 MB).
 */
export function validateShareableLinkPayload(
  compressedPayload: Uint8Array,
  decompressedSize: number,
  maxDecompressedBytes: number = DEFAULT_MAX_DECOMPRESSED_BYTES,
): DecompressionValidation {
  return validateCompressedSize(
    compressedPayload.byteLength,
    decompressedSize,
    maxDecompressedBytes,
  );
}

/**
 * Streaming decompression guard. Call `feed()` for each decompressed chunk;
 * it will return `false` (unsafe) if the running total exceeds the budget.
 *
 * Useful when decompressed size is not known ahead of time.
 */
export function createStreamingGuard(
  compressedSize: number,
  maxDecompressedBytes: number = DEFAULT_MAX_DECOMPRESSED_BYTES,
) {
  let totalDecompressed = 0;

  return {
    /**
     * Feed a decompressed chunk. Returns a validation result.
     * Once unsafe, all subsequent calls also return unsafe.
     */
    feed(chunkSize: number): DecompressionValidation {
      totalDecompressed += chunkSize;
      return validateCompressedSize(
        compressedSize,
        totalDecompressed,
        maxDecompressedBytes,
      );
    },

    /** Current running total of decompressed bytes. */
    get totalDecompressed() {
      return totalDecompressed;
    },

    /** Reset the guard for reuse. */
    reset() {
      totalDecompressed = 0;
    },
  };
}
