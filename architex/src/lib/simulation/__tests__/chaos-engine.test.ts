import { describe, it, expect, beforeEach } from 'vitest';
import { ChaosEngine, CHAOS_EVENTS } from '../chaos-engine';
import type { ChaosCategory } from '../chaos-engine';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChaosEngine', () => {
  let engine: ChaosEngine;

  beforeEach(() => {
    engine = new ChaosEngine();
  });

  // ── Catalog ──────────────────────────────────────────────────

  it('catalog contains 88 event types (30 original + 58 new across 7 categories)', () => {
    expect(CHAOS_EVENTS.length).toBe(88);
  });

  it('getEventCatalog returns the full catalog', () => {
    expect(engine.getEventCatalog()).toBe(CHAOS_EVENTS);
  });

  it('getEventType returns a catalog entry by id', () => {
    const entry = engine.getEventType('node-crash');
    expect(entry).toBeDefined();
    expect(entry!.name).toBe('Node Crash');
    expect(entry!.category).toBe('infrastructure');
  });

  it('getEventType returns undefined for unknown id', () => {
    expect(engine.getEventType('nonexistent')).toBeUndefined();
  });

  it('getEventsByCategory filters correctly', () => {
    const categories: ChaosCategory[] = [
      'infrastructure',
      'network',
      'data',
      'traffic',
      'dependency',
    ];
    for (const cat of categories) {
      const filtered = engine.getEventsByCategory(cat);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((e) => e.category === cat)).toBe(true);
    }
  });

  // ── injectEvent ──────────────────────────────────────────────

  it('injectEvent adds an active event', () => {
    const event = engine.injectEvent('node-crash', ['server-1']);

    expect(event.eventTypeId).toBe('node-crash');
    expect(event.targetNodeIds).toEqual(['server-1']);
    expect(event.instanceId).toBeTruthy();
    expect(engine.getActiveEvents()).toHaveLength(1);
  });

  it('injectEvent uses catalog defaults for severity and duration', () => {
    const event = engine.injectEvent('latency-injection', ['api-1']);

    expect(event.severity).toBe('medium');
    expect(event.durationMs).toBe(60_000);
  });

  it('injectEvent accepts severity and duration overrides', () => {
    const event = engine.injectEvent('packet-loss', ['gw-1'], {
      severity: 'critical',
      durationMs: 5_000,
    });

    expect(event.severity).toBe('critical');
    expect(event.durationMs).toBe(5_000);
  });

  it('injectEvent with null duration creates indefinite event', () => {
    const event = engine.injectEvent('network-partition', ['db-1'], {
      durationMs: null,
    });

    expect(event.durationMs).toBeNull();
  });

  it('injectEvent throws for unknown event type', () => {
    expect(() => engine.injectEvent('bogus', ['n1'])).toThrow(
      /Unknown chaos event type/,
    );
  });

  it('injectEvent copies targetNodeIds (no shared reference)', () => {
    const targets = ['a', 'b'];
    const event = engine.injectEvent('cpu-spike', targets);
    targets.push('c');
    expect(event.targetNodeIds).toEqual(['a', 'b']);
  });

  // ── removeEvent ──────────────────────────────────────────────

  it('removeEvent removes an active event by instanceId', () => {
    const ev = engine.injectEvent('node-crash', ['s1']);
    expect(engine.removeEvent(ev.instanceId)).toBe(true);
    expect(engine.getActiveEvents()).toHaveLength(0);
  });

  it('removeEvent returns false for non-existent instanceId', () => {
    expect(engine.removeEvent('nonexistent')).toBe(false);
  });

  // ── getEventsForNode / isNodeAffected ────────────────────────

  it('getEventsForNode returns events targeting a specific node', () => {
    engine.injectEvent('node-crash', ['server-1', 'server-2']);
    engine.injectEvent('cpu-spike', ['server-2', 'server-3']);

    const events = engine.getEventsForNode('server-2');
    expect(events).toHaveLength(2);
  });

  it('isNodeAffected returns true when node has active chaos', () => {
    engine.injectEvent('disk-full', ['db-1']);
    expect(engine.isNodeAffected('db-1')).toBe(true);
    expect(engine.isNodeAffected('db-2')).toBe(false);
  });

  // ── expireEvents ─────────────────────────────────────────────

  it('expireEvents removes events past their duration', () => {
    engine.injectEvent('node-restart', ['s1'], {
      durationMs: 1000,
      timestampMs: 0,
    });
    engine.injectEvent('cpu-spike', ['s2'], {
      durationMs: 5000,
      timestampMs: 0,
    });

    const expired = engine.expireEvents(2000);
    expect(expired).toBe(1);
    expect(engine.getActiveEvents()).toHaveLength(1);
  });

  it('expireEvents does not remove indefinite events', () => {
    engine.injectEvent('network-partition', ['db-1'], {
      durationMs: null,
      timestampMs: 0,
    });

    const expired = engine.expireEvents(999_999);
    expect(expired).toBe(0);
    expect(engine.getActiveEvents()).toHaveLength(1);
  });

  // ── clearAll ─────────────────────────────────────────────────

  it('clearAll removes all active events', () => {
    engine.injectEvent('node-crash', ['s1']);
    engine.injectEvent('ddos', ['lb-1']);
    engine.injectEvent('deadlock', ['db-1']);

    engine.clearAll();
    expect(engine.getActiveEvents()).toHaveLength(0);
  });
});
