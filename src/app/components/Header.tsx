import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Bell, Home, CalendarDays, User, Settings, Globe, Check, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { LoginPromptModal } from './LoginPromptModal';
import { artists } from '../data';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/uiStrings';

function readUnreadCount(): number {
  try {
    const stored = localStorage.getItem('artier_notifications');
    if (stored) {
      const notifs = JSON.parse(stored) as Array<{ read: boolean }>;
      return notifs.filter((n) => !n.read).length;
    }
  } catch { /* ignore */ }
  return 0;
}

function useUnreadNotificationCount() {
  const [count, setCount] = useState(readUnreadCount);
  useEffect(() => {
    const update = () => setCount(readUnreadCount());
    // 다른 탭에서 localStorage 변경 시
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'artier_notifications') update();
    };
    // 같은 탭에서 알림 변경 시 (커스텀 이벤트)
    const onCustom = () => update();
    window.addEventListener('storage', onStorage);
    window.addEventListener('artier-notifications-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('artier-notifications-changed', onCustom);
    };
  }, []);
  return count;
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, setLocale, t } = useI18n();
  const auth = useAuthStore();
  const currentUser = artists[0];
  const loggedIn = auth.isLoggedIn();
  const unreadCount = useUnreadNotificationCount();

  const pickLocale = (loc: Locale) => setLocale(loc);

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const handleLogin = () => {
    const redirect = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 왼쪽: 로고 + 네비 */}
            <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl pr-2 -ml-1 pl-1 lg:hover:bg-muted/60 transition-colors"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-border/10 shrink-0">
                <Palette className="h-5 w-5 sm:h-5 sm:w-5" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">{t('brand.name')}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-1">
              <Link
                to="/"
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/' ? 'text-foreground bg-muted/90' : 'text-muted-foreground lg:hover:text-foreground lg:hover:bg-muted/50'
                }`}
              >
                {t('nav.browse')}
              </Link>
              <Link
                to="/events"
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname.startsWith('/events')
                    ? 'text-foreground bg-muted/90'
                    : 'text-muted-foreground lg:hover:text-foreground lg:hover:bg-muted/50'
                }`}
              >
                {t('nav.events')}
              </Link>
            </nav>
            </div>


            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {loggedIn ? (
                <>
                  {/* 업로드 CTA — 데스크톱만 */}
                  <Button
                    size="default"
                    className="hidden md:flex gap-2 text-sm px-5 py-2.5 rounded-full shadow-sm"
                    onClick={() => {
                      if (location.pathname === '/upload') {
                        navigate('/upload?new=' + Date.now());
                      } else {
                        navigate('/upload');
                      }
                    }}
                  >
                    <Plus className="h-5 w-5" />
                    {t('nav.upload')}
                  </Button>

                  {/* 검색 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t('nav.search')} className="hidden md:flex h-9 w-9 rounded-full text-muted-foreground lg:hover:text-foreground" onClick={() => navigate('/search')}>
                        <Search className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{t('nav.search')}</TooltipContent>
                  </Tooltip>

                  {/* 알림 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          unreadCount > 0
                            ? t('nav.notificationsWithCount').replace('{n}', String(unreadCount))
                            : t('nav.notifications')
                        }
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full relative text-muted-foreground lg:hover:text-foreground"
                        onClick={() => navigate('/notifications')}
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] sm:h-5 min-w-[18px] sm:min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white" aria-hidden="true">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {unreadCount > 0
                        ? t('nav.notificationsWithCount').replace('{n}', String(unreadCount))
                        : t('nav.notifications')}
                    </TooltipContent>
                  </Tooltip>

                  {/* 언어 토글 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 rounded-full text-muted-foreground lg:hover:text-foreground" aria-label={t('nav.language')}>
                        <Globe className="h-4.5 w-4.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => pickLocale('ko')} className="flex items-center justify-between">
                        <span>한국어</span>
                        {locale === 'ko' && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => pickLocale('en')} className="flex items-center justify-between">
                        <span>English</span>
                        {locale === 'en' && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* 프로필 아바타 (드롭다운) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex rounded-full h-10 w-10"
                        aria-label={t('nav.profile')}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                          <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => navigate('/me')}>
                        <User className="h-4 w-4" />
                        <span>{t('nav.profile')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="h-4 w-4" />
                        <span>{t('nav.settings')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    size="default"
                    className="hidden md:flex gap-2 text-sm px-5 py-2.5 rounded-full shadow-sm"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent('/upload')}`)}
                  >
                    <Plus className="h-5 w-5" />
                    {t('nav.upload')}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t('nav.search')} className="hidden md:flex h-9 w-9 rounded-full text-muted-foreground lg:hover:text-foreground" onClick={() => navigate('/search')}>
                        <Search className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{t('nav.search')}</TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* 비로그인 언어 토글 */}
              {!loggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 rounded-full text-muted-foreground lg:hover:text-foreground" aria-label={t('nav.language')}>
                      <Globe className="h-4.5 w-4.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => pickLocale('ko')} className="flex items-center justify-between">
                      <span>한국어</span>
                      {locale === 'ko' && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => pickLocale('en')} className="flex items-center justify-between">
                      <span>English</span>
                      {locale === 'en' && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/92 backdrop-blur-lg border-t border-border/70 safe-area-bottom shadow-[0_-2px_16px_rgba(60,40,70,0.08)]">
        <div className="flex items-center justify-around h-14">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/')}
            className={`h-auto flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">{t('nav.browse')}</span>
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/events')}
            className={`h-auto flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] ${location.pathname.startsWith('/events') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs font-medium">{t('nav.events')}</span>
          </Button>
          <Button variant="ghost" type="button" onClick={() => { if (loggedIn) { if (location.pathname === '/upload') { navigate('/upload?new=' + Date.now()); } else { navigate('/upload'); } } else { setLoginPromptOpen(true); } }} className="h-auto flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary -mt-3 shadow-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-medium text-primary -mt-0.5">{t('nav.uploadShort')}</span>
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/search')}
            className={`h-auto flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] ${location.pathname === '/search' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-medium">{t('nav.search')}</span>
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              if (loggedIn) {
                navigate('/me');
              } else {
                const redirect = location.pathname + location.search;
                navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
              }
            }}
            className={`h-auto flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] ${
              location.pathname.startsWith('/profile') || location.pathname.startsWith('/me') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">{loggedIn ? t('nav.profile') : t('nav.my')}</span>
          </Button>
        </div>
      </nav>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
      </TooltipProvider>
    </>
  );
}
