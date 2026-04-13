"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// ── Core media-query hook ────────────────────────────────────────
// Uses useSyncExternalStore for tear-free reads when available,
// with a safe SSR fallback (always returns false on the server).

function subscribe(query: string, callback: () => void): () => void {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Reactively tracks a CSS media query.
 * Returns `true` when the query matches, `false` otherwise.
 * Always returns `false` during SSR.
 */
export function useMediaQuery(query: string): boolean {
  // useSyncExternalStore requires stable subscribe/getSnapshot references
  // per query string, so we close over `query`.
  const value = useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getSnapshot(query),
    () => getServerSnapshot(),
  );
  return value;
}

// ── Convenience breakpoint hooks ─────────────────────────────────

/** Viewport width < 768px */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767.98px)");
}

/** Viewport width 768px - 1024px */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
}

/** Viewport width > 1024px */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024.02px)");
}
