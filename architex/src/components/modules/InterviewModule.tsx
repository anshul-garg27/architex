"use client";

import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Trophy,
  Search,
  Clock,
  Play,
  CheckCircle,
  Star,
  ArrowLeft,
  Layout,
  User,
  BookOpen,
  Building2,
  Tag,
  ArrowUpDown,
  ChevronDown,
  Monitor,
  History,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { CHALLENGES, ALL_COMPANIES, ALL_CATEGORIES, SORT_OPTIONS, getCompanyCounts, getChallengeById } from "@/lib/interview/challenges";
import type { ChallengeDefinition, SortOption } from "@/lib/interview/challenges";
import { getDailyChallenge } from "@/lib/interview/daily-challenge";
import { useInterviewStore } from "@/stores/interview-store";
import type { Challenge } from "@/stores/interview-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { calculateOverallScore } from "@/lib/interview/scoring";
import { checkAchievements } from "@/lib/interview/achievements";
import type { UserStats } from "@/lib/interview/achievements";
import { toast } from "@/components/ui/toast";
import ChallengeCard from "@/components/interview/ChallengeCard";
import ScoreDisplay from "@/components/interview/ScoreDisplay";
import ChallengeOverlay, {
  checkRequirement,
} from "@/components/interview/ChallengeOverlay";
import { DesignCanvas } from "@/components/canvas/DesignCanvas";
import XPDisplay from "@/components/interview/XPDisplay";
import StreakBadge from "@/components/interview/StreakBadge";
import SRSDashboard from "@/components/interview/SRSDashboard";
import SRSReviewSession from "@/components/interview/SRSReviewSession";
import type { SessionSummary } from "@/components/interview/SRSReviewSession";
import AchievementGrid from "@/components/interview/AchievementGrid";
import DailyChallengeCard from "@/components/interview/DailyChallengeCard";
import type { ReviewCard } from "@/lib/interview/srs";
import { getDueCards, createCard } from "@/lib/interview/srs";
import { ComponentPalette } from "@/components/canvas/panels/ComponentPalette";
import LearningPathView from "@/components/interview/LearningPathView";
import MockInterviewMode from "@/components/interview/MockInterviewMode";
import EstimationPad from "@/components/interview/EstimationPad";
import ProgressDashboard, { AttemptHistory } from "@/components/interview/ProgressDashboard";
import { useProgressStore } from "@/stores/progress-store";
import type { ChallengeAttempt } from "@/stores/progress-store";
import type { SystemDesignNodeData } from "@/lib/types";
import {
  notifyAchievementUnlocked,
  notifyStreakMilestone,
  notifyDailyChallengeAvailable,
} from "@/hooks/use-notification-triggers";
import SimulateYourAnswerButton from "@/components/modules/interview/SimulateYourAnswerButton";
import AntiPatternAutoDetector from "@/components/modules/interview/AntiPatternAutoDetector";

// ── Canvas scoring helpers ───────────────────────────────────

function serializeCanvasForScoring(
  nodes: Array<{ data: Record<string, unknown> }>,
  edges: Array<{ data?: Record<string, unknown> }>,
) {
  const typedNodes = nodes.map((n) => ({
    data: n.data as SystemDesignNodeData,
  }));

  const categories = new Set(typedNodes.map((n) => n.data.category));
  const componentTypes = new Set(typedNodes.map((n) => n.data.componentType));

  const nodesWithReplicas = typedNodes.filter((n) => {
    const config = n.data.config;
    return (
      (typeof config.replicas === "number" && config.replicas > 1) ||
      (typeof config.instances === "number" && config.instances > 1) ||
      (typeof config.replicaSetSize === "number" && config.replicaSetSize > 1) ||
      (typeof config.replicationFactor === "number" &&
        config.replicationFactor > 1)
    );
  });

  const hasLoadBalancer = categories.has("load-balancing");
  const hasDatabase =
    categories.has("storage") &&
    typedNodes.some(
      (n) =>
        n.data.category === "storage" &&
        (n.data.componentType.includes("database") ||
          n.data.componentType.includes("db") ||
          n.data.componentType === "database" ||
          n.data.componentType === "document-db" ||
          n.data.componentType === "wide-column" ||
          n.data.componentType === "graph-db" ||
          n.data.componentType === "timeseries-db"),
    );
  const hasCache = typedNodes.some(
    (n) =>
      n.data.category === "storage" &&
      n.data.componentType.toLowerCase().includes("cache"),
  );
  const hasMessaging = categories.has("messaging");
  const hasObservability = categories.has("observability");

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    categories: Array.from(categories),
    componentTypes: Array.from(componentTypes),
    nodesWithReplicas: nodesWithReplicas.length,
    hasLoadBalancer,
    hasDatabase,
    hasCache,
    hasMessaging,
    hasObservability,
  };
}

