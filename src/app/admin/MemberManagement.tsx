import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { artists } from '../data';
import { loadUserReports, type StoredUserReport } from '../utils/reportsStore';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagination } from '../hooks/usePagination';
import { PaginationBar } from './components/PaginationBar';

const MEMBERS_PAGE_SIZE = 50;

/**
 * Phase 1 회원 관리 (Policy §12.3).
 * 계정 단위 제재(정지·경고 카운터)는 Phase 2에서 재설계.
 * Phase 1에서는 회원 기본 정보 + 받은 신고 열람만 제공.
 */

type MemberRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  avatar: string;
};

const DEMO_USER_ID = artists[0].id;
const demoUserMember: MemberRow = {
  id: DEMO_USER_ID,
  name: `${artists[0].name} (데모 사용자)`,
  email: 'artist@artier.kr',
  joinedAt: '2025-09-01',
  avatar: artists[0].name[0] ?? 'D',
};

const initialMembers: MemberRow[] = [
  demoUserMember,
  { id: 'm1', name: '김민서', email: 'minseo.k@example.com', joinedAt: '2025-11-02', avatar: 'MS' },
  { id: 'm2', name: '이하준', email: 'hajun.lee@example.com', joinedAt: '2025-12-18', avatar: 'LJ' },
  { id: 'm3', name: '박지우', email: 'spam_account@test.com', joinedAt: '2026-01-05', avatar: 'PJ' },
  { id: 'm4', name: '최유나', email: 'yuna.c@example.com', joinedAt: '2026-02-14', avatar: 'CY' },
  { id: 'm5', name: '정다은', email: 'daeun.j@example.com', joinedAt: '2026-02-20', avatar: 'JD' },
  { id: 'm6', name: '한소희', email: 'sohee.h@example.com', joinedAt: '2026-03-01', avatar: 'HS' },
  { id: 'm7', name: '오준영', email: 'banned_user@example.com', joinedAt: '2025-09-30', avatar: 'OY' },
  { id: 'm8', name: '윤서아', email: 'seoa.y@example.com', joinedAt: '2026-03-15', avatar: 'YS' },
];

const MEMBERS_KEY = 'artier_admin_members_v1';

function loadMembers(): MemberRow[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MemberRow[];
      if (!parsed.some((m) => m.id === DEMO_USER_ID)) {
        return [demoUserMember, ...parsed];
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return initialMembers;
}

function saveMembers(items: MemberRow[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(items));
}

export default function MemberManagement() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberRow[]>(loadMembers);
  const [q, setQ] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    const artistId = searchParams.get('artist');
    if (artistId && members.some((m) => m.id === artistId)) {
      setDetailId(artistId);
    }
  }, [searchParams, members]);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.get('artist')) {
      const next = new URLSearchParams(searchParams);
      next.delete('artist');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const debouncedQ = useDebouncedValue(q, 300);
  const filtered = useMemo(() => {
    const s = debouncedQ.trim().toLowerCase();
    if (!s) return members;
    return members.filter((m) => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
  }, [members, debouncedQ]);

  const { page, setPage, pageCount, pageItems, totalCount } = usePagination(filtered, MEMBERS_PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, setPage]);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">회원 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold text-foreground">회원 관리</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Phase 1은 회원 기본 정보와 받은 신고만 열람합니다. 계정 단위 제재(정지·경고)는 Phase 2에서 제공됩니다.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="이름 또는 이메일 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px] max-w-md"
        />
      </div>

      {filtered.length > 200 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {filtered.length}명이 매칭됐어요. 조건을 좁혀 주세요 — 결과가 많으면 찾기 어렵습니다.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium w-24">프로필</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium text-right">상세</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((m) => (
                <tr key={m.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-border">
                      {m.avatar}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <button
                      type="button"
                      onClick={() => setDetailId(m.id)}
                      className="text-left lg:hover:underline underline-offset-2"
                      aria-label={`${m.name} 상세 보기`}
                    >
                      {m.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground break-all">{m.email}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.joinedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDetailId(m.id)}
                      className="text-sm px-3 py-1.5 rounded-lg"
                    >
                      상세
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <PaginationBar
              page={page}
              pageCount={pageCount}
              totalCount={totalCount}
              pageSize={MEMBERS_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* 회원 상세 모달 — Phase 1: 기본 정보 + 받은 신고 이력만 */}
      {detailId && (() => {
        const member = members.find((m) => m.id === detailId);
        if (!member) return null;
        const reportsAgainst: StoredUserReport[] = loadUserReports()
          .filter((r) => r.targetArtistId === member.id)
          .slice(0, 5);
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-detail-title"
            onClick={closeDetail}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-start justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center border border-border shrink-0">
                    {member.avatar}
                  </div>
                  <div className="min-w-0">
                    <h2 id="member-detail-title" className="text-base font-semibold text-foreground truncate">{member.name}</h2>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    <p className="text-xs text-muted-foreground">가입일: {member.joinedAt}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-md p-1 text-muted-foreground lg:hover:bg-muted/50"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> 최근 받은 신고 ({reportsAgainst.length})
                  </h3>
                  {reportsAgainst.length === 0 ? (
                    <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3 text-center">
                      이 회원을 대상으로 한 신고가 없습니다.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/60 rounded-lg border border-border">
                      {reportsAgainst.map((r) => (
                        <li key={r.id} className="p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-foreground truncate">
                              {r.targetName}
                            </p>
                            <span className="text-muted-foreground shrink-0">{r.createdAt.slice(0, 10)}</span>
                          </div>
                          {r.reasonLabel && (
                            <p className="text-muted-foreground mt-0.5">사유: {r.reasonLabel}</p>
                          )}
                          {r.adminStatus && r.adminStatus !== 'pending' && (
                            <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              처리: {r.adminStatus}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
                <Button
                  type="button"
                  onClick={closeDetail}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-border lg:hover:bg-muted/50"
                >
                  닫기
                </Button>
              </footer>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
