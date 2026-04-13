/**
 * Database module seed: 61 daily challenges + 3 sample ER diagrams.
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "database";

export async function seed(db: Database) {
  const { DAILY_CHALLENGES } = await import("@/lib/database/daily-challenges");
  const { SAMPLE_ER_DIAGRAMS } = await import("@/lib/database/sample-er-diagrams");

  const rows = [
    ...mapToRows(MODULE_ID, "daily-challenge", DAILY_CHALLENGES, {
      slugField: "id",
      nameField: "question",
      categoryField: "category",
      summaryField: "explanation",
      tagsFn: (item) => ["quiz", String(item.category ?? ""), String(item.difficulty ?? "")].filter(Boolean),
    }),
    ...mapToRows(MODULE_ID, "sample-er-diagram", SAMPLE_ER_DIAGRAMS, {
      slugField: "name",
      nameField: "name",
      summaryField: "description",
    }),
  ];

  console.log(`    Upserting ${rows.length} database content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