function computeHeuristicScores(
  challenge: ChallengeDefinition,
  nodes: Array<{ data: Record<string, unknown> }>,
  edges: Array<{ data?: Record<string, unknown> }>,
  hintsUsed: number,
): Record<string, number> {
  const summary = serializeCanvasForScoring(nodes, edges);
  const typedNodes = nodes.map((n) => ({
    data: n.data as SystemDesignNodeData,
  }));

  // functionalRequirements: % of requirements auto-detected as met
  const metRequirements = challenge.requirements.filter((req) =>
    checkRequirement(req, typedNodes),
  ).length;
  const reqPct = challenge.requirements.length > 0
    ? metRequirements / challenge.requirements.length
    : 0;
  const functional = Math.round(reqPct * 10 * 10) / 10;

  // scalability: nodes with replicas > 1 get points, caching helps
  let scalability = 2;
  if (summary.nodesWithReplicas > 0) scalability += 2;
  if (summary.nodesWithReplicas > 2) scalability += 1;
  if (summary.hasCache) scalability += 2;
  if (summary.hasMessaging) scalability += 1;
  if (summary.hasLoadBalancer) scalability += 1;
  if (summary.nodeCount >= 5) scalability += 1;
  scalability = Math.min(scalability, 10);

  // reliability: load balancer + multiple instances
  let reliability = 2;
  if (summary.hasLoadBalancer) reliability += 2;
  if (summary.nodesWithReplicas > 0) reliability += 2;
  if (summary.nodesWithReplicas > 1) reliability += 1;
  if (summary.hasObservability) reliability += 1;
  if (summary.hasMessaging) reliability += 1;
  if (summary.edgeCount >= summary.nodeCount) reliability += 1;
  reliability = Math.min(reliability, 10);

  // dataModel: has database with proper config
  let dataModel = 1;
  if (summary.hasDatabase) dataModel += 3;
  if (summary.hasCache) dataModel += 2;
  if (summary.categories.includes("storage")) dataModel += 1;
  if (summary.componentTypes.length >= 3) dataModel += 1;
  const storageTypes = typedNodes.filter(
    (n) => n.data.category === "storage",
  ).length;
  if (storageTypes >= 2) dataModel += 1;
  if (storageTypes >= 3) dataModel += 1;
  dataModel = Math.min(dataModel, 10);

  // api: heuristic based on edge diversity and gateway
  let api = 2;
  if (summary.hasLoadBalancer) api += 2;
  const edgeTypes = new Set(
    edges
      .filter((e) => e.data && typeof e.data === "object")
      .map((e) => {
        const d = e.data as Record<string, unknown>;
        return d.edgeType as string;
      })
      .filter(Boolean),
  );
  if (edgeTypes.size >= 2) api += 2;
  if (edgeTypes.size >= 4) api += 1;
  if (summary.componentTypes.length >= 4) api += 1;
  if (summary.edgeCount >= 3) api += 1;
  if (
    typedNodes.some(
      (n) =>
        n.data.category === "load-balancing" &&
        n.data.componentType === "api-gateway",
    )
  )
    api += 1;
  api = Math.min(api, 10);

  // tradeoffs: based on variety of components used
  let tradeoffs = 2;
  if (summary.categories.length >= 3) tradeoffs += 2;
  if (summary.categories.length >= 5) tradeoffs += 2;
  if (summary.componentTypes.length >= 4) tradeoffs += 1;
  if (summary.componentTypes.length >= 7) tradeoffs += 1;
  if (summary.nodeCount >= 6) tradeoffs += 1;
  if (summary.edgeCount >= 5) tradeoffs += 1;
  tradeoffs = Math.min(tradeoffs, 10);

  // Penalty for hints used
  const hintPenalty = hintsUsed * 0.5;

  return {
    functional: Math.max(1, functional - hintPenalty * 0.3),
    api: Math.max(1, api - hintPenalty * 0.2),
    dataModel: Math.max(1, dataModel - hintPenalty * 0.2),
    scalability: Math.max(1, scalability - hintPenalty * 0.2),
    reliability: Math.max(1, reliability - hintPenalty * 0.2),
    tradeoffs: Math.max(1, tradeoffs - hintPenalty * 0.2),
  };
}

// ── Stub user stats for achievements ────────────────────────

function buildStubUserStats(
  scores: Record<string, number>,
  hintsUsed: number,
): UserStats {
  return {
    challengesCompleted: 1,
    challengesByDifficulty: {},
    challengesByCategory: {},
    averageScore: calculateOverallScore(scores),
    perfectScoreCount: Object.values(scores).every((s) => s >= 9) ? 1 : 0,
    totalHintsUsed: hintsUsed,
    noHintCompletions: hintsUsed === 0 ? 1 : 0,
    streakDays: 1,
    longestStreak: 1,
    conceptsMastered: 0,
    totalConcepts: 100,
    chaosEventsSurvived: 0,
    patternsUsed: [],
    fastCompletions: 0,
    sub5MinCompletions: 0,
    totalXp: 0,
    dimensionScores: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, [v]]),
    ),
    earnedAchievementIds: [],
    modulesVisited: [],
    nodeTypesUsed: [],
    templatesLoaded: 0,
    totalTimePracticedMinutes: 0,
  };
}

// ── Sidebar ─────────────────────────────────────────────────

type SidebarTab = "challenges" | "profile" | "paths";

// ── Category styling for pills ──────────────────────────────
const CATEGORY_PILL_STYLES: Record<
  ChallengeDefinition['category'],
  { label: string; activeClass: string }
