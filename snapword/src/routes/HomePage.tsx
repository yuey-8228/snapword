import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { CameraCapture } from '../components/CameraCapture';
import { HeroCharacters } from '../components/HeroCharacters';
import { useToast } from '../components/Toast';
import { getFavorites, getWordBook, getCard } from '../lib/storage';
import { getDueCount } from '../lib/review';
import { relativeTime } from '../lib/time';
import { compressImageToDataUrl, isAcceptedFormat } from '../lib/image';
import { generateSessionId } from '../lib/ids';
import { saveAnnotateSession } from './AnnotatePage';

type Stage = 'idle' | 'processing' | 'error';

export function HomePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const uploadRef = useRef<HTMLInputElement>(null);

  const book = useMemo(() => getWordBook(), []);
  const favs = useMemo(() => getFavorites(), []);
  const dueCount = useMemo(() => getDueCount(), []);
  const recent = useMemo(() => {
    return book.cards
      .slice(0, 3)
      .map((c) => ({ entry: c, card: getCard(c.cardId) }))
      .filter((x) => x.card);
  }, [book.cards]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFormat(file)) {
        toast('仅支持 JPG / PNG 格式', 'error');
        return;
      }
      try {
        setStage('processing');
        const fullDataUrl = await compressImageToDataUrl(file, 800, 0.82);
        const sessionId = generateSessionId();
        saveAnnotateSession(sessionId, {
          photoDataUrl: fullDataUrl,
          candidates: [],
        });
        setStage('idle');
        navigate(`/annotate/${sessionId}`, { replace: true });
      } catch {
        setStage('idle');
        toast('图片处理失败，请重试', 'error');
      }
    },
    [navigate, toast],
  );

  return (
    <div className="min-h-full">
      <PageHeader />

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            void handleFile(file);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <input
        ref={uploadRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { void handleFile(file); e.target.value = ''; }
        }}
      />

      <main className="max-w-[1200px] mx-auto px-5 md:px-10 pb-24">

        {/* ── HERO ─────────────────────────────────────────────── */}
        {/* Break out of the 1200px container so mascots can sit near viewport edges */}
        <section
          className="relative pt-20 md:pt-32 pb-32 md:pb-48 min-h-[640px] md:min-h-[760px]"
          style={{
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
            paddingLeft: 'max(2vw, 16px)',
            paddingRight: 'max(2vw, 16px)',
          }}
        >
          <HeroCharacters />

          {/* headline column — stays narrow; characters live in the hero gutters */}
          <div className="relative max-w-[720px] mx-auto text-center px-4" style={{ zIndex: 5 }}>
            <h1
              className="font-display whitespace-nowrap"
              style={{
                fontSize: 'clamp(34px, 5.2vw, 60px)',
                lineHeight: 1.12,
                letterSpacing: '-0.031em',
                fontWeight: 500,
                color: 'var(--charcoal-primary)',
              }}
            >
              拍一张照片，
              <br />
              认识一个 <em style={{ fontStyle: 'italic', color: 'var(--pink-primary)', fontWeight: 500 }}>新单词</em>。
            </h1>
            <p
              className="mt-6 mx-auto"
              style={{
                color: 'var(--graphite)',
                fontSize: 17,
                lineHeight: 1.5,
                letterSpacing: '-0.013em',
                maxWidth: 480,
              }}
            >
              用相机或上传照片，立刻得到英文单词、音标、例句和中文释义。
              像翻一本插画词典，遇见你身边的世界。
            </p>

            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                disabled={stage === 'processing'}
                onClick={() => setCameraOpen(true)}
                className="btn-candy"
                style={{ paddingLeft: 40, paddingRight: 40, minHeight: 52, fontSize: 16 }}
              >
                <span aria-hidden="true">📷</span>
                打开摄像头
              </button>
              <button
                type="button"
                disabled={stage === 'processing'}
                onClick={() => uploadRef.current?.click()}
                className="btn-outline"
                style={{ paddingLeft: 36, paddingRight: 36, minHeight: 52, fontSize: 16 }}
              >
                {stage === 'processing' ? '处理中…' : '从相册选图'}
              </button>
            </div>
            <Link
              to="/recognize"
              className="inline-block mt-5 text-[14px] font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--graphite)' }}
            >
              查看识别流程 →
            </Link>
          </div>
        </section>

        {/* ── REVIEW BANNER ───────────────────────────────────── */}
        {dueCount > 0 && (
          <section className="mb-4 md:mb-6">
            <Link
              to="/review"
              className="surface-card flex items-center gap-4 transition-shadow duration-200 hover:shadow-sm"
              style={{ padding: 24, borderLeft: '4px solid var(--pink-primary)' }}
            >
              <div
                aria-hidden="true"
                className="flex items-center justify-center flex-shrink-0 rounded-2xl"
                style={{ width: 56, height: 56, background: 'rgba(255,45,85,0.1)', fontSize: 28 }}
              >
                🔁
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-display"
                  style={{ fontSize: 21, fontWeight: 500, color: 'var(--charcoal-primary)', letterSpacing: '-0.02em' }}
                >
                  今日复习 <em style={{ fontStyle: 'normal', color: 'var(--pink-primary)' }}>{dueCount}</em> 张词卡
                </div>
                <div className="text-[15px] mt-1" style={{ color: 'var(--graphite)' }}>
                  间隔重复帮你记得更牢 · 点击开始
                </div>
              </div>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--pink-primary)" strokeWidth={2.5} strokeLinecap="round" className="flex-shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </section>
        )}

        {/* ── FEATURE ROW (3-column) ──────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 stagger">
          <FeatureCard
            icon="/elements/feature-wordbook.png"
            title="我的词卡本"
            desc={book.cards.length === 0 ? '还没有词卡' : `${book.cards.length} 张词卡 · 按学习时间倒序`}
            to="/wordbook"
          />
          <FeatureCard
            icon="/elements/feature-favorites.png"
            title="我的收藏"
            desc={favs.length === 0 ? '还没有收藏' : `${favs.length} 张词卡`}
            to="/favorites"
          />
          <FeatureCard
            icon="/elements/feature-try.png"
            title="先来试试看"
            desc="从一张示例图片开始，体验拍照识词的乐趣。"
            to="/recognize"
          />
        </section>

        {/* ── RECENT LEARNED ──────────────────────────────────── */}
        {recent.length > 0 && (
          <section className="mt-20 md:mt-28">
            <div className="flex items-baseline justify-between gap-3 mb-6">
              <h2
                className="font-display"
                style={{
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  lineHeight: 1.09,
                  letterSpacing: '-0.026em',
                  fontWeight: 500,
                  color: 'var(--midnight)',
                }}
              >
                最近 <em style={{ fontStyle: 'italic', color: 'var(--pink-primary)' }}>学过</em>
              </h2>
              <Link to="/wordbook" className="text-sm font-medium" style={{ color: 'var(--graphite)' }}>
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(({ entry, card }) =>
                card ? (
                  <Link
                    key={entry.cardId}
                    to={`/word/${entry.cardId}`}
                    className="surface-card block transition-shadow duration-200 hover:shadow-sm"
                    style={{ padding: 24 }}
                  >
                    <div
                      className="font-display"
                      style={{
                        fontSize: 28,
                        lineHeight: 1.1,
                        letterSpacing: '-0.025em',
                        fontWeight: 500,
                        color: 'var(--charcoal-primary)',
                      }}
                    >
                      {card.word}
                    </div>
                    <div className="font-mono text-xs mt-1" style={{ color: 'var(--ash)' }}>
                      {card.phonetic.us}
                    </div>
                    <div className="text-[15px] mt-3" style={{ color: 'var(--graphite)' }}>
                      {card.meaningZh}
                    </div>
                    <div className="text-xs mt-4" style={{ color: 'var(--ash)' }}>
                      {relativeTime(entry.timestamp)}
                    </div>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        {recent.length === 0 && (
          <section
            className="mt-20 md:mt-28 surface-card-cream text-center"
            style={{ padding: '48px 24px', borderRadius: 'var(--radius-card-lg)' }}
          >
            <div className="flex items-center justify-center mb-4" aria-hidden="true">
              <img
                src="/elements/feature-favorites.png"
                alt=""
                className="select-none pointer-events-none"
                style={{ width: 96, height: 96, objectFit: 'contain' }}
              />
            </div>
            <p style={{ color: 'var(--graphite)', fontSize: 17, lineHeight: 1.5 }}>
              还没有词卡，拍照或上传图片开始你的第一张。
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  to,
}: {
  icon: string;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="surface-card block transition-shadow duration-200 hover:shadow-sm"
      style={{ padding: 28 }}
    >
      <img
        src={icon}
        alt=""
        draggable={false}
        aria-hidden="true"
        className="mb-5 select-none pointer-events-none"
        style={{ width: 84, height: 84, objectFit: 'contain' }}
      />
      <div
        className="font-display"
        style={{
          fontSize: 23,
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          fontWeight: 500,
          color: 'var(--charcoal-primary)',
        }}
      >
        {title}
      </div>
      <div className="text-[15px] mt-2" style={{ color: 'var(--graphite)', lineHeight: 1.47 }}>
        {desc}
      </div>
    </Link>
  );
}
