# 어드민 일일 운영 3개 페이지 UX 재설계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검수(ContentReview)·신고(ReportManagement)·문의(AdminInquiries) 3개 어드민 페이지를 목적 중심 분할 레이아웃으로 재설계하고, PickManagement 이미지 버그를 수정한다.

**Architecture:** 각 페이지를 좌측 목록 + 우측 상세 패널 2단 레이아웃으로 교체. 상세 패널 상단은 WorkDetailModal 동일 패턴(슬레이트 배경 + 이미지 갤러리). 기존 비즈니스 로직(승인/반려/신고판정/답변/audit log/notification) 완전 보존.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Lucide React

---

## 수정 파일 목록

| 파일 | 변경 규모 |
|---|---|
| `src/app/admin/ContentReview.tsx` | 대형 — 레이아웃 전면 교체, 상태 재구성 |
| `src/app/admin/ReportManagement.tsx` | 대형 — 레이아웃 전면 교체, ReportRow 타입 확장 |
| `src/app/admin/AdminInquiries.tsx` | 대형 — 탭 분리, 작품 문의 상세 헤더 추가 |
| `src/app/admin/PickManagement.tsx` | 소형 — imageUrls 룩업 4곳 수정 |

---

## Task 1: ContentReview — 분할 레이아웃 + 이미지 갤러리 상세 패널

**Files:**
- Modify: `src/app/admin/ContentReview.tsx`

현재: 전체 너비 테이블 + 반려 시 중앙 오버레이 모달  
목표: 좌측 목록(38%) + 우측 상세 패널(62%). 상세에서 다중 이미지 갤러리 + 인라인 반려 폼

- [ ] **Step 1-1: 상태 변수 교체 — rejectTarget 제거 → selectedWork + showRejectForm + activeImageIndex**

`rejectTarget: Work | null` 상태 삭제. 대신 아래 3개 추가:

```tsx
// 삭제:
// const [rejectTarget, setRejectTarget] = useState<Work | null>(null);

// 추가:
const [selectedWork, setSelectedWork] = useState<Work | null>(null);
const [showRejectForm, setShowRejectForm] = useState(false);
const [activeImageIndex, setActiveImageIndex] = useState(0);
```

`openReject` 함수 교체 (현재 line 183):
```tsx
const openReject = (w: Work) => {
  setSelectedWork(w);
  setShowRejectForm(true);
  setPickedReason('low_quality');
  setInternalNote('');
};
```

ESC 키 useEffect 수정 (현재 line 111 — `if (!rejectTarget) return;`):
```tsx
useEffect(() => {
  if (!showRejectForm) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowRejectForm(false);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [showRejectForm]);
```

- [ ] **Step 1-2: approve() 함수에 자동 전진 로직 추가**

```tsx
const approve = (w: Work) => {
  // 자동 전진: 승인 전에 다음 항목 캡처
  const currentIdx = filtered.findIndex((r) => r.work.id === w.id);
  const nextItem = filtered[currentIdx + 1] ?? filtered[currentIdx - 1] ?? null;

  // ↓ 기존 업무 로직 유지 (workStore.updateWork, appendAuditLog, toast, pushDemoNotification 등)
  workStore.updateWork(w.id, {
    ...buildVisibilityPatch('public'),
    rejectionReason: undefined,
  });
  appendAuditLog({ action: 'review_approved', targetId: w.id,
    targetSnapshot: { exhibitionName: w.exhibitionName, artistId: w.artistId },
    actorId: 'admin', actorRole: 'admin' });
  toast.success('승인되었습니다. 둘러보기 피드에 노출됩니다.');
  pushDemoNotification({ type: 'system', message: t('review.notifApproved'), workId: w.id });
  const hasNonMember = w.imageArtists?.some((a) => a.type === 'non-member' && (a.displayName ?? '').trim()) ?? false;
  if (hasNonMember) activateInviteToken(w.id);
  const exhibitionTitle = w.exhibitionName?.trim() || w.title || '';
  const claimedMemberIds = new Set<string>();
  w.imageArtists?.forEach((ia) => {
    if (ia.type === 'member' && ia.memberId && ia.memberId !== w.artistId)
      claimedMemberIds.add(ia.memberId);
  });
  claimedMemberIds.forEach(() => {
    pushDemoNotification({ type: 'system',
      message: t('review.notifApprovedForParticipant').replace('{title}', exhibitionTitle),
      workId: w.id });
  });
  // ↑ 기존 업무 로직 끝

  // 자동 전진
  setSelectedWork(nextItem?.work ?? null);
  setShowRejectForm(false);
  setActiveImageIndex(0);
};
```

