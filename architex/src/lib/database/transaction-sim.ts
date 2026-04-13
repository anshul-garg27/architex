/**
 * Database Design Lab — Transaction Isolation Simulator (DBL-021 to DBL-022)
 *
 * Generates step-by-step demonstrations of each SQL isolation level,
 * showing what anomalies are possible at each level.
 */

import type { IsolationLevel } from "./types";

// ── Step Types ────────────────────────────────────────────────

export interface TransactionStep {
  tick: number;
  tx: "T1" | "T2";
  action: string;
  description: string;
  anomaly?: "dirty-read" | "non-repeatable-read" | "phantom-read" | "write-skew" | "lost-update";
}

// ── Comparison Types (DBL-046) ────────────────────────────────

export type CompareScenario = "dirty-read" | "phantom-read";

export interface CompareResult {
  leftLabel: string;
  rightLabel: string;
  leftLevel: IsolationLevel;
  rightLevel: IsolationLevel;
  left: TransactionStep[];
  right: TransactionStep[];
  /** Tick number(s) where the two timelines diverge */
  divergenceTicks: number[];
}

// ── Prediction Types (DBL-131) ────────────────────────────────

export interface PredictionPrompt {
  /** The tick right BEFORE the anomaly/critical step */
  beforeTick: number;
  question: string;
  options: { label: string; correct: boolean }[];
  explanation: string;
}

// ── Simulation Generators ─────────────────────────────────────

/**
 * Generate a step-by-step trace demonstrating the characteristic anomaly
 * (or absence thereof) for the given SQL isolation level. Each step
 * represents a discrete action by T1 or T2, with descriptions explaining
 * why the anomaly occurs at that isolation level.
 *
 * - Read Uncommitted  -> dirty read
 * - Read Committed    -> non-repeatable read
 * - Repeatable Read   -> phantom read
 * - Serializable      -> no anomalies (full locking demonstrated)
 *
 * @param level - The SQL isolation level to simulate
 * @returns Ordered array of {@link TransactionStep} objects. Steps with
 *   the `anomaly` field set mark the point where the anomaly manifests.
 *
 * @example
 * const steps = simulateIsolation("read-uncommitted");
 * const anomaly = steps.find(s => s.anomaly);
 * // anomaly?.anomaly === "dirty-read"
 */
export function simulateIsolation(level: IsolationLevel): TransactionStep[] {
  switch (level) {
    case "read-uncommitted":
      return simulateDirtyRead();
    case "read-committed":
      return simulateNonRepeatableRead();
    case "repeatable-read":
      return simulatePhantomRead();
    case "serializable":
      return simulateSerializable();
  }
}

// ── Read Uncommitted -> Dirty Read ────────────────────────────

function simulateDirtyRead(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts a transaction.",
    },
    {
      tick: 2,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts a transaction.",
    },
    {
      tick: 3,
      tx: "T1",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1",
      description: "T1 updates balance from 1000 to 500 (not yet committed).",
    },
    {
      tick: 4,
      tx: "T2",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 500",
      description:
        "T2 reads the uncommitted value 500. This is a DIRTY READ -- T2 sees data that may be rolled back.",
      anomaly: "dirty-read",
    },
    {
      tick: 5,
      tx: "T1",
      action: "ROLLBACK",
      description:
        "T1 rolls back. The balance reverts to 1000, but T2 already read 500.",
    },
    {
      tick: 6,
      tx: "T2",
      action: "COMMIT",
      description:
        "T2 commits, potentially using the stale value 500 for further logic.",
    },
  ];
}

// ── Read Committed -> Non-Repeatable Read ─────────────────────

