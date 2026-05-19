import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useCuration, type CurationPieceRef } from '../utils/curationStore';
import { useWorkStore } from '../store';
import { artists as allArtists } from '../data';
import { isWorkPublic } from '../utils/workVisibility';
import { CopyrightProtectedImage } from '../components/work/CopyrightProtectedImage';
import { displayPieceTitleAtIndex } from '../utils/workDisplay';
import { imageUrls } from '../imageUrls';
import type { Work } from '../data';

type ResolvedPiece = {
  ref: CurationPieceRef;
  work: Work;
  imageUrl: string;
  pieceTitle: string;
  artistName: string;
};

function resolvePiece(ref: CurationPieceRef, work: Work | undefined, untitledLabel: string): ResolvedPiece | null {
  if (!work) return null;
  if (!isWorkPublic(work)) return null;
  const pieceIds = Array.isArray(work.imagePieceIds) ? work.imagePieceIds : [];
  const idx = pieceIds.indexOf(ref.pieceId);
  if (idx < 0) return null;
  const images = Array.isArray(work.image) ? work.image : [work.image];
  const rawUrl = images[idx];
  if (typeof rawUrl !== 'string' || !rawUrl) return null;
  const imageUrl = imageUrls[rawUrl] || rawUrl;
  const pieceTitle = displayPieceTitleAtIndex(work, idx, untitledLabel);
  const artistName = work.artist?.name ?? '';
  return { ref, work, imageUrl, pieceTitle, artistName };
}

