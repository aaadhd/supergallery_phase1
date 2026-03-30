import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Heart, ChevronRight, ChevronLeft, Image as ImageIcon, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { artists, Work, Artist } from '../data';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/ui/hover-card';
import { UserPlus } from 'lucide-react';
import { workStore } from '../store';
import { groupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { getFirstImage, getImageCount } from '../utils/imageHelper';

// ---------------------------------------------------------------------------
// Categories -- Phase 1 MVP: 전체 / 개인전시 / 공동전시
// ---------------------------------------------------------------------------
const categories = [
  { id: 'all', label: '전체' },
  { id: 'individual', label: '개인전시' },
  { id: 'group', label: '공동전시' },
] as const;

// ---------------------------------------------------------------------------
// Promotion banners (max 3)
// ---------------------------------------------------------------------------
const promotionBanners = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    title: '봄맞이 특별 전시',
    subtitle: '국내 작가 100인의 신작 공개',
    tag: 'NEW',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '디지털 아트 기획전',
    subtitle: '인기 작가들의 디지털 아트 모음',
    tag: 'HOT',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1767706508363-b2a729df06fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMGV2ZW50JTIwcG9zdGVyfGVufDF8fHx8MTc3Mjc3MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: '신인 작가 지원 프로그램',
    subtitle: '당신의 작품을 세상에 선보이세요',
    tag: 'EVENT',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve an image key through the imageUrls map, falling back to the raw key. */
function resolveImage(key: string): string {
  return imageUrls[key] || key;
}

/** Fisher-Yates shuffle (returns new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Browse() {
  const navigate = useNavigate();
  const params = useParams();

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

  // -- Open modal from URL on mount (direct link /works/:id) ---------------
  useEffect(() => {
    if (params.id && !selectedWork) {
      setSelectedWork(params.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Browser back/forward handling for modal URL -------------------------
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/works\/(.+)$/);
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

  const openWork = useCallback((workId: string) => {
    scrollPosRef.current = window.scrollY;
    setSelectedWork(workId);
    window.history.pushState({ workId }, '', `/works/${workId}`);
  }, []);

  const closeWork = useCallback(() => {
    setSelectedWork(null);
    if (window.location.pathname.startsWith('/works/')) {
      window.history.pushState(null, '', '/');
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }, []);

  // -- "Previously seen" tracking for random feed ---------------------------
  const seenIdsRef = useRef<Set<string>>(new Set());

  // -- Banner controls ------------------------------------------------------
  const nextBanner = useCallback(
    () => setCurrentBanner((p) => (p + 1) % promotionBanners.length),
    [],
  );
  const prevBanner = useCallback(
    () => setCurrentBanner((p) => (p - 1 + promotionBanners.length) % promotionBanners.length),
    [],
  );

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextBanner, 5000);
    return () => clearInterval(timer);
  }, [nextBanner]);

  // -- Combine individual + group works & shuffle once ----------------------
  const allWorks = useMemo(() => {
    const enhancedGroupWorks = groupWorks.map((work) => {
      if (work.owner && work.owner.type === 'group') {
        const groupData = work.owner.data;
        return { ...work, groupName: groupData.name };
      }
      return work;
    });
    const combined = [...works, ...enhancedGroupWorks];

    // Prioritise unseen works, then append seen ones at the end
    const unseen = combined.filter((w) => !seenIdsRef.current.has(w.id));
    const seen = combined.filter((w) => seenIdsRef.current.has(w.id));
    const ordered = [...shuffle(unseen), ...shuffle(seen)];

    // Track newly shown works
    ordered.forEach((w) => seenIdsRef.current.add(w.id));
    return ordered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works]);

  // -- Category filtering ---------------------------------------------------
  const filteredWorks = useMemo(() => {
    if (activeCategory === 'all') return allWorks;
    if (activeCategory === 'individual') {
      return allWorks.filter(
        (w) => !(w as any).owner || (w as any).owner.type === 'individual',
      );
    }
    // group
    return allWorks.filter(
      (w) => (w as any).owner && (w as any).owner.type === 'group',
    );
  }, [allWorks, activeCategory]);

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ----------------------------------------------------------------- */}
      {/* HERO BANNER CAROUSEL                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1440px] px-6 py-8">
          <div className="relative group">
            {/* Slider */}
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {promotionBanners.map((banner) => (
                  <div key={banner.id} className="w-full shrink-0 relative cursor-pointer">
                    <div className="relative h-[280px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                      {/* Text */}
                      <div className="absolute inset-0 flex flex-col justify-center px-12">
                        <div className="max-w-[600px]">
                          {banner.tag && (
                            <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-white bg-[#0057FF] rounded-full mb-3">
                              {banner.tag}
                            </span>
                          )}
                          <h2 className="text-[32px] font-bold text-white mb-2 leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-base text-white/90 font-normal">
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
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5 text-[#191919]" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5 text-[#191919]" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {promotionBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`h-2 rounded-full transition-all ${
                    currentBanner === i
                      ? 'w-7 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/70'
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
      <div className="sticky top-[65px] z-40 border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center px-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-base font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#191919] text-white shadow-sm'
                  : 'bg-[#F3F3F3] text-[#191919] hover:bg-[#E8E8E8]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Work count */}
          <span className="ml-auto text-sm text-[#999]">
            {filteredWorks.length}개의 작품
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MASONRY-STYLE WORK GRID                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        {filteredWorks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg text-[#999] mb-2">표시할 작품이 없습니다</p>
            <p className="text-sm text-[#bbb]">다른 카테고리를 선택해 보세요</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
            {filteredWorks.map((work, idx) => (
              <WorkCard
                key={work.id}
                work={work}
                index={idx}
                onSelect={() => openWork(work.id)}
                onArtistClick={(artistId) => navigate(`/profile/${artistId}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* WORK DETAIL MODAL                                                 */}
      {/* ----------------------------------------------------------------- */}
      {selectedWork !== null && (
        <WorkDetailModal
          workId={selectedWork}
          onClose={closeWork}
          onNavigate={(newWorkId) => {
            setSelectedWork(newWorkId);
            window.history.replaceState({ workId: newWorkId }, '', `/works/${newWorkId}`);
          }}
          allWorks={filteredWorks}
        />
      )}
    </div>
  );
}

// ===========================================================================
// WorkCard -- clean, simple design with large text for 50s audience
// ===========================================================================
interface WorkCardProps {
  work: any;
  index: number;
  onSelect: () => void;
  onArtistClick: (artistId: string) => void;
}

function WorkCard({ work, index, onSelect, onArtistClick }: WorkCardProps) {
  const navigate = useNavigate();
  const artist = work.artist;
  const likes = work.likes ?? 0;
  const groupName = (work as any).groupName;
  const coOwners = (work as any).coOwners as Artist[] | undefined;
  const hasCoOwnersNoGroup = !groupName && coOwners && coOwners.length > 0;
  const imageSrc = resolveImage(getFirstImage(work.image));
  const imageCount = getImageCount(work.image);

  return (
    <div
      className="break-inside-avoid group bg-white rounded-2xl overflow-hidden border border-[#E0E0E0] shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden">
        <ImageWithFallback
          src={imageSrc}
          alt={work.title}
          className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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

        {/* Hover overlay with like button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="absolute top-3 right-3">
            <button
              className="h-10 w-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center text-[#191919] transition-colors shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: like toggle action
              }}
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-[17px] font-semibold text-[#191919] leading-snug mb-3 line-clamp-2">
          {work.title}
        </h3>

        {/* Artist row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {groupName ? (
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    className="flex items-center gap-2 text-[15px] text-[#696969] hover:text-[#191919] transition-colors truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{groupName}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground px-1 mb-2">참여 작가</p>
                  <MemberRow artist={artist} onNavigate={(id) => navigate(`/profile/${id}`)} />
                  {coOwners?.map((co) => (
                    <MemberRow key={co.id} artist={co} onNavigate={(id) => navigate(`/profile/${id}`)} />
                  ))}
                </HoverCardContent>
              </HoverCard>
            ) : hasCoOwnersNoGroup ? (
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    className="flex items-center gap-2 text-[15px] text-[#696969] hover:text-[#191919] transition-colors truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Users className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">여러 작업자</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground px-1 mb-2">참여 작가</p>
                  <MemberRow artist={artist} onNavigate={(id) => navigate(`/profile/${id}`)} />
                  {coOwners.map((co) => (
                    <MemberRow key={co.id} artist={co} onNavigate={(id) => navigate(`/profile/${id}`)} />
                  ))}
                </HoverCardContent>
              </HoverCard>
            ) : (
              <button
                className="flex items-center gap-2 text-[15px] text-[#696969] hover:text-[#191919] transition-colors truncate"
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
              </button>
            )}
          </div>

          {/* Like count */}
          <div className="flex items-center gap-1.5 text-[15px] text-[#888] shrink-0 ml-2">
            <Heart className="h-[18px] w-[18px]" />
            <span>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MemberRow -- popover member row for group/co-owner works
// ===========================================================================
function MemberRow({ artist, onNavigate }: { artist: Artist; onNavigate: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <img src={artist.avatar} alt={artist.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
      <span className="flex-1 text-sm font-medium text-[#191919] truncate">{artist.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(artist.id); }}
        className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <UserPlus className="h-3 w-3" />
        팔로우
      </button>
    </div>
  );
}
