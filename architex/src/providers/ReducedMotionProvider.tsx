"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ── Constants ────────────────────────────────────────────────

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";
const LOCAL_STORAGE_KEY = "architex-a11y-reduce-animations";

// ── Context ─────────────────────────────────────────────────

interface ReducedMotionContextValue {
  /** `true` when animations should be skipped (OS setting OR toolbar override). */
  prefersReducedMotion: boolean;
  /** Toolbar-level override (`null` = defer to OS). */
  toolbarOverride: boolean | null;
  /** Set the toolbar override (called by A11yToolbar). */
  setToolbarOverride: (value: boolean | null) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
  prefersReducedMotion: false,
  toolbarOverride: null,
  setToolbarOverride: () => {},
});

// ── Provider ────────────────────────────────────────────────

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  // OS-level media query
  const [osPrefers, setOsPrefers] = useState(false);

  // A11yToolbar local override (persisted in localStorage)
  const [toolbarOverride, setToolbarOverrideState] = useState<boolean | null>(
    null,
  );

  // Read OS preference on mount + listen for changes
  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    setOsPrefers(mql.matches);

    const handler = (e: MediaQueryListEvent) => setOsPrefers(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Hydrate toolbar override from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored !== null) {
        setToolbarOverrideState(JSON.parse(stored) as boolean);
      }
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const setToolbarOverride = (value: boolean | null) => {
    setToolbarOverrideState(value);
    try {
      if (value === null) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      }
    } catch {
      // localStorage unavailable — ignore
    }
  };

  // Resolved value: toolbar override wins when set, otherwise OS
  const prefersReducedMotion =
    toolbarOverride !== null ? toolbarOverride : osPrefers;

  const value = useMemo<ReducedMotionContextValue>(
    () => ({ prefersReducedMotion, toolbarOverride, setToolbarOverride }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefersReducedMotion, toolbarOverride],
  );

  return (
    <ReducedMotionContext.Provider value={value}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Returns `true` when reduced motion is active (OS or toolbar override).
 *
 * Usage:
 * ```ts
 * const prefersReducedMotion = useReducedMotion();
 * <motion.div transition={prefersReducedMotion ? { duration: 0 } : springs.smooth} />
 * ```
 */
export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext).prefersReducedMotion;
}

/**
 * Full context access for components that need to read/write the toolbar override
 * (e.g. A11yToolbar itself).
 */
export function useReducedMotionContext(): ReducedMotionContextValue {
  return useContext(ReducedMotionContext);
}
