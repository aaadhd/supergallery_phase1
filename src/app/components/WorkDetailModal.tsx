import { X, Heart, Bookmark, Share2, ChevronLeft, ChevronRight, UserPlus, Users } from 'lucide-react';
import { Work, Artist, works, artists } from '../data';
import { groupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { getFirstImage } from '../utils/imageHelper';
import { userInteractionStore, workStore } from '../store';
import { CopyrightProtectedImage } from './work';
import { toast } from 'sonner';

interface WorkDetailModalProps {
  workId: string;
  onClose: () => void;
  onNavigate?: (workId: string) => void;
  allWorks?: Work[];
}

export function WorkDetailModal({ workId, onClose, onNavigate, allWorks: providedWorks }: WorkDetailModalProps) {
  const defaultWorks = [...works, ...groupWorks];
  const allWorks = providedWorks || defaultWorks;
  const work = allWorks.find(w => w.id === workId);

  const [isLiked, setIsLiked] = useState(() => userInteractionStore.isLiked(workId));
  const [isSaved, setIsSaved] = useState(() => userInteractionStore.isSaved(workId));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when workId changes
  useEffect(() => {
    setIsLiked(userInteractionStore.isLiked(workId));
    setIsSaved(userInteractionStore.isSaved(workId));
    setIsZoomed(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [workId]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!work) return null;

  const images = Array.isArray(work.image) ? work.image : [work.image];
  const totalImages = images.length;

  const currentIndex = allWorks.findIndex(w => w.id === workId);
  const prevWork = currentIndex > 0 ? allWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < allWorks.length - 1 ? allWorks[currentIndex + 1] : null;

  const relatedWorks = allWorks
    .filter(w => w.artistId === work.artistId && w.id !== work.id)
    .slice(0, 8);

  // Simple click-to-zoom toggle
  const handleZoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsZoomed(false);
      setZoomOrigin('center center');
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin(`${x}% ${y}%`);
      setIsZoomed(true);
    }
  };

  const handleLike = () => {
    userInteractionStore.toggleLike(workId);
    const newLiked = !isLiked;
    workStore.updateWork(workId, {
      likes: newLiked ? (work.likes || 0) + 1 : Math.max(0, (work.likes || 0) - 1),
    });
    setIsLiked(newLiked);
  };

  const handleSave = () => {
    userInteractionStore.toggleSave(workId);
    const newSaved = !isSaved;
    workStore.updateWork(workId, {
      saves: newSaved ? (work.saves || 0) + 1 : Math.max(0, (work.saves || 0) - 1),
    });
    setIsSaved(newSaved);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('링크가 복사되었습니다');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col w-full px-6 sm:px-16 pt-[40px]">

          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
            aria-label="닫기"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Header: artist info + follow */}
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                <AvatarFallback className="text-lg">{work.artist.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h2 className="text-white text-[20px] font-bold leading-tight">{work.title}</h2>
                <span className="hidden sm:inline text-white/50">·</span>
                <span className="text-white/80 text-[16px]">{work.artist.name}</span>
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[15px] font-medium transition-colors min-h-[44px] ${
                isFollowing
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white text-[#191919] hover:bg-white/90'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              {isFollowing ? '팔로잉' : '팔로우'}
            </button>
          </div>

          {/* Scrollable image + info area */}
          <div
            ref={scrollContainerRef}
            className="relative w-full h-[calc(100vh-112px)] bg-black overflow-auto scroll-smooth flex flex-col items-center"
            onClick={(e) => {
              e.stopPropagation();
              if (isZoomed) { setIsZoomed(false); setZoomOrigin('center center'); }
            }}
          >
            {/* Images */}
            <div className={`w-full py-8 space-y-8 ${totalImages === 1 ? 'flex flex-col items-center justify-center min-h-full' : ''}`}>
              {images.map((image, index) => (
                <div key={index} className="relative w-full flex items-center justify-center px-8">
                  <div className="relative max-w-[900px] w-full">
                    <div
                      className={`relative transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={handleZoomClick}
                      style={{
                        transform: `scale(${isZoomed ? 2.5 : 1})`,
                        transformOrigin: isZoomed ? zoomOrigin : 'top center',
                      }}
                    >
                      <CopyrightProtectedImage
                        src={imageUrls[image] || image}
                        alt={`${work.title}${totalImages > 1 ? ` - ${index + 1}` : ''}`}
                        watermarkText={`\u00A9 ${work.artist.name} · ${work.title}`}
                        showWatermark
                        preventRightClick
                        preventDrag
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                  {/* Image index indicator */}
                  {totalImages > 1 && (
                    <div className="absolute top-4 right-12 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-white text-[13px] font-medium">{index + 1}/{totalImages}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Work info section */}
            <div className="max-w-[900px] w-full mx-auto px-8 py-8">
              {/* Description */}
              {work.description && (
                <p className="text-white/85 text-[16px] leading-relaxed mb-6">{work.description}</p>
              )}

              {/* Category */}
              {work.category && (
                <div className="mb-4">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 text-white/70 text-[14px]">
                    {work.category}
                  </span>
                </div>
              )}

              {/* Tags */}
              {work.tags && work.tags.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {work.tags.map((tag) => (
                    <span key={tag} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-[14px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Co-owner / group / instructor badges */}
              <CoOwnerSection work={work} />
            </div>

            {/* Artist profile card */}
            <div className="max-w-[900px] w-full mx-auto px-8 py-8">
              {work.coOwners && work.coOwners.length > 0 ? (
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8">
                  {work.groupName && (
                    <div className="text-center mb-8 pb-6 border-b border-white/10">
                      <h3 className="text-[22px] font-bold text-white mb-2">{work.groupName}</h3>
                      <p className="text-[14px] text-white/70">참여 작가 {work.coOwners.length + 1}명</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <ArtistRow artist={work.artist} />
                    {work.coOwners.map((coOwner) => (
                      <ArtistRow key={coOwner.id} artist={coOwner} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-10 text-center">
                  <div className="mb-5 flex justify-center">
                    <Avatar className="h-20 w-20 border-2 border-white/20">
                      <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                      <AvatarFallback className="text-[24px] font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="mb-2 text-[20px] font-semibold text-white">{work.artist.name}</h3>
                  {work.artist.bio && (
                    <p className="mb-5 text-[14px] text-white/70">{work.artist.bio}</p>
                  )}
                </div>
              )}
            </div>

            {/* Related works */}
            {relatedWorks.length > 0 && (
              <div className="max-w-[900px] w-full mx-auto px-8 pb-12">
                <h2 className="text-[20px] font-semibold text-white mb-6">모든 작업 목록</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {relatedWorks.slice(0, 8).map((rw) => (
                    <button
                      key={rw.id}
                      onClick={(e) => { e.stopPropagation(); onNavigate?.(rw.id); }}
                      className="group cursor-pointer text-left"
                    >
                      <div className="relative mb-3 overflow-hidden rounded-xl bg-white/5 border border-white/10 aspect-square flex items-center justify-center">
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(rw.image)] || getFirstImage(rw.image)}
                          alt={rw.title}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-[15px] font-medium text-white group-hover:text-[#00BFA5] transition-colors mb-1 truncate">
                        {rw.title}
                      </div>
                      <div className="text-[13px] text-white/60">{work.artist.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prev/next work navigation */}
          {prevWork && (
            <button
              onClick={() => onNavigate?.(prevWork.id)}
              className="fixed bottom-5 left-5 flex flex-col items-center gap-1 z-50"
              aria-label="이전 작품"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-7 w-7" />
              </div>
              <span className="text-white text-[13px]">이전</span>
            </button>
          )}
          {nextWork && (
            <button
              onClick={() => onNavigate?.(nextWork.id)}
              className="fixed bottom-5 right-5 flex flex-col items-center gap-1 z-50"
              aria-label="다음 작품"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronRight className="h-7 w-7" />
              </div>
              <span className="text-white text-[13px]">다음</span>
            </button>
          )}

          {/* Right-side action buttons */}
          <div className="fixed top-1/2 -translate-y-1/2 right-5 flex flex-col items-center gap-5 z-50">
            {/* Follow (avatar) */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className="flex flex-col items-center gap-1.5"
              aria-label={isFollowing ? '팔로잉' : '팔로우'}
            >
              <div className="relative flex h-12 w-12 items-center justify-center">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                  <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
                </Avatar>
                {isFollowing && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF] border-2 border-black">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-[12px] text-white">{work.artist.name}</span>
            </button>

            {/* Like */}
            <button onClick={handleLike} className="flex flex-col items-center gap-1.5" aria-label="좋아요">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                isLiked ? 'bg-[#FF2E63]' : 'bg-white/10 hover:bg-white/20'
              }`}>
                <Heart className={`h-5 w-5 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-[12px] text-white">좋아요</span>
              <span className="text-[11px] text-white/70">{(work.likes || 0).toLocaleString()}</span>
            </button>

            {/* Save / Bookmark */}
            <button onClick={handleSave} className="flex flex-col items-center gap-1.5" aria-label="저장">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                isSaved ? 'bg-white' : 'bg-white/10 hover:bg-white/20'
              }`}>
                <Bookmark className={`h-5 w-5 ${isSaved ? 'text-[#191919] fill-[#191919]' : 'text-white'}`} />
              </div>
              <span className="text-[12px] text-white">저장</span>
            </button>

            {/* Share */}
            <button onClick={handleShare} className="flex flex-col items-center gap-1.5 mt-2" aria-label="공유">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-[12px] text-white">공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Co-owner / Instructor / Group badges                              */
/* ------------------------------------------------------------------ */
function CoOwnerSection({ work }: { work: Work }) {
  const hasGroup = !!work.groupName;
  const hasCoOwners = work.coOwners && work.coOwners.length > 0;
  const isInstructor = (work as any).isInstructorUpload === true;
  const taggedEmails = (work as any).taggedEmails as string[] | undefined;

  if (!hasGroup && !hasCoOwners && !isInstructor && !taggedEmails?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {hasGroup && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BFA5]/15 text-[#00BFA5] text-[14px] font-medium">
          <Users className="h-4 w-4" />
          {work.groupName}
        </span>
      )}
      {hasCoOwners && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/80 text-[14px]">
          <Users className="h-4 w-4" />
          공동 작업 · {work.coOwners!.map(c => c.name).join(', ')}
        </span>
      )}
      {isInstructor && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/15 text-amber-400 text-[14px] font-medium">
          강사 업로드
        </span>
      )}
      {taggedEmails && taggedEmails.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/60 text-[14px]">
          참여: {taggedEmails.join(', ')}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable artist row for group works                               */
/* ------------------------------------------------------------------ */
function ArtistRow({ artist }: { artist: Artist }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <Avatar className="h-14 w-14 border-2 border-white/20">
        <AvatarImage src={artist.avatar} alt={artist.name} />
        <AvatarFallback className="text-[18px] font-semibold bg-white/10 text-white">{artist.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="text-[16px] font-semibold text-white mb-1 truncate">{artist.name}</h4>
        {artist.bio && <p className="text-[14px] text-white/60 truncate">{artist.bio}</p>}
      </div>
      <button className="flex items-center gap-1.5 h-10 px-5 text-[14px] border border-white/20 text-white hover:bg-white/10 rounded-lg transition-colors min-h-[44px]">
        <UserPlus className="h-3.5 w-3.5" />
        팔로우
      </button>
    </div>
  );
}
