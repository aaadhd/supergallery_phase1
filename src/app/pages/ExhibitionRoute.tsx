import { useParams } from 'react-router-dom';
import Browse from './Browse';
import ExhibitionDetail, { isCuratedExhibitionId } from './ExhibitionDetail';

/**
 * PRD 7.1 — 전시 상세는 `/exhibitions/:id` 단일 URL.
 * 큐레이션 목업(solo-light 등)은 전용 페이지, 그 외 id는 둘러보기 작업물 모달(작품 id)로 처리.
 */
export default function ExhibitionRoute() {
  const { id } = useParams();
  if (isCuratedExhibitionId(id)) {
    return <ExhibitionDetail />;
  }
  return <Browse />;
}
