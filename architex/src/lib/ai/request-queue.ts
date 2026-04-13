// ─────────────────────────────────────────────────────────────
// Architex — AI Request Queue  (AIX-016)
// ─────────────────────────────────────────────────────────────
//
// Priority queue for AI requests with per-user rate limiting,
// tier-based priority, and exponential backoff on failures.
//
// Priority order: Tier 1 hints > Tier 2 > Tier 3 > tutor
// Per-user limit: 10 requests / minute
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────────────

export type RequestPriority = "tier1-hint" | "tier2-hint" | "tier3-hint" | "tutor";

/** Numeric priority — lower value = higher priority. */
const PRIORITY_VALUE: Record<RequestPriority, number> = {
  "tier1-hint": 0,
  "tier2-hint": 1,
  "tier3-hint": 2,
  tutor: 3,
};

export interface QueuedRequest {
  id: string;
  userId: string;
  priority: RequestPriority;
  payload: unknown;
  enqueuedAt: number;
  retries: number;
}

export type RequestHandler = (request: QueuedRequest) => Promise<unknown>;

export interface RequestQueueOptions {
  /** Max requests per user per minute. @default 10 */
  maxRequestsPerMinute?: number;
  /** Base delay (ms) for exponential backoff. @default 1000 */
  baseBackoffMs?: number;
  /** Maximum retries before discarding a request. @default 3 */
  maxRetries?: number;
}

export interface RateLimitEntry {
  timestamps: number[];
}

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_MAX_REQUESTS_PER_MINUTE = 10;
const DEFAULT_BASE_BACKOFF_MS = 1_000;
const DEFAULT_MAX_RETRIES = 3;
const ONE_MINUTE_MS = 60_000;

// ── RequestQueue ────────────────────────────────────────────────────

let nextId = 0;
function generateId(): string {
  return `req-${Date.now()}-${++nextId}`;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private rateLimits = new Map<string, RateLimitEntry>();
  private processing = false;
  private handler: RequestHandler | null = null;

  private readonly maxRequestsPerMinute: number;
  private readonly baseBackoffMs: number;
  private readonly maxRetries: number;

  constructor(options: RequestQueueOptions = {}) {
    this.maxRequestsPerMinute =
      options.maxRequestsPerMinute ?? DEFAULT_MAX_REQUESTS_PER_MINUTE;
    this.baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /** Register the handler that processes dequeued requests. */
  setHandler(handler: RequestHandler): void {
    this.handler = handler;
  }

  /**
   * Enqueue a request. Returns the request ID, or `null` if rate-limited.
   */
  enqueue(
    userId: string,
    priority: RequestPriority,
    payload: unknown,
  ): string | null {
    if (this.isRateLimited(userId)) {
      return null;
    }

    this.recordRequest(userId);

    const request: QueuedRequest = {
      id: generateId(),
      userId,
      priority,
      payload,
      enqueuedAt: Date.now(),
      retries: 0,
    };

    // Insert in priority order (stable: equal priorities keep FIFO)
    const insertIdx = this.queue.findIndex(
      (r) => PRIORITY_VALUE[r.priority] > PRIORITY_VALUE[request.priority],
    );

    if (insertIdx === -1) {
      this.queue.push(request);
    } else {
      this.queue.splice(insertIdx, 0, request);
    }

    return request.id;
  }

  /**
   * Process the next request in the queue. Returns the result or `null`
   * if the queue is empty or already processing.
   */
  async process(): Promise<unknown | null> {
    if (this.processing || this.queue.length === 0 || !this.handler) {
      return null;
    }

    this.processing = true;
    const request = this.queue.shift()!;

    try {
      const result = await this.handler(request);
      this.processing = false;
      return result;
    } catch {
      this.processing = false;
      return this.handleFailure(request);
    }
  }

  /** Number of requests currently in the queue. */
  getQueueSize(): number {
    return this.queue.length;
  }

  /** Check whether a user is currently rate-limited. */
  isRateLimited(userId: string): boolean {
    const entry = this.rateLimits.get(userId);
    if (!entry) return false;

    const now = Date.now();
    const recentTimestamps = entry.timestamps.filter(
      (t) => now - t < ONE_MINUTE_MS,
    );
    // Update in place so we don't accumulate stale timestamps
    entry.timestamps = recentTimestamps;

    return recentTimestamps.length >= this.maxRequestsPerMinute;
  }

  /** Peek at the next request without removing it. */
  peek(): QueuedRequest | undefined {
    return this.queue[0];
  }

  /** Clear all queued requests. */
  clear(): void {
    this.queue = [];
  }

  /** Reset all rate limit tracking. */
  resetRateLimits(): void {
    this.rateLimits.clear();
  }

  /** Whether the queue is currently processing a request. */
  get isProcessing(): boolean {
    return this.processing;
  }

  // ── Private helpers ─────────────────────────────────────────────

  private recordRequest(userId: string): void {
    let entry = this.rateLimits.get(userId);
    if (!entry) {
      entry = { timestamps: [] };
      this.rateLimits.set(userId, entry);
    }
    entry.timestamps.push(Date.now());
  }

  private handleFailure(request: QueuedRequest): null {
    request.retries += 1;

    if (request.retries > this.maxRetries) {
      // Discard after max retries exceeded
      return null;
    }

    // Exponential backoff: base * 2^(retries-1)
    // Re-insert into the queue after the delay (non-blocking).
    const delay = this.baseBackoffMs * Math.pow(2, request.retries - 1);

    setTimeout(() => {
      // Re-insert in priority order
      const insertIdx = this.queue.findIndex(
        (r) => PRIORITY_VALUE[r.priority] > PRIORITY_VALUE[request.priority],
      );
      if (insertIdx === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIdx, 0, request);
      }
    }, delay);

    return null;
  }
}
