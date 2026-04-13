"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { duration, easing } from "@/lib/constants/motion";

// ═══════════════════════════════════════════════════════════════
// ScrollReveal — Scroll-triggered animation wrapper
// ═══════════════════════════════════════════════════════════════
// Uses motion's whileInView (Intersection Observer under the hood)
// Configurable direction, delay, duration, stagger, and once.

type Direction = "up" | "down" | "left" | "right";

function getDirectionOffset(
  direction: Direction,
  distance: number
): { x?: number; y?: number } {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
  }
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the element slides in from (default: "up") */
  direction?: Direction;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds (defaults to motion system "moderate") */
  animationDuration?: number;
  /** Slide distance in pixels */
  distance?: number;
  /** Animate only on first scroll into view (default: true) */
  once?: boolean;
  /** How much of the element must be visible to trigger (0-1) */
  amount?: number;
  /** Enable stagger mode — each direct child gets an incremental delay */
  stagger?: boolean;
  /** Delay between each child in stagger mode (seconds) */
  staggerDelay?: number;
  /** Wrapper element tag */
  as?: "div" | "section" | "ul" | "ol" | "article";
}

export function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  animationDuration = duration.moderate,
  distance = 24,
  once = true,
  amount = 0.15,
  stagger = false,
  staggerDelay = 0.08,
  as = "div",
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const Tag = motion[as];

  // Non-stagger mode: wrap all children in a single animated container
  if (!stagger) {
    const offset = getDirectionOffset(direction, distance);

    return (
      <Tag
        initial={
          prefersReducedMotion
            ? false
            : { opacity: 0, ...offset }
        }
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once, amount }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                duration: animationDuration,
                ease: easing.out,
                delay,
              }
        }
        className={className}
      >
        {children}
      </Tag>
    );
  }

  // Stagger mode: each direct child gets its own animated wrapper
  const offset = getDirectionOffset(direction, distance);
  const childArray = Children.toArray(children);

  return (
    <Tag className={className}>
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, ...offset }
          }
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once, amount }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: animationDuration,
                  ease: easing.out,
                  delay: delay + i * staggerDelay,
                }
          }
        >
          {child}
        </motion.div>
      ))}
    </Tag>
  );
}
