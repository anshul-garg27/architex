// ─────────────────────────────────────────────────────────────
// Architex — Diffie-Hellman Key Exchange Simulator  (SEC-014)
// ─────────────────────────────────────────────────────────────
//
// Educational implementation of the Diffie-Hellman key exchange
// using small primes for visualization.
//
// Includes the "paint mixing" analogy mapping: combining
// colours is easy but separating them is computationally hard.
// ─────────────────────────────────────────────────────────────

/** A single computation step in the DH exchange. */
export interface DHStep {
  /** Who performs this step. */
  actor: string;
  /** Mathematical computation shown. */
  computation: string;
  /** Numeric result of the computation. */
  result: number;
  /** Plain-English description of the step. */
  description: string;
}

/** Full result of a Diffie-Hellman key exchange simulation. */
export interface DHResult {
  /** Alice's public key: g^a mod p */
  alicePublic: number;
  /** Bob's public key: g^b mod p */
  bobPublic: number;
  /** The shared secret: g^(ab) mod p */
  sharedSecret: number;
  /** Ordered steps for playback. */
  steps: DHStep[];
}

/**
 * Modular exponentiation: (base^exp) mod mod.
 * Uses repeated squaring to keep numbers manageable.
 */
function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) {
      result = (result * b) % mod;
    }
    e = Math.floor(e / 2);
    b = (b * b) % mod;
  }
  return result;
}

/**
 * Simulate a complete Diffie-Hellman key exchange.
 *
 * @param p - Prime modulus (public)
 * @param g - Generator / primitive root (public)
 * @param a - Alice's private key
 * @param b - Bob's private key
 */
export function simulateDH(
  p: number,
  g: number,
  a: number,
  b: number,
): DHResult {
  const alicePublic = modPow(g, a, p);
  const bobPublic = modPow(g, b, p);
  const aliceShared = modPow(bobPublic, a, p);
  const bobShared = modPow(alicePublic, b, p);

  // Both should match
  const sharedSecret = aliceShared;

  const steps: DHStep[] = [
    // Step 1 — Agree on public parameters
    {
      actor: "Public",
      computation: `p = ${p}, g = ${g}`,
      result: 0,
      description:
        `Alice and Bob publicly agree on a prime number p = ${p} and a generator g = ${g}. ` +
        `These values are not secret — anyone (including Eve) can see them. ` +
        `Paint analogy: they agree on a common base colour that everyone knows.`,
    },

    // Step 2 — Alice chooses private key
    {
      actor: "Alice",
      computation: `a = ${a} (private, secret)`,
      result: a,
      description:
        `Alice picks her private key a = ${a} and keeps it secret. ` +
        `Paint analogy: Alice picks her own secret colour that nobody else knows.`,
    },

    // Step 3 — Bob chooses private key
    {
      actor: "Bob",
      computation: `b = ${b} (private, secret)`,
      result: b,
      description:
        `Bob picks his private key b = ${b} and keeps it secret. ` +
        `Paint analogy: Bob picks his own secret colour that nobody else knows.`,
    },

    // Step 4 — Alice computes public key
    {
      actor: "Alice",
      computation: `A = g^a mod p = ${g}^${a} mod ${p} = ${alicePublic}`,
      result: alicePublic,
      description:
        `Alice computes her public key A = ${g}^${a} mod ${p} = ${alicePublic} and sends it to Bob. ` +
        `Paint analogy: Alice mixes the common colour with her secret colour and sends the mixed result. ` +
        `Eve can see A = ${alicePublic} but cannot easily reverse the computation to find a.`,
    },

    // Step 5 — Bob computes public key
    {
      actor: "Bob",
      computation: `B = g^b mod p = ${g}^${b} mod ${p} = ${bobPublic}`,
      result: bobPublic,
      description:
        `Bob computes his public key B = ${g}^${b} mod ${p} = ${bobPublic} and sends it to Alice. ` +
        `Paint analogy: Bob mixes the common colour with his secret colour and sends the mixed result. ` +
        `Eve can see B = ${bobPublic} but cannot easily reverse the computation to find b.`,
    },

    // Step 6 — Alice computes shared secret
    {
      actor: "Alice",
      computation: `s = B^a mod p = ${bobPublic}^${a} mod ${p} = ${aliceShared}`,
      result: aliceShared,
      description:
        `Alice takes Bob's public key and raises it to her private key: ` +
        `${bobPublic}^${a} mod ${p} = ${aliceShared}. ` +
        `Paint analogy: Alice takes Bob's mixed colour and adds her secret colour — she now has all three colours combined.`,
    },

    // Step 7 — Bob computes shared secret
    {
      actor: "Bob",
      computation: `s = A^b mod p = ${alicePublic}^${b} mod ${p} = ${bobShared}`,
      result: bobShared,
      description:
        `Bob takes Alice's public key and raises it to his private key: ` +
        `${alicePublic}^${b} mod ${p} = ${bobShared}. ` +
        `Paint analogy: Bob takes Alice's mixed colour and adds his secret colour — he also has all three colours combined.`,
    },

    // Step 8 — Shared secret matches
    {
      actor: "Both",
      computation: `${aliceShared} == ${bobShared} => shared secret = ${sharedSecret}`,
      result: sharedSecret,
      description:
        `Both Alice and Bob now have the same shared secret = ${sharedSecret}. ` +
        `This works because (g^a)^b mod p = (g^b)^a mod p = g^(ab) mod p. ` +
        `Paint analogy: both mixed the same three colours (just in different order) — the result is identical.`,
    },
  ];

  return { alicePublic, bobPublic, sharedSecret, steps };
}

/** Mapping of DH concepts to the "paint mixing" analogy. */
export const PAINT_ANALOGY = {
  publicParams:
    "The common base colour that everyone can see (p, g).",
  alicePrivate:
    "Alice's secret colour — only she knows it (a).",
  bobPrivate:
    "Bob's secret colour — only he knows it (b).",
  alicePublic:
    "Alice's mix of the base colour + her secret colour, sent publicly (A = g^a mod p).",
  bobPublic:
    "Bob's mix of the base colour + his secret colour, sent publicly (B = g^b mod p).",
  sharedSecret:
    "The final combined colour from all three paints — impossible to separate back into components (s = g^ab mod p).",
  evesSight:
    "Eve can see the base colour, Alice's mix, and Bob's mix — but cannot combine them to get the shared secret without knowing a private colour.",
} as const;
