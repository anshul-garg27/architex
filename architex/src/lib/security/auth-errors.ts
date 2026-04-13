// ─────────────────────────────────────────────────────────────
// Architex — Auth Error Messages  (SCR-021)
// ─────────────────────────────────────────────────────────────
//
// Generic error messages for authentication flows that do NOT
// reveal whether a given email address or username has an
// account. This prevents account-enumeration attacks where an
// attacker iterates over inputs to discover which ones are
// registered.
//
// Golden rule: every auth failure surface returns the same
// message regardless of the underlying cause.
// ─────────────────────────────────────────────────────────────

// ── Generic error constants ─────────────────────────────────

/**
 * Displayed on failed login — does not say whether the
 * account exists or the password was wrong.
 */
export const AUTH_ERROR_LOGIN =
  'Invalid email or password. Please check your credentials and try again.';

/**
 * Displayed when a user requests a password-reset link.
 * Always returns this message, even if no account exists for
 * the provided email.
 */
export const AUTH_ERROR_PASSWORD_RESET =
  'If an account with that email exists, we have sent a password reset link.';

/**
 * Displayed during registration when we cannot tell the user
 * the email is already taken (to avoid enumeration).
 * Use this only when strict enumeration protection is required;
 * many apps choose to reveal duplicate-email on signup.
 */
export const AUTH_ERROR_REGISTER =
  'Unable to complete registration. Please try again or use a different email address.';

/**
 * Displayed when email verification fails (expired / invalid token).
 */
export const AUTH_ERROR_VERIFY_EMAIL =
  'This verification link is invalid or has expired. Please request a new one.';

/**
 * Displayed when a magic-link or OTP login is requested.
 */
export const AUTH_ERROR_MAGIC_LINK =
  'If an account with that email exists, a sign-in link has been sent.';

/**
 * Displayed when an OAuth / social login fails.
 */
export const AUTH_ERROR_OAUTH =
  'Unable to sign in with this provider. Please try again.';

/**
 * Displayed when an account is locked due to too many failed attempts.
 */
export const AUTH_ERROR_ACCOUNT_LOCKED =
  'This account has been temporarily locked due to multiple failed login attempts. Please try again later.';

// ── Helper ──────────────────────────────────────────────────

export type AuthErrorCode =
  | 'login'
  | 'password_reset'
  | 'register'
  | 'verify_email'
  | 'magic_link'
  | 'oauth'
  | 'account_locked';

const ERROR_MAP: Record<AuthErrorCode, string> = {
  login: AUTH_ERROR_LOGIN,
  password_reset: AUTH_ERROR_PASSWORD_RESET,
  register: AUTH_ERROR_REGISTER,
  verify_email: AUTH_ERROR_VERIFY_EMAIL,
  magic_link: AUTH_ERROR_MAGIC_LINK,
  oauth: AUTH_ERROR_OAUTH,
  account_locked: AUTH_ERROR_ACCOUNT_LOCKED,
};

/**
 * Returns the generic user-facing message for a given auth error code.
 *
 * @param code  One of the predefined auth error codes
 * @returns     A user-safe error string that does not leak account existence
 */
export function getAuthErrorMessage(code: AuthErrorCode): string {
  return ERROR_MAP[code];
}
