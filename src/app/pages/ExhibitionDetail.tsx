import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { artists, type Artist, type Work } from '../data';
import { workStore, userInteractionStore } from '../store';
import { imageUrls } from '../imageUrls';
import { getCoverImage } from '../utils/imageHelper';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Button } from '../components/ui/button';
import { displayProminentHeadline } from '../utils/workDisplay';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { hydrateGroupWorks } from '../groupData';

type ExhibitionType = 'solo' | 'group';

type MockExhibitionConfig = {
  id: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  workIds: string[];
  startDate: string;
  endDate: string;
  type: ExhibitionType;
  primaryArtistId: string;
  participantArtistIds?: string[];
  coverKey: string;
};

export const MOCK_EXHIBITION_CONFIG: Record<string, MockExhibitionConfig> = {
  'solo-light': {
    id: 'solo-light',
    titleKey: 'exhibition.soloLightTitle',
    descriptionKey: 'exhibition.soloLightDesc',
    workIds: ['1', '6', '13', '14'],
    startDate: '2026.03.01',
    endDate: '2026.04.15',
    type: 'solo',
    primaryArtistId: '1',
    coverKey: 'window-light',
  },
  'group-nature': {
    id: 'group-nature',
    titleKey: 'exhibition.groupNatureTitle',
    descriptionKey: 'exhibition.groupNatureDesc',
    workIds: ['2', '1', '9', '45', '50', '5'],
    startDate: '2026.02.10',
    endDate: '2026.05.30',
    type: 'group',
    primaryArtistId: '2',
    participantArtistIds: ['2', '1', '4', '9', '10', '5'],
    coverKey: 'wind-texture',
  },
  'solo-ceramic': {
    id: 'solo-ceramic',
    titleKey: 'exhibition.soloCeramicTitle',
    descriptionKey: 'exhibition.soloCeramicDesc',
    workIds: ['45', '46', '47'],
    startDate: '2026.04.01',
    endDate: '2026.06.20',
    type: 'solo',
    primaryArtistId: '9',
    coverKey: 'white-porcelain-moon-jar',
  },
};

/** 기획전용 큐레이션 전시 ID — 동일 경로에서 일반 작품(피드) 딥링크와 구분 */
export function isCuratedExhibitionId(id: string | undefined): boolean {
  return id != null && id in MOCK_EXHIBITION_CONFIG;
}

type ResolvedExhibition = MockExhibitionConfig & {
  title: string;
  description: string;
};

function resolveWorkImageSrc(work: Work): string {
  const key = getCoverImage(work.image, work.coverImageIndex);
  return imageUrls[key] || key;
}

function NotFoundBlock({ title, homeLabel }: { title: string; homeLabel: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-20">
      <p className="text-muted-foreground text-center mb-6">{title}</p>
      <Link to="/" className="text-[15px] font-medium text-primary lg:hover:underline">
        {homeLabel}
      </Link>
    </div>
  );
}