function simulateNonRepeatableRead(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts a transaction.",
    },
    {
      tick: 2,
      tx: "T1",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 1000",
      description: "T1 reads balance = 1000.",
    },
    {
      tick: 3,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts a transaction.",
    },
    {
      tick: 4,
      tx: "T2",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1",
      description: "T2 updates balance to 500.",
    },
    {
      tick: 5,
      tx: "T2",
      action: "COMMIT",
      description: "T2 commits the update.",
    },
    {
      tick: 6,
      tx: "T1",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 500",
      description:
        "T1 re-reads the same row and gets 500 instead of 1000. This is a NON-REPEATABLE READ -- the same query returns different values within one transaction.",
      anomaly: "non-repeatable-read",
    },
    {
      tick: 7,
      tx: "T1",
      action: "COMMIT",
      description: "T1 commits.",
    },
  ];
}

// ── Repeatable Read -> Phantom Read ───────────────────────────

function simulatePhantomRead(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts a transaction.",
    },
    {
      tick: 2,
      tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 3",
      description: "T1 counts 3 pending orders.",
    },
    {
      tick: 3,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts a transaction.",
    },
    {
      tick: 4,
      tx: "T2",
      action: "INSERT INTO orders (id, status) VALUES (99, 'pending')",
      description: "T2 inserts a new pending order.",
    },
    {
      tick: 5,
      tx: "T2",
      action: "COMMIT",
      description: "T2 commits the insert.",
    },
    {
      tick: 6,
      tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 4",
      description:
        "T1 re-runs the same range query and now sees 4 rows. This is a PHANTOM READ -- new rows appeared in the result set within the same transaction.",
      anomaly: "phantom-read",
    },
    {
      tick: 7,
      tx: "T1",
      action: "COMMIT",
      description: "T1 commits.",
    },
  ];
}

// ── Serializable -> No Anomalies ──────────────────────────────

function simulateSerializable(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts a serializable transaction.",
    },
    {
      tick: 2,
      tx: "T1",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 1000",
      description:
        "T1 reads balance = 1000. A predicate lock is acquired on the row.",
    },
    {
      tick: 3,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts a serializable transaction.",
    },
    {
      tick: 4,
      tx: "T2",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1 -- BLOCKED",
      description:
        "T2 attempts to update the same row but is BLOCKED by T1's lock. The database enforces serial execution.",
    },
    {
      tick: 5,
      tx: "T1",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 1000",
      description:
        "T1 re-reads balance = 1000. The value is consistent -- no dirty, non-repeatable, or phantom reads.",
    },
    {
      tick: 6,
      tx: "T1",
      action: "COMMIT",
      description: "T1 commits, releasing its locks.",
    },
    {
      tick: 7,
      tx: "T2",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1 -- PROCEEDS",
      description:
        "T2 is unblocked and applies its update. The execution is equivalent to T1 then T2 serially.",
    },
    {
      tick: 8,
      tx: "T2",
      action: "COMMIT",
      description:
        "T2 commits. No anomalies occurred -- full serializability was maintained.",
    },
  ];
}

// ── Write Skew (DDIA Ch7) ────────────────────────────────────

/**
 * Simulate a write-skew anomaly (DDIA Ch7): two doctors both check the
 * on-call count, see 2 on-call, and each decide to go off-call. The
 * result: 0 doctors on call, violating the minimum-of-1 constraint.
 * Row-level locks cannot prevent this because each transaction writes
 * to a different row. Only SERIALIZABLE isolation prevents write skew.
 *
 * @returns Ordered steps showing T1 (Alice) and T2 (Bob) interleaving.
 *   The step with `anomaly: "write-skew"` marks the conflict point.
 */
