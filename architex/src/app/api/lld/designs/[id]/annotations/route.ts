/**
 * GET  /api/lld/designs/[id]/annotations  — list
 * POST /api/lld/designs/[id]/annotations  — create one or bulk upsert
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDesignAnnotations, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_KINDS = new Set(["sticky-note", "arrow", "circle", "text"]);

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
      .from(lldDesignAnnotations)
      .where(
        and(
          eq(lldDesignAnnotations.designId, id),
          eq(lldDesignAnnotations.userId, userId),
        ),
      )
      .limit(500);
    return NextResponse.json({ annotations: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/annotations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
      kind?: string;
      nodeId?: string | null;
      x?: number;
      y?: number;
      body?: string;
      color?: string;
      meta?: Record<string, unknown>;
    };

    const kind = VALID_KINDS.has(body.kind ?? "") ? body.kind! : "sticky-note";

    // Verify ownership.
    const db = getDb();
    const [owned] = await db
      .select({ id: lldDesigns.id })
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(lldDesignAnnotations)
      .values({
        designId: id,
        userId,
        kind,
        nodeId: body.nodeId ?? null,
        x: typeof body.x === "number" ? body.x : 0,
        y: typeof body.y === "number" ? body.y : 0,
        body: (body.body ?? "").slice(0, 2000),
        color: (body.color ?? "amber").slice(0, 20),
        meta: body.meta ?? {},
      })
      .returning();

    return NextResponse.json({ annotation: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/annotations] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
