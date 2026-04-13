/**
 * Database Design Lab — Type Definitions (DBL-002)
 *
 * Core types for the ER Diagram Builder, Normalization engine,
 * and Transaction Isolation simulator.
 */

// ── ER Diagram Types ──────────────────────────────────────────

export interface ERAttribute {
  id: string;
  name: string;
  isPK: boolean;
  isFK: boolean;
  type: string;
  /** Chen notation: double ellipse border */
  isMultivalued?: boolean;
  /** Chen notation: dashed ellipse border */
  isDerived?: boolean;
  /** Chen notation: ellipse with sub-ellipses */
  isComposite?: boolean;
  /** Chen notation: dashed underline (weak entity partial key) */
  isPartialKey?: boolean;
  /** Sub-attributes for composite attributes */
  subAttributes?: ERAttribute[];
}

export interface EREntity {
  id: string;
  name: string;
  isWeak: boolean;
  attributes: ERAttribute[];
  x: number;
  y: number;
}

export interface ERRelationship {
  id: string;
  name: string;
  entity1Id: string;
  entity2Id: string;
  cardinality: "1:1" | "1:N" | "M:N";
  /** Chen notation: double diamond border */
  isIdentifying?: boolean;
  /** Chen notation: total (double line) vs partial (single line) per entity side */
  participation?: {
    entity1: "total" | "partial";
    entity2: "total" | "partial";
  };
}

// ── Normalization Types ───────────────────────────────────────

export interface FunctionalDependency {
  lhs: string[];
  rhs: string[];
}

export interface NormalizationState {
  relation: string;
  attributes: string[];
  fds: FunctionalDependency[];
  currentNF: "1NF" | "2NF" | "3NF" | "BCNF";
  candidateKeys: string[][];
}

// ── Normalization Result ─────────────────────────────────────

export interface NormalizationResult {
  closure: string[];
  candidateKeys: string[][];
  currentNF: "1NF" | "2NF" | "3NF" | "BCNF";
  decomposition: Array<{
    name: string;
    attributes: string[];
    fds: FunctionalDependency[];
  }>;
}

// ── Transaction Isolation Types ───────────────────────────────

export type IsolationLevel =
  | "read-uncommitted"
  | "read-committed"
  | "repeatable-read"
  | "serializable";

