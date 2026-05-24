import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { getWordBook, renameWordBook, getCard } from '../lib/storage';
import { relativeTime } from '../lib/time';
import { containsSensitive } from '../lib/sensitive';
import type { WordBook, WordCard } from '../types';

function sanitizeName(raw: string): string {
  return raw.replace(/[\r\n\t​-‍﻿]/g, '');
}

export function WordBookPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<WordBook>(() => getWordBook());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const cards: Array<{ entry: { cardId: string; timestamp: number }; card: WordCard }> = useMemo(() => {
    return book.cards
      .map((entry) => {
        const card = getCard(entry.cardId);
        return card ? { entry, card } : null;
      })
      .filter((x): x is { entry: { cardId: string; timestamp: number }; card: WordCard } => Boolean(x));
  }, [book.cards]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(book.name);
    setEditing(true);
  }, [book.name]);

  const commit = useCallback(() => {
    const cleaned = sanitizeName(draft).trim();
    if (!cleaned) {
      setEditing(false);
      return;
    }
    if (cleaned.length > 10) {
      // input has maxLength so this only triggers if pasted past it
      toast('名称最多 10 个字符', 'error');
      return;
    }
    if (containsSensitive(cleaned)) {
      toast('名称包含敏感词，请修改后重试', 'error');
      return;
    }
    const ok = renameWordBook(cleaned);
    if (!ok) {
      toast('保存失败，请稍后再试', 'error');
      return;
    }
    setBook({ ...book, name: cleaned });
    setEditing(false);
  }, [draft, book, toast]);

  return (
    <div className="min-h-full pb-12">
      <PageHeader showBack />
      <main className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10 stagger">
        <div className="mb-1">
          <span className="badge" data-variant="purple">
            📚 词卡本
          </span>
        </div>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(sanitizeName(e.target.value))}
            maxLength={10}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="font-sora text-2xl md:text-3xl font-extrabold w-full bg-transparent outline-none border-b-2 px-1 py-1"
            style={{ borderColor: 'var(--accent)', color: 'var(--text)' }}
            aria-label="词卡本名称"
          />
        ) : (
          <h1
            className="font-sora text-2xl md:text-3xl font-extrabold text-text cursor-pointer inline-flex items-center gap-2 group"
            onClick={startEdit}
          >
            {book.name}
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </h1>
        )}
        <p className="text-text-secondary text-sm mt-2">
          {cards.length === 0 ? '还没有词卡' : `${cards.length} 张词卡 · 按学习时间倒序`}
        </p>

        {cards.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              emoji="📷"
              title="还没有学过的词卡"
              desc="去拍一张照片，开始你的英语学习。"
              cta={{ label: '去拍照学单词', onClick: () => navigate('/recognize') }}
            />
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2.5">
            {cards.map(({ entry, card }) => (
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
                      style={{ background: 'var(--surface-alt)' }}
                      aria-hidden="true"
                    >
                      📷
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
