/**
 * Supabase는 **공식 JS 클라이언트 패키지 없이** PostgREST `fetch`로만 연결합니다.
 * `npm install` 없이도 dev 서버가 뜨고, URL·anon 키를 넣으면 선택적으로 동작합니다.
 */

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(typeof url === 'string' && url.trim() && typeof key === 'string' && key.trim());
}

export function getSupabaseRestBase(): string | null {
  if (!isSupabaseConfigured()) return null;
  return (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
}

export function getSupabaseAnonKey(): string | null {
  if (!isSupabaseConfigured()) return null;
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string).trim();
}
