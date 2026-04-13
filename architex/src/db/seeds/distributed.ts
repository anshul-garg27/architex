/**
 * Distributed Systems module seed: 11 simulation definitions.
 *
 * The SIMULATIONS data is inline in DistributedModule.tsx, so we define
 * the catalog here directly. Engine classes (Raft, Gossip, etc.) stay client-side.
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "distributed";

const DISTRIBUTED_SIMS = [
  { id: "raft", name: "Raft Consensus", category: "consensus", difficulty: "advanced", description: "Leader election, log replication, and safety in a replicated state machine." },
  { id: "consistent-hashing", name: "Consistent Hashing", category: "partitioning", difficulty: "intermediate", description: "Hash ring with virtual nodes for balanced data distribution across dynamic clusters." },
  { id: "vector-clocks", name: "Vector Clocks", category: "ordering", difficulty: "intermediate", description: "Distributed causality tracking using per-process logical timestamps." },
  { id: "gossip", name: "Gossip Protocol", category: "propagation", difficulty: "beginner", description: "Epidemic-style information dissemination with push, pull, and push-pull modes." },
  { id: "crdts", name: "CRDTs", category: "consistency", difficulty: "advanced", description: "Conflict-free Replicated Data Types: G-Counter, LWW-Set, OR-Set, G-Map." },
  { id: "cap-theorem", name: "CAP Theorem Explorer", category: "theory", difficulty: "beginner", description: "Interactive CAP triangle with PACELC extension and real system placement." },
  { id: "two-phase-commit", name: "Two-Phase Commit", category: "transactions", difficulty: "intermediate", description: "Distributed transaction protocol with prepare and commit phases." },
  { id: "saga", name: "Saga Pattern", category: "transactions", difficulty: "advanced", description: "Long-running distributed transactions via choreography or orchestration." },
  { id: "map-reduce", name: "MapReduce", category: "computation", difficulty: "intermediate", description: "Parallel data processing: map phase, shuffle, reduce phase word count." },
  { id: "lamport-timestamps", name: "Lamport Timestamps", category: "ordering", difficulty: "beginner", description: "Scalar logical clocks establishing partial ordering of distributed events." },
  { id: "paxos", name: "Paxos", category: "consensus", difficulty: "expert", description: "Consensus protocol with prepare/promise/accept phases and Multi-Paxos optimization." },
];

export async function seed(db: Database) {
  const rows = mapToRows(MODULE_ID, "simulation", DISTRIBUTED_SIMS, {
    slugField: "id",
    nameField: "name",
    categoryField: "category",
    difficultyField: "difficulty",
    summaryField: "description",
    tagsFn: (item) => ["distributed", String(item.category ?? "")],
  });

  console.log(`    Upserting ${rows.length} distributed content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
