"use client";

// ─────────────────────────────────────────────────────────────
// FND-048 — Module-scoped context provider
//
// Wraps each module with its own React context so that
// module-specific state (sidebar selection, local filters,
// panel mode, etc.) can be shared across deeply nested panel
// components without prop drilling.
//
// Usage:
//   <ModuleProvider moduleType="algorithms" displayName="Algorithms">
//     <Sidebar />
//     <Canvas />
//     <PropertiesPanel />
//   </ModuleProvider>
//
// Any child can call `useModuleContext()` to read/write
// module-scoped values.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ModuleType } from "@/stores/ui-store";

// ── Types ──────────────────────────────────────────────────

/** Arbitrary key-value bag for module-local state. */
export type ModuleLocalState = Record<string, unknown>;

export interface ModuleContextValue {
  /** Which module this context belongs to (e.g. "algorithms"). */
  moduleType: ModuleType;
  /** Human-readable module name (e.g. "Algorithms"). */
  displayName: string;
  /** Module-local state — arbitrary key-value pairs. */
  localState: ModuleLocalState;
  /** Set a single key in the module-local state. */
  setLocalValue: <T>(key: string, value: T) => void;
  /** Retrieve a typed value from module-local state. */
  getLocalValue: <T>(key: string, fallback: T) => T;
  /** Reset all module-local state to empty. */
  resetLocalState: () => void;
}

// ── Context ────────────────────────────────────────────────

const ModuleContext = createContext<ModuleContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────

export interface ModuleProviderProps {
  moduleType: ModuleType;
  displayName: string;
  /** Optional initial state to hydrate on mount. */
  initialState?: ModuleLocalState;
  children: ReactNode;
}

export function ModuleProvider({
  moduleType,
  displayName,
  initialState,
  children,
}: ModuleProviderProps) {
  const [localState, setLocalState] = useState<ModuleLocalState>(
    initialState ?? {},
  );

  const setLocalValue = useCallback(<T,>(key: string, value: T) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getLocalValue = useCallback(
    <T,>(key: string, fallback: T): T => {
      const val = localState[key];
      return val !== undefined ? (val as T) : fallback;
    },
    [localState],
  );

  const resetLocalState = useCallback(() => {
    setLocalState(initialState ?? {});
  }, [initialState]);

  const value = useMemo<ModuleContextValue>(
    () => ({
      moduleType,
      displayName,
      localState,
      setLocalValue,
      getLocalValue,
      resetLocalState,
    }),
    [moduleType, displayName, localState, setLocalValue, getLocalValue, resetLocalState],
  );

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────

/**
 * Access the module context. Throws if called outside a ModuleProvider.
 */
export function useModuleContext(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    throw new Error(
      "useModuleContext must be used within a <ModuleProvider>. " +
        "Wrap your module component tree with <ModuleProvider moduleType={...}>.",
    );
  }
  return ctx;
}

/**
 * Convenience hook: returns just the moduleType string.
 * Safe to call outside a provider — returns null if no provider is present.
 */
export function useModuleType(): ModuleType | null {
  const ctx = useContext(ModuleContext);
  return ctx?.moduleType ?? null;
}

/**
 * Typed accessor for a single module-local value.
 *
 * ```tsx
 * const [algo, setAlgo] = useModuleLocalValue("selectedAlgo", "bfs");
 * ```
 */
export function useModuleLocalValue<T>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const ctx = useModuleContext();
  const value = ctx.getLocalValue(key, fallback);
  const setValue = useCallback(
    (v: T) => ctx.setLocalValue(key, v),
    [ctx, key],
  );
  return [value, setValue];
}
