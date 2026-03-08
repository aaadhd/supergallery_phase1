import { DollarSign, Info } from 'lucide-react';

interface SaleStatusButtonProps {
  saleStatus?: 'none' | 'requested' | 'approved' | 'unlocked';
  onRequestSale: () => void;
  onViewRequest: () => void;
}

export function SaleStatusButton({ saleStatus, onRequestSale, onViewRequest }: SaleStatusButtonProps) {
  // 판매 중 - 초록 배지
  if (saleStatus === 'approved') {
    return (
      <div className="flex items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
          ✓ 판매 중
        </span>
      </div>
    );
  }

  // 팬덤 언락 - 보라 배지
  if (saleStatus === 'unlocked') {
    return (
      <div className="flex items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
          🔓 팬덤 언락
        </span>
      </div>
    );
  }

  // 심사 대기 중 - 노란 배지 + ⓘ 아이콘 (클릭해서 내용 확인)
  if (saleStatus === 'requested') {
    return (
      <div className="flex items-start gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
          ⏳ 심사 대기
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewRequest();
          }}
          className="h-4 w-4 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center transition-colors"
          title="제출 내용 확인"
        >
          <Info className="h-2.5 w-2.5 text-amber-700" />
        </button>
      </div>
    );
  }

  // 판매 심사 신청 - 파란 버튼 (액션)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRequestSale();
      }}
      className="w-full py-1.5 px-3 border border-[#0057FF] text-[#0057FF] text-[11px] font-medium rounded-md hover:bg-[#0057FF] hover:text-white transition-all"
    >
      <DollarSign className="h-3 w-3 inline mr-1" />
      판매 심사 신청
    </button>
  );
}