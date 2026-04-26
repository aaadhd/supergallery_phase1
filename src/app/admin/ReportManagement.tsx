import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, EyeOff, Trash2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { workStore } from '../store';
import {
  loadUserReports,
  updateUserReport,
  removeUserReport,
  maybeRestoreAfterDismiss,
  REPORTS_CHANGED_EVENT,
  REPORTS_STORAGE_KEY,
  type StoredUserReport,
} from '../utils/reportsStore';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { useI18n } from '../i18n/I18nProvider';
import { usePagination } from '../hooks/usePagination';
import { PaginationBar } from './components/PaginationBar';
import { buildVisibilityPatch } from '../utils/workVisibility';

const ADMIN_TABLE_PAGE_SIZE = 50;

type ReportState = '대기' | '비공개 유지' | '삭제' | '기각' | '처리완료';
type ReportKind = '작품' | '댓글' | '프로필';

type ReportRow = {
  id: string;
  target: string;
  kind: ReportKind;
  reason: string;
  reportedAt: string;
  status: ReportState;
  workId?: string;
  artistId?: string;
  /** 자동 비공개 발동 시각 (Policy §12.2.1 SLA 계산 기준). 대상 전시의 autoHiddenAt을 파생. */
  autoHiddenAt?: string;
  /** 신고된 작품(piece) 인덱스 — 다중 이미지 전시에서 사용자가 명시 선택한 것. */
  pieceIndex?: number;
};

function mapUserReportToRow(r: StoredUserReport): ReportRow {
  const kind: ReportKind = r.targetType === 'work' ? '작품' : '프로필';
  const detail = r.detail?.trim() || '';
  const pieceTag = typeof r.pieceIndex === 'number' ? ` · ${r.pieceIndex + 1}번 작품` : '';
  const target =
    detail.length > 0
      ? `${r.targetName}${pieceTag} — ${detail.slice(0, 100)}${detail.length > 100 ? '…' : ''}`
      : `${r.targetName}${pieceTag}`;
  const reportedAt = r.createdAt ? r.createdAt.slice(0, 10) : '';
  const statusMap: Record<NonNullable<StoredUserReport['adminStatus']>, ReportState> = {
    pending: '대기',
    resolved: '처리완료',
    hidden: '비공개 유지',
    deleted: '삭제',
    warned: '처리완료', // legacy data: "경고"는 Phase 2로 이관됨
    dismissed: '기각',
  };
  const status: ReportState = statusMap[r.adminStatus ?? 'pending'];
  // 같은 워크로 신고가 2회째 누적되었을 때 work.autoHiddenAt이 존재. 대기 상태인 경우만 SLA 계산 의미 있음.
  const autoHiddenAt =
    r.targetType === 'work' && r.targetId
      ? workStore.getWork(r.targetId)?.autoHiddenAt
      : undefined;
  return {
    id: r.id,
    target,
    kind,
    reason: r.reason ?? r.reasonLabel ?? r.reasonKey ?? '',
    reportedAt,
    status,
    workId: r.targetType === 'work' ? r.targetId : undefined,
    artistId: r.targetArtistId,
    autoHiddenAt,
    pieceIndex: r.pieceIndex,
  };
}

// Policy §22.5 에스컬레이션 기준 — 24시간 윈도우 + 임계 (큐 가시성 보강).
const ESCALATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const ESCALATION_ARTIST_THRESHOLD = 5;
const ESCALATION_WORK_THRESHOLD = 10;

/** 24h 누적 (artist, work) 카운트 — 에스컬레이션 배지용. */
function computeEscalationCounts(reports: ReturnType<typeof loadUserReports>, now: number) {
  const cutoff = now - ESCALATION_WINDOW_MS;
  const byArtist = new Map<string, number>();
  const byWork = new Map<string, number>();
  for (const r of reports) {
    const ts = r.createdAt ? new Date(r.createdAt).getTime() : NaN;
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    if (r.targetArtistId) byArtist.set(r.targetArtistId, (byArtist.get(r.targetArtistId) ?? 0) + 1);
    if (r.targetType === 'work' && r.targetId) byWork.set(r.targetId, (byWork.get(r.targetId) ?? 0) + 1);
  }
  return { byArtist, byWork };
}

