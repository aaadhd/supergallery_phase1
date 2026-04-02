import type { Work } from '../data';

/** 둘러보기·검색 등 공개 피드에 노출 가능한 작품만 */
export function isWorkVisibleOnPublicFeed(w: Work): boolean {
  const s = w.feedReviewStatus;
  if (s === 'pending' || s === 'rejected') return false;
  return true;
}
