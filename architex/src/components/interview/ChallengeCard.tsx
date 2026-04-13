'use client';

import React, { memo } from 'react';
import {
  Star,
  Clock,
  Tag,
  Play,
  CheckCircle,
  History,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChallengeDefinition } from '@/lib/interview/challenges';

// ── Category styling ───────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  ChallengeDefinition['category'],
  { label: string; bg: string; text: string }
> = {
  classic: { label: 'Classic', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  modern: { label: 'Modern', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  infrastructure: { label: 'Infrastructure', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  advanced: { label: 'Advanced', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  lld: { label: 'Low-Level Design', bg: 'bg-rose-500/15', text: 'text-rose-400' },
};

// ── Difficulty stars ───────────────────────────────────────────────

function DifficultyStars({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
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

// ── ChallengeCard ──────────────────────────────────────────────────

export interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  onStart?: (challenge: ChallengeDefinition) => void;
  onShowHistory?: (challengeId: string) => void;
  completed?: boolean;
  bestScore?: number;
}

const ChallengeCard = memo(function ChallengeCard({
  challenge,
  onStart,
  onShowHistory,
  completed = false,
  bestScore,
}: ChallengeCardProps) {
  const categoryStyle = CATEGORY_STYLES[challenge.category];
  const hasAttempts = bestScore != null && bestScore > 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4',
        'transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900',
        completed && 'border-emerald-800/50',
      )}
    >
      {/* Best score badge */}
      {hasAttempts && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5">
          <Award className={cn(
            'h-3 w-3',
            bestScore >= 8 ? 'text-emerald-400' : bestScore >= 6 ? 'text-yellow-400' : 'text-amber-400',
          )} />
          <span className={cn(
            'text-[10px] font-bold',
            bestScore >= 8 ? 'text-emerald-400' : bestScore >= 6 ? 'text-yellow-400' : 'text-amber-400',
          )}>
            {bestScore.toFixed(1)}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-100">
            {challenge.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <DifficultyStars level={challenge.difficulty} />
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              {challenge.timeMinutes} min
            </span>
          </div>
        </div>

        {/* Category badge */}
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

      {/* ── Company tags ── */}
      {challenge.companies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {challenge.companies.map((co) => (
            <span
              key={co}
              className="inline-flex items-center rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400"
            >
              {co}
            </span>
          ))}
        </div>
      )}

      {/* ── Description ── */}
      <p className="text-xs leading-relaxed text-zinc-400">
        {challenge.description}
      </p>

      {/* ── Requirements ── */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Requirements
        </span>
        <ul className="flex flex-col gap-1">
          {challenge.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-zinc-600" />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Actions ── */}
      <div className="mt-auto flex gap-2 pt-2">
        <button
          onClick={() => onStart?.(challenge)}
          disabled={completed}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            'transition-colors duration-150',
            completed
              ? 'cursor-default bg-emerald-500/10 text-emerald-400'
              : 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
          )}
        >
          {completed ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Challenge
            </>
          )}
        </button>
        {hasAttempts && onShowHistory && (
          <button
            onClick={() => onShowHistory(challenge.id)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
        )}
      </div>
    </div>
  );
});

ChallengeCard.displayName = 'ChallengeCard';

export default ChallengeCard;
