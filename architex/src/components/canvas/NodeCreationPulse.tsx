"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { duration, easing } from "@/lib/constants/motion";
import type { Node } from "@xyflow/react";

// ── Types ──────────────────────────────────────────────────────

interface PulseEntry {
  id: string;
  x: number;
  y: number;
}

// ── NodeCreationPulse ──────────────────────────────────────────

export const NodeCreationPulse = memo(function NodeCreationPulse() {
  const prefersReducedMotion = useReducedMotion();
  const [pulses, setPulses] = useState<PulseEntry[]>([]);
  const prevNodeCountRef = useRef<number>(0);
  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  // Watch for new nodes being added to the canvas store
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      const currentNodes = state.nodes;
      const currentCount = currentNodes.length;
      const prevCount = prevNodeCountRef.current;
      const prevIds = prevNodeIdsRef.current;

      // Detect additions: more nodes than before
      if (currentCount > prevCount) {
        const newNodes = currentNodes.filter(
          (n: Node) => !prevIds.has(n.id),
        );

        if (newNodes.length > 0) {
          const newPulses: PulseEntry[] = newNodes.map((n: Node) => ({
            id: `pulse-${n.id}-${Date.now()}`,
            x: n.position.x,
            y: n.position.y,
          }));

          setPulses((prev) => [...prev, ...newPulses]);
        }
      }

      // Update refs
      prevNodeCountRef.current = currentCount;
      prevNodeIdsRef.current = new Set(currentNodes.map((n: Node) => n.id));
    });

    // Initialize refs from current state
    const initialNodes = useCanvasStore.getState().nodes;
    prevNodeCountRef.current = initialNodes.length;
    prevNodeIdsRef.current = new Set(initialNodes.map((n: Node) => n.id));

    return unsubscribe;
  }, []);

  const handleAnimationComplete = (pulseId: string) => {
    setPulses((prev) => prev.filter((p) => p.id !== pulseId));
  };

  // Skip rendering in reduced motion mode
  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {pulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            className="absolute rounded-full border-2 border-violet-500/60"
            style={{
              left: pulse.x,
              top: pulse.y,
              width: 120,
              height: 120,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 12px 2px rgba(139, 92, 246, 0.3)",
            }}
            initial={{ scale: 0.17, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.slow + 0.1, ease: easing.out }}
            onAnimationComplete={() => handleAnimationComplete(pulse.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
