"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Shield,
  BookOpen,
  BarChart3,
  Crown,
  UserCog,
  Pencil,
  Eye,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  Star,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  duration,
  easing,
  getStaggerDelay,
  slideUp,
} from "@/lib/constants/motion";
import { Progress } from "@/components/ui/progress";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  SkillAssessment,
  LearningPath,
} from "@/lib/enterprise/types";
import {
  LEARNING_PATHS,
  getPathProgress,
  getPathTotalMinutes,
} from "@/lib/enterprise/learning-paths";
import {
  SKILL_LABELS,
  getStrongestSkills,
  getWeakestSkills,
  type AssessedSkill,
} from "@/lib/enterprise/skill-assessment";

// ── Mock data ─────────────────────────────────────────────────
// In production these would come from an API / Zustand store.

const MOCK_WORKSPACE: Workspace = {
  id: "ws-1",
  name: "Engineering Team",
  ownerId: "user-1",
  members: [
    { userId: "user-1", role: "owner",  joinedAt: "2025-01-15T10:00:00Z" },
    { userId: "user-2", role: "admin",  joinedAt: "2025-02-01T09:00:00Z" },
    { userId: "user-3", role: "editor", joinedAt: "2025-02-10T14:00:00Z" },
    { userId: "user-4", role: "editor", joinedAt: "2025-03-01T11:00:00Z" },
    { userId: "user-5", role: "viewer", joinedAt: "2025-03-15T16:00:00Z" },
  ],
  plan: "team",
  createdAt: "2025-01-15T10:00:00Z",
};

const MEMBER_NAMES: Record<string, string> = {
  "user-1": "Alex Chen",
  "user-2": "Priya Patel",
  "user-3": "Marcus Johnson",
  "user-4": "Suki Tanaka",
  "user-5": "Jordan Rivera",
};

const MEMBER_PROGRESS: Record<string, { completedModules: string[]; lastActive: string }> = {
  "user-1": { completedModules: ["sd-requirements", "sd-capacity-estimation", "sd-api-design", "sd-database-schema", "sd-caching-basics", "sd-load-balancing"], lastActive: "2025-04-10T08:30:00Z" },
  "user-2": { completedModules: ["sd-requirements", "sd-capacity-estimation", "sd-api-design", "ds-cap-theorem", "ds-consistency-models"], lastActive: "2025-04-09T17:00:00Z" },
  "user-3": { completedModules: ["ic-framework", "ic-url-shortener", "ic-rate-limiter"], lastActive: "2025-04-10T12:00:00Z" },
  "user-4": { completedModules: ["ba-rest-vs-grpc", "ba-sql-nosql"], lastActive: "2025-04-08T15:00:00Z" },
  "user-5": { completedModules: [], lastActive: "2025-04-05T09:00:00Z" },
};

