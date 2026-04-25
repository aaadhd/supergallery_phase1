/**
 * 어드민(/admin) 접근 제어 — 역할 기반 + 비활동 세션 타임아웃.
 *
 * 명세(정책 모음 > 역할별 권한 정의):
 * - 4 역할: 게스트 / 일반 창작자 / 강사 / 운영팀
 * - 어드민 접근: **운영팀**만 가능
 * - PRD_Admin §0.5.2: **2시간 비활동 시 자동 로그아웃** (재인증 요구)
 *
 * Phase 1 데모 환경에서는 실제 서버 auth가 없으므로 localStorage 기반 role 토글로 시뮬레이션.
 * (Phase 2에서 서버 사이드 권한 검사로 대체 예정)
 *
 * 우회 경로 (환경 변수):
 * - VITE_ADMIN_OPEN=true → role 체크 건너뛰고 로그인만으로 접근 허용 (프리뷰·CI, 프로덕션에서는 자동 차단)
 */

export const OPERATOR_ROLE_STORAGE_KEY = 'artier_admin_session_v1';

/** 2시간 비활동 = 세션 만료. */
export const OPERATOR_SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** 세션 변경(활동 터치·만료·해제) 이벤트. AdminLayout이 구독해 리렌더 트리거. */
export const OPERATOR_SESSION_CHANGED_EVENT = 'artier:operator-session-changed';

type StoredSession = { lastActivityAt: number };

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(OPERATOR_ROLE_STORAGE_KEY);
    if (!raw) return null;
    // 레거시 값('1') — 만료 타임스탬프 없음. 즉시 현재 시각으로 마이그레이션.
    if (raw === '1') {
      const migrated: StoredSession = { lastActivityAt: Date.now() };
      localStorage.setItem(OPERATOR_ROLE_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed?.lastActivityAt !== 'number') return null;
    return { lastActivityAt: parsed.lastActivityAt };
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession): void {
  try {
    localStorage.setItem(OPERATOR_ROLE_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(OPERATOR_ROLE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function emitSessionChange(): void {
  try {
    window.dispatchEvent(new Event(OPERATOR_SESSION_CHANGED_EVENT));
  } catch {
    /* SSR 등 — 무시 */
  }
}

export function hasOperatorRole(): boolean {
  const session = readSession();
  if (!session) return false;
  const elapsed = Date.now() - session.lastActivityAt;
  if (elapsed > OPERATOR_SESSION_TIMEOUT_MS) {
    clearSession();
    emitSessionChange();
    return false;
  }
  return true;
}

export function setOperatorRole(enabled: boolean): void {
  if (enabled) {
    writeSession({ lastActivityAt: Date.now() });
  } else {
    clearSession();
  }
  emitSessionChange();
}

/**
 * 활동 감지 시 세션 타임스탬프를 갱신. 역할이 유효할 때만 동작 (만료된 세션을 되살리지 않음).
 * 호출 빈도를 신경쓰지 않아도 되도록 내부에서 60초 throttle.
 */
let lastTouchAt = 0;
export function touchOperatorSession(): void {
  const now = Date.now();
  if (now - lastTouchAt < 60_000) return;
  const session = readSession();
  if (!session) return;
  const elapsed = now - session.lastActivityAt;
  if (elapsed > OPERATOR_SESSION_TIMEOUT_MS) {
    clearSession();
    emitSessionChange();
    return;
  }
  lastTouchAt = now;
  writeSession({ lastActivityAt: now });
}

export function canAccessAdminRoutes(isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;
  // VITE_ADMIN_OPEN 우회는 개발·프리뷰·CI 전용. 프로덕션 빌드에서는 플래그가 true여도 차단.
  if (!import.meta.env.PROD && import.meta.env.VITE_ADMIN_OPEN === 'true') return true;
  return hasOperatorRole();
}

// Legacy alias (기존 호출부 호환). 새 코드는 hasOperatorRole / setOperatorRole 사용 권장.
export const ADMIN_SESSION_STORAGE_KEY = OPERATOR_ROLE_STORAGE_KEY;
export const hasProdAdminBrowserUnlock = hasOperatorRole;
export const setProdAdminBrowserUnlock = setOperatorRole;
