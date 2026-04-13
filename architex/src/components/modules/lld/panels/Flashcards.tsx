"use client";

/**
 * Flashcards — Swipeable flashcards for all patterns + SOLID (LLD-139).
 * Front: pattern name + "What does this do?"
 * Back: 3-bullet summary + analogy + mini UML class list
 * Arrow keys or swipe to navigate. Export as CSV for Anki import.
 *
 * Integration: Add to LLDBottomPanelTabs in useLLDModuleImpl.tsx:
 *   import { Flashcards } from "../panels/Flashcards";
 *   // Add tab: { id: "flashcards", label: "Flashcards" }
 *   // Render: <Flashcards /> in the matching tab case
 */

import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Shuffle,
  Layers,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern, SOLIDDemo } from "@/lib/lld";
import { useLLDDataContext } from "../LLDDataContext";
import { CATEGORY_LABELS, SOLID_PRINCIPLE_LABELS } from "../constants";

// ── Flashcard Data Model ────────────────────────────────────

interface Flashcard {
  id: string;
  front: {
    title: string;
    subtitle: string;
    category: string;
    categoryColor: string;
  };
  back: {
    summary: string[];
    analogy: string;
    classList: string[];
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  creational: "var(--lld-stereo-class)",
  structural: "var(--lld-stereo-interface)",
  behavioral: "var(--lld-stereo-abstract)",
  modern: "var(--lld-stereo-enum)",
  resilience: "var(--lld-solid-srp)",
  concurrency: "var(--lld-solid-ocp)",
  "ai-agent": "var(--lld-solid-lsp)",
  solid: "var(--lld-solid-dip)",
};

function generatePatternCard(p: DesignPattern): Flashcard {
  return {
    id: `card-${p.id}`,
    front: {
      title: p.name,
      subtitle: "What does this do?",
      category: CATEGORY_LABELS[p.category] ?? p.category,
      categoryColor: CATEGORY_COLORS[p.category] ?? "var(--lld-canvas-border)",
    },
    back: {
      summary: p.summary.slice(0, 3),
      analogy: p.analogy,
      classList: p.classes.map(
        (c) =>
          `${c.stereotype === "class" ? "" : `\u00AB${c.stereotype}\u00BB `}${c.name}`,
      ),
    },
  };
}

function generateSOLIDCard(d: SOLIDDemo): Flashcard {
  return {
    id: `card-${d.id}`,
    front: {
      title: `${d.principle} \u2014 ${d.name}`,
      subtitle: "What does this do?",
      category: "SOLID",
      categoryColor: CATEGORY_COLORS.solid,
    },
    back: {
      summary: d.summary.slice(0, 3),
      analogy: d.realWorldExample,
      classList: d.afterClasses.map(
        (c) =>
          `${c.stereotype === "class" ? "" : `\u00AB${c.stereotype}\u00BB `}${c.name}`,
      ),
    },
  };
}

// ── CSV Export ───────────────────────────────────────────────

function escapeCSV(text: string): string {
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function exportAsCSV(cards: Flashcard[]): void {
  const rows = cards.map((card) => {
    const front = `${card.front.title} (${card.front.category})`;
    const backLines = [
      ...card.back.summary.map((s) => `- ${s}`),
      "",
      `Analogy: ${card.back.analogy}`,
      "",
      `Classes: ${card.back.classList.join(", ")}`,
    ].join("\n");
    return `${escapeCSV(front)},${escapeCSV(backLines)}`;
  });

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "architex-flashcards.csv";
  link.click();
  URL.revokeObjectURL(url);
}

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

type FilterMode = "all" | "patterns" | "solid";

export const Flashcards = memo(function Flashcards() {
  const { patterns: DESIGN_PATTERNS, solidDemos: SOLID_DEMOS } = useLLDDataContext();
  const allCards = useMemo(() => {
    const patternCards = DESIGN_PATTERNS.map(generatePatternCard);
    const solidCards = SOLID_DEMOS.map(generateSOLIDCard);
    return [...patternCards, ...solidCards];
  }, []);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [cards, setCards] = useState<Flashcard[]>(allCards);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const touchStartXRef = useRef<number | null>(null);

  const filteredBase = useMemo(() => {
    if (filter === "patterns") return allCards.filter((c) => !c.id.startsWith("card-solid"));
    if (filter === "solid") return allCards.filter((c) => c.id.startsWith("card-solid"));
    return allCards;
  }, [allCards, filter]);

  const startDeck = useCallback(
    (mode: FilterMode, shuffle: boolean) => {
      let deck: Flashcard[];
      if (mode === "patterns") {
        deck = allCards.filter((c) => !c.id.startsWith("card-solid"));
      } else if (mode === "solid") {
        deck = allCards.filter((c) => c.id.startsWith("card-solid"));
      } else {
        deck = [...allCards];
      }
      setFilter(mode);
      setCards(shuffle ? shuffleArray(deck) : deck);
      setCurrentIdx(0);
      setFlipped(false);
      setStarted(true);
    },
    [allCards],
  );

  const goToCard = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < cards.length) {
        setCurrentIdx(idx);
        setFlipped(false);
      }
    },
    [cards.length],
  );

