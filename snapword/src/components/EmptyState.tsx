import type { ReactNode } from 'react';

interface Props {
  emoji?: string;
  title: string;
  desc?: string;
  cta?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({ emoji = '🌱', title, desc, cta, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: 'var(--surface-alt)' }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        {desc && <p className="text-sm text-text-secondary max-w-xs">{desc}</p>}
      </div>
      {cta && (
        <button type="button" className="btn-candy mt-2" onClick={cta.onClick}>
          {cta.label}
        </button>
      )}
      {children}
    </div>
  );
}
