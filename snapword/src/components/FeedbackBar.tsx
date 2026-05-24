import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { submitFeedback } from '../lib/feedback';
import { containsSensitive } from '../lib/sensitive';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type Phase = 'idle' | 'editing' | 'submitting' | 'done';

interface Props {
  /** Stable id for this feedback target (e.g. session + candidate index). */
  feedbackId: string;
}

const INPUT_MAX = 20;
const DEBOUNCE_MS = 300;

export function FeedbackBar({ feedbackId }: Props) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('idle');
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [retryDialog, setRetryDialog] = useState<null | (() => void)>(null);
  // Track which button was used so the "done" state can show it
  const [resolved, setResolved] = useState<'correct' | 'incorrect' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track the latest in-flight request so debounce can ignore stale clicks.
  const pendingRef = useRef<number>(0);

  // Reset when target changes
  useEffect(() => {
    setPhase('idle');
    setInput('');
    setInputError(null);
    setResolved(null);
  }, [feedbackId]);

  useEffect(() => {
    if (phase === 'editing') {
      // delay focus until expand animation has started
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const disabled = phase === 'submitting' || phase === 'done';

  async function callApi(result: 'correct' | 'incorrect', userInput: string | null) {
    const reqId = ++pendingRef.current;
    setPhase('submitting');
    try {
      await submitFeedback({ cardId: feedbackId, result, userInput });
      if (reqId !== pendingRef.current) return; // a newer request superseded us
      setResolved(result);
      setPhase('done');
      toast('感谢反馈', 'success');
    } catch {
      if (reqId !== pendingRef.current) return;
      // Restore to whichever phase the user came from so they can retry / edit.
      setPhase(userInput !== null ? 'editing' : 'idle');
      setRetryDialog(() => () => void callApi(result, userInput));
    }
  }

  // 300ms button debounce — ignore clicks while submitting
  const lastClickRef = useRef(0);
  function debounce(): boolean {
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS) return false;
    lastClickRef.current = now;
    return true;
  }

  function handleCorrect() {
    if (disabled || !debounce()) return;
    void callApi('correct', null);
  }

  function handleIncorrectOpen() {
    if (disabled || !debounce()) return;
    setInputError(null);
    setInput('');
    setPhase('editing');
  }

  function handleSkip() {
    if (phase !== 'editing' || !debounce()) return;
    void callApi('incorrect', null);
  }

  function handleSubmit() {
    if (phase !== 'editing' || !debounce()) return;
    const trimmed = input.trim();
    if (!trimmed) {
      setInputError('请输入内容');
      return;
    }
    if (trimmed.length > INPUT_MAX) {
      setInputError(`最多 ${INPUT_MAX} 个字符`);
      return;
    }
    if (containsSensitive(trimmed)) {
      setInputError('输入包含敏感词，请修改后重试');
      return;
    }
    setInputError(null);
    void callApi('incorrect', trimmed);
  }

  return (
    <section
      aria-label="识别结果反馈"
      className="mt-8 rounded-[20px] p-5"
      style={{
        background: 'var(--surface)',
        border: '2px dashed var(--border-hover)',
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-text">识别结果是否正确？</div>
          <div className="text-xs text-text-tertiary mt-0.5">
            {phase === 'done'
              ? '已反馈，感谢你的帮助'
              : '你的反馈将用于改进识别效果'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCorrect}
            disabled={disabled}
            aria-pressed={resolved === 'correct'}
            className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: resolved === 'correct' ? 'var(--accent-green)' : 'var(--surface-alt)',
              color:
                resolved === 'correct'
                  ? 'white'
                  : disabled
                    ? 'var(--text-tertiary)'
                    : 'var(--accent-green)',
              border: `2px solid ${resolved === 'correct' ? 'var(--accent-green)' : 'var(--border)'}`,
              opacity: disabled && resolved !== 'correct' ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span aria-hidden="true">✓</span> 正确
          </button>
          <button
            type="button"
            onClick={handleIncorrectOpen}
            disabled={disabled}
            aria-pressed={resolved === 'incorrect' || phase === 'editing'}
            className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background:
                resolved === 'incorrect'
                  ? 'var(--error)'
                  : phase === 'editing'
                    ? 'var(--surface-hover)'
                    : 'var(--surface-alt)',
              color:
                resolved === 'incorrect'
                  ? 'white'
                  : disabled
                    ? 'var(--text-tertiary)'
                    : 'var(--error)',
              border: `2px solid ${resolved === 'incorrect' ? 'var(--error)' : phase === 'editing' ? 'var(--error)' : 'var(--border)'}`,
              opacity: disabled && resolved !== 'incorrect' ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span aria-hidden="true">✕</span> 不对
          </button>
        </div>
      </div>

      {/* Inline input — animated reveal */}
      <AnimatePresence initial={false}>
        {phase === 'editing' && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <label className="block text-xs text-text-secondary mb-1.5">
              请告诉我们正确的单词（1–{INPUT_MAX} 个字符）
            </label>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                } else if (e.key === 'Escape') {
                  setPhase('idle');
                  setInput('');
                  setInputError(null);
                }
              }}
              maxLength={INPUT_MAX}
              placeholder="请输入正确的单词"
              aria-label="正确的单词"
              aria-invalid={!!inputError}
              className="w-full rounded-[12px] px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: 'var(--surface-alt)',
                border: `2px solid ${inputError ? 'var(--error)' : 'var(--border)'}`,
                color: 'var(--text)',
              }}
            />
            <div className="flex items-center justify-between gap-3 mt-2">
              <div className="text-xs" style={{ color: inputError ? 'var(--error)' : 'var(--text-tertiary)' }}>
                {inputError ?? `${input.length}/${INPUT_MAX}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ color: 'var(--text-secondary)', background: 'var(--surface-alt)', border: '2px solid var(--border)' }}
                >
                  跳过
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full"
                  style={{
                    color: 'white',
                    background: 'var(--accent)',
                    border: '2px solid var(--border-strong)',
                  }}
                >
                  提交
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'submitting' && (
        <div className="mt-3 text-xs text-text-tertiary">提交中…</div>
      )}

      <ConfirmDialog
        open={!!retryDialog}
        title="网络异常"
        desc="反馈提交失败，是否重试？"
        confirmLabel="重试"
        cancelLabel="取消"
        onConfirm={() => {
          const retry = retryDialog;
          setRetryDialog(null);
          retry?.();
        }}
        onCancel={() => setRetryDialog(null)}
      />
    </section>
  );
}
