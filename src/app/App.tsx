import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { I18nProvider } from './i18n/I18nProvider';
import { PointsBootstrap } from './components/PointsBootstrap';
import { WorksStorageSync } from './components/WorksStorageSync';
import { ConfirmDialogRoot } from './components/ConfirmDialog';
import { OfflineBanner } from './components/OfflineBanner';
import { PendingInviteClaimGate } from './components/PendingInviteClaimGate';
import { applyFontScale } from './utils/fontScale';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    applyFontScale();
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <PointsBootstrap />
        <WorksStorageSync />
        <OfflineBanner />
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
        <ConfirmDialogRoot />
        <PendingInviteClaimGate />
      </I18nProvider>
    </ErrorBoundary>
  );
}