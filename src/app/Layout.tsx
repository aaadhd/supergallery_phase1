import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { getStoredLocale } from './i18n/uiStrings';
import { useI18n } from './i18n/I18nProvider';
import { accountSuspensionStore, authStore } from './store';

const TITLE_BY_PATH: { prefix: string; ko: string; en: string }[] = [
  { prefix: '/search', ko: '검색 · Proud Gallery', en: 'Search · Proud Gallery' },
  { prefix: '/events', ko: '이벤트 · Proud Gallery', en: 'Events · Proud Gallery' },
  { prefix: '/upload', ko: '작품 올리기 · Proud Gallery', en: 'Upload · Proud Gallery' },
  { prefix: '/settings', ko: '설정 · Proud Gallery', en: 'Settings · Proud Gallery' },
  { prefix: '/notifications', ko: '알림 · Proud Gallery', en: 'Notifications · Proud Gallery' },
  { prefix: '/about', ko: '소개 · Proud Gallery', en: 'About · Proud Gallery' },
  { prefix: '/terms', ko: '이용약관 · Proud Gallery', en: 'Terms · Proud Gallery' },
  { prefix: '/privacy', ko: '개인정보처리방침 · Proud Gallery', en: 'Privacy · Proud Gallery' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  /** 홈 둘러보기: 스크롤은 main만, 푸터는 항상 화면 하단에 보임 */
  const { t } = useI18n();
  const browseDocked = pathname === '/';
  const hideFooter = false; // Always show footer
  const [localeTick, setLocaleTick] = useState(0);

  // 전역 계정 정지 가드 — 정지된 상태면 강제 로그아웃
  useEffect(() => {
    if (authStore.isLoggedIn() && accountSuspensionStore.get().active) {
      authStore.logout();
      navigate('/login', { replace: true });
    }
  }, [pathname, navigate]);

  useEffect(() => {
    const onLocale = () => setLocaleTick((x) => x + 1);
    window.addEventListener('artier-locale', onLocale as EventListener);
    return () => window.removeEventListener('artier-locale', onLocale as EventListener);
  }, []);

  useEffect(() => {
    const loc = getStoredLocale();
    const hit = TITLE_BY_PATH.find((t) => pathname.startsWith(t.prefix));
    document.title = hit ? (loc === 'en' ? hit.en : hit.ko) : loc === 'en' ? 'Proud Gallery — Digital art gallery' : 'Proud Gallery — 디지털 갤러리';
  }, [pathname, localeTick]);

  if (browseDocked) {
    return (
      <div className="flex h-dvh min-h-0 flex-col bg-background overflow-x-hidden max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
        <a
          href="#browse-scroll-root"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background focus:shadow-lg"
        >
          {t('skipToContent')}
        </a>
        <Header />
        <main id="browse-scroll-root" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <Outlet />
        </main>
        <div className="hidden md:block"><Footer /></div>
      </div>
    );
  }

  // 일반 페이지: 홈과 동일 구조 — 화면 고정 높이 + main 내부 스크롤 + Footer 화면 하단 고정
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background overflow-x-hidden max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background focus:shadow-lg"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <Outlet />
      </main>
      {!hideFooter && <div className="hidden md:block"><Footer /></div>}
    </div>
  );
}
