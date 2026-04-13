'use client';

// ─────────────────────────────────────────────────────────────
// DesignBattle — Multiplayer Design Battle UI
// ─────────────────────────────────────────────────────────────
//
// Layout:
//   Top    — Challenge title + countdown timer
//   Split  — Your canvas (left) | Opponent canvas read-only (right)
//   Center — Requirements checklist with live check-marks
//   Bottom — Submit button, results comparison, Elo delta
//
// Animation: motion spring for timer pulse, stagger for
//            requirement list, scale+color for Elo change
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Swords,
  Timer,
  Trophy,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  ChevronRight,
  Send,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Crown,
  User,
} from 'lucide-react';
import {
  BATTLE_CHALLENGES,
  createBattleSession,
  submitDesign,
  finalizeBattle,
  scoreDesign,
  type BattleChallenge,
  type BattleSession,
  type DesignSnapshot,
  type DesignScore,
} from '@/lib/innovation/design-battles';
import { useCanvasStore } from '@/stores/canvas-store';

// ── Types ──────────────────────────────────────────────────

export interface DesignBattleProps {
  className?: string;
  /** External canvas snapshot override. */
  canvasOverride?: DesignSnapshot;
}

type DifficultyTab = 'beginner' | 'intermediate' | 'advanced';

// ── Constants ──────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<DifficultyTab, { bg: string; text: string; ring: string }> = {
  beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/30' },
};

const MOCK_OPPONENT = { id: 'opponent-ai', name: 'AI Opponent' };
const MOCK_PLAYER = { id: 'player-local', name: 'You' };

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

/** Simulate an AI opponent building a design over time. */
function generateOpponentDesign(challenge: BattleChallenge): DesignSnapshot {
  // Generate nodes matching ~60-80% of requirements for a plausible opponent
  const nodeTypes = new Set<string>();
  for (const req of challenge.requirements) {
    if (req.check.kind === 'hasNodeType') nodeTypes.add(req.check.nodeType);
    if (req.check.kind === 'hasNodeTypeCount') nodeTypes.add(req.check.nodeType);
  }
  const types = Array.from(nodeTypes);
  // Take a random subset (60-80%)
  const count = Math.max(1, Math.floor(types.length * (0.6 + Math.random() * 0.2)));
  const selected = types.slice(0, count);

  const nodes = selected.map((t, i) => ({
    id: `opp-${t}-${i}`,
    type: t,
    position: { x: 100 + i * 150, y: 100 + (i % 2) * 100 },
    data: { label: t },
  }));

  const edges = nodes.slice(1).map((n, i) => ({
    id: `opp-edge-${i}`,
    source: nodes[i].id,
    target: n.id,
  }));

  return { nodes, edges };
}

// ── Component ──────────────────────────────────────────────

