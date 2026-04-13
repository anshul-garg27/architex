/**
 * OS Concepts module seed: system calls + concept metadata.
 *
 * The 15 simulation engines stay client-side (pure computation).
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "os";

export async function seed(db: Database) {
  const { COMMON_SYSCALLS } = await import("@/lib/os/system-calls");

  const OS_CONCEPTS = [
    { id: "cpu-scheduling", name: "CPU Scheduling", category: "scheduling", difficulty: "intermediate", description: "FCFS, SJF, Round Robin, Priority, and MLFQ scheduling algorithms." },
    { id: "page-replacement", name: "Page Replacement", category: "memory", difficulty: "intermediate", description: "FIFO, LRU, Optimal, and Clock page replacement algorithms." },
    { id: "deadlock", name: "Deadlock Detection & Prevention", category: "sync", difficulty: "advanced", description: "Resource Allocation Graph analysis and Banker's Algorithm." },
    { id: "memory-management", name: "Virtual Memory", category: "memory", difficulty: "intermediate", description: "Address translation, page tables, and TLB simulation." },
    { id: "memory-alloc", name: "Memory Allocation", category: "memory", difficulty: "beginner", description: "First Fit, Best Fit, and Worst Fit allocation strategies." },
    { id: "thread-sync", name: "Thread Synchronization", category: "sync", difficulty: "advanced", description: "Mutex, Semaphore, Read-Write Lock, and Condition Variable primitives." },
  ];

  const rows = [
    ...mapToRows(MODULE_ID, "concept", OS_CONCEPTS, {
      slugField: "id",
      nameField: "name",
      categoryField: "category",
      difficultyField: "difficulty",
      summaryField: "description",
      tagsFn: (item) => ["os", String(item.category ?? "")],
    }),
    ...mapToRows(MODULE_ID, "syscall", COMMON_SYSCALLS, {
      slugField: "name",
      nameField: "name",
      categoryField: "category",
      summaryField: "description",
      tagsFn: (item) => ["syscall", String(item.category ?? "")],
    }),
  ];

  console.log(`    Upserting ${rows.length} OS content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
