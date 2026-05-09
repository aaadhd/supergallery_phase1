/**
 * Proud's Pick 세션 store — localStorage 영속화.
 * Pick은 응모전/이벤트와 개념상 다른 큐레이션 행위이므로 contestStore와 분리.
 * 프론트 노출: 배너(홈 캐러셀)에서 홍보. Events 페이지 미표출.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';

export type PickStatus = 'scheduled' | 'active' | 'ended';

export type PickSession = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  bannerImageUrl: string;
  selectedWorkIds: string[];
  /** true = 발행됨(이력 포함), false = 임시저장 */
  publicationOpen: boolean;
  /** 수동 상태. 없으면 날짜 기준 자동 계산 */
  status?: PickStatus;
  description?: string;
};

const STORAGE_KEY = 'artier_picks_v1';
const CHANGED_EVENT = 'artier-picks-changed';
/** 구 eventStore(artier_managed_events_v4)에서 type='pick' 항목 이관용 */
const LEGACY_EVENT_KEY = 'artier_managed_events_v4';

/** 구 eventStore에서 type='pick' 항목을 한 번만 이관 */
function migrateFromLegacyEventStore(): PickSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_EVENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((e: { type?: string }) => e?.type === 'pick')
      .map((e: {
        id: string; title?: string; startAt?: string; endAt?: string;
        bannerImageUrl?: string; selectedWorkIds?: string[];
        publicationOpen?: boolean; status?: string; description?: string;
      }) => ({
        id: e.id,
        title: e.title ?? '',
        startAt: e.startAt ?? todayLocalIso(),
        endAt: e.endAt ?? todayLocalIso(),
        bannerImageUrl: e.bannerImageUrl ?? '',
        selectedWorkIds: e.selectedWorkIds ?? [],
        publicationOpen: e.publicationOpen ?? false,
        status: (e.status as PickStatus | undefined),
        description: e.description ?? '',
      } satisfies PickSession));
  } catch {
    return [];
  }
}

function readFromStorage(): PickSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 최초 마운트 — 구 eventStore에서 pick 항목 이관
      const migrated = migrateFromLegacyEventStore();
      if (migrated.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list as PickSession[];
  } catch {
    return [];
  }
}

function writeToStorage(list: PickSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  cachedAll = null;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function derivePickStatus(e: Pick<PickSession, 'startAt' | 'endAt' | 'status'>, now: Date = new Date()): PickStatus {
  const today = todayLocalIso(now);
  if (today > e.endAt) return 'ended';
  if (e.status) return e.status;
  if (today < e.startAt) return 'scheduled';
  return 'active';
}

let cachedAll: PickSession[] | null = null;

function getAllStable(): PickSession[] {
  if (cachedAll === null) cachedAll = readFromStorage();
  return cachedAll;
}

if (typeof window !== 'undefined') {
  const invalidate = () => { cachedAll = null; };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });
}

export const pickStore = {
  getAll: getAllStable,

  get(id: string): PickSession | null {
    return getAllStable().find((s) => s.id === id) ?? null;
  },

  add(session: Omit<PickSession, 'id'>): { ok: true; id: string } {
    const list = readFromStorage();
    const id = `pick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    writeToStorage([...list, { ...session, id }]);
    return { ok: true, id };
  },

  update(id: string, patch: Partial<Omit<PickSession, 'id'>>): void {
    const list = readFromStorage().map((s) => (s.id === id ? { ...s, ...patch } : s));
    writeToStorage(list);
  },

  remove(id: string): void {
    writeToStorage(readFromStorage().filter((s) => s.id !== id));
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

export function usePickSessions(): PickSession[] {
  return useSyncExternalStore(pickStore.subscribe, getAllStable, () => []);
}
