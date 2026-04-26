import type { Work } from '../data';

export type WorkVisibility =
  | 'public'
  | 'pending_review'
  | 'rejected'
  | 'hidden_auto'
  | 'hidden_admin';

/**
 * N-11(Phase 1): 검수/신고/자동비공개의 분리 상태를 단일 visibility로 통합.
 * 기존 필드(feedReviewStatus/isHidden/autoHiddenAt)는 레거시 UI 호환을 위해 동기화 유지.
 */
export function getWorkVisibility(work: Work): WorkVisibility {
  if (work.visibilityStatus) return work.visibilityStatus;
  if (work.isHidden) return work.autoHiddenAt ? 'hidden_auto' : 'hidden_admin';
  if (work.feedReviewStatus === 'pending') return 'pending_review';
  if (work.feedReviewStatus === 'rejected') return 'rejected';
  return 'public';
}

export function isWorkPublic(work: Work): boolean {
  return getWorkVisibility(work) === 'public';
}

export function isWorkHidden(work: Work): boolean {
  const v = getWorkVisibility(work);
  return v === 'hidden_auto' || v === 'hidden_admin';
}

export function isWorkPending(work: Work): boolean {
  return getWorkVisibility(work) === 'pending_review';
}

export function isWorkRejected(work: Work): boolean {
  return getWorkVisibility(work) === 'rejected';
}

export function isWorkAutoHidden(work: Work): boolean {
  return getWorkVisibility(work) === 'hidden_auto';
}

export function isWorkAdminHidden(work: Work): boolean {
  return getWorkVisibility(work) === 'hidden_admin';
}

export function buildVisibilityPatch(
  next: WorkVisibility,
  options?: { autoHiddenAt?: string },
): Pick<Work, 'visibilityStatus' | 'feedReviewStatus' | 'isHidden' | 'autoHiddenAt'> {
  switch (next) {
    case 'public':
      return {
        visibilityStatus: 'public',
        feedReviewStatus: 'approved',
        isHidden: false,
        autoHiddenAt: undefined,
      };
    case 'pending_review':
      return {
        visibilityStatus: 'pending_review',
        feedReviewStatus: 'pending',
        isHidden: false,
        autoHiddenAt: undefined,
      };
    case 'rejected':
      return {
        visibilityStatus: 'rejected',
        feedReviewStatus: 'rejected',
        isHidden: false,
        autoHiddenAt: undefined,
      };
    case 'hidden_auto':
      return {
        visibilityStatus: 'hidden_auto',
        feedReviewStatus: 'approved',
        isHidden: true,
        autoHiddenAt: options?.autoHiddenAt ?? new Date().toISOString(),
      };
    case 'hidden_admin':
      return {
        visibilityStatus: 'hidden_admin',
        feedReviewStatus: 'approved',
        isHidden: true,
        autoHiddenAt: undefined,
      };
    default:
      return {
        visibilityStatus: 'public',
        feedReviewStatus: 'approved',
        isHidden: false,
        autoHiddenAt: undefined,
      };
  }
}

export function normalizeWorkVisibility(work: Work): Work {
  const next = getWorkVisibility(work);
  return {
    ...work,
    ...buildVisibilityPatch(next, { autoHiddenAt: work.autoHiddenAt }),
  };
}