const MEMBER_ASSESSMENTS: Record<string, SkillAssessment> = {
  "user-1": {
    userId: "user-1",
    skills: [
      { skill: "architecture",        score: 88, level: "expert" },
      { skill: "databases",           score: 75, level: "advanced" },
      { skill: "distributed-systems", score: 62, level: "intermediate" },
      { skill: "caching",             score: 70, level: "advanced" },
      { skill: "messaging",           score: 55, level: "intermediate" },
      { skill: "security",            score: 45, level: "intermediate" },
      { skill: "performance",         score: 80, level: "advanced" },
      { skill: "api-design",          score: 82, level: "advanced" },
    ],
    overallReadiness: "Almost Ready",
    assessedAt: "2025-04-10T08:30:00Z",
  },
  "user-2": {
    userId: "user-2",
    skills: [
      { skill: "architecture",        score: 78, level: "advanced" },
      { skill: "databases",           score: 85, level: "expert" },
      { skill: "distributed-systems", score: 90, level: "expert" },
      { skill: "caching",             score: 65, level: "advanced" },
      { skill: "messaging",           score: 72, level: "advanced" },
      { skill: "security",            score: 60, level: "intermediate" },
      { skill: "performance",         score: 70, level: "advanced" },
      { skill: "api-design",          score: 68, level: "advanced" },
    ],
    overallReadiness: "Ready",
    assessedAt: "2025-04-09T17:00:00Z",
  },
  "user-3": {
    userId: "user-3",
    skills: [
      { skill: "architecture",        score: 55, level: "intermediate" },
      { skill: "databases",           score: 40, level: "intermediate" },
      { skill: "distributed-systems", score: 35, level: "beginner" },
      { skill: "caching",             score: 30, level: "beginner" },
      { skill: "messaging",           score: 25, level: "beginner" },
      { skill: "security",            score: 50, level: "intermediate" },
      { skill: "performance",         score: 45, level: "intermediate" },
      { skill: "api-design",          score: 60, level: "intermediate" },
    ],
    overallReadiness: "Needs Practice",
    assessedAt: "2025-04-10T12:00:00Z",
  },
  "user-4": {
    userId: "user-4",
    skills: [
      { skill: "architecture",        score: 50, level: "intermediate" },
      { skill: "databases",           score: 65, level: "advanced" },
      { skill: "distributed-systems", score: 30, level: "beginner" },
      { skill: "caching",             score: 40, level: "intermediate" },
      { skill: "messaging",           score: 55, level: "intermediate" },
      { skill: "security",            score: 35, level: "beginner" },
      { skill: "performance",         score: 42, level: "intermediate" },
      { skill: "api-design",          score: 70, level: "advanced" },
    ],
    overallReadiness: "Needs Practice",
    assessedAt: "2025-04-08T15:00:00Z",
  },
  "user-5": {
    userId: "user-5",
    skills: [
      { skill: "architecture",        score: 10, level: "beginner" },
      { skill: "databases",           score: 15, level: "beginner" },
      { skill: "distributed-systems", score: 5,  level: "beginner" },
      { skill: "caching",             score: 8,  level: "beginner" },
      { skill: "messaging",           score: 0,  level: "beginner" },
      { skill: "security",            score: 12, level: "beginner" },
      { skill: "performance",         score: 5,  level: "beginner" },
      { skill: "api-design",          score: 20, level: "beginner" },
    ],
    overallReadiness: "Needs Practice",
    assessedAt: "2025-04-05T09:00:00Z",
  },
};

const ASSIGNED_PATHS: Record<string, string> = {
  "user-1": "system-design-fundamentals",
  "user-2": "distributed-systems-deep-dive",
  "user-3": "interview-crash-course",
  "user-4": "backend-architecture",
};

/** Per-member weekly activity (modules completed per week, last 4 weeks). */
const MEMBER_WEEKLY_ACTIVITY: Record<string, number[]> = {
  "user-1": [3, 2, 1, 3],
  "user-2": [2, 3, 2, 1],
  "user-3": [0, 1, 2, 1],
  "user-4": [1, 0, 1, 0],
  "user-5": [0, 0, 0, 0],
};

/** Time spent in minutes per member (last 30 days). */
const MEMBER_TIME_SPENT: Record<string, number> = {
  "user-1": 720,
  "user-2": 640,
  "user-3": 280,
  "user-4": 160,
  "user-5": 15,
};

// ── Helpers ───────────────────────────────────────────────────

const ROLE_CONFIG: Record<WorkspaceRole, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  owner:  { icon: Crown,   label: "Owner",  color: "text-amber-400" },
  admin:  { icon: UserCog,  label: "Admin",  color: "text-violet-400" },
  editor: { icon: Pencil,   label: "Editor", color: "text-cyan-400" },
  viewer: { icon: Eye,      label: "Viewer", color: "text-foreground-muted" },
};

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

function getReadinessBadge(verdict: string) {
  switch (verdict) {
    case "Ready":
      return { bg: "bg-green-500/15", text: "text-green-400" };
    case "Almost Ready":
      return { bg: "bg-amber-500/15", text: "text-amber-400" };
    default:
      return { bg: "bg-red-500/15", text: "text-red-400" };
  }
}

// ── Skill Radar Chart (SVG bar chart) ─────────────────────────

