export interface WordCard {
  cardId: string;
  word: string;
  phonetic: { us: string; uk: string };
  partOfSpeech: string;
  meaningZh: string;
  examples: Array<{ en: string; zh: string }>;
  confidence: number;
  originalImageDataUrl?: string;
  /** Anime-styled version of the photo, set asynchronously after card creation */
  animeImageDataUrl?: string;
  createdAt: number;
}

export interface FavoriteEntry {
  cardId: string;
  timestamp: number;
}

/** Spaced-repetition state for a single card (SM-2 variant). */
export interface ReviewState {
  cardId: string;
  /** Ease factor, SM-2 default 2.5; clamped to >= 1.3. */
  ease: number;
  /** Current inter-review interval, in days. */
  interval: number;
  /** Consecutive correct recalls. */
  reps: number;
  /** Timestamp (ms) when the card is next due. */
  nextReview: number;
  /** Timestamp (ms) of the last graded review, 0 if never reviewed. */
  lastReview: number;
}

/** User self-assessment after seeing a card's answer. */
export type ReviewGrade = 'forgot' | 'hard' | 'good';

export interface WordBookEntry {
  cardId: string;
  timestamp: number;
}

export interface WordBook {
  name: string;
  cards: WordBookEntry[];
}

/** Bounding box as fractions of image width/height (0–1) */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RecognizeCandidate {
  word: string;
  meaningZh: string;
  confidence: number;
  bbox?: BBox;
}

export interface RecognizeResult {
  candidates: RecognizeCandidate[];
  /** dataURL of compressed photo for storing in detail page */
  photoDataUrl: string;
}

export type SortMode = 'recent' | 'oldest' | 'alpha';

export type ToastVariant = 'default' | 'success' | 'error';
