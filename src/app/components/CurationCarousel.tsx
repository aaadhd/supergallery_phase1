import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CuratedExhibition } from '../utils/curationStore';
import { useI18n } from '../i18n/I18nProvider';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useWorkStore } from '../store';
import { artists as allArtists } from '../data';
import type { Work } from '../data';

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

  const works = useWorkStore().getWorks();
  const worksMap = useMemo(() => new Map<string, Work>(works.map((w) => [w.id, w])), [works]);

  const getArtistNames = useCallback((curation: CuratedExhibition): string[] => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const piece of curation.pieces ?? []) {
      const work = worksMap.get(piece.workId);
      if (!work) continue;
      const artist = allArtists.find((a) => a.id === work.artistId);
      const name = artist?.name ?? (work as Work & { artist?: { name?: string } }).artist?.name ?? '';
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names;
  }, [worksMap]);

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
          {c.bannerOverlay && (() => {
            const artistNames = getArtistNames(c);
            return (
              <>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3) 50%, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 px-7 py-6 pointer-events-none">
                  <div>
                    <p className="text-white font-bold text-2xl sm:text-3xl leading-tight">{c.title}</p>
                    {c.subtitle && (
                      <p className="text-white/65 text-xs sm:text-sm leading-snug mt-0.5">{c.subtitle}</p>
                    )}
                    {(artistNames.length > 0 || (c.startAt && c.endAt)) && (
                      <div className="mt-4 flex flex-col space-y-1">
                        {artistNames.length > 0 && (
                          <p className="text-white/85 text-xs sm:text-sm tracking-wide">{artistNames.join(' · ')}</p>
                        )}
                        {(c.startAt && c.endAt) && (
                          <p className="text-white/90 text-xs sm:text-sm tracking-[2px]">{c.startAt.replace(/-/g, '.')} — {c.endAt.replace(/-/g, '.')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </button>
      ))}

      {showControls && (
        <>
          {/* 데스크톱 전용 hover 화살표 */}
          <button
            type="button"
            aria-label={t('browse.carousel.prev')}
            onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white transition-opacity min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label={t('browse.carousel.next')}
            onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white transition-opacity min-h-[44px]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 우하단 플로팅 컨트롤: 도트 + 구분선 + 정지/플레이 */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center bg-black/40 backdrop-blur-md border border-white/[0.14] rounded-full pl-3 pr-3 py-1.5">
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
            <div className="w-px h-3 bg-white/35 mx-2.5 flex-shrink-0" />
            <button
              type="button"
              aria-label={isPlaying ? t('browse.carousel.pause') : t('browse.carousel.play')}
              onClick={(e) => { e.stopPropagation(); setIsPlaying((p) => !p); }}
              className="flex items-center justify-center text-white bg-transparent border-0 cursor-pointer w-5 h-5 flex-shrink-0"
            >
              {isPlaying ? (
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                  <rect x="2" y="2" width="5" height="12" rx="1"/>
                  <rect x="9" y="2" width="5" height="12" rx="1"/>
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                  <path d="M3 2l10 6-10 6V2z"/>
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
