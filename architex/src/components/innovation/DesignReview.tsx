'use client';

// ─────────────────────────────────────────────────────────────
// DesignReview — Design Review Mode UI
// ─────────────────────────────────────────────────────────────
//
// Layout:
//   Left   — Canvas overlay with clickable comment pins
//   Right  — Comment thread sidebar with filters
//   Bottom — Approve / Request Changes actions
//
// Comment pins are colored by type:
//   suggestion (blue), issue (red), praise (green)
//
// Animation: motion spring for pin drop, stagger for
//            comment list, slide for sidebar
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  Check,
  X,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import {
  createReviewSession,
  createComment,
  addComment,
  resolveComment,
  unresolveComment,
  completeReview,
  getCommentsByType,
  getUnresolvedComments,
  countByType,
  type ReviewSession,
  type ReviewComment,
  type CommentType,
  type ReviewVerdict,
  type CommentPosition,
} from '@/lib/innovation/design-review';

// ── Types ──────────────────────────────────────────────────

export interface DesignReviewProps {
  className?: string;
  /** Design ID to review. */
  designId?: string;
  /** Reviewer name. */
  reviewerName?: string;
}

type FilterMode = 'all' | 'suggestion' | 'issue' | 'praise' | 'unresolved' | 'resolved';

// ── Constants ──────────────────────────────────────────────

const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { icon: typeof Lightbulb; color: string; bg: string; ring: string; label: string }
> = {
  suggestion: {
    icon: Lightbulb,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    ring: 'ring-blue-500/30',
    label: 'Suggestion',
  },
  issue: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    ring: 'ring-red-500/30',
    label: 'Issue',
  },
  praise: {
    icon: ThumbsUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    ring: 'ring-emerald-500/30',
    label: 'Praise',
  },
};

const PIN_COLORS: Record<CommentType, string> = {
  suggestion: 'bg-blue-500',
  issue: 'bg-red-500',
  praise: 'bg-emerald-500',
};

// ── Component ──────────────────────────────────────────────

