import { Outlet } from 'react-router-dom';
import { QaScreenShortcuts } from './components/QaScreenShortcuts';

export function AppRootShell() {
  return (
    <>
      <Outlet />
      <QaScreenShortcuts />
    </>
  );
}
