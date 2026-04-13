import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlaybackController } from '@/lib/algorithms/playback-controller';
import type { AnimationStep } from '@/lib/algorithms/types';

function makeSteps(count: number): AnimationStep[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    description: `Step ${i}`,
    pseudocodeLine: i,
    mutations: [],
    complexity: { comparisons: i, swaps: 0, reads: 0, writes: 0 },
    duration: 100,
  }));
}

describe('PlaybackController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Constructor ──────────────────────────────────────────────

  test('constructor emits first step immediately', () => {
    const onStep = vi.fn();
    const steps = makeSteps(3);
    new PlaybackController(steps, onStep);

    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith(steps[0], 0);
  });

  test('constructor does not emit if steps are empty', () => {
    const onStep = vi.fn();
    new PlaybackController([], onStep);

    expect(onStep).not.toHaveBeenCalled();
  });

  // ── play / pause / stop ─────────────────────────────────────

  test('play advances through steps', () => {
    const onStep = vi.fn();
    const steps = makeSteps(3);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    expect(ctrl.isPlaying()).toBe(true);

    // Advance past step 0 duration (100ms)
    vi.advanceTimersByTime(100);
    expect(onStep).toHaveBeenCalledWith(steps[1], 1);

    // Advance again
    vi.advanceTimersByTime(100);
    expect(onStep).toHaveBeenCalledWith(steps[2], 2);

    ctrl.destroy();
  });

  test('pause stops playback', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    vi.advanceTimersByTime(100); // step 1
    ctrl.pause();

    expect(ctrl.isPlaying()).toBe(false);

    // Advance more time - should not progress
    const callCountAfterPause = onStep.mock.calls.length;
    vi.advanceTimersByTime(500);
    expect(onStep.mock.calls.length).toBe(callCountAfterPause);

    ctrl.destroy();
  });

  test('stop resets to step 0 and emits first step', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    vi.advanceTimersByTime(200); // advance 2 steps
    ctrl.stop();

    expect(ctrl.isPlaying()).toBe(false);
    expect(ctrl.getProgress().current).toBe(0);

    // Last call should be the first step (reset)
    const lastCall = onStep.mock.calls[onStep.mock.calls.length - 1];
    expect(lastCall[0]).toBe(steps[0]);
    expect(lastCall[1]).toBe(0);

    ctrl.destroy();
  });

  test('play does nothing if already playing', () => {
    const onStep = vi.fn();
    const steps = makeSteps(3);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    ctrl.play(); // should not restart or double schedule

    vi.advanceTimersByTime(100);
    // Should have been called: constructor(1) + step1(1) = 2 times
    expect(onStep).toHaveBeenCalledTimes(2);

    ctrl.destroy();
  });

  test('play does nothing if at end of steps', () => {
    const onStep = vi.fn();
    const steps = makeSteps(2);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    vi.advanceTimersByTime(100); // reaches last step
    // Now at end; playing should be false
    expect(ctrl.isPlaying()).toBe(false);

    // Trying to play again should do nothing
    ctrl.play();
    expect(ctrl.isPlaying()).toBe(false);

    ctrl.destroy();
  });

  // ── stepForward / stepBackward ──────────────────────────────

  test('stepForward advances one step and pauses', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.stepForward();
    expect(ctrl.isPlaying()).toBe(false);
    expect(ctrl.getProgress().current).toBe(1);
    expect(onStep).toHaveBeenCalledWith(steps[1], 1);

    ctrl.destroy();
  });

  test('stepForward does not go past last step', () => {
    const onStep = vi.fn();
    const steps = makeSteps(2);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.stepForward(); // index 1 (last)
    const callsAtEnd = onStep.mock.calls.length;

    ctrl.stepForward(); // should not advance further
    expect(onStep.mock.calls.length).toBe(callsAtEnd);
    expect(ctrl.getProgress().current).toBe(1);

    ctrl.destroy();
  });

  test('stepBackward goes back one step', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.stepForward(); // index 1
    ctrl.stepForward(); // index 2
    ctrl.stepBackward(); // index 1

    expect(ctrl.getProgress().current).toBe(1);
    const lastCall = onStep.mock.calls[onStep.mock.calls.length - 1];
    expect(lastCall[0]).toBe(steps[1]);
    expect(lastCall[1]).toBe(1);

    ctrl.destroy();
  });

  test('stepBackward does not go before step 0', () => {
    const onStep = vi.fn();
    const steps = makeSteps(3);
    const ctrl = new PlaybackController(steps, onStep);

    const callsAtStart = onStep.mock.calls.length;
    ctrl.stepBackward(); // should not go below 0
    expect(onStep.mock.calls.length).toBe(callsAtStart);
    expect(ctrl.getProgress().current).toBe(0);

    ctrl.destroy();
  });

  // ── onComplete ──────────────────────────────────────────────

  test('onComplete fires when reaching the end during play', () => {
    const onStep = vi.fn();
    const onComplete = vi.fn();
    const steps = makeSteps(3);
    const ctrl = new PlaybackController(steps, onStep, onComplete);

    ctrl.play();
    vi.advanceTimersByTime(100); // step 1
    vi.advanceTimersByTime(100); // step 2 (last) - triggers onComplete

    expect(onComplete).toHaveBeenCalledTimes(1);

    ctrl.destroy();
  });

  test('onComplete does not fire during manual stepping', () => {
    const onStep = vi.fn();
    const onComplete = vi.fn();
    const steps = makeSteps(2);
    const ctrl = new PlaybackController(steps, onStep, onComplete);

    ctrl.stepForward(); // index 1 (last)
    expect(onComplete).not.toHaveBeenCalled();

    ctrl.destroy();
  });

  // ── setSpeed ────────────────────────────────────────────────

  test('setSpeed changes timing of steps', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    // Speed 2x = duration/2 = 50ms per step
    ctrl.setSpeed(2);
    ctrl.play();

    vi.advanceTimersByTime(50);
    expect(onStep).toHaveBeenCalledWith(steps[1], 1);

    vi.advanceTimersByTime(50);
    expect(onStep).toHaveBeenCalledWith(steps[2], 2);

    ctrl.destroy();
  });

  test('setSpeed during playback reschedules', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    // At default speed (1x), 100ms per step
    vi.advanceTimersByTime(50); // halfway through step 0

    // Now set speed to 4x (25ms per step)
    ctrl.setSpeed(4);
    // The timer was cleared and rescheduled; advance 25ms
    vi.advanceTimersByTime(25);
    expect(onStep).toHaveBeenCalledWith(steps[1], 1);

    ctrl.destroy();
  });

  // ── getProgress ─────────────────────────────────────────────

  test('getProgress returns current and total', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    const progress = ctrl.getProgress();
    expect(progress.current).toBe(0);
    expect(progress.total).toBe(5);

    ctrl.stepForward();
    expect(ctrl.getProgress().current).toBe(1);

    ctrl.destroy();
  });

  // ── jumpTo ──────────────────────────────────────────────────

  test('jumpTo moves to specific step', () => {
    const onStep = vi.fn();
    const steps = makeSteps(10);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.jumpTo(5);
    expect(ctrl.getProgress().current).toBe(5);
    expect(onStep).toHaveBeenCalledWith(steps[5], 5);

    ctrl.destroy();
  });

  test('jumpTo ignores out-of-range indices', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    const callCount = onStep.mock.calls.length;
    ctrl.jumpTo(-1);
    ctrl.jumpTo(10);
    expect(onStep.mock.calls.length).toBe(callCount);

    ctrl.destroy();
  });

  test('jumpTo resumes playing if was playing', () => {
    const onStep = vi.fn();
    const steps = makeSteps(10);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    ctrl.jumpTo(5);

    // Should still be playing after jumpTo
    expect(ctrl.isPlaying()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(onStep).toHaveBeenCalledWith(steps[6], 6);

    ctrl.destroy();
  });

  // ── destroy ─────────────────────────────────────────────────

  test('destroy stops playback and clears timer', () => {
    const onStep = vi.fn();
    const steps = makeSteps(5);
    const ctrl = new PlaybackController(steps, onStep);

    ctrl.play();
    ctrl.destroy();

    expect(ctrl.isPlaying()).toBe(false);

    const callsAfterDestroy = onStep.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(onStep.mock.calls.length).toBe(callsAfterDestroy);
  });
});
