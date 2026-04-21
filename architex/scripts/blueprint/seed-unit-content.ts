/**
 * scripts/blueprint/seed-unit-content.ts
 *
 * Upserts compiled unit recipes into blueprint_units.recipe_json and
 * stamps published_at so the unit is visible in the journey map.
 *
 * Reads content/blueprint/compiled/*.json; matches by slug.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const COMPILED_DIR = path.resolve("content/blueprint/compiled");

async function main() {
  const conn =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  if (!conn) {
    console.error(
      "[blueprint-seed-content] DATABASE_URL or DATABASE_URL_UNPOOLED must be set",
    );
    process.exit(1);
  }

  const files = (await fs.readdir(COMPILED_DIR)).filter((f) =>
    f.endsWith(".json"),
  );
  if (files.length === 0) {
    console.log(
      "[blueprint-seed-content] no compiled units found in",
      COMPILED_DIR,
    );
    return;
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    for (const file of files) {
      const slug = file.replace(/\.json$/, "");
      const abs = path.join(COMPILED_DIR, file);
      const payload = JSON.parse(await fs.readFile(abs, "utf8")) as {
        version: number;
        sections: unknown[];
      };

      const res = await client.query<{ id: string }>(
        `UPDATE blueprint_units
           SET recipe_json = $1::jsonb,
               published_at = COALESCE(published_at, now()),
               updated_at = now()
           WHERE slug = $2
           RETURNING id`,
        [JSON.stringify(payload), slug],
      );

      if (res.rowCount === 0) {
        console.warn(
          `[blueprint-seed-content] no row for slug "${slug}" — did you run pnpm blueprint:seed-units first?`,
        );
      } else {
        console.log(
          `[blueprint-seed-content] upserted recipe for "${slug}" (${payload.sections.length} sections)`,
        );
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[blueprint-seed-content] failed:", err);
  process.exit(1);
});
