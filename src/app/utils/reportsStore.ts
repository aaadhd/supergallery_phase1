/** 사용자 신고 큐 (localStorage). Artier 신고 ↔ /admin/reports 가 같은 데이터를 봅니다. */

import { workStore } from '../store';
import { pushDemoNotification } from './pushDemoNotification';

export const REPORTS_STORAGE_KEY = 'artier_reports';

export const REPORTS_CHANGED_EVENT = 'artier-reports-changed';

/** Policy §12.2: 같은 전시에 N번째 신고 시 자동 비공개 처리 */
const AUTO_HIDE_REPORT_THRESHOLD = 2;

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
  createdAt: string;
  /**
   * 어드민 처리 결과 (Policy §12.1, Phase 1):
   * - pending  : 처리 대기
   * - resolved : 단순 확인 완료(액션 없음, 레거시 호환)
   * - hidden   : 비공개 유지 확정 (Phase 1 3액션 중 하나)
   * - deleted  : 대상 삭제
   * - dismissed: 기각 (자동 비공개였다면 복원)
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
 * 신고 1건 추가. Policy §12.2에 따라 **같은 전시의 신고가 2회 이상** 누적되는
 * 순간 해당 전시를 자동 비공개 처리(`isHidden: true`)하고 작가에게 시스템 알림을 발송한다.
 */
export function appendUserReport(
  entry: Omit<StoredUserReport, 'adminStatus'> & { adminStatus?: 'pending' },
): void {
  const list = loadUserReports();
  list.unshift({ ...entry, adminStatus: entry.adminStatus ?? 'pending' });
  saveUserReports(list);

  // Auto-hide trigger (Policy §12.2)
  if (entry.targetType === 'work' && entry.targetId) {
    const workId = entry.targetId;
    const sameWorkReports = list.filter(
      (r) => r.targetType === 'work' && r.targetId === workId,
    );
    if (sameWorkReports.length >= AUTO_HIDE_REPORT_THRESHOLD) {
      const work = workStore.getWork(workId);
      if (work && work.isHidden !== true) {
        workStore.updateWork(workId, {
          isHidden: true,
          autoHiddenAt: new Date().toISOString(),
        });
        pushDemoNotification({
          type: 'system',
          message: `'${work.exhibitionName || work.title}' 전시가 신고 누적으로 자동 비공개 처리되었습니다. 운영팀 검토 대기 중.`,
          workId,
        });
      }
    }
  }
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
 * 기각 판정 후: 해당 전시의 어떤 신고도 관리자 확정 비공개(`adminStatus: 'hidden'`)가 아니면
 * 자동 비공개였다고 보고 복원(`isHidden: false`). 관리자 확정이 있으면 유지.
 * 반환: 복원이 일어났으면 true.
 */
export function maybeRestoreAfterDismiss(workId: string): boolean {
  const work = workStore.getWork(workId);
  if (!work || work.isHidden !== true) return false;
  const list = loadUserReports();
  const hasAdminHold = list.some(
    (r) => r.targetType === 'work' && r.targetId === workId && r.adminStatus === 'hidden',
  );
  if (hasAdminHold) return false;
  workStore.updateWork(workId, { isHidden: false });
  return true;
}
