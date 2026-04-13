// ── Challenge API ───────────────────────────────────────────────────
//
// GET /api/challenges — Returns all interview challenges.
// Supports server-side filtering via query params:
//   ?difficulty=1..5       (exact match)
//   ?category=classic|modern|infrastructure|advanced
//   ?company=Google        (case-insensitive match within companies array)

import { NextResponse } from 'next/server';
import {
  CHALLENGES,
  ALL_CATEGORIES,
  type ChallengeDefinition,
} from '@/lib/interview/challenges';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficultyStr = searchParams.get('difficulty');
  const category = searchParams.get('category') as ChallengeDefinition['category'] | null;
  const company = searchParams.get('company');

  let challenges: ChallengeDefinition[] = CHALLENGES;

  // Filter by difficulty (exact match).
  if (difficultyStr) {
    const difficulty = Number(difficultyStr);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'difficulty must be a number between 1 and 5.' },
        { status: 400 },
      );
    }
    challenges = challenges.filter((c) => c.difficulty === difficulty);
  }

  // Filter by category.
  if (category) {
    if (!ALL_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category "${category}". Must be one of: ${ALL_CATEGORIES.join(', ')}`,
        },
        { status: 400 },
      );
    }
    challenges = challenges.filter((c) => c.category === category);
  }

  // Filter by company (case-insensitive partial match).
  if (company) {
    const lower = company.toLowerCase();
    challenges = challenges.filter((c) =>
      c.companies.some((co) => co.toLowerCase().includes(lower)),
    );
  }

  return NextResponse.json(
    { challenges, count: challenges.length },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
      },
    },
  );
}
