/**
 * GET /api/lld/learn-progress    — list all learn-progress rows for user
 *
 * Returns a compact shape for the sidebar:
 *   { rows: [{ patternSlug, completedSectionCount, completedAt, visitCount }, ...] }
 */

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, lldLearnProgress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select({
        patternSlug: lldLearnProgress.patternSlug,
        completedSectionCount: lldLearnProgress.completedSectionCount,
        completedAt: lldLearnProgress.completedAt,
        visitCount: lldLearnProgress.visitCount,
        updatedAt: lldLearnProgress.updatedAt,
      })
      .from(lldLearnProgress)
      .where(eq(lldLearnProgress.userId, userId))
      .orderBy(desc(lldLearnProgress.updatedAt))
      .limit(500);

    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
