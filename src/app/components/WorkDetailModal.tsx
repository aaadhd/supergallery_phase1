import { motion } from 'framer-motion';
import { X, Heart, Bookmark, Share2, ChevronLeft, ChevronRight, UserPlus, Users, Flag, MoreHorizontal, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { WorkInquiryModal } from './WorkInquiryModal';
import { useI18n } from '../i18n/I18nProvider';
import { Work, Artist, works, artists as allArtists } from '../data';
import { hydrateGroupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoverImage } from '../utils/imageHelper';
import { userInteractionStore, workStore, authStore, followStore, useFollowStore, withdrawnArtistStore } from '../store';
import { isWorkHidden } from '../utils/workVisibility';
import { CopyrightProtectedImage } from './work';
import { toast } from 'sonner';
import { LoginPromptModal } from './LoginPromptModal';
import { ReportModal } from './ReportModal';
import DeepZoomViewer from './DeepZoomViewer';
import { Button } from './ui/button';
import {
  displayExhibitionTitle,
  displayGroupOrgName,
  displayPieceTitleAtIndex,
  displayProminentHeadline,
} from '../utils/workDisplay';
import { openConfirm } from './ConfirmDialog';
import { demoteSlotToUnknown } from '../utils/inviteMessaging';
import { pushDemoNotification } from '../utils/pushDemoNotification';

interface WorkDetailModalProps {
  workId: string;
  onClose: () => void;
  onNavigate?: (workId: string) => void;
  allWorks?: Work[];
  /** 신고 접수 후 부모(예: 둘러보기)에서 피드 숨김 목록을 갱신할 때 */
  onWorkReported?: () => void;
  /** 미리보기 모드 — 좋아요/저장/공유/신고 등 인터랙션 비활성 */
  isPreview?: boolean;
}

export function WorkDetailModal({ workId, onClose, onNavigate, allWorks: providedWorks, onWorkReported, isPreview }: WorkDetailModalProps) {
  const { t } = useI18n();
  const defaultWorks = [...works, ...hydrateGroupWorks(allArtists)] as Work[];
  const allWorks = providedWorks || defaultWorks;
  const work = allWorks.find(w => w.id === workId);

  const [isLiked, setIsLiked] = useState(() => userInteractionStore.isLiked(workId));
  const [isSaved, setIsSaved] = useState(() => userInteractionStore.isSaved(workId));
  const follows = useFollowStore();
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [deepZoomSrc, setDeepZoomSrc] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);

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

  // Close on Escape key + focus trapping
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // 모달 열릴 때 포커스 이동
    requestAnimationFrame(() => modalRef.current?.focus());
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 모달 열린 상태에서 work이 삭제·자동 비공개로 사라지면 부모에 알려 정리하도록 한다.
  useEffect(() => {
    if (!work) onClose();
  }, [work, onClose]);

  // Hidden works are only visible to the owning artist
  const isOwnerViewing = authStore.isLoggedIn() && work?.artistId === allArtists[0]?.id;
  if (!work || (isWorkHidden(work) && !isOwnerViewing)) return null;
  const isWithdrawnArtist = withdrawnArtistStore.isWithdrawn(work.artistId);

  const headline = displayExhibitionTitle(work, t('work.untitled'));
  const groupOrgLine = displayGroupOrgName(work);
  const isPick = work.pickBadge === true || work.pick === true;
  const hasCoOwners = !!work.coOwners?.length;
  const isGroupWork =
    work.primaryExhibitionType === 'group' ||
    hasCoOwners ||
    Boolean(work.isInstructorUpload && work.groupName?.trim()) ||
    work.owner?.type === 'group';
  const displayArtistName = work.artist.name;
  const uploaderArtist = allArtists.find(a => a.id === work.artistId);
  const uploaderName = uploaderArtist?.name ?? displayArtistName;
  // 그룹 전시는 헤더에 그룹명만 나오므로 올린이를 별도 표시
  const showUploaderLine = isGroupWork && !!uploaderArtist;

  const workImages = Array.isArray(work.image) ? work.image : [work.image];
  const hasCoverPage = !!(work.customCoverUrl && work.coverImageIndex === -1);
  const images = hasCoverPage ? [work.customCoverUrl as string, ...workImages] : workImages;
  const totalImages = images.length;

  const currentIndex = allWorks.findIndex(w => w.id === workId);
  const prevWork = currentIndex > 0 ? allWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < allWorks.length - 1 ? allWorks[currentIndex + 1] : null;

  // 관련 작품 노출 규칙 (2026-04-17):
  //  - 개인 전시: 같은 작가 최신 3개. 같은 작가 작품이 3개를 **초과**할 때만 [더보기] 버튼(→ 작가 프로필)
  //  - 그룹 전시: 참여 작가별 최신 1개씩 (채움 없음, 더보기 없음)
  //  - 어느 쪽이든 0개이면 섹션 전체 미노출 (렌더 시 length > 0 조건)
  const { relatedWorks, hasMore } = (() => {
    const isGroup = work.primaryExhibitionType === 'group' || !!work.coOwners?.length || work.owner?.type === 'group';
    const byRecent = (a: Work, b: Work) => {
      const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return tb - ta;
    };

    if (!isGroup) {
      const artistOthers = allWorks
        .filter(w => w.artistId === work.artistId && w.id !== work.id)
        .sort(byRecent);
      return {
        relatedWorks: artistOthers.slice(0, 3),
        hasMore: artistOthers.length > 3,
      };
    }

    // 그룹 전시: 참여자 = imageArtists 멤버 + coOwners + 업로더(artistId).
    // 그룹원 전체는 참여자가 아니므로 fallback에 쓰지 않음.
    const participantIds = new Set<string>();
    if (work.imageArtists?.length) {
      work.imageArtists.forEach(ia => { if (ia.type === 'member' && ia.memberId) participantIds.add(ia.memberId); });
    }
    if (work.coOwners?.length) {
      work.coOwners.forEach(co => participantIds.add(co.id));
    }
    participantIds.add(work.artistId);

    const sorted = [...allWorks].sort(byRecent);
    const out: Work[] = [];
    const seen = new Set<string>();
    for (const aid of participantIds) {
      const found = sorted.find(w => w.artistId === aid && w.id !== work.id && !seen.has(w.id));
      if (found) { out.push(found); seen.add(found.id); }
    }
    return { relatedWorks: out, hasMore: false };
  })();

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
    if (isWithdrawnArtist) return; // Policy §4.2: 탈퇴 작가 작품 인터랙션 차단
    const wasLiked = userInteractionStore.isLiked(workId);
    userInteractionStore.toggleLike(workId);
    const nowLiked = userInteractionStore.isLiked(workId);
    const currentLikes = workStore.getWork(workId)?.likes ?? work.likes ?? 0;
    workStore.updateWork(workId, {
      likes: nowLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    });
    setIsLiked(nowLiked);
    if (wasLiked) {
      toast(t('browse.unliked'), {
        action: { label: t('browse.undo'), onClick: () => {
          userInteractionStore.toggleLike(workId);
          workStore.updateWork(workId, { likes: (workStore.getWork(workId)?.likes ?? 0) + 1 });
          setIsLiked(true);
        }},
        duration: 3000,
      });
    }
  };

  const handleSave = () => {
    if (isWithdrawnArtist) return; // Policy §4.2: 탈퇴 작가 작품 인터랙션 차단
    const wasSaved = userInteractionStore.isSaved(workId);
    userInteractionStore.toggleSave(workId);
    const nowSaved = userInteractionStore.isSaved(workId);
    const currentSaves = workStore.getWork(workId)?.saves ?? work.saves ?? 0;
    workStore.updateWork(workId, {
      saves: nowSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1),
    });
    setIsSaved(nowSaved);
    if (wasSaved) {
      toast(t('browse.unsaved'), {
        action: { label: t('browse.undo'), onClick: () => {
          userInteractionStore.toggleSave(workId);
          workStore.updateWork(workId, { saves: (workStore.getWork(workId)?.saves ?? 0) + 1 });
          setIsSaved(true);
        }},
        duration: 3000,
      });
    }
  };

  // 전시 단위 공유 → ExhibitionInviteLanding (같은 전시 작품 그리드). 작품만 공유는 프로필 작품 관리 `?from=work`.
  const workShareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/exhibitions/${workId}?from=invite`;

  const buildInvitationCardText = () => {
    if (!work) return '';
    return t('workDetail.inviteCardBody')
      .replace('{artist}', work.artist.name)
      .replace('{title}', headline)
      .replace('{url}', workShareUrl)
      .replace('{brand}', t('brand.name'));
  };

  const handleShare = async () => {
    const shareText = buildInvitationCardText();
    // 네이티브 공유 API (모바일: 카톡/문자/라인 등 앱 선택)
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('workDetail.shareTitle').replace('{artist}', work?.artist.name ?? ''),
          text: shareText,
          url: workShareUrl,
        });
        return;
      } catch (e) {
        // 사용자가 취소한 경우 — 폴백으로 복사
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    }
    // 데스크탑 폴백: 클립보드에 멘트+링크 복사
    navigator.clipboard.writeText(`${shareText}\n${workShareUrl}`);
    toast.success(t('workDetail.toastLinkCopied'));
  };

  return (
    <motion.div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={headline}
      className="dark fixed inset-0 z-[100] flex items-center justify-center outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Deep Zoom Viewer */}
      {deepZoomSrc && (
        <DeepZoomViewer src={deepZoomSrc} alt={headline} open onClose={() => setDeepZoomSrc(null)} />
      )}
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Preview mode banner */}
      {isPreview && (
        <div className="absolute top-0 left-0 right-0 z-[120] flex items-center justify-center gap-3 bg-black/70 backdrop-blur-sm px-4 py-2.5">
          <span className="text-white/80 text-sm font-medium">{t('upload.previewBanner')}</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('upload.previewBackToEdit')}
          </button>
        </div>
      )}

      {/* Main content — NoteFolio / Behance layout: 3 Columns. Only center is animated! */}
      <div
        className="relative z-10 w-full max-w-[1280px] mx-auto h-[100dvh] sm:h-[96vh] sm:my-[2vh] flex items-stretch sm:gap-4 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left sidebar (desktop) - Float Prev Button ── */}
        <div className="hidden sm:flex flex-col items-center w-[60px] shrink-0 justify-end pointer-events-auto pb-4 pt-10">
          {prevWork ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate?.(prevWork.id); }}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#111] text-white border border-white/10 shadow-lg lg:hover:bg-[#333] transition-all"
              aria-label={t('workDetail.prevWork')}
            >
              <ChevronLeft className="h-7 w-7 pr-1" />
            </button>
          ) : <div className="h-[52px] w-[52px]" />}
        </div>

        {/* Center column — THE NoteFolio White Modal */}
        <motion.div
           className="flex flex-col flex-1 min-w-0 bg-white sm:rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto overflow-y-auto"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 12 }}
           transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* Mobile top-right: 더보기 메뉴 + 닫기 (전시 레벨 메뉴) */}
          <div className="sm:hidden fixed right-3 top-3 z-50 flex items-center gap-2">
            {work.artistId !== allArtists[0].id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white"
                    aria-label={t('workDetail.more')}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="z-[140]">
                  <DropdownMenuItem
                    onClick={() => requireAuth(() => setShowInquiry(true))}
                    className="min-h-[44px]"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('workDetail.askAboutWork')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => requireAuth(() => setShowReport(true))}
                    className="text-destructive focus:text-destructive min-h-[44px]"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    {t('workDetail.report')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              type="button"
              variant="toolbar"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white"
              aria-label={t('workDetail.close')}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Header: artist info + follow */}
          <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-10 py-5 bg-white border-b border-zinc-200 z-20">
            <div className="flex items-center gap-3 min-w-0">
              {isGroupWork ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 shrink-0">
                  <Users className="h-5 w-5 text-zinc-500" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleArtistClick(work.artist.id)}
                  className="h-auto w-auto rounded-full p-0 flex-shrink-0 lg:hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-11 w-11 shadow-sm border border-black/5 cursor-pointer">
                    <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                    <AvatarFallback className="text-sm bg-zinc-100 text-zinc-900">{work.artist.name[0]}</AvatarFallback>
                  </Avatar>
                </button>
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-zinc-900 text-base sm:text-lg font-extrabold leading-tight truncate">{headline}</h2>
                {isGroupWork ? (
                  // 그룹 작품은 "그룹 자체"가 프로필을 가지지 않음 — 그룹명만 표시하고 팔로우/클릭은 개별 멤버(ArtistRow)로 유도
                  <span className="text-zinc-600 text-sm font-medium">
                    {work.groupName?.trim() || groupOrgLine || displayArtistName}
                  </span>
                ) : (
                  <span
                    className="text-zinc-600 font-medium text-sm cursor-pointer lg:hover:text-zinc-900 lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(work.artist.id)}
                  >
                    {displayArtistName}
                  </span>
                )}
                {showUploaderLine && (
                  <span
                    className="text-zinc-500 text-xs cursor-pointer lg:hover:text-zinc-700 lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(uploaderArtist.id)}
                  >
                    {t('profile.uploaderLabel')}: {uploaderName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPick && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold whitespace-nowrap">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                  {t('about.feat3Title')}
                </span>
              )}
            {/* 그룹 작품은 "그룹 팔로우" 개념이 없음 — 버튼 숨김, 내 작품도 숨김 */}
            {!isGroupWork && work.artist.id !== allArtists[0]?.id && (
              <button
                type="button"
                onClick={() => requireAuth(() => followStore.toggle(work.artist.id))}
                className={`hidden sm:flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors border ${
                  follows.isFollowing(work.artist.id)
                    ? 'bg-zinc-100 text-zinc-600 lg:hover:bg-zinc-200 border-zinc-200'
                    : 'bg-primary text-white border-primary lg:hover:bg-primary/95 shadow-sm'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                {follows.isFollowing(work.artist.id) ? t('social.following') : t('social.follow')}
              </button>
            )}
            </div>
          </div>

          {/* Scrollable image + info area */}
          <div
            ref={scrollContainerRef}
            className="relative flex-1 overflow-auto scroll-smooth flex flex-col items-center dark-scrollbar bg-white"
            onClick={(e) => {
              e.stopPropagation();
              if (isZoomed) { setIsZoomed(false); setZoomOrigin('center center'); }
            }}
          >
            {/* Images - 그림 소스에서 추출된 블러 배경 적용 (Notefolio Style: No extra padding) */}
            <div className={`w-full flex-col flex ${workImages.length === 1 && !hasCoverPage ? 'min-h-[60vh] justify-center' : ''}`}>
              {images.map((image, index) => {
                const src = imageUrls[image] || image;
                const isCoverSlide = hasCoverPage && index === 0;
                const workImageIndex = hasCoverPage ? index - 1 : index;
                const slideLabel = isCoverSlide ? (work.exhibitionName || t('work.untitled')) : displayPieceTitleAtIndex(work, workImageIndex, t('work.untitled'));
                return (
                <div key={index} className={`relative w-full flex items-center justify-center overflow-hidden mb-0 ${isCoverSlide ? 'py-12 sm:py-16' : 'py-8 sm:py-10'}`}>

                  {/* Background — 커버: 블랙, 작품: 블러 */}
                  {isCoverSlide ? (
                    <div className="absolute inset-0 z-0 bg-black pointer-events-none" />
                  ) : (
                    <div className="absolute inset-0 z-0 bg-[#f4f4f4] pointer-events-none overflow-hidden">
                      <img src={src} className="w-full h-full object-cover blur-[120px] opacity-[0.95] scale-[1.3]" alt="" />
                      <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
                    </div>
                  )}

                  <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6">
                    <div
                      className={`relative w-full max-w-[1000px] flex justify-center text-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-[0_15px_50px_rgba(0,0,0,0.2)] bg-black/5 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={handleZoomClick}
                      style={{
                        transform: `scale(${isZoomed ? 2.5 : 1})`,
                        transformOrigin: isZoomed ? zoomOrigin : 'top center',
                      }}
                    >
                      <CopyrightProtectedImage
                        src={src}
                        alt={`${slideLabel}${totalImages > 1 ? ` - ${index + 1}` : ''}`}
                        preventRightClick
                        preventDrag
                        className="mx-auto block max-w-full max-h-[85vh] w-auto h-auto object-contain"
                        onDoubleClick={() => setDeepZoomSrc(src)}
                      />
                    </div>
                  </div>
                  {/* Image index indicator — 우상단(원래 자리) */}
                  {workImages.length > 1 && !isCoverSlide && (
                    <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md">
                      <span className="text-white text-xs font-bold tracking-wider">{workImageIndex + 1} / {workImages.length}</span>
                    </div>
                  )}

                  {/* 이미지 하단: 작가 + 작품명 (가로 한줄) — 커버 슬라이드는 작가 오버레이 생략 */}
                  {!isCoverSlide && (() => {
                    const ia = work.imageArtists?.[workImageIndex];
                    const imgArtist = ia?.type === 'member' && ia.memberId
                      ? allArtists.find(a => a.id === ia.memberId)
                      : undefined;
                    const imgArtistName = imgArtist?.name
                      || (ia?.type === 'non-member' ? ia.displayName : undefined)
                      || (ia?.type === 'unknown' ? t('work.unknownArtist') : undefined)
                      || (totalImages === 1 ? work.artist.name : undefined);
                    const imgArtistAvatar = imgArtist?.avatar || (totalImages === 1 ? work.artist.avatar : undefined);
                    const showFollow = imgArtist && imgArtist.id !== allArtists[0]?.id;
                    // 초대 자동 연결 piece의 원복 진입점(Policy §3.5): 현재 로그인 사용자가 이 슬롯의 member이면서 업로더가 아닐 때 노출
                    const viewerId = allArtists[0]?.id;
                    const isDisavowable = authStore.isLoggedIn()
                      && ia?.type === 'member'
                      && ia.memberId === viewerId
                      && work.artistId !== viewerId;
                    const handleDisavow = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const ok = await openConfirm({
                        title: t('invite.disavowConfirmTitle'),
                        description: t('invite.disavowConfirmDesc'),
                      });
                      if (!ok) return;
                      const result = demoteSlotToUnknown(work.id, workImageIndex, viewerId!);
                      if (!result.ok) {
                        toast.error(t('invite.disavowFailed'));
                        return;
                      }
                      const pieceLabel = result.pieceTitle && result.pieceTitle.trim()
                        ? result.pieceTitle
                        : t('invite.fallbackPieceIndex').replace('{n}', String(workImageIndex + 1));
                      pushDemoNotification({
                        type: 'system',
                        message: t('invite.notifDisavowed')
                          .replace('{workTitle}', result.workTitle || t('work.untitled'))
                          .replace('{piece}', pieceLabel),
                        workId: work.id,
                      });
                      toast.success(t('invite.disavowDone'));
                    };
                    return (imgArtistName || slideLabel !== t('work.untitled') || isDisavowable) ? (
                      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 sm:px-5 pb-3.5 pt-10">
                        {slideLabel !== t('work.untitled') && (
                          <p className="absolute left-0 right-0 bottom-3.5 text-white/90 text-base font-semibold drop-shadow-md text-center pointer-events-none">{slideLabel}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {imgArtistAvatar && (
                            <img src={imgArtistAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30 shrink-0" />
                          )}
                          {imgArtistName && (
                            <span className="text-white text-sm font-semibold drop-shadow-md">{imgArtistName}</span>
                          )}
                          {showFollow && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); requireAuth(() => followStore.toggle(imgArtist.id)); }}
                              className={`min-h-[44px] text-sm font-bold px-4 py-2 rounded-full shrink-0 transition-colors ${
                                follows.isFollowing(imgArtist.id)
                                  ? 'bg-white/20 text-white/80'
                                  : 'bg-white/90 text-zinc-800'
                              }`}
                            >
                              {follows.isFollowing(imgArtist.id) ? t('social.following') : t('social.follow')}
                            </button>
                          )}
                          {isDisavowable && (
                            <button
                              type="button"
                              onClick={handleDisavow}
                              aria-label={t('invite.disavowAction')}
                              className="ml-auto min-h-[44px] text-xs font-semibold px-3 py-2 rounded-full bg-white/15 text-white/90 hover:bg-white/25 transition-colors shrink-0"
                            >
                              {t('invite.disavowAction')}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              );
              })}
            </div>

            {/* Work info section */}
            <div className="w-full bg-white">
              <div className="max-w-[880px] mx-auto px-4 sm:px-10 lg:px-16 py-12">
                {/* Co-owner / group / instructor badges */}
                <CoOwnerSection work={work} />
              </div>
            </div>

            {/* Artist profile card */}
            <div className="w-full bg-white pb-10">
              <div className="max-w-[900px] w-full mx-auto px-5 sm:px-6">
              {(() => {
                const groupMemberArtists: Artist[] = [];
                const instructorIds = new Set<string>();
                if (isGroupWork) {
                  const seen = new Set<string>();

                  if (work.isInstructorUpload && work.artistId) {
                    const instructor = allArtists.find(a => a.id === work.artistId);
                    if (instructor) {
                      seen.add(instructor.id);
                      groupMemberArtists.push(instructor);
                      instructorIds.add(instructor.id);
                    }
                  }

                  if (work.imageArtists?.length) {
                    work.imageArtists.forEach(ia => {
                      if (ia.type === 'member' && ia.memberId && !seen.has(ia.memberId)) {
                        seen.add(ia.memberId);
                        const found = allArtists.find(a => a.id === ia.memberId);
                        if (found) groupMemberArtists.push(found);
                      }
                    });
                  }
                  if (work.coOwners?.length) {
                    work.coOwners.forEach(co => {
                      if (!seen.has(co.id)) { seen.add(co.id); groupMemberArtists.push(co); }
                    });
                  }
                  if (!seen.has(work.artistId)) {
                    const found = allArtists.find(a => a.id === work.artistId);
                    if (found) groupMemberArtists.push(found);
                  }
                }
                return isGroupWork && groupMemberArtists.length > 0 ? (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
                  <div className="text-center mb-6 pb-4 border-b border-zinc-200">
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">
                      {displayExhibitionTitle(work, t('work.exhibitionFallback'))}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {groupMemberArtists.map((member) => (
                      <ArtistRow key={member.id} artist={member} onArtistClick={handleArtistClick} isInstructor={instructorIds.has(member.id)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 sm:p-8 text-center shadow-sm">
                  <div className="mb-4 flex justify-center cursor-pointer" onClick={() => handleArtistClick(work.artist.id)}>
                    <Avatar className="h-16 w-16 border border-zinc-200 shadow-sm mx-auto">
                      <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                      <AvatarFallback className="text-lg font-semibold bg-zinc-100 text-zinc-900">{work.artist.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <h3
                    className="mb-2 text-base font-bold text-zinc-900 cursor-pointer lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(work.artist.id)}
                  >
                    {work.artist.name}
                  </h3>
                  {work.artist.bio && (
                    <p className="mb-5 text-sm text-zinc-600">{work.artist.bio}</p>
                  )}
                </div>
              );
              })()}
              </div>
            </div>

            {/* 초대장 공유 진입 — 비로그인 + 그룹전시 대상 가입 유도 CTA */}
            {!authStore.isLoggedIn() && isGroupWork && (
              <div className="w-full bg-white">
                <div className="max-w-[900px] w-full mx-auto px-5 sm:px-6 pb-6 sm:pb-10">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      {t('workDetail.inspireCtaTitle')}
                    </p>
                    <p className="text-sm sm:text-base text-zinc-800 leading-relaxed mb-5">
                      {t('workDetail.inspireCtaBody').replace('{artist}', displayArtistName)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/');
                      }}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90 transition-colors"
                    >
                      {t('workDetail.inspireCtaButton')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Related works */}
            {!isPreview && relatedWorks.length > 0 && (
              <div className="w-full bg-white pb-10">
                <div className="max-w-[900px] w-full mx-auto px-5 sm:px-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-4">{t('workDetail.relatedWorks')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1.3rem] sm:gap-[1.95rem]">
                  {relatedWorks.map((rw) => (
                    <button
                      type="button"
                      key={rw.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.(rw.id);
                      }}
                      className="group min-w-0 w-full text-left rounded-xl p-0 border-0 bg-transparent cursor-pointer shadow-none focus:outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 aspect-square flex items-center justify-center">
                        <ImageWithFallback
                          src={imageUrls[getCoverImage(rw.image, rw.coverImageIndex)] || getCoverImage(rw.image, rw.coverImageIndex)}
                          alt={displayProminentHeadline(rw, t('work.untitled'))}
                          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors mb-0.5 sm:mb-1 truncate px-0.5">
                        {displayProminentHeadline(rw, t('work.untitled'))}
                      </div>
                      <div className="text-sm text-zinc-500 truncate px-0.5">{rw.artist?.name ?? displayArtistName}</div>
                    </button>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-5 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); handleArtistClick(work.artistId); }}
                      className="px-6 py-3 text-sm font-medium"
                    >
                      {t('workDetail.relatedMore')}
                    </Button>
                  </div>
                )}
                </div>
              </div>
            )}
            
            {/* Fill remaining space with background */}
            <div className="w-full flex-1 bg-white"></div>

          </div>
        </motion.div>

        {/* ── Right sidebar (desktop) - Floating over Dim overlay! ── */}
        <div className="hidden sm:flex flex-col items-center w-[72px] shrink-0 justify-center pointer-events-auto">

          {/* Close + More menu (전시 레벨 메뉴) */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 border border-white/10 lg:hover:bg-zinc-200 mb-3 transition-colors shadow-lg shadow-black/20"
            aria-label={t('workDetail.close')}
          >
            <X className="h-6 w-6" />
          </button>
          {work.artistId !== allArtists[0].id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#333] text-white/90 border border-white/10 lg:hover:bg-[#444] mb-6 transition-colors shadow-lg shadow-black/20"
                  aria-label={t('workDetail.more')}
                >
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="z-[140]">
                <DropdownMenuItem
                  onClick={() => requireAuth(() => setShowInquiry(true))}
                  className="min-h-[44px]"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('workDetail.askAboutWork')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => requireAuth(() => setShowReport(true))}
                  className="text-destructive focus:text-destructive min-h-[44px]"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {t('workDetail.report')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Action buttons — vertically centered */}
          <div className={`flex-1 flex flex-col items-center justify-start gap-4 pt-10 ${(isPreview || isWithdrawnArtist) ? 'opacity-40 pointer-events-none' : ''}`}>

            {/* Avatar + name — 개인 전시만 표시 (그룹 전시는 이미지별 작가로 대체) */}
            {!isGroupWork && (
              <button
                type="button"
                onClick={() => handleArtistClick(work.artist.id)}
                className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group mb-1"
              >
                <div className="relative">
                  <Avatar className="h-[52px] w-[52px] shadow-lg border-[3px] border-white/20 transition-transform group-hover:scale-105">
                    <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                    <AvatarFallback className="text-sm bg-[#555] text-white">{work.artist.name[0]}</AvatarFallback>
                  </Avatar>
                  {work.artist.id !== allArtists[0]?.id && (
                    follows.isFollowing(work.artist.id) ? (
                      <div className="absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-primary border-2 border-[#111]">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-primary border-2 border-[#111]">
                        <span className="text-sm text-white font-bold leading-none">+</span>
                      </div>
                    )
                  )}
                </div>
                <span className="text-xs font-bold text-white/90 group-hover:text-white truncate max-w-[66px] text-center leading-snug drop-shadow-md">{work.artist.name}</span>
              </button>
            )}

            {/* Like */}
            <button
              type="button"
              onClick={() => requireAuth(handleLike)}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group"
              aria-label={t('workDetail.like')}
            >
              <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all shadow-lg ${
                isLiked ? 'bg-[#FF2E63] scale-105' : 'bg-[#333333] lg:group-hover:bg-[#444] border-white/5'
              }`}>
                <Heart className={`h-[22px] w-[22px] transition-colors ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors uppercase drop-shadow-md">
                  {t('workDetail.like')}
                </span>
                <span className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">
                  {(workStore.getWork(workId)?.likes ?? work.likes ?? 0).toLocaleString()}
                </span>
              </div>
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={() => requireAuth(handleSave)}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group"
              aria-label={t('workDetail.save')}
            >
              <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all shadow-lg ${
                isSaved ? 'bg-primary scale-105' : 'bg-[#333333] lg:group-hover:bg-[#444] border-white/5'
              }`}>
                <Bookmark className={`h-[22px] w-[22px] transition-colors gap-1 text-white ${isSaved ? 'fill-white' : ''}`} />
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors uppercase drop-shadow-md">
                  {t('workDetail.save')}
                </span>
                <span className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">
                  {(workStore.getWork(workId)?.saves ?? work.saves ?? 0).toLocaleString()}
                </span>
              </div>
            </button>

            {/* Share — 단일 버튼 (모바일: 네이티브 공유, 데스크탑: 클립보드 복사) */}
            <button
              type="button"
              onClick={handleShare}
              className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group"
              aria-label={t('workDetail.share')}
            >
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#333333] shadow-lg lg:group-hover:bg-[#444] transition-all">
                <Share2 className="h-[22px] w-[22px] text-white" />
              </div>
              <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors uppercase drop-shadow-md">{t('workDetail.share')}</span>
            </button>

            {/* 신고는 작품 이미지 우상단 더보기 메뉴(...)로 이동 */}
          </div>

          {/* BELOW Action Buttons — Next Button (Behance Style) */}
          <div className="mt-auto">
             {nextWork ? (
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); onNavigate?.(nextWork.id); }}
                 className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#111] text-white border border-white/10 shadow-lg lg:hover:bg-[#333] transition-all"
                 aria-label={t('workDetail.nextWork')}
               >
                 <ChevronRight className="h-7 w-7 pl-1" />
               </button>
             ) : <div className="h-[52px] w-[52px]" />}
          </div>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E]/95 backdrop-blur-sm border-t border-white/10 safe-area-bottom ${(isPreview || isWithdrawnArtist) ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Mobile prev/next row */}
        {(prevWork || nextWork) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            {prevWork ? (
              <button type="button" onClick={() => onNavigate?.(prevWork.id)} className="flex items-center gap-1.5 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer">
                <ChevronLeft className="h-4 w-4 text-white/80" />
                <span className="text-xs text-white/80">{t('workDetail.prev')}</span>
              </button>
            ) : <div />}
            {nextWork ? (
              <button type="button" onClick={() => onNavigate?.(nextWork.id)} className="flex items-center gap-1.5 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer">
                <span className="text-xs text-white/80">{t('workDetail.next')}</span>
                <ChevronRight className="h-4 w-4 text-white/80" />
              </button>
            ) : <div />}
          </div>
        )}
        {/* Action buttons */}
        <div className="flex items-center justify-around px-4 py-3">
          <button
            type="button"
            onClick={() => requireAuth(handleLike)}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'text-[#FF2E63] fill-[#FF2E63]' : 'text-white'}`} />
            <span className="text-xs text-white/90">{t('workDetail.like')}</span>
          </button>
          <button
            type="button"
            onClick={() => requireAuth(handleSave)}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? 'text-white fill-white' : 'text-white'}`} />
            <span className="text-xs text-white/90">{t('workDetail.save')}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
          >
            <Share2 className="h-6 w-6 text-white" />
            <span className="text-xs text-white/90">{t('workDetail.share')}</span>
          </button>
          {/* 그룹·내 작품은 팔로우 버튼 숨김 */}
          {!isGroupWork && work.artist.id !== allArtists[0]?.id && (
            <button
              type="button"
              onClick={() => requireAuth(() => followStore.toggle(work.artist.id))}
              className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
            >
              <UserPlus className={`h-6 w-6 ${follows.isFollowing(work.artist.id) ? 'text-primary' : 'text-white'}`} />
              <span className="text-xs text-white/90">
                {follows.isFollowing(work.artist.id) ? t('social.following') : t('social.follow')}
              </span>
            </button>
          )}
          {/* 신고는 모바일 상단 더보기 메뉴(...)로 분리 (Policy §19, 위험도 차등) */}
        </div>
      </div>

      {/* Login prompt modal */}
      <LoginPromptModal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} action="like" />
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="work"
        targetId={workId}
        targetName={headline}
        pieceImages={Array.isArray(work.image) ? work.image : work.image ? [work.image] : undefined}
        onReported={() => {
          onWorkReported?.();
        }}
      />
      <WorkInquiryModal
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
        workId={workId}
        workTitle={headline}
        pieceImages={Array.isArray(work.image) ? work.image : work.image ? [work.image] : undefined}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Co-owner / Instructor / Group badges                              */
