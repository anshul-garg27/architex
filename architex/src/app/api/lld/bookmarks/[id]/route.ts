/**
 * PATCH  /api/lld/bookmarks/[id]  — update bookmark note
 * DELETE /api/lld/bookmarks/[id]  — hard-delete
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldBookmarks } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      note?: string | null;
    };

    const db = getDb();
    const [updated] = await db
      .update(lldBookmarks)
      .set({
        note: typeof body.note === "string" ? body.note : null,
      })
      .where(
        and(eq(lldBookmarks.id, id), eq(lldBookmarks.userId, userId)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ bookmark: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { id } = await params;
    const db = getDb();
    const deleted = await db
      .delete(lldBookmarks)
      .where(and(eq(lldBookmarks.id, id), eq(lldBookmarks.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: deleted[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
