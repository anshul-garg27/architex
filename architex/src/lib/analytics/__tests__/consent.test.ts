import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  acceptAll,
  clearConsent,
  CONSENT_STORAGE_KEY,
  declineAll,
  getStoredConsent,
  hasAnalyticsConsent,
  isDNTEnabled,
  storeConsent,
} from '../consent';

// ---------------------------------------------------------------------------
// Consent Logic Tests
// ---------------------------------------------------------------------------

describe('Consent Management', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset navigator.doNotTrack to default
    Object.defineProperty(navigator, 'doNotTrack', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  // ── acceptAll / declineAll ───────────────────────────────────────────────

  describe('acceptAll()', () => {
    it('returns all categories enabled', () => {
      expect(acceptAll()).toEqual({
        essential: true,
        analytics: true,
        preferences: true,
      });
    });
  });

  describe('declineAll()', () => {
    it('returns only essential enabled', () => {
      expect(declineAll()).toEqual({
        essential: true,
        analytics: false,
        preferences: false,
      });
    });
  });

  // ── storeConsent / getStoredConsent ───────────────────────────────────────

  describe('storeConsent() + getStoredConsent()', () => {
    it('round-trips consent through localStorage', () => {
      const prefs = acceptAll();
      storeConsent(prefs);
      expect(getStoredConsent()).toEqual(prefs);
    });

    it('returns null when nothing is stored', () => {
      expect(getStoredConsent()).toBeNull();
    });

    it('returns null for corrupted JSON', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'not-valid-json');
      expect(getStoredConsent()).toBeNull();
    });

    it('returns null for JSON that does not match the expected shape', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
      expect(getStoredConsent()).toBeNull();
    });

    it('coerces truthy/falsy values to booleans', () => {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({ analytics: 1, preferences: 0 }),
      );
      const result = getStoredConsent();
      expect(result).toEqual({
        essential: true,
        analytics: true,
        preferences: false,
      });
    });
  });

  // ── clearConsent ─────────────────────────────────────────────────────────

  describe('clearConsent()', () => {
    it('removes the consent key from localStorage', () => {
      storeConsent(acceptAll());
      clearConsent();
      expect(getStoredConsent()).toBeNull();
    });
  });

  // ── DNT Detection ────────────────────────────────────────────────────────

  describe('isDNTEnabled()', () => {
    it('returns false when doNotTrack is not set', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isDNTEnabled()).toBe(false);
    });

    it('returns true when doNotTrack is "1"', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });
      expect(isDNTEnabled()).toBe(true);
    });

    it('returns true when doNotTrack is "yes"', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: 'yes',
        writable: true,
        configurable: true,
      });
      expect(isDNTEnabled()).toBe(true);
    });

    it('returns false when doNotTrack is "0"', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '0',
        writable: true,
        configurable: true,
      });
      expect(isDNTEnabled()).toBe(false);
    });
  });

  // ── hasAnalyticsConsent ──────────────────────────────────────────────────

  describe('hasAnalyticsConsent()', () => {
    it('returns false when no consent is stored', () => {
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('returns true when analytics consent is stored', () => {
      storeConsent(acceptAll());
      expect(hasAnalyticsConsent()).toBe(true);
    });

    it('returns false when analytics consent was declined', () => {
      storeConsent(declineAll());
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('returns false when DNT is enabled, even if consent was given', () => {
      storeConsent(acceptAll());
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });
      expect(hasAnalyticsConsent()).toBe(false);
    });
  });
});
