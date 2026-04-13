import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildCSP, generateNonce } from '../csp';
import { createRateLimiter, type RateLimiter } from '../rate-limiter';
import {
  sanitizeSVG,
  sanitizeMarkdown,
  sanitizeUserInput,
} from '../sanitize';
import { ALLOWED_ORIGINS, corsHeaders, applyCorsHeaders } from '../cors';

// ---------------------------------------------------------------------------
// CSP Builder
// ---------------------------------------------------------------------------

describe('CSP builder', () => {
  it('returns Content-Security-Policy header by default', () => {
    const { headerName } = buildCSP();
    expect(headerName).toBe('Content-Security-Policy');
  });

  it('returns Report-Only header when reportOnly is true', () => {
    const { headerName } = buildCSP({ reportOnly: true });
    expect(headerName).toBe('Content-Security-Policy-Report-Only');
  });

  it('includes nonce in script-src when provided', () => {
    const { headerValue } = buildCSP({ nonce: 'abc123' });
    expect(headerValue).toContain("'nonce-abc123'");
  });

  it('uses self-only script-src when no nonce provided', () => {
    const { headerValue } = buildCSP();
    expect(headerValue).toContain("script-src 'self'");
    expect(headerValue).not.toContain('nonce');
  });

  it('includes extra connect-src origins', () => {
    const { headerValue } = buildCSP({
      connectSrcExtra: ['https://api.example.com', 'wss://ws.example.com'],
    });
    expect(headerValue).toContain('https://api.example.com');
    expect(headerValue).toContain('wss://ws.example.com');
  });

  it('includes extra img-src origins', () => {
    const { headerValue } = buildCSP({
      imgSrcExtra: ['https://cdn.example.com'],
    });
    expect(headerValue).toContain('https://cdn.example.com');
  });

  it('includes report-uri when provided', () => {
    const { headerValue } = buildCSP({
      reportUri: 'https://report.example.com/csp',
    });
    expect(headerValue).toContain('report-uri https://report.example.com/csp');
  });

  it('does not include report-uri when not provided', () => {
    const { headerValue } = buildCSP();
    expect(headerValue).not.toContain('report-uri');
  });

  it('always includes security defaults', () => {
    const { headerValue } = buildCSP();
    expect(headerValue).toContain("default-src 'self'");
    expect(headerValue).toContain("frame-src 'none'");
    expect(headerValue).toContain("object-src 'none'");
    expect(headerValue).toContain("base-uri 'self'");
    expect(headerValue).toContain("frame-ancestors 'none'");
    expect(headerValue).toContain('upgrade-insecure-requests');
  });

  it('allows unsafe-inline for styles (Tailwind compatibility)', () => {
    const { headerValue } = buildCSP();
    expect(headerValue).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('generateNonce returns a non-empty base64 string', () => {
    const nonce = generateNonce();
    expect(nonce.length).toBeGreaterThan(0);
    // base64 characters only
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('generateNonce returns unique values', () => {
    const nonces = new Set(Array.from({ length: 20 }, () => generateNonce()));
    expect(nonces.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Rate Limiter (token depletion / refill / cleanup)
// ---------------------------------------------------------------------------

describe('rate limiter (consolidated)', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    limiter?.destroy();
    vi.useRealTimers();
  });

  // Token depletion
  it('depletes tokens and denies when empty', () => {
    limiter = createRateLimiter({ maxTokens: 2, refillRate: 1, refillInterval: 1000 });

    expect(limiter.checkLimit('k1').allowed).toBe(true);
    expect(limiter.checkLimit('k1').allowed).toBe(true);
    expect(limiter.checkLimit('k1').allowed).toBe(false);
    expect(limiter.checkLimit('k1').remaining).toBe(0);
  });

  // Token refill
  it('refills tokens after the interval', () => {
    limiter = createRateLimiter({ maxTokens: 1, refillRate: 1, refillInterval: 500 });

    limiter.checkLimit('k1'); // 1 -> 0
    expect(limiter.checkLimit('k1').allowed).toBe(false);

    vi.advanceTimersByTime(500);
    expect(limiter.checkLimit('k1').allowed).toBe(true);
  });

  // Cleanup of stale entries
  it('cleans up stale entries after threshold', () => {
    limiter = createRateLimiter({ maxTokens: 5, refillRate: 1, refillInterval: 1000 });

    limiter.checkLimit('ip-stale');
    expect(limiter.size()).toBe(1);

    // Advance past stale threshold + cleanup interval
    vi.advanceTimersByTime(200_000);
    expect(limiter.size()).toBe(0);
  });

  // Separate key tracking
  it('maintains separate buckets per key', () => {
    limiter = createRateLimiter({ maxTokens: 1, refillRate: 1, refillInterval: 10_000 });

    expect(limiter.checkLimit('a').allowed).toBe(true);
    expect(limiter.checkLimit('a').allowed).toBe(false);
    // Different key still has tokens
    expect(limiter.checkLimit('b').allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sanitizer – XSS strip, markdown clean
// ---------------------------------------------------------------------------

describe('sanitizer (XSS strip)', () => {
  it('strips script tags from SVG', () => {
    const result = sanitizeSVG('<svg><script>evil()</script><rect/></svg>');
    expect(result).not.toContain('<script');
    expect(result).toContain('<rect/>');
  });

  it('removes event handlers from SVG elements', () => {
    const result = sanitizeSVG('<svg><rect onerror="alert(1)" width="5"/></svg>');
    expect(result).not.toContain('onerror');
    expect(result).toContain('width="5"');
  });

  it('strips all HTML tags from markdown', () => {
    const result = sanitizeMarkdown('# Title\n<div><img src=x onerror=alert(1)></div>');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<img');
    expect(result).toContain('# Title');
  });

  it('neutralizes javascript: URIs in markdown', () => {
    const result = sanitizeMarkdown('[click](javascript:void(0))');
    expect(result).not.toContain('javascript:');
  });

  it('escapes HTML special chars in user input', () => {
    const result = sanitizeUserInput('<b>"Hello"</b>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).not.toContain('<b>');
  });

  it('preserves safe content in markdown', () => {
    const md = '**bold** and `code` and [link](https://safe.com)';
    const result = sanitizeMarkdown(md);
    expect(result).toContain('**bold**');
    expect(result).toContain('`code`');
    expect(result).toContain('https://safe.com');
  });
});

// ---------------------------------------------------------------------------
// CORS Config
// ---------------------------------------------------------------------------

describe('CORS config', () => {
  it('ALLOWED_ORIGINS includes localhost:3000', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:3000');
  });

  it('ALLOWED_ORIGINS includes production domain', () => {
    expect(ALLOWED_ORIGINS).toContain('https://architex.dev');
  });

  it('corsHeaders returns null for disallowed origin', () => {
    expect(corsHeaders('https://evil.com')).toBeNull();
  });

  it('corsHeaders returns null for undefined origin', () => {
    expect(corsHeaders(undefined)).toBeNull();
  });

  it('corsHeaders returns null for null origin', () => {
    expect(corsHeaders(null)).toBeNull();
  });

  it('corsHeaders returns correct headers for allowed origin', () => {
    const headers = corsHeaders('http://localhost:3000');
    expect(headers).not.toBeNull();
    expect(headers!['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    expect(headers!['Access-Control-Allow-Credentials']).toBe('true');
    expect(headers!.Vary).toBe('Origin');
  });

  it('corsHeaders includes standard methods', () => {
    const headers = corsHeaders('https://architex.dev');
    expect(headers!['Access-Control-Allow-Methods']).toContain('GET');
    expect(headers!['Access-Control-Allow-Methods']).toContain('POST');
    expect(headers!['Access-Control-Allow-Methods']).toContain('DELETE');
  });

  it('applyCorsHeaders sets headers on response object', () => {
    const store = new Map<string, string>();
    const response = { headers: { set: (k: string, v: string) => store.set(k, v) } };
    applyCorsHeaders(response, 'http://localhost:3000');

    expect(store.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(store.get('Vary')).toBe('Origin');
  });

  it('applyCorsHeaders does nothing for disallowed origin', () => {
    const store = new Map<string, string>();
    const response = { headers: { set: (k: string, v: string) => store.set(k, v) } };
    applyCorsHeaders(response, 'https://evil.com');

    expect(store.size).toBe(0);
  });
});
