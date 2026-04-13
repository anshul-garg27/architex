// ─────────────────────────────────────────────────────────────
// Architex — In-Memory Rate Limiter  (SCR-006)
// ─────────────────────────────────────────────────────────────
//
// Token-bucket rate limiter for API routes and middleware.
//
// Features:
// - Configurable max tokens, refill rate, and refill interval
// - Per-key tracking (IP, API key, user ID, etc.)
// - Automatic cleanup of expired/stale entries every 60 seconds
// - Zero external dependencies
// ─────────────────────────────────────────────────────────────

export interface RateLimiterOptions {
  /** Maximum number of tokens in the bucket. */
  maxTokens: number;
  /** Number of tokens added per refill cycle. */
  refillRate: number;
  /** Time between refill cycles in milliseconds. */
  refillInterval: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Remaining tokens after this check. */
  remaining: number;
  /** Unix timestamp (ms) when the bucket will next have a token. */
  resetAt: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimiter {
  /** Check (and consume one token from) the bucket for the given key. */
  checkLimit: (key: string) => RateLimitResult;
  /** Reset a specific key's bucket. */
  reset: (key: string) => void;
  /** Stop the background cleanup timer. */
  destroy: () => void;
  /** For testing: number of tracked keys. */
  size: () => number;
}

/**
 * Creates an in-memory token-bucket rate limiter.
 *
 * Each unique `key` (typically an IP address or API key) gets its own
 * bucket that starts full. Tokens are consumed on each `checkLimit` call
 * and refilled lazily based on elapsed time.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { maxTokens, refillRate, refillInterval } = options;
  const buckets = new Map<string, TokenBucket>();

  // Cleanup interval: remove entries that have been full for > 2 minutes
  // (meaning no requests from that key recently).
  const CLEANUP_INTERVAL_MS = 60_000;
  const STALE_THRESHOLD_MS = 120_000;

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      const elapsed = now - bucket.lastRefill;
      const refillCycles = Math.floor(elapsed / refillInterval);
      const projectedTokens = Math.min(maxTokens, bucket.tokens + refillCycles * refillRate);

      // If the bucket would be full and hasn't been touched in a while, drop it
      if (projectedTokens >= maxTokens && elapsed > STALE_THRESHOLD_MS) {
        buckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Prevent the timer from keeping Node processes alive
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }

  function refillBucket(bucket: TokenBucket, now: number): void {
    const elapsed = now - bucket.lastRefill;
    const refillCycles = Math.floor(elapsed / refillInterval);
    if (refillCycles > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + refillCycles * refillRate);
      bucket.lastRefill += refillCycles * refillInterval;
    }
  }

  function checkLimit(key: string): RateLimitResult {
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      buckets.set(key, bucket);
    }

    refillBucket(bucket, now);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: now + refillInterval,
      };
    }

    // Calculate when the next token will be available
    const timeUntilRefill = refillInterval - (now - bucket.lastRefill);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + timeUntilRefill,
    };
  }

  function reset(key: string): void {
    buckets.delete(key);
  }

  function destroy(): void {
    clearInterval(cleanupTimer);
    buckets.clear();
  }

  function size(): number {
    return buckets.size;
  }

  return { checkLimit, reset, destroy, size };
}

// ── Pre-configured limiters ──────────────────────────────────

/** Default API rate limiter: 100 requests per minute. */
let _apiLimiter: RateLimiter | null = null;

export function getApiRateLimiter(): RateLimiter {
  if (!_apiLimiter) {
    _apiLimiter = createRateLimiter({
      maxTokens: 100,
      refillRate: 10,
      refillInterval: 6_000, // 10 tokens every 6s = ~100/min
    });
  }
  return _apiLimiter;
}
