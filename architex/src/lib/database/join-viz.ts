/**
 * Database Design Lab -- Join Algorithms Visualization (DBL-076)
 *
 * Interactive visualization of three fundamental join algorithms:
 * 1. Nested Loop Join  -- O(n*m), simplest but slowest
 * 2. Sort-Merge Join   -- O(n log n + m log m), good for pre-sorted data
 * 3. Hash Join         -- O(n+m), fastest for equi-joins on large tables
 *
 * Records each comparison/match as a JoinStep for animated playback.
 * Uses employee/department sample data to demonstrate each algorithm.
 */

// -- Types --------------------------------------------------------

export type JoinAlgorithm = "nested-loop" | "sort-merge" | "hash-join";

export interface JoinRow {
  /** Column values, keyed by column name */
  [column: string]: string | number;
}

export interface JoinTableDef {
  name: string;
  columns: string[];
  rows: JoinRow[];
}

export interface JoinMatch {
  leftRowIndex: number;
  rightRowIndex: number;
}

export interface HashBucketEntry {
  key: number;
  rowIndex: number;
}

export interface JoinState {
  leftTable: JoinTableDef;
  rightTable: JoinTableDef;
  algorithm: JoinAlgorithm;
  /** Index of current outer row being processed */
  outerIndex: number;
  /** Index of current inner row being compared */
  innerIndex: number;
  /** Total comparisons so far */
  comparisons: number;
  /** Matched row pairs found so far */
  matches: JoinMatch[];
  /** For sort-merge: sorted copies of both tables */
  sortedLeft?: JoinRow[];
  sortedRight?: JoinRow[];
  /** For sort-merge: left pointer position */
  leftPointer?: number;
  /** For sort-merge: right pointer position */
  rightPointer?: number;
  /** For hash-join: hash table buckets (key -> row indices) */
  hashTable?: Map<number, HashBucketEntry[]>;
  /** For hash-join: serializable version of hash table */
  hashBuckets?: Array<{ key: number; entries: HashBucketEntry[] }>;
  /** For hash-join: current phase */
  hashPhase?: "build" | "probe" | "done";
  /** Which left row index is highlighted */
  highlightLeft?: number;
  /** Which right row index is highlighted */
  highlightRight?: number;
  /** Is the current comparison a match? */
  isMatch?: boolean;
  /** Phase label for display */
  phase: string;
}

export interface JoinStep {
  /** Human-readable explanation of what happened and WHY */
  description: string;
  /** Deep-cloned snapshot of state at this point */
  state: JoinState;
  /** Which algorithm produced this step */
  operation: "setup" | "compare" | "match" | "sort" | "hash-build" | "hash-probe" | "complete";
  /** Optional element to highlight in canvas */
  highlightId?: string;
}

// -- Sample Data --------------------------------------------------

const SAMPLE_EMPLOYEES: JoinRow[] = [
  { id: 1, name: "Alice", dept_id: 1 },
  { id: 2, name: "Bob", dept_id: 2 },
  { id: 3, name: "Carol", dept_id: 1 },
  { id: 4, name: "Dave", dept_id: 3 },
  { id: 5, name: "Eve", dept_id: 2 },
  { id: 6, name: "Frank", dept_id: 1 },
];

const SAMPLE_DEPARTMENTS: JoinRow[] = [
  { id: 1, name: "Engineering" },
  { id: 2, name: "Marketing" },
  { id: 3, name: "Finance" },
];

// -- Deep-clone helpers -------------------------------------------

function cloneRow(row: JoinRow): JoinRow {
  return { ...row };
}

function cloneTable(table: JoinTableDef): JoinTableDef {
  return {
    name: table.name,
    columns: [...table.columns],
    rows: table.rows.map(cloneRow),
  };
}

function cloneMatches(matches: JoinMatch[]): JoinMatch[] {
  return matches.map((m) => ({ ...m }));
}

function cloneHashBuckets(
  buckets: Array<{ key: number; entries: HashBucketEntry[] }>,
): Array<{ key: number; entries: HashBucketEntry[] }> {
  return buckets.map((b) => ({
    key: b.key,
    entries: b.entries.map((e) => ({ ...e })),
  }));
}

