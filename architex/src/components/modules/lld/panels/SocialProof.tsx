"use client";

/**
 * Social Proof Counter (LLD-146).
 * Shows "~N people explored this today" below a pattern name.
 * Frontend-only: deterministic count from day-of-year + pattern ID hash.
 * Range 20-200. Different patterns get different counts
 * (e.g., Observer higher than Interpreter).
 *
 * Integration: Import and render below pattern name in LLDSidebar or LLDProperties:
 *   import { SocialProof, getSocialProofCount } from "../panels/SocialProof";
 *   <SocialProof patternId={pattern.id} patternName={pattern.name} />
 */

import React, { memo, useMemo } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Deterministic Hash Utility ─────────────────────────────

/**
 * Simple deterministic hash: djb2 variant.
 * Returns a stable unsigned 32-bit integer for any input string.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// ── Popularity weights ─────────────────────────────────────
// Higher-weight patterns get counts skewed toward the top of the range.
// This makes Observer / Strategy / Singleton feel more popular than niche ones.

const POPULARITY_WEIGHTS: Record<string, number> = {
  // High popularity (0.7-1.0 range multiplier)
  observer: 0.95,
  singleton: 0.90,
  factory_method: 0.88,
  "factory-method": 0.88,
  strategy: 0.85,
  decorator: 0.80,
  builder: 0.78,
  adapter: 0.75,
  command: 0.72,
  state: 0.70,
  // Medium popularity (0.4-0.7)
  facade: 0.65,
  proxy: 0.60,
  composite: 0.55,
  iterator: 0.52,
  mediator: 0.50,
  "template-method": 0.48,
  "chain-of-responsibility": 0.45,
  prototype: 0.42,
  bridge: 0.40,
  // Lower popularity (0.2-0.4)
  memento: 0.35,
  visitor: 0.30,
  // Modern / specialised
  repository: 0.60,
  cqrs: 0.45,
  "event-sourcing": 0.42,
  saga: 0.38,
  "circuit-breaker": 0.50,
  bulkhead: 0.28,
  retry: 0.55,
  "rate-limiter": 0.52,
  "thread-pool": 0.40,
  "producer-consumer": 0.35,
  react: 0.48,
  "multi-agent-orchestration": 0.30,
  "tool-use": 0.32,
};

// ── Public Utility Function ────────────────────────────────

/**
 * Compute a deterministic "people explored today" count for a pattern.
 * Stable across renders for the same day + patternId.
 * Range: 20-200.
 */
export function getSocialProofCount(patternId: string): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Combine day-of-year with pattern ID for a daily-varying but deterministic seed
  const seed = djb2Hash(`${patternId}-day-${dayOfYear}-${now.getFullYear()}`);

  // Base count: hash modulo range
  const baseCount = 20 + (seed % 131); // 20..150 base range

  // Apply popularity weight to skew toward 200 for popular patterns
  const weight = POPULARITY_WEIGHTS[patternId] ?? 0.40;
  const bonus = Math.round(weight * 50); // 0..50 bonus

  return Math.min(200, Math.max(20, baseCount + bonus));
}

// ── Component ──────────────────────────────────────────────

interface SocialProofProps {
  patternId: string;
  patternName?: string;
  className?: string;
}

export const SocialProof = memo(function SocialProof({
  patternId,
  patternName,
  className,
}: SocialProofProps) {
  const count = useMemo(() => getSocialProofCount(patternId), [patternId]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] text-foreground-subtle",
        className,
      )}
      title={
        patternName
          ? `Approximately ${count} people explored ${patternName} today`
          : `Approximately ${count} people explored this today`
      }
    >
      <Users className="h-3 w-3 drop-shadow-[0_0_4px_rgba(var(--primary-rgb),0.3)]" />
      <span className="text-foreground-subtle">
        ~{count} people explored this today
      </span>
    </div>
  );
});
