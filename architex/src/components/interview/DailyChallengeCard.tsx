'use client';

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  Clock,
  Tag,
  Play,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDailyChallenge,
  getPastChallenges,
  msUntilNextChallenge,
} from '@/lib/interview/daily-challenge';
import type { DailyChallenge } from '@/lib/interview/daily-challenge';
import { getChallengeById } from '@/lib/interview/challenges';
import type { ChallengeDefinition } from '@/lib/interview/challenges';

// ── Category styling (mirrors ChallengeCard) ─────────────────────

const CATEGORY_STYLES: Record<
  ChallengeDefinition['category'],
  { label: string; bg: string; text: string; glow: string }
> = {
  classic: {
    label: 'Classic',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  modern: {
    label: 'Modern',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  infrastructure: {
    label: 'Infrastructure',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  advanced: {
    label: 'Advanced',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  lld: {
    label: 'Low-Level Design',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
};

// ── Difficulty stars ─────────────────────────────────────────────

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty ${level} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < level ? 'fill-amber-400 text-amber-400' : 'text-zinc-600',
          )}
        />
      ))}
    </div>
  );
}

// ── Countdown timer ─────────────────────────────────────────────

function CountdownTimer() {
  const [remaining, setRemaining] = useState(msUntilNextChallenge());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(msUntilNextChallenge());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Clock className="h-3 w-3" />
      <span>
        Next challenge in{' '}
        <span className="font-mono font-medium text-zinc-300">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}

// ── Past challenge row ──────────────────────────────────────────

function PastChallengeRow({
  daily,
  onSelect,
}: {
  daily: DailyChallenge;
  onSelect: (challenge: ChallengeDefinition) => void;
}) {
  const challenge = getChallengeById(daily.challengeId);
  if (!challenge) return null;

  const categoryStyle = CATEGORY_STYLES[challenge.category];

  return (
    <button
      onClick={() => onSelect(challenge)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800/60"
    >
      <span className="shrink-0 text-xs font-mono text-zinc-500 w-[5.5rem]">
        {daily.date}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
        {challenge.title}
      </span>
      <DifficultyStars level={challenge.difficulty} />
      <span
        className={cn(
          'hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
          categoryStyle.bg,
          categoryStyle.text,
        )}
      >
        {categoryStyle.label}
      </span>
    </button>
  );
}

// ── DailyChallengeCard ──────────────────────────────────────────

export interface DailyChallengeCardProps {
  onStartChallenge?: (challenge: ChallengeDefinition) => void;
  streakDays?: number;
  className?: string;
}

const DailyChallengeCard = memo(function DailyChallengeCard({
  onStartChallenge,
  streakDays = 0,
  className,
}: DailyChallengeCardProps) {
  const [showPast, setShowPast] = useState(false);

  const daily = useMemo(() => getDailyChallenge(), []);
  const challenge = useMemo(
    () => getChallengeById(daily.challengeId),
    [daily.challengeId],
  );
  const pastChallenges = useMemo(() => getPastChallenges(7), []);

  const handleStart = useCallback(() => {
    if (challenge && onStartChallenge) {
      onStartChallenge(challenge);
    }
  }, [challenge, onStartChallenge]);

  const togglePast = useCallback(() => setShowPast((p) => !p), []);

  if (!challenge) return null;

  const categoryStyle = CATEGORY_STYLES[challenge.category];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/90',
        'shadow-lg',
        categoryStyle.glow,
        className,
      )}
    >
      {/* Decorative accent line */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5',
          challenge.category === 'classic'
            ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600'
            : challenge.category === 'modern'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600'
              : challenge.category === 'infrastructure'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
                : 'bg-gradient-to-r from-purple-500 via-purple-400 to-purple-600',
        )}
      />

      <div className="p-5">
        {/* ── Header row ── */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                Today&apos;s Challenge
              </h3>
              <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Calendar className="h-3 w-3" />
                {daily.date}
              </p>
            </div>
          </div>

          {/* Streak indicator */}
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400">
                {streakDays}-day streak!
              </span>
            </div>
          )}
        </div>

        {/* ── Challenge info ── */}
        <h2 className="mb-2 text-lg font-bold text-zinc-100">
          {challenge.title}
        </h2>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <DifficultyStars level={challenge.difficulty} />
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="h-3 w-3" />
            {challenge.timeMinutes} min
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium',
              categoryStyle.bg,
              categoryStyle.text,
            )}
          >
            <Tag className="h-2.5 w-2.5" />
            {categoryStyle.label}
          </span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          {challenge.description}
        </p>

        {/* ── CTA + Countdown ── */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleStart}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold',
              'bg-primary text-white shadow-md shadow-primary/25',
              'transition-all duration-150 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
              'active:scale-[0.98]',
            )}
          >
            <Play className="h-4 w-4" />
            Start Today&apos;s Challenge
          </button>
          <CountdownTimer />
        </div>

        {/* ── Past challenges toggle ── */}
        <div className="border-t border-zinc-800 pt-3">
          <button
            onClick={togglePast}
            className="flex w-full items-center justify-between text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300"
          >
            <span>Past Challenges (last 7 days)</span>
            {showPast ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showPast && (
            <div className="mt-2 flex flex-col gap-0.5">
              {pastChallenges.slice(1).map((pc) => (
                <PastChallengeRow
                  key={pc.date}
                  daily={pc}
                  onSelect={(ch) => onStartChallenge?.(ch)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DailyChallengeCard.displayName = 'DailyChallengeCard';

export default DailyChallengeCard;
