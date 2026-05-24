/**
 * Vision recognition + image stylization via OpenRouter.
 * - Recognition: google/gemini-2.5-flash-preview  (best accuracy + speed)
 * - Stylization:  openai/gpt-image-2  (anime style transfer)
 *
 * Set VITE_OPENROUTER_API_KEY in .env.local to activate.
 */

import type { RecognizeCandidate } from '../types';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const BASE_URL = 'https://openrouter.ai/api/v1';

export function isApiEnabled(): boolean {
  return !!API_KEY && API_KEY.length > 10;
}

function headers() {
  return {
    'content-type': 'application/json',
    'authorization': `Bearer ${API_KEY}`,
    'http-referer': window.location.origin,
    'x-title': 'SnapWord',
  };
}

// ─── Recognition ─────────────────────────────────────────────────────────────

const RECOGNIZE_SYSTEM = `You are a vocabulary-learning assistant. Analyze the photo and identify the most prominent foreground objects.

Rules:
- Return AT MOST 3 objects, sorted by visual prominence (largest area / most central first).
- Only include clear foreground subjects — things intentionally placed, held, or centered.
- EXCLUDE backgrounds: tables, floors, walls, sky, shelves, any surface an object rests on.
- Each object must be distinct (no overlapping boxes).

For each object, compute a tight bounding box:
  x = left edge as fraction of image width  (0.0–1.0)
  y = top edge as fraction of image height  (0.0–1.0)
  w = object width as fraction of image width
  h = object height as fraction of image height
  Verify center point (x+w/2, y+h/2) falls inside the object. Keep ≤3% padding.

Reply ONLY with a valid JSON array — no markdown, no explanation:
[
  {
    "word": "<English noun, lowercase>",
    "meaningZh": "<2-4 Chinese characters>",
    "confidence": <0.0-1.0>,
    "bbox": { "x": <0.0-1.0>, "y": <0.0-1.0>, "w": <0.0-1.0>, "h": <0.0-1.0> }
  }
]`;

export async function recognizeViaApi(
  photoDataUrl: string,
  opts?: { signal?: AbortSignal },
): Promise<RecognizeCandidate[]> {
  const base64 = photoDataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid image data');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: opts?.signal,
    headers: headers(),
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: RECOGNIZE_SYSTEM + '\n\nIdentify objects in this image.' },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Recognize API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  console.debug('[recognizeViaApi] raw response:', raw);

  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch { throw new Error('API returned invalid JSON: ' + jsonStr.slice(0, 100)); }
  if (!Array.isArray(parsed)) throw new Error('API response is not an array');

  return (parsed as Array<Record<string, unknown>>)
    .map((item) => {
      const bboxRaw = item.bbox as Record<string, unknown> | undefined;
      const bbox = bboxRaw
        ? {
            x: Math.min(1, Math.max(0, Number(bboxRaw.x ?? 0))),
            y: Math.min(1, Math.max(0, Number(bboxRaw.y ?? 0))),
            w: Math.min(1, Math.max(0, Number(bboxRaw.w ?? 0))),
            h: Math.min(1, Math.max(0, Number(bboxRaw.h ?? 0))),
          }
        : undefined;
      return {
        word: String(item.word ?? '').toLowerCase().trim(),
        meaningZh: String(item.meaningZh ?? ''),
        confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.8))),
        bbox,
      };
    })
    .filter((c) => c.word.length > 0)
    .slice(0, 3);
}

// ─── Point-based identification ──────────────────────────────────────────────

/**
 * Ask the model what object is at the given normalized coordinate (cx, cy)
 * in the image. cx/cy are fractions of image width/height (0–1).
 * Returns a single candidate, or throws.
 */
export async function identifyAtPoint(
  photoDataUrl: string,
  cx: number,
  cy: number,
  opts?: { signal?: AbortSignal },
): Promise<{ word: string; meaningZh: string; confidence: number }> {
  const base64 = photoDataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid image data');

  const prompt =
    `The user tapped the image at position x=${cx.toFixed(3)}, y=${cy.toFixed(3)} ` +
    `(fractions of image width/height, origin top-left). ` +
    `What single foreground object is located at or very near that point? ` +
    `Reply ONLY with JSON (no markdown): ` +
    `{"word":"<English noun, lowercase>","meaningZh":"<2-4 Chinese characters>","confidence":<0-1>}. ` +
    `If no identifiable foreground object is near that point, return {"word":"","meaningZh":"","confidence":0}.`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: opts?.signal,
    headers: headers(),
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`IdentifyAtPoint API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  console.debug('[identifyAtPoint] raw response:', raw);

  // Strip markdown fences and extract the first JSON object or array
  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const jsonMatch = cleaned.match(/(\{[\s\S]*?\}|\[[\s\S]*?\])/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch { throw new Error('API returned invalid JSON: ' + jsonStr.slice(0, 100)); }

  // Handle both object and array responses
  const item = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown> | undefined;
  if (!item) throw new Error('NO_OBJECT');

  const word = String(item.word ?? '').toLowerCase().trim();
  if (!word) throw new Error('NO_OBJECT');

  return {
    word,
    meaningZh: String(item.meaningZh ?? ''),
    confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.9))),
  };
}

// ─── Example sentence generation ─────────────────────────────────────────────

/** Last-resort template example, used when the API is disabled or fails. */
export function fallbackExample(word: string, meaningZh: string): { en: string; zh: string } {
  return {
    en: `This is a ${word}.`,
    zh: `我喜欢这个${meaningZh || word}。`,
  };
}

/**
 * Generate a single contextual example sentence for a word.
 *
 * The model picks its own difficulty and adds a small scene/context to the
 * sentence — not a bare textbook example. Returns { en, zh }.
 */
export async function generateExample(
  word: string,
  meaningZh: string,
  opts?: { signal?: AbortSignal },
): Promise<{ en: string; zh: string }> {
  const prompt =
    `Write ONE natural English example sentence for the word "${word}" (Chinese: ${meaningZh}).\n\n` +
    `Requirements:\n` +
    `- The sentence should have light context — a small scene, situation, or scenario — not just a textbook example.\n` +
    `- Keep it natural and idiomatic, the way a real English speaker would say it.\n` +
    `- Pick whatever difficulty level you think is most useful for a learner.\n` +
    `- Then provide a fluent Chinese translation of that sentence.\n\n` +
    `Reply ONLY with JSON (no markdown, no extra text):\n` +
    `{"en":"<the English sentence>","zh":"<Chinese translation>"}`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: opts?.signal,
    headers: headers(),
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`GenerateExample API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  console.debug('[generateExample] raw response:', raw);

  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch { throw new Error('API returned invalid JSON: ' + jsonStr.slice(0, 100)); }

  const item = parsed as Record<string, unknown>;
  const en = String(item.en ?? '').trim();
  const zh = String(item.zh ?? '').trim();
  if (!en || !zh) throw new Error('Empty example fields');

  return { en, zh };
}

