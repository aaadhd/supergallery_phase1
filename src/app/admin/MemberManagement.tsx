import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserX, UserCheck } from 'lucide-react';

type MemberStatus = '활성' | '정지';

type MemberRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: MemberStatus;
  avatar: string;
};

const initialMembers: MemberRow[] = [
  { id: 'm1', name: '김민서', email: 'minseo.k@example.com', joinedAt: '2025-11-02', status: '활성', avatar: 'MS' },
  { id: 'm2', name: '이하준', email: 'hajun.lee@example.com', joinedAt: '2025-12-18', status: '활성', avatar: 'LJ' },
  { id: 'm3', name: '박지우', email: 'spam_account@test.com', joinedAt: '2026-01-05', status: '정지', avatar: 'PJ' },
  { id: 'm4', name: '최유나', email: 'yuna.c@example.com', joinedAt: '2026-02-14', status: '활성', avatar: 'CY' },
  { id: 'm5', name: '정다은', email: 'daeun.j@example.com', joinedAt: '2026-02-20', status: '활성', avatar: 'JD' },
  { id: 'm6', name: '한소희', email: 'sohee.h@example.com', joinedAt: '2026-03-01', status: '활성', avatar: 'HS' },
  { id: 'm7', name: '오준영', email: 'banned_user@example.com', joinedAt: '2025-09-30', status: '정지', avatar: 'OY' },
  { id: 'm8', name: '윤서아', email: 'seoa.y@example.com', joinedAt: '2026-03-15', status: '활성', avatar: 'YS' },
];

function statusBadge(s: MemberStatus) {
  if (s === '활성') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

export default function MemberManagement() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members;
    return members.filter((m) => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
  }, [members, q]);

  const suspend = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: '정지' as const } : m)));
    toast.error('계정이 정지되었습니다.');
  };

  const unsuspend = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: '활성' as const } : m)));
    toast.success('정지가 해제되었습니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">회원 관리</h1>
        <div className="rounded-lg border border-[#E4E4E7] py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-6 text-gray-900">회원 관리</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="이름 또는 이메일 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px] max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[#F4F4F5] text-left text-gray-700">
                <th className="px-4 py-3 font-medium w-24">프로필</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-[#6366F1]/15 text-[#4338CA] text-xs font-bold flex items-center justify-center border border-indigo-100">
                      {m.avatar}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600 break-all">{m.email}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.joinedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={m.status === '정지'}
                      onClick={() => suspend(m.id)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <UserX className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      정지
                    </button>
                    <button
                      type="button"
                      disabled={m.status === '활성'}
                      onClick={() => unsuspend(m.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <UserCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      해제
                    </button>
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
