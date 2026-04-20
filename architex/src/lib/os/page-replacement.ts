/**
 * Page Replacement Algorithm Simulations
 *
 * Implements four page replacement algorithms (FIFO, LRU, Optimal, Clock)
 * with full event logs showing frame state transitions at every reference.
 *
 * Each algorithm accepts a reference string (sequence of page numbers) and
 * a frame count, then returns a {@link PageResult} with an ordered event
 * log suitable for step-by-step playback.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageEvent {
  tick: number;
  page: number;
  frames: number[]; // Current state of frames after this event (-1 = empty)
  hit: boolean;
  replacedPage?: number; // Which page was evicted (if fault)
  description: string;
}

export interface PageResult {
  algorithm: string;
  events: PageEvent[];
  totalFaults: number;
  totalHits: number;
  hitRate: number; // 0-1
  faultRate: number; // 0-1
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute aggregate hit/fault stats from an event list. */
function buildResult(algorithm: string, events: PageEvent[]): PageResult {
  const totalHits = events.filter((e) => e.hit).length;
  const totalFaults = events.filter((e) => !e.hit).length;
  const total = events.length;
  return {
    algorithm,
    events,
    totalFaults,
    totalHits,
    hitRate: total > 0 ? totalHits / total : 0,
    faultRate: total > 0 ? totalFaults / total : 0,
  };
}

// ---------------------------------------------------------------------------
// 1. FIFO Page Replacement
// ---------------------------------------------------------------------------

/**
 * First-In First-Out page replacement.
 *
 * Pages are evicted in the order they were loaded. A circular pointer
 * tracks the oldest frame.
 */
export function fifoPageReplacement(
  referenceString: number[],
  frameCount: number,
): PageResult {
  if (frameCount <= 0) return buildResult('FIFO', []);
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const events: PageEvent[] = [];
  let pointer = 0; // next frame to replace

  for (let tick = 0; tick < referenceString.length; tick++) {
    const page = referenceString[tick];

    // Hit check
    if (frames.includes(page)) {
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: true,
        description: `Page ${page} found in frames (HIT) — no eviction needed, page already in memory`,
      });
      continue;
    }

    // Page fault
    const emptyIdx = frames.indexOf(null);
    if (emptyIdx !== -1) {
      // Empty frame available
      frames[emptyIdx] = page;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        description: `Page ${page} loaded into empty frame ${emptyIdx} (FAULT) — cold miss, frame was unused`,
      });
    } else {
      // Evict oldest
      const evicted = frames[pointer]!;
      frames[pointer] = page;
      pointer = (pointer + 1) % frameCount;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        replacedPage: evicted,
        description: `Page ${page} replaces page ${evicted} (FIFO eviction, FAULT) — FIFO always evicts the oldest loaded page regardless of recent usage`,
      });
    }
  }

  return buildResult('FIFO', events);
}

// ---------------------------------------------------------------------------
// 2. LRU Page Replacement
// ---------------------------------------------------------------------------

/**
 * Least Recently Used page replacement.
 *
 * On a fault the page whose most recent access is furthest in the past
 * is evicted. An access-order list tracks recency.
 */
export function lruPageReplacement(
  referenceString: number[],
  frameCount: number,
): PageResult {
  if (frameCount <= 0) return buildResult('LRU', []);
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const events: PageEvent[] = [];
  const lastUsed = new Map<number, number>(); // page -> last access tick

  for (let tick = 0; tick < referenceString.length; tick++) {
    const page = referenceString[tick];

    if (frames.includes(page)) {
      // Hit -- update recency
      lastUsed.set(page, tick);
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: true,
        description: `Page ${page} found in frames (HIT) — no eviction needed, page already in memory`,
      });
      continue;
    }

    // Fault
    const emptyIdx = frames.indexOf(null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = page;
      lastUsed.set(page, tick);
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        description: `Page ${page} loaded into empty frame (FAULT) — cold miss, frame was unused`,
      });
    } else {
      // Evict least recently used
      let lruPage = frames[0]!;
      let lruTick = lastUsed.get(frames[0]!) ?? -1;
      for (const f of frames) {
        if (f === null) continue;
        const lu = lastUsed.get(f) ?? -1;
        if (lu < lruTick) {
          lruTick = lu;
          lruPage = f;
        }
      }
      const idx = frames.indexOf(lruPage);
      frames[idx] = page;
      lastUsed.delete(lruPage);
      lastUsed.set(page, tick);
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        replacedPage: lruPage,
        description: `Page ${page} replaces page ${lruPage} (LRU eviction, FAULT) — LRU evicts the page accessed longest ago, exploiting temporal locality`,
      });
    }
  }

  return buildResult('LRU', events);
}

