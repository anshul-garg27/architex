import { describe, it, expect, beforeEach } from 'vitest';
import { ChaosEngine, CHAOS_EVENTS } from '../chaos-engine';
import type { ChaosCategory, ChaosSeverity } from '../chaos-engine';

// ---------------------------------------------------------------------------
// Extended ChaosEngine Tests
// ---------------------------------------------------------------------------

describe('ChaosEngine – extended', () => {
  let engine: ChaosEngine;

  beforeEach(() => {
    engine = new ChaosEngine();
  });

  // ── Event Type Categories ────────────────────────────────────

  describe('event type categories', () => {
    const expectedCounts: Partial<Record<ChaosCategory, number>> = {
      infrastructure: 10,
      network: 19,
      data: 19,
      traffic: 10,
      dependency: 9,
      application: 10,
      cache: 11,
    };

    it.each(Object.entries(expectedCounts))(
      'category "%s" has %d event types',
      (category, count) => {
        const filtered = engine.getEventsByCategory(category as ChaosCategory);
        expect(filtered).toHaveLength(count);
      },
    );

    it('all 7 categories are represented in the catalog', () => {
      const categories = new Set(CHAOS_EVENTS.map((e) => e.category));
      expect(categories.size).toBe(7);
      expect(categories).toContain('infrastructure');
      expect(categories).toContain('network');
      expect(categories).toContain('data');
      expect(categories).toContain('traffic');
      expect(categories).toContain('dependency');
      expect(categories).toContain('application');
      expect(categories).toContain('cache');
    });

    it('category counts sum to total catalog length', () => {
      let total = 0;
      for (const cat of Object.keys(expectedCounts) as ChaosCategory[]) {
        total += engine.getEventsByCategory(cat).length;
      }
      expect(total).toBe(CHAOS_EVENTS.length);
    });

    it('every catalog entry has all required fields', () => {
      for (const entry of CHAOS_EVENTS) {
        expect(entry.id).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(entry.description.length).toBeGreaterThan(10);
        expect(entry.defaultDurationMs).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(entry.defaultSeverity);
        expect(entry.affectedNodeTypes.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Inject with custom params ────────────────────────────────

  describe('inject with custom params', () => {
    it('injectEvent accepts a custom timestampMs', () => {
      const event = engine.injectEvent('node-crash', ['s1'], {
        timestampMs: 42_000,
      });
      expect(event.injectedAtMs).toBe(42_000);
    });

    it('injectEvent with durationMs=0 creates a zero-duration event', () => {
      const event = engine.injectEvent('latency-injection', ['gw-1'], {
        durationMs: 0,
      });
      expect(event.durationMs).toBe(0);
    });

    it('injectEvent with severity override replaces catalog default', () => {
      const event = engine.injectEvent('node-restart', ['s1'], {
        severity: 'critical',
      });
      expect(event.severity).toBe('critical');
      // catalog default for node-restart is 'low'
      const catalogEntry = engine.getEventType('node-restart');
      expect(catalogEntry!.defaultSeverity).toBe('low');
    });

    it('injectEvent generates unique instance IDs across calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const ev = engine.injectEvent('cpu-spike', [`node-${i}`]);
        ids.add(ev.instanceId);
      }
      expect(ids.size).toBe(50);
    });
  });

  // ── Remove by ID ─────────────────────────────────────────────

  describe('remove by ID', () => {
    it('removeEvent only removes the targeted event', () => {
      const ev1 = engine.injectEvent('node-crash', ['s1']);
      const ev2 = engine.injectEvent('cpu-spike', ['s2']);
      const ev3 = engine.injectEvent('disk-full', ['s3']);

      expect(engine.removeEvent(ev2.instanceId)).toBe(true);
      expect(engine.getActiveEvents()).toHaveLength(2);

      const remaining = engine.getActiveEvents().map((e) => e.instanceId);
      expect(remaining).toContain(ev1.instanceId);
      expect(remaining).toContain(ev3.instanceId);
      expect(remaining).not.toContain(ev2.instanceId);
    });

    it('removing the same event twice returns false on second attempt', () => {
      const ev = engine.injectEvent('dns-failure', ['dns-1']);
      expect(engine.removeEvent(ev.instanceId)).toBe(true);
      expect(engine.removeEvent(ev.instanceId)).toBe(false);
    });
  });

  // ── getEventsForNode ─────────────────────────────────────────

  describe('getEventsForNode', () => {
    it('returns empty array for node with no events', () => {
      engine.injectEvent('node-crash', ['s1']);
      expect(engine.getEventsForNode('s2')).toHaveLength(0);
    });

    it('returns all events targeting a node across different types', () => {
      engine.injectEvent('node-crash', ['s1']);
      engine.injectEvent('cpu-spike', ['s1']);
      engine.injectEvent('memory-pressure', ['s1', 's2']);
      engine.injectEvent('disk-full', ['s3']);

      const events = engine.getEventsForNode('s1');
      expect(events).toHaveLength(3);
    });

    it('includes events where node is one of multiple targets', () => {
      engine.injectEvent('network-partition', ['db-1', 'db-2', 'db-3']);
      const events = engine.getEventsForNode('db-2');
      expect(events).toHaveLength(1);
      expect(events[0].targetNodeIds).toContain('db-2');
    });
  });

  // ── isNodeAffected ───────────────────────────────────────────

  describe('isNodeAffected', () => {
    it('returns false for empty engine', () => {
      expect(engine.isNodeAffected('any-node')).toBe(false);
    });

    it('returns true after event injection and false after removal', () => {
      const ev = engine.injectEvent('packet-loss', ['gw-1']);
      expect(engine.isNodeAffected('gw-1')).toBe(true);

      engine.removeEvent(ev.instanceId);
      expect(engine.isNodeAffected('gw-1')).toBe(false);
    });

    it('remains true if one event removed but another still targets node', () => {
      const ev1 = engine.injectEvent('node-crash', ['s1']);
      engine.injectEvent('cpu-spike', ['s1']);

      engine.removeEvent(ev1.instanceId);
      expect(engine.isNodeAffected('s1')).toBe(true);
    });
  });

  // ── Expire by TTL ────────────────────────────────────────────

  describe('expire by TTL', () => {
    it('does not expire events before their TTL', () => {
      engine.injectEvent('node-restart', ['s1'], {
        durationMs: 10_000,
        timestampMs: 0,
      });

      const expired = engine.expireEvents(5_000);
      expect(expired).toBe(0);
      expect(engine.getActiveEvents()).toHaveLength(1);
    });

    it('expires events exactly at TTL boundary', () => {
      engine.injectEvent('node-restart', ['s1'], {
        durationMs: 10_000,
        timestampMs: 0,
      });

      const expired = engine.expireEvents(10_000);
      expect(expired).toBe(1);
      expect(engine.getActiveEvents()).toHaveLength(0);
    });

    it('expires multiple events at different times', () => {
      engine.injectEvent('node-restart', ['s1'], {
        durationMs: 1_000,
        timestampMs: 0,
      });
      engine.injectEvent('cpu-spike', ['s2'], {
        durationMs: 3_000,
        timestampMs: 0,
      });
      engine.injectEvent('disk-full', ['s3'], {
        durationMs: 5_000,
        timestampMs: 0,
      });

      expect(engine.expireEvents(2_000)).toBe(1);
      expect(engine.getActiveEvents()).toHaveLength(2);

      expect(engine.expireEvents(4_000)).toBe(1);
      expect(engine.getActiveEvents()).toHaveLength(1);

      expect(engine.expireEvents(6_000)).toBe(1);
      expect(engine.getActiveEvents()).toHaveLength(0);
    });

    it('zero-duration event expires immediately', () => {
      engine.injectEvent('node-crash', ['s1'], {
        durationMs: 0,
        timestampMs: 100,
      });

      const expired = engine.expireEvents(100);
      expect(expired).toBe(1);
    });
  });

  // ── Indefinite events ────────────────────────────────────────

  describe('indefinite events', () => {
    it('indefinite event survives expiration at any timestamp', () => {
      engine.injectEvent('network-partition', ['db-1'], {
        durationMs: null,
        timestampMs: 0,
      });

      expect(engine.expireEvents(0)).toBe(0);
      expect(engine.expireEvents(1_000_000)).toBe(0);
      expect(engine.expireEvents(Number.MAX_SAFE_INTEGER)).toBe(0);
      expect(engine.getActiveEvents()).toHaveLength(1);
    });

    it('indefinite event can still be removed manually', () => {
      const ev = engine.injectEvent('data-corruption', ['storage-1'], {
        durationMs: null,
      });

      expect(engine.removeEvent(ev.instanceId)).toBe(true);
      expect(engine.getActiveEvents()).toHaveLength(0);
    });

    it('mix of indefinite and finite: only finite expire', () => {
      engine.injectEvent('cpu-spike', ['s1'], {
        durationMs: 1_000,
        timestampMs: 0,
      });
      engine.injectEvent('network-partition', ['db-1'], {
        durationMs: null,
        timestampMs: 0,
      });
      engine.injectEvent('disk-full', ['s2'], {
        durationMs: 2_000,
        timestampMs: 0,
      });

      const expired = engine.expireEvents(3_000);
      expect(expired).toBe(2);
      expect(engine.getActiveEvents()).toHaveLength(1);
      expect(engine.getActiveEvents()[0].durationMs).toBeNull();
    });
  });

  // ── clearAll ─────────────────────────────────────────────────

  describe('clearAll', () => {
    it('clears mixed finite and indefinite events', () => {
      engine.injectEvent('node-crash', ['s1']);
      engine.injectEvent('network-partition', ['db-1'], { durationMs: null });
      engine.injectEvent('ddos', ['lb-1']);

      engine.clearAll();
      expect(engine.getActiveEvents()).toHaveLength(0);
      expect(engine.isNodeAffected('s1')).toBe(false);
      expect(engine.isNodeAffected('db-1')).toBe(false);
    });

    it('clearAll on empty engine is a no-op', () => {
      engine.clearAll();
      expect(engine.getActiveEvents()).toHaveLength(0);
    });

    it('new events can be injected after clearAll', () => {
      engine.injectEvent('cpu-spike', ['s1']);
      engine.clearAll();

      const ev = engine.injectEvent('disk-full', ['s2']);
      expect(engine.getActiveEvents()).toHaveLength(1);
      expect(engine.getActiveEvents()[0].instanceId).toBe(ev.instanceId);
    });
  });
});
