"use client";

// ── Re-exports from split module files ───────────────────────
// This file preserves backward compatibility for all existing imports.
// The actual implementation lives in ./database/ subdirectory.

export { useDatabaseModule, DatabaseModule } from "./database/useDatabaseModule";
export type { DatabaseMode } from "./database/useDatabaseModule";
