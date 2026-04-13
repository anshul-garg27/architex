// ─────────────────────────────────────────────────────────────
// Architex — OAuth Redirect Validation  (SCR-013)
// ─────────────────────────────────────────────────────────────
//
// Validates OAuth redirect URIs against a strict allowlist of
// origins. Prevents open-redirect vulnerabilities where an
// attacker tricks the auth server into redirecting to a
// malicious domain.
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

export interface RedirectValidationResult {
  /** Whether the redirect URI is safe. */
  valid: boolean;
  /** Human-readable reason when `valid` is `false`. */
  reason?: string;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Validates an OAuth redirect URI against a strict allowlist of
 * permitted origins.
 *
 * Rules:
 *  1. The URI must be a valid, absolute URL.
 *  2. Only `http:` and `https:` schemes are allowed.
 *  3. The URI's origin must exactly match one of the entries
 *     in `allowedOrigins` (scheme + host + port).
 *  4. Path traversal sequences (`/../`) are rejected.
 *  5. Userinfo (`user:pass@host`) is rejected.
 *  6. Fragment identifiers (`#`) are rejected (OAuth spec
 *     forbids fragments in redirect URIs).
 *
 * @param uri             The redirect_uri to validate
 * @param allowedOrigins  Array of allowed origin strings
 *                        (e.g. `['https://app.example.com', 'http://localhost:3000']`)
 *
 * @example
 * ```ts
 * validateRedirectURI(
 *   'https://app.example.com/callback',
 *   ['https://app.example.com'],
 * );
 * // => { valid: true }
 * ```
 */
export function validateRedirectURI(
  uri: string,
  allowedOrigins: string[],
): RedirectValidationResult {
  // ── Basic string checks ───────────────────────────────
  if (!uri || typeof uri !== 'string') {
    return { valid: false, reason: 'Redirect URI is empty or not a string.' };
  }

  // ── Parse ─────────────────────────────────────────────
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return { valid: false, reason: 'Redirect URI is not a valid URL.' };
  }

  // ── Scheme ────────────────────────────────────────────
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason: `Scheme "${parsed.protocol}" is not allowed. Only http: and https: are permitted.`,
    };
  }

  // ── Fragment check (RFC 6749 §3.1.2) ─────────────────
  if (parsed.hash) {
    return {
      valid: false,
      reason: 'Redirect URI must not contain a fragment identifier.',
    };
  }

  // ── Userinfo check ────────────────────────────────────
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      reason: 'Redirect URI must not contain userinfo (user:pass@host).',
    };
  }

  // ── Path traversal check ──────────────────────────────
  if (parsed.pathname.includes('/../') || parsed.pathname.endsWith('/..')) {
    return {
      valid: false,
      reason: 'Redirect URI must not contain path traversal sequences.',
    };
  }

  // ── Origin allowlist check ────────────────────────────
  const origin = parsed.origin;
  if (!allowedOrigins.includes(origin)) {
    return {
      valid: false,
      reason: `Origin "${origin}" is not in the allowed origins list.`,
    };
  }

  return { valid: true };
}
