// ─────────────────────────────────────────────────────────────
// Architex — Certificate Chain Simulation  (SEC-020)
// ─────────────────────────────────────────────────────────────
//
// Simulates an X.509 certificate chain:
//   Server Certificate → Intermediate CA → Root CA
//
// Demonstrates how browsers verify certificate chains by
// walking from the server cert up to a trusted root,
// checking signatures and validity at each step.
//
// Also demonstrates failure scenarios: expired certificates
// and revoked certificates.
// ─────────────────────────────────────────────────────────────

export interface Certificate {
  /** Subject name (CN / organization). */
  subject: string;
  /** Issuer name — who signed this certificate. */
  issuer: string;
  /** ISO date string for validity start. */
  validFrom: string;
  /** ISO date string for validity end. */
  validTo: string;
  /** Public key fingerprint (hex, abbreviated). */
  publicKey: string;
  /** Signature from the issuer (hex, abbreviated). */
  signature: string;
}

export interface CertChainStep {
  cert: Certificate;
  /** Human-readable description of what happens at this step. */
  step: string;
  /** Whether this step passed validation. */
  valid: boolean;
}

// ── Helpers ─────────────────────────────────────────────────

function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
    if (i % 2 === 1 && i < length - 1) result += ":";
  }
  return result;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Certificate Factories ───────────────────────────────────

function makeRootCA(): Certificate {
  const now = new Date();
  const validFrom = new Date(now.getFullYear() - 10, 0, 1);
  const validTo = new Date(now.getFullYear() + 10, 11, 31);
  return {
    subject: "DigiTrust Global Root CA",
    issuer: "DigiTrust Global Root CA", // self-signed
    validFrom: formatDate(validFrom),
    validTo: formatDate(validTo),
    publicKey: randomHex(32),
    signature: randomHex(40),
  };
}

function makeIntermediateCA(rootSubject: string): Certificate {
  const now = new Date();
  const validFrom = new Date(now.getFullYear() - 3, 5, 15);
  const validTo = new Date(now.getFullYear() + 5, 5, 15);
  return {
    subject: "DigiTrust TLS Authority G3",
    issuer: rootSubject,
    validFrom: formatDate(validFrom),
    validTo: formatDate(validTo),
    publicKey: randomHex(32),
    signature: randomHex(40),
  };
}

function makeServerCert(intermediateSubject: string, domain?: string): Certificate {
  const now = new Date();
  const validFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const validTo = new Date(now.getFullYear() + 1, now.getMonth() - 6, 1);
  return {
    subject: domain ?? "api.example.com",
    issuer: intermediateSubject,
    validFrom: formatDate(validFrom),
    validTo: formatDate(validTo),
    publicKey: randomHex(32),
    signature: randomHex(40),
  };
}

function makeExpiredServerCert(intermediateSubject: string): Certificate {
  const now = new Date();
  const validFrom = new Date(now.getFullYear() - 2, 0, 1);
  const validTo = new Date(now.getFullYear() - 1, 0, 1);
  return {
    subject: "expired.example.com",
    issuer: intermediateSubject,
    validFrom: formatDate(validFrom),
    validTo: formatDate(validTo),
    publicKey: randomHex(32),
    signature: randomHex(40),
  };
}

// ── Simulation Functions ────────────────────────────────────

/**
 * Simulate a valid certificate chain verification.
 *
 * Returns steps for:
 *   1. Present server certificate
 *   2. Verify server cert signature using Intermediate CA public key
 *   3. Present intermediate CA certificate
 *   4. Verify intermediate cert signature using Root CA public key
 *   5. Present root CA certificate
 *   6. Root CA found in browser trust store — chain complete
 */
export function simulateCertificateChain(
  scenario: "valid" | "expired" | "revoked" = "valid",
): CertChainStep[] {
  const rootCA = makeRootCA();
  const intermediateCA = makeIntermediateCA(rootCA.subject);
  const serverCert =
    scenario === "expired"
      ? makeExpiredServerCert(intermediateCA.subject)
      : makeServerCert(intermediateCA.subject);

  const steps: CertChainStep[] = [];

  // Step 1: Server presents its certificate
  steps.push({
    cert: serverCert,
    step: `Server presents certificate for "${serverCert.subject}". Browser begins chain verification from the leaf certificate upward.`,
    valid: true,
  });

  // Step 2: Check server cert validity dates
  if (scenario === "expired") {
    steps.push({
      cert: serverCert,
      step: `Certificate validity check FAILED: "${serverCert.subject}" expired on ${serverCert.validTo}. The certificate is no longer valid and the connection should be rejected.`,
      valid: false,
    });
    // Show what would happen next if we continued
    steps.push({
      cert: serverCert,
      step: `Chain verification ABORTED. Browser displays ERR_CERT_DATE_INVALID. User sees a full-page security warning with option to proceed (not recommended).`,
      valid: false,
    });
    return steps;
  }

  steps.push({
    cert: serverCert,
    step: `Certificate validity dates OK: valid from ${serverCert.validFrom} to ${serverCert.validTo}. Proceed to verify the issuer signature.`,
    valid: true,
  });

  // Step 3: Verify server cert signature against intermediate CA
  if (scenario === "revoked") {
    steps.push({
      cert: serverCert,
      step: `Checking CRL/OCSP for "${serverCert.subject}": certificate has been REVOKED by the issuer "${serverCert.issuer}". Serial number found in Certificate Revocation List.`,
      valid: false,
    });
    steps.push({
      cert: serverCert,
      step: `Chain verification ABORTED. Browser displays ERR_CERT_REVOKED. This certificate was explicitly invalidated by the CA, typically due to key compromise or domain ownership change.`,
      valid: false,
    });
    return steps;
  }

  steps.push({
    cert: intermediateCA,
    step: `Verify server cert signature using Intermediate CA "${intermediateCA.subject}" public key. Signature check: HMAC(serverCert, intermediateCA.publicKey) matches — valid.`,
    valid: true,
  });

  // Step 4: Present intermediate CA
  steps.push({
    cert: intermediateCA,
    step: `Move up the chain to Intermediate CA "${intermediateCA.subject}". Issued by "${intermediateCA.issuer}". Valid from ${intermediateCA.validFrom} to ${intermediateCA.validTo}.`,
    valid: true,
  });

  // Step 5: Verify intermediate cert signature against root CA
  steps.push({
    cert: rootCA,
    step: `Verify intermediate cert signature using Root CA "${rootCA.subject}" public key. Signature check: valid. The intermediate CA is trusted.`,
    valid: true,
  });

  // Step 6: Root CA in trust store
  steps.push({
    cert: rootCA,
    step: `Root CA "${rootCA.subject}" found in browser/OS trust store (self-signed, issuer === subject). Certificate chain is complete and fully verified. TLS handshake may proceed.`,
    valid: true,
  });

  return steps;
}
