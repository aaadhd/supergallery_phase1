import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Eye, X, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import type { Work } from '../data';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { eventsStore, useManagedEvents } from '../utils/eventsStore';
import { workStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { appendAuditLog } from '../utils/adminAuditLog';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { openConfirm } from '../components/ConfirmDialog';
import { todayLocalIso } from '../utils/localDate';

interface EventParticipant {
  id: string;
  eventId: string;
  name: string;
  status: string;
  participatedAt: string;
  workId?: string;
}

const seedParticipants: EventParticipant[] = [
  { id: 'EP-001', eventId: '1', name: '카테', status: '참여 완료', participatedAt: '2026-05-02' },
  { id: 'EP-002', eventId: '1', name: '김영자', status: '참여 완료', participatedAt: '2026-05-03' },
  { id: 'EP-003', eventId: '1', name: '정호아트', status: '대기 중', participatedAt: '2026-05-05' },
  { id: 'EP-004', eventId: '2', name: '은수워터컬러', status: '참여 완료', participatedAt: '2026-05-10' },
  { id: 'EP-005', eventId: '2', name: '내면의풍경', status: '참여 완료', participatedAt: '2026-05-12' },
  { id: 'EP-006', eventId: '2', name: '정림수채화', status: '대기 중', participatedAt: '2026-05-15' },
  { id: 'EP-007', eventId: '1', name: '강미란', status: '참여 완료', participatedAt: '2026-05-04' },
  { id: 'EP-008', eventId: '1', name: '나무결공방', status: '취소', participatedAt: '2026-05-06' },
];

function useParticipantsFromWorks(): EventParticipant[] {
  const works = useSyncExternalStore(
    (cb) => workStore.subscribe(cb),
    () => workStore.getWorks(),
    () => workStore.getWorks(),
  );
  return useMemo(() => {
    return works
      .filter((w) => w.linkedEventId != null)
      .map<EventParticipant>((w) => ({
        id: `work-${w.id}`,
        eventId: String(w.linkedEventId),
        name: w.artist?.name || '-',
        status:
          w.feedReviewStatus === 'approved' ? '참여 완료'
          : w.feedReviewStatus === 'rejected' ? '취소'
          : '대기 중',
        participatedAt: (w.uploadedAt || '').slice(0, 10),
        workId: w.id,
      }));
  }, [works]);
}

type SortKey = 'latest' | 'artist' | 'selected';

export default function EventParticipants({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const events = useManagedEvents();

  const contestEvents = useMemo(() => events.filter(e => e.type === 'contest'), [events]);

  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('event') ?? '');
  const [previewWork, setPreviewWork] = useState<{ work: Work; imgIndex: number } | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('latest');

  useEffect(() => {
    const fromQuery = searchParams.get('event');
    if (fromQuery && fromQuery !== selectedEventId) setSelectedEventId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedEventId && contestEvents.length > 0) setSelectedEventId(contestEvents[0].id);
  }, [contestEvents, selectedEventId]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
  const selectedWorkIds = useMemo(() => new Set(selectedEvent?.selectedWorkIds ?? []), [selectedEvent]);
  const isPublished = !!selectedEvent?.publicationOpen;
  const isNotified = !!selectedEvent?.notifiedAt;

  const realParticipants = useParticipantsFromWorks();
  const allParticipants = useMemo(() => [...realParticipants, ...seedParticipants], [realParticipants]);

  const filtered = useMemo(() => {
    return allParticipants.filter(p =>
      p.eventId === selectedEventId && !!p.workId && p.status === '참여 완료',
    );
  }, [allParticipants, selectedEventId]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === 'selected') {
      list.sort((a, b) => {
        const aS = selectedWorkIds.has(a.workId!);
        const bS = selectedWorkIds.has(b.workId!);
        if (aS && !bS) return -1;
        if (!aS && bS) return 1;
        return 0;
      });
    } else if (sortBy === 'artist') {
      list.sort((a, b) => {
        const aW = workStore.getWork(a.workId!);
        const bW = workStore.getWork(b.workId!);
        return (aW?.artist?.name || a.name).localeCompare(bW?.artist?.name || b.name, 'ko');
      });
    }
    // 'latest': 기본 순서 유지
    return list;
  }, [filtered, sortBy, selectedWorkIds]);

  const totalCount = useMemo(
    () => allParticipants.filter(p => p.eventId === selectedEventId && p.workId).length,
    [allParticipants, selectedEventId],
  );

  const participantWorkIds = useMemo(
    () => new Set(allParticipants.filter(p => p.eventId === selectedEventId && p.workId).map(p => p.workId!)),
    [allParticipants, selectedEventId],
  );
  const selectedFromParticipants = useMemo(
    () => [...selectedWorkIds].filter(id => participantWorkIds.has(id)).length,
    [selectedWorkIds, participantWorkIds],
  );

  const pendingCount = useMemo(
    () => allParticipants.filter(p => p.eventId === selectedEventId && p.workId && p.status === '대기 중').length,
    [allParticipants, selectedEventId],
  );


  const sendNotification = (workId: string) => {
    const ev = events.find(e => e.id === selectedEventId);
    const w = workStore.getWork(workId);
    if (!ev || !w) return;
    const message = t('notif.contestSelected')
      .replace('{title}', displayExhibitionTitle(w, t('work.untitled')))
      .replace('{event}', ev.title);
    pushDemoNotification({
      type: 'event', subtype: 'selected', message, workId, eventId: selectedEventId,
      fromUser: { name: '운영팀', avatar: '', id: 'admin' }, demo: false,
    });
  };

  // 선정 토글 — 알림 발송 없음 (발표하기 시 일괄 발송)
  const handleToggle = (workId: string) => {
    if (!selectedEvent || isPublished) return;
    const result = eventsStore.toggleSelected(selectedEventId, workId);
    const w = workStore.getWork(workId);
    const title = w ? displayExhibitionTitle(w, '') : workId;
    if (result.added) {
      appendAuditLog({ action: 'contest_selected', targetId: workId, targetSnapshot: { eventId: selectedEventId, eventTitle: selectedEvent.title }, actorId: 'admin', actorRole: 'admin' });
      toast.success(`${title} 선정`);
    } else {
      appendAuditLog({ action: 'contest_unselected', targetId: workId, targetSnapshot: { eventId: selectedEventId, eventTitle: selectedEvent.title }, actorId: 'admin', actorRole: 'admin' });
      toast(`${title} 선정 해제`);
    }
  };

  // 선정 완료 — 선정 잠금만, 알림 미발송
  const handleConfirm = async () => {
    if (!selectedEvent) return;
    if (selectedFromParticipants === 0) {
      toast.error('선정된 작품이 없습니다.');
      return;
    }
    const ok = await openConfirm({
      title: `당선작 ${selectedFromParticipants}건을 확정하시겠습니까?`,
      description: '확정 후 선정을 변경할 수 없습니다. 알림은 별도 "알림 보내기" 버튼으로 발송합니다.',
      confirmLabel: '선정 완료',
    });
    if (!ok) return;
    eventsStore.update(selectedEventId, { publicationOpen: true, publishedAt: todayLocalIso() });
    appendAuditLog({ action: 'event_saved', targetId: selectedEventId, targetSnapshot: { confirmed: true, count: selectedFromParticipants }, actorId: 'admin', actorRole: 'admin' });
    toast.success(`당선작 ${selectedFromParticipants}건 확정 완료`);
  };

  // 알림 보내기 — 선정 완료 후 수동 발송
  const handleNotify = async () => {
    if (!selectedEvent || !isPublished || isNotified) return;
    const selectedIds = [...selectedWorkIds].filter(id => participantWorkIds.has(id));
    const ok = await openConfirm({
      title: `당선자 ${selectedIds.length}명에게 알림을 보내시겠습니까?`,
      description: '한 번 발송하면 취소할 수 없습니다.',
      confirmLabel: '알림 보내기',
    });
    if (!ok) return;
    for (const wid of selectedIds) sendNotification(wid);
    eventsStore.update(selectedEventId, { notifiedAt: todayLocalIso() });
    appendAuditLog({ action: 'event_saved', targetId: selectedEventId, targetSnapshot: { notified: true, count: selectedIds.length }, actorId: 'admin', actorRole: 'admin' });
    toast.success(`당선자 ${selectedIds.length}명에게 알림 발송 완료`);
  };

  const handleSelectAll = () => {
    if (isPublished) return;
    const workIds = sorted.map(p => p.workId!);
    const { addedIds } = eventsStore.bulkSelect(selectedEventId, workIds);
    if (addedIds.length > 0) {
      appendAuditLog({ action: 'contest_selected', targetId: 'bulk', targetSnapshot: { totalAdded: addedIds.length }, actorId: 'admin', actorRole: 'admin' });
      toast.success(`${addedIds.length}건 선정`);
    } else {
      toast('이미 모두 선정된 상태입니다');
    }
  };

  const handleUnselectAll = () => {
    if (isPublished) return;
    const workIds = sorted.map(p => p.workId!);
    eventsStore.bulkUnselect(selectedEventId, workIds);
    appendAuditLog({ action: 'contest_unselected', targetId: 'bulk', targetSnapshot: { count: workIds.length }, actorId: 'admin', actorRole: 'admin' });
    toast(`${workIds.length}건 선정 해제`);
  };

  return (
    <>
    <div className="space-y-4 pb-20">
      {!compact && (
        <div>
          <h1 className="text-2xl font-bold text-foreground">응모자 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">응모전별 제출 작품 확인 및 선정</p>
        </div>
      )}

      {/* 응모전 선택 + 통계 */}
      <div className="flex flex-wrap items-center gap-3">
        {contestEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">운영 중인 응모전이 없습니다.</p>
        ) : (
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="응모전 선택" />
            </SelectTrigger>
            <SelectContent>
              {contestEvents.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedEventId && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              총 {totalCount}건 응모
              <span className="ml-2 font-semibold text-primary">
                · {selectedFromParticipants}건 선정
              </span>
            </p>
            {isNotified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3 h-3" />
                알림 발송 완료 {selectedEvent?.notifiedAt ? `· ${selectedEvent.notifiedAt.slice(5)}` : ''}
              </span>
            )}
            {isPublished && !isNotified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                선정 완료 · 알림 대기
              </span>
            )}
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground/70">검수 대기 {pendingCount}건 (검수 통과 후 표시)</p>
            )}
          </div>
        )}
      </div>

      {/* 정렬 + 일괄 액션 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-white text-foreground"
        >
          <option value="latest">최신 응모순</option>
          <option value="artist">작가명순</option>
          <option value="selected">선정된 작품 먼저</option>
        </select>
        {!isPublished && sorted.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={handleSelectAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/40">
              전체 선정
            </button>
            <button type="button" onClick={handleUnselectAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50">
              전체 해제
            </button>
          </div>
        )}
      </div>

      {/* 갤러리 그리드 */}
      {!selectedEventId || contestEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          응모전을 선택해 주세요.
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          제출된 작품이 없습니다.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map(p => {
            const isSelected = selectedWorkIds.has(p.workId!);
            const work = workStore.getWork(p.workId!);
            const coverKey = work ? getCoverImage(work.image, work.coverImageIndex) : null;
            const coverSrc = coverKey ? (imageUrls[coverKey] || coverKey) : null;
            const exhibitionTitle = work?.exhibitionName || work?.title || p.name;
            const artistName = work?.artist?.name;
            const allImgs = work
              ? (Array.isArray(work.image) ? work.image : [work.image]).map((k: string) => imageUrls[k] || k)
              : [];
            return (
              <li key={p.id}>
                <div className={`group w-full rounded-xl overflow-hidden border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary shadow-md shadow-primary/15'
                    : isPublished
                      ? 'border-border opacity-50'
                      : 'border-border lg:hover:border-primary/50'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleToggle(p.workId!)}
                    disabled={isPublished}
                    className="w-full text-left disabled:cursor-default"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {coverSrc ? (
                        <ImageWithFallback
                          src={coverSrc}
                          alt={exhibitionTitle}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">이미지 없음</div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      {allImgs.length > 1 && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {allImgs.length}장
                        </div>
                      )}
                      {!isPublished && <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors" />}
                    </div>
                  </button>
                  <div className="p-2.5 bg-white flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-snug">{exhibitionTitle}</p>
                      {artistName && <p className="text-xs text-muted-foreground mt-0.5 truncate">{artistName}</p>}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{p.participatedAt}</p>
                    </div>
                    {work && (
                      <button
                        type="button"
                        onClick={() => setPreviewWork({ work, imgIndex: 0 })}
                        className="shrink-0 p-1 rounded text-muted-foreground lg:hover:text-foreground lg:hover:bg-muted/50 mt-0.5"
                        title="작품 전체 보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    {/* 하단 고정 바 */}
    {selectedEventId && selectedEvent && (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 text-sm">
          {isNotified ? (
            <span className="text-emerald-300 font-medium">
              ✓ 알림 발송 완료 {selectedEvent.notifiedAt ? `(${selectedEvent.notifiedAt})` : ''} — {selectedFromParticipants}건
            </span>
          ) : isPublished ? (
            <span className="text-amber-300 font-medium">
              선정 완료 {selectedFromParticipants}건 — 알림 미발송
            </span>
          ) : (
            <span className="text-slate-300">
              {selectedFromParticipants}건 선정
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* 1단계: 선정 완료 */}
          {!isPublished && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedFromParticipants === 0}
              className="inline-flex items-center gap-1.5 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              선정 완료
            </button>
          )}
          {/* 2단계: 알림 보내기 (선정 완료 후 활성) */}
          {isPublished && (
            <button
              type="button"
              onClick={handleNotify}
              disabled={isNotified}
              className="inline-flex items-center gap-1.5 bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-semibold lg:hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Megaphone className="w-4 h-4" />
              {isNotified ? '알림 발송 완료' : '알림 보내기'}
            </button>
          )}
        </div>
      </div>
    )}

    {/* 작품 전체 보기 모달 */}
    {previewWork && createPortal(
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setPreviewWork(null)}
      >
        <div
          className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative aspect-square bg-black">
            <ImageWithFallback
              src={(Array.isArray(previewWork.work.image) ? previewWork.work.image : [previewWork.work.image])
                .map((k: string) => imageUrls[k] || k)[previewWork.imgIndex]}
              alt=""
              className="w-full h-full object-contain"
            />
            {(() => {
              const imgs = (Array.isArray(previewWork.work.image) ? previewWork.work.image : [previewWork.work.image])
                .map((k: string) => imageUrls[k] || k);
              return imgs.length > 1 && (
                <>
                  <button type="button"
                    onClick={() => setPreviewWork((p) => p ? { ...p, imgIndex: Math.max(0, p.imgIndex - 1) } : p)}
                    disabled={previewWork.imgIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/70"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button type="button"
                    onClick={() => setPreviewWork((p) => p ? { ...p, imgIndex: Math.min(imgs.length - 1, p.imgIndex + 1) } : p)}
                    disabled={previewWork.imgIndex === imgs.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/70"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imgs.map((_, i) => (
                      <button key={i} type="button"
                        onClick={() => setPreviewWork((p) => p ? { ...p, imgIndex: i } : p)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === previewWork.imgIndex ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
          <div className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{displayExhibitionTitle(previewWork.work, '(제목 없음)')}</p>
              {previewWork.work.artist?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">{previewWork.work.artist.name}</p>
              )}
            </div>
            <button type="button" onClick={() => setPreviewWork(null)}
              className="shrink-0 p-1 rounded-lg text-muted-foreground lg:hover:bg-muted/50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
