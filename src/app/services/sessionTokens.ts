/**
 * 기획·로컬 검수용 모의 JWT 세션 (실서버 토큰 검증 없음).
 * 로그인 시 발급, 로그아웃 시 삭제.
 */
const STORAGE_KEY = 'artier_mock_jwt_session';

export interface MockJwtSession {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  issuedAt: number;
  sub: string;
}

function b64url(obj: Record<string, unknown>): string {
  const s = JSON.stringify(obj);
  const encoded = btoa(unescape(encodeURIComponent(s)));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

/** RFC 7519 형태를 닮은 데모 문자열 (서명은 검증하지 않음) */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  return `${header}.${body}.demo_signature`;
}

export function persistMockSession(sub: string): MockJwtSession {
  const now = Date.now();
  const accessMs = 15 * 60 * 1000;
  const refreshMs = 7 * 24 * 60 * 60 * 1000;
  const accessExpiresAt = now + accessMs;
  const refreshExpiresAt = now + refreshMs;
  const state: MockJwtSession = {
    sub,
    issuedAt: now,
    accessExpiresAt,
    refreshExpiresAt,
    accessToken: fakeJwt({
      sub,
      typ: 'access',
      iat: Math.floor(now / 1000),
      exp: Math.floor(accessExpiresAt / 1000),
    }),
    refreshToken: fakeJwt({
      sub,
      typ: 'refresh',
      iat: Math.floor(now / 1000),
      exp: Math.floor(refreshExpiresAt / 1000),
    }),
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function loadMockSession(): MockJwtSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as MockJwtSession;
    if (
      typeof p.accessToken === 'string' &&
      typeof p.refreshToken === 'string' &&
      typeof p.accessExpiresAt === 'number' &&
      typeof p.refreshExpiresAt === 'number'
    ) {
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearMockSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isAccessExpired(session: MockJwtSession | null): boolean {
  if (!session) return true;
  return Date.now() >= session.accessExpiresAt;
}

/** 리프레시 토큰 유효 시 액세스 토큰만 재발급 (데모) */
export function refreshMockAccessToken(): MockJwtSession | null {
  const s = loadMockSession();
  if (!s) return null;
  if (Date.now() >= s.refreshExpiresAt) {
    clearMockSession();
    return null;
  }
  const now = Date.now();
  const accessMs = 15 * 60 * 1000;
  const accessExpiresAt = now + accessMs;
  const next: MockJwtSession = {
    ...s,
    issuedAt: now,
    accessExpiresAt,
    accessToken: fakeJwt({
      sub: s.sub,
      typ: 'access',
      iat: Math.floor(now / 1000),
      exp: Math.floor(accessExpiresAt / 1000),
    }),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** 실 API 연동 전 데모용 Authorization 헤더 */
export function demoAuthHeader(): Record<string, string> {
  const s = loadMockSession();
  if (!s || isAccessExpired(s)) return {};
  return { Authorization: `Bearer ${s.accessToken}` };
}
