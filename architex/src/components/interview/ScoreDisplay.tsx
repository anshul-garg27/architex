'use client';

import React, { memo, useMemo } from 'react';
import {
  RotateCcw,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SCORING_DIMENSIONS,
  calculateOverallScore,
  getScoreLabel,
  generateFeedback,
} from '@/lib/interview/scoring';

// ── Score colour helpers ───────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score < 4) return 'text-red-400';
  if (score < 6) return 'text-amber-400';
  if (score < 8) return 'text-yellow-300';
  return 'text-emerald-400';
}

function getScoreBgColor(score: number): string {
  if (score < 4) return 'bg-red-500/15';
  if (score < 6) return 'bg-amber-500/15';
  if (score < 8) return 'bg-yellow-400/15';
  return 'bg-emerald-500/15';
}

function getBarColor(score: number): string {
  if (score < 4) return 'bg-red-500';
  if (score < 6) return 'bg-amber-500';
  if (score < 8) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

// ── ScoreDisplay ───────────────────────────────────────────────────

export interface ScoreDisplayProps {
  scores: Record<string, number>;
  onTryAgain?: () => void;
  onNextChallenge?: () => void;
}

const ScoreDisplay = memo(function ScoreDisplay({
  scores,
  onTryAgain,
  onNextChallenge,
}: ScoreDisplayProps) {
  const overall = useMemo(() => calculateOverallScore(scores), [scores]);
  const label = useMemo(() => getScoreLabel(overall), [overall]);
  const feedback = useMemo(() => generateFeedback(scores), [scores]);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      {/* ── Overall score ── */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold',
            getScoreBgColor(overall),
            getScoreColor(overall),
          )}
        >
          {overall.toFixed(1)}
        </div>
        <div>
          <div className={cn('text-lg font-semibold', getScoreColor(overall))}>
            {label}
          </div>
          <div className="text-xs text-zinc-400">
            Overall weighted score across 6 dimensions
          </div>
        </div>
      </div>

      {/* ── Dimension breakdown table ── */}
      <div className="flex flex-col gap-1">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Dimension Scores
        </h4>
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Dimension</th>
                <th className="px-3 py-2 text-center font-medium text-zinc-400">Weight</th>
                <th className="px-3 py-2 text-center font-medium text-zinc-400">Score</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Bar</th>
              </tr>
            </thead>
            <tbody>
              {SCORING_DIMENSIONS.map((dim) => {
                const score = scores[dim.id] ?? 0;
                return (
                  <tr key={dim.id} className="border-b border-zinc-800/50 last:border-b-0">
                    <td className="px-3 py-2 text-zinc-200">{dim.name}</td>
                    <td className="px-3 py-2 text-center text-zinc-400">
                      {(dim.weight * 100).toFixed(0)}%
                    </td>
                    <td className={cn('px-3 py-2 text-center font-semibold', getScoreColor(score))}>
                      {score}/10
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', getBarColor(score))}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Strengths ── */}
      {feedback.strengths.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Strengths
          </h4>
          <ul className="flex flex-col gap-1.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="rounded-md bg-emerald-500/5 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Improvements ── */}
      {feedback.improvements.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Areas for Improvement
          </h4>
          <ul className="flex flex-col gap-1.5">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="rounded-md bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Next Steps ── */}
      {feedback.nextSteps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-blue-400">
            <Lightbulb className="h-3.5 w-3.5" />
            Next Steps
          </h4>
          <ul className="flex flex-col gap-1.5">
            {feedback.nextSteps.map((s, i) => (
              <li key={i} className="rounded-md bg-blue-500/5 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3 pt-2">
        {onTryAgain && (
          <button
            onClick={onTryAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        )}
        {onNextChallenge && (
          <button
            onClick={onNextChallenge}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
          >
            Next Challenge
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

ScoreDisplay.displayName = 'ScoreDisplay';

export default ScoreDisplay;
