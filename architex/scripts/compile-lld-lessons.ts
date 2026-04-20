#!/usr/bin/env tsx
/**
 * Compile LLD MDX lessons into JSONB payloads seeded into module_content.
 *
 * Usage:
 *   pnpm compile:lld-lessons                 # compile all lessons
 *   pnpm compile:lld-lessons --slug=singleton  # single pattern
 *   pnpm compile:lld-lessons --dry            # validate only, skip DB upsert
 *
 * Pipeline per lesson:
 *   1. Read content/lld/lessons/<slug>.mdx
 *   2. Parse frontmatter with gray-matter
 *   3. Split the body by `<!-- Section: <id> -->` delimiters (8 sections)
 *   4. Compile each section's MDX body with @mdx-js/mdx
 *   5. Extract anchors + conceptIds + classIds from raw body
 *   6. Upsert module_content row { moduleId: "lld", contentType:
 *      "lesson", slug, content: LessonPayload }
 *
 * Errors are collected and printed at the end — one bad lesson does not
 * abort others (useful when multiple authors push concurrently).
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { compile } from "@mdx-js/mdx";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import yaml from "js-yaml";
import type {
  LessonPayload,
  LessonSectionId,
  CompiledMDX,
  ConceptYAML,
  CheckpointsSectionPayload,
} from "../src/lib/lld/lesson-types";

const LESSON_DIR = "content/lld/lessons";
const CONCEPT_DIR = "content/lld/concepts";

const SECTION_ORDER: LessonSectionId[] = [
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
];

interface CompileResult {
  slug: string;
  payload: LessonPayload;
}

interface CompileError {
  slug: string;
  message: string;
}

export async function compileSection(
  sectionBody: string,
  _sectionId: LessonSectionId,
): Promise<CompiledMDX> {
  const compiled = await compile(sectionBody, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    development: false,
  });

  // Extract anchors: all `## Heading` and `### Heading` lines
  const anchors: CompiledMDX["anchors"] = [];
  for (const match of sectionBody.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const depth = match[1].length as 2 | 3;
    const label = match[2].trim();
    const id = slugify(label);
    anchors.push({ id, label, depth });
  }

  // Extract <Concept id="..."> and <Class id="..."> JSX references
  const conceptIds = Array.from(
    sectionBody.matchAll(/<Concept\s+id="([^"]+)"/g),
  ).map((m) => m[1]);
  const classIds = Array.from(
    sectionBody.matchAll(/<Class\s+id="([^"]+)"/g),
  ).map((m) => m[1]);

  return {
    code: String(compiled),
    raw: sectionBody,
    anchors,
    conceptIds: Array.from(new Set(conceptIds)),
    classIds: Array.from(new Set(classIds)),
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Split MDX body by `<!-- Section: <id> -->` delimiters.
 * Returns map of sectionId → body.
 */
export function splitIntoSections(
  body: string,
): Partial<Record<LessonSectionId, string>> {
  const sections: Partial<Record<LessonSectionId, string>> = {};
  const regex = /<!--\s*Section:\s*([a-z_]+)\s*-->/g;
  const matches = Array.from(body.matchAll(regex));

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const id = m[1] as LessonSectionId;
    if (!SECTION_ORDER.includes(id)) continue;
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    sections[id] = body.slice(start, end).trim();
  }
  return sections;
}

