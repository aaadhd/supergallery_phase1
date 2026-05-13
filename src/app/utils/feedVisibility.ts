import type { Work } from '../data';
import { isWorkPublic } from './workVisibility';
import { eventsStore } from './eventsStore';

/**
 * 둘러보기·검색·큐레이션 등 공개 피드에 노출 가능한 작품만 통과.
 * - 검수 상태 approved만 (pending·rejected 제외)
 * - 비공개(`isHidden`)도 제외 (운영팀 비공개 유지 처리 — Policy §12.1 v2.20)
 */
export function isWorkVisibleOnPublicFeed(w: Work): boolean {
  return isWorkPublic(w);
}
