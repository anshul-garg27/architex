import { describe, it, expect } from 'vitest';
import {
  simulateCDNFlow,
  simulateCDNFlowLegacy,
  cdnToSequenceMessages,
  cdnRowBackground,
  CDN_SCENARIOS,
  CDN_SEQUENCE_COLUMNS,
} from '@/lib/networking/cdn-flow';
import type { CDNScenario, CDNStep } from '@/lib/networking/cdn-flow';

// ── Scenario completeness ────────────────────────────────

describe('CDN_SCENARIOS', () => {
  it('defines exactly 4 scenarios', () => {
    expect(CDN_SCENARIOS).toHaveLength(4);
  });

  it('each scenario has required fields', () => {
    for (const s of CDN_SCENARIOS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
    }
  });

  it('covers all scenario types', () => {
    const ids = CDN_SCENARIOS.map((s) => s.id);
    expect(ids).toContain('cache-hit');
    expect(ids).toContain('cache-miss');
    expect(ids).toContain('stale-revalidate');
    expect(ids).toContain('cache-purge');
  });
});

describe('CDN_SEQUENCE_COLUMNS', () => {
  it('includes Origin Shield between Edge POP and Origin', () => {
    expect(CDN_SEQUENCE_COLUMNS).toEqual([
      'Client',
      'DNS',
      'Edge POP',
      'Origin Shield',
      'Origin',
    ]);
  });
});

// ── simulateCDNFlow — cache-hit ──────────────────────────

describe('simulateCDNFlow("cache-hit")', () => {
  const steps = simulateCDNFlow('cache-hit');

  it('returns non-empty array of steps', () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it('starts with DNS CNAME resolution', () => {
    expect(steps[0].action).toBe('dns-cname');
    expect(steps[0].from).toBe('Client');
    expect(steps[0].to).toBe('DNS');
  });

  it('has a cache-hit step', () => {
    const hit = steps.find((s) => s.action === 'cache-hit');
    expect(hit).toBeDefined();
  });

  it('does NOT contact origin (no origin-fetch)', () => {
    const originFetch = steps.find((s) => s.action === 'origin-fetch');
    expect(originFetch).toBeUndefined();
  });

  it('ends with a response to client', () => {
    const last = steps[steps.length - 1];
    expect(last.action).toBe('response');
    expect(last.to).toBe('Client');
  });

  it('every step has positive latency', () => {
    for (const s of steps) {
      expect(s.latencyMs).toBeGreaterThan(0);
    }
  });

  it('tick values are monotonically increasing', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].tick).toBeGreaterThan(steps[i - 1].tick);
    }
  });

  it('includes Cache-Control headers on cache-hit step', () => {
    const hit = steps.find((s) => s.action === 'cache-hit')!;
    expect(hit.headers).toBeDefined();
    expect(hit.headers!['Cache-Control']).toBeTruthy();
    expect(hit.headers!['X-Cache']).toContain('Hit');
  });
});

// ── simulateCDNFlow — cache-miss ─────────────────────────

describe('simulateCDNFlow("cache-miss")', () => {
  const steps = simulateCDNFlow('cache-miss');

  it('returns more steps than cache-hit', () => {
    const hitSteps = simulateCDNFlow('cache-hit');
    expect(steps.length).toBeGreaterThan(hitSteps.length);
  });

  it('includes origin-fetch step', () => {
    const originFetch = steps.find((s) => s.action === 'origin-fetch');
    expect(originFetch).toBeDefined();
  });

  it('includes Origin Shield interaction', () => {
    const shieldCheck = steps.find((s) => s.action === 'shield-check');
    const shieldMiss = steps.find((s) => s.action === 'shield-miss');
    expect(shieldCheck).toBeDefined();
    expect(shieldMiss).toBeDefined();
  });

  it('includes cache-store steps (edge and shield)', () => {
    const storeSteps = steps.filter((s) => s.action === 'cache-store');
    expect(storeSteps.length).toBeGreaterThanOrEqual(2);
  });

  it('has Cache-Control headers with stale-while-revalidate on origin response', () => {
    const storeStep = steps.find(
      (s) => s.action === 'cache-store' && s.headers?.['Cache-Control']
    );
    expect(storeStep).toBeDefined();
    expect(storeStep!.headers!['Cache-Control']).toContain('stale-while-revalidate');
  });

  it('total latency is higher than cache-hit', () => {
    const hitSteps = simulateCDNFlow('cache-hit');
    const hitTotal = hitSteps.reduce((sum, s) => sum + s.latencyMs, 0);
    const missTotal = steps.reduce((sum, s) => sum + s.latencyMs, 0);
    expect(missTotal).toBeGreaterThan(hitTotal);
  });
});

// ── simulateCDNFlow — stale-revalidate ───────────────────

