"use client";

import React, { memo, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Link,
  Search,
  Code,
  ArrowDown,
  Merge,
  Share2,
  Columns2,
  HelpCircle,
  Maximize2,
  Flame,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Undo2,
  Redo2,
  Download,
} from "lucide-react";
import { DatabaseTourReplayButton } from "./DatabaseTour";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import {
  getTodaysChallenge,
  isDailyChallengeCompleted,
  markDailyChallengeCompleted,
} from "@/lib/database/daily-challenges";
import type {
  EREntity,
  IsolationLevel,
  BTreeStep,
  HashIndexStep,
  LSMVizStep,
  MVCCStep,
  JoinStep,
  JoinAlgorithm,
  ARIESStep,
} from "@/lib/database";
import type { SampleERDiagram } from "@/lib/database";
import { SAMPLE_ER_DIAGRAMS } from "@/lib/database";
import type { DatabaseMode } from "./useDatabaseModule";
import type { ACIDProperty } from "./canvases/ACIDCanvas";

// ── Mode Definitions ──────────────────────────────────────────

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface ModeDef {
  id: DatabaseMode;
  name: string;
  description: string;
  difficulty: Difficulty;
  interviewTag?: string;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Beginner: "bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
  Intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
  Advanced: "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
};

const MODES = [
  {
    id: "er-diagram",
    name: "ER Diagram Builder",
    difficulty: "Beginner",
    description: "Before writing any SQL, you need a blueprint. ER diagrams are the architectural drawings of your database — get them wrong, and you'll be fixing schema problems for years.",
  },
  {
    id: "normalization",
    name: "Normalization",
    difficulty: "Beginner",
    description: "Your spreadsheet repeats every customer's address on every order row. Customer moves? Update 500 rows. Miss one? Now you have two addresses. Normalization prevents this nightmare.",
    interviewTag: "Asked everywhere",
  },
  {
    id: "transaction-isolation",
    name: "Transaction Isolation",
    difficulty: "Intermediate",
    description: "Two users buy the last concert ticket simultaneously. What happens to your bank account depends on the isolation level.",
    interviewTag: "Senior+ interviews",
  },
  {
    id: "btree-index",
    name: "B-Tree Index",
    difficulty: "Intermediate",
    description: "Your database has 10 million rows. Without an index, finding one row means checking ALL of them. B-Trees make it take just 4 comparisons.",
    interviewTag: "Asked at Google",
  },
  {
    id: "bplus-tree",
    name: "B+ Tree Index",
    difficulty: "Intermediate",
    description: "Visualize B+ Tree with leaf linked list, range queries, and page splits — the index structure real databases use.",
  },
  {
    id: "hash-index",
    name: "Hash Index",
    difficulty: "Intermediate",
    description: "Need to find one record by exact key? Hash indexes do it in ONE step — constant time regardless of table size. But they can't sort or do range scans.",
    interviewTag: "Asked at Amazon",
  },
  {
    id: "query-plans",
    name: "Query Plans",
    difficulty: "Intermediate",
    description: "You write SELECT * FROM users WHERE email='alice'. The database doesn't just execute it literally — it creates a PLAN, like Google Maps choosing the fastest route.",
    interviewTag: "Asked at Meta",
  },
  {
    id: "lsm-tree",
    name: "LSM-Tree",
    difficulty: "Advanced",
    description: "B-Trees are great for reading but every write does random disk I/O. LSM-Trees flip this: writes are sequential and lightning fast. That's why Cassandra can handle 1M writes/sec.",
  },
  {
    id: "acid",
    name: "ACID Properties",
    difficulty: "Beginner",
    description: "Understand Atomicity, Consistency, Isolation, and Durability \u2014 the four guarantees every database provides.",
  },
  {
    id: "cap-theorem",
    name: "CAP Theorem",
    difficulty: "Intermediate",
    description: "Consistency, Availability, Partition tolerance \u2014 you can only pick two. See how real databases make this tradeoff.",
  },
  {
    id: "mvcc",
    name: "MVCC",
    difficulty: "Advanced",
    description: "Instead of locking rows, PostgreSQL keeps multiple versions. Each transaction sees a frozen snapshot \u2014 writers never block readers.",
  },
  {
    id: "row-vs-column",
    name: "Row vs Column Store",
    difficulty: "Intermediate",
    description: "Row stores keep entire rows together \u2014 fast for transactions. Column stores keep columns together \u2014 fast for analytics. See why your choice matters.",
  },
  {
    id: "sql-vs-nosql",
    name: "SQL vs NoSQL",
    difficulty: "Beginner",
    description: "When should you pick PostgreSQL over MongoDB? Interactive comparison table, decision flowchart, and real-world examples from Instagram, WhatsApp, and more.",
  },
  {
    id: "index-anti-patterns",
    name: "Index Anti-Patterns",
    difficulty: "Intermediate",
    description: "5 common indexing mistakes that kill query performance. See why your query does a SeqScan and how to fix it with the right index strategy.",
  },
  {
    id: "caching-patterns",
    name: "Caching Patterns",
    difficulty: "Intermediate",
    description: "Cache-aside, write-through, write-behind \u2014 the three patterns every system design interview asks about. See how Redis + PostgreSQL work together.",
  },
  {
    id: "join-algorithms",
    name: "Join Algorithms",
    difficulty: "Intermediate",
    description: "Nested Loop, Sort-Merge, Hash Join \u2014 the three strategies databases use to combine tables. See why Hash Join is O(n+m) while Nested Loop is O(n*m).",
  },
  {
    id: "aries-recovery",
    name: "ARIES Recovery",
    difficulty: "Advanced",
    description: "How databases recover from crashes. Walk through the 3-phase ARIES algorithm: Analysis, Redo, Undo \u2014 the gold standard for write-ahead log recovery.",
  },
  {
    id: "star-snowflake",
    name: "Star & Snowflake Schema",
    difficulty: "Intermediate",
    description: "Data warehouse schemas for analytics. Star schemas denormalize for speed; snowflake schemas normalize dimensions for storage efficiency.",
  },
  {
    id: "connection-pooling",
    name: "Connection Pooling",
    difficulty: "Intermediate",
    description: "Opening a database connection takes ~50ms. Connection pools maintain reusable connections, turning that 50ms into near-zero for every query.",
  },
] satisfies ModeDef[];

