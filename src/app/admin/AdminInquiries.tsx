import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, ShieldAlert, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/button';

/**
 * ADM-INQ-01 · 문의함 (Policy §30 연동 · PRD_Admin §11.5).
 * - 사용자 USR-INF-07(`/contact`) 제출 문의를 `artier_inquiries` localStorage에서 읽는다.
 * - 카테고리 7종. `privacy`는 개인정보 권리 행사 요청(Policy §30 · 30일 SLA).
 * - SLA 배지: privacy는 25일 임박 / 30일 초과. 그 외는 4일 임박 / 5일 초과(영업일 기준은 런칭 후).
 */

const CATEGORY_LABELS: Record<string, string> = {
  account: '계정 관련',
  upload: '업로드/전시',
  report: '신고/저작권',
  privacy: '개인정보 요청',
  suggestion: '제안/피드백',
  bug: '오류 제보',
  other: '기타',
};

type InquiryStatus = '신규' | '처리 중' | '완료' | '보류';

interface StoredInquiry {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  attachments?: Array<{ name: string; size: number }>;
  createdAt: string;
  // 어드민 측 누적 필드 (사용자 제출 이후 추가)
  status?: InquiryStatus;
  replies?: Array<{ text: string; repliedAt: string; repliedBy?: string }>;
  internalNotes?: string;
  privacy?: {
    subjectVerified?: boolean;
    responseAttachments?: Array<{ name: string; size: number }>;
  };
}

const STORAGE_KEY = 'artier_inquiries';

