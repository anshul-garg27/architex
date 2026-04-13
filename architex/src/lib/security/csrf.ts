// ─────────────────────────────────────────────────────────────
// Architex — CSRF Protection  (SCR-020)
// ─────────────────────────────────────────────────────────────
//
// Double-submit cookie pattern: the server generates a random
// token, sets it as a cookie, and expects the client to send
// the same value in a request header. A cross-origin attacker
// cannot read the cookie, so they cannot forge the header.
//
// No server-side session storage is required.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

// ── Constants ───────────────────────────────────────────────

/** Name of the CSRF cookie. */
export const CSRF_COOKIE_NAME = '__csrf';

/** Name of the request header clients must send. */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** Token byte-length (32 bytes → 64 hex chars). */
const TOKEN_BYTE_LENGTH = 32;

/** Cookie max-age in seconds (2 hours). */
const COOKIE_MAX_AGE = 7200;

// ── Token generation ────────────────────────────────────────

/**
 * Generates a cryptographically random CSRF token (hex string).
 *
 * Uses `crypto.getRandomValues` which is available in both
 * Node.js >= 19 and Edge runtimes.
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Token validation ────────────────────────────────────────

/**
 * Returns `true` when:
 *  1. Both `cookieValue` and `headerValue` are non-empty strings.
 *  2. They are identical (constant-time comparison).
 *
 * @param cookieValue  The token read from the CSRF cookie
 * @param headerValue  The token read from the X-CSRF-Token header
 */
export function validateCSRFToken(
  cookieValue: string | null | undefined,
  headerValue: string | null | undefined,
): boolean {
  if (!cookieValue || !headerValue) return false;
  if (cookieValue.length !== headerValue.length) return false;

  // Constant-time comparison to prevent timing attacks
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Cookie helpers ──────────────────────────────────────────

/**
 * Builds a `Set-Cookie` header value for the CSRF token.
 *
 * The cookie is:
 * - `SameSite=Lax`  — sent on top-level navigations (needed for
 *   the client to read it), but not on cross-origin sub-requests.
 * - `Path=/`        — available site-wide.
 * - NOT `HttpOnly`  — the client JS must be able to read it so
 *   it can echo the value in the `X-CSRF-Token` header.
 * - `Secure` in production.
 */
export function buildCSRFCookie(token: string, secure = true): string {
  const parts = [
    `${CSRF_COOKIE_NAME}=${token}`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

// ── HTTP methods that require CSRF validation ───────────────

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Returns `true` if the HTTP method is state-changing and should
 * be protected by CSRF validation.
 */
export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

// ── Route-handler wrapper ───────────────────────────────────

type NextRouteHandler = (
  request: Request,
  context?: unknown,
) => Promise<Response> | Response;

/**
 * Wraps a Next.js API route handler with CSRF protection.
 *
 * For safe methods (GET, HEAD, OPTIONS) the handler runs
 * normally and a fresh CSRF cookie is set on the response.
 *
 * For state-changing methods (POST, PUT, PATCH, DELETE) the
 * wrapper validates the double-submit cookie before calling
 * the handler. If validation fails a 403 response is returned.
 *
 * @example
 * ```ts
 * export const POST = withCSRF(async (request) => {
 *   // … handler logic …
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */
export function withCSRF(handler: NextRouteHandler): NextRouteHandler {
  return async (request: Request, context?: unknown) => {
    const method = request.method.toUpperCase();

    // ── State-changing request → validate token ──────────
    if (isStateChangingMethod(method)) {
      const cookieHeader = request.headers.get('cookie') ?? '';
      const cookieValue = parseCookieValue(cookieHeader, CSRF_COOKIE_NAME);
      const headerValue = request.headers.get(CSRF_HEADER_NAME);

      if (!validateCSRFToken(cookieValue, headerValue)) {
        return NextResponse.json(
          { error: 'CSRF token missing or invalid.' },
          { status: 403 },
        );
      }
    }

    // ── Execute the wrapped handler ─────────────────────
    const response = await handler(request, context);

    // ── Attach a fresh CSRF cookie to every response ────
    const token = generateCSRFToken();
    const isSecure = new URL(request.url).protocol === 'https:';
    const setCookie = buildCSRFCookie(token, isSecure);

    // Clone into a NextResponse so we can append headers
    const next = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    next.headers.append('Set-Cookie', setCookie);
    return next;
  };
}

// ── Internal helpers ────────────────────────────────────────

/**
 * Extracts a named value from a raw `Cookie` header string.
 * Returns `null` if the cookie is not present.
 */
function parseCookieValue(
  cookieHeader: string,
  name: string,
): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}
