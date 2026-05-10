/**
 * 응모전·일반이벤트 store — localStorage 영속화.
 * type: 'contest'(응모전) | 'general'(일반 이벤트)
 * Pick은 별도 pickStore.ts, 기획전은 별도 curationStore.ts.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';

export type EventStatus = 'scheduled' | 'active' | 'ended';
export type EventType = 'contest' | 'general';
export type EventSubtype = 'regular' | 'irregular';

export type ManagedEvent = {
  type: EventType;
  subtype?: EventSubtype;
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  bannerImageUrl: string;
  /** 실행 기간 — 응모전 접수 기간 등. deriveEventStatus 계산 기준. YYYY-MM-DD */
  startAt: string;
  endAt: string;
  /** 게시 기간 — 미설정 시 startAt/endAt 과 동일하게 취급. YYYY-MM-DD */
  displayStartAt?: string;
  displayEndAt?: string;
  /** 수동 상태. 없으면 startAt/endAt 기준 자동 계산 */
  status?: EventStatus;
  /** 참여작 공개 여부 */
  worksPublic: boolean;
  participantsLabel?: string;
  /** 선정작 발표 페이지 공개 토글 */
  publicationOpen?: boolean;
  /** 발표일 YYYY-MM-DD */
  publishedAt?: string;
  /** 선정된 작품(전시) ID 목록 */
  selectedWorkIds?: string[];
};

// 데이터는 이전 contestStore 키에 이미 저장되어 있으므로 그대로 사용
const STORAGE_KEY = 'artier_managed_contests_v1';
const CHANGED_EVENT = 'artier-contests-changed';
/** 구 eventStore 키 — 마이그레이션용 */
const LEGACY_EVENT_KEY = 'artier_managed_events_v4';

const SEED_EVENTS: ManagedEvent[] = [
  {
    id: '1',
    type: 'contest',
    subtype: 'irregular',
    title: '나의 첫 디지털 캔버스',
    subtitle: '매일 그리는 나의 소확행',
    description:
      '나의 첫 디지털 작품을 업로드하고 응모해보세요. 운영팀이 선정한 당선자에게 스타벅스 아메리카노 기프티콘을 드립니다. 잠자고 있던 나의 첫 캔버스를 지금 채워보세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-05-01',
    endAt: '2026-05-31',
    status: 'active',
    worksPublic: true,
  },
  {
    id: '2',
    type: 'contest',
    subtype: 'irregular',
    title: '동호회 작품전 참여하기',
    subtitle: '우리 동호회 작품을 세상에 알려보세요',
    description:
      '동호회나 수업 작품을 올려주신 강사님 중 추첨을 통해 태블릿과 스타일러스를 선물로 드립니다. 수강생 작품을 올리고 함께 성장하세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-05-01',
    endAt: '2026-06-30',
    status: 'active',
    worksPublic: true,
  },
];

/** 구 artier_managed_events_v4에서 contest/general 항목만 이관 (pick 제외) */
function migrateFromLegacyEventStore(dest: ManagedEvent[]): ManagedEvent[] {
  if (typeof window === 'undefined') return dest;
  try {
    const raw = localStorage.getItem(LEGACY_EVENT_KEY);
    if (!raw) return dest;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return dest;
    const existingIds = new Set(dest.map((e) => e.id));
    const migrated: ManagedEvent[] = [];
    for (const e of list) {
      if (!e || typeof e !== 'object') continue;
      if (e.type === 'pick') continue;
      if (existingIds.has(e.id)) continue;
      migrated.push({
        ...e,
        type: e.type === 'contest' ? 'contest' : 'general',
      } as ManagedEvent);
    }
    return [...dest, ...migrated];
  } catch {
    return dest;
  }
}

function readFromStorage(): ManagedEvent[] {
  if (typeof window === 'undefined') return SEED_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = migrateFromLegacyEventStore(SEED_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return SEED_EVENTS;
    return list
      .map((e: ManagedEvent) => ({
        ...e,
        type: (e.type === 'contest' || e.type === 'general') ? e.type : 'general',
        displayStartAt: e.displayStartAt ?? undefined,
        displayEndAt: e.displayEndAt ?? undefined,
      }))
      .filter((e: ManagedEvent) => e.type === 'contest' || e.type === 'general');
  } catch {
    return SEED_EVENTS;
  }
}

