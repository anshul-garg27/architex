/**
 * DB-008: Single-diagram API
 *
 * GET    /api/diagrams/[id] — Fetch a diagram by ID
 * PUT    /api/diagrams/[id] — Update a diagram
 * DELETE /api/diagrams/[id] — Delete a diagram
 */

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, diagrams } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

/** GET /api/diagrams/[id] — retrieve a single diagram. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [diagram] = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.id, id))
      .limit(1);

    if (!diagram) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    // Public diagrams are readable by anyone; private ones require ownership.
    if (!diagram.isPublic) {
      try {
        const clerkId = await requireAuth();
        const userId = await resolveUserId(clerkId);
        if (userId !== diagram.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ diagram });
  } catch (error) {
    console.error("[api/diagrams/[id]] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PUT /api/diagrams/[id] — update an existing diagram. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const { id } = await params;
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: {
      title?: string;
      data?: unknown;
      description?: string;
      isPublic?: boolean;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.data !== undefined) updates.data = body.data;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(diagrams)
      .set(updates)
      .where(and(eq(diagrams.id, id), eq(diagrams.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Diagram not found or not owned by you." },
        { status: 404 },
      );
    }

    return NextResponse.json({ diagram: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/diagrams/[id]] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/diagrams/[id] — remove a diagram. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const { id } = await params;
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(diagrams)
      .where(and(eq(diagrams.id, id), eq(diagrams.userId, userId)))
      .returning({ id: diagrams.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Diagram not found or not owned by you." },
        { status: 404 },
      );
    }

    return NextResponse.json({ deleted: true, id: deleted.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/diagrams/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
