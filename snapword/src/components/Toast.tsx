import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToastVariant } from '../types';

interface ToastItem {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (text: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    (text, variant = 'default') => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, text, variant }]);
      setTimeout(() => remove(id), 2000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
              className="rounded-[14px] px-4 py-3 bg-surface text-text border-2 border-border shadow-lg font-medium text-sm flex items-center gap-2.5"
              data-variant={t.variant}
              style={{
                borderColor:
                  t.variant === 'success'
                    ? 'var(--accent-green)'
                    : t.variant === 'error'
                      ? 'var(--error)'
                      : undefined,
              }}
            >
              {t.variant === 'success' && <span aria-hidden="true">✓</span>}
              {t.variant === 'error' && <span aria-hidden="true">✕</span>}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Allow non-React modules to throw a toast via a global event (rare; prefer hook)
export function useToastBridge() {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string; variant?: ToastVariant }>).detail;
      toast(detail.text, detail.variant);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, [toast]);
}
