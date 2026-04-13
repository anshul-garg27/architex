/**
 * Data Structures module seed script.
 *
 * Extracts 43 catalog entries from catalog.ts into module_content.
 * Engine files (46 pure computation implementations) stay client-side.
 *
 * Content type: data-structure (43 entries)
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "data-structures";

export async function seed(db: Database) {
  // Dynamic import to get the catalog
  const catalogModule = await import("@/lib/data-structures/catalog");
  const catalog = catalogModule.DS_CATALOG ?? [];

  if (!Array.isArray(catalog) || catalog.length === 0) {
    console.warn("    DS_CATALOG not found or empty, skipping");
    return;
  }

  const rows: NewModuleContent[] = [];

  for (let i = 0; i < catalog.length; i++) {
    const ds = catalog[i] as unknown as Record<string, unknown>;
    const operations = ds.operations as string[] | undefined;
    const complexity = ds.complexity as Record<string, string> | undefined;

    rows.push({
      moduleId: MODULE_ID,
      contentType: "data-structure",
      slug: (ds.id as string) ?? `ds-${i}`,
      name: (ds.name as string) ?? `Data Structure ${i}`,
      category: (ds.category as string) ?? null,
      difficulty: (ds.difficulty as string) ?? null,
      sortOrder: (ds.sortOrder as number) ?? i,
      summary: ((ds.description as string) ?? "").slice(0, 300),
      tags: [
        (ds.category as string) ?? "",
        ...(operations ?? []),
        ...((ds.keyTakeaways as string[]) ?? []).slice(0, 2),
      ].filter(Boolean),
      content: {
        ...stripForDb(ds),
        // Ensure complexity info is prominently stored
        operations: operations ?? [],
        complexity: complexity ?? {},
      },
    });
  }

  console.log(`    Upserting ${rows.length} data structure content rows...`);

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
