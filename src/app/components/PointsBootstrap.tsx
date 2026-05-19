import { useEffect } from 'react';
import { artists } from '../data';
import { pointsOnFollowerCount } from '../utils/pointsBackground';
import { seedCurationIfEmpty } from '../utils/curationStore';
import { seedPickIfEmpty } from '../utils/pickStore';
import { seedEventParticipantsIfEmpty } from '../utils/eventsStore';

/** 부트 시점에 더 이상 사용하지 않는 레거시 localStorage 키 정리 */
const LEGACY_STORAGE_KEYS = [
  'artier_instructor_public_ids',   // 강사 토글 단일화 이후(2026-04-13) orphan
  'artier_pin_comments',            // PinCommentLayer 삭제(2026-04-15) 후 orphan
  'artier_upload_guide_seen',       // 업로드 인라인 가이드 제거(2026-04-15) 후 orphan
  'artier_group_canonical_map',     // 그룹명 중복 허용 정책(2026-04-17) 이후 orphan
  'artier_signup_region',           // region 분기 폐기(2026-04-26) 후 orphan
  'artier_pending_signup_realname', // 실명 인풋 폐기(2026-04-26) 후 orphan
  'artier_pending_sms_invite',      // SMS 초대 폐기(2026-04-27, Policy §3 v2.14) 후 orphan
  'artier_pending_signup_phone',    // 온보딩 전화 입력 폐기(2026-04-27) 후 orphan
  'artier_invite_messaging_log',    // 회사 발송 로그 폐기(2026-04-27, Policy §3 v2.14) 후 orphan
  'artier_invite_match_log',        // 자동 매칭 로그 폐기(2026-04-27) 후 orphan
  'artier_invite_decline_log',      // "초대 매칭 거부" 큐 폐기(2026-04-27) 후 orphan
  'artier_admin_issues',            // 미결 이슈 UI 폐기(2026-05-06) 후 orphan
  'artier_admin_checklist',         // 런칭 체크리스트 UI 폐기(2026-05-06) 후 orphan
  'artier_admin_picks_v1',          // PickManagement 세션 모델로 마이그레이션(2026-05-10) 후 orphan
  'artier_managed_events_v4',       // contestStore(v1)+pickStore(v1) 분리 이관(2026-05-10) 후 orphan
  'artier_event_subscription',      // eventSubscriptionStore → marketing 토글 통합(2026-05-11) 후 orphan
  'artier_curation_v1',             // curationStore v2 마이그레이션(2026-05-19) 후 orphan
  'artier_curation_v2',             // curationStore v3 마이그레이션(2026-05-19) 후 orphan
];

const LEGACY_SESSION_KEYS = [
  'artier_pending_invite_claims',   // PendingInviteClaimGate 제거(2026-04-19) 후 orphan
  'artier_geo_demo_cache',          // GeoIP 폐기(2026-04-26) 후 orphan
];

function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* quota·private mode 무시 */ }
  }
  for (const key of LEGACY_SESSION_KEYS) {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
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
    seedCurationIfEmpty();
    seedPickIfEmpty();
    seedEventParticipantsIfEmpty();
    const demo = artists[0];
    if (demo?.followers != null) pointsOnFollowerCount(demo.followers);
  }, []);
  return null;
}