export function simulateWriteSkew(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts (Doctor Alice checks if she can go off-call).",
    },
    {
      tick: 2,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts (Doctor Bob checks if he can go off-call).",
    },
    {
      tick: 3,
      tx: "T1",
      action: "SELECT COUNT(*) FROM doctors WHERE on_call = true -> 2",
      description:
        "T1 reads on-call count = 2. Alice sees 2 doctors on call, so going off-call should leave 1.",
    },
    {
      tick: 4,
      tx: "T2",
      action: "SELECT COUNT(*) FROM doctors WHERE on_call = true -> 2",
      description:
        "T2 reads on-call count = 2. Bob also sees 2 doctors on call, so going off-call should leave 1.",
    },
    {
      tick: 5,
      tx: "T1",
      action: "UPDATE doctors SET on_call = false WHERE id = 1",
      description:
        "T1 sets Alice (id=1) off-call. She believes 1 doctor will remain on call.",
    },
    {
      tick: 6,
      tx: "T2",
      action: "UPDATE doctors SET on_call = false WHERE id = 2",
      description:
        "T2 sets Bob (id=2) off-call. He believes 1 doctor will remain on call. This is a WRITE SKEW -- both transactions read the same predicate (count of on-call doctors) but wrote to DIFFERENT rows, so row-level locks don't help. Only SERIALIZABLE prevents this.",
      anomaly: "write-skew",
    },
    {
      tick: 7,
      tx: "T1",
      action: "COMMIT",
      description: "T1 commits. Alice is now off-call.",
    },
    {
      tick: 8,
      tx: "T2",
      action: "COMMIT",
      description:
        "T2 commits. Bob is now off-call. Result: 0 doctors on call! Both transactions made individually valid decisions, but the COMBINATION violates the minimum-of-1 constraint. Repeatable Read does NOT prevent write skew because no single row was modified by both transactions.",
    },
  ];
}

// ── Lost Update ──────────────────────────────────────────────

/**
 * Simulate a lost-update anomaly: two transactions read-modify-write the
 * same counter. Both read 100, both write 101. T1's increment is silently
 * lost -- the counter should be 102 but ends up at 101. Prevented by:
 * atomic increment (`SET counter = counter + 1`), SELECT ... FOR UPDATE,
 * or compare-and-set.
 *
 * @returns Ordered steps showing both transactions' read-modify-write cycle.
 *   The step with `anomaly: "lost-update"` marks where T2 overwrites T1.
 */
export function simulateLostUpdate(): TransactionStep[] {
  return [
    {
      tick: 1,
      tx: "T1",
      action: "BEGIN",
      description: "T1 starts (wants to increment the page-view counter).",
    },
    {
      tick: 2,
      tx: "T2",
      action: "BEGIN",
      description: "T2 starts (also wants to increment the page-view counter).",
    },
    {
      tick: 3,
      tx: "T1",
      action: "SELECT counter FROM stats WHERE id = 1 -> 100",
      description: "T1 reads counter = 100.",
    },
    {
      tick: 4,
      tx: "T2",
      action: "SELECT counter FROM stats WHERE id = 1 -> 100",
      description:
        "T2 also reads counter = 100. Both transactions now hold the same stale value.",
    },
    {
      tick: 5,
      tx: "T1",
      action: "UPDATE stats SET counter = 101 WHERE id = 1",
      description:
        "T1 writes counter = 100 + 1 = 101.",
    },
    {
      tick: 6,
      tx: "T2",
      action: "UPDATE stats SET counter = 101 WHERE id = 1",
      description:
        "T2 writes counter = 100 + 1 = 101. This is a LOST UPDATE -- T2 overwrites T1's increment because it computed its new value from the same stale read. The database did not detect the conflict.",
      anomaly: "lost-update",
    },
    {
      tick: 7,
      tx: "T1",
      action: "COMMIT",
      description: "T1 commits.",
    },
    {
      tick: 8,
      tx: "T2",
      action: "COMMIT",
      description:
        "T2 commits. Result: counter = 101, but it should be 102. T1's increment was silently LOST. Prevented by: atomic read-modify-write (UPDATE stats SET counter = counter + 1), explicit locking (SELECT ... FOR UPDATE), or compare-and-set.",
    },
  ];
}

// ── Comparison Scenarios (DBL-046) ───────────────────────────

/**
 * Compare dirty read scenario: same bank-transfer steps run at
 * READ UNCOMMITTED (shows dirty read) vs READ COMMITTED (prevents it).
 */
