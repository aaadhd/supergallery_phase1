/** 사용자 신고 큐 (localStorage). Proud Gallery 신고 ↔ /admin/reports 가 같은 데이터를 봅니다. */

import { workStore } from '../store';
import { buildVisibilityPatch, isWorkHidden } from './workVisibility';

export const REPORTS_STORAGE_KEY = 'artier_reports';

export const REPORTS_CHANGED_EVENT = 'artier-reports-changed';

const SEED_REPORTS: StoredUserReport[] = [
  {
    id: 'rpt-seed-1',
    targetType: 'work',
    targetId: 'gw2',
    targetName: '도시의 빛 2026',
    targetArtistId: 'g2',
    reporterId: '5',
    reasonKey: 'copyright',
    reasonLabel: '저작권 침해',
    reason: '저작권 침해',
    detail: 'Pinterest에서 해외 작가의 작품을 그대로 올린 것 같습니다. 원본 링크: https://pinterest.com/pin/example',
    createdAt: '2026-05-09T14:22:00',
    adminStatus: 'pending',
  },
  {
    id: 'rpt-seed-2',
    targetType: 'work',
    targetId: 'gw5',
    targetName: '전통의 선',
    targetArtistId: 'g5',
    reporterId: '3',
    reasonKey: 'copyright',
    reasonLabel: '저작권 침해',
    reason: '저작권 침해',
    detail: 'AI로 생성한 이미지를 본인 창작물처럼 올린 것으로 보입니다. 붓터치가 없고 텍스처가 AI 특유의 패턴입니다.',
    createdAt: '2026-05-08T09:45:00',
    adminStatus: 'pending',
  },
  {
    id: 'rpt-seed-3',
    targetType: 'work',
    targetId: 'gw1',
    targetName: '디지털 한국화 재해석',
    targetArtistId: 'g1',
    reporterId: '7',
    reasonKey: 'inappropriate',
    reasonLabel: '부적절한 콘텐츠',
    reason: '부적절한 콘텐츠',
    detail: '작품 설명에 특정 종교를 비하하는 내용이 포함되어 있습니다. 작품 자체보다 설명글 문제입니다.',
    createdAt: '2026-05-07T16:10:00',
    adminStatus: 'pending',
  },
  {
    id: 'rpt-seed-4',
    targetType: 'work',
    targetId: 'gw3',
    targetName: '사이버 감성',
    targetArtistId: 'g3',
    reporterId: '9',
    reasonKey: 'copyright',
    reasonLabel: '저작권 침해',
    reason: '저작권 침해',
    detail: '유명 일러스트 작가의 작품과 구도·색감이 매우 유사합니다. 직접 그린 것이 맞는지 확인 필요합니다.',
    createdAt: '2026-05-06T11:30:00',
    adminStatus: 'hidden',
  },
  {
    id: 'rpt-seed-5',
    targetType: 'artist',
    targetName: '홍보계정123',
    targetArtistId: '21',
    reporterId: '2',
    reasonKey: 'spam',
    reasonLabel: '스팸·광고',
    reason: '스팸·광고',
    detail: '모든 작품 설명이 외부 쇼핑몰 링크와 홍보 문구로만 구성되어 있습니다. 갤러리 목적으로 사용하는 계정이 아닌 것 같습니다.',
    createdAt: '2026-05-05T20:05:00',
    adminStatus: 'dismissed',
  },
];

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
  if (typeof window === 'undefined') return SEED_REPORTS;
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredUserReport[]) : SEED_REPORTS;
  } catch {
    return SEED_REPORTS;
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
