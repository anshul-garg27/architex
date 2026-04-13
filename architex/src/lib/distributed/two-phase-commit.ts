// ─────────────────────────────────────────────────────────────
// Architex — Two-Phase Commit (2PC) Simulation  [DIS-017]
// ─────────────────────────────────────────────────────────────
//
// Models the classic two-phase commit protocol used for
// distributed transactions. The coordinator sends PREPARE to
// all participants, collects votes, then broadcasts either
// COMMIT (all voted YES) or ABORT (any voted NO / timeout).
// ─────────────────────────────────────────────────────────────

/** A single step in the 2PC simulation. */
export interface TwoPCStep {
  /** Simulation tick. */
  tick: number;
  /** Current phase of the protocol. */
  phase: 'prepare' | 'vote' | 'commit' | 'abort';
  /** Coordinator node identifier. */
  coordinator: string;
  /** State of each participant at this tick. */
  participants: Array<{
    id: string;
    vote: 'yes' | 'no' | 'pending';
    committed: boolean;
  }>;
  /** Human-readable description of this step. */
  description: string;
}

/**
 * Simulates a Two-Phase Commit protocol run.
 *
 * @param participantCount - Number of participant nodes (not counting the coordinator).
 * @param failingParticipant - Zero-based index of a participant that will vote NO.
 *                             If undefined, all participants vote YES and the
 *                             transaction commits successfully.
 * @returns An array of {@link TwoPCStep} objects that describe the protocol execution.
 *
 * @example
 * ```ts
 * // Successful commit with 3 participants
 * const steps = simulate2PC(3);
 *
 * // Participant 1 votes NO, causing an abort
 * const abortSteps = simulate2PC(3, 1);
 * ```
 */
export function simulate2PC(
  participantCount: number,
  failingParticipant?: number,
): TwoPCStep[] {
  if (participantCount < 1) {
    throw new Error('2PC requires at least 1 participant.');
  }

  const coordinator = 'Coordinator';
  const steps: TwoPCStep[] = [];
  let tick = 0;

  // Helper to build participant array snapshot
  function snap(
    votes: Array<'yes' | 'no' | 'pending'>,
    committed: boolean[],
  ): TwoPCStep['participants'] {
    return votes.map((vote, i) => ({
      id: `P${i}`,
      vote,
      committed: committed[i],
    }));
  }

  const votes: Array<'yes' | 'no' | 'pending'> = Array(participantCount).fill('pending');
  const committed: boolean[] = Array(participantCount).fill(false);

  // ── Phase 0: Initial state ─────────────────────────────────
  steps.push({
    tick: tick++,
    phase: 'prepare',
    coordinator,
    participants: snap([...votes], [...committed]),
    description: `Transaction initiated. ${coordinator} begins 2PC with ${participantCount} participant(s).`,
  });

  // ── Phase 1a: Coordinator sends PREPARE ────────────────────
  steps.push({
    tick: tick++,
    phase: 'prepare',
    coordinator,
    participants: snap([...votes], [...committed]),
    description: `${coordinator} sends PREPARE to all participants.`,
  });

  // ── Phase 1b: Participants vote ────────────────────────────
  const willAbort = failingParticipant !== undefined && failingParticipant >= 0 && failingParticipant < participantCount;

  for (let i = 0; i < participantCount; i++) {
    if (willAbort && i === failingParticipant) {
      votes[i] = 'no';
    } else {
      votes[i] = 'yes';
    }
  }

  steps.push({
    tick: tick++,
    phase: 'vote',
    coordinator,
    participants: snap([...votes], [...committed]),
    description: willAbort
      ? `Participants vote. P${failingParticipant} votes NO (cannot prepare).`
      : `All participants vote YES (ready to commit).`,
  });

  // ── Phase 2: Decision ──────────────────────────────────────
  if (willAbort) {
    // ABORT path
    steps.push({
      tick: tick++,
      phase: 'abort',
      coordinator,
      participants: snap([...votes], [...committed]),
      description: `${coordinator} receives a NO vote. Decision: ABORT.`,
    });

    steps.push({
      tick: tick++,
      phase: 'abort',
      coordinator,
      participants: snap([...votes], [...committed]),
      description: `${coordinator} sends ABORT to all participants. Transaction rolled back.`,
    });
  } else {
    // COMMIT path
    steps.push({
      tick: tick++,
      phase: 'commit',
      coordinator,
      participants: snap([...votes], [...committed]),
      description: `${coordinator} receives all YES votes. Decision: COMMIT.`,
    });

    // All participants commit
    for (let i = 0; i < participantCount; i++) {
      committed[i] = true;
    }

    steps.push({
      tick: tick++,
      phase: 'commit',
      coordinator,
      participants: snap([...votes], [...committed]),
      description: `${coordinator} sends COMMIT to all participants. All acknowledge. Transaction committed.`,
    });
  }

  return steps;
}
