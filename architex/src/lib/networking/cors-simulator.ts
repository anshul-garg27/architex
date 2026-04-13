import type { ProtocolTimelineEvent } from './shared-types';

// ─────────────────────────────────────────────────────────────
// Architex — CORS Flow Simulator
// ─────────────────────────────────────────────────────────────
//
// HOOK: At some point every developer stares at a CORS error —
// it works in Postman, fails in the browser. The confusion is
// not your fault: CORS is one of the web's most misunderstood
// mechanisms.
//
// KEY INSIGHT: CORS blocks READING the response, not SENDING
// the request. The request always reaches the server. Think of
// it like a doorman at an apartment building: the delivery truck
// (your request) always arrives and drops off the package. But
// the doorman checks a list before handing the package to the
// resident (your JavaScript). If your origin is not on the list,
// the package sits in the lobby and your code gets nothing.
//
// CORS is NOT a security mechanism against malicious servers —
// it is a backwards-compatible patch for the Same-Origin Policy
// that lets servers opt in to sharing their responses with
// specific cross-origin JavaScript.
//
// Simulates Cross-Origin Resource Sharing (CORS) request flows
// as defined in the Fetch specification (formerly W3C CORS).
//
// The simulation covers:
// - Same-origin check (no CORS needed).
// - Simple requests (GET, HEAD, POST with safe headers/Content-Type).
// - Preflighted requests (OPTIONS preflight for non-simple
//   methods, non-simple headers, or non-simple Content-Types).
// - Credentialed requests (cookies, Authorization header).
//   Note: credentials do NOT trigger preflight — they are
//   validated on the actual response.
// - Server-side validation of origins, methods, and headers.
//
// simulateCORS() returns an ordered list of CORSStep objects
// suitable for step-by-step playback visualization.
// ─────────────────────────────────────────────────────────────

/**
 * Configuration for the CORS request being made.
 */
export interface CORSConfig {
  /** Origin of the requesting page (e.g., "https://app.example.com"). */
  origin: string;
  /** Origin of the target server (e.g., "https://api.example.com"). */
  targetOrigin: string;
  /** HTTP method (e.g., "GET", "POST", "PUT", "DELETE"). */
  method: string;
  /** Custom headers included in the request. */
  headers: string[];
  /** Whether the request includes credentials (cookies, auth headers). */
  credentials: boolean;
}

/**
 * A single step in the CORS flow.
 *
 * Each step represents a browser-side check, a network request
 * (preflight OPTIONS), or a server response with its headers.
 */
export interface CORSStep extends ProtocolTimelineEvent {
  /**
   * Discriminator for the step type:
   * - `check-same-origin`: Browser checks if origins match.
   * - `check-simple-request`: Browser determines if preflight is needed.
   * - `preflight-options`: Browser sends OPTIONS preflight request.
   * - `preflight-response`: Server responds to preflight.
   * - `actual-request`: Browser sends the actual cross-origin request.
   * - `actual-response`: Server responds to the actual request.
   * - `error`: CORS violation — browser blocks the request.
   */
  type:
    | 'check-same-origin'
    | 'check-simple-request'
    | 'preflight-options'
    | 'preflight-response'
    | 'actual-request'
    | 'actual-response'
    | 'error';
  /** HTTP headers relevant to this step (request or response). */
  headers?: Record<string, string>;
  /** Whether this step succeeded or failed. */
  success: boolean;
}

// ── Constants ────────────────────────────────────────────────

/**
 * HTTP methods considered "simple" by the CORS specification.
 * Requests using only these methods (with simple headers) do NOT
 * trigger a preflight OPTIONS request.
 */
const SIMPLE_METHODS = new Set(['GET', 'HEAD', 'POST']);

/**
 * Request headers considered "CORS-safelisted" (simple headers).
 * Requests using only these headers do NOT trigger a preflight.
 * (Compared case-insensitively.)
 */
const SIMPLE_HEADERS = new Set([
  'accept',
  'accept-language',
  'content-language',
  'content-type',
]);

/**
 * Content-Type values that are considered "simple" for POST requests.
 * Other Content-Type values trigger a preflight.
 */
const SIMPLE_CONTENT_TYPES = new Set([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);

// ── Helpers ──────────────────────────────────────────────────

/** Extracts the origin (scheme + host + port) from a URL-like string. */
function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    // If not a valid URL, return as-is (for simple origin strings)
    return url;
  }
}

/** Case-insensitive check whether a header is in the simple-headers set. */
function isSimpleHeader(header: string): boolean {
  return SIMPLE_HEADERS.has(header.toLowerCase());
}

