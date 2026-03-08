import { Link } from 'react-router-dom';
import { Eye, Users } from 'lucide-react';
import { Room } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link to={`/room/${room.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {/* 전시룸 커버 */}
        <div className="aspect-[16/10] overflow-hidden">
          <ImageWithFallback
            src={imageUrls[room.cover]}
            alt={room.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* 작품 수 배지 */}
        <div className="absolute right-3 top-3">
          <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {room.works.length}개 작품
          </div>
        </div>
      </div>

      {/* 전시룸 정보 */}
      <div className="mt-3 space-y-3">
        <div>
          <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
            {room.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {room.description}
          </p>
        </div>

        {/* 작가 정보 */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={room.artist.avatar} alt={room.artist.name} />
            <AvatarFallback>{room.artist.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{room.artist.name}</span>
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {room.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {room.visitors}명 방문
          </span>
        </div>
      </div>
    </Link>
  );
}
