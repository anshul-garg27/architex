// -----------------------------------------------------------------
// Architex -- Paxos Protocol Simulation  [DIS-014, DIS-015]
// -----------------------------------------------------------------
//
// Models a single-decree Paxos consensus round. Demonstrates
// the Prepare/Promise/Accept/Accepted phases and supports
// competing proposers to show how proposal numbers resolve
// conflicts. A value is "learned" once a majority of acceptors
// have accepted the same proposal.
// -----------------------------------------------------------------

/** A single step in the Paxos simulation. */
export interface PaxosStep {
  /** Simulation tick. */
  tick: number;
  /** Current phase of the protocol. */
  phase: 'prepare' | 'promise' | 'accept' | 'accepted' | 'learn';
  /** The proposer driving this step. */
  proposer: string;
  /** The acceptors involved in this step. */
  acceptors: string[];
  /** The value being proposed (if any). */
  value?: string;
  /** The proposal number used. */
  proposalNumber: number;
  /** Human-readable description of this step. */
  description: string;
  /** Whether this step is part of a Multi-Paxos run (vs. single-decree). */
  isMultiPaxos: boolean;
}

/**
 * Simulates a Paxos consensus protocol run with potentially
 * competing proposers.
 *
 * The simulation shows:
 * 1. Proposer 1 sends Prepare(n=1) to all acceptors.
 * 2. Acceptors reply with Promise (no prior accepted value).
 * 3. If there is a second proposer, it sends Prepare(n=2) before
 *    Proposer 1 can complete, causing a conflict.
 * 4. Acceptors promise to n=2 (higher), so Proposer 1's Accept is
 *    rejected by a majority.
 * 5. Proposer 2 completes Accept/Accepted/Learn.
 *
 * With a single proposer, the happy path completes normally.
 *
 * @param proposerCount - Number of proposers (1 or 2 for demo).
 * @param acceptorCount - Number of acceptor nodes (should be odd for majority).
 * @returns An array of {@link PaxosStep} objects describing the protocol.
 *
 * @example
 * ```ts
 * // Single proposer, 3 acceptors -- happy path
 * const steps = simulatePaxos(1, 3);
 *
 * // Two competing proposers, 5 acceptors
 * const competing = simulatePaxos(2, 5);
 * ```
 */
export function simulatePaxos(
  proposerCount: number,
  acceptorCount: number,
): PaxosStep[] {
  if (proposerCount < 1) {
    throw new Error('Paxos requires at least 1 proposer.');
  }
  if (acceptorCount < 1) {
    throw new Error('Paxos requires at least 1 acceptor.');
  }

  const proposers = Array.from({ length: proposerCount }, (_, i) => `Proposer-${i + 1}`);
  const acceptors = Array.from({ length: acceptorCount }, (_, i) => `Acceptor-${i + 1}`);
  const majority = Math.floor(acceptorCount / 2) + 1;
  const steps: PaxosStep[] = [];
  let tick = 0;

  if (proposerCount === 1) {
    // -- Single proposer: clean happy path -------------------------
    const p = proposers[0];
    const value = 'v1';

    // Phase 1a: Prepare
    steps.push({
      tick: tick++,
      phase: 'prepare',
      proposer: p,
      acceptors: [...acceptors],
      proposalNumber: 1,
      description: `${p} broadcasts Prepare(n=1) to all ${acceptorCount} acceptors.`,
      isMultiPaxos: false,
    });

    // Phase 1b: Promise
    steps.push({
      tick: tick++,
      phase: 'promise',
      proposer: p,
      acceptors: [...acceptors],
      proposalNumber: 1,
      description: `All ${acceptorCount} acceptors reply Promise(n=1). No prior accepted value.`,
      isMultiPaxos: false,
    });

    // Phase 2a: Accept
    steps.push({
      tick: tick++,
      phase: 'accept',
      proposer: p,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `${p} received ${acceptorCount} promises (>= majority ${majority}). Sends Accept(n=1, v="${value}").`,
      isMultiPaxos: false,
    });

    // Phase 2b: Accepted
    steps.push({
      tick: tick++,
      phase: 'accepted',
      proposer: p,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `All ${acceptorCount} acceptors accept proposal (n=1, v="${value}").`,
      isMultiPaxos: false,
    });

    // Learn
    steps.push({
      tick: tick++,
      phase: 'learn',
      proposer: p,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `Consensus reached! Value "${value}" is learned. Majority (${majority}/${acceptorCount}) accepted.`,
      isMultiPaxos: false,
    });
  } else {
    // -- Competing proposers: conflict scenario --------------------
    const p1 = proposers[0];
    const p2 = proposers[1];
    const v1 = 'v1';
    const v2 = 'v2';

    // P1 Phase 1a: Prepare(n=1)
    steps.push({
      tick: tick++,
      phase: 'prepare',
      proposer: p1,
      acceptors: [...acceptors],
      proposalNumber: 1,
      description: `${p1} broadcasts Prepare(n=1) to all acceptors.`,
      isMultiPaxos: false,
    });

    // P1 Phase 1b: Promise to n=1
    steps.push({
      tick: tick++,
      phase: 'promise',
      proposer: p1,
      acceptors: [...acceptors],
      proposalNumber: 1,
      description: `All acceptors reply Promise(n=1). No prior accepted value.`,
      isMultiPaxos: false,
    });

    // P2 Phase 1a: Prepare(n=2) -- arrives before P1 can do Accept
    steps.push({
      tick: tick++,
      phase: 'prepare',
      proposer: p2,
      acceptors: [...acceptors],
      proposalNumber: 2,
      description: `${p2} broadcasts Prepare(n=2) -- higher proposal number!`,
      isMultiPaxos: false,
    });

    // P2 Phase 1b: Acceptors promise to n=2 (supersedes n=1)
    steps.push({
      tick: tick++,
      phase: 'promise',
      proposer: p2,
      acceptors: [...acceptors],
      proposalNumber: 2,
      description: `All acceptors reply Promise(n=2). They will now reject proposals with n<2.`,
      isMultiPaxos: false,
    });

    // P1 Phase 2a: Accept(n=1) -- too late, rejected
    // Majority rejects because they promised n=2
    const rejectCount = majority; // majority already promised n=2
    steps.push({
      tick: tick++,
      phase: 'accept',
      proposer: p1,
      acceptors: acceptors.slice(0, rejectCount),
      value: v1,
      proposalNumber: 1,
      description: `${p1} sends Accept(n=1, v="${v1}") -- REJECTED by ${rejectCount} acceptors (promised n=2).`,
      isMultiPaxos: false,
    });

    // P2 Phase 2a: Accept(n=2, v2)
    steps.push({
      tick: tick++,
      phase: 'accept',
      proposer: p2,
      acceptors: [...acceptors],
      value: v2,
      proposalNumber: 2,
      description: `${p2} sends Accept(n=2, v="${v2}") to all acceptors.`,
      isMultiPaxos: false,
    });

    // P2 Phase 2b: Accepted
    steps.push({
      tick: tick++,
      phase: 'accepted',
      proposer: p2,
      acceptors: [...acceptors],
      value: v2,
      proposalNumber: 2,
      description: `All ${acceptorCount} acceptors accept proposal (n=2, v="${v2}").`,
      isMultiPaxos: false,
    });

    // Learn
    steps.push({
      tick: tick++,
      phase: 'learn',
      proposer: p2,
      acceptors: [...acceptors],
      value: v2,
      proposalNumber: 2,
      description: `Consensus reached! Value "${v2}" is learned. ${p1}'s proposal was pre-empted by ${p2}.`,
      isMultiPaxos: false,
    });
  }

  return steps;
}

