// ── Transaction API ─────────────────────────────────────────
// Batches multiple changes into a single undo snapshot.

import { UndoManager } from "./undo-manager";

export class TransactionManager<T> {
  private manager: UndoManager<T>;
  private inTransaction = false;
  private preTransactionSnapshot: T | null = null;

  constructor(manager: UndoManager<T>) {
    this.manager = manager;
  }

  /** Whether a transaction is currently active. */
  get isActive(): boolean {
    return this.inTransaction;
  }

  /** Start batching changes. Nested transactions throw. */
  beginTransaction(): void {
    if (this.inTransaction) {
      throw new Error(
        "TransactionManager: nested transactions are not supported",
      );
    }
    this.inTransaction = true;
    this.preTransactionSnapshot = this.manager.getCurrent();
  }

  /**
   * Commit the transaction: push a single snapshot covering
   * all changes since beginTransaction().
   */
  commitTransaction(finalSnapshot: T): void {
    if (!this.inTransaction) {
      throw new Error(
        "TransactionManager: no active transaction to commit",
      );
    }
    this.inTransaction = false;
    this.manager.pushSnapshot(finalSnapshot);
    this.preTransactionSnapshot = null;
  }

  /**
   * Rollback: discard all changes and return the snapshot
   * captured at the start of the transaction.
   */
  rollbackTransaction(): T | null {
    if (!this.inTransaction) {
      throw new Error(
        "TransactionManager: no active transaction to rollback",
      );
    }
    this.inTransaction = false;
    const snapshot = this.preTransactionSnapshot;
    this.preTransactionSnapshot = null;
    return snapshot;
  }
}
