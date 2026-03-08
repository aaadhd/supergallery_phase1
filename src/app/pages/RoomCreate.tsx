import { useNavigate } from 'react-router-dom';
import { Palette } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function RoomCreate() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-semibold">전시룸 만들기</h1>
          <p className="text-lg text-muted-foreground">
            작품을 담을 전시 공간을 만들어보세요
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div
            className="group cursor-pointer rounded-lg border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-lg"
            onClick={() => navigate('/rooms/edit')}
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">새 전시룸</h3>
            <p className="text-sm text-muted-foreground">제목과 작품을 설정하여 전시룸을 만듭니다.</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button variant="ghost" onClick={() => navigate('/rooms')}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
