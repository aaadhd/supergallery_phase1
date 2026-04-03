import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { I18nProvider } from './i18n/I18nProvider';
import { PointsBootstrap } from './components/PointsBootstrap';
import { WorksStorageSync } from './components/WorksStorageSync';

// artier - 디지털 드로잉 갤러리 플랫폼
export default function App() {
  return (
    <I18nProvider>
      <PointsBootstrap />
      <WorksStorageSync />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </I18nProvider>
  );
}