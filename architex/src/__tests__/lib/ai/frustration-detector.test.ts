import { describe, it, expect, vi } from 'vitest';
import {
  FrustrationDetector,
  type FrustrationLevel,
  type ActionType,
} from '@/lib/ai/frustration-detector';

describe('FrustrationDetector', () => {
  // ── Constructor & defaults ──────────────────────────────────

  describe('constructor', () => {
    it('starts at calm level with no actions', () => {
      const detector = new FrustrationDetector();
      expect(detector.getLevel()).toBe('calm');
      expect(detector.actionCount).toBe(0);
    });

    it('accepts a custom window size', () => {
      const detector = new FrustrationDetector(30_000);
      expect(detector.getLevel()).toBe('calm');
    });
  });

  // ── recordAction ────────────────────────────────────────────

  describe('recordAction', () => {
    it('increments action count', () => {
      const detector = new FrustrationDetector();
      detector.recordAction('interaction', 1000);
      detector.recordAction('interaction', 2000);
      expect(detector.actionCount).toBe(2);
    });

    it('accepts all valid action types', () => {
      const detector = new FrustrationDetector();
      const types: ActionType[] = [
        'undo', 'redo', 'failed-attempt', 'hint-used', 'pause', 'success', 'interaction',
      ];
      const base = 1000;
      for (let i = 0; i < types.length; i++) {
        detector.recordAction(types[i], base + i * 100);
      }
      expect(detector.actionCount).toBe(types.length);
    });
  });

  // ── getLevel thresholds ─────────────────────────────────────

  describe('getLevel', () => {
    it('returns calm with only interactions', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      for (let i = 0; i < 5; i++) {
        detector.recordAction('interaction', now + i * 1000);
      }
      expect(detector.getLevel(now + 5000)).toBe('calm');
    });

    it('returns mild after several undo/redo actions', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 4 undos * 2 points = 8, crosses mild threshold
      for (let i = 0; i < 4; i++) {
        detector.recordAction('undo', now + i * 10_000);
      }
      expect(detector.getLevel(now + 40_000)).toBe('mild');
    });

    it('returns frustrated after multiple failed attempts', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 5 failed-attempts * 4 points = 20, crosses frustrated threshold (18)
      for (let i = 0; i < 5; i++) {
        detector.recordAction('failed-attempt', now + i * 10_000);
      }
      expect(detector.getLevel(now + 50_000)).toBe('frustrated');
    });

    it('returns very-frustrated under heavy frustration signals', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 8 failed-attempts * 4 = 32, crosses very-frustrated threshold (30)
      for (let i = 0; i < 8; i++) {
        detector.recordAction('failed-attempt', now + i * 10_000);
      }
      expect(detector.getLevel(now + 80_000)).toBe('very-frustrated');
    });

    it('success actions reduce the score', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 4 undos = 8 points (mild)
      for (let i = 0; i < 4; i++) {
        detector.recordAction('undo', now + i * 10_000);
      }
      // 2 successes = -6 points => total 2, calm
      detector.recordAction('success', now + 50_000);
      detector.recordAction('success', now + 60_000);
      expect(detector.getLevel(now + 70_000)).toBe('calm');
    });

    it('score never goes below zero', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // Many successes
      for (let i = 0; i < 10; i++) {
        detector.recordAction('success', now + i * 1000);
      }
      expect(detector.getLevel(now + 11_000)).toBe('calm');
    });
  });

  // ── Time window ─────────────────────────────────────────────

  describe('time window', () => {
    it('ignores actions outside the 2-minute window', () => {
      const detector = new FrustrationDetector();
      const now = 200_000;
      // Add frustrated-level actions 3 minutes ago (outside window)
      for (let i = 0; i < 8; i++) {
        detector.recordAction('failed-attempt', now - 180_000 + i * 1000);
      }
      // Should be calm because those actions are outside the 2-min window
      expect(detector.getLevel(now)).toBe('calm');
    });

    it('uses custom window size', () => {
      const detector = new FrustrationDetector(10_000); // 10 second window
      const now = 100_000;
      // Add actions 15 seconds ago (outside the 10s window)
      for (let i = 0; i < 8; i++) {
        detector.recordAction('failed-attempt', now - 15_000 + i * 100);
      }
      expect(detector.getLevel(now)).toBe('calm');
    });
  });

  // ── Rapid undo/redo cycle bonus ─────────────────────────────

  describe('rapid undo/redo cycles', () => {
    it('adds bonus score for rapid undo/redo within 5 seconds', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 3 rapid undo/redo in 2 seconds (within 5s threshold)
      detector.recordAction('undo', now);
      detector.recordAction('redo', now + 500);
      detector.recordAction('undo', now + 1000);
      // Base: 3 * 2 = 6, + rapid bonus 5 = 11, crosses mild (8)
      const level = detector.getLevel(now + 2000);
      expect(level === 'mild' || level === 'frustrated').toBe(true);
    });

    it('no bonus when undo/redo are spread out', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      // 3 undos spread over 30 seconds (outside 5s rapid window)
      detector.recordAction('undo', now);
      detector.recordAction('redo', now + 15_000);
      detector.recordAction('undo', now + 30_000);
      // Base: 3 * 2 = 6, no rapid bonus => calm (below 8)
      expect(detector.getLevel(now + 35_000)).toBe('calm');
    });
  });

  // ── Auto-pause injection ────────────────────────────────────

  describe('auto-pause injection', () => {
    it('auto-injects a pause after 30s of inactivity', () => {
      const detector = new FrustrationDetector();
      detector.recordAction('interaction', 1000);
      // Next action 35 seconds later
      detector.recordAction('interaction', 36_000);
      // Should have 3 actions: interaction, auto-pause, interaction
      expect(detector.actionCount).toBe(3);
    });

    it('does not inject pause for short gaps', () => {
      const detector = new FrustrationDetector();
      detector.recordAction('interaction', 1000);
      detector.recordAction('interaction', 5000);
      expect(detector.actionCount).toBe(2);
    });
  });

  // ── onFrustrationChange callback ────────────────────────────

  describe('onFrustrationChange', () => {
    it('fires when level changes from calm to mild', () => {
      const detector = new FrustrationDetector();
      const callback = vi.fn();
      detector.onFrustrationChange(callback);

      const now = 100_000;
      // Push past mild threshold (8): 4 undos * 2 = 8
      for (let i = 0; i < 4; i++) {
        detector.recordAction('undo', now + i * 1000);
      }

      expect(callback).toHaveBeenCalledWith(
        'mild',
        'calm',
        expect.objectContaining({ level: 'mild' }),
      );
    });

    it('does not fire when level stays the same', () => {
      const detector = new FrustrationDetector();
      const callback = vi.fn();
      detector.onFrustrationChange(callback);

      const now = 100_000;
      detector.recordAction('interaction', now);
      detector.recordAction('interaction', now + 1000);
      detector.recordAction('interaction', now + 2000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribe stops callbacks', () => {
      const detector = new FrustrationDetector();
      const callback = vi.fn();
      const unsubscribe = detector.onFrustrationChange(callback);
      unsubscribe();

      const now = 100_000;
      for (let i = 0; i < 10; i++) {
        detector.recordAction('failed-attempt', now + i * 1000);
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it('fires multiple times as level escalates', () => {
      const detector = new FrustrationDetector();
      const levels: FrustrationLevel[] = [];
      detector.onFrustrationChange((newLevel) => {
        levels.push(newLevel);
      });

      const now = 100_000;
      // Gradually escalate: failed-attempt = 4 points each
      for (let i = 0; i < 10; i++) {
        detector.recordAction('failed-attempt', now + i * 5000);
      }

      // Should have crossed at least mild and frustrated
      expect(levels.length).toBeGreaterThanOrEqual(2);
      expect(levels).toContain('mild');
      expect(levels).toContain('frustrated');
    });
  });

  // ── getSnapshot ─────────────────────────────────────────────

  describe('getSnapshot', () => {
    it('returns correct action counts', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      detector.recordAction('undo', now);
      detector.recordAction('undo', now + 1000);
      detector.recordAction('failed-attempt', now + 2000);
      detector.recordAction('success', now + 3000);

      const snapshot = detector.getSnapshot(now + 4000);
      expect(snapshot.actionCounts.undo).toBe(2);
      expect(snapshot.actionCounts['failed-attempt']).toBe(1);
      expect(snapshot.actionCounts.success).toBe(1);
      expect(snapshot.actionCounts.redo).toBe(0);
    });

    it('includes the frustration score', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      detector.recordAction('failed-attempt', now);
      const snapshot = detector.getSnapshot(now + 1000);
      expect(snapshot.score).toBeGreaterThan(0);
    });

    it('includes window size', () => {
      const detector = new FrustrationDetector(60_000);
      const snapshot = detector.getSnapshot();
      expect(snapshot.windowMs).toBe(60_000);
    });
  });

  // ── reset ───────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all state', () => {
      const detector = new FrustrationDetector();
      const now = 100_000;
      for (let i = 0; i < 10; i++) {
        detector.recordAction('failed-attempt', now + i * 1000);
      }
      expect(detector.getLevel(now + 10_000)).not.toBe('calm');

      detector.reset();
      expect(detector.actionCount).toBe(0);
      expect(detector.getLevel()).toBe('calm');
    });
  });
});
