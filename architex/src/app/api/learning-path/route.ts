/**
 * Learning Path API — returns topologically sorted learning path.
 *
 * GET /api/learning-path?module=lld
 * GET /api/learning-path?module=lld&category=behavioral
 *
 * Public. If authenticated, annotates each pattern with mastery status
 * based on the progress table (mastery threshold: score >= 0.7).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, gte } from "drizzle-orm";
import { getDb, progress } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { resolveUserId } from "@/lib/auth";
import { buildLearningPath } from "@/lib/lld/prerequisites";

const MASTERY_THRESHOLD = 0.7;

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("module") ?? "lld";
    const category = searchParams.get("category") ?? undefined;

    const path = buildLearningPath(category);

    // Try to annotate with user progress (optional — no auth required)
    let masteredIds: Set<string> | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const db = getDb();
        const userId = await resolveUserId(clerkId);
        if (userId) {
          const rows = await db
            .select({
              conceptId: progress.conceptId,
              score: progress.score,
            })
            .from(progress)
            .where(
              and(
                eq(progress.userId, userId),
                eq(progress.moduleId, moduleId),
                gte(progress.score, MASTERY_THRESHOLD),
              ),
            );
          masteredIds = new Set(
            rows
              .map((r) => r.conceptId)
              .filter((c): c is string => c !== null),
          );
        }
      }
    } catch {
      // Not authenticated — continue without progress annotation
    }

    const annotatedPath = path.map((node) => ({
      ...node,
      isMastered: masteredIds?.has(node.id) ?? false,
      isUnlocked:
        !masteredIds ||
        node.prerequisites.every((p) => masteredIds!.has(p)),
      unmetPrerequisites: masteredIds
        ? node.prerequisites.filter((p) => !masteredIds!.has(p))
        : [],
    }));

    // Use private caching when response includes user-specific data
    const headers = masteredIds
      ? { "Cache-Control": "private, max-age=60" }
      : CACHE_HEADERS;

    return NextResponse.json(
      { path: annotatedPath, count: annotatedPath.length, module: moduleId },
      { headers },
    );
  } catch (error) {
    console.error("[api/learning-path] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
