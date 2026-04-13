// ─────────────────────────────────────────────────────────────
// Architex — useCanvasChart Hook
// ─────────────────────────────────────────────────────────────
//
// React hook that manages a Canvas 2D chart lifecycle:
//   - Creates / resizes the canvas on mount / resize
//   - Sets up DPI-aware rendering
//   - Manages requestAnimationFrame loop
//   - Throttles data updates to 10Hz
//   - Cleans up on unmount
// ─────────────────────────────────────────────────────────────

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { setupCanvas, createUpdateThrottle } from '@/lib/visualization/canvas-renderer';

export interface UseCanvasChartOptions {
  /** Render callback invoked each frame when data is dirty. */
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** Whether the chart is actively updating (default true). */
  active?: boolean;
}

/**
 * Hook that binds a <canvas> ref to a high-performance rendering loop.
 *
 * @returns canvasRef - Attach to <canvas ref={canvasRef} />
 * @returns scheduleUpdate - Call when data changes to trigger re-render
 *
 * @example
 * ```tsx
 * const { canvasRef, scheduleUpdate } = useCanvasChart({
 *   render(ctx, w, h) {
 *     ctx.clearRect(0, 0, w, h);
 *     // draw stuff
 *   },
 * });
 *
 * useEffect(() => { scheduleUpdate(); }, [data]);
 *
 * return <canvas ref={canvasRef} className="w-full" style={{ height: 120 }} />;
 * ```
 */
export function useCanvasChart({ render, active = true }: UseCanvasChartOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef(render);
  renderRef.current = render;

  const throttleRef = useRef<ReturnType<typeof createUpdateThrottle> | null>(null);

  // Setup and teardown
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    function doRender() {
      const c = canvasRef.current;
      if (!c) return;
      const p = c.parentElement;
      if (!p) return;

      const cssWidth = p.clientWidth;
      const cssHeight = p.clientHeight || parseInt(c.style.height) || 120;

      const { ctx } = setupCanvas(c, cssWidth, cssHeight);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      renderRef.current(ctx, cssWidth, cssHeight);
    }

    const throttle = createUpdateThrottle(doRender);
    throttleRef.current = throttle;

    // Initial render
    if (active) {
      throttle.scheduleUpdate();
    }

    // Resize observer for responsive behavior
    const ro = new ResizeObserver(() => {
      throttle.scheduleUpdate();
    });
    ro.observe(parent);

    return () => {
      throttle.destroy();
      throttleRef.current = null;
      ro.disconnect();
    };
  }, [active]);

  const scheduleUpdate = useCallback(() => {
    throttleRef.current?.scheduleUpdate();
  }, []);

  return { canvasRef, scheduleUpdate };
}
