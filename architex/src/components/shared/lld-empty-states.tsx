"use client";

/**
 * LLD-172: Rewritten empty states with compelling CTAs.
 *
 * These components are designed to be imported by LLDModule.tsx to replace
 * the current generic empty state messages. Each component accepts an
 * action callback so LLDModule can wire up the appropriate handler.
 *
 * Usage in LLDModule.tsx:
 *   import {
 *     CanvasEmptyState,
 *     PropertiesEmptyState,
 *     BottomPanelEmptyState,
 *     SequenceEmptyState,
 *     StateMachineEmptyState,
 *   } from "@/components/shared/lld-empty-states";
 */

import { memo } from "react";
import { PenTool, MousePointerClick, BookOpen, ArrowRight, GitBranch, Activity } from "lucide-react";

// ── 1. Canvas Empty State (no pattern loaded) ───────────────

interface CanvasEmptyStateProps {
  /** Called when user clicks the "Load Observer Pattern" CTA */
  onLoadObserver?: () => void;
}

export const CanvasEmptyState = memo(function CanvasEmptyState({
  onLoadObserver,
}: CanvasEmptyStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="max-w-xs rounded-xl border border-border/30 bg-elevated/50 px-8 py-10 text-center backdrop-blur-sm">
        <PenTool className="mx-auto mb-4 h-16 w-16 text-primary/40 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" />
        <p className="mb-1 bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-sm font-medium text-transparent">
          Ready to explore?
        </p>
        <p className="mb-4 text-xs leading-relaxed text-foreground-subtle">
          Start with the Observer pattern — the most useful design pattern
          you will ever learn.
        </p>
        {onLoadObserver && (
          <button
            onClick={onLoadObserver}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]"
          >
            Load Observer Pattern
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

// ── 2. Properties Empty State (no class selected) ───────────

export const PropertiesEmptyState = memo(function PropertiesEmptyState() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 bg-elevated/50 px-3 py-3 backdrop-blur-sm">
        <h2 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">
          Properties
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <MousePointerClick className="mb-3 h-8 w-8 text-primary/30 drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.25)]" />
        <p className="text-center text-xs leading-relaxed text-foreground-subtle">
          Click any class in the diagram to see its attributes, methods, and
          relationships.
        </p>
      </div>
    </div>
  );
});

// ── 3. Bottom Panel Empty State (no pattern) ────────────────

interface BottomPanelEmptyStateProps {
  /** Called when user clicks "Try the Behavioral Simulator" CTA */
  onTrySimulator?: () => void;
}

export const BottomPanelEmptyState = memo(function BottomPanelEmptyState({
  onTrySimulator,
}: BottomPanelEmptyStateProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 bg-elevated/50 px-4 py-2 backdrop-blur-sm">
        <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">
          Pattern Explanation
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <BookOpen className="mb-3 h-8 w-8 text-primary/30 drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.25)]" />
        <p className="mb-1 text-xs text-foreground-subtle">
          Pattern explanations, generated code, and behavioral simulators
          appear here.
        </p>
        {onTrySimulator && (
          <button
            onClick={onTrySimulator}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]"
          >
            Try the Behavioral Simulator
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

// ── 4. Sequence Diagram Empty State ─────────────────────────

interface SequenceEmptyStateProps {
  /** Called when user clicks "Load HTTP Request Flow" CTA */
  onLoadHttpFlow?: () => void;
}

export const SequenceEmptyState = memo(function SequenceEmptyState({
  onLoadHttpFlow,
}: SequenceEmptyStateProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 bg-elevated/50 px-3 py-3 backdrop-blur-sm">
        <h2 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">
          Properties
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <GitBranch className="mb-3 h-8 w-8 text-primary/30 drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.25)]" />
        <p className="mb-1 text-center text-xs text-foreground-subtle">
          See how services communicate.
        </p>
        {onLoadHttpFlow && (
          <button
            onClick={onLoadHttpFlow}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]"
          >
            Load HTTP Request Flow
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

// ── 5. State Machine Empty State ────────────────────────────

interface StateMachineEmptyStateProps {
  /** Called when user clicks "Load Order Lifecycle" CTA */
  onLoadOrderLifecycle?: () => void;
}

export const StateMachineEmptyState = memo(function StateMachineEmptyState({
  onLoadOrderLifecycle,
}: StateMachineEmptyStateProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 bg-elevated/50 px-3 py-3 backdrop-blur-sm">
        <h2 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">
          Properties
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <Activity className="mb-3 h-8 w-8 text-primary/30 drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.25)]" />
        <p className="mb-1 text-center text-xs text-foreground-subtle">
          Watch a system change states.
        </p>
        {onLoadOrderLifecycle && (
          <button
            onClick={onLoadOrderLifecycle}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.55)]"
          >
            Load Order Lifecycle
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
