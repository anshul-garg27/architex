'use client';

// ─────────────────────────────────────────────────────────────
// TimeAttackMode — Timed System-Design Challenges
// ─────────────────────────────────────────────────────────────
//
// Layout:
//   Top    — Large centred countdown timer
//   Left   — Challenge selector (difficulty tabs)
//   Center — Requirements checklist with live check-marks
//   Bottom — Score display, Start / Restart controls
//   Overlay— "Time's up!" results screen
//
// Animation: motion spring for timer pulse, stagger for
//            requirement list, scale for score reveal
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  Circle,
  Trophy,
  Zap,
  Clock,
  Target,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  TIME_ATTACK_CHALLENGES,
  createTimeAttackSession,
  startSession,
  tickSession,
  completeSession,
  checkRequirements,
  calculateScore,
  type TimeAttackChallenge,
  type TimeAttackSession,
  type TimeAttackScore,
  type CanvasSnapshot,
  type RequirementCheckResult,
} from '@/lib/innovation/time-attack';
import { useCanvasStore } from '@/stores/canvas-store';

// ── Types ──────────────────────────────────────────────────

export interface TimeAttackModeProps {
  className?: string;
  /** External canvas snapshot (if not using the store directly). */
  canvasOverride?: CanvasSnapshot;
}

type DifficultyTab = 'beginner' | 'intermediate' | 'advanced';

// ── Constants ──────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<DifficultyTab, { bg: string; text: string; ring: string }> = {
  beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/30' },
};

// ── Helpers ────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTimerColor(remaining: number, total: number): string {
  const pct = remaining / total;
  if (pct > 0.5) return 'text-emerald-400';
  if (pct > 0.2) return 'text-amber-400';
  return 'text-red-400';
}

// ── Component ──────────────────────────────────────────────

export const TimeAttackMode = memo(function TimeAttackMode({
  className,
  canvasOverride,
}: TimeAttackModeProps) {
  const [tab, setTab] = useState<DifficultyTab>('beginner');
  const [session, setSession] = useState<TimeAttackSession | null>(null);
  const [score, setScore] = useState<TimeAttackScore | null>(null);
  const [reqResult, setReqResult] = useState<RequirementCheckResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Canvas state from store
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const canvas: CanvasSnapshot = canvasOverride ?? { nodes, edges };

  // Filtered challenges
  const challenges = TIME_ATTACK_CHALLENGES.filter((c) => c.difficulty === tab);

  // ── Timer tick ──
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    intervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.status !== 'active') return prev;
        const next = tickSession(prev);
        if (next.status === 'expired') {
          // Clear interval and compute final score
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live requirement checking ──
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const result = checkRequirements(session, canvas);
    setReqResult(result);

    // Auto-complete if all requirements met
    if (result.metCount === result.total) {
      const completed = completeSession(session);
      setSession(completed);
      setScore(calculateScore(completed, canvas));
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [session, canvas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute final score on expiry ──
  useEffect(() => {
    if (session?.status === 'expired' && !score) {
      setScore(calculateScore(session, canvas));
    }
  }, [session?.status, score, canvas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──
  const handleStart = useCallback((challenge: TimeAttackChallenge) => {
    const s = createTimeAttackSession(challenge);
    const started = startSession(s);
    setSession(started);
    setScore(null);
    setReqResult(null);
  }, []);

  const handleRestart = useCallback(() => {
    setSession(null);
    setScore(null);
    setReqResult(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!session || session.status !== 'active') return;
    const completed = completeSession(session);
    setSession(completed);
    setScore(calculateScore(completed, canvas));
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [session, canvas]);

  // ── Met set for quick lookup ──
  const metSet = new Set(reqResult?.met ?? []);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className={cn('flex flex-col gap-4 rounded-xl bg-zinc-900 p-4', className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Time Attack</h2>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════ */}
        {/* CHALLENGE SELECTOR (no active session) */}
        {/* ══════════════════════════════════════════════════ */}
        {!session && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {/* Difficulty tabs */}
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTab(d)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all',
                    tab === d
                      ? `${DIFFICULTY_COLORS[d].bg} ${DIFFICULTY_COLORS[d].text} ring-1 ${DIFFICULTY_COLORS[d].ring}`
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Challenge list */}
            <div className="flex flex-col gap-2">
              {challenges.map((c, i) => (
                <motion.button
                  key={c.challengeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleStart(c)}
                  className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-200">{c.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">{c.description}</div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(c.timeLimit)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {c.requirements.length} requirements
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ACTIVE SESSION / RESULTS */}
        {/* ══════════════════════════════════════════════════ */}
        {session && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* ── Countdown Timer ── */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={cn(
                  'font-mono text-4xl font-bold tabular-nums',
                  getTimerColor(session.remainingSeconds, session.challenge.timeLimit),
                )}
                animate={
                  session.remainingSeconds <= 10 && session.status === 'active'
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {formatTime(session.remainingSeconds)}
              </motion.div>
              <div className="text-xs text-zinc-500">{session.challenge.title}</div>

              {/* Progress bar */}
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    session.remainingSeconds / session.challenge.timeLimit > 0.5
                      ? 'bg-emerald-500'
                      : session.remainingSeconds / session.challenge.timeLimit > 0.2
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  initial={false}
                  animate={{
                    width: `${(session.remainingSeconds / session.challenge.timeLimit) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* ── Requirements Checklist ── */}
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-medium text-zinc-400">Requirements</div>
              {session.challenge.requirements.map((req, i) => {
                const isMet = metSet.has(req.id);
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                      isMet ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400',
                    )}
                  >
                    {isMet ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
                    )}
                    <span className={cn(isMet && 'line-through opacity-70')}>{req.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Score (visible during play) ── */}
            {reqResult && session.status === 'active' && (
              <div className="text-center text-xs text-zinc-500">
                {reqResult.metCount} / {reqResult.total} requirements met
              </div>
            )}

            {/* ── Controls ── */}
            {session.status === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Submit
                </button>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* TIME'S UP / COMPLETED OVERLAY */}
            {/* ══════════════════════════════════════════════ */}
            <AnimatePresence>
              {(session.status === 'expired' || session.status === 'completed') && score && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 p-4"
                >
                  {session.status === 'expired' ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <Timer className="h-5 w-5" />
                      <span className="text-sm font-semibold">Time&apos;s Up!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Trophy className="h-5 w-5" />
                      <span className="text-sm font-semibold">Challenge Complete!</span>
                    </div>
                  )}

                  {/* Score breakdown */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-3xl font-bold text-zinc-100"
                  >
                    {score.finalScore}
                  </motion.div>

                  <div className="flex gap-4 text-xs text-zinc-500">
                    <span>
                      Base: {score.requirementScore}
                    </span>
                    <span>
                      Time bonus: {score.timeBonus}x
                    </span>
                  </div>

                  <div className="text-xs text-zinc-500">
                    {score.requirements.metCount} / {score.requirements.total} requirements met
                    {score.secondsRemaining > 0 && ` with ${formatTime(score.secondsRemaining)} to spare`}
                  </div>

                  <button
                    onClick={handleRestart}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
