import { describe, it, expect } from 'vitest';
import { encodeJWT, decodeJWT, validateJWT } from '@/lib/security/jwt-engine';

describe('JWT engine', () => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const secret = 'test-secret';

  it('encode/decode roundtrip preserves payload', () => {
    const payload = { sub: 'user-1', name: 'Alice' };
    const token = encodeJWT(header, payload, secret);
    const decoded = decodeJWT(token);
    expect(decoded.payload).toEqual(payload);
    expect(decoded.header).toEqual(header);
  });

  it('validation catches expired token', () => {
    const payload = { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 3600 };
    const token = encodeJWT(header, payload, secret);
    const result = validateJWT(token, secret);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('expired'))).toBe(true);
  });

  it('validation rejects tampered token', () => {
    const token = encodeJWT(header, { sub: 'user-1' }, secret);
    const result = validateJWT(token, 'wrong-secret');
    expect(result.valid).toBe(false);
  });
});
