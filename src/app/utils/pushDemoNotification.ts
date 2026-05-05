/** 알림 목록에 데모용 항목 추가 (로컬 전용, Notifications 페이지와 동일 스토리지) */
const STORAGE_KEY = 'artier_notifications';
const MAX = 200;

type DemoNotif = {
  /** 'curation' = 큐레이션(Pick·기획전 선정 등 운영팀 직권). Policy §15.2·USR-NTF-01 카테고리 8종 정합. */
  type: 'like' | 'follow' | 'pick' | 'system' | 'event' | 'invite' | 'curation';
  message: string;
  fromUser?: { name: string; avatar: string; id: string };
  workId?: string;
  /** 알림 라우팅 타깃 — type 'curation' 클릭 시 /curations/:id로 이동(PRD USR-NTF-01 §1). */
  curationId?: string;
  /** 알림 라우팅 타깃 — type 'event' 클릭 시 /events/:id 응모전 상세로 이동(PRD USR-NTF-01 §1). */
  eventId?: string;
  read?: boolean;
  demo?: boolean;
};

export function pushDemoNotification(payload: DemoNotif) {
  if (typeof window === 'undefined') return;
  let list: unknown[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) list = JSON.parse(raw) as unknown[];
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  const row = {
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: payload.type,
    message: payload.message,
    fromUser: payload.fromUser,
    workId: payload.workId,
    curationId: payload.curationId,
    eventId: payload.eventId,
    read: payload.read ?? false,
    createdAt: new Date().toISOString(),
    demo: payload.demo !== false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([row, ...list].slice(0, MAX)));
  window.dispatchEvent(new Event('artier-notifications-changed'));
}
