'use client';

// ─────────────────────────────────────────────────────────────
// Architex — COL-006 Follow Indicator
// ─────────────────────────────────────────────────────────────
//
// "Following [name]" banner with a stop button. Rendered at the
// top of the canvas when the user is in follow mode.

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springs, duration, easing } from '@/lib/constants/motion';

// ── Props ─────────────────────────────────────────────────────

interface FollowIndicatorProps {
  /** Whether the user is currently following someone. */
  isFollowing: boolean;
  /** Display name of the user being followed. */
  followedUserName?: string;
  /** Color associated with the followed user. */
  followedUserColor?: string;
  /** Called when the stop button is clicked. */
  onStopFollowing: () => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────

function FollowIndicatorInner({
  isFollowing,
  followedUserName,
  followedUserColor = '#6E56CF',
  onStopFollowing,
  className,
}: FollowIndicatorProps) {
  const handleStop = useCallback(() => {
    onStopFollowing();
  }, [onStopFollowing]);

  return (
    <AnimatePresence>
      {isFollowing && followedUserName && (
        <motion.div
          key="follow-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: duration.normal, ease: easing.out }}
          className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-lg border border-neutral-700/50 bg-neutral-900/90 px-3 py-1.5 shadow-lg backdrop-blur-sm',
            className,
          )}
        >
          {/* Eye icon with user color */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: easing.inOut,
            }}
          >
            <Eye
              size={14}
              style={{ color: followedUserColor }}
              aria-hidden="true"
            />
          </motion.div>

          {/* Label */}
          <span className="text-xs font-medium text-neutral-300">
            Following{' '}
            <span
              className="font-semibold"
              style={{ color: followedUserColor }}
            >
              {followedUserName}
            </span>
          </span>

          {/* Stop button */}
          <button
            type="button"
            onClick={handleStop}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-neutral-700"
            aria-label="Stop following"
          >
            <X size={12} className="text-neutral-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const FollowIndicator = memo(FollowIndicatorInner);