const DatabaseSidebar = memo(function DatabaseSidebar({
  activeMode,
  onSelectMode,
  onShare,
  // ER actions
  onAddEntity,
  onAddRelationship,
  onGenerateSQL,
  onLoadSample,
  entities,
  // DBL-033: Undo/Redo
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  undoRedoVersion: _undoRedoVersion,
  // DBL-049: Export PNG
  onExport,
  // Transaction controls
  txLevel,
  onTxLevelChange,
  txStepIndex,
  txTotalSteps,
  onTxStep,
  onTxStepBack,
  onTxPlay,
  onTxReset,
  // Compare mode (DBL-046)
  txCompareMode,
  onTxCompareModeToggle,
  txCompareScenario,
  onTxCompareScenarioChange,
  txCompareStepIndex,
  txCompareTotalSteps,
  onTxCompareStep,
  onTxComparePlay,
  onTxCompareReset,
  // Write Skew (DBL-080)
  onLoadWriteSkew,
  txHasOverride,
  // Prediction mode (DBL-131)
  txPredictionMode,
  onTxPredictionModeToggle,
  predictionPaused,
  // B-Tree controls
  btreeOrder,
  onBtreeOrderChange,
  btreeKeyInput,
  onBtreeKeyInputChange,
  onBtreeInsert,
  btreeSearchInput,
  onBtreeSearchInputChange,
  onBtreeSearch,
  btreeSteps,
  btreeStepIndex,
  isBtreePlaying,
  onBtreeStepBack,
  onBtreeStepForward,
  onBtreePlay,
  onBtreePause,
  onBtreeReset,
  // B-Tree explore (DBL-058)
  onBtreeExploreSorted,
  onBtreeExploreRandom,
  // B-Tree prediction mode (DBL-129)
  btreePredictionMode,
  onBtreePredictionModeToggle,
  btreePredictionPaused,
  btreePredictionScore,
  // Hash Index controls
  hashKeyInput,
  onHashKeyInputChange,
  hashValueInput,
  onHashValueInputChange,
  onHashInsert,
  hashSearchInput,
  onHashSearchInputChange,
  onHashSearch,
  hashDeleteInput,
  onHashDeleteInputChange,
  onHashDelete,
  hashSteps,
  hashStepIndex,
  isHashPlaying,
  onHashStepBack,
  onHashStepForward,
  onHashPlay,
  onHashPause,
  onHashReset,
  // Hash explore (DBL-058)
  onHashExploreCollision,
  onHashExploreResize,
  // Hash prediction mode (DBL-130)
  hashPredictionMode,
  onHashPredictionModeToggle,
  hashPredictionPaused,
  hashPredictionScore,
  // Query plan controls
  queryPlanSql,
  onQueryPlanSqlChange,
  onQueryPlanAnalyze,
  // LSM-Tree controls
  lsmKeyInput,
  onLsmKeyInputChange,
  lsmValueInput,
  onLsmValueInputChange,
  onLsmWrite,
  lsmReadInput,
  onLsmReadInputChange,
  onLsmRead,
  onLsmFlush,
  onLsmCompact,
  lsmSteps,
  lsmStepIndex,
  isLsmPlaying,
  onLsmStepBack,
  onLsmStepForward,
  onLsmPlay,
  onLsmPause,
  onLsmReset,
  // LSM explore (DBL-058)
  onLsmExploreFlush,
  onLsmExploreCompaction,
  onLsmCheckpoint,
  onLsmToggleBloom,
  lsmBloomEnabled,
  // ACID controls
  acidProperty,
  acidStepIndex,
  acidTotalSteps,
  onAcidPropertyChange,
  onAcidStepBack,
  onAcidStep,
  onAcidPlay,
  onAcidReset,
  // CAP controls
  capSimType,
  capStepIndex,
  capTotalSteps,
  onCapSimTypeChange,
  onCapStepBack,
  onCapStep,
  onCapPlay,
  onCapReset,
  // MVCC controls
  mvccSteps,
  mvccStepIndex,
  mvccTotalSteps,
  isMvccPlaying,
  onMvccRunDemo,
  onMvccStepBack,
  onMvccStepForward,
  onMvccPlay,
  onMvccPause,
  onMvccReset,
  // ARIES Recovery (DBL-091)
  ariesSteps,
  ariesStepIndex,
  ariesTotalSteps,
  isAriesPlaying,
  onAriesRunDemo,
  onAriesStepBack,
  onAriesStepForward,
  onAriesPlay,
  onAriesPause,
  onAriesReset,
  // Caching Patterns (DBL-079)
  cachingPattern,
  cachingStepIndex,
  cachingTotalSteps,
  isCachingPlaying,
  onCachingPatternChange,
  onCachingStep,
  onCachingStepBack,
  onCachingPlay,
  onCachingPause,
  onCachingReset,
  // Join Algorithms (DBL-076)
  joinAlgorithm,
  joinSteps,
  joinStepIndex,
  joinTotalSteps,
  isJoinPlaying,
  onJoinAlgorithmChange,
  onJoinRun,
  onJoinStepBack,
  onJoinStepForward,
  onJoinPlay,
  onJoinPause,
  onJoinReset,
  // Star/Snowflake Schema (DBL-088)
  starSnowflakeType,
  starSnowflakeStepIndex,
  starSnowflakeTotalSteps,
  isStarSnowflakePlaying,
  onStarSnowflakeTypeChange,
  onStarSnowflakeStep,
  onStarSnowflakeStepBack,
  onStarSnowflakePlay,
  onStarSnowflakePause,
  onStarSnowflakeReset,
  // Connection Pooling (DBL-093)
  connPoolMode,
  connPoolSize,
  connPoolStepIndex,
  connPoolTotalSteps,
  isConnPoolPlaying,
  onConnPoolModeChange,
  onConnPoolSizeChange,
  onConnPoolStep,
  onConnPoolStepBack,
  onConnPoolPlay,
  onConnPoolPause,
  onConnPoolReset,
  // Speed controls
  animationSpeed,
  onAnimationSpeedChange,
  smartSpeed,
  onSmartSpeedChange,
  // Presentation mode (DBL-060)
  onEnterPresentation,
  // Tour replay (DBL-178)
  onTourReplay,
  // Challenge Mode (DBL-056)
  challengeModeEnabled,
  onChallengeModeToggle,
  challengeScore,
}: {
  activeMode: DatabaseMode;
  onSelectMode: (m: DatabaseMode) => void;
  onShare: () => void;
  onAddEntity: () => void;
  onAddRelationship: () => void;
  onGenerateSQL: () => void;
  onLoadSample: (sample: SampleERDiagram) => void;
  entities: EREntity[];
  // DBL-033: Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoRedoVersion: number;
  // DBL-049: Export PNG
  onExport: () => void;
  txLevel: IsolationLevel;
  onTxLevelChange: (l: IsolationLevel) => void;
  txStepIndex: number;
  txTotalSteps: number;
  onTxStep: () => void;
  onTxStepBack: () => void;
  onTxPlay: () => void;
  onTxReset: () => void;
  // Compare mode (DBL-046)
  txCompareMode: boolean;
  onTxCompareModeToggle: () => void;
  txCompareScenario: "dirty-read" | "phantom-read";
  onTxCompareScenarioChange: (s: "dirty-read" | "phantom-read") => void;
  txCompareStepIndex: number;
  txCompareTotalSteps: number;
  onTxCompareStep: () => void;
  onTxComparePlay: () => void;
  onTxCompareReset: () => void;
  // Write Skew (DBL-080)
  onLoadWriteSkew: () => void;
  txHasOverride: boolean;
  // Prediction mode (DBL-131)
  txPredictionMode: boolean;
  onTxPredictionModeToggle: () => void;
  predictionPaused: boolean;
  // B-Tree
  btreeOrder: number;
  onBtreeOrderChange: (order: number) => void;
  btreeKeyInput: string;
  onBtreeKeyInputChange: (v: string) => void;
  onBtreeInsert: () => void;
  btreeSearchInput: string;
  onBtreeSearchInputChange: (v: string) => void;
  onBtreeSearch: () => void;
  btreeSteps: BTreeStep[];
  btreeStepIndex: number;
  isBtreePlaying: boolean;
  onBtreeStepBack: () => void;
  onBtreeStepForward: () => void;
  onBtreePlay: () => void;
  onBtreePause: () => void;
  onBtreeReset: () => void;
  // B-Tree explore (DBL-058)
  onBtreeExploreSorted: () => void;
  onBtreeExploreRandom: () => void;
  // B-Tree prediction mode (DBL-129)
  btreePredictionMode: boolean;
  onBtreePredictionModeToggle: () => void;
  btreePredictionPaused: boolean;
  btreePredictionScore: { correct: number; total: number };
  // Hash Index
  hashKeyInput: string;
  onHashKeyInputChange: (v: string) => void;
  hashValueInput: string;
  onHashValueInputChange: (v: string) => void;
  onHashInsert: () => void;
  hashSearchInput: string;
  onHashSearchInputChange: (v: string) => void;
  onHashSearch: () => void;
  hashDeleteInput: string;
  onHashDeleteInputChange: (v: string) => void;
  onHashDelete: () => void;
  hashSteps: HashIndexStep[];
  hashStepIndex: number;
  isHashPlaying: boolean;
  onHashStepBack: () => void;
  onHashStepForward: () => void;
  onHashPlay: () => void;
  onHashPause: () => void;
  onHashReset: () => void;
  // Hash explore (DBL-058)
  onHashExploreCollision: () => void;
  onHashExploreResize: () => void;
  // Hash prediction mode (DBL-130)
  hashPredictionMode: boolean;
  onHashPredictionModeToggle: () => void;
  hashPredictionPaused: boolean;
  hashPredictionScore: { correct: number; total: number };
  // Query plan
  queryPlanSql: string;
  onQueryPlanSqlChange: (v: string) => void;
  onQueryPlanAnalyze: () => void;
  // LSM-Tree
  lsmKeyInput: string;
  onLsmKeyInputChange: (v: string) => void;
  lsmValueInput: string;
  onLsmValueInputChange: (v: string) => void;
  onLsmWrite: () => void;
  lsmReadInput: string;
  onLsmReadInputChange: (v: string) => void;
  onLsmRead: () => void;
  onLsmFlush: () => void;
  onLsmCompact: (level: number) => void;
  lsmSteps: LSMVizStep[];
  lsmStepIndex: number;
  isLsmPlaying: boolean;
  onLsmStepBack: () => void;
  onLsmStepForward: () => void;
  onLsmPlay: () => void;
  onLsmPause: () => void;
  onLsmReset: () => void;
  // LSM explore (DBL-058)
  onLsmExploreFlush: () => void;
  onLsmExploreCompaction: () => void;
  onLsmCheckpoint: () => void;
  onLsmToggleBloom: () => void;
  lsmBloomEnabled: boolean;
  // ACID
  acidProperty: ACIDProperty;
  acidStepIndex: number;
  acidTotalSteps: number;
  onAcidPropertyChange: (p: ACIDProperty) => void;
  onAcidStepBack: () => void;
  onAcidStep: () => void;
  onAcidPlay: () => void;
  onAcidReset: () => void;
  // CAP
  capSimType: "cp" | "ap";
  capStepIndex: number;
  capTotalSteps: number;
  onCapSimTypeChange: (type: "cp" | "ap") => void;
  onCapStepBack: () => void;
  onCapStep: () => void;
  onCapPlay: () => void;
  onCapReset: () => void;
  // MVCC
  mvccSteps: MVCCStep[];
  mvccStepIndex: number;
  mvccTotalSteps: number;
  isMvccPlaying: boolean;
  onMvccRunDemo: () => void;
  onMvccStepBack: () => void;
  onMvccStepForward: () => void;
  onMvccPlay: () => void;
  onMvccPause: () => void;
  onMvccReset: () => void;
  // ARIES Recovery (DBL-091)
  ariesSteps: ARIESStep[];
  ariesStepIndex: number;
  ariesTotalSteps: number;
  isAriesPlaying: boolean;
  onAriesRunDemo: () => void;
  onAriesStepBack: () => void;
  onAriesStepForward: () => void;
  onAriesPlay: () => void;
  onAriesPause: () => void;
  onAriesReset: () => void;
  // Caching Patterns (DBL-079)
  cachingPattern: string;
  cachingStepIndex: number;
  cachingTotalSteps: number;
  isCachingPlaying: boolean;
  onCachingPatternChange: (p: "cache-aside" | "write-through" | "write-behind") => void;
  onCachingStep: () => void;
  onCachingStepBack: () => void;
  onCachingPlay: () => void;
  onCachingPause: () => void;
  onCachingReset: () => void;
  // Join Algorithms (DBL-076)
  joinAlgorithm: JoinAlgorithm;
  joinSteps: JoinStep[];
  joinStepIndex: number;
  joinTotalSteps: number;
  isJoinPlaying: boolean;
  onJoinAlgorithmChange: (algo: JoinAlgorithm) => void;
  onJoinRun: () => void;
  onJoinStepBack: () => void;
  onJoinStepForward: () => void;
  onJoinPlay: () => void;
  onJoinPause: () => void;
  onJoinReset: () => void;
  // Star/Snowflake Schema (DBL-088)
  starSnowflakeType: string;
  starSnowflakeStepIndex: number;
  starSnowflakeTotalSteps: number;
  isStarSnowflakePlaying: boolean;
  onStarSnowflakeTypeChange: (s: "star" | "snowflake") => void;
  onStarSnowflakeStep: () => void;
  onStarSnowflakeStepBack: () => void;
  onStarSnowflakePlay: () => void;
  onStarSnowflakePause: () => void;
  onStarSnowflakeReset: () => void;
  // Connection Pooling (DBL-093)
  connPoolMode: string;
  connPoolSize: number;
  connPoolStepIndex: number;
  connPoolTotalSteps: number;
  isConnPoolPlaying: boolean;
  onConnPoolModeChange: (m: "no-pooling" | "with-pooling") => void;
  onConnPoolSizeChange: (s: number) => void;
  onConnPoolStep: () => void;
  onConnPoolStepBack: () => void;
  onConnPoolPlay: () => void;
  onConnPoolPause: () => void;
  onConnPoolReset: () => void;
  // Speed controls
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  smartSpeed: boolean;
  onSmartSpeedChange: (enabled: boolean) => void;
  // Presentation mode (DBL-060)
  onEnterPresentation: () => void;
  // Tour replay (DBL-178)
  onTourReplay: () => void;
  // Challenge Mode (DBL-056)
  challengeModeEnabled: boolean;
  onChallengeModeToggle: () => void;
  challengeScore: { correct: number; total: number };
}) {
  const TX_LEVELS: { id: IsolationLevel; name: string }[] = [
    { id: "read-uncommitted", name: "Read Uncommitted" },
    { id: "read-committed", name: "Read Committed" },
    { id: "repeatable-read", name: "Repeatable Read" },
    { id: "serializable", name: "Serializable" },
  ];

  // ── DBL-141: Streak & XP from progress store ──────────────
  const streakDays = useProgressStore((s) => s.streakDays);
  const totalXP = useProgressStore((s) => s.totalXP);
  const addXP = useProgressStore((s) => s.addXP);

  // ── DBL-142: Daily Challenge ──────────────────────────────
  const [challengeExpanded, setChallengeExpanded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(isDailyChallengeCompleted);
  const todaysChallenge = getTodaysChallenge();

  const handleChallengeAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null || challengeCompleted) return;
      setSelectedAnswer(index);
      if (index === todaysChallenge.correctIndex) {
        addXP(20);
        markDailyChallengeCompleted();
        setChallengeCompleted(true);
      }
    },
    [selectedAnswer, challengeCompleted, todaysChallenge.correctIndex, addXP],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Mode selector header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Database Design
        </h2>
      </div>

      {/* DBL-141: Streak + XP bar */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="font-bold text-foreground">{streakDays}</span>
          <span className="text-[11px] text-foreground-muted">day streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          <span className="font-bold text-foreground">{totalXP}</span>
          <span className="text-[11px] text-foreground-muted">XP</span>
        </div>
      </div>

      {/* DBL-056: Challenge Mode toggle */}
      <div className="border-b border-sidebar-border">
        <button
          onClick={onChallengeModeToggle}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors",
            challengeModeEnabled
              ? "bg-violet-500/10 text-violet-300"
              : "text-foreground-muted hover:bg-elevated hover:text-foreground",
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="flex-1">
            {challengeModeEnabled ? "Challenge Mode ON" : "Challenge Mode"}
          </span>
          {challengeModeEnabled && challengeScore.total > 0 && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.1)]">
              {challengeScore.correct}/{challengeScore.total}{" "}
              ({challengeScore.total > 0 ? Math.round((challengeScore.correct / challengeScore.total) * 100) : 0}%)
            </span>
          )}
        </button>
        {challengeModeEnabled && (
          <p className="px-3 pb-2 text-[10px] text-foreground-subtle">
            Prediction active in all modes. Navigate between modes to test your knowledge across B-Tree, Hash, and Transaction Isolation.
          </p>
        )}
      </div>

      {/* DBL-142: Daily Challenge */}
      <div className="border-b border-sidebar-border">
        <button
          onClick={() => setChallengeExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-300 transition-colors hover:bg-elevated"
        >
          {challengeCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Star className="h-3.5 w-3.5 text-amber-400" />
          )}
          <span className="flex-1">
            {challengeCompleted ? "Challenge Complete!" : "Today's Challenge"}
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
            +20 XP
          </span>
          {challengeExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-foreground-muted" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
          )}
        </button>

        {challengeExpanded && (
          <div className="space-y-2 px-3 pb-3">
            <p className="text-[11px] leading-relaxed text-foreground-muted">
              {todaysChallenge.question}
            </p>
            <div className="space-y-1">
              {todaysChallenge.options.map((option, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === todaysChallenge.correctIndex;
                const showResult = selectedAnswer !== null || challengeCompleted;

                let optionStyle =
                  "border border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:bg-background hover:text-foreground";
                if (showResult && isCorrect) {
                  optionStyle =
                    "border border-green-500/30 bg-green-500/10 text-green-300";
                } else if (showResult && isSelected && !isCorrect) {
                  optionStyle =
                    "border border-red-500/30 bg-red-500/10 text-red-300";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleChallengeAnswer(i)}
                    disabled={selectedAnswer !== null || challengeCompleted}
                    className={cn(
                      "w-full rounded-xl px-2.5 py-1.5 text-left text-[11px] transition-colors disabled:cursor-default",
                      optionStyle,
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation after answering */}
            {(selectedAnswer !== null || challengeCompleted) && (
              <div className="rounded-xl border border-border/30 bg-background/50 px-2.5 py-2">
                <p className="text-[10px] leading-relaxed text-foreground-subtle">
                  {todaysChallenge.explanation}
                </p>
                {challengeCompleted && (
                  <p className="mt-1.5 text-[10px] font-medium text-green-400">
                    Come back tomorrow for a new challenge!
                  </p>
                )}
              </div>
            )}

            <p className="text-[9px] uppercase tracking-wider text-foreground-subtle">
              {todaysChallenge.category}
            </p>
          </div>
        )}
      </div>

      {/* Mode list */}
      <div data-onboarding="db-mode-list" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className={cn(
              "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
              activeMode === m.id
                ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {m.name}
              {m.difficulty && (
                <span className={cn(
                  "inline-block rounded-full border px-2 py-0 text-[9px] font-semibold leading-4 backdrop-blur-sm",
                  DIFFICULTY_STYLES[m.difficulty],
                )}>
                  {m.difficulty}
                </span>
              )}
            </span>
            <span className="block text-[11px] text-foreground-subtle">
              {m.description}
            </span>
            {m.interviewTag && (
              <span className="mt-1 block text-[10px] font-medium text-violet-400">
                {m.interviewTag}
              </span>
            )}
          </button>
        ))}

        {/* ER Diagram palette */}
        {activeMode === "er-diagram" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Palette
            </span>
            <button
              onClick={onAddEntity}
              className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Entity
            </button>
            <button
              onClick={onAddRelationship}
              disabled={entities.length < 2}
              className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground disabled:opacity-40"
            >
              <Link className="h-3.5 w-3.5" />
              Add Relationship
            </button>
            <button
              onClick={onGenerateSQL}
              disabled={entities.length === 0}
              className="mb-1 flex w-full items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-left text-xs font-medium text-primary shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/20 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Code className="h-3.5 w-3.5" />
              Generate SQL
            </button>

            {/* DBL-033: Undo/Redo buttons */}
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/30 bg-background px-2 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground disabled:opacity-40"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/30 bg-background px-2 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground disabled:opacity-40"
              >
                <Redo2 className="h-3.5 w-3.5" />
                Redo
              </button>
            </div>

            {/* Load Example dropdown */}
            <div className="mt-3">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Load Example
              </span>
              {SAMPLE_ER_DIAGRAMS.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => onLoadSample(sample)}
                  className="mb-1 w-full rounded-xl px-3 py-2 text-left text-xs text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
                >
                  <span className="block font-medium">{sample.name}</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transaction level selector */}
        {activeMode === "transaction-isolation" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Isolation Level
            </span>
            {!txCompareMode && TX_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => onTxLevelChange(l.id)}
                className={cn(
                  "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                  txLevel === l.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-elevated",
                )}
              >
                {l.name}
              </button>
            ))}

            {/* Compare Mode Toggle (DBL-046) */}
            <div className="mt-3 border-t border-sidebar-border pt-3">
              <button
                onClick={onTxCompareModeToggle}
                className={cn(
                  "mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                  txCompareMode
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
                {txCompareMode ? "Compare ON" : "Compare Levels"}
              </button>

              {txCompareMode && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                    Scenario
                  </span>
                  {([
                    { id: "dirty-read" as const, label: "Dirty Read", sub: "Read Uncommitted vs Read Committed" },
                    { id: "phantom-read" as const, label: "Phantom Read", sub: "Repeatable Read vs Serializable" },
                  ]).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onTxCompareScenarioChange(s.id)}
                      className={cn(
                        "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        txCompareScenario === s.id
                          ? "bg-amber-500/10 text-amber-300"
                          : "text-foreground-muted hover:bg-elevated",
                      )}
                    >
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-[10px] text-foreground-subtle">{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prediction Mode Toggle (DBL-131) */}
            {!txCompareMode && (
              <div className="mt-2">
                <button
                  onClick={onTxPredictionModeToggle}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    txPredictionMode
                      ? "bg-violet-500/10 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
                  )}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {txPredictionMode ? "Prediction ON" : "Prediction Mode"}
                </button>
                {txPredictionMode && (
                  <p className="mt-1 px-1 text-[10px] text-foreground-subtle">
                    Step through the simulation. Before the critical step, you will be asked to predict the outcome.
                  </p>
                )}
              </div>
            )}

            {/* Write Skew Scenario (DBL-080) */}
            {!txCompareMode && (
              <div className="mt-3 border-t border-sidebar-border pt-3">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Extra Scenarios
                </span>
                <button
                  onClick={onLoadWriteSkew}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    txHasOverride
                      ? "bg-red-500/10 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                      : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {txHasOverride ? "Write Skew (Active)" : "Write Skew"}
                </button>
                <p className="mt-1 px-1 text-[10px] text-foreground-subtle">
                  Two doctors go off-call simultaneously — row locks can{"\u2019"}t prevent this.
                </p>
              </div>
            )}
          </div>
        )}

        {/* B-Tree controls */}
        {activeMode === "btree-index" && (
          <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
            {/* Order selector */}
            <div data-onboarding="db-btree-order">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Tree Order
              </span>
              <div className="flex gap-1">
                {[3, 4, 5].map((o) => (
                  <button
                    key={o}
                    onClick={() => onBtreeOrderChange(o)}
                    className={cn(
                      "flex-1 rounded-xl py-1.5 text-center text-xs font-medium transition-colors",
                      btreeOrder === o
                        ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                        : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Insert */}
            <div data-onboarding="db-btree-insert">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Insert Key
              </span>
              <div className="flex gap-1">
                <input
                  value={btreeKeyInput}
                  onChange={(e) => onBtreeKeyInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onBtreeInsert()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="e.g. 42"
                />
                <button
                  onClick={onBtreeInsert}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
                >
                  <Plus className="h-3 w-3" /> Insert
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Search Key
              </span>
              <div className="flex gap-1">
                <input
                  value={btreeSearchInput}
                  onChange={(e) => onBtreeSearchInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onBtreeSearch()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="e.g. 10"
                />
                <button
                  onClick={onBtreeSearch}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Search className="h-3 w-3" /> Search
                </button>
              </div>
            </div>

            {/* Explore scenarios (DBL-058) */}
            <div className="border-t border-sidebar-border pt-3">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Explore
              </span>
              <div className="space-y-1">
                <button
                  onClick={onBtreeExploreSorted}
                  className="w-full rounded-xl bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-amber-500/10"
                >
                  <span className="block font-medium text-amber-300">What happens with sorted data?</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Auto-inserts [1,2,3,4,5,6,7] — maximum splits
                  </span>
                </button>
                <button
                  onClick={onBtreeExploreRandom}
                  className="w-full rounded-xl bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-emerald-500/10"
                >
                  <span className="block font-medium text-emerald-300">What happens with random data?</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Auto-inserts [4,2,6,1,3,5,7] — balanced tree
                  </span>
                </button>
              </div>
            </div>

            {/* B-Tree Prediction Mode Toggle (DBL-129) */}
            <div className="border-t border-sidebar-border pt-3">
              <button
                onClick={onBtreePredictionModeToggle}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                  btreePredictionMode
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {btreePredictionMode ? "Prediction ON" : "Prediction Mode"}
              </button>
              {btreePredictionMode && (
                <div className="mt-1 px-1">
                  <p className="text-[10px] text-foreground-subtle">
                    Search for a key. Before each traversal step, predict which child the algorithm will descend to.
                  </p>
                  {btreePredictionScore && btreePredictionScore.total > 0 && (
                    <p className="mt-1 font-mono text-[10px] text-violet-300">
                      Score: {btreePredictionScore.correct}/{btreePredictionScore.total}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hash Index controls */}
        {activeMode === "hash-index" && (
          <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
            {/* Insert */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Insert Key / Value
              </span>
              <div className="flex gap-1">
                <input
                  value={hashKeyInput}
                  onChange={(e) => onHashKeyInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onHashInsert()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="key"
                />
                <input
                  value={hashValueInput}
                  onChange={(e) => onHashValueInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onHashInsert()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="value"
                />
                <button
                  onClick={onHashInsert}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
                >
                  <Plus className="h-3 w-3" /> Insert
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Search Key
              </span>
              <div className="flex gap-1">
                <input
                  value={hashSearchInput}
                  onChange={(e) => onHashSearchInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onHashSearch()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="key"
                />
                <button
                  onClick={onHashSearch}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Search className="h-3 w-3" /> Search
                </button>
              </div>
            </div>

            {/* Delete */}
            <div data-onboarding="db-hash-delete">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Delete Key
              </span>
              <div className="flex gap-1">
                <input
                  value={hashDeleteInput}
                  onChange={(e) => onHashDeleteInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onHashDelete()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="key"
                />
                <button
                  onClick={onHashDelete}
                  className="flex items-center gap-1 rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>

            {/* Explore scenarios (DBL-058) */}
            <div className="border-t border-sidebar-border pt-3">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Explore
              </span>
              <div className="space-y-1">
                <button
                  onClick={onHashExploreCollision}
                  className="w-full rounded-xl bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-amber-500/10"
                >
                  <span className="block font-medium text-amber-300">What{"\u2019"}s a collision cascade?</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Inserts keys that collide — watch the chain grow
                  </span>
                </button>
                <button
                  onClick={onHashExploreResize}
                  className="w-full rounded-xl bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-emerald-500/10"
                >
                  <span className="block font-medium text-emerald-300">Watch a resize happen</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Inserts 4 keys — triggers resize at 75% load factor
                  </span>
                </button>
              </div>
            </div>

            {/* Hash Prediction Mode Toggle (DBL-130) */}
            <div className="border-t border-sidebar-border pt-3">
              <button
                onClick={onHashPredictionModeToggle}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                  hashPredictionMode
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {hashPredictionMode ? "Prediction ON" : "Prediction Mode"}
              </button>
              {hashPredictionMode && (
                <div className="mt-1 px-1">
                  <p className="text-[10px] text-foreground-subtle">
                    Insert a key-value pair. Before the bucket is shown, predict which bucket the hash function will choose.
                  </p>
                  {hashPredictionScore && hashPredictionScore.total > 0 && (
                    <p className="mt-1 font-mono text-[10px] text-violet-300">
                      Score: {hashPredictionScore.correct}/{hashPredictionScore.total}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Query Plan controls */}
        {activeMode === "query-plans" && (
          <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                SQL Query
              </span>
              <textarea
                value={queryPlanSql}
                onChange={(e) => onQueryPlanSqlChange(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                placeholder={"SELECT * FROM users\nWHERE id = 1"}
              />
            </div>
            <button
              onClick={onQueryPlanAnalyze}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
            >
              <Play className="h-3 w-3" /> Analyze
            </button>

            {/* Example queries */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Examples
              </span>
              <div className="space-y-1">
                {[
                  "SELECT * FROM users",
                  "SELECT * FROM users WHERE id = 1",
                  "SELECT * FROM users JOIN orders ON users.id = orders.user_id",
                  "SELECT * FROM users ORDER BY name",
                  "SELECT count(*) FROM users GROUP BY status",
                ].map((sql) => (
                  <button
                    key={sql}
                    onClick={() => onQueryPlanSqlChange(sql)}
                    className="w-full rounded-xl bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-left font-mono text-[10px] text-foreground-subtle transition-colors hover:text-foreground"
                  >
                    {sql}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LSM-Tree controls */}
        {activeMode === "lsm-tree" && (
          <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
            {/* Write */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Write Key / Value
              </span>
              <div className="flex gap-1">
                <input
                  value={lsmKeyInput}
                  onChange={(e) => onLsmKeyInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onLsmWrite()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="key"
                />
                <input
                  value={lsmValueInput}
                  onChange={(e) => onLsmValueInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onLsmWrite()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="value"
                />
                <button
                  onClick={onLsmWrite}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
                >
                  <Plus className="h-3 w-3" /> Write
                </button>
              </div>
            </div>

            {/* Read */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Read Key
              </span>
              <div className="flex gap-1">
                <input
                  value={lsmReadInput}
                  onChange={(e) => onLsmReadInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onLsmRead()}
                  className="flex-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                  placeholder="key"
                />
                <button
                  onClick={onLsmRead}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Search className="h-3 w-3" /> Read
                </button>
              </div>
            </div>

            {/* Flush & Compact */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Manual Operations
              </span>
              <div className="space-y-1">
                <button
                  data-onboarding="db-lsm-flush"
                  onClick={onLsmFlush}
                  className="flex w-full items-center gap-1.5 rounded-xl bg-amber-600/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <ArrowDown className="h-3 w-3" /> Flush Memtable
                </button>
                <button
                  data-onboarding="db-lsm-compact"
                  onClick={() => onLsmCompact(0)}
                  className="flex w-full items-center gap-1.5 rounded-xl bg-violet-600/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                >
                  <Merge className="h-3 w-3" /> Compact L0 → L1
                </button>
                <button
                  onClick={() => onLsmCompact(1)}
                  className="flex w-full items-center gap-1.5 rounded-xl bg-violet-600/70 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                >
                  <Merge className="h-3 w-3" /> Compact L1 → L2
                </button>
                <button
                  onClick={onLsmCheckpoint}
                  className="flex w-full items-center gap-1.5 rounded-xl bg-orange-600/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
                >
                  <ArrowDown className="h-3 w-3" /> Checkpoint WAL
                </button>
              </div>
            </div>

            {/* Bloom Filter Toggle */}
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Bloom Filter
              </span>
              <button
                onClick={onLsmToggleBloom}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-white",
                  lsmBloomEnabled
                    ? "bg-cyan-600/90 hover:bg-cyan-700"
                    : "bg-neutral-600/70 hover:bg-neutral-700",
                )}
              >
                {lsmBloomEnabled ? "Bloom ON — skip SSTables" : "Bloom OFF — search all"}
              </button>
              <p className="mt-1 text-[9px] text-foreground-subtle">
                Toggle to compare read performance with and without bloom filters.
              </p>
            </div>

            {/* Explore scenarios (DBL-058) */}
            <div className="border-t border-sidebar-border pt-3">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Explore
              </span>
              <div className="space-y-1">
                <button
                  onClick={onLsmExploreFlush}
                  className="w-full rounded-xl bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-amber-500/10"
                >
                  <span className="block font-medium text-amber-300">See a full flush cycle</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Writes 5 keys — triggers memtable flush to L0
                  </span>
                </button>
                <button
                  onClick={onLsmExploreCompaction}
                  className="w-full rounded-xl bg-violet-500/5 backdrop-blur-sm border border-violet-500/20 px-3 py-2 text-left text-xs transition-colors hover:bg-violet-500/10"
                >
                  <span className="block font-medium text-violet-300">Watch compaction in action</span>
                  <span className="block text-[10px] text-foreground-subtle">
                    Writes enough to trigger L0{"\u2192"}L1 compaction
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACID Property selector */}
        {activeMode === "acid" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Property
            </span>
            {(["atomicity", "consistency", "isolation", "durability"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onAcidPropertyChange(p)}
                className={cn(
                  "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs capitalize transition-colors",
                  acidProperty === p
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-elevated",
                )}
              >
                <span className="font-bold">{p[0].toUpperCase()}</span> — {p}
              </button>
            ))}
          </div>
        )}

        {/* CAP Theorem simulation type selector */}
        {activeMode === "cap-theorem" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Partition Simulation
            </span>
            <button
              onClick={() => onCapSimTypeChange("cp")}
              className={cn(
                "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                capSimType === "cp"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              CP System (e.g. PostgreSQL)
            </button>
            <button
              onClick={() => onCapSimTypeChange("ap")}
              className={cn(
                "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                capSimType === "ap"
                  ? "bg-green-500/10 text-green-400"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              AP System (e.g. Cassandra)
            </button>
          </div>
        )}

        {/* MVCC controls */}
        {activeMode === "mvcc" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Demo
            </span>
            {mvccSteps.length === 0 ? (
              <button
                onClick={onMvccRunDemo}
                className="mb-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
              >
                <Play className="h-3 w-3" /> Run Snapshot Isolation Demo
              </button>
            ) : (
              <p className="text-[10px] text-foreground-subtle">
                Demo loaded ({mvccTotalSteps} steps). Use the controls below to step through.
              </p>
            )}
          </div>
        )}


        {/* ARIES Recovery controls (DBL-091) */}
        {activeMode === "aries-recovery" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Demo
            </span>
            {ariesSteps.length === 0 ? (
              <button
                onClick={onAriesRunDemo}
                className="mb-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
              >
                <Play className="h-3 w-3" /> Run ARIES Recovery Demo
              </button>
            ) : (
              <p className="text-[10px] text-foreground-subtle">
                Demo loaded ({ariesTotalSteps} steps). Use the controls below to step through.
              </p>
            )}
          </div>
        )}

        {/* Caching Patterns controls (DBL-079) */}
        {activeMode === "caching-patterns" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Pattern
            </span>
            {(["cache-aside", "write-through", "write-behind"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onCachingPatternChange(p)}
                className={cn(
                  "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                  cachingPattern === p
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-elevated",
                )}
              >
                {p === "cache-aside" ? "Cache-Aside (Lazy Loading)" : p === "write-through" ? "Write-Through" : "Write-Behind (Write-Back)"}
              </button>
            ))}
          </div>
        )}
        {/* Join Algorithms controls (DBL-076) */}
        {activeMode === "join-algorithms" && (
          <div className="mt-3 border-t border-sidebar-border pt-3 space-y-3">
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Algorithm
              </span>
              {(["nested-loop", "sort-merge", "hash-join"] as const).map((algo) => (
                <button
                  key={algo}
                  onClick={() => onJoinAlgorithmChange(algo)}
                  className={cn(
                    "mb-1 w-full rounded-xl px-3 py-2 text-left text-xs transition-colors",
                    joinAlgorithm === algo
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-muted hover:bg-elevated",
                  )}
                >
                  {algo === "nested-loop"
                    ? "Nested Loop Join  O(n\u00B7m)"
                    : algo === "sort-merge"
                      ? "Sort-Merge Join  O(n log n)"
                      : "Hash Join  O(n+m)"}
                </button>
              ))}
            </div>
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Sample Data
              </span>
              <p className="mb-2 text-[10px] text-foreground-subtle">
                employees (6 rows) JOIN departments (3 rows) ON dept_id = id
              </p>
              <button
                onClick={onJoinRun}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]"
              >
                <Play className="h-3 w-3" /> Run Join
              </button>
              {joinSteps.length > 0 && (
                <p className="mt-1 text-[10px] text-foreground-subtle">
                  {joinTotalSteps} steps generated. Use controls below to step through.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Share button — always visible */}
        <div className="mt-3 border-t border-sidebar-border pt-3 space-y-2">
          <button
            onClick={onShare}
            className="flex w-full items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)] transition-all hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(110,86,207,0.25)]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share This View
          </button>

          {/* DBL-049: Export as PNG */}
          <button
            onClick={onExport}
            className="flex w-full items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all hover:bg-emerald-500/10"
          >
            <Download className="h-3.5 w-3.5" /> Export as PNG
          </button>

          {/* DBL-060: Presentation Mode */}
          <button
            onClick={onEnterPresentation}
            className="flex w-full items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs font-medium text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.05)] transition-all hover:bg-violet-500/10"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Presentation Mode
          </button>

          {/* DBL-178: Tour Replay */}
          <DatabaseTourReplayButton onReplay={onTourReplay} />
        </div>
      </div>

      {/* Animation speed controls */}
      {(activeMode === "transaction-isolation" ||
        (activeMode === "btree-index" && btreeSteps.length > 0) ||
        (activeMode === "hash-index" && hashSteps.length > 0) ||
        (activeMode === "lsm-tree" && lsmSteps.length > 0) ||
        activeMode === "acid" ||
        activeMode === "cap-theorem" ||
        (activeMode === "mvcc" && mvccSteps.length > 0) || (activeMode === "aries-recovery" && ariesSteps.length > 0) || activeMode === "caching-patterns" ||
        (activeMode === "join-algorithms" && joinSteps.length > 0) ||
        activeMode === "star-snowflake" || activeMode === "connection-pooling") && (
        <div data-onboarding="db-step-controls" className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <span className="text-[10px] text-foreground-muted">Speed:</span>
          {[{label: "0.5x", ms: 1600}, {label: "1x", ms: 800}, {label: "2x", ms: 400}, {label: "4x", ms: 200}].map(s => (
            <button key={s.ms} onClick={() => onAnimationSpeedChange(s.ms)}
              className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium transition-all", animationSpeed === s.ms ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(110,86,207,0.2)]" : "bg-elevated/50 text-foreground-muted hover:text-foreground hover:bg-elevated")}
            >{s.label}</button>
          ))}
          <button
            onClick={() => onSmartSpeedChange(!smartSpeed)}
            className={cn("ml-auto rounded-full px-2.5 py-1 text-[10px] font-medium transition-all border", smartSpeed ? "border-primary/30 bg-primary/20 text-primary shadow-[0_0_10px_rgba(110,86,207,0.2)]" : "border-border/30 bg-elevated/50 text-foreground-muted hover:text-foreground")}
          >
            Smart
          </button>
        </div>
      )}

      {/* Transaction step controls -- normal mode */}
      {activeMode === "transaction-isolation" && !txCompareMode && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onTxStepBack}
            disabled={txStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onTxStep}
            disabled={txStepIndex >= txTotalSteps - 1 || predictionPaused}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={onTxPlay}
            disabled={txStepIndex >= txTotalSteps - 1 || predictionPaused}
            className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play
          </button>
          <button
            onClick={onTxReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {txStepIndex + 1}/{txTotalSteps}
          </span>
        </div>
      )}

      {/* Transaction step controls -- compare mode */}
      {activeMode === "transaction-isolation" && txCompareMode && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onTxCompareStep}
            disabled={txCompareStepIndex >= txCompareTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={onTxComparePlay}
            disabled={txCompareStepIndex >= txCompareTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play
          </button>
          <button
            onClick={onTxCompareReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {txCompareStepIndex + 1}/{txCompareTotalSteps}
          </span>
        </div>
      )}

      {/* B-Tree step controls */}
      {activeMode === "btree-index" && btreeSteps.length > 0 && (
        <div data-onboarding="db-step-controls" className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onBtreeStepBack}
            disabled={btreeStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onBtreeStepForward}
            disabled={btreeStepIndex >= btreeSteps.length - 1 || btreePredictionPaused}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isBtreePlaying ? (
            <button
              onClick={onBtreePause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onBtreePlay}
              disabled={btreeStepIndex >= btreeSteps.length - 1 || btreePredictionPaused}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onBtreeReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {btreeStepIndex + 1}/{btreeSteps.length}
          </span>
        </div>
      )}

      {/* Hash Index step controls */}
      {activeMode === "hash-index" && hashSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onHashStepBack}
            disabled={hashStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onHashStepForward}
            disabled={hashStepIndex >= hashSteps.length - 1 || hashPredictionPaused}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isHashPlaying ? (
            <button
              onClick={onHashPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onHashPlay}
              disabled={hashStepIndex >= hashSteps.length - 1 || hashPredictionPaused}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onHashReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {hashStepIndex + 1}/{hashSteps.length}
          </span>
        </div>
      )}

      {/* LSM-Tree step controls */}
      {activeMode === "lsm-tree" && lsmSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onLsmStepBack}
            disabled={lsmStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onLsmStepForward}
            disabled={lsmStepIndex >= lsmSteps.length - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isLsmPlaying ? (
            <button
              onClick={onLsmPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onLsmPlay}
              disabled={lsmStepIndex >= lsmSteps.length - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onLsmReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {lsmStepIndex + 1}/{lsmSteps.length}
          </span>
        </div>
      )}

      {/* ACID step controls */}
      {activeMode === "acid" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onAcidStepBack}
            disabled={acidStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onAcidStep}
            disabled={acidStepIndex >= acidTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={onAcidPlay}
            disabled={acidStepIndex >= acidTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play
          </button>
          <button
            onClick={onAcidReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {acidStepIndex + 1}/{acidTotalSteps}
          </span>
        </div>
      )}

      {/* CAP step controls */}
      {activeMode === "cap-theorem" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onCapStepBack}
            disabled={capStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onCapStep}
            disabled={capStepIndex >= capTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={onCapPlay}
            disabled={capStepIndex >= capTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play
          </button>
          <button
            onClick={onCapReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {capStepIndex + 1}/{capTotalSteps}
          </span>
        </div>
      )}

      {/* MVCC step controls */}
      {activeMode === "mvcc" && mvccSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onMvccStepBack}
            disabled={mvccStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onMvccStepForward}
            disabled={mvccStepIndex >= mvccTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isMvccPlaying ? (
            <button
              onClick={onMvccPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onMvccPlay}
              disabled={mvccStepIndex >= mvccTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onMvccReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {mvccStepIndex + 1}/{mvccTotalSteps}
          </span>
        </div>
      )}

      {/* ARIES Recovery step controls (DBL-091) */}
      {activeMode === "aries-recovery" && ariesSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onAriesStepBack}
            disabled={ariesStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onAriesStepForward}
            disabled={ariesStepIndex >= ariesTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isAriesPlaying ? (
            <button
              onClick={onAriesPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onAriesPlay}
              disabled={ariesStepIndex >= ariesTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onAriesReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {ariesStepIndex + 1}/{ariesTotalSteps}
          </span>
        </div>
      )}

      {/* Caching Patterns step controls (DBL-079) */}
      {activeMode === "caching-patterns" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onCachingStepBack}
            disabled={cachingStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onCachingStep}
            disabled={cachingStepIndex >= cachingTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isCachingPlaying ? (
            <button
              onClick={onCachingPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onCachingPlay}
              disabled={cachingStepIndex >= cachingTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onCachingReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {cachingStepIndex + 1}/{cachingTotalSteps}
          </span>
        </div>
      )}

      {/* Join Algorithms step controls (DBL-076) */}
      {activeMode === "join-algorithms" && joinSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onJoinStepBack}
            disabled={joinStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onJoinStepForward}
            disabled={joinStepIndex >= joinTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isJoinPlaying ? (
            <button
              onClick={onJoinPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onJoinPlay}
              disabled={joinStepIndex >= joinTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onJoinReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {joinStepIndex + 1}/{joinTotalSteps}
          </span>
        </div>
      )}

      {/* Star/Snowflake step controls (DBL-088) */}
      {activeMode === "star-snowflake" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onStarSnowflakeStepBack}
            disabled={starSnowflakeStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onStarSnowflakeStep}
            disabled={starSnowflakeStepIndex >= starSnowflakeTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isStarSnowflakePlaying ? (
            <button
              onClick={onStarSnowflakePause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onStarSnowflakePlay}
              disabled={starSnowflakeStepIndex >= starSnowflakeTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onStarSnowflakeReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {starSnowflakeStepIndex + 1}/{starSnowflakeTotalSteps}
          </span>
        </div>
      )}

      {/* Connection Pooling step controls (DBL-093) */}
      {activeMode === "connection-pooling" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onConnPoolStepBack}
            disabled={connPoolStepIndex <= 0}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipBack className="h-3 w-3" /> Back
          </button>
          <button
            onClick={onConnPoolStep}
            disabled={connPoolStepIndex >= connPoolTotalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          {isConnPoolPlaying ? (
            <button
              onClick={onConnPoolPause}
              className="flex h-7 items-center gap-1.5 rounded-xl bg-amber-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          ) : (
            <button
              onClick={onConnPoolPlay}
              disabled={connPoolStepIndex >= connPoolTotalSteps - 1}
              className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] disabled:opacity-40"
            >
              <Play className="h-3 w-3" /> Play
            </button>
          )}
          <button
            onClick={onConnPoolReset}
            className="flex h-7 items-center gap-1.5 rounded-xl border border-border/30 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {connPoolStepIndex + 1}/{connPoolTotalSteps}
          </span>
        </div>
      )}
    </div>
  );
});

export default DatabaseSidebar;
