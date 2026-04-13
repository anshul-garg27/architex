// ─────────────────────────────────────────────────────────────
// Architex — Database Design Lab
// ─────────────────────────────────────────────────────────────
//
// Barrel export for all database design modules:
// - ER Diagram types
// - Normalization engine (closure, candidate keys, 3NF decomposition)
// - Transaction isolation simulator
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────
export type {
  EREntity,
  ERAttribute,
  ERRelationship,
  FunctionalDependency,
  NormalizationState,
  NormalizationResult,
  IsolationLevel,
} from "./types";

// ── Normalization Engine ────────────────────────────────────
export {
  computeClosure,
  findCandidateKeys,
  determineNormalForm,
  decomposeTo3NF,
  decomposeToBCNF,
} from "./normalization";

// ── Transaction Isolation Simulator ─────────────────────────
export { simulateIsolation, getCompareResult, getPredictionPrompt, simulateWriteSkew } from "./transaction-sim";
export type { TransactionStep, CompareScenario, CompareResult, PredictionPrompt } from "./transaction-sim";

// ── B-Tree Index Visualization ─────────────────────────────
export { BTreeViz } from "./btree-viz";
export type { BTreeNode, BTreeStep } from "./btree-viz";

// ── Hash Index Visualization ──────────────────────────────────
export { HashIndexViz } from "./hash-index-viz";
export type {
  HashBucket,
  HashIndexState,
  HashIndexStep,
} from "./hash-index-viz";

// ── Query Plan Visualizer ──────────────────────────────────
export { generateQueryPlan } from "./query-plan";
export type { QueryPlanNode } from "./query-plan";

// ── ER-to-SQL Generator ──────────────────────────────────────
export { generateSQL } from "./er-to-sql";

// ── LSM-Tree Visualization ──────────────────────────────────
export { LSMTreeViz } from "./lsm-viz";
export type { LSMLevel, LSMVizState, LSMVizStep } from "./lsm-viz";

// ── Schema Converter ────────────────────────────────────────
export { erToSQL, erToNoSQL } from "./schema-converter";
export type {
  SQLResult,
  MongoField,
  MongoCollection,
  NoSQLResult,
} from "./schema-converter";

// ── MVCC Visualization ─────────────────────────────────────
export { MVCCViz } from "./mvcc-viz";
export type {
  RowVersion,
  MVCCTransaction,
  MVCCState,
  MVCCStep,
} from "./mvcc-viz";

// ── Join Algorithms Visualization ──────────────────────────
export { JoinViz } from "./join-viz";
export type {
  JoinAlgorithm,
  JoinRow,
  JoinTableDef,
  JoinMatch,
  JoinState,
  JoinStep,
} from "./join-viz";

// ── ARIES Recovery Visualization ──────────────────────────────
export { ARIESViz } from "./aries-viz";
export type {
  WALEntry,
  WALEntryType,
  DirtyPageEntry,
  TransactionTableEntry,
  DiskPage,
  RecoveryPhase,
  ARIESState,
  ARIESStep,
} from "./aries-viz";

// ── Sample ER Diagrams ──────────────────────────────────────
export { SAMPLE_ER_DIAGRAMS } from "./sample-er-diagrams";
export type { SampleERDiagram } from "./sample-er-diagrams";
