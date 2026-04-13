"use client";

import { type ReactNode, memo, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, easing } from "@/lib/constants/motion";

// ── Shimmer Block ──────────────────────────────────────────────

interface ShimmerBlockProps {
  className?: string;
}

export const ShimmerBlock = memo(function ShimmerBlock({
  className,
}: ShimmerBlockProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-elevated",
        className,
      )}
    >
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.5,
          }}
        />
      )}
    </div>
  );
});

// ── Skeleton: Sidebar ──────────────────────────────────────────

export const SidebarSkeleton = memo(function SidebarSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      {/* Search bar */}
      <ShimmerBlock className="h-9 w-full" />
      {/* Section header */}
      <ShimmerBlock className="mt-2 h-4 w-24" />
      {/* List items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <ShimmerBlock className="h-8 w-8 shrink-0 rounded-md" />
          <ShimmerBlock className="h-4 flex-1" />
        </div>
      ))}
      {/* Section header */}
      <ShimmerBlock className="mt-4 h-4 w-32" />
      {/* More items */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`s2-${i}`} className="flex items-center gap-3">
          <ShimmerBlock className="h-8 w-8 shrink-0 rounded-md" />
          <ShimmerBlock className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
});

// ── Skeleton: Canvas ───────────────────────────────────────────

export const CanvasSkeleton = memo(function CanvasSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-canvas-bg">
      {/* Fake grid dots */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="skeleton-dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#skeleton-dots)" />
        </svg>
      </div>
      {/* Fake nodes */}
      <div className="flex gap-16">
        <ShimmerBlock className="h-16 w-40 rounded-lg" />
        <ShimmerBlock className="h-16 w-40 rounded-lg" />
        <ShimmerBlock className="h-16 w-40 rounded-lg" />
      </div>
    </div>
  );
});

// ── Skeleton: Properties Panel ─────────────────────────────────

export const PropertiesSkeleton = memo(function PropertiesSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShimmerBlock className="h-10 w-10 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <ShimmerBlock className="h-4 w-28" />
          <ShimmerBlock className="h-3 w-20" />
        </div>
      </div>
      {/* Divider */}
      <div className="my-1 h-px w-full bg-border" />
      {/* Property rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <ShimmerBlock className="h-3 w-20" />
          <ShimmerBlock className="h-8 w-24 rounded-md" />
        </div>
      ))}
      {/* Divider */}
      <div className="my-1 h-px w-full bg-border" />
      {/* Metrics */}
      <ShimmerBlock className="h-4 w-16" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`m-${i}`} className="flex items-center justify-between">
          <ShimmerBlock className="h-3 w-16" />
          <ShimmerBlock className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
});

// ── Crossfade Loader ───────────────────────────────────────────
// Displays a skeleton while `loading` is true, then crossfades
// to real content.

interface CrossfadeLoaderProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export const CrossfadeLoader = memo(function CrossfadeLoader({
  loading,
  skeleton,
  children,
  className,
}: CrossfadeLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const animDuration = prefersReducedMotion ? 0 : duration.normal;

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animDuration, ease: easing.out }}
            className="h-full w-full"
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: animDuration, ease: easing.out }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
