import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, MoreHorizontal, Flag } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Work, artists as allArtists } from '../data';
import { WorkCard } from '../components/WorkCard';
import { workStore, userInteractionStore, useInteractionStore, useAuthStore, followStore, useFollowStore, useProfileStore } from '../store';
import { hydrateGroupWorks, type WorkOwner } from '../groupData';
import { imageUrls } from '../imageUrls';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { ReportModal } from '../components/ReportModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { getCoverImage } from '../utils/imageHelper';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { pointsOnBrowseDailyVisit } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { AnimatePresence } from 'framer-motion';
import { orderWorksForBrowseFeed } from '../utils/feedOrdering';
import { loadSeenWorkIds, rememberSeenWork } from '../utils/seenFeedWorks';
import { restoreScrollTop, saveScrollTop } from '../utils/scrollRestore';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';
import { displayExhibitionTitle } from '../utils/workDisplay';
import useEmblaCarousel from 'embla-carousel-react';
import { useVisibleAdminBanners } from '../utils/bannerStore';
import { useManagedEvents, deriveEventStatus } from '../utils/eventsStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FEED_PAGE_SIZE = 24;

/** Resolve an image key through the imageUrls map, falling back to the raw key. */
function resolveImage(key: string): string {
  return imageUrls[key] || key;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Browse() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const params = useParams();

  const categories = useMemo(
    () =>
      [
        { id: 'all' as const, label: t('browse.tabAll') },
        { id: 'individual' as const, label: t('browse.tabSolo') },
        { id: 'group' as const, label: t('browse.tabGroup') },
      ] as const,
    [t],
  );

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

  // -- Work data from store (includes user-uploaded works) -------------------
  const [works, setWorks] = useState(workStore.getWorks());
  useEffect(() => {
    const unsubscribe = workStore.subscribe(() => setWorks(workStore.getWorks()));
    return unsubscribe;
  }, []);

  // -- UI state -------------------------------------------------------------
  // 탭 상태 ↔ URL `?tab=all|individual|group` 동기화.
  // - 초기 진입: URL 쿼리가 유효 값이면 해당 탭으로 시작.
  // - 사용자 탭 변경: setSearchParams로 URL 갱신(뒤로가기·북마크·공유 가능).
  // - 'all'은 기본값이라 URL에서 생략(기본 상태 = 깔끔한 URL).
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ['all', 'individual', 'group'] as const;
  type BrowseTab = (typeof VALID_TABS)[number];
  const initialTab = ((): BrowseTab => {
    const q = searchParams.get('tab');
    return q && (VALID_TABS as readonly string[]).includes(q) ? (q as BrowseTab) : 'all';
  })();
  const [activeCategory, setActiveCategoryState] = useState<BrowseTab>(initialTab);
  const setActiveCategory = useCallback((next: string) => {
    const valid = (VALID_TABS as readonly string[]).includes(next) ? (next as BrowseTab) : 'all';
    setActiveCategoryState(valid);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (valid === 'all') sp.delete('tab');
        else sp.set('tab', valid);
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // 외부에서 URL이 바뀐 경우(뒤로가기 등) 탭 동기화
  useEffect(() => {
    const q = searchParams.get('tab');
    const next: BrowseTab =
      q && (VALID_TABS as readonly string[]).includes(q) ? (q as BrowseTab) : 'all';
    setActiveCategoryState((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  // -- Embla banner carousel (터치 스와이프 + 자동 회전) ----------------------
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentBanner(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // -- Scroll position tracking for modal open/close -----------------------
  const scrollPosRef = useRef<number>(0);

  // -- Open modal from URL (PRD: /exhibitions/:id 딥링크) ----------------------
  useEffect(() => {
    if (params.id && params.id !== selectedWork) {
      setSelectedWork(params.id);
    } else if (!params.id && selectedWork) {
      setSelectedWork(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // -- 피드 스크롤 복원: 다른 페이지 다녀온 뒤 / 새 탭에서 돌아왔을 때 최근 위치 유지 -----
  useEffect(() => {
    // 모달로 딥링크 진입 중이면 스크롤 복원 생략
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

  // -- Browser back/forward handling for modal URL -------------------------
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/exhibitions\/(.+)$/);
      if (match) {
        setSelectedWork(match[1]);
      } else {
        setSelectedWork(null);
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosRef.current);
        });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [feedEpoch, setFeedEpoch] = useState(() => Date.now());

  const openWork = useCallback((workId: string) => {
    rememberSeenWork(workId);
    scrollPosRef.current = window.scrollY;
    // 모달 열기 직전 피드 스크롤 위치를 sessionStorage에도 저장 (페이지 이탈 대비)
    saveScrollTop('browse', 'browse-scroll-root');
    setSelectedWork(workId);
    window.history.pushState({ workId }, '', `/exhibitions/${workId}`);
  }, []);

  const closeWork = useCallback(() => {
    setSelectedWork(null);
    if (window.location.pathname.startsWith('/exhibitions/')) {
      navigate(-1);
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }, [navigate]);

  // -- Banner controls (Embla) -----------------------------------------------
  const prevBanner = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const nextBanner = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer !== null) { clearInterval(timer); timer = null; }
    };
    const start = () => {
      stop();
      if (document.visibilityState === 'hidden') return;
      timer = setInterval(() => emblaApi.scrollNext(), 5000);
    };
    const onVisibility = () => { document.visibilityState === 'hidden' ? stop() : start(); };
    start();
    emblaApi.on('pointerDown', stop);
    emblaApi.on('pointerUp', start);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      emblaApi.off('pointerDown', stop);
      emblaApi.off('pointerUp', start);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [emblaApi]);

  // -- Combine + PRD 근사 피드 순서(Pick → 신규 → 가중) + 시청 이력 반영 -------
  // 시니어 UX: 좋아요/저장 인터랙션 시 피드가 뒤섞이는 현상(Shifting)을 방지하기 위해 
  // 순서 계산 로직은 '작품 개수'가 변하거나 '새로고침(epoch)'할 때만 실행되도록 제한합니다.
  const allWorks = useMemo(() => {
    const hydrated = hydrateGroupWorks(allArtists);
    const combined = [...workStore.getWorks(), ...hydrated] as Work[];
    const seen = loadSeenWorkIds();
    const followingArtistIds = new Set(follows.getFollows());
    return orderWorksForBrowseFeed(combined, seen, { followingArtistIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works.length, feedEpoch, follows.getCount()]); 
  // interaction(likes) 변화에는 반응하지 않고, 개수 변화나 수동 갱신 시에만 순서 재계산

  // -- Category filtering (신고자 본인에게만 작품 숨김) ------------------------
  const hiddenWorkIds = useMemo(
    () => getHiddenWorkIdsForReporter(),
    [works, auth.isLoggedIn(), profileSig, hideRevision],
  );

  const reportTarget = useMemo(() => {
    if (!reportWorkId) return null;
    return allWorks.find((w) => w.id === reportWorkId) ?? null;
  }, [reportWorkId, allWorks]);

  const filteredWorks = useMemo(() => {
    const visibleWorks = allWorks.filter(
      (w) => !hiddenWorkIds.has(w.id) && isWorkVisibleOnPublicFeed(w),
    );
    if (activeCategory === 'all') return visibleWorks;

    const isGroupWork = (w: Work) => {
      if (w.primaryExhibitionType === 'group') return true;
      if (w.primaryExhibitionType === 'solo') return false;
      const owner = w.owner as WorkOwner | undefined;
      if (owner?.type === 'group') return true;
      return false;
    };

    if (activeCategory === 'individual') {
      return visibleWorks.filter((w) => !isGroupWork(w));
    }
    // group
    return visibleWorks.filter((w) => isGroupWork(w));
  }, [allWorks, activeCategory, hiddenWorkIds]);

  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE_SIZE);
  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE_SIZE);
    // 탭 전환 시 스크롤 최상단으로 초기화
    const scrollRoot = document.getElementById('browse-scroll-root');
    if (scrollRoot) scrollRoot.scrollTo({ top: 0, behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeCategory]);

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

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* HERO — 에디토리얼 갤러리 톤                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-background">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-2 sm:pb-3">
          <div className="relative group">
            <div className="overflow-hidden sm:rounded-sm ring-1 ring-foreground/[0.08] shadow-[0_28px_80px_-32px_rgba(35,32,40,0.45)]" ref={emblaRef}>
              <div className="flex">
                {promotionBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className={`min-w-0 flex-[0_0_100%] relative ${banner.linkUrl ? 'cursor-pointer' : ''}`}
                    onClick={() => banner.linkUrl && navigate(banner.linkUrl)}
                  >
                    <div className="relative h-[170px] sm:h-[220px] lg:h-[280px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 px-8 sm:px-12 lg:px-20 pb-6 sm:pb-8 lg:pb-10">
                        <div className="max-w-[720px]">
                          {banner.tag && (
                            <span className="inline-block px-2.5 py-1 text-xs sm:text-xs font-semibold tracking-[0.14em] uppercase text-white border border-white/35 bg-white/5 backdrop-blur-[2px] mb-3">
                              {banner.tag}
                            </span>
                          )}
                          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-2.5 leading-tight tracking-tight drop-shadow-md">
                            {banner.title}
                          </h2>
                          <p className="text-sm sm:text-base text-white/90 font-medium max-w-xl leading-relaxed hidden sm:block">
                            {banner.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={prevBanner}
              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex items-center justify-center bg-white text-foreground rounded-full shadow-lg border border-black/5 transition-all hover:scale-110 active:scale-95 z-20"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button
              variant="ghost"
              onClick={nextBanner}
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex items-center justify-center bg-white text-foreground rounded-full shadow-lg border border-black/5 transition-all hover:scale-110 active:scale-95 z-20"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {promotionBanners.map((_, i) => (
                <Button
                  variant="ghost"
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`${t('nav.browse')} ${i + 1}`}
                  className={`h-1 sm:h-1.5 rounded-full transition-all p-0 min-h-0 min-w-0 ${
                    currentBanner === i
                      ? 'w-8 sm:w-10 bg-white'
                      : 'w-1.5 sm:w-1.5 bg-white/45 lg:hover:bg-white/65'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* CATEGORY — 언더라인 탭                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-lg backdrop-saturate-150">
        <div className="mx-auto flex min-h-11 sm:min-h-12 max-w-[1440px] items-end gap-5 sm:gap-7 px-4 sm:px-8 lg:px-12">
          {categories.map((cat) => (
            <Button
              variant="ghost"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative shrink-0 h-auto rounded-md px-1.5 pb-2.5 pt-1.5 text-xs sm:text-sm transition-colors shadow-none hover:bg-transparent focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                activeCategory === cat.id
                  ? 'text-foreground font-bold after:absolute after:left-1.5 after:right-1.5 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground font-medium hover:text-foreground'
              }`}
            >
              {cat.label}
            </Button>
          ))}

        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* WORK GRID                                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 sm:py-8 pb-6 md:pb-8">
        {filteredWorks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
            <p className="text-sm text-foreground font-medium mb-2">{t('browse.emptyTitle')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('browse.emptyHint')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="default"
                onClick={() => navigate('/upload')}
                className="min-h-[44px]"
              >
                {t('browse.emptyCtaUpload')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveCategory('all')}
                className="min-h-[44px]"
              >
                {t('browse.emptyCtaAll')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
            {displayedWorks.map((work, idx) => (
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
            ))}
            {displayedWorks.length < filteredWorks.length ? (
              <>
                <div
                  ref={feedSentinelRef}
                  className="col-span-full"
                  aria-hidden
                />
                {/* Skeleton loading cards */}
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

      {/* ----------------------------------------------------------------- */}
      {/* WORK DETAIL MODAL                                                 */}
      {/* ----------------------------------------------------------------- */}
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


// ===========================================================================
// 상대 시간 헬퍼 (알림 페이지와 동일 키 재활용)
// ===========================================================================