function SkillChart({
  assessments,
}: {
  assessments: Record<string, SkillAssessment>;
}) {
  // Compute team average per skill
  const entries = Object.values(assessments);
  const skills = entries[0]?.skills.map((s) => s.skill) ?? [];

  const averages = skills.map((skill) => {
    const scores = entries.map(
      (a) => a.skills.find((s) => s.skill === skill)?.score ?? 0,
    );
    return {
      skill,
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    };
  });

  const barWidth = 32;
  const gap = 12;
  const chartHeight = 140;
  const chartWidth = averages.length * (barWidth + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartWidth + 40}
        height={chartHeight + 50}
        viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 50}`}
        className="mx-auto"
      >
        {averages.map((item, i) => {
          const x = 20 + i * (barWidth + gap);
          const barHeight = (item.avg / 100) * chartHeight;
          const y = chartHeight - barHeight;
          const label = SKILL_LABELS[item.skill as AssessedSkill] ?? item.skill;

          return (
            <g key={item.skill}>
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={4}
                className="fill-muted/50"
              />
              {/* Value bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className={cn(
                  item.avg >= 75
                    ? "fill-green-500/70"
                    : item.avg >= 50
                      ? "fill-amber-500/70"
                      : "fill-red-500/70",
                )}
              />
              {/* Score label */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-medium"
              >
                {item.avg}
              </text>
              {/* Skill label (rotated) */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                className="fill-foreground-muted text-[9px]"
              >
                {label.length > 8 ? label.slice(0, 7) + "..." : label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Member Row ────────────────────────────────────────────────

function MemberRow({
  member,
  index,
  assignedPath,
}: {
  member: WorkspaceMember;
  index: number;
  assignedPath: LearningPath | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = MEMBER_NAMES[member.userId] ?? member.userId;
  const progress = MEMBER_PROGRESS[member.userId];
  const assessment = MEMBER_ASSESSMENTS[member.userId];
  const roleConfig = ROLE_CONFIG[member.role];
  const RoleIcon = roleConfig.icon;
  const weeklyActivity = MEMBER_WEEKLY_ACTIVITY[member.userId] ?? [];
  const timeSpent = MEMBER_TIME_SPENT[member.userId] ?? 0;

  const pathProgress = assignedPath
    ? getPathProgress(assignedPath, progress?.completedModules ?? [])
    : null;

  const readiness = assessment
    ? getReadinessBadge(assessment.overallReadiness)
    : null;

  const strengths = assessment ? getStrongestSkills(assessment, 2) : [];
  const weaknesses = assessment ? getWeakestSkills(assessment, 2) : [];

  // Weekly velocity: compare last week to prior week
  const lastWeek = weeklyActivity[weeklyActivity.length - 1] ?? 0;
  const priorWeek = weeklyActivity[weeklyActivity.length - 2] ?? 0;
  const velocityTrend = lastWeek > priorWeek ? "up" : lastWeek < priorWeek ? "down" : "flat";

  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay("listItems", index),
      }}
      className="rounded-lg border border-border bg-surface"
    >
      {/* Main row — clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:gap-4"
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-3 sm:w-48">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <div className="flex items-center gap-1.5">
              <RoleIcon className={cn("h-3 w-3", roleConfig.color)} />
              <span className="text-xs text-foreground-muted">{roleConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Learning path + progress */}
        <div className="flex-1 min-w-0">
          {assignedPath ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-foreground">
                  {assignedPath.name}
                </p>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {pathProgress}%
                </span>
              </div>
              <Progress value={pathProgress ?? 0} className="mt-1.5 h-1.5" />
            </div>
          ) : (
            <p className="text-xs text-foreground-subtle italic">No path assigned</p>
          )}
        </div>

        {/* Readiness badge */}
        <div className="flex items-center gap-3 sm:w-36 sm:justify-end">
          {readiness && assessment ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                readiness.bg,
                readiness.text,
              )}
            >
              {assessment.overallReadiness}
            </span>
          ) : (
            <span className="text-xs text-foreground-subtle">--</span>
          )}
        </div>

        {/* Last active + expand toggle */}
        <div className="hidden items-center gap-2 sm:flex sm:w-28 sm:justify-end">
          <p className="text-xs text-foreground-subtle">
            {progress ? timeAgo(progress.lastActive) : "Never"}
          </p>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-foreground-muted" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
          )}
        </div>
      </button>

      {/* Expandable detail panel */}
      <AnimatePresence>
        {expanded && assessment && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal, ease: easing.out }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              {/* Strengths & Weaknesses */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                  <Star className="h-3 w-3 text-green-400" />
                  Strengths
                </p>
                {strengths.map((s) => (
                  <div key={s.skill} className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-foreground-muted">
                      {SKILL_LABELS[s.skill as AssessedSkill] ?? s.skill}
                    </span>
                    <span className="text-xs font-medium text-green-400">{s.score}</span>
                  </div>
                ))}
                <p className="mb-2 mt-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  Needs Work
                </p>
                {weaknesses.map((s) => (
                  <div key={s.skill} className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-foreground-muted">
                      {SKILL_LABELS[s.skill as AssessedSkill] ?? s.skill}
                    </span>
                    <span className="text-xs font-medium text-amber-400">{s.score}</span>
                  </div>
                ))}
              </div>

              {/* All skills mini bars */}
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                  Skill Breakdown
                </p>
                <div className="space-y-1.5">
                  {assessment.skills.map((s) => (
                    <div key={s.skill} className="flex items-center gap-2">
                      <span className="w-16 truncate text-[10px] text-foreground-muted">
                        {SKILL_LABELS[s.skill as AssessedSkill] ?? s.skill}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.score >= 75 ? "bg-green-500/70" : s.score >= 50 ? "bg-amber-500/70" : "bg-red-500/70",
                          )}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[10px] font-medium text-foreground-muted">
                        {s.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity & Time */}
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
                  Activity (Last 4 Weeks)
                </p>
                <div className="mb-3 flex items-end gap-1">
                  {weeklyActivity.map((count, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className={cn(
                          "w-full rounded-sm",
                          count > 0 ? "bg-primary/60" : "bg-muted/40",
                        )}
                        style={{ height: `${Math.max(4, count * 12)}px` }}
                      />
                      <span className="text-[9px] text-foreground-subtle">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">
                    {Math.round(timeSpent / 60)}h studied
                  </span>
                  {velocityTrend === "up" && <TrendingUp className="h-3 w-3 text-green-400" />}
                  {velocityTrend === "down" && <TrendingDown className="h-3 w-3 text-red-400" />}
                </div>
                <p className="mt-1 text-[10px] text-foreground-subtle">
                  {progress?.completedModules.length ?? 0} modules completed
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Path Assignment Panel ─────────────────────────────────────

function PathAssignment() {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedPath, setSelectedPath] = useState<string>("");

  return (
    <motion.div
      initial={slideUp.initial}
      animate={slideUp.animate}
      transition={{
        duration: duration.moderate,
        ease: easing.out,
        delay: 0.25,
      }}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-foreground-muted" />
        <h2 className="text-sm font-semibold text-foreground">
          Assign Learning Path
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Member select */}
        <div className="flex-1">
          <label className="mb-1 block text-xs text-foreground-muted">
            Team Member
          </label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Select member...</option>
              {MOCK_WORKSPACE.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {MEMBER_NAMES[m.userId] ?? m.userId}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          </div>
        </div>

        {/* Path select */}
        <div className="flex-1">
          <label className="mb-1 block text-xs text-foreground-muted">
            Learning Path
          </label>
          <div className="relative">
            <select
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Select path...</option>
              {LEARNING_PATHS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({Math.round(getPathTotalMinutes(p) / 60)}h)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          </div>
        </div>

        {/* Assign button */}
        <button
          disabled={!selectedMember || !selectedPath}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Assign
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Team Dashboard Page ───────────────────────────────────────

export default function TeamDashboardPage() {
  const workspace = MOCK_WORKSPACE;

  const teamStats = useMemo(() => {
    const assessments = Object.values(MEMBER_ASSESSMENTS);
    const readyCt = assessments.filter(
      (a) => a.overallReadiness === "Ready",
    ).length;
    const almostCt = assessments.filter(
      (a) => a.overallReadiness === "Almost Ready",
    ).length;
    const totalModulesCompleted = Object.values(MEMBER_PROGRESS).reduce(
      (sum, p) => sum + p.completedModules.length,
      0,
    );

    // Team average score across all skills
    const allScores = assessments.flatMap((a) => a.skills.map((s) => s.score));
    const teamAvgScore = allScores.length > 0
      ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
      : 0;

    // Total study hours (last 30 days)
    const totalHoursStudied = Math.round(
      Object.values(MEMBER_TIME_SPENT).reduce((s, v) => s + v, 0) / 60,
    );

    // Weekly velocity: total modules completed across all members last week
    const lastWeekTotal = Object.values(MEMBER_WEEKLY_ACTIVITY).reduce(
      (sum, weeks) => sum + (weeks[weeks.length - 1] ?? 0),
      0,
    );

    return {
      totalMembers: workspace.members.length,
      readyCount: readyCt,
      almostReadyCount: almostCt,
      totalModulesCompleted,
      teamAvgScore,
      totalHoursStudied,
      lastWeekTotal,
    };
  }, [workspace.members.length]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.moderate, ease: easing.out }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {workspace.name}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Team progress overview and learning path management.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users,        label: "Members",           value: teamStats.totalMembers,          color: "text-violet-400",  suffix: "" },
            { icon: CheckCircle2, label: "Interview Ready",   value: teamStats.readyCount,            color: "text-green-400",   suffix: "" },
            { icon: Zap,          label: "Avg Score",          value: teamStats.teamAvgScore,          color: "text-amber-400",   suffix: "%" },
            { icon: Award,        label: "Modules Done",       value: teamStats.totalModulesCompleted, color: "text-cyan-400",    suffix: "" },
            { icon: Clock,        label: "Hours Studied",      value: teamStats.totalHoursStudied,     color: "text-pink-400",    suffix: "h" },
            { icon: TrendingUp,   label: "This Week",          value: teamStats.lastWeekTotal,         color: "text-emerald-400", suffix: " modules" },
            { icon: Target,       label: "Almost Ready",       value: teamStats.almostReadyCount,      color: "text-orange-400",  suffix: "" },
            { icon: Activity,     label: "Active Members",     value: Object.values(MEMBER_WEEKLY_ACTIVITY).filter((w) => (w[w.length - 1] ?? 0) > 0).length, color: "text-sky-400", suffix: "" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={slideUp.initial}
                animate={slideUp.animate}
                transition={{
                  duration: duration.normal,
                  ease: easing.out,
                  delay: getStaggerDelay("dashboardCards", i),
                }}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-surface",
                      stat.color,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}{stat.suffix}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Skill Assessment Chart */}
        <motion.div
          initial={slideUp.initial}
          animate={slideUp.animate}
          transition={{
            duration: duration.moderate,
            ease: easing.out,
            delay: 0.15,
          }}
          className="mb-8 rounded-xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-foreground-muted" />
            <h2 className="text-sm font-semibold text-foreground">
              Team Skill Assessment (Averages)
            </h2>
          </div>
          <SkillChart assessments={MEMBER_ASSESSMENTS} />
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-green-500/70" />
              75+
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/70" />
              50-74
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-red-500/70" />
              &lt;50
            </span>
          </div>
        </motion.div>

        {/* Path Assignment */}
        <div className="mb-8">
          <PathAssignment />
        </div>

        {/* Members list */}
        <motion.div
          initial={slideUp.initial}
          animate={slideUp.animate}
          transition={{
            duration: duration.moderate,
            ease: easing.out,
            delay: 0.3,
          }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-foreground-muted" />
            <h2 className="text-sm font-semibold text-foreground">
              Team Members
            </h2>
          </div>

          {/* Column headers (desktop) */}
          <div className="mb-2 hidden items-center gap-4 px-4 text-[10px] font-medium uppercase tracking-wider text-foreground-subtle sm:flex">
            <span className="w-48">Member</span>
            <span className="flex-1">Learning Path</span>
            <span className="w-36 text-right">Readiness</span>
            <span className="w-28 text-right">Last Active</span>
          </div>

          <div className="space-y-2">
            {workspace.members.map((member, i) => {
              const pathId = ASSIGNED_PATHS[member.userId];
              const assignedPath = pathId
                ? LEARNING_PATHS.find((p) => p.id === pathId)
                : undefined;
              return (
                <MemberRow
                  key={member.userId}
                  member={member}
                  index={i}
                  assignedPath={assignedPath}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Available paths quick list */}
        <motion.div
          initial={slideUp.initial}
          animate={slideUp.animate}
          transition={{
            duration: duration.moderate,
            ease: easing.out,
            delay: 0.35,
          }}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-foreground-muted" />
            <h2 className="text-sm font-semibold text-foreground">
              Available Learning Paths
            </h2>
          </div>
          <div className="space-y-3">
            {LEARNING_PATHS.map((path) => {
              const totalHours = Math.round(getPathTotalMinutes(path) / 60);
              const requiredCount = path.modules.filter((m) => m.required).length;
              return (
                <div
                  key={path.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {path.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                      {path.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-foreground-subtle">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {path.modules.length} modules ({requiredCount} required)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{totalHours}h total
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
