// ─────────────────────────────────────────────────────────────
// FND-042 — Schema Migration
// Pure-function migration chain: v1 -> v2 -> v3 -> ...
// ─────────────────────────────────────────────────────────────

/** Shape of a serialized project stored in IndexedDB / localStorage. */
export interface SerializedProject {
  /** Schema version — drives the migration chain. */
  version: number;
  projectId: string;
  name: string;
  /** ISO-8601 timestamp of the last save. */
  savedAt: string;
  /** Opaque payload — shape depends on the version. */
  data: Record<string, unknown>;
}

// ── Migration function type ────────────────────────────────────

/**
 * A migration is a pure function that transforms a project payload from
 * version N to version N+1. It returns a **new** object (no mutation).
 */
export type MigrationFn = (
  old: SerializedProject,
) => SerializedProject;

// ── Built-in migration chain ───────────────────────────────────

/**
 * v1 -> v2: add `data.settings` with default autoSave fields.
 */
function migrateV1toV2(old: SerializedProject): SerializedProject {
  return {
    ...old,
    version: 2,
    data: {
      ...old.data,
      settings: {
        autoSaveEnabled: true,
        autoSaveIntervalMs: 2000,
        ...(typeof old.data.settings === "object" && old.data.settings !== null
          ? old.data.settings
          : {}),
      },
    },
  };
}

/**
 * v2 -> v3: normalise `data.canvas.groups` — ensure it is always an array.
 */
function migrateV2toV3(old: SerializedProject): SerializedProject {
  const canvas =
    typeof old.data.canvas === "object" && old.data.canvas !== null
      ? (old.data.canvas as Record<string, unknown>)
      : {};

  return {
    ...old,
    version: 3,
    data: {
      ...old.data,
      canvas: {
        ...canvas,
        groups: Array.isArray(canvas.groups) ? canvas.groups : [],
      },
    },
  };
}

// ── Registry ───────────────────────────────────────────────────

/**
 * Ordered migration chain. Each entry migrates from `fromVersion` to
 * `fromVersion + 1`.
 */
const MIGRATIONS: { fromVersion: number; fn: MigrationFn }[] = [
  { fromVersion: 1, fn: migrateV1toV2 },
  { fromVersion: 2, fn: migrateV2toV3 },
];

/** The latest schema version after all migrations have been applied. */
export const LATEST_VERSION = 3;

// ── Public API ─────────────────────────────────────────────────

/**
 * Register a custom migration at runtime (e.g. from a plugin).
 * Migrations must be registered in ascending `fromVersion` order.
 */
export function registerMigration(
  fromVersion: number,
  fn: MigrationFn,
): void {
  MIGRATIONS.push({ fromVersion, fn });
  // Keep the chain sorted so `migrate()` can walk it linearly.
  MIGRATIONS.sort((a, b) => a.fromVersion - b.fromVersion);
}

/**
 * Apply every migration needed to bring `project` up to the latest version.
 *
 * Returns a **new** SerializedProject — the input is never mutated.
 * If the project is already at or above `LATEST_VERSION` it is returned as-is.
 */
export function migrate(project: SerializedProject): SerializedProject {
  let current = { ...project };

  for (const { fromVersion, fn } of MIGRATIONS) {
    if (current.version <= fromVersion) {
      current = fn(current);
    }
  }

  return current;
}
