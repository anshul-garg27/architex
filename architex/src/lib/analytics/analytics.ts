// ---------------------------------------------------------------------------
// Analytics Abstraction Layer (FND-017)
// ---------------------------------------------------------------------------
// Provides a provider-based analytics abstraction. Concrete providers (PostHog,
// NoOp) can be swapped at runtime based on user consent and environment.
// ---------------------------------------------------------------------------

// ── Pre-defined Event Types ────────────────────────────────────────────────

export const AnalyticsEvent = {
  MODULE_VIEWED: 'module_viewed',
  CHALLENGE_STARTED: 'challenge_started',
  CHALLENGE_COMPLETED: 'challenge_completed',
  TEMPLATE_LOADED: 'template_loaded',
  SIMULATION_RUN: 'simulation_run',
  EXPORT_TRIGGERED: 'export_triggered',
  ALGORITHM_PLAYED: 'algorithm_played',
  DATA_STRUCTURE_EXPLORED: 'data_structure_explored',
  SEARCH_PERFORMED: 'search_performed',
  THEME_CHANGED: 'theme_changed',
  ERROR_BOUNDARY_HIT: 'error_boundary_hit',
  CONSENT_GRANTED: 'consent_granted',
  CONSENT_REVOKED: 'consent_revoked',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

// ── Provider Interface ─────────────────────────────────────────────────────

export interface AnalyticsProvider {
  /** Track a named event with optional properties. */
  track(event: string, properties?: Record<string, unknown>): void;

  /** Identify a user with optional traits. */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /** Record a page view. */
  page(name: string): void;

  /** Reset the current user session (e.g. on logout). */
  reset(): void;
}

// ── PostHog Provider (stub) ────────────────────────────────────────────────

const isDev = typeof process !== 'undefined'
  && process.env?.NODE_ENV === 'development';

/**
 * Stub PostHog provider.
 * - In development: logs every call to the console for debugging.
 * - In production: no-ops (will be replaced by the real PostHog SDK).
 */
export class PostHogProvider implements AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void {
    if (isDev) {
       
      console.log('[PostHog:track]', event, properties);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (isDev) {
       
      console.log('[PostHog:identify]', userId, traits);
    }
  }

  page(name: string): void {
    if (isDev) {
       
      console.log('[PostHog:page]', name);
    }
  }

  reset(): void {
    if (isDev) {
       
      console.log('[PostHog:reset]');
    }
  }
}

// ── NoOp Provider ──────────────────────────────────────────────────────────

/**
 * Silent provider used when the user has not consented to analytics.
 * Every method is a no-op.
 */
export class NoOpProvider implements AnalyticsProvider {
  track(): void {
    /* no-op */
  }
  identify(): void {
    /* no-op */
  }
  page(): void {
    /* no-op */
  }
  reset(): void {
    /* no-op */
  }
}

// ── Analytics Singleton ────────────────────────────────────────────────────

class Analytics {
  private provider: AnalyticsProvider = new NoOpProvider();

  /** Initialise (or swap) the underlying provider. */
  init(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  /** Track an event. Prefer using values from `AnalyticsEvent`. */
  track(event: string, properties?: Record<string, unknown>): void {
    this.provider.track(event, properties);
  }

  /** Identify the current user. */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.provider.identify(userId, traits);
  }

  /** Record a page view. */
  page(name: string): void {
    this.provider.page(name);
  }

  /** Reset the session (e.g. on logout). */
  reset(): void {
    this.provider.reset();
  }

  /** Returns the active provider (useful for testing). */
  getProvider(): AnalyticsProvider {
    return this.provider;
  }
}

/** Global analytics singleton. */
export const analytics = new Analytics();