// ---------------------------------------------------------------------------
// 3. Optimal (Belady) Page Replacement
// ---------------------------------------------------------------------------

/**
 * Optimal page replacement (Belady's algorithm).
 *
 * On a fault the page that will not be used for the longest time in the
 * future is evicted. Requires knowledge of the full reference string.
 */
export function optimalPageReplacement(
  referenceString: number[],
  frameCount: number,
): PageResult {
  if (frameCount <= 0) return buildResult('Optimal', []);
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const events: PageEvent[] = [];

  for (let tick = 0; tick < referenceString.length; tick++) {
    const page = referenceString[tick];

    if (frames.includes(page)) {
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: true,
        description: `Page ${page} found in frames (HIT) — no eviction needed, page already in memory`,
      });
      continue;
    }

    // Fault
    const emptyIdx = frames.indexOf(null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = page;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        description: `Page ${page} loaded into empty frame (FAULT) — cold miss, frame was unused`,
      });
    } else {
      // Find the page with the furthest next use (or never used again)
      let victimPage = frames[0]!;
      let furthest = -1;

      for (const f of frames) {
        if (f === null) continue;
        const nextUse = referenceString.indexOf(f, tick + 1);
        if (nextUse === -1) {
          // Never used again -- ideal victim
          victimPage = f;
          break;
        }
        if (nextUse > furthest) {
          furthest = nextUse;
          victimPage = f;
        }
      }

      const idx = frames.indexOf(victimPage);
      frames[idx] = page;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        replacedPage: victimPage,
        description: `Page ${page} replaces page ${victimPage} (Optimal eviction, FAULT) — Optimal evicts the page not needed for the longest future time (requires future knowledge)`,
      });
    }
  }

  return buildResult('Optimal', events);
}

// ---------------------------------------------------------------------------
// 4. Clock (Second-Chance) Page Replacement
// ---------------------------------------------------------------------------

/**
 * Clock (Second-Chance) page replacement.
 *
 * A circular buffer of frames with a reference bit. On a fault the
 * clock hand sweeps forward clearing reference bits until it finds a
 * frame with bit 0, which is then replaced.
 */
export function clockPageReplacement(
  referenceString: number[],
  frameCount: number,
): PageResult {
  if (frameCount <= 0) return buildResult('Clock', []);
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const refBit: boolean[] = Array(frameCount).fill(false);
  const events: PageEvent[] = [];
  let hand = 0;

  for (let tick = 0; tick < referenceString.length; tick++) {
    const page = referenceString[tick];
    const idx = frames.indexOf(page);

    if (idx !== -1) {
      // Hit -- set reference bit
      refBit[idx] = true;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: true,
        description: `Page ${page} found in frame ${idx} (HIT, ref bit set) — the reference bit is set to give this page a 'second chance' before eviction`,
      });
      continue;
    }

    // Fault
    const emptyIdx = frames.indexOf(null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = page;
      refBit[emptyIdx] = true;
      events.push({
        tick,
        page,
        frames: frames.map(f => f === null ? -1 : f),
        hit: false,
        description: `Page ${page} loaded into empty frame ${emptyIdx} (FAULT) — cold miss, frame was unused`,
      });
      continue;
    }

    // Clock sweep -- find a frame with refBit === false
     
    while (true) {
      if (!refBit[hand]) {
        // Found victim
        const evicted = frames[hand]!;
        frames[hand] = page;
        refBit[hand] = true;
        hand = (hand + 1) % frameCount;
        events.push({
          tick,
          page,
          frames: frames.map(f => f === null ? -1 : f),
          hit: false,
          replacedPage: evicted,
          description: `Page ${page} replaces page ${evicted} (Clock eviction, FAULT) — the clock hand found this page with reference bit 0, meaning it hasn't been accessed recently`,
        });
        break;
      }
      // Give second chance
      refBit[hand] = false;
      hand = (hand + 1) % frameCount;
    }
  }

  return buildResult('Clock', events);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a random reference string for testing.
 *
 * @param length  - Number of page references to generate.
 * @param maxPage - Pages will be in the range [0, maxPage).
 */
export function generateReferenceString(
  length: number,
  maxPage: number,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * maxPage));
  }
  return result;
}

/**
 * Run all page replacement algorithms on the same reference string and
 * return a mapping from algorithm name to its result.
 */
export function comparePageAlgorithms(
  referenceString: number[],
  frameCount: number,
): Record<string, PageResult> {
  return {
    FIFO: fifoPageReplacement(referenceString, frameCount),
    LRU: lruPageReplacement(referenceString, frameCount),
    Optimal: optimalPageReplacement(referenceString, frameCount),
    Clock: clockPageReplacement(referenceString, frameCount),
  };
}
