// ---------------------------------------------------------------------------
// Architex -- PostHog Integration Layer (BIZ-004)
// ---------------------------------------------------------------------------
// Provides track(), identify(), featureFlag() and more for PostHog analytics.
// When PostHog is not configured (no NEXT_PUBLIC_POSTHOG_KEY), all calls
// are no-ops. This allows the integration to exist without installing the
// PostHog SDK -- connect it when ready.
// ---------------------------------------------------------------------------

// ── Event catalog ────────────────────────────────────────────────────────

export const PostHogEvent = {
  PAGE_VIEW: 'page_view',
  SIMULATION_STARTED: 'simulation_started',
  SIMULATION_COMPLETED: 'simulation_completed',
  CHAOS_INJECTED: 'chaos_injected',
  TEMPLATE_LOADED: 'template_loaded',
  DESIGN_EXPORTED: 'design_exported',
  AI_FEATURE_USED: 'ai_feature_used',
  BRIDGE_CROSSED: 'bridge_crossed',
  CHALLENGE_ATTEMPTED: 'challenge_attempted',
  CHALLENGE_COMPLETED: 'challenge_completed',
  UPGRADE_PROMPTED: 'upgrade_prompted',
  UPGRADE_CLICKED: 'upgrade_clicked',
} as const;

export type PostHogEventName = (typeof PostHogEvent)[keyof typeof PostHogEvent];

// ── PostHog client interface ─────────────────────────────────────────────

interface PostHogClient {
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
  reset(): void;
  isFeatureEnabled(flag: string): boolean | undefined;
  getFeatureFlag(flag: string): string | boolean | undefined;
  onFeatureFlags(callback: () => void): void;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
  has_opted_out_capturing(): boolean;
}

// ── Global state ─────────────────────────────────────────────────────────

let _client: PostHogClient | null = null;
let _enabled = false;
let _optedOut = false;

const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

function log(method: string, ...args: unknown[]): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[PostHog:${method}]`, ...args);
  }
}

// ── Initialization ───────────────────────────────────────────────────────

/**
 * Initialize the PostHog integration.
 * Pass the real PostHog client instance when available, or call with
 * no arguments to use the noop/dev-log fallback.
 */
export function initPostHog(client?: PostHogClient): void {
  if (client) {
    _client = client;
    _enabled = true;
  } else {
    _client = null;
    _enabled = false;
  }
}

/**
 * Returns whether PostHog is currently initialised and active.
 */
export function isPostHogReady(): boolean {
  return _enabled && _client !== null && !_optedOut;
}

// ── Core API ─────────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 */
export function track(
  event: PostHogEventName | string,
  properties?: Record<string, unknown>,
): void {
  if (_optedOut) return;

  log('track', event, properties);

  if (_client) {
    _client.capture(event, properties);
  }
}

/**
 * Identify the current user with optional traits (tier, progress, etc.).
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (_optedOut) return;

  log('identify', userId, traits);

  if (_client) {
    _client.identify(userId, traits);
  }
}

/**
 * Reset the current user session (call on logout).
 */
export function reset(): void {
  log('reset');

  if (_client) {
    _client.reset();
  }
}

/**
 * Record a page view event.
 */
export function page(name: string, properties?: Record<string, unknown>): void {
  track(PostHogEvent.PAGE_VIEW, { page: name, ...properties });
}

// ── Feature Flags ────────────────────────────────────────────────────────

/**
 * Check if a feature flag is enabled for the current user.
 * Returns false when PostHog is not configured.
 */
export function featureFlag(flag: string): boolean {
  if (!_client || _optedOut) return false;
  return _client.isFeatureEnabled(flag) ?? false;
}

/**
 * Get the value of a feature flag (multi-variate support).
 * Returns undefined when PostHog is not configured.
 */
export function getFeatureFlagValue(flag: string): string | boolean | undefined {
  if (!_client || _optedOut) return undefined;
  return _client.getFeatureFlag(flag);
}

/**
 * Register a callback for when feature flags are loaded.
 */
export function onFeatureFlags(callback: () => void): void {
  if (_client) {
    _client.onFeatureFlags(callback);
  }
}

// ── Consent management ───────────────────────────────────────────────────

/**
 * Opt out of analytics tracking.
 */
export function optOut(): void {
  _optedOut = true;
  log('opt_out');

  if (_client) {
    _client.opt_out_capturing();
  }
}

/**
 * Opt back in to analytics tracking.
 */
export function optIn(): void {
  _optedOut = false;
  log('opt_in');

  if (_client) {
    _client.opt_in_capturing();
  }
}

/**
 * Check whether the user has opted out.
 */
export function hasOptedOut(): boolean {
  if (_client) {
    return _client.has_opted_out_capturing();
  }
  return _optedOut;
}
