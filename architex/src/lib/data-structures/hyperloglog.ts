// -----------------------------------------------------------------
// Architex -- HyperLogLog Simulation  (DST-018)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface HyperLogLogState {
  registers: number[];  // Array of m registers, each storing max leading zeros + 1
  m: number;            // number of registers (must be power of 2)
  p: number;            // precision bits (m = 2^p)
  n: number;            // number of elements added (true cardinality)
  addedElements: string[];
}

/**
 * Simple 32-bit hash for a string (djb2-variant).
 */
function hash32(element: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < element.length; i++) {
    h ^= element.charCodeAt(i);
    h = (h * 0x01000193) & 0xffffffff;
  }
  return h >>> 0; // ensure unsigned
}

/**
 * Count leading zeros in the lower (32 - p) bits.
 * Returns the position of the first 1-bit (1-indexed) or (32 - p + 1) if all zeros.
 */
function countLeadingZeros(value: number, p: number): number {
  const bits = 32 - p;
  if (bits <= 0) return 1;
  for (let i = bits - 1; i >= 0; i--) {
    if ((value >>> i) & 1) {
      return bits - i;
    }
  }
  return bits + 1;
}

/**
 * Estimate cardinality using the HyperLogLog algorithm.
 * Uses LinearCounting correction for small estimates and large range correction.
 */
export function hllEstimate(registers: number[], m: number): number {
  // alpha_m constant
  let alpha: number;
  if (m === 16) alpha = 0.673;
  else if (m === 32) alpha = 0.697;
  else if (m === 64) alpha = 0.709;
  else alpha = 0.7213 / (1 + 1.079 / m);

  // Raw harmonic mean estimate
  let harmonicSum = 0;
  for (const reg of registers) {
    harmonicSum += Math.pow(2, -reg);
  }
  const rawEstimate = alpha * m * m / harmonicSum;

  // Small range correction (linear counting)
  if (rawEstimate <= 2.5 * m) {
    const zeros = registers.filter((r) => r === 0).length;
    if (zeros > 0) {
      return m * Math.log(m / zeros);
    }
    return rawEstimate;
  }

  // Large range correction
  const pow32 = Math.pow(2, 32);
  if (rawEstimate > pow32 / 30) {
    return -pow32 * Math.log(1 - rawEstimate / pow32);
  }

  return rawEstimate;
}

// ── Create ──────────────────────────────────────────────────

export function createHyperLogLog(p: number = 4): HyperLogLogState {
  const m = 1 << p; // 2^p registers
  return {
    registers: Array.from({ length: m }, () => 0),
    m,
    p,
    n: 0,
    addedElements: [],
  };
}

function cloneHLL(hll: HyperLogLogState): HyperLogLogState {
  return {
    ...hll,
    registers: [...hll.registers],
    addedElements: [...hll.addedElements],
  };
}

// ── Add Element ─────────────────────────────────────────────

export function hllAdd(
  hll: HyperLogLogState,
  element: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneHLL(hll);

  steps.push(step(`Add "${element}" to HyperLogLog`, []));

  const h = hash32(element);
  const binaryStr = h.toString(2).padStart(32, '0');
  steps.push(
    step(
      `hash("${element}") = 0x${h.toString(16).padStart(8, '0')} = ${binaryStr.slice(0, 8)}...`,
      [],
    ),
  );

  // First p bits determine the register index
  const registerIdx = h >>> (32 - copy.p);
  const registerBits = binaryStr.slice(0, copy.p);
  steps.push(
    step(
      `First ${copy.p} bits: ${registerBits} = register ${registerIdx}`,
      [
        { targetId: `reg-${registerIdx}`, property: 'highlight', from: 'default', to: 'hashing' },
      ],
    ),
  );

  // Count leading zeros in the remaining bits
  const remaining = h & ((1 << (32 - copy.p)) - 1);
  const rho = countLeadingZeros(remaining, copy.p);
  const remainingBits = binaryStr.slice(copy.p);
  steps.push(
    step(
      `Remaining bits: ${remainingBits.slice(0, 12)}... -- leading zeros + 1 (rho) = ${rho}`,
      [],
    ),
  );

  // Update register with max
  const oldVal = copy.registers[registerIdx];
  const newVal = Math.max(oldVal, rho);
  copy.registers[registerIdx] = newVal;

  if (newVal > oldVal) {
    steps.push(
      step(
        `Register[${registerIdx}]: ${oldVal} -> ${newVal} (updated)`,
        [
          { targetId: `reg-${registerIdx}`, property: 'highlight', from: 'default', to: 'inserting' },
        ],
      ),
    );
  } else {
    steps.push(
      step(
        `Register[${registerIdx}] = ${oldVal} >= ${rho} (no change)`,
        [
          { targetId: `reg-${registerIdx}`, property: 'highlight', from: 'default', to: 'already-set' },
        ],
      ),
    );
  }

  copy.n++;
  if (!copy.addedElements.includes(element)) {
    copy.addedElements.push(element);
  }

  const estimated = hllEstimate(copy.registers, copy.m);
  const actual = copy.addedElements.length;
  steps.push(
    step(
      `Estimated cardinality: ${Math.round(estimated)} | Actual distinct: ${actual} | Error: ${actual > 0 ? ((Math.abs(estimated - actual) / actual) * 100).toFixed(1) : '0.0'}%`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── Query (Estimate Cardinality) ────────────────────────────

export function hllCount(
  hll: HyperLogLogState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step('Estimate cardinality from registers', []));

  // Highlight non-zero registers
  const nonZero = hll.registers.filter((r) => r > 0).length;
  const zeros = hll.m - nonZero;

  for (let i = 0; i < hll.registers.length; i++) {
    if (hll.registers[i] > 0) {
      steps.push(
        step(
          `Register[${i}] = ${hll.registers[i]}`,
          [
            { targetId: `reg-${i}`, property: 'highlight', from: 'default', to: 'found' },
          ],
        ),
      );
    }
  }

  steps.push(
    step(`Non-zero registers: ${nonZero}/${hll.m}, zero registers: ${zeros}`, []),
  );

  const estimated = hllEstimate(hll.registers, hll.m);
  const actual = hll.addedElements.length;
  const stdError = 1.04 / Math.sqrt(hll.m);

  steps.push(
    step(
      `Estimated cardinality: ${Math.round(estimated)} | Actual distinct: ${actual} | Standard error: ${(stdError * 100).toFixed(1)}% (1.04/sqrt(${hll.m}))`,
      [],
    ),
  );

  return { steps, snapshot: hll };
}
