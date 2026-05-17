import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* 헤더 — 다크 배경 + 골드 광선 + 트로피 */}
      <div
        className="relative overflow-hidden text-center py-12 px-4"
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

        <div className="relative">
          {/* 뒤로가기 */}
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 top-0 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {t('pickDetail.backToEvents')}
          </button>

          {/* 트로피 */}
          <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(255,200,0,0.5))' }}>
            🏆
          </div>

          <p className="text-xs font-semibold tracking-[2.5px] uppercase mb-3" style={{ color: '#b8862f' }}>
            {t('pickDetail.heading')}
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
            {session.title}
          </h1>
          <p className="text-sm" style={{ color: '#4a3f2a' }}>
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

      {/* 선정 전시 캐러셀 */}
      <div className="py-8" style={{ background: '#000' }}>
        {selectedWorks.length === 0 ? (
          <p className="text-center text-sm py-16" style={{ color: '#4a5568' }}>{t('pickDetail.noSelected')}</p>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              paddingInline: 'max(12vw, 24px)',
              scrollPaddingInline: 'max(12vw, 24px)',
            }}
          >
            {selectedWorks.map((w) => {
              const coverKey = getCoverImage(w.image, w.coverImageIndex);
              const src = imageUrls[coverKey] || coverKey;
              const isGroup = w.primaryExhibitionType === 'group';
              const artistLabel = isGroup
                ? (w.groupName?.trim() || `${w.artist.name} 외`)
                : `${w.artist.name} 작가`;

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkId(w.id)}
                  className="text-center flex-shrink-0 transition-transform duration-300 lg:hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    scrollSnapAlign: 'center',
                    width: 'clamp(200px, 62vw, 300px)',
                  }}
                >
                  <div
                    className="aspect-square w-full overflow-hidden rounded-2xl mb-3"
                    style={{
                      background: '#161616',
                      border: '1px solid rgba(255,200,0,0.25)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    }}
                  >
                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm font-bold text-slate-100 leading-snug truncate px-1">
                    {displayExhibitionTitle(w, '(제목 없음)')}
                  </p>
                  <p className="text-xs mt-1 truncate px-1" style={{ color: '#64748b' }}>
                    {artistLabel}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 명예의 전당 CTA */}
      <div className="px-4 py-6 mx-auto max-w-xl">
        <Link
          to="/picks/hall-of-fame"
          className="flex items-center justify-between px-4 py-4 rounded-xl transition-colors lg:hover:opacity-80"
          style={{ border: '1px solid rgba(255,200,0,0.2)', background: 'rgba(255,200,0,0.04)' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: '#ffd700' }}>{t('events.pickHallOfFameCta')}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4a5568' }}>{t('events.pickHallOfFameCtaDesc')}</p>
          </div>
          <span className="text-sm" style={{ color: '#b8862f' }}>→</span>
        </Link>
      </div>

      {/* 전시 상세 모달 */}
      {selectedWorkId && (
        <WorkDetailModal
          workId={selectedWorkId}
          onClose={() => setSelectedWorkId(null)}
        />
      )}
    </div>
  );
}