function writeToStorage(list: ManagedEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  cachedAll = null;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** 날짜 기준 자동 상태 계산. 종료일이 지났으면 수동 status 무관하게 ended. */
export function deriveEventStatus(e: { startAt: string; endAt: string; status?: EventStatus }, now: Date = new Date()): EventStatus {
  const today = todayLocalIso(now);
  if (today > e.endAt) return 'ended';
  if (e.status) return e.status;
  if (today < e.startAt) return 'scheduled';
  return 'active';
}

/**
 * 선정작 발표 페이지 노출 가능 여부.
 * publicationOpen + 선정작 1건 이상 + publishedAt 도달.
 */
export function isPublicationVisible(e: ManagedEvent, today: Date = new Date()): boolean {
  if (!e.publicationOpen) return false;
  if (!e.selectedWorkIds || e.selectedWorkIds.length === 0) return false;
  if (e.publishedAt && todayLocalIso(today) < e.publishedAt) return false;
  return true;
}

export function statusLabelKo(s: EventStatus): string {
  if (s === 'active') return '진행중';
  if (s === 'scheduled') return '예정';
  return '종료';
}

let cachedAll: ManagedEvent[] | null = null;

function getAllStable(): ManagedEvent[] {
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

export const eventsStore = {
  getAll: getAllStable,

  get(id: string): ManagedEvent | null {
    return getAllStable().find((e) => e.id === id) ?? null;
  },

  getActive(): ManagedEvent[] {
    return getAllStable().filter((e) => deriveEventStatus(e) === 'active');
  },

  getUpcoming(): ManagedEvent[] {
    return getAllStable().filter((e) => deriveEventStatus(e) === 'scheduled');
  },

  add(ev: Omit<ManagedEvent, 'id'>): { ok: true; id: string } {
    const list = readFromStorage();
    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    writeToStorage([...list, { ...ev, id }]);
    return { ok: true, id };
  },

  update(id: string, patch: Partial<Omit<ManagedEvent, 'id'>>): void {
    const list = readFromStorage().map((e) => (e.id === id ? { ...e, ...patch } : e));
    writeToStorage(list);
  },

  toggleSelected(eventId: string, workId: string): { added: boolean; nextSelected: string[] } {
    const list = readFromStorage();
    const ev = list.find((e) => e.id === eventId);
    if (!ev) return { added: false, nextSelected: [] };
    const cur = new Set(ev.selectedWorkIds ?? []);
    const added = !cur.has(workId);
    if (added) cur.add(workId); else cur.delete(workId);
    const nextSelected = Array.from(cur);
    writeToStorage(list.map((e) => (e.id === eventId ? { ...e, selectedWorkIds: nextSelected } : e)));
    return { added, nextSelected };
  },

  bulkSelect(eventId: string, workIds: string[]): { addedIds: string[]; nextSelected: string[] } {
    const list = readFromStorage();
    const ev = list.find((e) => e.id === eventId);
    if (!ev) return { addedIds: [], nextSelected: [] };
    const cur = new Set(ev.selectedWorkIds ?? []);
    const addedIds: string[] = [];
    for (const wid of workIds) {
      if (!cur.has(wid)) { cur.add(wid); addedIds.push(wid); }
    }
    const nextSelected = Array.from(cur);
    writeToStorage(list.map((e) => (e.id === eventId ? { ...e, selectedWorkIds: nextSelected } : e)));
    return { addedIds, nextSelected };
  },

  bulkUnselect(eventId: string, workIds: string[]): void {
    const list = readFromStorage();
    const ev = list.find((e) => e.id === eventId);
    if (!ev) return;
    const remove = new Set(workIds);
    const nextSelected = (ev.selectedWorkIds ?? []).filter((id) => !remove.has(id));
    writeToStorage(list.map((e) => (e.id === eventId ? { ...e, selectedWorkIds: nextSelected } : e)));
  },

  remove(id: string): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('artier_works');
        if (raw) {
          const list = JSON.parse(raw) as Array<{ id: string; linkedEventId?: string | number }>;
          if (Array.isArray(list)) {
            let changed = false;
            for (const w of list) {
              if (w.linkedEventId != null && String(w.linkedEventId) === String(id)) {
                w.linkedEventId = undefined;
                changed = true;
              }
            }
            if (changed) {
              localStorage.setItem('artier_works', JSON.stringify(list));
              window.dispatchEvent(new Event('artier-works-changed'));
            }
          }
        }
      } catch { /* ignore */ }
    }
    writeToStorage(readFromStorage().filter((e) => e.id !== id));
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

export function useManagedEvents(): ManagedEvent[] {
  return useSyncExternalStore(eventsStore.subscribe, getAllStable, () => SEED_EVENTS);
}
