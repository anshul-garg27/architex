/**
 * POST /api/lld/designs/[id]/snapshots  — append a new snapshot
 * GET  /api/lld/designs/[id]/snapshots  — list (newest first, limit 100)
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldDesignSnapshots, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      canvasState?: Record<string, unknown>;
      label?: string;
      note?: string;
      kind?: "auto" | "named";
      nodeCount?: number;
      edgeCount?: number;
    };

    if (!body.canvasState || typeof body.canvasState !== "object") {
      return NextResponse.json(
        { error: "canvasState required" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Verify ownership before writing.
    const [owned] = await db
      .select({ id: lldDesigns.id })
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(lldDesignSnapshots)
      .values({
        designId: id,
        userId,
        kind: body.kind === "named" ? "named" : "auto",
        label: body.label?.slice(0, 200) ?? null,
        note: body.note?.slice(0, 4000) ?? null,
        canvasState: body.canvasState,
        nodeCount: body.nodeCount ?? 0,
        edgeCount: body.edgeCount ?? 0,
      })
      .returning();

    // Touch parent updatedAt so list ordering surfaces recently-edited designs.
    await db
      .update(lldDesigns)
      .set({ updatedAt: new Date() })
      .where(eq(lldDesigns.id, id));

    return NextResponse.json({ snapshot: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/snapshots] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldDesignSnapshots)
      .where(
        and(
          eq(lldDesignSnapshots.designId, id),
          eq(lldDesignSnapshots.userId, userId),
        ),
      )
      .orderBy(desc(lldDesignSnapshots.createdAt))
      .limit(100);

    return NextResponse.json({ snapshots: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/snapshots] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
