// ---------------------------------------------------------------------------
// Architex -- Student Tier Verification (BIZ-002)
// ---------------------------------------------------------------------------
// Verifies .edu email addresses for the Student tier. The Student tier
// gives Pro-equivalent access at no cost with annual re-verification.
// ---------------------------------------------------------------------------

// ── Known educational TLDs and domain patterns ───────────────────────────

/** Top-level domains recognised as educational. */
const EDU_TLDS = new Set([
  '.edu',
  '.edu.au',
  '.edu.br',
  '.edu.cn',
  '.edu.co',
  '.edu.eg',
  '.edu.gh',
  '.edu.hk',
  '.edu.in',
  '.edu.mx',
  '.edu.my',
  '.edu.ng',
  '.edu.pk',
  '.edu.pl',
  '.edu.sg',
  '.edu.tr',
  '.edu.tw',
  '.edu.uk',
  '.edu.za',
  '.ac.uk',
  '.ac.nz',
  '.ac.in',
  '.ac.jp',
  '.ac.kr',
  '.ac.za',
  '.ac.id',
  '.ac.th',
]);

/**
 * Additional domain suffixes that are known educational patterns
 * but don't fall under standard .edu TLDs.
 */
const EDU_PATTERNS = [
  '.university.',
  '.uni-',
  '.univ.',
  '.college.',
  '.school.',
  '.campus.',
  '.polytechnic.',
] as const;

// ── Public helpers ───────────────────────────────────────────────────────

/**
 * Check whether an email address belongs to a known educational domain.
 *
 * Checks:
 * 1. Standard .edu and international .edu.xx / .ac.xx TLDs
 * 2. Known educational domain patterns (e.g. *.university.*)
 */
export function isEduEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const normalised = email.trim().toLowerCase();
  const atIndex = normalised.lastIndexOf('@');
  if (atIndex === -1) return false;

  const domain = normalised.slice(atIndex + 1);
  if (!domain || !domain.includes('.')) return false;

  // Check exact TLD matches
  for (const tld of EDU_TLDS) {
    if (domain.endsWith(tld)) return true;
  }

  // Check pattern-based matches
  const domainWithDots = `.${domain}`;
  for (const pattern of EDU_PATTERNS) {
    if (domainWithDots.includes(pattern)) return true;
  }

  return false;
}

// ── Verification status ──────────────────────────────────────────────────

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'expired'
  | 'rejected';

export interface StudentVerificationState {
  email: string;
  status: VerificationStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
  token: string | null;
}

// ── Student Verification class ───────────────────────────────────────────

/** Duration before student verification expires (1 year in ms). */
const VERIFICATION_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Manages the student verification lifecycle.
 *
 * Flow:
 *   1. User submits their .edu email
 *   2. `requestVerification()` validates it and generates a token
 *   3. A verification email is sent (server-side, not handled here)
 *   4. `confirmVerification()` marks the email as verified
 *   5. After 1 year, `isExpired()` returns true and re-verification is needed
 */
export class StudentVerification {
  private state: StudentVerificationState;

  constructor(email?: string) {
    this.state = {
      email: email ?? '',
      status: 'unverified',
      verifiedAt: null,
      expiresAt: null,
      token: null,
    };
  }

  // ── Getters ────────────────────────────────────────────────

  getState(): Readonly<StudentVerificationState> {
    return { ...this.state };
  }

  getStatus(): VerificationStatus {
    // Automatically mark as expired if past expiry date
    if (
      this.state.status === 'verified' &&
      this.state.expiresAt &&
      new Date(this.state.expiresAt).getTime() < Date.now()
    ) {
      this.state.status = 'expired';
    }
    return this.state.status;
  }

  isVerified(): boolean {
    return this.getStatus() === 'verified';
  }

  isExpired(): boolean {
    return this.getStatus() === 'expired';
  }

  // ── Actions ────────────────────────────────────────────────

  /**
   * Request verification for a .edu email.
   * Returns a verification token on success, or throws on invalid email.
   */
  requestVerification(email: string): { token: string; email: string } {
    const normalised = email.trim().toLowerCase();

    if (!isEduEmail(normalised)) {
      this.state.status = 'rejected';
      this.state.email = normalised;
      throw new StudentVerificationError(
        'Please use a valid educational email address (.edu, .ac.uk, etc.).',
        'INVALID_EDU_EMAIL',
      );
    }

    const token = generateToken();

    this.state = {
      email: normalised,
      status: 'pending',
      verifiedAt: null,
      expiresAt: null,
      token,
    };

    return { token, email: normalised };
  }

  /**
   * Confirm verification with the token received via email.
   * Returns true if the token matches and verification succeeds.
   */
  confirmVerification(token: string): boolean {
    if (this.state.status !== 'pending') {
      throw new StudentVerificationError(
        'No pending verification to confirm.',
        'NO_PENDING_VERIFICATION',
      );
    }

    if (this.state.token !== token) {
      throw new StudentVerificationError(
        'Invalid verification token.',
        'INVALID_TOKEN',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_DURATION_MS);

    this.state = {
      ...this.state,
      status: 'verified',
      verifiedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      token: null,
    };

    return true;
  }

  /**
   * Reset verification state (e.g. for re-verification after expiry).
   */
  reset(): void {
    this.state = {
      email: this.state.email,
      status: 'unverified',
      verifiedAt: null,
      expiresAt: null,
      token: null,
    };
  }

  /**
   * Restore state from a serialised object (e.g. from localStorage/DB).
   */
  restore(state: StudentVerificationState): void {
    this.state = { ...state };
  }
}

// ── Error class ──────────────────────────────────────────────────────────

export type StudentVerificationErrorCode =
  | 'INVALID_EDU_EMAIL'
  | 'NO_PENDING_VERIFICATION'
  | 'INVALID_TOKEN';

export class StudentVerificationError extends Error {
  readonly code: StudentVerificationErrorCode;

  constructor(message: string, code: StudentVerificationErrorCode) {
    super(message);
    this.name = 'StudentVerificationError';
    this.code = code;
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────

function generateToken(): string {
  // In production this would use crypto.randomUUID() or a server-generated token.
  // This is a client-safe fallback for the demo/stub layer.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
