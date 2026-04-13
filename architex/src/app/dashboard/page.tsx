"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Binary,
  Boxes,
  PenTool,
  Database,
  Network,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Brain,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, easing, getStaggerDelay, slideUp } from "@/lib/constants/motion";
import { CountUpNumber } from "@/components/landing/AnimatedText";
import { SkillRadarChart } from "@/components/cross-module/SkillRadarChart";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import {
  getOverallProgress,
  getRecentActivity,
  getUnvisitedModules,
  getLastActiveModule,
  getModuleProgress,
  getAllModules,
  type ActivityEntry,
  type OverallProgress,
} from "@/lib/progress/module-progress";
import type { ModuleType } from "@/stores/ui-store";

// ── Module metadata for recommendations ────────────────────────

const MODULE_META: Record<ModuleType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "system-design": { label: "System Design", icon: LayoutDashboard, color: "text-blue-400" },
  algorithms: { label: "Algorithms", icon: Binary, color: "text-violet-400" },
  "data-structures": { label: "Data Structures", icon: Boxes, color: "text-emerald-400" },
  lld: { label: "Low-Level Design", icon: PenTool, color: "text-amber-400" },
  database: { label: "Database", icon: Database, color: "text-green-400" },
  distributed: { label: "Distributed Systems", icon: Network, color: "text-cyan-400" },
  networking: { label: "Networking", icon: Globe, color: "text-purple-400" },
  os: { label: "OS Concepts", icon: Cpu, color: "text-orange-400" },
  concurrency: { label: "Concurrency", icon: Layers, color: "text-teal-400" },
  security: { label: "Security", icon: ShieldCheck, color: "text-red-400" },
  "ml-design": { label: "ML Design", icon: Brain, color: "text-pink-400" },
  interview: { label: "Interview", icon: Trophy, color: "text-yellow-400" },
  "knowledge-graph": { label: "Knowledge Graph", icon: Share2, color: "text-indigo-400" },
};

// ── Daily challenges (rotating set) ────────────────────────────

const DAILY_CHALLENGES = [
  { title: "Design a URL Shortener", module: "system-design" as ModuleType, difficulty: "Medium" },
  { title: "Implement LRU Cache", module: "data-structures" as ModuleType, difficulty: "Medium" },
  { title: "Raft Leader Election", module: "distributed" as ModuleType, difficulty: "Hard" },
  { title: "OAuth 2.0 Flow Walkthrough", module: "security" as ModuleType, difficulty: "Easy" },
  { title: "Design a Rate Limiter", module: "system-design" as ModuleType, difficulty: "Medium" },
  { title: "B-Tree Index Visualization", module: "database" as ModuleType, difficulty: "Medium" },
  { title: "TCP Handshake Simulation", module: "networking" as ModuleType, difficulty: "Easy" },
];

function getDailyChallenge() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

