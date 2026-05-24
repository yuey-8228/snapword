import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { FavoriteButton } from '../components/FavoriteButton';
import { SpeakerButton } from '../components/SpeakerButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getCard, saveCard, deleteCard, removeCardFromBook, removeFavorite } from '../lib/storage';
import { generateExample, fallbackExample, isApiEnabled } from '../lib/api';
import type { WordCard } from '../types';

type ExampleState = 'loading' | 'ready' | 'failed';

export function WordDetailPage() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [card, setCard] = useState<WordCard | undefined>(() => (cardId ? getCard(cardId) : undefined));
  const [showImage, setShowImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exampleState, setExampleState] = useState<ExampleState>('ready');
  const [imageView, setImageView] = useState<'anime' | 'original'>('anime');

  const hasAnime = Boolean(card?.animeImageDataUrl);
  // Show the anime version by default when it exists; fall back to the photo otherwise.
  const displayImage =
    hasAnime && imageView === 'anime' ? card!.animeImageDataUrl : card?.originalImageDataUrl;

  useEffect(() => {
    if (!cardId) return;
    setCard(getCard(cardId));
    // The anime image is stylized asynchronously after the card is first saved,
    // so re-read from storage when the window regains focus to pick it up.
    const onFocus = () => setCard(getCard(cardId));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [cardId]);

  // Lazy-load example sentence when the card has none.
  useEffect(() => {
    if (!card || card.examples.length > 0) return;

    let cancelled = false;
    const ac = new AbortController();

    async function load() {
      if (!card) return;
      // No API key configured — go straight to the template.
      if (!isApiEnabled()) {
        const ex = fallbackExample(card.word, card.meaningZh);
        const updated = { ...card, examples: [ex] };
        saveCard(updated);
        if (!cancelled) setCard(updated);
        return;
      }

      setExampleState('loading');
      try {
        const ex = await generateExample(card.word, card.meaningZh, { signal: ac.signal });
        if (cancelled) return;
        const updated = { ...card, examples: [ex] };
        saveCard(updated);
        setCard(updated);
        setExampleState('ready');
      } catch (err) {
        if (cancelled || ac.signal.aborted) return;
        console.error('[generateExample] failed', err);
        setExampleState('failed');
      }
    }

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [card]);

  function retryExample() {
    if (!card) return;
    // Trigger the effect again by re-setting the same reference's examples to [].
    setExampleState('ready');
    setCard({ ...card, examples: [] });
  }

  function useFallback() {
    if (!card) return;
    const ex = fallbackExample(card.word, card.meaningZh);
    const updated = { ...card, examples: [ex] };
    saveCard(updated);
    setCard(updated);
    setExampleState('ready');
  }

  const accent = useMemo(() => {
    if (!card) return 'var(--accent)';
    const palette = ['var(--accent)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-blue)'];
    let h = 0;
    for (let i = 0; i < card.word.length; i++) h = (h * 31 + card.word.charCodeAt(i)) | 0;
    return palette[Math.abs(h) % palette.length];
  }, [card]);

  if (!card) {
    return (
      <div className="min-h-full">
        <PageHeader showBack />
        <main className="max-w-[720px] mx-auto px-4 md:px-8 py-12 text-center">
          <div className="text-5xl mb-3" aria-hidden="true">🔎</div>
          <h1 className="font-sora text-xl font-bold text-text">找不到这张词卡</h1>
          <p className="text-text-secondary text-sm mt-2">它可能已被删除。</p>
          <button className="btn-candy mt-6" onClick={() => navigate('/')}>
            回到首页
          </button>
        </main>
      </div>
    );
  }

  function handleDelete() {
    if (!cardId) return;
    const okBook = removeCardFromBook(cardId);
    const okFav = removeFavorite(cardId);
    const okCard = deleteCard(cardId);
    if (!(okBook && okFav && okCard)) {
      toast('删除失败，请稍后再试', 'error');
      setConfirmDelete(false);
      return;
    }
    setConfirmDelete(false);
    toast('已删除', 'success');
    navigate(-1);
  }

  return (
    <div className="min-h-full pb-12">
      <PageHeader showBack title={card.word} />
      <main className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10 stagger">
        {/* Hero card */}
        <section
          className="relative rounded-[28px] p-6 md:p-10 overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: accent, opacity: 0.16, filter: 'blur(28px)' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="badge" data-variant="purple">{card.partOfSpeech}</span>
                <h1 className="font-sora text-5xl md:text-6xl font-extrabold text-text mt-3 break-words leading-none">
                  {card.word}
                </h1>
              </div>
              <FavoriteButton cardId={card.cardId} size={26} />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className="rounded-[14px] px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: 'var(--surface-alt)' }}
              >
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">美式</div>
                  <div className="font-mono text-sm text-text mt-0.5">{card.phonetic.us}</div>
                </div>
                <SpeakerButton text={card.word} />
              </div>
              <div
                className="rounded-[14px] px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: 'var(--surface-alt)' }}
              >
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">英式</div>
                  <div className="font-mono text-sm text-text mt-0.5">{card.phonetic.uk}</div>
                </div>
                <SpeakerButton text={card.word} />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">中文释义</div>
              <p className="text-lg text-text">{card.meaningZh}</p>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mt-5">
          <h2 className="font-sora text-lg font-bold text-text mb-3">例句</h2>

          {card.examples.length > 0 ? (
            <ul className="space-y-3">
              {card.examples.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-[18px] p-4 md:p-5"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-text font-medium flex-1">{ex.en}</p>
                    <SpeakerButton text={ex.en} size={18} />
                  </div>
                  <p className="text-sm text-text-secondary mt-1.5">{ex.zh}</p>
                </li>
              ))}
            </ul>
          ) : exampleState === 'loading' ? (
            <div
              className="rounded-[18px] p-4 md:p-5 flex items-center gap-3"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                style={{ color: 'var(--graphite)' }}
                aria-hidden="true"
              />
              <p className="text-sm" style={{ color: 'var(--graphite)' }}>
                正在为你生成例句…
              </p>
            </div>
          ) : exampleState === 'failed' ? (
            <div
              className="rounded-[18px] p-4 md:p-5"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--graphite)' }}>
                例句加载失败。
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button type="button" className="btn-outline" style={{ minHeight: 36, fontSize: 13, paddingLeft: 16, paddingRight: 16 }} onClick={retryExample}>
                  重试
                </button>
                <button type="button" className="btn-ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={useFallback}>
                  使用模板例句
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Photo — original, with an anime-stylized version toggle when available */}
        {card.originalImageDataUrl && (
          <section className="mt-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-sora text-lg font-bold text-text">
                {hasAnime ? '配图' : '拍照原图'}
              </h2>
              {hasAnime && (
                <div
                  className="inline-flex p-0.5 rounded-full"
                  style={{ background: 'var(--stone-surface, rgba(0,0,0,0.05))' }}
                  role="tablist"
                  aria-label="切换图片样式"
                >
                  {(['anime', 'original'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={imageView === v}
                      onClick={() => setImageView(v)}
                      className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                      style={
                        imageView === v
                          ? { background: 'var(--surface, #fff)', color: 'var(--charcoal-primary)', boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.08))' }
                          : { color: 'var(--graphite)' }
                      }
                    >
                      {v === 'anime' ? '动漫' : '原图'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowImage(true)}
              className="rounded-[18px] overflow-hidden block w-full focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              style={{ border: '2px solid var(--border)' }}
            >
              <img src={displayImage} alt={card.word} className="w-full h-auto block" />
            </button>
          </section>
        )}

        {/* Delete */}
        <section className="mt-8 flex justify-center">
          <button type="button" className="btn-outline" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--error)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
            从词卡本删除
          </button>
        </section>
      </main>

      <ConfirmDialog
        open={confirmDelete}
        title="删除这张词卡？"
        desc="将从词卡本和收藏中一并移除，此操作不可恢复。"
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <AnimatePresence>
        {showImage && displayImage && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImage(false)}
          >
            <motion.img
              src={displayImage}
              alt={card.word}
              className="max-w-full max-h-full rounded-[16px]"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
            />
            <button
              type="button"
              aria-label="关闭"
              className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
              onClick={() => setShowImage(false)}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
