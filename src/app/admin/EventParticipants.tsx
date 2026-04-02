import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { STATUS_COLORS } from './constants';

interface EventParticipant {
  id: string;
  eventId: number;
  name: string;
  email: string;
  status: string;
  participatedAt: string;
}

const events = [
  { id: 1, title: '나의 첫 디지털 캔버스', period: '2026.05.01 - 2026.05.31' },
  { id: 2, title: '동호회 작품전 참여하기', period: '2026.05.01 - 2026.06.30' },
];

const seedParticipants: EventParticipant[] = [
  { id: 'EP-001', eventId: 1, name: '조가영', email: 'cho.gayoung@email.com', status: '참여 완료', participatedAt: '2026-05-02' },
  { id: 'EP-002', eventId: 1, name: '김영자', email: 'kim.youngja@email.com', status: '참여 완료', participatedAt: '2026-05-03' },
  { id: 'EP-003', eventId: 1, name: '박정호', email: 'park.jh@email.com', status: '대기 중', participatedAt: '2026-05-05' },
  { id: 'EP-004', eventId: 2, name: '정은수', email: 'jung.es@email.com', status: '참여 완료', participatedAt: '2026-05-10' },
  { id: 'EP-005', eventId: 2, name: '서경희', email: 'seo.kh@email.com', status: '참여 완료', participatedAt: '2026-05-12' },
  { id: 'EP-006', eventId: 2, name: '오정림', email: 'oh.jl@email.com', status: '대기 중', participatedAt: '2026-05-15' },
  { id: 'EP-007', eventId: 1, name: '강미란', email: 'kang.mr@email.com', status: '참여 완료', participatedAt: '2026-05-04' },
  { id: 'EP-008', eventId: 1, name: '윤태식', email: 'yoon.ts@email.com', status: '취소', participatedAt: '2026-05-06' },
];

const participantStatuses = ['참여 완료', '대기 중', '취소'];

export default function EventParticipants() {
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = seedParticipants.filter(p => {
    if (filterEvent !== 'all' && String(p.eventId) !== filterEvent) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    '참여 완료': 'bg-green-100 text-green-800',
    '대기 중': 'bg-yellow-100 text-yellow-800',
    '취소': 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">이벤트 참여자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">런칭 이벤트 참여 현황 및 참여자 목록</p>
      </div>

      {/* Event summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => {
          const participants = seedParticipants.filter(p => p.eventId === event.id);
          const completed = participants.filter(p => p.status === '참여 완료').length;
          return (
            <div key={event.id} className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-gray-900">{event.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{event.period}</p>
              <div className="flex gap-3 mt-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">전체 {participants.length}명</Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">완료 {completed}명</Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="이벤트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 이벤트</SelectItem>
            {events.map(e => (
              <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
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

        <span className="self-center text-sm text-gray-500">{filtered.length}명 표시</span>
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
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  조건에 맞는 참여자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{p.email}</TableCell>
                  <TableCell className="text-sm">{events.find(e => e.id === p.eventId)?.title}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.status] || ''} variant="outline">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{p.participatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
