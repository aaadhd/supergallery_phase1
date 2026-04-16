import { motion } from 'framer-motion';
import { X, Heart, Bookmark, Share2, ChevronLeft, ChevronRight, UserPlus, Users, Link2, MessageCircle, Flag, Mail } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { Work, Artist, works, artists as allArtists } from '../data';
import { hydrateGroupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoverImage } from '../utils/imageHelper';
import { userInteractionStore, workStore, authStore, followStore, useFollowStore } from '../store';
import { CopyrightProtectedImage } from './work';
import { toast } from 'sonner';
import { LoginPromptModal } from './LoginPromptModal';
import { ReportModal } from './ReportModal';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import DeepZoomViewer from './DeepZoomViewer';
import { Button } from './ui/button';
import {
  displayExhibitionTitle,
  displayGroupOrgName,
  displayPieceTitleAtIndex,
  displayProminentHeadline,
} from '../utils/workDisplay';

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

  if (!work) return null;

  const headline = displayExhibitionTitle(work, t('work.untitled'));
  const groupOrgLine = displayGroupOrgName(work);
  const isPick = work.editorsPick === true || work.pick === true;
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

  const images = Array.isArray(work.image) ? work.image : [work.image];
  const totalImages = images.length;

  const currentIndex = allWorks.findIndex(w => w.id === workId);
  const prevWork = currentIndex > 0 ? allWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < allWorks.length - 1 ? allWorks[currentIndex + 1] : null;

  const relatedWorks = (() => {
    const isGroup = work.primaryExhibitionType === 'group' || !!work.coOwners?.length || work.owner?.type === 'group';
    if (!isGroup) {
      return allWorks.filter(w => w.artistId === work.artistId && w.id !== work.id).slice(0, 8);
    }
    // 그룹 전시: 참여 작가별 최소 1개씩, 나머지는 채움
    // 참여자는 imageArtists / coOwners / 업로더(artistId)로만 판정.
    // (그룹 멤버 전체는 참여자 ≠ 그룹원이므로 fallback에 쓰지 않음)
    const participantIds = new Set<string>();
    if (work.imageArtists?.length) {
      work.imageArtists.forEach(ia => { if (ia.type === 'member' && ia.memberId) participantIds.add(ia.memberId); });
    }
    if (work.coOwners?.length) {
      work.coOwners.forEach(co => participantIds.add(co.id));
    }
    participantIds.add(work.artistId);

    const picked = new Map<string, typeof allWorks[number]>();
    const usedIds = new Set<string>([work.id]);
    // 각 작가별 1개씩 우선 확보
    for (const aid of participantIds) {
      const found = allWorks.find(w => w.artistId === aid && !usedIds.has(w.id));
      if (found) { picked.set(found.id, found); usedIds.add(found.id); }
    }
    // 나머지 슬롯을 참여 작가 작품으로 채움
    const MAX = 9;
    if (picked.size < MAX) {
      for (const aid of participantIds) {
        for (const w of allWorks) {
          if (picked.size >= MAX) break;
          if (w.artistId === aid && !usedIds.has(w.id)) { picked.set(w.id, w); usedIds.add(w.id); }
        }
        if (picked.size >= MAX) break;
      }
    }
    return [...picked.values()];
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

          {/* Mobile close button (desktop close is in sidebar) */}
          <Button
            type="button"
            variant="toolbar"
            onClick={onClose}
            className="sm:hidden fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white"
            aria-label={t('workDetail.close')}
          >
            <X className="h-5 w-5" />
          </Button>

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
                <h2 className="text-zinc-900 text-[15px] sm:text-[17px] font-extrabold leading-tight truncate">{headline}</h2>
                {isGroupWork ? (
                  // 그룹 작품은 "그룹 자체"가 프로필을 가지지 않음 — 그룹명만 표시하고 팔로우/클릭은 개별 멤버(ArtistRow)로 유도
                  <span className="text-zinc-600 text-[13px] font-medium">
                    {work.groupName?.trim() || groupOrgLine || displayArtistName}
                  </span>
                ) : (
                  <span
                    className="text-zinc-600 font-medium text-[13px] cursor-pointer lg:hover:text-zinc-900 lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(work.artist.id)}
                  >
                    {displayArtistName}
                  </span>
                )}
                {showUploaderLine && (
                  <span
                    className="text-zinc-500 text-[12px] cursor-pointer lg:hover:text-zinc-700 lg:hover:underline transition-colors"
                    onClick={() => handleArtistClick(uploaderArtist.id)}
                  >
                    {t('profile.uploaderLabel')}: {uploaderName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isPick && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold whitespace-nowrap">
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
                className={`hidden sm:flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold transition-colors border ${
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
            <div className={`w-full flex-col flex ${totalImages === 1 ? 'min-h-[60vh] justify-center' : ''}`}>
              {images.map((image, index) => {
                const src = imageUrls[image] || image;
                const slideLabel = displayPieceTitleAtIndex(work, index, t('work.untitled'));
                return (
                <div key={index} className="relative w-full flex items-center justify-center overflow-hidden mb-0 py-8 sm:py-10">
                  
                  {/* Dynamic Color Extracted Background (Blur Effect) */}
                  <div className="absolute inset-0 z-0 bg-[#f4f4f4] pointer-events-none overflow-hidden">
                    <img src={src} className="w-full h-full object-cover blur-[120px] opacity-[0.95] scale-[1.3]" alt="" />
                    <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
                  </div>

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
                  {/* Image index indicator */}
                  {totalImages > 1 && (
                    <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md">
                      <span className="text-white text-[11px] font-bold tracking-wider">{index + 1} / {totalImages}</span>
                    </div>
                  )}

                  {/* 이미지 하단: 작가 + 작품명 (가로 한줄) */}
                  {(() => {
                    const ia = work.imageArtists?.[index];
                    const imgArtist = ia?.type === 'member' && ia.memberId
                      ? allArtists.find(a => a.id === ia.memberId)
                      : undefined;
                    const imgArtistName = imgArtist?.name || (ia?.type === 'non-member' ? ia.displayName : undefined) || (totalImages === 1 ? work.artist.name : undefined);
                    const imgArtistAvatar = imgArtist?.avatar || (totalImages === 1 ? work.artist.avatar : undefined);
                    const showFollow = imgArtist && imgArtist.id !== allArtists[0]?.id;
                    return (imgArtistName || slideLabel !== t('work.untitled')) ? (
                      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-4 sm:px-5 pb-3.5 pt-8">
                        {slideLabel !== t('work.untitled') && (
                          <p className="absolute left-0 right-0 bottom-3.5 text-white/90 text-[15px] font-semibold drop-shadow-md text-center pointer-events-none">{slideLabel}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {imgArtistAvatar && (
                            <img src={imgArtistAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30 shrink-0" />
                          )}
                          {imgArtistName && (
                            <span className="text-white text-[13px] font-semibold drop-shadow-md">{imgArtistName}</span>
                          )}
                          {showFollow && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); requireAuth(() => followStore.toggle(imgArtist.id)); }}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 transition-colors ${
                                follows.isFollowing(imgArtist.id)
                                  ? 'bg-white/20 text-white/80'
                                  : 'bg-white/90 text-zinc-800'
                              }`}
                            >
                              {follows.isFollowing(imgArtist.id) ? t('social.following') : t('social.follow')}
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
                    <p className="mb-5 text-[14px] text-zinc-600">{work.artist.bio}</p>
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
                      className="group min-w-0 w-full text-left rounded-xl p-0 border-0 bg-transparent cursor-pointer shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 aspect-square flex items-center justify-center">
                        <ImageWithFallback
                          src={imageUrls[getCoverImage(rw.image, rw.coverImageIndex)] || getCoverImage(rw.image, rw.coverImageIndex)}
                          alt={displayProminentHeadline(rw, t('work.untitled'))}
                          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-[14px] font-bold text-zinc-900 group-hover:text-primary transition-colors mb-0.5 sm:mb-1 truncate px-0.5">
                        {displayProminentHeadline(rw, t('work.untitled'))}
                      </div>
                      <div className="text-[13px] text-zinc-500 truncate px-0.5">{rw.artist?.name ?? displayArtistName}</div>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )}
            
            {/* Fill remaining space with background */}
            <div className="w-full flex-1 bg-white"></div>

          </div>
        </motion.div>

        {/* ── Right sidebar (desktop) - Floating over Dim overlay! ── */}
        <div className="hidden sm:flex flex-col items-center w-[72px] shrink-0 justify-center pointer-events-auto">

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 border border-white/10 lg:hover:bg-zinc-200 mb-6 transition-colors shadow-lg shadow-black/20"
            aria-label={t('workDetail.close')}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Action buttons — vertically centered */}
          <div className={`flex-1 flex flex-col items-center justify-start gap-4 pt-10 ${isPreview ? 'opacity-40 pointer-events-none' : ''}`}>

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
                        <span className="text-[14px] text-white font-bold leading-none">+</span>
                      </div>
                    )
                  )}
                </div>
                <span className="text-[12px] font-bold text-white/90 group-hover:text-white truncate max-w-[66px] text-center leading-snug drop-shadow-md">{work.artist.name}</span>
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
              <span className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors drop-shadow-md">{(work.likes || 0).toLocaleString()}</span>
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
              <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase drop-shadow-md">{t('workDetail.save')}</span>
            </button>

            {/* Share */}
            <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group"
                  aria-label={t('workDetail.share')}
                >
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#333333] shadow-lg lg:group-hover:bg-[#444] transition-all">
                    <Share2 className="h-[22px] w-[22px] text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase drop-shadow-md">{t('workDetail.share')}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" align="center" className="w-[min(100vw-2rem,17rem)] p-2 bg-white border-zinc-200 shadow-2xl z-[110] text-zinc-900">
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleCopyInvitation}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-zinc-800 lg:hover:bg-zinc-100"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {t('workDetail.copyInviteCard')}
                </Button>
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleCopyLink}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-[13px] text-zinc-800 lg:hover:bg-zinc-100"
                >
                  <Link2 className="h-4 w-4" />
                  {t('workDetail.copyLink')}
                </Button>
                <Button
                  type="button"
                  variant="toolbar"
                  onClick={handleKakaoShare}
                  className="flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-zinc-800 lg:hover:bg-zinc-100"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {t('workDetail.kakaoShare')}
                </Button>
              </PopoverContent>
            </Popover>

            {work.artistId !== allArtists[0].id && (
              <button
                type="button"
                onClick={() => requireAuth(() => setShowReport(true))}
                className="flex h-auto min-h-0 flex-col items-center gap-1.5 py-1 text-white group"
                aria-label={t('workDetail.report')}
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#333333] shadow-lg lg:group-hover:bg-red-500/80 transition-all">
                  <Flag className="h-[20px] w-[20px] text-white/90 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[11px] font-bold text-white/80 group-hover:text-red-400 uppercase transition-colors drop-shadow-md">{t('workDetail.report')}</span>
              </button>
            )}
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
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E]/95 backdrop-blur-sm border-t border-white/10 safe-area-bottom ${isPreview ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Mobile prev/next row */}
        {(prevWork || nextWork) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            {prevWork ? (
              <button type="button" onClick={() => onNavigate?.(prevWork.id)} className="flex items-center gap-1.5 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer">
                <ChevronLeft className="h-4 w-4 text-white/50" />
                <span className="text-xs text-white/50">{t('workDetail.prev')}</span>
              </button>
            ) : <div />}
            {nextWork ? (
              <button type="button" onClick={() => onNavigate?.(nextWork.id)} className="flex items-center gap-1.5 p-0 m-0 border-0 bg-transparent shadow-none cursor-pointer">
                <span className="text-xs text-white/50">{t('workDetail.next')}</span>
                <ChevronRight className="h-4 w-4 text-white/50" />
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
          {/* 그룹·내 작품은 팔로우 버튼 숨김 */}
          {!isGroupWork && work.artist.id !== allArtists[0]?.id && (
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
          )}
          {work.artistId !== allArtists[0].id && (
            <button
              type="button"
              onClick={() => requireAuth(() => setShowReport(true))}
              className="flex flex-col items-center gap-1 p-1.5 -m-1 border-0 bg-transparent shadow-none cursor-pointer"
            >
              <Flag className="h-6 w-6 text-white" />
              <span className="text-[11px] text-white/70">{t('workDetail.report')}</span>
            </button>
          )}
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
  const hasCoOwners = work.coOwners && work.coOwners.length > 0;
  const taggedEmails = work.taggedEmails;

  if (!hasCoOwners && !taggedEmails?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {hasCoOwners && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-[13px] border border-zinc-200">
          <Users className="h-4 w-4" />
          {t('workDetail.coWork')} · {work.coOwners!.map(c => c.name).join(', ')}
        </span>
      )}
      {taggedEmails && taggedEmails.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-zinc-500 text-[13px] border border-zinc-200">
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
            className="text-[15px] font-bold text-zinc-900 truncate cursor-pointer lg:hover:text-primary transition-colors"
            onClick={() => onArtistClick?.(artist.id)}
          >
            {artist.name}
          </h4>
          {isInstructor && (
            <span className="inline-flex items-center shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold border border-amber-500/20">
              {t('profile.instructorBadge')}
            </span>
          )}
        </div>
        {artist.bio && <p className="text-[13px] text-zinc-500 truncate">{artist.bio}</p>}
      </div>
      {!isMe && (
        <button
          type="button"
          onClick={handleFollow}
          className={`flex h-9 min-h-[36px] items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-colors border ${
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
