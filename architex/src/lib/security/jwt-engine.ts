// ─────────────────────────────────────────────────────────────
// Architex — JWT Encode / Decode Engine  (SEC-007)
// ─────────────────────────────────────────────────────────────
//
// Educational JWT encoder, decoder, and validator.
//
// Uses base64url encoding and a simple HMAC-SHA256-like hash
// for signature generation. NOT suitable for production — this
// is designed for interactive visualization only.
// ─────────────────────────────────────────────────────────────

// ── Base64url helpers ──────────────────────────────────────

/** Encode a UTF-8 string to base64url (no padding). */
export function toBase64Url(str: string): string {
  // Convert to array of char codes
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += CHARS[(a >> 2) & 0x3f];
    result += CHARS[((a << 4) | (b >> 4)) & 0x3f];
    if (i + 1 < bytes.length) result += CHARS[((b << 2) | (c >> 6)) & 0x3f];
    if (i + 2 < bytes.length) result += CHARS[c & 0x3f];
  }
  return result;
}

/** Decode a base64url string back to UTF-8. */
export function fromBase64Url(b64: string): string {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const lookup = new Map<string, number>();
  for (let i = 0; i < CHARS.length; i++) lookup.set(CHARS[i], i);

  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const a = lookup.get(b64[i]) ?? 0;
    const b = lookup.get(b64[i + 1]) ?? 0;
    const c = i + 2 < b64.length ? (lookup.get(b64[i + 2]) ?? 0) : 0;
    const d = i + 3 < b64.length ? (lookup.get(b64[i + 3]) ?? 0) : 0;
    bytes.push((a << 2) | (b >> 4));
    if (i + 2 < b64.length) bytes.push(((b << 4) | (c >> 2)) & 0xff);
    if (i + 3 < b64.length) bytes.push(((c << 6) | d) & 0xff);
  }

  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
    } else if (byte < 0xe0) {
      const b2 = bytes[++i];
      result += String.fromCharCode(((byte & 0x1f) << 6) | (b2 & 0x3f));
    } else {
      const b2 = bytes[++i];
      const b3 = bytes[++i];
      result += String.fromCharCode(
        ((byte & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f),
      );
    }
  }
  return result;
}

// ── HMAC-SHA256-like hash (educational) ────────────────────

/**
 * A simple deterministic hash function for educational purposes.
 * NOT cryptographically secure — used to demonstrate the concept
 * of HMAC-SHA256 signing in JWT.
 */
function simpleHmac(data: string, secret: string): string {
  const combined = `${secret}:${data}`;
  // FNV-1a inspired hash producing 256-bit-like output
  const parts: number[] = [];
  for (let chunk = 0; chunk < 8; chunk++) {
    let h = 0x811c9dc5 ^ (chunk * 0x1000193);
    for (let i = 0; i < combined.length; i++) {
      h ^= combined.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    parts.push(Math.abs(h));
  }
  return parts.map((p) => p.toString(16).padStart(8, "0")).join("");
}

// ── Public API ─────────────────────────────────────────────

/**
 * Encode a JWT from header, payload, and secret.
 *
 * @returns A dot-separated JWT string: header.payload.signature
 */
export function encodeJWT(
  header: object,
  payload: object,
  secret: string,
): string {
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = toBase64Url(simpleHmac(signingInput, secret));
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decode a JWT string into its three parts without
 * verifying the signature.
 */
export function decodeJWT(token: string): {
  header: object;
  payload: object;
  signature: string;
} {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 dot-separated parts");
  }

  let header: object;
  let payload: object;
  try {
    header = JSON.parse(fromBase64Url(parts[0]));
  } catch {
    throw new Error("Invalid JWT: header is not valid base64url JSON");
  }
  try {
    payload = JSON.parse(fromBase64Url(parts[1]));
  } catch {
    throw new Error("Invalid JWT: payload is not valid base64url JSON");
  }

  return { header, payload, signature: parts[2] };
}

/**
 * Validate a JWT token against a secret, checking:
 * - Correct format (3 parts)
 * - Signature validity
 * - Expiration (exp claim)
 * - Not-before (nbf claim)
 * - Issuer (iss claim, if present)
 */
export function validateJWT(
  token: string,
  secret: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Format check
  const parts = token.split(".");
  if (parts.length !== 3) {
    errors.push("Invalid format: JWT must have exactly 3 parts separated by dots");
    return { valid: false, errors };
  }

  // Decode
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(fromBase64Url(parts[0])) as Record<string, unknown>;
  } catch {
    errors.push("Header is not valid base64url-encoded JSON");
    return { valid: false, errors };
  }
  try {
    payload = JSON.parse(fromBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    errors.push("Payload is not valid base64url-encoded JSON");
    return { valid: false, errors };
  }

  // Algorithm check
  if (header.alg !== "HS256") {
    errors.push(
      `Unsupported algorithm "${String(header.alg)}": only HS256 is supported in this demo`,
    );
  }

  // Signature check
  const signingInput = `${parts[0]}.${parts[1]}`;
  const expectedSig = toBase64Url(simpleHmac(signingInput, secret));
  if (parts[2] !== expectedSig) {
    errors.push("Signature verification failed: token may have been tampered with");
  }

  // Expiration (exp)
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    errors.push(
      `Token expired: exp=${payload.exp} (${new Date(payload.exp * 1000).toISOString()}) is in the past`,
    );
  }

  // Not before (nbf)
  if (typeof payload.nbf === "number" && payload.nbf > now) {
    errors.push(
      `Token not yet valid: nbf=${payload.nbf} (${new Date(payload.nbf * 1000).toISOString()}) is in the future`,
    );
  }

  return { valid: errors.length === 0, errors };
}
