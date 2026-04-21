#!/usr/bin/env node
/**
 * Seed module_content rows for LLD lessons from pre-compiled JSON artifacts.
 *
 * Usage:
 *   node scripts/seed-lld-lessons-from-json.mjs
 *
 * Pairs with `compile-lld-lessons.ts --json-out` which writes JSON artifacts
 * to content/lld/compiled/<slug>.json. This seeder reads them and upserts
 * via raw pg (no drizzle, no schema imports — avoids the Node 25 + tsx ESM
 * toolchain issues that block the in-script upsert path).
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import pg from "pg";

const COMPILED_DIR = "content/lld/compiled";

async function loadEnv() {
  const envPath = ".env.local";
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  await loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error("[seed] DATABASE_URL missing (checked .env.local + env).");
    process.exit(1);
  }

  if (!existsSync(COMPILED_DIR)) {
    console.error(
      `[seed] compiled dir missing: ${COMPILED_DIR} — run pnpm compile:lld-lessons --json-out first`,
    );
    process.exit(1);
  }

  const files = (await readdir(COMPILED_DIR)).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error(`[seed] no JSON artifacts in ${COMPILED_DIR}`);
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sql = `
    INSERT INTO module_content (
      module_id, content_type, slug, name, content, summary, is_published, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, true, now(), now())
    ON CONFLICT (module_id, content_type, slug)
    DO UPDATE SET
      content = EXCLUDED.content,
      summary = EXCLUDED.summary,
      updated_at = now();
  `;

  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const slug = basename(file, ".json");
    try {
      const raw = await readFile(join(COMPILED_DIR, file), "utf8");
      const payload = JSON.parse(raw);
      await client.query(sql, [
        "lld",
        "lesson",
        slug,
        slug,
        JSON.stringify(payload),
        payload.subtitle ?? null,
      ]);
      console.log(`[seed] ✓ ${slug}`);
      ok++;
    } catch (err) {
      console.error(`[seed] ✗ ${slug}: ${err.message}`);
      failed++;
    }
  }

  await client.end();
  console.log(`\n[seed] done: ${ok} ok, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[seed] fatal:", err);
  process.exit(2);
});
