/**
 * 기획전 store (Policy §15.1·§15.4).
 * 운영팀이 기존 전시에서 작품(piece) 단위로 선별·구성한 컬렉션. 개수 제한 없음.
 * 관리 UI: /admin/curation (CurationManagement.tsx) — localStorage `artier_curation_v1` 영속화.
 * 추천 전시(피드 부스트)는 featuredStore.ts에서 별도 관리.
 */

import { useSyncExternalStore } from 'react';

export type CurationPieceRef = {
  /** 소속 전시(Work.id) */
  workId: string;
  /** Work.imagePieceIds[i] 안정 식별자 */
  pieceId: string;
};

export type CuratedExhibition = {
  id: string;
  title: string;
  subtitle?: string;
  /** 기획전 대표 이미지 URL (선택). Events 페이지 카드에 노출 */
  bannerImageUrl?: string;
  /** YYYY-MM-DD. 미입력 시 상시 운영 */
  startAt?: string;
  /** YYYY-MM-DD. 미입력 시 상시 운영 */
  endAt?: string;
  pieces: CurationPieceRef[];
};

export type CurationState = {
  curatedExhibitions: CuratedExhibition[];
};

const STORAGE_KEY = 'artier_curation_v1';
const CHANGED_EVENT = 'artier-curation-changed';

const DEFAULT_STATE: CurationState = {
  curatedExhibitions: [],
};