  const goNext = useCallback(() => goToCard(currentIdx + 1), [goToCard, currentIdx]);
  const goPrev = useCallback(() => goToCard(currentIdx - 1), [goToCard, currentIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!started) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, goNext, goPrev]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev],
  );

  // ── Start Screen ──────────────────────────────────────────

  if (!started) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Pattern Flashcards</h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {DESIGN_PATTERNS.length} design patterns + {SOLID_DEMOS.length} SOLID principles.
            Flip cards with Space/Enter, navigate with arrow keys or swipe.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => startDeck("all", false)}
              className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              All Cards ({allCards.length})
            </button>
            <button
              onClick={() => startDeck("patterns", false)}
              className="rounded-xl border border-border/30 bg-elevated/50 px-4 py-2 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              Patterns Only ({allCards.filter((c) => !c.id.startsWith("card-solid")).length})
            </button>
            <button
              onClick={() => startDeck("solid", false)}
              className="rounded-xl border border-border/30 bg-elevated/50 px-4 py-2 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              SOLID Only ({SOLID_DEMOS.length})
            </button>
          </div>

          <button
            onClick={() => startDeck("all", true)}
            className="flex items-center gap-1.5 text-[10px] font-medium text-foreground-subtle transition-colors hover:text-primary"
          >
            <Shuffle className="h-3 w-3" />
            Start Shuffled
          </button>
        </div>
      </div>
    );
  }

  // ── Flashcard View ────────────────────────────────────────

  const card = cards[currentIdx];

  return (
    <div className="flex h-full flex-col" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Card {currentIdx + 1}/{cards.length}
        </span>
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setCards(shuffleArray(cards))}
          className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          title="Shuffle deck"
        >
          <Shuffle className="h-3 w-3" />
        </button>
        <button
          onClick={() => exportAsCSV(cards)}
          className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          title="Export as CSV for Anki"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={() => {
            setStarted(false);
            setFlipped(false);
          }}
          className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 px-2 py-1 text-[10px] font-medium text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          title="Back to menu"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Card area */}
      <div
        className="flex flex-1 items-center justify-center p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-4">
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors",
              currentIdx === 0
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-accent hover:text-foreground",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* The card */}
          <button
            onClick={() => setFlipped((f) => !f)}
            className={cn(
              "relative flex h-64 w-[480px] cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 backdrop-blur-sm hover:scale-[1.02]",
              flipped
                ? "border-primary/40 bg-elevated/50 shadow-lg shadow-primary/10"
                : "border-border/30 bg-surface/80 shadow-md hover:border-primary/30 hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.1)]",
            )}
            aria-label={flipped ? "Showing answer. Click to flip back." : "Click to reveal answer."}
          >
            {!flipped ? (
              /* ── FRONT ── */
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <span
                  className="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: card.front.categoryColor,
                    backgroundColor: `color-mix(in srgb, ${card.front.categoryColor} 12%, transparent)`,
                  }}
                >
                  {card.front.category}
                </span>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">{card.front.title}</h3>
                <p className="text-xs text-foreground-subtle">{card.front.subtitle}</p>
                <span className="mt-2 text-[9px] text-foreground-subtle/60">
                  Click or press Space to flip
                </span>
              </div>
            ) : (
              /* ── BACK ── */
              <div className="flex h-full flex-col gap-3 overflow-auto p-5 text-left">
                {/* Summary bullets */}
                <div>
                  <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-foreground-subtle">
                    Summary
                  </span>
                  <ul className="space-y-1">
                    {card.back.summary.map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-[11px] leading-relaxed text-foreground-muted"
                      >
                        <span className="mt-0.5 text-primary">&#x2022;</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Analogy */}
                <div>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground-subtle">
                    Analogy
                  </span>
                  <p className="text-[10px] italic leading-relaxed text-foreground-muted">
                    {card.back.analogy}
                  </p>
                </div>

                {/* Class list */}
                <div>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-foreground-subtle">
                    Key Classes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {card.back.classList.map((cls) => (
                      <span
                        key={cls}
                        className="inline-flex items-center rounded-xl border border-border/30 bg-elevated/50 px-1.5 py-0.5 text-[9px] font-mono text-foreground-muted"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </button>

          {/* Next button */}
          <button
            onClick={goNext}
            disabled={currentIdx >= cards.length - 1}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors",
              currentIdx >= cards.length - 1
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-accent hover:text-foreground",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-center gap-4 border-t border-border/30 px-4 py-2 text-[9px] text-foreground-subtle">
        <span>
          <kbd className="rounded border border-border/30 bg-elevated/50 px-1 py-0.5 text-[8px] font-mono">
            \u2190
          </kbd>{" "}
          /{" "}
          <kbd className="rounded border border-border/30 bg-elevated/50 px-1 py-0.5 text-[8px] font-mono">
            \u2192
          </kbd>{" "}
          Navigate
        </span>
        <span>
          <kbd className="rounded border border-border/30 bg-elevated/50 px-1 py-0.5 text-[8px] font-mono">
            Space
          </kbd>{" "}
          Flip
        </span>
        <span>Swipe on touch devices</span>
      </div>
    </div>
  );
});
