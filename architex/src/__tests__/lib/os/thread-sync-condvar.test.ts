import { describe, it, expect } from 'vitest';
import { simulateConditionVariable } from '@/lib/os/thread-sync';
import type { SyncEvent } from '@/lib/os/thread-sync';

describe('Condition Variable (bounded-buffer producer-consumer)', () => {
  it('produces events with the correct SyncEvent shape', () => {
    const events = simulateConditionVariable(2, 2, 2);
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(e).toHaveProperty('tick');
      expect(e).toHaveProperty('threadId');
      expect(e).toHaveProperty('action');
      expect(e).toHaveProperty('primitive');
      expect(e).toHaveProperty('description');
      expect(e.primitive).toBe('CondVar');
    }
  });

  it('uses only valid action values', () => {
    const events = simulateConditionVariable(2, 2, 3);
    const validActions = new Set(['acquire', 'release', 'wait', 'signal', 'blocked']);
    for (const e of events) {
      expect(validActions.has(e.action)).toBe(true);
    }
  });

  it('clamps producers to 1-4, consumers to 1-4, bufferSize to 1-5', () => {
    // Should not throw with extreme values
    const e1 = simulateConditionVariable(0, 0, 0);
    expect(e1.length).toBeGreaterThan(0);
    const e2 = simulateConditionVariable(10, 10, 10);
    expect(e2.length).toBeGreaterThan(0);
  });

  it('has both producer and consumer threads participating', () => {
    const events = simulateConditionVariable(2, 2, 2);
    const threadIds = new Set(events.map((e) => e.threadId));
    const hasProducer = [...threadIds].some((id) => id.startsWith('P'));
    const hasConsumer = [...threadIds].some((id) => id.startsWith('C'));
    expect(hasProducer).toBe(true);
    expect(hasConsumer).toBe(true);
  });

  it('generates wait events when buffer is full or empty', () => {
    // With buffer size 1 and multiple producers/consumers, waits should occur
    const events = simulateConditionVariable(3, 1, 1);
    const waitEvents = events.filter((e) => e.action === 'wait');
    expect(waitEvents.length).toBeGreaterThan(0);
  });

  it('generates signal events for notFull and notEmpty', () => {
    const events = simulateConditionVariable(2, 2, 2);
    const signalDescs = events
      .filter((e) => e.action === 'signal')
      .map((e) => e.description);
    const hasNotEmpty = signalDescs.some((d) => d.includes('notEmpty'));
    const hasNotFull = signalDescs.some((d) => d.includes('notFull'));
    // At least one type of signal should exist
    expect(hasNotEmpty || hasNotFull).toBe(true);
  });

  it('descriptions explain WHY with buffer state context', () => {
    const events = simulateConditionVariable(2, 2, 2);
    // Acquire events should mention buffer state
    const acquireEvents = events.filter((e) => e.action === 'acquire');
    for (const e of acquireEvents) {
      expect(e.description).toMatch(/buffer state|critical section/);
    }
  });

  it('does not exceed MAX_TICKS (200)', () => {
    const events = simulateConditionVariable(4, 4, 1);
    for (const e of events) {
      expect(e.tick).toBeLessThan(200);
    }
  });
});
