/**
 * POST /api/lld/concept-reads
 *
 * Append-only log. Body: { conceptId, patternSlug, sectionId }.
 *
 * Rate-limiting: client-side recommended (30s per concept). Server-side
 * we simply insert — the index on (user, concept, readAt) keeps lookup
 * cheap and duplicates are benign (aggregate queries typically COUNT or
 * take MAX(readAt)).
 */

import { NextResponse } from "next/server";
import { getDb, lldConceptReads } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      conceptId?: string;
      patternSlug?: string;
      sectionId?: string;
    };

    const { conceptId, patternSlug, sectionId } = body;
    if (
      !conceptId ||
      typeof conceptId !== "string" ||
      !patternSlug ||
      typeof patternSlug !== "string" ||
      !sectionId ||
      typeof sectionId !== "string"
    ) {
      return NextResponse.json(
        {
          error: "conceptId, patternSlug, sectionId all required strings",
        },
        { status: 400 },
      );
    }

    const db = getDb();
    const [created] = await db
      .insert(lldConceptReads)
      .values({ userId, conceptId, patternSlug, sectionId })
      .returning();
    return NextResponse.json({ read: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/concept-reads] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
