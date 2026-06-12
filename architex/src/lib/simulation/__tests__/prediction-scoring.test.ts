import { describe, it, expect } from 'vitest';
import {
  p99Band,
  errorBand,
  costBand,
  bandDistance,
  deriveRunOutcome,
  scorePrediction,
  buildCalibrationLine,
  BAND_ORDER,
  SATURATION_UTILIZATION,
  type PredictionRecord,
  type RunOutcome,
  type OutcomeInput,
  type Confidence,
} from '../prediction-scoring';

// ── Fixtures ─────────────────────────────────────────────────────────────

function makePrediction(
  overrides: Partial<PredictionRecord> = {},
): PredictionRecord {
  return {
    firstBottleneckNodeId: 'db-1',
    p99Band: 'elevated',
    errorBand: 'healthy',
    costBand: 'healthy',
    confidence: 3,
    predictedAt: 1_000,
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<RunOutcome> = {}): RunOutcome {
  return {
    firstBottleneckNodeId: 'db-1',
    saturationRanking: ['db-1', 'api-1', 'cache-1'],
    finalP99Ms: 320,
    finalErrorRate: 0.0005,
    costPerHour: 1.2,
    ...overrides,
  };
}

describe('prediction-scoring', () => {
  // ── Band classification ────────────────────────────────────────────────

  describe('p99Band', () => {
    it('classifies the four documented ranges', () => {
      expect(p99Band(50)).toBe('healthy');
      expect(p99Band(199.9)).toBe('healthy');
      expect(p99Band(200)).toBe('elevated');
      expect(p99Band(499)).toBe('elevated');
      expect(p99Band(500)).toBe('concerning');
      expect(p99Band(1499)).toBe('concerning');
      expect(p99Band(1500)).toBe('critical');
      expect(p99Band(30_000)).toBe('critical');
    });
  });

  describe('errorBand', () => {
    it('classifies the four documented ranges', () => {
      expect(errorBand(0)).toBe('healthy');
      expect(errorBand(0.0009)).toBe('healthy');
      expect(errorBand(0.001)).toBe('elevated');
      expect(errorBand(0.009)).toBe('elevated');
      expect(errorBand(0.01)).toBe('concerning');
      expect(errorBand(0.049)).toBe('concerning');
      expect(errorBand(0.05)).toBe('critical');
      expect(errorBand(1)).toBe('critical');
    });
  });

  describe('costBand', () => {
    it('classifies the four documented ranges', () => {
      expect(costBand(0.5)).toBe('healthy');
      expect(costBand(2)).toBe('elevated');
      expect(costBand(8)).toBe('concerning');
      expect(costBand(25)).toBe('critical');
    });
  });

  describe('bandDistance', () => {
    it('is 0 for the same band and grows by step', () => {
      expect(bandDistance('healthy', 'healthy')).toBe(0);
      expect(bandDistance('healthy', 'elevated')).toBe(1);
      expect(bandDistance('healthy', 'critical')).toBe(3);
      expect(bandDistance('critical', 'elevated')).toBe(2);
    });

    it('covers all four bands in order', () => {
      expect(BAND_ORDER).toEqual([
        'healthy',
        'elevated',
        'concerning',
        'critical',
      ]);
    });
  });

  // ── Outcome derivation ─────────────────────────────────────────────────

  describe('deriveRunOutcome', () => {
    const baseInput: OutcomeInput = {
      ticks: [],
      nodeUtilizations: [
        { nodeId: 'api-1', utilization: 0.4 },
        { nodeId: 'db-1', utilization: 0.7 },
        { nodeId: 'cache-1', utilization: 0.1 },
      ],
      p99LatencyMs: 120,
      errorRate: 0,
      costPerHour: 0.8,
    };

    it('takes the node behind the earliest critical/high event', () => {
      const outcome = deriveRunOutcome({
        ...baseInput,
        ticks: [
          { nodeEvents: [{ nodeId: 'cache-1', severity: 'low' }] },
          {
            nodeEvents: [
              { nodeId: 'db-1', severity: 'medium' },
              { nodeId: 'api-1', severity: 'critical' },
            ],
          },
          { nodeEvents: [{ nodeId: 'db-1', severity: 'critical' }] },
        ],
      });
      expect(outcome.firstBottleneckNodeId).toBe('api-1');
    });

    it('falls back to the most-utilized node when it crossed saturation', () => {
      const outcome = deriveRunOutcome({
        ...baseInput,
        nodeUtilizations: [
          { nodeId: 'api-1', utilization: 0.5 },
          { nodeId: 'db-1', utilization: SATURATION_UTILIZATION },
        ],
      });
      expect(outcome.firstBottleneckNodeId).toBe('db-1');
    });

    it('returns null when no event fired and nothing saturated', () => {
      const outcome = deriveRunOutcome(baseInput);
      expect(outcome.firstBottleneckNodeId).toBeNull();
    });

    it('ranks nodes by utilization, highest first', () => {
      const outcome = deriveRunOutcome(baseInput);
      expect(outcome.saturationRanking).toEqual(['db-1', 'api-1', 'cache-1']);
    });

    it('passes metrics through untouched', () => {
      const outcome = deriveRunOutcome(baseInput);
      expect(outcome.finalP99Ms).toBe(120);
      expect(outcome.finalErrorRate).toBe(0);
      expect(outcome.costPerHour).toBe(0.8);
    });

    it('does not mutate its input', () => {
      const utilizations = [
        { nodeId: 'a', utilization: 0.1 },
        { nodeId: 'b', utilization: 0.9 },
      ];
      deriveRunOutcome({ ...baseInput, nodeUtilizations: utilizations });
      expect(utilizations[0].nodeId).toBe('a');
    });
  });

  // ── Claim scoring ──────────────────────────────────────────────────────

  describe('scorePrediction', () => {
    it('marks an exact bottleneck pick correct', () => {
      const scored = scorePrediction(makePrediction(), makeOutcome());
      const claim = scored.claims.find((c) => c.claim === 'bottleneck')!;
      expect(claim.verdict).toBe('correct');
    });

    it('marks a top-3 saturated pick as near-miss', () => {
      const scored = scorePrediction(
        makePrediction({ firstBottleneckNodeId: 'cache-1' }),
        makeOutcome(),
      );
      const claim = scored.claims.find((c) => c.claim === 'bottleneck')!;
      expect(claim.verdict).toBe('near-miss');
    });

    it('marks an off-ranking pick as wrong', () => {
      const scored = scorePrediction(
        makePrediction({ firstBottleneckNodeId: 'cdn-9' }),
        makeOutcome(),
      );
      const claim = scored.claims.find((c) => c.claim === 'bottleneck')!;
      expect(claim.verdict).toBe('wrong');
    });

    it('handles "nothing saturates" both ways', () => {
      const calm = makeOutcome({ firstBottleneckNodeId: null });
      const correctNull = scorePrediction(
        makePrediction({ firstBottleneckNodeId: null }),
        calm,
      );
      expect(
        correctNull.claims.find((c) => c.claim === 'bottleneck')!.verdict,
      ).toBe('correct');

      const wrongNull = scorePrediction(
        makePrediction({ firstBottleneckNodeId: null }),
        makeOutcome(),
      );
      expect(
        wrongNull.claims.find((c) => c.claim === 'bottleneck')!.verdict,
      ).toBe('wrong');
    });

    it('gives near-miss when prediction named the most-stressed node but nothing saturated', () => {
      const scored = scorePrediction(
        makePrediction({ firstBottleneckNodeId: 'db-1' }),
        makeOutcome({ firstBottleneckNodeId: null }),
      );
      expect(
        scored.claims.find((c) => c.claim === 'bottleneck')!.verdict,
      ).toBe('near-miss');
    });

    it('scores band claims by distance: same=correct, adjacent=near-miss, far=wrong', () => {
      const scored = scorePrediction(
        makePrediction({
          p99Band: 'elevated', // actual 320ms -> elevated -> correct
          errorBand: 'elevated', // actual 0.05% -> healthy -> near-miss
          costBand: 'critical', // actual $1.2/hr -> healthy -> wrong
        }),
        makeOutcome(),
      );
      expect(scored.claims.find((c) => c.claim === 'p99')!.verdict).toBe('correct');
      expect(scored.claims.find((c) => c.claim === 'error')!.verdict).toBe('near-miss');
      expect(scored.claims.find((c) => c.claim === 'cost')!.verdict).toBe('wrong');
    });

    it('computes weighted accuracy (correct=1, near=0.5, wrong=0)', () => {
      const scored = scorePrediction(
        makePrediction({
          firstBottleneckNodeId: 'db-1', // correct
          p99Band: 'elevated', // correct
          errorBand: 'elevated', // near-miss
          costBand: 'critical', // wrong
        }),
        makeOutcome(),
      );
      expect(scored.accuracy).toBeCloseTo((1 + 1 + 0.5 + 0) / 4);
    });

    it('uses node labels in verdict rows when provided', () => {
      const scored = scorePrediction(makePrediction(), makeOutcome(), {
        'db-1': 'Postgres Primary',
      });
      const claim = scored.claims.find((c) => c.claim === 'bottleneck')!;
      expect(claim.predicted).toBe('Postgres Primary');
      expect(claim.actual).toBe('Postgres Primary');
    });

    it('does not mutate the prediction or outcome', () => {
      const prediction = makePrediction();
      const outcome = makeOutcome();
      scorePrediction(prediction, outcome);
      expect(prediction).toEqual(makePrediction());
      expect(outcome).toEqual(makeOutcome());
    });
  });

  // ── Calibration / hypercorrection ──────────────────────────────────────

  describe('buildCalibrationLine', () => {
    it('flags confident-wrong as hypercorrection with the strongest copy', () => {
      const { tone, line } = buildCalibrationLine(0, 5);
      expect(tone).toBe('hypercorrection');
      expect(line).toMatch(/confident and wrong/i);
    });

    it('confident-wrong copy is the longest callout', () => {
      const hyper = buildCalibrationLine(0, 5).line;
      const tones: Array<[number, Confidence]> = [
        [0, 1],
        [0, 3],
        [0.5, 5],
        [0.5, 1],
        [1, 5],
        [1, 1],
        [1, 3],
      ];
      for (const [accuracy, confidence] of tones) {
        expect(hyper.length).toBeGreaterThan(
          buildCalibrationLine(accuracy, confidence).line.length,
        );
      }
    });

    it('rewards confident-correct as a win', () => {
      expect(buildCalibrationLine(1, 5).tone).toBe('win');
      expect(buildCalibrationLine(0.75, 4).tone).toBe('win');
    });

    it('nudges hesitant-correct toward more confidence', () => {
      const { tone, line } = buildCalibrationLine(1, 1);
      expect(tone).toBe('underconfident');
      expect(line).toMatch(/confidence/i);
    });

    it('treats middling accuracy as mixed regardless of confidence', () => {
      expect(buildCalibrationLine(0.5, 5).tone).toBe('mixed');
      expect(buildCalibrationLine(0.5, 2).tone).toBe('mixed');
    });

    it('keeps low-confidence misses gentle', () => {
      expect(buildCalibrationLine(0.25, 1).tone).toBe('miss');
      expect(buildCalibrationLine(0.25, 3).tone).toBe('miss');
    });
  });
});
