// ─────────────────────────────────────────────────────────────
// Architex — Content Security Policy Builder  (SCR-005)
// ─────────────────────────────────────────────────────────────
//
// Builds a Content-Security-Policy header string with sensible
// defaults for a Next.js + Tailwind application.
//
// - Nonce-based inline script allowlisting
// - Tailwind requires 'unsafe-inline' for styles
// - Strict connect-src limited to self + configured API origins
// - frame-src: 'none' by default (no iframes)
// - Optional report-only mode for testing in production
// ─────────────────────────────────────────────────────────────

export interface CSPOptions {
  /** A per-request nonce for inline script tags. */
  nonce?: string;
  /** Additional origins allowed in connect-src (e.g. API hosts). */
  connectSrcExtra?: string[];
  /** Additional origins allowed in img-src. */
  imgSrcExtra?: string[];
  /** When true, returns Content-Security-Policy-Report-Only instead. */
  reportOnly?: boolean;
  /** URI to send CSP violation reports to. */
  reportUri?: string;
}

/**
 * Builds a CSP directive string.
 *
 * @returns An object with `headerName` and `headerValue`.
 */
export function buildCSP(options: CSPOptions = {}): {
  headerName: string;
  headerValue: string;
} {
  const { nonce, connectSrcExtra = [], imgSrcExtra = [], reportOnly = false, reportUri } = options;

  // Dev mode needs 'unsafe-eval' (React callstack reconstruction) and
  // 'unsafe-inline' (Next.js injects inline scripts for HMR/routing that
  // can't receive the middleware nonce). Per CSP spec, 'unsafe-inline' is
  // IGNORED when a nonce is present, so in dev we skip the nonce entirely.
  const isDev = process.env.NODE_ENV === 'development';
  // Clerk needs its accounts domain for script loading + API calls
  const clerkDomain = '*.clerk.accounts.dev';

  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline' https: ${clerkDomain}`
    : nonce
      ? `'self' 'nonce-${nonce}' ${clerkDomain}`
      : `'self' ${clerkDomain}`;

  const directives: string[] = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://img.clerk.com${imgSrcExtra.length ? ' ' + imgSrcExtra.join(' ') : ''}`,
    `font-src 'self'`,
    `connect-src 'self' ${clerkDomain} https://api.clerk.com${connectSrcExtra.length ? ' ' + connectSrcExtra.join(' ') : ''}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  const headerName = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  return {
    headerName,
    headerValue: directives.join('; '),
  };
}

/**
 * Generates a cryptographically random nonce string (base64, 16 bytes).
 * Uses Math.random as a fallback when crypto.getRandomValues is unavailable
 * (e.g. in non-browser/non-Edge-Runtime environments).
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Convert to base64 using Buffer if available, otherwise manual encoding
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  return btoa(String.fromCharCode(...bytes));
}
