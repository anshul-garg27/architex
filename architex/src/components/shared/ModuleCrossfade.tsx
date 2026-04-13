"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

// ── Types ─────────────────────────────────────────────────────

interface ModuleCrossfadeProps {
  /** A stable key that changes when the module switches (e.g. activeModule string) */
  moduleKey: string;
  /** The module content to render */
  children: ReactNode;
}

// ── ModuleCrossfade ───────────────────────────────────────────
// Wraps module content in an AnimatePresence so that switching
// modules produces a quick crossfade: outgoing fades out while
// incoming fades in.

export function ModuleCrossfade({ moduleKey, children }: ModuleCrossfadeProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const duration = prefersReducedMotion ? 0 : 0.2;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={moduleKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