/**
 * Simulates a CORS request flow.
 *
 * The browser's CORS algorithm:
 * 1. Check if the request is same-origin (no CORS needed).
 * 2. If cross-origin, determine if it's a "simple" request.
 * 3. If not simple, send a preflight OPTIONS request.
 * 4. Validate the server's preflight response.
 * 5. If preflight passes, send the actual request.
 * 6. Validate the server's CORS headers on the actual response.
 * 7. If any check fails, block the request and report a CORS error.
 *
 * @param config - The cross-origin request configuration.
 * @param serverConfig - The server's CORS policy.
 * @returns Ordered list of CORS steps.
 *
 * @example
 * ```ts
 * const steps = simulateCORS(
 *   {
 *     origin: 'https://app.example.com',
 *     targetOrigin: 'https://api.example.com',
 *     method: 'PUT',
 *     headers: ['Content-Type', 'Authorization'],
 *     credentials: true,
 *   },
 *   {
 *     allowedOrigins: ['https://app.example.com'],
 *     allowedMethods: ['GET', 'POST', 'PUT'],
 *     allowedHeaders: ['Content-Type', 'Authorization'],
 *     allowCredentials: true,
 *     maxAge: 86400,
 *   },
 * );
 *
 * for (const step of steps) {
 *   console.log(`[${step.type}] ${step.success ? 'OK' : 'FAIL'}: ${step.description}`);
 * }
 * ```
 */
