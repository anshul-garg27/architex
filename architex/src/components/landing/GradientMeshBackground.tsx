"use client";

import { useReducedMotion } from "motion/react";

/**
 * GradientMeshBackground
 * ──────────────────────────────────────────────────────
 * CSS-first animated gradient background using @property
 * for hue-shifting overlapping radial gradients.
 *
 * - Violet/blue/purple palette matching design tokens
 * - Low opacity, non-distracting background element
 * - Static fallback for browsers without @property
 * - Respects prefers-reduced-motion
 */

/* ---------- CSS injected via <style> tag ----------
 * SECURITY NOTE: This is a static constant string defined in source code,
 * not user-generated content. No XSS risk. */

const MESH_CSS = `
/* @property declarations for animatable CSS custom properties */
@property --mesh-hue-1 {
  syntax: "<number>";
  initial-value: 252;
  inherits: false;
}
@property --mesh-hue-2 {
  syntax: "<number>";
  initial-value: 220;
  inherits: false;
}
@property --mesh-hue-3 {
  syntax: "<number>";
  initial-value: 270;
  inherits: false;
}
@property --mesh-x-1 {
  syntax: "<percentage>";
  initial-value: 25%;
  inherits: false;
}
@property --mesh-y-1 {
  syntax: "<percentage>";
  initial-value: 30%;
  inherits: false;
}
@property --mesh-x-2 {
  syntax: "<percentage>";
  initial-value: 70%;
  inherits: false;
}
@property --mesh-y-2 {
  syntax: "<percentage>";
  initial-value: 60%;
  inherits: false;
}
@property --mesh-x-3 {
  syntax: "<percentage>";
  initial-value: 50%;
  inherits: false;
}
@property --mesh-y-3 {
  syntax: "<percentage>";
  initial-value: 20%;
  inherits: false;
}

@keyframes mesh-shift-hues {
  0% {
    --mesh-hue-1: 252;
    --mesh-hue-2: 220;
    --mesh-hue-3: 270;
  }
  33% {
    --mesh-hue-1: 230;
    --mesh-hue-2: 260;
    --mesh-hue-3: 245;
  }
  66% {
    --mesh-hue-1: 270;
    --mesh-hue-2: 240;
    --mesh-hue-3: 215;
  }
  100% {
    --mesh-hue-1: 252;
    --mesh-hue-2: 220;
    --mesh-hue-3: 270;
  }
}

@keyframes mesh-drift-positions {
  0% {
    --mesh-x-1: 25%;
    --mesh-y-1: 30%;
    --mesh-x-2: 70%;
    --mesh-y-2: 60%;
    --mesh-x-3: 50%;
    --mesh-y-3: 20%;
  }
  25% {
    --mesh-x-1: 35%;
    --mesh-y-1: 45%;
    --mesh-x-2: 55%;
    --mesh-y-2: 40%;
    --mesh-x-3: 65%;
    --mesh-y-3: 35%;
  }
  50% {
    --mesh-x-1: 45%;
    --mesh-y-1: 25%;
    --mesh-x-2: 30%;
    --mesh-y-2: 55%;
    --mesh-x-3: 70%;
    --mesh-y-3: 50%;
  }
  75% {
    --mesh-x-1: 20%;
    --mesh-y-1: 50%;
    --mesh-x-2: 60%;
    --mesh-y-2: 35%;
    --mesh-x-3: 40%;
    --mesh-y-3: 45%;
  }
  100% {
    --mesh-x-1: 25%;
    --mesh-y-1: 30%;
    --mesh-x-2: 70%;
    --mesh-y-2: 60%;
    --mesh-x-3: 50%;
    --mesh-y-3: 20%;
  }
}

.gradient-mesh-bg {
  background:
    radial-gradient(
      ellipse 60% 50% at var(--mesh-x-1) var(--mesh-y-1),
      hsla(var(--mesh-hue-1), 80%, 55%, 0.15) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 50% 60% at var(--mesh-x-2) var(--mesh-y-2),
      hsla(var(--mesh-hue-2), 85%, 50%, 0.12) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 55% 55% at var(--mesh-x-3) var(--mesh-y-3),
      hsla(var(--mesh-hue-3), 75%, 60%, 0.10) 0%,
      transparent 70%
    );
  animation:
    mesh-shift-hues 20s ease-in-out infinite,
    mesh-drift-positions 25s ease-in-out infinite;
}

/* Static fallback — used when @property is unsupported or reduced motion is active */
.gradient-mesh-bg--static {
  background:
    radial-gradient(
      ellipse 60% 50% at 25% 30%,
      hsla(252, 80%, 55%, 0.15) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 50% 60% at 70% 60%,
      hsla(220, 85%, 50%, 0.12) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 55% 55% at 50% 20%,
      hsla(270, 75%, 60%, 0.10) 0%,
      transparent 70%
    );
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .gradient-mesh-bg {
    animation: none;
    background:
      radial-gradient(
        ellipse 60% 50% at 25% 30%,
        hsla(252, 80%, 55%, 0.15) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 50% 60% at 70% 60%,
        hsla(220, 85%, 50%, 0.12) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 55% 55% at 50% 20%,
        hsla(270, 75%, 60%, 0.10) 0%,
        transparent 70%
      );
  }
}
`;

interface GradientMeshBackgroundProps {
  className?: string;
}

export function GradientMeshBackground({
  className = "",
}: GradientMeshBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Static CSS constant — safe to inject, no user input involved */}
      <style dangerouslySetInnerHTML={{ __html: MESH_CSS }} />
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${
          prefersReducedMotion ? "gradient-mesh-bg--static" : "gradient-mesh-bg"
        } ${className}`}
      />
    </>
  );
}
