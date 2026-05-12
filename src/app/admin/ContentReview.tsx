import type React from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, X, Star } from 'lucide-react';
import { workStore } from '../store';
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
import type { Work } from '../data';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Button } from '../components/ui/button';
import { REJECTION_REASONS, REJECTION_REASON_LABEL_KEY, type RejectionReason } from '../utils/reviewLabels';
import { usePagination } from '../hooks/usePagination';
import { PaginationBar } from './components/PaginationBar';

const REVIEW_PAGE_SIZE = 20;

/** 반려 이력 항목 — 팝오버/모달 공통 서식. */
function formatHistoryDate(iso: string): string {
  // YYYY-MM-DD HH:mm (로컬)
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
import { useI18n } from '../i18n/I18nProvider';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { activateInviteToken, deactivateInviteToken } from '../utils/inviteTokenStore';
import { buildVisibilityPatch } from '../utils/workVisibility';
import { appendAuditLog } from '../utils/adminAuditLog';

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

// URL `?status=pending|approved|rejected|all` ↔ 내부 한국어 필터 매핑
const STATUS_URL_TO_UI: Record<string, ReviewStatusUi | '전체'> = {
  pending: '대기중',
  approved: '승인',
  rejected: '반려',
  all: '전체',
};
const STATUS_UI_TO_URL: Record<string, string> = {
  '대기중': 'pending',
  '승인': 'approved',
  '반려': 'rejected',
  '전체': 'all',
};

export default function ContentReview() {
  const { t } = useI18n();
  const featuredIds = useFeaturedExhibitions();
  const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<Work[]>(() => workStore.getWorks());
  // 초기 필터: URL `?status=` 이 유효하면 반영, 아니면 '대기중' (운영자가 열면 처리할 항목만)
  const initialStatus: string = ((): string => {
    const raw = searchParams.get('status') ?? '';
    return STATUS_URL_TO_UI[raw] ?? '대기중';
  })();
  const [statusFilter, setStatusFilterState] = useState<string>(initialStatus);
  const setStatusFilter = useCallback(
    (next: string) => {
      setStatusFilterState(next);
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const urlVal = STATUS_UI_TO_URL[next] ?? 'all';
          if (urlVal === 'all') sp.delete('status');
          else sp.set('status', urlVal);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  // 외부 URL 변경(뒤로가기·딥링크) 역방향 동기화
  useEffect(() => {
    const raw = searchParams.get('status') ?? '';
    const next = STATUS_URL_TO_UI[raw] ?? '대기중';
    setStatusFilterState((prev) => (prev === next ? prev : next));
  }, [searchParams]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pickedReason, setPickedReason] = useState<RejectionReason>('low_quality');
  // ADM-030: 운영팀 내부 메모(선택, 최대 500자). rejectionHistory[i].note에 누적 저장.
  const [internalNote, setInternalNote] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    return workStore.subscribe(() => setWorks(workStore.getWorks()));
  }, []);

  // 반려 폼 ESC 닫기
  useEffect(() => {
    if (!showRejectForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRejectForm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showRejectForm]);

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

  // PRD_Admin §2 ADM-REV-01: 검수 큐 20건/페이지.
  const { page, setPage, pageCount, pageItems, totalCount } = usePagination(filtered, REVIEW_PAGE_SIZE);
  // 필터 변경 시 첫 페이지로. (usePagination은 범위 보정만 하고 명시적 '필터 변경' 시그널은 없으므로 여기서 리셋)
  useEffect(() => {
    setPage(1);
  }, [statusFilter, from, to, setPage]);

  const approve = (w: Work) => {
    // 자동 전진: 승인 전에 다음 항목 캡처
    const currentIdx = filtered.findIndex((r) => r.work.id === w.id);
    const nextItem = filtered[currentIdx + 1] ?? filtered[currentIdx - 1] ?? null;

    workStore.updateWork(w.id, {
      ...buildVisibilityPatch('public'),
      rejectionReason: undefined,
    });
    appendAuditLog({
      action: 'review_approved',
      targetId: w.id,
      targetSnapshot: { exhibitionName: w.exhibitionName, artistId: w.artistId },
      actorId: 'admin',
      actorRole: 'admin',
    });
    toast.success('승인되었습니다. 둘러보기 피드에 노출됩니다.');
    pushDemoNotification({
      type: 'system',
      message: t('review.notifApproved'),
      workId: w.id,
    });
    // 비회원 초대 토큰 활성화 (회사가 외부 채널 발송 안 함 — 작가가 본인 채널로 직접 공유).
    const hasNonMember = w.imageArtists?.some((a) => a.type === 'non-member' && (a.displayName ?? '').trim()) ?? false;
    if (hasNonMember) activateInviteToken(w.id);

    // Policy v2.16 §3: 클레임된 회원 참여자(작가 본인 제외)에게도 공개 알림 1건.
    // 검수 대기 중 미리 클레임한 친구는 배지가 사라지는 것 외에 알 길이 없어서 별도 푸시.
    const exhibitionTitle = w.exhibitionName?.trim() || w.title || '';
    const claimedMemberIds = new Set<string>();
    w.imageArtists?.forEach((ia) => {
      if (ia.type === 'member' && ia.memberId && ia.memberId !== w.artistId) {
        claimedMemberIds.add(ia.memberId);
      }
    });
    claimedMemberIds.forEach(() => {
      pushDemoNotification({
        type: 'system',
        message: t('review.notifApprovedForParticipant').replace('{title}', exhibitionTitle),
        workId: w.id,
      });
    });

    // 자동 전진
    setSelectedWork(nextItem?.work ?? null);
    setShowRejectForm(false);
    setActiveImageIndex(0);
  };

  const openReject = (w: Work) => {
    setSelectedWork(w);
    setShowRejectForm(true);
    setPickedReason('low_quality');
    setInternalNote('');
  };

  const confirmReject = () => {
    if (!selectedWork) return;
    const w = selectedWork;
    // 자동 전진: 반려 전에 다음 항목 캡처
    const currentIdx = filtered.findIndex((r) => r.work.id === w.id);
    const nextItem = filtered[currentIdx + 1] ?? filtered[currentIdx - 1] ?? null;
    // 반려 이력에 누적 append — 작가가 수정 재발행해도 보존됨(감사·재범 추적·사유 트렌드).
    const trimmedNote = internalNote.trim();
    const nextHistory = [
      ...(w.rejectionHistory ?? []),
      {
        reason: pickedReason,
        rejectedAt: new Date().toISOString(),
        ...(trimmedNote ? { note: trimmedNote } : {}),
      },
    ];
    workStore.updateWork(w.id, {
      ...buildVisibilityPatch('rejected'),
      rejectionReason: pickedReason,
      rejectionHistory: nextHistory,
    });
    // Policy §3 v2.14: 검수 반려 시 토큰 비활성화 (친구 링크 보존, 재승인 시 자동 활성화).
    deactivateInviteToken(w.id);
    appendAuditLog({
      action: 'review_rejected',
      targetId: w.id,
      targetSnapshot: {
        exhibitionName: w.exhibitionName,
        artistId: w.artistId,
        reason: pickedReason,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      },
      actorId: 'admin',
      actorRole: 'admin',
    });
    toast.error('반려 처리되었습니다. 피드에는 노출되지 않습니다.');
    const reasonLabel = t(REJECTION_REASON_LABEL_KEY[pickedReason]);
    pushDemoNotification({
      type: 'system',
      message: t('review.notifRejected').replace('{reason}', reasonLabel),
      workId: w.id,
      // PRD USR-NTF-01 §1·AC-04 — 검수 반려 알림 클릭 시 프로필 전시 탭 + USR-PRF-12 모달 자동 오픈.
      navigateTo: `/me?rejected=${encodeURIComponent(w.id)}`,
    });

    // 자동 전진
    setShowRejectForm(false);
    setSelectedWork(nextItem?.work ?? null);
    setActiveImageIndex(0);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">콘텐츠 검수</h1>
        <div className="rounded-lg border border-border bg-white py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-foreground">콘텐츠 검수</h1>
        {(() => {
          const pendingCount = rows.filter((r) => r.ui === '대기중').length;
          return pendingCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              검수 대기 {pendingCount}건
            </span>
          ) : null;
        })()}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        검수 통과 전 전시는 둘러보기 피드에 노출되지 않아요. 본인 프로필에선 바로 보여요. 검수 SLA는 1~24시간.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground min-w-[140px]"
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
          className="border border-border rounded-lg px-3 py-2 text-sm"
          aria-label="기간 시작"
        />
        <span className="self-center text-sm text-muted-foreground">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm"
          aria-label="기간 종료"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          <p>조건에 맞는 항목이 없습니다. 신규 작품을 업로드하면 대기 목록에 표시됩니다.</p>
          {(statusFilter !== '전체' || from || to) && (
            <button
              className="mt-3 text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => { setStatusFilter('전체'); setFrom(''); setTo(''); }}
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: '38% 1fr' }}>

            {/* 좌: 검수 목록 */}
            <div className="border-r border-border overflow-y-auto" style={{ maxHeight: '72vh' }}>
              {pageItems.map(({ work: w, ui, date }) => {
                const key = getCoverImage(w.image, w.coverImageIndex);
                const src = imageUrls[key] || key;
                const imageCount = Array.isArray(w.image) ? w.image.length : 1;
                const isSelected = selectedWork?.id === w.id;
                return (
                  <div
                    key={w.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedWork(w); setShowRejectForm(false); setActiveImageIndex(0); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedWork(w); setShowRejectForm(false); setActiveImageIndex(0); } }}
                    className={`w-full text-left flex gap-3 items-start px-3 py-2.5 border-b border-border/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded overflow-hidden border border-border bg-muted/30 shrink-0">
                      <ImageWithFallback src={src} alt="" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        featuredStore.toggle(w.id);
                        appendAuditLog({
                          action: 'curation_saved',
                          targetId: w.id,
                          targetSnapshot: { featured: !featuredSet.has(w.id) },
                          actorId: 'admin',
                          actorRole: 'admin',
                        });
                      }}
                      className={`shrink-0 p-1 rounded transition-colors ${
                        featuredSet.has(w.id)
                          ? 'text-amber-500 lg:hover:text-amber-400'
                          : 'text-muted-foreground/40 lg:hover:text-amber-400'
                      }`}
                      title={featuredSet.has(w.id) ? '추천 중 — 클릭해서 해제' : '클릭해서 추천'}
                    >
                      <Star className={`w-3.5 h-3.5 ${featuredSet.has(w.id) ? 'fill-amber-500' : ''}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">
                          {w.exhibitionName || w.title}
                        </span>
                        {imageCount > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 shrink-0">
                            {imageCount}장
                          </span>
                        )}
                        {ui === '대기중' && (w.rejectionHistory?.length ?? 0) > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 shrink-0">
                            재검수 {w.rejectionHistory!.length > 1 ? `${w.rejectionHistory!.length}회` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/members?artist=${w.artistId}`); }}
                          className="text-primary lg:hover:underline"
                        >
                          {w.artist.name}
                        </button>
                        <span>·</span>
                        <span>{date ? date.slice(0, 10) : '—'}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(ui)}`}>
                          {ui}
                          {ui === '반려' && w.rejectionReason && (
                            <span className="ml-1 opacity-80">· {t(REJECTION_REASON_LABEL_KEY[w.rejectionReason])}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="px-3 py-2">
                <PaginationBar
                  page={page}
                  pageCount={pageCount}
                  totalCount={totalCount}
                  pageSize={REVIEW_PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            </div>

            {/* 우: 상세 패널 */}
            <div className="overflow-y-auto flex flex-col" style={{ maxHeight: '72vh' }}>
              {selectedWork ? (
                <ReviewDetailPanel
                  work={selectedWork}
                  ui={toUiStatus(selectedWork) ?? '대기중'}
                  activeImageIndex={activeImageIndex}
                  onImageSelect={setActiveImageIndex}
                  showRejectForm={showRejectForm}
                  onToggleRejectForm={() => setShowRejectForm((f) => !f)}
                  pickedReason={pickedReason}
                  onPickReason={setPickedReason}
                  internalNote={internalNote}
                  onNoteChange={(v) => { if (v.length <= 500) setInternalNote(v); }}
                  onApprove={() => approve(selectedWork)}
                  onConfirmReject={confirmReject}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">
                  왼쪽에서 전시를 선택하세요
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── 상세 패널 컴포넌트 ───────────────────────────────────────────────────────

interface ReviewDetailPanelProps {
  work: Work;
  ui: ReviewStatusUi;
  activeImageIndex: number;
  onImageSelect: (i: number) => void;
  showRejectForm: boolean;
  onToggleRejectForm: () => void;
  pickedReason: RejectionReason;
  onPickReason: (r: RejectionReason) => void;
  internalNote: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onConfirmReject: () => void;
}

function ReviewDetailPanel({
  work, ui, activeImageIndex, onImageSelect,
  showRejectForm, onToggleRejectForm,
  pickedReason, onPickReason, internalNote, onNoteChange,
  onApprove, onConfirmReject,
}: ReviewDetailPanelProps) {
  const { t } = useI18n();
  const workImages = Array.isArray(work.image) ? work.image : [work.image];
  const hasCoverPage = !!(work.customCoverUrl && work.coverImageIndex === -1);
  const images: string[] = hasCoverPage
    ? [work.customCoverUrl as string, ...workImages]
    : workImages;
  const safeIdx = Math.min(activeImageIndex, images.length - 1);
  const activeKey = images[safeIdx] ?? '';
  const activeSrc = imageUrls[activeKey] || activeKey;

  return (
    <div className="flex flex-col h-full">

      {/* ① 어두운 배경 이미지 갤러리 */}
      <div className="bg-slate-900 p-4 shrink-0">
        <div className="flex gap-3 mb-3">
          <div
            className="flex-1 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: 140, maxHeight: 220 }}
          >
            <ImageWithFallback src={activeSrc} alt="" className="w-full h-full object-contain" style={{ maxHeight: 220 } as React.CSSProperties} />
          </div>
          {images.length > 1 && (
            <div className="flex flex-col gap-1.5 shrink-0">
              {images.map((imgKey, i) => {
                const thumbSrc = imageUrls[imgKey] || imgKey;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onImageSelect(i)}
                    className={`w-14 h-14 rounded overflow-hidden border-2 transition-colors shrink-0 ${
                      safeIdx === i ? 'border-primary' : 'border-slate-600 lg:hover:border-slate-400'
                    }`}
                  >
                    <ImageWithFallback src={thumbSrc} alt={`${i + 1}번째 이미지`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <h3 className="text-white font-bold text-sm leading-tight">
          {work.exhibitionName || work.title}
        </h3>
        <p className="text-slate-400 text-xs mt-0.5">
          {work.artist.name}
          {images.length > 1 && ` · ${images.length}장`}
          {work.uploadedAt && ` · ${work.uploadedAt.slice(0, 10)}`}
        </p>
        <a
          href={`/exhibitions/${work.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-violet-300 text-xs mt-1 inline-flex items-center gap-0.5 lg:hover:text-violet-100"
        >
          전시 보기 ↗
        </a>
      </div>

      {/* ② 전시 설명 */}
      {work.description && (
        <div className="px-4 py-3 text-sm text-foreground leading-relaxed border-b border-border">
          {work.description}
        </div>
      )}

      {/* ③ 이전 반려 이력 (재검수 건) */}
      {(work.rejectionHistory?.length ?? 0) > 0 && (
        <div className="px-4 py-3 border-b border-border bg-amber-50/60">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            이전 반려 이력 {work.rejectionHistory!.length}건
          </p>
          <ul className="space-y-1.5 max-h-28 overflow-y-auto">
            {[...(work.rejectionHistory ?? [])].reverse().map((entry, idx) => (
              <li key={`${entry.rejectedAt}-${idx}`} className="text-xs">
                <span className="inline-flex rounded-full px-1.5 py-0.5 font-medium bg-red-100 text-red-700 border border-red-200 mr-2">
                  {t(REJECTION_REASON_LABEL_KEY[entry.reason])}
                </span>
                <span className="text-muted-foreground">{entry.rejectedAt.slice(0, 16).replace('T', ' ')}</span>
                {entry.note && <p className="text-foreground mt-0.5 pl-1">{entry.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ④ 반려 사유 폼 (showRejectForm=true 시에만) */}
      {showRejectForm && (
        <div className="px-4 py-4 bg-red-50/80 border-b border-red-200">
          <p className="text-sm font-semibold text-foreground mb-3">{t('review.rejectPickTitle')}</p>
          <div className="space-y-2 mb-3">
            {REJECTION_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-sm ${
                  pickedReason === r ? 'border-primary bg-primary/5' : 'border-border bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  value={r}
                  checked={pickedReason === r}
                  onChange={() => onPickReason(r)}
                />
                {t(REJECTION_REASON_LABEL_KEY[r])}
              </label>
            ))}
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-foreground mb-1">
              내부 메모{' '}
              <span className="font-normal text-muted-foreground">(선택 · 운영팀만 열람)</span>
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => onNoteChange(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="재검수 시 참고할 맥락을 적어주세요."
              className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">{internalNote.length}/500</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onToggleRejectForm} className="flex-1 text-sm">
              {t('review.rejectCancel')}
            </Button>
            <Button
              type="button"
              onClick={onConfirmReject}
              className="flex-1 text-sm bg-red-600 text-white lg:hover:bg-red-700"
            >
              {t('review.rejectConfirm')}
            </Button>
          </div>
        </div>
      )}

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* ⑤ 검수 판정 액션 바 */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 flex gap-2 shrink-0">
        <Button
          type="button"
          disabled={ui !== '대기중'}
          onClick={onApprove}
          className="flex-1 text-sm bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          승인 → 피드 게시
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ui !== '대기중'}
          onClick={onToggleRejectForm}
          className={`flex-1 text-sm disabled:opacity-50 disabled:pointer-events-none ${
            showRejectForm ? 'border-red-400 text-red-600 bg-red-50' : ''
          }`}
        >
          <X className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          반려
        </Button>
      </div>
    </div>
  );
}
