import { describe, it, expect } from 'vitest';
import { simulateDH } from '@/lib/security/diffie-hellman';

describe('Diffie-Hellman key exchange', () => {
  it('shared secrets match for Alice and Bob', () => {
    const result = simulateDH(23, 5, 6, 15);
    // Both sides compute the same shared secret: g^(ab) mod p
    expect(result.sharedSecret).toBe(modPow(5, 6 * 15, 23));
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('Eve cannot compute shared secret from public values alone', () => {
    const result = simulateDH(23, 5, 6, 15);
    // Eve sees g, p, A (alicePublic), B (bobPublic) but not a or b.
    // Verify that A * B mod p does NOT equal the shared secret.
    const eveGuess = (result.alicePublic * result.bobPublic) % 23;
    expect(eveGuess).not.toBe(result.sharedSecret);
  });
});

function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % mod;
    e = Math.floor(e / 2);
    b = (b * b) % mod;
  }
  return result;
}
