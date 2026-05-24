import { DICTIONARY, ALL_WORDS, type DictEntry } from '../mock/dictionary';
import { isApiEnabled, recognizeViaApi } from './api';
import type { RecognizeResult } from '../types';

// ─── Mock fallback ────────────────────────────────────────────────────────────

const SCENARIOS: Array<{ candidates: Array<keyof typeof DICTIONARY | string> }> = [
  { candidates: ['apple', 'banana', 'bread'] },
  { candidates: ['laptop', 'keyboard', 'mouse'] },
  { candidates: ['cup', 'coffee', 'bottle'] },
  { candidates: ['book', 'pen'] },
  { candidates: ['flower'] },
  { candidates: ['chair', 'book', 'laptop'] },
  { candidates: ['cat', 'flower'] },
  { candidates: ['dog'] },
  { candidates: ['phone', 'watch', 'glasses'] },
  { candidates: ['car', 'bicycle', 'tree'] },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function recognizeMock(
  photoDataUrl: string,
  opts?: { signal?: AbortSignal; latencyMs?: number },
): Promise<RecognizeResult> {
  const latency = opts?.latencyMs ?? 900 + Math.random() * 600;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, latency);
    opts?.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

  const sample = photoDataUrl.slice(40, 200);
  const scenario = SCENARIOS[hashString(sample) % SCENARIOS.length];

  if (hashString(sample + 'fail') % 20 === 0) {
    throw new Error('RECOGNIZE_FAILED');
  }

  const candidates = scenario.candidates
    .map((w, idx) => {
      const entry = DICTIONARY[w as string] as DictEntry | undefined;
      if (!entry) return null;
      const confidence = Math.max(0.55, 0.96 - idx * 0.12 - Math.random() * 0.04);
      return {
        word: entry.word,
        meaningZh: entry.meaningZh,
        confidence: Math.round(confidence * 100) / 100,
      };
    })
    .filter((x): x is { word: string; meaningZh: string; confidence: number } => x !== null)
    .slice(0, 3);

  return { candidates, photoDataUrl };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function recognize(
  photoDataUrl: string,
  opts?: { signal?: AbortSignal; latencyMs?: number },
): Promise<RecognizeResult> {
  if (isApiEnabled()) {
    const apiCandidates = await recognizeViaApi(photoDataUrl, opts);
    // Enrich with local dictionary data where available; keep API data otherwise
    const candidates = apiCandidates.map((c) => {
      const dict = DICTIONARY[c.word] as DictEntry | undefined;
      return dict
        ? { word: dict.word, meaningZh: dict.meaningZh, confidence: c.confidence }
        : c;
    });
    if (candidates.length === 0) throw new Error('NO_CANDIDATES');
    return { candidates, photoDataUrl };
  }

  return recognizeMock(photoDataUrl, opts);
}

/** Look up a dictionary entry by word. */
export function lookupWord(word: string): DictEntry | undefined {
  return DICTIONARY[word.toLowerCase()];
}

export { ALL_WORDS, DICTIONARY };