export function compareDirtyRead(): CompareResult {
  const left: TransactionStep[] = [
    { tick: 1, tx: "T1", action: "BEGIN", description: "T1 starts (READ UNCOMMITTED)." },
    { tick: 2, tx: "T2", action: "BEGIN", description: "T2 starts (READ UNCOMMITTED)." },
    {
      tick: 3, tx: "T1",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1",
      description: "T1 updates balance from 1000 to 500 (not yet committed).",
    },
    {
      tick: 4, tx: "T2",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 500",
      description: "T2 reads the UNCOMMITTED value 500. DIRTY READ -- T2 sees data that may be rolled back.",
      anomaly: "dirty-read",
    },
    { tick: 5, tx: "T1", action: "ROLLBACK", description: "T1 rolls back. Balance reverts to 1000, but T2 already used 500." },
    { tick: 6, tx: "T2", action: "COMMIT", description: "T2 commits with the stale dirty value." },
  ];

  const right: TransactionStep[] = [
    { tick: 1, tx: "T1", action: "BEGIN", description: "T1 starts (READ COMMITTED)." },
    { tick: 2, tx: "T2", action: "BEGIN", description: "T2 starts (READ COMMITTED)." },
    {
      tick: 3, tx: "T1",
      action: "UPDATE accounts SET balance = 500 WHERE id = 1",
      description: "T1 updates balance from 1000 to 500 (not yet committed).",
    },
    {
      tick: 4, tx: "T2",
      action: "SELECT balance FROM accounts WHERE id = 1 -> 1000",
      description: "T2 reads the LAST COMMITTED value 1000. The dirty write by T1 is invisible -- READ COMMITTED prevents dirty reads.",
    },
    { tick: 5, tx: "T1", action: "ROLLBACK", description: "T1 rolls back. Balance stays 1000 -- consistent with what T2 read." },
    { tick: 6, tx: "T2", action: "COMMIT", description: "T2 commits. It correctly used the committed value 1000." },
  ];

  return {
    leftLabel: "READ UNCOMMITTED",
    rightLabel: "READ COMMITTED",
    leftLevel: "read-uncommitted",
    rightLevel: "read-committed",
    left,
    right,
    divergenceTicks: [4],
  };
}

/**
 * Compare phantom read scenario: same range-query steps run at
 * REPEATABLE READ (shows phantom) vs SERIALIZABLE (prevents it).
 */
export function comparePhantomRead(): CompareResult {
  const left: TransactionStep[] = [
    { tick: 1, tx: "T1", action: "BEGIN", description: "T1 starts (REPEATABLE READ)." },
    {
      tick: 2, tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 3",
      description: "T1 counts 3 pending orders.",
    },
    { tick: 3, tx: "T2", action: "BEGIN", description: "T2 starts." },
    {
      tick: 4, tx: "T2",
      action: "INSERT INTO orders (id, status) VALUES (99, 'pending')",
      description: "T2 inserts a new pending order.",
    },
    { tick: 5, tx: "T2", action: "COMMIT", description: "T2 commits the insert." },
    {
      tick: 6, tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 4",
      description: "T1 re-runs the query and sees 4 rows. PHANTOM READ -- a new row appeared mid-transaction.",
      anomaly: "phantom-read",
    },
    { tick: 7, tx: "T1", action: "COMMIT", description: "T1 commits." },
  ];

  const right: TransactionStep[] = [
    { tick: 1, tx: "T1", action: "BEGIN", description: "T1 starts (SERIALIZABLE)." },
    {
      tick: 2, tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 3",
      description: "T1 counts 3 pending orders. A predicate lock covers the range.",
    },
    { tick: 3, tx: "T2", action: "BEGIN", description: "T2 starts." },
    {
      tick: 4, tx: "T2",
      action: "INSERT INTO orders (id, status) VALUES (99, 'pending') -- BLOCKED",
      description: "T2 attempts to insert but is BLOCKED by T1's predicate lock on status='pending'.",
    },
    {
      tick: 5, tx: "T1",
      action: "SELECT COUNT(*) FROM orders WHERE status = 'pending' -> 3",
      description: "T1 re-runs the query and still sees 3 rows. No phantom -- SERIALIZABLE prevents range changes.",
    },
    { tick: 6, tx: "T1", action: "COMMIT", description: "T1 commits, releasing the predicate lock." },
    {
      tick: 7, tx: "T2",
      action: "INSERT INTO orders (id, status) VALUES (99, 'pending') -- PROCEEDS",
      description: "T2 is unblocked and inserts successfully. Execution is equivalent to T1 then T2 serially.",
    },
  ];

  return {
    leftLabel: "REPEATABLE READ",
    rightLabel: "SERIALIZABLE",
    leftLevel: "repeatable-read",
    rightLevel: "serializable",
    left,
    right,
    divergenceTicks: [4, 5, 6],
  };
}

