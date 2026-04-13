// ── Template API ────────────────────────────────────────────────────
//
// GET /api/templates — Returns all built-in system design templates.
// Supports server-side filtering via query params:
//   ?category=classic|modern|infrastructure|advanced
//   ?difficulty=1..5   (returns templates at or below this level)

import { NextResponse } from 'next/server';
import {
  SYSTEM_DESIGN_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByDifficulty,
} from '@/lib/templates';
import type { DiagramTemplate } from '@/lib/templates';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as DiagramTemplate['category'] | null;
  const difficultyStr = searchParams.get('difficulty');

  let templates: DiagramTemplate[] = SYSTEM_DESIGN_TEMPLATES;

  // Filter by category if provided.
  if (category) {
    const validCategories: DiagramTemplate['category'][] = [
      'classic',
      'modern',
      'infrastructure',
      'advanced',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category "${category}". Must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 },
      );
    }
    templates = getTemplatesByCategory(category);
  }

  // Filter by difficulty if provided (returns templates at or below this level).
  if (difficultyStr) {
    const difficulty = Number(difficultyStr);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'difficulty must be a number between 1 and 5.' },
        { status: 400 },
      );
    }
    // If both filters are active, intersect the results.
    const byDifficulty = getTemplatesByDifficulty(difficulty);
    if (category) {
      const difficultyIds = new Set(byDifficulty.map((t) => t.id));
      templates = templates.filter((t) => difficultyIds.has(t.id));
    } else {
      templates = byDifficulty;
    }
  }

  return NextResponse.json(
    { templates, count: templates.length },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
      },
    },
  );
}
