/**
 * Diagram template seed — generates Mermaid DSL from existing patterns.
 *
 * For each design pattern and LLD problem, generates:
 *   1. Mermaid classDiagram source (AI-editable, human-readable)
 *   2. Parsed UML JSON (classes[], relationships[] for canvas rendering)
 *
 * Uses the existing generateMermaid() function from codegen.
 */

import type { Database } from "@/db";
import { diagramTemplates } from "@/db/schema/diagram-templates";
import type { NewDiagramTemplate } from "@/db/schema/diagram-templates";

const MODULE_ID = "lld";

export async function seed(db: Database) {
  const { DESIGN_PATTERNS } = await import("@/lib/lld/patterns");
  const { LLD_PROBLEMS } = await import("@/lib/lld/problems");
  const { generateMermaid } = await import(
    "@/lib/lld/codegen/diagram-to-mermaid"
  );

  const rows: NewDiagramTemplate[] = [];

  // ── Design Pattern Diagrams (36) ─────────────────────────
  for (const pattern of DESIGN_PATTERNS) {
    const classes = pattern.classes ?? [];
    const relationships = pattern.relationships ?? [];

    let mermaidCode = "";
    try {
      mermaidCode = generateMermaid(classes, relationships);
    } catch {
      mermaidCode = `classDiagram\n  %% Failed to generate for ${pattern.name}`;
    }

    rows.push({
      moduleId: MODULE_ID,
      parentType: "pattern",
      parentSlug: pattern.id,
      mermaidCode,
      classes: JSON.parse(JSON.stringify(classes)),
      relationships: JSON.parse(JSON.stringify(relationships)),
      isCurated: false,
      layoutAlgo: "manual", // existing patterns have hand-positioned coordinates
    });
  }

  // ── LLD Problem Starter Diagrams (33) ────────────────────
  for (const problem of LLD_PROBLEMS) {
    const classes = problem.starterClasses ?? [];
    const relationships = problem.starterRelationships ?? [];

    if (classes.length === 0) continue; // skip problems without starter UML

    let mermaidCode = "";
    try {
      mermaidCode = generateMermaid(classes, relationships);
    } catch {
      mermaidCode = `classDiagram\n  %% Failed to generate for ${problem.name}`;
    }

    rows.push({
      moduleId: MODULE_ID,
      parentType: "problem",
      parentSlug: problem.slug ?? problem.id,
      mermaidCode,
      classes: JSON.parse(JSON.stringify(classes)),
      relationships: JSON.parse(JSON.stringify(relationships)),
      isCurated: false,
      layoutAlgo: "manual",
    });
  }

  // ── Upsert all ────────────────────────────────────────────
  console.log(`    Upserting ${rows.length} diagram templates...`);

  const BATCH_SIZE = 20;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(diagramTemplates)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          diagramTemplates.moduleId,
          diagramTemplates.parentType,
          diagramTemplates.parentSlug,
        ],
        set: {
          mermaidCode: diagramTemplates.mermaidCode,
          classes: diagramTemplates.classes,
          relationships: diagramTemplates.relationships,
          layoutAlgo: diagramTemplates.layoutAlgo,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`    ✓ ${rows.length} diagram templates upserted`);
}
