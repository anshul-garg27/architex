"use client";

import * as React from "react";
import { useRef, useCallback, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springs, duration, easing } from "@/lib/constants/motion";

// ── Types ──────────────────────────────────────────────────────

interface AnimatedButtonProps extends ButtonProps {
  /** Enable click ripple effect. Default: false */
  ripple?: boolean;
}

// ── Ripple helper ──────────────────────────────────────────────

interface RippleState {
  id: number;
  x: number;
  y: number;
}

let rippleIdCounter = 0;

// ── AnimatedButton ─────────────────────────────────────────────

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ ripple = false, className, children, onClick, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef<HTMLDivElement>(null);
    const [ripples, setRipples] = useState<RippleState[]>([]);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ripple && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = ++rippleIdCounter;
          setRipples((prev) => [...prev, { id, x, y }]);
          // Clean up after animation
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== id));
          }, 600);
        }
        onClick?.(e);
      },
      [ripple, onClick],
    );

    // Reduced motion: render plain button
    if (prefersReducedMotion) {
      return (
        <Button
          ref={ref}
          className={className}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>
      );
    }

    return (
      <div ref={containerRef} className="relative inline-flex">
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="inline-flex"
        >
          <Button
            ref={ref}
            className={cn("relative overflow-hidden", className)}
            onClick={handleClick}
            {...props}
          >
            {children}
            {/* Ripple container */}
            {ripple &&
              ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="pointer-events-none absolute rounded-full bg-white/25"
                  style={{
                    left: r.x,
                    top: r.y,
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                  }}
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 20, opacity: 0 }}
                  transition={{ duration: duration.slow, ease: easing.out }}
                />
              ))}
          </Button>
        </motion.div>
      </div>
    );
  },
);
AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
