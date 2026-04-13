"use client";

/**
 * DailyChallenge — Daily pattern identification challenge (LLD-085).
 *
 * Each day features a deterministic random pattern (based on day-of-year).
 * Shows: pattern name (hidden), 3 progressive hints, user guesses from a dropdown.
 * Completing successfully increments the streak via trackLLDExploration.
 * State is persisted in localStorage.
 *
 * Integration:
 *   import { DailyChallenge } from "../panels/DailyChallenge";
 *   // Render inside a bottom panel tab or as a sidebar section.
 */

import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, Lightbulb, Trophy, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DESIGN_PATTERNS } from "@/lib/lld";
import type { DesignPattern } from "@/lib/lld";
import { trackLLDExploration } from "@/lib/progress/module-progress";

// ── Deterministic daily pattern selection ───────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Simple seedable PRNG for deterministic selection. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function getDailyPattern(): DesignPattern {
  const day = getDayOfYear();
  const year = new Date().getFullYear();
  const seed = year * 366 + day;
  const idx = Math.floor(seededRandom(seed) * DESIGN_PATTERNS.length);
  return DESIGN_PATTERNS[idx];
}

/** Generate 3 progressive hints for a pattern. */
function generateHints(pattern: DesignPattern): [string, string, string] {
  const categoryHint = `This is a ${pattern.category} pattern.`;

  const structureHint = pattern.classes.length > 0
    ? `It involves ${pattern.classes.length} participant${pattern.classes.length === 1 ? "" : "s"} and uses ${pattern.relationships.length > 0 ? `a ${pattern.relationships[0].type} relationship` : "a simple class structure"}.`
    : `It is a commonly used ${pattern.category} pattern.`;

  const analogyHint = pattern.analogy
    ? `Analogy: "${pattern.analogy.slice(0, 120)}${pattern.analogy.length > 120 ? "..." : ""}"`
    : `Difficulty: ${pattern.difficulty}/5. ${pattern.description.slice(0, 100)}...`;

  return [categoryHint, structureHint, analogyHint];
}

// ── LocalStorage persistence ────────────────────────────────

const STORAGE_KEY = "architex-daily-challenge";

interface DailyChallengeState {
  /** The date key (YYYY-MM-DD) this state was last updated for */
  dateKey: string;
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** The user's guesses (pattern IDs) */
  guesses: string[];
  /** Whether the challenge is completed (correct guess made) */
  completed: boolean;
}

function readState(): DailyChallengeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyChallengeState;
  } catch {
    return null;
  }
}

function writeState(state: DailyChallengeState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable
  }
}

// ── Component ───────────────────────────────────────────────

