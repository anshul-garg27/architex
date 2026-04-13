"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { duration as motionDuration, easing } from "@/lib/constants/motion";

// ── Types ─────────────────────────────────────────────────────

export type PanelSide = "left" | "right" | "bottom";

interface PanelTransitionProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Which side the panel slides from */
  side?: PanelSide;
  /** Content to render inside the panel */
  children: ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

// ── Slide offsets per side ─────────────────────────────────────

const slideVariants: Record<PanelSide, { x?: string; y?: string }> = {
  left: { x: "-100%" },
  right: { x: "100%" },
  bottom: { y: "100%" },
};

// ── PanelTransition ───────────────────────────────────────────

export function PanelTransition({
  open,
  side = "left",
  children,
  className,
}: PanelTransitionProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const offset = slideVariants[side];
  const dur = prefersReducedMotion ? 0 : motionDuration.normal;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          initial={{ opacity: 0, ...offset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...offset }}
          transition={{ duration: dur, ease: easing.inOut }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
