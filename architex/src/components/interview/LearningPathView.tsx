'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Lock,
  Play,
  Star,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEARNING_PATHS } from '@/lib/interview/learning-paths';
import type { LearningPath, LearningWeek } from '@/lib/interview/learning-paths';
import { CHALLENGES } from '@/lib/interview/challenges';

// ── Progress state (local for now, will persist later) ──────────────

interface WeekProgress {
  [weekKey: string]: 'locked' | 'available' | 'in-progress' | 'completed';
}

function buildInitialProgress(path: LearningPath): WeekProgress {
  const progress: WeekProgress = {};
  path.weeks.forEach((w, i) => {
    const key = `${path.id}-w${w.week}`;
    if (i === 0) {
      progress[key] = 'available';
    } else {
      progress[key] = 'locked';
    }
  });
  return progress;
}

// ── Week timeline node ──────────────────────────────────────────────

const WeekNode = memo(function WeekNode({
  week,
  status,
  isLast,
  isSelected,
  onClick,
}: {
  week: LearningWeek;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const nodeColor = {
    completed: 'bg-emerald-500 border-emerald-400',
    'in-progress': 'bg-primary border-primary',
    available: 'bg-background border-primary',
    locked: 'bg-background border-zinc-600',
  }[status];

  const lineColor = status === 'completed' ? 'bg-emerald-500' : 'bg-zinc-700';
  const textColor = {
    completed: 'text-emerald-400',
    'in-progress': 'text-primary',
    available: 'text-foreground',
    locked: 'text-foreground-subtle',
  }[status];

  const Icon =
    status === 'completed'
      ? CheckCircle
      : status === 'locked'
        ? Lock
        : status === 'in-progress'
          ? Play
          : Target;

  return (
    <div className="flex items-start">
      {/* Node + connector */}
      <div className="flex flex-col items-center">
        <button
          onClick={onClick}
          disabled={status === 'locked'}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
            nodeColor,
            status !== 'locked' && 'cursor-pointer hover:scale-110',
            status === 'locked' && 'cursor-not-allowed opacity-50',
            isSelected && status !== 'locked' && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          )}
          aria-label={`Week ${week.week}: ${week.title}`}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              status === 'completed' ? 'text-white' : status === 'in-progress' ? 'text-white' : textColor,
            )}
          />
        </button>
        {!isLast && (
          <div className={cn('h-8 w-0.5 flex-shrink-0', lineColor)} />
        )}
      </div>

      {/* Label */}
      <div className="ml-3 min-w-0 pb-6">
        <button
          onClick={onClick}
          disabled={status === 'locked'}
          className={cn(
            'text-left transition-colors',
            status !== 'locked' && 'hover:text-primary',
            status === 'locked' && 'cursor-not-allowed',
          )}
        >
          <p className={cn('text-sm font-medium leading-tight', textColor)}>
            Week {week.week}
          </p>
          <p
            className={cn(
              'text-xs leading-tight',
              status === 'locked' ? 'text-foreground-subtle' : 'text-foreground-muted',
            )}
          >
            {week.title}
          </p>
        </button>
      </div>
    </div>
  );
});

// ── Week detail panel ───────────────────────────────────────────────

const WeekDetail = memo(function WeekDetail({
  week,
  status,
  pathId,
  onStartWeek,
  onSelectChallenge,
}: {
  week: LearningWeek;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  pathId: string;
  onStartWeek: (pathId: string, weekNum: number) => void;
  onSelectChallenge?: (challengeId: string) => void;
}) {
  // Resolve challenge definitions
  const linkedChallenges = useMemo(
    () =>
      week.challengeIds
        .map((id) => CHALLENGES.find((c) => c.id === id))
        .filter(Boolean),
    [week.challengeIds],
  );

  const estimatedMinutes = linkedChallenges.reduce(
    (sum, ch) => sum + (ch?.timeMinutes ?? 0),
    0,
  );

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Week {week.week}: {week.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{estimatedMinutes} min of challenges
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {linkedChallenges.length} challenge{linkedChallenges.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {status === 'completed' && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        )}
        {status === 'in-progress' && (
          <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            <Play className="h-3 w-3" />
            In Progress
          </span>
        )}
      </div>

      {/* Topics */}
      <div className="mb-3">
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Topics
        </h4>
        <ul className="space-y-1">
          {week.topics.map((topic, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground-muted">
              <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-foreground-subtle" />
              {topic}
            </li>
          ))}
        </ul>
      </div>

      {/* Linked challenges */}
      <div className="mb-3">
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Challenges
        </h4>
        <div className="space-y-1.5">
          {linkedChallenges.map((ch) =>
            ch ? (
              <button
                key={ch.id}
                onClick={() => onSelectChallenge?.(ch.id)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {ch.title}
                  </p>
                  <p className="text-[10px] text-foreground-subtle">
                    {ch.timeMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-0.5 pl-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-2.5 w-2.5',
                        i < ch.difficulty
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600',
                      )}
                    />
                  ))}
                </div>
              </button>
            ) : null,
          )}
        </div>
      </div>

      {/* SRS concepts */}
      <div className="mb-4">
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Key Concepts (SRS)
        </h4>
        <div className="flex flex-wrap gap-1">
          {week.concepts.map((concept) => (
            <span
              key={concept}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Start button */}
      {(status === 'available' || status === 'in-progress') && (
        <button
          onClick={() => onStartWeek(pathId, week.week)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Play className="h-4 w-4" />
          {status === 'in-progress' ? 'Continue This Week' : 'Start This Week'}
        </button>
      )}

      {status === 'locked' && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-foreground-subtle">
          <Lock className="h-4 w-4" />
          Complete the previous week to unlock
        </div>
      )}
    </div>
  );
});

