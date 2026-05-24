import type {
  FavoriteEntry,
  ReviewState,
  WordBook,
  WordCard,
} from '../types';

const KEYS = {
  favorites: 'user_favorite_cards',
  wordBook: 'user_word_book',
  cardCache: 'word_card_cache',
  sortPref: 'app_sort_pref',
  reviewSchedule: 'user_review_schedule',
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ============ favorites ============ */

export function getFavorites(): FavoriteEntry[] {
  return safeParse<FavoriteEntry[]>(localStorage.getItem(KEYS.favorites), []);
}

export function isFavorited(cardId: string): boolean {
  return getFavorites().some((f) => f.cardId === cardId);
}

export function addFavorite(cardId: string): boolean {
  const list = getFavorites();
  if (list.some((f) => f.cardId === cardId)) return true;
  list.unshift({ cardId, timestamp: Date.now() });
  return safeWrite(KEYS.favorites, list);
}

export function removeFavorite(cardId: string): boolean {
  const list = getFavorites().filter((f) => f.cardId !== cardId);
  return safeWrite(KEYS.favorites, list);
}

/* ============ word book ============ */

const DEFAULT_BOOK: WordBook = { name: '我的词卡本', cards: [] };

export function getWordBook(): WordBook {
  return safeParse<WordBook>(localStorage.getItem(KEYS.wordBook), DEFAULT_BOOK);
}

export function renameWordBook(name: string): boolean {
  const book = getWordBook();
  book.name = name;
  return safeWrite(KEYS.wordBook, book);
}

export function addCardToBook(cardId: string): boolean {
  const book = getWordBook();
  if (book.cards.some((c) => c.cardId === cardId)) {
    // already in book — refresh timestamp so it floats to top
    book.cards = book.cards.filter((c) => c.cardId !== cardId);
  }
  book.cards.unshift({ cardId, timestamp: Date.now() });
  // Register the card into the spaced-repetition schedule on first add.
  registerReview(cardId);
  return safeWrite(KEYS.wordBook, book);
}

export function removeCardFromBook(cardId: string): boolean {
  const book = getWordBook();
  book.cards = book.cards.filter((c) => c.cardId !== cardId);
  // Removing from the book also drops it from the review schedule.
  unregisterReview(cardId);
  return safeWrite(KEYS.wordBook, book);
}

/* ============ card cache ============ */
// LRU-ish: keep only last 200 cards to prevent localStorage overflow

const CARD_CACHE_LIMIT = 200;

export function getCardCache(): Record<string, WordCard> {
  return safeParse<Record<string, WordCard>>(localStorage.getItem(KEYS.cardCache), {});
}

export function getCard(cardId: string): WordCard | undefined {
  return getCardCache()[cardId];
}

export function saveCard(card: WordCard): boolean {
  let cache = getCardCache();
  cache[card.cardId] = card;

  const ids = Object.keys(cache);
  if (ids.length > CARD_CACHE_LIMIT) {
    // referenced cards (in book or favorites) are protected; drop the rest by createdAt
    const protectedIds = new Set<string>([
      ...getFavorites().map((f) => f.cardId),
      ...getWordBook().cards.map((c) => c.cardId),
    ]);
    const droppable = ids
      .filter((id) => !protectedIds.has(id))
      .map((id) => ({ id, t: cache[id]?.createdAt ?? 0 }))
      .sort((a, b) => a.t - b.t);
    const toDrop = Math.max(0, ids.length - CARD_CACHE_LIMIT);
    for (let i = 0; i < toDrop && i < droppable.length; i++) {
      delete cache[droppable[i].id];
    }
  }

  const ok = safeWrite(KEYS.cardCache, cache);
  if (!ok) {
    // storage full: drop image data and retry
    cache = getCardCache();
    cache[card.cardId] = { ...card, originalImageDataUrl: undefined };
    return safeWrite(KEYS.cardCache, cache);
  }
  return true;
}

export function deleteCard(cardId: string): boolean {
  const cache = getCardCache();
  delete cache[cardId];
  return safeWrite(KEYS.cardCache, cache);
}

/* ============ review schedule ============ */

type ReviewMap = Record<string, ReviewState>;

/** A freshly-added card is due immediately so it shows up in the first session. */
function freshReviewState(cardId: string, now = Date.now()): ReviewState {
  return { cardId, ease: 2.5, interval: 0, reps: 0, nextReview: now, lastReview: 0 };
}

export function getReviewMap(): ReviewMap {
  return safeParse<ReviewMap>(localStorage.getItem(KEYS.reviewSchedule), {});
}

export function getReviewState(cardId: string): ReviewState | undefined {
  return getReviewMap()[cardId];
}

/** Idempotent: registers a card for review if not already tracked. */
export function registerReview(cardId: string): boolean {
  const map = getReviewMap();
  if (map[cardId]) return true;
  map[cardId] = freshReviewState(cardId);
  return safeWrite(KEYS.reviewSchedule, map);
}

export function unregisterReview(cardId: string): boolean {
  const map = getReviewMap();
  if (!map[cardId]) return true;
  delete map[cardId];
  return safeWrite(KEYS.reviewSchedule, map);
}

export function saveReviewState(state: ReviewState): boolean {
  const map = getReviewMap();
  map[state.cardId] = state;
  return safeWrite(KEYS.reviewSchedule, map);
}

/* ============ misc ============ */

export function getSortPref(): import('../types').SortMode {
  return (localStorage.getItem(KEYS.sortPref) as import('../types').SortMode) || 'recent';
}

export function setSortPref(mode: import('../types').SortMode): void {
  localStorage.setItem(KEYS.sortPref, mode);
}
