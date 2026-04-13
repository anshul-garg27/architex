/**
 * Server-side SEO content fetcher.
 *
 * Replaces the 270 KB of static data files in src/lib/seo/ by reading
 * from the module_content table. Only used in Server Components (RSC)
 * and generateStaticParams() — never shipped to the client.
 *
 * When the DB is not available (no DATABASE_URL), falls back to empty arrays
 * so static generation doesn't break during development without a DB.
 */

import { eq, and, asc } from "drizzle-orm";

interface SEOContentItem {
  slug: string;
  name: string;
  category: string | null;
  difficulty: string | null;
  summary: string | null;
  tags: string[] | null;
  content: Record<string, unknown>;
}

/**
 * Fetch all content items for a module+type from the database.
 * Used by Server Components for SEO page generation.
 */
export async function getSEOContent(
  moduleId: string,
  contentType: string,
): Promise<SEOContentItem[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const { getDb, moduleContent } = await import("@/db");
    const db = getDb();

    const rows = await db
      .select({
        slug: moduleContent.slug,
        name: moduleContent.name,
        category: moduleContent.category,
        difficulty: moduleContent.difficulty,
        summary: moduleContent.summary,
        tags: moduleContent.tags,
        content: moduleContent.content,
      })
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, moduleId),
          eq(moduleContent.contentType, contentType),
          eq(moduleContent.isPublished, true),
        ),
      )
      .orderBy(asc(moduleContent.sortOrder));

    return rows as SEOContentItem[];
  } catch (error) {
    console.warn(`[seo] Failed to fetch ${moduleId}/${contentType}:`, error);
    return [];
  }
}

/**
 * Fetch a single content item by slug for detail pages.
 */
export async function getSEOContentBySlug(
  moduleId: string,
  contentType: string,
  slug: string,
): Promise<SEOContentItem | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const { getDb, moduleContent } = await import("@/db");
    const db = getDb();

    const [item] = await db
      .select({
        slug: moduleContent.slug,
        name: moduleContent.name,
        category: moduleContent.category,
        difficulty: moduleContent.difficulty,
        summary: moduleContent.summary,
        tags: moduleContent.tags,
        content: moduleContent.content,
      })
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, moduleId),
          eq(moduleContent.contentType, contentType),
          eq(moduleContent.slug, slug),
          eq(moduleContent.isPublished, true),
        ),
      )
      .limit(1);

    return (item as SEOContentItem) ?? null;
  } catch (error) {
    console.warn(`[seo] Failed to fetch ${moduleId}/${contentType}/${slug}:`, error);
    return null;
  }
}

/**
 * Get all slugs for static param generation (generateStaticParams).
 */
export async function getSEOSlugs(
  moduleId: string,
  contentType: string,
): Promise<string[]> {
  const items = await getSEOContent(moduleId, contentType);
  return items.map((item) => item.slug);
}
