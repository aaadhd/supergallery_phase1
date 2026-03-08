import { useNavigate } from 'react-router-dom';
import { Palette, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function RoomCreate() {
  const navigate = useNavigate();

  const templates = [
    {
      id: 'portfolio',
      title: '포트폴리오 전시',
      description: '나의 대표 작품들을 체계적으로 보여주는 전시',
      icon: Palette,
    },
    {
      id: 'theme',
      title: '테마 전시',
      description: '특정 주제나 시리즈로 묶은 기획 전시',
      icon: Sparkles,
    },
    {
      id: 'return',
      title: '리턴전 (재데뷔전)',
      description: '새로운 시작을 알리는 특별한 전시',
      icon: RotateCcw,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-semibold">전시룸 만들기</h1>
          <p className="text-lg text-muted-foreground">
            원하는 템플릿을 선택하여 나만의 전시 공간을 만들어보세요
          </p>
        </div>

        {/* 템플릿 선택 */}
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="group cursor-pointer rounded-lg border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-lg"
                onClick={() => navigate(`/rooms/edit?template=${template.id}`)}
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{template.title}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            );
          })}
        </div>

        {/* 하단 액션 */}
        <div className="mt-12 text-center">
          <Button variant="ghost" onClick={() => navigate('/rooms')}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
