/**
 * Time-Travel Debugging for Simulation (INO-007)
 *
 * Records simulation state at every tick, enabling users to scrub
 * backward and forward through the simulation timeline to inspect
 * node states, global metrics, and chaos events at any point in time.
 */

import type { SimulationMetrics } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** State snapshot for a single node at a given tick. */
export interface NodeStateSnapshot {
  utilization: number;
  latency: number;
  errorRate: number;
  state: string;
}

/** Complete simulation state at a single tick. */
export interface SimulationFrame {
  tick: number;
  nodeStates: Map<string, NodeStateSnapshot>;
  globalMetrics: SimulationMetrics;
  activeChaos: string[];
}

// ---------------------------------------------------------------------------
// TimeTravel
// ---------------------------------------------------------------------------

/**
 * Stores an ordered list of simulation frames, one per tick.
 *
 * Frames are stored in a flat array indexed by tick number.
 * Supports O(1) lookup by tick via array indexing, and O(1) append.
 *
 * Memory budget: for a 600-tick simulation with 50 nodes, each frame
 * is roughly 2-3 KB, giving ~1.5 MB total — well within browser limits.
 */
export class TimeTravel {
  private frames: SimulationFrame[] = [];

  /**
   * Record a frame for a given tick.
   *
   * Frames are expected to arrive in tick order. If a frame for a tick
   * that already exists is recorded, it overwrites the previous one.
   */
  recordFrame(frame: SimulationFrame): void {
    // If tick matches the next expected index, push; otherwise overwrite.
    if (frame.tick === this.frames.length) {
      this.frames.push(frame);
    } else if (frame.tick < this.frames.length) {
      this.frames[frame.tick] = frame;
    } else {
      // Fill any gaps with undefined-safe placeholders (should not happen
      // in practice since ticks are sequential).
      while (this.frames.length < frame.tick) {
        this.frames.push(this.frames[this.frames.length - 1]);
      }
      this.frames.push(frame);
    }
  }

  /**
   * Retrieve the frame recorded at a specific tick.
   *
   * @param tick - Zero-based tick index.
   * @returns The frame, or undefined if no frame exists at that tick.
   */
  getFrame(tick: number): SimulationFrame | undefined {
    if (tick < 0 || tick >= this.frames.length) return undefined;
    return this.frames[tick];
  }

  /** Return the total number of recorded frames. */
  getFrameCount(): number {
    return this.frames.length;
  }

  /** Return all recorded frames (read-only snapshot). */
  getFrames(): readonly SimulationFrame[] {
    return this.frames;
  }

  /** Clear all recorded frames (e.g. on simulation reset). */
  clear(): void {
    this.frames = [];
  }
}
