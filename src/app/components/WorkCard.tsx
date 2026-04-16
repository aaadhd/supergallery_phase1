import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Work } from '../data';
import { imageUrls } from '../imageUrls';
import { CopyrightProtectedImage } from './work/CopyrightProtectedImage';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { getCoverImage, getImageCount, getThumbCover } from '../utils/imageHelper';
import { userInteractionStore, useInteractionStore, useAuthStore, workStore } from '../store';
import { LoginPromptModal } from './LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { displayProminentHeadline, displayExhibitionTitle } from '../utils/workDisplay';
import { toast } from 'sonner';

interface WorkCardProps {
  work: Work;
  showSaleBadge?: boolean;
  /** 본인 프로필에서 검수 상태 라벨(검수 중/게시 불가) 노출 */
  showReviewBadge?: boolean;
  /** 반려 작품 클릭 시 사유 모달로 인터셉트 (본인 프로필 용) */
  onRejectedClick?: (work: Work) => void;
}

export function WorkCard({ work, showSaleBadge, showReviewBadge, onRejectedClick }: WorkCardProps) {
  const { t } = useI18n();
  const firstImage = getThumbCover(work);
  const imageCount = getImageCount(work.image);
  const interactions = useInteractionStore();
  const auth = useAuthStore();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const pieceLabel = displayProminentHeadline(work, t('work.untitled'));
  const exhibitionTitle = displayExhibitionTitle(work, '');

  const isLiked = interactions.isLiked(work.id);
  const isSaved = interactions.isSaved(work.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
    const wasLiked = userInteractionStore.isLiked(work.id);
    userInteractionStore.toggleLike(work.id);
    const delta = userInteractionStore.isLiked(work.id) ? 1 : -1;
    workStore.updateWork(work.id, { likes: (workStore.getWork(work.id)?.likes ?? 0) + delta });
    if (wasLiked) {
      toast(t('browse.unliked'), {
        action: { label: t('browse.undo'), onClick: () => {
          userInteractionStore.toggleLike(work.id);
          workStore.updateWork(work.id, { likes: (workStore.getWork(work.id)?.likes ?? 0) + 1 });
        }},
        duration: 3000,
      });
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
    const wasSaved = userInteractionStore.isSaved(work.id);
    userInteractionStore.toggleSave(work.id);
    const delta = userInteractionStore.isSaved(work.id) ? 1 : -1;
    workStore.updateWork(work.id, { saves: (workStore.getWork(work.id)?.saves ?? 0) + delta });
    if (wasSaved) {
      toast(t('browse.unsaved'), {
        action: { label: t('browse.undo'), onClick: () => {
          userInteractionStore.toggleSave(work.id);
          workStore.updateWork(work.id, { saves: (workStore.getWork(work.id)?.saves ?? 0) + 1 });
        }},
        duration: 3000,
      });
    }
  };
  
  const reviewBadge =
    showReviewBadge && work.feedReviewStatus === 'pending'
      ? { text: t('review.badgePending'), cls: 'bg-muted text-muted-foreground border border-border' }
      : showReviewBadge && work.feedReviewStatus === 'rejected'
      ? { text: t('review.badgeRejected'), cls: 'bg-red-50 text-red-700 border border-red-200' }
      : null;

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onRejectedClick && work.feedReviewStatus === 'rejected') {
      e.preventDefault();
      onRejectedClick(work);
    }
  };

  const goToDetail = () => {
    if (onRejectedClick && work.feedReviewStatus === 'rejected') {
      onRejectedClick(work);
    } else {
      navigate(`/exhibitions/${work.id}`);
    }
  };

  return (
    <>
      <div className="group flex flex-col items-stretch">
        {/* Clickable Image Area */}
        <div 
          onClick={goToDetail}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.06] shadow-sm transition-[box-shadow,transform] duration-300 lg:group-hover:shadow-md lg:group-hover:ring-primary/15"
        >
          <div className="aspect-square overflow-hidden bg-muted/30 flex items-center justify-center">
            <CopyrightProtectedImage
              src={imageUrls[firstImage] || firstImage}
              alt={pieceLabel}
              className="w-full h-full min-w-0 min-h-0 object-contain object-center hover-scale"
            />
          </div>

          {reviewBadge && (
            <div className="absolute left-3 bottom-3 z-10">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${reviewBadge.cls}`}>
                {reviewBadge.text}
              </span>
            </div>
          )}

          {imageCount > 1 && (
            <div className="absolute left-3 top-3">
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <ImageIcon className="h-3 w-3" />
                {imageCount}
              </div>
            </div>
          )}

          {showSaleBadge && work.isForSale && (
            <div className="absolute right-3 bottom-3">
              <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShoppingBag className="h-3 w-3" />
                {t('workCard.collectible')}
              </div>
            </div>
          )}

          {/* Top-right overlay buttons — Still clickable independently */}
          <div className="absolute top-2 right-2 flex gap-1.5 z-20">
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 rounded-full shadow-sm lg:hover:!bg-inherit ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90'}`}
              onClick={(e) => { e.stopPropagation(); handleLike(e); }}
              aria-label="좋아요"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 rounded-full shadow-sm lg:hover:!bg-inherit ${isSaved ? 'bg-primary text-primary-foreground' : 'bg-white/90'}`}
              onClick={(e) => { e.stopPropagation(); handleSave(e); }}
              aria-label="저장"
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Clickable Info Area */}
        <div onClick={goToDetail} className="mt-3.5 space-y-2 cursor-pointer">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug tracking-tight transition-colors lg:group-hover:text-primary">
            {pieceLabel}
          </h3>

          {exhibitionTitle && exhibitionTitle !== pieceLabel && (
            <p className="text-xs text-muted-foreground truncate">{exhibitionTitle}</p>
          )}

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
              <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{work.artist.name}</span>
          </div>
        </div>

        {/* Static Interaction Footer — Independent Buttons */}
        <div className="mt-3 flex items-center gap-5 text-muted-foreground">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-2 group cursor-pointer lg:hover:opacity-80 transition-opacity"
          >
            <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            <div className="flex flex-col items-start leading-none min-w-[32px]">
              <span className={`text-[10px] font-bold ${isLiked ? 'text-red-500' : ''}`}>좋아요</span>
              <span className="text-[9px] font-medium opacity-70">{(work.likes || 0).toLocaleString()}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 group cursor-pointer lg:hover:opacity-80 transition-opacity"
          >
            <Bookmark className={`h-4 w-4 transition-colors ${isSaved ? 'text-primary fill-current' : ''}`} />
            <div className="flex flex-col items-start leading-none min-w-[32px]">
              <span className={`text-[10px] font-bold ${isSaved ? 'text-primary' : ''}`}>저장</span>
              <span className="text-[9px] font-medium opacity-70">{(work.saves || 0).toLocaleString()}</span>
            </div>
          </button>
        </div>
      </div>
      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
    </>
  );
}