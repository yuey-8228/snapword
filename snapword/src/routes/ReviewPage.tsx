import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { SpeakerButton } from '../components/SpeakerButton';
import { useToast } from '../components/Toast';
import { getDueCards, gradeCard, nextDueLabel, type DueCard } from '../lib/review';
import { generateQuiz, isApiEnabled, type QuizQuestion } from '../lib/api';
import type { ReviewGrade } from '../types';

const GRADE_BUTTONS: Array<{ grade: ReviewGrade; label: string; color: string }> = [
  { grade: 'forgot', label: '忘记了', color: 'var(--pink-primary)' },
  { grade: 'hard', label: '有点模糊', color: 'var(--accent-yellow)' },
  { grade: 'good', label: '记得', color: 'var(--accent-green)' },
];

export function ReviewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Snapshot the due queue once on mount — grading mutates the schedule, and we
  // don't want already-graded cards to re-enter mid-session.
  const queue = useMemo<DueCard[]>(() => getDueCards(), []);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  // Quiz state for the current card (null = use flip-card fallback).
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const current = queue[pos];

  // Fetch an LLM quiz for the current card when the API is enabled. State for
  // the previous card is cleared by `advance` before `pos` changes, so this
  // effect only ever *sets* quiz state asynchronously (never resets synchronously).
  useEffect(() => {
    if (!current || !isApiEnabled()) return;
    let cancelled = false;
    const controller = new AbortController();
    const otherWords = queue.map((d) => d.card.word);
    generateQuiz(current.card.word, current.card.meaningZh, otherWords, { signal: controller.signal })
      .then((q) => { if (!cancelled) setQuiz(q); })
      .catch(() => { /* fall back to flip-card self-grade */ });
    return () => { cancelled = true; controller.abort(); };
  }, [current, queue]);

  const advance = useCallback(() => {
    setRevealed(false);
    setQuiz(null);
    setPicked(null);
    setPos((p) => p + 1);
  }, []);

  const handleGrade = useCallback(
    (grade: ReviewGrade) => {
      if (!current) return;
      const next = gradeCard(current.card.cardId, grade);
      setDone((d) => d + 1);
      if (next) toast(`下次复习：${nextDueLabel(next.interval)}`, 'success');
      advance();
    },
    [current, advance, toast],
  );

  // Picking a quiz option auto-grades: correct → "good", wrong → "forgot".
  const handlePick = useCallback(
    (option: string) => {
      if (picked || !quiz) return;
      setPicked(option);
      const correct = option.toLowerCase() === quiz.answer.toLowerCase();
      // Brief pause so the learner sees the right/wrong coloring before advancing.
      window.setTimeout(() => handleGrade(correct ? 'good' : 'forgot'), 850);
    },
    [picked, quiz, handleGrade],
  );

  const total = queue.length;
  const finished = pos >= total;

  return (
    <div className="min-h-full">
      <PageHeader showBack backTo="/" title="复习" />

      <main className="max-w-[640px] mx-auto px-5 md:px-8 pb-24 pt-6">
        {total === 0 ? (
          <EmptyReview />
        ) : finished ? (
          <FinishedReview done={done} onHome={() => navigate('/')} />
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--stone-surface)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--pink-primary)' }}
                  animate={{ width: `${(pos / total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--ash)' }}>
                {pos + 1} / {total}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.card.cardId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
              >
                {quiz ? (
                  <QuizCard quiz={quiz} picked={picked} onPick={handlePick} />
                ) : (
                  <FlipCard
                    card={current.card}
                    revealed={revealed}
                    onReveal={() => setRevealed(true)}
                    onGrade={handleGrade}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Flip-card self-grade (offline fallback) ─────────────────────────────────

function FlipCard({
  card,
  revealed,
  onReveal,
  onGrade,
}: {
  card: DueCard['card'];
  revealed: boolean;
  onReveal: () => void;
  onGrade: (g: ReviewGrade) => void;
}) {
  return (
    <div className="surface-card" style={{ padding: 32, borderRadius: 'var(--radius-card-lg)' }}>
      {/* Front: prompt the learner to recall from the Chinese meaning */}
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ash)' }}>
          这个词的英文是？
        </div>
        <div className="font-display" style={{ fontSize: 32, fontWeight: 500, color: 'var(--charcoal-primary)' }}>
          {card.meaningZh}
        </div>
        <div className="text-sm mt-2" style={{ color: 'var(--graphite)' }}>{card.partOfSpeech}</div>
      </div>

      {!revealed ? (
        <button type="button" onClick={onReveal} className="btn-candy w-full mt-8" style={{ minHeight: 52 }}>
          显示答案
        </button>
      ) : (
        <>
          <div className="mt-8 pt-8 text-center" style={{ borderTop: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
            <div className="flex items-center justify-center gap-3">
              <span className="font-display" style={{ fontSize: 40, fontWeight: 600, color: 'var(--pink-primary)' }}>
                {card.word}
              </span>
              <SpeakerButton text={card.word} />
            </div>
            <div className="font-mono text-sm mt-2" style={{ color: 'var(--ash)' }}>{card.phonetic.us}</div>
            {card.examples[0] && (
              <p className="text-[15px] mt-4" style={{ color: 'var(--graphite)' }}>{card.examples[0].en}</p>
            )}
          </div>

          <div className="mt-8">
            <div className="text-xs text-center mb-3" style={{ color: 'var(--ash)' }}>你记得多少？</div>
            <div className="grid grid-cols-3 gap-2.5">
              {GRADE_BUTTONS.map((b) => (
                <button
                  key={b.grade}
                  type="button"
                  onClick={() => onGrade(b.grade)}
                  className="rounded-2xl py-3 text-sm font-medium transition-transform active:scale-95"
                  style={{ border: `1.5px solid ${b.color}`, color: b.color, background: 'transparent' }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── LLM multiple-choice quiz ────────────────────────────────────────────────

function QuizCard({
  quiz,
  picked,
  onPick,
}: {
  quiz: QuizQuestion;
  picked: string | null;
  onPick: (option: string) => void;
}) {
  return (
    <div className="surface-card" style={{ padding: 32, borderRadius: 'var(--radius-card-lg)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ash)' }}>
        {quiz.kind === 'cloze' ? '选出填入空格的词' : '选出对应的英文'}
      </div>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.3, color: 'var(--charcoal-primary)' }}>
        {quiz.prompt}
      </div>

      <div className="mt-7 grid gap-2.5">
        {quiz.options.map((opt) => {
          const isAnswer = opt.toLowerCase() === quiz.answer.toLowerCase();
          const isPicked = picked === opt;
          let style: React.CSSProperties = {
            border: '1.5px solid var(--border, rgba(0,0,0,0.1))',
            color: 'var(--charcoal-primary)',
            background: 'transparent',
          };
          if (picked) {
            if (isAnswer) style = { border: '1.5px solid var(--accent-green)', color: 'var(--accent-green)', background: 'rgba(52,199,89,0.08)' };
            else if (isPicked) style = { border: '1.5px solid var(--pink-primary)', color: 'var(--pink-primary)', background: 'rgba(255,45,85,0.06)' };
            else style = { ...style, opacity: 0.5 };
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={!!picked}
              onClick={() => onPick(opt)}
              className="rounded-2xl px-5 py-4 text-left text-[17px] font-medium transition-all active:scale-[0.99]"
              style={style}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty / finished states ─────────────────────────────────────────────────

function EmptyReview() {
  return (
    <div className="surface-card-cream text-center" style={{ padding: '56px 24px', borderRadius: 'var(--radius-card-lg)' }}>
      <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 500, color: 'var(--midnight)' }}>
        今天没有要复习的词
      </h1>
      <p className="mt-3" style={{ color: 'var(--graphite)', fontSize: 16 }}>
        把词卡加入「我的词卡本」，到期后会出现在这里。
      </p>
      <Link to="/" className="btn-candy inline-flex mt-7" style={{ minHeight: 48, paddingLeft: 28, paddingRight: 28 }}>
        去拍照识词
      </Link>
    </div>
  );
}

function FinishedReview({ done, onHome }: { done: number; onHome: () => void }) {
  return (
    <div className="surface-card-cream text-center" style={{ padding: '56px 24px', borderRadius: 'var(--radius-card-lg)' }}>
      <div className="text-5xl mb-4" aria-hidden="true">✨</div>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 500, color: 'var(--midnight)' }}>
        复习完成
      </h1>
      <p className="mt-3" style={{ color: 'var(--graphite)', fontSize: 16 }}>
        本轮复习了 <em style={{ fontStyle: 'normal', color: 'var(--pink-primary)', fontWeight: 600 }}>{done}</em> 张词卡。
      </p>
      <button type="button" onClick={onHome} className="btn-candy mt-7" style={{ minHeight: 48, paddingLeft: 28, paddingRight: 28 }}>
        回到首页
      </button>
    </div>
  );
}
