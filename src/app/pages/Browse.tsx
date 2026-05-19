import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Palette } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { openConfirm } from '../components/ConfirmDialog';
import { Work, artists as allArtists } from '../data';
import { WorkCard } from '../components/WorkCard';
import { workStore, useInteractionStore, useAuthStore, followStore, useFollowStore, useProfileStore } from '../store';
import { hydrateGroupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { ReportModal } from '../components/ReportModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { pointsOnBrowseDailyVisit } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import { AnimatePresence } from 'framer-motion';
import { orderWorksForBrowseFeed } from '../utils/feedOrdering';
import { loadSeenWorkIds, rememberSeenWork } from '../utils/seenFeedWorks';
import { restoreScrollTop, saveScrollTop } from '../utils/scrollRestore';
import { Button } from '../components/ui/button';
import { getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';
import { getCoverImage } from '../utils/imageHelper';
import { useVisibleAdminBanners } from '../utils/bannerStore';
import { useManagedEvents, deriveEventStatus } from '../utils/eventsStore';
import { useCuration } from '../utils/curationStore';
import { usePickSessions, derivePickStatus } from '../utils/pickStore';
import { todayLocalIso } from '../utils/localDate';
import { CurationCarousel } from '../components/CurationCarousel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FEED_PAGE_SIZE = 24;

function EndedCurationsSection({
  endedCurations,
}: {
  endedCurations: import('../utils/curationStore').CuratedExhibition[];
}) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useI18n();
  const visible = showAll ? endedCurations : endedCurations.slice(0, 4);
  const works = workStore.getWorks();
  const worksMap = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);
  const getArtistNames = useCallback((c: import('../utils/curationStore').CuratedExhibition): string[] => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const piece of c.pieces ?? []) {
      const work = worksMap.get(piece.workId);
      if (!work) continue;
      const artist = allArtists.find((a) => a.id === work.artistId);
      const name = artist?.name ?? work.artist?.name ?? '';
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names;
  }, [worksMap]);
  return (
    <section className="mt-14 sm:mt-16">
      <h2 className="text-sm font-semibold text-muted-foreground mb-5">지난 기획전</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {visible.map((c) => {
          const artistNames = c.bannerOverlay ? getArtistNames(c) : [];
          return (
          <button
            key={c.id}
            type="button"
            onClick={() => openConfirm({ title: t('curation.endedTitle'), description: t('curation.endedDesc'), hideCancel: true })}
            className="relative overflow-hidden rounded-lg aspect-[21/9] grayscale opacity-50 hover:opacity-75 hover:grayscale-0 transition-all duration-300 w-full block text-left cursor-pointer"
          >
            <ImageWithFallback
              src={c.bannerImageUrl}
              alt={c.title}
              className="w-full h-full object-cover"
            />
            {c.bannerOverlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/[0.08] to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  {artistNames.length > 0 && (
                    <p className="text-[10px] text-white/50 mb-2 leading-relaxed tracking-wide">{artistNames.join(' · ')}</p>
                  )}
                  <p className="text-white font-bold text-lg leading-tight mb-0.5">{c.title}</p>
                  {c.subtitle && (
                    <p className="text-white/70 text-xs leading-snug">{c.subtitle}</p>
                  )}
                  {(c.startAt && c.endAt) && (
                    <p className="text-white/40 text-[10px] tracking-[2px] mt-2.5">
                      {c.startAt.replace(/-/g, '.')} — {c.endAt.replace(/-/g, '.')}
                    </p>
                  )}
                </div>
              </>
            )}
          </button>
          );
        })}
      </div>
      {!showAll && endedCurations.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-5 text-sm text-muted-foreground lg:hover:text-foreground transition-colors min-h-[44px]"
        >
          지난 기획전 더 보기 →
        </button>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Browse() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const params = useParams();
  const today = todayLocalIso();

  useEffect(() => {
    pointsOnBrowseDailyVisit();
  }, []);

  const adminBanners = useVisibleAdminBanners();
  const managedEvents = useManagedEvents();
  const promotionBanners = useMemo(
    () => {
      if (adminBanners.length > 0) {
        return adminBanners.map((b) => ({
          id: b.id,
          image: b.imageUrl,
          title: b.title,
          subtitle: b.subtitle || '',
          tag: '',
          linkUrl: b.linkUrl,
        }));
      }
      return managedEvents.map((ev) => ({
        id: `event-${ev.id}`,
        image: ev.bannerImageUrl,
        title: ev.title,
        subtitle: ev.subtitle || '',
        tag: deriveEventStatus(ev) === 'active'
          ? t('eventDetail.statusActive')
          : deriveEventStatus(ev) === 'scheduled'
            ? t('eventDetail.statusScheduled')
            : t('eventDetail.statusEnded'),
        linkUrl: `/events/${ev.id}`,
      }));
    },
    [t, adminBanners, managedEvents],
  );

  // -- 기획전 데이터 -----------------------------------------------------------
  const { curatedExhibitions } = useCuration();
  const activeCurations = useMemo(
    () => curatedExhibitions.filter((c) => c.bannerImageUrl && (!c.endAt || today <= c.endAt)),
    [curatedExhibitions, today],
  );
  const endedCurations = useMemo(
    () => curatedExhibitions.filter((c) => c.bannerImageUrl && c.endAt && today > c.endAt),
    [curatedExhibitions, today],
  );

  // 단일 기획전 배너 오버레이용 아티스트 이름
  const singleCurationArtistNames = useMemo((): string[] => {
    const c = activeCurations.length === 1 ? activeCurations[0] : null;
    if (!c) return [];
    const wMap = new Map(workStore.getWorks().map((w) => [w.id, w]));
    const seen = new Set<string>();
    const names: string[] = [];
    for (const piece of c.pieces ?? []) {
      const work = wMap.get(piece.workId);
      if (!work) continue;
      const artist = allArtists.find((a) => a.id === work.artistId);
      const name = artist?.name ?? work.artist?.name ?? '';
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    }
    return names;
  }, [activeCurations]);

  // -- Pick 데이터 ------------------------------------------------------------
  const pickSessions = usePickSessions();
  const activePickSession = useMemo(
    () => pickSessions.find((s) => s.publicationOpen && derivePickStatus(s) === 'active') ?? null,
    [pickSessions],
  );
  // 배너용: active 없으면 가장 최근 published 세션
  const bannerPickSession = useMemo(
    () => activePickSession ?? pickSessions.filter((s) => s.publicationOpen).at(-1) ?? null,
    [activePickSession, pickSessions],
  );

  // -- Stores ---------------------------------------------------------------
  const interactions = useInteractionStore();
  const auth = useAuthStore();
  const follows = useFollowStore();
  const profile = useProfileStore();
  const profileSig = `${profile.getProfile().nickname}|${profile.getProfile().name}`;
  const loginPrompt = useLoginPrompt();
  const requestLogin = () => loginPrompt.tryProtectedAction('like');
  const [hideRevision, setHideRevision] = useState(0);
  const [reportWorkId, setReportWorkId] = useState<string | null>(null);

  useEffect(() => {
    migrateLegacyReportHiddenOnce();
  }, [auth.isLoggedIn(), profileSig]);

  const [works, setWorks] = useState(workStore.getWorks());
  useEffect(() => {
    const unsubscribe = workStore.subscribe(() => setWorks(workStore.getWorks()));
    return unsubscribe;
  }, []);

  // -- 탭 상태 ↔ URL 동기화 --------------------------------------------------
  // browse=기본(쿼리 생략), curation=?tab=curation, pick=?tab=pick
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ['browse', 'curation', 'pick'] as const;
  type BrowseTab = (typeof VALID_TABS)[number];
  const initialTab = ((): BrowseTab => {
    const q = searchParams.get('tab');
    return q && (VALID_TABS as readonly string[]).includes(q) ? (q as BrowseTab) : 'browse';
  })();
  const [activeTab, setActiveTabState] = useState<BrowseTab>(initialTab);
  const setActiveTab = useCallback((next: BrowseTab) => {
    setActiveTabState(next);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === 'browse') sp.delete('tab');
        else sp.set('tab', next);
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('tab');
    const next: BrowseTab =
      q && (VALID_TABS as readonly string[]).includes(q) ? (q as BrowseTab) : 'browse';
    setActiveTabState((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const [selectedWork, setSelectedWork] = useState<string | null>(null);


  // -- Scroll position tracking -----------------------------------------------
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    if (params.id && params.id !== selectedWork) {
      setSelectedWork(params.id);
    } else if (!params.id && selectedWork) {
      setSelectedWork(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (params.id) return;
    restoreScrollTop('browse', 'browse-scroll-root');
    const saveCurrent = () => saveScrollTop('browse', 'browse-scroll-root');
    window.addEventListener('beforeunload', saveCurrent);
    window.addEventListener('pagehide', saveCurrent);
    return () => {
      saveCurrent();
      window.removeEventListener('beforeunload', saveCurrent);
      window.removeEventListener('pagehide', saveCurrent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/exhibitions\/(.+)$/);
      if (match) {
        setSelectedWork(match[1]);
      } else {
        setSelectedWork(null);
        requestAnimationFrame(() => { window.scrollTo(0, scrollPosRef.current); });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [feedEpoch, setFeedEpoch] = useState(() => Date.now());

  const openWork = useCallback((workId: string) => {
    rememberSeenWork(workId);
    scrollPosRef.current = window.scrollY;
    saveScrollTop('browse', 'browse-scroll-root');
    setSelectedWork(workId);
    window.history.pushState({ workId }, '', `/exhibitions/${workId}`);
  }, []);

  const closeWork = useCallback(() => {
    setSelectedWork(null);
    if (window.location.pathname.startsWith('/exhibitions/')) {
      navigate(-1);
    }
    requestAnimationFrame(() => { window.scrollTo(0, scrollPosRef.current); });
  }, [navigate]);


  // -- 피드 데이터 (둘러보기 탭) -----------------------------------------------
  const allWorks = useMemo(() => {
    const hydrated = hydrateGroupWorks(allArtists);
    const combined = [...workStore.getWorks(), ...hydrated] as Work[];
    const seen = loadSeenWorkIds();
    const followingArtistIds = new Set(follows.getFollows());
    return orderWorksForBrowseFeed(combined, seen, { followingArtistIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works.length, feedEpoch, follows.getCount()]);

  const hiddenWorkIds = useMemo(
    () => getHiddenWorkIdsForReporter(),
    [works, auth.isLoggedIn(), profileSig, hideRevision],
  );

  const reportTarget = useMemo(() => {
    if (!reportWorkId) return null;
    return allWorks.find((w) => w.id === reportWorkId) ?? null;
  }, [reportWorkId, allWorks]);

  const filteredWorks = useMemo(
    () => allWorks.filter((w) => !hiddenWorkIds.has(w.id) && isWorkVisibleOnPublicFeed(w)),
    [allWorks, hiddenWorkIds],
  );

  // -- Pick 탭 작품 목록 (전 세션 누적) ----------------------------------------
  const pickWorks = useMemo(() => {
    const seen = new Set<string>();
    const result: Work[] = [];
    for (const session of pickSessions.filter((s) => s.publicationOpen)) {
      for (const id of session.selectedWorkIds ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        const w = filteredWorks.find((fw) => fw.id === id);
        if (w) result.push(w);
      }
    }
    return result;
  }, [pickSessions, filteredWorks]);


  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE_SIZE);
  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE_SIZE);
    const scrollRoot = document.getElementById('browse-scroll-root');
    if (scrollRoot) scrollRoot.scrollTo({ top: 0, behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const displayedWorks = useMemo(
    () => filteredWorks.slice(0, feedVisibleCount),
    [filteredWorks, feedVisibleCount],
  );

  const feedSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = feedSentinelRef.current;
    if (!el || displayedWorks.length >= filteredWorks.length) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setFeedVisibleCount((c) => Math.min(c + FEED_PAGE_SIZE, filteredWorks.length));
      },
      { root: null, rootMargin: '320px', threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [filteredWorks.length, displayedWorks.length]);

  const tabs = useMemo(() => [
    { id: 'browse' as const, label: t('browse.tabBrowse') },
    { id: 'pick' as const, label: t('browse.tabPick') },
    { id: 'curation' as const, label: t('browse.tabCuration') },
  ], [t]);

  type PromoItem = { kind: 'promo'; data: typeof promotionBanners[0] };
  type WorkItem = { kind: 'work'; data: typeof displayedWorks[0] };
  const PROMO_INTERVAL = 6;
  const interleavedFeed = useMemo((): (PromoItem | WorkItem)[] => {
    const result: (PromoItem | WorkItem)[] = [];
    let promoIdx = 0;
    displayedWorks.forEach((work, i) => {
      result.push({ kind: 'work', data: work });
      if ((i + 1) % PROMO_INTERVAL === 0 && promoIdx < promotionBanners.length) {
        result.push({ kind: 'promo', data: promotionBanners[promoIdx++] });
      }
    });
    return result;
  }, [promotionBanners, displayedWorks]);

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      {/* 탭 바 */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-lg backdrop-saturate-150">
        <div className="mx-auto flex min-h-11 sm:min-h-12 max-w-[1440px] items-end gap-5 sm:gap-7 px-4 sm:px-8 lg:px-12">
          {tabs.map((tab) => (
            <Button
              variant="ghost"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative shrink-0 h-auto rounded-md px-1.5 pb-2.5 pt-1.5 text-xs sm:text-sm transition-colors shadow-none hover:bg-transparent focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                activeTab === tab.id
                  ? 'text-foreground font-bold after:absolute after:left-1.5 after:right-1.5 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground font-medium hover:text-foreground'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── 둘러보기 탭 ── */}
      {activeTab === 'browse' && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 sm:py-8 pb-6 md:pb-8">
          {filteredWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
              <p className="text-sm text-foreground font-medium mb-2">{t('browse.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mb-6">{t('browse.emptyHint')}</p>
              <Button type="button" variant="default" onClick={() => navigate('/upload')} className="min-h-[44px]">
                {t('browse.emptyCtaUpload')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
              {interleavedFeed.map((item, idx) => {
                if (item.kind === 'promo') {
                  const banner = item.data;
                  return (
                    <div
                      key={`promo-${banner.id}`}
                      onClick={() => {
                        if (!banner.linkUrl) return;
                        if (banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')) {
                          window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          navigate(banner.linkUrl);
                        }
                      }}
                      className={`group self-stretch ${banner.linkUrl ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative h-full overflow-hidden rounded-sm bg-black ring-2 ring-primary/25">
                        <ImageWithFallback
                          src={banner.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-500 lg:group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/20" />
                        {/* 상단 배지 */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-primary text-primary-foreground shadow-sm">
                            <Palette className="h-3 w-3" />
                            Proud Gallery
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-end p-5 sm:p-6 lg:p-8">
                          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-snug drop-shadow-sm">
                            {banner.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                }
                const work = item.data;
                return (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={idx}
                  onSelect={() => openWork(work.id)}
                  onArtistClick={(artistId) => navigate(`/profile/${artistId}`)}
                  isFollowing={(artistId) => follows.isFollowing(artistId)}
                  onToggleFollow={(artistId) => {
                    if (!requestLogin()) return;
                    followStore.toggle(artistId);
                  }}
                  onReport={(w) => {
                    if (!requestLogin()) return;
                    setReportWorkId(w.id);
                  }}
                />
                );
              })}
              {displayedWorks.length < filteredWorks.length ? (
                <>
                  <div ref={feedSentinelRef} className="col-span-full" aria-hidden />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="animate-pulse">
                      <div className="aspect-square w-full rounded-sm bg-muted/60" />
                      <div className="px-1 pt-3 space-y-2.5">
                        <div className="h-4 w-3/4 rounded bg-muted/60" />
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-muted/60" />
                          <div className="h-3.5 w-20 rounded bg-muted/60" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : displayedWorks.length > 0 ? (
                <div className="col-span-full flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">{t('browse.feedEnd')}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t('browse.feedEndHint')}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ── 기획전 탭 ── */}
      {activeTab === 'curation' && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-4 sm:py-5 pb-8 md:pb-12">
          {activeCurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
              <p className="text-sm text-foreground font-medium">{t('browse.curationEmpty')}</p>
            </div>
          ) : (
            <>
              {/* 현재 전시 중 배지 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[1.5px] uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  {t('browse.curationOnView')}
                </span>
              </div>
              {/* 1개: 정적 배너 / 2개 이상: 캐러셀 */}
              {activeCurations.length === 1 ? (
                <button
                  type="button"
                  className="relative aspect-[21/9] w-full overflow-hidden rounded-xl cursor-pointer block"
                  onClick={() => navigate(`/curations/${activeCurations[0].id}`)}
                >
                  <ImageWithFallback
                    src={activeCurations[0].bannerImageUrl}
                    alt={activeCurations[0].title}
                    className="w-full h-full object-cover"
                  />
                  {activeCurations[0].bannerOverlay && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/[0.08] to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                        {singleCurationArtistNames.length > 0 && (
                          <p className="text-[11px] text-white/50 mb-2.5 leading-relaxed tracking-wide">
                            {singleCurationArtistNames.join(' · ')}
                          </p>
                        )}
                        <p className="text-white font-bold text-2xl leading-tight mb-0.5">{activeCurations[0].title}</p>
                        {activeCurations[0].subtitle && (
                          <p className="text-white/70 text-sm leading-snug">{activeCurations[0].subtitle}</p>
                        )}
                        {(activeCurations[0].startAt && activeCurations[0].endAt) && (
                          <p className="text-white/40 text-[11px] tracking-[2.5px] mt-3">
                            {activeCurations[0].startAt.replace(/-/g, '.')} — {activeCurations[0].endAt.replace(/-/g, '.')}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </button>
              ) : (
                <CurationCarousel curations={activeCurations} />
              )}
            </>
          )}

          {/* 지난 기획전 */}
          {endedCurations.length > 0 && <EndedCurationsSection endedCurations={endedCurations} />}
        </div>
      )}

      {/* ── Pick 탭 ── */}
      {activeTab === 'pick' && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 sm:py-8 pb-6 md:pb-8">
          {pickWorks.length === 0 && !bannerPickSession ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
              <p className="text-sm text-muted-foreground">{t('browse.pickEmpty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
              {/* Pick 배너 카드 → PickDetail */}
              {bannerPickSession && (
              <div
                onClick={() => navigate(`/picks/${bannerPickSession.id}`)}
                className="group self-stretch cursor-pointer"
              >
                <div className="relative h-full overflow-hidden rounded-sm bg-black">
                  {(() => {
                    const firstWork = pickWorks[0];
                    const coverKey = firstWork ? getCoverImage(firstWork.image, firstWork.coverImageIndex) : null;
                    const src = coverKey ? (imageUrls[coverKey] || coverKey) : null;
                    return src ? (
                      <ImageWithFallback
                        src={src}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 lg:group-hover:scale-[1.03]"
                      />
                    ) : null;
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-white/90 drop-shadow-sm" />
                    <span className="text-[11px] font-semibold text-white/90 tracking-tight drop-shadow-sm">Proud Gallery</span>
                  </div>
                  <div className="absolute inset-0 flex items-end p-5 sm:p-6 lg:p-8">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[2px] uppercase text-white/60 mb-1">PROUD'S PICK</p>
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-snug drop-shadow-sm">
                        {bannerPickSession.title}
                      </h3>
                      <p className="text-xs text-white/55 mt-1 drop-shadow-sm">
                        {t('pickDetail.selectedCount').replace('{n}', String(pickWorks.length))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* 선정 작품 그리드 */}
              {pickWorks.map((work, idx) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={idx + 1}
                  onSelect={() => openWork(work.id)}
                  onArtistClick={(artistId) => navigate(`/profile/${artistId}`)}
                  isFollowing={(artistId) => follows.isFollowing(artistId)}
                  onToggleFollow={(artistId) => {
                    if (!requestLogin()) return;
                    followStore.toggle(artistId);
                  }}
                  onReport={(w) => {
                    if (!requestLogin()) return;
                    setReportWorkId(w.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 전시 상세 모달 */}
      <AnimatePresence>
        {selectedWork !== null && (
          <WorkDetailModal
            key="work-detail"
            workId={selectedWork}
            onClose={closeWork}
            onNavigate={(newWorkId) => {
              rememberSeenWork(newWorkId);
              setSelectedWork(newWorkId);
              window.history.replaceState({ workId: newWorkId }, '', `/exhibitions/${newWorkId}`);
            }}
            allWorks={allWorks}
            onWorkReported={() => setHideRevision((n) => n + 1)}
            initialPieceId={searchParams.get('piece') ?? undefined}
          />
        )}
      </AnimatePresence>

      {reportWorkId && reportTarget ? (
        <ReportModal
          key={reportWorkId}
          open
          onClose={() => setReportWorkId(null)}
          targetType="work"
          targetId={reportWorkId}
          targetName={reportTarget.title}
          onReported={() => setHideRevision((n) => n + 1)}
        />
      ) : null}

      <LoginPromptModal open={loginPrompt.open} onClose={loginPrompt.close} action={loginPrompt.action} />
    </div>
  );
}
