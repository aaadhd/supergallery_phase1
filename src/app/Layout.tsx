import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { getStoredLocale } from './i18n/uiStrings';
import { useI18n } from './i18n/I18nProvider';

const TITLE_BY_PATH: { prefix: string; ko: string; en: string }[] = [
  { prefix: '/search', ko: '검색 · Artier', en: 'Search · Artier' },
  { prefix: '/events', ko: '이벤트 · Artier', en: 'Events · Artier' },
  { prefix: '/upload', ko: '작품 올리기 · Artier', en: 'Upload · Artier' },
  { prefix: '/settings', ko: '설정 · Artier', en: 'Settings · Artier' },
  { prefix: '/notifications', ko: '알림 · Artier', en: 'Notifications · Artier' },
  { prefix: '/about', ko: '소개 · Artier', en: 'About · Artier' },
  { prefix: '/terms', ko: '이용약관 · Artier', en: 'Terms · Artier' },
  { prefix: '/privacy', ko: '개인정보처리방침 · Artier', en: 'Privacy · Artier' },
];

export default function Layout() {
  const { pathname } = useLocation();
  /** 홈 둘러보기: 스크롤은 main만, 푸터는 항상 화면 하단에 보임 */
  const { t } = useI18n();
  const browseDocked = pathname === '/';
  const hideFooter = pathname.startsWith('/upload');
  const [localeTick, setLocaleTick] = useState(0);

  useEffect(() => {
    const onLocale = () => setLocaleTick((x) => x + 1);
    window.addEventListener('artier-locale', onLocale as EventListener);
    return () => window.removeEventListener('artier-locale', onLocale as EventListener);
  }, []);

  useEffect(() => {
    const loc = getStoredLocale();
    const hit = TITLE_BY_PATH.find((t) => pathname.startsWith(t.prefix));
    document.title = hit ? (loc === 'en' ? hit.en : hit.ko) : loc === 'en' ? 'Artier — Digital art gallery' : 'Artier — 디지털 갤러리';
  }, [pathname, localeTick]);

  if (browseDocked) {
    return (
      <div className="flex h-dvh min-h-0 flex-col bg-background max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
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
        <Footer />
        <CookieConsent />
      </div>
    );
  }

  // 일반 페이지: 홈과 동일 구조 — 화면 고정 높이 + main 내부 스크롤 + Footer 화면 하단 고정
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
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
      {!hideFooter && <Footer />}
      <CookieConsent />
    </div>
  );
}
