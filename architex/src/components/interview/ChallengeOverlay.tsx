"use client";

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle,
  Circle,
  Lightbulb,
  Compass,
  Map,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  StickyNote,
  AlertTriangle,
  RotateCcw,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInterviewStore } from "@/stores/interview-store";
import type { HintUsageSummary } from "@/stores/interview-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useChallengeAutosave } from "@/hooks/use-challenge-autosave";
import type { ChallengeDefinition } from "@/lib/interview/challenges";
import type { SystemDesignNodeData } from "@/lib/types";

// ── Requirement auto-detection patterns ──────────────────────

interface RequirementPattern {
  keywords: string[];
  check: (nodes: Array<{ data: SystemDesignNodeData }>) => boolean;
}

const REQUIREMENT_PATTERNS: RequirementPattern[] = [
  {
    keywords: ["cache", "caching"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "storage" &&
          n.data.componentType.toLowerCase().includes("cache"),
      ),
  },
  {
    keywords: ["load balancer", "load-balancer", "load balancing"],
    check: (nodes) =>
      nodes.some((n) => n.data.category === "load-balancing"),
  },
  {
    keywords: ["database", "db", "sql", "storage"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "storage" &&
          (n.data.componentType.toLowerCase().includes("database") ||
            n.data.componentType.toLowerCase().includes("db") ||
            n.data.componentType === "database" ||
            n.data.componentType === "document-db" ||
            n.data.componentType === "wide-column" ||
            n.data.componentType === "graph-db" ||
            n.data.componentType === "timeseries-db"),
      ),
  },
  {
    keywords: ["message queue", "message-queue", "messaging", "queue", "kafka", "rabbitmq"],
    check: (nodes) =>
      nodes.some((n) => n.data.category === "messaging"),
  },
  {
    keywords: ["cdn", "reverse proxy", "edge caching"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "load-balancing" &&
          (n.data.componentType === "reverse-proxy" ||
            n.data.componentType.toLowerCase().includes("cdn")),
      ),
  },
  {
    keywords: ["api gateway", "gateway"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "load-balancing" &&
          n.data.componentType === "api-gateway",
      ),
  },
  {
    keywords: ["search", "full-text", "elasticsearch"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "storage" &&
          n.data.componentType === "search-engine",
      ),
  },
  {
    keywords: ["object storage", "blob", "s3", "file storage"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "storage" &&
          n.data.componentType === "object-storage",
      ),
  },
  {
    keywords: ["server", "compute", "web server", "application server"],
    check: (nodes) =>
      nodes.some((n) => n.data.category === "compute"),
  },
  {
    keywords: ["worker", "background", "async processing"],
    check: (nodes) =>
      nodes.some(
        (n) =>
          n.data.category === "compute" &&
          n.data.componentType === "worker",
      ),
  },
  {
    keywords: ["monitoring", "observability", "logging", "metrics"],
    check: (nodes) =>
      nodes.some((n) => n.data.category === "observability"),
  },
];

/**
 * Check a requirement string against the canvas nodes.
 * Returns true if any known pattern matches both the requirement text
 * and the current canvas state.
 */
export function checkRequirement(
  requirement: string,
  nodes: Array<{ data: SystemDesignNodeData }>,
): boolean {
  const lower = requirement.toLowerCase();
  for (const pattern of REQUIREMENT_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return pattern.check(nodes);
    }
  }
  return false;
}

/**
 * Check a checklist item against the canvas nodes.
 * Reuses the same pattern-matching logic.
 */
export function checkChecklistItem(
  item: string,
  nodes: Array<{ data: SystemDesignNodeData }>,
): boolean {
  return checkRequirement(item, nodes);
}

// ── Timer color helpers ─────────────────────────────────────

type TimerZone = "green" | "yellow" | "red" | "overtime";

function getTimerZone(elapsed: number, totalSeconds: number): TimerZone {
  if (elapsed > totalSeconds) return "overtime";
  const remaining = totalSeconds - elapsed;
  const pct = remaining / totalSeconds;
  if (pct > 0.5) return "green";
  if (pct > 0.25) return "yellow";
  return "red";
}

const ZONE_TEXT_CLASS: Record<TimerZone, string> = {
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
  overtime: "text-red-400 animate-pulse",
};

const ZONE_BAR_CLASS: Record<TimerZone, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  overtime: "bg-red-500",
};

const ZONE_ICON_CLASS: Record<TimerZone, string> = {
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
  overtime: "text-red-400 animate-pulse",
};

