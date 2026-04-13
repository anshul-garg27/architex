'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Star, Trophy, Flame, Target } from 'lucide-react';

interface PracticeDashboardProps {
  mastery: Record<string, number>;
  algorithms: Array<{ id: string; name: string; category: string; difficulty?: string }>;
}

export const PracticeDashboard = memo(function PracticeDashboard({ mastery, algorithms }: PracticeDashboardProps) {
  const stats = useMemo(() => {
    const total = algorithms.length;
    const started = Object.keys(mastery).length;
    const mastered = Object.values(mastery).filter(v => v >= 3).length;
    const avgLevel = started > 0 ? Object.values(mastery).reduce((a, b) => a + b, 0) / started : 0;
    return { total, started, mastered, avgLevel };
  }, [mastery, algorithms]);

  const byCategory = useMemo(() => {
    const cats: Record<string, { total: number; started: number; mastered: number }> = {};
    for (const algo of algorithms) {
      if (!cats[algo.category]) cats[algo.category] = { total: 0, started: 0, mastered: 0 };
      cats[algo.category].total++;
      if (mastery[algo.id]) cats[algo.category].started++;
      if ((mastery[algo.id] || 0) >= 3) cats[algo.category].mastered++;
    }
    return cats;
  }, [mastery, algorithms]);

  return (
    <div className="p-4 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-md border border-border bg-elevated p-2 text-center">
          <Target className="mx-auto h-4 w-4 text-foreground-subtle mb-1" />
          <div className="text-lg font-bold text-foreground">{stats.started}/{stats.total}</div>
          <div className="text-[9px] text-foreground-muted">Explored</div>
        </div>
        <div className="rounded-md border border-border bg-elevated p-2 text-center">
          <Star className="mx-auto h-4 w-4 text-amber-400 mb-1" />
          <div className="text-lg font-bold text-foreground">{stats.mastered}</div>
          <div className="text-[9px] text-foreground-muted">Mastered</div>
        </div>
        <div className="rounded-md border border-border bg-elevated p-2 text-center">
          <Trophy className="mx-auto h-4 w-4 text-primary mb-1" />
          <div className="text-lg font-bold text-foreground">{stats.avgLevel.toFixed(1)}</div>
          <div className="text-[9px] text-foreground-muted">Avg Level</div>
        </div>
        <div className="rounded-md border border-border bg-elevated p-2 text-center">
          <Flame className="mx-auto h-4 w-4 text-orange-400 mb-1" />
          <div className="text-lg font-bold text-foreground">{Math.round(stats.started / stats.total * 100)}%</div>
          <div className="text-[9px] text-foreground-muted">Coverage</div>
        </div>
      </div>

      {/* Per-category breakdown */}
      <div className="space-y-2">
        {Object.entries(byCategory).map(([cat, data]) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-24 text-xs font-medium text-foreground-muted capitalize">{cat}</span>
            <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(data.started / data.total) * 100}%` }} />
            </div>
            <span className="text-[10px] text-foreground-subtle">{data.started}/{data.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
