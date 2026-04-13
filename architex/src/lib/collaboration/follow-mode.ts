// ─────────────────────────────────────────────────────────────
// Architex — COL-006 Follow Mode
// ─────────────────────────────────────────────────────────────
//
// Allows a user to "follow" another collaborator, syncing the
// local viewport (pan + zoom) to match the followed user's view.

import type { CursorPosition } from './types';

// ── Types ─────────────────────────────────────────────────────

/** Viewport state that a follower syncs to. */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** Active follow session. */
export interface FollowSession {
  followingUserId: string;
  active: boolean;
}

/** Callback invoked whenever the followed user's viewport changes. */
export type ViewportSyncCallback = (viewport: Viewport) => void;

// ── Follow Mode Manager ──────────────────────────────────────

/**
 * Manages a "follow mode" session where the local user's viewport
 * is continuously synced to a remote collaborator's viewport.
 *
 * Usage:
 *   const fm = new FollowModeManager(setViewport);
 *   fm.startFollowing('user-42');
 *   // ... remote viewport updates arrive ...
 *   fm.handleRemoteViewportUpdate('user-42', { x: 100, y: 200, zoom: 1.5 });
 *   fm.stopFollowing();
 */
export class FollowModeManager {
  private session: FollowSession | null = null;
  private onViewportSync: ViewportSyncCallback;

  constructor(onViewportSync: ViewportSyncCallback) {
    this.onViewportSync = onViewportSync;
  }

  /** Start following a collaborator by user ID. */
  startFollowing(userId: string): void {
    this.session = {
      followingUserId: userId,
      active: true,
    };
  }

  /** Stop following and return to free navigation. */
  stopFollowing(): void {
    this.session = null;
  }

  /** Get the current follow session, or null if not following. */
  getSession(): FollowSession | null {
    return this.session;
  }

  /** Whether the manager is actively following someone. */
  get isFollowing(): boolean {
    return this.session?.active ?? false;
  }

  /** The user ID being followed, or null. */
  get followingUserId(): string | null {
    return this.session?.followingUserId ?? null;
  }

  /**
   * Call when a remote collaborator's viewport changes.
   * If that user is the one we're following, sync the local viewport.
   */
  handleRemoteViewportUpdate(userId: string, viewport: Viewport): void {
    if (!this.session || !this.session.active) return;
    if (this.session.followingUserId !== userId) return;

    this.onViewportSync(viewport);
  }

  /**
   * Convenience: derive a viewport from a cursor position and optional zoom.
   * Centers the viewport on the cursor.
   */
  static viewportFromCursor(
    cursor: CursorPosition,
    zoom: number = 1,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080,
  ): Viewport {
    return {
      x: cursor.x - canvasWidth / 2,
      y: cursor.y - canvasHeight / 2,
      zoom,
    };
  }
}

// ── Standalone helpers ────────────────────────────────────────

/** Start following — creates a new session object (pure function). */
export function startFollowing(userId: string): FollowSession {
  return { followingUserId: userId, active: true };
}

/** Stop following — returns null (pure function). */
export function stopFollowing(): null {
  return null;
}
