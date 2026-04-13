// -----------------------------------------------------------------
// Architex -- Encryption Comparison Simulator  (SEC-015)
// -----------------------------------------------------------------
//
// Side-by-side simulation of three encryption paradigms:
//   1. Symmetric  (AES) -- same key encrypts and decrypts
//   2. Asymmetric (RSA) -- public key encrypts, private key decrypts
//   3. Hybrid     (TLS) -- RSA handshake to exchange an AES session key
//
// Each function returns an ordered list of EncryptionStep objects
// suitable for step-through animation in the SecurityModule canvas.
// -----------------------------------------------------------------

/** One discrete step in an encryption flow. */
export interface EncryptionStep {
  /** Monotonic step number (0-indexed). */
  tick: number;
  /** Current phase label (e.g. "Key Distribution", "Encrypt"). */
  phase: string;
  /** Who performs this action ("Alice", "Bob", "Both", "Network"). */
  actor: string;
  /** Data representation at this point (hex-like short string). */
  data: string;
  /** Human-readable description of what is happening. */
  description: string;
  /** Whether the data shown is in encrypted form. */
  encrypted: boolean;
}

export type EncryptionMode = "symmetric" | "asymmetric" | "hybrid";

// -----------------------------------------------------------------
// Colours per mode for the canvas legend
// -----------------------------------------------------------------

export const ENCRYPTION_COLORS: Record<EncryptionMode, string> = {
  symmetric: "#3b82f6",  // blue
  asymmetric: "#a855f7", // purple
  hybrid: "#10b981",     // emerald
};

// -----------------------------------------------------------------
// 1. Symmetric Encryption  (AES-style)
// -----------------------------------------------------------------

export function simulateSymmetricEncryption(): EncryptionStep[] {
  const sharedKey = "a3f1 9b2c";
  const plaintext = "Hello Bob!";
  const ciphertext = "7e2a c41f 9d8b";

  return [
    {
      tick: 0,
      phase: "Key Generation",
      actor: "Alice",
      data: sharedKey,
      encrypted: false,
      description:
        `Alice generates a shared secret key [${sharedKey}]. ` +
        `This same key will be used for both encryption and decryption.`,
    },
    {
      tick: 1,
      phase: "Key Distribution",
      actor: "Network",
      data: sharedKey,
      encrypted: false,
      description:
        `Alice must send the shared key to Bob over the network. ` +
        `PROBLEM: the key travels in the clear -- anyone listening can copy it. ` +
        `This is the fundamental weakness of pure symmetric encryption.`,
    },
    {
      tick: 2,
      phase: "Key Received",
      actor: "Bob",
      data: sharedKey,
      encrypted: false,
      description:
        `Bob receives the shared key [${sharedKey}]. ` +
        `Both parties now hold identical keys.`,
    },
    {
      tick: 3,
      phase: "Encrypt",
      actor: "Alice",
      data: `AES(${plaintext}, ${sharedKey})`,
      encrypted: false,
      description:
        `Alice encrypts the plaintext "${plaintext}" using AES with the shared key. ` +
        `AES is very fast -- millions of blocks per second on modern CPUs.`,
    },
    {
      tick: 4,
      phase: "Transmit Ciphertext",
      actor: "Network",
      data: ciphertext,
      encrypted: true,
      description:
        `The ciphertext [${ciphertext}] travels over the network. ` +
        `It is safe even if intercepted -- without the key it is meaningless.`,
    },
    {
      tick: 5,
      phase: "Decrypt",
      actor: "Bob",
      data: `AES_DEC(${ciphertext}, ${sharedKey})`,
      encrypted: false,
      description:
        `Bob decrypts with the same shared key to recover "${plaintext}". ` +
        `Decryption is equally fast because AES is a symmetric cipher.`,
    },
    {
      tick: 6,
      phase: "Result",
      actor: "Bob",
      data: plaintext,
      encrypted: false,
      description:
        `Bob reads "${plaintext}". ` +
        `SUMMARY: Symmetric encryption is fast but the key distribution problem means ` +
        `you need a secure channel to share the key first.`,
    },
  ];
}

// -----------------------------------------------------------------
// 2. Asymmetric Encryption  (RSA-style)
// -----------------------------------------------------------------

