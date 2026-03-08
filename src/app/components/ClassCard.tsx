import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { Class } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface ClassCardProps {
  class: Class;
}

export function ClassCard({ class: classData }: ClassCardProps) {
  return (
    <Link to={`/class/${classData.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {/* 클래스 커버 */}
        <div className="aspect-[16/10] overflow-hidden">
          <ImageWithFallback
            src={imageUrls[classData.cover]}
            alt={classData.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* 난이도 배지 */}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur">
            {classData.level}
          </Badge>
        </div>
      </div>

      {/* 클래스 정보 */}
      <div className="mt-3 space-y-3">
        <div>
          <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
            {classData.title}
          </h3>
        </div>

        {/* 강사 정보 */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={classData.instructor.avatar} alt={classData.instructor.name} />
            <AvatarFallback>{classData.instructor.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{classData.instructor.name}</span>
        </div>

        {/* 통계 및 가격 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {classData.rating}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {classData.students}
            </span>
          </div>
          <span className="font-semibold text-foreground">
            ₩{classData.price.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
