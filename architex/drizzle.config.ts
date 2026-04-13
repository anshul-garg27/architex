/**
 * Drizzle Kit configuration for the Architex app.
 *
 * Auto-detects local vs cloud:
 *   - Local:  uses 'pg' driver with DATABASE_URL_UNPOOLED or DATABASE_URL
 *   - Cloud:  uses 'neon-http' driver with DATABASE_URL_UNPOOLED
 *
 * Commands:
 *   pnpm db:generate  — Generate SQL migration files
 *   pnpm db:migrate   — Apply pending migrations
 *   pnpm db:push      — Push schema directly (dev only)
 *   pnpm db:studio    — Visual schema browser
 */

import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

const isNeon = url.includes("neon.tech") || url.includes("vercel-storage");

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  ...(isNeon
    ? { driver: "neon-http" as const }
    : {}),
  dbCredentials: {
    url,
  },
  verbose: true,
  strict: true,
});
