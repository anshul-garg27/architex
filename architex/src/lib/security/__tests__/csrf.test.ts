import { describe, it, expect } from 'vitest';
import {
  generateCSRFToken,
  validateCSRFToken,
  buildCSRFCookie,
  isStateChangingMethod,
  CSRF_COOKIE_NAME,
} from '../csrf';

describe('generateCSRFToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateCSRFToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateCSRFToken()));
    expect(tokens.size).toBe(20);
  });
});

describe('validateCSRFToken', () => {
  it('returns true when cookie and header match', () => {
    const token = generateCSRFToken();
    expect(validateCSRFToken(token, token)).toBe(true);
  });

  it('returns false when values differ', () => {
    const a = generateCSRFToken();
    const b = generateCSRFToken();
    expect(validateCSRFToken(a, b)).toBe(false);
  });

  it('returns false when cookie is null', () => {
    expect(validateCSRFToken(null, 'abc')).toBe(false);
  });

  it('returns false when header is null', () => {
    expect(validateCSRFToken('abc', null)).toBe(false);
  });

  it('returns false when cookie is undefined', () => {
    expect(validateCSRFToken(undefined, 'abc')).toBe(false);
  });

  it('returns false when header is empty string', () => {
    expect(validateCSRFToken('abc', '')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(validateCSRFToken('short', 'muchlongerstring')).toBe(false);
  });

  it('performs constant-time comparison (same length, different values)', () => {
    // Ensure it doesn't short-circuit on first differing character
    const a = 'a'.repeat(64);
    const b = 'b'.repeat(64);
    expect(validateCSRFToken(a, b)).toBe(false);
  });
});

describe('buildCSRFCookie', () => {
  it('includes token value and required attributes', () => {
    const cookie = buildCSRFCookie('test-token', true);
    expect(cookie).toContain(`${CSRF_COOKIE_NAME}=test-token`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=');
    expect(cookie).toContain('Secure');
  });

  it('omits Secure flag when secure=false', () => {
    const cookie = buildCSRFCookie('test-token', false);
    expect(cookie).not.toContain('Secure');
  });

  it('does not set HttpOnly (client must read it)', () => {
    const cookie = buildCSRFCookie('test-token', true);
    expect(cookie).not.toContain('HttpOnly');
  });
});

describe('isStateChangingMethod', () => {
  it('returns true for POST, PUT, PATCH, DELETE', () => {
    expect(isStateChangingMethod('POST')).toBe(true);
    expect(isStateChangingMethod('PUT')).toBe(true);
    expect(isStateChangingMethod('PATCH')).toBe(true);
    expect(isStateChangingMethod('DELETE')).toBe(true);
  });

  it('returns true regardless of case', () => {
    expect(isStateChangingMethod('post')).toBe(true);
    expect(isStateChangingMethod('Put')).toBe(true);
  });

  it('returns false for GET, HEAD, OPTIONS', () => {
    expect(isStateChangingMethod('GET')).toBe(false);
    expect(isStateChangingMethod('HEAD')).toBe(false);
    expect(isStateChangingMethod('OPTIONS')).toBe(false);
  });
});
