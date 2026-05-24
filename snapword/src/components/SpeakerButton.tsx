import { useState } from 'react';
import { motion } from 'framer-motion';
import { isTtsSupported, speak } from '../lib/tts';
import { useToast } from './Toast';

interface Props {
  text: string;
  size?: number;
}

export function SpeakerButton({ text, size = 22 }: Props) {
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const supported = isTtsSupported();
  if (!supported) return null;

  async function play() {
    if (busy) return;
    setBusy(true);
    setTimeout(() => setBusy(false), 300);
    try {
      setPlaying(true);
      await speak(text);
      // SpeechSynthesisUtterance events are noisy; just reset after short delay matching avg utterance
      setTimeout(() => setPlaying(false), Math.min(text.length * 80 + 600, 4000));
    } catch {
      setPlaying(false);
      toast('发音失败，请稍后再试', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`播放 ${text}`}
      className="inline-flex items-center justify-center rounded-xl transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      style={{ width: size + 18, height: size + 18, color: playing ? 'var(--accent)' : 'var(--text-secondary)' }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={playing ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, repeat: playing ? Infinity : 0 }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={playing ? 'currentColor' : 'none'} />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </motion.svg>
    </button>
  );
}
