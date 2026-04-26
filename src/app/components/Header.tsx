import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Globe, Check, Search, Bell, Home, CalendarDays, User, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/72">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3 sm:gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 rounded-xl pr-2 -ml-1 pl-1 lg:hover:bg-muted/60 transition-colors"
            >
              <img
                src="/logo.png"
                alt="Artier Logo"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl shadow-sm ring-1 ring-border/10"
              />
              <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">{t('brand.name')}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
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

            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
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

                  {/* 프로필 아바타 — 데스크톱 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex rounded-full h-10 w-10"
                    onClick={() => navigate('/me')}
                    aria-label={t('nav.profile')}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                    </Avatar>
                  </Button>

                  {/* 검색 — 데스크톱만 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('nav.search')}
                        className="hidden md:flex h-10 w-10 rounded-full text-muted-foreground lg:hover:text-foreground"
                        onClick={() => navigate('/search')}
                      >
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

                  {/* 설정 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('nav.settings')}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-muted-foreground lg:hover:text-foreground"
                        onClick={() => navigate('/settings')}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{t('nav.settings')}</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent('/upload')}`)}
                    className="hidden md:inline-flex items-center text-sm font-medium text-muted-foreground lg:hover:text-foreground transition-colors px-2 py-1.5 rounded-md"
                  >
                    {t('nav.loginAsArtist')}
                  </button>
                  <Button
                    size="default"
                    className="hidden md:flex gap-2 text-sm px-6 py-2.5"
                    onClick={handleLogin}
                  >
                    {t('nav.login')}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('nav.search')}
                        className="hidden md:flex h-10 w-10 rounded-full text-muted-foreground lg:hover:text-foreground"
                        onClick={() => navigate('/search')}
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{t('nav.search')}</TooltipContent>
                  </Tooltip>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('nav.language')}
                    title={t('nav.language')}
                    className="hidden sm:flex h-9 w-9 rounded-full text-muted-foreground lg:hover:text-foreground"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => pickLocale('ko')} className="flex items-center justify-between">
                    <span>{t('nav.langKo')}</span>
                    {locale === 'ko' && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => pickLocale('en')} className="flex items-center justify-between">
                    <span>{t('nav.langEn')}</span>
                    {locale === 'en' && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-lg border-t border-border/80 safe-area-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
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
