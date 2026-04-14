import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * 네트워크 오프라인 감지 배너.
 * `navigator.onLine`이 false가 되는 순간(브라우저 오프라인 이벤트) 상단에 고정 배너 노출.
 * 클라이언트 감지라 정확도 100%는 아니지만 즉각적 피드백에 유용.
 */
export function OfflineBanner() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? !navigator.onLine : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md"
    >
      <WifiOff className="h-4 w-4" />
      <span>{t('app.offlineMessage')}</span>
    </div>
  );
}
