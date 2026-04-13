"use client";

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Keyboard,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/constants/motion";
import { scheduleReview } from "@/lib/interview/srs";
import type { ReviewCard, Rating } from "@/lib/interview/srs";
import { getChallengeById } from "@/lib/interview/challenges";

// ── Types ────────────────────────────────────────────────────────────

export interface SRSReviewSessionProps {
  dueCards: ReviewCard[];
  onCardReviewed: (updatedCard: ReviewCard) => void;
  onSessionComplete: (summary: SessionSummary) => void;
  onExit: () => void;
  className?: string;
}

export interface SessionSummary {
  totalReviewed: number;
  ratings: Record<Rating, number>;
  timeSpentMs: number;
  accuracy: number;
}

// ── Rating config ────────────────────────────────────────────────────

const RATING_CONFIG: {
  rating: Rating;
  label: string;
  shortcut: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
}[] = [
  {
    rating: "again",
    label: "Again",
    shortcut: "1",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    hoverBg: "hover:bg-red-500/20",
  },
  {
    rating: "hard",
    label: "Hard",
    shortcut: "2",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    hoverBg: "hover:bg-orange-500/20",
  },
  {
    rating: "good",
    label: "Good",
    shortcut: "3",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    hoverBg: "hover:bg-emerald-500/20",
  },
  {
    rating: "easy",
    label: "Easy",
    shortcut: "4",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    hoverBg: "hover:bg-blue-500/20",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

function getChallengeInsights(conceptName: string): {
  category: string;
  requirements: string[];
  concepts: string[];
  approach: string;
} {
  // Try to find a matching challenge by concept name
  // Concept names come from challenge concepts array
  const challenge = getChallengeById(
    conceptName.toLowerCase().replace(/\s+/g, "-"),
  );

  if (challenge) {
    return {
      category: challenge.category,
      requirements: challenge.requirements.slice(0, 3),
      concepts: challenge.concepts,
      approach: challenge.description,
    };
  }

  // Fallback for concepts not directly tied to a challenge
  return {
    category: "system-design",
    requirements: [
      `Understand core principles of ${conceptName}`,
      `Know when to apply ${conceptName} in system design`,
      `Discuss tradeoffs and alternatives`,
    ],
    concepts: [conceptName],
    approach: `Review the key design patterns and tradeoffs associated with ${conceptName}. Consider scalability, reliability, and performance implications.`,
  };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ── Session Summary View ─────────────────────────────────────────────

const SessionSummaryView = memo(function SessionSummaryView({
  summary,
  onExit,
}: {
  summary: SessionSummary;
  onExit: () => void;
}) {
  const accuracyColor =
    summary.accuracy >= 80
      ? "text-emerald-400"
      : summary.accuracy >= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.snappy}
      className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <Trophy className="h-8 w-8 text-emerald-400" />
      </div>

      <h2 className="mb-1 text-xl font-bold text-zinc-100">Session Complete</h2>
      <p className="mb-6 text-sm text-zinc-400">
        Great work reviewing your cards!
      </p>

      {/* Stats grid */}
      <div className="mb-6 grid w-full grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Cards Reviewed
          </p>
          <p className="text-2xl font-bold text-zinc-100">
            {summary.totalReviewed}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Accuracy
          </p>
          <p className={cn("text-2xl font-bold", accuracyColor)}>
            {summary.accuracy}%
          </p>
        </div>
        <div className="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Time Spent
          </p>
          <p className="text-2xl font-bold text-zinc-100">
            {formatTime(summary.timeSpentMs)}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Avg / Card
          </p>
          <p className="text-2xl font-bold text-zinc-100">
            {summary.totalReviewed > 0
              ? formatTime(summary.timeSpentMs / summary.totalReviewed)
              : "0:00"}
          </p>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="mb-6 w-full">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Rating Breakdown
        </p>
        <div className="flex gap-2">
          {RATING_CONFIG.map(({ rating, label, color, bgColor }) => (
            <div
              key={rating}
              className={cn("flex-1 rounded-lg px-2 py-2 text-center", bgColor)}
            >
              <p className={cn("text-lg font-bold", color)}>
                {summary.ratings[rating]}
              </p>
              <p className="text-[10px] text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onExit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>
    </motion.div>
  );
});

// ── Flashcard ────────────────────────────────────────────────────────

const Flashcard = memo(function Flashcard({
  card,
  isFlipped,
  onFlip,
}: {
  card: ReviewCard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const insights = useMemo(
    () => getChallengeInsights(card.conceptName),
    [card.conceptName],
  );

  const stateColor =
    card.state === "new"
      ? "text-zinc-400"
      : card.state === "learning"
        ? "text-blue-400"
        : card.state === "relearning"
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <div
      className="perspective-[1200px] relative h-[380px] w-full max-w-lg cursor-pointer"
      onClick={onFlip}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={springs.snappy}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex h-full flex-col">
            {/* State badge */}
            <div className="mb-4 flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                  stateColor,
                )}
              >
                {card.state}
              </span>
              <span className="text-[10px] text-zinc-600">
                {card.reps} reviews
              </span>
            </div>

            {/* Concept name */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <h3 className="mb-3 text-2xl font-bold text-zinc-100">
                {card.conceptName}
              </h3>
              <span className="rounded-full bg-zinc-800/80 px-3 py-1 text-xs capitalize text-zinc-400">
                {insights.category}
              </span>
            </div>

            {/* Flip hint */}
            <div className="flex items-center justify-center gap-1.5 text-zinc-600">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">
                Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">Space</kbd> to flip
              </span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 overflow-y-auto rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 shadow-2xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-100">
              {card.conceptName}
            </h3>

            {/* Key Design Insights */}
            <div>
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Key Requirements
              </h4>
              <ul className="space-y-1.5">
                {insights.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-300"
                  >
                    <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Concepts */}
            <div>
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Related Concepts
              </h4>
              <div className="flex flex-wrap gap-1">
                {insights.concepts.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Approach */}
            <div>
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Approach
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400">
                {insights.approach}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// ── Main Review Session ──────────────────────────────────────────────

const SRSReviewSession = memo(function SRSReviewSession({
  dueCards,
  onCardReviewed,
  onSessionComplete,
  onExit,
  className,
}: SRSReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(
    null,
  );
  const [ratings, setRatings] = useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const sessionStartRef = useRef(Date.now());

  const totalCards = dueCards.length;
  const currentCard = currentIndex < totalCards ? dueCards[currentIndex] : null;
  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard || !isFlipped) return;

      const updatedCard = scheduleReview(currentCard, rating);
      onCardReviewed(updatedCard);

      const newRatings = { ...ratings, [rating]: ratings[rating] + 1 };
      setRatings(newRatings);

      const nextIndex = currentIndex + 1;

      if (nextIndex >= totalCards) {
        // Session complete
        const totalReviewed = nextIndex;
        const goodOrBetter = newRatings.good + newRatings.easy;
        const accuracy =
          totalReviewed > 0
            ? Math.round((goodOrBetter / totalReviewed) * 100)
            : 0;
        const summary: SessionSummary = {
          totalReviewed,
          ratings: newRatings,
          timeSpentMs: Date.now() - sessionStartRef.current,
          accuracy,
        };
        setSessionSummary(summary);
        onSessionComplete(summary);
      } else {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
      }
    },
    [currentCard, isFlipped, currentIndex, totalCards, ratings, onCardReviewed, onSessionComplete],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "1" && isFlipped) {
        handleRate("again");
      } else if (e.key === "2" && isFlipped) {
        handleRate("hard");
      } else if (e.key === "3" && isFlipped) {
        handleRate("good");
      } else if (e.key === "4" && isFlipped) {
        handleRate("easy");
      } else if (e.key === "Escape") {
        onExit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleRate, isFlipped, onExit]);

  // Session summary screen
  if (sessionSummary) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-background p-6",
          className,
        )}
      >
        <SessionSummaryView summary={sessionSummary} onExit={onExit} />
      </div>
    );
  }

  // No cards
  if (totalCards === 0) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center bg-background p-6",
          className,
        )}
      >
        <CheckCircle className="mb-3 h-12 w-12 text-emerald-400 opacity-50" />
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">
          All caught up!
        </h2>
        <p className="mb-4 text-sm text-zinc-400">No cards due for review.</p>
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-background",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit
          </button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              SRS Review Session
            </h2>
            <p className="text-[11px] text-zinc-500">
              {currentIndex + 1} of {totalCards} cards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Keyboard shortcut hint */}
          <div className="hidden items-center gap-1.5 text-[10px] text-zinc-600 md:flex">
            <Keyboard className="h-3 w-3" />
            <span>Space: flip</span>
            <span className="text-zinc-700">|</span>
            <span>1-4: rate</span>
          </div>
          {/* Timer */}
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            <span>{formatTime(Date.now() - sessionStartRef.current)}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-zinc-900">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={springs.smooth}
        />
      </div>

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={springs.snappy}
              className="w-full max-w-lg"
            >
              <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
      <div className="border-t border-zinc-800 px-6 py-4">
        <AnimatePresence>
          {isFlipped ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={springs.snappy}
              className="flex items-center justify-center gap-3"
            >
              {RATING_CONFIG.map(
                ({ rating, label, shortcut, color, bgColor, borderColor, hoverBg }) => (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-6 py-3 transition-all",
                      bgColor,
                      borderColor,
                      hoverBg,
                    )}
                  >
                    <span className={cn("text-sm font-semibold", color)}>
                      {label}
                    </span>
                    <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                      {shortcut}
                    </kbd>
                  </button>
                ),
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center"
            >
              <p className="text-sm text-zinc-500">
                Click the card or press{" "}
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                  Space
                </kbd>{" "}
                to reveal the answer
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

SRSReviewSession.displayName = "SRSReviewSession";

export default SRSReviewSession;
