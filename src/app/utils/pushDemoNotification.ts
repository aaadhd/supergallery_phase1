/** 알림 목록에 데모용 항목 추가 (로컬 전용, Notifications 페이지와 동일 스토리지) */
const STORAGE_KEY = 'artier_notifications';
const MAX = 200;

type DemoNotif = {
  type: 'like' | 'follow' | 'pick' | 'system' | 'event';
  message: string;
  fromUser?: { name: string; avatar: string; id: string };
  workId?: string;
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
    read: payload.read ?? false,
    createdAt: new Date().toISOString(),
    demo: payload.demo !== false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([row, ...list].slice(0, MAX)));
  window.dispatchEvent(new Event('artier-notifications-changed'));
}
