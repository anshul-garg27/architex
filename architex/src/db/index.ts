/**
 * Database connection singleton.
 *
 * Supports two drivers based on DATABASE_URL:
 *   - Local PostgreSQL (pg driver):  postgresql://localhost/architex_dev
 *   - Neon Serverless (neon driver): postgresql://...neon.tech/neondb?sslmode=require
 *
 * The driver is auto-detected from the URL — if it contains "neon.tech"
 * or "vercel-storage", use the Neon HTTP driver; otherwise use standard pg.
 */

import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";

import * as schema from "./schema";

function isNeonUrl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("vercel-storage");
}

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local file.\n" +
        "  Local:  DATABASE_URL=postgresql://localhost/architex_dev\n" +
        "  Cloud:  DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require",
    );
  }

  if (isNeonUrl(databaseUrl)) {
    // Cloud: Neon serverless HTTP driver (works in Edge Runtime)
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  // Local: standard pg driver (Node.js only)
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzlePg(pool, { schema });
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
