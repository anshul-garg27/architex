/**
 * Content catalog API — list endpoint.
 *
 * GET /api/content?module=lld&type=pattern
 *
 * Public, ISR cached. Returns metadata only (no full JSONB content)
 * to keep list responses lightweight.
 *
 * Query params:
 *   module   (required) — module ID: 'lld', 'algorithms', 'database', etc.
 *   type     (required) — content type: 'pattern', 'problem', 'algorithm', etc.
 *   category (optional) — filter by category
 *   difficulty (optional) — filter by difficulty level
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("module");
    const contentType = searchParams.get("type");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    if (!moduleId || !contentType) {
      return NextResponse.json(
        { error: 'Both "module" and "type" query params are required.' },
        { status: 400 },
      );
    }

    const db = getDb();

    // Build filter conditions
    const conditions = [
      eq(moduleContent.moduleId, moduleId),
      eq(moduleContent.contentType, contentType),
      eq(moduleContent.isPublished, true),
    ];

    if (category) {
      conditions.push(eq(moduleContent.category, category));
    }
    if (difficulty) {
      conditions.push(eq(moduleContent.difficulty, difficulty));
    }

    // Select metadata only — exclude full content JSONB for list views
    const rows = await db
      .select({
        id: moduleContent.id,
        moduleId: moduleContent.moduleId,
        contentType: moduleContent.contentType,
        slug: moduleContent.slug,
        name: moduleContent.name,
        category: moduleContent.category,
        difficulty: moduleContent.difficulty,
        sortOrder: moduleContent.sortOrder,
        summary: moduleContent.summary,
        tags: moduleContent.tags,
      })
      .from(moduleContent)
      .where(and(...conditions))
      .orderBy(asc(moduleContent.sortOrder));

    return NextResponse.json(
      { items: rows, count: rows.length },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[api/content] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
