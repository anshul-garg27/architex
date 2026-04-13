/**
 * Database Design Lab — MVCC Visualization Engine (DBL-068)
 *
 * Interactive Multi-Version Concurrency Control (MVCC) visualization
 * showing how PostgreSQL-style snapshot isolation works. Instead of
 * locking rows, MVCC keeps multiple versions of each row. Each
 * transaction sees a consistent snapshot — as if the database was
 * frozen at the moment the transaction began.
 *
 * Records each operation as an MVCCStep for animated step-through.
 */

// ── Types ──────────────────────────────────────────────────────

export interface RowVersion {
  id: string;
  rowId: number;
  value: string;
  xmin: number; // Transaction that created this version
  xmax: number | null; // Transaction that deleted/updated this (null = alive)
}

export interface MVCCTransaction {
  txId: number;
  startTime: number;
  status: "active" | "committed" | "aborted";
}

export interface MVCCState {
  rows: RowVersion[];
  transactions: MVCCTransaction[];
  nextTxId: number;
  globalTime: number;
}

export interface MVCCStep {
  description: string;
  state: MVCCState;
  operation: "begin" | "read" | "write" | "commit" | "abort" | "snapshot";
  highlightTxId?: number;
  highlightRowId?: number;
  /** Which versions are visible to the highlighted transaction */
  visibleVersionIds?: string[];
}

// ── Deep-clone helper ──────────────────────────────────────────

function cloneState(state: MVCCState): MVCCState {
  return {
    rows: state.rows.map((r) => ({ ...r })),
    transactions: state.transactions.map((t) => ({ ...t })),
    nextTxId: state.nextTxId,
    globalTime: state.globalTime,
  };
}

// ── MVCCViz ────────────────────────────────────────────────────

/**
 * Interactive MVCC engine that records every operation as an
 * {@link MVCCStep} for step-by-step animated playback in the UI.
 *
 * Models PostgreSQL-style snapshot isolation: each transaction gets
 * a snapshot timestamp at BEGIN time, and can only see versions that
 * were committed before that snapshot.
 *
 * @example
 * const mvcc = new MVCCViz();
 * mvcc.seedRow(1, "Alice");
 * const steps = mvcc.runDemoScenario();
 * // steps show snapshot isolation in action
 */
export class MVCCViz {
  private state: MVCCState;
  private versionCounter = 0;

  constructor() {
    this.state = {
      rows: [],
      transactions: [],
      nextTxId: 1,
      globalTime: 0,
    };
  }

  /** Generate a unique version ID. */
  private nextVersionId(): string {
    return `v-${++this.versionCounter}`;
  }

  /** Seed an initial row version (created by "the system" at txId=0). */
  seedRow(rowId: number, value: string): void {
    this.state.rows.push({
      id: this.nextVersionId(),
      rowId,
      value,
      xmin: 0, // System-created
      xmax: null,
    });
  }

  /** Return a deep copy of the current state. */
  getState(): MVCCState {
    return cloneState(this.state);
  }

  /** Reset to empty state. */
  reset(): void {
    this.state = {
      rows: [],
      transactions: [],
      nextTxId: 1,
      globalTime: 0,
    };
    this.versionCounter = 0;
  }

  /**
   * Determine which row versions are visible to a transaction with
   * the given snapshot time. A version is visible if:
   * 1. Its creating transaction (xmin) committed before or at the snapshot time
   *    (or xmin is 0 = system-created)
   * 2. It has not been deleted/updated (xmax is null) OR the deleting
   *    transaction committed after the snapshot time
   */
  private getVisibleVersions(
    snapshotTime: number,
    rows: RowVersion[],
    transactions: MVCCTransaction[],
  ): RowVersion[] {
    const committedBefore = new Set<number>([0]); // txId 0 = system
    for (const tx of transactions) {
      if (tx.status === "committed" && tx.startTime <= snapshotTime) {
        committedBefore.add(tx.txId);
      }
    }

    return rows.filter((v) => {
      // Creator must be committed before snapshot
      if (!committedBefore.has(v.xmin)) return false;
      // If no deleter, version is alive
      if (v.xmax === null) return true;
      // If deleter committed before snapshot, version is dead to us
      if (committedBefore.has(v.xmax)) return false;
      // Deleter hasn't committed yet (from our snapshot's perspective) — version is still visible
      return true;
    });
  }

  /**
   * Get the version of a specific row visible to a transaction.
   */
  private getVisibleVersion(
    snapshotTime: number,
    rowId: number,
    rows: RowVersion[],
    transactions: MVCCTransaction[],
  ): RowVersion | null {
    const visible = this.getVisibleVersions(snapshotTime, rows, transactions);
    const forRow = visible.filter((v) => v.rowId === rowId);
    // Return the latest visible version (highest xmin)
    if (forRow.length === 0) return null;
    return forRow.reduce((a, b) => (a.xmin > b.xmin ? a : b));
  }