export async function compileLesson(slug: string): Promise<CompileResult> {
  const mdxPath = join(LESSON_DIR, `${slug}.mdx`);
  const rawFile = await readFile(mdxPath, "utf8");
  const { data: frontmatter, content: body } = matter(rawFile);

  const sectionBodies = splitIntoSections(body);

  // Validate all 8 sections present
  for (const id of SECTION_ORDER) {
    if (!sectionBodies[id]) {
      throw new Error(
        `Missing section "${id}" in ${mdxPath}. Add <!-- Section: ${id} --> delimiter.`,
      );
    }
  }

  const compiled = {} as LessonPayload["sections"];
  for (const id of SECTION_ORDER) {
    const base = await compileSection(sectionBodies[id]!, id);
    const fmSections = (frontmatter.sections ?? {}) as Record<string, unknown>;
    const fmSection = (fmSections[id] ?? {}) as Record<string, unknown>;
    compiled[id] = { ...base, ...fmSection } as never;
  }

  // Checkpoints are a special case — they come from frontmatter, not MDX body
  if (!frontmatter.checkpoints || !Array.isArray(frontmatter.checkpoints)) {
    throw new Error(
      `${mdxPath}: frontmatter must include a \`checkpoints\` array with exactly 4 entries (recall, apply, compare, create).`,
    );
  }
  const kinds = frontmatter.checkpoints.map((c: { kind: string }) => c.kind);
  const required = ["recall", "apply", "compare", "create"];
  for (const k of required) {
    if (!kinds.includes(k)) {
      throw new Error(
        `${mdxPath}: checkpoints missing "${k}" kind. Found: ${kinds.join(", ")}`,
      );
    }
  }
  (compiled.checkpoints as CheckpointsSectionPayload).checkpoints =
    frontmatter.checkpoints as CheckpointsSectionPayload["checkpoints"];

  const payload: LessonPayload = {
    schemaVersion: 1,
    patternSlug: slug,
    subtitle: typeof frontmatter.subtitle === "string" ? frontmatter.subtitle : "",
    estimatedMinutes:
      typeof frontmatter.estimatedMinutes === "number"
        ? frontmatter.estimatedMinutes
        : 10,
    conceptIds: Array.isArray(frontmatter.conceptIds)
      ? (frontmatter.conceptIds as string[])
      : [],
    sections: compiled,
  };

  return { slug, payload };
}

export async function readConceptYaml(
  slug: string,
): Promise<ConceptYAML | null> {
  const path = join(CONCEPT_DIR, `${slug}.concepts.yaml`);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, "utf8");
  return yaml.load(raw) as ConceptYAML;
}

async function upsertLesson(result: CompileResult): Promise<void> {
  // Lazy import to avoid loading DB when --dry flag is set.
  const { getDb, moduleContent } = await import("../src/db");
  const db = getDb();
  await db
    .insert(moduleContent)
    .values({
      moduleId: "lld",
      contentType: "lesson",
      slug: result.slug,
      name: result.slug,
      content: result.payload,
      summary: result.payload.subtitle,
      isPublished: true,
    })
    .onConflictDoUpdate({
      target: [
        moduleContent.moduleId,
        moduleContent.contentType,
        moduleContent.slug,
      ],
      set: {
        content: result.payload,
        summary: result.payload.subtitle,
        updatedAt: new Date(),
      },
    });
}

async function main() {
  const slugArg = process.argv
    .find((a) => a.startsWith("--slug="))
    ?.split("=")[1];
  const dryRun = process.argv.includes("--dry");

  let slugs: string[];
  if (slugArg) {
    slugs = [slugArg];
  } else {
    if (!existsSync(LESSON_DIR)) {
      console.log(
        `[compile-lld-lessons] lesson dir missing: ${LESSON_DIR} — nothing to compile`,
      );
      return;
    }
    const files = await readdir(LESSON_DIR);
    slugs = files
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => basename(f, ".mdx"));
  }

  const errors: CompileError[] = [];
  let successCount = 0;

  for (const slug of slugs) {
    try {
      const result = await compileLesson(slug);
      if (!dryRun) {
        await upsertLesson(result);
      }
      // Also validate concept yaml is loadable (not used yet; Task 16 builds graph)
      await readConceptYaml(slug);
      successCount++;
      console.log(
        `[compile-lld-lessons] ✓ ${slug}${dryRun ? " (dry-run)" : ""}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ slug, message: msg });
      console.error(`[compile-lld-lessons] ✗ ${slug}: ${msg}`);
    }
  }

  console.log(
    `\n[compile-lld-lessons] done: ${successCount} ok, ${errors.length} failed`,
  );
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[compile-lld-lessons] fatal:", err);
  process.exit(2);
});
