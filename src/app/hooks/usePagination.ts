import { useEffect, useMemo, useState } from 'react';

/**
 * 클라이언트 사이드 페이지네이션 훅.
 * PRD_Admin §0.5.2: 테이블 기본 50건/페이지, 검수 큐 20건/페이지.
 *
 * - items 배열·pageSize가 바뀌면 현재 page가 범위를 넘지 않도록 자동 보정
 * - 필터 변경 등으로 items 길이가 줄어 현재 page가 빈 페이지가 되면 마지막 유효 페이지로 이동
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // items·pageSize가 바뀔 때 현재 page가 범위를 벗어나면 보정 (예: 필터 변경 후 결과 줄어든 경우).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageCount,
    pageItems,
    totalCount: items.length,
  };
}
