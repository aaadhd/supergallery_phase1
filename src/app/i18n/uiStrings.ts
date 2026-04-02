export type Locale = 'ko' | 'en';

const LOCALE_KEY = 'artier_locale';

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === 'en' || v === 'ko') return v;
  } catch { /* ignore */ }
  return 'ko';
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
    window.dispatchEvent(new CustomEvent('artier-locale', { detail: locale }));
  } catch { /* ignore */ }
}

export const UI_STRINGS = {
  ko: {
    navBrowse: '둘러보기',
    navEvents: '이벤트',
    navUpload: '올리기',
    navSearch: '검색',
    navProfile: '프로필',
    navMy: 'MY',
    workUpload: '작품 올리기',
    navAdmin: '운영 관리',
    navSettings: '설정',
    login: '로그인',
    logout: '로그아웃',
    serviceName: 'Artier',
  },
  en: {
    navBrowse: 'Browse',
    navEvents: 'Events',
    navUpload: 'Upload',
    navSearch: 'Search',
    navProfile: 'Profile',
    navMy: 'MY',
    workUpload: 'Upload work',
    navAdmin: 'Admin',
    navSettings: 'Settings',
    login: 'Log in',
    logout: 'Log out',
    serviceName: 'Artier',
  },
} as const;

export function t(locale: Locale) {
  return UI_STRINGS[locale];
}
