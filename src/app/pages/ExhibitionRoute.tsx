import { useSearchParams } from 'react-router-dom';
import Browse from './Browse';
import ExhibitionInviteLanding from './ExhibitionInviteLanding';
import ExhibitionWorkShareLanding from './ExhibitionWorkShareLanding';

/**
 * PRD 7.1 — 전시 상세는 `/exhibitions/:id` 단일 URL.
 * - `?invite=<token>`: 작가가 직접 보낸 초대 링크 → 토큰 상태별 분기 랜딩 (Policy §3 v2.14)
 * - `?from=work`: 작품 단위 공유(프로필 작품 관리 등) → 이 작품 한 점만 강조
 * - 그 외: 둘러보기 피드 + 작품 모달
 */
export default function ExhibitionRoute() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  if (from === 'work') {
    return <ExhibitionWorkShareLanding />;
  }
  if (searchParams.get('invite')) {
    return <ExhibitionInviteLanding />;
  }
  return <Browse />;
}
