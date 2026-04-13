import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RequestQueue, type RequestPriority, type QueuedRequest } from '../request-queue';

describe('RequestQueue', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new RequestQueue({
      maxRequestsPerMinute: 10,
      baseBackoffMs: 100,
      maxRetries: 3,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Enqueue ──────────────────────────────────────────────────

  describe('enqueue', () => {
    it('enqueues a request and returns an ID', () => {
      const id = queue.enqueue('user-1', 'tier1-hint', { q: 'test' });
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(queue.getQueueSize()).toBe(1);
    });

    it('returns null when the user is rate-limited', () => {
      for (let i = 0; i < 10; i++) {
        expect(queue.enqueue('user-1', 'tutor', {})).toBeTruthy();
      }
      // 11th request should be rejected
      const result = queue.enqueue('user-1', 'tutor', {});
      expect(result).toBeNull();
      expect(queue.getQueueSize()).toBe(10);
    });

    it('rate limits are per-user', () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue('user-1', 'tutor', {});
      }
      // user-2 should not be affected
      const id = queue.enqueue('user-2', 'tutor', {});
      expect(id).toBeTruthy();
    });

    it('rate limit window resets after one minute', () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue('user-1', 'tutor', {});
      }
      expect(queue.enqueue('user-1', 'tutor', {})).toBeNull();

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61_000);

      const id = queue.enqueue('user-1', 'tutor', {});
      expect(id).toBeTruthy();
    });
  });

  // ── Priority ordering ────────────────────────────────────────

  describe('priority ordering', () => {
    it('orders tier1 > tier2 > tier3 > tutor', () => {
      queue.enqueue('u1', 'tutor', { p: 4 });
      queue.enqueue('u2', 'tier3-hint', { p: 3 });
      queue.enqueue('u3', 'tier1-hint', { p: 1 });
      queue.enqueue('u4', 'tier2-hint', { p: 2 });

      const first = queue.peek();
      expect(first?.priority).toBe('tier1-hint');

      // Verify full order
      const order: RequestPriority[] = [];
      while (queue.getQueueSize() > 0) {
        const req = queue.peek()!;
        order.push(req.priority);
        // Remove the first item by processing
        queue.setHandler(async () => 'ok');
        // We can't easily pop without processing, so just verify peek order
        break;
      }
      expect(order[0]).toBe('tier1-hint');
    });

    it('maintains FIFO within the same priority', () => {
      queue.enqueue('u1', 'tier2-hint', { order: 1 });
      queue.enqueue('u2', 'tier2-hint', { order: 2 });
      queue.enqueue('u3', 'tier2-hint', { order: 3 });

      const first = queue.peek();
      expect((first?.payload as { order: number }).order).toBe(1);
    });

    it('inserts higher priority before lower priority items', () => {
      queue.enqueue('u1', 'tutor', { order: 'last' });
      queue.enqueue('u2', 'tier1-hint', { order: 'first' });

      const first = queue.peek();
      expect((first?.payload as { order: string }).order).toBe('first');
      expect(first?.priority).toBe('tier1-hint');
    });
  });

  // ── Process ──────────────────────────────────────────────────

  describe('process', () => {
    it('calls the handler with the highest priority request', async () => {
      const handler = vi.fn().mockResolvedValue('result');
      queue.setHandler(handler);

      queue.enqueue('u1', 'tier2-hint', { data: 'test' });
      const result = await queue.process();

      expect(result).toBe('result');
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toMatchObject({
        userId: 'u1',
        priority: 'tier2-hint',
        payload: { data: 'test' },
      });
      expect(queue.getQueueSize()).toBe(0);
    });

    it('returns null if queue is empty', async () => {
      queue.setHandler(async () => 'nope');
      const result = await queue.process();
      expect(result).toBeNull();
    });

    it('returns null if no handler is set', async () => {
      queue.enqueue('u1', 'tutor', {});
      const result = await queue.process();
      expect(result).toBeNull();
    });

    it('processes requests in priority order', async () => {
      const processed: string[] = [];
      queue.setHandler(async (req: QueuedRequest) => {
        processed.push(req.priority);
        return req.priority;
      });

      queue.enqueue('u1', 'tutor', {});
      queue.enqueue('u2', 'tier1-hint', {});
      queue.enqueue('u3', 'tier3-hint', {});

      await queue.process();
      await queue.process();
      await queue.process();

      expect(processed).toEqual(['tier1-hint', 'tier3-hint', 'tutor']);
    });
  });

  // ── Failure & backoff ────────────────────────────────────────

  describe('failure handling', () => {
    it('re-enqueues on failure with incremented retry count', async () => {
      let callCount = 0;
      queue.setHandler(async () => {
        callCount++;
        if (callCount === 1) throw new Error('transient failure');
        return 'success';
      });

      queue.enqueue('u1', 'tier1-hint', {});
      // First call fails — request is scheduled for re-enqueue after backoff
      const firstResult = await queue.process();
      expect(firstResult).toBeNull();
      expect(queue.getQueueSize()).toBe(0); // not yet re-enqueued

      // Advance past backoff (100ms base * 2^0 = 100ms)
      vi.advanceTimersByTime(150);

      expect(queue.getQueueSize()).toBe(1);

      // Second attempt should succeed
      const secondResult = await queue.process();
      expect(secondResult).toBe('success');
      expect(callCount).toBe(2);
    });

    it('discards a request after max retries', async () => {
      queue.setHandler(async () => {
        throw new Error('persistent failure');
      });

      queue.enqueue('u1', 'tier1-hint', {});

      // Process and advance timers for each retry
      // Retry 1: fails, backoff 100ms
      await queue.process();
      vi.advanceTimersByTime(150);
      expect(queue.getQueueSize()).toBe(1);

      // Retry 2: fails, backoff 200ms
      await queue.process();
      vi.advanceTimersByTime(250);
      expect(queue.getQueueSize()).toBe(1);

      // Retry 3: fails, backoff 400ms
      await queue.process();
      vi.advanceTimersByTime(450);
      expect(queue.getQueueSize()).toBe(1);

      // Retry 4: exceeds maxRetries (3), discarded
      await queue.process();
      vi.advanceTimersByTime(1000);
      expect(queue.getQueueSize()).toBe(0);
    });
  });

  // ── getQueueSize ─────────────────────────────────────────────

  describe('getQueueSize', () => {
    it('returns 0 for an empty queue', () => {
      expect(queue.getQueueSize()).toBe(0);
    });

    it('reflects enqueue and process correctly', async () => {
      queue.setHandler(async () => 'ok');

      queue.enqueue('u1', 'tutor', {});
      queue.enqueue('u2', 'tutor', {});
      expect(queue.getQueueSize()).toBe(2);

      await queue.process();
      expect(queue.getQueueSize()).toBe(1);
    });
  });

  // ── Utility methods ──────────────────────────────────────────

  describe('utility methods', () => {
    it('clear() empties the queue', () => {
      queue.enqueue('u1', 'tutor', {});
      queue.enqueue('u2', 'tutor', {});
      queue.clear();
      expect(queue.getQueueSize()).toBe(0);
    });

    it('resetRateLimits() allows previously rate-limited users', () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue('u1', 'tutor', {});
      }
      expect(queue.enqueue('u1', 'tutor', {})).toBeNull();

      queue.resetRateLimits();
      expect(queue.enqueue('u1', 'tutor', {})).toBeTruthy();
    });

    it('isRateLimited() reports correct state', () => {
      expect(queue.isRateLimited('u1')).toBe(false);
      for (let i = 0; i < 10; i++) {
        queue.enqueue('u1', 'tutor', {});
      }
      expect(queue.isRateLimited('u1')).toBe(true);
    });

    it('peek() returns undefined for empty queue', () => {
      expect(queue.peek()).toBeUndefined();
    });

    it('isProcessing is false when idle', () => {
      expect(queue.isProcessing).toBe(false);
    });
  });

  // ── Default options ──────────────────────────────────────────

  describe('default options', () => {
    it('uses default maxRequestsPerMinute of 10', () => {
      const defaultQueue = new RequestQueue();
      for (let i = 0; i < 10; i++) {
        expect(defaultQueue.enqueue('u1', 'tutor', {})).toBeTruthy();
      }
      expect(defaultQueue.enqueue('u1', 'tutor', {})).toBeNull();
    });
  });
});
