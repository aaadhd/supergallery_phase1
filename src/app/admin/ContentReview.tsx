import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { workStore } from '../store';
import type { Work } from '../data';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { REJECTION_REASONS, REJECTION_REASON_LABEL_KEY, type RejectionReason } from '../utils/reviewLabels';

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
import { sendInviteToNonMember } from '../utils/inviteMessaging';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<Work[]>(() => workStore.getWorks());
  // 초기 필터: URL `?status=` 이 유효하면 반영, 아니면 '전체'
  const initialStatus: string = ((): string => {
    const raw = searchParams.get('status') ?? '';
    return STATUS_URL_TO_UI[raw] ?? '전체';
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
    const next = STATUS_URL_TO_UI[raw] ?? '전체';
    setStatusFilterState((prev) => (prev === next ? prev : next));
  }, [searchParams]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rejectTarget, setRejectTarget] = useState<Work | null>(null);
  const [pickedReason, setPickedReason] = useState<RejectionReason>('low_quality');

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

  const approve = (w: Work) => {
    workStore.updateWork(w.id, { feedReviewStatus: 'approved', rejectionReason: undefined });
    toast.success('승인되었습니다. 둘러보기 피드에 노출됩니다.');
    pushDemoNotification({
      type: 'system',
      message: t('review.notifApproved'),
      workId: w.id,
    });
    // 팔로워 신작 알림 (Phase 1 데모: 로그인 사용자에게 1건)
    pushDemoNotification({
      type: 'like',
      message: t('review.notifNewWork'),
      workId: w.id,
      fromUser: { name: w.artist.name, avatar: w.artist.avatar, id: w.artistId },
    });

    // 검수 승인 시점에 비가입자 초대 발송 (Upload에서 보류된 것)
    const pending = w.imageArtists?.filter((a) => a.type === 'non-member' && a.phoneNumber && a.displayName) ?? [];
    if (pending.length > 0) {
      let sent = 0;
      for (const r of pending) {
        const exhibitionUrl = `${window.location.origin}/exhibitions/${w.id}?from=credited&invited_phone=${encodeURIComponent(r.phoneNumber!)}&invited_name=${encodeURIComponent(r.displayName!)}`;
        const result = sendInviteToNonMember({ phoneNumber: r.phoneNumber!, displayName: r.displayName!, workId: w.id, exhibitionUrl, locale: 'ko' });
        if (result.success) sent++;
      }
      // 발송 후 전화번호 scrub
      const scrubbed = w.imageArtists!.map((a) =>
        a.type === 'non-member' ? { ...a, phoneNumber: undefined } : a,
      );
      workStore.updateWork(w.id, { imageArtists: scrubbed });
      if (sent > 0) toast.info(`비가입 작가 ${sent}명에게 초대가 발송되었습니다.`);
    }
  };

  const openReject = (w: Work) => {
    setRejectTarget(w);
    setPickedReason('low_quality');
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    const w = rejectTarget;
    // 반려 이력에 누적 append — 작가가 수정 재발행해도 보존됨(감사·재범 추적·사유 트렌드).
    const nextHistory = [
      ...(w.rejectionHistory ?? []),
      { reason: pickedReason, rejectedAt: new Date().toISOString() },
    ];
    workStore.updateWork(w.id, {
      feedReviewStatus: 'rejected',
      rejectionReason: pickedReason,
      rejectionHistory: nextHistory,
    });
    toast.error('반려 처리되었습니다. 피드에는 노출되지 않습니다.');
    const reasonLabel = t(REJECTION_REASON_LABEL_KEY[pickedReason]);
    pushDemoNotification({
      type: 'system',
      message: t('review.notifRejected').replace('{reason}', reasonLabel),
      workId: w.id,
    });
    setRejectTarget(null);
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
      <h1 className="text-xl font-bold mb-1 text-foreground">콘텐츠 검수</h1>
      <p className="text-sm text-muted-foreground mb-6">
        업로드된 전시는 검수 전까지 둘러보기 피드에 나오지 않습니다. 본인 프로필에는 즉시 노출됩니다. 로컬 개발에서 관리자 화면은{' '}
        <code className="text-xs bg-muted/50 px-1 rounded">/admin/content-review</code> · 먼저 일반 로그인이 필요합니다(
        <code className="text-xs bg-muted/50 px-1 rounded">npm run dev</code> 기준).
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
          조건에 맞는 항목이 없습니다. 신규 작품을 업로드하면 대기 목록에 표시됩니다.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
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
                const key = getCoverImage(w.image, w.coverImageIndex);
                const src = imageUrls[key] || key;
                return (
                  <tr key={w.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex w-12 h-12 items-center justify-center rounded-md overflow-hidden border border-border bg-muted/30">
                        <ImageWithFallback src={src} alt="" className="w-full h-full object-contain object-center" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{w.title}</span>
                        {ui === '대기중' && (w.rejectionHistory?.length ?? 0) > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer lg:hover:bg-amber-200 transition-colors"
                                aria-label={`이전 반려 ${w.rejectionHistory!.length}회 이력 보기`}
                              >
                                재검수 {w.rejectionHistory!.length > 1 ? `${w.rejectionHistory!.length}회차` : '요청'}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-80 p-0">
                              <div className="p-3 border-b border-border">
                                <p className="text-xs font-semibold text-foreground">반려 이력 {w.rejectionHistory!.length}건</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  작가가 수정 재발행 후 재검수 대기 중입니다. 과거 판정을 참고해 결정하세요.
                                </p>
                              </div>
                              <ul className="max-h-64 overflow-y-auto divide-y divide-border/60">
                                {[...(w.rejectionHistory ?? [])]
                                  .slice()
                                  .reverse()
                                  .map((entry, idx, arr) => (
                                    <li key={`${entry.rejectedAt}-${idx}`} className="p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                          {t(REJECTION_REASON_LABEL_KEY[entry.reason])}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                          {arr.length - idx}회차
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-1">{formatHistoryDate(entry.rejectedAt)}</p>
                                      {entry.note && (
                                        <p className="text-xs text-foreground mt-1 whitespace-pre-wrap break-words">{entry.note}</p>
                                      )}
                                    </li>
                                  ))}
                              </ul>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{w.artist.name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(ui)}`}>
                        {ui}
                        {ui === '반려' && w.rejectionReason && (
                          <span className="ml-1 text-xs opacity-80">
                            · {t(REJECTION_REASON_LABEL_KEY[w.rejectionReason])}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button
                        type="button"
                        disabled={ui !== '대기중'}
                        onClick={() => approve(w)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        승인
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={ui !== '대기중'}
                        onClick={() => openReject(w)}
                        className="text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <X className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        반려
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-foreground mb-1">
              {t('review.rejectPickTitle')}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('review.rejectPickDesc')}
            </p>

            {/* 이전 반려 이력이 있으면 미리보기 — 재검수 판단 시 참고용 */}
            {(rejectTarget.rejectionHistory?.length ?? 0) > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-xs font-semibold text-amber-900 mb-2">
                  이전 반려 이력 {rejectTarget.rejectionHistory!.length}건 (최신순)
                </p>
                <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                  {[...(rejectTarget.rejectionHistory ?? [])].reverse().map((entry, idx) => (
                    <li key={`${entry.rejectedAt}-${idx}`} className="flex items-center gap-2 text-[11px]">
                      <span className="inline-flex rounded-full px-1.5 py-0.5 font-medium bg-red-100 text-red-700 border border-red-200">
                        {t(REJECTION_REASON_LABEL_KEY[entry.reason])}
                      </span>
                      <span className="text-muted-foreground">{formatHistoryDate(entry.rejectedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 mb-5">
              {REJECTION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-sm ${
                    pickedReason === r ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={r}
                    checked={pickedReason === r}
                    onChange={() => setPickedReason(r)}
                  />
                  {t(REJECTION_REASON_LABEL_KEY[r])}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
                className="text-sm px-3 py-1.5 rounded-lg"
              >
                {t('review.rejectCancel')}
              </Button>
              <Button
                type="button"
                onClick={confirmReject}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white lg:hover:bg-red-700"
              >
                {t('review.rejectConfirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