function cloneState(state: JoinState): JoinState {
  const cloned: JoinState = {
    leftTable: cloneTable(state.leftTable),
    rightTable: cloneTable(state.rightTable),
    algorithm: state.algorithm,
    outerIndex: state.outerIndex,
    innerIndex: state.innerIndex,
    comparisons: state.comparisons,
    matches: cloneMatches(state.matches),
    highlightLeft: state.highlightLeft,
    highlightRight: state.highlightRight,
    isMatch: state.isMatch,
    phase: state.phase,
  };
  if (state.sortedLeft) cloned.sortedLeft = state.sortedLeft.map(cloneRow);
  if (state.sortedRight) cloned.sortedRight = state.sortedRight.map(cloneRow);
  if (state.leftPointer !== undefined) cloned.leftPointer = state.leftPointer;
  if (state.rightPointer !== undefined) cloned.rightPointer = state.rightPointer;
  if (state.hashBuckets) cloned.hashBuckets = cloneHashBuckets(state.hashBuckets);
  if (state.hashPhase) cloned.hashPhase = state.hashPhase;
  return cloned;
}

// -- JoinViz ------------------------------------------------------

export class JoinViz {
  private leftTable: JoinTableDef;
  private rightTable: JoinTableDef;
  private leftJoinCol: string;
  private rightJoinCol: string;

  constructor() {
    this.leftTable = {
      name: "employees",
      columns: ["id", "name", "dept_id"],
      rows: SAMPLE_EMPLOYEES.map(cloneRow),
    };
    this.rightTable = {
      name: "departments",
      columns: ["id", "name"],
      rows: SAMPLE_DEPARTMENTS.map(cloneRow),
    };
    this.leftJoinCol = "dept_id";
    this.rightJoinCol = "id";
  }

  // -- Public API (each returns JoinStep[]) -----------------------