// ── Relative time formatter ────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ── Stats Card ─────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("dashboardCards", index),
      }}
      className="rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-surface", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-foreground-muted">{label}</p>
          <p className="text-2xl font-bold text-foreground">
            <CountUpNumber to={value} suffix={suffix} countDuration={1} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Quick Action Card ──────────────────────────────────────────

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("dashboardCards", index + 4),
      }}
    >
      <Link
        href={href}
        className={cn(
          "group flex flex-col gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40",
          gradient,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Activity Timeline Item ─────────────────────────────────────

function ActivityItem({
  entry,
  index,
}: {
  entry: ActivityEntry;
  index: number;
}) {
  const meta = MODULE_META[entry.moduleId];
  const Icon = meta?.icon ?? LayoutDashboard;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("listItems", index),
      }}
      className="flex items-start gap-3 py-2"
    >
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface", meta?.color ?? "text-foreground-muted")}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{entry.action}</p>
        {entry.detail && (
          <p className="mt-0.5 truncate text-xs text-foreground-muted">{entry.detail}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-foreground-subtle">
        {timeAgo(entry.timestamp)}
      </span>
    </motion.div>
  );
}

// ── Module Completion Grid (PLT-006) ─────────────────────────

interface ModuleCompletionData {
  id: ModuleType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  explored: number;
  total: number;
  percentage: number;
}

function ModuleCompletionGrid() {
  const [modules, setModules] = useState<ModuleCompletionData[]>([]);

  useEffect(() => {
    const allModules = getAllModules();
    const data: ModuleCompletionData[] = allModules.map((m) => {
      const progress = getModuleProgress(m.id);
      const meta = MODULE_META[m.id];
      return {
        id: m.id,
        label: meta?.label ?? m.id,
        icon: meta?.icon ?? LayoutDashboard,
        color: meta?.color ?? "text-foreground-muted",
        explored: progress.explored,
        total: progress.total,
        percentage: progress.percentage,
      };
    });
    setModules(data);
  }, []);

  if (modules.length === 0) return null;

  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.moderate,
        ease: easing.out,
        delay: 0.15,
      }}
      className="mb-8 rounded-xl border border-border bg-surface p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-4 w-4 text-foreground-muted" />
        <h2 className="text-base font-semibold text-foreground">
          Module Completion
        </h2>
        <span className="ml-auto text-xs text-foreground-muted">
          {modules.filter((m) => m.percentage === 100).length}/{modules.length} complete
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: duration.normal,
                ease: easing.out,
                delay: Math.min(i * 0.03, 0.4),
              }}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3"
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface", mod.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-foreground">
                    {mod.label}
                  </p>
                  <span className="ml-2 shrink-0 text-[10px] font-medium text-foreground-muted">
                    {mod.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mod.percentage}%` }}
                    transition={{ duration: 0.8, ease: easing.out, delay: 0.3 + i * 0.03 }}
                    className={cn(
                      "h-full rounded-full",
                      mod.percentage === 100
                        ? "bg-state-success"
                        : mod.percentage > 0
                          ? "bg-primary"
                          : "bg-transparent",
                    )}
                  />
                </div>
                <p className="mt-1 text-[10px] text-foreground-subtle">
                  {mod.explored}/{mod.total} features
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Skill Radar Section ───────────────────────────────────────

function SkillRadarSection() {
  const getMasteryForRadar = useCrossModuleStore((s) => s.getMasteryForRadar);
  const radarData = useMemo(() => getMasteryForRadar(), [getMasteryForRadar]);

  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.moderate,
        ease: easing.out,
        delay: 0.2,
      }}
      className="mb-8 rounded-xl border border-border bg-surface p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-foreground-muted" />
        <h2 className="text-base font-semibold text-foreground">Skill Radar</h2>
      </div>
      <div className="flex justify-center">
        <SkillRadarChart data={radarData} size={320} />
      </div>
    </motion.div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [unvisited, setUnvisited] = useState<ModuleType[]>([]);
  const [lastModule, setLastModule] = useState<ModuleType | null>(null);

  useEffect(() => {
    setProgress(getOverallProgress());
    setActivities(getRecentActivity(5));
    setUnvisited(getUnvisitedModules());
    setLastModule(getLastActiveModule());
  }, []);

  const dailyChallenge = useMemo(() => getDailyChallenge(), []);

  const continueHref = lastModule ? `/modules/${lastModule}` : "/modules";
  const dailyChallengeHref = `/modules/${dailyChallenge.module}`;

  const recommendations = useMemo(() => {
    // Suggest up to 3 unvisited modules
    return unvisited.slice(0, 3).map((id) => MODULE_META[id]);
  }, [unvisited]);

  const handleGoToCanvas = useCallback(() => {
    // Navigate to the main canvas page
    window.location.href = "/";
  }, []);

  if (!progress) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {progress.modulesExplored === 0 ? (
          /* ── Onboarding card for first-time users ──────────────── */
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.moderate, ease: easing.out }}
            className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome to Architex!
                </h2>
                <p className="mt-2 text-foreground-muted">
                  Start your engineering journey by exploring an interactive
                  module. Design systems, visualize algorithms, and master data
                  structures.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/modules/system-design"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Start Your First Design
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/modules"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-elevated"
                  >
                    Explore All Modules
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Returning user: header + stats ─────────────────────── */
          <>
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.moderate, ease: easing.out }}
              className="mb-8"
            >
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Welcome back, Engineer
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                Pick up where you left off or explore something new.
              </p>
            </motion.div>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard
                icon={BookOpen}
                label="Modules Explored"
                value={progress.modulesExplored}
                suffix={`/${progress.totalModules}`}
                color="text-violet-400"
                index={0}
              />
              <StatsCard
                icon={Trophy}
                label="Challenges Done"
                value={progress.challengesCompleted}
                color="text-amber-400"
                index={1}
              />
              <StatsCard
                icon={Flame}
                label="Day Streak"
                value={progress.streakDays}
                color="text-orange-400"
                index={2}
              />
              <StatsCard
                icon={Zap}
                label="Features Explored"
                value={progress.totalFeaturesExplored}
                color="text-emerald-400"
                index={3}
              />
            </div>
          </>
        )}

        {/* Skill Radar */}
        <SkillRadarSection />

        {/* Module Completion Grid (PLT-006) */}
        <ModuleCompletionGrid />

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <QuickActionCard
            icon={ArrowRight}
            title="Continue Learning"
            description={lastModule ? `Resume ${MODULE_META[lastModule].label}` : "Jump back into your last module"}
            href={continueHref}
            gradient="bg-gradient-to-br from-violet-500/10 to-violet-600/5"
            index={0}
          />
          <QuickActionCard
            icon={Target}
            title="Practice Interview"
            description="Timed challenges with scoring"
            href="/modules/interview"
            gradient="bg-gradient-to-br from-amber-500/10 to-amber-600/5"
            index={1}
          />
          <QuickActionCard
            icon={Sparkles}
            title="Daily Challenge"
            description={dailyChallenge.title}
            href={dailyChallengeHref}
            gradient="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5"
            index={2}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <motion.div
            initial={slideUp.initial}
            animate={slideUp.animate}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.3,
            }}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground-muted" />
              <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            </div>
            {activities.length > 0 ? (
              <div className="divide-y divide-border">
                {activities.map((entry, i) => (
                  <ActivityItem key={entry.id} entry={entry} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Clock className="h-8 w-8 text-foreground-subtle" />
                <p className="text-sm text-foreground-muted">No activity yet</p>
                <p className="text-xs text-foreground-subtle">
                  Start exploring modules to see your activity here
                </p>
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Daily Challenge */}
            <motion.div
              initial={slideUp.initial}
              animate={slideUp.animate}
              transition={{
                duration: duration.moderate,
                ease: easing.out,
                delay: 0.35,
              }}
              className="rounded-xl border border-primary/20 bg-gradient-to-br from-violet-500/5 to-primary/10 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Daily Challenge</h2>
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
                    dailyChallenge.difficulty === "Easy"
                      ? "bg-green-500/15 text-green-400"
                      : dailyChallenge.difficulty === "Medium"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-red-500/15 text-red-400",
                  )}
                >
                  {dailyChallenge.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {dailyChallenge.title}
              </h3>
              <p className="mt-1 text-xs text-foreground-muted">
                Module: {MODULE_META[dailyChallenge.module].label}
              </p>
              <Link
                href={dailyChallengeHref}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Start Challenge
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            {/* Recommended Next Steps */}
            <motion.div
              initial={slideUp.initial}
              animate={slideUp.animate}
              transition={{
                duration: duration.moderate,
                ease: easing.out,
                delay: 0.4,
              }}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-foreground-muted" />
                <h2 className="text-base font-semibold text-foreground">Recommended Next</h2>
              </div>
              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec) => {
                    const Icon = rec.icon;
                    return (
                      <button
                        key={rec.label}
                        onClick={handleGoToCanvas}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-surface", rec.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{rec.label}</p>
                          <p className="text-xs text-foreground-muted">Not yet explored</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-foreground-muted">
                    You have explored all modules!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
