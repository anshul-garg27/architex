/**
 * PATCH /api/user-preferences/lld — partial update of the lld subtree
 * within userPreferences.preferences.
 */

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, userPreferences } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_MODES = new Set(["learn", "build", "drill", "review"]);

interface LLDPatch {
  mode?: string;
  welcomeBannerDismissed?: boolean;
  scratchCanvas?: Record<string, unknown>;
}

function validatePatch(body: unknown): LLDPatch | { error: string } {
  if (!body || typeof body !== "object") return { error: "Body required" };
  const patch = body as LLDPatch;
  if (patch.mode !== undefined && !VALID_MODES.has(patch.mode)) {
    return { error: `Invalid mode: ${patch.mode}` };
  }
  if (
    patch.welcomeBannerDismissed !== undefined &&
    typeof patch.welcomeBannerDismissed !== "boolean"
  ) {
    return { error: "welcomeBannerDismissed must be boolean" };
  }
  return patch;
}

export async function PATCH(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validated = validatePatch(body);
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const db = getDb();

    // Upsert: if user has no preferences row yet, create one.
    await db
      .insert(userPreferences)
      .values({
        userId,
        preferences: { lld: validated },
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          preferences: sql`
            jsonb_set(
              COALESCE(${userPreferences.preferences}, '{}'::jsonb),
              '{lld}',
              COALESCE(${userPreferences.preferences}->'lld', '{}'::jsonb) || ${JSON.stringify(
                validated,
              )}::jsonb
            )
          `,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/user-preferences/lld] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
