/**
 * 프로덕션 빌드에서 /admin 은 로그인만으로는 열리지 않습니다.
 * - 개발(DEV): 로그인 시 허용
 * - 프로덕션: VITE_ADMIN_OPEN=true 이거나, 이 브라우저에서 데모 도구로 잠금 해제한 경우
 */

export const ADMIN_SESSION_STORAGE_KEY = 'artier_admin_session_v1';

export function hasProdAdminBrowserUnlock(): boolean {
  try {
    return localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setProdAdminBrowserUnlock(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, '1');
    else localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function canAccessAdminRoutes(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_ADMIN_OPEN === 'true') return true;
  return hasProdAdminBrowserUnlock();
}
