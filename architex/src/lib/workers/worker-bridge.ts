// ─────────────────────────────────────────────────────────────
// Architex — Worker Bridge (Main-Thread Side)
//
// Provides a typed request-response wrapper around Web Workers
// with message-ID correlation, timeout handling, idle auto-
// termination, and a synchronous fallback when Worker is not
// available (SSR, test environments, etc.).
// ─────────────────────────────────────────────────────────────

import type { WorkerMessage, WorkerResponse } from './types';

// ── Configuration ──────────────────────────────────────────

export interface WorkerBridgeOptions {
  /** Request timeout in milliseconds. Default 30 000 (30 s). */
  timeout?: number;
  /** Idle time before auto-terminating the worker (ms). Default 60 000. */
  idleTimeout?: number;
  /**
   * Fallback handler invoked on the main thread when the Worker API
   * is unavailable. Receives the message and must return a response
   * payload (or throw).
   */
  fallback?: (message: WorkerMessage) => unknown;
}

// ── Pending Request Tracker ────────────────────────────────

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ── Worker Bridge ──────────────────────────────────────────

export interface WorkerBridge {
  /** Send a typed message and wait for the correlated response. */
  send<TReq, TRes>(message: WorkerMessage<TReq>): Promise<TRes>;
  /** Terminate the underlying worker immediately. */
  terminate(): void;
  /** Whether the bridge is using the main-thread fallback. */
  readonly isFallback: boolean;
}

let idCounter = 0;

/** Generate a unique message ID. */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

/**
 * Create a typed worker bridge for the given worker URL.
 *
 * If the Worker constructor is unavailable (SSR / test), falls back
 * to invoking the optional `fallback` handler synchronously on the
 * main thread.
 */
export function createWorkerBridge(
  workerUrl: string | URL,
  options: WorkerBridgeOptions = {},
): WorkerBridge {
  const {
    timeout = 30_000,
    idleTimeout = 60_000,
    fallback,
  } = options;

  // ── Detect Worker support ──────────────────────────────
  const hasWorker =
    typeof Worker !== 'undefined' && typeof window !== 'undefined';

  if (!hasWorker) {
    // Fallback mode — run handler synchronously on main thread
    return {
      isFallback: true,
      send<TReq, TRes>(message: WorkerMessage<TReq>): Promise<TRes> {
        if (!fallback) {
          return Promise.reject(
            new Error(
              'Worker not available and no fallback handler provided',
            ),
          );
        }
        try {
          const result = fallback(message as WorkerMessage) as TRes;
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      },
      terminate() {
        // noop in fallback mode
      },
    };
  }

  // ── Real Worker mode ───────────────────────────────────
  let worker: Worker | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Map<string, PendingRequest>();

  function ensureWorker(): Worker {
    if (worker) return worker;

    worker = new Worker(workerUrl, { type: 'module' });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, payload, error } = event.data;
      const req = pending.get(id);
      if (!req) return;

      pending.delete(id);
      clearTimeout(req.timer);

      if (error) {
        req.reject(new Error(error));
      } else {
        req.resolve(payload);
      }

      resetIdleTimer();
    };

    worker.onerror = (event: ErrorEvent) => {
      // Reject all pending requests
      const err = new Error(event.message || 'Worker error');
      for (const [, req] of pending) {
        clearTimeout(req.timer);
        req.reject(err);
      }
      pending.clear();
    };

    return worker;
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (pending.size > 0) return; // still has in-flight requests

    idleTimer = setTimeout(() => {
      if (pending.size === 0 && worker) {
        worker.terminate();
        worker = null;
      }
    }, idleTimeout);
  }

  function terminateNow() {
    if (idleTimer) clearTimeout(idleTimer);
    for (const [, req] of pending) {
      clearTimeout(req.timer);
      req.reject(new Error('Worker terminated'));
    }
    pending.clear();
    if (worker) {
      worker.terminate();
      worker = null;
    }
  }

  return {
    isFallback: false,

    send<TReq, TRes>(message: WorkerMessage<TReq>): Promise<TRes> {
      return new Promise<TRes>((resolve, reject) => {
        const w = ensureWorker();

        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new Error(`Worker request timed out after ${timeout}ms`));
        }, timeout);

        pending.set(message.id, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timer,
        });

        w.postMessage(message);
        // Reset idle timer since we just sent work
        if (idleTimer) clearTimeout(idleTimer);
      });
    },

    terminate: terminateNow,
  };
}
