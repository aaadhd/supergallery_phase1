/** 사용자 신고 큐 (localStorage). Artier 신고 ↔ /admin/reports 가 같은 데이터를 봅니다. */

export const REPORTS_STORAGE_KEY = 'artier_reports';

export const REPORTS_CHANGED_EVENT = 'artier-reports-changed';

export type StoredUserReport = {
  id: string;
  targetType: 'work' | 'artist';
  targetId?: string;
  targetName: string;
  reason?: string;
  reasonKey?: string;
  reasonLabel?: string;
  detail: string;
  createdAt: string;
  /** 어드민 처리 여부 (미저장·과거 데이터는 대기로 간주) */
  adminStatus?: 'pending' | 'resolved';
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