- [ ] **Step 1-3: confirmReject() 함수 수정 — rejectTarget → selectedWork + 자동 전진**

```tsx
const confirmReject = () => {
  if (!selectedWork) return;
  const w = selectedWork;
  // 자동 전진: 반려 전에 다음 항목 캡처
  const currentIdx = filtered.findIndex((r) => r.work.id === w.id);
  const nextItem = filtered[currentIdx + 1] ?? filtered[currentIdx - 1] ?? null;

  const trimmedNote = internalNote.trim();
  const nextHistory = [
    ...(w.rejectionHistory ?? []),
    { reason: pickedReason, rejectedAt: new Date().toISOString(),
      ...(trimmedNote ? { note: trimmedNote } : {}) },
  ];
  workStore.updateWork(w.id, {
    ...buildVisibilityPatch('rejected'),
    rejectionReason: pickedReason,
    rejectionHistory: nextHistory,
  });
  deactivateInviteToken(w.id);
  appendAuditLog({ action: 'review_rejected', targetId: w.id,
    targetSnapshot: { exhibitionName: w.exhibitionName, artistId: w.artistId,
      reason: pickedReason, ...(trimmedNote ? { note: trimmedNote } : {}) },
    actorId: 'admin', actorRole: 'admin' });
  toast.error('반려 처리되었습니다. 피드에는 노출되지 않습니다.');
  const reasonLabel = t(REJECTION_REASON_LABEL_KEY[pickedReason]);
  pushDemoNotification({ type: 'system',
    message: t('review.notifRejected').replace('{reason}', reasonLabel),
    workId: w.id,
    navigateTo: `/me?rejected=${encodeURIComponent(w.id)}` });

  // 자동 전진
  setShowRejectForm(false);
  setSelectedWork(nextItem?.work ?? null);
  setActiveImageIndex(0);
};
```

- [ ] **Step 1-4: 분할 레이아웃으로 return JSX 교체**

현재 `filtered.length === 0` 조건 블록 이하의 `<div className="border border-border rounded-lg overflow-hidden overflow-x-auto">` 테이블 전체를 아래로 교체:

```tsx
{filtered.length === 0 ? (
  <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
    조건에 맞는 항목이 없습니다. 신규 작품을 업로드하면 대기 목록에 표시됩니다.
  </div>
) : (
  <div className="border border-border rounded-lg overflow-hidden">
    <div className="grid" style={{ gridTemplateColumns: '38% 1fr' }}>

      {/* 좌: 목록 */}
      <div className="border-r border-border overflow-y-auto" style={{ maxHeight: '72vh' }}>
        {pageItems.map(({ work: w, ui, date }) => {
          const key = getCoverImage(w.image, w.coverImageIndex);
          const src = imageUrls[key] || key;
          const imageCount = Array.isArray(w.image) ? w.image.length : 1;
          const isSelected = selectedWork?.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => { setSelectedWork(w); setShowRejectForm(false); setActiveImageIndex(0); }}
              className={`w-full text-left flex gap-3 items-start px-3 py-2.5 border-b border-border/40 transition-colors ${
                isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
              }`}
            >
              <div className="w-9 h-9 rounded overflow-hidden border border-border bg-muted/30 shrink-0">
                <ImageWithFallback src={src} alt="" className="w-full h-full object-contain" />
              </div>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        <div className="px-3 py-2">
          <PaginationBar page={page} pageCount={pageCount} totalCount={totalCount}
            pageSize={REVIEW_PAGE_SIZE} onPageChange={setPage} />
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
            t={t}
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
```

