// ─────────────────────────────────────────────────────────────
// Architex — Plugin Architecture (INO-035)
// ─────────────────────────────────────────────────────────────
//
// Extensible plugin system with hook-based lifecycle events.
// Plugins can register hooks that run at defined points
// (onNodeCreate, onSimulationTick, onExport, onModuleSwitch).
//
// Execution is sandboxed — plugins receive a frozen copy of
// the data and return transformed results without direct
// store access.
//
// Public API:
//   createPluginManager()                   → PluginManager
//   PluginManager.register(plugin)          → void
//   PluginManager.unregister(id)            → boolean
//   PluginManager.enable(id)                → boolean
//   PluginManager.disable(id)               → boolean
//   PluginManager.getPlugin(id)             → Plugin | undefined
//   PluginManager.getActive()               → Plugin[]
//   PluginManager.getAll()                  → Plugin[]
//   PluginManager.executeHook(name, data)   → processed data
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Supported hook points in the Architex lifecycle. */
export type HookName =
  | 'onNodeCreate'
  | 'onSimulationTick'
  | 'onExport'
  | 'onModuleSwitch';

/**
 * A hook function receives frozen data and returns a
 * (possibly transformed) copy. It must NOT mutate the input.
 */
export type HookFn<T = unknown> = (data: Readonly<T>) => T;

/** Map of hook name to its handler function. */
export type HookMap = Partial<Record<HookName, HookFn>>;

/** A component contributed by a plugin (lazy reference). */
export interface PluginComponent {
  /** Unique component id within the plugin. */
  id: string;
  /** Display name. */
  name: string;
  /** Where this component should appear. */
  slot: 'sidebar' | 'toolbar' | 'panel' | 'modal';
}

/** A plugin definition. */
export interface Plugin {
  /** Unique plugin identifier (kebab-case). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Semantic version string. */
  version: string;
  /** Author name or organisation. */
  author: string;
  /** Optional description. */
  description?: string;
  /** Hook implementations. */
  hooks: HookMap;
  /** UI components contributed by this plugin. */
  components: PluginComponent[];
  /** Whether the plugin is currently enabled. */
  enabled: boolean;
}

/** Registration input — `enabled` defaults to true if omitted. */
export type PluginInput = Omit<Plugin, 'enabled'> & { enabled?: boolean };

/** Result of executing a hook across all active plugins. */
export interface HookResult<T = unknown> {
  /** The final data after all plugins processed it. */
  data: T;
  /** IDs of plugins that processed the hook. */
  executedBy: string[];
  /** Any errors encountered (plugin ID → error message). */
  errors: Record<string, string>;
}

// ── Plugin Manager ─────────────────────────────────────────

/** The runtime plugin manager. */
export interface PluginManager {
  /** Register a new plugin. Throws if duplicate ID. */
  register: (plugin: PluginInput) => void;
  /** Unregister a plugin by ID. Returns false if not found. */
  unregister: (id: string) => boolean;
  /** Enable a registered plugin. Returns false if not found. */
  enable: (id: string) => boolean;
  /** Disable a registered plugin. Returns false if not found. */
  disable: (id: string) => boolean;
  /** Get a plugin by ID (or undefined). */
  getPlugin: (id: string) => Plugin | undefined;
  /** Get all enabled plugins, ordered by registration. */
  getActive: () => Plugin[];
  /** Get all registered plugins. */
  getAll: () => Plugin[];
  /**
   * Execute a named hook across all active plugins that
   * implement it. Data flows through each plugin in
   * registration order (pipeline).
   *
   * Each plugin receives a deep-frozen copy of the data
   * to enforce sandbox isolation.
   */
  executeHook: <T>(hookName: HookName, data: T) => HookResult<T>;
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Deep-freeze an object to prevent mutation. Returns the
 * frozen object (same reference).
 */
function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

/**
 * Shallow-clone + deep-freeze for sandboxed hook input.
 * We structuredClone to avoid cross-plugin leakage, then
 * freeze to enforce immutability.
 */
function sandboxData<T>(data: T): Readonly<T> {
  const cloned = structuredClone(data) as T;
  return deepFreeze(cloned);
}

// ── Factory ────────────────────────────────────────────────

/**
 * Create a new PluginManager instance.
 *
 * The manager maintains an ordered list of plugins. Hooks
 * execute in registration order across all enabled plugins.
 */
export function createPluginManager(): PluginManager {
  const plugins: Plugin[] = [];

  function findIndex(id: string): number {
    return plugins.findIndex((p) => p.id === id);
  }

  const manager: PluginManager = {
    register(input: PluginInput): void {
      if (findIndex(input.id) !== -1) {
        throw new Error(`Plugin "${input.id}" is already registered.`);
      }
      const plugin: Plugin = {
        ...input,
        enabled: input.enabled !== false, // default true
      };
      plugins.push(plugin);
    },

    unregister(id: string): boolean {
      const idx = findIndex(id);
      if (idx === -1) return false;
      plugins.splice(idx, 1);
      return true;
    },

    enable(id: string): boolean {
      const idx = findIndex(id);
      if (idx === -1) return false;
      plugins[idx] = { ...plugins[idx], enabled: true };
      return true;
    },

    disable(id: string): boolean {
      const idx = findIndex(id);
      if (idx === -1) return false;
      plugins[idx] = { ...plugins[idx], enabled: false };
      return true;
    },

    getPlugin(id: string): Plugin | undefined {
      return plugins.find((p) => p.id === id);
    },

    getActive(): Plugin[] {
      return plugins.filter((p) => p.enabled);
    },

    getAll(): Plugin[] {
      return [...plugins];
    },

    executeHook<T>(hookName: HookName, data: T): HookResult<T> {
      const executedBy: string[] = [];
      const errors: Record<string, string> = {};
      let current: T = data;

      const active = plugins.filter((p) => p.enabled && p.hooks[hookName]);

      for (const plugin of active) {
        const hookFn = plugin.hooks[hookName] as HookFn<T> | undefined;
        if (!hookFn) continue;

        try {
          // Sandbox: clone + freeze input, capture output
          const frozen = sandboxData(current);
          const result = hookFn(frozen);
          current = result;
          executedBy.push(plugin.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors[plugin.id] = message;
        }
      }

      return { data: current, executedBy, errors };
    },
  };

  return manager;
}
