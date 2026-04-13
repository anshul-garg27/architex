// ---------------------------------------------------------------------------
// Consent Management (FND-017 / GDPR)
// ---------------------------------------------------------------------------
// Manages user consent preferences for analytics and preference cookies.
// Persists to localStorage and provides helpers for the ConsentBanner UI.
// ---------------------------------------------------------------------------

// ── Types ──────────────────────────────────────────────────────────────────

export interface ConsentPreferences {
  /** Essential cookies/features -- always on, cannot be disabled. */
  essential: true;

  /** Analytics tracking (PostHog, web vitals, etc.). */
  analytics: boolean;

  /** Non-essential preference storage (theme, layout prefs, etc.). */
  preferences: boolean;
}

export const CONSENT_STORAGE_KEY = 'architex_consent';

const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false,
  preferences: false,
};

// ── DNT Detection ──────────────────────────────────────────────────────────

/**
 * Returns `true` when the browser's Do-Not-Track header is enabled.
 */
export function isDNTEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;

  const dnt =
    // Standard
    navigator.doNotTrack ||
    // IE / old Edge
    (window as unknown as Record<string, unknown>).doNotTrack;

  return dnt === '1' || dnt === 'yes';
}

// ── Persistence ────────────────────────────────────────────────────────────

/**
 * Read the persisted consent from localStorage. Returns `null` if the user
 * has never interacted with the consent banner.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    // Basic shape validation
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'analytics' in (parsed as Record<string, unknown>) &&
      'preferences' in (parsed as Record<string, unknown>)
    ) {
      const p = parsed as Record<string, unknown>;
      return {
        essential: true,
        analytics: Boolean(p.analytics),
        preferences: Boolean(p.preferences),
      };
    }
  } catch {
    /* corrupted data -- treat as no consent */
  }

  return null;
}

/**
 * Persist consent preferences to localStorage.
 */
export function storeConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
}

/**
 * Remove stored consent (e.g. when user revokes).
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

// ── Convenience Builders ───────────────────────────────────────────────────

/** Accept all optional categories. */
export function acceptAll(): ConsentPreferences {
  return { essential: true, analytics: true, preferences: true };
}

/** Decline all optional categories. */
export function declineAll(): ConsentPreferences {
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Check whether the user has given analytics consent.
 * If DNT is enabled, analytics are always off regardless of stored value.
 */
export function hasAnalyticsConsent(): boolean {
  if (isDNTEnabled()) return false;
  const stored = getStoredConsent();
  return stored?.analytics ?? false;
}
