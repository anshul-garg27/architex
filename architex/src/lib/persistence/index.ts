// ─────────────────────────────────────────────────────────────
// Persistence — barrel export
// ─────────────────────────────────────────────────────────────

// IndexedDB wrapper
export {
  openDB,
  put,
  get,
  del,
  getAll,
  getDefaultDB,
  ARCHITEX_DB_NAME,
  ARCHITEX_DB_VERSION,
  ARCHITEX_SCHEMA,
} from "./idb-store";
export type { IDBSchema, IDBHandle } from "./idb-store";

// Auto-save manager
export { createAutoSave } from "./auto-save";
export type { AutoSaveOptions, AutoSaveHandle, SaveStatus } from "./auto-save";

// Hydration pipeline
export { hydrateStores } from "./hydration";
export type {
  HydrationData,
  HydrationStatus,
  HydratedStores,
  UIDefaults,
  CanvasDefaults,
  ProgressDefaults,
  SettingsDefaults,
} from "./hydration";

// Schema migration
export {
  migrate,
  registerMigration,
  LATEST_VERSION,
} from "./migration";
export type { SerializedProject, MigrationFn } from "./migration";

// Fallback (beforeunload) save
export {
  installBeforeUnloadSave,
  checkForRecoveryData,
  clearRecoveryData,
  FALLBACK_LS_KEY,
} from "./fallback-save";
export type { RecoveryData } from "./fallback-save";
