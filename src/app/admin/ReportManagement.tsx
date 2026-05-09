import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { artists } from '../data';
import { toast } from 'sonner';
import { EyeOff, Trash2, XCircle, ExternalLink } from 'lucide-react';
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
import { logWorkDeletion, appendAuditLog, type DeletedWorkLogPayload } from '../utils/adminAuditLog';
import { pointsRecallOnAdminDelete } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import { usePagination } from '../hooks/usePagination';
import { PaginationBar } from './components/PaginationBar';
import { buildVisibilityPatch } from '../utils/workVisibility';

const ADMIN_TABLE_PAGE_SIZE = 20;

type ReportState = '대기' | '비공개 유지' | '삭제' | '기각' | '처리완료';

const DEMO_ARTIST_ID = artists[0].id;

function buildReporterNicknameMap(): Map<string, string> {
  const map = new Map<string, string>();
  // 시드 아티스트 이름 기본값
  for (const a of artists) map.set(a.id, a.name);
  // 데모 사용자는 artier_profile의 현재 닉네임 우선
  try {
    const raw = localStorage.getItem('artier_profile');
    if (raw) {
      const p = JSON.parse(raw) as { nickname?: string; name?: string };
      const nick = p.nickname?.trim() || p.name?.trim();
      if (nick) map.set(DEMO_ARTIST_ID, nick);
    }
  } catch { /* ignore */ }
  // 어드민 회원 목록에서 추가 보완 (DEMO_ARTIST_ID 제외)
  try {
    const raw = localStorage.getItem('artier_admin_members_v1');
    if (raw) {
      const list = JSON.parse(raw) as { id: string; name: string }[];
      for (const m of list) {
        if (m.id !== DEMO_ARTIST_ID && m.name) map.set(m.id, m.name);
      }
    }
  } catch { /* ignore */ }
  return map;
}

type ReportRow = {
  id: string;
  target: string;
  reason: string;
  reportedAt: string;
  reporterId?: string;
  status: ReportState;
  workId?: string;
  artistId?: string;
  pieceIndex?: number;
};

