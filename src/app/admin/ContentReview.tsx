import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { workStore } from '../store';
import type { Work } from '../data';
import { getFirstImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type ReviewStatusUi = '대기중' | '승인' | '반려';

function toUiStatus(w: Work): ReviewStatusUi | null {
  const s = w.feedReviewStatus;
  if (s === 'pending') return '대기중';
  if (s === 'approved') return '승인';
  if (s === 'rejected') return '반려';
  return null;
}

function statusBadgeClass(s: ReviewStatusUi) {
  if (s === '승인') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === '반려') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-amber-50 text-amber-800 border border-amber-200';
}

export default function ContentReview() {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<Work[]>(() => workStore.getWorks());
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    return workStore.subscribe(() => setWorks(workStore.getWorks()));
  }, []);

  const rows = useMemo(() => {
    return works
      .map((w) => ({ work: w, ui: toUiStatus(w), date: w.uploadedAt || '' }))
      .filter((r) => r.ui !== null) as Array<{ work: Work; ui: ReviewStatusUi; date: string }>;
  }, [works]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== '전체' && r.ui !== statusFilter) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }, [rows, statusFilter, from, to]);

  const approve = (id: string) => {
    workStore.updateWork(id, { feedReviewStatus: 'approved' });
    toast.success('승인되었습니다. 둘러보기 피드에 노출됩니다.');
  };

  const reject = (id: string) => {
    workStore.updateWork(id, { feedReviewStatus: 'rejected' });
    toast.error('반려 처리되었습니다. 피드에는 노출되지 않습니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">콘텐츠 검토</h1>
        <div className="rounded-lg border border-[#E4E4E7] bg-white py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-1 text-gray-900">콘텐츠 검토</h1>
      <p className="text-sm text-gray-500 mb-6">
        업로드된 전시는 검수 전까지 둘러보기 피드에 나오지 않습니다. 본인 프로필에는 즉시 노출됩니다.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white text-gray-800 min-w-[140px]"
        >
          <option value="전체">상태: 전체</option>
          <option value="대기중">대기중</option>
          <option value="승인">승인</option>
          <option value="반려">반려</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm"
          aria-label="기간 시작"
        />
        <span className="self-center text-sm text-gray-400">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm"
          aria-label="기간 종료"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          조건에 맞는 항목이 없습니다. 신규 작품을 업로드하면 대기 목록에 표시됩니다.
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-[#F4F4F5] text-left text-gray-700">
                <th className="px-4 py-3 font-medium w-20">썸네일</th>
                <th className="px-4 py-3 font-medium">작품명</th>
                <th className="px-4 py-3 font-medium">작가</th>
                <th className="px-4 py-3 font-medium">업로드일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ work: w, ui, date }) => {
                const key = getFirstImage(w.image);
                const src = imageUrls[key] || key;
                return (
                  <tr key={w.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5]">
                        <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{w.title}</td>
                    <td className="px-4 py-3 text-gray-600">{w.artist.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(ui)}`}>
                        {ui}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={ui !== '대기중'}
                        onClick={() => approve(w.id)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={ui !== '대기중'}
                        onClick={() => reject(w.id)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <X className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        반려
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
