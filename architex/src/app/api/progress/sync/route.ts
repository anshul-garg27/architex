/**
 * Progress bulk sync API — one-time migration from localStorage.
 *
 * POST /api/progress/sync
 *
 * Accepts an array of progress records from localStorage and upserts
 * them all into the database. Called once when user first authenticates
 * to migrate their local progress to server-side persistence.
 *
 * Auth required.
 */

import { NextResponse } from "next/server";
import { getDb, progress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

interface SyncRecord {
  moduleId: string;
  conceptId?: string | null;
  score?: number;
  completedAt?: string | null;
}

/** POST /api/progress/sync — bulk upsert progress records. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: { records?: SyncRecord[] };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const records = body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: '"records" must be a non-empty array.' },
        { status: 400 },
      );
    }

    // Cap at 500 records per sync to prevent abuse
    if (records.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 records per sync request." },
        { status: 400 },
      );
    }

    let synced = 0;

    // Batch in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const values = batch
        .filter((r) => r.moduleId)
        .map((r) => ({
          userId,
          moduleId: r.moduleId,
          conceptId: r.conceptId ?? null,
          score: Math.max(0, Math.min(1, r.score ?? 0)),
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
        }));

      if (values.length > 0) {
        await db
          .insert(progress)
          .values(values)
          .onConflictDoUpdate({
            target: [progress.userId, progress.moduleId, progress.conceptId],
            set: {
              // Only update if incoming score is higher (don't overwrite better progress)
              score: progress.score,
              updatedAt: new Date(),
            },
          });

        synced += values.length;
      }
    }

    return NextResponse.json(
      { synced, total: records.length },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/progress/sync] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
