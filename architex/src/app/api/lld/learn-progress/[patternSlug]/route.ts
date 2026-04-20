/**
 * GET   /api/lld/learn-progress/[patternSlug]
 * PATCH /api/lld/learn-progress/[patternSlug]
 *
 * GET returns the full LearnProgress row for (user, patternSlug) or a
 * synthesized empty row if none exists yet. PATCH merges partial updates
 * (section scroll depth, active section, checkpoint stats) and bumps
 * updatedAt. If all 8 sections reach completedAt != null, the row's
 * completedAt is stamped (FSRS seed).
 */

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, lldLearnProgress } from "@/db";
import type {
  LearnSectionId,
  SectionProgressMap,
  SectionState,
} from "@/db/schema/lld-learn-progress";
import { requireAuth, resolveUserId } from "@/lib/auth";

const ALL_SECTIONS: LearnSectionId[] = [
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
];

function clampUnit(x: number): number {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function isLearnSectionId(v: unknown): v is LearnSectionId {
  return typeof v === "string" && (ALL_SECTIONS as string[]).includes(v);
}

function isCheckpointStats(
  v: unknown,
): v is Record<string, { attempts: number; correct: number }> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v)
  );
}

type PatchBody = {
  sectionProgress?: Partial<SectionProgressMap>;
  activeSectionId?: LearnSectionId | null;
  lastScrollY?: number;
  checkpointStats?: Record<string, { attempts: number; correct: number }>;
  bumpVisit?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patternSlug: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { patternSlug } = await params;
    if (!patternSlug) {
      return NextResponse.json(
        { error: "patternSlug required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldLearnProgress)
      .where(
        and(
          eq(lldLearnProgress.userId, userId),
          eq(lldLearnProgress.patternSlug, patternSlug),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress: rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress/[slug]] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patternSlug: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { patternSlug } = await params;
    if (!patternSlug) {
      return NextResponse.json(
        { error: "patternSlug required" },
        { status: 400 },
      );
    }

    const raw = (await request.json().catch(() => ({}))) as PatchBody;
    const db = getDb();

    // Load current row (if any)
    const rows = await db
      .select()
      .from(lldLearnProgress)
      .where(
        and(
          eq(lldLearnProgress.userId, userId),
          eq(lldLearnProgress.patternSlug, patternSlug),
        ),
      )
      .limit(1);

    const current = rows[0];
    const currentSections: SectionProgressMap =
      (current?.sectionProgress as SectionProgressMap | undefined) ??
      ({} as SectionProgressMap);

    // Merge sectionProgress
    const nextSections: SectionProgressMap = { ...currentSections };
    if (raw.sectionProgress && typeof raw.sectionProgress === "object") {
      for (const [k, v] of Object.entries(raw.sectionProgress)) {
        if (!isLearnSectionId(k) || !v) continue;
        const existing: SectionState = nextSections[k] ?? {
          scrollDepth: 0,
          firstSeenAt: null,
          completedAt: null,
        };
        nextSections[k] = {
          scrollDepth: Math.max(
            existing.scrollDepth,
            clampUnit(typeof v.scrollDepth === "number" ? v.scrollDepth : 0),
          ),
          firstSeenAt:
            existing.firstSeenAt ??
            (typeof v.firstSeenAt === "number" ? v.firstSeenAt : null),
          completedAt:
            existing.completedAt ??
            (typeof v.completedAt === "number" ? v.completedAt : null),
        };
      }
    }

    // Denormalized count
    const completedCount = Object.values(nextSections).filter(
      (s) => s.completedAt !== null,
    ).length;

    // All sections done? Stamp lesson-complete timestamp.
    const allDone =
      completedCount === ALL_SECTIONS.length &&
      ALL_SECTIONS.every((id) => nextSections[id]?.completedAt != null);

    const values: typeof lldLearnProgress.$inferInsert = {
      userId,
      patternSlug,
      sectionProgress: nextSections,
      completedSectionCount: completedCount,
      activeSectionId:
        raw.activeSectionId === null
          ? null
          : isLearnSectionId(raw.activeSectionId)
            ? raw.activeSectionId
            : (current?.activeSectionId ?? null),
      lastScrollY:
        typeof raw.lastScrollY === "number"
          ? Math.max(0, Math.round(raw.lastScrollY))
          : (current?.lastScrollY ?? 0),
      checkpointStats: isCheckpointStats(raw.checkpointStats)
        ? raw.checkpointStats
        : (current?.checkpointStats ?? {}),
      visitCount: raw.bumpVisit
        ? (current?.visitCount ?? 0) + 1
        : (current?.visitCount ?? 0),
      completedAt: allDone ? (current?.completedAt ?? new Date()) : null,
    };

    const [saved] = await db
      .insert(lldLearnProgress)
      .values(values)
      .onConflictDoUpdate({
        target: [lldLearnProgress.userId, lldLearnProgress.patternSlug],
        set: {
          sectionProgress: values.sectionProgress,
          completedSectionCount: values.completedSectionCount,
          activeSectionId: values.activeSectionId,
          lastScrollY: values.lastScrollY,
          checkpointStats: values.checkpointStats,
          visitCount: values.visitCount,
          completedAt: values.completedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return NextResponse.json({ progress: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress/[slug]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
