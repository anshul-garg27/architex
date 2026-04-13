import { describe, it, expect, beforeEach } from 'vitest';
import { useViewportStore } from '../viewport-store';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('viewport-store', () => {
  beforeEach(() => {
    useViewportStore.getState().resetViewport();
  });

  // ── Initial state ────────────────────────────────────────────

  it('initial x is 0', () => {
    expect(useViewportStore.getState().x).toBe(0);
  });

  it('initial y is 0', () => {
    expect(useViewportStore.getState().y).toBe(0);
  });

  it('initial zoom is 1', () => {
    expect(useViewportStore.getState().zoom).toBe(1);
  });

  // ── setViewport ──────────────────────────────────────────────

  it('setViewport updates x, y, and zoom together', () => {
    useViewportStore.getState().setViewport({ x: 100, y: 200, zoom: 2 });

    const s = useViewportStore.getState();
    expect(s.x).toBe(100);
    expect(s.y).toBe(200);
    expect(s.zoom).toBe(2);
  });

  it('setViewport with negative coordinates works', () => {
    useViewportStore.getState().setViewport({ x: -50, y: -100, zoom: 0.5 });

    const s = useViewportStore.getState();
    expect(s.x).toBe(-50);
    expect(s.y).toBe(-100);
    expect(s.zoom).toBe(0.5);
  });

  it('setViewport overwrites previous values', () => {
    useViewportStore.getState().setViewport({ x: 10, y: 20, zoom: 3 });
    useViewportStore.getState().setViewport({ x: 99, y: 88, zoom: 0.1 });

    const s = useViewportStore.getState();
    expect(s.x).toBe(99);
    expect(s.y).toBe(88);
    expect(s.zoom).toBe(0.1);
  });

  // ── setZoom ──────────────────────────────────────────────────

  it('setZoom updates only the zoom level', () => {
    useViewportStore.getState().setViewport({ x: 50, y: 60, zoom: 1 });
    useViewportStore.getState().setZoom(2.5);

    const s = useViewportStore.getState();
    expect(s.zoom).toBe(2.5);
    expect(s.x).toBe(50);
    expect(s.y).toBe(60);
  });

  it('setZoom accepts fractional values', () => {
    useViewportStore.getState().setZoom(0.25);
    expect(useViewportStore.getState().zoom).toBe(0.25);
  });

  it('setZoom accepts very large values', () => {
    useViewportStore.getState().setZoom(10);
    expect(useViewportStore.getState().zoom).toBe(10);
  });

  // ── resetViewport ────────────────────────────────────────────

  it('resetViewport returns all state to initial values', () => {
    useViewportStore.getState().setViewport({ x: 999, y: -500, zoom: 5 });
    useViewportStore.getState().resetViewport();

    const s = useViewportStore.getState();
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
    expect(s.zoom).toBe(1);
  });

  it('resetViewport after setZoom resets zoom to 1', () => {
    useViewportStore.getState().setZoom(3);
    useViewportStore.getState().resetViewport();
    expect(useViewportStore.getState().zoom).toBe(1);
  });

  // ── Edge cases ───────────────────────────────────────────────

  it('setViewport with zero zoom is accepted', () => {
    useViewportStore.getState().setViewport({ x: 0, y: 0, zoom: 0 });
    expect(useViewportStore.getState().zoom).toBe(0);
  });

  it('multiple rapid setViewport calls retain last value', () => {
    for (let i = 0; i < 100; i++) {
      useViewportStore.getState().setViewport({ x: i, y: i * 2, zoom: i / 10 });
    }
    const s = useViewportStore.getState();
    expect(s.x).toBe(99);
    expect(s.y).toBe(198);
    expect(s.zoom).toBe(9.9);
  });
});
