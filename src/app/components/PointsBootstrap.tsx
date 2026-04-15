import { useEffect } from 'react';
import { artists } from '../data';
import { pointsOnFollowerCount, runPointsExpiryBatch } from '../utils/pointsBackground';

/** 부트 시점에 더 이상 사용하지 않는 레거시 localStorage 키 정리 */
const LEGACY_STORAGE_KEYS = [
  'artier_instructor_public_ids', // 강사 토글 단일화 이후(2026-04-13) orphan
  'artier_pin_comments',          // PinCommentLayer 삭제(2026-04-15) 후 orphan
  'artier_upload_guide_seen',     // 업로드 인라인 가이드 제거(2026-04-15) 후 orphan
];

function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* quota·private mode 무시 */ }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('artier_coach_marks__')) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

/** 앱 부트 시 포인트 만료 배치(로그) 및 데모 팔로워 마일스톤 체크 */
export function PointsBootstrap() {
  useEffect(() => {
    cleanupLegacyStorage();
    runPointsExpiryBatch();
    const demo = artists[0];
    if (demo?.followers != null) pointsOnFollowerCount(demo.followers);
  }, []);
  return null;
}
