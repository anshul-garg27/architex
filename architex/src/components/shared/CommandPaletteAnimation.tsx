"use client";

import { type ReactNode, memo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  springs,
  duration,
  easing,
  animations,
  getStaggerDelay,
} from "@/lib/constants/motion";

// ── Backdrop ───────────────────────────────────────────────────

interface BackdropProps {
  onClick: () => void;
}

export const AnimatedBackdrop = memo(function AnimatedBackdrop({
  onClick,
}: BackdropProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : duration.fast,
      }}
      onClick={onClick}
    />
  );
});

// ── Palette Container ──────────────────────────────────────────

interface PaletteContainerProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedPaletteContainer = memo(
  function AnimatedPaletteContainer({
    children,
    className,
  }: PaletteContainerProps) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return <div className={className}>{children}</div>;
    }

    return (
      <motion.div
        className={className}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{
          ...springs.snappy,
          duration: duration.fast,
        }}
      >
        {children}
      </motion.div>
    );
  },
);

// ── Staggered Result Item ──────────────────────────────────────

interface StaggeredResultItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const StaggeredResultItem = memo(function StaggeredResultItem({
  children,
  index,
  className,
}: StaggeredResultItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const delay = getStaggerDelay("commandResults", index);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={animations.commandPalette.resultItem.initial}
      animate={animations.commandPalette.resultItem.animate}
      transition={{
        ...animations.commandPalette.resultItem.transition,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
});

// ── Keyboard Shortcut Hint ─────────────────────────────────────

interface KeyboardHintProps {
  children: ReactNode;
  className?: string;
}

export const KeyboardShortcutHint = memo(function KeyboardShortcutHint({
  children,
  className,
}: KeyboardHintProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      animate={{
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: easing.inOut,
      }}
    >
      {children}
    </motion.span>
  );
});

// ── Wrapper Component ──────────────────────────────────────────
// Wraps the entire command palette with AnimatePresence for
// enter/exit orchestration.

interface CommandPaletteAnimationWrapperProps {
  open: boolean;
  children: ReactNode;
}

export const CommandPaletteAnimationWrapper = memo(
  function CommandPaletteAnimationWrapper({
    open,
    children,
  }: CommandPaletteAnimationWrapperProps) {
    return (
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="command-palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.quick }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);
