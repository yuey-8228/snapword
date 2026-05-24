/**
 * Spaced-repetition scheduling (SM-2 variant) for word cards.
 *
 * Pure functions where possible — `scheduleNext` takes a state and a grade and
 * returns the next state, so the algorithm can be reasoned about and tested in
 * isolation. The storage-touching helpers (`getDueCards`, `gradeCard`) wrap it.
 */

import type { ReviewGrade, ReviewState, WordCard } from '../types';
import {
  getCard,
  getReviewMap,
  getReviewState,
  getWordBook,
  registerReview,
  saveReviewState,
} from './storage';

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;

/** Map a self-assessment grade to an SM-2 quality score (0–5). */
const QUALITY: Record<ReviewGrade, number> = {
  forgot: 1,
  hard: 3,
  good: 5,
};

/**
 * Compute the next review state from the current one and the user's grade.
 * Pure: does not touch storage.
 */
export function scheduleNext(
  state: ReviewState,
  grade: ReviewGrade,
  now = Date.now(),
): ReviewState {
  const q = QUALITY[grade];

  // SM-2 ease update; never let it drop below the floor.
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  let reps: number;
  let interval: number;

  if (grade === 'forgot') {
    // Lapse: reset the streak, re-show within a day.
    reps = 0;
    interval = 1;
  } else {
    reps = state.reps + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(state.interval * ease);
    // 'hard' pulls the interval back so it returns sooner than a clean 'good'.
    if (grade === 'hard') interval = Math.max(1, Math.round(interval * 0.6));
  }

  return {
    cardId: state.cardId,
    ease: Math.round(ease * 100) / 100,
    interval,
    reps,
    lastReview: now,
    nextReview: now + interval * DAY_MS,
  };
}

/** A due card paired with its card data and review state. */
export interface DueCard {
  card: WordCard;
  state: ReviewState;
}

/**
 * All word-book cards that are due for review (nextReview <= now), oldest-due
 * first. Self-heals: book cards added before the review feature existed (or
 * whose card data is missing) are registered/skipped on the fly.
 */
export function getDueCards(now = Date.now()): DueCard[] {
  const book = getWordBook();
  const map = getReviewMap();
  const due: DueCard[] = [];

  for (const entry of book.cards) {
    const card = getCard(entry.cardId);
    if (!card) continue; // card data evicted from LRU cache — skip silently

    let state: ReviewState | undefined = map[entry.cardId];
    if (!state) {
      // Legacy card: register it now, due immediately.
      registerReview(entry.cardId);
      state = getReviewState(entry.cardId);
      if (!state) continue;
    }

    if (state.nextReview <= now) due.push({ card, state });
  }

  return due.sort((a, b) => a.state.nextReview - b.state.nextReview);
}

/** Count of cards due right now. Cheap enough for a home-screen badge. */
export function getDueCount(now = Date.now()): number {
  return getDueCards(now).length;
}

/** Grade a card and persist its next review state. Returns the new state. */
export function gradeCard(
  cardId: string,
  grade: ReviewGrade,
  now = Date.now(),
): ReviewState | undefined {
  const current = getReviewState(cardId);
  if (!current) return undefined;
  const next = scheduleNext(current, grade, now);
  saveReviewState(next);
  return next;
}

/** Human-readable "next due" label, e.g. "明天" / "3 天后". */
export function nextDueLabel(intervalDays: number): string {
  if (intervalDays <= 0) return '今天';
  if (intervalDays === 1) return '明天';
  return `${intervalDays} 天后`;
}
