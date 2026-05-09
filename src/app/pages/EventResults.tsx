import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { eventsStore, isPublicationVisible, useManagedEvents } from '../utils/eventsStore';
import { useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { CopyrightProtectedImage } from '../components/work/CopyrightProtectedImage';
import { displayPieceTitleAtIndex, displayExhibitionTitle } from '../utils/workDisplay';
import type { Work } from '../data';

/**
 * USR-EVT-05 응모전 선정작 발표 페이지 (Policy §15.5).
 * - 응모작은 USR-EVT-04 응모 모달로 발행된 1장짜리 전시 → 작품 단위 = 전시 단위 일치.
 * - 노출 조건: 응모전 publicationOpen + 선정작 + publishedAt 도달 + 각 작품 검수 승인 + 비공개 아님.
 * - 트리거: USR-EVT-02 "선정작 발표 보기" CTA / 어드민 발표 배너 / 직접 URL.
 */

type ResolvedSelected = {
  work: Work;
  imageUrl: string;
  pieceTitle: string;
};

export default function EventResults() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  useManagedEvents(); // subscribe — 변동 시 갱신
  const store = useWorkStore();
  const works = store.getWorks();

  const ev = useMemo(() => (id ? eventsStore.get(id) : null), [id]);
  const visible = ev ? isPublicationVisible(ev) : false;

  const untitledLabel = t('work.untitled');
  const resolved = useMemo<ResolvedSelected[]>(() => {
    if (!ev) return [];
    const ids = ev.selectedWorkIds ?? [];
    const worksMap = new Map<string, Work>(works.map((w) => [w.id, w]));
    const out: ResolvedSelected[] = [];
    for (const wid of ids) {
      const w = worksMap.get(wid);
      if (!w || !isWorkPublic(w)) continue;
      const images = Array.isArray(w.image) ? w.image : [w.image];
      const imageUrl = images[0];
      if (typeof imageUrl !== 'string' || !imageUrl) continue;
      const pieceTitle = displayPieceTitleAtIndex(w, 0, untitledLabel);
      out.push({ work: w, imageUrl, pieceTitle });
    }
    return out;
  }, [ev, works, untitledLabel]);

  if (!ev) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> {t('common.back')}
        </Link>
        <div className="text-center py-16 text-sm text-muted-foreground">{t('events.resultsNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <Link to={`/events/${ev.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> {ev.title}
      </Link>

      <header className="mb-6 sm:mb-8">
        <p className="text-xs text-muted-foreground mb-2">{t('events.resultsHeaderLabel')}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t('events.resultsHeading').replace('{event}', ev.title)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('events.resultsEndedAt').replace('{date}', ev.endAt)}
          {ev.publishedAt && (
            <>
              <span className="mx-1.5">·</span>
              {t('events.resultsPublishedAt').replace('{date}', ev.publishedAt)}
            </>
          )}
          <span className="mx-1.5">·</span>
          {t('events.resultsCount').replace('{n}', String(resolved.length))}
        </p>
      </header>

      {!visible ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          {t('events.resultsNotPublished')}
        </div>
      ) : resolved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          {t('events.resultsEmpty')}
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {resolved.map((r) => (
            <li key={r.work.id}>
              <Link
                to={`/exhibitions/${r.work.id}`}
                className="group block rounded-xl overflow-hidden bg-white border border-border/60 hover:border-primary transition-colors"
              >
                <div className="aspect-square bg-muted/40 relative">
                  <CopyrightProtectedImage
                    src={r.imageUrl}
                    alt={r.pieceTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{r.pieceTitle}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.work.artist?.name}</p>
                  {r.work.exhibitionName && r.work.exhibitionName !== r.pieceTitle && (
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                      {displayExhibitionTitle(r.work, untitledLabel)}
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
