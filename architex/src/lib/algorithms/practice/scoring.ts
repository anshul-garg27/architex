// ─────────────────────────────────────────────────────────────
// Architex — XP Scoring with Streaks and Mastery Levels (ALG-216)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'architex-algo-scores';

export interface AlgoScore {
  algorithmId: string;
  runs: number;
  flashcardsCorrect: number;
  flashcardsTotal: number;
  scenariosCorrect: number;
  scenariosTotal: number;
  debugSolved: number;
  lastActivity: string; // ISO date
}

function emptyScore(algorithmId: string): AlgoScore {
  return {
    algorithmId,
    runs: 0,
    flashcardsCorrect: 0,
    flashcardsTotal: 0,
    scenariosCorrect: 0,
    scenariosTotal: 0,
    debugSolved: 0,
    lastActivity: '',
  };
}

export function getAlgoScores(): Record<string, AlgoScore> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function saveScores(scores: Record<string, AlgoScore>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function ensureScore(scores: Record<string, AlgoScore>, algorithmId: string): AlgoScore {
  if (!scores[algorithmId]) {
    scores[algorithmId] = emptyScore(algorithmId);
  }
  return scores[algorithmId];
}

export function recordRun(algorithmId: string): void {
  const scores = getAlgoScores();
  const score = ensureScore(scores, algorithmId);
  score.runs++;
  score.lastActivity = new Date().toISOString();
  saveScores(scores);
}

export function recordFlashcard(algorithmId: string, correct: boolean): void {
  const scores = getAlgoScores();
  const score = ensureScore(scores, algorithmId);
  score.flashcardsTotal++;
  if (correct) score.flashcardsCorrect++;
  score.lastActivity = new Date().toISOString();
  saveScores(scores);
}

export function recordScenario(algorithmId: string, correct: boolean): void {
  const scores = getAlgoScores();
  const score = ensureScore(scores, algorithmId);
  score.scenariosTotal++;
  if (correct) score.scenariosCorrect++;
  score.lastActivity = new Date().toISOString();
  saveScores(scores);
}

export function recordDebugSolved(algorithmId: string): void {
  const scores = getAlgoScores();
  const score = ensureScore(scores, algorithmId);
  score.debugSolved++;
  score.lastActivity = new Date().toISOString();
  saveScores(scores);
}

/**
 * Mastery levels based on breadth of activity:
 *   0 — No activity
 *   1 — Has run the algorithm at least once
 *   2 — 3+ flashcards correct
 *   3 — 5+ flashcards correct AND 1+ scenario correct
 *   4 — Also solved 1+ debug challenge
 *   5 — 10+ flashcards, 3+ scenarios, 1+ debug (full mastery)
 */
export function getMasteryLevel(score: AlgoScore): number {
  if (score.runs === 0) return 0;
  let level = 1;
  if (score.flashcardsCorrect >= 3) level = 2;
  if (score.flashcardsCorrect >= 5 && score.scenariosCorrect >= 1) level = 3;
  if (score.flashcardsCorrect >= 5 && score.scenariosCorrect >= 1 && score.debugSolved >= 1) level = 4;
  if (score.flashcardsCorrect >= 10 && score.scenariosCorrect >= 3 && score.debugSolved >= 1) level = 5;
  return level;
}