function mapUserReportToRow(r: StoredUserReport): ReportRow {
  const detail = r.detail?.trim() || '';
  const pieceTag = typeof r.pieceIndex === 'number' ? ` · ${r.pieceIndex + 1}번 작품` : '';
  const target =
    detail.length > 0
      ? `${r.targetName}${pieceTag} — ${detail.slice(0, 100)}${detail.length > 100 ? '…' : ''}`
      : `${r.targetName}${pieceTag}`;
  const reportedAt = r.createdAt ? r.createdAt.slice(0, 16).replace('T', ' ') : '';
  const statusMap: Record<NonNullable<StoredUserReport['adminStatus']>, ReportState> = {
    pending: '대기',
    resolved: '처리완료',
    hidden: '비공개 유지',
    deleted: '삭제',
    warned: '처리완료',
    dismissed: '기각',
  };
  const status: ReportState = statusMap[r.adminStatus ?? 'pending'];
  return {
    id: r.id,
    target,
    reason: r.reason ?? r.reasonLabel ?? r.reasonKey ?? '',
    reportedAt,
    reporterId: r.reporterId,
    status,
    workId: r.targetType === 'work' ? r.targetId : undefined,
    artistId: r.targetArtistId,
    pieceIndex: r.pieceIndex,
  };
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

function stateBadge(s: ReportState) {
  switch (s) {
    case '삭제': return 'bg-red-50 text-red-700 border border-red-200';
    case '비공개 유지': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case '기각': return 'bg-slate-100 text-slate-600 border border-slate-200';
    case '처리완료': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    default: return 'bg-amber-50 text-amber-900 border border-amber-200';
  }
}


export default function ReportManagement() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>(mergeReportRows);
  const [statusFilter, setStatusFilter] = useState('전체');
  // Policy §22.2 v2.20·§22.5 — Phase 1엔 SLA 자동 측정·시간 기반 우선순위 폐기. 운영팀 정성 판단으로 처리.

  // Policy §12.1 v2.20 「삭제」 사유 4종 한정 + audit_log 기록.
  type DeleteReason = DeletedWorkLogPayload['reason'];
  const [deleteDialog, setDeleteDialog] = useState<{ reportId: string; workId: string; targetName: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState<DeleteReason>('copyright');
  const [deleteNote, setDeleteNote] = useState('');

  const reporterNicknameMap = useMemo(() => buildReporterNicknameMap(), []);
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

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (statusFilter !== '전체' && r.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // 대기 상태가 위, 그 안에선 신고 시각 오름차순(오래된 미처리 먼저).
        const aPending = a.status === '대기' ? 0 : 1;
        const bPending = b.status === '대기' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        const aTime = new Date(a.reportedAt).getTime() || 0;
        const bTime = new Date(b.reportedAt).getTime() || 0;
        return aTime - bTime;
      });
  }, [rows, statusFilter]);

  // PRD_Admin §0.5.2: 어드민 테이블 50건/페이지. 필터 변경 시 1페이지로 리셋.
  const { page, setPage, pageCount, pageItems, totalCount } = usePagination(filtered, ADMIN_TABLE_PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [statusFilter, setPage]);

  /** 비공개 유지: 운영팀이 신고 판정 결과 전시를 비공개 유지로 전환 (Policy §12.1 v2.20). */
  const keepHidden = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    if (raw.targetType === 'work' && raw.targetId) {
      workStore.updateWork(raw.targetId, { ...buildVisibilityPatch('hidden_admin') });
      updateUserReport(id, { adminStatus: 'hidden' });
      appendAuditLog({
        action: 'report_kept_hidden',
        targetId: raw.targetId,
        targetSnapshot: { reportId: id, targetName: raw.targetName },
        actorId: 'admin',
        actorRole: 'admin',
      });
      pushDemoNotification({
        type: 'system',
        message: t('report.notifTargetWorkHidden').replace('{title}', raw.targetName),
        workId: raw.targetId,
      });
      toast.success('작품 비공개를 유지했습니다. Proud Gallery 둘러보기·검색에서 제외됩니다.');
      return;
    }
    updateUserReport(id, { adminStatus: 'hidden' });
    toast.message('이 신고는 비공개 유지로 마감했습니다.');
  };

  /** 삭제 다이얼로그 오픈: 사유 선택을 위해 별도 모달로 진입 (Policy §12.1 v2.20). */
  const openDeleteDialog = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw || raw.targetType !== 'work' || !raw.targetId) {
      toast.error('작품 신고에 한해 삭제할 수 있습니다.');
      return;
    }
    setDeleteDialog({ reportId: id, workId: raw.targetId, targetName: raw.targetName });
    setDeleteReason('copyright');
    setDeleteNote('');
  };

  /** 삭제 확정: 작품 영구 삭제 + audit_log 기록 + 신고 처리 + 작가 알림 (Policy §12.1 v2.20·§22.7). */
  const confirmDelete = () => {
    if (!deleteDialog) return;
    const { reportId, workId, targetName } = deleteDialog;
    const work = workStore.getWork(workId);
    if (!work) {
      toast.error('작품을 찾을 수 없습니다 (이미 삭제됨).');
      setDeleteDialog(null);
      return;
    }

    // 같은 work에 누적된 신고 ID 수집 (분쟁 증빙)
    const linkedReportIds = loadUserReports()
      .filter((r) => r.targetType === 'work' && r.targetId === workId)
      .map((r) => r.id);

    // audit_log entry 기록 (작품 메타 스냅샷 + 사유 + 메모 + 연결 신고 ID, 5년 보관)
    const images = Array.isArray(work.image) ? work.image : work.image ? [work.image] : [];
    logWorkDeletion('admin', 'admin', {
      reason: deleteReason,
      reasonNote: deleteNote.trim() || undefined,
      reportIds: linkedReportIds,
      snapshot: {
        workId,
        artistId: work.artistId,
        artistName: work.artist?.name ?? '',
        exhibitionName: work.exhibitionName,
        pieceTitles: work.imagePieceTitles,
        uploadedAt: work.uploadedAt,
        imageRefs: images,
      },
    });

    // 작품 영구 삭제 (cascade는 workStore.removeWork에서 처리 — 기획전 piece·응모전 selectedWorkIds 등)
    pointsRecallOnAdminDelete(workId);
    workStore.removeWork(workId);
    updateUserReport(reportId, { adminStatus: 'deleted' });

    // 작가에게 삭제 알림 + 사유 변수
    const reasonLabel = t(`report.deleteReason.${deleteReason}` as never);
    pushDemoNotification({
      type: 'system',
      message: t('report.notifTargetWorkDeleted')
        .replace('{title}', targetName)
        .replace('{reason}', reasonLabel),
    });
    toast.success(`작품 삭제 + 감사 로그 기록 (사유: ${reasonLabel})`);
    setDeleteDialog(null);
  };

  /**
   * 기각: 신고 부당 판정. 운영팀이 비공개 유지로 처리했다면 즉시 복원 (Policy §12.1 v2.20).
   * Phase 1은 신고자 카운트 없음 (Policy §12.3).
   */
  const dismissReport = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    updateUserReport(id, { adminStatus: 'dismissed' });
    appendAuditLog({
      action: 'report_dismissed',
      targetId: raw.targetId ?? id,
      targetSnapshot: { reportId: id, targetName: raw.targetName, targetType: raw.targetType },
      actorId: 'admin',
      actorRole: 'admin',
    });
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
        toast.message('기각 처리 — 비공개 유지 상태였던 전시를 복원했습니다.');
        return;
      }
    }
    toast.message('신고를 기각했습니다.');
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
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        사용자가 접수한 신고를 처리합니다. 작품 신고를 비공개 처리하면 둘러보기·검색에서 숨겨져요. 신고 직후 이 탭을 열어 두면 목록이 곧바로 갱신됩니다.
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
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          접수된 신고가 없습니다. Proud Gallery에서 로그인한 뒤 작품 ⋯ 메뉴에서 신고해 보세요.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium whitespace-nowrap">신고대상</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">신고사유</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">신고자</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">신고일시</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">상태</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">작업</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => {
                const targetKey = r.workId ? `work:${r.workId}` : r.artistId ? `artist:${r.artistId}` : '';
                const accumulated = targetKey ? reportCountByTarget.get(targetKey) ?? 0 : 0;
                return (
                <tr key={r.id} className="border-b border-border/40 transition-colors lg:hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
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
                          title="같은 대상에 접수된 누적 신고 수"
                        >
                          {accumulated}건 누적
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{r.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {r.reporterId ? (reporterNicknameMap.get(r.reporterId) ?? r.reporterId) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.reportedAt}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-nowrap justify-end gap-2">
                      <Button
                        type="button"
                        disabled={r.status !== '대기'}
                        onClick={() => openDeleteDialog(r.id)}
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
                        title="신고 기각 — 비공개 유지 상태였다면 즉시 복원"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        기각
                      </Button>
                      <button
                        type="button"
                        disabled={r.status !== '대기'}
                        onClick={() => keepHidden(r.id)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/40 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1"
                        title="비공개 유지 — 운영자 확정 비공개로 전환"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        비공개 유지
                      </button>
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

      {/* 삭제 사유 + 자유 메모 모달 (Policy §12.1 v2.20). audit_log entry 기록용. */}
      {deleteDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeleteDialog(null)}
        >
          <div
            className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-foreground">"{deleteDialog.targetName}" 작품 삭제</h3>
              <p className="text-xs text-muted-foreground mt-1">
                복구할 수 없습니다. 사유와 메모는 운영자 감사 로그에 5년 보관됩니다 (Policy §22.7).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">삭제 사유 <span className="text-destructive">*</span></label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value as DeleteReason)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="copyright">저작권 침해 확정</option>
                <option value="illegal">위법 콘텐츠 (명예훼손·혐오 등)</option>
                <option value="minor_harmful">청소년 유해</option>
                <option value="abuse">어뷰즈 (스팸·도배·계정 우회)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">메모 (선택)</label>
              <textarea
                value={deleteNote}
                onChange={(e) => setDeleteNote(e.target.value)}
                placeholder="판단 근거·증거 링크 등 (감사 로그에 함께 보관)"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white min-h-[72px]"
                maxLength={500}
              />
              <p className="text-[11px] text-muted-foreground text-right">{deleteNote.length}/500</p>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialog(null)}
                className="text-sm"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="text-sm bg-red-600 text-white lg:hover:bg-red-700"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                영구 삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
