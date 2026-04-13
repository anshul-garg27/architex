/**
 * Content detail API — single item endpoint.
 *
 * GET /api/content/:slug?module=lld&type=pattern
 *
 * Public, ISR cached. Returns the full JSONB content payload
 * for a single content item.
 *
 * Path params:
 *   slug (required) — URL-safe identifier
 *
 * Query params:
 *   module (required) — module ID
 *   type   (required) — content type
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("module");
    const contentType = searchParams.get("type");

    if (!moduleId || !contentType) {
      return NextResponse.json(
        { error: 'Both "module" and "type" query params are required.' },
        { status: 400 },
      );
    }

    const db = getDb();

    const [item] = await db
      .select()
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

    if (!item) {
      return NextResponse.json(
        { error: `Content not found: ${moduleId}/${contentType}/${slug}` },
        { status: 404 },
      );
    }

    return NextResponse.json({ item }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[api/content/[slug]] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
