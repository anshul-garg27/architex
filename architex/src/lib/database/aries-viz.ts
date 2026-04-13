/**
 * Database Design Lab — ARIES Recovery Visualization (DBL-091)
 *
 * Interactive ARIES (Algorithm for Recovery and Isolation Exploiting
 * Semantics) recovery protocol visualization showing the 3 phases:
 *   1. ANALYSIS — scan WAL from last checkpoint, rebuild dirty page
 *      table + transaction table
 *   2. REDO — replay ALL logged operations from the earliest dirty
 *      page recLSN forward (even uncommitted ones)
 *   3. UNDO — roll back uncommitted transactions by writing
 *      compensation log records (CLRs)
 *
 * Records each operation as an ARIESStep for animated step-through.
 */

// ── Types ──────────────────────────────────────────────────────

export type WALEntryType =
  | "UPDATE"
  | "COMMIT"
  | "BEGIN"
  | "CHECKPOINT"
  | "CLR"
  | "ABORT";

export interface WALEntry {
  lsn: number;
  txId: string;
  type: WALEntryType;
  pageId?: string;
  /** For CLR entries, the LSN being compensated. */
  undoNextLSN?: number;
  description: string;
}

export interface DirtyPageEntry {
  pageId: string;
  /** The first LSN that made this page dirty (recovery starts redo from here). */
  recLSN: number;
}

export interface TransactionTableEntry {
  txId: string;
  status: "active" | "committed" | "aborted";
  lastLSN: number;
}

export interface DiskPage {
  pageId: string;
  /** Whether the page has been flushed to disk. */
  flushedToLSN: number;
  /** Current value on disk (simplified). */
  value: string;
}

export type RecoveryPhase = "normal" | "crash" | "analysis" | "redo" | "undo" | "complete";

export interface ARIESState {
  wal: WALEntry[];
  dirtyPageTable: DirtyPageEntry[];
  transactionTable: TransactionTableEntry[];
  diskPages: DiskPage[];
  checkpointLSN: number | null;
  phase: RecoveryPhase;
  /** During redo/undo, which LSN is currently being processed. */
  currentLSN: number | null;
  /** During undo, which transaction is being rolled back. */
  undoTxId: string | null;
}

export interface ARIESStep {
  description: string;
  state: ARIESState;
  phase: RecoveryPhase;
  /** Which WAL entry LSN to highlight. */
  highlightLSN?: number;
  /** Which page to highlight. */
  highlightPage?: string;
  /** Which transaction to highlight. */
  highlightTx?: string;
  /** Is this a "crash" moment? */
  isCrash?: boolean;
}

// ── Deep-clone helper ──────────────────────────────────────────

function cloneState(state: ARIESState): ARIESState {
  return {
    wal: state.wal.map((e) => ({ ...e })),
    dirtyPageTable: state.dirtyPageTable.map((e) => ({ ...e })),
    transactionTable: state.transactionTable.map((e) => ({ ...e })),
    diskPages: state.diskPages.map((e) => ({ ...e })),
    checkpointLSN: state.checkpointLSN,
    phase: state.phase,
    currentLSN: state.currentLSN,
    undoTxId: state.undoTxId,
  };
}

// ── ARIESViz ──────────────────────────────────────────────────

/**
 * Interactive ARIES recovery engine that records every operation as
 * an {@link ARIESStep} for step-by-step animated playback in the UI.
 *
 * Models the standard ARIES recovery protocol: normal operations
 * build up a WAL, a crash wipes in-memory state, and recovery
 * proceeds through Analysis -> Redo -> Undo.
 *
 * @example
 * const aries = new ARIESViz();
 * const steps = aries.runDemoScenario();
 * // steps show the full crash + 3-phase recovery
 */
export class ARIESViz {
  private state: ARIESState;

