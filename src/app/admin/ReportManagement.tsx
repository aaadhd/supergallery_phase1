import { useMemo, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, EyeOff, Ban } from 'lucide-react';
import { Button } from '../components/ui/button';
import { workStore } from '../store';
import {
  loadUserReports,
  updateUserReport,
  removeUserReport,
  REPORTS_CHANGED_EVENT,
  REPORTS_STORAGE_KEY,
  type StoredUserReport,
} from '../utils/reportsStore';

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

function mapUserReportToRow(r: StoredUserReport): ReportRow {
  const kind: ReportKind = r.targetType === 'work' ? '작품' : '프로필';
  const detail = r.detail?.trim() || '';
  const target =
    detail.length > 0
      ? `${r.targetName} — ${detail.slice(0, 100)}${detail.length > 100 ? '…' : ''}`
      : r.targetName;
  const reportedAt = r.createdAt ? r.createdAt.slice(0, 10) : '';
  const status: ReportState = r.adminStatus === 'resolved' ? '처리완료' : '대기';
  return {
    id: r.id,
    target,
    kind,
    reason: r.reason ?? r.reasonLabel ?? r.reasonKey ?? '',
    reportedAt,
    status,
  };
}

function mergeReportRows(): ReportRow[] {
  return loadUserReports().map(mapUserReportToRow);
}

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
  const [rows, setRows] = useState<ReportRow[]>(mergeReportRows);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');

  const refreshRows = useCallback(() => setRows(mergeReportRows()), []);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    refreshRows();
    window.addEventListener(REPORTS_CHANGED_EVENT, refreshRows);
    const onStorage = (e: StorageEvent) => {
      if (e.key === REPORTS_STORAGE_KEY) refreshRows();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(REPORTS_CHANGED_EVENT, refreshRows);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshRows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== '전체' && r.status !== statusFilter) return false;
      if (typeFilter !== '전체' && r.kind !== typeFilter) return false;
      return true;
    });
  }, [rows, statusFilter, typeFilter]);

  const markDone = (id: string) => {
    if (!loadUserReports().some((r) => r.id === id)) return;
    updateUserReport(id, { adminStatus: 'resolved' });
    toast.success('처리 완료로 저장했습니다.');
  };

  const makePrivate = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    if (raw.targetType === 'work' && raw.targetId) {
      workStore.updateWork(raw.targetId, { isHidden: true });
      updateUserReport(id, { adminStatus: 'resolved' });
      toast.success('작품을 비공개로 저장했습니다. Artier 둘러보기·검색에서 제외됩니다.');
      return;
    }
    updateUserReport(id, { adminStatus: 'resolved' });
    toast.message('작품 신고만 피드에서 숨깁니다. 이 신고는 완료 처리만 반영했습니다.');
  };

  const ignore = (id: string) => {
    if (!loadUserReports().some((r) => r.id === id)) return;
    removeUserReport(id);
    toast.message('목록에서 제거했습니다.');
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
      <p className="text-sm text-gray-500 mt-1 mb-2">
        Artier에서 접수한 신고는 이 브라우저의 <code className="text-xs bg-slate-100 px-1 rounded">localStorage (artier_reports)</code>와
        공유됩니다. 신고 직후 이 탭을 열어 두면 목록이 곧바로 갱신됩니다.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        「비공개」는 <strong>작품 신고</strong>일 때 해당 작품에 비공개 플래그를 저장해 둘러보기·검색에서 숨깁니다. 운영 콘솔 진입: 주소창에{' '}
        <code className="text-xs bg-slate-100 px-1 rounded">/admin/reports</code>
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
          접수된 신고가 없습니다. Artier에서 로그인한 뒤 작품 ⋯ 메뉴에서 신고해 보세요.
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
                <tr key={r.id} className="border-b border-[#F0F0F0] lg:hover:bg-[#FAFAFA] transition-colors">
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
                      <Button
                        type="button"
                        disabled={r.status === '처리완료'}
                        onClick={() => markDone(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        확인 완료
                      </Button>
                      <Button
                        type="button"
                        disabled={r.status === '처리완료'}
                        onClick={() => makePrivate(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 lg:hover:bg-gray-50"
                      >
                        <EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        비공개
                      </Button>
                      <Button
                        type="button"
                        onClick={() => ignore(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg text-gray-500 lg:hover:bg-gray-100"
                      >
                        <Ban className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        무시
                      </Button>
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
