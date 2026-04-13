/**
 * =============================================================================
 * DRIZZLE KIT CONFIGURATION
 * =============================================================================
 *
 * Used by drizzle-kit for:
 * - `npx drizzle-kit generate`  -- Generate SQL migration files from schema changes
 * - `npx drizzle-kit migrate`   -- Apply pending migrations to the database
 * - `npx drizzle-kit push`      -- Push schema directly (development only)
 * - `npx drizzle-kit studio`    -- Visual schema browser
 *
 * Migration strategy:
 * - Development: `drizzle-kit push` for rapid iteration (schema -> DB directly)
 * - Staging/Production: `drizzle-kit generate` -> review SQL -> `drizzle-kit migrate`
 * - CI/CD: migrations run automatically in the deployment pipeline
 *
 * Neon branching:
 * - Each Vercel preview deployment gets its own Neon branch (via Neon-Vercel integration)
 * - Migrations run against the branch, not production
 * - On merge to main, migrations run against the production branch
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // All schema files in the schema directory
  schema: "./src/db/schema/*",

  // Migration output directory (committed to git)
  out: "./drizzle/migrations",

  dialect: "postgresql",

  dbCredentials: {
    // Use the UNPOOLED URL for migrations (DDL needs direct connection)
    url: process.env.DATABASE_URL_UNPOOLED!,
  },

  // Verbose output for migration generation
  verbose: true,

  // Strict mode: fail if schema has issues
  strict: true,
});
