import { useState, useMemo, useEffect, useCallback, useRef, type ReactElement, type ReactNode } from 'react';
import { Heart, Bookmark, ChevronRight, ChevronLeft, Image as ImageIcon, Users, MoreHorizontal, Flag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { artists, Work, Artist } from '../data';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { usePointerCoarse } from '../hooks/usePointerCoarse';
import { UserPlus } from 'lucide-react';
import { workStore, userInteractionStore, useInteractionStore, authStore, useAuthStore, followStore, useFollowStore, useProfileStore } from '../store';
import { groupWorks, type WorkOwner } from '../groupData';
import { imageUrls } from '../imageUrls';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { ReportModal } from '../components/ReportModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { CoachMark } from '../components/CoachMark';
import { getFirstImage, getImageCount } from '../utils/imageHelper';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { pointsOnBrowseDailyVisit } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import { AnimatePresence } from 'framer-motion';
import { orderWorksForBrowseFeed } from '../utils/feedOrdering';
import { loadSeenWorkIds, rememberSeenWork } from '../utils/seenFeedWorks';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';

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

  const promotionBanners = useMemo(
    () => [
      {
        id: 1,
        image:
          'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('browse.banner1Title'),
        subtitle: t('browse.banner1Subtitle'),
        tag: t('browse.bannerTagNew'),
      },
      {
        id: 2,
        image:
          'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('browse.banner2Title'),
        subtitle: t('browse.banner2Subtitle'),
        tag: t('browse.bannerTagHot'),
      },
      {
        id: 3,
        image:
          'https://images.unsplash.com/photo-1767706508363-b2a729df06fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMGV2ZW50JTIwcG9zdGVyfGVufDF8fHx8MTc3Mjc3MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('browse.banner3Title'),
        subtitle: t('browse.banner3Subtitle'),
        tag: t('browse.bannerTagEvent'),
      },
      {
        id: 4,
        image:
          'https://images.unsplash.com/photo-1549887534-1541e9326642?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        title: t('browse.banner4Title'),
        subtitle: t('browse.banner4Subtitle'),
        tag: t('browse.bannerTagPick'),
      },
      {
        id: 5,
        image:
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        title: t('browse.banner5Title'),
        subtitle: t('browse.banner5Subtitle'),
        tag: t('browse.bannerTagNew'),
      },
    ],
    [t],
  );

  // -- Stores ---------------------------------------------------------------
  const interactions = useInteractionStore();
  const auth = useAuthStore();
  const follows = useFollowStore();
  const profile = useProfileStore();
  const profileSig = `${profile.getProfile().nickname}|${profile.getProfile().name}`;
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
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
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  // -- Scroll position tracking for modal open/close -----------------------
  const scrollPosRef = useRef<number>(0);

  // -- Open modal from URL on mount (PRD: /exhibitions/:id 딥링크) ------------
  useEffect(() => {
    if (params.id && !selectedWork) {
      setSelectedWork(params.id);
    }
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

  const [feedEpoch, setFeedEpoch] = useState(0);

  const openWork = useCallback((workId: string) => {
    rememberSeenWork(workId);
    setFeedEpoch((e) => e + 1);
    scrollPosRef.current = window.scrollY;
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

  // -- Banner controls ------------------------------------------------------
  const nextBanner = useCallback(
    () => setCurrentBanner((p) => (p + 1) % promotionBanners.length),
    [promotionBanners.length],
  );
  const prevBanner = useCallback(
    () => setCurrentBanner((p) => (p - 1 + promotionBanners.length) % promotionBanners.length),
    [promotionBanners.length],
  );

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextBanner, 5000);
    return () => clearInterval(timer);
  }, [nextBanner]);

  // -- Combine + PRD 근사 피드 순서(Pick → 신규 → 가중) + 시청 이력 반영 -------
  const allWorks = useMemo(() => {
    const enhancedGroupWorks = groupWorks.map((work) => {
      if (work.owner && work.owner.type === 'group') {
        const groupData = work.owner.data;
        return { ...work, groupName: groupData.name };
      }
      return work;
    });
    const combined = [...works, ...enhancedGroupWorks] as Work[];
    const seen = loadSeenWorkIds();
    return orderWorksForBrowseFeed(combined, seen);
  }, [works, feedEpoch]);

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
      return visibleWorks.filter(
        (w) => !isGroupWork(w) || w.showInSoloTab === true,
      );
    }
    // group
    return visibleWorks.filter((w) => isGroupWork(w));
  }, [allWorks, activeCategory, hiddenWorkIds]);

  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE_SIZE);
  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE_SIZE);
  }, [activeCategory, filteredWorks.length]);

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
    <div className="min-h-screen bg-background">
      {/* ----------------------------------------------------------------- */}
      {/* HERO BANNER CAROUSEL                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-background">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6">
          <div className="relative group">
            <div className="overflow-hidden rounded-xl sm:rounded-2xl ring-1 ring-black/[0.07] shadow-md">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {promotionBanners.map((banner) => (
                  <div key={banner.id} className="w-full shrink-0 relative cursor-pointer">
                    <div className="relative h-[160px] sm:h-[220px] lg:h-[280px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 lg:px-12">
                        <div className="max-w-[600px]">
                          {banner.tag && (
                            <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider text-white bg-primary rounded-full mb-1.5 sm:mb-2">
                              {banner.tag}
                            </span>
                          )}
                          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-[13px] sm:text-sm text-white/90 font-normal hidden sm:block">
                            {banner.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next */}
            <Button
              variant="ghost"
              onClick={prevBanner}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-white/90 lg:hover:bg-white rounded-full shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B]" />
            </Button>
            <Button
              variant="ghost"
              onClick={nextBanner}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-white/90 lg:hover:bg-white rounded-full shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B]" />
            </Button>

            <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5">
              {promotionBanners.map((_, i) => (
                <Button
                  variant="ghost"
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`h-[5px] sm:h-1.5 rounded-full transition-all ${
                    currentBanner === i
                      ? 'w-4 sm:w-5 bg-white'
                      : 'w-[5px] sm:w-1.5 bg-white/50 lg:hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* CATEGORY FILTER TABS                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="sticky top-[53px] sm:top-[65px] z-40 bg-background/88 backdrop-blur-md border-b border-border/70 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex h-11 sm:h-12 max-w-[1440px] items-center px-4 sm:px-6 gap-1.5 sm:gap-2">
          {categories.map((cat) => (
            <Button
              variant="ghost"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-medium transition-all border ${
                activeCategory === cat.id
                  ? 'border-primary text-primary bg-primary/10 shadow-sm'
                  : 'border-border text-muted-foreground bg-card/80 lg:hover:border-primary/30 lg:hover:text-foreground'
              }`}
            >
              {cat.label}
            </Button>
          ))}

          <span className="ml-auto text-xs sm:text-sm text-muted-foreground tabular-nums">
            {filteredWorks.length}
            {t('browse.itemsCountSuffix')}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* WORK GRID (정사각 셀 · 프로필과 동일 object-contain)                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8">
        {filteredWorks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border bg-muted/20">
            <p className="text-base text-muted-foreground mb-2">{t('browse.emptyTitle')}</p>
            <p className="text-[13px] text-muted-foreground/80">{t('browse.emptyHint')}</p>
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
                isLiked={interactions.isLiked(work.id)}
                isSaved={interactions.isSaved(work.id)}
                onToggleLike={(id) => {
                  if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                  userInteractionStore.toggleLike(id);
                  const delta = userInteractionStore.isLiked(id) ? 1 : -1;
                  workStore.updateWork(id, { likes: (workStore.getWork(id)?.likes ?? 0) + delta });
                }}
                onToggleSave={(id) => {
                  if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                  userInteractionStore.toggleSave(id);
                  const delta = userInteractionStore.isSaved(id) ? 1 : -1;
                  workStore.updateWork(id, { saves: (workStore.getWork(id)?.saves ?? 0) + delta });
                }}
                isFollowing={(artistId) => follows.isFollowing(artistId)}
                onToggleFollow={(artistId) => {
                  if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                  followStore.toggle(artistId);
                }}
                onReport={(w) => {
                  if (!auth.isLoggedIn()) {
                    setLoginPromptOpen(true);
                    return;
                  }
                  setReportWorkId(w.id);
                }}
              />
            ))}
            {displayedWorks.length < filteredWorks.length && (
              <div
                ref={feedSentinelRef}
                className="col-span-full w-full min-h-[120px] flex items-center justify-center py-6"
                aria-hidden
              />
            )}
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
              setFeedEpoch((e) => e + 1);
              setSelectedWork(newWorkId);
              window.history.replaceState({ workId: newWorkId }, '', `/exhibitions/${newWorkId}`);
            }}
            allWorks={filteredWorks}
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

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
      <CoachMark id="browse" />
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
      <HoverCardContent className="w-72 p-3 z-[60]" onClick={(e) => e.stopPropagation()}>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}