function loadInquiries(): StoredInquiry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInquiries(list: StoredInquiry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

type SlaTier = 'normal' | 'nearing' | 'exceeded';
function computeSlaTier(inq: StoredInquiry, now: number): SlaTier | null {
  if (inq.status === '완료' || inq.status === '보류') return null;
  const createdMs = new Date(inq.createdAt).getTime();
  if (!Number.isFinite(createdMs)) return null;
  const hours = (now - createdMs) / (60 * 60 * 1000);
  // Policy §30.3: privacy 요청은 5영업일 접수 확인 + 30일 처리.
  // 여기서는 접수 시점 기준 경과 시간으로 간단히 판정 (영업일 계산은 백엔드 연동 후).
  if (inq.category === 'privacy') {
    if (hours >= 30 * 24) return 'exceeded';
    if (hours >= 25 * 24) return 'nearing';
    return 'normal';
  }
  if (hours >= 5 * 24) return 'exceeded';
  if (hours >= 4 * 24) return 'nearing';
  return 'normal';
}

const QUICK_REPLIES: Record<string, string[]> = {
  account: [
    '안녕하세요, Artier 운영팀입니다. 계정 로그인 문제는 로그아웃 후 다시 로그인 링크를 요청해 주세요.',
    '가입하신 이메일로 발송된 링크는 30분간 유효합니다. 만료되었다면 다시 요청해 주세요.',
  ],
  privacy: [
    '안녕하세요, Artier 개인정보보호 책임자입니다. 본인 확인을 위해 가입하신 이메일에서 회신 주시면 감사하겠습니다.',
    '요청하신 개인정보 {type}을 첨부하여 회신드립니다. 처리 완료일: {date}.',
    '개인정보 삭제 요청은 접수일로부터 30일 이내 처리됩니다. 진행 상황은 별도 안내드리겠습니다.',
  ],
  upload: [
    '안녕하세요. 업로드 관련 문의 감사합니다. 파일 형식(JPEG/PNG/WebP/GIF)과 크기(10MB 이하)를 확인해 주세요.',
  ],
  report: [
    '신고 접수 건에 대한 처리 결과를 안내드립니다. 운영 기준에 따라 {action} 처리되었습니다.',
  ],
  suggestion: [
    '소중한 의견 감사합니다. 운영팀에서 검토 후 반영 여부를 안내드리겠습니다.',
  ],
  bug: [
    '오류 제보 감사합니다. 재현 환경을 조사한 후 수정 일정을 안내드리겠습니다.',
  ],
  other: [
    '안녕하세요, Artier 운영팀입니다. 문의 감사합니다.',
  ],
};

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<StoredInquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | InquiryStatus>('전체');
  const [privacyPriority, setPrivacyPriority] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [subjectVerified, setSubjectVerified] = useState(false);
  const [, setClockTick] = useState(0);

  // 최초 로드 + 주기적 리렌더(SLA 계산용)
  useEffect(() => {
    setInquiries(loadInquiries());
    const id = window.setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const selected = useMemo(() => inquiries.find((i) => i.id === selectedId) ?? null, [inquiries, selectedId]);

  // 선택 변경 시 입력 값 리셋
  useEffect(() => {
    setReplyText('');
    setInternalNote(selected?.internalNotes ?? '');
    setSubjectVerified(Boolean(selected?.privacy?.subjectVerified));
  }, [selectedId, selected?.internalNotes, selected?.privacy?.subjectVerified]);

  const kpi = useMemo(() => {
    const now = Date.now();
    let newCount = 0;
    let inProgress = 0;
    let privacyCount = 0;
    let slaBreach = 0;
    inquiries.forEach((i) => {
      const status = i.status ?? '신규';
      if (status === '신규') newCount++;
      if (status === '처리 중') inProgress++;
      if (i.category === 'privacy' && status !== '완료') privacyCount++;
      const tier = computeSlaTier(i, now);
      if (tier === 'nearing' || tier === 'exceeded') slaBreach++;
    });
    return { newCount, inProgress, privacyCount, slaBreach };
  }, [inquiries]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return inquiries
      .filter((i) => {
        if (categoryFilter !== '전체' && i.category !== categoryFilter) return false;
        if (statusFilter !== '전체' && (i.status ?? '신규') !== statusFilter) return false;
        if (privacyPriority && i.category !== 'privacy') return false;
        return true;
      })
      .sort((a, b) => {
        // 1) privacy 신규 우선 2) 접수 시각 오름차순
        const aPriv = a.category === 'privacy' && (a.status ?? '신규') === '신규' ? 0 : 1;
        const bPriv = b.category === 'privacy' && (b.status ?? '신규') === '신규' ? 0 : 1;
        if (aPriv !== bPriv) return aPriv - bPriv;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .map((i) => ({ ...i, _slaTier: computeSlaTier(i, now) }));
  }, [inquiries, categoryFilter, statusFilter, privacyPriority]);

  const updateInquiry = (id: string, patch: Partial<StoredInquiry>) => {
    setInquiries((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
      saveInquiries(next);
      return next;
    });
  };

  const sendReply = () => {
    if (!selected) return;
    const text = replyText.trim();
    if (!text) {
      toast.error('답변 내용을 입력해 주세요.');
      return;
    }
    if (text.length > 5000) {
      toast.error('답변은 5000자 이하로 입력해 주세요.');
      return;
    }
    if (selected.category === 'privacy' && !subjectVerified) {
      const proceed = window.confirm('본인 확인이 완료되지 않았습니다. 진행할까요?');
      if (!proceed) return;
    }
    const nextReplies = [
      ...(selected.replies ?? []),
      { text, repliedAt: new Date().toISOString(), repliedBy: 'operator' },
    ];
    updateInquiry(selected.id, {
      replies: nextReplies,
      status: selected.status === '신규' ? '처리 중' : selected.status,
      privacy: selected.category === 'privacy'
        ? { ...(selected.privacy ?? {}), subjectVerified }
        : selected.privacy,
    });
    toast.success('답변을 저장했습니다. (모의 발송 — 런칭 후 SMTP 연동)');
    setReplyText('');
  };

  const changeStatus = (id: string, next: InquiryStatus) => {
    const prev = inquiries.find((i) => i.id === id)?.status ?? '신규';
    updateInquiry(id, { status: next });
    toast.message(`상태: ${prev} → ${next}`);
  };

  const saveInternalNote = () => {
    if (!selected) return;
    updateInquiry(selected.id, { internalNotes: internalNote });
    toast.message('운영 메모를 저장했습니다.');
  };

  return (
    <div className="min-h-full">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-foreground" />
        <h1 className="text-xl font-bold text-foreground">문의함</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        사용자 `/contact` 제출 문의 (localStorage `artier_inquiries`). 개인정보 권리 행사 요청(Policy §30)은 상단 우선 표시.
      </p>

      {/* KPI 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="신규" value={kpi.newCount} />
        <KpiCard label="처리 중" value={kpi.inProgress} />
        <KpiCard label="개인정보 요청" value={kpi.privacyCount} emphasize={kpi.privacyCount > 0} />
        <KpiCard label="SLA 임박·초과" value={kpi.slaBreach} emphasize={kpi.slaBreach > 0} danger={kpi.slaBreach > 0} />
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">카테고리: 전체</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
        >
          <option value="전체">상태: 전체</option>
          <option value="신규">신규</option>
          <option value="처리 중">처리 중</option>
          <option value="완료">완료</option>
          <option value="보류">보류</option>
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm bg-white cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={privacyPriority}
            onChange={(e) => setPrivacyPriority(e.target.checked)}
            className="accent-primary"
          />
          개인정보 우선
        </label>
      </div>

      {/* 테이블 + 상세 패널 */}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-3 py-2 font-medium">접수</th>
                <th className="px-3 py-2 font-medium">카테고리</th>
                <th className="px-3 py-2 font-medium">이름/이메일</th>
                <th className="px-3 py-2 font-medium">본문</th>
                <th className="px-3 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    접수된 문의가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const isPrivacy = i.category === 'privacy';
                  const status = i.status ?? '신규';
                  const tier = i._slaTier;
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setSelectedId(i.id)}
                      className={`cursor-pointer border-b border-border/40 transition-colors ${
                        selectedId === i.id ? 'bg-primary/5' : 'lg:hover:bg-muted/50'
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {i.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            isPrivacy
                              ? 'bg-violet-100 text-violet-800 border border-violet-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {CATEGORY_LABELS[i.category] ?? i.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[180px]">
                        <div className="truncate text-foreground">{i.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{i.email}</div>
                      </td>
                      <td className="px-3 py-2 max-w-[220px]">
                        <div className="truncate text-muted-foreground">{i.message.slice(0, 60)}{i.message.length > 60 ? '…' : ''}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground border border-border">
                            {status}
                          </span>
                          {tier === 'nearing' && (
                            <span className="inline-flex rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 text-[10px] font-semibold">
                              SLA 임박
                            </span>
                          )}
                          {tier === 'exceeded' && (
                            <span className="inline-flex rounded-full bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[10px] font-semibold">
                              SLA 초과
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 상세 패널 */}
        {selected ? (
          <aside className="border border-border rounded-lg bg-white p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{selected.createdAt.slice(0, 19).replace('T', ' ')}</p>
                <p className="text-sm font-semibold text-foreground">
                  {selected.name} <span className="font-normal text-muted-foreground">{selected.email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-1 rounded lg:hover:bg-muted/60"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">카테고리</p>
              <p className="text-sm text-foreground">{CATEGORY_LABELS[selected.category] ?? selected.category}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">본문</p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            </div>

            {selected.attachments && selected.attachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">첨부 파일</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.attachments.map((f, i) => (
                    <li key={i}>· {f.name} ({Math.round(f.size / 1024)}KB)</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개인정보 카테고리 추가 위젯 */}
            {selected.category === 'privacy' && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-900">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  개인정보 권리 행사 요청 (Policy §30)
                </div>
                <label className="flex items-start gap-2 text-xs text-violet-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectVerified}
                    onChange={(e) => setSubjectVerified(e.target.checked)}
                    className="accent-violet-600 mt-0.5"
                  />
                  본인 확인 완료 (가입 이메일 일치 확인)
                </label>
                <p className="text-[11px] text-violet-700">
                  처리 시한: 접수일로부터 30일 ({selected.createdAt.slice(0, 10)} 기준)
                </p>
              </div>
            )}

            {/* 답변 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">빠른 답변 템플릿</p>
              <select
                onChange={(e) => {
                  if (e.target.value) setReplyText(e.target.value);
                }}
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
                rows={5}
                maxLength={5000}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-y min-h-[44px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={sendReply}
                  className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg min-h-[44px]"
                >
                  답변 발송 (모의)
                </Button>
              </div>
              {selected.replies && selected.replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">이전 답변 {selected.replies.length}건</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
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
                    <Button
                      key={s}
                      type="button"
                      onClick={() => changeStatus(selected.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg min-h-[44px] ${
                        active
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-foreground lg:hover:bg-muted/70'
                      }`}
                    >
                      {s}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 운영 메모 (내부) */}
            <div className="space-y-1 pt-3 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground">운영 메모 (내부)</p>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="다른 운영자와 공유하는 메모. 사용자에게 노출되지 않습니다."
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs resize-y"
              />
              <Button
                type="button"
                onClick={saveInternalNote}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white text-foreground lg:hover:bg-muted/50 min-h-[44px]"
              >
                메모 저장
              </Button>
            </div>
          </aside>
        ) : (
          <div className="hidden lg:flex items-center justify-center border border-dashed border-border/60 rounded-lg bg-white text-sm text-muted-foreground p-8">
            <span className="flex items-center gap-2">
              왼쪽에서 문의를 선택하세요 <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, emphasize, danger }: { label: string; value: number; emphasize?: boolean; danger?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 bg-white ${
        danger
          ? 'border-red-300 bg-red-50'
          : emphasize
          ? 'border-primary/40 bg-primary/5'
          : 'border-border'
      }`}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${danger ? 'text-red-700' : emphasize ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
