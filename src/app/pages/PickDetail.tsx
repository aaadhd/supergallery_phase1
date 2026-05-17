import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { pickStore, usePickSessions, derivePickStatus } from '../utils/pickStore';
import { workStore, useWorkStore } from '../store';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { displayExhibitionTitle } from '../utils/workDisplay';
import type { Work } from '../data';

export default function PickDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const handleBack = () => location.key !== 'default' ? navigate(-1) : navigate('/events?tab=pick');
  usePickSessions(); // subscribe
  useWorkStore();

  const session = useMemo(() => (id ? pickStore.get(id) : null), [id]);
  const allWorks = workStore.getWorks();

  const selectedWorks = useMemo<Work[]>(() => {
    if (!session) return [];
    const map = new Map(allWorks.map((w) => [w.id, w]));
    return (session.selectedWorkIds ?? [])
      .map((wid) => map.get(wid))
      .filter((w): w is Work => w !== undefined);
  }, [session, allWorks]);

  const n = selectedWorks.length;

  // 3x 복제로 무한 루프 구현
  const clonedWorks = useMemo(
    () => (n > 1 ? [...selectedWorks, ...selectedWorks, ...selectedWorks] : selectedWorks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n],
  );

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(n > 1 ? n : 0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isJumping = useRef(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마운트 시 중간 복사본(index n)으로 초기 스크롤
  useEffect(() => {
    if (!carouselRef.current || n <= 1) return;
    const el = carouselRef.current;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const cards = Array.from(el.children) as HTMLElement[];
      const card = cards[n];
      if (card) {
        el.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
        setFocusedIndex(n);
      }
    }));
  }, [n]);

  // 언마운트 시 타이머 정리
  useEffect(() => () => { if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current); }, []);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;

    // 스크롤 중 포커스 인덱스 실시간 업데이트 (시각 피드백용)
    if (!isJumping.current) {
      const center = el.scrollLeft + el.clientWidth / 2;
      const cards = Array.from(el.children) as HTMLElement[];
      let nearest = 0, nearestDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (dist < nearestDist) { nearestDist = dist; nearest = i; }
      });
      setFocusedIndex(nearest);
    }

    // 관성 스크롤이 완전히 멈춘 뒤 텔레포트 — 도중에 개입하면 깨짐
    if (n <= 1) return;
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      const el2 = carouselRef.current;
      if (!el2) return;
      const cards2 = Array.from(el2.children) as HTMLElement[];
      const center2 = el2.scrollLeft + el2.clientWidth / 2;
      let nearest2 = 0, nearestDist2 = Infinity;
      cards2.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center2);
        if (d < nearestDist2) { nearestDist2 = d; nearest2 = i; }
      });

      if (nearest2 < n || nearest2 >= 2 * n) {
        const jumpTarget = nearest2 < n ? nearest2 + n : nearest2 - n;
        const target = cards2[jumpTarget];
        if (!target) return;
        isJumping.current = true;
        el2.style.scrollSnapType = 'none';
        el2.scrollLeft = target.offsetLeft + target.offsetWidth / 2 - el2.clientWidth / 2;
        setFocusedIndex(jumpTarget);
        requestAnimationFrame(() => {
          el2.style.scrollSnapType = '';
          requestAnimationFrame(() => { isJumping.current = false; });
        });
      }
    }, 120);
  }, [n]);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t('pickDetail.notFound')}</p>
        <button type="button" onClick={handleBack} className="text-sm text-primary hover:underline">
          {t('pickDetail.backToEvents')}
        </button>
      </div>
    );
  }

  const status = derivePickStatus(session);
  const isEnded = status === 'ended';

  // 포커스 카드 실제 인덱스 (circular distance 계산용)
  const realFocused = n > 0 ? focusedIndex % n : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background pb-20 md:pb-0" style={{ height: '100dvh' }}>
      {/* 헤더 — 다크 배경 + 골드 광선 + 트로피 */}
      <div
        className="relative overflow-hidden text-center py-6"
        style={{ background: 'linear-gradient(180deg, #000000 0%, #0d0900 60%, #1a1000 100%)' }}
      >
        {/* 골드 광선 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
            style={{ background: 'linear-gradient(180deg,rgba(255,200,0,0.5),transparent)', boxShadow: '0 0 30px 8px rgba(255,200,0,0.12)' }} />
          <div className="absolute top-0 w-px h-4/5"
            style={{ left: '42%', background: 'linear-gradient(180deg,rgba(255,200,0,0.2),transparent)', transform: 'rotate(-12deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-4/5"
            style={{ left: '58%', background: 'linear-gradient(180deg,rgba(255,200,0,0.2),transparent)', transform: 'rotate(12deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-3/5"
            style={{ left: '33%', background: 'linear-gradient(180deg,rgba(255,200,0,0.1),transparent)', transform: 'rotate(-25deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-3/5"
            style={{ left: '67%', background: 'linear-gradient(180deg,rgba(255,200,0,0.1),transparent)', transform: 'rotate(25deg)', transformOrigin: 'top' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10"
            style={{ background: 'radial-gradient(ellipse,rgba(255,200,0,0.15),transparent 70%)' }} />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6">
          {/* 버튼 행 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,200,0,0.2)', color: '#c8a96e' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t('pickDetail.backToEvents')}
            </button>
            <Link
              to="/picks/hall-of-fame"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,200,0,0.2)', color: '#c8a96e' }}
            >
              {t('events.pickHallOfFameCta')}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 트로피 */}
          <div className="text-4xl mb-3" style={{ filter: 'drop-shadow(0 0 12px rgba(255,200,0,0.5))' }}>
            🏆
          </div>

          <p className="text-xs font-semibold tracking-[2.5px] uppercase mb-2" style={{ color: '#b8862f' }}>
            {t('pickDetail.heading')}
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
            {session.title}
          </h1>
          <p className="text-sm" style={{ color: '#a08050' }}>
            {session.startAt} ~ {session.endAt}
            {' · '}
            {t('pickDetail.selectedCount').replace('{n}', String(selectedWorks.length))}
          </p>
          {isEnded && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
              {t('pickDetail.ended')}
            </span>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,0,0.3),transparent)' }} />

      {/* 선정 전시 캐러셀 — flex-1로 남은 화면 전체 차지 */}
      {selectedWorks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ background: '#000' }}>
          <p className="text-sm" style={{ color: '#4a5568' }}>{t('pickDetail.noSelected')}</p>
        </div>
      ) : (
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex-1 min-h-0 flex gap-3 overflow-x-auto items-center"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            background: '#000',
            paddingInline: 'calc((100% - min(58vw, 44vh)) / 2)',
            scrollPaddingInline: 'calc((100% - min(58vw, 44vh)) / 2)',
            paddingTop: '3vh',
            paddingBottom: '12vh',
          }}
        >
          {clonedWorks.map((w, i) => {
            const coverKey = getCoverImage(w.image, w.coverImageIndex);
            const src = imageUrls[coverKey] || coverKey;
            const isGroup = w.primaryExhibitionType === 'group';
            const artistLabel = isGroup
              ? (w.groupName?.trim() || `${w.artist.name} 외`)
              : `${w.artist.name} 작가`;

            // circular distance
            const ri = i % n;
            const rawDist = Math.abs(ri - realFocused);
            const dist = n > 1 ? Math.min(rawDist, n - rawDist) : 0;

            const scale = dist === 0 ? 1.08 : 0.75;
            const opacity = dist === 0 ? 1 : 0.45;
            const isFocused = dist === 0;

            return (
              <button
                key={`${w.id}-${Math.floor(i / n)}`}
                type="button"
                onClick={() => setSelectedWorkId(w.id)}
                className="text-center flex-shrink-0"
                style={{
                  scrollSnapAlign: 'center',
                  width: 'min(58vw, 44vh)',
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'transform 0.35s ease, opacity 0.35s ease',
                }}
              >
                <div
                  className="aspect-square w-full overflow-hidden rounded-2xl mb-2"
                  style={{
                    background: '#161616',
                    border: isFocused ? '1px solid rgba(255,200,0,0.5)' : '1px solid rgba(255,200,0,0.12)',
                    boxShadow: isFocused ? '0 8px 40px rgba(255,200,0,0.15), 0 4px 20px rgba(0,0,0,0.8)' : '0 4px 16px rgba(0,0,0,0.5)',
                  }}
                >
                  <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-bold leading-snug truncate px-1" style={{ color: isFocused ? '#f1f5f9' : '#475569' }}>
                  {displayExhibitionTitle(w, '(제목 없음)')}
                </p>
                <p className="text-xs mt-1 truncate px-1" style={{ color: isFocused ? '#64748b' : '#334155' }}>
                  {artistLabel}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* 전시 상세 모달 — 루프 prev/next */}
      {selectedWorkId && (
        <WorkDetailModal
          workId={selectedWorkId}
          onClose={() => setSelectedWorkId(null)}
          allWorks={selectedWorks}
          onNavigate={(wid) => setSelectedWorkId(wid)}
          loop={selectedWorks.length > 1}
        />
      )}
    </div>
  );
}