export const DesignBattle = memo(function DesignBattle({
  className,
  canvasOverride,
}: DesignBattleProps) {
  const [tab, setTab] = useState<DifficultyTab>('beginner');
  const [session, setSession] = useState<BattleSession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [playerScore, setPlayerScore] = useState<DesignScore | null>(null);
  const [opponentScore, setOpponentScore] = useState<DesignScore | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opponentDesignRef = useRef<DesignSnapshot | null>(null);

  // Canvas state
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const canvas: DesignSnapshot = canvasOverride ?? { nodes, edges };

  // Filtered challenges
  const challenges = BATTLE_CHALLENGES.filter((c) => c.difficulty === tab);

  // ── Timer tick ──
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-finalize when timer hits zero ──
  useEffect(() => {
    if (remaining === 0 && session?.status === 'active' && !submitted) {
      handleSubmit();
    }
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──
  const handleStart = useCallback(
    (challenge: BattleChallenge) => {
      const s = createBattleSession(challenge, MOCK_PLAYER, MOCK_OPPONENT);
      opponentDesignRef.current = generateOpponentDesign(challenge);
      setSession(s);
      setRemaining(challenge.timeLimit);
      setPlayerScore(null);
      setOpponentScore(null);
      setSubmitted(false);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!session || submitted) return;
    setSubmitted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Submit both designs
    const oppDesign = opponentDesignRef.current ?? { nodes: [], edges: [] };
    let updated = submitDesign(session, MOCK_PLAYER.id, canvas);
    updated = submitDesign(updated, MOCK_OPPONENT.id, oppDesign);

    // Finalize with mock Elo ratings
    const finalized = finalizeBattle(updated, {
      [MOCK_PLAYER.id]: 1200,
      [MOCK_OPPONENT.id]: 1200,
    });

    setSession(finalized);

    // Compute individual scores for display
    setPlayerScore(scoreDesign(canvas, session.challenge.requirements));
    setOpponentScore(scoreDesign(oppDesign, session.challenge.requirements));
  }, [session, submitted, canvas]);

  const handleRestart = useCallback(() => {
    setSession(null);
    setRemaining(0);
    setPlayerScore(null);
    setOpponentScore(null);
    setSubmitted(false);
    opponentDesignRef.current = null;
  }, []);

  // ── Live requirement checking ──
  const liveReqs = session?.status === 'active'
    ? session.challenge.requirements.map((req) => {
        const check = req.check;
        const met =
          check.kind === 'hasMinNodes'
            ? canvas.nodes.length >= check.min
            : check.kind === 'hasNodeType'
              ? canvas.nodes.some((n) => n.type === check.nodeType)
              : check.kind === 'hasMinEdges'
                ? canvas.edges.length >= check.min
                : check.kind === 'hasNodeTypeCount'
                  ? canvas.nodes.filter((n) => n.type === check.nodeType).length >= check.min
                  : false;
        return { ...req, met };
      })
    : [];

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className={cn('flex flex-col gap-4 rounded-xl bg-zinc-900 p-4', className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-rose-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Design Battle</h2>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════ */}
        {/* CHALLENGE SELECTOR */}
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
                  key={c.id}
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
        {/* ACTIVE BATTLE / RESULTS */}
        {/* ══════════════════════════════════════════════════ */}
        {session && (
          <motion.div
            key="battle"
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
                  getTimerColor(remaining, session.challenge.timeLimit),
                )}
                animate={
                  remaining <= 10 && session.status === 'active'
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {formatTime(remaining)}
              </motion.div>
              <div className="text-xs text-zinc-500">{session.challenge.title}</div>

              {/* Progress bar */}
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    remaining / session.challenge.timeLimit > 0.5
                      ? 'bg-emerald-500'
                      : remaining / session.challenge.timeLimit > 0.2
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  initial={false}
                  animate={{
                    width: `${(remaining / session.challenge.timeLimit) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* ── Split-screen indicator ── */}
            {session.status === 'active' && (
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-300">Your Canvas</span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <User className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-500">
                    {MOCK_OPPONENT.name} (building...)
                  </span>
                </div>
              </div>
            )}

            {/* ── Requirements Checklist ── */}
            {session.status === 'active' && (
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-medium text-zinc-400">Requirements</div>
                {liveReqs.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                      req.met ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400',
                    )}
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
                    )}
                    <span className={cn(req.met && 'line-through opacity-70')}>{req.label}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── Submit button ── */}
            {session.status === 'active' && !submitted && (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                <Send className="h-4 w-4" />
                Submit Design
              </button>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* RESULTS COMPARISON */}
            {/* ══════════════════════════════════════════════ */}
            <AnimatePresence>
              {session.status === 'completed' && playerScore && opponentScore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-700 bg-zinc-800/80 p-4"
                >
                  {/* Winner banner */}
                  <div className="flex items-center justify-center gap-2">
                    {session.winnerId === MOCK_PLAYER.id ? (
                      <div className="flex items-center gap-2 text-amber-400">
                        <Crown className="h-5 w-5" />
                        <span className="text-sm font-semibold">Victory!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Trophy className="h-5 w-5" />
                        <span className="text-sm font-semibold">Defeat</span>
                      </div>
                    )}
                  </div>

                  {/* Score comparison */}
                  <div className="flex gap-3">
                    {/* Player score */}
                    <div
                      className={cn(
                        'flex flex-1 flex-col items-center gap-1 rounded-lg border p-3',
                        session.winnerId === MOCK_PLAYER.id
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-zinc-700 bg-zinc-800/50',
                      )}
                    >
                      <span className="text-xs text-zinc-500">You</span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="text-2xl font-bold text-zinc-100"
                      >
                        {playerScore.score}
                      </motion.span>
                      <span className="text-xs text-zinc-500">
                        {playerScore.percentage}%
                      </span>
                    </div>

                    {/* VS divider */}
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-zinc-600">VS</span>
                    </div>

                    {/* Opponent score */}
                    <div
                      className={cn(
                        'flex flex-1 flex-col items-center gap-1 rounded-lg border p-3',
                        session.winnerId === MOCK_OPPONENT.id
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-zinc-700 bg-zinc-800/50',
                      )}
                    >
                      <span className="text-xs text-zinc-500">{MOCK_OPPONENT.name}</span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="text-2xl font-bold text-zinc-100"
                      >
                        {opponentScore.score}
                      </motion.span>
                      <span className="text-xs text-zinc-500">
                        {opponentScore.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Elo rating change */}
                  {session.eloDelta && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-3"
                    >
                      <span className="text-xs text-zinc-500">Elo Rating:</span>
                      {session.winnerId === MOCK_PLAYER.id ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                          <ArrowUp className="h-3.5 w-3.5" />
                          +{session.eloDelta.winnerDelta}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm font-semibold text-red-400">
                          <ArrowDown className="h-3.5 w-3.5" />
                          {session.eloDelta.loserDelta}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Score breakdown */}
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-medium text-zinc-400">Your Breakdown</div>
                    {playerScore.breakdown.map((item) => (
                      <div
                        key={item.requirementId}
                        className={cn(
                          'flex items-center justify-between rounded px-2 py-1 text-xs',
                          item.met ? 'text-emerald-400' : 'text-zinc-500',
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {item.met ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <span className="font-mono">
                          {item.points}/{item.weight * 10}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Restart button */}
                  <button
                    onClick={handleRestart}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    New Battle
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
