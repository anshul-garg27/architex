// ─────────────────────────────────────────────────────────────
// Architex — Password Hashing Demo  (SEC-021)
// ─────────────────────────────────────────────────────────────
//
// Educational demonstration of bcrypt password hashing:
//   plaintext → salt generation → hash rounds → final hash
//
// Shows why bcrypt is slow by design (cost factor / work factor)
// and demonstrates the difference between:
//   - Unsalted hash (vulnerable to rainbow tables)
//   - Salted hash (unique per password)
//   - Bcrypt with configurable cost factor
// ─────────────────────────────────────────────────────────────

export interface HashingStep {
  /** Step label for display. */
  step: string;
  /** Human-readable description of what happens. */
  description: string;
  /** Data produced at this step (hex, hash, etc.). */
  data: string;
}

export interface RainbowTableEntry {
  /** The plaintext password. */
  password: string;
  /** Unsalted MD5 hash. */
  md5: string;
  /** Whether an attacker can look this up in a rainbow table. */
  cracked: boolean;
}

// ── Helpers ─────────────────────────────────────────────────

function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

/**
 * Simple deterministic hash simulation (NOT cryptographic).
 * Produces a consistent hex digest for visualization purposes.
 */
function simpleHash(input: string): string {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
    h = h >>> 0; // ensure unsigned
  }
  // Expand to 32 hex chars by repeated hashing
  let result = "";
  let state = h;
  for (let i = 0; i < 8; i++) {
    state = Math.imul(state ^ (state >>> 16), 0x45d9f3b);
    state = state >>> 0;
    result += state.toString(16).padStart(8, "0");
  }
  return result.slice(0, 64);
}

function simulateBcryptHash(input: string, salt: string, rounds: number): string {
  // Simulated: chain-hash the input with salt `rounds` times
  let state = input + salt;
  for (let i = 0; i < rounds; i++) {
    state = simpleHash(state);
  }
  return state.slice(0, 60);
}

// ── Main Functions ──────────────────────────────────────────

/**
 * Demonstrate the bcrypt hashing pipeline step by step.
 *
 * @param password  The plaintext password to hash.
 * @param costFactor  The bcrypt cost factor (4-12 for demo). Default 10.
 * @returns Ordered list of hashing steps for visualization.
 */
export function demonstrateBcrypt(
  password: string,
  costFactor: number = 10,
): HashingStep[] {
  const clampedCost = Math.max(4, Math.min(costFactor, 12));
  const rounds = Math.pow(2, clampedCost);
  const salt = randomHex(32);
  const steps: HashingStep[] = [];

  // Step 1: Plaintext input
  steps.push({
    step: "Plaintext Input",
    description:
      `The user enters their password as plaintext. ` +
      `This must NEVER be stored directly — anyone with database access could read it.`,
    data: password,
  });

  // Step 2: Salt generation
  steps.push({
    step: "Salt Generation",
    description:
      `A cryptographically random 128-bit salt is generated. ` +
      `Each password gets a UNIQUE salt, so identical passwords produce different hashes. ` +
      `This defeats precomputed rainbow table attacks.`,
    data: salt,
  });

  // Step 3: Combine password + salt
  const combined = password + salt;
  steps.push({
    step: "Combine Password + Salt",
    description:
      `The plaintext password is concatenated with the salt before hashing. ` +
      `Even if two users choose "password123", their different salts ensure different outputs.`,
    data: `${password} || ${salt.slice(0, 16)}...`,
  });

  // Step 4: Cost factor explanation
  steps.push({
    step: `Cost Factor = ${clampedCost}`,
    description:
      `Bcrypt's cost factor determines how many rounds of hashing to perform: ` +
      `2^${clampedCost} = ${rounds.toLocaleString()} rounds. Higher cost = slower hash = harder to brute-force. ` +
      `Each increment DOUBLES the work. A cost of 10 takes ~100ms, cost 12 takes ~400ms.`,
    data: `2^${clampedCost} = ${rounds.toLocaleString()} iterations`,
  });

  // Step 5: Show iterative hashing (simplified — show 3 intermediate states)
  let intermediateState = combined;
  const sampleRounds = [1, Math.floor(rounds / 2), rounds];
  for (const r of sampleRounds) {
    intermediateState = simulateBcryptHash(password, salt, r);
    steps.push({
      step: `Round ${r.toLocaleString()} / ${rounds.toLocaleString()}`,
      description:
        r === 1
          ? `First round: the Blowfish-based key schedule processes the password+salt. ` +
            `Each round feeds the output back as input — this is what makes bcrypt intentionally slow.`
          : r === rounds
            ? `Final round complete. After ${rounds.toLocaleString()} iterations, the password is thoroughly mixed. ` +
              `An attacker must repeat ALL these rounds for EVERY guess — no shortcuts.`
            : `Intermediate round ${r.toLocaleString()}: the state has been hashed ${r.toLocaleString()} times. ` +
              `The avalanche effect means even a tiny input change produces completely different output.`,
      data: intermediateState.slice(0, 48) + "...",
    });
  }

  // Step 6: Final bcrypt hash
  const finalHash = `$2b$${String(clampedCost).padStart(2, "0")}$${salt.slice(0, 22)}${intermediateState.slice(0, 31)}`;
  steps.push({
    step: "Final Bcrypt Hash",
    description:
      `The final hash is stored in the standard bcrypt format: ` +
      `$2b$ (algorithm version) + $${String(clampedCost).padStart(2, "0")}$ (cost factor) + ` +
      `22-char encoded salt + 31-char encoded hash. ` +
      `To verify a password, the server re-runs bcrypt with the stored salt and cost, then compares.`,
    data: finalHash,
  });

  return steps;
}

/**
 * Demonstrate rainbow table attack: unsalted vs salted hashing.
 *
 * Returns two groups:
 *   1. Unsalted hashes — attacker can look up in a precomputed table
 *   2. Salted hashes — each is unique, rainbow table is useless
 */
export function demonstrateRainbowTable(password: string): {
  unsalted: RainbowTableEntry[];
  salted: { password: string; salt: string; hash: string; cracked: boolean }[];
  explanation: string;
} {
  // Common passwords that appear in rainbow tables
  const commonPasswords = ["password123", "letmein", "admin", "qwerty", password];
  // Deduplicate
  const passwords = [...new Set(commonPasswords)];

  const unsalted = passwords.map((p) => ({
    password: p,
    md5: simpleHash(p).slice(0, 32),
    cracked: true, // all unsalted hashes can be looked up
  }));

  const salted = passwords.map((p) => {
    const salt = randomHex(16);
    return {
      password: p,
      salt,
      hash: simpleHash(p + salt).slice(0, 32),
      cracked: false, // salted hashes can't be precomputed
    };
  });

  return {
    unsalted,
    salted,
    explanation:
      `A rainbow table is a precomputed lookup of hash → password. ` +
      `For unsalted hashes, the attacker computes the hash of every common password ONCE ` +
      `and can instantly crack any matching hash. With salting, each password has a unique salt, ` +
      `so the attacker would need a separate rainbow table for every possible salt — ` +
      `making precomputation infeasible (2^128 possible salts = effectively infinite tables needed).`,
  };
}
