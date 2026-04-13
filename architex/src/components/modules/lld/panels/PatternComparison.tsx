"use client";

/**
 * PatternComparison — Strategy vs State vs Command dedicated comparison (LLD-131).
 * Three scenarios to assign, followed by a side-by-side key differences table.
 *
 * Integration: Add to LLDBottomPanelTabs in useLLDModuleImpl.tsx:
 *   import { PatternComparison } from "../panels/PatternComparison";
 *   // Add tab: { id: "pattern-comparison", label: "Pattern Comparison" }
 *   // Render: <PatternComparison /> in the matching tab case
 */

import React, { memo, useState, useCallback } from "react";
import { Trophy, ArrowRightLeft, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────

type ConfusedPattern = "Strategy" | "State" | "Command";

interface ComparisonScenario {
  id: string;
  description: string;
  context: string;
  correctPattern: ConfusedPattern;
  whyCorrect: string;
  whyNotOthers: Record<Exclude<ConfusedPattern, never>, string>;
}

// ── Scenario Data ───────────────────────────────────────────

const COMPARISON_SCENARIOS: ComparisonScenario[] = [
  {
    id: "cs-sorting",
    description: "User picks between QuickSort, MergeSort, or BubbleSort from a dropdown at runtime",
    context:
      "Your visualization app lets the user pick a sorting algorithm from a menu. The selected algorithm runs on the same dataset. The user explicitly chooses which one to use.",
    correctPattern: "Strategy",
    whyCorrect:
      "The USER explicitly selects which algorithm to use. Strategy defines a family of interchangeable algorithms and lets the client pick one at runtime.",
    whyNotOthers: {
      Strategy: "",
      State:
        "The sorting algorithm doesn't change based on internal state transitions. The user chooses directly \u2014 there's no lifecycle or automatic state change.",
      Command:
        "You're not encapsulating operations for undo/redo or queuing. You're selecting an algorithm to run immediately.",
    },
  },
  {
    id: "cs-vending",
    description: "A vending machine behaves differently when it has coins inserted vs when it's idle vs when it's dispensing",
    context:
      "The machine has states: Idle, HasMoney, Dispensing, OutOfStock. Pressing the same button does different things in each state. The machine transitions automatically between states.",
    correctPattern: "State",
    whyCorrect:
      "The SYSTEM transitions between states internally. In each state, the same interface method (pressButton, insertCoin) behaves differently. The machine's behavior changes as its internal state changes.",
    whyNotOthers: {
      Strategy:
        "Nobody is selecting which behavior to use externally. The vending machine internally transitions between states based on events.",
      State: "",
      Command:
        "You're not encapsulating operations as objects for later execution or undo. The behavior change is driven by internal state, not operation objects.",
    },
  },
  {
    id: "cs-text-editor",
    description: "Each keystroke in a text editor is recorded so the user can undo/redo and replay their session",
    context:
      "Every insert, delete, and format action becomes an object with execute() and undo(). Actions are pushed onto a history stack. Ctrl+Z pops and calls undo(). Sessions can be replayed for tutorials.",
    correctPattern: "Command",
    whyCorrect:
      "OPERATIONS are encapsulated as objects. Each command has execute() and undo(). They can be stored, queued, logged, and replayed. This is the classic Command pattern use case.",
    whyNotOthers: {
      Strategy:
        "You're not swapping interchangeable algorithms. You're turning operations into objects that support undo and replay.",
      State:
        "The editor's behavior doesn't change based on internal state transitions. You're capturing operations as first-class objects.",
      Command: "",
    },
  },
];

// ── Key Differences Table Data ──────────────────────────────

interface DifferenceRow {
  dimension: string;
  strategy: string;
  state: string;
  command: string;
}

const DIFFERENCES: DifferenceRow[] = [
  {
    dimension: "Who decides?",
    strategy: "USER selects the algorithm",
    state: "SYSTEM transitions automatically",
    command: "CLIENT creates operation objects",
  },
  {
    dimension: "What varies?",
    strategy: "The algorithm/behavior used",
    state: "Behavior based on current state",
    command: "Operations encapsulated as objects",
  },
  {
    dimension: "Core intent",
    strategy: "Swap interchangeable algorithms",
    state: "Change behavior on state change",
    command: "Reify operations for queue/undo",
  },
  {
    dimension: "Typical interface",
    strategy: "execute(data) \u2014 one method",
    state: "handle(event) per state class",
    command: "execute() + undo() + serialize()",
  },
  {
    dimension: "Lifecycle",
    strategy: "Stateless; swapped at will",
    state: "Stateful; transitions in sequence",
    command: "Stored in history/queue",
  },
  {
    dimension: "Key capability",
    strategy: "Runtime algorithm selection",
    state: "Context-dependent behavior",
    command: "Undo, redo, replay, queuing",
  },
  {
    dimension: "Real-world analogy",
    strategy: "Choosing a route on Google Maps",
    state: "Traffic light: red/yellow/green",
    command: "Restaurant order slip on the line",
  },
  {
    dimension: "Common examples",
    strategy: "Payment processors, compression, sorting",
    state: "TCP connection, document lifecycle, game AI",
    command: "Text editor undo, transaction log, macro recording",
  },
];

// ── Mnemonic ────────────────────────────────────────────────

const MNEMONIC =
  "Strategy = USER selects, State = SYSTEM transitions, Command = OPERATIONS as objects.";

// ── Shuffle ─────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Component ───────────────────────────────────────────────

const PATTERNS: ConfusedPattern[] = ["Strategy", "State", "Command"];

const PATTERN_COLORS: Record<ConfusedPattern, string> = {
  Strategy: "var(--lld-stereo-interface)",
  State: "var(--lld-stereo-abstract)",
  Command: "var(--lld-stereo-enum)",
};

export const PatternComparison = memo(function PatternComparison() {
  const [scenarios, setScenarios] = useState<ComparisonScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ConfusedPattern | null>(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);
  const [completed, setCompleted] = useState(false);

  const start = useCallback(() => {
    setScenarios(shuffleArray(COMPARISON_SCENARIOS));
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setStarted(true);
    setFeedbackShown(false);
    setCompleted(false);
  }, []);

  const handleAnswer = useCallback(
    (pattern: ConfusedPattern) => {
      if (feedbackShown) return;
      setSelectedAnswer(pattern);
      setFeedbackShown(true);
      if (pattern === scenarios[currentIdx].correctPattern) {
        setScore((s) => s + 1);
      }
    },
    [feedbackShown, scenarios, currentIdx],
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= scenarios.length) {
      setCompleted(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setFeedbackShown(false);
    }
  }, [currentIdx, scenarios.length]);

  // ── Start Screen ──────────────────────────────────────────

  if (!started) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Strategy vs State vs Command
          </h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            The three most confused behavioral patterns. Assign each scenario to the
            correct pattern, then study the side-by-side comparison table.
          </p>
          <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)] px-3 py-2 text-[11px] font-medium text-primary">
            {MNEMONIC}
          </div>
          <button
            onClick={start}
            className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            Start Comparison ({COMPARISON_SCENARIOS.length} Scenarios)
          </button>
        </div>
      </div>
    );
  }

  // ── Completed: show comparison table ──────────────────────

  if (completed) {
    const pct = Math.round((score / scenarios.length) * 100);
    return (
      <div className="flex h-full flex-col overflow-auto">
        {/* Score summary */}
        <div className="flex items-center gap-4 border-b border-border/30 px-4 py-3">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <span className="text-sm font-bold text-foreground">
              {pct >= 100 ? "Perfect!" : pct >= 67 ? "Great Job!" : "Keep Studying!"}
            </span>
            <span className="ml-2 text-xs text-foreground-muted">
              {score}/{scenarios.length} correct
            </span>
          </div>
          <button
            onClick={start}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-border/30 bg-elevated/50 px-3 py-1.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>

        {/* Mnemonic banner */}
        <div className="border-b border-primary/30 bg-primary/5 backdrop-blur-sm px-4 py-2.5 text-center text-[12px] font-bold text-primary">
          {MNEMONIC}
        </div>

        {/* Key differences table */}
        <div className="flex-1 overflow-auto p-4">
          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Key Differences
          </h4>
          <div className="overflow-hidden rounded-xl border border-border/30 backdrop-blur-sm">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/30 bg-elevated/50 backdrop-blur-sm">
                  <th className="px-3 py-2 text-left font-semibold text-foreground-muted">
                    Dimension
                  </th>
                  {PATTERNS.map((p) => (
                    <th
                      key={p}
                      className="px-3 py-2 text-left font-bold"
                      style={{ color: PATTERN_COLORS[p] }}
                    >
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIFFERENCES.map((row, i) => (
                  <tr
                    key={row.dimension}
                    className={cn(
                      "border-b border-border/30 last:border-b-0",
                      i % 2 === 0 ? "bg-surface" : "bg-elevated/50",
                    )}
                  >
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {row.dimension}
                    </td>
                    <td className="px-3 py-2 text-foreground-muted">{row.strategy}</td>
                    <td className="px-3 py-2 text-foreground-muted">{row.state}</td>
                    <td className="px-3 py-2 text-foreground-muted">{row.command}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ───────────────────────────────────────

  const s = scenarios[currentIdx];
  const isCorrect = selectedAnswer === s.correctPattern;

  return (
    <div className="flex h-full flex-col">
      {/* Progress bar */}
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Scenario {currentIdx + 1}/{scenarios.length}
        </span>
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] font-medium text-primary">Score: {score}</span>
      </div>

      <div className="flex flex-1 overflow-auto">
        {/* Scenario */}
        <div className="flex-1 border-r border-border/30 p-4">
          <h4 className="mb-2 text-[13px] font-bold leading-snug text-foreground">
            &ldquo;{s.description}&rdquo;
          </h4>
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2.5 text-[11px] leading-relaxed text-foreground-muted">
            {s.context}
          </div>

          {feedbackShown && (
            <div
              className={cn(
                "mt-3 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed backdrop-blur-sm",
                isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/5 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                  : "border-red-500/30 bg-red-500/5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]",
              )}
            >
              {isCorrect ? (
                <p>
                  <span className="font-bold">Correct!</span> {s.whyCorrect}
                </p>
              ) : (
                <p>
                  <span className="font-bold">Not quite.</span> The answer is{" "}
                  <span className="font-bold">{s.correctPattern}</span>. {s.whyCorrect}
                </p>
              )}
            </div>
          )}

          {/* Show why-not for the wrong selection */}
          {feedbackShown && !isCorrect && selectedAnswer !== null && (
            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)] px-3 py-2 text-[10px] leading-relaxed text-amber-400">
              <span className="font-bold">Why not {selectedAnswer}?</span>{" "}
              {s.whyNotOthers[selectedAnswer]}
            </div>
          )}
        </div>

        {/* Pattern choices */}
        <div className="flex w-64 flex-col gap-3 p-3">
          <p className="text-[11px] font-medium text-foreground-muted">
            Assign the correct pattern:
          </p>
          <div className="space-y-2">
            {PATTERNS.map((p) => {
              const isSelected = selectedAnswer === p;
              const isCorrectOpt = p === s.correctPattern;
              let btnClass =
                "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all";
              if (feedbackShown) {
                if (isCorrectOpt) {
                  btnClass += " border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                } else if (isSelected && !isCorrectOpt) {
                  btnClass += " border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                } else {
                  btnClass += " border-border/30 text-foreground-subtle opacity-50";
                }
              } else {
                btnClass += isSelected
                  ? " border-primary/30 bg-primary/5 backdrop-blur-sm text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                  : " border-border/30 text-foreground-muted hover:bg-accent hover:text-foreground";
              }
              return (
                <button
                  key={p}
                  onClick={() => handleAnswer(p)}
                  className={btnClass}
                  disabled={feedbackShown}
                >
                  <span
                    className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      color: PATTERN_COLORS[p],
                      backgroundColor: `color-mix(in srgb, ${PATTERN_COLORS[p]} 15%, transparent)`,
                    }}
                  >
                    {p[0]}
                  </span>
                  {p}
                </button>
              );
            })}
          </div>

          {/* Quick reference */}
          {!feedbackShown && (
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-2 text-[9px] leading-relaxed text-foreground-subtle">
              <span className="font-bold text-foreground-muted">Remember:</span>{" "}
              {MNEMONIC}
            </div>
          )}

          {feedbackShown && (
            <button
              onClick={handleNext}
              className="w-full rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {currentIdx + 1 >= scenarios.length
                ? "See Comparison Table"
                : "Next Scenario"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
