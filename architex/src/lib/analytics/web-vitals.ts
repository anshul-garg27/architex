// ---------------------------------------------------------------------------
// Web Vitals Monitoring (FND-017)
// ---------------------------------------------------------------------------
// Tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and reports them through
// the analytics abstraction. Warns in dev when thresholds are exceeded.
// ---------------------------------------------------------------------------

import { analytics, AnalyticsEvent } from './analytics';

// ── Types ──────────────────────────────────────────────────────────────────

export type WebVitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export interface WebVitalMetric {
  /** The metric name (e.g. "LCP"). */
  name: WebVitalName;

  /** The metric value (ms for timing metrics, unitless for CLS). */
  value: number;

  /** Rating: "good", "needs-improvement", or "poor". */
  rating: 'good' | 'needs-improvement' | 'poor';

  /** A unique ID for this metric instance. */
  id: string;

  /** The navigation type that triggered the metric. */
  navigationType?: string;
}

// ── Thresholds ─────────────────────────────────────────────────────────────

export const WEB_VITAL_THRESHOLDS: Record<
  WebVitalName,
  { good: number; poor: number }
> = {
  LCP: { good: 2000, poor: 4000 },
  INP: { good: 150, poor: 500 },
  CLS: { good: 0.05, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

// ── Helpers ────────────────────────────────────────────────────────────────

const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * Determine the rating for a given metric value.
 */
export function rateMetric(
  name: WebVitalName,
  value: number,
): 'good' | 'needs-improvement' | 'poor' {
  const { good, poor } = WEB_VITAL_THRESHOLDS[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// ── Reporter ───────────────────────────────────────────────────────────────

/**
 * Report a single web-vital metric. Call this from the `web-vitals` library
 * callback or from a PerformanceObserver wrapper.
 *
 * ```ts
 * import { onLCP, onINP, onCLS } from 'web-vitals';
 * onLCP(reportWebVitals);
 * onINP(reportWebVitals);
 * onCLS(reportWebVitals);
 * ```
 */
export function reportWebVitals(metric: WebVitalMetric): void {
  const rating = rateMetric(metric.name, metric.value);

  analytics.track(AnalyticsEvent.SIMULATION_RUN, {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: rating,
    metric_id: metric.id,
    navigation_type: metric.navigationType,
    category: 'web_vitals',
  });

  if (isDev && rating !== 'good') {
    const threshold = WEB_VITAL_THRESHOLDS[metric.name].good;
    const unit = metric.name === 'CLS' ? '' : 'ms';
    // eslint-disable-next-line no-console
    console.warn(
      `[Web Vitals] ${metric.name} = ${metric.value}${unit} (threshold: ${threshold}${unit}) -- ${rating}`,
    );
  }
}

// ── Observer-based collection (no external deps) ───────────────────────────

/**
 * Start observing web vitals using the browser's PerformanceObserver API.
 * Returns a cleanup function to disconnect all observers.
 *
 * This is a lightweight alternative when the `web-vitals` npm package is not
 * available. It captures FCP, LCP, and TTFB. INP and CLS require the
 * `web-vitals` library for accurate measurement.
 */
export function observeWebVitals(): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {
      /* no-op */
    };
  }

  const observers: PerformanceObserver[] = [];

  // -- FCP ----------------------------------------------------------------
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          reportWebVitals({
            name: 'FCP',
            value: entry.startTime,
            rating: rateMetric('FCP', entry.startTime),
            id: `fcp-${Date.now()}`,
          });
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    observers.push(fcpObserver);
  } catch {
    /* observer not supported */
  }

  // -- LCP ----------------------------------------------------------------
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        reportWebVitals({
          name: 'LCP',
          value: last.startTime,
          rating: rateMetric('LCP', last.startTime),
          id: `lcp-${Date.now()}`,
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObserver);
  } catch {
    /* observer not supported */
  }

  // -- TTFB (from Navigation Timing) -------------------------------------
  try {
    const navEntries = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const ttfb = navEntries[0].responseStart;
      reportWebVitals({
        name: 'TTFB',
        value: ttfb,
        rating: rateMetric('TTFB', ttfb),
        id: `ttfb-${Date.now()}`,
      });
    }
  } catch {
    /* navigation timing not available */
  }

  return () => {
    for (const obs of observers) {
      obs.disconnect();
    }
  };
}