export const DailyChallenge = memo(function DailyChallenge() {
  const todayKey = useMemo(() => getTodayKey(), []);
  const pattern = useMemo(() => getDailyPattern(), []);
  const hints = useMemo(() => generateHints(pattern), [pattern]);

  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Load saved state
  useEffect(() => {
    const saved = readState();
    if (saved && saved.dateKey === todayKey) {
      setHintsRevealed(saved.hintsRevealed);
      setGuesses(saved.guesses);
      setCompleted(saved.completed);
    }
  }, [todayKey]);

  // Persist state on changes
  useEffect(() => {
    writeState({ dateKey: todayKey, hintsRevealed, guesses, completed });
  }, [todayKey, hintsRevealed, guesses, completed]);

  const remainingPatterns = useMemo(() => {
    return DESIGN_PATTERNS.filter((p) => !guesses.includes(p.id)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [guesses]);

  const maxGuesses = 3;
  const isOutOfGuesses = guesses.length >= maxGuesses && !completed;

  const handleRevealHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, 3));
  }, []);

  const handleGuess = useCallback(() => {
    if (!selectedGuess || completed || isOutOfGuesses) return;

    const newGuesses = [...guesses, selectedGuess];
    setGuesses(newGuesses);
    setSelectedGuess("");

    if (selectedGuess === pattern.id) {
      setCompleted(true);
      trackLLDExploration(`pattern-${pattern.id}`);
    }
  }, [selectedGuess, completed, isOutOfGuesses, guesses, pattern.id]);

  // ── Completed State ────────────────────────────────────

  if (completed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Trophy className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
            Daily Challenge Complete!
          </h3>
          <p className="text-xs text-foreground-muted">
            You correctly identified the{" "}
            <span className="font-bold text-primary">{pattern.name}</span> pattern
            {guesses.length === 1
              ? " on your first try!"
              : ` in ${guesses.length} guesses.`}
          </p>
          <p className="text-[10px] text-foreground-subtle">
            Come back tomorrow for a new challenge.
          </p>
        </div>
      </div>
    );
  }

  // ── Failed State ───────────────────────────────────────

  if (isOutOfGuesses) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
            Better luck tomorrow!
          </h3>
          <p className="text-xs text-foreground-muted">
            The answer was{" "}
            <span className="font-bold text-primary">{pattern.name}</span> ({pattern.category} pattern).
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-foreground-subtle">
            {pattern.description.slice(0, 150)}...
          </p>
        </div>
      </div>
    );
  }

  // ── Active Challenge ───────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Daily Pattern Challenge
        </span>
        <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
          {todayKey}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Mystery pattern info */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Mystery Pattern
            </h4>
            <p className="text-xs text-foreground-subtle">
              Identify today&apos;s pattern using the hints below. You have{" "}
              <span className="font-bold text-foreground">
                {maxGuesses - guesses.length}
              </span>{" "}
              guess{maxGuesses - guesses.length === 1 ? "" : "es"} remaining.
            </p>
          </div>

          {/* Hints */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-foreground-muted">
                Hints ({hintsRevealed}/3)
              </span>
              {hintsRevealed < 3 && (
                <button
                  onClick={handleRevealHint}
                  className="ml-auto rounded-xl border border-border/30 bg-elevated/50 px-2 py-0.5 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
                >
                  Reveal Next Hint
                </button>
              )}
            </div>

            {hints.map((hint, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-md border px-3 py-2 text-[11px] leading-relaxed transition-all",
                  idx < hintsRevealed
                    ? "border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-300"
                    : "border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-subtle opacity-40",
                )}
              >
                {idx < hintsRevealed ? (
                  <p>
                    <span className="font-semibold">Hint {idx + 1}:</span> {hint}
                  </p>
                ) : (
                  <p className="italic">Hint {idx + 1}: [locked]</p>
                )}
              </div>
            ))}
          </div>

          {/* Previous guesses */}
          {guesses.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Your Guesses
              </span>
              {guesses.map((guessId, idx) => {
                const guessedPattern = DESIGN_PATTERNS.find(
                  (p) => p.id === guessId,
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.05)] px-2.5 py-1.5 text-[11px] text-red-400"
                  >
                    <X className="h-3 w-3 shrink-0" />
                    <span>{guessedPattern?.name ?? guessId}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guess input */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Make a Guess
            </span>
            <div className="relative">
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-foreground-muted transition-colors hover:bg-accent"
              >
                <span>
                  {selectedGuess
                    ? DESIGN_PATTERNS.find((p) => p.id === selectedGuess)
                        ?.name ?? "Select..."
                    : "Select a pattern..."}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showDropdown && (
                <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/30 bg-elevated/80 backdrop-blur-md shadow-xl">
                  {remainingPatterns.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedGuess(p.id);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-accent",
                        selectedGuess === p.id
                          ? "text-primary"
                          : "text-foreground-muted",
                      )}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            p.category === "creational"
                              ? "#60a5fa"
                              : p.category === "structural"
                                ? "#34d399"
                                : p.category === "behavioral"
                                  ? "#f59e0b"
                                  : "#a78bfa",
                        }}
                      />
                      {p.name}
                      <span className="ml-auto text-[9px] text-foreground-subtle">
                        {p.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleGuess}
              disabled={!selectedGuess}
              className="w-full rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Submit Guess ({maxGuesses - guesses.length} left)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
