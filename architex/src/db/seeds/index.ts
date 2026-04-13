/**
 * Master seed runner.
 *
 * Usage:
 *   pnpm db:seed                   — seed all modules
 *   pnpm db:seed -- --module=lld   — seed a single module
 */

import { getDb } from "@/db";

const SEED_MODULES: Record<string, () => Promise<{ seed: (db: ReturnType<typeof getDb>) => Promise<void> }>> = {
  lld: () => import("./lld"),
  "system-design": () => import("./system-design"),
  algorithms: () => import("./algorithms"),
  "data-structures": () => import("./data-structures"),
  database: () => import("./database"),
  networking: () => import("./networking"),
  security: () => import("./security"),
  distributed: () => import("./distributed"),
  os: () => import("./os"),
  "ml-design": () => import("./ml-design"),
  concurrency: () => import("./concurrency"),
};

async function main() {
  const moduleArg = process.argv.find((a) => a.startsWith("--module="));
  const targetModule = moduleArg?.split("=")[1];

  const db = getDb();

  if (targetModule) {
    const loader = SEED_MODULES[targetModule];
    if (!loader) {
      console.error(`Unknown module: ${targetModule}`);
      console.error(`Available: ${Object.keys(SEED_MODULES).join(", ")}`);
      process.exit(1);
    }
    console.log(`Seeding module: ${targetModule}`);
    const mod = await loader();
    await mod.seed(db);
    console.log(`✓ ${targetModule} seeded`);
  } else {
    console.log(`Seeding all modules (${Object.keys(SEED_MODULES).length})...`);
    for (const [name, loader] of Object.entries(SEED_MODULES)) {
      console.log(`  Seeding: ${name}`);
      const mod = await loader();
      await mod.seed(db);
      console.log(`  ✓ ${name}`);
    }
    console.log("All modules seeded.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
