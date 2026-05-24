import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type CamState = 'requesting' | 'live' | 'error';

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<CamState>('requesting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamState('live');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? '摄像头权限被拒绝，请在浏览器设置中允许后重试'
            : '无法打开摄像头，请确认设备支持';
        setErrorMsg(msg);
        setCamState('error');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onCapture(file);
    }, 'image/jpeg', 0.92);
  }, [onCapture]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000' }}
      role="dialog"
      aria-modal="true"
      aria-label="实时拍照"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <span className="text-white font-semibold text-base">实时拍照</span>
        <button
          type="button"
          onClick={onClose}
          className="text-white opacity-80 hover:opacity-100 transition-opacity text-sm px-3 py-1 rounded-full"
          style={{ border: '1px solid rgba(255,255,255,0.3)' }}
        >
          取消
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {camState === 'requesting' && (
          <div className="text-white text-center">
            <div className="text-4xl mb-3 animate-pulse">📷</div>
            <p className="text-sm opacity-70">正在请求摄像头权限...</p>
          </div>
        )}

        {camState === 'error' && (
          <div className="text-white text-center px-8">
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-sm opacity-80">{errorMsg}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              返回
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: camState === 'live' ? 'block' : 'none' }}
        />

        {/* Aim frame overlay */}
        {camState === 'live' && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: '65%',
              aspectRatio: '1',
              border: '2px solid rgba(255,255,255,0.6)',
              borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            }}
          />
        )}
      </div>

      {/* Shutter */}
      {camState === 'live' && (
        <div className="flex items-center justify-center py-8" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <button
            type="button"
            onClick={handleCapture}
            aria-label="拍照"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'white',
              border: '4px solid rgba(255,255,255,0.5)',
              boxShadow: '0 0 0 6px rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'transform 100ms',
            }}
            onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
            onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          />
        </div>
      )}
    </div>
  );
}
