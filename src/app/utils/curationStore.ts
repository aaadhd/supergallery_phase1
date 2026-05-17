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
  /** 기획전 대표 이미지. Events 페이지 카드에 노출 */
  bannerImageUrl: string;
  /** YYYY-MM-DD. 이벤트 메뉴 게시 시작일 */
  startAt: string;
  /** YYYY-MM-DD. 이벤트 메뉴 게시 종료일 */
  endAt: string;
  /**
   * 기획전 상세 외부 링크 URL (필수 — 미설정 시 Events 기획전 탭 미노출).
   * Notion, Framer, 커스텀 HTML 등 자유 제작 후 URL 등록.
   */
  pageUrl?: string;
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
            pageUrl: typeof t.pageUrl === 'string' && t.pageUrl ? (t.pageUrl as string) : undefined,
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
          bannerImageUrl: '',
          startAt: '',
          endAt: '',
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

  import('../store').then(({ workStore }) => {
    const works = workStore.getWorks();
    if (works.length === 0) return;

    const current = readFromStorage();

    const seedIds = ['seed-curation-1','seed-curation-2','seed-curation-3','seed-curation-4','seed-curation-5','seed-curation-6'];
    const hasSeed1 = current.curatedExhibitions.some((c) => c.id === 'seed-curation-1');
    const seed1NeedsUrl = current.curatedExhibitions.some((c) => c.id === 'seed-curation-1' && !c.pageUrl);
    const hasSeed2 = current.curatedExhibitions.some((c) => c.id === 'seed-curation-2');
    const existingSeedIds = new Set(current.curatedExhibitions.map((c) => c.id));
    const hasNonSeed = current.curatedExhibitions.some((c) => !seedIds.includes(c.id));

    if (hasNonSeed && !hasSeed1) return; // 사용자 데이터만 있음 — 건드리지 않음

    const makePieces = (pool: typeof works, count: number): CurationPieceRef[] =>
      pool.flatMap((w) => {
        const ids = w.imagePieceIds ?? [];
        return ids[0] ? [{ workId: w.id, pieceId: ids[0] }] : [];
      }).slice(0, count);

    // piece의 첫 이미지를 배너로 사용하는 헬퍼
    const getBanner = (pieces: CurationPieceRef[]): string => {
      const w = works.find((x) => x.id === pieces[0]?.workId);
      if (!w) return '';
      const img = Array.isArray(w.image) ? w.image[0] : w.image;
      return img || '';
    };

    // 수채화 계열 작품 우선
    const watercolor = works.filter((w) => {
      const n = (w.exhibitionName || w.title || '').toLowerCase();
      return n.includes('수채') || n.includes('블룸') || n.includes('꽃') || n.includes('일러스트');
    });
    const pool1 = (watercolor.length >= 3 ? watercolor : works).slice(0, 6);
    const pool2 = works.slice(6, 12);
    const pool3 = works.slice(2, 7);
    const pool4 = works.slice(8, 13);
    const pool5 = works.slice(1, 6);
    const pool6 = works.slice(4, 9);

    const pieces1 = makePieces(pool1, 5);
    const pieces2 = makePieces(pool2, 5);
    const pieces3 = makePieces(pool3, 5);
    const pieces4 = makePieces(pool4, 4);
    const pieces5 = makePieces(pool5, 5);
    const pieces6 = makePieces(pool6, 4);

    if (pieces1.length === 0) return;

    // 기존 seed 데이터에 bannerImageUrl 없으면 보완
    let updated = current.curatedExhibitions.map((c) => {
      if (c.id === 'seed-curation-1') {
        return {
          ...c,
          ...(seed1NeedsUrl ? { pageUrl: 'https://proud-gallery.notion.site', startAt: '2026-05-01', endAt: '2026-06-30' } : {}),
          ...(!c.bannerImageUrl ? { bannerImageUrl: getBanner(c.pieces.length ? c.pieces : pieces1) } : {}),
        };
      }
      if (c.id === 'seed-curation-2' && !c.bannerImageUrl) {
        return { ...c, bannerImageUrl: getBanner(c.pieces.length ? c.pieces : pieces2) };
      }
      return c;
    });

    if (!hasSeed1) {
      updated = [...updated, {
        id: 'seed-curation-1',
        title: '봄의 감성 — 수채화 기획전',
        subtitle: '봄빛을 담은 작가들의 섬세한 수채화 모음',
        startAt: '2026-05-01',
        endAt: '2026-06-30',
        pageUrl: 'https://proud-gallery.notion.site',
        bannerImageUrl: getBanner(pieces1),
        pieces: pieces1,
      }];
    }

    if (!hasSeed2 && pieces2.length > 0) {
      updated = [...updated, {
        id: 'seed-curation-2',
        title: '사계의 표정 — 봄·여름展',
        subtitle: '계절의 변화를 담은 작가 6인의 연작',
        startAt: '2026-03-01',
        endAt: '2026-04-30',
        pageUrl: 'https://proud-gallery.notion.site/spring-summer',
        bannerImageUrl: getBanner(pieces2),
        pieces: pieces2,
      }];
    }

    // 지난 기획전 4종 시드
    const pastSeeds = [
      { id: 'seed-curation-3', title: '겨울 서정 — 설경과 정물', subtitle: '고요한 계절을 담은 작가들의 겨울 연작', startAt: '2025-12-01', endAt: '2026-01-31', pieces: pieces3 },
      { id: 'seed-curation-4', title: '빛과 색채 — 추상의 세계', subtitle: '색의 언어로 말하는 작가 5인의 추상 작품전', startAt: '2025-10-01', endAt: '2025-11-30', pieces: pieces4 },
      { id: 'seed-curation-5', title: '일상의 단면 — 정물화 특별전', subtitle: '소박한 일상을 예술로 담아낸 정물화 모음', startAt: '2025-08-01', endAt: '2025-09-30', pieces: pieces5 },
      { id: 'seed-curation-6', title: '자연을 담다 — 풍경화 기획전', subtitle: '산과 들, 바다를 캔버스에 옮긴 풍경화 선집', startAt: '2025-06-01', endAt: '2025-07-31', pieces: pieces6 },
    ];

    for (const s of pastSeeds) {
      if (!existingSeedIds.has(s.id) && s.pieces.length > 0) {
        updated = [...updated, {
          ...s,
          pageUrl: 'https://proud-gallery.notion.site',
          bannerImageUrl: getBanner(s.pieces),
        }];
      }
    }

    writeToStorage({ ...current, curatedExhibitions: updated });
  });
}
