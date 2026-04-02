import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Share2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { works, artists, type Artist, type Work } from '../data';
import { imageUrls } from '../imageUrls';
import { getFirstImage } from '../utils/imageHelper';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

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

const MOCK_EXHIBITION_CONFIG: Record<string, MockExhibitionConfig> = {
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

type ResolvedExhibition = MockExhibitionConfig & {
  title: string;
  description: string;
};

function resolveWorkImageSrc(work: Work): string {
  const key = getFirstImage(work.image);
  return imageUrls[key] || key;
}

function NotFoundBlock({ title, homeLabel }: { title: string; homeLabel: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-20">
      <p className="text-[#52525B] text-center mb-6">{title}</p>
      <Link to="/" className="text-[15px] font-medium text-[#6366F1] hover:underline">
        {homeLabel}
      </Link>
    </div>
  );
}

export default function ExhibitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [liked, setLiked] = useState(false);

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

  const exhibitionWorks = useMemo(() => {
    if (!exhibition) return [];
    return exhibition.workIds
      .map((wid) => works.find((w) => w.id === wid))
      .filter((w): w is Work => Boolean(w));
  }, [exhibition]);

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

  const coverSrc = exhibition ? imageUrls[exhibition.coverKey] || exhibition.coverKey : '';

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
    setLiked((v) => {
      const next = !v;
      toast.success(next ? t('exhibition.likeAdded') : t('exhibition.likeRemoved'));
      return next;
    });
  };

  if (!exhibition || !primaryArtist) {
    return <NotFoundBlock title={t('exhibition.notFound')} homeLabel={t('exhibition.home')} />;
  }

  const typeLabel = exhibition.type === 'solo' ? t('exhibition.solo') : t('exhibition.group');
  const primarySub = exhibition.type === 'solo' ? t('exhibition.repArtist') : t('exhibition.hostArtist');

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
        <div className="relative aspect-[21/9] min-h-[200px] sm:min-h-[280px] w-full overflow-hidden rounded-none sm:rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] mt-4 sm:mt-8">
          <ImageWithFallback
            src={coverSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <p className="text-[13px] font-medium text-[#6366F1] mb-2">{typeLabel}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight">
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
                  className="w-12 h-12 rounded-full object-cover border border-[#F0F0F0]"
                />
                <div>
                  <p className="text-[15px] font-medium text-[#18181B] group-hover:text-[#6366F1] transition-colors">
                    {primaryArtist.name}
                  </p>
                  <p className="text-[13px] text-[#71717A]">{primarySub}</p>
                </div>
              </Link>
            </div>

            <p className="text-sm text-[#71717A]">
              {exhibition.startDate} — {exhibition.endDate}
            </p>

            <p className="text-[15px] leading-relaxed text-[#3F3F46] max-w-2xl whitespace-pre-line">
              {exhibition.description}
            </p>

            {exhibition.type === 'group' && participatingArtists.length > 0 && (
              <div className="pt-4 border-t border-[#F0F0F0]">
                <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-4">
                  {t('exhibition.participantsHeading')}
                </h2>
                <ul className="flex flex-wrap gap-3">
                  {participatingArtists.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`/profile/${a.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#F0F0F0] pl-1 pr-3 py-1 hover:border-[#6366F1]/40 transition-colors bg-white"
                      >
                        <ImageWithFallback
                          src={a.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-[#18181B]">{a.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-row sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLike}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                liked
                  ? 'border-[#6366F1] bg-[#6366F1]/5 text-[#6366F1]'
                  : 'border-[#F0F0F0] text-[#18181B] hover:border-[#D4D4D8]'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} aria-hidden />
              {t('workDetail.like')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#F0F0F0] px-4 py-2.5 text-sm font-medium text-[#18181B] hover:border-[#D4D4D8] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {t('workDetail.share')}
            </button>
          </div>
        </div>

        <section className="mt-16 sm:mt-20">
          <h2 className="text-lg font-semibold text-[#18181B] mb-8">{t('exhibition.worksHeading')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {exhibitionWorks.map((work) => (
              <button
                key={work.id}
                type="button"
                onClick={() => navigate(`/works/${work.id}`)}
                className="text-left group"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] mb-3">
                  <ImageWithFallback
                    src={resolveWorkImageSrc(work)}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <p className="text-sm font-medium text-[#18181B] group-hover:text-[#6366F1] transition-colors line-clamp-2">
                  {work.title}
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">{work.artist.name}</p>
              </button>
            ))}
          </div>
        </section>

        {relatedExhibitions.length > 0 && (
          <section className="mt-20 sm:mt-24 pt-12 border-t border-[#F0F0F0]">
            <h2 className="text-lg font-semibold text-[#18181B] mb-8">{t('exhibition.otherHeading')}</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {relatedExhibitions.map((ex) => {
                const thumb = imageUrls[ex.coverKey] || ex.coverKey;
                const relType = ex.type === 'solo' ? t('exhibition.solo') : t('exhibition.group');
                return (
                  <li key={ex.rid}>
                    <Link
                      to={`/exhibitions/${ex.rid}`}
                      className="flex gap-4 p-4 rounded-xl border border-[#F0F0F0] hover:border-[#D4D4D8] transition-colors bg-white"
                    >
                      <div className="w-24 h-24 shrink-0 overflow-hidden rounded-lg border border-[#F0F0F0]">
                        <ImageWithFallback src={thumb} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 py-0.5">
                        <p className="text-[13px] text-[#6366F1] mb-1">{relType}</p>
                        <p className="font-medium text-[#18181B] line-clamp-2">{ex.title}</p>
                        <p className="text-xs text-[#71717A] mt-2">
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
    </div>
  );
}
