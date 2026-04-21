/**
 * GET    /api/lld/designs/[id]  — fetch a single design
 * PATCH  /api/lld/designs/[id]  — rename / archive / pin / describe
 * DELETE /api/lld/designs/[id]  — cascade delete (snapshots + annotations)
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

async function authScope(
  params: Promise<{ id: string }>,
): Promise<{ error: NextResponse } | { id: string; userId: string }> {
  const { id } = await params;
  const clerkId = await requireAuth();
  const userId = await resolveUserId(clerkId);
  if (!userId) {
    return {
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }
  return { id, userId };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const db = getDb();
    const [row] = await db
      .select()
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Bump lastOpenedAt for "recent" ordering.
    await db
      .update(lldDesigns)
      .set({ lastOpenedAt: new Date() })
      .where(eq(lldDesigns.id, id));

    return NextResponse.json({ design: row });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      status?: "active" | "archived" | "draft";
      isPinned?: boolean;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.name === "string" && body.name.length > 0) {
      updates.name = body.name.slice(0, 160);
    }
    if (typeof body.description === "string") {
      updates.description = body.description.slice(0, 2000);
    }
    if (body.status && ["active", "archived", "draft"].includes(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.isPinned === "boolean") {
      updates.isPinned = body.isPinned;
    }

    const db = getDb();
    const [updated] = await db
      .update(lldDesigns)
      .set(updates)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ design: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const db = getDb();
    const deleted = await db
      .delete(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .returning({ id: lldDesigns.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
