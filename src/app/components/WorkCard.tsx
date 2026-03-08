import { Link } from 'react-router-dom';
import { Heart, Bookmark, MessageCircle, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Work } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { getFirstImage, getImageCount } from '../utils/imageHelper';

interface WorkCardProps {
  work: Work;
  showSaleBadge?: boolean;
}

export function WorkCard({ work, showSaleBadge }: WorkCardProps) {
  const firstImage = getFirstImage(work.image);
  const imageCount = getImageCount(work.image);
  
  return (
    <Link to={`/work/${work.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {/* 작품 이미지 - 정사각형 영역에 비율 유지 */}
        <div className="aspect-square overflow-hidden bg-white">
          <ImageWithFallback
            src={imageUrls[firstImage] || firstImage}
            alt={work.title}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* 이미지 개수 배지 - 2장 이상일 때만 표시 */}
        {imageCount > 1 && (
          <div className="absolute left-3 top-3">
            <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <ImageIcon className="h-3 w-3" />
              {imageCount}
            </div>
          </div>
        )}

        {/* 판매 배지 */}
        {showSaleBadge && work.isForSale && (
          <div className="absolute right-3 top-3">
            <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShoppingBag className="h-3 w-3" />
              소장 가능
            </div>
          </div>
        )}

        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-full items-center justify-center gap-4">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                // 좋아요 액션
              }}
            >
              <Heart className="h-4 w-4" />
              {work.likes}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                // 저장 액션
              }}
            >
              <Bookmark className="h-4 w-4" />
              {work.saves}
            </Button>
          </div>
        </div>
      </div>

      {/* 작품 정보 */}
      <div className="mt-3 space-y-2">
        <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
          {work.title}
        </h3>

        {/* 작가 정보 */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
            <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{work.artist.name}</span>
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {work.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {work.comments}
          </span>
        </div>
      </div>
    </Link>
  );
}