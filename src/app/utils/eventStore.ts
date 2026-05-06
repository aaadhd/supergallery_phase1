/**
 * 이벤트 관리 store — localStorage 영속화.
 * 명세(기능 모음 > 이벤트 관리): status는 scheduled/active/ended, worksPublic(참여작 공개 여부) 포함.
 * Phase 2에 Supabase 연동 예정 — 현재는 기획자 확인용 데모.
 *
 * 기존에 Events.tsx / EventDetail.tsx / EventManagement.tsx 3곳에 흩어진 하드코딩 데이터를
 * 이 store로 통합하고, 최초 마운트 시 seed로 localStorage에 저장한다.
 */

import { useSyncExternalStore } from 'react';
import { todayLocalIso } from './localDate';

export type EventStatus = 'scheduled' | 'active' | 'ended';
export type EventType = 'contest' | 'general';
export type ContestSubtype = 'regular' | 'irregular';

export type ManagedEvent = {
  /** 이벤트 종류: contest(응모전) | general(일반 행사·공지) */
  type: EventType;
  /** 응모전 서브타입: regular(정기) | irregular(비정기). type='contest'일 때만 사용. */
  subtype?: ContestSubtype;
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  bannerImageUrl: string;
  linkUrl?: string;
  /** YYYY-MM-DD */
  startAt: string;
  /** YYYY-MM-DD */
  endAt: string;
  /** 수동 상태. 없으면 startAt/endAt 기준 자동 계산 (deriveStatus) */
  status?: EventStatus;
  /** 참여작 공개 여부 — true: 업로드 즉시 노출 / false: 종료 후 일괄 공개 */
  worksPublic: boolean;
  /** 표시용 참여자 안내 (예: "선착순 100명") */
  participantsLabel?: string;
  /**
   * 응모전 선정작 발표 페이지 공개 토글 (Policy §15.5 / PRD ADM-EVT-01 AC-05).
   * ON + 선정작 1건 이상 + (있다면) 발표일 도달 → USR-EVT-05 페이지 노출, USR-EVT-02 "선정작 발표 보기" CTA 활성.
   */
  publicationOpen?: boolean;
  /** 발표일 YYYY-MM-DD. 미지정 시 publicationOpen 토글 ON 즉시 노출. 지정 시 그 날짜 이후 노출. */
  publishedAt?: string;
  /**
   * 선정작 작품(전시) ID 리스트 (Policy §15.2 — 응모전 선정 배지는 전시 단위 = 작품 단위 일치).
   * ADM-EVT-03 선정 체크박스 토글로 갱신. 작가에게 1건 알림 발송(중복 발송 차단을 위해 set 단위 비교).
   */
  selectedWorkIds?: string[];
};

const STORAGE_KEY = 'artier_managed_events_v4';
const CHANGED_EVENT = 'artier-events-changed';

/** 최초 방문 시 시드 — 기존 하드코딩된 3곳 데이터를 여기로 통합 */
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

function readFromStorage(): ManagedEvent[] {
  if (typeof window === 'undefined') return SEED_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 최초 마운트: seed를 localStorage에 기록
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EVENTS));
      return SEED_EVENTS;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return SEED_EVENTS;
    // type 필드 없는 레거시 레코드 마이그레이션
    return list.map((e: ManagedEvent) => ({
      ...e,
      type: e.type ?? 'general',
    }));
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

/** start/end 날짜 기준 자동 상태 계산 (수동 status가 있으면 그걸 우선) */
export function deriveStatus(e: ManagedEvent, now: Date = new Date()): EventStatus {
  if (e.status) return e.status;
  const today = todayLocalIso(now);
  if (today < e.startAt) return 'scheduled';
  if (today > e.endAt) return 'ended';
  return 'active';
}

/**
 * 발표 페이지(USR-EVT-05) 노출 가능 여부.
 * Policy §15.5 / PRD ADM-EVT-01 AC-05·06:
 *  - publicationOpen 토글 ON
 *  - 선정작 1건 이상(0건이어도 토글 ON 유지는 가능 — AC-06 경고만)
 *  - publishedAt 지정 시 그 날짜 이후
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

// useSyncExternalStore 스냅샷 참조 안정화
let cachedAll: ManagedEvent[] | null = null;

function getAllStable(): ManagedEvent[] {
  if (cachedAll === null) cachedAll = readFromStorage();
  return cachedAll;
}

if (typeof window !== 'undefined') {
  const invalidate = () => {
    cachedAll = null;
  };
  window.addEventListener(CHANGED_EVENT, invalidate);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) invalidate();
  });
}

export const eventStore = {
  getAll: getAllStable,

  get(id: string): ManagedEvent | null {
    return getAllStable().find((e) => e.id === id) ?? null;
  },

  /** 진행 중인 이벤트 (자동/수동 상태 active) — 메인 히어로 배너용 */
  getActive(): ManagedEvent[] {
    return getAllStable().filter((e) => deriveStatus(e) === 'active');
  },

  /** 예정 이벤트 — 사용자용 "예정된 이벤트" 섹션 */
  getUpcoming(): ManagedEvent[] {
    return getAllStable().filter((e) => deriveStatus(e) === 'scheduled');
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

  /** 선정작 토글 — 추가됐을 때 새 workId 집합을 호출자에게 반환(알림 발송 hook용). */
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

  /** 일괄 선정 — 새로 추가된 workId만 반환(알림 hook). */
  bulkSelect(eventId: string, workIds: string[]): { addedIds: string[]; nextSelected: string[] } {
    const list = readFromStorage();
    const ev = list.find((e) => e.id === eventId);
    if (!ev) return { addedIds: [], nextSelected: [] };
    const cur = new Set(ev.selectedWorkIds ?? []);
    const addedIds: string[] = [];
    for (const wid of workIds) {
      if (!cur.has(wid)) {
        cur.add(wid);
        addedIds.push(wid);
      }
    }
    const nextSelected = Array.from(cur);
    writeToStorage(list.map((e) => (e.id === eventId ? { ...e, selectedWorkIds: nextSelected } : e)));
    return { addedIds, nextSelected };
  },

  /** 일괄 해제 — 알림은 회수하지 않음(Policy §15.2 — 알림은 보존). */
  bulkUnselect(eventId: string, workIds: string[]): void {
    const list = readFromStorage();
    const ev = list.find((e) => e.id === eventId);
    if (!ev) return;
    const remove = new Set(workIds);
    const nextSelected = (ev.selectedWorkIds ?? []).filter((id) => !remove.has(id));
    writeToStorage(list.map((e) => (e.id === eventId ? { ...e, selectedWorkIds: nextSelected } : e)));
  },

  remove(id: string): void {
    // Policy §25.6: 이벤트 삭제 시 응모된 전시의 linkedEventId 일괄 정리 — 삭제 전에 cascade 먼저 실행.
    // race 차단: 비동기 import 결과를 await 하지 않고 즉시 cleanup 동기 실행.
    if (typeof window !== 'undefined') {
      try {
        // store.ts의 workStore는 모듈 최상단에서 export되므로 require/import 모두 동기 가능.
        // 그러나 ESM에선 dynamic import만 사용 가능 — localStorage를 직접 정리해 race 회피.
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
              // 메모리 상태도 동기화 (다른 탭의 storage 이벤트와 동일 채널).
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
  return useSyncExternalStore(eventStore.subscribe, getAllStable, () => SEED_EVENTS);
}
