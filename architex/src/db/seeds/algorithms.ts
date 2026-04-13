/**
 * Algorithms module seed script.
 *
 * Extracts AlgorithmConfig metadata from 13 category arrays into module_content.
 * Only metadata moves to DB — engine functions (pure computation) stay client-side.
 *
 * Content type: algorithm (83+ entries)
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "algorithms";

export async function seed(db: Database) {
  const algoModule = await import("@/lib/algorithms");

  // Collect all algorithm config arrays
  const allArrays: { name: string; items: unknown[] }[] = [
    { name: "sorting", items: algoModule.SORTING_ALGORITHMS },
    { name: "graph", items: algoModule.GRAPH_ALGORITHMS },
    { name: "tree", items: algoModule.TREE_ALGORITHMS },
    { name: "dp", items: algoModule.DP_ALGORITHMS },
    { name: "string", items: algoModule.STRING_ALGORITHMS },
    { name: "backtracking", items: algoModule.BACKTRACKING_ALGORITHMS },
    { name: "geometry", items: algoModule.GEOMETRY_ALGORITHMS },
    { name: "search", items: algoModule.SEARCH_ALGORITHMS },
    { name: "greedy", items: algoModule.GREEDY_ALGORITHMS },
    { name: "pattern", items: algoModule.PATTERN_ALGORITHMS },
    { name: "design", items: algoModule.DESIGN_ALGORITHMS },
    { name: "probabilistic", items: algoModule.PROBABILISTIC_ALGORITHMS },
    { name: "vector-search", items: algoModule.VECTOR_SEARCH_ALGORITHMS },
  ];

  const rows: NewModuleContent[] = [];
  let globalOrder = 0;

  for (const { name: category, items } of allArrays) {
    if (!items || !Array.isArray(items)) continue;

    for (const item of items) {
      const a = item as Record<string, unknown>;
      rows.push({
        moduleId: MODULE_ID,
        contentType: "algorithm",
        slug: (a.id as string) ?? `algo-${globalOrder}`,
        name: (a.name as string) ?? `Algorithm ${globalOrder}`,
        category,
        difficulty: (a.difficulty as string) ?? null,
        sortOrder: globalOrder++,
        summary: ((a.description as string) ?? "").slice(0, 300),
        tags: [
          category,
          ...(a.stable ? ["stable"] : []),
          ...(a.inPlace ? ["in-place"] : []),
          ...((a.prerequisites as string[]) ?? []),
        ].filter(Boolean),
        content: stripForDb(a),
      });
    }
  }

  console.log(`    Upserting ${rows.length} algorithm content rows...`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(moduleContent)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          moduleContent.moduleId,
          moduleContent.contentType,
          moduleContent.slug,
        ],
        set: {
          name: moduleContent.name,
          category: moduleContent.category,
          difficulty: moduleContent.difficulty,
          sortOrder: moduleContent.sortOrder,
          content: moduleContent.content,
          summary: moduleContent.summary,
          tags: moduleContent.tags,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`    ✓ ${rows.length} rows upserted`);
}

function stripForDb(obj: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}
