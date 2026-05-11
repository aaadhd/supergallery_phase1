/** 알림 목록에 데모용 항목 추가 (로컬 전용, Notifications 페이지와 동일 스토리지) */
const STORAGE_KEY = 'artier_notifications';
const MAX = 200;

type DemoNotif = {
  /**
   * PRD USR-NTF-01 카테고리 7 칩 정합 (Policy §15.2·§3.2). Phase 1엔 팔로잉 신작 미지원.
   *  - like / follow(새 팔로워)
   *  - groupInvite(그룹 전시 슬롯 추가 — 회원 슬롯 직접 지정)
   *  - pick / curation(운영팀 직권 큐레이션)
   *  - event(응모전 선정·공지)
   *  - invite(토큰 본인 작품 찾기 결과 = 초대 수락)
   *  - system(검수 통과·반려)
   */
  type: 'like' | 'follow' | 'groupInvite' | 'pick' | 'system' | 'event' | 'invite' | 'curation';
  message: string;
  fromUser?: { name: string; avatar: string; id: string };
  workId?: string;
  /** 알림 라우팅 타깃 — type 'curation' 클릭 시 /curations/:id로 이동(PRD USR-NTF-01 §1). */
  curationId?: string;
  /** 알림 라우팅 타깃 — type 'event' 클릭 시 /events/:id 응모전 상세로 이동(PRD USR-NTF-01 §1). */
  eventId?: string;
  /** type 'event' 세부 구분 — 'selected': 선정(강제 발송), 'announcement': 공지(marketing 토글 제어). */
  subtype?: 'announcement' | 'selected';
  /** explicit 라우팅 override — 기본 type 분기로 표현 안 되는 라우팅(예: 검수 반려 → 프로필 전시 탭 + USR-PRF-12 모달 자동 오픈). */
  navigateTo?: string;
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
    navigateTo: payload.navigateTo,
    read: payload.read ?? false,
    createdAt: new Date().toISOString(),
    demo: payload.demo !== false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([row, ...list].slice(0, MAX)));
  window.dispatchEvent(new Event('artier-notifications-changed'));
}
