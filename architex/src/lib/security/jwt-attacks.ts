// ─────────────────────────────────────────────────────────────
// Architex — JWT Attack Simulations  (SEC-010)
// ─────────────────────────────────────────────────────────────
//
// Educational demonstrations of common JWT vulnerabilities:
// 1. "none" algorithm attack
// 2. Token replay attack
// 3. Algorithm confusion (RS256 → HS256)
//
// Each simulation returns step-by-step explanations showing
// how the attack works, what the vulnerability is, and how
// to defend against it.
// ─────────────────────────────────────────────────────────────

import { toBase64Url } from "./jwt-engine";

// ── Types ─────────────────────────────────────────────────────

export interface JWTAttackStep {
  /** Human-readable description of this step. */
  description: string;
  /** The JWT token at this point (if applicable). */
  token?: string;
  /** Decoded header object (if applicable). */
  header?: Record<string, unknown>;
  /** Decoded payload object (if applicable). */
  payload?: Record<string, unknown>;
  /** What makes this vulnerable. */
  vulnerability: string;
  /** How to defend against it. */
  defense: string;
}

// ── Attack 1: "none" Algorithm ────────────────────────────────

/**
 * Simulate the "none" algorithm attack.
 *
 * Vulnerability: Some JWT libraries accept alg: "none", which
 * means no signature is required. An attacker can forge tokens
 * by setting the algorithm to "none" and stripping the signature.
 */