/**
 * Simulates Multi-Paxos: a stable leader drives multiple consensus
 * rounds, skipping Phase 1 (Prepare/Promise) after the first round.
 *
 * This demonstrates the key optimisation of Multi-Paxos over
 * single-decree Paxos: once a leader is established, subsequent
 * proposals only need Phase 2 (Accept/Accepted/Learn), cutting the
 * per-proposal cost from 5 phases to 3.
 *
 * @param acceptorCount - Number of acceptor nodes (should be odd).
 * @param proposalCount - How many values to propose in sequence.
 * @returns An array of {@link PaxosStep} objects.
 *
 * @example
 * ```ts
 * // 3 acceptors, 4 sequential proposals
 * const steps = simulateMultiPaxos(3, 4);
 * // First proposal: 5 phases. Next 3: 3 phases each => 5 + 9 = 14 steps.
 * ```
 */
export function simulateMultiPaxos(
  acceptorCount: number,
  proposalCount: number,
): PaxosStep[] {
  if (acceptorCount < 1) {
    throw new Error('Multi-Paxos requires at least 1 acceptor.');
  }
  if (proposalCount < 1) {
    throw new Error('Multi-Paxos requires at least 1 proposal.');
  }

  const leader = 'Leader';
  const acceptors = Array.from({ length: acceptorCount }, (_, i) => `Acceptor-${i + 1}`);
  const majority = Math.floor(acceptorCount / 2) + 1;
  const steps: PaxosStep[] = [];
  let tick = 0;

  for (let round = 1; round <= proposalCount; round++) {
    const value = `v${round}`;
    const isFirstRound = round === 1;

    if (isFirstRound) {
      // ── Full Paxos: Phase 1 + Phase 2 ─────────────────────────

      // Phase 1a: Prepare
      steps.push({
        tick: tick++,
        phase: 'prepare',
        proposer: leader,
        acceptors: [...acceptors],
        proposalNumber: 1,
        description: `[Round ${round}] ${leader} broadcasts Prepare(n=1) to all ${acceptorCount} acceptors — establishing leadership.`,
        isMultiPaxos: true,
      });

      // Phase 1b: Promise
      steps.push({
        tick: tick++,
        phase: 'promise',
        proposer: leader,
        acceptors: [...acceptors],
        proposalNumber: 1,
        description: `[Round ${round}] All ${acceptorCount} acceptors reply Promise(n=1). ${leader} is now the established leader.`,
        isMultiPaxos: true,
      });
    }

    // ── Phase 2 (runs every round) ──────────────────────────────

    // Phase 2a: Accept
    const phaseSkipNote = !isFirstRound
      ? ' Phase 1 skipped — leader already established.'
      : '';
    steps.push({
      tick: tick++,
      phase: 'accept',
      proposer: leader,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `[Round ${round}] ${leader} sends Accept(n=1, v="${value}") to all acceptors.${phaseSkipNote}`,
      isMultiPaxos: true,
    });

    // Phase 2b: Accepted
    steps.push({
      tick: tick++,
      phase: 'accepted',
      proposer: leader,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `[Round ${round}] All ${acceptorCount} acceptors accept proposal (n=1, v="${value}").`,
      isMultiPaxos: true,
    });

    // Learn
    steps.push({
      tick: tick++,
      phase: 'learn',
      proposer: leader,
      acceptors: [...acceptors],
      value,
      proposalNumber: 1,
      description: `[Round ${round}] Consensus reached! Value "${value}" is learned. Majority (${majority}/${acceptorCount}) accepted.${!isFirstRound ? ' (Only 3 phases needed — Multi-Paxos optimisation.)' : ''}`,
      isMultiPaxos: true,
    });
  }

  return steps;
}
