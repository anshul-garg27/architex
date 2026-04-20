/**
 * GET  /api/lld/bookmarks?patternSlug=<slug>   — list bookmarks (optionally scoped)
 * POST /api/lld/bookmarks                       — create or toggle-off a bookmark
 *
 * POST body:
 *   { patternSlug, sectionId, anchorId, anchorLabel, note? }
 *
 * If a row already exists for the (user, patternSlug, anchorId) triple,
 * the POST deletes it (toggle-off) and returns { toggled: "off" }.
 * Otherwise it inserts and returns { toggled: "on", bookmark }.
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldBookmarks } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const slug = url.searchParams.get("patternSlug");
    const db = getDb();

    const where =
      slug && slug.length > 0
        ? and(
            eq(lldBookmarks.userId, userId),
            eq(lldBookmarks.patternSlug, slug),
          )
        : eq(lldBookmarks.userId, userId);

    const rows = await db
      .select()
      .from(lldBookmarks)
      .where(where)
      .orderBy(desc(lldBookmarks.createdAt))
      .limit(500);

    return NextResponse.json({ bookmarks: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      patternSlug?: string;
      sectionId?: string;
      anchorId?: string;
      anchorLabel?: string;
      note?: string | null;
    };

    const { patternSlug, sectionId, anchorId, anchorLabel, note } = body;
    if (
      !patternSlug ||
      !sectionId ||
      !anchorId ||
      !anchorLabel ||
      typeof patternSlug !== "string" ||
      typeof sectionId !== "string" ||
      typeof anchorId !== "string" ||
      typeof anchorLabel !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "patternSlug, sectionId, anchorId, and anchorLabel are all required strings",
        },
        { status: 400 },
      );
    }

    const db = getDb();
    // Toggle: find existing row
    const existing = await db
      .select()
      .from(lldBookmarks)
      .where(
        and(
          eq(lldBookmarks.userId, userId),
          eq(lldBookmarks.patternSlug, patternSlug),
          eq(lldBookmarks.anchorId, anchorId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db.delete(lldBookmarks).where(eq(lldBookmarks.id, existing[0].id));
      return NextResponse.json({
        toggled: "off",
        bookmark: existing[0],
      });
    }

    const [created] = await db
      .insert(lldBookmarks)
      .values({
        userId,
        patternSlug,
        sectionId,
        anchorId,
        anchorLabel,
        note: typeof note === "string" ? note : null,
      })
      .returning();

    return NextResponse.json({ toggled: "on", bookmark: created }, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
