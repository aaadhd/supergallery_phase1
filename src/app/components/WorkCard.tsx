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
      <Link to={`/works/${work.id}`} className="group block">
        <div className="relative overflow-hidden rounded-sm">
          <div className="aspect-square overflow-hidden bg-white flex items-center justify-center">
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

          {showSaleBadge && (work as any).isForSale && (
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
              variant="secondary"
              className={`h-8 w-8 rounded-full shadow-sm ${isLiked ? 'bg-red-500 text-white active:bg-red-600' : 'bg-white/90 active:bg-white'}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className={`h-8 w-8 rounded-full shadow-sm ${isSaved ? 'bg-[#6366F1] text-white active:bg-[#4F46E5]' : 'bg-white/90 active:bg-white'}`}
              onClick={handleSave}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
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