- [ ] **Step 1-5: ReviewDetailPanel 인라인 컴포넌트 작성 (파일 하단에 추가)**

```tsx
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
  t: (key: string) => string;
}

function ReviewDetailPanel({
  work, ui, activeImageIndex, onImageSelect,
  showRejectForm, onToggleRejectForm,
  pickedReason, onPickReason, internalNote, onNoteChange,
  onApprove, onConfirmReject, t,
}: ReviewDetailPanelProps) {
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
            <ImageWithFallback src={activeSrc} alt="" className="w-full h-full object-contain" style={{ maxHeight: 220 }} />
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
              취소
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

      {/* ⑤ 검수 판정 액션 바 (sticky bottom) */}
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
```

- [ ] **Step 1-6: 기존 centered overlay 모달 제거**

파일 하단의 `{rejectTarget && ( <div className="fixed inset-0 z-50 ...">...</div> )}` 블록 전체 삭제.

- [ ] **Step 1-7: TypeScript 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본"
npx tsc --noEmit
```

Expected: 에러 없음. 에러 발생 시 필드명·prop 타입 확인.

- [ ] **Step 1-8: 브라우저 확인 (localhost:5173/admin/review)**

- 목록 좌측 + 상세 우측 분할 레이아웃 확인
- 대기중 작품 클릭 → 우측에 다크 헤더 + 이미지 표시
- 이미지 3장 전시: 썸네일 스트립 3개 클릭으로 전환 확인
- 승인 클릭 → 목록에서 제거 + 다음 항목 자동 선택
- 반려 버튼 클릭 → 인라인 사유 폼 표시
- 반려 확정 → 목록 제거 + 다음 자동 선택

- [ ] **Step 1-9: Commit**

```bash
git add src/app/admin/ContentReview.tsx
git commit -m "feat: ContentReview 분할 레이아웃 + 이미지 갤러리 상세 패널"
```

---

## Task 2: ReportManagement — 목록 개선 + 분할 레이아웃

**Files:**
- Modify: `src/app/admin/ReportManagement.tsx`

현재: 전체 너비 테이블(신고 전문 텍스트 노출) + 인라인 버튼  
목표: 좌측 목록(썸네일+사유뱃지) + 우측 상세 패널(작품이미지+판정카드)

- [ ] **Step 2-1: 필요한 import 추가**

```tsx
// 기존 import에 없으면 추가:
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
// lucide: Flag 추가
import { EyeOff, Trash2, XCircle, ExternalLink, Flag } from 'lucide-react';
```

- [ ] **Step 2-2: ReportRow 타입에 detail 필드 추가**

```tsx
type ReportRow = {
  id: string;
  target: string;
  targetName: string;
  detail: string;        // 추가: 신고 상세 메시지 전문
  reason: string;
  reportedAt: string;
  reporterId?: string;
  status: ReportState;
  workId?: string;
  artistId?: string;
  pieceIndex?: number;
};
```

`mapUserReportToRow` 함수에 `detail` 필드 추가:
```tsx
function mapUserReportToRow(r: StoredUserReport): ReportRow {
  const detail = r.detail?.trim() || '';
  // ... 기존 코드 유지 ...
  return {
    id: r.id,
    target,          // 기존 유지
    targetName: r.targetName ?? '',
    detail,          // 추가
    reason: r.reason ?? r.reasonLabel ?? r.reasonKey ?? '',
    reportedAt,
    reporterId: r.reporterId,
    status,
    workId: r.targetType === 'work' ? r.targetId : undefined,
    artistId: r.targetArtistId,
    pieceIndex: r.pieceIndex,
  };
}
```

- [ ] **Step 2-3: selectedReport 상태 + 사유 뱃지 색상 함수 추가**

```tsx
const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
```

사유 뱃지 색상 함수 (컴포넌트 바깥에 정의):
```tsx
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
```

- [ ] **Step 2-4: 분할 레이아웃 + 목록 재작성**

기존 `<div className="border border-border rounded-lg overflow-hidden overflow-x-auto">` `<table>` 블록 전체를 아래로 교체:

```tsx
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
          style={{ gridTemplateColumns: '28px 1fr 72px 44px' }}
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
              className={`w-full text-left grid px-3 py-2.5 border-b border-border/40 transition-colors items-center gap-1 ${
                isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
              } ${isDone ? 'opacity-50' : ''}`}
              style={{ gridTemplateColumns: '28px 1fr 72px 44px' }}
            >
              {/* 썸네일 */}
              <div className="w-7 h-7 rounded overflow-hidden border border-border bg-muted/30 shrink-0 flex items-center justify-center">
                {thumbSrc ? (
                  <ImageWithFallback src={thumbSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Flag className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              {/* 신고 대상 + 신고자 */}
              <div className="pl-2 min-w-0">
                <div className="font-medium text-sm text-foreground truncate">{r.targetName}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {r.reporterId ? (reporterNicknameMap.get(r.reporterId) ?? r.reporterId) : '—'}
                </div>
              </div>
              {/* 사유 뱃지만 */}
              <div>
                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${reasonBadgeClass(r.reason)}`}>
                  {r.reason.slice(0, 5)}
                </span>
              </div>
              {/* MM-DD */}
              <div className="text-[11px] text-muted-foreground">
                {r.reportedAt ? r.reportedAt.slice(5, 10) : '—'}
              </div>
            </button>
          );
        })}
        <div className="px-3 py-2">
          <PaginationBar page={page} pageCount={pageCount} totalCount={totalCount}
            pageSize={ADMIN_TABLE_PAGE_SIZE} onPageChange={setPage} />
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
```

- [ ] **Step 2-5: ReportDetailPanel 컴포넌트 작성 (파일 하단에 추가)**

```tsx
interface ReportDetailPanelProps {
  report: ReportRow;
  reporterNickname: string;
  onDelete: () => void;
  onDismiss: () => void;
  onKeepHidden: () => void;
}

function ReportDetailPanel({ report, reporterNickname, onDelete, onDismiss, onKeepHidden }: ReportDetailPanelProps) {
  const reportWork = report.workId ? workStore.getWork(report.workId) : null;
  const coverKey = reportWork ? getCoverImage(reportWork.image, reportWork.coverImageIndex) : '';
  const coverSrc = coverKey ? (imageUrls[coverKey] || coverKey) : '';

  return (
    <div className="flex flex-col h-full">

      {/* 어두운 배경: 작품 이미지 */}
      <div className="bg-slate-900 p-4 shrink-0">
        {coverSrc ? (
          <div
            className="bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-3"
            style={{ height: 120 }}
          >
            <ImageWithFallback src={coverSrc} alt="" className="w-full h-full object-contain" style={{ maxHeight: 120 }} />
          </div>
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
            <span className="text-slate-400 text-xs">{reportWork.artist?.name ?? '—'}</span>
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
```

- [ ] **Step 2-6: TypeScript 검사**

```bash
npx tsc --noEmit
```

`StoredUserReport`에 `detail` 필드가 없으면 `r.detail` 접근 시 타입 에러 발생 → `reportsStore.ts`의 `StoredUserReport` 타입에 `detail?: string` 추가.

- [ ] **Step 2-7: 브라우저 확인 (localhost:5173/admin/reports)**

- 목록: 사유 뱃지만 표시 (텍스트 전문 없음), 작품 신고에 썸네일
- 처리 완료 항목 opacity-50
- 클릭 → 우측에 작품 이미지 + 신고 원문 + 판정 3개 버튼
- 삭제 → 기존 deleteDialog 모달 열림
- 기각/비공개유지 → 기존 memoDialog 모달 열림

- [ ] **Step 2-8: Commit**

```bash
git add src/app/admin/ReportManagement.tsx
git commit -m "feat: ReportManagement 분할 레이아웃 + 사유 뱃지 + 상세 패널"
```

---

## Task 3: AdminInquiries — 탭 분리 + 작품 문의 맥락 헤더

**Files:**
- Modify: `src/app/admin/AdminInquiries.tsx`

현재: 단일 테이블(작품문의+일반문의 혼합) + 우측 상세 패널  
목표: 탭 2개(작품문의 / 일반문의) 분리, 작품문의 상세에 다크 배경 작품 맥락 헤더

- [ ] **Step 3-1: import 추가**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';   // 추가
// ... 기존 ...
import { workStore } from '../store';                  // 추가
import { getCoverImage } from '../utils/imageHelper';  // 추가
import { imageUrls } from '../imageUrls';              // 추가
import { ImageWithFallback } from '../components/ImageWithFallback'; // 추가
```

- [ ] **Step 3-2: 탭 상태 + URL 동기화 추가 (컴포넌트 상단)**

```tsx
const [searchParams, setSearchParams] = useSearchParams();
type InquiryTab = 'work' | 'general';
const activeTab: InquiryTab = searchParams.get('tab') === 'work' ? 'work' : 'general';
const setActiveTab = (tab: InquiryTab) => {
  setSearchParams(
    (prev) => {
      const sp = new URLSearchParams(prev);
      if (tab === 'general') sp.delete('tab');
      else sp.set('tab', tab);
      return sp;
    },
    { replace: true },
  );
  setSelectedId(null);
};
```

- [ ] **Step 3-3: filtered를 workFiltered + generalFiltered로 분리**

기존 `filtered` useMemo를 아래 두 개로 교체:

```tsx
const workFiltered = useMemo(() => {
  const now = Date.now();
  return inquiries
    .filter((i) => i.category === 'workInquiry')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((i) => ({ ...i, _slaTier: computeSlaTier(i, now) }));
}, [inquiries]);

const generalFiltered = useMemo(() => {
  const now = Date.now();
  return inquiries
    .filter((i) => {
      if (i.category === 'workInquiry') return false;       // 작품 문의 탭으로 분리
      if (categoryFilter !== '전체' && i.category !== categoryFilter) return false;
      if (statusFilter !== '전체' && (i.status ?? '신규') !== statusFilter) return false;
      if (privacyPriority && i.category !== 'privacy') return false;
      return true;
    })
    .sort((a, b) => {
      const aPriv = a.category === 'privacy' && (a.status ?? '신규') === '신규' ? 0 : 1;
      const bPriv = b.category === 'privacy' && (b.status ?? '신규') === '신규' ? 0 : 1;
      if (aPriv !== bPriv) return aPriv - bPriv;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .map((i) => ({ ...i, _slaTier: computeSlaTier(i, now) }));
}, [inquiries, categoryFilter, statusFilter, privacyPriority]);
```

`categoryFilter` 드롭다운에서 `workInquiry` 옵션 제거:
```tsx
// 일반 문의 탭 필터에서 workInquiry 제외:
{Object.entries(CATEGORY_LABELS)
  .filter(([k]) => k !== 'workInquiry')   // 추가
  .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
```

- [ ] **Step 3-4: 탭 헤더 UI 추가**

KPI 카드 아래, 필터 위에:

```tsx
{/* 탭 헤더 */}
<div className="flex border-b border-border mb-4">
  <button
    type="button"
    onClick={() => setActiveTab('general')}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      activeTab === 'general'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground lg:hover:text-foreground'
    }`}
  >
    💬 일반 문의
    <span className={`ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
      activeTab === 'general' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
    }`}>
      {generalFiltered.length}
    </span>
  </button>
  <button
    type="button"
    onClick={() => setActiveTab('work')}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      activeTab === 'work'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground lg:hover:text-foreground'
    }`}
  >
    🖼 작품 문의
    <span className={`ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
      activeTab === 'work' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
    }`}>
      {workFiltered.length}
    </span>
  </button>
</div>
```

- [ ] **Step 3-5: 필터 표시를 일반 문의 탭에서만**

기존 `<div className="flex flex-wrap gap-3 mb-4">` 필터 블록을 조건부로:

```tsx
{activeTab === 'general' && (
  <div className="flex flex-wrap gap-3 mb-4">
    {/* 기존 카테고리, 상태, 개인정보우선 필터 — 그대로 유지 */}
  </div>
)}
```

- [ ] **Step 3-6: 탭 콘텐츠 분기 — 기존 grid 블록을 조건부로**

기존 `<div className="grid gap-4 lg:grid-cols-[1fr_420px]">` 블록을 아래로 교체:

```tsx
{activeTab === 'work' ? (
  /* 작품 문의 탭 */
  <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
    {/* 작품 문의 목록 */}
    <div className="border border-border rounded-lg overflow-hidden">
      {workFiltered.length === 0 ? (
        <div className="px-3 py-12 text-center text-sm text-muted-foreground">
          작품 문의가 없습니다.
        </div>
      ) : (
        workFiltered.map((i) => {
          const status = i.status ?? '신규';
          const workObj = i.workId ? workStore.getWork(i.workId) : null;
          const thumbKey = workObj ? getCoverImage(workObj.image, workObj.coverImageIndex) : '';
          const thumbSrc = thumbKey ? (imageUrls[thumbKey] || thumbKey) : '';
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => setSelectedId(i.id)}
              className={`w-full text-left flex gap-3 items-start px-3 py-3 border-b border-border/40 transition-colors ${
                selectedId === i.id ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
              }`}
            >
              <div className="w-9 h-9 rounded overflow-hidden border border-border bg-muted/30 shrink-0 flex items-center justify-center">
                {thumbSrc ? (
                  <ImageWithFallback src={thumbSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs">?</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="font-medium text-sm truncate">{i.workTitle ?? '(전시명 없음)'}</span>
                  {i.categoryDetail && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 rounded px-1.5 py-0.5 shrink-0">
                      {WORK_INQUIRY_DETAIL_LABELS[i.categoryDetail] ?? ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${inquiryStatusBadgeClass(status)}`}>
                    {status}
                  </span>
                  <span>{i.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>

    {/* 작품 문의 상세 */}
    {selected && selected.category === 'workInquiry' ? (
      <aside className="border border-border rounded-lg bg-white overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
        <WorkInquiryDetailHeader inquiry={selected} />
        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs font-medium text-muted-foreground">문의 내용</p>
              <p className="text-xs text-muted-foreground">{selected.email} · {selected.createdAt.slice(0, 10)}</p>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
          </div>
          {/* 답변 영역 (기존 로직 동일) */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">빠른 답변 템플릿</p>
            <select
              onChange={(e) => { if (e.target.value) setReplyText(e.target.value); }}
              value=""
              className="w-full border border-border rounded px-2 py-1.5 text-xs bg-white"
            >
              <option value="">템플릿 선택…</option>
              {(QUICK_REPLIES[selected.category] ?? QUICK_REPLIES.other).map((tpl, i) => (
                <option key={i} value={tpl}>{tpl.slice(0, 60)}{tpl.length > 60 ? '…' : ''}</option>
              ))}
            </select>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답변 내용 (최대 5000자)"
              rows={4}
              maxLength={5000}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-y min-h-[44px]"
            />
            <div className="flex gap-2 items-center">
              <Button type="button" onClick={sendReply}
                className="flex-1 text-sm px-3 py-1.5 bg-primary text-white rounded-lg min-h-[44px]">
                답변 발송 (모의)
              </Button>
              <select
                value={selected.status ?? '신규'}
                onChange={(e) => changeStatus(selected.id, e.target.value as InquiryStatus)}
                className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white min-h-[44px]"
              >
                {(['신규', '처리 중', '완료', '보류'] as const).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {selected.replies && selected.replies.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">이전 답변 {selected.replies.length}건</p>
                {selected.replies.map((r, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
                    <p className="text-muted-foreground mb-1">{r.repliedAt.slice(0, 19).replace('T', ' ')}</p>
                    <p className="text-foreground whitespace-pre-wrap">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 상태 변경 */}
          <div className="space-y-1 pt-3 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground">상태 변경</p>
            <div className="flex flex-wrap gap-2">
              {(['신규', '처리 중', '완료', '보류'] as const).map((s) => {
                const active = (selected.status ?? '신규') === s;
                return (
                  <button key={s} type="button" onClick={() => changeStatus(selected.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg min-h-[44px] ${
                      active ? 'bg-foreground text-background' : 'bg-muted text-foreground lg:hover:bg-muted/70'
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 운영 메모 */}
          <div className="space-y-1 pt-3 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground">운영 메모 (내부)</p>
            <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)}
              placeholder="다른 운영자와 공유하는 메모." rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-xs resize-y" />
            <button type="button" onClick={saveInternalNote}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white text-foreground lg:hover:bg-muted/50 min-h-[44px]">
              메모 저장
            </button>
          </div>
        </div>
      </aside>
    ) : (
      <div className="hidden lg:flex items-center justify-center border border-dashed border-border/60 rounded-lg bg-white text-sm text-muted-foreground p-8">
        왼쪽에서 문의를 선택하세요
      </div>
    )}
  </div>
) : (
  /* 일반 문의 탭 — 기존 grid 블록 그대로 유지 (filtered → generalFiltered로만 교체) */
  <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
    {/* 기존 <table>...</table> 에서 filtered → generalFiltered 로 변수명만 교체 */}
    {/* 기존 상세 패널 aside 그대로 유지 */}
  </div>
)}
```

일반 문의 탭 안의 테이블에서 `filtered` → `generalFiltered`로 변수명만 교체.

- [ ] **Step 3-7: WorkInquiryDetailHeader 컴포넌트 작성 + inquiryStatusBadgeClass 함수 추가**

```tsx
function inquiryStatusBadgeClass(status: string): string {
  if (status === '신규') return 'bg-violet-100 text-violet-700 border border-violet-200';
  if (status === '처리 중') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (status === '완료') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200'; // 보류
}

function WorkInquiryDetailHeader({ inquiry }: { inquiry: StoredInquiry }) {
  const workObj = inquiry.workId ? workStore.getWork(inquiry.workId) : null;
  const pieceImages = workObj
    ? (Array.isArray(workObj.image) ? workObj.image : [workObj.image])
    : [];
  const pieceIndex = inquiry.pieceIndex ?? 0;
  const imgKey = workObj
    ? (pieceImages[pieceIndex] ?? getCoverImage(workObj.image, workObj.coverImageIndex))
    : '';
  const imgSrc = imgKey ? (imageUrls[imgKey] || imgKey) : '';
  const totalPieces = pieceImages.length;
  const categoryLabel = inquiry.categoryDetail
    ? (WORK_INQUIRY_DETAIL_LABELS[inquiry.categoryDetail] ?? '')
    : '';

  return (
    <div className="bg-slate-900 p-4">
      <div className="flex gap-3 mb-3">
        <div className="w-14 h-14 rounded overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center">
          {imgSrc ? (
            <ImageWithFallback src={imgSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">
            {inquiry.workTitle ?? '(전시명 없음)'}
          </p>
          {workObj && (
            <p className="text-slate-400 text-xs mt-0.5">
              {workObj.artist?.name ?? '—'}
              {totalPieces > 1 && ` · 전시 ${totalPieces}장 중 ${pieceIndex + 1}번째`}
            </p>
          )}
          {workObj && (
            <a
              href={`/exhibitions/${inquiry.workId}`}
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 text-xs mt-0.5 inline-flex items-center gap-0.5 lg:hover:text-violet-100"
            >
              전시 바로가기 ↗
            </a>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <span className="bg-violet-900 text-violet-200 rounded px-2 py-0.5 text-[10px] font-semibold">
          🖼 작품 문의
        </span>
        {categoryLabel && (
          <span className="bg-blue-900 text-blue-200 rounded px-2 py-0.5 text-[10px] font-semibold">
            {categoryLabel}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3-8: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 3-9: 브라우저 확인 (localhost:5173/admin/inquiries)**

- 탭 2개 표시 (💬 일반 문의 N | 🖼 작품 문의 N)
- 작품 문의 탭: 썸네일 + 작품명 + 카테고리 뱃지 목록
- 작품 문의 상세: 다크 헤더에 이미지 + 전시명 + piece 정보 표시
- 일반 문의 탭: 기존 UI 동일
- URL `/admin/inquiries?tab=work` 직접 접근 시 작품 문의 탭 활성화
- 개인정보 요청 항목에 SLA 배지 표시 (일반 탭)

- [ ] **Step 3-10: Commit**

```bash
git add src/app/admin/AdminInquiries.tsx
git commit -m "feat: AdminInquiries 탭 분리 - 작품문의/일반문의 + 작품 맥락 상세 헤더"
```

---

## Task 4: PickManagement — imageUrls 룩업 버그 수정

**Files:**
- Modify: `src/app/admin/PickManagement.tsx`

현재: `src={getThumbCover(work)}` 직접 사용 → 시드 데이터 이미지 키('window-light' 등) 깨짐  
목표: `imageUrls[getThumbCover(work)] || getThumbCover(work)` 패턴 적용 (Search.tsx와 동일)

- [ ] **Step 4-1: imageUrls import 추가**

파일 상단에:
```tsx
import { imageUrls } from '../imageUrls';
```

- [ ] **Step 4-2: getThumbCover 4곳 수정**

라인 497, 580, 665, 746 (변수명은 `work` 또는 `w`):

```tsx
// 교체 전:
src={getThumbCover(work)}
// 교체 후:
src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
```

4곳 모두 동일하게 적용. `w` 변수명 줄도 동일:
```tsx
// 교체 전:
src={getThumbCover(w)}
// 교체 후:
src={imageUrls[getThumbCover(w)] || getThumbCover(w)}
```

- [ ] **Step 4-3: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 4-4: 브라우저 확인 (localhost:5173/admin/picks)**

픽 세션 목록 및 작품 추가 검색 패널에서 시드 데이터 작품 이미지 정상 표시 확인.

- [ ] **Step 4-5: Commit**

```bash
git add src/app/admin/PickManagement.tsx
git commit -m "fix: PickManagement 작품 썸네일 imageUrls 룩업 적용"
```

---

## 최종 검증 체크리스트

- [ ] `npx tsc --noEmit` — 에러 없음
- [ ] 검수: 좌측 목록 클릭 → 우측 다크 헤더 + 이미지 갤러리 표시
- [ ] 검수: 이미지 3장 전시 → 썸네일 스트립 3개 클릭 전환 가능
- [ ] 검수: 승인/반려 후 다음 항목 자동 선택
- [ ] 검수: 반려 폼이 오버레이 모달 아닌 인라인 패널 내부에 표시
- [ ] 신고: 목록에 신고 전문 대신 사유 뱃지만 표시
- [ ] 신고: 우측 패널에 작품 이미지 + 신고 원문 + 판정 3버튼
- [ ] 신고: 삭제/기각/비공개유지 기존 다이얼로그 동작 유지
- [ ] 문의: 탭 2개 확인, URL `?tab=work` 동기화
- [ ] 문의: 작품 문의 상세에 다크 헤더 + 이미지 + 전시명 표시
- [ ] Pick: 시드 데이터 작품 썸네일 정상 표시
