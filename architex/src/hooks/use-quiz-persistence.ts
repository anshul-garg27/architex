"use client";

/**
 * Quiz result persistence hook.
 *
 * Saves quiz scores to both localStorage (instant) and progress API (sync).
 * Loads previous best scores from localStorage on mount.
 */

import { useCallback, useState, useEffect } from "react";

const LS_PREFIX = "architex-quiz-score:";

interface QuizScore {
  quizType: string;
  score: number;
  total: number;
  completedAt: string;
}

export function useQuizPersistence(quizType: string) {
  const lsKey = `${LS_PREFIX}${quizType}`;

  const [bestScore, setBestScore] = useState<QuizScore | null>(null);

  // Load previous best on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(lsKey);
      if (stored) {
        setBestScore(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [lsKey]);

  const saveScore = useCallback(
    (score: number, total: number) => {
      const newScore: QuizScore = {
        quizType,
        score,
        total,
        completedAt: new Date().toISOString(),
      };

      // Save to localStorage
      try {
        const prev = bestScore;
        if (!prev || score > prev.score) {
          localStorage.setItem(lsKey, JSON.stringify(newScore));
          setBestScore(newScore);
        }
      } catch {
        // ignore
      }

      // Save to progress API (non-blocking)
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: "lld",
          conceptId: `quiz-${quizType}`,
          score: total > 0 ? score / total : 0,
          completedAt: newScore.completedAt,
        }),
      }).catch(() => {
        // Silent fail — localStorage has the data
      });
    },
    [quizType, lsKey, bestScore],
  );

  return {
    bestScore,
    saveScore,
    hasPreviousScore: bestScore !== null,
  };
}
