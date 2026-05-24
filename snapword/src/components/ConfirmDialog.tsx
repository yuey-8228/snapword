import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  desc?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  desc,
  confirmLabel = '确认',
  cancelLabel = '取消',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative max-w-sm w-full rounded-[20px] p-6 shadow-lg"
            style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
            {desc && <p className="text-sm text-text-secondary mb-5">{desc}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-outline" onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn-candy"
                onClick={onConfirm}
                style={
                  destructive
                    ? { background: 'var(--error)', boxShadow: '0 8px 0 0 #c43232' }
                    : undefined
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
