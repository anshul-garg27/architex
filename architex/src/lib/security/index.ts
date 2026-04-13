// ─────────────────────────────────────────────────────────────
// Architex — Security & Cryptography Module
// ─────────────────────────────────────────────────────────────
//
// Barrel export for all security simulations.
//
// This module provides interactive visualizations of:
// - OAuth 2.0 Authorization Code + PKCE flow
// - OAuth 2.0 Client Credentials flow
// - JWT encode / decode / validate lifecycle
// - Diffie-Hellman key exchange
// ─────────────────────────────────────────────────────────────

// ── OAuth 2.0 Flows ───────────────────────────────────────
export { simulateAuthCodePKCE, simulateClientCredentials } from './oauth-flows';
export type { OAuthStep } from './oauth-flows';

// ── JWT Engine ────────────────────────────────────────────
export {
  encodeJWT,
  decodeJWT,
  validateJWT,
  toBase64Url,
  fromBase64Url,
} from './jwt-engine';

// ── Diffie-Hellman Key Exchange ───────────────────────────
export { simulateDH, PAINT_ANALOGY } from './diffie-hellman';
export type { DHStep, DHResult } from './diffie-hellman';

// ── AES-128 Encryption Engine ────────────────────────────
export { aesEncrypt, parseHex, formatHex, toHex } from './aes-engine';
export type { AESState, AESSubStep } from './aes-engine';

// ── JWT Attack Simulations ───────────────────────────────
export {
  simulateNoneAlgorithm,
  simulateTokenReplay,
  simulateJWTConfusion,
} from './jwt-attacks';
export type { JWTAttackStep } from './jwt-attacks';

// ── HTTPS Full Flow ─────────────────────────────────────
export { simulateHTTPSFlow, HTTPS_PHASE_LABELS, HTTPS_PHASE_COLORS } from './https-flow';
export type { HTTPSStep } from './https-flow';

// ── Certificate Chain ───────────────────────────────────
export { simulateCertificateChain } from './cert-chain';
export type { Certificate, CertChainStep } from './cert-chain';

// ── Password Hashing ────────────────────────────────────
export { demonstrateBcrypt, demonstrateRainbowTable } from './password-hashing';
export type { HashingStep, RainbowTableEntry } from './password-hashing';

// ── Encryption Comparison ───────────────────────────────
export {
  simulateSymmetricEncryption,
  simulateAsymmetricEncryption,
  simulateHybridEncryption,
  ENCRYPTION_COLORS,
} from './encryption-comparison';
export type { EncryptionStep, EncryptionMode } from './encryption-comparison';

// ── CSP Builder  (SCR-005) ──────────────────────────────
export { buildCSP, generateNonce } from './csp';
export type { CSPOptions } from './csp';

// ── Rate Limiter  (SCR-006) ─────────────────────────────
export { createRateLimiter, getApiRateLimiter } from './rate-limiter';
export type { RateLimiterOptions, RateLimitResult, RateLimiter } from './rate-limiter';

// ── Sanitization Utilities  (SCR-007) ───────────────────
export {
  sanitizeSVG,
  sanitizeMarkdown,
  sanitizeUserInput,
  validatePostMessageOrigin,
} from './sanitize';

// ── CORS Configuration  (SCR-008) ──────────────────────
export { ALLOWED_ORIGINS, corsHeaders, applyCorsHeaders } from './cors';
export type { CORSHeaders } from './cors';

// ── CSRF Protection  (SCR-020) ─────────────────────────
export {
  generateCSRFToken,
  validateCSRFToken,
  buildCSRFCookie,
  isStateChangingMethod,
  withCSRF,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from './csrf';

// ── SSRF Prevention  (SCR-016) ─────────────────────────
export { validateURL } from './ssrf';
export type { SSRFValidationResult } from './ssrf';

// ── OAuth Redirect Validation  (SCR-013) ───────────────
export { validateRedirectURI } from './oauth';
export type { RedirectValidationResult } from './oauth';

// ── Auth Error Messages  (SCR-021) ─────────────────────
export {
  AUTH_ERROR_LOGIN,
  AUTH_ERROR_PASSWORD_RESET,
  AUTH_ERROR_REGISTER,
  AUTH_ERROR_VERIFY_EMAIL,
  AUTH_ERROR_MAGIC_LINK,
  AUTH_ERROR_OAUTH,
  AUTH_ERROR_ACCOUNT_LOCKED,
  getAuthErrorMessage,
} from './auth-errors';
export type { AuthErrorCode } from './auth-errors';
