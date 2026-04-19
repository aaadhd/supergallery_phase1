import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserX, UserCheck, X, ShieldAlert, Flag, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { artists } from '../data';
import { accountSuspensionStore, authStore } from '../store';
import {
  suspendDemoUser,
  type SuspensionLevel,
  SUSPENSION_LEVEL_DAYS,
  getWarningCount,
  getFalseReportCount,
} from '../utils/sanctionStore';
import { loadUserReports, type StoredUserReport } from '../utils/reportsStore';

type MemberStatus = '활성' | '정지';

type MemberRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: MemberStatus;
  avatar: string;
};

// 데모 사용자(artists[0])는 항상 목록 첫 줄에 표시 — 여기서 정지하면 실제 로그아웃 + 다음 로그인 차단
const DEMO_USER_ID = artists[0].id;
const demoUserMember: MemberRow = {
  id: DEMO_USER_ID,
  name: `${artists[0].name} (데모 사용자)`,
  email: 'artist@artier.kr',
  joinedAt: '2025-09-01',
  status: '활성',
  avatar: artists[0].name[0] ?? 'D',
};

const initialMembers: MemberRow[] = [
  demoUserMember,
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

const MEMBERS_KEY = 'artier_admin_members_v1';

function loadMembers(): MemberRow[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MemberRow[];
      // 데모 사용자가 누락됐다면 글로벌 suspension 상태에 맞춰 보강
      if (!parsed.some((m) => m.id === DEMO_USER_ID)) {
        const isSuspended = accountSuspensionStore.get().active;
        return [{ ...demoUserMember, status: isSuspended ? '정지' : '활성' }, ...parsed];
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return initialMembers;
}

function saveMembers(items: MemberRow[]) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(items));
}

const SUSPENSION_LABELS: Record<SuspensionLevel, string> = {
  warning: '주의 (정지 없음)',
  days7: '7일 정지',
  days30: '30일 정지',
  permanent: '영구 정지',
};

