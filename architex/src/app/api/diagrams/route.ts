/**
 * DB-008: Diagram CRUD API
 *
 * GET  /api/diagrams  — List authenticated user's diagrams
 * POST /api/diagrams  — Create a new diagram
 */

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb, diagrams } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

/** GET /api/diagrams — list all diagrams for the current user. */
export async function GET() {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.userId, userId))
      .orderBy(desc(diagrams.updatedAt));

    return NextResponse.json({ diagrams: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/diagrams] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/diagrams — persist a new diagram. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: { title?: string; data?: unknown; templateId?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { title, data, templateId } = body;
    if (!title) {
      return NextResponse.json(
        { error: 'Request must include a "title" field.' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(diagrams)
      .values({
        userId,
        title,
        data: data ?? {},
        templateId: templateId ?? null,
      })
      .returning();

    return NextResponse.json({ diagram: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/diagrams] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
