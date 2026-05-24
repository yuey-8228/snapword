import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import {
  getCard,
  getFavorites,
  getSortPref,
  setSortPref,
} from '../lib/storage';
import { relativeTime } from '../lib/time';
import type { FavoriteEntry, SortMode, WordCard } from '../types';

interface Item {
  entry: FavoriteEntry;
  card: WordCard;
}

export function FavoritesPage() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortMode>(() => getSortPref());
  const [menuOpen, setMenuOpen] = useState(false);

  const items: Item[] = useMemo(() => {
    const list = getFavorites()
      .map((entry) => {
        const card = getCard(entry.cardId);
        return card ? { entry, card } : null;
      })
      .filter((x): x is Item => Boolean(x));

    if (sort === 'recent') {
      list.sort((a, b) => b.entry.timestamp - a.entry.timestamp);
    } else if (sort === 'oldest') {
      list.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
    } else if (sort === 'alpha') {
      list.sort((a, b) => a.card.word.localeCompare(b.card.word));
    }
    return list;
  }, [sort]);

  function pickSort(next: SortMode) {
    setSort(next);
    setSortPref(next);
    setMenuOpen(false);
  }

  const sortLabel: Record<SortMode, string> = {
    recent: '最近收藏',
    oldest: '最早收藏',
    alpha: '字母顺序',
  };

  return (
    <div className="min-h-full pb-12">
      <PageHeader showBack />
      <main className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10 stagger">
        <div className="mb-1">
          <span className="badge" data-variant="pink">
            💖 收藏
          </span>
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-sora text-2xl md:text-3xl font-extrabold text-text">我的收藏</h1>
            <p className="text-text-secondary text-sm mt-2">
              {items.length === 0 ? '还没有收藏的词卡' : `${items.length} 张词卡`}
            </p>
          </div>
          {items.length > 0 && (
            <div className="relative">
              <button type="button" className="btn-outline" onClick={() => setMenuOpen((v) => !v)}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                </svg>
                {sortLabel[sort]}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                  <ul
                    className="absolute right-0 top-full mt-2 z-[101] min-w-[180px] rounded-[14px] py-2 overflow-hidden"
                    style={{ background: 'var(--surface)', border: '2px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    {(['recent', 'oldest', 'alpha'] as SortMode[]).map((mode) => (
                      <li key={mode}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-surface-hover flex items-center justify-between"
                          onClick={() => pickSort(mode)}
                          style={{ color: sort === mode ? 'var(--accent)' : 'var(--text)' }}
                        >
                          {sortLabel[mode]}
                          {sort === mode && (
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              emoji="💖"
              title="还没有收藏的词卡"
              desc="在词卡或词汇详情页点击爱心来收藏。"
              cta={{ label: '去发现词卡', onClick: () => navigate('/recognize') }}
            />
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2.5">
            {items.map(({ entry, card }) => (
              <li key={entry.cardId}>
                <Link to={`/word/${entry.cardId}`} className="list-item">
                  {card.originalImageDataUrl ? (
                    <img
                      src={card.originalImageDataUrl}
                      alt=""
                      className="w-12 h-12 rounded-[12px] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-[12px] flex-shrink-0 flex items-center justify-center text-xl"
                      style={{ background: 'rgba(255,107,157,0.12)' }}
                      aria-hidden="true"
                    >
                      💖
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sora font-bold text-text truncate">{card.word}</span>
                      <span className="font-mono text-xs text-text-tertiary truncate">{card.phonetic.us}</span>
                    </div>
                    <div className="text-sm text-text-secondary truncate">{card.meaningZh}</div>
                  </div>
                  <div className="text-[11px] text-text-tertiary flex-shrink-0">{relativeTime(entry.timestamp)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
