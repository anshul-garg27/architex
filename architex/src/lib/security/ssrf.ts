// ─────────────────────────────────────────────────────────────
// Architex — SSRF Prevention  (SCR-016)
// ─────────────────────────────────────────────────────────────
//
// Server-Side Request Forgery guard: validates user-supplied
// URLs before the server fetches them.
//
// Rejects:
//  - Private / loopback IP ranges (RFC 1918, RFC 6890)
//  - IPv6 loopback (::1) and unspecified (::)
//  - Non-http(s) schemes (file://, ftp://, gopher://, etc.)
//  - URLs that resolve to 0.0.0.0
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

export interface SSRFValidationResult {
  /** Whether the URL passed all checks. */
  safe: boolean;
  /** Human-readable reason when `safe` is `false`. */
  reason?: string;
}

// ── Private IP patterns ─────────────────────────────────────

/**
 * Regular expressions that match private / reserved IPv4 address ranges.
 *
 * 10.0.0.0/8       — Class A private
 * 172.16.0.0/12    — Class B private (172.16.x – 172.31.x)
 * 192.168.0.0/16   — Class C private
 * 127.0.0.0/8      — Loopback
 * 0.0.0.0          — Unspecified / "this host"
 * 169.254.0.0/16   — Link-local
 */
const PRIVATE_IPV4_PATTERNS: ReadonlyArray<RegExp> = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
];

/**
 * Hostnames and IPv6 addresses that represent loopback / private.
 */
const BLOCKED_HOSTS = new Set([
  'localhost',
  '::1',
  '::',
  '[::1]',
  '[::]',
  '0.0.0.0',
]);

/**
 * Only these URI schemes are allowed for outbound fetches.
 */
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// ── Public API ──────────────────────────────────────────────

/**
 * Validates a URL to prevent SSRF attacks.
 *
 * @param url  The URL string to validate
 * @returns    `{ safe: true }` when the URL is acceptable,
 *             `{ safe: false, reason }` otherwise.
 *
 * @example
 * ```ts
 * const result = validateURL('http://169.254.169.254/metadata');
 * // { safe: false, reason: 'Hostname resolves to a private IP range.' }
 * ```
 */
export function validateURL(url: string): SSRFValidationResult {
  // ── Parse ─────────────────────────────────────────────
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: 'Malformed URL.' };
  }

  // ── Scheme check ──────────────────────────────────────
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return {
      safe: false,
      reason: `Scheme "${parsed.protocol}" is not allowed. Only http: and https: are permitted.`,
    };
  }

  // ── Hostname blocklist ────────────────────────────────
  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    return {
      safe: false,
      reason: 'Hostname resolves to a loopback or unspecified address.',
    };
  }

  // ── IPv4 private range check ──────────────────────────
  if (isPrivateIPv4(hostname)) {
    return {
      safe: false,
      reason: 'Hostname resolves to a private IP range.',
    };
  }

  // ── IPv6 bracket notation check ───────────────────────
  // Handles URLs like http://[::1]/ after URL parsing strips brackets
  if (hostname.startsWith('[') || hostname === '::1' || hostname === '::') {
    return {
      safe: false,
      reason: 'IPv6 loopback or unspecified addresses are not allowed.',
    };
  }

  // ── Bare IPv4-mapped IPv6 check (::ffff:127.0.0.1) ───
  const ipv4Mapped = extractIPv4FromMappedIPv6(hostname);
  if (ipv4Mapped && isPrivateIPv4(ipv4Mapped)) {
    return {
      safe: false,
      reason: 'IPv4-mapped IPv6 address resolves to a private range.',
    };
  }

  return { safe: true };
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Returns `true` if `ip` matches a private / reserved IPv4 range.
 */
function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((re) => re.test(ip));
}

/**
 * Extracts the embedded IPv4 address from an IPv4-mapped IPv6
 * string like `::ffff:10.0.0.1`. Returns `null` if not mapped.
 */
function extractIPv4FromMappedIPv6(hostname: string): string | null {
  const match = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(hostname);
  return match ? match[1] : null;
}
