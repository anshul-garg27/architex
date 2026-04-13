// ─────────────────────────────────────────────────────────────
// Architex — Algorithm Playback Controller
// ─────────────────────────────────────────────────────────────

import type { AnimationStep } from './types';

export type StepCallback = (step: AnimationStep, index: number) => void;

export class PlaybackController {
  private steps: AnimationStep[];
  private currentIndex: number;
  private speed: number;
  private playing: boolean;
  private timer: ReturnType<typeof setTimeout> | null;
  private onStep: StepCallback;
  private onComplete: (() => void) | null;

  constructor(steps: AnimationStep[], onStep: StepCallback, onComplete?: () => void) {
    this.steps = steps;
    this.currentIndex = 0;
    this.speed = 1;
    this.playing = false;
    this.timer = null;
    this.onStep = onStep;
    this.onComplete = onComplete ?? null;

    // Emit the first step if available
    if (steps.length > 0) {
      this.onStep(steps[0], 0);
    }
  }

  play(): void {
    if (this.playing) return;
    if (this.currentIndex >= this.steps.length) return;

    this.playing = true;
    this.scheduleNext();
  }

  pause(): void {
    this.playing = false;
    this.clearTimer();
  }

  stop(): void {
    this.playing = false;
    this.clearTimer();
    this.currentIndex = 0;

    if (this.steps.length > 0) {
      this.onStep(this.steps[0], 0);
    }
  }

  stepForward(): void {
    this.pause();
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.onStep(this.steps[this.currentIndex], this.currentIndex);
    }
  }

  stepBackward(): void {
    this.pause();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.onStep(this.steps[this.currentIndex], this.currentIndex);
    }
  }

  jumpTo(index: number): void {
    if (index < 0 || index >= this.steps.length) return;
    const wasPlaying = this.playing;
    this.pause();
    this.currentIndex = index;
    this.onStep(this.steps[this.currentIndex], this.currentIndex);

    if (wasPlaying) {
      this.play();
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed;

    // If currently playing, reschedule with the new speed
    if (this.playing) {
      this.clearTimer();
      this.scheduleNext();
    }
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentIndex,
      total: this.steps.length,
    };
  }

  isPlaying(): boolean {
    return this.playing;
  }

  /** Jump to next milestone step. Returns true if found. */
  nextMilestone(): boolean {
    for (let i = this.currentIndex + 1; i < this.steps.length; i++) {
      if (this.steps[i].milestone) {
        this.jumpTo(i);
        return true;
      }
    }
    return false;
  }

  /** Jump to previous milestone step. Returns true if found. */
  prevMilestone(): boolean {
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      if (this.steps[i].milestone) {
        this.jumpTo(i);
        return true;
      }
    }
    return false;
  }

  destroy(): void {
    this.playing = false;
    this.clearTimer();
  }

  // ── Private Helpers ────────────────────────────────────────

  private scheduleNext(): void {
    if (!this.playing) return;
    if (this.currentIndex >= this.steps.length - 1) {
      this.playing = false;
      this.onComplete?.();
      return;
    }

    const currentStep = this.steps[this.currentIndex];
    let delay = currentStep.duration / this.speed;

    // ALG-246: Pedagogically-timed step durations
    // First 3 steps: slower (1.5x) — user is learning the pattern
    if (this.currentIndex < 3) delay *= 1.5;
    // Milestone steps: slower (2x) — important moments
    if (currentStep.milestone) delay *= 2;

    this.timer = setTimeout(() => {
      if (!this.playing) return;

      this.currentIndex++;
      this.onStep(this.steps[this.currentIndex], this.currentIndex);

      if (this.currentIndex < this.steps.length - 1) {
        this.scheduleNext();
      } else {
        this.playing = false;
        this.onComplete?.();
      }
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
