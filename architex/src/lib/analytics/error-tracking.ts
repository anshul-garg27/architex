// ---------------------------------------------------------------------------
// Error Tracking Abstraction Layer (FND-018)
// ---------------------------------------------------------------------------
// Wraps error-reporting services (Sentry, console) behind a uniform interface
// and automatically scrubs PII before any data leaves the client.
// ---------------------------------------------------------------------------

// ── Types ──────────────────────────────────────────────────────────────────

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface Breadcrumb {
  category: string;
  message: string;
  level?: ErrorLevel;
  timestamp?: number;
  data?: Record<string, unknown>;
}

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: ErrorLevel;
}

export interface ErrorUser {
  id: string;
  email?: string;
  username?: string;
}

// ── Provider Interface ─────────────────────────────────────────────────────

export interface ErrorTracker {
  /** Capture an exception with optional context. */
  captureException(error: Error, context?: ErrorContext): void;

  /** Capture a plain message. */
  captureMessage(message: string, level?: ErrorLevel): void;

  /** Attach user information to subsequent reports. */
  setUser(user: ErrorUser | null): void;

  /** Add a breadcrumb for tracing. */
  addBreadcrumb(breadcrumb: Breadcrumb): void;
}

// ── PII Scrubbing ──────────────────────────────────────────────────────────

/** Keys whose values are always redacted. */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'creditcard',
  'card_number',
  'ssn',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
]);

/** Regex that matches common email patterns. */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Regex that matches JWT-like tokens (three base64 segments separated by dots). */
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/**
 * Recursively scrub PII from a value. Returns a new object/value --
 * the original is never mutated.
 */
export function scrubPII(value: unknown, depth = 0): unknown {
  // Guard against deeply nested / circular structures.
  if (depth > 10) return '[max depth]';

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, '[EMAIL_REDACTED]').replace(JWT_RE, '[TOKEN_REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubPII(item, depth + 1));
  }

  if (typeof value === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubPII(val, depth + 1);
      }
    }
    return scrubbed;
  }

  return value;
}

// ── Sentry Tracker (stub) ──────────────────────────────────────────────────

const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * Stub Sentry tracker.
 * - In development: logs to console.
 * - In production: no-ops (replaced by real Sentry SDK later).
 */
export class SentryTracker implements ErrorTracker {
  captureException(error: Error, context?: ErrorContext): void {
    const safeContext = context ? (scrubPII(context) as ErrorContext) : undefined;
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error('[Sentry:captureException]', error.message, safeContext);
    }
  }

  captureMessage(message: string, level: ErrorLevel = 'info'): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[Sentry:captureMessage:${level}]`, message);
    }
  }

  setUser(user: ErrorUser | null): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('[Sentry:setUser]', user ? { id: user.id } : null);
    }
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    const safe = scrubPII(breadcrumb) as Breadcrumb;
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('[Sentry:breadcrumb]', safe);
    }
  }
}

// ── Console Tracker ────────────────────────────────────────────────────────

/**
 * Logs everything to the browser/Node console. Useful for local development
 * and as a fallback when no external service is configured.
 */
export class ConsoleTracker implements ErrorTracker {
  captureException(error: Error, context?: ErrorContext): void {
    const safeContext = context ? (scrubPII(context) as ErrorContext) : undefined;
    // eslint-disable-next-line no-console
    console.error('[ErrorTracker:exception]', error.message, safeContext);
  }

  captureMessage(message: string, level: ErrorLevel = 'info'): void {
    const fn =
      level === 'fatal' || level === 'error'
        ? 'error'
        : level === 'warning'
          ? 'warn'
          : 'log';
    // eslint-disable-next-line no-console
    console[fn](`[ErrorTracker:${level}]`, message);
  }

  setUser(user: ErrorUser | null): void {
    // eslint-disable-next-line no-console
    console.log('[ErrorTracker:setUser]', user ? { id: user.id } : null);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    const safe = scrubPII(breadcrumb) as Breadcrumb;
    // eslint-disable-next-line no-console
    console.log('[ErrorTracker:breadcrumb]', safe);
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────

class ErrorTrackerManager {
  private tracker: ErrorTracker = new ConsoleTracker();

  /** Swap the underlying tracker at runtime. */
  init(tracker: ErrorTracker): void {
    this.tracker = tracker;
  }

  captureException(error: Error, context?: ErrorContext): void {
    this.tracker.captureException(error, context);
  }

  captureMessage(message: string, level?: ErrorLevel): void {
    this.tracker.captureMessage(message, level);
  }

  setUser(user: ErrorUser | null): void {
    this.tracker.setUser(user);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.tracker.addBreadcrumb(breadcrumb);
  }

  /** Returns the active tracker (useful for testing). */
  getTracker(): ErrorTracker {
    return this.tracker;
  }
}

/** Global error tracker singleton. */
export const errorTracker = new ErrorTrackerManager();