// ===========================================================================
// WorkCard -- clean, simple design with large text for 50s audience
// ===========================================================================
interface WorkCardProps {
  work: Work;
  index: number;
  onSelect: () => void;
  onArtistClick: (artistId: string) => void;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  isFollowing: (artistId: string) => boolean;
  onToggleFollow: (artistId: string) => void;
  onReport: (work: Work) => void;
}

function WorkCard({ work, index, onSelect, onArtistClick, isLiked, isSaved, onToggleLike, onToggleSave, isFollowing, onToggleFollow, onReport }: WorkCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const coarsePointer = usePointerCoarse();
  const artist = work.artist;
  const likes = work.likes ?? 0;
  const saves = work.saves ?? 0;
  const groupName = work.groupName;
  const coOwners = work.coOwners;
  const hasCoOwnersNoGroup = !groupName && coOwners && coOwners.length > 0;
  const imageSrc = resolveImage(getFirstImage(work.image));
  const imageCount = getImageCount(work.image);

  return (
    <div
      className="group overflow-hidden cursor-pointer"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
      onClick={onSelect}
    >
      {/* Image — 프로필과 동일: 정사각 영역 + 비율 유지 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-white">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
          <ImageWithFallback
            src={imageSrc}
            alt={work.title}
            className="h-full w-full min-h-0 min-w-0 object-contain object-center"
          />

        {/* Image count badge */}
        {imageCount > 1 && (
          <div className="absolute left-3 top-3 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              {imageCount}
            </div>
          </div>
        )}

        {/* Like & Save buttons — touch: always visible / hover device: show on hover */}
        <div className="absolute inset-0 hover-overlay-bg z-10 pointer-events-none">
          <div className="absolute top-2 right-2 flex gap-1.5 hover-action pointer-events-auto">
            <Button
              variant="ghost"
              type="button"
              className={`h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 rounded-full flex items-center justify-center transition-transform active:scale-95 touch-manipulation shrink-0 lg:hover:!bg-inherit ${
                isLiked
                  ? 'bg-red-500 text-white active:bg-red-600 lg:hover:!bg-red-500'
                  : 'bg-white/90 text-[#18181B] shadow-sm active:bg-white lg:hover:!bg-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(work.id);
              }}
            >
              <Heart className={`h-4 w-4 pointer-coarse:h-5 pointer-coarse:w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              type="button"
              className={`h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 rounded-full flex items-center justify-center transition-transform active:scale-95 touch-manipulation shrink-0 lg:hover:!bg-inherit ${
                isSaved
                  ? 'bg-primary text-primary-foreground active:bg-primary/90 lg:hover:!bg-primary'
                  : 'bg-white/90 text-[#18181B] shadow-sm active:bg-white lg:hover:!bg-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(work.id);
              }}
            >
              <Bookmark className={`h-4 w-4 pointer-coarse:h-5 pointer-coarse:w-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 rounded-full flex items-center justify-center bg-white/90 text-[#18181B] shadow-sm active:bg-white lg:hover:!bg-white transition-transform active:scale-95 touch-manipulation shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('browse.workCardMore')}
                >
                  <MoreHorizontal className="h-4 w-4 pointer-coarse:h-5 pointer-coarse:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[60]" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={() => {
                    onReport(work);
                  }}
                >
                  <Flag className="h-4 w-4 text-red-500 shrink-0" />
                  {t('workDetail.report')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        </div>
      </div>

      {/* Info section */}
      <div className="pt-2.5 pb-4 sm:pb-6">
        {/* Title */}
        <h3 className="text-sm font-medium text-[#18181B] leading-snug mb-1.5 line-clamp-2">
          {work.title}
        </h3>

        {/* Artist row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {groupName ? (
              <BrowseArtistPeek
                coarse={coarsePointer}
                trigger={
                  <Button
                    variant="ghost"
                    type="button"
                    className="flex items-center gap-2 min-h-10 min-w-0 max-w-full text-[13px] text-[#696969] lg:hover:text-[#18181B] active:text-[#18181B] transition-colors truncate touch-manipulation rounded-md px-1 -mx-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">{groupName}</span>
                  </Button>
                }
              >
                <p className="text-xs text-muted-foreground px-1 mb-2">{t('browse.artistLabel')}</p>
                <MemberRow artist={artist} isFollowing={isFollowing(artist.id)} onToggleFollow={() => onToggleFollow(artist.id)} onNavigate={(id) => navigate(`/profile/${id}`)} />
                {coOwners?.map((co) => (
                  <MemberRow key={co.id} artist={co} isFollowing={isFollowing(co.id)} onToggleFollow={() => onToggleFollow(co.id)} onNavigate={(id) => navigate(`/profile/${id}`)} />
                ))}
              </BrowseArtistPeek>
            ) : hasCoOwnersNoGroup ? (
              <BrowseArtistPeek
                coarse={coarsePointer}
                trigger={
                  <Button
                    variant="ghost"
                    type="button"
                    className="flex items-center gap-2 min-h-10 min-w-0 max-w-full text-[13px] text-[#696969] lg:hover:text-[#18181B] active:text-[#18181B] transition-colors truncate touch-manipulation rounded-md px-1 -mx-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t('browse.groupArtistsLabel')}</span>
                  </Button>
                }
              >
                <p className="text-xs text-muted-foreground px-1 mb-2">{t('browse.artistLabel')}</p>
                <MemberRow artist={artist} isFollowing={isFollowing(artist.id)} onToggleFollow={() => onToggleFollow(artist.id)} onNavigate={(id) => navigate(`/profile/${id}`)} />
                {coOwners.map((co) => (
                  <MemberRow key={co.id} artist={co} isFollowing={isFollowing(co.id)} onToggleFollow={() => onToggleFollow(co.id)} onNavigate={(id) => navigate(`/profile/${id}`)} />
                ))}
              </BrowseArtistPeek>
            ) : (
              <Button
                variant="ghost"
                type="button"
                className="flex items-center gap-2 min-h-10 min-w-0 max-w-full text-[13px] text-[#696969] lg:hover:text-[#18181B] active:text-[#18181B] transition-colors truncate touch-manipulation rounded-md px-1 -mx-1"
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
                <span className="truncate">{artist.name}</span>
              </Button>
            )}
          </div>

          {/* Like & save counts */}
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <Button
              variant="ghost"
              type="button"
              className={`min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2 -mr-1 text-[13px] transition-colors touch-manipulation active:opacity-70 rounded-md ${isLiked ? 'text-red-500' : 'text-[#888] lg:hover:text-red-400'}`}
              onClick={(e) => { e.stopPropagation(); onToggleLike(work.id); }}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
            </Button>
            <Button
              variant="ghost"
              type="button"
              className={`min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2 -mr-1 text-[13px] transition-colors touch-manipulation active:opacity-70 rounded-md ${isSaved ? 'text-primary' : 'text-[#888] lg:hover:text-foreground'}`}
              onClick={(e) => { e.stopPropagation(); onToggleSave(work.id); }}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{saves >= 1000 ? `${(saves / 1000).toFixed(1)}k` : saves}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MemberRow -- popover member row for group/co-owner works
// ===========================================================================
function MemberRow({ artist, onNavigate, isFollowing, onToggleFollow }: { artist: Artist; onNavigate: (id: string) => void; isFollowing: boolean; onToggleFollow: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg lg:hover:bg-[#FAFAFA] active:bg-[#F4F4F5] transition-colors touch-manipulation">
      <img src={artist.avatar} alt={artist.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
      <Button
        variant="ghost"
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(artist.id); }}
        className="flex-1 min-h-10 text-sm font-medium text-[#18181B] truncate text-left lg:hover:underline active:opacity-80"
      >
        {artist.name}
      </Button>
      <Button
        type="button"
        variant={isFollowing ? 'secondary' : 'outline'}
        onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
        className={`min-h-9 flex items-center gap-1 text-xs px-3 py-2 sm:py-1.5 rounded-lg transition-colors touch-manipulation active:scale-[0.98] ${
          isFollowing ? 'border-0 bg-zinc-200/90 text-zinc-800 lg:hover:bg-zinc-300/90' : ''
        }`}
      >
        <UserPlus className="h-3 w-3" />
        {isFollowing ? t('social.following') : t('social.follow')}
      </Button>
    </div>
  );
}
