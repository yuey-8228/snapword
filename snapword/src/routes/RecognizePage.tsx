import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { CameraCapture } from '../components/CameraCapture';
import { useToast } from '../components/Toast';
import { compressImageToDataUrl, isAcceptedFormat } from '../lib/image';
import { recognize } from '../lib/recognize';
import { generateSessionId } from '../lib/ids';
import { saveAnnotateSession } from './AnnotatePage';

type Stage = 'idle' | 'compressing' | 'recognizing' | 'error';

export function RecognizePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFormat(file)) {
        toast('仅支持 JPG / PNG 格式', 'error');
        return;
      }
      try {
        setStage('compressing');
        const fullDataUrl = await compressImageToDataUrl(file);
        setStage('recognizing');
        const result = await recognize(fullDataUrl);
        if (result.candidates.length === 0) {
          throw new Error('NO_CANDIDATES');
        }

        // Store photo + candidates for the annotate page to display
        const sessionId = generateSessionId();
        saveAnnotateSession(sessionId, {
          photoDataUrl: fullDataUrl,
          candidates: result.candidates,
        });
        navigate(`/annotate/${sessionId}`, { replace: true });
      } catch (e: unknown) {
        console.warn('recognize failed', e);
        const message =
          e instanceof DOMException && e.name === 'AbortError'
            ? '识别已取消'
            : '识别失败，请换张图片试试';
        setErrorMsg(message);
        setStage('error');
      }
    },
    [navigate, toast],
  );

  return (
    <div className="min-h-full">
      <PageHeader showBack title="识词" />

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            void handleFile(file);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <main className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-10 stagger">
        {stage === 'idle' && (
          <>
            <h1 className="font-sora text-2xl md:text-3xl font-extrabold text-text mb-2">
              拍照或上传照片识词
            </h1>
            <p className="text-text-secondary mb-6 text-sm md:text-base">
              支持实时拍照或上传 JPG / PNG，长边超过 1920px 会自动压缩。
            </p>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="w-full mb-4 flex items-center justify-center gap-3 font-semibold text-base rounded-[20px] py-4 transition-colors"
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: '2px solid var(--border-strong)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="text-2xl" aria-hidden="true">📷</span>
              实时拍照
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs text-text-tertiary">或</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <label
              htmlFor="upload-input"
              className="dropzone block cursor-pointer"
              data-active={dragOver || undefined}
              style={{
                background: dragOver ? 'var(--surface-hover)' : 'var(--surface)',
                border: dragOver ? '2px solid var(--accent)' : '2px dashed var(--border-hover)',
                borderRadius: 24,
                padding: '40px 24px',
                textAlign: 'center',
                transition: 'background 200ms, border-color 200ms',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              <div className="text-5xl mb-3" aria-hidden="true">🖼️</div>
              <div className="font-semibold text-text mb-1">点击或拖拽图片到这里</div>
              <div className="text-sm text-text-secondary">JPG · PNG · 单张</div>
              <input
                ref={inputRef}
                id="upload-input"
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                    e.target.value = '';
                  }
                }}
              />
            </label>

            <div className="mt-6 text-center">
              <SampleHint onPick={(file) => void handleFile(file)} />
            </div>
          </>
        )}

        {(stage === 'compressing' || stage === 'recognizing') && (
          <div>
            <div className="scan-loader" style={{ height: 280 }} />
            <div className="text-center mt-6">
              <div className="font-sora text-lg font-bold text-text">
                {stage === 'compressing' ? '正在处理图片...' : '正在识别中...'}
              </div>
              <div className="text-text-secondary text-sm mt-1">最多 3 秒，请稍候</div>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div
            className="rounded-[20px] p-6 text-center"
            style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
          >
            <div className="text-5xl mb-3" aria-hidden="true">😿</div>
            <div className="font-sora text-lg font-bold text-text mb-2">{errorMsg || '识别失败'}</div>
            <p className="text-text-secondary text-sm mb-5">可以试着换一张更清晰的照片，或者光线更好的角度。</p>
            <button type="button" className="btn-candy" onClick={() => setStage('idle')}>
              重新选择
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SampleHint({ onPick }: { onPick: (file: File) => void }) {
  async function pickSample(name: string) {
    // Build a synthetic JPEG by drawing the emoji on a canvas — saves bundling sample images.
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 640, 640);
    grad.addColorStop(0, '#FFE0EC');
    grad.addColorStop(1, '#E0F0FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 640);
    ctx.font = '420px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 320, 360);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `sample-${name}.jpg`, { type: 'image/jpeg' });
      onPick(file);
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="text-sm text-text-tertiary">
      或者试试示例：
      <button className="link font-semibold ml-2" style={{ color: 'var(--accent)' }} onClick={() => pickSample('🍎')}>
        🍎 苹果
      </button>
      <button className="link font-semibold ml-3" style={{ color: 'var(--accent-purple)' }} onClick={() => pickSample('💻')}>
        💻 笔记本
      </button>
      <button className="link font-semibold ml-3" style={{ color: 'var(--accent-blue)' }} onClick={() => pickSample('☕️')}>
        ☕️ 咖啡
      </button>
    </div>
  );
}
