// ─────────────────────────────────────────────────────────────
// ALG-217 — Spaced Repetition System (localStorage-based)
// ─────────────────────────────────────────────────────────────

export interface ReviewCard {
  algorithmId: string;
  nextReviewDate: string; // ISO date (YYYY-MM-DD)
  interval: number; // days until next review
  ease: number; // ease factor (default 2.5)
  reviews: number;
}

const STORAGE_KEY = 'architex-srs-cards';

function readCards(): ReviewCard[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCards(cards: ReviewCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/** Return all cards that are due for review today or earlier. */
export function getCardsForReview(): ReviewCard[] {
  const cards = readCards();
  const today = new Date().toISOString().split('T')[0];
  return cards.filter((c) => c.nextReviewDate <= today);
}

/** Schedule or re-schedule a review for an algorithm based on recall success. */
export function scheduleReview(algorithmId: string, correct: boolean): void {
  const cards = readCards();
  let card = cards.find((c) => c.algorithmId === algorithmId);

  if (!card) {
    card = { algorithmId, nextReviewDate: '', interval: 1, ease: 2.5, reviews: 0 };
    cards.push(card);
  }

  if (correct) {
    card.interval =
      card.reviews === 0
        ? 1
        : card.reviews === 1
          ? 3
          : Math.round(card.interval * card.ease);
    card.ease = Math.max(1.3, card.ease + 0.1);
  } else {
    card.interval = 1;
    card.ease = Math.max(1.3, card.ease - 0.2);
  }

  card.reviews++;
  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReviewDate = next.toISOString().split('T')[0];

  writeCards(cards);
}

/** Add an algorithm to the review deck if not already present. */
export function addToReviewDeck(algorithmId: string): void {
  const cards = readCards();
  if (cards.find((c) => c.algorithmId === algorithmId)) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  cards.push({
    algorithmId,
    nextReviewDate: tomorrow.toISOString().split('T')[0],
    interval: 1,
    ease: 2.5,
    reviews: 0,
  });

  writeCards(cards);
}
