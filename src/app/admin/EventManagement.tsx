import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Pencil, Users, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

type EventStatus = '진행중' | '예정' | '종료';

type EventRow = {
  id: string;
  name: string;
  period: string;
  participants: number;
  status: EventStatus;
};

const initialEvents: EventRow[] = [
  { id: 'e1', name: '봄맞이 드로잉 챌린지', period: '2026-03-01 ~ 2026-04-30', participants: 1284, status: '진행중' },
  { id: 'e2', name: '컬러 팔레트 투표', period: '2026-04-10 ~ 2026-04-20', participants: 0, status: '예정' },
  { id: 'e3', name: '연말 갤러리 어워드', period: '2025-12-01 ~ 2025-12-31', participants: 3402, status: '종료' },
  { id: 'e4', name: '주간 스케치', period: '2026-02-01 ~ 2026-02-28', participants: 892, status: '종료' },
];

function statusBadge(s: EventStatus) {
  if (s === '진행중') return 'bg-primary/10 text-primary border border-border';
  if (s === '예정') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function EventManagement() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>(initialEvents);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const sorted = useMemo(() => {
    const order: Record<EventStatus, number> = { 진행중: 0, 예정: 1, 종료: 2 };
    return [...events].sort((a, b) => order[a.status] - order[b.status]);
  }, [events]);

  const edit = (id: string) => {
    toast.message(`이벤트 편집: ${id} (목업)`);
  };

  const viewParticipants = (row: EventRow) => {
    toast.success(`참여자 보기 — ${row.name} (${row.participants}명) 목업`);
  };

  const addEvent = () => {
    const id = `e${Date.now()}`;
    setEvents((prev) => [
      ...prev,
      {
        id,
        name: `신규 이벤트 ${prev.length + 1}`,
        period: '2026-04-01 ~ 2026-04-30',
        participants: 0,
        status: '예정',
      },
    ]);
    toast.success('새 이벤트가 추가되었습니다. (목업)');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">이벤트 관리</h1>
        <div className="rounded-lg border border-[#E4E4E7] py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">이벤트 관리</h1>
        <Button
          type="button"
          onClick={addEvent}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          이벤트 추가
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          등록된 이벤트가 없습니다.
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F4F5] text-left text-gray-700">
                <th className="px-4 py-3 font-medium">이벤트명</th>
                <th className="px-4 py-3 font-medium">기간</th>
                <th className="px-4 py-3 font-medium">참여자수</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ev) => (
                <tr key={ev.id} className="border-b border-[#F0F0F0] lg:hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{ev.period}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{ev.participants.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(ev.status)}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Button
                      type="button"
                      onClick={() => edit(ev.id)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 lg:hover:bg-gray-50"
                    >
                      <Pencil className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      편집
                    </Button>
                    <Button
                      type="button"
                      onClick={() => viewParticipants(ev)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90"
                    >
                      <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      참여자
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
