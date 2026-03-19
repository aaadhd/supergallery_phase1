import { Link, useNavigate } from 'react-router-dom';
import { Plus, Globe, Check, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { artists } from '../data';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const currentUser = artists[0];

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      navigate('/');
      alert('로그아웃되었습니다.');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <span className="text-2xl font-semibold">artier</span>
          </Link>

          {/* 메인 네비게이션 */}
          <nav className="flex items-center gap-8">
            <Link
              to="/browse"
              className="text-base font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              둘러보기
            </Link>
            <Link
              to="/events"
              className="text-base font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              이벤트
            </Link>
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-4 ml-auto">
            {/* 업로드 버튼 — 크고 눈에 띄게 */}
            <Button size="default" className="gap-2 text-base px-5 py-2.5" onClick={() => navigate('/upload')}>
              <Plus className="h-5 w-5" />
              작품 올리기
            </Button>

            {/* 프로필 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.bio}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="text-sm py-2">
                  내 프로필
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 py-2"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 언어 변경 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Globe className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setLanguage('ko')} className="flex items-center justify-between">
                  <span>한국어</span>
                  {language === 'ko' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="flex items-center justify-between">
                  <span>English</span>
                  {language === 'en' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