  // ── Operations ─────────────────────────────────────────────────

  /**
   * Begin a new transaction. The transaction gets a snapshot timestamp
   * equal to the current global time, freezing its view of the database.
   */
  beginTransaction(): MVCCStep {
    const txId = this.state.nextTxId++;
    this.state.globalTime++;
    const tx: MVCCTransaction = {
      txId,
      startTime: this.state.globalTime,
      status: "active",
    };
    this.state.transactions.push(tx);

    return {
      description: `T${txId} begins with snapshot at time ${tx.startTime}. From this moment on, T${txId} sees the database as it was at time ${tx.startTime} — any changes made by other transactions after this point are invisible to T${txId}.`,
      state: cloneState(this.state),
      operation: "begin",
      highlightTxId: txId,
    };
  }

  /**
   * Read a row as seen by a specific transaction's snapshot.
   * The key insight: the transaction only sees versions that were
   * committed before its snapshot time.
   */
  read(txId: number, rowId: number): MVCCStep {
    const tx = this.state.transactions.find((t) => t.txId === txId);
    if (!tx) {
      return {
        description: `Error: Transaction T${txId} does not exist.`,
        state: cloneState(this.state),
        operation: "read",
      };
    }

    const visibleVersion = this.getVisibleVersion(
      tx.startTime,
      rowId,
      this.state.rows,
      this.state.transactions,
    );

    const allVisible = this.getVisibleVersions(
      tx.startTime,
      this.state.rows,
      this.state.transactions,
    );
    const visibleIds = allVisible.map((v) => v.id);

    if (!visibleVersion) {
      return {
        description: `T${txId} reads row ${rowId} — no visible version exists. The row either doesn't exist or all versions were created after T${txId}'s snapshot at time ${tx.startTime}.`,
        state: cloneState(this.state),
        operation: "read",
        highlightTxId: txId,
        highlightRowId: rowId,
        visibleVersionIds: visibleIds,
      };
    }

    // Count how many versions of this row exist total
    const allVersions = this.state.rows.filter((v) => v.rowId === rowId);
    const hiddenCount = allVersions.length - 1;
    const hiddenNote =
      hiddenCount > 0
        ? ` (${hiddenCount} other version${hiddenCount > 1 ? "s" : ""} of this row exist but are invisible to T${txId}'s snapshot)`
        : "";

    return {
      description: `T${txId} reads row ${rowId} and sees "${visibleVersion.value}" (version created by T${visibleVersion.xmin}, xmin=${visibleVersion.xmin}). T${txId}'s snapshot is frozen at time ${tx.startTime}, so it only sees versions committed before that time.${hiddenNote}`,
      state: cloneState(this.state),
      operation: "read",
      highlightTxId: txId,
      highlightRowId: rowId,
      visibleVersionIds: visibleIds,
    };
  }

  /**
   * Write a new value for a row. MVCC never overwrites — it creates a
   * new version and marks the old version's xmax.
   */
  write(txId: number, rowId: number, newValue: string): MVCCStep {
    const tx = this.state.transactions.find((t) => t.txId === txId);
    if (!tx) {
      return {
        description: `Error: Transaction T${txId} does not exist.`,
        state: cloneState(this.state),
        operation: "write",
      };
    }

    // Find the current "live" version of this row (xmax === null)
    const liveVersion = this.state.rows.find(
      (v) => v.rowId === rowId && v.xmax === null,
    );

    if (liveVersion) {
      // Mark old version as superseded by this transaction
      liveVersion.xmax = txId;
    }

    // Create new version
    const newVersion: RowVersion = {
      id: this.nextVersionId(),
      rowId,
      value: newValue,
      xmin: txId,
      xmax: null,
    };
    this.state.rows.push(newVersion);

    const oldNote = liveVersion
      ? `The old version "${liveVersion.value}" (xmin=${liveVersion.xmin}) is marked with xmax=${txId} — it's not deleted, just superseded. Transactions with older snapshots can still see it.`
      : `No previous version existed, so this is the first version of row ${rowId}.`;

    return {
      description: `T${txId} writes row ${rowId} = "${newValue}". A NEW version is created (xmin=${txId}, xmax=null) instead of overwriting. ${oldNote}`,
      state: cloneState(this.state),
      operation: "write",
      highlightTxId: txId,
      highlightRowId: rowId,
    };
  }

