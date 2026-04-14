/**
 * 이벤트 관리 store — localStorage 영속화.
 * 명세(기능 모음 > 이벤트 관리): status는 scheduled/active/ended, worksPublic(참여작 공개 여부) 포함.
 * Phase 2에 Supabase 연동 예정 — 현재는 기획자 확인용 데모.
 *
 * 기존에 Events.tsx / EventDetail.tsx / EventManagement.tsx 3곳에 흩어진 하드코딩 데이터를
 * 이 store로 통합하고, 최초 마운트 시 seed로 localStorage에 저장한다.
 */

import { useSyncExternalStore } from 'react';

export type EventStatus = 'scheduled' | 'active' | 'ended';

export type ManagedEvent = {
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
};

const STORAGE_KEY = 'artier_managed_events_v1';
const CHANGED_EVENT = 'artier-events-changed';

/** 최초 방문 시 시드 — 기존 하드코딩된 3곳 데이터를 여기로 통합 */
const SEED_EVENTS: ManagedEvent[] = [
  {
    id: '1',
    title: '나의 첫 디지털 캔버스',
    subtitle: '매일 그리는 나의 소확행',
    description:
      '신규 가입 후 첫 작품을 업로드해주신 선착순 100분께 스타벅스 아메리카노 기프티콘을 드립니다. 잠자고 있던 나의 첫 캔버스를 지금 채워보세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-05-01',
    endAt: '2026-05-31',
    status: 'active',
    worksPublic: true,
    participantsLabel: '선착순 100명',
  },
  {
    id: '2',
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
    participantsLabel: '추첨 10명',
  },
  {
    id: '4',
    title: '수채화 작품전',
    subtitle: '감성 넘치는 수채화 작가들의 작품을 만나보세요',
    description: '다양한 수채화 작가들의 작품을 한자리에서 만나볼 수 있는 온라인 기획전입니다.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-04-01',
    endAt: '2026-04-30',
    status: 'scheduled',
    worksPublic: false,
    participantsLabel: '참여 작가 30명',
  },
  {
    id: '5',
    title: '디지털 드로잉 워크샵',
    subtitle: '처음 시작하는 디지털 드로잉 기초 과정',
    description:
      '디지털 드로잉을 처음 시작하는 분들을 위한 온라인 워크샵입니다. 기초부터 차근차근 배워보세요.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1702325597300-f3d68b5b9499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBtdXNldW18ZW58MXx8fHwxNzcyNzIwMjk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-04-15',
    endAt: '2026-04-15',
    status: 'scheduled',
    worksPublic: true,
    participantsLabel: '선착순 50명',
  },
  {
    id: '6',
    title: '작가 네트워킹 데이',
    subtitle: '작가들과 함께하는 소통의 시간',
    description:
      '작가들이 모여 서로의 작품에 대해 이야기하고, 영감을 주고받는 네트워킹 행사입니다.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1764709125089-740593af301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBjb2xsZWN0aW9uJTIwZGlzcGxheXxlbnwxfHx8fDE3NzI3NzM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-05-01',
    endAt: '2026-05-01',
    status: 'scheduled',
    worksPublic: true,
    participantsLabel: '참여 작가 20명',
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
    return Array.isArray(list) ? list : SEED_EVENTS;
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
  const today = now.toISOString().slice(0, 10);
  if (today < e.startAt) return 'scheduled';
  if (today > e.endAt) return 'ended';
  return 'active';
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

  remove(id: string): void {
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