function mergeReportRows(): ReportRow[] {
  // PRD_Admin §667 ADM-RPT-01 AC-02: 같은 (신고자, 대상) 반복 신고는 큐에 1건만 노출(중복 방지).
  // 가장 최근 신고를 대표로 보존. reporterId 미상은 dedup 제외(레거시·익명 호환).
  const all = loadUserReports();
  const seen = new Set<string>();
  const unique: typeof all = [];
  for (const r of all) {
    const reporter = r.reporterId?.trim();
    if (!reporter) {
      unique.push(r);
      continue;
    }
    const key = `${reporter}|${r.targetType}|${r.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }
  return unique.map(mapUserReportToRow);
}

/** Policy §12.2.1 SLA 4단계 계산. 판정 완료된 건(대기 아님) 또는 autoHiddenAt 없음이면 null. */
type SlaTier = 'normal' | 'nearing' | 'exceeded' | 'violated';
function computeSlaTier(row: ReportRow, now: number): SlaTier | null {
  if (row.status !== '대기') return null;
  if (!row.autoHiddenAt) return null;
  const started = new Date(row.autoHiddenAt).getTime();
  if (!Number.isFinite(started)) return null;
  const hours = (now - started) / (60 * 60 * 1000);
  if (hours >= 72) return 'violated';
  if (hours >= 48) return 'exceeded';
  if (hours >= 24) return 'nearing';
  return 'normal';
}

function slaBadgeStyle(tier: SlaTier): { cls: string; label: string } {
  switch (tier) {
    case 'violated':
      return { cls: 'bg-red-100 text-red-800 border border-red-300', label: 'SLA 위반' };
    case 'exceeded':
      return { cls: 'bg-orange-100 text-orange-800 border border-orange-300', label: 'SLA 초과' };
    case 'nearing':
      return { cls: 'bg-yellow-50 text-yellow-800 border border-yellow-200', label: 'SLA 임박' };
    default:
      return { cls: '', label: '' };
  }
}

function stateBadge(s: ReportState) {
  switch (s) {
    case '삭제': return 'bg-red-50 text-red-700 border border-red-200';
    case '비공개 유지': return 'bg-orange-50 text-orange-700 border border-orange-200';
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>(mergeReportRows);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [slaFilter, setSlaFilter] = useState<'전체' | '임박 이상' | '초과 이상' | '위반'>('전체');
  // 시계 틱 (1분마다 SLA·에스컬레이션 재계산)
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  /** 같은 대상(targetType+targetId)에 누적된 신고 수. ADM-040 "N건 누적" 배지용. */
  const reportCountByTarget = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.workId ? `work:${r.workId}` : r.artistId ? `artist:${r.artistId}` : '';
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  /** Policy §22.5 24h 에스컬레이션 카운트 — clockTick(1분 주기)으로 자동 갱신. */
  const escalation = useMemo(
    () => computeEscalationCounts(loadUserReports(), Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clockTick, rows],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const tierRank: Record<SlaTier, number> = { normal: 0, nearing: 1, exceeded: 2, violated: 3 };
    return rows
      .filter((r) => {
        if (statusFilter !== '전체' && r.status !== statusFilter) return false;
        if (typeFilter !== '전체' && r.kind !== typeFilter) return false;
        if (slaFilter !== '전체') {
          const tier = computeSlaTier(r, now);
          if (!tier) return false;
          if (slaFilter === '임박 이상' && tierRank[tier] < 1) return false;
          if (slaFilter === '초과 이상' && tierRank[tier] < 2) return false;
          if (slaFilter === '위반' && tierRank[tier] < 3) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Policy §12.2.1: autoHiddenAt 오름차순 (가장 오래된 미처리 먼저). 없으면 뒤로.
        const aPending = a.status === '대기' && a.autoHiddenAt ? new Date(a.autoHiddenAt).getTime() : Number.POSITIVE_INFINITY;
        const bPending = b.status === '대기' && b.autoHiddenAt ? new Date(b.autoHiddenAt).getTime() : Number.POSITIVE_INFINITY;
        return aPending - bPending;
      });
  }, [rows, statusFilter, typeFilter, slaFilter]);

  // PRD_Admin §0.5.2: 어드민 테이블 50건/페이지. 필터 변경 시 1페이지로 리셋.
  const { page, setPage, pageCount, pageItems, totalCount } = usePagination(filtered, ADMIN_TABLE_PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, slaFilter, setPage]);

  /** 비공개 유지: 자동 비공개(Policy §12.2) 또는 아직 공개 중인 대상을 운영자 확정 비공개로 전환. */
  const keepHidden = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    if (raw.targetType === 'work' && raw.targetId) {
      workStore.updateWork(raw.targetId, { ...buildVisibilityPatch('hidden_admin') });
      updateUserReport(id, { adminStatus: 'hidden' });
      pushDemoNotification({
        type: 'system',
        message: t('report.notifTargetWorkHidden').replace('{title}', raw.targetName),
        workId: raw.targetId,
      });
      toast.success('작품 비공개를 유지했습니다. Artier 둘러보기·검색에서 제외됩니다.');
      return;
    }
    updateUserReport(id, { adminStatus: 'hidden' });
    toast.message('이 신고는 비공개 유지로 마감했습니다.');
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
    // 삭제 전에 targetName을 캡처(removeWork 후에는 work 조회 불가).
    const deletedTitle = raw.targetName;
    const deletedWorkId = raw.targetId;
    workStore.removeWork(deletedWorkId);
    updateUserReport(id, { adminStatus: 'deleted' });
    // 작품 작가에게 삭제 알림 (workId는 이미 삭제됐으니 참조하지 않음)
    pushDemoNotification({
      type: 'system',
      message: t('report.notifTargetWorkDeleted').replace('{title}', deletedTitle),
    });
    toast.success('작품이 삭제되었습니다.');
  };

  /**
   * 기각: 신고 부당 판정. 자동 비공개 상태(관리자 확정 비공개가 하나도 없음)였다면 즉시 복원.
   * Phase 1은 신고자 카운트 없음 (Policy §12.3).
   */
  const dismissReport = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    updateUserReport(id, { adminStatus: 'dismissed' });
    pushDemoNotification({
      type: 'system',
      message: t('report.notifReporterDismissed'),
    });
    if (raw.targetType === 'work' && raw.targetId) {
      const restored = maybeRestoreAfterDismiss(raw.targetId);
      if (restored) {
        pushDemoNotification({
          type: 'system',
          message: `'${raw.targetName}' 전시가 검토 결과 정상 복원되었습니다.`,
          workId: raw.targetId,
        });
        toast.message('기각 처리 — 자동 비공개였던 전시를 복원했습니다.');
        return;
      }
    }
    toast.message('신고를 기각했습니다.');
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
          <option value="비공개 유지">비공개 유지</option>
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
        <select
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value as typeof slaFilter)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[170px]"
          title="자동 비공개 발동 후 판정까지의 경과 시간 기준 (Policy §12.2.1)"
        >
          <option value="전체">SLA: 전체</option>
          <option value="임박 이상">24h 임박 이상</option>
          <option value="초과 이상">48h 초과 이상</option>
          <option value="위반">72h 위반</option>
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
              {pageItems.map((r) => {
                const slaTier = computeSlaTier(r, Date.now());
                const rowBg =
                  slaTier === 'violated' ? 'bg-red-50 lg:hover:bg-red-100/60'
                  : slaTier === 'exceeded' ? 'bg-orange-50/60 lg:hover:bg-orange-100/60'
                  : 'lg:hover:bg-muted/50';
                const targetKey = r.workId ? `work:${r.workId}` : r.artistId ? `artist:${r.artistId}` : '';
                const accumulated = targetKey ? reportCountByTarget.get(targetKey) ?? 0 : 0;
                return (
                <tr key={r.id} className={`border-b border-border/40 transition-colors ${rowBg}`}>
                  <td className="px-4 py-3 text-foreground max-w-[200px]">
                    <div className="flex flex-col gap-1">
                      {r.workId ? (
                        <a
                          href={`/exhibitions/${r.workId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary lg:hover:underline"
                          title="전시 상세 새 탭으로 열기"
                        >
                          {r.target}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : r.artistId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/members?artist=${r.artistId}`)}
                          className="inline-flex items-center gap-1 text-primary lg:hover:underline text-left"
                          title="회원 상세 모달 열기"
                        >
                          {r.target}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                      ) : (
                        r.target
                      )}
                      {accumulated >= 2 && (
                        <span
                          className="inline-flex w-fit items-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-semibold"
                          title="같은 대상에 접수된 누적 신고 수 (ADM-040)"
                        >
                          {accumulated}건 누적
                        </span>
                      )}
                      {/* Policy §22.5 — 24h 에스컬레이션: 작품 10+ 또는 작가 5+ */}
                      {(() => {
                        const workCount = r.workId ? escalation.byWork.get(r.workId) ?? 0 : 0;
                        const artistCount = r.artistId ? escalation.byArtist.get(r.artistId) ?? 0 : 0;
                        if (workCount >= ESCALATION_WORK_THRESHOLD) {
                          return (
                            <span
                              className="inline-flex w-fit items-center rounded-full bg-red-100 border border-red-300 text-red-800 px-2 py-0.5 text-[10px] font-semibold"
                              title={`Policy §22.5 — 같은 전시에 24시간 내 신고 ${workCount}건 (≥10건 긴급 큐)`}
                            >
                              긴급 24h {workCount}건
                            </span>
                          );
                        }
                        if (artistCount >= ESCALATION_ARTIST_THRESHOLD) {
                          return (
                            <span
                              className="inline-flex w-fit items-center rounded-full bg-amber-50 border border-amber-300 text-amber-800 px-2 py-0.5 text-[10px] font-semibold"
                              title={`Policy §22.5 — 같은 작가에 24시간 내 신고 ${artistCount}건 (≥5건 검토 큐)`}
                            >
                              작가 24h {artistCount}건
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${kindBadge(r.kind)}`}>
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.reportedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadge(r.status)}`}>
                        {r.status}
                      </span>
                      {slaTier && slaTier !== 'normal' && (() => {
                        const { cls, label } = slaBadgeStyle(slaTier);
                        return (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
                            title="Policy §12.2.1 — 자동 비공개 발동 후 경과 시간 기준"
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>
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
                        onClick={() => dismissReport(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg"
                        title="신고 기각 — 자동 비공개였다면 즉시 복원"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        기각
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={r.status !== '대기'}
                        onClick={() => keepHidden(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground"
                        title="비공개 유지 — 운영자 확정 비공개로 전환"
                      >
                        <EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        비공개 유지
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
                );
              })}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <PaginationBar
              page={page}
              pageCount={pageCount}
              totalCount={totalCount}
              pageSize={ADMIN_TABLE_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
