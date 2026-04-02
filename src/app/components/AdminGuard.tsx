import { Navigate } from 'react-router-dom';
import { authStore } from '../store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!authStore.isLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
