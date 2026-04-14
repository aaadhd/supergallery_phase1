import { useParams, useSearchParams } from 'react-router-dom';
import Browse from './Browse';
import ExhibitionDetail, { isCuratedExhibitionId } from './ExhibitionDetail';
import ExhibitionInviteLanding from './ExhibitionInviteLanding';

/**
 * PRD 7.1 — 전시 상세는 `/exhibitions/:id` 단일 URL.
 * - 큐레이션 목업(solo-light 등): 전용 페이지 ExhibitionDetail
 * - `?from=invite`: 공유 링크로 들어온 경우 → 전시 초대장 랜딩 (명세: 전시 초대장 오픈 화면)
 * - 그 외: 둘러보기 피드 + 작품 모달
 */
export default function ExhibitionRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  if (isCuratedExhibitionId(id)) {
    return <ExhibitionDetail />;
  }
  if (searchParams.get('from') === 'invite') {
    return <ExhibitionInviteLanding />;
  }
  return <Browse />;
}
