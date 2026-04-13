// ─────────────────────────────────────────────────────────────
// Architex — CORS Configuration  (SCR-008)
// ─────────────────────────────────────────────────────────────
//
// Centralised CORS headers for API routes.
//
// - Maintains an allow-list of origins
// - Returns appropriate headers for preflight and actual requests
// - Middleware helper that attaches CORS to NextResponse
// ─────────────────────────────────────────────────────────────

/**
 * Origins that are allowed to make cross-origin requests to our API.
 *
 * In production you would read from an environment variable;
 * these are sensible defaults for development and the hosted app.
 */
export const ALLOWED_ORIGINS: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://architex.dev',
  'https://www.architex.dev',
  ...(process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];

/**
 * Standard CORS methods and headers that the API supports.
 */
const CORS_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_HEADERS = 'Content-Type, Authorization, X-Requested-With';
const CORS_MAX_AGE = '86400'; // 24 hours

export interface CORSHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age': string;
  'Access-Control-Allow-Credentials': string;
  Vary: string;
}

/**
 * Returns CORS headers for the given request origin, or `null` if the
 * origin is not in the allow-list.
 *
 * @param origin  The value of the Origin request header
 * @returns       Headers object or null if origin is disallowed
 */
export function corsHeaders(origin: string | null | undefined): CORSHeaders | null {
  if (!origin) return null;
  if (!ALLOWED_ORIGINS.includes(origin)) return null;

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': CORS_HEADERS,
    'Access-Control-Max-Age': CORS_MAX_AGE,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

/**
 * Applies CORS headers to a NextResponse if the origin is allowed.
 *
 * @param response  The NextResponse to modify
 * @param origin    The request's Origin header value
 * @returns         The same response (mutated), for chaining
 */
export function applyCorsHeaders(
  response: { headers: { set(name: string, value: string): void } },
  origin: string | null | undefined,
): typeof response {
  const headers = corsHeaders(origin);
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }
  return response;
}
