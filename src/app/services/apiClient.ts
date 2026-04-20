/**
 * Phase 1 프론트 전용 — 실 API 연결 시 `VITE_API_BASE_URL` 설정.
 * OAuth·메일·파일 업로드 URL은 백엔드 스펙에 맞게 이 모듈을 확장하면 됩니다.
 */
export { demoAuthHeader } from './sessionTokens';

const base = () => (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function isApiConfigured(): boolean {
  return base().length > 0;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const b = base();
  if (!b) {
    throw new Error('VITE_API_BASE_URL is not set');
  }
  const url = path.startsWith('http') ? path : `${b}${path.startsWith('/') ? '' : '/'}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
}

/** 이메일 매직 링크 발송 — 백엔드 미구성 시 no-op (Phase 1은 magicLinkStore 로컬 모의로 대체) */
export async function requestEmailMagicLink(_payload: {
  email: string;
  intent: 'login' | 'signup';
  redirectTo?: string;
}): Promise<void> {
  if (!isApiConfigured()) return;
  await apiFetch('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify(_payload),
  });
}
