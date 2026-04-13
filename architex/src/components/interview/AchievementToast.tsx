"use client";

import React, { memo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Trophy,
  Zap,
  Flame,
  Crown,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementRarity } from "@/lib/interview/achievements";
import { springs, duration, easing } from "@/lib/constants/motion";

// ── Icon mapping ──────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Star,
  Trophy,
  Zap,
  Flame,
  Crown,
  Sparkles,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star;
}

// ── Rarity colors ─────────────────────────────────────────────────

const RARITY_STYLES: Record<
  AchievementRarity,
  { border: string; glow: string; bg: string; text: string; particle: string }
> = {
  common: {
    border: "border-zinc-500",
    glow: "shadow-zinc-500/20",
    bg: "bg-zinc-700/30",
    text: "text-zinc-300",
    particle: "#a1a1aa",
  },
  rare: {
    border: "border-blue-500",
    glow: "shadow-blue-500/30",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    particle: "#3b82f6",
  },
  epic: {
    border: "border-purple-500",
    glow: "shadow-purple-500/30",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    particle: "#a855f7",
  },
  legendary: {
    border: "border-amber-500",
    glow: "shadow-amber-500/30",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    particle: "#f59e0b",
  },
};

// ── Confetti particles ────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

function generateParticles(color: string, count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 120 - 40,
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    color,
    delay: Math.random() * 0.3,
  }));
}

// ── AchievementToast ──────────────────────────────────────────────

export interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const AchievementToast = memo(function AchievementToast({
  achievement,
  onDismiss,
  autoDismissMs = 5000,
}: AchievementToastProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const rarity = achievement?.rarity ?? "common";
  const styles = RARITY_STYLES[rarity];

  // Generate particles when achievement appears
  useEffect(() => {
    if (achievement) {
      setParticles(generateParticles(styles.particle, 16));
    }
  }, [achievement, styles.particle]);

  // Auto-dismiss
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [achievement, autoDismissMs, onDismiss]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const Icon = achievement ? getIcon(achievement.icon) : Star;

  return (
    <AnimatePresence mode="wait">
      {achievement && (
        <motion.div
          key={achievement.id}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.95 }}
          transition={springs.bouncy}
          className={cn(
            "pointer-events-auto relative overflow-hidden rounded-xl border",
            "bg-zinc-900/95 p-4 shadow-lg backdrop-blur-sm",
            styles.border,
            styles.glow,
            "shadow-[0_0_20px_0]",
          )}
          role="alert"
          aria-live="polite"
        >
          {/* Particle confetti */}
          <div className="pointer-events-none absolute inset-0">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: p.scale,
                  opacity: 0,
                  rotate: p.rotation,
                }}
                transition={{
                  duration: duration.deliberate,
                  ease: easing.out,
                  delay: p.delay,
                }}
              />
            ))}
          </div>

          <div className="relative flex items-start gap-3">
            {/* Achievement icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springs.bouncy, delay: 0.15 }}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                styles.bg,
              )}
            >
              <Icon className={cn("h-5 w-5", styles.text)} />
            </motion.div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: duration.normal, ease: easing.out, delay: 0.1 }}
                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
              >
                Achievement Unlocked
              </motion.p>
              <motion.h4
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: duration.normal, ease: easing.out, delay: 0.15 }}
                className="text-sm font-bold text-zinc-100"
              >
                {achievement.name}
              </motion.h4>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: duration.normal, ease: easing.out, delay: 0.2 }}
                className="mt-0.5 text-xs text-zinc-400"
              >
                {achievement.description}
              </motion.p>

              {/* XP reward */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.bouncy, delay: 0.3 }}
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">
                  +{achievement.xpReward} XP
                </span>
              </motion.div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            className={cn("absolute bottom-0 left-0 h-0.5", styles.bg)}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AchievementToast.displayName = "AchievementToast";

export default AchievementToast;
