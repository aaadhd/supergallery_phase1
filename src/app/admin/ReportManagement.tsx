import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, EyeOff, Ban } from 'lucide-react';

type ReportState = '대기' | '처리완료';
type ReportKind = '작품' | '댓글' | '프로필';

type ReportRow = {
  id: string;
  target: string;
  kind: ReportKind;
  reason: string;
  reportedAt: string;
  status: ReportState;
};

type StoredUserReport = {
  id: string;
  targetType: string;
  targetId?: string;
  targetName: string;
  reason?: string;
  reasonKey?: string;
  reasonLabel?: string;
  detail: string;
  createdAt: string;
};

function mapUserReportToRow(r: StoredUserReport): ReportRow {
  const kind: ReportKind = r.targetType === 'work' ? '작품' : '프로필';
  const detail = r.detail?.trim() || '';
  const target =
    detail.length > 0
      ? `${r.targetName} — ${detail.slice(0, 100)}${detail.length > 100 ? '…' : ''}`
      : r.targetName;
  const reportedAt = r.createdAt ? r.createdAt.slice(0, 10) : '';
  return {
    id: r.id,
    target,
    kind,
    reason: r.reason ?? r.reasonLabel ?? r.reasonKey ?? '',
    reportedAt,
    status: '대기',
  };
}

function loadUserReportsFromStorage(): ReportRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem('artier_reports') || '[]') as StoredUserReport[];
    if (!Array.isArray(raw)) return [];
    return raw.map(mapUserReportToRow);
  } catch {
    return [];
  }
}

const initialReports: ReportRow[] = [
  { id: 'r1', target: '작품 #1042 — 도시의 빛', kind: '작품', reason: '저작권 의심', reportedAt: '2026-03-30', status: '대기' },
  { id: 'r2', target: '댓글 — 사용자 min_art', kind: '댓글', reason: '욕설/비방', reportedAt: '2026-03-29', status: '대기' },
  { id: 'r3', target: '프로필 — gallery_spam', kind: '프로필', reason: '스팸 링크', reportedAt: '2026-03-28', status: '처리완료' },
  { id: 'r4', target: '작품 #982 — 무제', kind: '작품', reason: '부적절 콘텐츠', reportedAt: '2026-03-27', status: '대기' },
  { id: 'r5', target: '댓글 — 사용자 anon_7', kind: '댓글', reason: '괴롭힘', reportedAt: '2026-03-26', status: '처리완료' },
];

function stateBadge(s: ReportState) {
  if (s === '처리완료') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-amber-50 text-amber-900 border border-amber-200';
}

function kindBadge(k: ReportKind) {
  const map: Record<ReportKind, string> = {
    작품: 'bg-blue-50 text-blue-800 border border-blue-200',
    댓글: 'bg-violet-50 text-violet-800 border border-violet-200',
    프로필: 'bg-orange-50 text-orange-800 border border-orange-200',
  };
  return map[k];
}

export default function ReportManagement() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>(() => {
    const user = loadUserReportsFromStorage();
    const ids = new Set(user.map((r) => r.id));
    return [...user, ...initialReports.filter((r) => !ids.has(r.id))];
  });
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== '전체' && r.status !== statusFilter) return false;
      if (typeFilter !== '전체' && r.kind !== typeFilter) return false;
      return true;
    });
  }, [rows, statusFilter, typeFilter]);

  const markDone = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: '처리완료' as const } : r)));
    toast.success('확인 완료 처리되었습니다.');
  };

  const makePrivate = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: '처리완료' as const } : r)));
    toast.success('비공개 처리되었습니다. (목업)');
  };

  const ignore = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.message('신고를 무시하고 목록에서 제거했습니다. (목업)');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">신고 관리</h1>
        <div className="rounded-lg border border-[#E4E4E7] py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold text-gray-900">신고 관리</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        운영 정책: 일반 신고는 접수 후 7일 이내, 불법 콘텐츠(미성년자·성인물 등)는 24시간 이내 우선 검토합니다.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">상태: 전체</option>
          <option value="대기">대기</option>
          <option value="처리완료">처리완료</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">유형: 전체</option>
          <option value="작품">작품</option>
          <option value="댓글">댓글</option>
          <option value="프로필">프로필</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          조건에 맞는 신고가 없습니다.
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-[#F4F4F5] text-left text-gray-700">
                <th className="px-4 py-3 font-medium">신고대상</th>
                <th className="px-4 py-3 font-medium">신고유형</th>
                <th className="px-4 py-3 font-medium">신고사유</th>
                <th className="px-4 py-3 font-medium">신고일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3 text-gray-900 max-w-[200px]">{r.target}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${kindBadge(r.kind)}`}>
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.reason}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.reportedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={r.status === '처리완료'}
                        onClick={() => markDone(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        확인 완료
                      </button>
                      <button
                        type="button"
                        onClick={() => makePrivate(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 hover:bg-gray-50"
                      >
                        <EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        비공개
                      </button>
                      <button
                        type="button"
                        onClick={() => ignore(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      >
                        <Ban className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        무시
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
