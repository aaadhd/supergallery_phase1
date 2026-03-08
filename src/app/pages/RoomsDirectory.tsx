import { useState } from 'react';
import { RoomCard } from '../components/RoomCard';
import { rooms } from '../data';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function RoomsDirectory() {
  const [sort, setSort] = useState('popular');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">전시룸</h1>
              <p className="mt-2 text-muted-foreground">
                작가들이 큐레이션한 특별한 전시 공간
              </p>
            </div>
            <Button onClick={() => navigate('/rooms/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              전시룸 만들기
            </Button>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {rooms.length}개의 전시룸
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="latest">최신순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 전시룸 그리드 */}
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="grid grid-cols-3 gap-8">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
