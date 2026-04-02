import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredLocale, setStoredLocale, type Locale } from './uiStrings';
import { translate, type MessageKey } from './messages';

function syncHtmlMetaDescription(locale: Locale) {
  if (typeof document === 'undefined') return;
  const desc = translate(locale, 'meta.ogDescription');
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc);
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  useEffect(() => {
    const onLocale = (e: Event) => {
      const d = (e as CustomEvent<Locale>).detail;
      if (d === 'ko' || d === 'en') setLocaleState(d);
    };
    window.addEventListener('artier-locale', onLocale as EventListener);
    return () => window.removeEventListener('artier-locale', onLocale as EventListener);
  }, []);

  useEffect(() => {
    syncHtmlMetaDescription(locale);
    document.documentElement.lang = locale === 'en' ? 'en' : 'ko';
  }, [locale]);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    setStoredLocale(loc);
  };

  const t = useMemo(
    () => (key: MessageKey) => translate(locale, key),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
