/**
 * 어드민 배너 관리 — localStorage 영속화.
 * Phase 2에서 Supabase 연동 예정 (현재는 기획자 확인용 데모).
 *
 * 명세(배너 관리): start_at~end_at 기간 필터, is_active 수동 토글.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';

export type AdminBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  /** 게시 기간 — 배너를 홈 슬라이더에 노출할 기간. YYYY-MM-DD */
  startAt?: string;
  endAt?: string;
  /** 이벤트 실행 기간 — 실제 이벤트가 진행되는 기간(게시 기간과 다를 수 있음). YYYY-MM-DD */
  eventStartAt?: string;
  eventEndAt?: string;
  isActive: boolean;
};

const STORAGE_KEY = 'artier_admin_banners_v3';
const CHANGED_EVENT = 'artier-banners-changed';

const SEED_BANNERS: AdminBanner[] = [
  {
    id: 'bn-seed-contest-1',
    title: '나의 첫 디지털 캔버스',
    subtitle: '매일 그리는 나의 소확행',
    imageUrl: 'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    linkUrl: '/events/1',
    startAt: '2026-05-01',
    endAt: '2026-05-31',
    isActive: true,
  },
  {
    id: 'bn-seed-contest-2',
    title: '동호회 작품전 참여하기',
    subtitle: '우리 동호회 작품을 세상에 알려보세요',
    imageUrl: 'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    linkUrl: '/events/2',
    startAt: '2026-05-01',
    endAt: '2026-06-30',
    isActive: true,
  },
  {
    id: 'bn-seed-pick-1',
    title: "5월 Proud's Pick",
    subtitle: '이번 달 가장 빛나는 작품을 만나보세요',
    imageUrl: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    linkUrl: '/events?tab=pick',
    startAt: '2026-05-12',
    endAt: '2026-06-01',
    isActive: true,
  },
  {
    id: 'bn-seed-curation-1',
    title: '봄의 감성 — 수채화 기획전',
    subtitle: '봄빛을 담은 작가들의 섬세한 수채화 모음',
    imageUrl: 'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    linkUrl: '/events?tab=curation',
    startAt: '2026-05-01',
    endAt: '2026-06-30',
    isActive: true,
  },
];

const SEED_IDS = new Set(SEED_BANNERS.map((b) => b.id));

function readFromStorage(): AdminBanner[] {
  if (typeof window === 'undefined') return SEED_BANNERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BANNERS));
      return SEED_BANNERS;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map((b) => {
      if (b && 'badge' in b) {
        const { badge: _ignored, ...rest } = b;
        return rest;
      }
      return b;
    });
  } catch {
    return [];
  }
}

function writeToStorage(list: AdminBanner[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  cachedAll = null;
  cachedVisible = null;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function withinPeriod(b: AdminBanner, now: Date): boolean {
  const todayIso = todayLocalIso(now);
  if (b.startAt && todayIso < b.startAt) return false;
  if (b.endAt && todayIso > b.endAt) return false;
  return true;
}

// useSyncExternalStore 스냅샷 참조 안정화를 위한 캐시
// 참조가 바뀌면 React가 리렌더를 트리거하므로, 데이터가 실제로 바뀐 경우에만 새 배열을 만든다.
let cachedAll: AdminBanner[] | null = null;
let cachedVisible: AdminBanner[] | null = null;

function getAllStable(): AdminBanner[] {
  if (cachedAll === null) cachedAll = readFromStorage();
  return cachedAll;
}

function getVisibleStable(): AdminBanner[] {
  if (cachedVisible === null) {
    const now = new Date();
    cachedVisible = getAllStable().filter((b) => b.isActive && withinPeriod(b, now));
  }
  return cachedVisible;
}

if (typeof window !== 'undefined') {
  const invalidate = () => {
    cachedAll = null;
    cachedVisible = null;
  };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });

  // 누락된 시드 배너 자동 merge — 새 시드가 추가되면 기존 localStorage에도 반영
  (() => {
    const stored = readFromStorage();
    const storedIds = new Set(stored.map((b) => b.id));
    const missing = SEED_BANNERS.filter((b) => !storedIds.has(b.id));
    if (missing.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, ...missing]));
      cachedAll = null;
      cachedVisible = null;
    }
  })();
}

export const bannerStore = {
  getAll: getAllStable,
  getVisible: getVisibleStable,

  add(banner: Omit<AdminBanner, 'id'>): { ok: boolean; id?: string; reason?: string } {
    const list = readFromStorage();

    const next: AdminBanner = {
      ...banner,
      id: `bn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    writeToStorage([...list, next]);
    return { ok: true, id: next.id };
  },

  update(id: string, patch: Partial<Omit<AdminBanner, 'id'>>): void {
    const list = readFromStorage().map((b) => (b.id === id ? { ...b, ...patch } : b));
    writeToStorage(list);
  },

  remove(id: string): void {
    writeToStorage(readFromStorage().filter((b) => b.id !== id));
  },

  reorder(oldIndex: number, newIndex: number): void {
    const list = readFromStorage();
    if (oldIndex < 0 || oldIndex >= list.length || newIndex < 0 || newIndex >= list.length) return;
    const [moved] = list.splice(oldIndex, 1);
    list.splice(newIndex, 0, moved);
    writeToStorage(list);
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

export function useAdminBanners(): AdminBanner[] {
  return useSyncExternalStore(bannerStore.subscribe, getAllStable, () => []);
}

export function useVisibleAdminBanners(): AdminBanner[] {
  return useSyncExternalStore(bannerStore.subscribe, getVisibleStable, () => []);
}