/* ------------------------------------------------------------------ */
function CoOwnerSection({ work }: { work: Work }) {
  const { t } = useI18n();
  const hasCoOwners = work.coOwners && work.coOwners.length > 0;
  const taggedEmails = work.taggedEmails;

  if (!hasCoOwners && !taggedEmails?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {hasCoOwners && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-sm border border-zinc-200">
          <Users className="h-4 w-4" />
          {t('workDetail.coWork')} · {work.coOwners!.map(c => c.name).join(', ')}
        </span>
      )}
      {taggedEmails && taggedEmails.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-zinc-500 text-sm border border-zinc-200">
          {t('workDetail.participants')}: {taggedEmails.join(', ')}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable artist row for group works                               */
/* ------------------------------------------------------------------ */
function ArtistRow({ artist, onArtistClick, isInstructor = false }: { artist: Artist; onArtistClick?: (id: string) => void; isInstructor?: boolean }) {
  const { t } = useI18n();
  const follows = useFollowStore();
  const isFollowing = follows.isFollowing(artist.id);
  const isMe = artist.id === allArtists[0]?.id;

  const handleFollow = () => {
    if (!authStore.isLoggedIn()) return;
    followStore.toggle(artist.id);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200 lg:hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onArtistClick?.(artist.id)}
        className="h-auto w-auto shrink-0 rounded-full p-0 bg-transparent border-0"
      >
        <Avatar className="h-11 w-11 border border-zinc-200 cursor-pointer shadow-sm">
          <AvatarImage src={artist.avatar} alt={artist.name} />
          <AvatarFallback className="text-sm font-semibold bg-zinc-100 text-zinc-900">{artist.name[0]}</AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4
            className="text-base font-bold text-zinc-900 truncate cursor-pointer lg:hover:text-primary transition-colors"
            onClick={() => onArtistClick?.(artist.id)}
          >
            {artist.name}
          </h4>
          {isInstructor && (
            <span className="inline-flex items-center shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20">
              {t('profile.instructorBadge')}
            </span>
          )}
        </div>
        {artist.bio && <p className="text-sm text-zinc-500 truncate">{artist.bio}</p>}
      </div>
      {!isMe && (
        <button
          type="button"
          onClick={handleFollow}
          className={`flex h-11 min-h-[44px] items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors border ${
            isFollowing
              ? 'bg-zinc-100 text-zinc-600 border-zinc-200 lg:hover:bg-zinc-200'
              : 'bg-primary text-white border-primary lg:hover:bg-primary/90'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isFollowing ? t('social.following') : t('social.follow')}
        </button>
      )}
    </div>
  );
}
