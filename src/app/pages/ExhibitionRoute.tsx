import { useParams, useSearchParams } from 'react-router-dom';
import Browse from './Browse';
import ExhibitionDetail, { isCuratedExhibitionId } from './ExhibitionDetail';
import ExhibitionInviteLanding from './ExhibitionInviteLanding';
import ExhibitionWorkShareLanding from './ExhibitionWorkShareLanding';

/**
 * PRD 7.1 — 전시 상세는 `/exhibitions/:id` 단일 URL.
 * - 큐레이션 목업(solo-light 등): 전용 페이지 ExhibitionDetail
 * - `?from=invite`: 전시 단위 공유(작품 상세 모달 등) → 한 전시 맥락의 초대 랜딩
 * - `?from=work`: 작품 단위 공유(프로필 작품 관리 등) → 이 작품 한 점만 강조
 * - `?from=credited`: 비회원 작가 문자 → 본인 작품 등록 안내 랜딩
 * - 그 외: 둘러보기 피드 + 작품 모달
 */
export default function ExhibitionRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  if (isCuratedExhibitionId(id)) {
    return <ExhibitionDetail />;
  }
  const from = searchParams.get('from');
  if (from === 'work') {
    return <ExhibitionWorkShareLanding />;
  }
  if (from === 'invite' || from === 'credited') {
    return <ExhibitionInviteLanding />;
  }
  return <Browse />;
}
