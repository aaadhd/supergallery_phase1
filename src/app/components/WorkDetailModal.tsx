import { motion } from 'framer-motion';
import { X, Heart, Bookmark, Share2, ChevronLeft, ChevronRight, UserPlus, Users, Link2, MessageCircle, Flag, Mail } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { Work, Artist, works, artists } from '../data';
import { groupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirstImage } from '../utils/imageHelper';
import { userInteractionStore, workStore, authStore, followStore, useFollowStore } from '../store';
import { CopyrightProtectedImage } from './work';
import { toast } from 'sonner';
import { LoginPromptModal } from './LoginPromptModal';
import { ReportModal } from './ReportModal';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import DeepZoomViewer from './DeepZoomViewer';
import { Button } from './ui/button';

interface WorkDetailModalProps {
  workId: string;
  onClose: () => void;
  onNavigate?: (workId: string) => void;
  allWorks?: Work[];
  /** 신고 접수 후 부모(예: 둘러보기)에서 피드 숨김 목록을 갱신할 때 */
  onWorkReported?: () => void;
}

export function WorkDetailModal({ workId, onClose, onNavigate, allWorks: providedWorks, onWorkReported }: WorkDetailModalProps) {
  const { t } = useI18n();
  // groupWorks는 owner·saleOptions 등 확장 필드가 있어 시드 Work와 합쳐도 UI는 동일 필드만 사용
  const defaultWorks = [...works, ...groupWorks] as Work[];
  const allWorks = providedWorks || defaultWorks;
  const work = allWorks.find(w => w.id === workId);

  const [isLiked, setIsLiked] = useState(() => userInteractionStore.isLiked(workId));
  const [isSaved, setIsSaved] = useState(() => userInteractionStore.isSaved(workId));
  const follows = useFollowStore();
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [deepZoomSrc, setDeepZoomSrc] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleArtistClick = (artistId: string) => {
    onClose();
    navigate(`/profile/${artistId}`);
  };

  const requireAuth = (action: () => void) => {
    if (!authStore.isLoggedIn()) {
      setShowLoginPrompt(true);
      return;
    }
    action();
  };

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

  const isPick = work.editorsPick === true || work.pick === true;
  const hasCoOwners = !!work.coOwners?.length;
  const groupName = work.groupName;
  const isGroupWork = !!groupName || hasCoOwners;
  const displayArtistName = groupName ? groupName : work.artist.name;

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
    const nowLiked = userInteractionStore.isLiked(workId);
    const currentLikes = workStore.getWork(workId)?.likes ?? work.likes ?? 0;
    workStore.updateWork(workId, {
      likes: nowLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    });
    setIsLiked(nowLiked);
  };

  const handleSave = () => {
    userInteractionStore.toggleSave(workId);
    const nowSaved = userInteractionStore.isSaved(workId);
    const currentSaves = workStore.getWork(workId)?.saves ?? work.saves ?? 0;
    workStore.updateWork(workId, {
      saves: nowSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1),
    });
    setIsSaved(nowSaved);
  };

  const workShareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/exhibitions/${workId}`;

  const buildInvitationCardText = () => {
    if (!work) return '';
    return t('workDetail.inviteCardBody')
      .replace('{artist}', work.artist.name)
      .replace('{title}', work.title)
      .replace('{url}', workShareUrl)
      .replace('{brand}', t('brand.name'));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(workShareUrl);
    toast.success(t('workDetail.toastLinkCopied'));
    setIsShareOpen(false);
  };

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(buildInvitationCardText());
    toast.success(t('workDetail.toastInviteCopied'));
    setIsShareOpen(false);
  };

  const handleKakaoShare = () => {
    navigator.clipboard.writeText(buildInvitationCardText());
    toast.success(t('workDetail.toastKakaoCopied'));
    setIsShareOpen(false);
  };

  return (
    <motion.div
      className="dark fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Deep Zoom Viewer */}
      {deepZoomSrc && (
        <DeepZoomViewer src={deepZoomSrc} alt={work.title} open onClose={() => setDeepZoomSrc(null)} />
      )}
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full h-full flex"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col w-full px-3 sm:px-6 lg:px-16 pt-[20px] sm:pt-[40px]">

          {/* Close button */}
          <Button
            type="button"
            variant="toolbar"
            onClick={onClose}
            className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white lg:hover:bg-white/20"
            aria-label={t('workDetail.close')}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header: artist info + follow */}
          <div className="w-full flex items-center justify-between mb-3 px-2 sm:px-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {isGroupWork ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border-2 border-white/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={() => handleArtistClick(work.artist.id)}
                  className="h-auto w-auto rounded-full p-0 lg:hover:bg-white/10"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/20 cursor-pointer">
                    <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                    <AvatarFallback className="text-sm">{work.artist.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 min-w-0">
                <h2 className="text-white text-sm sm:text-lg font-bold leading-tight truncate">{work.title}</h2>
                <span className="hidden sm:inline text-white/50">·</span>
                {isGroupWork ? (
                  <span className="text-white/80 text-[13px] sm:text-sm">{displayArtistName}</span>
                ) : (
                  <span
                    className="text-white/80 text-[13px] sm:text-sm cursor-pointer lg:hover:text-white lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(work.artist.id)}
                  >
                    {displayArtistName}
                  </span>
                )}
                {isPick && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold whitespace-nowrap">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                    {t('about.feat3Title')}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="toolbar"
              onClick={() => requireAuth(() => followStore.toggle(work.artist.id))}
              className={`hidden sm:flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border-0 px-4 py-2 text-[13px] font-medium transition-colors ${
                follows.isFollowing(work.artist.id)
                  ? 'bg-white/10 text-white lg:hover:bg-white/20'
                  : 'bg-white text-[#18181B] lg:hover:bg-white/90'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              {follows.isFollowing(work.artist.id) ? t('social.following') : t('social.follow')}
            </Button>
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
                        onDoubleClick={() => setDeepZoomSrc(imageUrls[image] || image)}
                      />
                    </div>
                  </div>
                  {/* Image index indicator */}
                  {totalImages > 1 && (
                    <div className="absolute top-4 right-12 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-white text-xs font-medium">{index + 1}/{totalImages}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Work info section */}
            <div className="max-w-[900px] w-full mx-auto px-8 py-8">
              {/* Description */}
              {work.description && (
                <p className="text-white/85 text-[15px] leading-relaxed mb-6">{work.description}</p>
              )}

              {/* Category */}
              {work.category && (
                <div className="mb-4">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 text-white/70 text-[13px]">
                    {work.category}
                  </span>
                </div>
              )}

              {/* Tags */}
              {work.tags && work.tags.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {work.tags.map((tag) => (
                    <span key={tag} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-[13px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Co-owner / group / instructor badges */}
              <CoOwnerSection work={work} />
            </div>

            {/* Artist profile card */}
            <div className="max-w-[900px] w-full mx-auto px-5 sm:px-6 py-6">
              {work.coOwners && work.coOwners.length > 0 ? (
                <div className="bg-[#1A1A2E] rounded-2xl border border-white/10 p-5 sm:p-6">
                  {work.groupName && (
                    <div className="text-center mb-6 pb-4 border-b border-white/10">
                      <h3 className="text-lg font-bold text-white mb-2">{work.groupName}</h3>
                      <p className="text-[13px] text-white/70">
                        {t('workDetail.participantCount').replace(
                          '{n}',
                          String(work.coOwners.length + 1),
                        )}
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <ArtistRow artist={work.artist} onArtistClick={handleArtistClick} />
                    {work.coOwners.map((coOwner) => (
                      <ArtistRow key={coOwner.id} artist={coOwner} onArtistClick={handleArtistClick} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1A1A2E] rounded-2xl border border-white/10 p-6 sm:p-8 text-center">
                  <div className="mb-4 flex justify-center cursor-pointer" onClick={() => handleArtistClick(work.artist.id)}>
                    <Avatar className="h-16 w-16 border-2 border-white/20">
                      <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                      <AvatarFallback className="text-lg font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <h3
                    className="mb-2 text-base font-semibold text-white cursor-pointer lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(work.artist.id)}
                  >
                    {work.artist.name}
                  </h3>
                  {work.artist.bio && (
                    <p className="mb-5 text-[13px] text-white/70">{work.artist.bio}</p>
                  )}
                </div>
              )}
            </div>

            {/* Related works */}
            {relatedWorks.length > 0 && (
              <div className="max-w-[900px] w-full mx-auto px-5 sm:px-6 pb-10">
                <h2 className="text-lg font-semibold text-white mb-4">{t('workDetail.relatedWorks')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1.3rem] sm:gap-[1.95rem]">
                  {relatedWorks.slice(0, 8).map((rw) => (
                    <button
                      type="button"
                      key={rw.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.(rw.id);
                      }}
                      className="group min-w-0 w-full text-left rounded-xl p-0 border-0 bg-transparent cursor-pointer shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-xl bg-white/5 border border-white/10 aspect-square flex items-center justify-center">
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(rw.image)] || getFirstImage(rw.image)}
                          alt={rw.title}
                          className="w-full h-full object-contain hover-scale"
                        />
                      </div>
                      <div className="text-[13px] font-medium text-white lg:group-hover:text-primary transition-colors mb-0.5 sm:mb-1 truncate px-0.5">
                        {rw.title}
                      </div>
                      <div className="text-xs text-white/60 truncate px-0.5">{displayArtistName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prev/next work navigation */}
          {prevWork && (
            <button
              type="button"
              onClick={() => onNavigate?.(prevWork.id)}
              className="fixed bottom-16 sm:bottom-5 left-3 sm:left-5 z-50 flex flex-col items-center gap-1 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer"
              aria-label={t('workDetail.prevWork')}
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white lg:hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-white text-xs hidden sm:block">{t('workDetail.prev')}</span>
            </button>
          )}
          {nextWork && (
            <button
              type="button"
              onClick={() => onNavigate?.(nextWork.id)}
              className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-50 flex flex-col items-center gap-1 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer"
              aria-label={t('workDetail.nextWork')}
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white lg:hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-white text-xs hidden sm:block">{t('workDetail.next')}</span>
            </button>
          )}

          {/* Right-side action buttons (desktop) */}
          <div className="hidden sm:flex fixed top-1/2 -translate-y-1/2 right-4 flex-col items-center gap-3 z-50">
            {/* Follow (avatar) */}
            <Button
              type="button"
              variant="toolbar"
              onClick={() => requireAuth(() => followStore.toggle(work.artist.id))}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white"
              aria-label={follows.isFollowing(work.artist.id) ? t('social.following') : t('social.follow')}
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                  <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
                </Avatar>
                {follows.isFollowing(work.artist.id) && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-black">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </div>
                )}
              </div>
              <span
                className="text-xs text-white cursor-pointer lg:hover:underline"
                onClick={(e) => { e.stopPropagation(); handleArtistClick(work.artist.id); }}
              >
                {work.artist.name}
              </span>
            </Button>

            {/* Like */}
            <Button
              type="button"
              variant="toolbar"
              onClick={() => requireAuth(handleLike)}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white"
              aria-label={t('workDetail.like')}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                isLiked ? 'bg-[#FF2E63]' : 'bg-white/10 lg:hover:bg-white/20'
              }`}>
                <Heart className={`h-4.5 w-4.5 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-xs text-white">{t('workDetail.like')}</span>
              <span className="text-[11px] text-white/70">{(work.likes || 0).toLocaleString()}</span>
            </Button>

            {/* Save / Bookmark */}
            <Button
              type="button"
              variant="toolbar"
              onClick={() => requireAuth(handleSave)}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white"
              aria-label={t('workDetail.save')}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                isSaved ? 'bg-white' : 'bg-white/10 lg:hover:bg-white/20'
              }`}>
                <Bookmark className={`h-4.5 w-4.5 ${isSaved ? 'text-[#18181B] fill-[#18181B]' : 'text-white'}`} />
              </div>
              <span className="text-xs text-white">{t('workDetail.save')}</span>
            </Button>

            {/* Share */}
            <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="toolbar"
                  className="mt-2 flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white"
                  aria-label={t('workDetail.share')}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 lg:hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <Share2 className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-xs text-white">{t('workDetail.share')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="left" align="center" className="w-[min(100vw-2rem,17rem)] p-2 bg-[#2a2a2a] border-white/10 z-[110]">
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleCopyInvitation}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {t('workDetail.copyInviteCard')}
                </Button>
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleCopyLink}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-[13px] text-white"
                >
                  <Link2 className="h-4 w-4" />
                  {t('workDetail.copyLink')}
                </Button>
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleKakaoShare}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {t('workDetail.kakaoShare')}
                </Button>
              </PopoverContent>
            </Popover>

            {/* Report */}
            <Button
              type="button"
              variant="toolbar"
              onClick={() => requireAuth(() => setShowReport(true))}
              className="mt-2 flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white"
              aria-label={t('workDetail.report')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 lg:hover:bg-red-500/30 transition-colors backdrop-blur-sm">
                <Flag className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xs text-white">{t('workDetail.report')}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile bottom action bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => requireAuth(handleLike)}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'text-[#FF2E63] fill-[#FF2E63]' : 'text-white'}`} />
            <span className="text-[11px] text-white/70">{(work.likes || 0).toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => requireAuth(handleSave)}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? 'text-white fill-white' : 'text-white'}`} />
            <span className="text-[11px] text-white/70">{t('workDetail.save')}</span>
          </button>
          <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
              >
                <Share2 className="h-6 w-6 text-white" />
                <span className="text-[11px] text-white/70">{t('workDetail.share')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-[min(100vw-2rem,17rem)] p-2 bg-[#2a2a2a] border-white/10 z-[110] mb-2">
              <Button
                type="button"
                variant="toolbar"
                onClick={handleCopyInvitation}
                className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-white"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {t('workDetail.copyInviteCard')}
              </Button>
              <Button
                type="button"
                variant="toolbar"
                onClick={handleCopyLink}
                className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-[13px] text-white"
              >
                <Link2 className="h-4 w-4" />
                {t('workDetail.copyLink')}
              </Button>
              <Button
                type="button"
                variant="toolbar"
                onClick={handleKakaoShare}
                className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                {t('workDetail.kakaoShare')}
              </Button>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => requireAuth(() => followStore.toggle(work.artist.id))}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <UserPlus className={`h-6 w-6 ${follows.isFollowing(work.artist.id) ? 'text-primary' : 'text-white'}`} />
            <span className="text-[11px] text-white/70">
              {follows.isFollowing(work.artist.id) ? t('social.following') : t('social.follow')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => requireAuth(() => setShowReport(true))}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Flag className="h-6 w-6 text-white" />
            <span className="text-[11px] text-white/70">{t('workDetail.report')}</span>
          </button>
        </div>
      </div>

      {/* Login prompt modal */}
      <LoginPromptModal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="work"
        targetId={workId}
        targetName={work.title}
        onReported={() => {
          onWorkReported?.();
        }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Co-owner / Instructor / Group badges                              */
/* ------------------------------------------------------------------ */
function CoOwnerSection({ work }: { work: Work }) {
  const { t } = useI18n();
  const hasGroup = !!work.groupName;
  const hasCoOwners = work.coOwners && work.coOwners.length > 0;
  const isInstructor = work.isInstructorUpload === true;
  const taggedEmails = work.taggedEmails;

  if (!hasGroup && !hasCoOwners && !isInstructor && !taggedEmails?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {hasGroup && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/15 text-primary text-[13px] font-medium">
          <Users className="h-4 w-4" />
          {work.groupName}
        </span>
      )}
      {hasCoOwners && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/80 text-[13px]">
          <Users className="h-4 w-4" />
          {t('workDetail.coWork')} · {work.coOwners!.map(c => c.name).join(', ')}
        </span>
      )}
      {isInstructor && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/15 text-amber-400 text-[13px] font-medium">
          {t('workDetail.instructorUpload')}
        </span>
      )}
      {taggedEmails && taggedEmails.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/60 text-[13px]">
          {t('workDetail.participants')}: {taggedEmails.join(', ')}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable artist row for group works                               */
/* ------------------------------------------------------------------ */
function ArtistRow({ artist, onArtistClick }: { artist: Artist; onArtistClick?: (id: string) => void }) {
  const { t } = useI18n();
  const follows = useFollowStore();
  const isFollowing = follows.isFollowing(artist.id);

  const handleFollow = () => {
    if (!authStore.isLoggedIn()) return;
    followStore.toggle(artist.id);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 lg:hover:bg-white/10 transition-colors">
      <Button
        type="button"
        variant="toolbar"
        onClick={() => onArtistClick?.(artist.id)}
        className="h-auto w-auto shrink-0 rounded-full p-0"
      >
        <Avatar className="h-11 w-11 border-2 border-white/20 cursor-pointer">
          <AvatarImage src={artist.avatar} alt={artist.name} />
          <AvatarFallback className="text-sm font-semibold bg-white/10 text-white">{artist.name[0]}</AvatarFallback>
        </Avatar>
      </Button>
      <div className="flex-1 min-w-0">
        <h4
          className="text-[15px] font-semibold text-white mb-1 truncate cursor-pointer lg:hover:underline"
          onClick={() => onArtistClick?.(artist.id)}
        >
          {artist.name}
        </h4>
        {artist.bio && <p className="text-[13px] text-white/60 truncate">{artist.bio}</p>}
      </div>
      <Button
        type="button"
        variant="toolbar"
        onClick={handleFollow}
        className={`flex h-9 min-h-[36px] items-center gap-1.5 rounded-lg px-4 text-[13px] transition-colors ${
          isFollowing
            ? 'border-0 bg-white/15 text-white lg:hover:bg-white/20'
            : 'border border-white/20 text-white lg:hover:bg-white/10'
        }`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {isFollowing ? t('social.following') : t('social.follow')}
      </Button>
    </div>
  );
}
