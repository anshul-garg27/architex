"use client";

import { useCallback, useEffect, useRef } from "react";
import { useViewportStore } from "@/stores/viewport-store";

// ── Types ──────────────────────────────────────────────────────────

interface TwoFingerPanOptions {
  /** Enable momentum/inertia on release. @default true */
  momentum?: boolean;
  /** Friction factor for momentum deceleration (0-1). @default 0.92 */
  friction?: number;
}

interface PanState {
  active: boolean;
  lastCenterX: number;
  lastCenterY: number;
  lastTimestamp: number;
  velocityX: number;
  velocityY: number;
}

// ── Helper ─────────────────────────────────────────────────────────

function getTouchCenter(t1: Touch, t2: Touch): { x: number; y: number } {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Two-finger pan gesture handler for a canvas element.
 * Integrates with the viewport store to update x/y position.
 *
 * @param elementRef - Ref to the container element that receives touch events.
 * @param options - Configuration for momentum and friction.
 */
export function useTwoFingerPan(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TwoFingerPanOptions = {},
) {
  const { momentum = true, friction = 0.92 } = options;

  const setViewport = useViewportStore((s) => s.setViewport);
  const panRef = useRef<PanState>({
    active: false,
    lastCenterX: 0,
    lastCenterY: 0,
    lastTimestamp: 0,
    velocityX: 0,
    velocityY: 0,
  });
  const animationFrameRef = useRef<number>(0);

  const applyMomentum = useCallback(() => {
    const state = panRef.current;
    const speed = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2);
    if (speed < 0.5) return;

    const store = useViewportStore.getState();
    setViewport({
      x: store.x + state.velocityX,
      y: store.y + state.velocityY,
      zoom: store.zoom,
    });

    state.velocityX *= friction;
    state.velocityY *= friction;
    animationFrameRef.current = requestAnimationFrame(applyMomentum);
  }, [friction, setViewport]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const state = panRef.current;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;

      const center = getTouchCenter(e.touches[0], e.touches[1]);
      state.active = true;
      state.lastCenterX = center.x;
      state.lastCenterY = center.y;
      state.lastTimestamp = performance.now();
      state.velocityX = 0;
      state.velocityY = 0;

      cancelAnimationFrame(animationFrameRef.current);
    }

    function handleTouchMove(e: TouchEvent) {
      if (!state.active || e.touches.length !== 2) return;
      e.preventDefault();

      const center = getTouchCenter(e.touches[0], e.touches[1]);
      const dx = center.x - state.lastCenterX;
      const dy = center.y - state.lastCenterY;

      const now = performance.now();
      const dt = now - state.lastTimestamp;
      if (dt > 0) {
        // Exponential moving average for smoother velocity
        const alpha = 0.4;
        state.velocityX = alpha * (dx / dt * 16) + (1 - alpha) * state.velocityX;
        state.velocityY = alpha * (dy / dt * 16) + (1 - alpha) * state.velocityY;
      }

      state.lastCenterX = center.x;
      state.lastCenterY = center.y;
      state.lastTimestamp = now;

      const store = useViewportStore.getState();
      setViewport({
        x: store.x + dx,
        y: store.y + dy,
        zoom: store.zoom,
      });
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!state.active) return;
      if (e.touches.length < 2) {
        state.active = false;
        if (momentum) {
          const speed = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2);
          if (speed > 0.5) {
            animationFrameRef.current = requestAnimationFrame(applyMomentum);
          }
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
  }, [elementRef, momentum, applyMomentum, setViewport]);
}