function newCuratedExhibitionId(): string {
  return `curation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 레거시 `workIds: string[]` 표현을 `pieces: { workId, pieceId }[]`로 변환.
 * `artier_works`에서 해당 work를 찾아 첫 piece(`imagePieceIds[0]`)에 매핑(best-effort).
 * - work 부재 → 엔트리 드랍(자연 cleanup)
 * - imagePieceIds 부재(레거시 작품) → 엔트리 드랍 (다음 normalizeWorkVisibility 통과 후 새 piece 발급, 운영팀 재추가)
 *
 * 정확 매핑이 깨지면(여러 piece 중 어떤 걸 골라야 할지 모호) 첫 piece로 보수적 매핑.
 * 마이그레이션 정밀성보다 데이터 무결성을 우선.
 */
function migrateLegacyWorkIds(workIds: unknown): CurationPieceRef[] {
  if (!Array.isArray(workIds)) return [];
  if (typeof window === 'undefined') return [];
  let worksMap: Map<string, { imagePieceIds?: unknown }> | null = null;
  try {
    const wRaw = localStorage.getItem('artier_works');
    if (wRaw) {
      const arr = JSON.parse(wRaw);
      if (Array.isArray(arr)) {
        worksMap = new Map();
        for (const w of arr) {
          if (w && typeof w === 'object' && typeof (w as { id?: unknown }).id === 'string') {
            worksMap.set((w as { id: string }).id, w as { imagePieceIds?: unknown });
          }
        }
      }
    }
  } catch { /* ignore */ }

  const out: CurationPieceRef[] = [];
  for (const wid of workIds) {
    if (typeof wid !== 'string' || !wid) continue;
    const w = worksMap?.get(wid);
    if (!w) continue;
    const ids = Array.isArray(w.imagePieceIds) ? (w.imagePieceIds as unknown[]) : [];
    const first = ids.find((x): x is string => typeof x === 'string' && !!x);
    if (!first) continue;
    out.push({ workId: wid, pieceId: first });
  }
  return out;
}

function parsePieces(raw: unknown): CurationPieceRef[] {
  if (!Array.isArray(raw)) return [];
  const out: CurationPieceRef[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const obj = p as { workId?: unknown; pieceId?: unknown };
    if (typeof obj.workId === 'string' && obj.workId && typeof obj.pieceId === 'string' && obj.pieceId) {
      out.push({ workId: obj.workId, pieceId: obj.pieceId });
    }
  }
  return out;
}

/**
 * 마이그레이션 우선순위:
 *   1. parsed.curatedExhibitions (현행)
 *   2. parsed.themes (legacy 사이클 1: pieces 배열 또는 workIds 배열)
 *   3. parsed.theme (legacy 단일 객체)
 *
 * 기존 ID(`theme-...`)·기존 piece 데이터는 그대로 보존. 새로 발급되는 ID만 `curation-` 접두어.
 */
function readFromStorage(): CurationState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);

    let curatedExhibitions: CuratedExhibition[] = [];
    const sourceArr = Array.isArray(parsed?.curatedExhibitions)
      ? parsed.curatedExhibitions
      : Array.isArray(parsed?.themes)
        ? parsed.themes
        : null;

    if (sourceArr) {
      curatedExhibitions = sourceArr
        .filter((t: unknown): t is Record<string, unknown> => !!t && typeof t === 'object')
        .map((t: Record<string, unknown>) => {
          const pieces = Array.isArray(t.pieces)
            ? parsePieces(t.pieces)
            : migrateLegacyWorkIds(t.workIds);
          const rawTitle = typeof t.title === 'string' ? (t.title as string) : '';
          const title = rawTitle === '수채화 작품전' ? '봄 수채화 기획전' : rawTitle;
          return {
            id: typeof t.id === 'string' && t.id ? (t.id as string) : newCuratedExhibitionId(),
            title,
            subtitle: typeof t.subtitle === 'string' ? (t.subtitle as string) : undefined,
            bannerImageUrl: typeof t.bannerImageUrl === 'string' ? (t.bannerImageUrl as string) : undefined,
            startAt: typeof t.startAt === 'string' ? (t.startAt as string) : undefined,
            endAt: typeof t.endAt === 'string' ? (t.endAt as string) : undefined,
            pieces,
          };
        })
        .filter((t: CuratedExhibition) => t.title.trim().length > 0);
    } else if (parsed?.theme && typeof parsed.theme.title === 'string') {
      const legacy = parsed.theme as Record<string, unknown>;
      const pieces = Array.isArray(legacy.pieces)
        ? parsePieces(legacy.pieces)
        : migrateLegacyWorkIds(legacy.workIds);
      curatedExhibitions = [
        {
          id: 'legacy-default',
          title: legacy.title as string,
          subtitle: typeof legacy.subtitle === 'string' ? (legacy.subtitle as string) : undefined,
          pieces,
        },
      ];
    }

    return { curatedExhibitions };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeToStorage(state: CurationState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cached = null;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

let cached: CurationState | null = null;
function getStable(): CurationState {
  if (cached === null) cached = readFromStorage();
  return cached;
}

if (typeof window !== 'undefined') {
  const invalidate = () => {
    cached = null;
  };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });
}

export const curationStore = {
  getState: getStable,
  getCuratedExhibitions(): CuratedExhibition[] {
    return getStable().curatedExhibitions;
  },
  addCuratedExhibition(exh: Omit<CuratedExhibition, 'id'>): CuratedExhibition {
    const next: CuratedExhibition = { ...exh, id: newCuratedExhibitionId() };
    const current = readFromStorage();
    writeToStorage({ ...current, curatedExhibitions: [...current.curatedExhibitions, next] });
    return next;
  },
  updateCuratedExhibition(id: string, patch: Partial<Omit<CuratedExhibition, 'id'>>): void {
    const current = readFromStorage();
    writeToStorage({
      ...current,
      curatedExhibitions: current.curatedExhibitions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  },
  removeCuratedExhibition(id: string): void {
    const current = readFromStorage();
    writeToStorage({
      ...current,
      curatedExhibitions: current.curatedExhibitions.filter((t) => t.id !== id),
    });
  },
  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => listener();
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },
};

export function useCuration(): CurationState {
  return useSyncExternalStore(curationStore.subscribe, getStable, () => DEFAULT_STATE);
}

/**
 * 기획전 시드 — localStorage가 비어 있을 때 한 번만 실행.
 * workStore가 마운트된 이후(PointsBootstrap)에 호출해야 한다.
 */
export function seedCurationIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const current = readFromStorage();
  if (current.curatedExhibitions.length > 0) return;

  // 동적 import로 순환 의존성 없이 workStore 접근
  import('../store').then(({ workStore }) => {
    const works = workStore.getWorks();
    if (works.length === 0) return;

    // 수채화 작품전: 수채 관련 작품 우선, 없으면 앞 5개
    const watercolorWorks = works.filter((w) => {
      const name = (w.exhibitionName || w.title || '').toLowerCase();
      return name.includes('수채') || name.includes('블룸') || name.includes('꽃') || name.includes('일러스트');
    });
    const targetWorks = (watercolorWorks.length >= 3 ? watercolorWorks : works).slice(0, 5);

    const pieces = targetWorks.flatMap((w) => {
      const ids = w.imagePieceIds ?? [];
      if (ids.length === 0) return [];
      return [{ workId: w.id, pieceId: ids[0] }];
    }).slice(0, 5);

    if (pieces.length === 0) return;

    const refreshed = readFromStorage();
    if (refreshed.curatedExhibitions.length > 0) return;

    writeToStorage({
      ...refreshed,
      curatedExhibitions: [
        {
          id: 'seed-curation-1',
          title: '봄 수채화 기획전',
          subtitle: '감성 넘치는 수채화 작가들의 작품을 만나보세요',
          pieces,
        },
      ],
    });
  });
}
