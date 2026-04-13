// -----------------------------------------------------------------
// Architex -- LLD State Persistence (LLD-063)
// -----------------------------------------------------------------
//
// localStorage persistence layer for LLD module state.
// Exports saveLLDState / loadLLDState and a debounced auto-save
// helper. The actual wiring into useLLDModule is done separately.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";

// -- Constants ---------------------------------------------------

/** localStorage key for LLD module state. */
const STORAGE_KEY = "architex-lld-state";

/**
 * Schema version — bump this when the persisted shape changes.
 * loadLLDState returns null when the stored version does not match,
 * allowing the consumer to fall back to defaults.
 */
const SCHEMA_VERSION = 1;

/** Default debounce delay in milliseconds. */
const DEFAULT_DEBOUNCE_MS = 500;

// -- Persisted State Shape ---------------------------------------

export interface LLDPersistedState {
  /** Schema version for forward-compatible migration. */
  _version: number;

  // Sidebar / navigation
  sidebarMode: string;
  activePatternId: string | null;
  activeDemoId: string | null;
  activeProblemId: string | null;
  activeSequenceId: string | null;
  activeStateMachineId: string | null;

  // Diagram state
  classes: UMLClass[];
  relationships: UMLRelationship[];

  // SOLID view
  solidView: string | null;
}

// -- Save / Load -------------------------------------------------

/**
 * Persist the LLD module state to localStorage.
 *
 * Automatically stamps the payload with the current schema version.
 * Silently catches quota-exceeded or unavailable-storage errors (SSR,
 * private browsing, full storage).
 *
 * @param state - The LLD state to persist (version field is added automatically).
 */
export function saveLLDState(state: Omit<LLDPersistedState, "_version">): void {
  try {
    const payload: LLDPersistedState = {
      ...state,
      _version: SCHEMA_VERSION,
    };
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // localStorage may be full or unavailable (SSR, private browsing).
    // Fail silently — persistence is a nice-to-have.
  }
}

/**
 * Load previously persisted LLD state from localStorage.
 *
 * @returns The saved state (without the internal `_version` key), or `null` when:
 *   - No saved state exists
 *   - The stored schema version does not match the current version
 *   - The stored JSON is corrupt
 *   - `localStorage` is unavailable (SSR, private browsing)
 */
export function loadLLDState(): Omit<LLDPersistedState, "_version"> | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: LLDPersistedState = JSON.parse(raw);

    // Version mismatch — discard stale state
    if (parsed._version !== SCHEMA_VERSION) return null;

    // Strip internal version key before returning
    const { _version: _, ...state } = parsed;
    return state;
  } catch {
    return null;
  }
}

/**
 * Remove persisted LLD state from localStorage.
 *
 * Useful for "reset to defaults" flows. Silently ignores errors if
 * `localStorage` is unavailable.
 */
export function clearLLDState(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silently ignore
  }
}

// -- Debounced Auto-Save -----------------------------------------

/**
 * Create a debounced auto-save function. Each call resets the timer;
 * the actual `saveLLDState()` write happens only after `delayMs`
 * milliseconds of inactivity.
 *
 * The returned function also has a `.cancel()` method to clear any
 * pending timer (call this on component unmount).
 *
 * @param delayMs - Debounce delay in milliseconds (default: 500).
 * @returns A callable `(state) => void` with a `.cancel()` method.
 *
 * @example
 * ```ts
 * const autoSave = createDebouncedSave(300);
 * // In an effect:
 * autoSave(currentState);
 * // On unmount:
 * autoSave.cancel();
 * ```
 */
export function createDebouncedSave(
  delayMs: number = DEFAULT_DEBOUNCE_MS,
): {
  (state: Omit<LLDPersistedState, "_version">): void;
  cancel: () => void;
} {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (state: Omit<LLDPersistedState, "_version">) => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      saveLLDState(state);
      timerId = null;
    }, delayMs);
  };

  debouncedFn.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debouncedFn;
}
