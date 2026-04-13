// ─────────────────────────────────────────────────────────────
// Architex — Intent-Aware Collaboration Cursors
// ─────────────────────────────────────────────────────────────
//
// Infers what a collaborator is about to do from their recent
// mouse/keyboard patterns and exposes that intent so cursor
// overlays can show ghost previews (drag preview, connection
// preview, selection box, etc.).
//
// Public API:
//   detectIntent(actions)          → CursorIntent
//   describeIntent(intent)         → human-readable label
//   getGhostPreview(intent, ctx)   → GhostPreview | null
//   INTENT_ICONS                   → icon name mapping per intent
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** The set of intents the system can recognise. */
export type CursorIntent =
  | 'idle'
  | 'selecting'
  | 'dragging'
  | 'connecting'
  | 'typing'
  | 'drawing';

/** A timestamped user action fed into the detector. */
export interface UserAction {
  /** Action type. */
  type:
    | 'mouseMove'
    | 'mouseDown'
    | 'mouseUp'
    | 'click'
    | 'dblClick'
    | 'keyDown'
    | 'keyUp'
    | 'dragStart'
    | 'dragMove'
    | 'dragEnd'
    | 'handlePointerDown'
    | 'handlePointerUp';
  /** Unix timestamp in ms. */
  timestamp: number;
  /** Optional screen coordinates. */
  position?: { x: number; y: number };
  /** Optional metadata (e.g. key pressed). */
  meta?: Record<string, unknown>;
}

/** Context needed to generate a ghost preview. */
export interface PreviewContext {
  /** Current pointer position. */
  cursorPosition: { x: number; y: number };
  /** Origin position (drag start / connection start). */
  originPosition?: { x: number; y: number };
  /** Node ID being dragged, if any. */
  dragNodeId?: string;
  /** Source handle ID for a connection, if any. */
  sourceHandleId?: string;
}

/** Describes the ghost preview the UI should render. */
export interface GhostPreview {
  kind: 'dragGhost' | 'connectionLine' | 'selectionBox' | 'textCaret' | 'drawPath';
  /** Start coordinate. */
  from: { x: number; y: number };
  /** End coordinate (current cursor). */
  to: { x: number; y: number };
  /** Optional node or handle identifier. */
  targetId?: string;
  /** Opacity for the ghost element (0-1). */
  opacity: number;
}

// ── Intent detection ────────────────────────────────────────

/**
 * Time window (ms) for action analysis.
 * Only actions within this window are considered.
 */
const ANALYSIS_WINDOW_MS = 800;

/**
 * Minimum number of rapid mouse moves to consider "drawing".
 */
const DRAWING_MOVE_THRESHOLD = 12;

/**
 * Detect the collaborator's current intent from recent actions.
 *
 * Priority order (first match wins):
 *   1. typing    — recent keyDown events
 *   2. connecting — handlePointerDown without handlePointerUp
 *   3. dragging  — dragStart without dragEnd
 *   4. drawing   — rapid mouse moves after mouseDown (>= threshold)
 *   5. selecting — mouseDown + slow mouse moves (< threshold)
 *   6. idle      — default
 */
export function detectIntent(actions: UserAction[]): CursorIntent {
  if (actions.length === 0) return 'idle';

  const now = actions[actions.length - 1].timestamp;
  const recent = actions.filter((a) => now - a.timestamp <= ANALYSIS_WINDOW_MS);

  if (recent.length === 0) return 'idle';

  // 1. Typing — any keyDown in the window
  const hasKeyDown = recent.some((a) => a.type === 'keyDown');
  if (hasKeyDown) return 'typing';

  // 2. Connecting — handlePointerDown without a matching handlePointerUp
  const handleDowns = recent.filter((a) => a.type === 'handlePointerDown').length;
  const handleUps = recent.filter((a) => a.type === 'handlePointerUp').length;
  if (handleDowns > handleUps) return 'connecting';

  // 3. Dragging — dragStart without dragEnd
  const dragStarts = recent.filter((a) => a.type === 'dragStart').length;
  const dragEnds = recent.filter((a) => a.type === 'dragEnd').length;
  if (dragStarts > dragEnds) return 'dragging';

  // 4/5. Mouse-based intents
  const mouseDowns = recent.filter((a) => a.type === 'mouseDown').length;
  const mouseUps = recent.filter((a) => a.type === 'mouseUp').length;
  const mouseMoves = recent.filter((a) => a.type === 'mouseMove').length;

  if (mouseDowns > mouseUps) {
    // Mouse is held — drawing vs selecting depends on move density
    if (mouseMoves >= DRAWING_MOVE_THRESHOLD) return 'drawing';
    return 'selecting';
  }

  return 'idle';
}

// ── Human-readable labels ───────────────────────────────────

const INTENT_LABELS: Record<CursorIntent, string> = {
  idle: 'Idle',
  selecting: 'Selecting',
  dragging: 'Dragging',
  connecting: 'Connecting',
  typing: 'Typing',
  drawing: 'Drawing',
};

/** Get a human-readable label for an intent. */
export function describeIntent(intent: CursorIntent): string {
  return INTENT_LABELS[intent];
}

// ── Icon mapping ────────────────────────────────────────────

/**
 * Lucide icon names for each intent.
 * Components can use this to render the appropriate icon.
 */
export const INTENT_ICONS: Record<CursorIntent, string> = {
  idle: 'MousePointer',
  selecting: 'BoxSelect',
  dragging: 'Move',
  connecting: 'Cable',
  typing: 'Type',
  drawing: 'Pencil',
};

// ── Ghost preview generation ────────────────────────────────

/**
 * Generate a ghost preview descriptor for the given intent and context.
 * Returns null for intents that have no visual preview (idle, typing).
 */
export function getGhostPreview(
  intent: CursorIntent,
  ctx: PreviewContext,
): GhostPreview | null {
  const origin = ctx.originPosition ?? ctx.cursorPosition;

  switch (intent) {
    case 'dragging':
      return {
        kind: 'dragGhost',
        from: origin,
        to: ctx.cursorPosition,
        targetId: ctx.dragNodeId,
        opacity: 0.4,
      };

    case 'connecting':
      return {
        kind: 'connectionLine',
        from: origin,
        to: ctx.cursorPosition,
        targetId: ctx.sourceHandleId,
        opacity: 0.5,
      };

    case 'selecting':
      return {
        kind: 'selectionBox',
        from: origin,
        to: ctx.cursorPosition,
        opacity: 0.2,
      };

    case 'drawing':
      return {
        kind: 'drawPath',
        from: origin,
        to: ctx.cursorPosition,
        opacity: 0.6,
      };

    case 'typing':
      return {
        kind: 'textCaret',
        from: ctx.cursorPosition,
        to: ctx.cursorPosition,
        opacity: 0.7,
      };

    case 'idle':
    default:
      return null;
  }
}