export function getCompareResult(scenario: CompareScenario): CompareResult {
  return scenario === "dirty-read" ? compareDirtyRead() : comparePhantomRead();
}

// ── Prediction Prompts (DBL-131) ─────────────────────────────

/**
 * Returns a prediction prompt for each isolation level's critical step.
 * The prompt fires BEFORE the anomaly step is revealed.
 */
export function getPredictionPrompt(level: IsolationLevel): PredictionPrompt {
  switch (level) {
    case "read-uncommitted":
      return {
        beforeTick: 4,
        question:
          "T1 updated balance to 500 but has NOT committed. At READ UNCOMMITTED, what does T2's SELECT return?",
        options: [
          { label: "500 (uncommitted value)", correct: true },
          { label: "1000 (last committed value)", correct: false },
        ],
        explanation:
          "Correct answer: 500. At READ UNCOMMITTED, transactions can read data written by other uncommitted transactions. This is called a DIRTY READ -- T2 sees T1's uncommitted write, which may later be rolled back.",
      };
    case "read-committed":
      return {
        beforeTick: 6,
        question:
          "T2 committed an update changing balance from 1000 to 500. T1 re-reads the same row. At READ COMMITTED, will T1 see the same value as its first read?",
        options: [
          { label: "Yes, T1 sees 1000 (same as first read)", correct: false },
          { label: "No, T1 sees 500 (T2's committed update)", correct: true },
        ],
        explanation:
          "Correct answer: No, T1 sees 500. At READ COMMITTED, each SELECT sees the latest committed data at the time it executes. Since T2 committed between T1's two reads, the value changed. This is a NON-REPEATABLE READ.",
      };
    case "repeatable-read":
      return {
        beforeTick: 6,
        question:
          "T2 inserted a new pending order and committed. T1 re-runs COUNT(*) WHERE status='pending'. At REPEATABLE READ, how many rows does T1 see?",
        options: [
          { label: "3 (same as the first count)", correct: false },
          { label: "4 (includes T2's new row)", correct: true },
        ],
        explanation:
          "Correct answer: 4. At REPEATABLE READ, existing rows stay stable, but NEW rows inserted by other committed transactions can appear in range queries. This is a PHANTOM READ. Only SERIALIZABLE prevents this by using predicate locks.",
      };
    case "serializable":
      return {
        beforeTick: 4,
        question:
          "T1 holds a predicate lock on the row. T2 tries to UPDATE the same row. At SERIALIZABLE, what happens to T2?",
        options: [
          { label: "T2's UPDATE succeeds immediately", correct: false },
          { label: "T2 is BLOCKED until T1 commits or rolls back", correct: true },
        ],
        explanation:
          "Correct answer: T2 is BLOCKED. At SERIALIZABLE, the database uses predicate locks to ensure transactions execute as if they ran one at a time. T2 must wait for T1 to finish before proceeding. This prevents ALL anomalies.",
      };
  }
}
