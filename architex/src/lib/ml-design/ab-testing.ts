// ─────────────────────────────────────────────────────────────
// Architex — ML Design: A/B Testing (MLD-023)
// ─────────────────────────────────────────────────────────────
//
// Statistical utilities for running and analysing A/B tests:
// - Two-proportion z-test with p-value calculation
// - Sample-size calculator (power analysis)
// ─────────────────────────────────────────────────────────────

export interface ABTestResult {
  controlConversion: number;
  treatmentConversion: number;
  pValue: number;
  isSignificant: boolean;
  sampleSize: number;
  requiredSampleSize: number;
  lift: number;
}

// ── Normal CDF approximation (Abramowitz & Stegun) ──────────

function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// ── Inverse normal (rational approximation) ─────────────────

function normalQuantile(p: number): number {
  // Beasley-Springer-Moro algorithm
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q +
          c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      )
    );
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Run a two-proportion z-test on control vs treatment.
 *
 * @param controlRate   - Observed control conversion rate (0-1)
 * @param treatmentRate - Observed treatment conversion rate (0-1)
 * @param sampleSize    - Number of observations per variant
 * @param significanceLevel - Alpha threshold (default 0.05)
 */
export function runABTest(
  controlRate: number,
  treatmentRate: number,
  sampleSize: number,
  significanceLevel: number = 0.05
): ABTestResult {
  const pC = Math.max(0.0001, Math.min(0.9999, controlRate));
  const pT = Math.max(0.0001, Math.min(0.9999, treatmentRate));
  const n = Math.max(1, Math.round(sampleSize));

  // Pooled proportion
  const pPool = (pC * n + pT * n) / (2 * n);
  const se = Math.sqrt(pPool * (1 - pPool) * (2 / n));

  // z-statistic (two-sided)
  const z = se > 0 ? (pT - pC) / se : 0;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  const lift = pC > 0 ? (pT - pC) / pC : 0;

  const required = calculateSampleSize(pC, Math.abs(pT - pC) || 0.01);

  return {
    controlConversion: pC,
    treatmentConversion: pT,
    pValue: parseFloat(pValue.toFixed(6)),
    isSignificant: pValue < significanceLevel,
    sampleSize: n,
    requiredSampleSize: required,
    lift: parseFloat(lift.toFixed(6)),
  };
}

/**
 * Calculate the required sample size per variant for a given
 * baseline rate and minimum detectable effect.
 *
 * @param baselineRate        - Expected control conversion rate (0-1)
 * @param minDetectableEffect - Minimum absolute difference to detect
 * @param power               - Statistical power (default 0.8)
 */
export function calculateSampleSize(
  baselineRate: number,
  minDetectableEffect: number,
  power: number = 0.8
): number {
  const alpha = 0.05;
  const zAlpha = normalQuantile(1 - alpha / 2);
  const zBeta = normalQuantile(power);

  const p1 = Math.max(0.0001, Math.min(0.9999, baselineRate));
  const p2 = Math.max(
    0.0001,
    Math.min(0.9999, p1 + Math.max(0.0001, minDetectableEffect))
  );

  const numerator = Math.pow(
    zAlpha * Math.sqrt(2 * p1 * (1 - p1)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2
  );
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}
