/**
 * 어드민(/admin) 접근 제어 — 역할 기반.
 *
 * 명세(정책 모음 > 역할별 권한 정의):
 * - 4 역할: 게스트 / 일반 창작자 / 강사 / 운영팀
 * - 어드민 접근: **운영팀**만 가능
 *
 * Phase 1 데모 환경에서는 실제 서버 auth가 없으므로 localStorage 기반 role 토글로 시뮬레이션.
 * (Phase 2에서 서버 사이드 권한 검사로 대체 예정)
 *
 * 우회 경로 (환경 변수):
 * - VITE_ADMIN_OPEN=true → role 체크 건너뛰고 로그인만으로 접근 허용 (프리뷰·CI용)
 */

export const OPERATOR_ROLE_STORAGE_KEY = 'artier_admin_session_v1';

export function hasOperatorRole(): boolean {
  try {
    return localStorage.getItem(OPERATOR_ROLE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOperatorRole(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(OPERATOR_ROLE_STORAGE_KEY, '1');
    else localStorage.removeItem(OPERATOR_ROLE_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function canAccessAdminRoutes(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;
  if (import.meta.env.VITE_ADMIN_OPEN === 'true') return true;
  return hasOperatorRole();
}

// Legacy alias (기존 호출부 호환). 새 코드는 hasOperatorRole / setOperatorRole 사용 권장.
export const ADMIN_SESSION_STORAGE_KEY = OPERATOR_ROLE_STORAGE_KEY;
export const hasProdAdminBrowserUnlock = hasOperatorRole;
export const setProdAdminBrowserUnlock = setOperatorRole;
