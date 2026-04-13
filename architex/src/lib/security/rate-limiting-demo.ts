// ─────────────────────────────────────────────────────────────
// Architex — Rate Limiting Algorithm Comparison  (SEC-011)
// ─────────────────────────────────────────────────────────────
//
// Simulates three common rate-limiting algorithms side by side:
// Token Bucket, Sliding Window, and Leaky Bucket.
//
// Each function accepts a request pattern and returns a sequence
// of steps showing whether each request is allowed or denied.
// ─────────────────────────────────────────────────────────────

export interface RateLimitStep {
  /** The timestamp/tick of this event. */
  tick: number;
  /** Which algorithm produced this step. */
  algorithm: string;
  /** The request number (1-indexed). */
  request: number;
  /** Whether the request was allowed through. */
  allowed: boolean;
  /** Current token count (Token Bucket / Leaky Bucket). */
  tokens?: number;
  /** Current count in window (Sliding Window). */
  windowCount?: number;
  /** Human-readable description of what happened. */
  description: string;
}

// ── Token Bucket ──────────────────────────────────────────

/**
 * Simulates the Token Bucket algorithm.
 *
 * - Bucket starts full at `capacity` tokens
 * - Each request consumes 1 token
 * - Tokens refill at `refillRate` tokens per tick
 * - If bucket is empty, request is rejected
 *
 * @param capacity   Maximum tokens in the bucket
 * @param refillRate Tokens added per tick between requests
 * @param requests   Array of tick timestamps when requests arrive
 */
export function simulateTokenBucket(
  capacity: number,
  refillRate: number,
  requests: number[],
): RateLimitStep[] {
  const steps: RateLimitStep[] = [];
  let tokens = capacity;
  let lastTick = 0;

  for (let i = 0; i < requests.length; i++) {
    const tick = requests[i];

    // Refill tokens based on elapsed time
    const elapsed = tick - lastTick;
    const refilled = elapsed * refillRate;
    tokens = Math.min(capacity, tokens + refilled);
    lastTick = tick;

    if (tokens >= 1) {
      tokens -= 1;
      steps.push({
        tick,
        algorithm: "Token Bucket",
        request: i + 1,
        allowed: true,
        tokens: Math.round(tokens * 100) / 100,
        description:
          `Request #${i + 1} at t=${tick}: ALLOWED. ` +
          `Consumed 1 token, ${tokens.toFixed(1)} remaining ` +
          `(refilled ${refilled.toFixed(1)} since last request).`,
      });
    } else {
      steps.push({
        tick,
        algorithm: "Token Bucket",
        request: i + 1,
        allowed: false,
        tokens: Math.round(tokens * 100) / 100,
        description:
          `Request #${i + 1} at t=${tick}: DENIED. ` +
          `Bucket empty (${tokens.toFixed(1)} tokens). ` +
          `Need to wait for refill at ${refillRate}/tick.`,
      });
    }
  }

  return steps;
}

// ── Sliding Window ────────────────────────────────────────

/**
 * Simulates the Sliding Window Log algorithm.
 *
 * - Maintains a log of request timestamps
 * - For each request, removes entries older than `windowMs`
 * - If count within window < maxRequests, request is allowed
 *
 * @param windowMs    Window size in ticks
 * @param maxRequests Maximum requests allowed per window
 * @param requests    Array of tick timestamps when requests arrive
 */
export function simulateSlidingWindow(
  windowMs: number,
  maxRequests: number,
  requests: number[],
): RateLimitStep[] {
  const steps: RateLimitStep[] = [];
  const log: number[] = [];

  for (let i = 0; i < requests.length; i++) {
    const tick = requests[i];

    // Remove entries outside the window
    while (log.length > 0 && log[0] <= tick - windowMs) {
      log.shift();
    }

    if (log.length < maxRequests) {
      log.push(tick);
      steps.push({
        tick,
        algorithm: "Sliding Window",
        request: i + 1,
        allowed: true,
        windowCount: log.length,
        description:
          `Request #${i + 1} at t=${tick}: ALLOWED. ` +
          `${log.length}/${maxRequests} requests in window [${Math.max(0, tick - windowMs)}, ${tick}].`,
      });
    } else {
      steps.push({
        tick,
        algorithm: "Sliding Window",
        request: i + 1,
        allowed: false,
        windowCount: log.length,
        description:
          `Request #${i + 1} at t=${tick}: DENIED. ` +
          `${log.length}/${maxRequests} requests already in window [${Math.max(0, tick - windowMs)}, ${tick}]. ` +
          `Oldest request expires at t=${log[0] + windowMs}.`,
      });
    }
  }

  return steps;
}

// ── Leaky Bucket ──────────────────────────────────────────

/**
 * Simulates the Leaky Bucket algorithm.
 *
 * - Bucket has a maximum `capacity`
 * - Each request adds 1 to the bucket (like water dripping in)
 * - Bucket leaks at `leakRate` per tick
 * - If bucket would overflow, request is rejected
 *
 * @param capacity Maximum bucket size (queue length)
 * @param leakRate How fast the bucket drains (requests processed per tick)
 * @param requests Array of tick timestamps when requests arrive
 */
export function simulateLeakyBucket(
  capacity: number,
  leakRate: number,
  requests: number[],
): RateLimitStep[] {
  const steps: RateLimitStep[] = [];
  let water = 0;
  let lastTick = 0;

  for (let i = 0; i < requests.length; i++) {
    const tick = requests[i];

    // Leak (drain) based on elapsed time
    const elapsed = tick - lastTick;
    const leaked = elapsed * leakRate;
    water = Math.max(0, water - leaked);
    lastTick = tick;

    if (water + 1 <= capacity) {
      water += 1;
      steps.push({
        tick,
        algorithm: "Leaky Bucket",
        request: i + 1,
        allowed: true,
        tokens: Math.round(water * 100) / 100,
        description:
          `Request #${i + 1} at t=${tick}: ALLOWED. ` +
          `Bucket level: ${water.toFixed(1)}/${capacity} ` +
          `(leaked ${leaked.toFixed(1)} since last request).`,
      });
    } else {
      steps.push({
        tick,
        algorithm: "Leaky Bucket",
        request: i + 1,
        allowed: false,
        tokens: Math.round(water * 100) / 100,
        description:
          `Request #${i + 1} at t=${tick}: DENIED. ` +
          `Bucket full: ${water.toFixed(1)}/${capacity}. ` +
          `Draining at ${leakRate}/tick.`,
      });
    }
  }

  return steps;
}

// ── Default request pattern ───────────────────────────────

/**
 * Generates a standard burst-steady-burst request pattern
 * suitable for comparing rate limiting algorithms.
 *
 * Pattern: 5 rapid requests, then 5 steady, then 5 rapid again.
 */
export function generateBurstSteadyBurstPattern(): number[] {
  return [
    // Burst 1: 5 requests in quick succession (t=0..4)
    0, 1, 2, 3, 4,
    // Steady: 5 requests spaced out (t=10,15,20,25,30)
    10, 15, 20, 25, 30,
    // Burst 2: 5 requests in quick succession (t=31..35)
    31, 32, 33, 34, 35,
  ];
}
