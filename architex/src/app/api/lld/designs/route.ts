/**
 * POST /api/lld/designs           — create a new design
 * GET  /api/lld/designs           — list the user's designs (?status=active|archived)
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      templateId?: string;
    };

    if (!body.name || typeof body.name !== "string" || body.name.length > 160) {
      return NextResponse.json(
        { error: "name is required (<=160 chars)" },
        { status: 400 },
      );
    }

    const slugBase = slugify(body.name) || "untitled";
    // Append 6 random chars to avoid collisions on rapid re-creation.
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;

    const db = getDb();
    const [created] = await db
      .insert(lldDesigns)
      .values({
        userId,
        name: body.name,
        slug,
        description: body.description?.slice(0, 2000) ?? null,
        templateId: body.templateId ?? null,
      })
      .returning();

    return NextResponse.json({ design: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "active";

    const db = getDb();
    const rows = await db
      .select()
      .from(lldDesigns)
      .where(
        and(
          eq(lldDesigns.userId, userId),
          eq(lldDesigns.status, status === "archived" ? "archived" : "active"),
        ),
      )
      .orderBy(desc(lldDesigns.lastOpenedAt))
      .limit(100);

    return NextResponse.json({ designs: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
