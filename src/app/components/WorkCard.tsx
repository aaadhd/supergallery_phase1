import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, MessageCircle, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Work } from '../data';
import { imageUrls } from '../imageUrls';
import { CopyrightProtectedImage } from './work/CopyrightProtectedImage';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { getFirstImage, getImageCount } from '../utils/imageHelper';
import { userInteractionStore, useInteractionStore, authStore, useAuthStore, workStore } from '../store';
import { LoginPromptModal } from './LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';

interface WorkCardProps {
  work: Work;
  showSaleBadge?: boolean;
}

export function WorkCard({ work, showSaleBadge }: WorkCardProps) {
  const { t } = useI18n();
  const firstImage = getFirstImage(work.image);
  const imageCount = getImageCount(work.image);
  const interactions = useInteractionStore();
  const auth = useAuthStore();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const isLiked = interactions.isLiked(work.id);
  const isSaved = interactions.isSaved(work.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
    userInteractionStore.toggleLike(work.id);
    const delta = userInteractionStore.isLiked(work.id) ? 1 : -1;
    workStore.updateWork(work.id, { likes: (workStore.getWork(work.id)?.likes ?? 0) + delta });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
    userInteractionStore.toggleSave(work.id);
    const delta = userInteractionStore.isSaved(work.id) ? 1 : -1;
    workStore.updateWork(work.id, { saves: (workStore.getWork(work.id)?.saves ?? 0) + delta });
  };
  
  return (
    <>
      <Link to={`/exhibitions/${work.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.06] shadow-sm transition-[box-shadow,transform] duration-300 lg:group-hover:shadow-md lg:group-hover:ring-primary/15">
          <div className="aspect-square overflow-hidden bg-muted/30 flex items-center justify-center">
            <CopyrightProtectedImage
              src={imageUrls[firstImage] || firstImage}
              alt={work.title}
              className="w-full h-full min-w-0 min-h-0 object-contain object-center hover-scale"
              showWatermark={false}
              watermarkText={work.artist?.name ? `© ${work.artist.name}` : undefined}
            />
          </div>

          {imageCount > 1 && (
            <div className="absolute left-3 top-3">
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <ImageIcon className="h-3 w-3" />
                {imageCount}
              </div>
            </div>
          )}

          {showSaleBadge && work.isForSale && (
            <div className="absolute right-3 top-3">
              <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShoppingBag className="h-3 w-3" />
                {t('workCard.collectible')}
              </div>
            </div>
          )}

          {/* Like & Save — touch: always visible top-right / hover device: overlay on hover */}
          <div className="absolute top-2 right-2 flex gap-1.5 hover-action z-10">
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 rounded-full shadow-sm pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 active:scale-95 touch-manipulation lg:hover:!bg-inherit ${isLiked ? 'bg-red-500 text-white active:bg-red-600 lg:hover:!bg-red-500' : 'bg-white/90 active:bg-white lg:hover:!bg-white'}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 rounded-full shadow-sm pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 active:scale-95 touch-manipulation lg:hover:!bg-inherit ${isSaved ? 'bg-primary text-primary-foreground active:bg-primary/90 lg:hover:!bg-primary' : 'bg-white/90 active:bg-white lg:hover:!bg-white'}`}
              onClick={handleSave}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="mt-3.5 space-y-2">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug tracking-tight transition-colors lg:group-hover:text-primary pointer-coarse:active:text-primary">
            {work.title}
          </h3>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
              <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{work.artist.name}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}>
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              {work.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {work.comments}
            </span>
          </div>
        </div>
      </Link>
      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
    </>
  );
}