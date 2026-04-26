/**
 * 비회원 초대 링크 토큰 스토어 (Policy §3 v2.14).
 *
 * 회사가 외부 채널로 발송하지 않고, 작가가 본인 채널로 직접 공유하는 모델.
 * - 토큰은 전시 단위 1개. 슬롯별 X.
 * - status: 'active' | 'inactive' | 'revoked'.
 *   - 검수 승인 시 active. 검수 대기·반려 시 inactive(친구 링크 보존, 재승인 시 active 복귀).
 *   - 전시 삭제·작가 탈퇴·비회원 자리 0·만료 시 revoked (영구 무효).
 * - 만료 평가는 lazy: getInviteToken/findActiveTokenForWork 호출 시점에 expiresAt 검사 후 즉석 revoke.
 * - Phase 1 한계: localStorage 보관 → 다른 기기 미동기. 백엔드 도입 시 정합(Policy §31 N-15).
 */

import { workStore } from '../store';
import type { ImageArtistAssignment } from '../data';

const STORAGE_KEY = 'artier_invite_tokens_v1';
const CHANGED_EVENT = 'artier-invite-tokens-changed';
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90일

export type InviteTokenStatus = 'active' | 'inactive' | 'revoked';

export type InviteToken = {
  token: string;
  workId: string;
  /** 전시 작가 (Phase 1: Work.artistId가 곧 업로더). Phase 2 권한 위임 시 별도 필드 검토. */
  inviterUserId: string;
  createdAt: string;
  expiresAt: string;
  status: InviteTokenStatus;
};

type StoreMap = Record<string, InviteToken>;

function loadAll(): StoreMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoreMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: StoreMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* quota·private mode 무시 */
  }
}

function generateToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** 만료된 active 토큰을 revoked로 갱신 (lazy 평가). 변경이 있으면 storage에 반영. */
function applyLazyExpiry(map: StoreMap): { changed: boolean } {
  const now = Date.now();
  let changed = false;
  for (const [, t] of Object.entries(map)) {
    if (t.status === 'revoked') continue;
    const expiresAtTs = new Date(t.expiresAt).getTime();
    if (Number.isFinite(expiresAtTs) && expiresAtTs < now) {
      t.status = 'revoked';
      changed = true;
    }
  }
  return { changed };
}

/**
 * 전시 단위 토큰 1개 발급. 발행 직후 상태는 'inactive' (검수 대기).
 * 같은 workId에 기존 토큰이 살아 있으면 그것을 반환(중복 발급 방지).
 */
export function issueInviteToken(workId: string, inviterUserId: string): InviteToken {
  const map = loadAll();
  const existing = Object.values(map).find(
    (t) => t.workId === workId && t.status !== 'revoked',
  );
  if (existing) return existing;

  const now = Date.now();
  const token: InviteToken = {
    token: generateToken(),
    workId,
    inviterUserId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TOKEN_TTL_MS).toISOString(),
    status: 'inactive',
  };
  map[token.token] = token;
  saveAll(map);
  return token;
}

/** token 문자열로 조회. 만료된 active는 즉석 revoke. */
export function getInviteToken(token: string): InviteToken | null {
  if (!token) return null;
  const map = loadAll();
  const found = map[token];
  if (!found) return null;
  const { changed } = applyLazyExpiry(map);
  if (changed) saveAll(map);
  return map[token] ?? null;
}

/** workId로 살아 있는(revoked 아닌) 토큰 조회. 만료 lazy 처리. */
export function findTokenForWork(workId: string): InviteToken | null {
  const map = loadAll();
  const { changed } = applyLazyExpiry(map);
  if (changed) saveAll(map);
  for (const t of Object.values(map)) {
    if (t.workId === workId && t.status !== 'revoked') return t;
  }
  return null;
}

/** active만. 공유 버튼 노출 가드용. */
export function findActiveTokenForWork(workId: string): InviteToken | null {
  const t = findTokenForWork(workId);
  return t && t.status === 'active' ? t : null;
}

function transitionStatus(workId: string, next: InviteTokenStatus): void {
  const map = loadAll();
  let changed = false;
  for (const t of Object.values(map)) {
    if (t.workId !== workId) continue;
    if (t.status === 'revoked' && next !== 'revoked') continue; // 영구 무효는 복귀 불가
    if (t.status !== next) {
      t.status = next;
      changed = true;
    }
  }
  if (changed) saveAll(map);
}

/** 검수 승인 시 호출. inactive → active. revoked는 그대로. */
export function activateInviteToken(workId: string): void {
  transitionStatus(workId, 'active');
}

/** 검수 대기·반려 시 호출. active → inactive (친구 링크 보존). revoked는 그대로. */
export function deactivateInviteToken(workId: string): void {
  transitionStatus(workId, 'inactive');
}

/** 영구 무효 (전시 삭제·작가 탈퇴·비회원 자리 0·만료 등). 복귀 불가. */
export function revokeInviteToken(workId: string): void {
  const map = loadAll();
  let changed = false;
  for (const t of Object.values(map)) {
    if (t.workId === workId && t.status !== 'revoked') {
      t.status = 'revoked';
      changed = true;
    }
  }
  if (changed) saveAll(map);
}

/** 공유 URL 빌드. 랜딩(`/exhibitions/:id?invite=<token>`)에서 토큰 디코드. */
export function buildInviteShareUrl(workId: string, token: string): string {
  const base = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  return `${base}/exhibitions/${encodeURIComponent(workId)}?invite=${encodeURIComponent(token)}`;
}

/** OS 공유 시트·메일 본문 prefilled 카피. 사용자가 자유 편집 가능. */
export function buildInviteShareText(
  workTitle: string,
  inviterName: string,
  locale: 'ko' | 'en',
): string {
  if (locale === 'en') {
    return `${inviterName} invited you to "${workTitle}". Sign up and link your work.`;
  }
  return `${inviterName}님이 '${workTitle}'에 회원님을 초대했어요. 가입하시면 작품이 자동으로 연결돼요.`;
}

export type ConnectMemberResult =
  | { ok: true; promoted: { workId: string; pieceIndex: number; memberId: string } }
  | { ok: false; reason: 'work_not_found' | 'slot_not_found' | 'slot_not_non_member' };

/**
 * 가입자가 "본인 작품 찾기"에서 슬롯 카드를 명시 클릭했을 때 호출.
 * type 가드: imageArtists[pieceIndex]가 'non-member'일 때만 'member'로 승격.
 * race condition: 두 번째 호출은 'slot_not_non_member' 반환.
 */
export function connectMemberToSlot(
  workId: string,
  pieceIndex: number,
  member: { id: string; name: string; avatar?: string },
): ConnectMemberResult {
  const work = workStore.getWork(workId);
  if (!work) return { ok: false, reason: 'work_not_found' };
  const slots = Array.isArray(work.imageArtists) ? work.imageArtists : [];
  const slot = slots[pieceIndex];
  if (!slot) return { ok: false, reason: 'slot_not_found' };
  if (slot.type !== 'non-member') return { ok: false, reason: 'slot_not_non_member' };

  const next: ImageArtistAssignment[] = slots.map((ia, idx) => {
    if (idx !== pieceIndex) return ia;
    return {
      type: 'member',
      memberId: member.id,
      memberName: member.name,
      memberAvatar: member.avatar,
    };
  });
  workStore.updateWork(workId, { imageArtists: next });
  return { ok: true, promoted: { workId, pieceIndex, memberId: member.id } };
}

/** 외부 변경 구독 (다른 탭의 storage 이벤트 + 같은 탭의 dispatched 이벤트 모두 처리). */
export function subscribeInviteTokens(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGED_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
