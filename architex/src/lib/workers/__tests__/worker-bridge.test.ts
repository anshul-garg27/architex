// ─────────────────────────────────────────────────────────────
// Architex — Worker Bridge Tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWorkerBridge,
  generateMessageId,
} from '../worker-bridge';
import type { WorkerMessage, WorkerResponse } from '../types';

// ── Helpers ────────────────────────────────────────────────

/** State captured from the mock Worker class. */
interface MockWorkerState {
  onmessageHandler: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerrorHandler: ((event: ErrorEvent) => void) | null;
  postMessageSpy: ReturnType<typeof vi.fn>;
  terminateSpy: ReturnType<typeof vi.fn>;
}

/**
 * Build a mock Worker class that can be used as `globalThis.Worker`.
 * Returns the class and the captured state for driving simulated responses.
 */
function buildMockWorkerClass() {
  const state: MockWorkerState = {
    onmessageHandler: null,
    onerrorHandler: null,
    postMessageSpy: vi.fn(),
    terminateSpy: vi.fn(),
  };

  class MockWorker {
    constructor(_url: string | URL, _opts?: WorkerOptions) {
      // Capture instance methods
    }

    postMessage(msg: unknown) {
      (state.postMessageSpy as (...args: unknown[]) => void)(msg);
    }

    terminate() {
      (state.terminateSpy as (...args: unknown[]) => void)();
    }

    set onmessage(
      handler: ((event: MessageEvent<WorkerResponse>) => void) | null,
    ) {
      state.onmessageHandler = handler;
    }

    get onmessage() {
      return state.onmessageHandler;
    }

    set onerror(handler: ((event: ErrorEvent) => void) | null) {
      state.onerrorHandler = handler;
    }

    get onerror() {
      return state.onerrorHandler;
    }
  }

  return {
    MockWorkerClass: MockWorker as unknown as typeof Worker,
    state,
    /** Simulate the worker posting a response back. */
    simulateResponse(response: WorkerResponse) {
      if (state.onmessageHandler) {
        state.onmessageHandler({
          data: response,
        } as MessageEvent<WorkerResponse>);
      }
    },
    /** Simulate a worker error. */
    simulateError(message: string) {
      if (state.onerrorHandler) {
        state.onerrorHandler({ message } as ErrorEvent);
      }
    },
  };
}

// ── Tests ──────────────────────────────────────────────────

describe('generateMessageId', () => {
  it('returns unique IDs on successive calls', () => {
    const a = generateMessageId();
    const b = generateMessageId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^msg_/);
  });
});

describe('createWorkerBridge — fallback mode', () => {
  let originalWorker: typeof globalThis.Worker;
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWorker = globalThis.Worker;
    originalWindow = globalThis.window;
    // Simulate SSR: no Worker
    // @ts-expect-error intentional deletion for test
    delete globalThis.Worker;
  });

  afterEach(() => {
    globalThis.Worker = originalWorker;
    globalThis.window = originalWindow;
  });

  it('sets isFallback to true when Worker is unavailable', () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    expect(bridge.isFallback).toBe(true);
  });

  it('rejects when no fallback handler is provided', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    const msg: WorkerMessage<string> = {
      type: 'TEST',
      payload: 'hello',
      id: generateMessageId(),
    };
    await expect(bridge.send(msg)).rejects.toThrow(
      'Worker not available and no fallback handler provided',
    );
  });

  it('invokes fallback handler and resolves with its return value', async () => {
    const fallback = vi.fn().mockReturnValue({ result: 42 });
    const bridge = createWorkerBridge('/fake-worker.js', { fallback });

    const msg: WorkerMessage<string> = {
      type: 'TEST',
      payload: 'hello',
      id: generateMessageId(),
    };
    const result = await bridge.send(msg);
    expect(result).toEqual({ result: 42 });
    expect(fallback).toHaveBeenCalledWith(msg);
  });

  it('rejects when fallback handler throws', async () => {
    const fallback = vi.fn().mockImplementation(() => {
      throw new Error('fallback boom');
    });
    const bridge = createWorkerBridge('/fake-worker.js', { fallback });

    const msg: WorkerMessage<string> = {
      type: 'TEST',
      payload: 'hello',
      id: generateMessageId(),
    };
    await expect(bridge.send(msg)).rejects.toThrow('fallback boom');
  });

  it('terminate is a noop in fallback mode', () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    // Should not throw
    bridge.terminate();
    expect(bridge.isFallback).toBe(true);
  });
});

