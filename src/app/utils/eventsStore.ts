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
  /** 결과 발표 외부 링크 URL. 종료 후 설정하면 EventDetail에 "결과 발표 보기 →" 버튼 노출. */
  resultUrl?: string;
  /** 당선 알림 발송 일시. 설정되면 알림 보내기 버튼 비활성. */
  notifiedAt?: string;
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
    displayStartAt: '2026-05-01',
    displayEndAt: '2026-05-31',
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
    displayStartAt: '2026-05-01',
    displayEndAt: '2026-06-30',
    status: 'active',
  },
  {
    id: 'seed-ended-contest',
    type: 'contest',
    subtype: 'irregular',
    title: '봄맞이 수채화 응모전',
    subtitle: '봄의 색깔을 담아 응모해 주세요',
    description:
      '봄을 주제로 한 수채화 작품을 업로드하고 응모해보세요. 최우수상 1명에게 드로잉 태블릿을, 우수상 3명에게 스타벅스 기프티콘을 드립니다. 지금 나의 봄 작품을 보여주세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-03-20',
    endAt: '2026-04-15',
    displayStartAt: '2026-03-20',
    displayEndAt: '2026-04-15',
    participantsLabel: '참여 87명',
    resultUrl: 'https://proud-gallery.notion.site',
  },
  {
    id: 'seed-ended-general',
    type: 'general',
    title: '4월 작가 오프라인 모임',
    subtitle: '서울 홍대 · 최대 15명 참여',
    description:
      '4월 12일 홍대 카페에서 Proud Gallery 작가 모임을 진행합니다. 서로의 작품을 공유하고 디지털 드로잉 노하우를 나눌 예정입니다. 선착순 15명, 참여 신청은 링크를 통해 해주세요.',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-04-12',
    endAt: '2026-04-12',
    displayStartAt: '2026-04-01',
    displayEndAt: '2026-04-12',
    participantsLabel: '참여 12명 / 15명',
  },
  {
    id: 'seed-ended-3',
    type: 'contest',
    subtype: 'irregular',
    title: '겨울 풍경 드로잉 응모전',
    subtitle: '눈 내리는 날의 감성을 그려주세요',
    description:
      '겨울 풍경을 주제로 한 드로잉 작품을 응모해 주세요. 당선작 5점을 선정하여 Proud Gallery 공식 SNS에 소개합니다. 응모 기간 내 작품을 업로드하고 이벤트 태그와 함께 응모해 주세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1491002052546-bf38f186af56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-01-06',
    endAt: '2026-01-31',
    displayStartAt: '2026-01-01',
    displayEndAt: '2026-01-31',
    participantsLabel: '참여 63명',
    resultUrl: 'https://proud-gallery.notion.site',
  },
  {
    id: 'seed-ended-4',
    type: 'general',
    title: '신년 맞이 작가 소개 이벤트',
    subtitle: '나를 소개하는 작품 한 점을 올려요',
    description:
      '2026년 새해를 맞아 나를 가장 잘 표현하는 작품 한 점을 올려주세요. 참여해 주신 모든 분의 작품을 Proud Gallery 큐레이션 리스트에 등록해 드립니다. 새해 첫 작품으로 나를 소개해 보세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2026-01-01',
    endAt: '2026-01-05',
    displayStartAt: '2025-12-25',
    displayEndAt: '2026-01-05',
    participantsLabel: '참여 41명',
  },
  {
    id: 'seed-ended-5',
    type: 'contest',
    subtype: 'irregular',
    title: '2025 연말 결산 응모전',
    subtitle: '올해 가장 아끼는 작품을 공유해 주세요',
    description:
      '2025년을 마무리하며, 올 한 해 가장 애착이 가는 작품을 응모해 주세요. 최다 좋아요를 받은 작품 3점에 문화상품권을 드립니다. 한 해의 마지막을 내 작품으로 빛내 보세요!',
    bannerImageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    startAt: '2025-12-15',
    endAt: '2025-12-31',
    displayStartAt: '2025-12-10',
    displayEndAt: '2025-12-31',
    participantsLabel: '참여 114명',
    resultUrl: 'https://proud-gallery.notion.site',
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

    // 시드 이벤트 병합·패치: 없으면 추가, 있어도 description/resultUrl이 최신 시드와 다르면 덮어쓰기
    const seedMap = new Map(SEED_EVENTS.filter((s) =>
      SEED_IDS_TO_MERGE.includes(s.id as typeof SEED_IDS_TO_MERGE[number]),
    ).map((s) => [s.id, s]));

    let dirty = false;
    const patched = parsed.map((e: ManagedEvent) => {
      const seed = seedMap.get(e.id);
      if (!seed) {
        // 시드 외 이벤트도 displayStartAt/displayEndAt 없으면 startAt/endAt으로 보완
        if (!e.displayStartAt || !e.displayEndAt) {
          dirty = true;
          return { ...e, displayStartAt: e.displayStartAt ?? e.startAt, displayEndAt: e.displayEndAt ?? e.endAt };
        }
        return e;
      }
      seedMap.delete(e.id);
      const needsPatch =
        e.description !== seed.description ||
        e.resultUrl !== seed.resultUrl ||
        !e.displayStartAt || !e.displayEndAt;
      if (!needsPatch) return e;
      dirty = true;
      return {
        ...e,
        description: seed.description,
        resultUrl: seed.resultUrl,
        displayStartAt: e.displayStartAt ?? seed.displayStartAt ?? e.startAt,
        displayEndAt: e.displayEndAt ?? seed.displayEndAt ?? e.endAt,
      };
    });

    // 아직 처리 안 된 시드 = 새로 추가
    const toAdd = [...seedMap.values()];
    if (toAdd.length > 0) dirty = true;

    const result = [...patched, ...toAdd];
    if (dirty) localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
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

/**
 * 응모전 출품 시드 데이터 — EventEntryModal 과 동일한 1장짜리 Work 구조로 생성.
 * workStore가 마운트된 이후(PointsBootstrap)에 호출해야 한다.
 */
export function seedEventParticipantsIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const SEED_KEY_V3 = 'artier_event_participants_seeded_v3';
  if (localStorage.getItem(SEED_KEY_V3)) return;

  import('../store').then(({ workStore }) => {
    import('../data').then(({ artists }) => {
      const CONTEST_SEED_IDS = ['1', '2', 'seed-ended-contest', 'seed-ended-3', 'seed-ended-5'];

      // v2 잔재 정리: gallery 작품(user- 아닌 ID)에 붙었던 linkedEventId 제거
      const existing = workStore.getWorks();
      for (const w of existing) {
        if (
          w.linkedEventId != null &&
          CONTEST_SEED_IDS.includes(String(w.linkedEventId)) &&
          !String(w.id).startsWith('user-') &&
          !String(w.id).startsWith('contest-seed-')
        ) {
          workStore.updateWork(w.id, { linkedEventId: undefined });
        }
      }

      const getArtist = (id: string) => artists.find((a) => a.id === id)!;

      type SeedEntry = {
        contestId: string;
        n: number;
        title: string;
        artistId: string;
        uploadedAt: string;
        image: string;
      };

      const SEED_ENTRIES: SeedEntry[] = [
        // 나의 첫 디지털 캔버스 (진행중)
        { contestId: '1', n: 1, title: '처음 그린 디지털 꽃',     artistId: '2',  uploadedAt: '2026-05-03', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=600&fit=crop' },
        { contestId: '1', n: 2, title: '첫 캔버스',               artistId: '3',  uploadedAt: '2026-05-05', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop' },
        { contestId: '1', n: 3, title: '나의 시작',               artistId: '4',  uploadedAt: '2026-05-07', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop' },
        { contestId: '1', n: 4, title: '디지털로 그린 하늘',       artistId: '5',  uploadedAt: '2026-05-10', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop' },
        { contestId: '1', n: 5, title: '설레는 첫 작품',           artistId: '6',  uploadedAt: '2026-05-12', image: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?w=600&h=600&fit=crop' },
        // 동호회 작품전 참여하기 (진행중)
        { contestId: '2', n: 1, title: '동호회 봄 풍경',           artistId: '7',  uploadedAt: '2026-05-04', image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=600&fit=crop' },
        { contestId: '2', n: 2, title: '함께 그린 강가',           artistId: '8',  uploadedAt: '2026-05-08', image: 'https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=600&h=600&fit=crop' },
        { contestId: '2', n: 3, title: '우리 모임의 색',           artistId: '9',  uploadedAt: '2026-05-11', image: 'https://images.unsplash.com/photo-1559887130-0d1be42a06ee?w=600&h=600&fit=crop' },
        { contestId: '2', n: 4, title: '수업 시간 그린 정물',       artistId: '10', uploadedAt: '2026-05-14', image: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=600&h=600&fit=crop' },
        // 봄맞이 수채화 응모전 (종료)
        { contestId: 'seed-ended-contest', n: 1, title: '봄비 수채화',       artistId: '11', uploadedAt: '2026-03-22', image: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-contest', n: 2, title: '벚꽃 길',           artistId: '12', uploadedAt: '2026-03-25', image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-contest', n: 3, title: '봄의 정원',         artistId: '13', uploadedAt: '2026-03-28', image: 'https://images.unsplash.com/photo-1580136608688-c8d2700ac8a7?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-contest', n: 4, title: '따스한 봄빛',       artistId: '14', uploadedAt: '2026-04-01', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-contest', n: 5, title: '봄 여백',           artistId: '15', uploadedAt: '2026-04-05', image: 'https://images.unsplash.com/photo-1589279003513-467d320f47eb?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-contest', n: 6, title: '소소한 봄날',       artistId: '16', uploadedAt: '2026-04-10', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&h=600&fit=crop' },
        // 겨울 풍경 드로잉 응모전 (종료)
        { contestId: 'seed-ended-3', n: 1, title: '눈 내리는 숲길',          artistId: '17', uploadedAt: '2026-01-08', image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-3', n: 2, title: '겨울 민화',               artistId: '18', uploadedAt: '2026-01-12', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-3', n: 3, title: '겨울빛 드로잉',           artistId: '19', uploadedAt: '2026-01-15', image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-3', n: 4, title: '눈꽃 수채화',             artistId: '20', uploadedAt: '2026-01-20', image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-3', n: 5, title: '겨울 오후',               artistId: '21', uploadedAt: '2026-01-25', image: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=600&h=600&fit=crop' },
        // 2025 연말 결산 응모전 (종료)
        { contestId: 'seed-ended-5', n: 1, title: '2025년의 기억',           artistId: '22', uploadedAt: '2025-12-16', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-5', n: 2, title: '한 해의 마지막',          artistId: '23', uploadedAt: '2025-12-18', image: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-5', n: 3, title: '올해 가장 아끼는 작품',   artistId: '24', uploadedAt: '2025-12-22', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-5', n: 4, title: '2025 결산',               artistId: '25', uploadedAt: '2025-12-26', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=600&fit=crop' },
        { contestId: 'seed-ended-5', n: 5, title: '나의 올해 작품',          artistId: '2',  uploadedAt: '2025-12-29', image: 'https://images.unsplash.com/photo-1568483063462-aa89e24c0bab?w=600&h=600&fit=crop' },
      ];

      for (const entry of SEED_ENTRIES) {
        const artist = getArtist(entry.artistId);
        if (!artist) continue;
        const id = `contest-seed-${entry.contestId}-${entry.n}`;
        workStore.addWork({
          id,
          title: entry.title,
          exhibitionName: entry.title,
          image: entry.image,
          artistId: artist.id,
          artist,
          likes: 0,
          saves: 0,
          description: '',
          tags: [],
          primaryExhibitionType: 'solo',
          imagePieceTitles: [entry.title],
          imagePieceIds: [`piece-${id}`],
          imageArtists: [{ type: 'member', memberId: artist.id, memberName: artist.name, memberAvatar: artist.avatar }],
          visibilityStatus: 'public',
          feedReviewStatus: 'approved',
          isHidden: false,
          uploadedAt: entry.uploadedAt,
          linkedEventId: entry.contestId,
          coverImageIndex: 0,
        });
      }

      // 종료된 응모전 selectedWorkIds + 발표 시드
      const endedSelections: Record<string, { count: number; publishedAt: string }> = {
        'seed-ended-contest': { count: 3, publishedAt: '2026-04-16' },
        'seed-ended-3':       { count: 2, publishedAt: '2026-01-31' },
        'seed-ended-5':       { count: 2, publishedAt: '2025-12-31' },
      };
      for (const [contestId, { count, publishedAt }] of Object.entries(endedSelections)) {
        const winnerIds = Array.from({ length: count }, (_, i) => `contest-seed-${contestId}-${i + 1}`);
        eventsStore.update(contestId, {
          selectedWorkIds: winnerIds,
          publicationOpen: true,
          publishedAt,
        });
      }

      localStorage.setItem(SEED_KEY_V3, '1');
    });
  });
}
