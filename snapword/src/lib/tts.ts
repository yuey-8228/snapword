let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices) return Promise.resolve(cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      cachedVoices = [];
      resolve([]);
      return;
    }
    const existing = synth.getVoices();
    if (existing.length) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }
    const handler = () => {
      cachedVoices = synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(cachedVoices);
    };
    synth.addEventListener('voiceschanged', handler);
    // Safety timeout
    setTimeout(() => {
      if (!cachedVoices) {
        cachedVoices = synth.getVoices();
        resolve(cachedVoices);
      }
    }, 1000);
  });
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Preference order: en-US > en-GB > en-* > default
  const preferred = ['Samantha', 'Karen', 'Daniel', 'Google US English', 'Microsoft Aria'];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  const enUS = voices.find((v) => v.lang === 'en-US');
  if (enUS) return enUS;
  const enGB = voices.find((v) => v.lang === 'en-GB');
  if (enGB) return enGB;
  return voices.find((v) => v.lang.startsWith('en'));
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export async function speak(text: string): Promise<void> {
  if (!isTtsSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickEnglishVoice(voices);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  synth.speak(utterance);
}

export function cancelSpeech(): void {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}
