// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Multi-Armed Bandit (MLD-024)
// ─────────────────────────────────────────────────────────────
//
// Simulation utilities for three common bandit strategies:
// - Epsilon-Greedy
// - UCB1 (Upper Confidence Bound)
// - Thompson Sampling (Beta-Bernoulli)
//
// Each simulator returns a time-stepped sequence that can be
// visualised as animated bar charts of estimated arm values.
// ─────────────────────────────────────────────────────────────

export interface BanditArm {
  id: string;
  pulls: number;
  rewards: number;
  estimatedValue: number;
}

export interface BanditStep {
  tick: number;
  selectedArm: string;
  reward: number;
  arms: BanditArm[];
  strategy: string;
}

// ── Deterministic pseudo-random for reproducible demos ──────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Hidden true reward probabilities per arm ────────────────

function trueProbabilities(armCount: number, rand: () => number): number[] {
  // Create distinct, spread-out probabilities
  const probs: number[] = [];
  for (let i = 0; i < armCount; i++) {
    probs.push(0.1 + (0.7 * (i + 1)) / (armCount + 1) + rand() * 0.05);
  }
  // Shuffle to remove ordering bias
  for (let i = probs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [probs[i], probs[j]] = [probs[j], probs[i]];
  }
  return probs;
}

// ── Helper: snapshot current arm state ──────────────────────

function snapshotArms(
  pulls: number[],
  rewards: number[],
  armCount: number
): BanditArm[] {
  return Array.from({ length: armCount }, (_, i) => ({
    id: `Arm ${i + 1}`,
    pulls: pulls[i],
    rewards: rewards[i],
    estimatedValue:
      pulls[i] > 0
        ? parseFloat((rewards[i] / pulls[i]).toFixed(4))
        : 0,
  }));
}

// ── Epsilon-Greedy ──────────────────────────────────────────

/**
 * Simulate an epsilon-greedy bandit.
 *
 * With probability `epsilon` a random arm is chosen (explore),
 * otherwise the arm with the highest estimated value is chosen (exploit).
 */
export function simulateEpsilonGreedy(
  arms: number,
  rounds: number,
  epsilon: number
): BanditStep[] {
  const rand = seededRandom(42);
  const trueP = trueProbabilities(arms, rand);
  const pulls = new Array(arms).fill(0) as number[];
  const rewards = new Array(arms).fill(0) as number[];
  const steps: BanditStep[] = [];

  for (let t = 1; t <= rounds; t++) {
    let chosen: number;
    if (rand() < epsilon) {
      // Explore
      chosen = Math.floor(rand() * arms);
    } else {
      // Exploit — pick best estimated arm
      let bestVal = -1;
      chosen = 0;
      for (let i = 0; i < arms; i++) {
        const est = pulls[i] > 0 ? rewards[i] / pulls[i] : Infinity;
        if (est > bestVal) {
          bestVal = est;
          chosen = i;
        }
      }
    }

    const reward = rand() < trueP[chosen] ? 1 : 0;
    pulls[chosen]++;
    rewards[chosen] += reward;

    steps.push({
      tick: t,
      selectedArm: `Arm ${chosen + 1}`,
      reward,
      arms: snapshotArms(pulls, rewards, arms),
      strategy: "epsilon-greedy",
    });
  }

  return steps;
}

// ── UCB1 (Upper Confidence Bound) ───────────────────────────

/**
 * Simulate the UCB1 algorithm. Selects the arm that maximises:
 *   estimated_value + sqrt(2 * ln(t) / pulls)
 */
export function simulateUCB1(arms: number, rounds: number): BanditStep[] {
  const rand = seededRandom(77);
  const trueP = trueProbabilities(arms, rand);
  const pulls = new Array(arms).fill(0) as number[];
  const rewards = new Array(arms).fill(0) as number[];
  const steps: BanditStep[] = [];

  for (let t = 1; t <= rounds; t++) {
    let chosen: number;

    // Play each arm once first
    const unplayed = pulls.findIndex((p) => p === 0);
    if (unplayed !== -1) {
      chosen = unplayed;
    } else {
      // UCB1 selection
      let bestUCB = -Infinity;
      chosen = 0;
      for (let i = 0; i < arms; i++) {
        const avg = rewards[i] / pulls[i];
        const bonus = Math.sqrt((2 * Math.log(t)) / pulls[i]);
        const ucb = avg + bonus;
        if (ucb > bestUCB) {
          bestUCB = ucb;
          chosen = i;
        }
      }
    }

    const reward = rand() < trueP[chosen] ? 1 : 0;
    pulls[chosen]++;
    rewards[chosen] += reward;

    steps.push({
      tick: t,
      selectedArm: `Arm ${chosen + 1}`,
      reward,
      arms: snapshotArms(pulls, rewards, arms),
      strategy: "ucb1",
    });
  }

  return steps;
}

// ── Thompson Sampling (Beta-Bernoulli) ──────────────────────

/**
 * Simulate Thompson Sampling with Beta(alpha, beta) priors.
 * Each arm maintains alpha = 1 + successes, beta = 1 + failures.
 * A sample is drawn from each arm's Beta distribution and the
 * arm with the highest sample is selected.
 */
export function simulateThompsonSampling(
  arms: number,
  rounds: number
): BanditStep[] {
  const rand = seededRandom(123);
  const trueP = trueProbabilities(arms, rand);
  const pulls = new Array(arms).fill(0) as number[];
  const rewards = new Array(arms).fill(0) as number[];
  const steps: BanditStep[] = [];

  // Beta distribution sampling via the Jöhnk method (simplified)
  function sampleBeta(alpha: number, beta: number): number {
    // Use the gamma-ratio method via log-sum
    // For integer-ish alpha/beta this is fine
    let x = 0;
    let y = 0;
    // Gamma(alpha) sample via Marsaglia & Tsang
    const sampleGamma = (shape: number): number => {
      if (shape < 1) {
        return sampleGamma(shape + 1) * Math.pow(rand(), 1 / shape);
      }
      const d = shape - 1 / 3;
      const c = 1 / Math.sqrt(9 * d);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let xg: number;
        let v: number;
        do {
          // Box-Muller for normal sample
          const u1 = rand();
          const u2 = rand();
          xg = Math.sqrt(-2 * Math.log(u1 || 1e-15)) * Math.cos(2 * Math.PI * u2);
          v = Math.pow(1 + c * xg, 3);
        } while (v <= 0);
        const u = rand();
        if (
          u < 1 - 0.0331 * xg * xg * xg * xg ||
          Math.log(u) < 0.5 * xg * xg + d * (1 - v + Math.log(v))
        ) {
          return d * v;
        }
      }
    };
    x = sampleGamma(alpha);
    y = sampleGamma(beta);
    return x / (x + y);
  }

  for (let t = 1; t <= rounds; t++) {
    let bestSample = -1;
    let chosen = 0;

    for (let i = 0; i < arms; i++) {
      const alphaI = 1 + rewards[i];
      const betaI = 1 + (pulls[i] - rewards[i]);
      const sample = sampleBeta(alphaI, betaI);
      if (sample > bestSample) {
        bestSample = sample;
        chosen = i;
      }
    }

    const reward = rand() < trueP[chosen] ? 1 : 0;
    pulls[chosen]++;
    rewards[chosen] += reward;

    steps.push({
      tick: t,
      selectedArm: `Arm ${chosen + 1}`,
      reward,
      arms: snapshotArms(pulls, rewards, arms),
      strategy: "thompson-sampling",
    });
  }

  return steps;
}
