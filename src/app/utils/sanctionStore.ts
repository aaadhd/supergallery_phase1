/**
 * 경고·허위신고 카운터 + 정지 단계 결정 (Phase 1 클라이언트 모의).
 *
 * 정책 (CLAUDE.md / IMPLEMENTATION_DELTA §6.3·§12-B 참조):
 * - 경고 누적 3회 → 7일 정지로 자동 승격
 * - 허위 신고 3회 → 7일 차단(정지)
 * - 정지 단계: 주의(warning) → 7일 → 30일 → 영구
 *
 * 서버 연동 시:
 * - 같은 이벤트 트리거에서 백엔드 admin actions 테이블에 INSERT
 * - 사용자 sanction history 별도 보관 (이 모의 store는 폐기)
 */

import { accountSuspensionStore, authStore } from '../store';
import { artists } from '../data';

const WARNING_KEY = 'artier_warning_counter_v1';
const FALSE_REPORT_KEY = 'artier_false_report_counter_v1';

type CounterMap = Record<string, number>;

function readMap(key: string): CounterMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CounterMap) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: CounterMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(map));
}

/** 신고 대상에게 경고 누적. 3회 누적 시 7일 정지로 자동 승격. */
export function addWarning(targetArtistId: string): {
  count: number;
  triggeredSuspension: boolean;
} {
  if (!targetArtistId) return { count: 0, triggeredSuspension: false };
  const map = readMap(WARNING_KEY);
  const next = (map[targetArtistId] ?? 0) + 1;
  map[targetArtistId] = next;
  writeMap(WARNING_KEY, map);

  // 3회 누적이면 자동 7일 정지
  if (next >= 3) {
    suspendDemoUser(7, '경고 누적 3회로 자동 정지되었습니다.');
    return { count: next, triggeredSuspension: true };
  }
  return { count: next, triggeredSuspension: false };
}

/** 신고자에게 허위 신고 누적. 3회 누적 시 7일 차단. */
export function addFalseReport(reporterId: string): {
  count: number;
  triggeredBlock: boolean;
} {
  if (!reporterId) return { count: 0, triggeredBlock: false };
  const map = readMap(FALSE_REPORT_KEY);
  const next = (map[reporterId] ?? 0) + 1;
  map[reporterId] = next;
  writeMap(FALSE_REPORT_KEY, map);

  if (next >= 3) {
    suspendDemoUser(7, '허위 신고 3회 누적으로 7일 차단되었습니다.');
    return { count: next, triggeredBlock: true };
  }
  return { count: next, triggeredBlock: false };
}

export function getWarningCount(targetArtistId: string): number {
  return readMap(WARNING_KEY)[targetArtistId] ?? 0;
}

export function getFalseReportCount(reporterId: string): number {
  return readMap(FALSE_REPORT_KEY)[reporterId] ?? 0;
}

/** 정지 단계 옵션 (어드민 회원 관리에서 사용) */
export type SuspensionLevel = 'warning' | 'days7' | 'days30' | 'permanent';

export const SUSPENSION_LEVEL_DAYS: Record<SuspensionLevel, number | null> = {
  warning: 0, // 주의: 정지 없이 경고만
  days7: 7,
  days30: 30,
  permanent: null, // 무기한
};

/** 데모 사용자(artists[0])에 한해 글로벌 suspensionStore에 적용 + 즉시 로그아웃 */
export function suspendDemoUser(days: number | null, reason: string): void {
  if (typeof window === 'undefined') return;
  const until = days != null ? new Date(Date.now() + days * 86400000).toISOString() : null;
  accountSuspensionStore.set({ active: true, reason, until });
  if (authStore.isLoggedIn()) authStore.logout();
}