export default function CurationDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const handleClose = () => location.key !== 'default' ? navigate(-1) : navigate('/?tab=curation');

  const { curatedExhibitions } = useCuration();
  const store = useWorkStore();
  const works = store.getWorks();

  const curation = useMemo(() => curatedExhibitions.find((c) => c.id === id), [curatedExhibitions, id]);

  const untitledLabel = t('work.untitled');
  const pieces = useMemo<ResolvedPiece[]>(() => {
    if (!curation) return [];
    const worksMap = new Map<string, Work>(works.map((w) => [w.id, w]));
    return curation.pieces
      .map((ref) => resolvePiece(ref, worksMap.get(ref.workId), untitledLabel))
      .filter((p): p is ResolvedPiece => p !== null);
  }, [curation, works, untitledLabel]);

  const bannerArtistNames = useMemo((): string[] => {
    if (!curation) return [];
    const worksMap = new Map<string, Work>(works.map((w) => [w.id, w]));
    const seen = new Set<string>();
    const names: string[] = [];
    for (const piece of curation.pieces ?? []) {
      const work = worksMap.get(piece.workId);
      if (!work) continue;
      const artist = allArtists.find((a) => a.id === work.artistId);
      const name = artist?.name ?? work.artist?.name ?? '';
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names;
  }, [curation, works]);

  if (!curation) {
    return (
      <div className="flex flex-col items-center justify-center bg-background" style={{ minHeight: '100dvh' }}>
        <p className="text-sm text-muted-foreground mb-4">{t('curation.notFound')}</p>
        <button type="button" onClick={handleClose} className="text-sm text-primary hover:underline min-h-[44px]">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f2]" style={{ minHeight: '100dvh' }}>
      {/* X 버튼 */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="닫기"
        className="fixed top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-opacity hover:opacity-80"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 배너: bannerImageUrl 있으면 21:9 이미지, 없으면 기존 텍스트 헤더 폴백 */}
      {curation.bannerImageUrl ? (
        <>
          <div className="relative w-full aspect-[21/9]">
            <img
              src={curation.bannerImageUrl}
              alt={curation.title}
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
            />
            {curation.bannerOverlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/[0.06] to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 px-6 py-5 pointer-events-none">
                  <p className="text-white font-bold text-2xl leading-tight mb-0.5">{curation.title}</p>
                  {curation.subtitle && (
                    <p className="text-white/55 text-xs leading-snug">{curation.subtitle}</p>
                  )}
                  {(bannerArtistNames.length > 0 || (curation.startAt && curation.endAt)) && (
                    <p className="text-white/40 text-[11px] tracking-wide mt-2">
                      {[
                        bannerArtistNames.length > 0 ? bannerArtistNames.join(' · ') : null,
                        (curation.startAt && curation.endAt) ? `${curation.startAt.replace(/-/g, '.')} — ${curation.endAt.replace(/-/g, '.')}` : null,
                      ].filter(Boolean).join('  ·  ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center py-12">
            <div className="w-12 h-px bg-neutral-300" />
          </div>
        </>
      ) : (
        <header className="mx-auto max-w-3xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 text-center">
          {(curation.startAt && curation.endAt) && (
            <p className="text-xs tracking-[3px] uppercase text-neutral-400 mb-5">
              {curation.startAt.replace(/-/g, '.')} — {curation.endAt.replace(/-/g, '.')}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight mb-5">
            {curation.title}
          </h1>
          {curation.subtitle && (
            <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto">
              {curation.subtitle}
            </p>
          )}
          <div className="mt-10 w-12 h-px bg-neutral-300 mx-auto" />
        </header>
      )}

      {/* 작품 목록 */}
      <div className="pb-24">
        {pieces.map((p, idx) => {
          // 3가지 레이아웃 패턴으로 리듬감 생성
          // 0: 이미지 크게 중앙 + 멘트 하단 중앙
          // 1: 이미지 좌 + 멘트 우 (side-by-side)
          // 2: 이미지 우 + 멘트 좌 (side-by-side 반전)
          const pattern = idx % 3;

          const imageEl = (
            <div className="flex justify-center">
              <CopyrightProtectedImage
                src={p.imageUrl}
                alt={p.pieceTitle}
                className="rounded-sm shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
                style={{ maxHeight: '65vh', maxWidth: '100%', width: 'auto', height: 'auto', display: 'block' }}
                loading="lazy"
              />
            </div>
          );

          const noteEl = p.ref.curatorNote ? (
            <div className="flex gap-3 items-start">
              <span
                className="shrink-0 leading-none select-none"
                style={{ fontSize: '3.5rem', lineHeight: 0.75, color: '#d4c9b8', fontFamily: 'Georgia, serif' }}
                aria-hidden
              >
                "
              </span>
              <div className="pt-1.5">
                <p
                  className="text-[15px] leading-[1.95] text-neutral-500"
                  style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontStyle: 'italic' }}
                >
                  {p.ref.curatorNote}
                </p>
                <p className="mt-4 text-[10px] tracking-[2.5px] text-neutral-300 uppercase">Curator's Note</p>
              </div>
            </div>
          ) : null;

          const labelEl = (
            <div className={pattern === 0 ? 'text-center' : ''}>
              <p className="text-base font-semibold text-neutral-800 leading-snug">{p.pieceTitle}</p>
              <p className="text-sm text-neutral-400 mt-1">{p.artistName}</p>
            </div>
          );

          return (
            <section
              key={`${p.ref.workId}:${p.ref.pieceId}`}
              className="mb-28 sm:mb-36"
            >
              {/* 작품 번호 */}
              <p className="text-[10px] tracking-[3px] uppercase text-neutral-300 mb-8 text-center">
                {String(idx + 1).padStart(2, '0')}
              </p>

              {pattern === 0 && (
                /* 패턴 0: 이미지 크게 중앙, 멘트 하단 중앙 */
                <div className="mx-auto max-w-4xl px-6 sm:px-10">
                  {imageEl}
                  <div className="mt-6 text-center">
                    {labelEl}
                  </div>
                  {noteEl && (
                    <div className="mt-10 mx-auto max-w-lg">
                      {noteEl}
                    </div>
                  )}
                </div>
              )}

              {pattern === 1 && (
                /* 패턴 1: 좌 이미지 + 우 멘트 */
                <div className="mx-auto max-w-5xl px-6 sm:px-10">
                  <div className="flex flex-col sm:flex-row gap-10 sm:gap-14 items-start">
                    <div className="w-full sm:w-1/2 shrink-0">
                      {imageEl}
                      <div className="mt-5">{labelEl}</div>
                    </div>
                    {noteEl && (
                      <div className="w-full sm:w-1/2 sm:pt-16">
                        {noteEl}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pattern === 2 && (
                /* 패턴 2: 우 이미지 + 좌 멘트 */
                <div className="mx-auto max-w-5xl px-6 sm:px-10">
                  <div className="flex flex-col sm:flex-row-reverse gap-10 sm:gap-14 items-start">
                    <div className="w-full sm:w-1/2 shrink-0">
                      {imageEl}
                      <div className="mt-5">{labelEl}</div>
                    </div>
                    {noteEl && (
                      <div className="w-full sm:w-1/2 sm:pt-16">
                        {noteEl}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {pieces.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-20">{t('curation.empty')}</p>
        )}
      </div>
    </div>
  );
}
