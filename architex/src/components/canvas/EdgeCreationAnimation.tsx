"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { easing } from "@/lib/constants/motion";
import type { Edge, Node } from "@xyflow/react";

// ── Types ──────────────────────────────────────────────────────

interface TravelingDot {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

// ── Constants ──────────────────────────────────────────────────

const DOT_SIZE = 8;
const ANIMATION_DURATION = 0.3; // 300ms
const PULSE_DURATION = 0.3;

// ── Helper: find node center ───────────────────────────────────

function getNodeCenter(node: Node): { x: number; y: number } {
  const width = node.measured?.width ?? (node.width as number | undefined) ?? 180;
  const height = node.measured?.height ?? (node.height as number | undefined) ?? 60;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

// ── EdgeCreationAnimation ──────────────────────────────────────

export const EdgeCreationAnimation = memo(function EdgeCreationAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const [dots, setDots] = useState<TravelingDot[]>([]);
  const [pulses, setPulses] = useState<
    { id: string; x: number; y: number }[]
  >([]);
  const prevEdgeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      const currentEdges = state.edges;
      const currentEdgeIds = new Set(currentEdges.map((e: Edge) => e.id));
      const prevIds = prevEdgeIdsRef.current;

      // Find newly added edges
      const newEdges = currentEdges.filter(
        (e: Edge) => !prevIds.has(e.id),
      );

      if (newEdges.length > 0) {
        const nodes = state.nodes;
        const newDots: TravelingDot[] = [];

        for (const edge of newEdges) {
          const sourceNode = nodes.find((n: Node) => n.id === edge.source);
          const targetNode = nodes.find((n: Node) => n.id === edge.target);

          if (sourceNode && targetNode) {
            const source = getNodeCenter(sourceNode);
            const target = getNodeCenter(targetNode);

            newDots.push({
              id: `dot-${edge.id}-${Date.now()}`,
              sourceX: source.x,
              sourceY: source.y,
              targetX: target.x,
              targetY: target.y,
            });
          }
        }

        if (newDots.length > 0) {
          setDots((prev) => [...prev, ...newDots]);
        }
      }

      prevEdgeIdsRef.current = currentEdgeIds;
    });

    // Initialize refs
    const initialEdges = useCanvasStore.getState().edges;
    prevEdgeIdsRef.current = new Set(initialEdges.map((e: Edge) => e.id));

    return unsubscribe;
  }, []);

  const handleDotComplete = (dot: TravelingDot) => {
    // Remove the dot and add a pulse at the target
    setDots((prev) => prev.filter((d) => d.id !== dot.id));
    const pulseId = `pulse-${dot.id}`;
    setPulses((prev) => [...prev, { id: pulseId, x: dot.targetX, y: dot.targetY }]);
    // Clean up pulse after animation
    setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.id !== pulseId));
    }, PULSE_DURATION * 1000 + 50);
  };

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {/* Traveling dots */}
        {dots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute rounded-full bg-violet-400"
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              marginLeft: -DOT_SIZE / 2,
              marginTop: -DOT_SIZE / 2,
              boxShadow: "0 0 8px 2px rgba(139, 92, 246, 0.5)",
            }}
            initial={{
              left: dot.sourceX,
              top: dot.sourceY,
              scale: 0.5,
              opacity: 0,
            }}
            animate={{
              left: dot.targetX,
              top: dot.targetY,
              scale: 1,
              opacity: 1,
            }}
            transition={{
              duration: ANIMATION_DURATION,
              ease: easing.out,
            }}
            onAnimationComplete={() => handleDotComplete(dot)}
          />
        ))}

        {/* Connection pulses at target */}
        {pulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            className="absolute rounded-full border-2 border-violet-400/60"
            style={{
              left: pulse.x,
              top: pulse.y,
              width: 40,
              height: 40,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{
              duration: PULSE_DURATION,
              ease: easing.out,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
