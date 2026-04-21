/**
 * scripts/blueprint/compile-unit.ts
 *
 * Compiles a single authored unit directory into a JSON artifact that
 * can be upserted into `blueprint_units.recipe_json`.
 *
 * Input:
 *   content/blueprint/units/<slug>/unit.yaml
 *   content/blueprint/units/<slug>/sections/<nn>-<slug>.mdx (for `read` sections)
 *
 * Output:
 *   content/blueprint/compiled/<slug>.json
 *
 * Usage:
 *   pnpm tsx scripts/blueprint/compile-unit.ts <unit-slug>
 *
 * The compiler is intentionally narrow: it knows only about section
 * types. It never resolves patterns/problems — those references are
 * carried as slugs and wired up at render time.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import yaml from "js-yaml";

const CONTENT_ROOT = path.resolve("content/blueprint/units");
const OUT_ROOT = path.resolve("content/blueprint/compiled");

interface AuthoredSection {
  id: string;
  type:
    | "read"
    | "interact"
    | "retain"
    | "reflect"
    | "apply"
    | "practice"
    | "checkpoint";
  title: string;
  mdx?: string;
  estimatedSeconds?: number;
  widget?: unknown;
  cards?: unknown[];
  recap?: string;
  prompt?: string;
  placeholder?: string;
  minWords?: number;
  exercise?: string;
  patternSlug?: string;
  starterClassesCount?: number;
  instructions?: string;
  problemSlug?: string;
  timerMinutes?: number;
  reducedScope?: string;
  exercises?: unknown[];
  passThreshold?: number;
}

interface AuthoredUnit {
  slug: string;
  recipeVersion: number;
  sections: AuthoredSection[];
}

async function compileMdxSection(
  unitDir: string,
  relativePath: string,
): Promise<{ code: string; raw: string }> {
  const abs = path.join(unitDir, "sections", relativePath);
  const raw = await fs.readFile(abs, "utf8");
  const compiled = await compile(raw, {
    outputFormat: "function-body",
    development: false,
    jsxRuntime: "automatic",
  });
  return { code: String(compiled), raw };
}

async function compileUnit(slug: string): Promise<void> {
  const unitDir = path.join(CONTENT_ROOT, slug);
  const yamlPath = path.join(unitDir, "unit.yaml");

  const yamlSource = await fs.readFile(yamlPath, "utf8");
  const authored = yaml.load(yamlSource) as AuthoredUnit;

  if (authored.slug !== slug) {
    throw new Error(
      `unit.yaml slug (${authored.slug}) does not match directory slug (${slug})`,
    );
  }

  const sections = await Promise.all(
    authored.sections.map(async (sec) => {
      if (sec.type === "read") {
        if (!sec.mdx) {
          throw new Error(`read section "${sec.id}" is missing the mdx field`);
        }
        const compiled = await compileMdxSection(unitDir, sec.mdx);
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            compiled,
            estimatedSeconds: sec.estimatedSeconds ?? 90,
          },
        };
      }

      if (sec.type === "interact") {
        if (!sec.widget) {
          throw new Error(
            `interact section "${sec.id}" is missing the widget field`,
          );
        }
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: { widget: sec.widget },
        };
      }

      if (sec.type === "retain") {
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            recap: sec.recap,
            cards: sec.cards ?? [],
          },
        };
      }

      if (sec.type === "reflect") {
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            prompt: sec.prompt ?? "",
            placeholder: sec.placeholder,
            minWords: sec.minWords,
          },
        };
      }

      if (sec.type === "apply") {
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            exercise: sec.exercise ?? "identify-pattern",
            patternSlug: sec.patternSlug,
            starterClassesCount: sec.starterClassesCount,
            instructions: sec.instructions ?? "",
          },
        };
      }

      if (sec.type === "practice") {
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            problemSlug: sec.problemSlug ?? "",
            timerMinutes: sec.timerMinutes ?? 10,
            reducedScope: sec.reducedScope,
          },
        };
      }

      if (sec.type === "checkpoint") {
        return {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          params: {
            exercises: sec.exercises ?? [],
            passThreshold: sec.passThreshold ?? 0.7,
          },
        };
      }

      throw new Error(
        `Unknown section type "${(sec as { type: string }).type}" in section "${sec.id}"`,
      );
    }),
  );

  const recipeJson = {
    version: authored.recipeVersion ?? 1,
    sections,
  };

  await fs.mkdir(OUT_ROOT, { recursive: true });
  const outPath = path.join(OUT_ROOT, `${slug}.json`);
  await fs.writeFile(outPath, JSON.stringify(recipeJson, null, 2), "utf8");

  console.log(
    `[blueprint-compile] wrote ${outPath} (${sections.length} sections)`,
  );
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: pnpm tsx scripts/blueprint/compile-unit.ts <slug>");
    process.exit(1);
  }
  await compileUnit(slug);
}

main().catch((err) => {
  console.error("[blueprint-compile] failed:", err);
  process.exit(1);
});
