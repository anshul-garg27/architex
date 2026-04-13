/**
 * DB-008: Simulation runs API
 *
 * GET  /api/simulations         — List simulation runs for the authenticated user
 * POST /api/simulations         — Save a new simulation run
 */

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb, simulationRuns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

/** GET /api/simulations — list simulation runs for the current user. */
export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const diagramId = url.searchParams.get("diagramId");

    const { and } = await import("drizzle-orm");
    const where = diagramId
      ? and(eq(simulationRuns.userId, userId), eq(simulationRuns.diagramId, diagramId))
      : eq(simulationRuns.userId, userId);

    const rows = await db
      .select()
      .from(simulationRuns)
      .where(where)
      .orderBy(desc(simulationRuns.createdAt))
      .limit(50);

    return NextResponse.json({ simulations: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/simulations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/simulations — save a new simulation run. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: {
      diagramId?: string;
      config?: unknown;
      results?: unknown;
      tickCount?: number;
      duration?: number;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { diagramId, config, results, tickCount, duration } = body;
    if (!diagramId) {
      return NextResponse.json(
        { error: 'Request must include a "diagramId" field.' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(simulationRuns)
      .values({
        diagramId,
        userId,
        config: config ?? {},
        results: results ?? null,
        tickCount: tickCount ?? null,
        duration: duration ?? null,
      })
      .returning();

    return NextResponse.json({ simulation: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/simulations] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
