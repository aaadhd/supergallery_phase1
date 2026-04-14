import { useEffect } from 'react';
import { artists } from '../data';
import { pointsOnFollowerCount, runPointsExpiryBatch } from '../utils/pointsBackground';

/** 부트 시점에 더 이상 사용하지 않는 레거시 localStorage 키 정리 */
const LEGACY_STORAGE_KEYS = [
  'artier_instructor_public_ids', // 강사 토글 단일화 이후(2026-04-13) orphan
];

function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* quota·private mode 무시 */ }
  }
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