// ── Main LearningPathView component ─────────────────────────────────

export default memo(function LearningPathView({
  onSelectChallenge,
}: {
  onSelectChallenge?: (challengeId: string) => void;
}) {
  const [selectedPathId, setSelectedPathId] = useState<string>(
    LEARNING_PATHS[0]?.id ?? '',
  );
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [progressMap, setProgressMap] = useState<Record<string, WeekProgress>>(
    () => {
      const map: Record<string, WeekProgress> = {};
      for (const p of LEARNING_PATHS) {
        map[p.id] = buildInitialProgress(p);
      }
      return map;
    },
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedPath = useMemo(
    () => LEARNING_PATHS.find((p) => p.id === selectedPathId) ?? LEARNING_PATHS[0],
    [selectedPathId],
  );

  const currentProgress = progressMap[selectedPath.id] ?? {};

  const selectedWeek = useMemo(
    () => selectedPath.weeks.find((w) => w.week === selectedWeekNum) ?? selectedPath.weeks[0],
    [selectedPath, selectedWeekNum],
  );

  const handleSelectPath = useCallback((pathId: string) => {
    setSelectedPathId(pathId);
    setSelectedWeekNum(1);
    setDropdownOpen(false);
  }, []);

  const handleSelectWeek = useCallback((weekNum: number) => {
    setSelectedWeekNum(weekNum);
  }, []);

  const handleStartWeek = useCallback(
    (pathId: string, weekNum: number) => {
      setProgressMap((prev) => {
        const pathProgress = { ...(prev[pathId] ?? {}) };
        const key = `${pathId}-w${weekNum}`;
        if (pathProgress[key] === 'available') {
          pathProgress[key] = 'in-progress';
        } else if (pathProgress[key] === 'in-progress') {
          // Mark completed and unlock next
          pathProgress[key] = 'completed';
          const nextKey = `${pathId}-w${weekNum + 1}`;
          if (pathProgress[nextKey] === 'locked') {
            pathProgress[nextKey] = 'available';
          }
        }
        return { ...prev, [pathId]: pathProgress };
      });
    },
    [],
  );

  const getWeekStatus = useCallback(
    (week: LearningWeek): 'locked' | 'available' | 'in-progress' | 'completed' => {
      const key = `${selectedPath.id}-w${week.week}`;
      return currentProgress[key] ?? 'locked';
    },
    [selectedPath.id, currentProgress],
  );

  // Calculate overall path progress
  const completedWeeks = selectedPath.weeks.filter(
    (w) => getWeekStatus(w) === 'completed',
  ).length;
  const progressPct = Math.round((completedWeeks / selectedPath.weeks.length) * 100);

  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Learning Paths</h2>
      </div>

      {/* Path selector dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3 text-left transition-colors hover:border-primary/50"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{selectedPath.name}</p>
            <p className="text-xs text-foreground-muted">
              {selectedPath.duration} &middot; {selectedPath.description.slice(0, 80)}...
            </p>
          </div>
          <ChevronDown
            className={cn(
              'ml-2 h-4 w-4 flex-shrink-0 text-foreground-muted transition-transform',
              dropdownOpen && 'rotate-180',
            )}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-elevated shadow-lg">
            {LEARNING_PATHS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPath(p.id)}
                className={cn(
                  'flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-primary/5',
                  p.id === selectedPathId && 'bg-primary/10',
                )}
              >
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-foreground-muted">{p.duration}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-foreground-muted">
          <span>Progress</span>
          <span>
            {completedWeeks}/{selectedPath.weeks.length} weeks ({progressPct}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Content: Timeline + Detail */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Timeline column */}
        <div className="w-48 flex-shrink-0 overflow-y-auto pr-2">
          {selectedPath.weeks.map((week, i) => (
            <WeekNode
              key={week.week}
              week={week}
              status={getWeekStatus(week)}
              isLast={i === selectedPath.weeks.length - 1}
              isSelected={week.week === selectedWeekNum}
              onClick={() => handleSelectWeek(week.week)}
            />
          ))}
        </div>

        {/* Week detail column */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <WeekDetail
            week={selectedWeek}
            status={getWeekStatus(selectedWeek)}
            pathId={selectedPath.id}
            onStartWeek={handleStartWeek}
            onSelectChallenge={onSelectChallenge}
          />
        </div>
      </div>
    </div>
  );
});
