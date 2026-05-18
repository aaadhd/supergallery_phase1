/**
 * Proud's Pick 세션 store — localStorage 영속화.
 * Pick은 응모전/이벤트와 개념상 다른 큐레이션 행위이므로 contestStore와 분리.
 * 프론트 노출: 배너(홈 캐러셀)에서 홍보. Events 페이지 미표출.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';
import { works as seedWorks } from '../data';

export type PickStatus = 'scheduled' | 'active' | 'ended';

export type PickSession = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  selectedWorkIds: string[];
  /** true = 게시됨(이력 포함), false = 임시저장 */
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
        selectedWorkIds?: string[];
        publicationOpen?: boolean; status?: string; description?: string;
      }) => ({
        id: e.id,
        title: e.title ?? '',
        startAt: e.startAt ?? todayLocalIso(),
        endAt: e.endAt ?? todayLocalIso(),
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
  if (today < e.startAt) return 'scheduled';
  if (e.status === 'ended') return 'ended';
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

/**
 * Pick 세션 시드 — 게시된 세션이 없을 때 데모용 2개 생성.
 * workStore가 마운트된 이후(PointsBootstrap)에 호출해야 한다.
 */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayLocalIso(d);
}

export function seedPickIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const existing = getAllStable();

  // 게시된 세션이 있지만 활성(active) 세션이 없는 경우 —
  // 시드 세션의 startAt이 미래로 저장돼 있을 때 오늘로 당겨 준다.
  const hasPublished = existing.some((s) => s.publicationOpen);
  if (hasPublished) {
    const today = todayLocalIso();
    const hasActive = existing.some(
      (s) => s.publicationOpen && derivePickStatus(s) === 'active',
    );
    if (!hasActive) {
      const SEED_IDS = ['seed-pick-2026-w20', 'seed-pick-2026-w19'];
      const fixed = existing.map((s) => {
        if (SEED_IDS.includes(s.id) && s.publicationOpen && s.startAt > today) {
          return { ...s, startAt: today };
        }
        return s;
      });
      writeToStorage(fixed);
    }
    return;
  }

  const publicWorks = seedWorks.filter((w) => !w.isHidden && w.feedReviewStatus !== 'rejected');
  const ids1 = publicWorks.slice(0, 6).map((w) => w.id);
  const ids2 = publicWorks.slice(6, 12).map((w) => w.id);

  const sessions: PickSession[] = [
    {
      id: 'seed-pick-2026-w20',
      title: '5월 3주차 Proud\'s Pick',
      startAt: isoOffset(-7),
      endAt: isoOffset(14),
      selectedWorkIds: ids1,
      publicationOpen: true,
    },
    {
      id: 'seed-pick-2026-w19',
      title: '5월 2주차 Proud\'s Pick',
      startAt: isoOffset(-21),
      endAt: isoOffset(-8),
      selectedWorkIds: ids2,
      publicationOpen: true,
    },
  ];

  writeToStorage(sessions);
}