export default function MemberManagement() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberRow[]>(loadMembers);
  const [q, setQ] = useState('');
  const [pendingSuspendId, setPendingSuspendId] = useState<string | null>(null);
  const [pickedLevel, setPickedLevel] = useState<SuspensionLevel>('days7');
  /** 회원 상세 모달. 행의 이름 탭 시 열리고, 제재 카운터·최근 신고·정지 상태를 한 화면에서 확인. */
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members;
    return members.filter((m) => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
  }, [members, q]);

  const openSuspendModal = (id: string) => {
    setPickedLevel('days7');
    setPendingSuspendId(id);
  };

  const confirmSuspend = () => {
    if (!pendingSuspendId) return;
    const id = pendingSuspendId;
    const days = SUSPENSION_LEVEL_DAYS[pickedLevel];
    const isWarningOnly = pickedLevel === 'warning';
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: (isWarningOnly ? '활성' : '정지') as MemberRow['status'] } : m,
      ),
    );
    if (id === DEMO_USER_ID) {
      if (isWarningOnly) {
        toast.warning('주의가 적용되었습니다. (정지는 발생하지 않음 — 누적 시 정지로 승격될 수 있음)');
      } else {
        suspendDemoUser(days, `운영팀에 의해 ${SUSPENSION_LABELS[pickedLevel]} 처리되었습니다.`);
        toast.error(`데모 사용자가 ${SUSPENSION_LABELS[pickedLevel]}되어 자동 로그아웃됐습니다.`);
      }
    } else {
      toast.error(`계정이 ${SUSPENSION_LABELS[pickedLevel]} 처리되었습니다. (목업 회원)`);
    }
    setPendingSuspendId(null);
  };

  const unsuspend = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: '활성' as const } : m)));
    if (id === DEMO_USER_ID) {
      accountSuspensionStore.clear();
      toast.success('데모 사용자 정지가 해제됐습니다. 다시 로그인할 수 있어요.');
    } else {
      toast.success('정지가 해제되었습니다.');
    }
  };

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
      <h1 className="text-xl font-bold mb-6 text-foreground">회원 관리</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="이름 또는 이메일 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px] max-w-md"
        />
      </div>

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
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
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
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Button
                      type="button"
                      disabled={m.status === '정지'}
                      onClick={() => openSuspendModal(m.id)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <UserX className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      정지
                    </Button>
                    <Button
                      type="button"
                      disabled={m.status === '활성'}
                      onClick={() => unsuspend(m.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <UserCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      해제
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 회원 상세 모달 */}
      {detailId && (() => {
        const member = members.find((m) => m.id === detailId);
        if (!member) return null;
        const warningCount = getWarningCount(member.id);
        const falseReportCount = getFalseReportCount(member.id);
        const nearAutoSuspend = warningCount === 2;
        const nearAutoBlock = falseReportCount === 2;
        const reportsAgainst: StoredUserReport[] = loadUserReports()
          .filter((r) => r.targetArtistId === member.id)
          .slice(0, 5);
        const isSuspended = member.status === '정지';
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-detail-title"
            onClick={() => setDetailId(null)}
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
                  onClick={() => setDetailId(null)}
                  className="rounded-md p-1 text-muted-foreground lg:hover:bg-muted/50"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* 상태·제재 지표 */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">제재 지표</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-lg border p-3 ${isSuspended ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
                      <p className="text-[11px] text-muted-foreground">상태</p>
                      <p className={`text-sm font-semibold ${isSuspended ? 'text-red-800' : 'text-emerald-800'}`}>{member.status}</p>
                    </div>
                    <div className={`rounded-lg border p-3 ${nearAutoSuspend ? 'border-red-200 bg-red-50' : 'border-border bg-muted/30'}`}>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> 경고
                      </p>
                      <p className={`text-sm font-semibold ${nearAutoSuspend ? 'text-red-800' : 'text-foreground'}`}>{warningCount}/3</p>
                      {nearAutoSuspend && (
                        <p className="text-[10px] text-red-700 mt-0.5 leading-tight">다음 경고 시 자동 7일 정지</p>
                      )}
                    </div>
                    <div className={`rounded-lg border p-3 ${nearAutoBlock ? 'border-red-200 bg-red-50' : 'border-border bg-muted/30'}`}>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Flag className="h-3 w-3" /> 허위 신고
                      </p>
                      <p className={`text-sm font-semibold ${nearAutoBlock ? 'text-red-800' : 'text-foreground'}`}>{falseReportCount}/3</p>
                      {nearAutoBlock && (
                        <p className="text-[10px] text-red-700 mt-0.5 leading-tight">다음 기각 시 자동 7일 차단</p>
                      )}
                    </div>
                  </div>
                  {member.id === DEMO_USER_ID && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      데모 사용자 — 정지 적용 시 전역 로그인 차단이 실제로 발동됩니다.
                    </p>
                  )}
                </section>

                {/* 최근 이 회원 대상 신고 */}
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
                {isSuspended ? (
                  <Button
                    type="button"
                    onClick={() => {
                      unsuspend(member.id);
                      setDetailId(null);
                    }}
                    className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white lg:hover:bg-primary/90"
                  >
                    <UserCheck className="w-4 h-4 inline mr-1 -mt-0.5" /> 해제
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setDetailId(null);
                      openSuspendModal(member.id);
                    }}
                    className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50"
                  >
                    <UserX className="w-4 h-4 inline mr-1 -mt-0.5" /> 정지
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setDetailId(null)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-border lg:hover:bg-muted/50"
                >
                  닫기
                </Button>
              </footer>
            </div>
          </div>
        );
      })()}

      {/* 정지 단계 선택 모달 */}
      {pendingSuspendId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <header className="border-b border-border px-5 py-4">
              <h2 id="suspend-title" className="text-base font-semibold text-foreground">정지 단계 선택</h2>
              <p className="text-xs text-muted-foreground mt-1">
                대상 회원에게 적용할 제재 수준을 선택하세요. 데모 사용자(카테)에 한해 글로벌 로그인 차단으로 즉시 반영됩니다.
              </p>
            </header>
            <div className="space-y-2 px-5 py-5">
              {(['warning', 'days7', 'days30', 'permanent'] as SuspensionLevel[]).map((lv) => (
                <label
                  key={lv}
                  className={`flex min-h-[44px] items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                    pickedLevel === lv ? 'border-primary bg-muted/50' : 'border-border lg:hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="suspend-level"
                    value={lv}
                    checked={pickedLevel === lv}
                    onChange={() => setPickedLevel(lv)}
                    className="h-5 w-5 shrink-0 text-primary accent-primary"
                  />
                  <span className="text-foreground">{SUSPENSION_LABELS[lv]}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button
                type="button"
                onClick={() => setPendingSuspendId(null)}
                className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-border lg:hover:bg-muted/50"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmSuspend}
                className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg"
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
