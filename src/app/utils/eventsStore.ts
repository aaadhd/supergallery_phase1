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
  },
  {
    id: 'seed-ended-contest',
    type: 'contest',
    subtype: 'irregular',
    title: '봄맞이 수채화 응모전',
    subtitle: '봄의 색깔을 담아 응모해 주세요',
    description:
      '봄을 주제로 한 수채화 작품을 업로드하고 응모해보세요. 최우수상 1명에게 드로잉 태블릿을, 우수상 3명에게 스타벅스 기프티콘을 드렸습니다. 많은 분들이 참여해 주셨습니다. 감사합니다!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-03-20',
    endAt: '2026-04-15',
    participantsLabel: '참여 87명',
  },
  {
    id: 'seed-ended-general',
    type: 'general',
    title: '4월 작가 오프라인 모임',
    subtitle: '서울 홍대 · 최대 15명 참여',
    description:
      '지난 4월 12일 홍대 카페에서 진행된 Proud Gallery 작가 모임입니다. 총 12명이 참여하여 서로의 작품을 나누고 디지털 드로잉 노하우를 공유했습니다. 다음 모임에서 뵙겠습니다!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-04-12',
    endAt: '2026-04-12',
    participantsLabel: '참여 12명 / 15명',
  },
  {
    id: 'seed-ended-3',
    type: 'contest',
    subtype: 'irregular',
    title: '겨울 풍경 드로잉 응모전',
    subtitle: '눈 내리는 날의 감성을 그려주세요',
    description:
      '겨울 풍경을 주제로 한 드로잉 응모전입니다. 당선작 5점을 선정하여 Proud Gallery 공식 SNS에 소개했습니다. 참여해 주신 모든 분께 감사드립니다.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1491002052546-bf38f186af56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-01-06',
    endAt: '2026-01-31',
    participantsLabel: '참여 63명',
  },
  {
    id: 'seed-ended-4',
    type: 'general',
    title: '신년 맞이 작가 소개 이벤트',
    subtitle: '나를 소개하는 작품 한 점을 올려요',
    description:
      '2026년 새해를 맞아 나를 가장 잘 표현하는 작품 한 점을 올리는 소개 이벤트를 진행했습니다. 참여해 주신 작가님들의 다채로운 자기소개 작품을 통해 서로를 알아가는 시간이 되었습니다.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-01-01',
    endAt: '2026-01-05',
    participantsLabel: '참여 41명',
  },
  {
    id: 'seed-ended-5',
    type: 'contest',
    subtype: 'irregular',
    title: '2025 연말 결산 응모전',
    subtitle: '올해 가장 아끼는 작품을 공유해 주세요',
    description:
      '2025년을 마무리하며 한 해 동안 가장 애착이 가는 작품을 응모 받았습니다. 최다 좋아요를 받은 작품 3점에 문화상품권을 드렸습니다. 한 해 동안 함께해 주셔서 감사합니다!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2025-12-15',
    endAt: '2025-12-31',
    participantsLabel: '참여 114명',
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

/** 새로 추가된 시드 이벤트 ID 목록 — 기존 데이터에 없으면 자동 병합 */
const SEED_IDS_TO_MERGE = ['seed-ended-contest', 'seed-ended-general', 'seed-ended-3', 'seed-ended-4', 'seed-ended-5'] as const;

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
    const parsed = list
      .map((e: ManagedEvent) => ({
        ...e,
        type: (e.type === 'contest' || e.type === 'general') ? e.type : 'general',
        displayStartAt: e.displayStartAt ?? undefined,
        displayEndAt: e.displayEndAt ?? undefined,
      }))
      .filter((e: ManagedEvent) => e.type === 'contest' || e.type === 'general');

    // 종료 시드 이벤트가 없으면 병합 (기존 데이터 있는 경우도 적용)
    const existingIds = new Set(parsed.map((e: ManagedEvent) => e.id));
    const toMerge = SEED_EVENTS.filter((s) =>
      SEED_IDS_TO_MERGE.includes(s.id as typeof SEED_IDS_TO_MERGE[number]) && !existingIds.has(s.id),
    );
    if (toMerge.length > 0) {
      const merged = [...parsed, ...toMerge];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return parsed;
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
