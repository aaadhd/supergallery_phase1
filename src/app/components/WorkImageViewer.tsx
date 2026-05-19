import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { CopyrightProtectedImage } from './work';

export type ViewerImage = {
  src: string;
  title: string;
  artist: { name: string; avatar?: string };
};

export type WorkImageViewerProps = {
  images: ViewerImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function touchDist(touches: React.TouchList | TouchList) {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

export default function WorkImageViewer({
  images,
  initialIndex,
  open,
  onClose,
}: WorkImageViewerProps) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const draggingRef = useRef(false);
  const dragStartRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const lastPinchDist = useRef(0);
  const panTouchRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const lastTapTime = useRef(0);
  const swipeStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((newIdx: number) => {
    setIdx(newIdx);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const isZoomed = scale > 1;
  const hasPrev = idx > 0;
  const hasNext = idx < images.length - 1;
  const current = images[idx];

  useEffect(() => {
    if (!open) { resetView(); setIdx(initialIndex); }
  }, [open, initialIndex, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && !isZoomed && hasPrev) goTo(idx - 1);
      if (e.key === 'ArrowRight' && !isZoomed && hasNext) goTo(idx + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, isZoomed, hasPrev, hasNext, idx, goTo]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { sx, sy, ox, oy } = dragStartRef.current;
      setPos({ x: ox + e.clientX - sx, y: oy + e.clientY - sy });
    };
    const onUp = () => { draggingRef.current = false; setDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !isZoomed) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => clamp(s * (1 - e.deltaY * 0.0015), MIN_SCALE, MAX_SCALE));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [open]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = touchDist(e.touches);
      panTouchRef.current = null;
      swipeStartX.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      panTouchRef.current = { id: t0.identifier, sx: t0.clientX, sy: t0.clientY, ox: pos.x, oy: pos.y };
      if (!isZoomed) swipeStartX.current = t0.clientX;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = touchDist(e.touches);
      if (lastPinchDist.current > 0 && d > 0)
        setScale(s => clamp(s * (d / lastPinchDist.current), MIN_SCALE, MAX_SCALE));
      lastPinchDist.current = d;
      return;
    }
    if (e.touches.length === 1 && panTouchRef.current && isZoomed) {
      const t0 = e.touches[0];
      if (t0.identifier !== panTouchRef.current.id) return;
      const p = panTouchRef.current;
      setPos({ x: p.ox + (t0.clientX - p.sx), y: p.oy + (t0.clientY - p.sy) });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastPinchDist.current = 0;

    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime.current < 280) {
        setScale(s => (Math.abs(s - 1) < 0.1 ? 2 : 1));
        setPos({ x: 0, y: 0 });
        lastTapTime.current = 0;
        swipeStartX.current = null;
        return;
      }
      lastTapTime.current = now;

      if (!isZoomed && swipeStartX.current !== null) {
        const dx = e.changedTouches[0].clientX - swipeStartX.current;
        if (Math.abs(dx) >= 50) {
          if (dx < 0 && hasNext) goTo(idx + 1);
          if (dx > 0 && hasPrev) goTo(idx - 1);
        }
      }
    }
    if (e.touches.length === 0) {
      panTouchRef.current = null;
      swipeStartX.current = null;
    }
  };

  if (!open || !current) return null;

  const transition = dragging ? 'none' : 'transform 0.15s ease-out';

  return (
    <div
      className="fixed inset-0 z-[110] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
    >
      {/* 우상단: ✕ */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
        aria-label={t('viewer.close')}
      >
        <X className="h-5 w-5" />
      </button>


      {/* 이미지 영역 */}
      <div
        ref={containerRef}
        className={`absolute inset-0 flex items-center justify-center overflow-hidden ${isZoomed ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <CopyrightProtectedImage
            src={current.src}
            alt={current.title}
            preventRightClick
            preventDrag
            className="h-dvh w-screen select-none object-contain"
          />
        </div>
      </div>

      {/* 좌측: ‹ 이전 */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => !isZoomed && goTo(idx - 1)}
          className={`absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition ${isZoomed ? 'opacity-20 pointer-events-none' : 'lg:hover:bg-black/70'}`}
          aria-label={t('viewer.prev')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 우측: › 다음 */}
      {hasNext && (
        <button
          type="button"
          onClick={() => !isZoomed && goTo(idx + 1)}
          className={`absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition ${isZoomed ? 'opacity-20 pointer-events-none' : 'lg:hover:bg-black/70'}`}
          aria-label={t('viewer.next')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 좌하단: 아바타 + 작가명 + 작품명 */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {current.artist.avatar && (
            <img
              src={current.artist.avatar}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          )}
          <span className="text-sm text-white/80 drop-shadow">{current.artist.name}</span>
        </div>
        <span className="text-sm font-semibold text-white drop-shadow">{current.title}</span>
      </div>

      {/* 우하단: 줌 컨트롤 그룹 */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={resetView}
          disabled={!isZoomed}
          className={`rounded-2xl bg-black/55 px-3 py-3 text-sm backdrop-blur-sm transition ${isZoomed ? 'text-white lg:hover:bg-black/70' : 'pointer-events-none text-white/30'}`}
          aria-label={t('viewer.fitScreen')}
        >
          {t('viewer.fitScreen')}
        </button>
        <span className={`rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition ${isZoomed ? 'text-white' : 'text-white/30'}`}>
          ×{scale.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={() => setScale(s => clamp(s - ZOOM_STEP, MIN_SCALE, MAX_SCALE))}
          disabled={scale <= MIN_SCALE}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition ${scale <= MIN_SCALE ? 'pointer-events-none text-white/30' : 'text-white lg:hover:bg-black/70'}`}
          aria-label={t('viewer.zoomOut')}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setScale(s => clamp(s + ZOOM_STEP, MIN_SCALE, MAX_SCALE))}
          disabled={scale >= MAX_SCALE}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition ${scale >= MAX_SCALE ? 'pointer-events-none text-white/30' : 'text-white lg:hover:bg-black/70'}`}
          aria-label={t('viewer.zoomIn')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* 하단 중앙: 페이지 표시 (2장 이상일 때) */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-xs text-white/40">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
