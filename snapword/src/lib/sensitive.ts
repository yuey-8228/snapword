/** Tiny demo sensitive-word list — shared by word-book rename and feedback input. */
export const SENSITIVE_WORDS = ['admin', 'fuck', 'shit'];

export function containsSensitive(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSITIVE_WORDS.some((w) => lower.includes(w));
}
