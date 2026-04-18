/**
 * 피드 큐레이션 레이어 store (명세: 콘텐츠 운영 정책 · 피드 노출 구조).
 * Pick 상단 → **기획전·작가 추천 큐레이션** → 일반 랜덤 순서의 중간 레이어를 관리.
 *
 * Phase 1 데모 scope:
 * - 기획전: 어드민이 운영팀 판단으로 여러 전시를 엮어 내보내는 컬렉션 (제목 + 포함 작품 ID 리스트)
 * - 추천 작가: 피드 상단 부스트 대상 작가 ID 집합
 * - 관리 UI: [/admin/curation](src/app/admin/CurationManagement.tsx) — localStorage `artier_curation_v1` 영속화
 */

import { useSyncExternalStore } from 'react';

export type ThemeExhibition = {
  title: string;
  subtitle?: string;
  workIds: string[];
};

export type CurationState = {
  theme: ThemeExhibition | null;
  featuredArtistIds: string[];
};

const STORAGE_KEY = 'artier_curation_v1';
const CHANGED_EVENT = 'artier-curation-changed';

const DEFAULT_STATE: CurationState = {
  theme: null,
  featuredArtistIds: [],
};

function readFromStorage(): CurationState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme ?? null,
      featuredArtistIds: Array.isArray(parsed.featuredArtistIds) ? parsed.featuredArtistIds : [],
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

// useSyncExternalStore 스냅샷 참조 안정화
let cached: CurationState | null = null;
function getStable(): CurationState {
  if (cached === null) cached = readFromStorage();
  return cached;
}

if (typeof window !== 'undefined') {
  const invalidate = () => { cached = null; };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });
}

export const curationStore = {
  getState: getStable,
  getTheme(): ThemeExhibition | null {
    return getStable().theme;
  },
  getFeaturedArtistIds(): string[] {
    return getStable().featuredArtistIds;
  },
  setTheme(theme: ThemeExhibition | null): void {
    const current = readFromStorage();
    writeToStorage({ ...current, theme });
  },
  toggleFeaturedArtist(artistId: string): void {
    const current = readFromStorage();
    const set = new Set(current.featuredArtistIds);
    if (set.has(artistId)) set.delete(artistId);
    else set.add(artistId);
    writeToStorage({ ...current, featuredArtistIds: [...set] });
  },
  clearTheme(): void {
    const current = readFromStorage();
    writeToStorage({ ...current, theme: null });
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