const ZONE_LABEL: Record<TimerZone, string> = {
  green: "Safe",
  yellow: "Warning",
  red: "Danger",
  overtime: "Danger",
};

// ── Timer Display ────────────────────────────────────────────

function TimerDisplay({
  timerStartedAt,
  timerPaused,
  timeMinutes,
}: {
  timerStartedAt: number | null;
  timerPaused: boolean;
  timeMinutes: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedElapsedRef = useRef(0);
  const [borderFlash, setBorderFlash] = useState(false);
  const fiveMinWarningFiredRef = useRef(false);

  useEffect(() => {
    if (!timerStartedAt) {
      setElapsed(0);
      pausedElapsedRef.current = 0;
      fiveMinWarningFiredRef.current = false;
      return;
    }

    if (timerPaused) {
      // Store current elapsed when pausing (read from ref to avoid stale closure)
      pausedElapsedRef.current = elapsedRef.current;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Running: update every second
    const startRef = Date.now() - pausedElapsedRef.current * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStartedAt, timerPaused]);

  const totalSeconds = timeMinutes * 60;
  const isOvertime = elapsed > totalSeconds;
  const remaining = Math.max(totalSeconds - elapsed, 0);
  const progress = Math.min(elapsed / totalSeconds, 1);
  const zone = getTimerZone(elapsed, totalSeconds);

  // 5-minute warning: border flash
  useEffect(() => {
    if (
      !fiveMinWarningFiredRef.current &&
      remaining <= 300 &&
      remaining > 0 &&
      elapsed > 0
    ) {
      fiveMinWarningFiredRef.current = true;
      setBorderFlash(true);
      const timeout = setTimeout(() => setBorderFlash(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [remaining, elapsed]);

  // Format display time
  const displayMinutes = isOvertime
    ? Math.floor((elapsed - totalSeconds) / 60)
    : Math.floor(elapsed / 60);
  const displaySeconds = isOvertime
    ? (elapsed - totalSeconds) % 60
    : elapsed % 60;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg px-3 py-2 transition-all",
        borderFlash && "ring-2 ring-red-400/80 ring-offset-1 ring-offset-surface",
      )}
    >
      <div className="flex items-center gap-2">
        <Clock className={cn("h-5 w-5", ZONE_ICON_CLASS[zone])} />
        <span
          className={cn(
            "font-mono text-3xl font-bold leading-none tracking-tight",
            ZONE_TEXT_CLASS[zone],
          )}
        >
          {isOvertime && "+"}
          {String(displayMinutes).padStart(2, "0")}:
          {String(displaySeconds).padStart(2, "0")}
        </span>
        <span className={cn("text-[10px] font-semibold", ZONE_TEXT_CLASS[zone])}>
          {ZONE_LABEL[zone]}
        </span>
        <span className="text-[10px] text-foreground-subtle">
          / {timeMinutes}:00
        </span>
        {isOvertime && (
          <span className="animate-pulse rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            OVERTIME
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-elevated">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            ZONE_BAR_CLASS[zone],
          )}
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Autosave indicator ──────────────────────────────────────

function AutosaveIndicator({ lastSaveTime }: { lastSaveTime: number | null }) {
  const [ago, setAgo] = useState("");

  useEffect(() => {
    if (!lastSaveTime) return;

    const update = () => {
      const diff = Math.floor((Date.now() - lastSaveTime) / 1000);
      if (diff < 5) setAgo("just now");
      else if (diff < 60) setAgo(`${diff}s ago`);
      else setAgo(`${Math.floor(diff / 60)}m ago`);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

  if (!lastSaveTime) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-foreground-subtle">
      <Save className="h-3 w-3" />
      <span>Saved {ago}</span>
    </div>
  );
}

// ── Restore Autosave Banner ─────────────────────────────────

function RestoreBanner({
  onRestore,
  onDismiss,
}: {
  onRestore: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
      <span className="flex-1 text-xs text-amber-300">
        Previous autosave found for this challenge.
      </span>
      <button
        onClick={onRestore}
        className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-500/30"
      >
        <RotateCcw className="h-3 w-3" />
        Restore
      </button>
      <button
        onClick={onDismiss}
        className="rounded-md px-2 py-1 text-[10px] font-medium text-foreground-muted hover:text-foreground"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── Challenge Notes ─────────────────────────────────────────

function ChallengeNotes({
  notes,
  onNotesChange,
}: {
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted hover:text-foreground"
      >
        <StickyNote className="h-3 w-3" />
        Notes
        {notes.length > 0 && (
          <span className="rounded-full bg-primary/20 px-1.5 text-[9px] text-primary">
            {notes.length > 100 ? "..." : notes.split("\n").length}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Jot down your thoughts, trade-offs, assumptions..."
            className="h-24 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}

// ── Challenge Overlay ────────────────────────────────────────

// ── Hint card configuration ─────────────────────────────────────────

interface HintCardConfig {
  level: 1 | 2 | 3 | 4;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  iconClass: string;
  labelClass: string;
  bgClass: string;
  pointsCost: number;
  pointsLabel: string;
}

const HINT_CARDS: HintCardConfig[] = [
  {
    level: 1,
    label: "Nudge",
    icon: Lightbulb,
    borderClass: "border-emerald-500/50",
    iconClass: "text-emerald-400",
    labelClass: "text-emerald-400",
    bgClass: "bg-emerald-500/5",
    pointsCost: 0,
    pointsLabel: "Free",
  },
  {
    level: 2,
    label: "Guided",
    icon: Compass,
    borderClass: "border-amber-500/50",
    iconClass: "text-amber-400",
    labelClass: "text-amber-400",
    bgClass: "bg-amber-500/5",
    pointsCost: 5,
    pointsLabel: "-5 pts",
  },
  {
    level: 3,
    label: "Explanation",
    icon: Map,
    borderClass: "border-red-500/50",
    iconClass: "text-red-400",
    labelClass: "text-red-400",
    bgClass: "bg-red-500/5",
    pointsCost: 10,
    pointsLabel: "-10 pts",
  },
  {
    level: 4,
    label: "Ask AI",
    icon: Sparkles,
    borderClass: "border-purple-500/50",
    iconClass: "text-purple-400",
    labelClass: "text-purple-400",
    bgClass: "bg-purple-500/5",
    pointsCost: 15,
    pointsLabel: "-15 pts",
  },
];

// ── Hint Card Component ─────────────────────────────────────────────

function HintCard({
  config,
  hintText,
  isRevealed,
  onReveal,
  isLoading,
}: {
  config: HintCardConfig;
  hintText: string | null;
  isRevealed: boolean;
  onReveal: () => void;
  isLoading?: boolean;
}) {
  const Icon = config.icon;
  const isAskAI = config.level === 4;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        config.borderClass,
        config.bgClass,
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
          <span className={cn("text-[11px] font-semibold", config.labelClass)}>
            {config.label}
          </span>
          {config.pointsCost > 0 && (
            <span className="rounded-full bg-surface/60 px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted">
              {config.pointsLabel}
            </span>
          )}
          {config.pointsCost === 0 && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              Free
            </span>
          )}
        </div>
        {!isRevealed && (
          <button
            onClick={onReveal}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              config.bgClass,
              config.labelClass,
              isLoading
                ? "cursor-wait opacity-70"
                : "hover:brightness-125",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </>
            ) : (
              "Reveal"
            )}
          </button>
        )}
        {isRevealed && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-foreground-subtle">
            Used
          </span>
        )}
      </div>

      {/* Hint text with slide-down animation */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isRevealed ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {isRevealed && hintText && (
            <div
              className={cn(
                "border-t px-3 py-2 text-xs leading-relaxed text-foreground-muted",
                config.borderClass,
                isAskAI && "flex items-start gap-2",
              )}
            >
              {isAskAI && (
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
              )}
              <span>{hintText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Hint Usage Summary Component ────────────────────────────────────

function HintUsageSummaryDisplay({ summary }: { summary: HintUsageSummary }) {
  if (summary.totalUsed === 0) return null;

  const levelLabel = (level: number, cost: number) => {
    if (level === 4) return `Ask AI (-${cost} pts)`;
    if (cost === 0) return `Level ${level} (free)`;
    return `Level ${level} (-${cost} pts)`;
  };

  return (
    <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground-muted">
          Hints used: {summary.totalUsed} of {summary.totalAvailable}
        </span>
        {summary.totalPointsDeducted > 0 && (
          <span className="text-[11px] font-bold text-red-400">
            -{summary.totalPointsDeducted} pts
          </span>
        )}
        {summary.totalPointsDeducted === 0 && (
          <span className="text-[11px] font-bold text-emerald-400">
            No deduction
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {summary.breakdown.map((item, i) => (
          <span
            key={`ch-${i}`}
            className="rounded-full bg-surface/60 px-2 py-0.5 text-[9px] text-foreground-muted"
          >
            {levelLabel(item.level, item.pointsCost)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Challenge Overlay Props ─────────────────────────────────────────

export interface ChallengeOverlayProps {
  challenge: ChallengeDefinition;
  onSubmit: () => void;
  onCancel: () => void;
}

const ChallengeOverlay = memo(function ChallengeOverlay({
  challenge,
  onSubmit,
  onCancel,
}: ChallengeOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(true);
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const timerStartedAt = useInterviewStore((s) => s.timerStartedAt);
  const timerPaused = useInterviewStore((s) => s.timerPaused);
  const hintsUsed = useInterviewStore((s) => s.hintsUsed);
  const maxHints = useInterviewStore((s) => s.maxHints);
  const revealedHints = useInterviewStore((s) => s.revealedHints);
  const aiHintText = useInterviewStore((s) => s.aiHintText);
  const aiHintLoading = useInterviewStore((s) => s.aiHintLoading);
  const aiHintError = useInterviewStore((s) => s.aiHintError);
  const toggleTimer = useInterviewStore((s) => s.toggleTimer);
  const revealHint = useInterviewStore((s) => s.revealHint);
  const setAiHint = useInterviewStore((s) => s.setAiHint);
  const setAiHintLoading = useInterviewStore((s) => s.setAiHintLoading);
  const getHintUsageSummary = useInterviewStore((s) => s.getHintUsageSummary);
  const challengeStatus = useInterviewStore((s) => s.challengeStatus);

  // Canvas nodes and edges for auto-detection and AI hint
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  // Autosave
  const {
    lastSaveTime,
    notes,
    setNotes,
    restore,
    clear: clearAutosave,
    hasExistingAutosave,
  } = useChallengeAutosave(challenge.id);

  const typedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: n.data as SystemDesignNodeData,
      })),
    [nodes],
  );

  // Auto-detect requirements
  const requirementStatus = useMemo(
    () =>
      challenge.requirements.map((req) => ({
        text: req,
        met: checkRequirement(req, typedNodes),
      })),
    [challenge.requirements, typedNodes],
  );

  // Auto-detect checklist
  const checklistStatus = useMemo(
    () =>
      challenge.checklist.map((item) => ({
        text: item,
        met: checkChecklistItem(item, typedNodes),
      })),
    [challenge.checklist, typedNodes],
  );

  const metCount = requirementStatus.filter((r) => r.met).length;

  // Hint usage summary (computed from store)
  const hintSummary = useMemo(() => getHintUsageSummary(), [getHintUsageSummary, revealedHints]);

  // Reveal a static hint (levels 1-3)
  const handleRevealHint = useCallback(
    (level: 1 | 2 | 3, pointsCost: number) => {
      revealHint(level, pointsCost);
    },
    [revealHint],
  );

  // Ask AI hint (level 4)
  const handleAskAI = useCallback(async () => {
    if (aiHintLoading) return;
    setAiHintLoading(true);

    try {
      const response = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          challenge: {
            id: challenge.id,
            title: challenge.title,
            difficulty: challenge.difficulty,
            timeMinutes: challenge.timeMinutes,
            requirements: challenge.requirements,
          },
        }),
      });

      if (!response.ok) {
        setAiHint(null, "Failed to get AI hint. Try again later.");
        revealHint(4, 15);
        return;
      }

      const data = (await response.json()) as {
        hint: string;
        isAI: boolean;
        message?: string;
      };

      if (data.message && !data.isAI) {
        // No API key configured
        setAiHint(
          data.hint || "AI hints require an ANTHROPIC_API_KEY",
          data.message,
        );
      } else {
        setAiHint(data.hint);
      }
      revealHint(4, 15);
    } catch {
      setAiHint(null, "AI hints require an ANTHROPIC_API_KEY");
      revealHint(4, 15);
    }
  }, [
    aiHintLoading,
    setAiHintLoading,
    setAiHint,
    revealHint,
    nodes,
    edges,
    challenge,
  ]);

  const handleSubmit = useCallback(() => {
    setShowSubmitSummary(true);
    clearAutosave();
    onSubmit();
  }, [clearAutosave, onSubmit]);

  const handleRestore = useCallback(() => {
    restore();
    setShowRestoreBanner(false);
  }, [restore]);

  const handleDismissRestore = useCallback(() => {
    setShowRestoreBanner(false);
  }, []);

  if (collapsed) {
    return (
      <div className="pointer-events-auto absolute right-4 top-4 z-40 flex items-center gap-2 rounded-lg border border-border bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <TimerDisplay
          timerStartedAt={timerStartedAt}
          timerPaused={timerPaused}
          timeMinutes={challenge.timeMinutes}
        />
        <AutosaveIndicator lastSaveTime={lastSaveTime} />
        <span className="text-xs text-foreground-muted">
          {metCount}/{challenge.requirements.length}
        </span>
        <button
          onClick={() => setCollapsed(false)}
          className="rounded p-1 text-foreground-muted hover:text-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-40 flex w-80 flex-col rounded-xl border border-border bg-surface/95 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">
          {challenge.title}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(true)}
            className="rounded p-1 text-foreground-muted hover:text-foreground"
            title="Collapse"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onCancel}
            className="rounded p-1 text-foreground-muted hover:text-foreground"
            title="Cancel challenge"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Restore autosave banner */}
      {hasExistingAutosave && showRestoreBanner && (
        <RestoreBanner
          onRestore={handleRestore}
          onDismiss={handleDismissRestore}
        />
      )}

      {/* Timer */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <TimerDisplay
          timerStartedAt={timerStartedAt}
          timerPaused={timerPaused}
          timeMinutes={challenge.timeMinutes}
        />
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={toggleTimer}
            className="rounded-md bg-elevated px-2 py-1 text-[10px] font-medium text-foreground-muted hover:text-foreground"
          >
            {timerPaused ? "Resume" : "Pause"}
          </button>
          <AutosaveIndicator lastSaveTime={lastSaveTime} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="max-h-[50vh] overflow-y-auto">
        {/* Requirements */}
        <div className="border-b border-border px-4 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Requirements ({metCount}/{challenge.requirements.length})
          </h4>
          <ul className="space-y-1.5">
            {requirementStatus.map((req, i) => (
              <li
                key={`ch-${i}`}
                className="flex items-start gap-2 text-xs"
              >
                {req.met ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                )}
                <span
                  className={cn(
                    req.met
                      ? "text-emerald-300 line-through opacity-75"
                      : "text-foreground",
                  )}
                >
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Checklist */}
        <div className="border-b border-border px-4 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Checklist
          </h4>
          <ul className="space-y-1.5">
            {checklistStatus.map((item, i) => (
              <li
                key={`ch-${i}`}
                className="flex items-start gap-2 text-xs"
              >
                {item.met ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                )}
                <span
                  className={cn(
                    item.met
                      ? "text-emerald-300 line-through opacity-75"
                      : "text-foreground-muted",
                  )}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hints */}
        <div className="px-4 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Hints ({hintsUsed}/{maxHints})
          </h4>
          <div className="space-y-2">
            {HINT_CARDS.map((cardConfig) => {
              const isLevel4 = cardConfig.level === 4;
              const isRevealed = revealedHints.some(
                (h) => h.level === cardConfig.level,
              );

              // For levels 1-3, get static hint text from challenge
              const staticHint = !isLevel4
                ? challenge.hints.find((h) => h.level === cardConfig.level)
                : null;

              // For level 4 (Ask AI), use AI hint text or error
              const hintText = isLevel4
                ? aiHintText ??
                  aiHintError ??
                  "AI hints require an ANTHROPIC_API_KEY"
                : staticHint?.text ?? null;

              return (
                <HintCard
                  key={cardConfig.level}
                  config={cardConfig}
                  hintText={hintText}
                  isRevealed={isRevealed}
                  isLoading={isLevel4 && aiHintLoading}
                  onReveal={
                    isLevel4
                      ? handleAskAI
                      : () =>
                          handleRevealHint(
                            cardConfig.level as 1 | 2 | 3,
                            cardConfig.pointsCost,
                          )
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      <ChallengeNotes notes={notes} onNotesChange={setNotes} />

      {/* Hint usage summary (shown after submission) */}
      {(challengeStatus === "submitted" || challengeStatus === "evaluated" || showSubmitSummary) &&
        hintSummary.totalUsed > 0 && (
        <div className="border-t border-border px-4 py-3">
          <HintUsageSummaryDisplay summary={hintSummary} />
        </div>
      )}

      {/* Submit */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
          Submit Design
        </button>
      </div>
    </div>
  );
});

ChallengeOverlay.displayName = "ChallengeOverlay";

export default ChallengeOverlay;
