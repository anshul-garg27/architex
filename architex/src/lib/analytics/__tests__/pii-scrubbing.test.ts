import { describe, it, expect } from 'vitest';
import { scrubPII } from '../error-tracking';

// ---------------------------------------------------------------------------
// PII Scrubbing Tests
// ---------------------------------------------------------------------------

describe('scrubPII', () => {
  // ── Email Redaction ──────────────────────────────────────────────────────

  it('redacts email addresses in plain strings', () => {
    const result = scrubPII('Contact user@example.com for help');
    expect(result).toBe('Contact [EMAIL_REDACTED] for help');
  });

  it('redacts multiple email addresses in a single string', () => {
    const result = scrubPII('alice@test.com and bob@test.org');
    expect(result).toBe('[EMAIL_REDACTED] and [EMAIL_REDACTED]');
  });

  it('redacts emails with subdomains', () => {
    const result = scrubPII('admin@sub.domain.co.uk');
    expect(result).toBe('[EMAIL_REDACTED]');
  });

  it('redacts emails with plus addressing', () => {
    const result = scrubPII('user+tag@example.com');
    expect(result).toBe('[EMAIL_REDACTED]');
  });

  // ── Token Redaction ──────────────────────────────────────────────────────

  it('redacts JWT-like tokens', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123_signature';
    const result = scrubPII(`Bearer ${jwt}`);
    expect(result).toBe('Bearer [TOKEN_REDACTED]');
  });

  // ── Sensitive Key Redaction ──────────────────────────────────────────────

  it('redacts values under sensitive keys (password)', () => {
    const result = scrubPII({ password: 'super-secret-123' });
    expect(result).toEqual({ password: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (token)', () => {
    const result = scrubPII({ token: 'abc-xyz' });
    expect(result).toEqual({ token: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (authorization)', () => {
    const result = scrubPII({ authorization: 'Bearer xxx' });
    expect(result).toEqual({ authorization: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (api_key)', () => {
    const result = scrubPII({ api_key: 'sk-12345' });
    expect(result).toEqual({ api_key: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (access_token)', () => {
    const result = scrubPII({ access_token: 'some-token-value' });
    expect(result).toEqual({ access_token: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (refresh_token)', () => {
    const result = scrubPII({ refresh_token: 'refresh-value' });
    expect(result).toEqual({ refresh_token: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (secret)', () => {
    const result = scrubPII({ secret: 'my-secret' });
    expect(result).toEqual({ secret: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (cookie)', () => {
    const result = scrubPII({ cookie: 'session=abc123' });
    expect(result).toEqual({ cookie: '[REDACTED]' });
  });

  it('redacts values under sensitive keys (ssn)', () => {
    const result = scrubPII({ ssn: '123-45-6789' });
    expect(result).toEqual({ ssn: '[REDACTED]' });
  });

  it('redacts sensitive keys case-insensitively', () => {
    const result = scrubPII({ PASSWORD: 'secret', Token: 'abc' });
    expect(result).toEqual({ PASSWORD: '[REDACTED]', Token: '[REDACTED]' });
  });

  // ── Nested Objects ───────────────────────────────────────────────────────

  it('scrubs PII in nested objects', () => {
    const result = scrubPII({
      user: {
        email: 'admin@example.com',
        password: 'hidden',
      },
      message: 'Logged in as admin@example.com',
    });
    expect(result).toEqual({
      user: {
        email: '[EMAIL_REDACTED]',
        password: '[REDACTED]',
      },
      message: 'Logged in as [EMAIL_REDACTED]',
    });
  });

  it('scrubs PII in arrays', () => {
    const result = scrubPII(['user@a.com', 'safe-string']);
    expect(result).toEqual(['[EMAIL_REDACTED]', 'safe-string']);
  });

  it('scrubs PII in arrays of objects', () => {
    const result = scrubPII([{ email: 'a@b.com', password: 'x' }]);
    expect(result).toEqual([{ email: '[EMAIL_REDACTED]', password: '[REDACTED]' }]);
  });

  // ── Depth Limit ──────────────────────────────────────────────────────────

  it('returns [max depth] for deeply nested structures', () => {
    // Build a 12-level deep object
    let obj: Record<string, unknown> = { value: 'deep' };
    for (let i = 0; i < 12; i++) {
      obj = { nested: obj };
    }
    const result = scrubPII(obj) as Record<string, unknown>;

    // Walk down to find the capped level
    let current: unknown = result;
    let depth = 0;
    while (typeof current === 'object' && current !== null && depth < 15) {
      const rec = current as Record<string, unknown>;
      if ('nested' in rec) {
        current = rec.nested;
        depth++;
      } else {
        break;
      }
    }
    expect(current).toBe('[max depth]');
  });

  // ── Passthrough ──────────────────────────────────────────────────────────

  it('passes through null and undefined', () => {
    expect(scrubPII(null)).toBeNull();
    expect(scrubPII(undefined)).toBeUndefined();
  });

  it('passes through numbers and booleans unchanged', () => {
    expect(scrubPII(42)).toBe(42);
    expect(scrubPII(true)).toBe(true);
  });

  it('passes through strings without PII unchanged', () => {
    expect(scrubPII('hello world')).toBe('hello world');
  });
});
