import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

const STORAGE_KEY = 'artier_cookie_consent';

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
    const onReset = () => setVisible(true);
    window.addEventListener('artier-cookie-reset', onReset);
    return () => window.removeEventListener('artier-cookie-reset', onReset);
  }, []);

  if (!visible) return null;

  const accept = (type: 'all' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ type, at: new Date().toISOString() }));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 inset-x-0 z-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-xl sm:rounded-2xl bg-white border border-border shadow-2xl p-3 sm:p-4 md:p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Cookie className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-1">{t('cookie.title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('cookie.body')}
              <Link to="/privacy" className="text-primary lg:hover:underline">
                {t('cookie.privacyLink')}
              </Link>
              {t('cookie.bodyAfter')}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={() => accept('all')}
                className="bg-foreground lg:hover:bg-foreground/80 text-sm px-6"
              >
                {t('cookie.acceptAll')}
              </Button>
              <Button
                variant="outline"
                onClick={() => accept('essential')}
                className="text-sm px-6"
              >
                {t('cookie.essentialOnly')}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => accept('essential')}
            className="shrink-0 h-8 w-8 rounded-full lg:hover:bg-muted transition-colors"
            aria-label={t('cookie.close')}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
