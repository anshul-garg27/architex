/**
 * Dining Philosophers Problem
 *
 * Simulates the classic Dining Philosophers concurrency scenario with
 * two strategies:
 *
 * 1. **Naive** ({@link simulateNaive}) -- each philosopher picks up their
 *    left fork first, then their right fork. This can deadlock when every
 *    philosopher holds their left fork and waits for the right.
 *
 * 2. **Resource Ordering** ({@link simulateOrdered}) -- philosophers always
 *    pick up the lower-numbered fork first. This breaks the circular-wait
 *    condition and prevents deadlock entirely.
 *
 * Both produce an ordered event log with per-tick state for visualisation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhilosopherEvent {
  tick: number;
  philosopherId: number;
  state: 'thinking' | 'hungry' | 'eating' | 'waiting';
  forks: boolean[]; // which forks are held [left, right]
  allForkStates: string[]; // who holds each fork
  description: string;
  deadlock: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine fork indices for a philosopher (left and right). */
function forkIndices(
  id: number,
  count: number,
): { left: number; right: number } {
  return {
    left: id,
    right: (id + 1) % count,
  };
}

/**
 * Build a human-readable state array for all forks.
 * Each entry says "free" or "P<id>".
 */
function forkStateLabels(
  forkOwner: (number | null)[],
): string[] {
  return forkOwner.map((owner) =>
    owner === null ? 'free' : `P${owner}`,
  );
}

