// ── Frustration Detector — behavioural signal analyser ───────────────
//
// Tracks user interaction patterns to detect frustration signals:
//   - Rapid undo/redo cycles
//   - Long pauses (inactivity)
//   - Repeated failed attempts
//   - Excessive hint usage
//
// Uses a sliding time window (default 2 minutes) to score recent
// actions and determine a frustration level. Fully client-side.

// ── Types ───────────────────────────────────────────────────────────

export type ActionType =
  | 'undo'
  | 'redo'
  | 'failed-attempt'
  | 'hint-used'
  | 'pause'
  | 'success'
  | 'interaction';

export type FrustrationLevel = 'calm' | 'mild' | 'frustrated' | 'very-frustrated';

export interface RecordedAction {
  type: ActionType;
  timestamp: number;
}

export interface FrustrationSnapshot {
  level: FrustrationLevel;
  score: number;
  actionCounts: Record<ActionType, number>;
  windowMs: number;
}

export type FrustrationChangeCallback = (
  newLevel: FrustrationLevel,
  previousLevel: FrustrationLevel,
  snapshot: FrustrationSnapshot,
) => void;

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

/** Points per action type within the window. */
const ACTION_SCORES: Record<ActionType, number> = {
  undo: 2,
  redo: 2,
  'failed-attempt': 4,
  'hint-used': 3,
  pause: 1,
  success: -3,
  interaction: 0,
};

/**
 * Extra points for rapid undo/redo cycles.
 * If 3+ undo/redo actions happen within RAPID_CYCLE_WINDOW_MS,
 * add RAPID_CYCLE_BONUS per cycle detected.
 */
const RAPID_CYCLE_WINDOW_MS = 5_000;
const RAPID_CYCLE_THRESHOLD = 3;
const RAPID_CYCLE_BONUS = 5;

/** Score thresholds for each frustration level. */
const THRESHOLDS: Record<Exclude<FrustrationLevel, 'calm'>, number> = {
  mild: 8,
  frustrated: 18,
  'very-frustrated': 30,
};

// ── Pause detection ─────────────────────────────────────────────────

/** If no actions for this long, auto-inject a 'pause' action. */
const PAUSE_THRESHOLD_MS = 30_000;

// ── FrustrationDetector ─────────────────────────────────────────────

export class FrustrationDetector {
  private actions: RecordedAction[] = [];
  private windowMs: number;
  private previousLevel: FrustrationLevel = 'calm';
  private callbacks: FrustrationChangeCallback[] = [];
  private lastActionTimestamp: number = 0;

  constructor(windowMs: number = DEFAULT_WINDOW_MS) {
    this.windowMs = windowMs;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Record a user action. If enough time has elapsed since the last
   * action, a 'pause' is automatically injected before it.
   */
  recordAction(type: ActionType, timestamp?: number): void {
    const now = timestamp ?? Date.now();

    // Auto-inject pause if there was a long gap
    if (
      this.lastActionTimestamp > 0 &&
      now - this.lastActionTimestamp >= PAUSE_THRESHOLD_MS &&
      type !== 'pause'
    ) {
      this.pushAction({ type: 'pause', timestamp: this.lastActionTimestamp + PAUSE_THRESHOLD_MS });
    }

    this.pushAction({ type, timestamp: now });
    this.lastActionTimestamp = now;

    // Check for level change
    const newLevel = this.getLevel(now);
    if (newLevel !== this.previousLevel) {
      const snapshot = this.getSnapshot(now);
      for (const cb of this.callbacks) {
        cb(newLevel, this.previousLevel, snapshot);
      }
      this.previousLevel = newLevel;
    }
  }

  /**
   * Get the current frustration level based on actions within the window.
   */
  getLevel(now?: number): FrustrationLevel {
    const score = this.computeScore(now);
    if (score >= THRESHOLDS['very-frustrated']) return 'very-frustrated';
    if (score >= THRESHOLDS.frustrated) return 'frustrated';
    if (score >= THRESHOLDS.mild) return 'mild';
    return 'calm';
  }

  /**
   * Get a detailed snapshot of the current frustration state.
   */
  getSnapshot(now?: number): FrustrationSnapshot {
    const ts = now ?? Date.now();
    const windowActions = this.getWindowActions(ts);
    const actionCounts = this.countActions(windowActions);
    const score = this.computeScore(ts);
    return {
      level: this.getLevel(ts),
      score,
      actionCounts,
      windowMs: this.windowMs,
    };
  }

  /**
   * Register a callback fired whenever the frustration level changes.
   */
  onFrustrationChange(callback: FrustrationChangeCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Clear all recorded actions and reset state.
   */
  reset(): void {
    this.actions = [];
    this.previousLevel = 'calm';
    this.lastActionTimestamp = 0;
  }

  /** Number of actions currently stored. */
  get actionCount(): number {
    return this.actions.length;
  }

  // ── Internal ────────────────────────────────────────────────

  private pushAction(action: RecordedAction): void {
    this.actions.push(action);
    // Garbage-collect very old actions (2x window)
    const cutoff = action.timestamp - this.windowMs * 2;
    if (this.actions.length > 200) {
      this.actions = this.actions.filter((a) => a.timestamp > cutoff);
    }
  }

  private getWindowActions(now: number): RecordedAction[] {
    const cutoff = now - this.windowMs;
    return this.actions.filter((a) => a.timestamp > cutoff);
  }

  private countActions(actions: RecordedAction[]): Record<ActionType, number> {
    const counts: Record<ActionType, number> = {
      undo: 0,
      redo: 0,
      'failed-attempt': 0,
      'hint-used': 0,
      pause: 0,
      success: 0,
      interaction: 0,
    };
    for (const a of actions) {
      counts[a.type]++;
    }
    return counts;
  }

  private computeScore(now?: number): number {
    const ts = now ?? Date.now();
    const windowActions = this.getWindowActions(ts);

    // Base score from action types
    let score = 0;
    for (const a of windowActions) {
      score += ACTION_SCORES[a.type];
    }

    // Bonus for rapid undo/redo cycles
    const undoRedoActions = windowActions
      .filter((a) => a.type === 'undo' || a.type === 'redo')
      .sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i <= undoRedoActions.length - RAPID_CYCLE_THRESHOLD; i++) {
      const window = undoRedoActions[i + RAPID_CYCLE_THRESHOLD - 1].timestamp - undoRedoActions[i].timestamp;
      if (window <= RAPID_CYCLE_WINDOW_MS) {
        score += RAPID_CYCLE_BONUS;
        break; // Count at most one cycle bonus per computation
      }
    }

    return Math.max(0, score);
  }
}
