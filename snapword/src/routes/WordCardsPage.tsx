import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { FavoriteButton } from '../components/FavoriteButton';
import { SpeakerButton } from '../components/SpeakerButton';
import { getCard } from '../lib/storage';
import type { WordCard } from '../types';

const CARD_COLORS = ['var(--accent)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-blue)'];

export function WordCardsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const cards: WordCard[] = useMemo(() => {
    if (!sessionId) return [];
    const raw = sessionStorage.getItem(`session:${sessionId}`);
    if (!raw) return [];
    try {
      const ids = JSON.parse(raw) as string[];
      return ids
        .map((id) => getCard(id))
        .filter((c): c is WordCard => Boolean(c));
    } catch {
      return [];
    }
  }, [sessionId]);

  useEffect(() => {
    if (cards.length === 0) {
      // session not found — go home
      navigate('/', { replace: true });
    }
  }, [cards.length, navigate]);

  function scrollToIndex(i: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = scroller.children[i] as HTMLElement | undefined;
    if (target) {
      scroller.scrollTo({ left: target.offsetLeft - scroller.offsetLeft, behavior: 'smooth' });
    }
  }

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const childWidth = (scroller.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1;
    const gapPx = parseFloat(getComputedStyle(scroller).columnGap || '0') || 0;
    const i = Math.round(scroller.scrollLeft / (childWidth + gapPx));
    if (i !== index) setIndex(Math.min(Math.max(0, i), cards.length - 1));
  }

  if (cards.length === 0) return null;

  return (
    <div className="min-h-full pb-12 md:pb-16">
      <PageHeader showBack backTo="/" title="识别结果" />
      <main className="max-w-[1080px] mx-auto px-4 md:px-8 stagger">
        <div className="pt-4 md:pt-6 mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-sora text-xl md:text-2xl font-bold text-text">
              {cards.length === 1 ? '识别到 1 个物品' : `识别到 ${cards.length} 个物品`}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {cards.length > 1 ? '左右滑动查看，全部已加入词卡本' : '已加入词卡本'}
            </p>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto scroll-snap-x no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8 snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {cards.map((card, i) => (
            <WordCardView key={card.cardId} card={card} color={CARD_COLORS[i % CARD_COLORS.length]} />
          ))}
        </div>

        {/* Pagination */}
        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {cards.map((c, i) => (
              <button
                key={c.cardId}
                type="button"
                aria-label={`第 ${i + 1} 张`}
                onClick={() => scrollToIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === index ? 24 : 8,
                  height: 8,
                  background: i === index ? 'var(--accent)' : 'var(--border-hover)',
                }}
              />
            ))}
            <span className="text-xs font-mono text-text-tertiary ml-3">
              {index + 1} / {cards.length}
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link to="/recognize" className="btn-outline">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="4" />
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            </svg>
            再识别一张
          </Link>
          <Link to="/wordbook" className="btn-candy">
            查看词卡本
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}

function WordCardView({ card, color }: { card: WordCard; color: string }) {
  return (
    <motion.article
      className="relative flex-shrink-0 w-[min(86vw,480px)] rounded-[28px] p-6 md:p-8 overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        scrollSnapAlign: 'center',
        ['--card-accent' as string]: color,
      } as React.CSSProperties}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
    >
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: color, opacity: 0.18, filter: 'blur(24px)' }}
      />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1 min-w-0">
          <div className="badge" data-variant="pink" style={{ background: 'rgba(0,0,0,0)', border: `1px solid ${color}`, color }}>
            置信度 {Math.round(card.confidence * 100)}%
          </div>
          <h2 className="font-sora text-4xl md:text-5xl font-extrabold text-text mt-3 break-words">{card.word}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-sm text-text-secondary">{card.phonetic.us}</span>
            <SpeakerButton text={card.word} />
          </div>
        </div>
        <FavoriteButton cardId={card.cardId} size={24} />
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="badge" data-variant="purple">{card.partOfSpeech}</span>
        <span className="text-text-secondary">{card.meaningZh}</span>
      </div>

      <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">例句</div>
        {card.examples.slice(0, 1).map((ex, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-start gap-2">
              <p className="text-text font-medium flex-1">{ex.en}</p>
              <SpeakerButton text={ex.en} size={18} />
            </div>
            <p className="text-sm text-text-secondary">{ex.zh}</p>
          </div>
        ))}
      </div>

      <Link
        to={`/word/${card.cardId}`}
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
        style={{ color }}
      >
        查看详情
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </motion.article>
  );
}
