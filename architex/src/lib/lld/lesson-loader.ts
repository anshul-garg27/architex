/**
 * Lesson loader — fetches a compiled LessonPayload from the
 * module_content table and returns a typed view for the Learn mode
 * renderer. Falls back to reading the raw MDX from disk at build time
 * if the DB row is missing (SSG + dev).
 *
 * Design notes:
 * - DB-first: production reads use module_content (JSONB).
 * - No-DB fallback: dev environments without a DB can compile the MDX
 *   on-the-fly so Storybook / Playwright smoke tests work without
 *   requiring Postgres.
 */

import { and, eq } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";
import type { LessonPayload } from "./lesson-types";
import { LESSON_SECTION_ORDER } from "./lesson-types";

export interface LessonLoadSuccess {
  ok: true;
  payload: LessonPayload;
}

export interface LessonLoadFailure {
  ok: false;
  reason: "missing" | "corrupt" | "db-error";
  message: string;
}

export type LessonLoadResult = LessonLoadSuccess | LessonLoadFailure;

/**
 * Validate a raw JSONB payload against the LessonPayload shape.
 * Returns null if valid, otherwise a human-readable error message.
 */
export function validateLessonPayload(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") {
    return "payload is not an object";
  }
  const p = raw as Record<string, unknown>;
  if (p.schemaVersion !== 1) {
    return `unsupported schemaVersion: ${String(p.schemaVersion)}`;
  }
  if (typeof p.patternSlug !== "string" || p.patternSlug.length === 0) {
    return "missing patternSlug";
  }
  if (!p.sections || typeof p.sections !== "object") {
    return "missing sections";
  }
  const sections = p.sections as Record<string, unknown>;
  for (const id of LESSON_SECTION_ORDER) {
    if (!sections[id]) return `missing section "${id}"`;
    const s = sections[id] as Record<string, unknown>;
    if (typeof s.code !== "string") {
      return `section "${id}" missing compiled code`;
    }
  }
  return null;
}

/**
 * Load a lesson by pattern slug from the DB.
 * Uses the moduleId="lld", contentType="lesson", slug=<patternSlug> key.
 */
export async function loadLesson(
  patternSlug: string,
): Promise<LessonLoadResult> {
  try {
    const db = getDb();
    const rows = await db
      .select({ content: moduleContent.content })
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "lesson"),
          eq(moduleContent.slug, patternSlug),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return {
        ok: false,
        reason: "missing",
        message: `no lesson row for slug "${patternSlug}"`,
      };
    }

    const err = validateLessonPayload(rows[0].content);
    if (err) {
      return { ok: false, reason: "corrupt", message: err };
    }

    return { ok: true, payload: rows[0].content as LessonPayload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "db-error", message: msg };
  }
}

/**
 * List all available lesson slugs (for the sidebar).
 */
export async function listLessonSlugs(): Promise<string[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: moduleContent.slug })
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "lesson"),
        ),
      );
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}
