"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { duration, easing, springs } from "@/lib/constants/motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type ReviewIssue,
  type ReviewResult,
  type IssueSeverity,
  countBySeverity,
  getNodeSeverity,
  getAffectedNodeIds,
} from "@/lib/ai/design-reviewer";

// ── Types ───────────────────────────────────────────────────────────

export interface ReviewOverlayProps {
  /** The result from `reviewDesign()`. */
  review: ReviewResult;
  /** Callback when the user closes the overlay. */
  onClose?: () => void;
  /** Callback when the user clicks a specific node badge. */
  onFocusNode?: (nodeId: string) => void;
  className?: string;
}

// ── Severity config ─────────────────────────────────────────────────

interface SeverityConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeVariant: "destructive" | "warning" | "secondary";
}

const SEVERITY_CONFIG: Record<IssueSeverity, SeverityConfig> = {
  critical: {
    icon: ShieldAlert,
    label: "Critical",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    badgeVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    badgeVariant: "warning",
  },
  suggestion: {
    icon: Info,
    label: "Suggestion",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    badgeVariant: "secondary",
  },
};

// ── Score label helper ──────────────────────────────────────────────

function getScoreLabel(
  score: number,
): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-400" };
  if (score >= 70) return { label: "Good", color: "text-green-400" };
  if (score >= 50) return { label: "Needs Work", color: "text-amber-400" };
  return { label: "Poor", color: "text-red-400" };
}

// ── Component ───────────────────────────────────────────────────────

const ReviewOverlay = memo(function ReviewOverlay({
  review,
  onClose,
  onFocusNode,
  className,
}: ReviewOverlayProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const counts = useMemo(() => countBySeverity(review.issues), [review.issues]);
  const affectedNodes = useMemo(
    () => getAffectedNodeIds(review.issues),
    [review.issues],
  );

  const scoreInfo = useMemo(
    () => getScoreLabel(review.score),
    [review.score],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((p) => !p);
  }, []);

  const handleIssueClick = useCallback(
    (issueId: string) => {
      setSelectedIssue((prev) => (prev === issueId ? null : issueId));
    },
    [],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (onFocusNode) {
        onFocusNode(nodeId);
      }
    },
    [onFocusNode],
  );

  return (
    <div className={cn("relative", className)}>
      {/* Canvas badges overlay — renders a badge at each affected node */}
      <CanvasBadges
        issues={review.issues}
        onNodeClick={handleNodeClick}
      />

      {/* Sidebar toggle */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-0 top-4 z-20"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              className="rounded-r-none border-r-0"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Review ({review.issues.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue list sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: duration.normal, ease: easing.inOut }}
            className="absolute right-0 top-0 bottom-0 z-20 flex w-80 flex-col border-l border-border bg-card shadow-xl"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Design Review</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-7 w-7"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-7 w-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Score summary */}
            <div className="border-b border-border px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Overall Score
                </span>
                <span
                  className={cn("text-lg font-bold", scoreInfo.color)}
                >
                  {review.score}/100
                </span>
              </div>
              <span className={cn("text-xs font-medium", scoreInfo.color)}>
                {scoreInfo.label}
              </span>

              {/* Severity counts */}
              <div className="flex items-center gap-2 pt-1">
                {counts.critical > 0 && (
                  <Badge variant="destructive" size="sm">
                    {counts.critical} critical
                  </Badge>
                )}
                {counts.warning > 0 && (
                  <Badge variant="warning" size="sm">
                    {counts.warning} warning{counts.warning !== 1 ? "s" : ""}
                  </Badge>
                )}
                {counts.suggestion > 0 && (
                  <Badge variant="secondary" size="sm">
                    {counts.suggestion} suggestion{counts.suggestion !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {/* Issue list */}
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-2 p-4">
                {review.issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
                    <p className="text-sm font-medium">No issues found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your architecture looks solid.
                    </p>
                  </div>
                ) : (
                  review.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isExpanded={selectedIssue === issue.id}
                      onClick={() => handleIssueClick(issue.id)}
                      onNodeClick={handleNodeClick}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── IssueCard sub-component ─────────────────────────────────────────

interface IssueCardProps {
  issue: ReviewIssue;
  isExpanded: boolean;
  onClick: () => void;
  onNodeClick: (nodeId: string) => void;
}

const IssueCard = memo(function IssueCard({
  issue,
  isExpanded,
  onClick,
  onNodeClick,
}: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-lg border transition-colors cursor-pointer",
        isExpanded
          ? `${config.borderColor} ${config.bgColor}`
          : "border-border hover:border-border/80 hover:bg-accent/30",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
      >
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            config.color,
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {issue.title}
            </span>
            <Badge variant={config.badgeVariant} size="sm">
              {config.label}
            </Badge>
          </div>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {issue.description}
            </p>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal, ease: easing.inOut }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                {issue.description}
              </p>

              {/* Suggestion */}
              <div className="rounded-md bg-background/50 p-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Suggestion
                </p>
                <p className="text-sm leading-relaxed">{issue.suggestion}</p>
              </div>

              {/* Affected nodes */}
              {issue.affectedNodes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Affected Nodes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {issue.affectedNodes.map((nodeId) => (
                      <button
                        key={nodeId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNodeClick(nodeId);
                        }}
                        className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-mono hover:bg-accent transition-colors"
                      >
                        {nodeId}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── CanvasBadges sub-component ──────────────────────────────────────
//
// Renders severity badges for affected nodes. In a real integration
// these would be positioned over the canvas using node coordinates.
// Here we render them as a summary strip at the top of the overlay.

interface CanvasBadgesProps {
  issues: ReviewIssue[];
  onNodeClick: (nodeId: string) => void;
}

const CanvasBadges = memo(function CanvasBadges({
  issues,
  onNodeClick,
}: CanvasBadgesProps) {
  // Collect unique nodes and their highest severity
  const nodeSeverities = useMemo(() => {
    const map = new Map<string, IssueSeverity>();
    for (const issue of issues) {
      for (const nodeId of issue.affectedNodes) {
        const existing = map.get(nodeId);
        if (!existing) {
          map.set(nodeId, issue.severity);
        } else {
          const priority: Record<IssueSeverity, number> = {
            critical: 0,
            warning: 1,
            suggestion: 2,
          };
          if (priority[issue.severity] < priority[existing]) {
            map.set(nodeId, issue.severity);
          }
        }
      }
    }
    return map;
  }, [issues]);

  if (nodeSeverities.size === 0) return null;

  return (
    <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
      {Array.from(nodeSeverities.entries()).map(([nodeId, severity]) => {
        const config = SEVERITY_CONFIG[severity];
        const Icon = config.icon;

        return (
          <motion.button
            key={nodeId}
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.snappy}
            onClick={() => onNodeClick(nodeId)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
              config.borderColor,
              config.bgColor,
              "hover:opacity-80",
            )}
          >
            <Icon className={cn("h-3 w-3", config.color)} />
            <span className={config.color}>{nodeId}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

export { ReviewOverlay };
