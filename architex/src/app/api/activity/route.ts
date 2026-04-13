/**
 * Activity events API — log and query learning interactions.
 *
 * POST /api/activity  — log an event (auth required)
 * GET  /api/activity?moduleId=X&limit=50  — query recent events (auth required)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { getDb, activityEvents } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

/** POST /api/activity — log an activity event. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: {
      event?: string;
      moduleId?: string;
      conceptId?: string;
      metadata?: Record<string, unknown>;
      occurredAt?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    if (!body.event) {
      return NextResponse.json(
        { error: '"event" field is required.' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(activityEvents)
      .values({
        userId,
        event: body.event,
        moduleId: body.moduleId ?? null,
        conceptId: body.conceptId ?? null,
        metadata: body.metadata ?? null,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      })
      .returning();

    return NextResponse.json({ event: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/activity] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** GET /api/activity — query recent events for the authenticated user. */
export async function GET(request: NextRequest) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("moduleId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const conditions = [eq(activityEvents.userId, userId)];
    if (moduleId) {
      conditions.push(eq(activityEvents.moduleId, moduleId));
    }

    const rows = await db
      .select()
      .from(activityEvents)
      .where(and(...conditions))
      .orderBy(desc(activityEvents.occurredAt))
      .limit(limit);

    return NextResponse.json({ events: rows, count: rows.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/activity] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
