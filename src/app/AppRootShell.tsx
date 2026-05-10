import { Outlet, useLocation } from 'react-router-dom';
import { QaScreenShortcuts } from './components/QaScreenShortcuts';

export function AppRootShell() {
  // 시니어 친화 — 짧은 fade(150ms)로 인지 부담 없이 페이지 전환 명시.
  const location = useLocation();
  return (
    <>
      <div key={location.pathname} className="animate-in fade-in duration-150 overflow-x-hidden">
        <Outlet />
      </div>
      <QaScreenShortcuts />
    </>
  );
}