export function simulateAsymmetricEncryption(): EncryptionStep[] {
  const pubKey = "e=65537, n=...";
  const privKey = "d=..., n=...";
  const plaintext = "Hello Bob!";
  const ciphertext = "3c91 a8f0 d247 bb16";

  return [
    {
      tick: 0,
      phase: "Key Generation",
      actor: "Bob",
      data: `PUB[${pubKey}]  PRIV[${privKey}]`,
      encrypted: false,
      description:
        `Bob generates an RSA key pair: a public key and a private key. ` +
        `The private key is never shared with anyone.`,
    },
    {
      tick: 1,
      phase: "Publish Public Key",
      actor: "Network",
      data: pubKey,
      encrypted: false,
      description:
        `Bob publishes his public key openly. Anyone (including Alice) can obtain it. ` +
        `No security risk -- the public key can only encrypt, not decrypt.`,
    },
    {
      tick: 2,
      phase: "Public Key Received",
      actor: "Alice",
      data: pubKey,
      encrypted: false,
      description:
        `Alice obtains Bob's public key. She does NOT need the private key. ` +
        `This solves the key distribution problem of symmetric encryption.`,
    },
    {
      tick: 3,
      phase: "Encrypt",
      actor: "Alice",
      data: `RSA_ENC(${plaintext}, PUB)`,
      encrypted: false,
      description:
        `Alice encrypts "${plaintext}" with Bob's public key using RSA. ` +
        `RSA is ~1000x slower than AES because it relies on large number exponentiation.`,
    },
    {
      tick: 4,
      phase: "Transmit Ciphertext",
      actor: "Network",
      data: ciphertext,
      encrypted: true,
      description:
        `The ciphertext [${ciphertext}] travels over the network. ` +
        `Only Bob's private key can decrypt it -- even Alice cannot recover the plaintext now.`,
    },
    {
      tick: 5,
      phase: "Decrypt",
      actor: "Bob",
      data: `RSA_DEC(${ciphertext}, PRIV)`,
      encrypted: false,
      description:
        `Bob uses his private key to decrypt the ciphertext. ` +
        `This is also slow -- RSA decryption involves modular exponentiation of large primes.`,
    },
    {
      tick: 6,
      phase: "Result",
      actor: "Bob",
      data: plaintext,
      encrypted: false,
      description:
        `Bob reads "${plaintext}". ` +
        `SUMMARY: No key distribution problem, but RSA is far too slow ` +
        `for bulk data. Typically used only to exchange small secrets (like AES keys).`,
    },
  ];
}

// -----------------------------------------------------------------
// 3. Hybrid Encryption  (TLS-style)
// -----------------------------------------------------------------

export function simulateHybridEncryption(): EncryptionStep[] {
  const pubKey = "e=65537, n=...";
  const privKey = "d=..., n=...";
  const sessionKey = "b7e2 44f1";
  const encSessionKey = "9a3d f817 c2e0";
  const plaintext = "Hello Bob!";
  const ciphertext = "5f1a 88d3 c7e9";

  return [
    {
      tick: 0,
      phase: "RSA Key Generation",
      actor: "Bob",
      data: `PUB[${pubKey}]  PRIV[${privKey}]`,
      encrypted: false,
      description:
        `Bob generates an RSA key pair (done once, reused for many sessions). ` +
        `This is the same as pure asymmetric -- RSA provides the trust bootstrap.`,
    },
    {
      tick: 1,
      phase: "Publish Public Key",
      actor: "Network",
      data: pubKey,
      encrypted: false,
      description:
        `Bob publishes his public key (often via a TLS certificate signed by a CA). ` +
        `Alice can verify it is really Bob's key through the certificate chain.`,
    },
    {
      tick: 2,
      phase: "Generate Session Key",
      actor: "Alice",
      data: sessionKey,
      encrypted: false,
      description:
        `Alice generates a random AES session key [${sessionKey}]. ` +
        `This key is ephemeral -- used for this session only, then discarded.`,
    },
    {
      tick: 3,
      phase: "Encrypt Session Key (RSA)",
      actor: "Alice",
      data: `RSA_ENC(${sessionKey}, PUB)`,
      encrypted: false,
      description:
        `Alice encrypts the small AES session key with Bob's RSA public key. ` +
        `RSA is slow but the session key is tiny (~32 bytes), so this is acceptable.`,
    },
    {
      tick: 4,
      phase: "Transmit Encrypted Key",
      actor: "Network",
      data: encSessionKey,
      encrypted: true,
      description:
        `The RSA-encrypted session key [${encSessionKey}] travels over the network. ` +
        `Even if intercepted, only Bob's private key can unwrap it.`,
    },
    {
      tick: 5,
      phase: "Decrypt Session Key (RSA)",
      actor: "Bob",
      data: `RSA_DEC(${encSessionKey}, PRIV) = ${sessionKey}`,
      encrypted: false,
      description:
        `Bob decrypts with his private key to recover the AES session key [${sessionKey}]. ` +
        `Both Alice and Bob now share a symmetric key -- no key distribution problem!`,
    },
    {
      tick: 6,
      phase: "Encrypt Data (AES)",
      actor: "Alice",
      data: `AES(${plaintext}, ${sessionKey})`,
      encrypted: false,
      description:
        `Alice encrypts "${plaintext}" with AES using the shared session key. ` +
        `All bulk data is now encrypted at AES speed -- fast and efficient.`,
    },
    {
      tick: 7,
      phase: "Transmit Ciphertext (AES)",
      actor: "Network",
      data: ciphertext,
      encrypted: true,
      description:
        `The AES ciphertext [${ciphertext}] travels over the network. ` +
        `This is the normal data flow for the rest of the TLS session.`,
    },
    {
      tick: 8,
      phase: "Decrypt Data (AES)",
      actor: "Bob",
      data: `AES_DEC(${ciphertext}, ${sessionKey})`,
      encrypted: false,
      description:
        `Bob decrypts with the shared AES session key to recover "${plaintext}". ` +
        `Fast symmetric decryption for all subsequent messages.`,
    },
    {
      tick: 9,
      phase: "Result",
      actor: "Both",
      data: plaintext,
      encrypted: false,
      description:
        `Both parties communicate securely and efficiently. ` +
        `SUMMARY: Hybrid encryption uses RSA to solve the key distribution problem, ` +
        `then AES for fast bulk encryption. This is exactly how TLS/HTTPS works.`,
    },
  ];
}
