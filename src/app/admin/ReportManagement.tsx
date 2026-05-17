import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { artists } from '../data';
import { toast } from 'sonner';
import { Trash2, Flag } from 'lucide-react';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
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
import { activateInviteToken, deactivateInviteToken } from '../utils/inviteTokenStore';
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
  targetName: string;
  detail: string;
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
    targetName: r.targetName ?? '',
    detail,
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

function reasonBadgeClass(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes('저작권') || r.includes('copyright'))
    return 'bg-red-50 text-red-700 border border-red-200';
  if (r.includes('부적절') || r.includes('inappropriate'))
    return 'bg-amber-50 text-amber-800 border border-amber-200';
  if (r.includes('스팸') || r.includes('spam') || r.includes('광고'))
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
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
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>(mergeReportRows);
  const [statusFilter, setStatusFilter] = useState('대기');
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  // Policy §22.2 v2.20·§22.5 — Phase 1엔 SLA 자동 측정·시간 기반 우선순위 폐기. 운영팀 정성 판단으로 처리.

  // Policy §12.1 v2.20 「삭제」 사유 4종 한정 + audit_log 기록.
  type DeleteReason = DeletedWorkLogPayload['reason'];
  const [deleteDialog, setDeleteDialog] = useState<{ reportId: string; workId: string; targetName: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState<DeleteReason>('copyright');
  const [deleteNote, setDeleteNote] = useState('');
  const [memoDialog, setMemoDialog] = useState<{ reportId: string; action: 'dismiss' | 'keepHidden'; targetName: string } | null>(null);
  const [memoNote, setMemoNote] = useState('');

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
  const keepHidden = (id: string, note?: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    if (raw.targetType === 'work' && raw.targetId) {
      workStore.updateWork(raw.targetId, { ...buildVisibilityPatch('hidden_admin') });
      deactivateInviteToken(raw.targetId);
      updateUserReport(id, { adminStatus: 'hidden' });
      appendAuditLog({
        action: 'report_kept_hidden',
        targetId: raw.targetId,
        targetSnapshot: { reportId: id, targetName: raw.targetName, ...(note ? { note } : {}) },
        actorId: 'admin',
        actorRole: 'admin',
      });
      pushDemoNotification({
        type: 'system',
        message: t('report.notifTargetWorkHidden').replace('{title}', raw.targetName),
        workId: raw.targetId,
      });
      toast.success(t('admin.report.toastHidden'));
      return;
    }
    updateUserReport(id, { adminStatus: 'hidden' });
    toast.message(t('admin.report.toastHiddenClosed'));
  };

  /** 삭제 다이얼로그 오픈: 사유 선택을 위해 별도 모달로 진입 (Policy §12.1 v2.20). */
  const openDeleteDialog = (id: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw || raw.targetType !== 'work' || !raw.targetId) {
      toast.error(t('admin.report.toastErrWorkOnly'));
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
      toast.error(t('admin.report.toastErrNotFound'));
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

    const reasonLabel = t(`report.deleteReason.${deleteReason}` as never);
    pushDemoNotification({
      type: 'system',
      message: t('report.notifTargetWorkDeleted').replace('{title}', targetName),
    });
    toast.success(t('admin.report.toastDeleted').replace('{reason}', reasonLabel));
    setDeleteDialog(null);
  };

  const openMemoDialog = (reportId: string, action: 'dismiss' | 'keepHidden', targetName: string) => {
    setMemoDialog({ reportId, action, targetName });
    setMemoNote('');
  };

  const confirmMemoAction = () => {
    if (!memoDialog) return;
    const note = memoNote.trim() || undefined;
    if (memoDialog.action === 'dismiss') dismissReport(memoDialog.reportId, note);
    else keepHidden(memoDialog.reportId, note);
    setMemoDialog(null);
    setMemoNote('');
  };

  /**
   * 기각: 신고 부당 판정. 운영팀이 비공개 유지로 처리했다면 즉시 복원 (Policy §12.1 v2.20).
   * Phase 1은 신고자 카운트 없음 (Policy §12.3).
   */
  const dismissReport = (id: string, note?: string) => {
    const raw = loadUserReports().find((r) => r.id === id);
    if (!raw) return;
    updateUserReport(id, { adminStatus: 'dismissed' });
    appendAuditLog({
      action: 'report_dismissed',
      targetId: raw.targetId ?? id,
      targetSnapshot: { reportId: id, targetName: raw.targetName, targetType: raw.targetType, ...(note ? { note } : {}) },
      actorId: 'admin',
      actorRole: 'admin',
    });
    if (raw.targetType === 'work' && raw.targetId) {
      const restored = maybeRestoreAfterDismiss(raw.targetId);
      if (restored) {
        activateInviteToken(raw.targetId);
        pushDemoNotification({
          type: 'system',
          message: t('report.notifTargetWorkRestored').replace('{title}', raw.targetName),
          workId: raw.targetId,
        });
        toast.message(t('admin.report.toastDismissedRestored'));
        return;
      }
    }
    toast.message(t('admin.report.toastDismissed'));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-base font-semibold mb-4 text-foreground">신고 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-base font-semibold mb-4 text-foreground">신고 관리</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-white min-w-[130px]"
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
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: '44% 1fr' }}>

            {/* 좌: 신고 목록 */}
            <div className="border-r border-border overflow-y-auto" style={{ maxHeight: '72vh' }}>
              {/* 컬럼 헤더 */}
              <div
                className="grid px-3 py-2 bg-muted border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                style={{ gridTemplateColumns: '28px 1fr 90px 56px' }}
              >
                <div />
                <div className="pl-2">신고 대상</div>
                <div>사유</div>
                <div>날짜</div>
              </div>
              {pageItems.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                const isDone = r.status !== '대기';
                const reportWork = r.workId ? workStore.getWork(r.workId) : null;
                const thumbKey = reportWork
                  ? getCoverImage(reportWork.image, reportWork.coverImageIndex)
                  : '';
                const thumbSrc = thumbKey ? (imageUrls[thumbKey] || thumbKey) : '';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left grid px-3 py-2.5 border-b border-border/40 transition-colors items-center ${
                      isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
                    } ${isDone ? 'opacity-50' : ''}`}
                    style={{ gridTemplateColumns: '28px 1fr 90px 56px' }}
                  >
                    <div className="w-7 h-7 rounded overflow-hidden border border-border bg-muted/30 shrink-0 flex items-center justify-center">
                      {thumbSrc ? (
                        <ImageWithFallback src={thumbSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Flag className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="pl-2 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <div className="font-medium text-sm text-foreground truncate">{r.targetName}</div>
                        {(() => {
                          const key = r.workId ? `work:${r.workId}` : r.artistId ? `artist:${r.artistId}` : '';
                          const cnt = key ? (reportCountByTarget.get(key) ?? 0) : 0;
                          return cnt >= 2 ? (
                            <span className="shrink-0 inline-flex rounded-full bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold">
                              {cnt}건 누적
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.reporterId ? (reporterNicknameMap.get(r.reporterId) ?? r.reporterId) : '—'}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium truncate max-w-full ${reasonBadgeClass(r.reason)}`}>
                        {r.reason}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.reportedAt || '—'}
                    </div>
                  </button>
                );
              })}
              <div className="px-3 py-2">
                <PaginationBar
                  page={page}
                  pageCount={pageCount}
                  totalCount={totalCount}
                  pageSize={ADMIN_TABLE_PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            </div>

            {/* 우: 신고 상세 패널 */}
            <div className="overflow-y-auto" style={{ maxHeight: '72vh' }}>
              {selectedReport ? (
                <ReportDetailPanel
                  report={selectedReport}
                  reporterNickname={
                    selectedReport.reporterId
                      ? (reporterNicknameMap.get(selectedReport.reporterId) ?? selectedReport.reporterId)
                      : '—'
                  }
                  onDelete={() => openDeleteDialog(selectedReport.id)}
                  onDismiss={() => openMemoDialog(selectedReport.id, 'dismiss', selectedReport.targetName)}
                  onKeepHidden={() => openMemoDialog(selectedReport.id, 'keepHidden', selectedReport.targetName)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8">
                  왼쪽에서 신고를 선택하세요
                </div>
              )}
            </div>

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

      {/* 기각·비공개유지 메모 모달 (Policy §12.1 v2.20 · §22.7) */}
      {memoDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setMemoDialog(null)}
        >
          <div
            className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-foreground">
                "{memoDialog.targetName}" — {memoDialog.action === 'dismiss' ? t('admin.report.memoTitleDismiss') : t('admin.report.memoTitleHide')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.report.memoAuditNote')}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('admin.report.memoLabel')}</label>
              <textarea
                value={memoNote}
                onChange={(e) => setMemoNote(e.target.value)}
                placeholder={t('admin.report.memoPlaceholder')}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white min-h-[72px]"
                maxLength={500}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground text-right">{memoNote.length}/500</p>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setMemoDialog(null)} className="text-sm">
                {t('admin.notice.cancel')}
              </Button>
              <Button type="button" onClick={confirmMemoAction} className="text-sm">
                {memoDialog.action === 'dismiss' ? t('admin.report.memoConfirmDismiss') : t('admin.report.memoConfirmHide')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 신고 상세 패널 컴포넌트 ──────────────────────────────────────────────────

interface ReportDetailPanelProps {
  report: ReportRow;
  reporterNickname: string;
  onDelete: () => void;
  onDismiss: () => void;
  onKeepHidden: () => void;
}

function ReportDetailPanel({ report, reporterNickname, onDelete, onDismiss, onKeepHidden }: ReportDetailPanelProps) {
  const navigate = useNavigate();
  const reportWork = report.workId ? workStore.getWork(report.workId) : null;

  // 신고된 작품 이미지 결정: pieceIndex 있으면 해당 슬롯, 없으면 커버
  const workImages = reportWork
    ? (Array.isArray(reportWork.image) ? reportWork.image : [reportWork.image])
    : [];
  const hasPieceIndex = typeof report.pieceIndex === 'number' && workImages.length > 1;
  const activeImgKey = hasPieceIndex
    ? (workImages[report.pieceIndex!] ?? '')
    : reportWork ? getCoverImage(reportWork.image, reportWork.coverImageIndex) : '';
  const activeSrc = activeImgKey ? (imageUrls[activeImgKey] || activeImgKey) : '';

  return (
    <div className="flex flex-col h-full">

      {/* 어두운 배경: 작품 이미지 */}
      <div className="bg-slate-900 p-4 shrink-0">
        {activeSrc ? (
          <>
            <div
              className="bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-2"
              style={{ height: 120 }}
            >
              <ImageWithFallback src={activeSrc} alt="" className="w-full h-full object-contain" />
            </div>
            {/* 다중 이미지 썸네일 — 신고된 작품 번호 강조 */}
            {workImages.length > 1 && (
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {workImages.map((imgKey, i) => {
                  const src = imageUrls[imgKey] || imgKey;
                  const isReported = hasPieceIndex && i === report.pieceIndex;
                  return (
                    <div
                      key={i}
                      className={`relative w-9 h-9 rounded overflow-hidden border-2 shrink-0 ${
                        isReported ? 'border-red-400' : 'border-slate-600/60'
                      }`}
                    >
                      <ImageWithFallback src={src} alt={`${i + 1}번 작품`} className="w-full h-full object-cover" />
                      {isReported && (
                        <div className="absolute inset-0 bg-red-500/25 flex items-end justify-center pb-0.5">
                          <span className="text-[8px] font-bold text-white leading-none">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {hasPieceIndex && (
              <div className="mb-2">
                <span className="inline-flex rounded-full bg-red-900/70 text-red-200 px-2 py-0.5 text-[10px] font-medium">
                  {report.pieceIndex! + 1}번 작품 신고
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            className="bg-slate-800 rounded-lg flex items-center justify-center mb-3 text-slate-500 text-xs"
            style={{ height: 72 }}
          >
            작품 이미지 없음 (계정 신고 또는 이미 삭제됨)
          </div>
        )}
        <div className="font-bold text-white text-sm">{report.targetName}</div>
        {reportWork && (
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => navigate(`/admin/members?artist=${reportWork.artistId}`)}
              className="text-slate-400 text-xs lg:hover:text-slate-200 underline underline-offset-2"
            >
              {reportWork.artist?.name ?? '—'}
            </button>
            <a
              href={`/exhibitions/${report.workId}`}
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 text-xs lg:hover:text-violet-100"
            >
              전시 보기 ↗
            </a>
          </div>
        )}
      </div>

      {/* 신고 내용 */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">신고 내용</span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${reasonBadgeClass(report.reason)}`}>
            {report.reason}
          </span>
        </div>
        {report.detail ? (
          <div className="bg-amber-50 border-l-2 border-amber-400 px-3 py-2 rounded-r text-sm text-foreground leading-relaxed mb-2">
            {report.detail}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-2">(상세 내용 없음)</p>
        )}
        <p className="text-xs text-muted-foreground">{reporterNickname} · {report.reportedAt}</p>
      </div>

      {/* 판정 액션 (위험도 순) */}
      <div className="px-4 py-4 space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">판정</p>

        <button
          type="button"
          disabled={report.status !== '대기'}
          onClick={onKeepHidden}
          className="w-full text-left border border-border rounded-lg px-3 py-2.5 lg:hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="font-semibold text-sm mb-0.5">🔒 비공개 유지</div>
          <div className="text-xs text-muted-foreground">피드·검색에서 숨김 유지. 작가 프로필엔 보임.</div>
        </button>

        <button
          type="button"
          disabled={report.status !== '대기' || !report.workId}
          onClick={onDelete}
          className="w-full text-left border border-red-200 rounded-lg px-3 py-2.5 lg:hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="font-semibold text-sm text-red-600 mb-0.5">🗑 작품 삭제</div>
          <div className="text-xs text-muted-foreground">영구 삭제. 되돌릴 수 없음. 확인 다이얼로그.</div>
        </button>

        <button
          type="button"
          disabled={report.status !== '대기'}
          onClick={onDismiss}
          className="w-full text-left border border-emerald-200 rounded-lg px-3 py-2.5 lg:hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="font-semibold text-sm text-emerald-700 mb-0.5">✓ 신고 기각</div>
          <div className="text-xs text-muted-foreground">신고 부당. 비공개 처리됐다면 즉시 복원.</div>
        </button>
      </div>

      {/* 현재 상태 */}
      <div className="px-4 py-3 border-t border-border/60 mt-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span>현재 상태:</span>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadge(report.status)}`}>
          {report.status}
        </span>
      </div>
    </div>
  );
}