/** Check if all philosophers are holding exactly one fork (circular wait). */
function isDeadlocked(
  forkOwner: (number | null)[],
  phState: string[],
  count: number,
): boolean {
  // Deadlock: every philosopher is 'waiting' and holds exactly their left fork
  for (let i = 0; i < count; i++) {
    if (phState[i] !== 'waiting') return false;
  }
  // Verify each holds exactly one fork
  for (let i = 0; i < count; i++) {
    const { left, right } = forkIndices(i, count);
    const holdsLeft = forkOwner[left] === i;
    const holdsRight = forkOwner[right] === i;
    if (!(holdsLeft && !holdsRight)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 1. Naive Strategy (can deadlock)
// ---------------------------------------------------------------------------

/**
 * Simulate dining philosophers with the naive strategy.
 *
 * Each philosopher: think -> pick up left fork -> pick up right fork ->
 * eat -> put down both forks -> think.
 *
 * When all philosophers pick up their left fork simultaneously, a deadlock
 * occurs because each waits for the right fork held by their neighbour.
 *
 * @param philosopherCount - Number of philosophers (and forks) at the table.
 * @param ticks            - Maximum simulation ticks before stopping.
 */
export function simulateNaive(
  philosopherCount: number,
  ticks: number,
): PhilosopherEvent[] {
  const events: PhilosopherEvent[] = [];
  const count = philosopherCount;

  // Fork ownership: null = free, otherwise philosopher id
  const forkOwner: (number | null)[] = Array(count).fill(null);
  // Philosopher states
  const phState: string[] = Array(count).fill('thinking');
  // Tracks whether each philosopher holds [left, right]
  const phForks: boolean[][] = Array.from({ length: count }, () => [
    false,
    false,
  ]);
  // Eating timer: how many more ticks of eating remain
  const eatTimer: number[] = Array(count).fill(0);
  // Think timer
  const thinkTimer: number[] = [];
  for (let i = 0; i < count; i++) {
    thinkTimer.push(1); // think for 1 tick initially
  }

  for (let tick = 0; tick < ticks; tick++) {
    for (let id = 0; id < count; id++) {
      const { left, right } = forkIndices(id, count);

      if (phState[id] === 'thinking') {
        thinkTimer[id]--;
        if (thinkTimer[id] <= 0) {
          phState[id] = 'hungry';
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} becomes hungry`,
            deadlock: false,
          });
        }
      }

      if (phState[id] === 'hungry') {
        // Try to pick up left fork
        if (!phForks[id][0] && forkOwner[left] === null) {
          forkOwner[left] = id;
          phForks[id][0] = true;
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} picks up left fork (fork ${left})`,
            deadlock: false,
          });
        }

        // Try to pick up right fork
        if (phForks[id][0] && !phForks[id][1] && forkOwner[right] === null) {
          forkOwner[right] = id;
          phForks[id][1] = true;
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} picks up right fork (fork ${right})`,
            deadlock: false,
          });
        }

        // If holding both forks, start eating
        if (phForks[id][0] && phForks[id][1]) {
          phState[id] = 'eating';
          eatTimer[id] = 2; // eat for 2 ticks
          events.push({
            tick,
            philosopherId: id,
            state: 'eating',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} starts eating`,
            deadlock: false,
          });
        } else if (phForks[id][0] && !phForks[id][1]) {
          phState[id] = 'waiting';
          events.push({
            tick,
            philosopherId: id,
            state: 'waiting',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} waiting for right fork (fork ${right})`,
            deadlock: false,
          });
        }
      }

      if (phState[id] === 'waiting') {
        // Still trying for right fork
        if (!phForks[id][1] && forkOwner[right] === null) {
          forkOwner[right] = id;
          phForks[id][1] = true;
          phState[id] = 'eating';
          eatTimer[id] = 2;
          events.push({
            tick,
            philosopherId: id,
            state: 'eating',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} picks up right fork (fork ${right}) and starts eating`,
            deadlock: false,
          });
        }
      }

      if (phState[id] === 'eating') {
        eatTimer[id]--;
        if (eatTimer[id] <= 0) {
          // Put down both forks
          forkOwner[left] = null;
          forkOwner[right] = null;
          phForks[id][0] = false;
          phForks[id][1] = false;
          phState[id] = 'thinking';
          thinkTimer[id] = 1;
          events.push({
            tick,
            philosopherId: id,
            state: 'thinking',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} finishes eating, puts down forks ${left} and ${right}`,
            deadlock: false,
          });
        }
      }
    }

    // Check for deadlock at end of tick
    if (isDeadlocked(forkOwner, phState, count)) {
      for (let id = 0; id < count; id++) {
        events.push({
          tick,
          philosopherId: id,
          state: 'waiting',
          forks: [...phForks[id]],
          allForkStates: forkStateLabels(forkOwner),
          description: `DEADLOCK: All philosophers hold left fork and wait for right`,
          deadlock: true,
        });
      }
      break; // Stop simulation
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// 2. Resource Ordering Strategy (deadlock-free)
// ---------------------------------------------------------------------------

/**
 * Simulate dining philosophers with resource ordering.
 *
 * Each philosopher picks up the lower-numbered fork first, then the
 * higher-numbered fork. This breaks the circular-wait condition: at least
 * one philosopher (the one straddling the highest and lowest fork) will
 * request the forks in the opposite order from the naive approach,
 * preventing the cycle.
 *
 * @param philosopherCount - Number of philosophers (and forks) at the table.
 * @param ticks            - Maximum simulation ticks.
 */
export function simulateOrdered(
  philosopherCount: number,
  ticks: number,
): PhilosopherEvent[] {
  const events: PhilosopherEvent[] = [];
  const count = philosopherCount;

  const forkOwner: (number | null)[] = Array(count).fill(null);
  const phState: string[] = Array(count).fill('thinking');
  const phForks: boolean[][] = Array.from({ length: count }, () => [
    false,
    false,
  ]);
  const eatTimer: number[] = Array(count).fill(0);
  const thinkTimer: number[] = [];
  for (let i = 0; i < count; i++) {
    thinkTimer.push(1);
  }

  for (let tick = 0; tick < ticks; tick++) {
    for (let id = 0; id < count; id++) {
      const { left, right } = forkIndices(id, count);
      // Resource ordering: always pick up lower-numbered fork first
      const first = Math.min(left, right);
      const second = Math.max(left, right);
      const firstIsLeft = first === left;

      if (phState[id] === 'thinking') {
        thinkTimer[id]--;
        if (thinkTimer[id] <= 0) {
          phState[id] = 'hungry';
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} becomes hungry (will acquire fork ${first} then ${second})`,
            deadlock: false,
          });
        }
      }

      if (phState[id] === 'hungry' || phState[id] === 'waiting') {
        // Try to pick up first (lower-numbered) fork
        const hasFirst = firstIsLeft ? phForks[id][0] : phForks[id][1];
        if (!hasFirst && forkOwner[first] === null) {
          forkOwner[first] = id;
          if (firstIsLeft) {
            phForks[id][0] = true;
          } else {
            phForks[id][1] = true;
          }
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} picks up fork ${first} (ordered: lower first)`,
            deadlock: false,
          });
        }

        // Try to pick up second (higher-numbered) fork only if first is held
        const hasFirstNow = firstIsLeft ? phForks[id][0] : phForks[id][1];
        const hasSecond = firstIsLeft ? phForks[id][1] : phForks[id][0];
        if (hasFirstNow && !hasSecond && forkOwner[second] === null) {
          forkOwner[second] = id;
          if (firstIsLeft) {
            phForks[id][1] = true;
          } else {
            phForks[id][0] = true;
          }
          events.push({
            tick,
            philosopherId: id,
            state: 'hungry',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} picks up fork ${second} (ordered: higher second)`,
            deadlock: false,
          });
        }

        // Start eating if both forks held
        if (phForks[id][0] && phForks[id][1]) {
          phState[id] = 'eating';
          eatTimer[id] = 2;
          events.push({
            tick,
            philosopherId: id,
            state: 'eating',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} starts eating`,
            deadlock: false,
          });
        } else if (
          (firstIsLeft ? phForks[id][0] : phForks[id][1]) &&
          !(firstIsLeft ? phForks[id][1] : phForks[id][0])
        ) {
          phState[id] = 'waiting';
          events.push({
            tick,
            philosopherId: id,
            state: 'waiting',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} waiting for fork ${second}`,
            deadlock: false,
          });
        }
      }

      if (phState[id] === 'eating') {
        eatTimer[id]--;
        if (eatTimer[id] <= 0) {
          forkOwner[left] = null;
          forkOwner[right] = null;
          phForks[id][0] = false;
          phForks[id][1] = false;
          phState[id] = 'thinking';
          thinkTimer[id] = 1;
          events.push({
            tick,
            philosopherId: id,
            state: 'thinking',
            forks: [...phForks[id]],
            allForkStates: forkStateLabels(forkOwner),
            description: `P${id} finishes eating, puts down forks ${left} and ${right}`,
            deadlock: false,
          });
        }
      }
    }

    // With resource ordering, deadlock should never occur.
    // Verify as a sanity check.
    if (isDeadlocked(forkOwner, phState, count)) {
      // This should never happen with correct resource ordering.
      for (let id = 0; id < count; id++) {
        events.push({
          tick,
          philosopherId: id,
          state: 'waiting',
          forks: [...phForks[id]],
          allForkStates: forkStateLabels(forkOwner),
          description: `UNEXPECTED DEADLOCK (resource ordering should prevent this)`,
          deadlock: true,
        });
      }
      break;
    }
  }

  return events;
}
