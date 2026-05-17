import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
          w.feedReviewStatus === 'approved'
            ? '참여 완료'
            : w.feedReviewStatus === 'rejected'
              ? '취소'
              : '대기 중',
        participatedAt: (w.uploadedAt || '').slice(0, 10),
        workId: w.id,
      }));
  }, [works]);
}

const STATUS_OPTIONS = ['전체', '참여 완료', '대기 중', '취소'];

export default function EventParticipants({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const events = useManagedEvents();

  const contestEvents = useMemo(() => events.filter(e => e.type === 'contest'), [events]);

  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('event') ?? '');
  const [filterStatus, setFilterStatus] = useState('참여 완료');

  useEffect(() => {
    const fromQuery = searchParams.get('event');
    if (fromQuery && fromQuery !== selectedEventId) setSelectedEventId(fromQuery);
  }, [searchParams]);

  // URL에 event 없으면 첫 응모전으로 자동 선택
  useEffect(() => {
    if (!selectedEventId && contestEvents.length > 0) {
      setSelectedEventId(contestEvents[0].id);
    }
  }, [contestEvents, selectedEventId]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
  const selectedWorkIds = useMemo(() => new Set(selectedEvent?.selectedWorkIds ?? []), [selectedEvent]);

  const realParticipants = useParticipantsFromWorks();
  const allParticipants = useMemo(() => [...realParticipants, ...seedParticipants], [realParticipants]);

  // 갤러리는 workId 있는 실제 작품만 표시
  const filtered = useMemo(() => {
    return allParticipants.filter(p => {
      if (p.eventId !== selectedEventId) return false;
      if (!p.workId) return false;
      if (filterStatus !== '전체' && p.status !== filterStatus) return false;
      return true;
    });
  }, [allParticipants, selectedEventId, filterStatus]);

  const totalCount = useMemo(
    () => allParticipants.filter(p => p.eventId === selectedEventId && p.workId).length,
    [allParticipants, selectedEventId],
  );

  // 실제 참가자 workId 집합 — 선정 수는 참가자 내에서만 카운트
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
  const rejectedCount = useMemo(
    () => allParticipants.filter(p => p.eventId === selectedEventId && p.workId && p.status === '취소').length,
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
      type: 'event',
      subtype: 'selected',
      message,
      workId,
      eventId: selectedEventId,
      fromUser: { name: '운영팀', avatar: '', id: 'admin' },
      demo: false,
    });
  };

  const handleToggle = (workId: string) => {
    if (!selectedEvent) return;
    const result = eventsStore.toggleSelected(selectedEventId, workId);
    const w = workStore.getWork(workId);
    const title = w ? displayExhibitionTitle(w, '') : workId;
    if (result.added) {
      sendNotification(workId);
      appendAuditLog({ action: 'contest_selected', targetId: workId, targetSnapshot: { eventId: selectedEventId, eventTitle: selectedEvent.title }, actorId: 'admin', actorRole: 'admin' });
      toast.success(`${title} 선정 + 작가 알림 발송`);
    } else {
      appendAuditLog({ action: 'contest_unselected', targetId: workId, targetSnapshot: { eventId: selectedEventId, eventTitle: selectedEvent.title }, actorId: 'admin', actorRole: 'admin' });
      toast(`${title} 선정 해제`);
    }
  };

  const handleSelectAll = () => {
    const workIds = filtered.map(p => p.workId!);
    const { addedIds } = eventsStore.bulkSelect(selectedEventId, workIds);
    if (addedIds.length > 0) {
      addedIds.forEach(wid => sendNotification(wid));
      appendAuditLog({ action: 'contest_selected', targetId: 'bulk', targetSnapshot: { totalAdded: addedIds.length }, actorId: 'admin', actorRole: 'admin' });
      toast.success(`${addedIds.length}건 선정 + 작가 알림 발송`);
    } else {
      toast('이미 모두 선정된 상태입니다');
    }
  };

  const handleUnselectAll = () => {
    const workIds = filtered.map(p => p.workId!);
    eventsStore.bulkUnselect(selectedEventId, workIds);
    appendAuditLog({ action: 'contest_unselected', targetId: 'bulk', targetSnapshot: { count: workIds.length }, actorId: 'admin', actorRole: 'admin' });
    toast(`${workIds.length}건 선정 해제 (알림 보존)`);
  };

  return (
    <div className="space-y-5">
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
              {selectedFromParticipants > 0 && (
                <span className="ml-2 text-primary font-semibold">· {selectedFromParticipants}건 선정</span>
              )}
            </p>
            {(pendingCount > 0 || rejectedCount > 0) && (
              <p className="text-xs text-muted-foreground/70">
                {pendingCount > 0 && `검수 대기 ${pendingCount}건`}
                {pendingCount > 0 && rejectedCount > 0 && ' · '}
                {rejectedCount > 0 && `반려 ${rejectedCount}건`}
                {pendingCount > 0 && ' (검수 통과 후 선정 가능)'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 상태 필터 칩 + 일괄 액션 */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground lg:hover:border-foreground lg:hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
        {filtered.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/40"
            >
              전체 선정
            </button>
            <button
              type="button"
              onClick={handleUnselectAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50"
            >
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          제출된 작품이 없습니다.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(p => {
            const isSelected = selectedWorkIds.has(p.workId!);
            const work = workStore.getWork(p.workId!);
            const coverKey = work ? getCoverImage(work.image, work.coverImageIndex) : null;
            const coverSrc = coverKey ? (imageUrls[coverKey] || coverKey) : null;
            const exhibitionTitle = work?.exhibitionName || work?.title || p.name;
            const artistName = work?.artist?.name;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleToggle(p.workId!)}
                  className={`group w-full rounded-xl overflow-hidden border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary shadow-md shadow-primary/15'
                      : 'border-border lg:hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {coverSrc ? (
                      <ImageWithFallback
                        src={coverSrc}
                        alt={exhibitionTitle}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        이미지 없음
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors" />
                  </div>
                  <div className="p-2.5 bg-white">
                    <p className="text-sm font-medium text-foreground truncate leading-snug">{exhibitionTitle}</p>
                    {artistName && <p className="text-xs text-muted-foreground mt-0.5 truncate">{artistName}</p>}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{p.participatedAt}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
