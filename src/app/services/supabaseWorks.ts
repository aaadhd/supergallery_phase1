import type { Work } from '../data';
import { getSupabaseAnonKey, getSupabaseRestBase } from './supabaseClient';

function isArtistShape(x: unknown): x is { id: string; name: string; avatar: string } {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.name === 'string' && typeof o.avatar === 'string';
}

function parseWorkPayload(x: unknown): Work | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const imageOk = typeof o.image === 'string' || (Array.isArray(o.image) && o.image.every((v) => typeof v === 'string'));
  if (
    typeof o.id !== 'string' ||
    typeof o.title !== 'string' ||
    typeof o.artistId !== 'string' ||
    !imageOk ||
    !isArtistShape(o.artist)
  ) {
    return null;
  }
  return {
    ...o,
    likes: typeof o.likes === 'number' ? o.likes : 0,
    saves: typeof o.saves === 'number' ? o.saves : 0,
    comments: typeof o.comments === 'number' ? o.comments : 0,
  } as Work;
}

/**
 * `works` 테이블의 `payload` JSON을 앱 `Work`로 복원합니다 (PostgREST).
 */
export async function fetchWorksFromSupabase(): Promise<Work[]> {
  const base = getSupabaseRestBase();
  const key = getSupabaseAnonKey();
  if (!base || !key) return [];

  const url = `${base}/rest/v1/works?select=payload&order=created_at.desc`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
  } catch (e) {
    console.warn('[supabase] works 네트워크 오류:', e);
    return [];
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.warn('[supabase] works 조회 실패:', res.status, t);
    return [];
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  const out: Work[] = [];
  for (const row of data) {
    const payload = row && typeof row === 'object' && 'payload' in row ? (row as { payload: unknown }).payload : null;
    const w = parseWorkPayload(payload);
    if (w) out.push(w);
    else if (import.meta.env.DEV) console.warn('[supabase] 건너뜀: payload가 Work 최소 형식이 아님', row);
  }
  return out;
}