export function simulateCORS(
  config: CORSConfig,
  serverConfig: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    allowCredentials: boolean;
    maxAge: number;
  },
): CORSStep[] {
  const steps: CORSStep[] = [];
  let tick = 0;
  const requestOrigin = extractOrigin(config.origin);
  const targetOrigin = extractOrigin(config.targetOrigin);

  /** Helper to derive from/to based on step type. */
  function corsFromTo(type: CORSStep['type']): { from: string; to: string } {
    switch (type) {
      case 'check-same-origin':
      case 'check-simple-request':
      case 'error':
        return { from: 'Browser', to: 'Browser' };
      case 'preflight-options':
      case 'actual-request':
        return { from: 'Browser', to: 'Server' };
      case 'preflight-response':
      case 'actual-response':
        return { from: 'Server', to: 'Browser' };
    }
  }

  /** Push a CORSStep with auto-incrementing tick and computed from/to. */
  function pushStep(step: Omit<CORSStep, 'tick' | 'from' | 'to'>): void {
    tick++;
    const { from, to } = corsFromTo(step.type);
    steps.push({ tick, from, to, ...step });
  }

  // ── Step 1: Same-Origin Check ────────────────────────────

  const isSameOrigin = requestOrigin === targetOrigin;
  pushStep({
    type: 'check-same-origin',
    description: isSameOrigin
      ? `Same-origin request (${requestOrigin} === ${targetOrigin}). No CORS restrictions apply.`
      : `Cross-origin request detected: ${requestOrigin} -> ${targetOrigin}. CORS policy will be enforced.`,
    success: true,
  });

  if (isSameOrigin) {
    // Same-origin: no CORS needed, request proceeds normally.
    pushStep({
      type: 'actual-request',
      description: `Browser sends ${config.method} request directly. Same-origin requests bypass CORS entirely.`,
      headers: { Origin: requestOrigin },
      success: true,
    });
    pushStep({
      type: 'actual-response',
      description: 'Server responds normally. No CORS headers needed for same-origin requests.',
      success: true,
    });
    return steps;
  }

  // ── Step 2: Simple Request Check ─────────────────────────

  const isSimpleMethod = SIMPLE_METHODS.has(config.method.toUpperCase());
  const nonSimpleHeaders = config.headers.filter((h) => !isSimpleHeader(h));
  const hasOnlySimpleHeaders = nonSimpleHeaders.length === 0;

  // Check if POST has a non-simple Content-Type value.
  // Per the Fetch spec, POST requests with Content-Type values outside
  // application/x-www-form-urlencoded, multipart/form-data, and text/plain
  // MUST trigger a preflight request.
  const contentTypeHeader = config.headers.find(
    (h) => h.toLowerCase() === 'content-type',
  );
  // Look for a Content-Type value in the headers array. Headers may be
  // provided as "Content-Type" (name only) or "Content-Type: value".
  let hasNonSimpleContentType = false;
  if (contentTypeHeader) {
    // If a header entry contains a colon, extract the value after it.
    const colonIdx = contentTypeHeader.indexOf(':');
    if (colonIdx !== -1) {
      const ctValue = contentTypeHeader.slice(colonIdx + 1).trim().toLowerCase().split(';')[0].trim();
      hasNonSimpleContentType = ctValue !== '' && !SIMPLE_CONTENT_TYPES.has(ctValue);
    }
  }

  // Per the Fetch spec, credentials do NOT trigger a preflight.
  // A GET with cookies is still a simple request. Credentials are
  // validated on the actual response, not on the preflight decision.
  const isSimple = isSimpleMethod && hasOnlySimpleHeaders && !hasNonSimpleContentType;

  const simpleCheckReasons: string[] = [];
  if (!isSimpleMethod) {
    simpleCheckReasons.push(`Method "${config.method}" is not a simple method (GET, HEAD, POST)`);
  }
  if (!hasOnlySimpleHeaders) {
    simpleCheckReasons.push(`Non-simple headers: ${nonSimpleHeaders.join(', ')}`);
  }
  if (hasNonSimpleContentType) {
    simpleCheckReasons.push(
      `Content-Type is not a simple type (must be application/x-www-form-urlencoded, multipart/form-data, or text/plain to avoid preflight)`,
    );
  }

  pushStep({
    type: 'check-simple-request',
    description: isSimple
      ? `Simple request: ${config.method} with only safe headers and simple Content-Type. No preflight needed. Note: credentials (cookies) do NOT trigger preflight — they are checked on the actual response, not the preflight decision.`
      : `Preflight required. ${simpleCheckReasons.join('; ')}. Important: only non-simple methods, non-simple headers, and non-simple Content-Types cause preflight. Credentials alone do NOT trigger preflight.`,
    success: true,
  });

  // ── Step 3: Preflight (if needed) ────────────────────────

  if (!isSimple) {
    // Browser sends OPTIONS preflight
    const preflightRequestHeaders: Record<string, string> = {
      Origin: requestOrigin,
      'Access-Control-Request-Method': config.method,
    };
    // Include non-simple headers in the preflight. When Content-Type has
    // a non-simple value, the browser also includes it in the preflight
    // Access-Control-Request-Headers even though the header name itself
    // is CORS-safelisted.
    const preflightHeaders = hasNonSimpleContentType
      ? nonSimpleHeaders.some((h) => h.toLowerCase() === 'content-type')
        ? nonSimpleHeaders
        : [...nonSimpleHeaders, 'Content-Type']
      : nonSimpleHeaders;
    if (preflightHeaders.length > 0) {
      preflightRequestHeaders['Access-Control-Request-Headers'] =
        preflightHeaders.join(', ');
    }

    pushStep({
      type: 'preflight-options',
      description: [
        `Browser sends OPTIONS preflight to ${targetOrigin}.`,
        'This is an automatic browser behavior — your code never sees or triggers it.',
        'The preflight asks 3 questions: (1) Is my origin allowed? (2) Is my method allowed? (3) Are my headers allowed?',
        'If any answer is "no", the actual request is never sent.',
      ].join(' '),
      headers: preflightRequestHeaders,
      success: true,
    });

    // Server responds to preflight
    const originAllowed = serverConfig.allowedOrigins.includes('*') ||
      serverConfig.allowedOrigins.some(
        (o) => extractOrigin(o) === requestOrigin,
      );
    const methodAllowed = serverConfig.allowedMethods.some(
      (m) => m.toUpperCase() === config.method.toUpperCase(),
    );
    const headersAllowed = preflightHeaders.every((h) =>
      serverConfig.allowedHeaders.some(
        (ah) => ah.toLowerCase() === h.toLowerCase(),
      ),
    );
    const credentialsOk =
      !config.credentials || serverConfig.allowCredentials;

    // Wildcard origin cannot be used with credentials
    const wildcardWithCredentials =
      config.credentials && serverConfig.allowedOrigins.includes('*');

    const preflightPasses =
      originAllowed && methodAllowed && headersAllowed && credentialsOk && !wildcardWithCredentials;

    if (!preflightPasses) {
      // Build detailed error message
      const failures: string[] = [];
      if (!originAllowed) {
        failures.push(
          `Origin "${requestOrigin}" is not in the server's allowed origins [${serverConfig.allowedOrigins.join(', ')}]`,
        );
      }
      if (!methodAllowed) {
        failures.push(
          `Method "${config.method}" is not in allowed methods [${serverConfig.allowedMethods.join(', ')}]`,
        );
      }
      if (!headersAllowed) {
        const blocked = preflightHeaders.filter(
          (h) =>
            !serverConfig.allowedHeaders.some(
              (ah) => ah.toLowerCase() === h.toLowerCase(),
            ),
        );
        failures.push(
          `Headers [${blocked.join(', ')}] are not in allowed headers [${serverConfig.allowedHeaders.join(', ')}]`,
        );
      }
      if (!credentialsOk) {
        failures.push(
          'Request includes credentials but server does not set Access-Control-Allow-Credentials: true',
        );
      }
      if (wildcardWithCredentials) {
        failures.push(
          'Cannot use wildcard origin "*" with credentials. Server must specify the exact origin.',
        );
      }

      pushStep({
        type: 'preflight-response',
        description: [
          `Preflight FAILED: ${failures.join('. ')}.`,
          'The doorman checked the list and your origin does not match. Package rejected at the door.',
        ].join(' '),
        headers: buildServerResponseHeaders(serverConfig, requestOrigin, false),
        success: false,
      });

      pushStep({
        type: 'error',
        description: [
          'CORS ERROR: Preflight check failed.',
          'The browser blocks this cross-origin request entirely — the actual request is NEVER sent.',
          'Check the browser console for: "Access to XMLHttpRequest ... has been blocked by CORS policy".',
          'CORS is NOT a security mechanism against malicious servers — it is a backwards-compatible patch for the Same-Origin Policy that protects users from malicious scripts reading cross-origin data.',
        ].join(' '),
        success: false,
      });

      return steps;
    }

    // Preflight passes
    pushStep({
      type: 'preflight-response',
      description: [
        'Preflight OK. Server responds with appropriate CORS headers.',
        `Result cached for ${serverConfig.maxAge}s (Access-Control-Max-Age).`,
        'Browser will now send the actual request.',
      ].join(' '),
      headers: buildServerResponseHeaders(serverConfig, requestOrigin, true),
      success: true,
    });
  }

  // ── Step 4: Actual Request ───────────────────────────────

  const actualRequestHeaders: Record<string, string> = {
    Origin: requestOrigin,
  };
  for (const h of config.headers) {
    actualRequestHeaders[h] = '<value>';
  }
  if (config.credentials) {
    actualRequestHeaders['Cookie'] = '<session cookie>';
  }

  pushStep({
    type: 'actual-request',
    description: [
      `Browser sends the actual ${config.method} request to ${targetOrigin}.`,
      config.credentials
        ? 'Credentials (cookies) are included.'
        : 'No credentials included.',
      'Note: even though this request reaches the server and may modify data (POST, PUT, DELETE),',
      'the browser will hide the response from JavaScript if the CORS headers on the response are wrong.',
      'This is why CORS is not a substitute for server-side authorization.',
    ].join(' '),
    headers: actualRequestHeaders,
    success: true,
  });

  // ── Step 5: Actual Response Validation ───────────────────

  // Re-check origin on actual response (server must include CORS headers)
  const originAllowedActual =
    serverConfig.allowedOrigins.includes('*') ||
    serverConfig.allowedOrigins.some(
      (o) => extractOrigin(o) === requestOrigin,
    );
  const wildcardWithCredsActual =
    config.credentials && serverConfig.allowedOrigins.includes('*');

  if (!originAllowedActual || wildcardWithCredsActual) {
    pushStep({
      type: 'actual-response',
      description: [
        'Server responds, but CORS headers are missing or invalid.',
        'Browser blocks the response from reaching JavaScript.',
        'The request WAS sent (data MAY have been processed server-side), but the browser hides the response.',
      ].join(' '),
      headers: buildServerResponseHeaders(serverConfig, requestOrigin, false),
      success: false,
    });

    pushStep({
      type: 'error',
      description: [
        'CORS ERROR: Response blocked. The actual request was sent and the server processed it, but the browser will not expose the response to JavaScript.',
        'CORS is NOT a security mechanism against malicious servers — it is a backwards-compatible patch for the Same-Origin Policy.',
        'It protects users by preventing malicious scripts from reading sensitive data from other origins, not by preventing requests from being sent.',
      ].join(' '),
      success: false,
    });

    return steps;
  }

  // All checks pass
  const responseHeaders = buildServerResponseHeaders(
    serverConfig,
    requestOrigin,
    true,
  );

  pushStep({
    type: 'actual-response',
    description: [
      'Server responds with valid CORS headers.',
      'Browser allows JavaScript to read the response.',
      'Cross-origin request completed successfully.',
    ].join(' '),
    headers: responseHeaders,
    success: true,
  });

  return steps;
}

// ── Internal Helpers ─────────────────────────────────────────

/**
 * Builds the Access-Control-* response headers a server would send.
 */
function buildServerResponseHeaders(
  serverConfig: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    allowCredentials: boolean;
    maxAge: number;
  },
  requestOrigin: string,
  includeAll: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Access-Control-Allow-Origin
  if (serverConfig.allowedOrigins.includes('*') && !serverConfig.allowCredentials) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (
    serverConfig.allowedOrigins.some(
      (o) => extractOrigin(o) === requestOrigin,
    )
  ) {
    // Mirror the specific origin (required when credentials are used)
    headers['Access-Control-Allow-Origin'] = requestOrigin;
    headers['Vary'] = 'Origin';
  }

  if (includeAll) {
    headers['Access-Control-Allow-Methods'] =
      serverConfig.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] =
      serverConfig.allowedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = String(serverConfig.maxAge);

    if (serverConfig.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return headers;
}
