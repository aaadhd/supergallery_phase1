import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Work } from '../data';

interface SaleStatusBadgeProps {
  work: Work;
}

export function SaleStatusBadge({ work }: SaleStatusBadgeProps) {
  // 심사 중
  if (work.saleStatus === 'requested') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-[12px] font-semibold border border-orange-300">
        <Clock className="h-3.5 w-3.5" />
        심사 중
      </span>
    );
  }

  // 판매 승인
  if (work.saleStatus === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-[12px] font-semibold border border-green-300">
        <CheckCircle className="h-3.5 w-3.5" />
        판매 승인
      </span>
    );
  }

  // 심사 거절
  if (work.saleStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-[12px] font-semibold border border-red-300">
        <XCircle className="h-3.5 w-3.5" />
        심사 거절
      </span>
    );
  }

  // 대기 중 (none 또는 undefined)
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium border border-gray-300">
      대기 중
    </span>
  );
}
