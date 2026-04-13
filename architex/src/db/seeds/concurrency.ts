/**
 * Concurrency module seed: event loop demos, async patterns, goroutines, thread lifecycle.
 *
 * The 18 simulation engines stay client-side (pure computation).
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "concurrency";

export async function seed(db: Database) {
  const { EVENT_LOOP_DEMOS } = await import("@/lib/concurrency/event-loop");
  const { ASYNC_PATTERN_DEMOS } = await import("@/lib/concurrency/async-patterns");
  const { GOROUTINE_DEMOS } = await import("@/lib/concurrency/goroutines");

  // Concurrency demo catalog (inline since DEMOS array is local to component)
  const CONCURRENCY_DEMOS = [
    { id: "race-condition", name: "Race Condition", category: "sync-problems", difficulty: "beginner", description: "Unsafe vs safe increment with mutex protection." },
    { id: "deadlock", name: "Deadlock Detection", category: "sync-problems", difficulty: "intermediate", description: "Deadlock detection and prevention via resource ordering." },
    { id: "producer-consumer", name: "Producer-Consumer", category: "sync-problems", difficulty: "intermediate", description: "Bounded buffer with multiple producers and consumers." },
    { id: "dining-philosophers", name: "Dining Philosophers", category: "sync-problems", difficulty: "advanced", description: "Classic synchronization problem with naive and ordered solutions." },
    { id: "readers-writers", name: "Readers-Writers", category: "sync-problems", difficulty: "intermediate", description: "Concurrent read access with exclusive write locks." },
    { id: "sleeping-barber", name: "Sleeping Barber", category: "sync-problems", difficulty: "advanced", description: "Waiting room capacity with sleeping barber wake-up protocol." },
    { id: "mutex-comparison", name: "Mutex Comparison", category: "primitives", difficulty: "intermediate", description: "Spin lock vs test-and-set vs standard mutex performance." },
    { id: "thread-pool", name: "Thread Pool Saturation", category: "primitives", difficulty: "intermediate", description: "Fixed thread pool with work queue overflow visualization." },
  ];

  const rows = [
    ...mapToRows(MODULE_ID, "demo", CONCURRENCY_DEMOS, {
      slugField: "id",
      nameField: "name",
      categoryField: "category",
      difficultyField: "difficulty",
      summaryField: "description",
      tagsFn: (item) => ["concurrency", String(item.category ?? "")],
    }),
    ...mapToRows(MODULE_ID, "event-loop-demo", EVENT_LOOP_DEMOS, {
      slugField: "id",
      nameField: "title",
      summaryField: "title",
      tagsFn: () => ["concurrency", "event-loop", "javascript"],
    }),
    ...mapToRows(MODULE_ID, "async-pattern", ASYNC_PATTERN_DEMOS, {
      slugField: "id",
      nameField: "title",
      summaryField: "title",
      tagsFn: () => ["concurrency", "async", "promise"],
    }),
    ...mapToRows(MODULE_ID, "goroutine-demo", GOROUTINE_DEMOS, {
      slugField: "id",
      nameField: "title",
      summaryField: "title",
      tagsFn: () => ["concurrency", "goroutines", "go"],
    }),
  ];

  console.log(`    Upserting ${rows.length} concurrency content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