describe('simulateCDNFlow("stale-revalidate")', () => {
  const steps = simulateCDNFlow('stale-revalidate');

  it('includes stale-serve step', () => {
    const stale = steps.find((s) => s.action === 'stale-serve');
    expect(stale).toBeDefined();
  });

  it('includes background-revalidate step', () => {
    const revalidate = steps.find((s) => s.action === 'background-revalidate');
    expect(revalidate).toBeDefined();
  });

  it('stale-serve occurs before background-revalidate', () => {
    const staleIdx = steps.findIndex((s) => s.action === 'stale-serve');
    const revalIdx = steps.findIndex((s) => s.action === 'background-revalidate');
    expect(staleIdx).toBeLessThan(revalIdx);
  });

  it('response is sent before background revalidation completes', () => {
    const responseIdx = steps.findIndex(
      (s) => s.action === 'response' && s.to === 'Client'
    );
    const revalIdx = steps.findIndex((s) => s.action === 'background-revalidate');
    expect(responseIdx).toBeLessThan(revalIdx);
  });

  it('stale-serve headers include stale-while-revalidate directive', () => {
    const stale = steps.find((s) => s.action === 'stale-serve')!;
    expect(stale.headers).toBeDefined();
    expect(stale.headers!['Cache-Control']).toContain('stale-while-revalidate');
  });
});

// ── simulateCDNFlow — cache-purge ────────────────────────

describe('simulateCDNFlow("cache-purge")', () => {
  const steps = simulateCDNFlow('cache-purge');

  it('starts with purge initiation at origin', () => {
    expect(steps[0].action).toBe('purge-origin');
  });

  it('propagates purge through shield to edge', () => {
    const purgeShield = steps.find((s) => s.action === 'purge-shield');
    const purgeEdge = steps.find((s) => s.action === 'purge-edge');
    expect(purgeShield).toBeDefined();
    expect(purgeEdge).toBeDefined();
  });

  it('includes post-purge cache-miss and origin-fetch', () => {
    const miss = steps.find((s) => s.action === 'cache-miss');
    const fetch = steps.find((s) => s.action === 'origin-fetch');
    expect(miss).toBeDefined();
    expect(fetch).toBeDefined();
  });

  it('ends with response to client', () => {
    const last = steps[steps.length - 1];
    expect(last.action).toBe('response');
    expect(last.to).toBe('Client');
  });
});

// ── cdnToSequenceMessages ────────────────────────────────

describe('cdnToSequenceMessages', () => {
  it('converts all steps to SequenceMessage format', () => {
    const scenarios: CDNScenario[] = ['cache-hit', 'cache-miss', 'stale-revalidate', 'cache-purge'];
    for (const scenario of scenarios) {
      const steps = simulateCDNFlow(scenario);
      const messages = cdnToSequenceMessages(steps);
      expect(messages).toHaveLength(steps.length);
      for (const msg of messages) {
        expect(msg.from).toBeTruthy();
        expect(msg.to).toBeTruthy();
        expect(msg.label).toBeTruthy();
        expect(msg.description).toBeTruthy();
      }
    }
  });

  it('marks cache-hit and stale-serve as highlighted', () => {
    const hitMessages = cdnToSequenceMessages(simulateCDNFlow('cache-hit'));
    const highlighted = hitMessages.filter((m) => m.highlighted);
    expect(highlighted.length).toBeGreaterThan(0);

    const staleMessages = cdnToSequenceMessages(simulateCDNFlow('stale-revalidate'));
    const staleHighlighted = staleMessages.filter((m) => m.highlighted);
    expect(staleHighlighted.length).toBeGreaterThan(0);
  });
});

// ── cdnRowBackground ─────────────────────────────────────

describe('cdnRowBackground', () => {
  it('returns green for cache-hit and shield-hit', () => {
    expect(cdnRowBackground('cache-hit')).toBe('#22c55e');
    expect(cdnRowBackground('shield-hit')).toBe('#22c55e');
  });

  it('returns red for cache-miss and shield-miss', () => {
    expect(cdnRowBackground('cache-miss')).toBe('#ef4444');
    expect(cdnRowBackground('shield-miss')).toBe('#ef4444');
  });

  it('returns amber for origin-fetch and stale-serve', () => {
    expect(cdnRowBackground('origin-fetch')).toBe('#f59e0b');
    expect(cdnRowBackground('stale-serve')).toBe('#f59e0b');
  });

  it('returns undefined for dns-cname and edge-check', () => {
    expect(cdnRowBackground('dns-cname')).toBeUndefined();
    expect(cdnRowBackground('edge-check')).toBeUndefined();
  });
});

// ── Legacy API ───────────────────────────────────────────

describe('simulateCDNFlowLegacy', () => {
  it('maps true to cache-hit scenario', () => {
    const legacy = simulateCDNFlowLegacy(true);
    const modern = simulateCDNFlow('cache-hit');
    expect(legacy).toEqual(modern);
  });

  it('maps false to cache-miss scenario', () => {
    const legacy = simulateCDNFlowLegacy(false);
    const modern = simulateCDNFlow('cache-miss');
    expect(legacy).toEqual(modern);
  });
});

// ── Step field completeness ──────────────────────────────

describe('all scenarios produce complete CDNStep objects', () => {
  const scenarios: CDNScenario[] = ['cache-hit', 'cache-miss', 'stale-revalidate', 'cache-purge'];

  for (const scenario of scenarios) {
    it(`${scenario} steps have all required fields`, () => {
      const steps = simulateCDNFlow(scenario);
      for (const step of steps) {
        expect(typeof step.tick).toBe('number');
        expect(typeof step.from).toBe('string');
        expect(typeof step.to).toBe('string');
        expect(typeof step.action).toBe('string');
        expect(typeof step.latencyMs).toBe('number');
        expect(typeof step.description).toBe('string');
        expect(step.description.length).toBeGreaterThan(10);
      }
    });
  }
});
