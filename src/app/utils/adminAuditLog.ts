/**
 * 운영자 감사 로그 (Policy §22.7 / PRD_Admin §0.6).
 * Phase 1 — localStorage append-only. 5년 보관 정책. 운영자 본인도 수정·삭제 불가.
 *
 * 「삭제」 액션의 `targetSnapshot`은 작품 메타 + 사유 + 자유 메모 + 연결 신고 ID를 포함해
 * 분쟁 시 증빙으로 사용한다(이미지 본문은 Phase 1 미보존 — 런칭 전 백엔드 연동 후 cold storage 보강).
 */

const STORAGE_KEY = 'artier_admin_audit_log_v1';
const MAX_ENTRIES = 5000; // Phase 1 단순 cap. 5년 분량은 백엔드 도입 후 server retention.

export type AuditAction =
  | 'work_deleted'           // 신고 「삭제」 또는 운영팀 직접 삭제
  | 'report_dismissed'       // 신고 「기각」
  | 'report_kept_hidden'     // 신고 「비공개 유지」
  | 'review_approved'
  | 'review_rejected';

export type DeletedWorkSnapshot = {
  workId: string;
  artistId: string;
  artistName: string;
  exhibitionName?: string;
  pieceTitles?: string[];
  uploadedAt?: string;
  /** 이미지 ref(URL 또는 IDB 키). Phase 1엔 매핑만 보존. */
  imageRefs?: string[];
};

export type DeletedWorkLogPayload = {
  reason: 'copyright' | 'illegal' | 'minor_harmful' | 'abuse';
  reasonNote?: string;
  reportIds?: string[];
  snapshot: DeletedWorkSnapshot;
};

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  targetId: string;
  /** 작품 메타 스냅샷 또는 액션별 부속 데이터. 「삭제」는 DeletedWorkLogPayload. */
  targetSnapshot?: Record<string, unknown>;
  actorId: string;
  actorRole: 'operator' | 'editor' | 'admin';
  createdAt: string;
};

function load(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(list: AuditLogEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    // 용량 초과 등 — Phase 1엔 무시(백엔드 도입 후 server retention).
  }
}

/**
 * 감사 로그 entry 추가 (append-only).
 * Policy §22.7 — 수정·삭제 인터페이스 제공하지 않음. 본 함수만이 진입점.
 */
export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): AuditLogEntry {
  const list = load();
  const next: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  save([next, ...list]); // 최신이 위
  return next;
}

/** 「삭제」 액션 전용 helper — payload 형식을 강제하고 호출부 단순화. */
export function logWorkDeletion(
  actorId: string,
  actorRole: AuditLogEntry['actorRole'],
  payload: DeletedWorkLogPayload,
): AuditLogEntry {
  return appendAuditLog({
    action: 'work_deleted',
    targetId: payload.snapshot.workId,
    targetSnapshot: payload as unknown as Record<string, unknown>,
    actorId,
    actorRole,
  });
}

/** 조회 — Phase 1 어드민 콘솔에서 직접 사용. action 필터 지원. */
export function listAuditLog(filter?: { action?: AuditAction; targetId?: string }): AuditLogEntry[] {
  let list = load();
  if (filter?.action) list = list.filter((e) => e.action === filter.action);
  if (filter?.targetId) list = list.filter((e) => e.targetId === filter.targetId);
  return list;
}