> = {
  classic: { label: 'Classic', activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  modern: { label: 'Modern', activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  infrastructure: { label: 'Infrastructure', activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  advanced: { label: 'Advanced', activeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  lld: { label: 'LLD', activeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
};

const InterviewSidebar = memo(function InterviewSidebar({
  challenges,
  activeChallengeId,
  filterDifficulty,
  filterCompanies,
  filterCategory,
  sortOption,
  searchQuery,
  sidebarTab,
  companyCounts,
  onSelectChallenge,
  onFilterChange,
  onCompanyToggle,
  onCategoryChange,
  onSortChange,
  onSearchChange,
  onSidebarTabChange,
}: {
  challenges: ChallengeDefinition[];
  activeChallengeId: string | null;
  filterDifficulty: number | null;
  filterCompanies: string[];
  filterCategory: ChallengeDefinition['category'] | null;
  sortOption: SortOption;
  searchQuery: string;
  sidebarTab: SidebarTab;
  companyCounts: Record<string, number>;
  onSelectChallenge: (id: string) => void;
  onFilterChange: (d: number | null) => void;
  onCompanyToggle: (company: string) => void;
  onCategoryChange: (cat: ChallengeDefinition['category'] | null) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (q: string) => void;
  onSidebarTabChange: (tab: SidebarTab) => void;
}) {
  const companyScrollRef = useRef<HTMLDivElement>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const sidebarGetBestScore = useProgressStore((s) => s.getBestScore);
  // Subscribe to attempts so best scores re-render on new data
  useProgressStore((s) => s.attempts);

  return (
    <div className="flex h-full flex-col">
      {/* Tab switcher */}
      <div className="flex border-b border-sidebar-border">
        <button
          onClick={() => onSidebarTabChange("challenges")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            sidebarTab === "challenges"
              ? "border-b-2 border-primary text-primary"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          Challenges
        </button>
        <button
          onClick={() => onSidebarTabChange("paths")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            sidebarTab === "paths"
              ? "border-b-2 border-primary text-primary"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Paths
        </button>
        <button
          onClick={() => onSidebarTabChange("profile")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            sidebarTab === "profile"
              ? "border-b-2 border-primary text-primary"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          <User className="h-3.5 w-3.5" />
          Profile
        </button>
      </div>

      {sidebarTab === "challenges" ? (
        <>
          <div className="border-b border-sidebar-border px-3 py-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Interview Challenges
            </h2>
            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Difficulty filter */}
            <div className="mb-2 flex gap-1">
              <button
                onClick={() => onFilterChange(null)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  filterDifficulty === null
                    ? "bg-primary text-white"
                    : "bg-elevated text-foreground-muted hover:text-foreground",
                )}
              >
                All
              </button>
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => onFilterChange(d)}
                  className={cn(
                    "flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    filterDifficulty === d
                      ? "bg-primary text-white"
                      : "bg-elevated text-foreground-muted hover:text-foreground",
                  )}
                >
                  <Star className="h-2.5 w-2.5" />
                  {d}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                <Tag className="h-2.5 w-2.5" />
                Category
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => onCategoryChange(null)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    filterCategory === null
                      ? "border-primary/40 bg-primary/20 text-primary"
                      : "border-transparent bg-elevated text-foreground-muted hover:text-foreground",
                  )}
                >
                  All
                </button>
                {ALL_CATEGORIES.map((cat) => {
                  const style = CATEGORY_PILL_STYLES[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => onCategoryChange(cat)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                        filterCategory === cat
                          ? style.activeClass
                          : "border-transparent bg-elevated text-foreground-muted hover:text-foreground",
                      )}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company filter */}
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                <Building2 className="h-2.5 w-2.5" />
                Company
              </div>
              <div
                ref={companyScrollRef}
                className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700"
              >
                {ALL_COMPANIES.map((company) => {
                  const isActive = filterCompanies.includes(company);
                  const count = companyCounts[company] ?? 0;
                  return (
                    <button
                      key={company}
                      onClick={() => onCompanyToggle(company)}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                        isActive
                          ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-400"
                          : "border-transparent bg-elevated text-foreground-muted hover:text-foreground",
                      )}
                    >
                      {company}
                      <span className={cn(
                        "text-[9px]",
                        isActive ? "text-cyan-400/70" : "text-foreground-subtle",
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1 rounded-md bg-elevated px-2 py-1 text-[10px] font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                <ArrowUpDown className="h-2.5 w-2.5" />
                {SORT_OPTIONS.find((s) => s.value === sortOption)?.label ?? "Sort"}
                <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-[11px] transition-colors",
                        sortOption === opt.value
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-muted hover:bg-elevated hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {challenges.map((ch) => {
              const best = sidebarGetBestScore(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectChallenge(ch.id)}
                  className={cn(
                    "mb-1 w-full rounded-md px-3 py-2 text-left transition-colors",
                    activeChallengeId === ch.id
                      ? "bg-primary/15 text-primary"
                      : "text-foreground-muted hover:bg-elevated hover:text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{ch.title}</span>
                    <div className="flex items-center gap-1.5">
                      {best > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            best >= 8
                              ? "bg-emerald-500/15 text-emerald-400"
                              : best >= 6
                                ? "bg-yellow-400/15 text-yellow-400"
                                : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {best.toFixed(1)}
                        </span>
                      )}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-2.5 w-2.5",
                              i < ch.difficulty
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-600",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-foreground-subtle">
                      <Clock className="h-2.5 w-2.5" />
                      {ch.timeMinutes} min
                    </span>
                    {ch.companies.length > 0 && (
                      <span className="truncate text-[10px] text-foreground-subtle">
                        {ch.companies.slice(0, 2).join(", ")}
                        {ch.companies.length > 2 && ` +${ch.companies.length - 2}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {challenges.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-foreground-subtle">
                No challenges match your filters.
              </p>
            )}
          </div>
        </>
      ) : sidebarTab === "paths" ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-40" />
          <p className="text-xs text-foreground-muted">
            Browse structured learning paths in the main panel.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-40" />
          <p className="text-xs text-foreground-muted">
            Click the Profile tab to view your dashboard in the main panel.
          </p>
        </div>
      )}
    </div>
  );
});

// ── Profile Dashboard ─────────────────────────────────────────

const ProfileDashboardPanel = memo(function ProfileDashboardPanel({
  totalXp,
  streakDays,
  lastActiveDate,
  srsCards,
  earnedAchievementIds,
  onStartReview,
}: {
  totalXp: number;
  streakDays: number;
  lastActiveDate: Date;
  srsCards: ReviewCard[];
  earnedAchievementIds: string[];
  onStartReview?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Your Profile</h2>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {/* Score history & progress tracking */}
          <ProgressDashboard />
          <XPDisplay totalXp={totalXp} />
          <StreakBadge
            streakDays={streakDays}
            lastActiveDate={lastActiveDate}
          />
          <SRSDashboard cards={srsCards} onStartReview={onStartReview} />
          <AchievementGrid earnedIds={earnedAchievementIds} />
        </div>
      </div>
    </div>
  );
});

// ── Challenge Detail View (before designing) ─────────────────

const ChallengeDetailView = memo(function ChallengeDetailView({
  challenge,
  onStartDesigning,
  onStartMockInterview,
  onBack,
  onShowHistory,
  bestScore,
}: {
  challenge: ChallengeDefinition;
  onStartDesigning: () => void;
  onStartMockInterview: () => void;
  onBack: () => void;
  onShowHistory: () => void;
  bestScore: number;
}) {
  const hasAttempts = bestScore > 0;
  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {challenge.title}
        </h2>
        {hasAttempts && (
          <span
            className={cn(
              "ml-auto rounded-full px-2.5 py-1 text-xs font-bold",
              bestScore >= 8
                ? "bg-emerald-500/15 text-emerald-400"
                : bestScore >= 6
                  ? "bg-yellow-400/15 text-yellow-400"
                  : "bg-amber-500/15 text-amber-400",
            )}
          >
            Best: {bestScore.toFixed(1)}/10
          </span>
        )}
      </div>

      {/* Challenge content */}
      <div className="flex-1 overflow-auto">
        <p className="mb-4 text-sm text-foreground-muted">
          {challenge.description}
        </p>

        {/* Requirements */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Requirements
          </h3>
          <ul className="space-y-2">
            {challenge.requirements.map((req, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Checklist */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Checklist
          </h3>
          <ul className="space-y-1.5">
            {challenge.checklist.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground-muted"
              >
                <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border border-border" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Hints */}
        <div className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Hints (available during design)
          </h3>
          {challenge.hints.map((hint, i) => (
            <div
              key={i}
              className="mb-1.5 rounded-md border border-border bg-elevated px-3 py-2"
            >
              <span className="text-xs font-medium text-foreground-muted">
                Hint Level {hint.level} (-{hint.pointsCost} pts)
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartDesigning}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Layout className="h-4 w-4" />
            Start Designing
          </button>
          <button
            onClick={onStartMockInterview}
            className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600/10 px-6 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-600/20"
          >
            <Monitor className="h-4 w-4" />
            Mock Interview
          </button>
          {hasAttempts && (
            <button
              onClick={onShowHistory}
              className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-700/50"
            >
              <History className="h-4 w-4" />
              History
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Challenge Browser ───────────────────────────────────────

const ChallengeBrowser = memo(function ChallengeBrowser({
  challenges,
  onSelect,
  onShowHistory,
  streakDays,
  getBestScoreFn,
}: {
  challenges: ChallengeDefinition[];
  onSelect: (ch: ChallengeDefinition) => void;
  onShowHistory: (challengeId: string) => void;
  streakDays: number;
  getBestScoreFn: (challengeId: string) => number;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      {/* Daily Challenge -- prominently at the top */}
      <DailyChallengeCard
        onStartChallenge={onSelect}
        streakDays={streakDays}
        className="mb-6"
      />

      <h2 className="mb-4 text-lg font-semibold text-foreground">
        System Design Challenges
      </h2>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((ch) => {
            const best = getBestScoreFn(ch.id);
            return (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                onStart={onSelect}
                onShowHistory={onShowHistory}
                bestScore={best > 0 ? best : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Score Results View ──────────────────────────────────────

const ScoreResultsView = memo(function ScoreResultsView({
  scores,
  onTryAgain,
  onBack,
}: {
  scores: Record<string, number>;
  onTryAgain: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs text-foreground hover:bg-elevated"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Challenges
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          Challenge Results
        </h2>
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-auto">
        <ScoreDisplay
          scores={scores}
          onTryAgain={onTryAgain}
          onNextChallenge={onBack}
        />
      </div>
    </div>
  );
});

// ── Canvas with Challenge Overlay ───────────────────────────

const ChallengeCanvasView = memo(function ChallengeCanvasView({
  challenge,
  onSubmit,
  onCancel,
}: {
  challenge: ChallengeDefinition;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <ReactFlowProvider>
        <DesignCanvas />
      </ReactFlowProvider>
      <div className="pointer-events-none absolute inset-0">
        <ChallengeOverlay
          challenge={challenge}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
      {/* Simulate Your Answer -- toolbar button */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
        <SimulateYourAnswerButton isDesigning />
      </div>
      <EstimationPad />
    </div>
  );
});

// ── Modes ───────────────────────────────────────────────────

type InterviewMode = "browse" | "detail" | "designing" | "results" | "mock-interview" | "srs-review";

// ── Module Hook ─────────────────────────────────────────────

export function useInterviewModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<ChallengeDefinition['category'] | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("difficulty-asc");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<InterviewMode>("browse");
  const [resultScores, setResultScores] = useState<Record<
    string,
    number
  > | null>(null);
  const [mockResultScores, setMockResultScores] = useState<Record<
    string,
    number
  > | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("challenges");
  const [historyChallengeId, setHistoryChallengeId] = useState<string | null>(null);

  // Progress store (persisted)
  const progressTotalXP = useProgressStore((s) => s.totalXP);
  const progressStreakDays = useProgressStore((s) => s.streakDays);
  const progressLastActiveDate = useProgressStore((s) => s.lastActiveDate);
  const addAttempt = useProgressStore((s) => s.addAttempt);
  const addXP = useProgressStore((s) => s.addXP);
  const updateStreak = useProgressStore((s) => s.updateStreak);
  const getBestScore = useProgressStore((s) => s.getBestScore);
  const progressAttempts = useProgressStore((s) => s.attempts);

  // SRS cards state — initialize from challenges' concepts
  const [srsCards, setSrsCards] = useState<ReviewCard[]>(() => {
    // Create one card per unique concept across all challenges
    const seen = new Set<string>();
    const cards: ReviewCard[] = [];
    for (const ch of CHALLENGES) {
      for (const concept of ch.concepts) {
        if (!seen.has(concept)) {
          seen.add(concept);
          cards.push(createCard(concept));
        }
      }
    }
    return cards;
  });
  const [stubEarnedAchievements] = useState<string[]>([]);

  // Company counts (stable reference)
  const companyCounts = useMemo(() => getCompanyCounts(), []);

  // Store state
  const activeChallenge = useInterviewStore((s) => s.activeChallenge);
  const challengeStatus = useInterviewStore((s) => s.challengeStatus);
  const hintsUsed = useInterviewStore((s) => s.hintsUsed);
  const startChallengeAction = useInterviewStore((s) => s.startChallenge);
  const submitChallengeAction = useInterviewStore((s) => s.submitChallenge);
  const setEvaluation = useInterviewStore((s) => s.setEvaluation);
  const resetInterview = useInterviewStore((s) => s.resetInterview);

  // Canvas store
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  // Daily challenge notification (once per calendar day)
  const dailyChallengeNotifiedRef = useRef(false);
  useEffect(() => {
    if (dailyChallengeNotifiedRef.current) return;
    dailyChallengeNotifiedRef.current = true;
    const today = new Date().toISOString().slice(0, 10);
    const key = "architex-daily-challenge-notified";
    try {
      if (typeof window !== "undefined" && localStorage.getItem(key) === today) return;
      const daily = getDailyChallenge();
      const challenge = getChallengeById(daily.challengeId);
      if (challenge) {
        notifyDailyChallengeAvailable(challenge.title);
        localStorage.setItem(key, today);
      }
    } catch {
      // silently ignore
    }
  }, []);

  // Toggle a company in the filter (multi-select OR logic)
  const handleCompanyToggle = useCallback((company: string) => {
    setFilterCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company],
    );
  }, []);

  // Filter and sort challenges
  const filteredChallenges = useMemo(() => {
    let result = CHALLENGES;

    // Difficulty filter
    if (filterDifficulty !== null) {
      result = result.filter((c) => c.difficulty === filterDifficulty);
    }

    // Category filter
    if (filterCategory !== null) {
      result = result.filter((c) => c.category === filterCategory);
    }

    // Company filter (OR logic)
    if (filterCompanies.length > 0) {
      result = result.filter((c) =>
        c.companies.some((co) => filterCompanies.includes(co)),
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.concepts.some((con) => con.toLowerCase().includes(q)) ||
          c.companies.some((co) => co.toLowerCase().includes(q)),
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortOption) {
      case 'difficulty-asc':
        sorted.sort((a, b) => a.difficulty - b.difficulty);
        break;
      case 'difficulty-desc':
        sorted.sort((a, b) => b.difficulty - a.difficulty);
        break;
      case 'popular':
        // Approximate popularity by number of company tags (more = more commonly asked)
        sorted.sort((a, b) => b.companies.length - a.companies.length || a.difficulty - b.difficulty);
        break;
      case 'newest':
        // Reverse of the original array order (newest added last)
        sorted.reverse();
        break;
    }
    return sorted;
  }, [filterDifficulty, filterCategory, filterCompanies, searchQuery, sortOption]);

  const selectedChallenge = selectedChallengeId
    ? CHALLENGES.find((c) => c.id === selectedChallengeId) ?? null
    : null;

  // Select a challenge from sidebar or card (goes to detail view)
  const handleSelectChallenge = useCallback(
    (idOrChallenge: string | ChallengeDefinition) => {
      const id =
        typeof idOrChallenge === "string"
          ? idOrChallenge
          : idOrChallenge.id;
      setSelectedChallengeId(id);
      setMode("detail");
      setResultScores(null);
    },
    [],
  );

  // Start designing: wire interview-store, clear canvas, show canvas overlay
  const handleStartDesigning = useCallback(() => {
    if (!selectedChallenge) return;

    // Convert ChallengeDefinition to store's Challenge type
    const storeChallenge: Challenge = {
      id: selectedChallenge.id,
      title: selectedChallenge.title,
      difficulty: selectedChallenge.difficulty,
      timeMinutes: selectedChallenge.timeMinutes,
      requirements: selectedChallenge.requirements,
      checklistItems: selectedChallenge.checklist,
    };

    // Clear canvas for a fresh start
    clearCanvas();

    // Start challenge in store (sets timer, resets hints, etc.)
    startChallengeAction(storeChallenge);

    setMode("designing");
  }, [selectedChallenge, clearCanvas, startChallengeAction]);

  // Start mock interview: same setup as designing, but full-screen mode
  const handleStartMockInterview = useCallback(() => {
    if (!selectedChallenge) return;

    const storeChallenge: Challenge = {
      id: selectedChallenge.id,
      title: selectedChallenge.title,
      difficulty: selectedChallenge.difficulty,
      timeMinutes: selectedChallenge.timeMinutes,
      requirements: selectedChallenge.requirements,
      checklistItems: selectedChallenge.checklist,
    };

    clearCanvas();
    startChallengeAction(storeChallenge);
    setMockResultScores(null);
    setMode("mock-interview");
  }, [selectedChallenge, clearCanvas, startChallengeAction]);

  // Submit mock interview
  const handleSubmitMockInterview = useCallback(() => {
    if (!selectedChallenge) return;

    const { nodes, edges } = useCanvasStore.getState();
    const storeHintsUsed = useInterviewStore.getState().hintsUsed;

    submitChallengeAction();

    const scores = computeHeuristicScores(
      selectedChallenge,
      nodes,
      edges,
      storeHintsUsed,
    );

    const roundedScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    );

    const overall = calculateOverallScore(roundedScores);
    setEvaluation({
      functionalRequirements: roundedScores.functional ?? 0,
      apiDesign: roundedScores.api ?? 0,
      dataModel: roundedScores.dataModel ?? 0,
      scalability: roundedScores.scalability ?? 0,
      reliability: roundedScores.reliability ?? 0,
      tradeoffAwareness: roundedScores.tradeoffs ?? 0,
      feedback: `Overall score: ${overall.toFixed(1)}/10`,
      suggestions: [],
    });

    const stats = buildStubUserStats(roundedScores, storeHintsUsed);
    const newAchievements = checkAchievements(stats);
    for (const ach of newAchievements) {
      toast(
        "success",
        `Achievement unlocked: ${ach.name} (+${ach.xpReward} XP)`,
      );
      notifyAchievementUnlocked(ach.name, ach.xpReward, ach.icon);
    }

    // Record attempt in progress store
    const timerStartedAt = useInterviewStore.getState().timerStartedAt;
    const timeSpentSeconds = timerStartedAt
      ? Math.round((Date.now() - timerStartedAt) / 1000)
      : 0;
    const attempt: ChallengeAttempt = {
      challengeId: selectedChallenge.id,
      completedAt: new Date().toISOString(),
      score: overall,
      timeSpentSeconds,
      hintsUsed: storeHintsUsed,
      scores: roundedScores,
    };
    addAttempt(attempt);
    addXP(Math.round(overall * 10));
    updateStreak();
    notifyStreakMilestone(useProgressStore.getState().streakDays);

    // Stay in mock-interview mode but show results inside the full-screen overlay
    setMockResultScores(roundedScores);
  }, [selectedChallenge, submitChallengeAction, setEvaluation, addAttempt, addXP, updateStreak]);

  // Cancel mock interview
  const handleCancelMockInterview = useCallback(() => {
    resetInterview();
    setMockResultScores(null);
    setMode("detail");
  }, [resetInterview]);

  // Try again from mock results
  const handleMockTryAgain = useCallback(() => {
    if (!selectedChallenge) return;

    const storeChallenge: Challenge = {
      id: selectedChallenge.id,
      title: selectedChallenge.title,
      difficulty: selectedChallenge.difficulty,
      timeMinutes: selectedChallenge.timeMinutes,
      requirements: selectedChallenge.requirements,
      checklistItems: selectedChallenge.checklist,
    };

    clearCanvas();
    startChallengeAction(storeChallenge);
    setMockResultScores(null);
  }, [selectedChallenge, clearCanvas, startChallengeAction]);

  // Back to challenges from mock results
  const handleMockBackToChallenges = useCallback(() => {
    resetInterview();
    setMockResultScores(null);
    setSelectedChallengeId(null);
    setMode("browse");
  }, [resetInterview]);

  // Submit design: serialize canvas, compute scores, check achievements
  const handleSubmitDesign = useCallback(() => {
    if (!selectedChallenge) return;

    const { nodes, edges } = useCanvasStore.getState();
    const storeHintsUsed = useInterviewStore.getState().hintsUsed;

    // Mark as submitted in store
    submitChallengeAction();

    // Compute heuristic scores
    const scores = computeHeuristicScores(
      selectedChallenge,
      nodes,
      edges,
      storeHintsUsed,
    );

    // Round scores
    const roundedScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    );

    // Set evaluation in store
    const overall = calculateOverallScore(roundedScores);
    setEvaluation({
      functionalRequirements: roundedScores.functional ?? 0,
      apiDesign: roundedScores.api ?? 0,
      dataModel: roundedScores.dataModel ?? 0,
      scalability: roundedScores.scalability ?? 0,
      reliability: roundedScores.reliability ?? 0,
      tradeoffAwareness: roundedScores.tradeoffs ?? 0,
      feedback: `Overall score: ${overall.toFixed(1)}/10`,
      suggestions: [],
    });

    // Check achievements
    const stats = buildStubUserStats(roundedScores, storeHintsUsed);
    const newAchievements = checkAchievements(stats);
    for (const ach of newAchievements) {
      toast(
        "success",
        `Achievement unlocked: ${ach.name} (+${ach.xpReward} XP)`,
      );
      notifyAchievementUnlocked(ach.name, ach.xpReward, ach.icon);
    }

    // Record attempt in progress store
    const timerStartedAt = useInterviewStore.getState().timerStartedAt;
    const timeSpentSeconds = timerStartedAt
      ? Math.round((Date.now() - timerStartedAt) / 1000)
      : 0;
    const attempt: ChallengeAttempt = {
      challengeId: selectedChallenge.id,
      completedAt: new Date().toISOString(),
      score: overall,
      timeSpentSeconds,
      hintsUsed: storeHintsUsed,
      scores: roundedScores,
    };
    addAttempt(attempt);
    addXP(Math.round(overall * 10));
    updateStreak();
    notifyStreakMilestone(useProgressStore.getState().streakDays);

    setResultScores(roundedScores);
    setMode("results");
  }, [selectedChallenge, submitChallengeAction, setEvaluation, addAttempt, addXP, updateStreak]);

  // Cancel designing
  const handleCancelDesign = useCallback(() => {
    resetInterview();
    setMode("detail");
  }, [resetInterview]);

  // Back to browse
  const handleBackToBrowse = useCallback(() => {
    resetInterview();
    setSelectedChallengeId(null);
    setMode("browse");
    setResultScores(null);
  }, [resetInterview]);

  // Try again: go back to detail, keep the same challenge selected
  const handleTryAgain = useCallback(() => {
    resetInterview();
    setMode("detail");
    setResultScores(null);
  }, [resetInterview]);

  // Show history for a challenge
  const handleShowHistory = useCallback((challengeId: string) => {
    setHistoryChallengeId(challengeId);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryChallengeId(null);
  }, []);

  // SRS review session handlers
  const srsCardsDue = useMemo(() => getDueCards(srsCards), [srsCards]);

  const handleStartSRSReview = useCallback(() => {
    setMode("srs-review");
  }, []);

  const handleSRSCardReviewed = useCallback((updatedCard: ReviewCard) => {
    setSrsCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
    );
  }, []);

  const handleSRSSessionComplete = useCallback((_summary: SessionSummary) => {
    // Award XP for completing a review session
    addXP(Math.round(_summary.totalReviewed * 5));
    updateStreak();
  }, [addXP, updateStreak]);

  const handleExitSRSReview = useCallback(() => {
    setMode("browse");
    setSidebarTab("profile");
    setSelectedChallengeId(null);
  }, []);

  // Sync: if store status changes externally, respect it
  useEffect(() => {
    if (challengeStatus === "not-started" && (mode === "designing" || mode === "mock-interview")) {
      setMode("detail");
    }
  }, [challengeStatus, mode]);

  // Determine sidebar challenge id for highlighting
  const sidebarActiveId =
    selectedChallengeId ?? activeChallenge?.id ?? null;

  // When switching to profile or paths tab, reset challenge selection so the panel shows
  const handleSidebarTabChange = useCallback((tab: SidebarTab) => {
    setSidebarTab(tab);
    if ((tab === "profile" || tab === "paths") && mode === "browse") {
      setSelectedChallengeId(null);
    }
  }, [mode]);

  // When selecting a challenge from sidebar, ensure we're on challenges tab
  const handleSelectChallengeWithTab = useCallback(
    (idOrChallenge: string | ChallengeDefinition) => {
      setSidebarTab("challenges");
      handleSelectChallenge(idOrChallenge);
    },
    [handleSelectChallenge],
  );

  return {
    sidebar:
      mode === "designing" ? (
        // Show component palette while designing
        <ComponentPalette />
      ) : (
        <InterviewSidebar
          challenges={filteredChallenges}
          activeChallengeId={sidebarActiveId}
          filterDifficulty={filterDifficulty}
          filterCompanies={filterCompanies}
          filterCategory={filterCategory}
          sortOption={sortOption}
          searchQuery={searchQuery}
          sidebarTab={sidebarTab}
          companyCounts={companyCounts}
          onSelectChallenge={handleSelectChallengeWithTab}
          onFilterChange={setFilterDifficulty}
          onCompanyToggle={handleCompanyToggle}
          onCategoryChange={setFilterCategory}
          onSortChange={setSortOption}
          onSearchChange={setSearchQuery}
          onSidebarTabChange={handleSidebarTabChange}
        />
      ),
    canvas: (
      <>
        {mode === "designing" && selectedChallenge ? (
          <ChallengeCanvasView
            challenge={selectedChallenge}
            onSubmit={handleSubmitDesign}
            onCancel={handleCancelDesign}
          />
        ) : mode === "detail" && selectedChallenge ? (
          <ChallengeDetailView
            challenge={selectedChallenge}
            onStartDesigning={handleStartDesigning}
            onStartMockInterview={handleStartMockInterview}
            onBack={handleBackToBrowse}
            onShowHistory={() => handleShowHistory(selectedChallenge.id)}
            bestScore={getBestScore(selectedChallenge.id)}
          />
        ) : mode === "results" && resultScores ? (
          <ScoreResultsView
            scores={resultScores}
            onTryAgain={handleTryAgain}
            onBack={handleBackToBrowse}
          />
        ) : mode === "srs-review" ? (
          <SRSReviewSession
            dueCards={srsCardsDue}
            onCardReviewed={handleSRSCardReviewed}
            onSessionComplete={handleSRSSessionComplete}
            onExit={handleExitSRSReview}
          />
        ) : sidebarTab === "paths" ? (
          <LearningPathView
            onSelectChallenge={handleSelectChallengeWithTab}
          />
        ) : sidebarTab === "profile" ? (
          <ProfileDashboardPanel
            totalXp={progressTotalXP}
            streakDays={progressStreakDays}
            lastActiveDate={progressLastActiveDate ? new Date(progressLastActiveDate) : new Date()}
            srsCards={srsCards}
            earnedAchievementIds={stubEarnedAchievements}
            onStartReview={handleStartSRSReview}
          />
        ) : (
          <ChallengeBrowser
            challenges={filteredChallenges}
            onSelect={handleSelectChallengeWithTab}
            onShowHistory={handleShowHistory}
            streakDays={progressStreakDays}
            getBestScoreFn={getBestScore}
          />
        )}
        {/* History overlay -- available from any view */}
        {historyChallengeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg">
              <AttemptHistory
                challengeId={historyChallengeId}
                onClose={handleCloseHistory}
              />
            </div>
          </div>
        )}
      </>
    ),
    properties: (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Challenge Info
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {selectedChallenge ? (
            <div>
              <h3 className="mb-1 text-sm font-medium text-foreground">
                {selectedChallenge.title}
              </h3>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < selectedChallenge.difficulty
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-600",
                      )}
                    />
                  ))}
                </div>
                <span className="flex items-center gap-1 text-xs text-foreground-muted">
                  <Clock className="h-3 w-3" />
                  {selectedChallenge.timeMinutes} min
                </span>
              </div>

              <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Key Concepts
              </h4>
              <div className="mb-3 flex flex-wrap gap-1">
                {selectedChallenge.concepts.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-foreground-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {mode === "designing" && (
                <div className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
                  <Play className="mb-1 inline-block h-3 w-3" /> Challenge in
                  progress. Design your architecture on the canvas.
                </div>
              )}

              {mode === "results" && resultScores && (
                <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                  <CheckCircle className="mb-1 inline-block h-3 w-3" /> Challenge
                  submitted. Score:{" "}
                  {calculateOverallScore(resultScores).toFixed(1)}/10
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-foreground-subtle opacity-30" />
              <p className="text-xs text-foreground-muted">
                Select a challenge to see details.
              </p>
            </div>
          )}
        </div>
      </div>
    ),
    bottomPanel: (
      <div className="flex h-full">
        {/* Notes tab */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Notes
            </span>
          </div>
          <div className="flex-1 overflow-auto px-4 py-2 text-sm text-foreground-muted">
            {mode === "designing" && selectedChallenge ? (
              <p>
                Designing: <strong>{selectedChallenge.title}</strong>. Drag
                components from the sidebar palette onto the canvas. The
                requirements panel will auto-detect your progress. Click{" "}
                <strong>Submit Design</strong> when done.
              </p>
            ) : selectedChallenge ? (
              <p>
                You are viewing: <strong>{selectedChallenge.title}</strong>.
                Click <strong>Start Designing</strong> to open the canvas and
                begin your solution.
              </p>
            ) : (
              <p>Select a challenge to begin your practice session.</p>
            )}
          </div>
        </div>
        {/* Anti-Pattern Detector tab */}
        <div className="flex flex-1 flex-col">
          <AntiPatternAutoDetector isDesigning={mode === "designing"} />
        </div>
      </div>
    ),
    mockOverlay:
      mode === "mock-interview" && selectedChallenge ? (
        <MockInterviewMode
          challenge={selectedChallenge}
          onSubmit={handleSubmitMockInterview}
          onCancel={handleCancelMockInterview}
          resultScores={mockResultScores}
          onTryAgain={handleMockTryAgain}
          onBackToChallenges={handleMockBackToChallenges}
        />
      ) : null,
  };
}

export const InterviewModule = memo(function InterviewModule() {
  return null;
});
