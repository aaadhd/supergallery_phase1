/**
 * 추천 전시 store — 피드 상단 부스트 대상 전시 ID 집합.
 * localStorage `artier_featured_v1` 영속화.
 * 관리 UI: /admin/featured (FeaturedManagement.tsx)
 * 피드 랭킹: feedOrdering.ts의 'featured' 버킷
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'artier_featured_v1';
const CHANGED_EVENT = 'artier-featured-changed';
/** 구 curationStore(artier_curation_v1)에서 featuredExhibitionIds 이관용 */
const LEGACY_CURATION_KEY = 'artier_curation_v1';

function migrateFromCurationStore(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_CURATION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.featuredExhibitionIds)) {
      return parsed.featuredExhibitionIds as string[];
    }
  } catch { /* ignore */ }
  return [];
}

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? (list as string[]) : [];
    }
    // 최초 마운트 — 구 curationStore에서 이관
    const migrated = migrateFromCurationStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  cached = null;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

let cached: string[] | null = null;

function getAllStable(): string[] {
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

export const featuredStore = {
  getAll: getAllStable,

  has(workId: string): boolean {
    return getAllStable().includes(workId);
  },

  toggle(workId: string): void {
    const cur = new Set(readFromStorage());
    if (cur.has(workId)) cur.delete(workId); else cur.add(workId);
    writeToStorage([...cur]);
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

export function useFeaturedExhibitions(): string[] {
  return useSyncExternalStore(featuredStore.subscribe, getAllStable, () => []);
}
