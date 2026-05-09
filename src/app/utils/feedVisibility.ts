import type { Work } from '../data';
import { isWorkPublic } from './workVisibility';
import { eventsStore } from './eventsStore';

/**
 * 둘러보기·검색·큐레이션 등 공개 피드에 노출 가능한 작품만 통과.
 * - 검수 상태 approved만 (pending·rejected 제외)
 * - 비공개(`isHidden`)도 제외 (운영팀 비공개 유지 처리 — Policy §12.1 v2.20)
 * - 응모작(`linkedEventId` 있음): 해당 응모전의 worksPublic=true일 때만 노출.
 *   worksPublic=false(기본값)이면 응모전 종료 전까지 피드 미노출.
 * 본인 프로필에서는 이 함수를 거치지 않고 isOwnProfile 분기로 직접 노출.
 */
export function isWorkVisibleOnPublicFeed(w: Work): boolean {
  if (w.linkedEventId != null) {
    const contest = eventsStore.get(String(w.linkedEventId));
    if (!contest?.worksPublic) return false;
  }
  return isWorkPublic(w);
}
