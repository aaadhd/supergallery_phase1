import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useCuration, type CurationPieceRef } from '../utils/curationStore';
import { useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { CopyrightProtectedImage } from '../components/work/CopyrightProtectedImage';
import { displayPieceTitleAtIndex } from '../utils/workDisplay';
import type { Work } from '../data';

/**
 * USR-CUR-01 기획전 페이지 (Policy §15.1·§15.4).
 * - 작품(piece) 카드 그리드 — 다중 이미지 전시에서도 운영팀이 고른 piece 1장만 노출.
 * - 노출 필터: 검수 승인 + 자동 비공개 아님 (Policy §32.2).
 * - 카드 클릭 → 그 piece가 속한 전시 상세 모달(`/exhibitions/:workId?piece=<pieceId>`).
 * - 진입은 어드민 배너([ADM-BNR-01]) 또는 직접 URL.
 */
type ResolvedPiece = {
  ref: CurationPieceRef;
  work: Work;
  imageUrl: string;
  pieceTitle: string;
};

function resolvePiece(ref: CurationPieceRef, work: Work | undefined, untitledLabel: string): ResolvedPiece | null {
  if (!work) return null;
  if (!isWorkPublic(work)) return null;
  const pieceIds = Array.isArray(work.imagePieceIds) ? work.imagePieceIds : [];
  const idx = pieceIds.indexOf(ref.pieceId);
  if (idx < 0) return null;
  const images = Array.isArray(work.image) ? work.image : [work.image];
  const imageUrl = images[idx];
  if (typeof imageUrl !== 'string' || !imageUrl) return null;
  const pieceTitle = displayPieceTitleAtIndex(work, idx, untitledLabel);
  return { ref, work, imageUrl, pieceTitle };
}

export default function CurationDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { curatedExhibitions } = useCuration();
  const store = useWorkStore();
  const works = store.getWorks();

  const curation = useMemo(() => curatedExhibitions.find((c) => c.id === id), [curatedExhibitions, id]);

  const untitledLabel = t('work.untitled');
  const resolved = useMemo<ResolvedPiece[]>(() => {
    if (!curation) return [];
    const worksMap = new Map<string, Work>(works.map((w) => [w.id, w]));
    const out: ResolvedPiece[] = [];
    for (const ref of curation.pieces) {
      const r = resolvePiece(ref, worksMap.get(ref.workId), untitledLabel);
      if (r) out.push(r);
    }
    return out;
  }, [curation, works, untitledLabel]);

  if (!curation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> {t('common.back')}
        </Link>
        <div className="text-center py-16 text-sm text-muted-foreground">{t('curation.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> {t('common.back')}
      </Link>

      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{curation.title}</h1>
        {curation.subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground">{curation.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {t('curation.pieceCount').replace('{n}', String(resolved.length))}
        </p>
      </header>

      {resolved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          {t('curation.empty')}
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {resolved.map((p) => (
            <li key={`${p.ref.workId}:${p.ref.pieceId}`}>
              <Link
                to={`/exhibitions/${p.ref.workId}?piece=${encodeURIComponent(p.ref.pieceId)}`}
                className="group block rounded-xl overflow-hidden bg-white border border-border/60 hover:border-primary transition-colors"
              >
                <div className="aspect-square bg-muted/40 relative">
                  <CopyrightProtectedImage
                    src={p.imageUrl}
                    alt={p.pieceTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{p.pieceTitle}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.work.artist?.name}</p>
                  {p.work.exhibitionName && p.work.exhibitionName !== p.pieceTitle && (
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                      {t('curation.fromExhibition').replace('{name}', p.work.exhibitionName)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
