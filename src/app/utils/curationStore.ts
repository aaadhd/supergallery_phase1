/**
 * 피드 큐레이션 레이어 store (Policy §15.1·§15.4: 기획전 — 운영팀이 기존 전시를 주제·맥락으로
 * 선별·구성한 컬렉션, 개수 제한 없음).
 * Pick 상단 → **기획전·작가 추천 큐레이션** → 일반 랜덤 순서의 중간 레이어를 관리.
 *
 * Phase 1 데모 scope:
 * - 기획전: 다수 운영 가능 (각 기획전 = 제목 + 부제(선택) + 포함 작품 ID 리스트)
 * - 추천 작가: 피드 상단 부스트 대상 작가 ID 집합
 * - 관리 UI: [/admin/curation](src/app/admin/CurationManagement.tsx) — localStorage `artier_curation_v1` 영속화
 */

import { useSyncExternalStore } from 'react';

export type ThemeExhibition = {
  id: string;
  title: string;
  subtitle?: string;
  workIds: string[];
};

export type CurationState = {
  themes: ThemeExhibition[];
  featuredArtistIds: string[];
};

const STORAGE_KEY = 'artier_curation_v1';
const CHANGED_EVENT = 'artier-curation-changed';

const DEFAULT_STATE: CurationState = {
  themes: [],
  featuredArtistIds: [],
};

function newThemeId(): string {
  return `theme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function readFromStorage(): CurationState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);

    // 마이그레이션: 단일 theme(legacy) → themes 배열
    let themes: ThemeExhibition[] = [];
    if (Array.isArray(parsed?.themes)) {
      themes = parsed.themes
        .filter((t: unknown): t is { id?: unknown; title?: unknown; subtitle?: unknown; workIds?: unknown } =>
          !!t && typeof t === 'object',
        )
        .map((t) => ({
          id: typeof t.id === 'string' && t.id ? t.id : newThemeId(),
          title: typeof t.title === 'string' ? t.title : '',
          subtitle: typeof t.subtitle === 'string' ? t.subtitle : undefined,
          workIds: Array.isArray(t.workIds) ? (t.workIds.filter((x) => typeof x === 'string') as string[]) : [],
        }))
        .filter((t) => t.title.trim().length > 0);
    } else if (parsed?.theme && typeof parsed.theme.title === 'string') {
      themes = [
        {
          id: 'legacy-default',
          title: parsed.theme.title,
          subtitle: typeof parsed.theme.subtitle === 'string' ? parsed.theme.subtitle : undefined,
          workIds: Array.isArray(parsed.theme.workIds)
            ? parsed.theme.workIds.filter((x: unknown) => typeof x === 'string')
            : [],
        },
      ];
    }

    return {
      themes,
      featuredArtistIds: Array.isArray(parsed?.featuredArtistIds) ? parsed.featuredArtistIds : [],
    };
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
  getThemes(): ThemeExhibition[] {
    return getStable().themes;
  },
  getFeaturedArtistIds(): string[] {
    return getStable().featuredArtistIds;
  },
  addTheme(theme: Omit<ThemeExhibition, 'id'>): ThemeExhibition {
    const next: ThemeExhibition = { ...theme, id: newThemeId() };
    const current = readFromStorage();
    writeToStorage({ ...current, themes: [...current.themes, next] });
    return next;
  },
  updateTheme(id: string, patch: Partial<Omit<ThemeExhibition, 'id'>>): void {
    const current = readFromStorage();
    writeToStorage({
      ...current,
      themes: current.themes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  },
  removeTheme(id: string): void {
    const current = readFromStorage();
    writeToStorage({
      ...current,
      themes: current.themes.filter((t) => t.id !== id),
    });
  },
  toggleFeaturedArtist(artistId: string): void {
    const current = readFromStorage();
    const set = new Set(current.featuredArtistIds);
    if (set.has(artistId)) set.delete(artistId);
    else set.add(artistId);
    writeToStorage({ ...current, featuredArtistIds: [...set] });
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
