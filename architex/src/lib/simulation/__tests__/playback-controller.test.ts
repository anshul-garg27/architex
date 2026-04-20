import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PlaybackController } from '../../algorithms/playback-controller';
import type { AnimationStep } from '../../algorithms/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStep(id: number, duration: number = 100): AnimationStep {
  return {
    id,
    description: `Step ${id}`,
    pseudocodeLine: id,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlaybackController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Construction ─────────────────────────────────────────────

  it('emits the first step on construction', () => {
    const callback = vi.fn();
    new PlaybackController([makeStep(0), makeStep(1)], callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 0 }), 0);
  });

  it('does not emit on construction with empty steps', () => {
    const callback = vi.fn();
    new PlaybackController([], callback);
    expect(callback).not.toHaveBeenCalled();
  });

  // ── play/pause ───────────────────────────────────────────────

  it('play advances through steps over time', () => {
    const callback = vi.fn();
    const steps = [makeStep(0, 50), makeStep(1, 50), makeStep(2, 50)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.play();
    expect(ctrl.isPlaying()).toBe(true);

    // ALG-246 pedagogical slowdown: first 3 steps run at 1.5x duration.
    vi.advanceTimersByTime(75);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 1);

    vi.advanceTimersByTime(75);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), 2);
  });

  it('pause stops playback', () => {
    const callback = vi.fn();
    const steps = [makeStep(0, 100), makeStep(1, 100), makeStep(2, 100)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.play();
    vi.advanceTimersByTime(100);
    ctrl.pause();

    expect(ctrl.isPlaying()).toBe(false);
    const callCount = callback.mock.calls.length;

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(callCount);
  });

  // ── stop ─────────────────────────────────────────────────────

  it('stop resets to the first step', () => {
    const callback = vi.fn();
    const steps = [makeStep(0, 50), makeStep(1, 50)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.play();
    vi.advanceTimersByTime(50);
    ctrl.stop();

    expect(ctrl.isPlaying()).toBe(false);
    expect(ctrl.getProgress().current).toBe(0);
    // stop emits step 0 again
    const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
    expect(lastCall[0].id).toBe(0);
    expect(lastCall[1]).toBe(0);
  });

  // ── stepForward / stepBackward ───────────────────────────────

  it('stepForward advances by one and pauses', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1), makeStep(2)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.stepForward();
    expect(ctrl.getProgress().current).toBe(1);
    expect(ctrl.isPlaying()).toBe(false);
  });

  it('stepBackward moves back by one', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1), makeStep(2)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.stepForward();
    ctrl.stepForward();
    ctrl.stepBackward();
    expect(ctrl.getProgress().current).toBe(1);
  });

  it('stepBackward does not go below 0', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.stepBackward();
    expect(ctrl.getProgress().current).toBe(0);
  });

  // ── setSpeed ─────────────────────────────────────────────────

  it('setSpeed(2) halves the delay between steps', () => {
    const callback = vi.fn();
    const steps = [makeStep(0, 100), makeStep(1, 100), makeStep(2, 100)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.setSpeed(2);
    ctrl.play();

    // At speed 2, 100ms duration becomes 50ms delay, plus pedagogical 1.5x
    // on the first 3 steps → effective delay = 75ms for step 0.
    vi.advanceTimersByTime(75);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 1);
  });

  // ── jumpTo ───────────────────────────────────────────────────

  it('jumpTo sets the current index and emits step', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1), makeStep(2), makeStep(3)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.jumpTo(2);
    expect(ctrl.getProgress().current).toBe(2);
    const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
    expect(lastCall[0].id).toBe(2);
  });

  it('jumpTo ignores out-of-bounds indices', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.jumpTo(-1);
    expect(ctrl.getProgress().current).toBe(0);

    ctrl.jumpTo(5);
    expect(ctrl.getProgress().current).toBe(0);
  });

  // ── getProgress ──────────────────────────────────────────────

  it('getProgress returns correct current and total', () => {
    const callback = vi.fn();
    const steps = [makeStep(0), makeStep(1), makeStep(2)];
    const ctrl = new PlaybackController(steps, callback);

    expect(ctrl.getProgress()).toEqual({ current: 0, total: 3 });

    ctrl.stepForward();
    expect(ctrl.getProgress()).toEqual({ current: 1, total: 3 });
  });

  // ── destroy ──────────────────────────────────────────────────

  it('destroy stops playback and clears timer', () => {
    const callback = vi.fn();
    const steps = [makeStep(0, 50), makeStep(1, 50)];
    const ctrl = new PlaybackController(steps, callback);

    ctrl.play();
    ctrl.destroy();

    expect(ctrl.isPlaying()).toBe(false);
    const callCount = callback.mock.calls.length;
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(callCount);
  });
});
