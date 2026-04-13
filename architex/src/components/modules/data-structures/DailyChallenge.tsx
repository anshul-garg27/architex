"use client";

import React, { memo, useState, useEffect } from "react";
import { Calendar, Flame, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { ActiveDS } from "./types";

interface Challenge {
  ds: ActiveDS;
  dsLabel: string;
  task: string;
  data: string;
}

const CHALLENGES: Challenge[] = [
  {
    ds: "bst",
    dsLabel: "BST",
    task: "Insert these values and predict the tree shape",
    data: "42, 17, 63, 5, 25",
  },
  {
    ds: "hash-table",
    dsLabel: "Hash Table",
    task: "Insert these keys \u2014 which bucket gets the most collisions?",
    data: "alice, bob, carol, dave, eve",
  },
  {
    ds: "heap",
    dsLabel: "Min-Heap",
    task: "Build a min-heap from this array. What is the root?",
    data: "8, 3, 12, 1, 5, 9",
  },
  {
    ds: "avl-tree",
    dsLabel: "AVL Tree",
    task: "Insert in order \u2014 how many rotations occur?",
    data: "1, 2, 3, 4, 5",
  },
  {
    ds: "bloom-filter",
    dsLabel: "Bloom Filter",
    task: "Insert 5 items. What is the false positive rate?",
    data: "cat, dog, fish, bird, snake",
  },
  {
    ds: "trie",
    dsLabel: "Trie",
    task: "How many nodes are shared between these words?",
    data: "cat, car, card, care",
  },
  {
    ds: "lru-cache",
    dsLabel: "LRU Cache",
    task: "After these ops, what gets evicted?",
    data: "get(A), put(B,1), put(C,2), get(A), put(D,3), put(E,4)",
  },
];

function getDailyChallenge(): Challenge {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today
    .split("-")
    .reduce((a, b) => a + parseInt(b, 10), 0);
  return CHALLENGES[seed % CHALLENGES.length];
}

function getStreak(): { streak: number; completedToday: boolean } {
  try {
    const streakKey = "architex-ds-daily-streak";
    const streak = parseInt(
      localStorage.getItem(streakKey) || "0",
      10,
    );
    const lastDate = localStorage.getItem(streakKey + "-last") || "";
    const today = new Date().toISOString().slice(0, 10);
    return { streak, completedToday: lastDate === today };
  } catch {
    return { streak: 0, completedToday: false };
  }
}

function markCompleted(): number {
  try {
    const streakKey = "architex-ds-daily-streak";
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(streakKey + "-last") || "";

    if (lastDate === today) {
      return parseInt(localStorage.getItem(streakKey) || "1", 10);
    }

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);
    let streak = parseInt(
      localStorage.getItem(streakKey) || "0",
      10,
    );
    streak = lastDate === yesterday ? streak + 1 : 1;

    localStorage.setItem(streakKey, String(streak));
    localStorage.setItem(streakKey + "-last", today);
    return streak;
  } catch {
    return 1;
  }
}

const DailyChallenge = memo(function DailyChallenge({
  onTryChallenge,
}: {
  onTryChallenge: (ds: ActiveDS, data: string) => void;
}) {
  const challenge = getDailyChallenge();
  const [streakInfo, setStreakInfo] = useState(() => getStreak());
  const today = new Date().toISOString().slice(0, 10);

  // Re-read streak from localStorage on mount (handles SSR)
  useEffect(() => {
    setStreakInfo(getStreak());
  }, []);

  const handleTry = () => {
    const newStreak = markCompleted();
    setStreakInfo({ streak: newStreak, completedToday: true });
    onTryChallenge(challenge.ds, challenge.data);
  };

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Header with date + streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-medium">{today}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame
            className={`h-4 w-4 ${
              streakInfo.streak > 0
                ? "text-orange-400"
                : "text-foreground-subtle"
            }`}
          />
          <span
            className={`text-sm font-bold tabular-nums ${
              streakInfo.streak > 0
                ? "text-orange-400"
                : "text-foreground-subtle"
            }`}
          >
            {streakInfo.streak}
          </span>
          <span className="text-[10px] text-foreground-subtle">
            day streak
          </span>
        </div>
      </div>

      {/* Challenge card */}
      <div className="rounded-lg border border-border bg-elevated p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {challenge.dsLabel}
          </span>
          {streakInfo.completedToday && (
            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
              Attempted
            </span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {challenge.task}
        </p>
        <div className="rounded bg-background/60 px-2.5 py-1.5 font-mono text-xs text-foreground-muted">
          {challenge.data}
        </div>
      </div>

      {/* Try It button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleTry}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <ArrowRight className="h-4 w-4" />
        {streakInfo.completedToday ? "Try Again" : "Try It"}
      </motion.button>
    </div>
  );
});

export { DailyChallenge };
