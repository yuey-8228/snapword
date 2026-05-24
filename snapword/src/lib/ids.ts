export function generateCardId(word: string): string {
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `card_${cleanWord}_${rand}`;
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