  /**
   * Run the Nested Loop Join algorithm.
   * For each row in the outer (left) table, scan ALL rows in the
   * inner (right) table. Time complexity: O(n * m).
   */
  nestedLoopJoin(): JoinStep[] {
    const steps: JoinStep[] = [];
    const left = this.leftTable;
    const right = this.rightTable;
    const comparisons = { count: 0 };
    const matches: JoinMatch[] = [];

    // Setup step
    steps.push({
      description:
        `Nested Loop Join: for each of the ${left.rows.length} employee rows, we will scan all ${right.rows.length} department rows looking for dept_id matches. ` +
        `This requires ${left.rows.length} x ${right.rows.length} = ${left.rows.length * right.rows.length} comparisons in the worst case -- O(n*m).`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "nested-loop",
        outerIndex: -1,
        innerIndex: -1,
        comparisons: 0,
        matches: [],
        phase: "Starting Nested Loop Join",
      }),
      operation: "setup",
    });

    // Main loop
    for (let i = 0; i < left.rows.length; i++) {
      const outerRow = left.rows[i];
      const outerKey = outerRow[this.leftJoinCol] as number;

      steps.push({
        description:
          `Outer loop: pick employee row ${i + 1} (${outerRow.name}, dept_id=${outerKey}). ` +
          `Now scan ALL ${right.rows.length} department rows to find dept_id=${outerKey}.`,
        state: cloneState({
          leftTable: left,
          rightTable: right,
          algorithm: "nested-loop",
          outerIndex: i,
          innerIndex: -1,
          comparisons: comparisons.count,
          matches: [...matches],
          highlightLeft: i,
          phase: `Outer row ${i + 1}/${left.rows.length}`,
        }),
        operation: "compare",
      });

      for (let j = 0; j < right.rows.length; j++) {
        const innerRow = right.rows[j];
        const innerKey = innerRow[this.rightJoinCol] as number;
        comparisons.count++;

        const isMatch = outerKey === innerKey;

        if (isMatch) {
          matches.push({ leftRowIndex: i, rightRowIndex: j });
          steps.push({
            description:
              `MATCH! Employee "${outerRow.name}" (dept_id=${outerKey}) joins with department "${innerRow.name}" (id=${innerKey}). ` +
              `Comparison #${comparisons.count}: ${outerKey} == ${innerKey}. ` +
              `This is match #${matches.length} found so far.`,
            state: cloneState({
              leftTable: left,
              rightTable: right,
              algorithm: "nested-loop",
              outerIndex: i,
              innerIndex: j,
              comparisons: comparisons.count,
              matches: [...matches],
              highlightLeft: i,
              highlightRight: j,
              isMatch: true,
              phase: `Match found! (${matches.length} total)`,
            }),
            operation: "match",
          });
        } else {
          steps.push({
            description:
              `No match: employee "${outerRow.name}" (dept_id=${outerKey}) vs department "${innerRow.name}" (id=${innerKey}). ` +
              `Comparison #${comparisons.count}: ${outerKey} != ${innerKey}. Continue scanning inner table.`,
            state: cloneState({
              leftTable: left,
              rightTable: right,
              algorithm: "nested-loop",
              outerIndex: i,
              innerIndex: j,
              comparisons: comparisons.count,
              matches: [...matches],
              highlightLeft: i,
              highlightRight: j,
              isMatch: false,
              phase: `Comparing (${comparisons.count} total)`,
            }),
            operation: "compare",
          });
        }
      }
    }

    // Complete
    steps.push({
      description:
        `Nested Loop Join complete! Found ${matches.length} matching pairs after ${comparisons.count} comparisons. ` +
        `With ${left.rows.length} outer rows and ${right.rows.length} inner rows, we used ${comparisons.count}/${left.rows.length * right.rows.length} possible comparisons. ` +
        `The optimizer avoids this algorithm on large tables because it scales quadratically.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "nested-loop",
        outerIndex: left.rows.length,
        innerIndex: right.rows.length,
        comparisons: comparisons.count,
        matches: [...matches],
        phase: "Complete",
      }),
      operation: "complete",
    });

    return steps;
  }

  /**
   * Run the Sort-Merge Join algorithm.
   * Phase 1: Sort both tables by join key.
   * Phase 2: Walk through both sorted tables with two pointers,
   * advancing the pointer pointing to the smaller value.
   * Time complexity: O(n log n + m log m) for sorting + O(n + m) for merge.
   */
  sortMergeJoin(): JoinStep[] {
    const steps: JoinStep[] = [];
    const left = this.leftTable;
    const right = this.rightTable;
    const matches: JoinMatch[] = [];

    // Setup step
    steps.push({
      description:
        `Sort-Merge Join: first sort both tables by the join key, then merge with two pointers. ` +
        `Sorting costs O(n log n + m log m) = O(${left.rows.length} log ${left.rows.length} + ${right.rows.length} log ${right.rows.length}), ` +
        `then the merge pass is O(n + m) = O(${left.rows.length + right.rows.length}). Total is dominated by sorting.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "sort-merge",
        outerIndex: -1,
        innerIndex: -1,
        comparisons: 0,
        matches: [],
        phase: "Starting Sort-Merge Join",
      }),
      operation: "setup",
    });

    // Phase 1: Sort both tables
    // We need to track the original indices for match reporting
    const leftWithIdx = left.rows.map((r, i) => ({ row: r, origIdx: i }));
    const rightWithIdx = right.rows.map((r, i) => ({ row: r, origIdx: i }));

    const sortedLeft = [...leftWithIdx].sort(
      (a, b) => (a.row[this.leftJoinCol] as number) - (b.row[this.leftJoinCol] as number),
    );
    const sortedRight = [...rightWithIdx].sort(
      (a, b) => (a.row[this.rightJoinCol] as number) - (b.row[this.rightJoinCol] as number),
    );

    steps.push({
      description:
        `Sort Phase: sorted employees by dept_id: [${sortedLeft.map((e) => `${e.row.name}(${e.row[this.leftJoinCol]})`).join(", ")}]. ` +
        `Sorted departments by id: [${sortedRight.map((d) => `${d.row.name}(${d.row[this.rightJoinCol]})`).join(", ")}]. ` +
        `Both tables are now in ascending order of the join key, enabling the merge pass.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "sort-merge",
        outerIndex: -1,
        innerIndex: -1,
        comparisons: 0,
        matches: [],
        sortedLeft: sortedLeft.map((e) => cloneRow(e.row)),
        sortedRight: sortedRight.map((e) => cloneRow(e.row)),
        leftPointer: 0,
        rightPointer: 0,
        phase: "Sort complete, starting merge",
      }),
      operation: "sort",
    });

    // Phase 2: Merge with two pointers
    let lp = 0;
    let rp = 0;
    let comparisons = 0;

    while (lp < sortedLeft.length && rp < sortedRight.length) {
      const leftKey = sortedLeft[lp].row[this.leftJoinCol] as number;
      const rightKey = sortedRight[rp].row[this.rightJoinCol] as number;
      comparisons++;

      if (leftKey === rightKey) {
        // Found a match group. Scan for all rows with this key on both sides.
        const matchKey = leftKey;
        const leftStart = lp;
        const rightStart = rp;

        // Find all left rows with this key
        while (lp < sortedLeft.length && (sortedLeft[lp].row[this.leftJoinCol] as number) === matchKey) {
          lp++;
        }
        // Find all right rows with this key
        while (rp < sortedRight.length && (sortedRight[rp].row[this.rightJoinCol] as number) === matchKey) {
          rp++;
        }

        // Cross-product of matching groups
        for (let li = leftStart; li < lp; li++) {
          for (let ri = rightStart; ri < rp; ri++) {
            matches.push({
              leftRowIndex: sortedLeft[li].origIdx,
              rightRowIndex: sortedRight[ri].origIdx,
            });
          }
        }

        const leftNames = sortedLeft.slice(leftStart, lp).map((e) => e.row.name).join(", ");
        const rightNames = sortedRight.slice(rightStart, rp).map((e) => e.row.name).join(", ");

        steps.push({
          description:
            `MATCH GROUP at key=${matchKey}! Left pointer found employees [${leftNames}] with dept_id=${matchKey}, ` +
            `right pointer found department [${rightNames}] with id=${matchKey}. ` +
            `Produced ${(lp - leftStart) * (rp - rightStart)} join pair(s). Both pointers advance past this key.`,
          state: cloneState({
            leftTable: left,
            rightTable: right,
            algorithm: "sort-merge",
            outerIndex: leftStart,
            innerIndex: rightStart,
            comparisons,
            matches: [...matches],
            sortedLeft: sortedLeft.map((e) => cloneRow(e.row)),
            sortedRight: sortedRight.map((e) => cloneRow(e.row)),
            leftPointer: lp,
            rightPointer: rp,
            highlightLeft: leftStart,
            highlightRight: rightStart,
            isMatch: true,
            phase: `Match at key=${matchKey}`,
          }),
          operation: "match",
        });
      } else if (leftKey < rightKey) {
        steps.push({
          description:
            `Left key (${leftKey}) < right key (${rightKey}): employee "${sortedLeft[lp].row.name}" ` +
            `has dept_id=${leftKey} which is smaller than department id=${rightKey}. ` +
            `Advance the LEFT pointer because no more matches are possible for this left row in sorted order.`,
          state: cloneState({
            leftTable: left,
            rightTable: right,
            algorithm: "sort-merge",
            outerIndex: lp,
            innerIndex: rp,
            comparisons,
            matches: [...matches],
            sortedLeft: sortedLeft.map((e) => cloneRow(e.row)),
            sortedRight: sortedRight.map((e) => cloneRow(e.row)),
            leftPointer: lp + 1,
            rightPointer: rp,
            highlightLeft: lp,
            highlightRight: rp,
            isMatch: false,
            phase: `Left(${leftKey}) < Right(${rightKey})`,
          }),
          operation: "compare",
        });
        lp++;
      } else {
        steps.push({
          description:
            `Left key (${leftKey}) > right key (${rightKey}): department "${sortedRight[rp].row.name}" ` +
            `has id=${rightKey} which is smaller than employee dept_id=${leftKey}. ` +
            `Advance the RIGHT pointer because no more matches are possible for this right row in sorted order.`,
          state: cloneState({
            leftTable: left,
            rightTable: right,
            algorithm: "sort-merge",
            outerIndex: lp,
            innerIndex: rp,
            comparisons,
            matches: [...matches],
            sortedLeft: sortedLeft.map((e) => cloneRow(e.row)),
            sortedRight: sortedRight.map((e) => cloneRow(e.row)),
            leftPointer: lp,
            rightPointer: rp + 1,
            highlightLeft: lp,
            highlightRight: rp,
            isMatch: false,
            phase: `Left(${leftKey}) > Right(${rightKey})`,
          }),
          operation: "compare",
        });
        rp++;
      }
    }

    // Complete
    steps.push({
      description:
        `Sort-Merge Join complete! Found ${matches.length} matching pairs after sorting + ${comparisons} merge comparisons. ` +
        `The merge pass only needed ${comparisons} comparisons (vs ${left.rows.length * right.rows.length} for nested loop) ` +
        `because sorted order lets us skip non-matching rows. The optimizer chooses this when tables are already sorted or when an index provides order.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "sort-merge",
        outerIndex: sortedLeft.length,
        innerIndex: sortedRight.length,
        comparisons,
        matches: [...matches],
        sortedLeft: sortedLeft.map((e) => cloneRow(e.row)),
        sortedRight: sortedRight.map((e) => cloneRow(e.row)),
        leftPointer: lp,
        rightPointer: rp,
        phase: "Complete",
      }),
      operation: "complete",
    });

    return steps;
  }

  /**
   * Run the Hash Join algorithm.
   * Phase 1 (Build): Hash the smaller table (departments) into buckets.
   * Phase 2 (Probe): For each row in the larger table (employees),
   * hash the join key and look up the bucket.
   * Time complexity: O(n + m) -- linear!
   */
  hashJoin(): JoinStep[] {
    const steps: JoinStep[] = [];
    const left = this.leftTable; // larger table (employees)
    const right = this.rightTable; // smaller table (departments) -- build side
    const matches: JoinMatch[] = [];
    const hashMap = new Map<number, HashBucketEntry[]>();

    // Setup step
    steps.push({
      description:
        `Hash Join: two phases. Build phase: hash the smaller table (${right.name}, ${right.rows.length} rows) into a hash table on the join key. ` +
        `Probe phase: for each row in the larger table (${left.name}, ${left.rows.length} rows), compute hash and look up matching bucket. ` +
        `Total cost: O(n + m) = O(${left.rows.length + right.rows.length}) -- much faster than nested loop!`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "hash-join",
        outerIndex: -1,
        innerIndex: -1,
        comparisons: 0,
        matches: [],
        hashBuckets: [],
        hashPhase: "build",
        phase: "Starting Hash Join",
      }),
      operation: "setup",
    });

    // Phase 1: Build
    for (let j = 0; j < right.rows.length; j++) {
      const row = right.rows[j];
      const key = row[this.rightJoinCol] as number;

      if (!hashMap.has(key)) {
        hashMap.set(key, []);
      }
      hashMap.get(key)!.push({ key, rowIndex: j });

      const buckets = serializeHashMap(hashMap);

      steps.push({
        description:
          `Build Phase: hash department "${row.name}" (id=${key}) into bucket. ` +
          `hash(${key}) maps to bucket for key=${key}. ` +
          `Hash table now has ${hashMap.size} bucket(s) with ${countHashEntries(hashMap)} total entries. ` +
          `Building the hash table from the SMALLER table minimizes memory usage.`,
        state: cloneState({
          leftTable: left,
          rightTable: right,
          algorithm: "hash-join",
          outerIndex: -1,
          innerIndex: j,
          comparisons: 0,
          matches: [],
          hashBuckets: buckets,
          hashPhase: "build",
          highlightRight: j,
          phase: `Build: ${j + 1}/${right.rows.length}`,
        }),
        operation: "hash-build",
      });
    }

    // Phase 2: Probe
    let comparisons = 0;

    steps.push({
      description:
        `Build phase complete! Hash table has ${hashMap.size} buckets. ` +
        `Now entering probe phase: for each employee row, hash dept_id and check if the bucket contains a match.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "hash-join",
        outerIndex: -1,
        innerIndex: -1,
        comparisons: 0,
        matches: [],
        hashBuckets: serializeHashMap(hashMap),
        hashPhase: "probe",
        phase: "Probe phase starting",
      }),
      operation: "hash-probe",
    });

    for (let i = 0; i < left.rows.length; i++) {
      const row = left.rows[i];
      const key = row[this.leftJoinCol] as number;
      comparisons++;

      const bucket = hashMap.get(key);

      if (bucket && bucket.length > 0) {
        for (const entry of bucket) {
          matches.push({ leftRowIndex: i, rightRowIndex: entry.rowIndex });
        }

        const deptNames = bucket.map((e) => right.rows[e.rowIndex].name).join(", ");

        steps.push({
          description:
            `Probe: employee "${row.name}" has dept_id=${key}. hash(${key}) -> bucket found! ` +
            `Matches department(s): [${deptNames}]. Probe #${comparisons}: O(1) bucket lookup. ` +
            `This is why hash join is so fast -- each probe is constant time.`,
          state: cloneState({
            leftTable: left,
            rightTable: right,
            algorithm: "hash-join",
            outerIndex: i,
            innerIndex: bucket[0].rowIndex,
            comparisons,
            matches: [...matches],
            hashBuckets: serializeHashMap(hashMap),
            hashPhase: "probe",
            highlightLeft: i,
            highlightRight: bucket[0].rowIndex,
            isMatch: true,
            phase: `Probe: match for key=${key}`,
          }),
          operation: "match",
        });
      } else {
        steps.push({
          description:
            `Probe: employee "${row.name}" has dept_id=${key}. hash(${key}) -> empty bucket, no match. ` +
            `Probe #${comparisons}: O(1) lookup confirmed no department with id=${key} exists.`,
          state: cloneState({
            leftTable: left,
            rightTable: right,
            algorithm: "hash-join",
            outerIndex: i,
            innerIndex: -1,
            comparisons,
            matches: [...matches],
            hashBuckets: serializeHashMap(hashMap),
            hashPhase: "probe",
            highlightLeft: i,
            isMatch: false,
            phase: `Probe: no match for key=${key}`,
          }),
          operation: "hash-probe",
        });
      }
    }

    // Complete
    steps.push({
      description:
        `Hash Join complete! Found ${matches.length} matching pairs. ` +
        `Build phase: ${right.rows.length} insertions. Probe phase: ${comparisons} lookups. ` +
        `Total operations: ${right.rows.length + comparisons} (vs ${left.rows.length * right.rows.length} for nested loop). ` +
        `The optimizer prefers hash join for large equi-joins when there is enough memory for the hash table.`,
      state: cloneState({
        leftTable: left,
        rightTable: right,
        algorithm: "hash-join",
        outerIndex: left.rows.length,
        innerIndex: right.rows.length,
        comparisons,
        matches: [...matches],
        hashBuckets: serializeHashMap(hashMap),
        hashPhase: "done",
        phase: "Complete",
      }),
      operation: "complete",
    });

    return steps;
  }

  /**
   * Run the specified join algorithm.
   */
  runJoin(algorithm: JoinAlgorithm): JoinStep[] {
    switch (algorithm) {
      case "nested-loop":
        return this.nestedLoopJoin();
      case "sort-merge":
        return this.sortMergeJoin();
      case "hash-join":
        return this.hashJoin();
    }
  }

  /**
   * Return a snapshot of the initial state (empty, no algorithm chosen).
   */
  getState(): JoinState {
    return cloneState({
      leftTable: cloneTable(this.leftTable),
      rightTable: cloneTable(this.rightTable),
      algorithm: "nested-loop",
      outerIndex: -1,
      innerIndex: -1,
      comparisons: 0,
      matches: [],
      phase: "Ready",
    });
  }

  /**
   * Reset to initial state.
   */
  reset(): void {
    this.leftTable = {
      name: "employees",
      columns: ["id", "name", "dept_id"],
      rows: SAMPLE_EMPLOYEES.map(cloneRow),
    };
    this.rightTable = {
      name: "departments",
      columns: ["id", "name"],
      rows: SAMPLE_DEPARTMENTS.map(cloneRow),
    };
  }
}

// -- Helpers ------------------------------------------------------

function serializeHashMap(
  map: Map<number, HashBucketEntry[]>,
): Array<{ key: number; entries: HashBucketEntry[] }> {
  const result: Array<{ key: number; entries: HashBucketEntry[] }> = [];
  for (const [key, entries] of map) {
    result.push({ key, entries: entries.map((e) => ({ ...e })) });
  }
  return result;
}

function countHashEntries(map: Map<number, HashBucketEntry[]>): number {
  let count = 0;
  for (const entries of map.values()) {
    count += entries.length;
  }
  return count;
}
