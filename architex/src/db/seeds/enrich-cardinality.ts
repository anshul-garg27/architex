/**
 * Enriches diagram templates with cardinality data for relationships.
 *
 * Adds sourceCardinality and targetCardinality to relationships that are
 * missing them. Uses standard UML cardinality conventions:
 *   "1" = exactly one, "*" = many, "0..1" = optional, "0..*" = zero or more
 *
 * Run: DATABASE_URL=... npx tsx src/db/seeds/enrich-cardinality.ts
 */

import { getDb } from "@/db";
import { diagramTemplates } from "@/db/schema/diagram-templates";
import { eq, and } from "drizzle-orm";

// Standard cardinality rules by relationship type
const CARDINALITY_DEFAULTS: Record<string, { source: string; target: string }> = {
  inheritance: { source: "", target: "" },     // no cardinality for inheritance
  realization: { source: "", target: "" },     // no cardinality for realization
  composition: { source: "1", target: "*" },   // parent owns many children
  aggregation: { source: "1", target: "*" },   // container has many items
  association: { source: "1", target: "1" },   // general association
  dependency: { source: "", target: "" },      // no cardinality for dependency
};

// Pattern-specific overrides for known relationships
const OVERRIDES: Record<string, Record<string, { source: string; target: string }>> = {
  observer: {
    "o-subject→o-observer": { source: "1", target: "*" },     // subject has many observers
  },
  composite: {
    "cp-composite→cp-component": { source: "1", target: "0..*" },  // composite has 0..* children
  },
  mediator: {
    "med-concrete→med-colleague": { source: "1", target: "*" },  // mediator coordinates many colleagues
  },
  "chain-of-responsibility": {
    "cor-handler→cor-handler": { source: "1", target: "0..1" }, // handler has optional next
  },
  flyweight: {
    "fw-factory→fw-flyweight": { source: "1", target: "*" },  // factory manages many flyweights
  },
};

async function main() {
  const db = getDb();

  const allTemplates = await db
    .select()
    .from(diagramTemplates)
    .where(eq(diagramTemplates.moduleId, "lld"));

  let updated = 0;

  for (const tmpl of allTemplates) {
    const relationships = tmpl.relationships as Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      label?: string;
      sourceCardinality?: string;
      targetCardinality?: string;
    }>;

    if (!relationships || relationships.length === 0) continue;

    let changed = false;

    for (const rel of relationships) {
      // Skip if already has cardinality
      if (rel.sourceCardinality || rel.targetCardinality) continue;

      // Check for pattern-specific override
      const overrideKey = `${rel.source}→${rel.target}`;
      const override = OVERRIDES[tmpl.parentSlug]?.[overrideKey];

      if (override) {
        rel.sourceCardinality = override.source;
        rel.targetCardinality = override.target;
        changed = true;
      } else {
        // Apply default based on relationship type
        const defaults = CARDINALITY_DEFAULTS[rel.type];
        if (defaults && (defaults.source || defaults.target)) {
          rel.sourceCardinality = defaults.source;
          rel.targetCardinality = defaults.target;
          changed = true;
        }
      }
    }

    if (changed) {
      await db
        .update(diagramTemplates)
        .set({ relationships, updatedAt: new Date() })
        .where(
          and(
            eq(diagramTemplates.moduleId, "lld"),
            eq(diagramTemplates.parentType, tmpl.parentType),
            eq(diagramTemplates.parentSlug, tmpl.parentSlug),
          ),
        );
      updated++;
    }
  }

  console.log(`Enriched ${updated}/${allTemplates.length} diagram templates with cardinality.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