export function simulateNoneAlgorithm(): JWTAttackStep[] {
  const legitimateHeader = { alg: "HS256", typ: "JWT" };
  const legitimatePayload = {
    sub: "user-42",
    name: "Alice",
    role: "viewer",
    iat: 1700000000,
    exp: 1700003600,
  };

  const headerB64 = toBase64Url(JSON.stringify(legitimateHeader));
  const payloadB64 = toBase64Url(JSON.stringify(legitimatePayload));
  const legitimateToken = `${headerB64}.${payloadB64}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

  const forgedHeader = { alg: "none", typ: "JWT" };
  const forgedPayload = {
    sub: "user-42",
    name: "Alice",
    role: "admin",
    iat: 1700000000,
    exp: 1700003600,
  };

  const forgedHeaderB64 = toBase64Url(JSON.stringify(forgedHeader));
  const forgedPayloadB64 = toBase64Url(JSON.stringify(forgedPayload));
  const forgedToken = `${forgedHeaderB64}.${forgedPayloadB64}.`;

  return [
    {
      description:
        'Step 1: A legitimate JWT is issued by the server with alg: "HS256" and role: "viewer".',
      token: legitimateToken,
      header: legitimateHeader,
      payload: legitimatePayload,
      vulnerability: "The server may accept multiple algorithms including \"none\".",
      defense: "Whitelist allowed algorithms on the server side.",
    },
    {
      description:
        "Step 2: The attacker intercepts the token and decodes the header and payload (base64url is NOT encryption).",
      token: legitimateToken,
      header: legitimateHeader,
      payload: legitimatePayload,
      vulnerability: "JWT header and payload are only base64url-encoded, not encrypted. Anyone can read them.",
      defense: "Never store sensitive data in JWT payloads. Use JWE for encrypted tokens.",
    },
    {
      description:
        'Step 3: The attacker changes the header algorithm to "none" and modifies the payload (role: "viewer" -> "admin").',
      header: forgedHeader,
      payload: forgedPayload,
      vulnerability: 'The "none" algorithm tells the server to skip signature verification entirely.',
      defense: "Never accept \"none\" as a valid algorithm. Reject tokens without signatures.",
    },
    {
      description:
        "Step 4: The attacker removes the signature (leaving the trailing dot) and sends the forged token.",
      token: forgedToken,
      header: forgedHeader,
      payload: forgedPayload,
      vulnerability: "A vulnerable server sees alg: \"none\" and skips signature validation, accepting the forged token.",
      defense: "Always validate the signature regardless of the alg claim. Use a strict JWT library.",
    },
    {
      description:
        'Step 5: The vulnerable server accepts the token — the attacker now has admin privileges!',
      token: forgedToken,
      header: forgedHeader,
      payload: forgedPayload,
      vulnerability: "Privilege escalation: the attacker promoted themselves from viewer to admin without knowing the secret key.",
      defense: "Use allowlists for algorithms (e.g., only HS256). Validate signatures server-side. Use libraries that reject \"none\" by default.",
    },
  ];
}

// ── Attack 2: Token Replay ────────────────────────────────────

/**
 * Simulate a token replay attack.
 *
 * Vulnerability: A valid token can be reused by an attacker
 * if there are no replay protections like jti (JWT ID),
 * short expiration, or token binding.
 */
export function simulateTokenReplay(): JWTAttackStep[] {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "user-42",
    name: "Alice",
    action: "transfer",
    amount: 5000,
    iat: 1700000000,
    exp: 1700086400,
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const token = `${headerB64}.${payloadB64}.hmac_signature_abc123`;

  const improvedPayload = {
    ...payload,
    jti: "unique-txn-id-9f3a2b",
    exp: 1700000300,
    nbf: 1700000000,
  };

  return [
    {
      description:
        "Step 1: Alice authenticates and receives a JWT authorizing a $5,000 transfer. The token has a 24-hour expiration.",
      token,
      header,
      payload,
      vulnerability: "Long-lived tokens with no unique identifier (jti) can be reused multiple times.",
      defense: "Use short-lived tokens (minutes, not hours/days).",
    },
    {
      description:
        "Step 2: Alice sends the token to the server, and the transfer is processed successfully.",
      token,
      header,
      payload,
      vulnerability: "The server processes the action but does not track that this specific token has been used.",
      defense: "Maintain a server-side token allowlist or denylist to track used tokens.",
    },
    {
      description:
        "Step 3: An attacker (Eve) intercepts the token from the network (e.g., via packet sniffing or a compromised log).",
      token,
      header,
      payload,
      vulnerability: "JWTs transmitted without TLS can be intercepted. Even with TLS, tokens in logs or URLs are exposed.",
      defense: "Always use HTTPS/TLS. Never log full tokens. Never pass tokens in URL query parameters.",
    },
    {
      description:
        "Step 4: Eve replays the exact same token to the server. The server validates it (signature OK, not expired) and processes another $5,000 transfer!",
      token,
      header,
      payload,
      vulnerability: "The server has no way to distinguish a replayed token from the original — it is still technically valid.",
      defense: "Include a jti (JWT ID) claim and track used token IDs server-side.",
    },
    {
      description:
        "Step 5: Defense in depth — a properly secured token includes jti, short exp, and the server tracks used tokens.",
      header,
      payload: improvedPayload,
      vulnerability: "Without replay protection, every valid token is a reusable credential.",
      defense: "Use jti + server-side tracking, short expiration (5 min), one-time-use tokens for sensitive operations, and bind tokens to client IP/fingerprint.",
    },
  ];
}

// ── Attack 3: Algorithm Confusion (Key Confusion) ─────────────

/**
 * Simulate a JWT algorithm confusion attack (RS256 → HS256).
 *
 * Vulnerability: When a server uses RS256 (asymmetric), the
 * public key is used to verify. An attacker switches to HS256
 * (symmetric) and signs with the public key — which the server
 * then uses as the HMAC secret.
 */
export function simulateJWTConfusion(): JWTAttackStep[] {
  const rsaHeader = { alg: "RS256", typ: "JWT" };
  const payload = {
    sub: "user-42",
    name: "Alice",
    role: "viewer",
    iat: 1700000000,
    exp: 1700003600,
  };

  const headerB64 = toBase64Url(JSON.stringify(rsaHeader));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const rsaToken = `${headerB64}.${payloadB64}.RSA_SIGNATURE_WITH_PRIVATE_KEY`;

  const hsHeader = { alg: "HS256", typ: "JWT" };
  const forgedPayload = {
    sub: "user-42",
    name: "Alice",
    role: "admin",
    iat: 1700000000,
    exp: 1700003600,
  };

  const forgedHeaderB64 = toBase64Url(JSON.stringify(hsHeader));
  const forgedPayloadB64 = toBase64Url(JSON.stringify(forgedPayload));
  const forgedToken = `${forgedHeaderB64}.${forgedPayloadB64}.HMAC_SIGNED_WITH_PUBLIC_KEY`;

  return [
    {
      description:
        "Step 1: The server uses RS256 — it signs JWTs with a private key and verifies them with the corresponding public key.",
      token: rsaToken,
      header: rsaHeader,
      payload,
      vulnerability: "The server's public key is often publicly accessible (e.g., via a JWKS endpoint or in source code).",
      defense: "Never expose your verification configuration. Use typed key objects, not raw strings.",
    },
    {
      description:
        "Step 2: The attacker obtains the server's public key (it is public, after all) from the JWKS endpoint or documentation.",
      header: rsaHeader,
      payload,
      vulnerability: "The public key is meant to be public for RS256 — but it becomes dangerous if the server also accepts HS256.",
      defense: "Strictly enforce the expected algorithm per key. Do not accept alg from the token header blindly.",
    },
    {
      description:
        'Step 3: The attacker changes the header from RS256 to HS256 and modifies the payload (role: "viewer" -> "admin").',
      header: hsHeader,
      payload: forgedPayload,
      vulnerability: "If the server reads alg from the token, it may switch from RSA verification to HMAC verification.",
      defense: "Configure the server to use a fixed algorithm per key — ignore the token's alg claim.",
    },
    {
      description:
        "Step 4: The attacker signs the forged token using HMAC-SHA256 with the server's PUBLIC key as the HMAC secret.",
      token: forgedToken,
      header: hsHeader,
      payload: forgedPayload,
      vulnerability: "The server sees alg: HS256, so it uses its \"verification key\" (the public key) as the HMAC secret — and the signature matches!",
      defense: "Use asymmetric key objects (not raw strings) that refuse to perform HMAC operations.",
    },
    {
      description:
        'Step 5: The server validates the forged token successfully — the attacker has admin privileges!',
      token: forgedToken,
      header: hsHeader,
      payload: forgedPayload,
      vulnerability: "Algorithm confusion: the RSA public key was used as an HMAC secret because the server trusted the token's alg header.",
      defense: "Pin the algorithm server-side (never trust alg from the token). Use separate key objects for RSA vs HMAC. Use libraries that enforce key-algorithm binding.",
    },
  ];
}
