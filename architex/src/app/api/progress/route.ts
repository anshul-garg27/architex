/**
 * Progress API — read and upsert learning progress.
 *
 * GET  /api/progress?moduleId=lld              — all progress for a module
 * GET  /api/progress?moduleId=lld&conceptId=X  — specific concept
 * POST /api/progress                           — upsert a progress record
 *
 * Auth required for all operations.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, progress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

/** GET /api/progress — list progress records for the authenticated user. */
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
    const conceptId = searchParams.get("conceptId");

    if (!moduleId) {
      return NextResponse.json(
        { error: '"moduleId" query param is required.' },
        { status: 400 },
      );
    }

    const conditions = [
      eq(progress.userId, userId),
      eq(progress.moduleId, moduleId),
    ];
    if (conceptId) {
      conditions.push(eq(progress.conceptId, conceptId));
    }

    const rows = await db
      .select()
      .from(progress)
      .where(and(...conditions));

    return NextResponse.json({ progress: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/progress] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/progress — upsert a progress record. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: {
      moduleId?: string;
      conceptId?: string;
      score?: number;
      completedAt?: string | null;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { moduleId, conceptId, score, completedAt } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: '"moduleId" is required.' },
        { status: 400 },
      );
    }

    if (score !== undefined && (score < 0 || score > 1)) {
      return NextResponse.json(
        { error: '"score" must be between 0.0 and 1.0.' },
        { status: 400 },
      );
    }

    const [upserted] = await db
      .insert(progress)
      .values({
        userId,
        moduleId,
        conceptId: conceptId ?? null,
        score: score ?? 0,
        completedAt: completedAt ? new Date(completedAt) : null,
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.moduleId, progress.conceptId],
        set: {
          score: score ?? 0,
          completedAt: completedAt ? new Date(completedAt) : null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ progress: upserted }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/progress] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
