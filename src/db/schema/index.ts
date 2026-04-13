/**
 * =============================================================================
 * SCHEMA BARREL EXPORT
 * =============================================================================
 *
 * Import all schema modules here. This file is referenced by:
 * - drizzle.config.ts (schema discovery)
 * - src/db/index.ts (Drizzle client initialization)
 * - Migration generation (drizzle-kit generate)
 */

// Core entities
export * from "./users";
export * from "./diagrams";
export * from "./templates";
export * from "./challenges";
export * from "./progress";
export * from "./achievements";

// Community & social
export * from "./community";

// Collaboration
export * from "./collaboration";

// Notifications
export * from "./notifications";

// Activity & analytics
export * from "./activity";

// Drizzle relational query definitions
export * from "./relations";
