// ─────────────────────────────────────────────────────────────
// Architex — DP Algorithm Types
// ─────────────────────────────────────────────────────────────

export interface DPCell {
  row: number;
  col: number;
  value: number;
  state: 'default' | 'computing' | 'computed' | 'optimal' | 'dependency';
}

export interface DPTable {
  rows: string[];
  cols: string[];
  cells: DPCell[][];
}

export interface DPAlgorithmResult {
  table: DPTable;
  optimalValue: number;
  optimalPath: Array<{ row: number; col: number }>;
}
