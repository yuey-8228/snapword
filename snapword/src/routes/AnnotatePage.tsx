import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { FeedbackBar } from '../components/FeedbackBar';
import { useToast } from '../components/Toast';
import { isApiEnabled, recognizeViaApi, stylizeImage } from '../lib/api';
import { lookupWord } from '../lib/recognize';
import { generateCardId } from '../lib/ids';
import { compressDataUrl } from '../lib/image';
import { saveCard, addCardToBook, getCard } from '../lib/storage';
import type { WordCard } from '../types';
import type { RecognizeCandidate } from '../types';

interface AnnotateSession {
  photoDataUrl: string;
  candidates: RecognizeCandidate[];
}

const SESSION_PREFIX = 'annotate:';

export function saveAnnotateSession(sessionId: string, data: AnnotateSession) {
  // Clear old annotate sessions before saving to avoid QuotaExceededError
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(SESSION_PREFIX) || key.startsWith('session:')) {
      sessionStorage.removeItem(key);
    }
  }
  sessionStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data));
}

export function AnnotatePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<AnnotateSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<RecognizeCandidate[]>([]);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  // word → the actual cardId we stored it under. generateCardId is random, so
  // we must remember the real id here rather than recompute it in handleDone.
  const [savedCardIds, setSavedCardIds] = useState<Record<string, string>>({});
  const [savingWord, setSavingWord] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
    if (!raw) { navigate('/', { replace: true }); return; }
    try {
      const parsed = JSON.parse(raw) as AnnotateSession;
      setSession(parsed);
    } catch { navigate('/', { replace: true }); }
  }, [sessionId, navigate]);

  // Trigger API recognition once session loads
  useEffect(() => {
    if (!session) return;
    if (!isApiEnabled()) {
      setCandidates(session.candidates);
      return;
    }
    let cancelled = false;
    setLoading(true);
    recognizeViaApi(session.photoDataUrl)
      .then((results) => { if (!cancelled) setCandidates(results); })
      .catch((err) => {
        if (cancelled) return;
        console.error('[AnnotatePage] recognize error:', err);
        toast('识别失败，请重试', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-text-secondary text-sm">加载中…</div>
      </div>
    );
  }

  const { photoDataUrl } = session;

  // Compute rendered image rect accounting for object-fit:contain letterbox
  function getImageRenderRect(): { offsetX: number; offsetY: number; renderedW: number; renderedH: number } | null {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return null;
    const r = img.getBoundingClientRect();
    const containerW = r.width;
    const containerH = r.height;
    const naturalAR = img.naturalWidth / img.naturalHeight;
    const containerAR = containerW / containerH;
    let renderedW: number, renderedH: number;
    if (naturalAR > containerAR) {
      renderedW = containerW; renderedH = containerW / naturalAR;
    } else {
      renderedH = containerH; renderedW = containerH * naturalAR;
    }
    return {
      offsetX: (containerW - renderedW) / 2,
      offsetY: (containerH - renderedH) / 2,
      renderedW,
      renderedH,
    };
  }

  async function handleSave(candidate: RecognizeCandidate) {
    if (savedWords.has(candidate.word) || savingWord) return;
    setSavingWord(candidate.word);
    try {
      const dict = lookupWord(candidate.word);
      const cardId = generateCardId(candidate.word);

      let animePromise: Promise<string> | null = null;
      if (isApiEnabled()) {
        animePromise = stylizeImage(photoDataUrl).catch(() => '');
      }

      const card: WordCard = {
        cardId,
        word: dict?.word ?? candidate.word,
        phonetic: dict?.phonetic ?? { us: '', uk: '' },
        partOfSpeech: dict?.partOfSpeech ?? 'n.',
        meaningZh: dict?.meaningZh ?? candidate.meaningZh,
        examples: dict?.examples ?? [],
        confidence: candidate.confidence,
        originalImageDataUrl: photoDataUrl,
        createdAt: Date.now(),
      };

      saveCard(card);
      addCardToBook(cardId);
      setSavedWords((prev) => new Set([...prev, candidate.word]));
      setSavedCardIds((prev) => ({ ...prev, [candidate.word]: cardId }));
      toast(`已保存「${card.word}」`, 'success');

      if (animePromise) {
        animePromise.then(async (animeUrl) => {
          if (!animeUrl) return;
          // Shrink the (often large PNG) result so it fits in LocalStorage,
          // and merge onto the latest stored card so we don't clobber a
          // back-filled example sentence written meanwhile.
          let stored = animeUrl;
          try { stored = await compressDataUrl(animeUrl); } catch { /* store as-is */ }
          const latest = getCard(cardId) ?? card;
          saveCard({ ...latest, animeImageDataUrl: stored });
        });
      }
    } catch {
      toast('保存失败，请重试', 'error');
    } finally {
      setSavingWord(null);
    }
  }

  function handleDone() {
    if (savedWords.size === 0) { navigate('/', { replace: true }); return; }
    const sessionId2 = `done-${Date.now()}`;
    // Use the real cardIds recorded at save time — recomputing would yield new
    // random ids the card cache doesn't know about, sending /cards back home.
    const cardIds = [...savedWords].map((w) => savedCardIds[w]).filter(Boolean);
    sessionStorage.setItem(`session:${sessionId2}`, JSON.stringify(cardIds));
    navigate(`/cards/${sessionId2}`, { replace: true });
  }

  const renderRect = imgLoaded ? getImageRenderRect() : null;

  return (
    <div className="min-h-full">
      <PageHeader showBack backTo="/" title="识别物品" />
      <main className="max-w-[720px] mx-auto px-4 md:px-8 py-6">

        {/* Image area with bbox overlays */}
        <div
          className="relative rounded-[20px] overflow-hidden select-none"
          style={{
            border: '2px solid var(--border)',
            background: '#000',
          }}
        >
          <img
            ref={imgRef}
            src={photoDataUrl}
            alt="识别图片"
            className="w-full block"
            style={{ maxHeight: '65vh', objectFit: 'contain' }}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
          />

          {/* Bbox overlays — rendered after image loads */}
          {renderRect && candidates.map((c) => {
            if (!c.bbox) return null;
            const { offsetX, offsetY, renderedW, renderedH } = renderRect;
            const left = offsetX + c.bbox.x * renderedW;
            const top = offsetY + c.bbox.y * renderedH;
            const width = c.bbox.w * renderedW;
            const height = c.bbox.h * renderedH;
            const isHovered = hoveredWord === c.word;
            const isSaved = savedWords.has(c.word);

            return (
              <div
                key={c.word}
                className="absolute pointer-events-none transition-all duration-200"
                style={{
                  left,
                  top,
                  width,
                  height,
                  border: `2px solid ${isSaved ? '#22c55e' : isHovered ? 'white' : 'var(--accent)'}`,
                  borderRadius: 8,
                  boxShadow: isHovered ? '0 0 0 1px rgba(255,255,255,0.4)' : undefined,
                  background: isHovered ? 'rgba(255,255,255,0.08)' : undefined,
                }}
              >
                <div
                  className="absolute top-1.5 left-1.5 px-2 py-0.5 text-xs font-bold rounded-md whitespace-nowrap"
                  style={{
                    background: isSaved ? '#22c55e' : isHovered ? 'white' : 'var(--accent)',
                    color: isSaved || isHovered ? '#111' : 'white',
                    maxWidth: 'calc(100% - 8px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isSaved ? '✓ ' : ''}{c.word}
                </div>
              </div>
            );
          })}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
              <div className="px-5 py-3 rounded-full text-sm font-semibold" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>
                识别中…
              </div>
            </div>
          )}
        </div>

        {/* Candidate cards */}
        {!loading && candidates.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-text-secondary text-sm">识别到 {candidates.length} 个物品，点击卡片保存为词卡：</p>
            <div className="flex flex-col gap-3">
              {candidates.map((c) => {
                const isSaved = savedWords.has(c.word);
                const isSaving = savingWord === c.word;
                const dict = lookupWord(c.word);

                return (
                  <div
                    key={c.word}
                    onMouseEnter={() => setHoveredWord(c.word)}
                    onMouseLeave={() => setHoveredWord(null)}
                    onClick={() => !isSaved && !isSaving && void handleSave(c)}
                    className="flex items-center gap-4 rounded-[16px] p-4 transition-all duration-150"
                    style={{
                      background: isSaved ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
                      border: `2px solid ${isSaved ? '#22c55e' : hoveredWord === c.word ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: 'var(--shadow-sm)',
                      cursor: isSaved ? 'default' : 'pointer',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-sora text-lg font-bold text-text">{c.word}</div>
                      <div className="text-sm text-text-secondary">{dict?.meaningZh ?? c.meaningZh}</div>
                      {dict?.phonetic?.us && (
                        <div className="text-xs text-text-tertiary font-mono mt-0.5">{dict.phonetic.us}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs text-text-tertiary">
                        {Math.round(c.confidence * 100)}%
                      </div>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all"
                        style={{
                          background: isSaved ? '#22c55e' : 'var(--accent)',
                          color: 'white',
                        }}
                      >
                        {isSaving ? '…' : isSaved ? '✓' : '+'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && candidates.length === 0 && (
          <div className="mt-6 text-center text-text-secondary text-sm py-4">
            未识别到物品，请换一张图片试试
          </div>
        )}

        {/* Feedback (F-08): only show after recognition has produced candidates */}
        {!loading && candidates.length > 0 && sessionId && (
          <FeedbackBar feedbackId={sessionId} />
        )}

        {/* Bottom bar */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm text-text-secondary">
            已保存 {savedWords.size} 个单词
          </span>
          <button type="button" onClick={handleDone} className="btn-candy">
            {savedWords.size > 0 ? '查看词卡' : '返回首页'}
          </button>
        </div>
      </main>
    </div>
  );
}
