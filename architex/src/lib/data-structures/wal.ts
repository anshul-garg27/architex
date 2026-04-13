// -----------------------------------------------------------------
// Architex -- Write-Ahead Log (WAL) Simulation  (DST-029)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface WALEntry {
  /** Log Sequence Number -- monotonically increasing */
  lsn: number;
  /** The data payload */
  data: string;
  /** Whether this entry has been checkpointed */
  checkpointed: boolean;
}

export interface WALState {
  /** All log entries */
  entries: WALEntry[];
  /** Next LSN to assign */
  nextLSN: number;
  /** LSN of last checkpoint (-1 means no checkpoint) */
  checkpointLSN: number;
  /** Whether the log is in "crashed" state for recovery demo */
  crashed: boolean;
  /** Entries recovered after a crash+recover cycle */
  recoveredEntries: WALEntry[];
}

// ── Create ──────────────────────────────────────────────────

export function createWAL(): WALState {
  return {
    entries: [],
    nextLSN: 1,
    checkpointLSN: -1,
    crashed: false,
    recoveredEntries: [],
  };
}

export function cloneWAL(wal: WALState): WALState {
  return {
    entries: wal.entries.map((e) => ({ ...e })),
    nextLSN: wal.nextLSN,
    checkpointLSN: wal.checkpointLSN,
    crashed: wal.crashed,
    recoveredEntries: wal.recoveredEntries.map((e) => ({ ...e })),
  };
}

// ── append ──────────────────────────────────────────────────

