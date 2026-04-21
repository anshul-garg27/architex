/**
 * scripts/blueprint/compile-all-units.ts
 *
 * Walks content/blueprint/units/* and compiles every unit that has
 * a unit.yaml file.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const CONTENT_ROOT = path.resolve("content/blueprint/units");

async function main() {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  const slugs: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const yamlPath = path.join(CONTENT_ROOT, e.name, "unit.yaml");
    try {
      await fs.access(yamlPath);
      slugs.push(e.name);
    } catch {
      // skip directories without a unit.yaml (gitkeep, stubs, etc.)
    }
  }

  if (slugs.length === 0) {
    console.log("[blueprint-compile-all] no units to compile");
    return;
  }

  for (const slug of slugs) {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          "--experimental-strip-types",
          "scripts/blueprint/compile-unit.ts",
          slug,
        ],
        { stdio: "inherit" },
      );
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`compile-unit ${slug} exited ${code}`));
      });
    });
  }
}

main().catch((err) => {
  console.error("[blueprint-compile-all] failed:", err);
  process.exit(1);
});
