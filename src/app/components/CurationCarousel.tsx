import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CuratedExhibition } from '../utils/curationStore';
import { useI18n } from '../i18n/I18nProvider';
import { ImageWithFallback } from '../components/ImageWithFallback';

type Props = {
  curations: CuratedExhibition[];
};

export function CurationCarousel({ curations }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const total = curations.length;

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % total) + total) % total),
    [total],
  );

  // 3초 자동 전환 — current 또는 isPlaying 변경 시 타이머 재설정
  useEffect(() => {
    if (!isPlaying || total < 2) return;
    const timer = setTimeout(() => goTo(current + 1), 3000);
    return () => clearTimeout(timer);
  }, [current, isPlaying, goTo, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= 50) goTo(current + (delta > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const showControls = total >= 2;

  return (
    <div
      className="relative aspect-[21/9] w-full overflow-hidden rounded-xl group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 슬라이드: 모두 렌더, opacity로 fade 전환 */}
      {curations.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={`absolute inset-0 transition-opacity duration-[450ms] cursor-pointer w-full text-left ${
            i === current ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
          }`}
          onClick={() => navigate(`/curations/${c.id}`)}
        >
          <ImageWithFallback
            src={c.bannerImageUrl}
            alt={c.title}
            className="w-full h-full object-cover"
          />
        </button>
      ))}

      {showControls && (
        <>
          {/* 데스크톱 전용 hover 화살표 */}
          <button
            type="button"
            aria-label={t('browse.carousel.prev')}
            onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label={t('browse.carousel.next')}
            onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 우하단 플로팅 컨트롤: 도트 + 구분선 + 정지/플레이 */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center bg-black/40 backdrop-blur-md border border-white/[0.14] rounded-full px-2.5 py-1.5">
            {curations.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-label={t('browse.carousel.slideN').replace('{n}', String(i + 1))}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`mx-1.5 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                  i === current
                    ? 'w-2.5 h-2.5 bg-transparent border-2 border-white'
                    : 'w-2 h-2 bg-white/40 border-0'
                }`}
              />
            ))}
            <div className="w-px h-3 bg-white/20 mx-1.5 flex-shrink-0" />
            <button
              type="button"
              aria-label={isPlaying ? t('browse.carousel.pause') : t('browse.carousel.play')}
              onClick={(e) => { e.stopPropagation(); setIsPlaying((p) => !p); }}
              className="flex items-center justify-center text-white bg-transparent border-0 cursor-pointer w-5 h-5 flex-shrink-0 p-3 -m-3"
            >
              {isPlaying
                ? <Pause className="w-3 h-3 stroke-white" />
                : <Play className="w-3 h-3 stroke-white" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