describe('createWorkerBridge — Worker mode', () => {
  let mock: ReturnType<typeof buildMockWorkerClass>;
  let originalWorker: typeof globalThis.Worker;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWorker = globalThis.Worker;
    mock = buildMockWorkerClass();
    globalThis.Worker = mock.MockWorkerClass;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.Worker = originalWorker;
  });

  it('sets isFallback to false when Worker is available', () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    expect(bridge.isFallback).toBe(false);
  });

  it('sends a message and resolves with the worker response', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    const msgId = generateMessageId();

    const promise = bridge.send<string, { value: number }>({
      type: 'TEST',
      payload: 'data',
      id: msgId,
    });

    // Simulate worker responding
    mock.simulateResponse({
      type: 'TEST',
      payload: { value: 99 },
      id: msgId,
    });

    const result = await promise;
    expect(result).toEqual({ value: 99 });
    expect(mock.state.postMessageSpy).toHaveBeenCalledWith({
      type: 'TEST',
      payload: 'data',
      id: msgId,
    });
  });

  it('rejects when the worker responds with an error', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    const msgId = generateMessageId();

    const promise = bridge.send({
      type: 'TEST',
      payload: null,
      id: msgId,
    });

    mock.simulateResponse({
      type: 'TEST',
      payload: null,
      id: msgId,
      error: 'Something went wrong',
    });

    await expect(promise).rejects.toThrow('Something went wrong');
  });

  it('routes responses to the correct pending request by message ID', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');
    const id1 = generateMessageId();
    const id2 = generateMessageId();

    const promise1 = bridge.send<string, string>({
      type: 'A',
      payload: 'first',
      id: id1,
    });
    const promise2 = bridge.send<string, string>({
      type: 'B',
      payload: 'second',
      id: id2,
    });

    // Respond out of order
    mock.simulateResponse({
      type: 'B',
      payload: 'response-2' as unknown as string,
      id: id2,
    });
    mock.simulateResponse({
      type: 'A',
      payload: 'response-1' as unknown as string,
      id: id1,
    });

    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toBe('response-1');
    expect(r2).toBe('response-2');
  });

  it('rejects with timeout when worker does not respond in time', async () => {
    const bridge = createWorkerBridge('/fake-worker.js', {
      timeout: 500,
    });

    const promise = bridge.send({
      type: 'SLOW',
      payload: null,
      id: generateMessageId(),
    });

    vi.advanceTimersByTime(501);

    await expect(promise).rejects.toThrow(
      'Worker request timed out after 500ms',
    );
  });

  it('rejects all pending requests on worker error', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');

    const p1 = bridge.send({
      type: 'A',
      payload: null,
      id: generateMessageId(),
    });
    const p2 = bridge.send({
      type: 'B',
      payload: null,
      id: generateMessageId(),
    });

    mock.simulateError('Worker crashed');

    await expect(p1).rejects.toThrow('Worker crashed');
    await expect(p2).rejects.toThrow('Worker crashed');
  });

  it('terminates the worker and rejects pending requests', async () => {
    const bridge = createWorkerBridge('/fake-worker.js');

    const promise = bridge.send({
      type: 'TEST',
      payload: null,
      id: generateMessageId(),
    });

    bridge.terminate();

    await expect(promise).rejects.toThrow('Worker terminated');
    expect(mock.state.terminateSpy).toHaveBeenCalled();
  });

  it('auto-terminates the worker after idle timeout', () => {
    const bridge = createWorkerBridge('/fake-worker.js', {
      idleTimeout: 1000,
    });

    const msgId = generateMessageId();

    // Send and immediately respond to trigger idle timer
    bridge.send({ type: 'TEST', payload: null, id: msgId });
    mock.simulateResponse({
      type: 'TEST',
      payload: null,
      id: msgId,
    });

    expect(mock.state.terminateSpy).not.toHaveBeenCalled();

    // Advance past idle timeout
    vi.advanceTimersByTime(1001);

    expect(mock.state.terminateSpy).toHaveBeenCalled();
  });

  it('ignores responses for unknown message IDs', () => {
    const bridge = createWorkerBridge('/fake-worker.js');

    // Send a real message first to create the worker
    bridge.send({
      type: 'INIT',
      payload: null,
      id: generateMessageId(),
    });

    // This should not throw
    mock.simulateResponse({
      type: 'UNKNOWN',
      payload: null,
      id: 'nonexistent-id',
    });

    expect(bridge.isFallback).toBe(false);
  });
});
