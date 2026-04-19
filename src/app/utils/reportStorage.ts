import { authStore, profileStore } from '../store';

const HIDDEN_KEY = 'artier_report_hidden_v2';
const DEDUPE_KEY = 'artier_report_signatures_v1';
const LEGACY_WORKS = 'artier_reported_works';
const LEGACY_ARTISTS = 'artier_reported_artists';

type HiddenBucket = { works: string[]; artists: string[] };

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** 로그인 사용자 식별(목업). 실서비스는 계정 ID로 대체 */
export function getReporterKey(): string | null {
  if (!authStore.isLoggedIn()) return null;
  const p = profileStore.getProfile();
  const slug = (p.nickname || p.name || 'member').trim();
  return slug || 'member';
}

function readHidden(): Record<string, HiddenBucket> {
  return parseJson<Record<string, HiddenBucket>>(localStorage.getItem(HIDDEN_KEY), {});
}

export function getHiddenWorkIdsForReporter(): Set<string> {
  const rk = getReporterKey();
  if (!rk) return new Set();
  const all = readHidden();
  return new Set(all[rk]?.works ?? []);
}

export function getHiddenArtistIdsForReporter(): Set<string> {
  const rk = getReporterKey();
  if (!rk) return new Set();
  const all = readHidden();
  return new Set(all[rk]?.artists ?? []);
}

export function reportDedupeSignature(
  targetType: 'work' | 'artist',
  targetId: string | undefined,
): string | null {
  if (!targetId) return null;
  const rk = getReporterKey();
  if (!rk) return null;
  return `${rk}|${targetType}|${targetId}`;
}

export function hasAlreadyReported(
  targetType: 'work' | 'artist',
  targetId: string | undefined,
): boolean {
  const sig = reportDedupeSignature(targetType, targetId);
  if (!sig) return false;
  const list = parseJson<string[]>(localStorage.getItem(DEDUPE_KEY), []);
  return list.includes(sig);
}

export function markSignatureReported(
  targetType: 'work' | 'artist',
  targetId: string | undefined,
): void {
  const sig = reportDedupeSignature(targetType, targetId);
  if (!sig) return;
  const list = parseJson<string[]>(localStorage.getItem(DEDUPE_KEY), []);
  if (!list.includes(sig)) {
    list.push(sig);
    localStorage.setItem(DEDUPE_KEY, JSON.stringify(list));
  }
}

/**
 * 작품 삭제 시 이 작품 ID를 참조하는 신고 관련 데이터를 정리.
 *  - DEDUPE_KEY(artier_report_signatures_v1): `<reporter>|work|<workId>` 서명 제거
 *  - HIDDEN_KEY(artier_report_hidden_v2): 모든 reporter의 works 배열에서 workId 제거
 * (감사 목적 이력은 `artier_reports`에 남아 있으며 그쪽은 store.removeWork에서 별도 정리)
 */
export function cleanupReportRefsForWork(workId: string): void {
  if (!workId) return;
  // 1) Dedupe 서명 제거
  try {
    const list = parseJson<string[]>(localStorage.getItem(DEDUPE_KEY), []);
    const cleaned = list.filter((sig) => {
      const parts = sig.split('|');
      // `<reporter>|<type>|<targetId>` 형식. type=work && targetId===workId 매칭 제거.
      return !(parts[1] === 'work' && parts[2] === workId);
    });
    if (cleaned.length !== list.length) {
      localStorage.setItem(DEDUPE_KEY, JSON.stringify(cleaned));
    }
  } catch { /* ignore */ }

  // 2) 신고자별 숨김 목록에서 제거
  try {
    const all = readHidden();
    let touched = false;
    for (const rk of Object.keys(all)) {
      const bucket = all[rk];
      if (Array.isArray(bucket.works) && bucket.works.includes(workId)) {
        bucket.works = bucket.works.filter((id) => id !== workId);
        all[rk] = bucket;
        touched = true;
      }
    }
    if (touched) localStorage.setItem(HIDDEN_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function addHiddenForReporter(
  targetType: 'work' | 'artist',
  targetId: string | undefined,
): void {
  if (!targetId) return;
  const rk = getReporterKey();
  if (!rk) return;
  const all = readHidden();
  const b: HiddenBucket = all[rk] ?? { works: [], artists: [] };
  if (targetType === 'work') {
    if (!b.works.includes(targetId)) b.works.push(targetId);
  } else if (!b.artists.includes(targetId)) {
    b.artists.push(targetId);
  }
  all[rk] = b;
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(all));
}

/** 예전 전역 숨김 키를 현재 로그인 사용자 전용 버킷으로 이전 후 제거 */
export function migrateLegacyReportHiddenOnce(): void {
  if (typeof window === 'undefined') return;
  const rk = getReporterKey();
  const all = readHidden();
  let touched = false;

  const mergeLegacy = (legacyKey: string, field: 'works' | 'artists') => {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return;
    try {
      const ids = JSON.parse(raw) as string[];
      if (!Array.isArray(ids) || ids.length === 0) {
        localStorage.removeItem(legacyKey);
        return;
      }
      if (!rk) {
        localStorage.removeItem(legacyKey);
        return;
      }
      const b: HiddenBucket = all[rk] ?? { works: [], artists: [] };
      for (const id of ids) {
        if (field === 'works' && !b.works.includes(id)) b.works.push(id);
        if (field === 'artists' && !b.artists.includes(id)) b.artists.push(id);
      }
      all[rk] = b;
      touched = true;
      localStorage.removeItem(legacyKey);
    } catch {
      localStorage.removeItem(legacyKey);
    }
  };

  mergeLegacy(LEGACY_WORKS, 'works');
  mergeLegacy(LEGACY_ARTISTS, 'artists');
  if (touched) localStorage.setItem(HIDDEN_KEY, JSON.stringify(all));
}
