import { useMemo, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, EyeOff, Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { workStore } from '../store';
import {
  loadUserReports,
  updateUserReport,
  removeUserReport,
  REPORTS_CHANGED_EVENT,
  REPORTS_STORAGE_KEY,
  type StoredUserReport,
} from '../utils/reportsStore';
import { addWarning, addFalseReport } from '../utils/sanctionStore';

type ReportState = '대기' | '비공개' | '삭제' | '경고' | '기각' | '처리완료';
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
  const statusMap: Record<NonNullable<StoredUserReport['adminStatus']>, ReportState> = {
    pending: '대기',
    resolved: '처리완료',
    hidden: '비공개',
    deleted: '삭제',
    warned: '경고',
    dismissed: '기각',
  };
  const status: ReportState = statusMap[r.adminStatus ?? 'pending'];
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
  switch (s) {
    case '삭제': return 'bg-red-50 text-red-700 border border-red-200';
    case '비공개': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case '경고': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case '기각': return 'bg-slate-100 text-slate-600 border border-slate-200';
    case '처리완료': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    default: return 'bg-amber-50 text-amber-900 border border-amber-200';
  }
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

  const makePrivate = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    if (raw.targetType === 'work' && raw.targetId) {
      workStore.updateWork(raw.targetId, { isHidden: true });
      updateUserReport(id, { adminStatus: 'hidden' });
      toast.success('작품을 비공개로 저장했습니다. Artier 둘러보기·검색에서 제외됩니다.');
      return;
    }
    updateUserReport(id, { adminStatus: 'hidden' });
    toast.message('이 신고는 비공개 처리로 마감했습니다.');
  };

  /** 삭제: 작품을 영구 삭제 + 신고 처리 (작품 신고에만 적용) */
  const deleteTarget = async (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw || raw.targetType !== 'work' || !raw.targetId) {
      toast.error('작품 신고에 한해 삭제할 수 있습니다.');
      return;
    }
    const ok = await openConfirm({
      title: '신고 대상 작품을 삭제할까요?',
      description: '복구할 수 없습니다. 좋아요·저장 등 부속 데이터도 함께 정리됩니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    workStore.removeWork(raw.targetId);
    updateUserReport(id, { adminStatus: 'deleted' });
    toast.success('작품이 삭제되었습니다.');
  };

  /** 경고: 신고 대상자에게 경고 누적 (3회 시 자동 7일 정지) */
  const warnTarget = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    const targetArtistId = raw.targetArtistId ?? '';
    if (!targetArtistId) {
      toast.error('대상 작가 ID가 없어 경고를 적용할 수 없습니다.');
      return;
    }
    const { count, triggeredSuspension } = addWarning(targetArtistId);
    updateUserReport(id, { adminStatus: 'warned' });
    if (triggeredSuspension) {
      toast.error(`경고 ${count}회 누적 — 7일 정지가 자동 적용되었습니다.`);
    } else {
      toast.success(`경고가 적용되었습니다. (누적 ${count}/3회)`);
    }
  };

  /** 기각: 신고를 부당하다고 판단 — 신고자에게 허위 신고 카운트 +1 */
  const dismissReport = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    const reporterId = raw.reporterId ?? '';
    if (reporterId) {
      const { count, triggeredBlock } = addFalseReport(reporterId);
      updateUserReport(id, { adminStatus: 'dismissed' });
      if (triggeredBlock) {
        toast.error(`허위 신고 ${count}회 누적 — 신고자가 7일 차단되었습니다.`);
      } else {
        toast.message(`신고를 기각했습니다. 신고자 허위 신고 누적 ${count}/3회.`);
      }
    } else {
      updateUserReport(id, { adminStatus: 'dismissed' });
      toast.message('신고를 기각했습니다.');
    }
  };

  /** 목록에서만 제거 (레거시 무시 액션) */
  const removeFromList = (id: string) => {
    if (!loadUserReports().some((r) => r.id === id)) return;
    removeUserReport(id);
    toast.message('목록에서 제거했습니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">신고 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold text-foreground">신고 관리</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-2">
        Artier에서 접수한 신고는 이 브라우저의 <code className="text-xs bg-slate-100 px-1 rounded">localStorage (artier_reports)</code>와
        공유됩니다. 신고 직후 이 탭을 열어 두면 목록이 곧바로 갱신됩니다.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        「비공개」는 <strong>작품 신고</strong>일 때 해당 작품에 비공개 플래그를 저장해 둘러보기·검색에서 숨깁니다. 운영 콘솔 진입: 주소창에{' '}
        <code className="text-xs bg-slate-100 px-1 rounded">/admin/reports</code>
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">상태: 전체</option>
          <option value="대기">대기</option>
          <option value="삭제">삭제</option>
          <option value="비공개">비공개</option>
          <option value="경고">경고</option>
          <option value="기각">기각</option>
          <option value="처리완료">처리완료(레거시)</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">유형: 전체</option>
          <option value="작품">작품</option>
          <option value="댓글">댓글</option>
          <option value="프로필">프로필</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          접수된 신고가 없습니다. Artier에서 로그인한 뒤 작품 ⋯ 메뉴에서 신고해 보세요.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
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
                <tr key={r.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-foreground max-w-[200px]">{r.target}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${kindBadge(r.kind)}`}>
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.reportedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        disabled={r.status !== '대기'}
                        onClick={() => deleteTarget(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white lg:hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        삭제
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={r.status !== '대기'}
                        onClick={() => warnTarget(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg border-amber-300 text-amber-700 lg:hover:bg-amber-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        경고
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={r.status !== '대기'}
                        onClick={() => dismissReport(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        기각
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={r.status !== '대기'}
                        onClick={() => makePrivate(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground"
                        title="작품만 비공개로 전환 (대상 게시는 삭제하지 않음)"
                      >
                        <EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        비공개
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeFromList(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground"
                        title="목록에서만 제거 (삭제·경고·기각 액션은 적용 안 함)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        목록에서 제거
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
