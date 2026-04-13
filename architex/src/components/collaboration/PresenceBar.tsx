'use client';

import { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCollaborationStore } from '@/stores/collaboration-store';
import type { CollaboratorInfo, PresenceStatus } from '@/lib/collaboration/types';

// ── Helpers ────────────────────────────────────────────────

/** Extract up to two initials from a display name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Status dot color mapping. */
const STATUS_DOT_COLOR: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

// ── Avatar ─────────────────────────────────────────────────

interface AvatarProps {
  collaborator: CollaboratorInfo;
}

const CollaboratorAvatar = memo(function CollaboratorAvatar({
  collaborator,
}: AvatarProps) {
  const initials = useMemo(() => getInitials(collaborator.name), [collaborator.name]);

  return (
    <div className="group relative" title={collaborator.name}>
      {/* Circle with initials */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-neutral-800"
        style={{ backgroundColor: collaborator.color }}
      >
        {initials}
      </div>

      {/* Status dot */}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-neutral-900',
          STATUS_DOT_COLOR[collaborator.status],
        )}
      />

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {collaborator.name}
      </div>
    </div>
  );
});

// ── Share button placeholder ───────────────────────────────

interface ShareButtonProps {
  onClick?: () => void;
}

const ShareButton = memo(function ShareButton({ onClick }: ShareButtonProps) {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 px-3 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      Share
    </button>
  );
});

// ── PresenceBar ────────────────────────────────────────────

interface PresenceBarProps {
  /** Called when the Share button is clicked. */
  onShare?: () => void;
  className?: string;
}

function PresenceBarInner({ onShare, className }: PresenceBarProps) {
  const collaborators = useCollaborationStore((state) => state.collaborators);
  const isConnected = useCollaborationStore((state) => state.isConnected);

  const onlineCount = useMemo(
    () => collaborators.filter((c) => c.status !== 'offline').length,
    [collaborators],
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-neutral-700/50 bg-neutral-900/80 px-3 py-1.5 backdrop-blur-sm',
        className,
      )}
    >
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500',
          )}
        />
        <span className="text-xs text-neutral-400">
          {isConnected ? `${onlineCount} online` : 'Offline'}
        </span>
      </div>

      {/* Divider */}
      {collaborators.length > 0 && (
        <div className="h-5 w-px bg-neutral-700" />
      )}

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {collaborators.map((c) => (
          <CollaboratorAvatar key={c.id} collaborator={c} />
        ))}
      </div>

      {/* Share button */}
      <ShareButton onClick={onShare} />
    </div>
  );
}

export const PresenceBar = memo(PresenceBarInner);
