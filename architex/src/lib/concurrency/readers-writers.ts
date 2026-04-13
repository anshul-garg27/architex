/**
 * Readers-Writers Problem (OSC-015 / CON)
 *
 * Simulates the classic readers-writers synchronisation problem.
 * Multiple readers can read the shared resource simultaneously, but
 * writers require exclusive access. This implementation uses a simple
 * readers-preference policy: readers are admitted whenever no writer
 * is active, which can lead to writer starvation under heavy read
 * load.
 *
 * The simulation is single-threaded and deterministic: actors are
 * scheduled in round-robin order, yielding an event log suitable for
 * step-by-step playback.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RWEvent {
  tick: number;
  actor: string;
  action:
    | 'read-start'
    | 'read-end'
    | 'write-start'
    | 'write-end'
    | 'wait';
  readerCount: number;
  writerActive: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate a readers-writers scenario.
 *
 * Each round, all readers act first (round-robin), then all writers.
 * - A reader may start if no writer is active.
 * - A writer may start if no reader is active AND no writer is active.
 * - Active readers/writers finish after a fixed duration (2 ticks for
 *   readers, 3 for writers).
 * - When a reader or writer cannot acquire the resource, it emits a
 *   `wait` event.
 *
 * @param readerCount - Number of reader actors.
 * @param writerCount - Number of writer actors.
 * @param rounds      - Number of scheduling rounds.
 * @returns Ordered array of {@link RWEvent} for step-by-step playback.
 */
export function simulateReadersWriters(
  readerCount: number,
  writerCount: number,
  rounds: number,
): RWEvent[] {
  const events: RWEvent[] = [];
  let tick = 0;

  // State tracking
  let activeReaders = 0;
  let writerActive = false;

  // Track remaining ticks for each active actor
  const readerRemaining: number[] = new Array(readerCount).fill(0); // 0 = idle
  const writerRemaining: number[] = new Array(writerCount).fill(0);

  // Track how many rounds each actor still needs to work
  const readerRounds: number[] = new Array(readerCount).fill(rounds);
  const writerRounds: number[] = new Array(writerCount).fill(rounds);

  const READ_DURATION = 2;
  const WRITE_DURATION = 3;

  const maxTicks = rounds * (readerCount + writerCount) * 8; // safety bound

  while (tick < maxTicks) {
    // Check if all actors have completed all rounds
    const allDone =
      readerRounds.every((r) => r <= 0) &&
      writerRounds.every((w) => w <= 0) &&
      activeReaders === 0 &&
      !writerActive;
    if (allDone) break;

    // --- Tick down active actors ---
    for (let r = 0; r < readerCount; r++) {
      if (readerRemaining[r] > 0) {
        readerRemaining[r]--;
        if (readerRemaining[r] === 0) {
          activeReaders--;
          events.push({
            tick: tick++,
            actor: `reader-${r + 1}`,
            action: 'read-end',
            readerCount: activeReaders,
            writerActive,
            description: `reader-${r + 1} finishes reading (active readers: ${activeReaders})`,
          });
        }
      }
    }

    for (let w = 0; w < writerCount; w++) {
      if (writerRemaining[w] > 0) {
        writerRemaining[w]--;
        if (writerRemaining[w] === 0) {
          writerActive = false;
          events.push({
            tick: tick++,
            actor: `writer-${w + 1}`,
            action: 'write-end',
            readerCount: activeReaders,
            writerActive,
            description: `writer-${w + 1} finishes writing (resource free)`,
          });
        }
      }
    }

    // --- Reader round ---
    for (let r = 0; r < readerCount; r++) {
      if (readerRounds[r] <= 0 || readerRemaining[r] > 0) continue;

      const actor = `reader-${r + 1}`;

      if (writerActive) {
        // Writer holds exclusive access -- reader waits
        events.push({
          tick: tick++,
          actor,
          action: 'wait',
          readerCount: activeReaders,
          writerActive,
          description: `${actor} waits (writer is active)`,
        });
        continue;
      }

      // Reader can proceed
      activeReaders++;
      readerRemaining[r] = READ_DURATION;
      readerRounds[r]--;

      events.push({
        tick: tick++,
        actor,
        action: 'read-start',
        readerCount: activeReaders,
        writerActive,
        description: `${actor} starts reading (active readers: ${activeReaders})`,
      });
    }

    // --- Writer round ---
    for (let w = 0; w < writerCount; w++) {
      if (writerRounds[w] <= 0 || writerRemaining[w] > 0) continue;

      const actor = `writer-${w + 1}`;

      if (writerActive || activeReaders > 0) {
        // Resource busy -- writer waits
        const reason = writerActive
          ? 'another writer is active'
          : `${activeReaders} reader(s) active`;
        events.push({
          tick: tick++,
          actor,
          action: 'wait',
          readerCount: activeReaders,
          writerActive,
          description: `${actor} waits (${reason})`,
        });
        continue;
      }

      // Writer gets exclusive access
      writerActive = true;
      writerRemaining[w] = WRITE_DURATION;
      writerRounds[w]--;

      events.push({
        tick: tick++,
        actor,
        action: 'write-start',
        readerCount: activeReaders,
        writerActive,
        description: `${actor} starts writing (exclusive access)`,
      });
      // Only one writer per round
      break;
    }
  }

  return events;
}
