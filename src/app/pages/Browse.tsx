import { useState, useMemo, useEffect, useCallback, useRef, type ReactElement, type ReactNode } from 'react';
import { ChevronRight, ChevronLeft, Image as ImageIcon, Users, MoreHorizontal, Flag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Work, Artist, artists as allArtists } from '../data';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { usePointerCoarse } from '../hooks/usePointerCoarse';
import { User as UserIcon } from 'lucide-react';
import { workStore, userInteractionStore, useInteractionStore, useAuthStore, followStore, useFollowStore, useProfileStore } from '../store';
import { hydrateGroupWorks, type WorkOwner } from '../groupData';
import { imageUrls } from '../imageUrls';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { ReportModal } from '../components/ReportModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { getCoverImage, getImageCount, getThumbCover } from '../utils/imageHelper';
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
import { useManagedEvents, deriveStatus } from '../utils/eventStore';

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
          tag: b.badge || '',
          linkUrl: b.linkUrl,
        }));
      }
      return managedEvents.map((ev) => ({
        id: `event-${ev.id}`,
        image: ev.bannerImageUrl,
        title: ev.title,
        subtitle: ev.subtitle || '',
        tag: deriveStatus(ev) === 'active'
          ? t('eventDetail.statusActive')
          : deriveStatus(ev) === 'scheduled'
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
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  /**
   * 비로그인 사용자가 첫 interactive action을 시도하면 모달을 띄우되,
   * 모달을 dismiss한 이후엔 같은 세션에서 토스트로만 짧게 리마인드한다
   * (시니어 UX — 같은 모달 반복 차단).
   */
  const requestLogin = () => {
    if (auth.isLoggedIn()) return true;
    const dismissed = (() => {
      try { return sessionStorage.getItem('artier_login_prompt_dismissed') === '1'; } catch { return false; }
    })();
    if (dismissed) {
      toast(t('loginPrompt.toastReminder'), {
        duration: 4000,
        action: {
          label: t('loginPrompt.login'),
          onClick: () => navigate('/login'),
        },
      });
    } else {
      setLoginPromptOpen(true);
    }
    return false;
  };
  const handleLoginPromptClose = () => {
    if (!auth.isLoggedIn()) {
      try { sessionStorage.setItem('artier_login_prompt_dismissed', '1'); } catch { /* ignore */ }
    }
    setLoginPromptOpen(false);
  };
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
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
      window.history.pushState(null, '', '/');
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }, []);

  // -- Banner controls (Embla) -----------------------------------------------
  const prevBanner = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const nextBanner = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    let timer = setInterval(() => emblaApi.scrollNext(), 5000);
    // 사용자가 터치/드래그 시 타이머 리셋, 조작 완료 후 재시작
    const pause = () => { clearInterval(timer); };
    const resume = () => { clearInterval(timer); timer = setInterval(() => emblaApi.scrollNext(), 5000); };
    emblaApi.on('pointerDown', pause);
    emblaApi.on('pointerUp', resume);
    emblaApi.on('settle', resume);
    return () => { clearInterval(timer); emblaApi.off('pointerDown', pause); emblaApi.off('pointerUp', resume); emblaApi.off('settle', resume); };
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
      (w) => !w.isHidden && !hiddenWorkIds.has(w.id) && isWorkVisibleOnPublicFeed(w),
    );
    if (activeCategory === 'all') return visibleWorks;

    const isGroupWork = (w: Work) => {
      if (w.primaryExhibitionType === 'group') return true;
      if (w.primaryExhibitionType === 'solo') return false;
      const owner = w.owner as WorkOwner | undefined;
      if (owner?.type === 'group') return true;
      if (w.isInstructorUpload && w.groupName) return true;
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
    <div className="min-h-full bg-white">
      {/* ----------------------------------------------------------------- */}
      {/* HERO — 에디토리얼 갤러리 톤                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-2 sm:pb-3">
          <p className="text-xs sm:text-xs text-muted-foreground tracking-[0.14em] uppercase mb-2">
            {t('browse.heroKicker')}
          </p>
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
                          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-2.5 leading-tight tracking-tight">
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
      <div className="sticky top-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-lg backdrop-saturate-150">
        <div className="mx-auto flex min-h-11 sm:min-h-12 max-w-[1440px] items-end gap-5 sm:gap-7 px-4 sm:px-8 lg:px-12">
          {categories.map((cat) => (
            <Button
              variant="ghost"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative shrink-0 h-auto rounded-md px-1.5 pb-2.5 pt-1.5 text-xs sm:text-sm font-medium transition-colors shadow-none hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                activeCategory === cat.id
                  ? 'text-foreground after:absolute after:left-1.5 after:right-1.5 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
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
        {filteredWorks.length > 0 && (
          <header className="mb-6 sm:mb-8 max-w-xl">
            <p className="text-xs sm:text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-1">
              {t('browse.collectionKicker')}
            </p>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              {t('browse.collectionHeading')}
            </h2>
          </header>
        )}
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

      <LoginPromptModal open={loginPromptOpen} onClose={handleLoginPromptClose} action="like" />
    </div>
  );
}

// ===========================================================================
// 터치: Popover(탭) · 마우스: HoverCard
// ===========================================================================
function BrowseArtistPeek({
  coarse,
  trigger,
  children,
}: {
  coarse: boolean;
  trigger: ReactElement;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (coarse) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className="w-[min(calc(100vw-2rem),20rem)] max-h-[min(70vh,24rem)] overflow-y-auto p-3 z-[60]"
          align="start"
          side="bottom"
          sideOffset={6}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent align="start" sideOffset={6} className="w-[min(22rem,calc(100vw-2rem))] p-3 z-[60]" onClick={(e) => e.stopPropagation()}>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}

// ===========================================================================
// 표시 이름 자름 — 10자 초과 시 … 처리 (CSS truncate는 너비 기준이므로 글자 수 룰은 JS로)
// ===========================================================================
function truncateArtistName(name: string, max: number = 10): string {
  const n = (name ?? '').trim();
  return n.length > max ? `${n.slice(0, max)}…` : n;
}

// ===========================================================================
// 상대 시간 헬퍼 (알림 페이지와 동일 키 재활용)
// ===========================================================================
function formatRelativeShort(dateStr: string | undefined, t: (k: MessageKey) => string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.timeJustNow' as MessageKey);
  if (mins < 60) return t('notifications.timeMinutes' as MessageKey).replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.timeHours' as MessageKey).replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  if (days <= 30) return t('notifications.timeDays' as MessageKey).replace('{n}', String(days));
  return '';
}

// ===========================================================================
// WorkCard -- clean, simple design with large text for 50s audience
// ===========================================================================
interface WorkCardProps {
  work: Work;
  index: number;
  onSelect: () => void;
  onArtistClick: (artistId: string) => void;
  isFollowing: (artistId: string) => boolean;
  onToggleFollow: (artistId: string) => void;
  onReport: (work: Work) => void;
}

function WorkCard({ work, index, onSelect, onArtistClick, isFollowing, onToggleFollow, onReport }: WorkCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const coarsePointer = usePointerCoarse();
  const artist = work.artist;
  const groupName = work.groupName;
  const coOwners = work.coOwners;
  const hasCoOwnersNoGroup = !groupName && coOwners && coOwners.length > 0;
  const exhibitionLabel = displayExhibitionTitle(work, t('work.untitled'));
  const isPick = work.editorsPick === true || work.pick === true;
  const useGroupStyleRow =
    Boolean(groupName?.trim()) &&
    (work.primaryExhibitionType === 'group' ||
      Boolean(work.isInstructorUpload) ||
      Boolean(coOwners?.length) ||
      work.owner?.type === 'group');
  const imageSrc = resolveImage(getThumbCover(work));
  const imageCount = getImageCount(work.image);
  const showImageCountBadge =
    imageCount > 1 &&
    (work.primaryExhibitionType === 'group' ||
      work.primaryExhibitionType === 'solo' ||
      Array.isArray(work.image));

  // 비회원 참여 작가 (imageArtists type='non-member') — peek 리스트에 이름만 노출
  const nonMemberArtists = Array.from(
    new Map(
      (work.imageArtists ?? [])
        .filter((a) => a.type === 'non-member' && !!a.displayName)
        .map((a) => [a.displayName as string, a]),
    ).values(),
  );

  // peek에 표시할 멤버 리스트 구성.
  //  그룹 멤버 표시: 이미지 수를 초과하지 않도록 제한 (1장 = 1작가 원칙)
  const groupOwnerData: { id: string; memberIds?: string[] } | undefined =
    work.owner?.type === 'group' ? work.owner.data : undefined;
  const instructorArtistId =
    work.isInstructorUpload && work.primaryExhibitionType === 'group' ? work.artistId : null;
  const orderMembersWithInstructorFirst = (members: Artist[]): Artist[] => {
    const seen = new Set<string>();
    const deduped = members.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    if (!instructorArtistId) return deduped;
    const instructor = allArtists.find((a) => a.id === instructorArtistId);
    if (!instructor) return deduped;
    const rest = deduped.filter((m) => m.id !== instructorArtistId);
    return [instructor, ...rest];
  };
  const peekMembers: Artist[] = (() => {
    // imageArtists가 있으면 우선 사용 (실제 업로드 시 이미지별 작가 지정)
    if (work.imageArtists && work.imageArtists.length > 0) {
      const memberArtists = work.imageArtists
        .filter((ia) => ia.type === 'member' && ia.memberId)
        .map((ia) => allArtists.find((a: Artist) => a.id === ia.memberId))
        .filter((a): a is Artist => Boolean(a));
      return orderMembersWithInstructorFirst(memberArtists);
    }
    // fallback: owner memberIds에서 이미지 수만큼만
    const memberIds = groupOwnerData?.memberIds;
    if (memberIds && memberIds.length > 0) {
      const list = memberIds
        .map((mid: string) => allArtists.find((a: Artist) => a.id === mid))
        .filter((a: Artist | undefined): a is Artist => Boolean(a));
      if (list.length > 0) return orderMembersWithInstructorFirst(list);
    }
    const raw: Artist[] = [artist, ...(coOwners ?? [])];
    const groupId = groupOwnerData?.id;
    const filtered = groupId ? raw.filter((a) => a.id !== groupId) : raw;
    return orderMembersWithInstructorFirst(filtered);
  })();

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-sm bg-card ring-1 ring-foreground/[0.07] shadow-[0_2px_24px_-12px_rgba(35,32,40,0.2)] transition-shadow duration-300 lg:hover:shadow-[0_20px_48px_-28px_rgba(35,32,40,0.28)]"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
      onClick={onSelect}
    >
      {/* 정사각 뷰 + 화이트 매트 */}
      <div className="relative aspect-square w-full overflow-hidden bg-[oklch(0.96_0.012_85)]">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={imageSrc}
            alt={exhibitionLabel}
            className="h-full w-full min-h-0 min-w-0 object-contain object-center"
          />

        {/* Image count badge */}
        {showImageCountBadge && (
          <div className="absolute left-3 top-3 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              {imageCount}
            </div>
          </div>
        )}

        {/* Artier's Pick badge */}
        {isPick && (
          <div className="absolute left-3 bottom-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md backdrop-blur-sm">
              ★ Artier&apos;s Pick
            </span>
          </div>
        )}

        </div>
      </div>

      {/* Info */}
      <div className="px-3 pt-3 pb-4 sm:px-3.5 sm:pb-5 bg-card">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 min-w-0">
            {exhibitionLabel}
          </h3>
          {work.uploadedAt && (() => { const rel = formatRelativeShort(work.uploadedAt, t); return rel ? <span className="text-xs text-muted-foreground/60 shrink-0">{rel}</span> : null; })()}
        </div>

        {/* Artist row */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 min-w-0 w-full">
            {useGroupStyleRow ? (
              <BrowseArtistPeek
                coarse={coarsePointer}
                trigger={
                  <Button
                    variant="ghost"
                    type="button"
                    className="flex items-center gap-2 min-h-10 min-w-0 text-sm text-muted-foreground transition-none touch-manipulation rounded-md px-1 -mx-1 lg:hover:bg-transparent lg:hover:text-muted-foreground active:bg-transparent cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{truncateArtistName((groupName?.trim() || exhibitionLabel || '') as string)}</span>
                  </Button>
                }
              >
                <p className="text-sm font-semibold text-foreground px-1 mb-3">{t('browse.groupMembersLabel')}</p>
                {peekMembers.map((m) => (
                  <MemberRow
                    key={m.id}
                    artist={m}
                    isInstructor={m.id === instructorArtistId}
                    isFollowing={isFollowing(m.id)}
                    onToggleFollow={() => onToggleFollow(m.id)}
                    onNavigate={(id) => navigate(`/profile/${id}`)}
                  />
                ))}
                {nonMemberArtists.map((nm) => (
                  <MemberRow
                    key={`nm-${nm.displayName}`}
                    artist={{ id: `nm-${nm.displayName}`, name: nm.displayName as string, avatar: '', bio: '' }}
                    isRegistered={false}
                    isFollowing={false}
                    onToggleFollow={() => {}}
                    onNavigate={() => {}}
                  />
                ))}
              </BrowseArtistPeek>
            ) : hasCoOwnersNoGroup ? (
              <BrowseArtistPeek
                coarse={coarsePointer}
                trigger={
                  <Button
                    variant="ghost"
                    type="button"
                    className="flex items-center gap-2 min-h-10 min-w-0 text-sm text-muted-foreground transition-none touch-manipulation rounded-md px-1 -mx-1 lg:hover:bg-transparent lg:hover:text-muted-foreground active:bg-transparent cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{truncateArtistName(t('browse.groupArtistsLabel'))}</span>
                  </Button>
                }
              >
                <p className="text-sm font-semibold text-foreground px-1 mb-3">{t('browse.groupMembersLabel')}</p>
                {peekMembers.map((m) => (
                  <MemberRow
                    key={m.id}
                    artist={m}
                    isInstructor={m.id === instructorArtistId}
                    isFollowing={isFollowing(m.id)}
                    onToggleFollow={() => onToggleFollow(m.id)}
                    onNavigate={(id) => navigate(`/profile/${id}`)}
                  />
                ))}
                {nonMemberArtists.map((nm) => (
                  <MemberRow
                    key={`nm-${nm.displayName}`}
                    artist={{ id: `nm-${nm.displayName}`, name: nm.displayName as string, avatar: '', bio: '' }}
                    isRegistered={false}
                    isFollowing={false}
                    onToggleFollow={() => {}}
                    onNavigate={() => {}}
                  />
                ))}
              </BrowseArtistPeek>
            ) : (
              <Button
                variant="ghost"
                type="button"
                className="flex items-center gap-2 min-h-10 min-w-0 text-sm text-muted-foreground lg:hover:text-foreground active:text-foreground transition-colors touch-manipulation rounded-md px-1 -mx-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onArtistClick(artist.id);
                }}
              >
                {artist.avatar && (
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                  />
                )}
                <span>{truncateArtistName(artist.name)}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ===========================================================================
// MemberRow -- popover member row for group/co-owner works
// ===========================================================================
function MemberRow({
  artist,
  isRegistered = true,
  isInstructor = false,
  onNavigate,
  isFollowing,
  onToggleFollow,
}: {
  artist: Artist;
  isRegistered?: boolean;
  isInstructor?: boolean;
  onNavigate: (id: string) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const { t } = useI18n();

  if (!isRegistered) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {truncateArtistName(artist.name)}
          </p>
        </div>
      </div>
    );
  }

  const go = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onNavigate(artist.id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } }}
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer lg:hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
    >
      <img src={artist.avatar} alt={artist.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">
            {truncateArtistName(artist.name)}
          </p>
          {isInstructor && (
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {t('profile.instructorBadge')}
            </span>
          )}
        </div>
        {artist.bio && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{artist.bio}</p>
        )}
      </div>
      {artist.id !== allArtists[0].id && (
        <Button
          type="button"
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
          className="shrink-0 min-h-9 text-xs px-4 rounded-lg"
        >
          {isFollowing ? t('social.following') : t('social.follow')}
        </Button>
      )}
    </div>
  );
}
