import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { workStore, useWorkStore } from '../store';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { displayExhibitionTitle } from '../utils/workDisplay';

export default function PickHallOfFame() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const handleBack = () => location.key !== 'default' ? navigate(-1) : navigate('/events?tab=pick');
  useWorkStore();

  const honoredWorks = useMemo(
    () => workStore.getWorks().filter((w) => w.pickBadge === true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workStore.getWorks().length],
  );

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* 헤더 */}
      <div
        className="relative overflow-hidden text-center py-10 px-4"
        style={{ background: 'linear-gradient(180deg,#0a0600 0%,#080808 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
            style={{ background: 'linear-gradient(180deg,rgba(255,200,0,0.35),transparent)' }} />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-0 top-0 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {t('hallOfFame.back')}
          </button>
          <h1
            className="text-2xl font-black mb-2"
            style={{
              background: 'linear-gradient(90deg,#b8862f,#ffd700,#e8c04a,#ffd700,#b8862f)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('hallOfFame.title')}
          </h1>
          <p className="text-xs" style={{ color: '#4a3f2a' }}>{t('hallOfFame.subtitle')}</p>
          {honoredWorks.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#4a3f2a' }}>
              {t('hallOfFame.total').replace('{n}', String(honoredWorks.length))}
            </p>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,0,0.3),transparent)' }} />

      {/* 갤러리 그리드 */}
      <div
        className="min-h-[60vh] px-3 py-6"
        style={{ background: '#0d0d0d' }}
      >
        {honoredWorks.length === 0 ? (
          <div className="flex items-center justify-center h-60">
            <p className="text-sm text-center" style={{ color: '#4a5568' }}>
              {t('hallOfFame.empty')}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2">
            {honoredWorks.map((w) => {
              const coverKey = getCoverImage(w.image, w.coverImageIndex);
              const src = imageUrls[coverKey] || coverKey;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkId(w.id)}
                  className="text-left rounded-lg overflow-hidden transition-transform lg:hover:scale-[1.03]"
                  style={{ border: '1px solid rgba(255,200,0,0.12)' }}
                >
                  <div className="aspect-square overflow-hidden" style={{ background: '#161616' }}>
                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2 py-1.5" style={{ background: '#111' }}>
                    <p className="text-[10px] font-medium truncate" style={{ color: '#9ca3af' }}>
                      {displayExhibitionTitle(w, '(제목 없음)')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedWorkId && (
        <WorkDetailModal
          workId={selectedWorkId}
          onClose={() => setSelectedWorkId(null)}
        />
      )}
    </div>
  );
}
