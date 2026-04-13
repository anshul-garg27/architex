/**
 * Search API — full-text search across module content.
 *
 * GET /api/search?q=builder&module=lld
 *
 * Public, ISR cached. Uses ILIKE for pattern matching across
 * name, summary, category, and tags columns. When tsvector migration
 * is applied, this can be upgraded to ts_rank + ts_headline.
 *
 * Query params:
 *   q      (required) — search query (min 2 chars)
 *   module (optional) — filter by module ID
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql, eq, and } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";

const MAX_RESULTS = 20;

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=1800",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim();
    const moduleId = searchParams.get("module");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query param "q" is required (min 2 characters).' },
        { status: 400 },
      );
    }

    const db = getDb();
    const pattern = `%${query}%`;

    const conditions = [eq(moduleContent.isPublished, true)];
    if (moduleId) {
      conditions.push(eq(moduleContent.moduleId, moduleId));
    }

    // Search across name, summary, category, and tags using ILIKE.
    // Rank: name match = 4, category = 3, tags = 2, summary = 1.
    const rows = await db
      .select({
        id: moduleContent.id,
        moduleId: moduleContent.moduleId,
        contentType: moduleContent.contentType,
        slug: moduleContent.slug,
        name: moduleContent.name,
        category: moduleContent.category,
        summary: moduleContent.summary,
        tags: moduleContent.tags,
        difficulty: moduleContent.difficulty,
        rank: sql<number>`(
          CASE WHEN ${moduleContent.name} ILIKE ${pattern} THEN 4 ELSE 0 END +
          CASE WHEN ${moduleContent.category} ILIKE ${pattern} THEN 3 ELSE 0 END +
          CASE WHEN array_to_string(${moduleContent.tags}, ' ') ILIKE ${pattern} THEN 2 ELSE 0 END +
          CASE WHEN ${moduleContent.summary} ILIKE ${pattern} THEN 1 ELSE 0 END
        )`,
      })
      .from(moduleContent)
      .where(
        and(
          ...conditions,
          sql`(
            ${moduleContent.name} ILIKE ${pattern} OR
            ${moduleContent.summary} ILIKE ${pattern} OR
            ${moduleContent.category} ILIKE ${pattern} OR
            array_to_string(${moduleContent.tags}, ' ') ILIKE ${pattern}
          )`,
        ),
      )
      .orderBy(sql`(
        CASE WHEN ${moduleContent.name} ILIKE ${pattern} THEN 4 ELSE 0 END +
        CASE WHEN ${moduleContent.category} ILIKE ${pattern} THEN 3 ELSE 0 END +
        CASE WHEN array_to_string(${moduleContent.tags}, ' ') ILIKE ${pattern} THEN 2 ELSE 0 END +
        CASE WHEN ${moduleContent.summary} ILIKE ${pattern} THEN 1 ELSE 0 END
      ) DESC`)
      .limit(MAX_RESULTS);

    const results = rows.map((row) => ({
      ...row,
      snippet: generateSnippet(row.summary, query),
    }));

    return NextResponse.json(
      { items: results, count: results.length, query },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[api/search] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Extract a ~120-char snippet around the first match in text. */
function generateSnippet(text: string | null, query: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 120) + (text.length > 120 ? "..." : "");
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}
