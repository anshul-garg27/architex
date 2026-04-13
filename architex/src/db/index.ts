/**
 * Database connection singleton.
 *
 * Uses Neon serverless driver with Drizzle ORM.
 * The pooled URL (`DATABASE_URL`) is used for queries.
 * The unpooled URL (`DATABASE_URL_UNPOOLED`) is used by drizzle-kit for migrations.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local file.",
    );
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/** Lazily-initialized database instance (singleton per serverless invocation). */
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;

// Re-export schema for convenience
export * from "./schema";