export function walAppend(
  wal: WALState,
  data: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneWAL(wal);

  if (copy.crashed) {
    steps.push(step('append() -- log is in crashed state. Recover first.', []));
    return { steps, snapshot: copy };
  }

  const lsn = copy.nextLSN;
  steps.push(step(`append("${data}") -- assigning LSN ${lsn}`, []));

  const entry: WALEntry = { lsn, data, checkpointed: false };
  copy.entries.push(entry);
  copy.nextLSN++;

  steps.push(
    step(
      `Entry [LSN=${lsn}] written to log at position ${copy.entries.length - 1}`,
      [
        { targetId: `wal-${lsn}`, property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  steps.push(
    step(
      `Log now has ${copy.entries.length} entries. Next LSN: ${copy.nextLSN}`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── read ────────────────────────────────────────────────────

export function walRead(
  wal: WALState,
  lsn: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`read(LSN=${lsn})`, []));

  // Scan entries sequentially
  for (let i = 0; i < wal.entries.length; i++) {
    const e = wal.entries[i];
    steps.push(
      step(
        `Scanning entry ${i}: LSN=${e.lsn}${e.lsn === lsn ? ' -- FOUND' : ''}`,
        [
          {
            targetId: `wal-${e.lsn}`,
            property: 'highlight',
            from: 'default',
            to: e.lsn === lsn ? 'found' : 'comparing',
          },
        ],
      ),
    );
    if (e.lsn === lsn) {
      steps.push(
        step(
          `Found entry: LSN=${e.lsn}, data="${e.data}", checkpointed=${e.checkpointed}`,
          [{ targetId: `wal-${e.lsn}`, property: 'highlight', from: 'default', to: 'done' }],
        ),
      );
      return { steps, snapshot: wal };
    }
  }

  steps.push(step(`LSN ${lsn} not found in log`, []));
  return { steps, snapshot: wal };
}

// ── truncate ────────────────────────────────────────────────

export function walTruncate(
  wal: WALState,
  upToLSN: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneWAL(wal);

  steps.push(step(`truncate(upToLSN=${upToLSN}) -- remove entries with LSN <= ${upToLSN}`, []));

  const toRemove = copy.entries.filter((e) => e.lsn <= upToLSN);
  if (toRemove.length === 0) {
    steps.push(step(`No entries to truncate (all LSNs > ${upToLSN})`, []));
    return { steps, snapshot: copy };
  }

  // Highlight entries being removed
  steps.push(
    step(
      `Removing ${toRemove.length} entries (LSN ${toRemove[0].lsn} to ${toRemove[toRemove.length - 1].lsn})`,
      toRemove.map((e) => ({
        targetId: `wal-${e.lsn}`,
        property: 'highlight',
        from: 'default',
        to: 'deleting',
      })),
    ),
  );

  copy.entries = copy.entries.filter((e) => e.lsn > upToLSN);

  steps.push(
    step(
      `Truncated. ${copy.entries.length} entries remain.${copy.entries.length > 0 ? ` First LSN: ${copy.entries[0].lsn}` : ''}`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── checkpoint ──────────────────────────────────────────────

export function walCheckpoint(
  wal: WALState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneWAL(wal);

  if (copy.entries.length === 0) {
    steps.push(step('checkpoint() -- log is empty, nothing to checkpoint', []));
    return { steps, snapshot: copy };
  }

  const lastLSN = copy.entries[copy.entries.length - 1].lsn;
  steps.push(step(`checkpoint() -- marking all entries up to LSN ${lastLSN}`, []));

  // Mark all current entries as checkpointed
  const marked: DSMutation[] = [];
  for (const e of copy.entries) {
    if (!e.checkpointed) {
      e.checkpointed = true;
      marked.push({
        targetId: `wal-${e.lsn}`,
        property: 'highlight',
        from: 'default',
        to: 'done',
      });
    }
  }

  copy.checkpointLSN = lastLSN;

  steps.push(
    step(
      `Checkpoint set at LSN ${lastLSN}. ${marked.length} entries marked.`,
      marked,
    ),
  );

  steps.push(
    step(
      `Recovery will replay from LSN ${lastLSN + 1} onward after any future crash`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── crash ───────────────────────────────────────────────────

export function walCrash(
  wal: WALState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneWAL(wal);

  steps.push(step('CRASH -- simulating system failure', []));

  copy.crashed = true;

  // Show all entries that would need to be replayed
  const uncheckpointed = copy.entries.filter((e) => !e.checkpointed);
  steps.push(
    step(
      `System crashed. ${copy.entries.length} total entries in WAL. ${uncheckpointed.length} uncheckpointed entries may need recovery.`,
      uncheckpointed.map((e) => ({
        targetId: `wal-${e.lsn}`,
        property: 'highlight',
        from: 'default',
        to: 'deleting',
      })),
    ),
  );

  return { steps, snapshot: copy };
}

// ── recover ─────────────────────────────────────────────────

export function walRecover(
  wal: WALState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneWAL(wal);

  if (!copy.crashed) {
    steps.push(step('recover() -- system is not in crashed state', []));
    return { steps, snapshot: copy };
  }

  steps.push(
    step(
      `recover() -- checkpoint at LSN ${copy.checkpointLSN === -1 ? 'none (replay all)' : copy.checkpointLSN}`,
      [],
    ),
  );

  // Determine entries to replay: those after the checkpoint
  const toReplay = copy.checkpointLSN === -1
    ? copy.entries
    : copy.entries.filter((e) => e.lsn > copy.checkpointLSN);

  if (toReplay.length === 0) {
    steps.push(step('No entries to replay -- all were checkpointed.', []));
  } else {
    steps.push(
      step(
        `Replaying ${toReplay.length} entries from LSN ${toReplay[0].lsn} to ${toReplay[toReplay.length - 1].lsn}`,
        [],
      ),
    );

    // Show each entry being replayed
    for (const e of toReplay) {
      steps.push(
        step(
          `Replay LSN=${e.lsn}: "${e.data}"`,
          [
            { targetId: `wal-${e.lsn}`, property: 'highlight', from: 'default', to: 'visiting' },
          ],
        ),
      );
    }
  }

  copy.recoveredEntries = toReplay.map((e) => ({ ...e }));
  copy.crashed = false;

  // Mark all as checkpointed after recovery
  for (const e of copy.entries) {
    e.checkpointed = true;
  }
  if (copy.entries.length > 0) {
    copy.checkpointLSN = copy.entries[copy.entries.length - 1].lsn;
  }

  steps.push(
    step(
      `Recovery complete. ${toReplay.length} entries replayed. System operational.`,
      toReplay.map((e) => ({
        targetId: `wal-${e.lsn}`,
        property: 'highlight',
        from: 'default',
        to: 'done',
      })),
    ),
  );

  return { steps, snapshot: copy };
}
