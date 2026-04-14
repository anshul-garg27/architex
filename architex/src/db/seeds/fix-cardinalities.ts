/**
 * Fix wrong cardinalities in diagram_templates.
 *
 * Issues:
 *   1. Observer pattern: relationship type should be "aggregation" not
 *      "association", and needs sourceCardinality: "1".
 *   2. 14 relationships were given 1:* cardinality by the enrichment script
 *      but should be 1:1 (wraps-one / has-one semantics).
 *
 * Run: DATABASE_URL=... npx tsx src/db/seeds/fix-cardinalities.ts
 */

import { getDb } from "@/db";
import { diagramTemplates } from "@/db/schema/diagram-templates";
import { eq, and } from "drizzle-orm";

const MODULE_ID = "lld";

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  sourceCardinality?: string;
  targetCardinality?: string;
}

// Relationships that should be 1:1 instead of 1:*
// Format: patternSlug → { source→target: true }
const ONE_TO_ONE_FIXES: Record<string, string[][]> = {
  adapter: [["a-adapter", "a-adaptee"]],
  bridge: [["br-abstraction", "br-implementor"]],
  strategy: [["s-context", "s-strategy"]],
  state: [["st-context", "st-state"]],
  decorator: [["d-base-decorator", "d-component"]],
  facade: [
    ["f-facade", "f-sub-a"],
    ["f-facade", "f-sub-b"],
    ["f-facade", "f-sub-c"],
  ],
  "circuit-breaker": [["cb-class", "cb-config"]],
  bulkhead: [["bh-partition", "bh-semaphore"]],
  retry: [["retry-policy", "retry-backoff"]],
  "tool-use": [["tu-agent", "tu-registry"]],
  "react-pattern": [["react-agent", "react-toolregistry"]],
  "multi-agent-orchestration": [["mao-orchestrator", "mao-memory"]],
};

async function main() {
  const db = getDb();
  let updated = 0;

  // ── Fix 1: Observer relationship type + cardinality ──
  {
    const rows = await db
      .select()
      .from(diagramTemplates)
      .where(
        and(
          eq(diagramTemplates.moduleId, MODULE_ID),
          eq(diagramTemplates.parentType, "pattern"),
          eq(diagramTemplates.parentSlug, "observer"),
        ),
      );

    if (rows.length > 0) {
      const tmpl = rows[0];
      const rels = tmpl.relationships as Relationship[];
      let changed = false;

      for (const rel of rels) {
        if (rel.source === "o-subject" && rel.target === "o-observer") {
          rel.type = "aggregation";
          rel.sourceCardinality = "1";
          rel.targetCardinality = "*";
          changed = true;
        }
      }

      if (changed) {
        await db
          .update(diagramTemplates)
          .set({ relationships: rels, updatedAt: new Date() })
          .where(
            and(
              eq(diagramTemplates.moduleId, MODULE_ID),
              eq(diagramTemplates.parentType, "pattern"),
              eq(diagramTemplates.parentSlug, "observer"),
            ),
          );
        console.log("  ✓ observer — fixed relationship type + cardinality");
        updated++;
      }
    } else {
      console.log("  ⚠ observer diagram template not found");
    }
  }

  // ── Fix 2: Change 1:* to 1:1 for wraps-one/has-one relationships ──
  for (const [slug, pairs] of Object.entries(ONE_TO_ONE_FIXES)) {
    const rows = await db
      .select()
      .from(diagramTemplates)
      .where(
        and(
          eq(diagramTemplates.moduleId, MODULE_ID),
          eq(diagramTemplates.parentType, "pattern"),
          eq(diagramTemplates.parentSlug, slug),
        ),
      );

    if (rows.length === 0) {
      console.log(`  ⚠ ${slug} diagram template not found`);
      continue;
    }

    const tmpl = rows[0];
    const rels = tmpl.relationships as Relationship[];
    let changed = false;

    for (const [source, target] of pairs) {
      const rel = rels.find((r) => r.source === source && r.target === target);
      if (!rel) {
        console.log(`  ⚠ ${slug}: relationship ${source}→${target} not found`);
        continue;
      }

      if (rel.targetCardinality === "*") {
        rel.sourceCardinality = "1";
        rel.targetCardinality = "1";
        changed = true;
      }
    }

    if (changed) {
      await db
        .update(diagramTemplates)
        .set({ relationships: rels, updatedAt: new Date() })
        .where(
          and(
            eq(diagramTemplates.moduleId, MODULE_ID),
            eq(diagramTemplates.parentType, "pattern"),
            eq(diagramTemplates.parentSlug, slug),
          ),
        );
      console.log(
        `  ✓ ${slug} — fixed ${pairs.length} relationship(s) to 1:1`,
      );
      updated++;
    } else {
      console.log(`  ✓ ${slug} — cardinalities already correct`);
    }
  }

  console.log(`\nUpdated ${updated} diagram templates.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("fix-cardinalities failed:", e);
  process.exit(1);
});
