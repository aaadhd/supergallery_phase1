import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Plus, Minus, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export type DeepZoomViewerProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

function clampScale(v: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));
}

function touchDistance(touches: React.TouchList | TouchList) {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export default function DeepZoomViewer({ src, alt, open, onClose }: DeepZoomViewerProps) {
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const lastPinchDist = useRef(0);
  const panTouchRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) {
      resetView();
    }
  }, [open, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { sx, sy, ox, oy } = dragStartRef.current;
      setPos({ x: ox + e.clientX - sx, y: oy + e.clientY - sy });
    };
    const onUp = () => {
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale(s => clampScale(s * (1 + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setScale(s => (Math.abs(s - 1) < 0.08 ? 2 : 1));
    setPos({ x: 0, y: 0 });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = touchDistance(e.touches);
      panTouchRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      panTouchRef.current = {
        id: t.identifier,
        sx: t.clientX,
        sy: t.clientY,
        ox: pos.x,
        oy: pos.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = touchDistance(e.touches);
      const prev = lastPinchDist.current;
      if (prev > 0 && d > 0) {
        setScale(s => clampScale(s * (d / prev)));
      }
      lastPinchDist.current = d;
      return;
    }
    if (e.touches.length === 1 && panTouchRef.current) {
      const t = e.touches[0];
      if (t.identifier !== panTouchRef.current.id) return;
      const p = panTouchRef.current;
      setPos({
        x: p.ox + (t.clientX - p.sx),
        y: p.oy + (t.clientY - p.sy),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastPinchDist.current = 0;
    }
    if (e.touches.length === 0) {
      panTouchRef.current = null;
    } else if (panTouchRef.current) {
      const still = Array.from(e.touches).some(t => t.identifier === panTouchRef.current!.id);
      if (!still) panTouchRef.current = null;
    }
  };

  if (!open) return null;

  const transitionStyle = dragging ? 'none' : 'transform 0.2s ease-out';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute right-3 top-3 z-[110] flex flex-wrap items-center justify-end gap-2 sm:right-4 sm:top-4">
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          ×{scale.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={() => setScale(s => clampScale(s - ZOOM_STEP))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={t('deepZoom.zoomOut')}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setScale(s => clampScale(s + ZOOM_STEP))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={t('deepZoom.zoomIn')}
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={t('deepZoom.fit')}
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={t('deepZoom.close')}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative flex flex-1 cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className="flex max-h-full max-w-full items-center justify-center"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: transitionStyle,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-[100dvh] max-w-[100vw] select-none object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}
