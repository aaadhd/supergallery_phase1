import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { router } from './routes';
import { I18nProvider } from './i18n/I18nProvider';
import { PointsBootstrap } from './components/PointsBootstrap';
import { WorksStorageSync } from './components/WorksStorageSync';
import { ConfirmDialogRoot } from './components/ConfirmDialog';
import { OfflineBanner } from './components/OfflineBanner';
import { applyFontScale } from './utils/fontScale';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    applyFontScale();
  }, []);

  return (
    <ErrorBoundary>
      {/* Policy §19.4: 기본 light, 시스템 자동 감지(prefers-color-scheme) 미사용. localStorage 'artier_theme'에 사용자 선택 영속. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="artier_theme"
      >
        <I18nProvider>
          <PointsBootstrap />
          <WorksStorageSync />
          <OfflineBanner />
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
          <ConfirmDialogRoot />
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}