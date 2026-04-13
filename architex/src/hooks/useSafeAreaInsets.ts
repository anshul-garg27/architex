"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const ZERO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

// ── Helpers ──────────────────────────────────────────────────

function readCSSEnv(property: string): number {
  if (typeof document === "undefined") return 0;

  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.visibility = "hidden";
  el.style.height = `env(${property}, 0px)`;
  document.body.appendChild(el);
  const px = parseFloat(getComputedStyle(el).height) || 0;
  document.body.removeChild(el);
  return px;
}

function readAllInsets(): SafeAreaInsets {
  return {
    top: readCSSEnv("safe-area-inset-top"),
    bottom: readCSSEnv("safe-area-inset-bottom"),
    left: readCSSEnv("safe-area-inset-left"),
    right: readCSSEnv("safe-area-inset-right"),
  };
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Reads CSS `env(safe-area-inset-*)` values and keeps them
 * up-to-date on resize / orientation change.
 *
 * SSR-safe: returns `{ top: 0, bottom: 0, left: 0, right: 0 }` on the server.
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>(ZERO_INSETS);

  const measure = useCallback(() => {
    setInsets(readAllInsets());
  }, []);

  useEffect(() => {
    // Initial read
    measure();

    window.addEventListener("resize", measure);
    // `orientationchange` is still widely fired on mobile browsers
    window.addEventListener("orientationchange", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  return insets;
}
