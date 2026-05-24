import { useState } from 'react';
import { motion } from 'framer-motion';
import { addFavorite, isFavorited, removeFavorite } from '../lib/storage';
import { useToast } from './Toast';

interface Props {
  cardId: string;
  size?: number;
  onChange?: (favorited: boolean) => void;
  /** when true, render label text next to icon */
  showLabel?: boolean;
}

export function FavoriteButton({ cardId, size = 24, onChange, showLabel = false }: Props) {
  const [favorited, setFavorited] = useState(() => isFavorited(cardId));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  function handle() {
    if (busy) return;
    setBusy(true);
    setTimeout(() => setBusy(false), 300);
    const next = !favorited;
    const ok = next ? addFavorite(cardId) : removeFavorite(cardId);
    if (!ok) {
      toast(next ? '收藏失败，请稍后再试' : '操作失败，请稍后再试', 'error');
      return;
    }
    setFavorited(next);
    onChange?.(next);
    toast(next ? '已加入收藏' : '已取消收藏', 'success');
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={favorited ? '取消收藏' : '收藏'}
      aria-pressed={favorited}
      data-favorited={favorited}
      className="inline-flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      style={{ minWidth: size + 16, minHeight: size + 16 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? 'var(--accent)' : 'none'}
        stroke={favorited ? 'var(--accent)' : 'var(--text-tertiary)'}
        strokeWidth={favorited ? 0 : 2}
        animate={busy ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7-4.35-9-9c-1.5-3.5.5-7 4-7 2.07 0 3.5 1.18 5 3 1.5-1.82 2.93-3 5-3 3.5 0 5.5 3.5 4 7-2 4.65-9 9-9 9z"
        />
      </motion.svg>
      {showLabel && (
        <span className="text-sm font-semibold" style={{ color: favorited ? 'var(--accent)' : 'var(--text-secondary)' }}>
          {favorited ? '已收藏' : '收藏'}
        </span>
      )}
    </button>
  );
}