export default function ExhibitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [liked, setLiked] = useState(() => id ? userInteractionStore.isLiked(id) : false);

  const exhibition = useMemo((): ResolvedExhibition | undefined => {
    if (!id) return undefined;
    const raw = MOCK_EXHIBITION_CONFIG[id];
    if (!raw) return undefined;
    return {
      ...raw,
      title: t(raw.titleKey),
      description: t(raw.descriptionKey),
    };
  }, [id, t]);

  const storeWorks = workStore.getWorks();
  const exhibitionWorks = useMemo(() => {
    if (!exhibition) return [];
    return exhibition.workIds
      .map((wid) => storeWorks.find((w) => w.id === wid))
      .filter((w): w is Work => Boolean(w));
  }, [exhibition, storeWorks]);

  const primaryArtist: Artist | undefined = useMemo(() => {
    if (!exhibition) return undefined;
    return artists.find((a) => a.id === exhibition.primaryArtistId);
  }, [exhibition]);

  const participatingArtists: Artist[] = useMemo(() => {
    if (!exhibition) return [];
    if (exhibition.type === 'group' && exhibition.participantArtistIds?.length) {
      return exhibition.participantArtistIds
        .map((aid) => artists.find((a) => a.id === aid))
        .filter((a): a is Artist => Boolean(a));
    }
    if (exhibition.type === 'group') {
      const ids = new Set(exhibitionWorks.map((w) => w.artistId));
      return Array.from(ids)
        .map((aid) => artists.find((a) => a.id === aid))
        .filter((a): a is Artist => Boolean(a));
    }
    return primaryArtist ? [primaryArtist] : [];
  }, [exhibition, exhibitionWorks, primaryArtist]);

  const [detailWorkId, setDetailWorkId] = useState<string | null>(null);

  const relatedIds = useMemo(() => Object.keys(MOCK_EXHIBITION_CONFIG).filter((k) => k !== id), [id]);

  const relatedExhibitions = useMemo(() => {
    return relatedIds
      .map((rid) => {
        const raw = MOCK_EXHIBITION_CONFIG[rid];
        if (!raw) return null;
        return {
          rid,
          type: raw.type,
          startDate: raw.startDate,
          endDate: raw.endDate,
          coverKey: raw.coverKey,
          title: t(raw.titleKey),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [relatedIds, t]);

  const allExhibitionWorksForModal = useMemo(() => {
    const allStoreWorks = workStore.getWorks();
    const allGroupWorks = hydrateGroupWorks(artists);
    const fullWorkPool = [...allStoreWorks, ...allGroupWorks] as Work[];

    const sorted = Object.values(MOCK_EXHIBITION_CONFIG)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const result: Work[] = [];
    for (const ex of sorted) {
      if (ex.id === id) {
        for (const wid of ex.workIds) {
          const found = fullWorkPool.find(w => w.id === wid);
          if (found) result.push(found);
        }
      } else {
        const firstWorkId = ex.workIds[0];
        if (!firstWorkId) continue;
        const found = fullWorkPool.find(w => w.id === firstWorkId);
        if (found) result.push(found);
      }
    }
    return result;
  }, [storeWorks, id]);

  const coverSrc = exhibition ? imageUrls[exhibition.coverKey] || exhibition.coverKey : '';

  // 동적 OG 메타 업데이트 (SPA 클라이언트 측)
  useEffect(() => {
    if (!exhibition || !primaryArtist) return;
    const title = `${exhibition.title} — ${primaryArtist.name} | Artier`;
    document.title = title;
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('og:title', title);
    setMeta('og:description', `${primaryArtist.name}${t('exhibition.ogDesc')}`);
    setMeta('og:image', coverSrc);
    setMeta('og:url', window.location.href);
    return () => { document.title = 'Artier'; };
  }, [exhibition, primaryArtist, coverSrc, t]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: exhibition?.title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success(t('workDetail.toastLinkCopied'));
      } else {
        toast.message(t('exhibition.shareManual'));
      }
    } catch {
      toast.message(t('exhibition.shareFail'));
    }
  };

  const toggleLike = () => {
    if (!id) return;
    userInteractionStore.toggleLike(id);
    const nowLiked = userInteractionStore.isLiked(id);
    setLiked(nowLiked);
    if (!nowLiked) {
      toast(t('browse.unliked'), {
        action: { label: t('browse.undo'), onClick: () => { userInteractionStore.toggleLike(id); setLiked(true); } },
        duration: 3000,
      });
    } else {
      toast.success(t('exhibition.likeAdded'));
    }
  };

  if (!exhibition || !primaryArtist) {
    return <NotFoundBlock title={t('exhibition.notFound')} homeLabel={t('exhibition.home')} />;
  }

  const typeLabel = exhibition.type === 'solo' ? t('exhibition.solo') : t('exhibition.group');
  const primarySub = exhibition.type === 'solo' ? t('exhibition.repArtist') : t('exhibition.hostArtist');

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
        <div className="relative aspect-[21/9] min-h-[200px] sm:min-h-[280px] w-full overflow-hidden rounded-none sm:rounded-xl border border-border/40 bg-muted/50 mt-4 sm:mt-8">
          <ImageWithFallback
            src={coverSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <p className="text-[13px] font-medium text-primary mb-2">{typeLabel}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {exhibition.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={`/profile/${primaryArtist.id}`}
                className="flex items-center gap-3 group"
              >
                <ImageWithFallback
                  src={primaryArtist.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-border/40"
                />
                <div>
                  <p className="text-[15px] font-medium text-foreground lg:group-hover:text-primary transition-colors">
                    {primaryArtist.name}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{primarySub}</p>
                </div>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              {exhibition.startDate} — {exhibition.endDate}
            </p>

            <p className="text-[15px] leading-relaxed text-foreground max-w-2xl whitespace-pre-line">
              {exhibition.description}
            </p>

            {exhibition.type === 'group' && participatingArtists.length > 0 && (
              <div className="pt-4 border-t border-border/40">
                <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground mb-4">
                  {t('exhibition.participantsHeading')}
                </h2>
                <ul className="flex flex-wrap gap-3">
                  {participatingArtists.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`/profile/${a.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border/40 pl-1 pr-3 py-1 lg:hover:border-primary/40 transition-colors bg-white"
                      >
                        <ImageWithFallback
                          src={a.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-foreground">{a.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-row sm:flex-col gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={toggleLike}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                liked
                  ? 'border-primary bg-primary/5 text-primary lg:hover:bg-primary/10 lg:hover:text-primary'
                  : 'border-border/40 lg:hover:border-border'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} aria-hidden />
              {t('workDetail.like')}
            </Button>
            <Button variant="ghost"
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/40 px-4 py-2.5 text-sm font-medium text-foreground lg:hover:border-border transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {t('workDetail.share')}
            </Button>
          </div>
        </div>

        <section className="mt-16 sm:mt-20">
          <h2 className="text-lg font-semibold text-foreground mb-8">{t('exhibition.worksHeading')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[1.625rem] sm:gap-[2.6rem]">
            {exhibitionWorks.map((work) => (
              <button
                key={work.id}
                type="button"
                onClick={() => setDetailWorkId(work.id)}
                className="text-left group"
              >
                <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/30 mb-3">
                  <ImageWithFallback
                    src={resolveWorkImageSrc(work)}
                    alt=""
                    className="w-full h-full object-contain object-center transition-transform duration-300 lg:group-hover:scale-[1.02]"
                  />
                </div>
                <p className="text-sm font-medium text-foreground lg:group-hover:text-primary transition-colors line-clamp-2">
                  {displayProminentHeadline(work, t('work.untitled'))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{work.artist.name}</p>
              </button>
            ))}
          </div>
        </section>

        {relatedExhibitions.length > 0 && (
          <section className="mt-20 sm:mt-24 pt-12 border-t border-border/40">
            <h2 className="text-lg font-semibold text-foreground mb-8">{t('exhibition.otherHeading')}</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {relatedExhibitions.map((ex) => {
                const thumb = imageUrls[ex.coverKey] || ex.coverKey;
                const relType = ex.type === 'solo' ? t('exhibition.solo') : t('exhibition.group');
                return (
                  <li key={ex.rid}>
                    <Link
                      to={`/exhibitions/${ex.rid}`}
                      className="flex gap-4 p-4 rounded-xl border border-border/40 lg:hover:border-border transition-colors bg-white"
                    >
                      <div className="flex w-24 h-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                        <ImageWithFallback src={thumb} alt="" className="w-full h-full object-contain object-center" />
                      </div>
                      <div className="min-w-0 py-0.5">
                        <p className="text-[13px] text-primary mb-1">{relType}</p>
                        <p className="font-medium text-foreground line-clamp-2">{ex.title}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {ex.startDate} — {ex.endDate}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {detailWorkId && (
        <WorkDetailModal
          workId={detailWorkId}
          onClose={() => setDetailWorkId(null)}
          onNavigate={(wid) => setDetailWorkId(wid)}
          allWorks={allExhibitionWorksForModal}
        />
      )}
    </div>
  );
}
