"use client";

import { type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import {
  ReducedMotionProvider,
  useReducedMotion,
} from "@/providers/ReducedMotionProvider";

/**
 * Connects the ReducedMotionProvider a11y toggle to motion's global
 * MotionConfig so that *all* `<motion.*>` components respect the
 * user's reduced-motion preference without per-component wiring.
 */
function MotionConfigBridge({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <ReducedMotionProvider>
      <MotionConfigBridge>{children}</MotionConfigBridge>
    </ReducedMotionProvider>
  );
}
