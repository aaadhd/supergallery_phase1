/**
 * Supabase는 **공식 JS 클라이언트 패키지 없이** PostgREST `fetch`로만 연결합니다.
 * 앱은 현재 시드 + localStorage만 사용하고, 마운트 시 이 API로 작품을 가져오지 않습니다.
 * 다시 쓸 때 fetchWorksFromSupabase + workStore 갱신을 Bootstrap 등에 연결하면 됩니다.
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
