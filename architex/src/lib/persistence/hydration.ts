// ─────────────────────────────────────────────────────────────
// FND-041 — Hydration Pipeline
// Ordered store hydration with validation and default-merging.
// ─────────────────────────────────────────────────────────────

export type HydrationStatus =
  | { ok: true }
  | { ok: false; errors: string[] };

// ── Default shapes ─────────────────────────────────────────────

export interface UIDefaults {
  activeModule: string;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: string;
  theme: string;
  timelineVisible: boolean;
}

export interface CanvasDefaults {
  nodes: unknown[];
  edges: unknown[];
  groups: unknown[];
}

export interface ProgressDefaults {
  attempts: unknown[];
  totalXP: number;
  streakDays: number;
  lastActiveDate: string;
}

export interface SettingsDefaults {
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
}

export interface HydrationData {
  ui?: Partial<UIDefaults>;
  canvas?: Partial<CanvasDefaults>;
  progress?: Partial<ProgressDefaults>;
  settings?: Partial<SettingsDefaults>;
}

const UI_DEFAULTS: UIDefaults = {
  activeModule: "system-design",
  sidebarOpen: true,
  propertiesPanelOpen: true,
  bottomPanelOpen: false,
  bottomPanelTab: "metrics",
  theme: "dark",
  timelineVisible: false,
};

const CANVAS_DEFAULTS: CanvasDefaults = {
  nodes: [],
  edges: [],
  groups: [],
};

const PROGRESS_DEFAULTS: ProgressDefaults = {
  attempts: [],
  totalXP: 0,
  streakDays: 0,
  lastActiveDate: "",
};

const SETTINGS_DEFAULTS: SettingsDefaults = {
  autoSaveEnabled: true,
  autoSaveIntervalMs: 2000,
};

// ── Validation ─────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Shallow-merge `partial` into `defaults`, keeping the defaults type.
 * Only keys that exist in `defaults` are accepted; everything else is ignored.
 */
function mergeWithDefaults<T>(
  defaults: T,
  partial: Partial<T> | undefined,
): T {
  if (!partial || !isPlainObject(partial)) return { ...defaults };

  const merged = { ...defaults };
  for (const key of Object.keys(defaults as object)) {
    const k = key as keyof T;
    if (k in partial && partial[k] !== undefined) {
      // Trust the value -- deeper validation can be added per-store later
      merged[k] = partial[k] as T[keyof T];
    }
  }
  return merged;
}

// ── Hydration result containers ────────────────────────────────

export interface HydratedStores {
  ui: UIDefaults;
  canvas: CanvasDefaults;
  progress: ProgressDefaults;
  settings: SettingsDefaults;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Hydrate all stores in the correct order:
 *   1. UI store (theme must apply first to avoid FOUC)
 *   2. Canvas store
 *   3. Everything else (progress, settings)
 *
 * Missing or malformed sections are silently replaced with defaults so the
 * application always boots into a valid state.
 */
export function hydrateStores(data: unknown): {
  stores: HydratedStores;
  status: HydrationStatus;
} {
  const errors: string[] = [];

  if (!isPlainObject(data)) {
    errors.push("Root data is not a plain object; using all defaults.");
    return {
      stores: {
        ui: { ...UI_DEFAULTS },
        canvas: { ...CANVAS_DEFAULTS },
        progress: { ...PROGRESS_DEFAULTS },
        settings: { ...SETTINGS_DEFAULTS },
      },
      status: errors.length > 0 ? { ok: false, errors } : { ok: true },
    };
  }

  const typed = data as Partial<HydrationData>;

  // 1. UI first (theme)
  let ui: UIDefaults;
  try {
    ui = mergeWithDefaults(UI_DEFAULTS, typed.ui);
  } catch {
    errors.push("UI hydration failed; using defaults.");
    ui = { ...UI_DEFAULTS };
  }

  // 2. Canvas second
  let canvas: CanvasDefaults;
  try {
    canvas = mergeWithDefaults(CANVAS_DEFAULTS, typed.canvas);
  } catch {
    errors.push("Canvas hydration failed; using defaults.");
    canvas = { ...CANVAS_DEFAULTS };
  }

  // 3. Remaining stores
  let progress: ProgressDefaults;
  try {
    progress = mergeWithDefaults(PROGRESS_DEFAULTS, typed.progress);
  } catch {
    errors.push("Progress hydration failed; using defaults.");
    progress = { ...PROGRESS_DEFAULTS };
  }

  let settings: SettingsDefaults;
  try {
    settings = mergeWithDefaults(SETTINGS_DEFAULTS, typed.settings);
  } catch {
    errors.push("Settings hydration failed; using defaults.");
    settings = { ...SETTINGS_DEFAULTS };
  }

  return {
    stores: { ui, canvas, progress, settings },
    status: errors.length > 0 ? { ok: false, errors } : { ok: true },
  };
}
