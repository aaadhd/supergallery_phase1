import { useState, useMemo } from 'react';
import { Badge } from '../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useManagedEvents, type ManagedEvent } from '../utils/eventStore';
import { workStore } from '../store';
import { useSyncExternalStore } from 'react';

interface EventParticipant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  status: string;
  participatedAt: string;
}

/**
 * 참여자 시드 — Phase 2에서 실 DB 연결 예정.
 * eventId는 eventStore의 ManagedEvent.id(string)와 일치.
 */
const seedParticipants: EventParticipant[] = [
  { id: 'EP-001', eventId: '1', name: '카테', email: 'cho.gayoung@email.com', status: '참여 완료', participatedAt: '2026-05-02' },
  { id: 'EP-002', eventId: '1', name: '김영자', email: 'kim.youngja@email.com', status: '참여 완료', participatedAt: '2026-05-03' },
  { id: 'EP-003', eventId: '1', name: '정호아트', email: 'park.jh@email.com', status: '대기 중', participatedAt: '2026-05-05' },
  { id: 'EP-004', eventId: '2', name: '은수워터컬러', email: 'jung.es@email.com', status: '참여 완료', participatedAt: '2026-05-10' },
  { id: 'EP-005', eventId: '2', name: '내면의풍경', email: 'seo.kh@email.com', status: '참여 완료', participatedAt: '2026-05-12' },
  { id: 'EP-006', eventId: '2', name: '정림수채화', email: 'oh.jl@email.com', status: '대기 중', participatedAt: '2026-05-15' },
  { id: 'EP-007', eventId: '1', name: '강미란', email: 'kang.mr@email.com', status: '참여 완료', participatedAt: '2026-05-04' },
  { id: 'EP-008', eventId: '1', name: '나무결공방', email: 'yoon.ts@email.com', status: '취소', participatedAt: '2026-05-06' },
];

function formatEventPeriod(ev: ManagedEvent): string {
  return `${ev.startAt.replace(/-/g, '.')} - ${ev.endAt.replace(/-/g, '.')}`;
}

const participantStatuses = ['참여 완료', '대기 중', '취소'];

/**
 * 실제 업로드된 작품 중 `linkedEventId`가 있는 것을 참여자로 변환.
 * EventDetail "참여" 버튼 → /upload?event=... → 작품 저장 경로로 들어온 실 데이터.
 * 시드 데이터와 합쳐서 어드민이 데모+실제 데이터를 한 표에서 조회 가능.
 */
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
        email: '(로그인 계정)',
        status:
          w.feedReviewStatus === 'approved'
            ? '참여 완료'
            : w.feedReviewStatus === 'rejected'
              ? '취소'
              : '대기 중',
        participatedAt: (w.uploadedAt || '').slice(0, 10),
      }));
  }, [works]);
}

export default function EventParticipants() {
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const events = useManagedEvents();

  const realParticipants = useParticipantsFromWorks();
  // 시드 + 실 업로드 병합. id 충돌 없음 (시드: EP-*, 실: work-*)
  const allParticipants = useMemo(
    () => [...realParticipants, ...seedParticipants],
    [realParticipants],
  );

  // 참여자가 하나라도 있는 이벤트만 관리 대상으로 노출
  const relevantEvents = useMemo(() => {
    const withParticipants = new Set(allParticipants.map((p) => p.eventId));
    return events.filter((e) => withParticipants.has(e.id));
  }, [events, allParticipants]);

  const filtered = allParticipants.filter(p => {
    if (filterEvent !== 'all' && p.eventId !== filterEvent) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    '참여 완료': 'bg-green-100 text-green-800',
    '대기 중': 'bg-yellow-100 text-yellow-800',
    '취소': 'bg-muted/50 text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">이벤트 참여자 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">런칭 이벤트 참여 현황 및 참여자 목록</p>
      </div>

      {/* Event summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantEvents.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg border p-6 text-center text-sm text-muted-foreground">
            참여자가 등록된 이벤트가 없습니다.
          </div>
        ) : (
          relevantEvents.map(event => {
            const participants = allParticipants.filter(p => p.eventId === event.id);
            const completed = participants.filter(p => p.status === '참여 완료').length;
            return (
              <div key={event.id} className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-foreground">{event.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatEventPeriod(event)}</p>
                <div className="flex gap-3 mt-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">전체 {participants.length}명</Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary">완료 {completed}명</Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="이벤트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 이벤트</SelectItem>
            {relevantEvents.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {participantStatuses.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="self-center text-sm text-muted-foreground">{filtered.length}명 표시</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>이벤트</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>참여일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  조건에 맞는 참여자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="text-sm">{events.find(e => e.id === p.eventId)?.title ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.status] || ''} variant="outline">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.participatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
