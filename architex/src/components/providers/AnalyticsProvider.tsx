'use client';

// ---------------------------------------------------------------------------
// AnalyticsProvider -- PostHog analytics context provider (BIZ-004)
// ---------------------------------------------------------------------------
// Wraps the app tree to initialise PostHog analytics. When the PostHog
// SDK is not installed or the API key is missing, analytics calls are
// silently no-oped via the mock fallback in posthog.ts.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  initPostHog,
  track,
  identify,
  reset,
  page,
  featureFlag,
  optIn,
  optOut,
  hasOptedOut,
  isPostHogReady,
  type PostHogEventName,
} from '@/lib/analytics/posthog';

// ── Context value ────────────────────────────────────────────────────────

interface AnalyticsContextValue {
  track: (event: PostHogEventName | string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
  page: (name: string, properties?: Record<string, unknown>) => void;
  featureFlag: (flag: string) => boolean;
  optIn: () => void;
  optOut: () => void;
  hasOptedOut: () => boolean;
  isReady: () => boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track,
  identify,
  reset,
  page,
  featureFlag,
  optIn,
  optOut,
  hasOptedOut,
  isReady: isPostHogReady,
});

// ── Hook ─────────────────────────────────────────────────────────────────

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

// ── Provider ─────────────────────────────────────────────────────────────

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    // Attempt to connect the real PostHog SDK if available.
    // When the SDK is not installed, initPostHog() with no args
    // sets up the noop/dev-log fallback.
    const posthogKey =
      typeof process !== 'undefined'
        ? process.env?.NEXT_PUBLIC_POSTHOG_KEY
        : undefined;

    if (posthogKey) {
      // When PostHog is eventually installed, initialise here:
      //   import posthog from 'posthog-js';
      //   posthog.init(posthogKey, { api_host: '...' });
      //   initPostHog(posthog);
      //
      // For now, use the noop fallback.
      initPostHog();
    } else {
      initPostHog();
    }
  }, []);

  const value: AnalyticsContextValue = {
    track,
    identify,
    reset,
    page,
    featureFlag,
    optIn,
    optOut,
    hasOptedOut,
    isReady: isPostHogReady,
  };

  return (
    <AnalyticsContext value={value}>
      {children}
    </AnalyticsContext>
  );
}
