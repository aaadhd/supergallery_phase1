/** 사용자 신고 큐 (localStorage). Artier 신고 ↔ /admin/reports 가 같은 데이터를 봅니다. */

import { workStore } from '../store';
import { buildVisibilityPatch, isWorkHidden } from './workVisibility';

export const REPORTS_STORAGE_KEY = 'artier_reports';

export const REPORTS_CHANGED_EVENT = 'artier-reports-changed';

export type StoredUserReport = {
  id: string;
  targetType: 'work' | 'artist';
  targetId?: string;
  targetName: string;
  /** 신고 대상의 작가 ID */
  targetArtistId?: string;
  /** 신고자 ID */
  reporterId?: string;
  reason?: string;
  reasonKey?: string;
  reasonLabel?: string;
  detail: string;
  /** 신고 대상 작품(piece) 인덱스. 다중 이미지 전시에서 사용자가 선택. 단일 이미지면 0 또는 undefined. */
  pieceIndex?: number;
  createdAt: string;
  /**
   * 어드민 처리 결과 (Policy §12.1, Phase 1):
   * - pending  : 처리 대기
   * - resolved : 단순 확인 완료(액션 없음, 레거시 호환)
   * - hidden   : 비공개 유지 확정 (Phase 1 3액션 중 하나)
   * - deleted  : 대상 삭제
   * - dismissed: 기각 (비공개 유지 처리였다면 복원)
   * - warned   : (Phase 2 이관 - 레거시 데이터 호환용)
   */
  adminStatus?: 'pending' | 'resolved' | 'hidden' | 'deleted' | 'warned' | 'dismissed';
};

export function loadUserReports(): StoredUserReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]') as unknown;
    return Array.isArray(raw) ? (raw as StoredUserReport[]) : [];
  } catch {
    return [];
  }
}

export function saveUserReports(reports: StoredUserReport[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event(REPORTS_CHANGED_EVENT));
}

/**
 * 신고 1건 추가. Policy §12.2 v2.20에서 **자동 비공개 트리거 폐기**됨.
 * 모든 신고는 운영팀이 §12.1의 3액션(삭제·기각·비공개 유지)으로 직접 판정한다.
 */
export function appendUserReport(
  entry: Omit<StoredUserReport, 'adminStatus'> & { adminStatus?: 'pending' },
): void {
  const list = loadUserReports();
  list.unshift({ ...entry, adminStatus: entry.adminStatus ?? 'pending' });
  saveUserReports(list);
}

export function updateUserReport(id: string, patch: Partial<StoredUserReport>): void {
  const list = loadUserReports();
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  saveUserReports(list);
}

export function removeUserReport(id: string): void {
  saveUserReports(loadUserReports().filter((r) => r.id !== id));
}

/**
 * 기각 판정 후: 해당 전시의 어떤 신고도 관리자 확정 비공개(`adminStatus: 'hidden'`)가 아니고
 * 검토 대기 중(`adminStatus: 'pending'`)인 신고도 없으면 운영팀 비공개 유지 상태였다고 보고
 * 복원(`isHidden: false`). 관리자 확정 또는 미처리 대기 신고가 있으면 유지.
 * 반환: 복원이 일어났으면 true.
 */
export function maybeRestoreAfterDismiss(workId: string): boolean {
  const work = workStore.getWork(workId);
  if (!work || !isWorkHidden(work)) return false;
  const list = loadUserReports();
  const hasAdminHold = list.some(
    (r) => r.targetType === 'work' && r.targetId === workId && r.adminStatus === 'hidden',
  );
  if (hasAdminHold) return false;
  // pending 신고가 남아 있으면 운영팀이 아직 결정 안 한 것 — 임의 복원 차단.
  const hasPending = list.some(
    (r) => r.targetType === 'work' && r.targetId === workId && (r.adminStatus ?? 'pending') === 'pending',
  );
  if (hasPending) return false;
  workStore.updateWork(workId, { ...buildVisibilityPatch('public') });
  // Policy §3.4 v2.14: 신고 기각으로 비공개 유지에서 복원되면 토큰도 다시 active.
  // 검수 승인 상태 (feedReviewStatus: 'approved')였을 때만 의미 있음 — deactivate→activate 호출은 idempotent라 안전.
  void import('./inviteTokenStore').then(({ activateInviteToken }) => {
    if (work.feedReviewStatus === 'approved') activateInviteToken(workId);
  });
  return true;
}
