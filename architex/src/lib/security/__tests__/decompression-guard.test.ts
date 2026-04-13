import { describe, it, expect } from 'vitest';
import {
  validateCompressedSize,
  validateShareableLinkPayload,
  createStreamingGuard,
  DEFAULT_MAX_DECOMPRESSED_BYTES,
  MAX_DECOMPRESSION_RATIO,
} from '../decompression-guard';

describe('decompression-guard', () => {
  // ── validateCompressedSize ───────────────────────────────────

  describe('validateCompressedSize', () => {
    it('accepts a safe payload within all limits', () => {
      const result = validateCompressedSize(1000, 50_000);
      expect(result.safe).toBe(true);
      expect(result.ratio).toBe(50);
      expect(result.decompressedSize).toBe(50_000);
      expect(result.reason).toBeUndefined();
    });

    it('rejects a payload that exceeds the decompression ratio', () => {
      // ratio = 200_000 / 1000 = 200 > 100
      const result = validateCompressedSize(1000, 200_000);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('ratio');
      expect(result.ratio).toBe(200);
    });

    it('rejects a payload exactly at the ratio boundary + 1', () => {
      // ratio = 101 > 100
      const result = validateCompressedSize(100, 10_100);
      expect(result.safe).toBe(false);
      expect(result.ratio).toBeCloseTo(101);
    });

    it('accepts a payload at exactly the ratio boundary', () => {
      // ratio = 100 / 1 = 100, not greater than 100
      const result = validateCompressedSize(1, MAX_DECOMPRESSION_RATIO);
      expect(result.safe).toBe(true);
      expect(result.ratio).toBe(MAX_DECOMPRESSION_RATIO);
    });

    it('rejects a payload that exceeds the max decompressed size', () => {
      // large payload but low ratio
      const result = validateCompressedSize(
        500_000,
        2_000_000,
        DEFAULT_MAX_DECOMPRESSED_BYTES,
      );
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Decompressed size');
      expect(result.ratio).toBe(4);
    });

    it('accepts a payload at exactly the max decompressed size', () => {
      const result = validateCompressedSize(
        100_000,
        DEFAULT_MAX_DECOMPRESSED_BYTES,
      );
      expect(result.safe).toBe(true);
    });

    it('supports a custom max decompressed bytes parameter', () => {
      const customMax = 512;
      const result = validateCompressedSize(100, 600, customMax);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('600');
      expect(result.reason).toContain('512');
    });

    it('rejects zero compressed size', () => {
      const result = validateCompressedSize(0, 1000);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('positive');
      expect(result.ratio).toBe(Infinity);
    });

    it('rejects negative compressed size', () => {
      const result = validateCompressedSize(-1, 1000);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('positive');
    });

    it('rejects negative decompressed size', () => {
      const result = validateCompressedSize(100, -1);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('negative');
    });

    it('accepts zero decompressed size (empty payload)', () => {
      const result = validateCompressedSize(100, 0);
      expect(result.safe).toBe(true);
      expect(result.ratio).toBe(0);
    });

    it('checks ratio before absolute size', () => {
      // Both ratio and size are exceeded — ratio message should appear
      const result = validateCompressedSize(10, 2_000_000);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('ratio');
    });
  });

  // ── validateShareableLinkPayload ─────────────────────────────

  describe('validateShareableLinkPayload', () => {
    it('validates a Uint8Array compressed payload', () => {
      const compressed = new Uint8Array(500);
      const result = validateShareableLinkPayload(compressed, 10_000);
      expect(result.safe).toBe(true);
      expect(result.ratio).toBe(20);
    });

    it('rejects a shareable link with bomb-like ratio', () => {
      const compressed = new Uint8Array(10);
      const result = validateShareableLinkPayload(compressed, 500_000);
      expect(result.safe).toBe(false);
    });

    it('respects custom max bytes', () => {
      const compressed = new Uint8Array(100);
      const result = validateShareableLinkPayload(compressed, 300, 256);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('256');
    });
  });

  // ── createStreamingGuard ─────────────────────────────────────

  describe('createStreamingGuard', () => {
    it('allows chunks within the budget', () => {
      const guard = createStreamingGuard(1000);
      expect(guard.feed(10_000).safe).toBe(true);
      expect(guard.feed(10_000).safe).toBe(true);
      expect(guard.totalDecompressed).toBe(20_000);
    });

    it('rejects once the ratio is exceeded', () => {
      const guard = createStreamingGuard(100);
      // 100 * 101 = 10_100 which gives ratio 101 > 100
      const first = guard.feed(10_100);
      expect(first.safe).toBe(false);
      expect(first.reason).toContain('ratio');
    });

    it('rejects once absolute size is exceeded', () => {
      const guard = createStreamingGuard(100_000, 500);
      guard.feed(200);
      const result = guard.feed(400);
      expect(result.safe).toBe(false);
      expect(result.decompressedSize).toBe(600);
    });

    it('accumulates chunks correctly', () => {
      const guard = createStreamingGuard(10_000);
      guard.feed(1000);
      guard.feed(2000);
      guard.feed(3000);
      expect(guard.totalDecompressed).toBe(6000);
    });

    it('can be reset for reuse', () => {
      const guard = createStreamingGuard(1000);
      guard.feed(50_000);
      expect(guard.totalDecompressed).toBe(50_000);
      guard.reset();
      expect(guard.totalDecompressed).toBe(0);
      expect(guard.feed(1000).safe).toBe(true);
    });
  });

  // ── Constants ────────────────────────────────────────────────

  describe('constants', () => {
    it('DEFAULT_MAX_DECOMPRESSED_BYTES is 1 MB', () => {
      expect(DEFAULT_MAX_DECOMPRESSED_BYTES).toBe(1_048_576);
    });

    it('MAX_DECOMPRESSION_RATIO is 100', () => {
      expect(MAX_DECOMPRESSION_RATIO).toBe(100);
    });
  });
});
