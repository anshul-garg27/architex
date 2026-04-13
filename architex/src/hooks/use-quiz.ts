"use client";

/**
 * Quiz data hook — fetches quiz questions from /api/quiz.
 *
 * Usage:
 *   const { questions, isLoading } = useQuiz("lld", "scenario");
 *   const { questions, isLoading } = useQuiz("lld", "solid");
 */

import { useQuery } from "@tanstack/react-query";

export interface QuizQuestionRow {
  id: string;
  moduleId: string;
  quizType: string;
  slug: string;
  question: string;
  context: string | null;
  options: Array<{ label: string; whyWrong?: string; description?: string }>;
  correctIndex: number;
  explanation: string;
  patternId: string | null;
  difficulty: string | null;
  sortOrder: number;
}

interface QuizResponse {
  questions: QuizQuestionRow[];
  count: number;
}

const quizKeys = {
  all: ["quiz"] as const,
  list: (moduleId: string, type: string) =>
    [...quizKeys.all, moduleId, type] as const,
};

async function fetchQuiz(
  moduleId: string,
  type: string,
): Promise<QuizResponse> {
  const res = await fetch(
    `/api/quiz?module=${encodeURIComponent(moduleId)}&type=${encodeURIComponent(type)}`,
  );
  if (!res.ok) throw new Error(`Quiz fetch failed: ${res.status}`);
  return res.json();
}

export function useQuiz(moduleId: string, quizType: string) {
  const query = useQuery({
    queryKey: quizKeys.list(moduleId, quizType),
    queryFn: () => fetchQuiz(moduleId, quizType),
    staleTime: Infinity,
  });

  return {
    questions: query.data?.questions ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
  };
}
