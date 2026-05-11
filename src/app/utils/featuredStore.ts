/**
 * 추천 전시 store — 피드 상단 부스트 대상 전시 ID 집합.
 * localStorage `artier_featured_v1` 영속화.
 * 관리 UI: /admin/featured (FeaturedManagement.tsx)
 * 피드 랭킹: feedOrdering.ts의 'featured' 버킷
 */

import { useSyncExternalStore } from 'react';
import manifestRaw from '../data/imagesV1Manifest.json';

const STORAGE_KEY = 'artier_featured_v1';
const CHANGED_EVENT = 'artier-featured-changed';
/** 구 curationStore(artier_curation_v1)에서 featuredExhibitionIds 이관용 */
const LEGACY_CURATION_KEY = 'artier_curation_v1';
/** images_1 시드 전시 기본 추천 마이그레이션 키 */
const SEED_MIGRATION_KEY = 'artier_featured_v1_images1_seeded';

/** public/images_1 전시 ID 목록 (항상 추천 전시 기본 포함) */
const IMAGES_V1_IDS: string[] = (manifestRaw as { entries: unknown[] }).entries.map(
  (_, i) => `images-v1-${i}`,
);

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
  if (typeof window === 'undefined') return IMAGES_V1_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base: string[] = raw !== null
      ? (Array.isArray(JSON.parse(raw)) ? (JSON.parse(raw) as string[]) : [])
      : (() => {
          // 최초 마운트 — 구 curationStore에서 이관
          const migrated = migrateFromCurationStore();
          return migrated;
        })();

    // images-v1 기본 추천 전시 1회 시드 (신규·기존 사용자 모두)
    if (!localStorage.getItem(SEED_MIGRATION_KEY)) {
      const merged = [...new Set([...IMAGES_V1_IDS, ...base])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(SEED_MIGRATION_KEY, '1');
      return merged;
    }

    return base;
  } catch {
    return IMAGES_V1_IDS;
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
