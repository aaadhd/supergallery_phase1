/**
 * 브라우저에서 공인 IP 기반 국가 추정 (ipapi.co).
 * CORS/네트워크 실패 시 타임존·locale 폴백.
 */

export type GeoDemoResult = {
  countryCode: string;
  countryName: string;
  region?: string;
  source: 'ipapi' | 'fallback';
};

const CACHE_KEY = 'artier_geo_demo_cache';
const CACHE_TTL_MS = 60 * 60 * 1000;

type Cached = { at: number; data: GeoDemoResult };

function loadCache(): GeoDemoResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    if (Date.now() - c.at > CACHE_TTL_MS) return null;
    return c.data;
  } catch {
    return null;
  }
}

function saveCache(data: GeoDemoResult) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data } satisfies Cached));
  } catch {
    /* ignore */
  }
}

function fallbackFromEnvironment(): GeoDemoResult {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  let countryCode = 'ZZ';
  if (tz.includes('Seoul') || tz.includes('Asia/Seoul')) countryCode = 'KR';
  else if (tz.startsWith('America/')) countryCode = 'US';
  else if (tz.startsWith('Europe/London')) countryCode = 'GB';
  return {
    countryCode,
    countryName: countryCode === 'KR' ? 'Korea (fallback)' : 'Unknown (fallback)',
    region: tz || undefined,
    source: 'fallback',
  };
}

export async function fetchGeoDemo(opts?: { skipCache?: boolean }): Promise<GeoDemoResult> {
  if (typeof window === 'undefined') {
    return { countryCode: 'ZZ', countryName: 'SSR', source: 'fallback' };
  }
  if (!opts?.skipCache) {
    const hit = loadCache();
    if (hit) return hit;
  }

  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 8000);
    let res: Response;
    try {
      res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
    } finally {
      window.clearTimeout(timer);
    }
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as {
      country_code?: string;
      country_name?: string;
      region?: string;
      error?: boolean;
      reason?: string;
    };
    if (j.error || !j.country_code) throw new Error(j.reason || 'ipapi error');
    const data: GeoDemoResult = {
      countryCode: j.country_code,
      countryName: j.country_name || j.country_code,
      region: j.region,
      source: 'ipapi',
    };
    saveCache(data);
    return data;
  } catch {
    const data = fallbackFromEnvironment();
    saveCache(data);
    return data;
  }
}
