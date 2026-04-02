import { useEffect } from 'react';
import { artists } from '../data';
import { pointsOnFollowerCount, runPointsExpiryBatch } from '../utils/pointsBackground';

/** 앱 부트 시 포인트 만료 배치(로그) 및 데모 팔로워 마일스톤 체크 */
export function PointsBootstrap() {
  useEffect(() => {
    runPointsExpiryBatch();
    const demo = artists[0];
    if (demo?.followers != null) pointsOnFollowerCount(demo.followers);
  }, []);
  return null;
}
