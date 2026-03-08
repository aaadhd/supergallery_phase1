import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Palette, ChevronDown, Settings, LogOut, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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

// 더미 알림 데이터
const DUMMY_NOTIFICATIONS = [
  { id: '1', type: 'like', message: '김민서님이 \"봄의 시작\"을 좋아합니다.', time: '2분 전', read: false },
  { id: '2', type: 'follow', message: '이준호님이 팔로우하기 시작했습니다.', time: '15분 전', read: false },
  { id: '3', type: 'sale', message: '\"겨울 풍경\" 판매 심사가 승인되었습니다.', time: '1시간 전', read: false },
  { id: '4', type: 'comment', message: '박지원님이 댓글을 남겼습니다: "정말 아름다운..."', time: '3시간 전', read: true },
  { id: '5', type: 'like', message: '최현아님이 \"도시의 밤\"을 좋아합니다.', time: '어제', read: true },
];

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const currentUser = artists[0];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      // 실제 로그아웃 로직 — 현재는 홈으로 이동
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <span className="text-xl font-semibold">artier</span>
          </Link>

          {/* 메인 네비게이션 */}
          <nav className="flex items-center gap-6">
            <Link
              to="/browse"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              둘러보기
            </Link>
            <Link
              to="/browse?filter=for-sale"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              마켓
            </Link>
            <Link
              to="/learn"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              러닝
            </Link>
            <Link
              to="/events"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              이벤트
            </Link>
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3 ml-auto">
            {/* 검색 */}
            {isSearchExpanded ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="작품, 작가, 전시룸 검색..."
                    className="pl-10 pr-4 w-64 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!searchQuery) setIsSearchExpanded(false);
                      }, 200);
                    }}
                    autoFocus
                  />
                </div>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchExpanded(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* 알림 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* 알림 헤더 */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="font-semibold text-[15px]">알림</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[12px] text-primary hover:underline"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                {/* 알림 목록 */}
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/60' : ''
                        }`}
                      onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                    >
                      <div className={`mt-0.5 flex h-2 w-2 flex-shrink-0 rounded-full ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-800 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-8 text-center text-[13px] text-gray-400">
                      알림이 없습니다.
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 업로드 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  작품 업로드
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/upload')}>
                  <Plus className="mr-2 h-4 w-4" />
                  작품 업로드
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://sgf.iproud.app/studio', '_blank')}>
                  <Palette className="mr-2 h-4 w-4" />
                  드로잉 툴 열기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 프로필 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
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
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  내 프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/sales')}>
                  💰 판매 관리
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  관리자 (심사)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}