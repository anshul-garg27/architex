/**
 * Drizzle Kit configuration for the Architex app.
 *
 * Commands:
 *   pnpm drizzle-kit generate  — Generate SQL migration files
 *   pnpm drizzle-kit migrate   — Apply pending migrations
 *   pnpm drizzle-kit push      — Push schema directly (dev only)
 *   pnpm drizzle-kit studio    — Visual schema browser
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  verbose: true,
  strict: true,
});
