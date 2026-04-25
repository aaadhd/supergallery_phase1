import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';

/**
 * 어드민 콘솔용 페이지네이션 바. 데스크탑 운영툴 톤(h-8, text-sm) — 시니어 친화 규칙 미적용.
 * PRD_Admin §0.5.2 테이블 SLO 구현에 공용으로 재사용.
 */
export interface PaginationBarProps {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  /** 전체 항목 수 < pageSize이면 바 자체를 숨김. 기본 true. */
  hideWhenSinglePage?: boolean;
}

export function PaginationBar({
  page,
  pageCount,
  totalCount,
  pageSize,
  onPageChange,
  hideWhenSinglePage = true,
}: PaginationBarProps) {
  if (hideWhenSinglePage && pageCount <= 1) return null;

  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalCount, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
      <span>
        {start.toLocaleString()}–{end.toLocaleString()} / 총 {totalCount.toLocaleString()}건
      </span>
      <div className="inline-flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2.5"
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-3 text-foreground font-medium tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2.5"
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
