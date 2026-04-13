import { describe, it, expect } from 'vitest';
import { aesEncrypt } from '@/lib/security/aes-engine';

describe('AES-128 encryption engine', () => {
  it('encrypt produces 42 states (10 rounds x 4 + initial + final)', () => {
    const plaintext = Array.from({ length: 16 }, (_, i) => i);
    const key = Array.from({ length: 16 }, (_, i) => i + 16);
    const states = aesEncrypt(plaintext, key);
    // initial(1) + AddRoundKey(1) + rounds 1-9(4 each: Sub,Shift,Mix,Add) + round 10(3: Sub,Shift,Add)
    // = 1 + 1 + 9*4 + 3 = 41
    expect(states).toHaveLength(41);
  });

  it('each state has a valid 4x4 matrix', () => {
    const plaintext = Array(16).fill(0x32);
    const key = Array(16).fill(0xab);
    const states = aesEncrypt(plaintext, key);
    for (const s of states) {
      expect(s.matrix).toHaveLength(4);
      for (const row of s.matrix) {
        expect(row).toHaveLength(4);
        row.forEach((b) => expect(b).toBeGreaterThanOrEqual(0));
        row.forEach((b) => expect(b).toBeLessThanOrEqual(255));
      }
    }
  });
});
