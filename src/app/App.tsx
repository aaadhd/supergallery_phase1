import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { I18nProvider } from './i18n/I18nProvider';
import { PointsBootstrap } from './components/PointsBootstrap';
import { WorksStorageSync } from './components/WorksStorageSync';
import { ConfirmDialogRoot } from './components/ConfirmDialog';
import { OfflineBanner } from './components/OfflineBanner';

export default function App() {
  return (
    <I18nProvider>
      <PointsBootstrap />
      <WorksStorageSync />
      <OfflineBanner />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
      <ConfirmDialogRoot />
    </I18nProvider>
  );
}