// ─── Review quiz generation ──────────────────────────────────────────────────

export interface QuizQuestion {
  /** The prompt shown to the learner (Chinese meaning, or a sentence with a blank). */
  prompt: string;
  /** Quiz style: pick the English word for a meaning, or fill the blank in a sentence. */
  kind: 'meaning' | 'cloze';
  /** Answer options (English words); exactly one is correct. */
  options: string[];
  /** The correct option (always the card's own word). */
  answer: string;
}

/**
 * Generate one multiple-choice review question for a word, using a few other
 * known words as distractors. Returns a QuizQuestion, or throws so the caller
 * can fall back to plain flip-card self-grading.
 */
export async function generateQuiz(
  word: string,
  meaningZh: string,
  distractors: string[],
  opts?: { signal?: AbortSignal },
): Promise<QuizQuestion> {
  const pool = distractors.filter((d) => d.toLowerCase() !== word.toLowerCase()).slice(0, 8);

  const prompt =
    `Create ONE multiple-choice English vocabulary review question for the word "${word}" ` +
    `(Chinese meaning: ${meaningZh}).\n\n` +
    `Pick ONE of two styles:\n` +
    `- "meaning": the prompt is the Chinese meaning, the learner picks the matching English word.\n` +
    `- "cloze": the prompt is a natural English sentence with the target word replaced by "____", ` +
    `the learner picks the word that fills the blank.\n\n` +
    `Build 4 options total: the correct answer "${word}" plus 3 plausible English-word distractors. ` +
    (pool.length >= 3
      ? `Prefer drawing distractors from this list when they fit: ${pool.join(', ')}.\n`
      : `Invent plausible same-part-of-speech distractors.\n`) +
    `Shuffle the options. Reply ONLY with JSON (no markdown):\n` +
    `{"kind":"meaning"|"cloze","prompt":"<text>","options":["<w1>","<w2>","<w3>","<w4>"],"answer":"${word}"}`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: opts?.signal,
    headers: headers(),
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`GenerateQuiz API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  console.debug('[generateQuiz] raw response:', raw);

  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  let parsed: unknown;
  try { parsed = JSON.parse(jsonStr); } catch { throw new Error('Quiz API returned invalid JSON: ' + jsonStr.slice(0, 100)); }

  const item = parsed as Record<string, unknown>;
  const kind = item.kind === 'cloze' ? 'cloze' : 'meaning';
  const promptText = String(item.prompt ?? '').trim();
  const rawOptions = Array.isArray(item.options) ? item.options.map((o) => String(o).trim()) : [];

  // Guarantee correctness invariants the model might violate.
  const options = Array.from(new Set(rawOptions.filter(Boolean)));
  if (!options.some((o) => o.toLowerCase() === word.toLowerCase())) options.unshift(word);
  if (!promptText || options.length < 2) throw new Error('Quiz missing prompt or options');

  return {
    kind,
    prompt: promptText,
    options: options.slice(0, 4),
    answer: word,
  };
}

// ─── Anime stylization ────────────────────────────────────────────────────────

/**
 * Stylize a photo into an anime/cartoon illustration.
 *
 * OpenRouter has no OpenAI-style `/images/edits` endpoint — image-to-image runs
 * through `/chat/completions` with `modalities: ["image","text"]` on an
 * image-capable model, which returns the result in `message.images`.
 * Returns a base64 data URL, or throws on failure.
 */
export async function stylizeImage(
  photoDataUrl: string,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  const base64 = photoDataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid image data');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: opts?.signal,
    headers: headers(),
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      modalities: ['image', 'text'],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            {
              type: 'text',
              text:
                'Convert this photo into a clean anime / cartoon illustration. ' +
                'Keep the same composition and objects. Colorful, soft cel-shading, clean outlines.',
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Stylize API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { images?: Array<{ image_url?: { url?: string }; url?: string }> } }>;
  };
  const images = data.choices?.[0]?.message?.images ?? [];
  const first = images[0];
  // The image URL is already a `data:image/...;base64,...` URL ready to store.
  const url = first?.image_url?.url ?? first?.url;
  if (!url) throw new Error('No image in stylize response');
  return url;
}
