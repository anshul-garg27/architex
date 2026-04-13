'use client';

// ---------------------------------------------------------------------------
// GDPR Consent Banner (FND-017)
// ---------------------------------------------------------------------------
// Bottom-pinned banner that asks users for analytics/preferences consent.
// Preferences are persisted to localStorage. Analytics providers are only
// initialised after the user grants consent and DNT is not enabled.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type ConsentPreferences,
  acceptAll,
  declineAll,
  getStoredConsent,
  isDNTEnabled,
  storeConsent,
} from '@/lib/analytics/consent';
import {
  analytics,
  NoOpProvider,
  PostHogProvider,
} from '@/lib/analytics/analytics';

// ── Component ──────────────────────────────────────────────────────────────

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    preferences: false,
  });

  // On mount, check if consent was already given.
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      // Consent already recorded -- apply and stay hidden.
      applyConsent(stored);
    } else {
      // First visit (or cleared) -- show the banner.
      setVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Apply consent settings to analytics providers. */
  const applyConsent = useCallback((consent: ConsentPreferences) => {
    if (consent.analytics && !isDNTEnabled()) {
      analytics.init(new PostHogProvider());
    } else {
      analytics.init(new NoOpProvider());
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const consent = acceptAll();
    storeConsent(consent);
    applyConsent(consent);
    setVisible(false);
  }, [applyConsent]);

  const handleDeclineAll = useCallback(() => {
    const consent = declineAll();
    storeConsent(consent);
    applyConsent(consent);
    setVisible(false);
  }, [applyConsent]);

  const handleSavePreferences = useCallback(() => {
    const consent: ConsentPreferences = {
      essential: true,
      analytics: prefs.analytics,
      preferences: prefs.preferences,
    };
    storeConsent(consent);
    applyConsent(consent);
    setVisible(false);
  }, [prefs, applyConsent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 backdrop-blur-sm',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.1)]',
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* ── Main message ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use analytics to improve Architex. You can choose which types of
            data collection to allow.
          </p>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleDeclineAll}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium',
                'hover:bg-muted transition-colors',
              )}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences((v) => !v)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium',
                'hover:bg-muted transition-colors',
              )}
            >
              Manage Preferences
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className={cn(
                'rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
              )}
            >
              Accept
            </button>
          </div>
        </div>

        {/* ── Preferences panel (collapsible) ─────────────────────── */}
        {showPreferences && (
          <div className="flex flex-col gap-3 rounded-md border p-3">
            {/* Essential (always on) */}
            <label className="flex items-center justify-between text-sm">
              <span>
                <strong className="font-medium">Essential</strong>{' '}
                <span className="text-muted-foreground">
                  (always on)
                </span>
              </span>
              <input
                type="checkbox"
                checked
                disabled
                className="h-4 w-4 accent-primary"
              />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between text-sm">
              <span>
                <strong className="font-medium">Analytics</strong>{' '}
                <span className="text-muted-foreground">
                  -- usage data to improve the platform
                </span>
              </span>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, analytics: e.target.checked }))
                }
                className="h-4 w-4 accent-primary"
              />
            </label>

            {/* Preferences */}
            <label className="flex items-center justify-between text-sm">
              <span>
                <strong className="font-medium">Preferences</strong>{' '}
                <span className="text-muted-foreground">
                  -- remember theme and layout choices
                </span>
              </span>
              <input
                type="checkbox"
                checked={prefs.preferences}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, preferences: e.target.checked }))
                }
                className="h-4 w-4 accent-primary"
              />
            </label>

            <button
              type="button"
              onClick={handleSavePreferences}
              className={cn(
                'mt-1 self-end rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
              )}
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
