import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Globe, Check, LogOut, Settings, Search, Bell, Home, CalendarDays, User } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/uiStrings';

function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      try {
        const stored = localStorage.getItem('artier_notifications');
        if (stored) {
          const notifs = JSON.parse(stored) as Array<{ read: boolean }>;
          setCount(notifs.filter((n) => !n.read).length);
        }
      } catch {
        /* ignore */
      }
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
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

  const handleLogout = () => {
    if (confirm(t('settings.confirmLogout'))) {
      auth.logout();
      navigate('/');
    }
  };

  const pickLocale = (loc: Locale) => setLocale(loc);

  const handleLogin = () => {
    auth.login();
    const onboardingDone = localStorage.getItem('artier_onboarding_done');
    if (!onboardingDone) {
      navigate('/onboarding');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#F0F0F0] bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-8">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-base sm:text-lg font-bold text-white">A</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold">{t('brand.name')}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
                {t('nav.browse')}
              </Link>
              <Link to="/events" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
                {t('nav.events')}
              </Link>
            </nav>

            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                onClick={() => navigate('/search')}
              >
                <Search className="h-5 w-5 text-gray-600" />
              </Button>

              {loggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full relative"
                    onClick={() => navigate('/notifications')}
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-[18px] sm:h-5 min-w-[18px] sm:min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>

                  <Button
                    size="default"
                    className="hidden sm:flex gap-2 text-sm px-5 py-2.5"
                    onClick={() => navigate('/upload')}
                  >
                    <Plus className="h-5 w-5" />
                    {t('nav.upload')}
                  </Button>
                  <Button size="icon" className="flex sm:hidden h-9 w-9 rounded-full" onClick={() => navigate('/upload')}>
                    <Plus className="h-5 w-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
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
                        {t('nav.profile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')} className="text-sm py-2">
                        {t('nav.settings')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm py-2">
                        <Settings className="h-4 w-4" />
                        {t('nav.admin')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600 py-2"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  size="default"
                  className="gap-2 text-[13px] sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5"
                  onClick={handleLogin}
                >
                  {t('nav.login')}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 rounded-full">
                    <Globe className="h-5 w-5 text-gray-600" />
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0F0F0] safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${location.pathname === '/' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t('nav.browse')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${location.pathname.startsWith('/events') ? 'text-primary' : 'text-gray-400'}`}
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t('nav.events')}</span>
          </button>
          {loggedIn && (
            <button type="button" onClick={() => navigate('/upload')} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary -mt-3 shadow-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-primary -mt-0.5">{t('nav.uploadShort')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${location.pathname === '/search' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t('nav.search')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(loggedIn ? '/profile' : '/')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${location.pathname.startsWith('/profile') ? 'text-primary' : 'text-gray-400'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-[11px] font-medium">{loggedIn ? t('nav.profile') : t('nav.my')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
