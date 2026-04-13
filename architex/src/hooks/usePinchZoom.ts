"use client";

import { useCallback, useEffect, useRef } from "react";
import { useViewportStore } from "@/stores/viewport-store";

// ── Types ──────────────────────────────────────────────────────────

interface PinchZoomOptions {
  /** Minimum zoom level. @default 0.1 */
  minZoom?: number;
  /** Maximum zoom level. @default 4 */
  maxZoom?: number;
  /** Sensitivity multiplier for zoom delta. @default 1 */
  sensitivity?: number;
  /** Enable momentum/inertia on release. @default true */
  momentum?: boolean;
  /** Friction factor for momentum deceleration (0-1). @default 0.92 */
  friction?: number;
}

interface PinchState {
  active: boolean;
  initialDistance: number;
  initialZoom: number;
  lastDistance: number;
  lastTimestamp: number;
  velocity: number;
}

// ── Helpers ────────────────────────────────────────────────────────

function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Pinch-to-zoom gesture handler for a canvas element.
 * Integrates with the viewport store to update zoom level.
 *
 * @param elementRef - Ref to the container element that receives touch events.
 * @param options - Configuration for zoom bounds, sensitivity, and momentum.
 */
export function usePinchZoom(
  elementRef: React.RefObject<HTMLElement | null>,
  options: PinchZoomOptions = {},
) {
  const {
    minZoom = 0.1,
    maxZoom = 4,
    sensitivity = 1,
    momentum = true,
    friction = 0.92,
  } = options;

  const setViewport = useViewportStore((s) => s.setViewport);
  const pinchRef = useRef<PinchState>({
    active: false,
    initialDistance: 0,
    initialZoom: 1,
    lastDistance: 0,
    lastTimestamp: 0,
    velocity: 0,
  });
  const animationFrameRef = useRef<number>(0);

  const applyMomentum = useCallback(() => {
    const state = pinchRef.current;
    if (Math.abs(state.velocity) < 0.001) return;

    const store = useViewportStore.getState();
    const newZoom = clamp(store.zoom + state.velocity, minZoom, maxZoom);
    setViewport({ x: store.x, y: store.y, zoom: newZoom });

    state.velocity *= friction;
    animationFrameRef.current = requestAnimationFrame(applyMomentum);
  }, [friction, maxZoom, minZoom, setViewport]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const state = pinchRef.current;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;

      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const store = useViewportStore.getState();

      state.active = true;
      state.initialDistance = dist;
      state.initialZoom = store.zoom;
      state.lastDistance = dist;
      state.lastTimestamp = performance.now();
      state.velocity = 0;

      cancelAnimationFrame(animationFrameRef.current);
    }

    function handleTouchMove(e: TouchEvent) {
      if (!state.active || e.touches.length !== 2) return;
      e.preventDefault();

      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = dist / state.initialDistance;
      const newZoom = clamp(state.initialZoom * scale * sensitivity, minZoom, maxZoom);

      const now = performance.now();
      const dt = now - state.lastTimestamp;
      if (dt > 0) {
        const store = useViewportStore.getState();
        state.velocity = (newZoom - store.zoom) / dt * 16; // normalize to ~1 frame
      }
      state.lastDistance = dist;
      state.lastTimestamp = now;

      const store = useViewportStore.getState();
      setViewport({ x: store.x, y: store.y, zoom: newZoom });
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!state.active) return;
      if (e.touches.length < 2) {
        state.active = false;
        if (momentum && Math.abs(state.velocity) > 0.001) {
          animationFrameRef.current = requestAnimationFrame(applyMomentum);
        }
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    const frameId = animationFrameRef.current;
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
      cancelAnimationFrame(frameId);
    };
  }, [elementRef, minZoom, maxZoom, sensitivity, momentum, applyMomentum, setViewport]);
}
