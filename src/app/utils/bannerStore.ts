/**
 * 어드민 배너 관리 — localStorage 영속화.
 * Phase 2에서 Supabase 연동 예정 (현재는 기획자 확인용 데모).
 *
 * 명세(배너 관리): 최대 5개, start_at~end_at 기간 필터, is_active 수동 토글.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';

export type AdminBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  startAt?: string; // ISO date (예: 2026-04-01)
  endAt?: string; // ISO date
  isActive: boolean;
};

const STORAGE_KEY = 'artier_admin_banners_v1';
const CHANGED_EVENT = 'artier-banners-changed';
export const MAX_BANNERS = 5;

function readFromStorage(): AdminBanner[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_BANNERS)));
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
  // 다른 탭·수동 이벤트로 변경이 알림되면 캐시 무효화
  const invalidate = () => {
    cachedAll = null;
    cachedVisible = null;
  };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });
}

export const bannerStore = {
  getAll: getAllStable,
  getVisible: getVisibleStable,

  add(banner: Omit<AdminBanner, 'id'>): { ok: boolean; reason?: string } {
    const list = readFromStorage();
    if (list.length >= MAX_BANNERS) {
      return { ok: false, reason: 'limit_reached' };
    }
    const next: AdminBanner = {
      ...banner,
      id: `bn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    writeToStorage([...list, next]);
    return { ok: true };
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
