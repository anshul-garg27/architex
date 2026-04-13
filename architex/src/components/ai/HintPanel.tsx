"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Coins,
  Sparkles,
  BookOpen,
  GraduationCap,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { duration, easing } from "@/lib/constants/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type HintTier,
  type HintResponse,
  type HintBudget,
  type ChallengeCategory,
  TIER_CREDIT_COST,
  TIER_ORDER,
  generateHint,
  createHintBudget,
  spendCredits,
  canUnlockTier,
} from "@/lib/ai/hint-system";

// ── Types ───────────────────────────────────────────────────────────

export interface HintPanelProps {
  challengeId: string;
  challengeTitle: string;
  category?: ChallengeCategory;
  currentDesign?: string;
  className?: string;
  /** Initial total credits (default 15). */
  totalCredits?: number;
}

// ── Tier config ─────────────────────────────────────────────────────

interface TierConfig {
  tier: HintTier;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: "nudge",
    label: "Nudge",
    icon: Lightbulb,
    description: "A gentle push in the right direction",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    tier: "guided",
    label: "Guided",
    icon: BookOpen,
    description: "Specific suggestion with reasoning",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    tier: "full-explanation",
    label: "Full Explanation",
    icon: GraduationCap,
    description: "Complete walkthrough with diagrams",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
];

// ── Component ───────────────────────────────────────────────────────

const HintPanel = memo(function HintPanel({
  challengeId,
  challengeTitle,
  category,
  currentDesign = "",
  className,
  totalCredits = 15,
}: HintPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [budget, setBudget] = useState<HintBudget>(() =>
    createHintBudget(totalCredits),
  );
  const [hints, setHints] = useState<Map<HintTier, HintResponse>>(
    () => new Map(),
  );
  const [activeHint, setActiveHint] = useState<HintTier | null>(null);

  const usedTiers = useMemo(() => budget.hintsUsed, [budget.hintsUsed]);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const requestHint = useCallback(
    (tier: HintTier) => {
      // Already have this hint cached
      if (hints.has(tier)) {
        setActiveHint(tier);
        return;
      }

      // Spend credits
      const updated = spendCredits(budget, tier);
      if (!updated) return;

      const response = generateHint(
        { id: challengeId, title: challengeTitle, category },
        currentDesign,
        tier,
      );

      setBudget(updated);
      setHints((prev) => {
        const next = new Map(prev);
        next.set(tier, response);
        return next;
      });
      setActiveHint(tier);
    },
    [budget, hints, challengeId, challengeTitle, category, currentDesign],
  );

  const creditPercentage = (budget.remainingCredits / budget.totalCredits) * 100;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-lg overflow-hidden",
        className,
      )}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Hints</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">
              {budget.remainingCredits}/{budget.totalCredits}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal, ease: easing.inOut }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Credit bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Credits remaining</span>
                  <span>{budget.remainingCredits} credits</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn(
                      "h-full rounded-full transition-colors",
                      creditPercentage > 50
                        ? "bg-emerald-500"
                        : creditPercentage > 20
                          ? "bg-amber-500"
                          : "bg-red-500",
                    )}
                    initial={false}
                    animate={{ width: `${creditPercentage}%` }}
                    transition={{ duration: duration.moderate, ease: easing.out }}
                  />
                </div>
              </div>

              {/* Tier buttons */}
              <div className="grid grid-cols-3 gap-2">
                {TIER_CONFIGS.map((config) => {
                  const Icon = config.icon;
                  const isUnlocked = canUnlockTier(config.tier, usedTiers);
                  const isUsed = hints.has(config.tier);
                  const isActive = activeHint === config.tier;
                  const canAfford =
                    isUsed || TIER_CREDIT_COST[config.tier] <= budget.remainingCredits;
                  const isDisabled = !isUnlocked || (!isUsed && !canAfford);

                  return (
                    <button
                      key={config.tier}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => requestHint(config.tier)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-all",
                        isActive
                          ? `${config.borderColor} ${config.bgColor}`
                          : "border-border hover:border-border/80",
                        isDisabled && "cursor-not-allowed opacity-40",
                        !isDisabled && "hover:bg-accent/50",
                      )}
                    >
                      {!isUnlocked && (
                        <Lock className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
                      )}
                      <Icon className={cn("h-4 w-4", isActive ? config.color : "text-muted-foreground")} />
                      <span className="font-medium">{config.label}</span>
                      <Badge
                        variant={isUsed ? "success" : "secondary"}
                        size="sm"
                      >
                        {isUsed ? "Used" : `${TIER_CREDIT_COST[config.tier]} cr`}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              {/* Progressive disclosure info */}
              {usedTiers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Start with a Nudge, then unlock deeper hints
                </p>
              )}

              {/* Active hint display */}
              <AnimatePresence mode="wait">
                {activeHint && hints.has(activeHint) && (
                  <motion.div
                    key={activeHint}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: duration.normal, ease: easing.out }}
                  >
                    <HintCard hint={hints.get(activeHint)!} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── HintCard sub-component ──────────────────────────────────────────

interface HintCardProps {
  hint: HintResponse;
}

const HintCard = memo(function HintCard({ hint }: HintCardProps) {
  const config = TIER_CONFIGS.find((c) => c.tier === hint.tier);
  if (!config) return null;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        config.borderColor,
        config.bgColor,
      )}
    >
      <div className="flex items-center gap-2">
        <config.icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-xs font-semibold", config.color)}>
          {config.label}
        </span>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{hint.content}</p>

      {hint.followUp && (
        <div className="flex items-start gap-2 pt-1">
          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground italic">{hint.followUp}</p>
        </div>
      )}

      {hint.diagramSuggestions && hint.diagramSuggestions.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-xs font-medium text-muted-foreground">
            Suggested components:
          </p>
          <div className="flex flex-wrap gap-1">
            {hint.diagramSuggestions.map((suggestion) => (
              <Badge key={suggestion} variant="outline" size="sm">
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { HintPanel };
