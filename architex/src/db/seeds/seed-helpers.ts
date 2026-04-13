/**
 * Shared helpers for seed scripts.
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import type { NewModuleContent } from "@/db/schema/module-content";

export function stripForDb(obj: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Batch upsert rows into module_content with conflict handling.
 */
export async function batchUpsert(db: Database, rows: NewModuleContent[]) {
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
}

/**
 * Convert a data array into module_content rows.
 */
export function mapToRows(
  moduleId: string,
  contentType: string,
  items: unknown[],
  opts?: {
    slugField?: string;
    nameField?: string;
    categoryField?: string;
    difficultyField?: string;
    summaryField?: string;
    tagsFn?: (item: Record<string, unknown>) => string[];
  },
): NewModuleContent[] {
  const {
    slugField = "id",
    nameField = "name",
    categoryField = "category",
    difficultyField = "difficulty",
    summaryField = "description",
    tagsFn,
  } = opts ?? {};

  return items.map((item, i) => {
    const obj = item as unknown as Record<string, unknown>;
    return {
      moduleId,
      contentType,
      slug: String(obj[slugField] ?? `${contentType}-${i}`),
      name: String(obj[nameField] ?? `${contentType} ${i}`),
      category: obj[categoryField] ? String(obj[categoryField]) : null,
      difficulty: obj[difficultyField] ? String(obj[difficultyField]) : null,
      sortOrder: i,
      summary: obj[summaryField]
        ? String(obj[summaryField]).slice(0, 300)
        : null,
      tags: tagsFn ? tagsFn(obj) : [contentType],
      content: stripForDb(obj),
    };
  });
}