  /**
   * Commit a transaction, making its changes visible to future transactions.
   */
  commit(txId: number): MVCCStep {
    const tx = this.state.transactions.find((t) => t.txId === txId);
    if (!tx) {
      return {
        description: `Error: Transaction T${txId} does not exist.`,
        state: cloneState(this.state),
        operation: "commit",
      };
    }

    tx.status = "committed";

    // Count how many versions this transaction created
    const createdVersions = this.state.rows.filter(
      (v) => v.xmin === txId,
    ).length;
    const supersededVersions = this.state.rows.filter(
      (v) => v.xmax === txId,
    ).length;

    return {
      description: `T${txId} commits. Its ${createdVersions} new version${createdVersions !== 1 ? "s" : ""} are now visible to any transaction that starts AFTER this commit. ${supersededVersions > 0 ? `The ${supersededVersions} old version${supersededVersions !== 1 ? "s" : ""} it superseded are now invisible to new transactions.` : ""} Existing transactions with earlier snapshots are NOT affected — they continue to see the database as it was when they began.`,
      state: cloneState(this.state),
      operation: "commit",
      highlightTxId: txId,
    };
  }

  /**
   * Abort a transaction, making its versions invisible to everyone.
   */
  abort(txId: number): MVCCStep {
    const tx = this.state.transactions.find((t) => t.txId === txId);
    if (!tx) {
      return {
        description: `Error: Transaction T${txId} does not exist.`,
        state: cloneState(this.state),
        operation: "abort",
      };
    }

    tx.status = "aborted";

    // Restore xmax on versions that this tx had marked
    for (const v of this.state.rows) {
      if (v.xmax === txId) {
        v.xmax = null;
      }
    }

    return {
      description: `T${txId} aborts. All versions created by T${txId} are now invisible (aborted transactions' writes are discarded). Any versions that T${txId} had marked for deletion are restored to their previous state.`,
      state: cloneState(this.state),
      operation: "abort",
      highlightTxId: txId,
    };
  }

  // ── Demo Scenario ──────────────────────────────────────────────

  /**
   * Run the prescribed demo scenario showing snapshot isolation:
   *
   * 1. T1 begins (snapshot at time 1)
   * 2. T2 begins (snapshot at time 2)
   * 3. T1 reads row 1 → sees "Alice"
   * 4. T2 writes row 1 → "Bob"
   * 5. T1 reads row 1 again → STILL sees "Alice" (snapshot isolation!)
   * 6. T2 commits
   * 7. T1 reads row 1 again → STILL sees "Alice" (frozen snapshot)
   * 8. T1 commits
   * 9. T3 begins → reads row 1 → sees "Bob"
   */
  runDemoScenario(): MVCCStep[] {
    this.reset();
    this.seedRow(1, "Alice");

    const steps: MVCCStep[] = [];

    // Initial state
    steps.push({
      description:
        "Initial state: Row 1 contains \"Alice\", created by the system (xmin=0, xmax=null). This is the only version — no transactions have modified it yet.",
      state: cloneState(this.state),
      operation: "snapshot",
      highlightRowId: 1,
    });

    // Step 1: T1 begins
    steps.push(this.beginTransaction()); // T1, snapshot at time 1

    // Step 2: T2 begins
    steps.push(this.beginTransaction()); // T2, snapshot at time 2

    // Step 3: T1 reads row 1
    steps.push(this.read(1, 1)); // T1 sees "Alice"

    // Step 4: T2 writes row 1
    steps.push(this.write(2, 1, "Bob")); // T2 creates new version

    // Step 5: T1 reads row 1 AGAIN — snapshot isolation!
    const step5 = this.read(1, 1);
    step5.description = `SNAPSHOT ISOLATION IN ACTION: T1 reads row 1 again and STILL sees "Alice"! Even though T2 just wrote "Bob", T1's snapshot is frozen at time 1 — T2's uncommitted write is completely invisible. This is the core guarantee of MVCC: each transaction sees a consistent, immutable snapshot.`;
    steps.push(step5);

    // Step 6: T2 commits
    steps.push(this.commit(2));

    // Step 7: T1 reads row 1 AGAIN — still sees Alice even after T2 committed
    const step7 = this.read(1, 1);
    step7.description = `T1 reads row 1 AGAIN — still sees "Alice"! Even though T2 has now COMMITTED "Bob", T1's snapshot remains frozen at time 1. This is different from Read Committed isolation, where T1 would see the committed "Bob". Snapshot isolation prevents non-repeatable reads by design.`;
    steps.push(step7);

    // Step 8: T1 commits
    steps.push(this.commit(1));

    // Step 9: T3 begins and reads
    steps.push(this.beginTransaction()); // T3, snapshot at time 3+
    const step9 = this.read(3, 1);
    step9.description = `T3 begins AFTER T2's commit, so its snapshot includes T2's changes. T3 reads row 1 and sees "Bob" — the version committed by T2. The old "Alice" version (xmin=0, xmax=2) is invisible because T2's commit happened before T3's snapshot. This demonstrates how MVCC allows concurrent readers and writers without blocking.`;
    steps.push(step9);

    return steps;
  }
}