  constructor() {
    this.state = {
      wal: [],
      dirtyPageTable: [],
      transactionTable: [],
      diskPages: [
        { pageId: "P1", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P2", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P3", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P4", flushedToLSN: 0, value: "(empty)" },
      ],
      checkpointLSN: null,
      phase: "normal",
      currentLSN: null,
      undoTxId: null,
    };
  }

  /** Return a deep copy of the current state. */
  getState(): ARIESState {
    return cloneState(this.state);
  }

  /** Reset to empty state. */
  reset(): void {
    this.state = {
      wal: [],
      dirtyPageTable: [],
      transactionTable: [],
      diskPages: [
        { pageId: "P1", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P2", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P3", flushedToLSN: 0, value: "(empty)" },
        { pageId: "P4", flushedToLSN: 0, value: "(empty)" },
      ],
      checkpointLSN: null,
      phase: "normal",
      currentLSN: null,
      undoTxId: null,
    };
  }

  /**
   * Run the prescribed ARIES demo scenario:
   *
   * NORMAL OPERATIONS:
   * 1. T1 begins, writes P1 (LSN=1)
   * 2. T2 begins, writes P2 (LSN=2)
   * 3. CHECKPOINT at LSN=3
   * 4. T1 writes P3 (LSN=4)
   * 5. T2 commits (LSN=5)
   * 6. T1 writes P4 (LSN=6)
   * 7. CRASH!
   *
   * RECOVERY:
   * 8.  Analysis phase — scan WAL from checkpoint
   * 9.  Redo phase — replay from earliest recLSN
   * 10. Undo phase — roll back T1's uncommitted writes
   */
  runDemoScenario(): ARIESStep[] {
    this.reset();
    const steps: ARIESStep[] = [];

    // ── Initial state ───────────────────────────────────────
    steps.push({
      description:
        "Initial state: 4 empty disk pages (P1-P4), empty WAL, no active transactions. " +
        "We will simulate normal database operations, a crash, and ARIES 3-phase recovery.",
      state: cloneState(this.state),
      phase: "normal",
    });

    // ── Step 1: T1 begins and writes P1 ────────────────────
    const walEntry1: WALEntry = {
      lsn: 1,
      txId: "T1",
      type: "UPDATE",
      pageId: "P1",
      description: "T1 writes page P1",
    };
    this.state.wal.push(walEntry1);
    this.state.transactionTable.push({ txId: "T1", status: "active", lastLSN: 1 });
    this.state.dirtyPageTable.push({ pageId: "P1", recLSN: 1 });
    // In-memory page is dirty (not yet flushed)
    const p1 = this.state.diskPages.find((p) => p.pageId === "P1")!;
    p1.value = "T1-write-1";

    steps.push({
      description:
        "T1 begins and writes page P1. WAL entry logged: LSN=1, T1, UPDATE P1. " +
        "The dirty page table now tracks P1 with recLSN=1 (the first LSN that dirtied it). " +
        "The transaction table records T1 as active with lastLSN=1.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 1,
      highlightPage: "P1",
      highlightTx: "T1",
    });

    // ── Step 2: T2 begins and writes P2 ────────────────────
    const walEntry2: WALEntry = {
      lsn: 2,
      txId: "T2",
      type: "UPDATE",
      pageId: "P2",
      description: "T2 writes page P2",
    };
    this.state.wal.push(walEntry2);
    this.state.transactionTable.push({ txId: "T2", status: "active", lastLSN: 2 });
    this.state.dirtyPageTable.push({ pageId: "P2", recLSN: 2 });
    const p2 = this.state.diskPages.find((p) => p.pageId === "P2")!;
    p2.value = "T2-write-1";

    steps.push({
      description:
        "T2 begins and writes page P2. WAL entry logged: LSN=2, T2, UPDATE P2. " +
        "P2 enters the dirty page table with recLSN=2. Transaction table now has both T1 and T2 active.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 2,
      highlightPage: "P2",
      highlightTx: "T2",
    });

    // ── Step 3: CHECKPOINT ─────────────────────────────────
    const walEntry3: WALEntry = {
      lsn: 3,
      txId: "-",
      type: "CHECKPOINT",
      description: "Checkpoint: saves dirty page table + transaction table to WAL",
    };
    this.state.wal.push(walEntry3);
    this.state.checkpointLSN = 3;
    // Flush P1 and P2 to disk at checkpoint
    p1.flushedToLSN = 1;
    p2.flushedToLSN = 2;

    steps.push({
      description:
        "CHECKPOINT taken at LSN=3. The checkpoint writes the current dirty page table " +
        "(P1 recLSN=1, P2 recLSN=2) and transaction table (T1 active, T2 active) to the WAL. " +
        "Pages P1 and P2 are flushed to disk. During recovery, analysis starts scanning from this checkpoint " +
        "instead of the beginning of the WAL — this is what makes ARIES practical for large databases.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 3,
    });

    // ── Step 4: T1 writes P3 ──────────────────────────────
    const walEntry4: WALEntry = {
      lsn: 4,
      txId: "T1",
      type: "UPDATE",
      pageId: "P3",
      description: "T1 writes page P3",
    };
    this.state.wal.push(walEntry4);
    this.state.transactionTable.find((t) => t.txId === "T1")!.lastLSN = 4;
    this.state.dirtyPageTable.push({ pageId: "P3", recLSN: 4 });
    const p3 = this.state.diskPages.find((p) => p.pageId === "P3")!;
    p3.value = "T1-write-2";

    steps.push({
      description:
        "T1 writes page P3 (after checkpoint). WAL entry: LSN=4, T1, UPDATE P3. " +
        "P3 enters dirty page table with recLSN=4. T1's lastLSN updates to 4. " +
        "This write happened AFTER the checkpoint, so it is NOT reflected in the checkpoint's snapshot.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 4,
      highlightPage: "P3",
      highlightTx: "T1",
    });

    // ── Step 5: T2 commits ────────────────────────────────
    const walEntry5: WALEntry = {
      lsn: 5,
      txId: "T2",
      type: "COMMIT",
      description: "T2 commits",
    };
    this.state.wal.push(walEntry5);
    this.state.transactionTable.find((t) => t.txId === "T2")!.status = "committed";
    this.state.transactionTable.find((t) => t.txId === "T2")!.lastLSN = 5;

    steps.push({
      description:
        "T2 commits. WAL entry: LSN=5, T2, COMMIT. The commit record is written to WAL " +
        "and flushed to disk — this guarantees T2's changes survive any crash. " +
        "T2's status in the transaction table changes to 'committed'. " +
        "P2's data (written by T2) must be preserved during recovery.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 5,
      highlightTx: "T2",
    });

    // ── Step 6: T1 writes P4 ──────────────────────────────
    const walEntry6: WALEntry = {
      lsn: 6,
      txId: "T1",
      type: "UPDATE",
      pageId: "P4",
      description: "T1 writes page P4",
    };
    this.state.wal.push(walEntry6);
    this.state.transactionTable.find((t) => t.txId === "T1")!.lastLSN = 6;
    this.state.dirtyPageTable.push({ pageId: "P4", recLSN: 6 });
    const p4 = this.state.diskPages.find((p) => p.pageId === "P4")!;
    p4.value = "T1-write-3";

    steps.push({
      description:
        "T1 writes page P4. WAL entry: LSN=6, T1, UPDATE P4. " +
        "T1 now has 3 uncommitted writes (P1, P3, P4). T1 has NOT committed. " +
        "P4 enters dirty page table with recLSN=6.",
      state: cloneState(this.state),
      phase: "normal",
      highlightLSN: 6,
      highlightPage: "P4",
      highlightTx: "T1",
    });

    // ── Step 7: CRASH! ────────────────────────────────────
    // On crash, in-memory state is lost. Only WAL on disk survives.
    // We simulate this by clearing the in-memory dirty page table and
    // transaction table, and marking pages as potentially inconsistent.
    const preCrashState = cloneState(this.state);
    this.state.phase = "crash";
    // In-memory tables are lost
    this.state.dirtyPageTable = [];
    this.state.transactionTable = [];
    this.state.currentLSN = null;
    // Pages P3, P4 may not have been flushed (post-checkpoint writes)
    // P1, P2 were flushed at checkpoint
    const diskP3 = this.state.diskPages.find((p) => p.pageId === "P3")!;
    diskP3.value = "(unknown)";
    diskP3.flushedToLSN = 0;
    const diskP4 = this.state.diskPages.find((p) => p.pageId === "P4")!;
    diskP4.value = "(unknown)";
    diskP4.flushedToLSN = 0;

    steps.push({
      description:
        "CRASH! The system fails. All in-memory state is lost: the dirty page table and " +
        "transaction table are gone. Pages P3 and P4 may not have been flushed to disk " +
        "(they were modified after the checkpoint). The WAL on disk is our only lifeline. " +
        "T1 was active (uncommitted), T2 was committed. ARIES recovery must: " +
        "(1) figure out what happened, (2) ensure T2's committed data survives, " +
        "(3) undo T1's uncommitted changes.",
      state: cloneState(this.state),
      phase: "crash",
      isCrash: true,
    });

    // ── RECOVERY PHASE 1: ANALYSIS ─────────────────────────
    this.state.phase = "analysis";

    // Step 8a: Start analysis from checkpoint
    steps.push({
      description:
        "RECOVERY PHASE 1 — ANALYSIS: Starting from the last checkpoint (LSN=3). " +
        "The goal is to reconstruct the dirty page table and transaction table by " +
        "scanning the WAL forward from the checkpoint. " +
        "We load the checkpoint's snapshot: dirty pages {P1 recLSN=1, P2 recLSN=2}, " +
        "active transactions {T1, T2}.",
      state: cloneState(this.state),
      phase: "analysis",
      highlightLSN: 3,
    });

    // Step 8b: Rebuild from checkpoint snapshot
    this.state.dirtyPageTable = [
      { pageId: "P1", recLSN: 1 },
      { pageId: "P2", recLSN: 2 },
    ];
    this.state.transactionTable = [
      { txId: "T1", status: "active", lastLSN: 1 },
      { txId: "T2", status: "active", lastLSN: 2 },
    ];

    steps.push({
      description:
        "Loaded checkpoint snapshot into memory: Dirty Page Table has P1 (recLSN=1) " +
        "and P2 (recLSN=2). Transaction Table has T1 (active, lastLSN=1) " +
        "and T2 (active, lastLSN=2). Now we scan WAL entries after the checkpoint...",
      state: cloneState(this.state),
      phase: "analysis",
      highlightLSN: 3,
    });

    // Step 8c: Scan LSN=4 (T1 UPDATE P3)
    this.state.currentLSN = 4;
    this.state.dirtyPageTable.push({ pageId: "P3", recLSN: 4 });
    this.state.transactionTable.find((t) => t.txId === "T1")!.lastLSN = 4;

    steps.push({
      description:
        "Analysis scans LSN=4: T1 UPDATE P3. P3 is added to dirty page table with " +
        "recLSN=4. T1's lastLSN updated to 4. P3 was modified after checkpoint, " +
        "so we don't know if it reached disk.",
      state: cloneState(this.state),
      phase: "analysis",
      highlightLSN: 4,
      highlightPage: "P3",
      highlightTx: "T1",
    });

    // Step 8d: Scan LSN=5 (T2 COMMIT)
    this.state.currentLSN = 5;
    this.state.transactionTable.find((t) => t.txId === "T2")!.status = "committed";
    this.state.transactionTable.find((t) => t.txId === "T2")!.lastLSN = 5;

    steps.push({
      description:
        "Analysis scans LSN=5: T2 COMMIT. T2 is marked as committed in the transaction table. " +
        "This means T2's changes MUST survive recovery (durability guarantee). " +
        "T2's lastLSN updated to 5.",
      state: cloneState(this.state),
      phase: "analysis",
      highlightLSN: 5,
      highlightTx: "T2",
    });

    // Step 8e: Scan LSN=6 (T1 UPDATE P4)
    this.state.currentLSN = 6;
    this.state.dirtyPageTable.push({ pageId: "P4", recLSN: 6 });
    this.state.transactionTable.find((t) => t.txId === "T1")!.lastLSN = 6;

    steps.push({
      description:
        "Analysis scans LSN=6: T1 UPDATE P4. P4 is added to dirty page table with " +
        "recLSN=6. T1's lastLSN updated to 6. T1 is still active (no COMMIT record found). " +
        "End of WAL reached.",
      state: cloneState(this.state),
      phase: "analysis",
      highlightLSN: 6,
      highlightPage: "P4",
      highlightTx: "T1",
    });

    // Step 8f: Analysis conclusion
    steps.push({
      description:
        "ANALYSIS COMPLETE. Results: " +
        "Dirty Page Table: {P1 recLSN=1, P2 recLSN=2, P3 recLSN=4, P4 recLSN=6}. " +
        "Transaction Table: T1=ACTIVE (needs undo), T2=COMMITTED (changes must survive). " +
        "The earliest recLSN is 1, so redo must start from LSN=1. " +
        "Analysis finds what's dirty.",
      state: cloneState(this.state),
      phase: "analysis",
    });

    // ── RECOVERY PHASE 2: REDO ─────────────────────────────
    this.state.phase = "redo";

    steps.push({
      description:
        "RECOVERY PHASE 2 — REDO: Replay ALL operations from the earliest dirty page " +
        "recLSN (LSN=1) forward. We redo EVERYTHING — even uncommitted T1's writes — " +
        "because we don't know which pages made it to disk before the crash. " +
        "Redo ensures durability: committed data is definitely on disk after this phase.",
      state: cloneState(this.state),
      phase: "redo",
    });

    // Step 9a: Redo LSN=1 (T1 UPDATE P1)
    this.state.currentLSN = 1;
    const rdP1 = this.state.diskPages.find((p) => p.pageId === "P1")!;
    rdP1.value = "T1-write-1";
    rdP1.flushedToLSN = 1;

    steps.push({
      description:
        "Redo LSN=1: T1 UPDATE P1. Re-applying T1's write to P1. " +
        "Even though P1 was flushed at the checkpoint, we redo it anyway " +
        "because ARIES uses a 'repeating history' approach — it's simpler and " +
        "handles edge cases correctly.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 1,
      highlightPage: "P1",
      highlightTx: "T1",
    });

    // Step 9b: Redo LSN=2 (T2 UPDATE P2)
    this.state.currentLSN = 2;
    const rdP2 = this.state.diskPages.find((p) => p.pageId === "P2")!;
    rdP2.value = "T2-write-1";
    rdP2.flushedToLSN = 2;

    steps.push({
      description:
        "Redo LSN=2: T2 UPDATE P2. Re-applying T2's write to P2. " +
        "T2 committed, so this data MUST survive. Redo guarantees it.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 2,
      highlightPage: "P2",
      highlightTx: "T2",
    });

    // Step 9c: Skip LSN=3 (CHECKPOINT — not an operation to redo)
    this.state.currentLSN = 3;
    steps.push({
      description:
        "Redo LSN=3: CHECKPOINT — not a data operation, nothing to redo. " +
        "Checkpoints are metadata records, not data modifications.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 3,
    });

    // Step 9d: Redo LSN=4 (T1 UPDATE P3)
    this.state.currentLSN = 4;
    const rdP3 = this.state.diskPages.find((p) => p.pageId === "P3")!;
    rdP3.value = "T1-write-2";
    rdP3.flushedToLSN = 4;

    steps.push({
      description:
        "Redo LSN=4: T1 UPDATE P3. Re-applying T1's write to P3. " +
        "Even though T1 is uncommitted, we redo it. Why? Because ARIES " +
        "'repeats history' — it brings the database to the exact state it was " +
        "in at the moment of the crash. Undo phase will handle rolling it back.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 4,
      highlightPage: "P3",
      highlightTx: "T1",
    });

    // Step 9e: Skip LSN=5 (COMMIT — not a data operation)
    this.state.currentLSN = 5;
    steps.push({
      description:
        "Redo LSN=5: T2 COMMIT — not a data operation, nothing to redo. " +
        "The commit is already recorded in the WAL.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 5,
      highlightTx: "T2",
    });

    // Step 9f: Redo LSN=6 (T1 UPDATE P4)
    this.state.currentLSN = 6;
    const rdP4 = this.state.diskPages.find((p) => p.pageId === "P4")!;
    rdP4.value = "T1-write-3";
    rdP4.flushedToLSN = 6;

    steps.push({
      description:
        "Redo LSN=6: T1 UPDATE P4. Re-applying T1's write to P4. " +
        "This is T1's last uncommitted write. After redo, the database is in " +
        "the exact state it was at the crash. Now we need to undo T1's changes.",
      state: cloneState(this.state),
      phase: "redo",
      highlightLSN: 6,
      highlightPage: "P4",
      highlightTx: "T1",
    });

    steps.push({
      description:
        "REDO COMPLETE. All WAL entries have been replayed. The database is now " +
        "in the exact state it was at the moment of the crash. " +
        "T2's committed writes (P2) are safely on disk. " +
        "T1's uncommitted writes (P1, P3, P4) are also on disk — but T1 never committed, " +
        "so we must undo them next to ensure atomicity. " +
        "Redo ensures durability.",
      state: cloneState(this.state),
      phase: "redo",
    });

    // ── RECOVERY PHASE 3: UNDO ─────────────────────────────
    this.state.phase = "undo";
    this.state.undoTxId = "T1";

    steps.push({
      description:
        "RECOVERY PHASE 3 — UNDO: Roll back all uncommitted transactions. " +
        "T1 is the only active (uncommitted) transaction. We traverse T1's WAL entries " +
        "in REVERSE order (LSN=6, then 4, then 1) and write Compensation Log Records (CLRs) " +
        "to undo each operation. CLRs ensure that if we crash AGAIN during recovery, " +
        "we don't redo work that was already undone. " +
        "Undo ensures atomicity.",
      state: cloneState(this.state),
      phase: "undo",
      highlightTx: "T1",
    });

    // Step 10a: Undo LSN=6 (T1 UPDATE P4) — write CLR
    this.state.currentLSN = 6;
    const clr1: WALEntry = {
      lsn: 7,
      txId: "T1",
      type: "CLR",
      pageId: "P4",
      undoNextLSN: 4,
      description: "CLR: undo T1's write to P4 (compensates LSN=6)",
    };
    this.state.wal.push(clr1);
    const undoP4 = this.state.diskPages.find((p) => p.pageId === "P4")!;
    undoP4.value = "(empty)";
    undoP4.flushedToLSN = 7;
    // Remove P4 from dirty page table
    this.state.dirtyPageTable = this.state.dirtyPageTable.filter(
      (d) => d.pageId !== "P4",
    );

    steps.push({
      description:
        "Undo LSN=6: Reversing T1's write to P4. A Compensation Log Record (CLR) is " +
        "written at LSN=7 with undoNextLSN=4 (pointing to T1's previous operation). " +
        "P4 is restored to its original state. The CLR ensures idempotent recovery — " +
        "if we crash again, we won't try to undo this operation twice.",
      state: cloneState(this.state),
      phase: "undo",
      highlightLSN: 7,
      highlightPage: "P4",
      highlightTx: "T1",
    });

    // Step 10b: Undo LSN=4 (T1 UPDATE P3) — write CLR
    this.state.currentLSN = 4;
    const clr2: WALEntry = {
      lsn: 8,
      txId: "T1",
      type: "CLR",
      pageId: "P3",
      undoNextLSN: 1,
      description: "CLR: undo T1's write to P3 (compensates LSN=4)",
    };
    this.state.wal.push(clr2);
    const undoP3 = this.state.diskPages.find((p) => p.pageId === "P3")!;
    undoP3.value = "(empty)";
    undoP3.flushedToLSN = 8;
    this.state.dirtyPageTable = this.state.dirtyPageTable.filter(
      (d) => d.pageId !== "P3",
    );

    steps.push({
      description:
        "Undo LSN=4: Reversing T1's write to P3. CLR written at LSN=8 with " +
        "undoNextLSN=1. P3 restored to original state. Following the chain of " +
        "T1's operations backwards through the WAL.",
      state: cloneState(this.state),
      phase: "undo",
      highlightLSN: 8,
      highlightPage: "P3",
      highlightTx: "T1",
    });

    // Step 10c: Undo LSN=1 (T1 UPDATE P1) — write CLR
    this.state.currentLSN = 1;
    const clr3: WALEntry = {
      lsn: 9,
      txId: "T1",
      type: "CLR",
      pageId: "P1",
      undoNextLSN: 0,
      description: "CLR: undo T1's write to P1 (compensates LSN=1)",
    };
    this.state.wal.push(clr3);
    const undoP1 = this.state.diskPages.find((p) => p.pageId === "P1")!;
    undoP1.value = "(empty)";
    undoP1.flushedToLSN = 9;
    this.state.dirtyPageTable = this.state.dirtyPageTable.filter(
      (d) => d.pageId !== "P1",
    );

    // Mark T1 as aborted
    this.state.transactionTable.find((t) => t.txId === "T1")!.status = "aborted";
    this.state.transactionTable.find((t) => t.txId === "T1")!.lastLSN = 9;

    // Write abort record
    const abortEntry: WALEntry = {
      lsn: 10,
      txId: "T1",
      type: "ABORT",
      description: "T1 abort record — undo complete",
    };
    this.state.wal.push(abortEntry);

    steps.push({
      description:
        "Undo LSN=1: Reversing T1's write to P1. CLR at LSN=9, undoNextLSN=0 (no more " +
        "operations to undo). P1 restored. An ABORT record is written at LSN=10. " +
        "T1's status changes to 'aborted'. All of T1's uncommitted changes have been rolled back.",
      state: cloneState(this.state),
      phase: "undo",
      highlightLSN: 9,
      highlightPage: "P1",
      highlightTx: "T1",
    });

    // ── Recovery Complete ──────────────────────────────────
    this.state.phase = "complete";
    this.state.currentLSN = null;
    this.state.undoTxId = null;

    steps.push({
      description:
        "RECOVERY COMPLETE! The database is now consistent. " +
        "T2's committed write to P2 survived (durability). " +
        "T1's uncommitted writes to P1, P3, P4 were undone (atomicity). " +
        "Summary: Analysis finds what's dirty. Redo ensures durability. Undo ensures atomicity. " +
        "This is ARIES — the standard recovery protocol used by PostgreSQL, MySQL, Oracle, " +
        "SQL Server, and virtually every modern database.",
      state: cloneState(this.state),
      phase: "complete",
    });

    return steps;
  }
}
