/**
 * Mock implementation of POST /api/feedback (F-08).
 * The real backend is not part of this milestone — the contract here mirrors the
 * PRD payload so the UI can be wired against a stable shape.
 *
 * Payload: { cardId, result: "correct" | "incorrect", userInput: string | null }
 * Response: 200 on success; rejects with Error('NETWORK') / DOMException AbortError otherwise.
 */

export interface FeedbackPayload {
  cardId: string;
  result: 'correct' | 'incorrect';
  userInput: string | null;
}

const LATENCY_MIN = 220;
const LATENCY_MAX = 480;
// Force-failure hook for manual QA: window.__feedbackForceFail = true
declare global {
  interface Window {
    __feedbackForceFail?: boolean;
  }
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const latency = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  await new Promise((r) => setTimeout(r, latency));

  // ~8% failure rate, or always-fail when the QA hook is set.
  const shouldFail = window.__feedbackForceFail === true || Math.random() < 0.08;
  if (shouldFail) {
    throw new Error('NETWORK');
  }
  // Real impl would `await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(payload) })`.
  console.debug('[feedback] submitted', payload);
}
