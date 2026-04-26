import type { Work } from '../data';
import { isWorkPublic } from './workVisibility';

/**
 * 둘러보기·검색·큐레이션 등 공개 피드에 노출 가능한 작품만 통과.
 * - 검수 상태 approved만 (pending·rejected 제외)
 * - 자동 비공개(`isHidden`)도 제외 (Policy §12.2 2회 자동 비공개·운영팀 비공개 유지 모두 해당)
 * 본인 프로필에서는 이 함수를 거치지 않고 isOwnProfile 분기로 직접 노출.
 */
export function isWorkVisibleOnPublicFeed(w: Work): boolean {
  return isWorkPublic(w);
}