export const DesignReview = memo(function DesignReview({
  className,
  designId = 'design-001',
  reviewerName = 'Reviewer',
}: DesignReviewProps) {
  const [session, setSession] = useState<ReviewSession>(() =>
    createReviewSession(designId, reviewerName),
  );
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<CommentPosition | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentType, setNewCommentType] = useState<CommentType>('suggestion');

  // ── Computed ──
  const counts = useMemo(() => countByType(session), [session]);
  const unresolvedCount = useMemo(() => getUnresolvedComments(session).length, [session]);

  const filteredComments = useMemo(() => {
    switch (filter) {
      case 'suggestion':
      case 'issue':
      case 'praise':
        return getCommentsByType(session, filter);
      case 'unresolved':
        return session.comments.filter((c) => !c.resolved);
      case 'resolved':
        return session.comments.filter((c) => c.resolved);
      default:
        return session.comments;
    }
  }, [session, filter]);

  // ── Handlers ──
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (session.status === 'completed') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      setPendingPosition({ x, y });
      setShowAddForm(true);
      setNewCommentText('');
    },
    [session.status],
  );

  const handleAddComment = useCallback(() => {
    if (!pendingPosition || !newCommentText.trim()) return;
    const comment = createComment(reviewerName, newCommentText.trim(), pendingPosition, newCommentType);
    setSession((prev) => addComment(prev, comment));
    setShowAddForm(false);
    setPendingPosition(null);
    setNewCommentText('');
  }, [pendingPosition, newCommentText, newCommentType, reviewerName]);

  const handleResolve = useCallback((commentId: string) => {
    setSession((prev) => resolveComment(prev, commentId));
  }, []);

  const handleUnresolve = useCallback((commentId: string) => {
    setSession((prev) => unresolveComment(prev, commentId));
  }, []);

  const handleComplete = useCallback(
    (verdict: ReviewVerdict) => {
      setSession((prev) => completeReview(prev, verdict));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSession(createReviewSession(designId, reviewerName));
    setFilter('all');
    setSelectedComment(null);
    setShowAddForm(false);
  }, [designId, reviewerName]);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className={cn('flex flex-col gap-4 rounded-xl bg-zinc-900 p-4', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Design Review</h2>
        </div>
        {session.status === 'completed' && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              session.verdict === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400',
            )}
          >
            {session.verdict === 'approved' ? 'Approved' : 'Changes Requested'}
          </span>
        )}
      </div>

      {/* ── Canvas overlay (clickable area with pins) ── */}
      <div
        className="relative h-48 cursor-crosshair overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
        onClick={handleCanvasClick}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Instruction text */}
        {session.comments.length === 0 && session.status === 'in-progress' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-zinc-600">Click anywhere to add a comment</span>
          </div>
        )}

        {/* Comment pins */}
        {session.comments.map((comment) => (
          <motion.button
            key={comment.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-white/20 transition-all hover:scale-125',
              PIN_COLORS[comment.type],
              comment.resolved && 'opacity-40',
              selectedComment === comment.id && 'ring-white/60 scale-125',
            )}
            style={{ left: comment.position.x, top: comment.position.y }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedComment(selectedComment === comment.id ? null : comment.id);
            }}
          >
            <span className="text-[8px] font-bold text-white">
              {comment.type[0].toUpperCase()}
            </span>
          </motion.button>
        ))}

        {/* Pending position marker */}
        {pendingPosition && showAddForm && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/40"
            style={{ left: pendingPosition.x, top: pendingPosition.y }}
          />
        )}
      </div>

      {/* ── Add comment form ── */}
      <AnimatePresence>
        {showAddForm && session.status === 'in-progress' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            {/* Type selector */}
            <div className="flex gap-1.5">
              {(['suggestion', 'issue', 'praise'] as const).map((type) => {
                const config = COMMENT_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setNewCommentType(type)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                      newCommentType === type
                        ? `${config.bg} ${config.color} ring-1 ${config.ring}`
                        : 'text-zinc-500 hover:text-zinc-300',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>

            {/* Text input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add your comment..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setPendingPosition(null);
                }}
                className="rounded-lg border border-zinc-700 px-2 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
        {(
          [
            { key: 'all', label: `All (${session.comments.length})` },
            { key: 'suggestion', label: `Suggestions (${counts.suggestion})` },
            { key: 'issue', label: `Issues (${counts.issue})` },
            { key: 'praise', label: `Praise (${counts.praise})` },
            { key: 'unresolved', label: `Open (${unresolvedCount})` },
            { key: 'resolved', label: `Resolved (${session.comments.length - unresolvedCount})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'whitespace-nowrap rounded-md px-2 py-1 text-xs transition-all',
              filter === key
                ? 'bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Comment thread sidebar ── */}
      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredComments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-6 text-center text-xs text-zinc-600"
            >
              No comments to show
            </motion.div>
          )}
          {filteredComments.map((comment, i) => {
            const config = COMMENT_TYPE_CONFIG[comment.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'flex flex-col gap-1.5 rounded-lg border p-2.5 transition-all',
                  selectedComment === comment.id
                    ? 'border-zinc-600 bg-zinc-800'
                    : 'border-zinc-800 bg-zinc-800/40',
                  comment.resolved && 'opacity-60',
                )}
                onClick={() => setSelectedComment(comment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn('h-3 w-3', config.color)} />
                    <span className={cn('text-xs font-medium', config.color)}>
                      {config.label}
                    </span>
                    {comment.resolved && (
                      <span className="flex items-center gap-0.5 text-xs text-zinc-600">
                        <Check className="h-2.5 w-2.5" />
                        Resolved
                      </span>
                    )}
                  </div>
                  {session.status === 'in-progress' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        comment.resolved
                          ? handleUnresolve(comment.id)
                          : handleResolve(comment.id);
                      }}
                      className="rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
                      title={comment.resolved ? 'Unresolve' : 'Resolve'}
                    >
                      {comment.resolved ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-300">{comment.text}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                  <span>{comment.author}</span>
                  <span>
                    ({comment.position.x}, {comment.position.y})
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Actions ── */}
      {session.status === 'in-progress' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleComplete('approved')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            onClick={() => handleComplete('changes-requested')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
          >
            <XCircle className="h-3.5 w-3.5" />
            Request Changes
          </button>
        </div>
      )}

      {/* ── Completed state ── */}
      {session.status === 'completed' && (
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Review
        </button>
      )}
    </div>
  );
});
