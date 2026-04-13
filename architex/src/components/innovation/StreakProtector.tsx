'use client';

// ─────────────────────────────────────────────────────────────
// StreakProtector — Daily Micro-Challenge Modal
// ─────────────────────────────────────────────────────────────
//
// A modal showing today's micro-challenge question with a
// 5-minute timer. Completing the challenge preserves the
// user's daily learning streak.
//
// Layout:
//   Header  — streak count + timer
//   Body    — question + answer input (MC or short-answer)
//   Footer  — submit button + result feedback
//
// Animation: motion for modal entrance, stagger for options,
//            spring for streak badge
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Trophy,
  Lightbulb,
  X,
} from 'lucide-react';
import {
  getDailyMicroChallenge,
  submitMicroChallenge,
  type MicroChallenge,
  type MicroChallengeResult,
} from '@/lib/innovation/streak-protector';

// ── Types ──────────────────────────────────────────────────

export interface StreakProtectorProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when the modal should close. */
  onClose: () => void;
  /** Current streak count to display. */
  streakDays: number;
  /** Called when the challenge is completed (correct or not). */
  onStreakPreserved?: (result: MicroChallengeResult) => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Component ──────────────────────────────────────────────

export const StreakProtector = memo(function StreakProtector({
  open,
  onClose,
  streakDays,
  onStreakPreserved,
  className,
}: StreakProtectorProps) {
  const [challenge] = useState<MicroChallenge>(() => getDailyMicroChallenge());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [result, setResult] = useState<MicroChallengeResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimitSeconds);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──
  useEffect(() => {
    if (!open || result || expired) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, result, expired]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    const answer =
      challenge.answerType === 'multiple-choice' ? (selectedOption ?? '') : shortAnswer;
    if (!answer.trim()) return;

    const res = submitMicroChallenge(challenge.id, answer);
    setResult(res);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onStreakPreserved?.(res);
  }, [challenge, selectedOption, shortAnswer, onStreakPreserved]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setSelectedOption(null);
    setShortAnswer('');
    setResult(null);
    setTimeRemaining(challenge.timeLimitSeconds);
    setExpired(false);
  }, [challenge.timeLimitSeconds]);

  if (!open) return null;

  const timerPct = timeRemaining / challenge.timeLimitSeconds;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
            className,
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ── Header: Streak + Timer ── */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame className="h-5 w-5 text-orange-400" />
                </motion.div>
                <span className="text-sm font-semibold text-zinc-200">
                  {streakDays} day streak
                </span>
              </div>

              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  timerPct > 0.5
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : timerPct > 0.2
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400',
                )}
              >
                <Clock className="h-3 w-3" />
                {formatTimer(timeRemaining)}
              </div>
            </div>

            {/* Timer progress bar */}
            <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  timerPct > 0.5
                    ? 'bg-emerald-500'
                    : timerPct > 0.2
                      ? 'bg-amber-500'
                      : 'bg-red-500',
                )}
                initial={false}
                animate={{ width: `${timerPct * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* ── Category badge ── */}
            <div className="mb-2">
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium capitalize text-indigo-400">
                {challenge.category}
              </span>
            </div>

            {/* ── Question ── */}
            <p className="mb-4 text-sm font-medium text-zinc-200">{challenge.question}</p>

            {/* ── Answer Area ── */}
            <AnimatePresence mode="wait">
              {!result && !expired && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {challenge.answerType === 'multiple-choice' && challenge.options ? (
                    <div className="flex flex-col gap-2">
                      {challenge.options.map((opt, i) => (
                        <motion.button
                          key={opt}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedOption(opt)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left text-xs transition-all',
                            selectedOption === opt
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
                          )}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                      }}
                      placeholder="Type your answer..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-indigo-500"
                    />
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={
                      challenge.answerType === 'multiple-choice'
                        ? !selectedOption
                        : !shortAnswer.trim()
                    }
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Answer
                  </button>
                </motion.div>
              )}

              {/* ── Expired ── */}
              {expired && !result && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 rounded-xl bg-red-500/10 p-4"
                >
                  <Clock className="h-8 w-8 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Time&apos;s up!</p>
                  <p className="text-center text-xs text-zinc-500">
                    Don&apos;t worry — completing the challenge still preserves your streak.
                  </p>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try Again
                  </button>
                </motion.div>
              )}

              {/* ── Result ── */}
              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-3"
                >
                  {/* Correct / Incorrect badge */}
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-xl p-3',
                      result.correct ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                    )}
                  >
                    {result.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          result.correct ? 'text-emerald-400' : 'text-amber-400',
                        )}
                      >
                        {result.correct ? 'Correct!' : 'Not quite'}
                      </p>
                      {!result.correct && (
                        <p className="text-xs text-zinc-500">
                          Answer: {result.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                    <p className="text-xs leading-relaxed text-zinc-400">{result.explanation}</p>
                  </div>

                  {/* Streak preserved */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-orange-500/10 p-2"
                  >
                    <Trophy className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium text-orange-400">
                      Streak preserved! {streakDays + 1} days
                    </span>
                  </motion.div>

                  <button
                    onClick={onClose}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
