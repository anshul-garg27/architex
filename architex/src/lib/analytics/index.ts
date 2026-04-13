// ---------------------------------------------------------------------------
// Analytics barrel export
// ---------------------------------------------------------------------------

export {
  analytics,
  AnalyticsEvent,
  NoOpProvider,
  PostHogProvider,
  type AnalyticsEventName,
  type AnalyticsProvider,
} from './analytics';

export {
  errorTracker,
  scrubPII,
  ConsoleTracker,
  SentryTracker,
  type Breadcrumb,
  type ErrorContext,
  type ErrorLevel,
  type ErrorTracker,
  type ErrorUser,
} from './error-tracking';

export {
  observeWebVitals,
  rateMetric,
  reportWebVitals,
  WEB_VITAL_THRESHOLDS,
  type WebVitalMetric,
  type WebVitalName,
} from './web-vitals';

export {
  acceptAll,
  clearConsent,
  CONSENT_STORAGE_KEY,
  declineAll,
  getStoredConsent,
  hasAnalyticsConsent,
  isDNTEnabled,
  storeConsent,
  type ConsentPreferences,
} from './consent';
