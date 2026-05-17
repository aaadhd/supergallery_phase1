import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, ShieldAlert, ChevronRight, X } from 'lucide-react';
import { workStore } from '../store';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { appendAuditLog } from '../utils/adminAuditLog';

/**
 * ADM-INQ-01 · 문의함 (Policy §30 · PRD_Admin §11).
 * - 사용자 USR-INF-07(`/contact`) 제출 문의를 `artier_inquiries` localStorage에서 읽는다.
 * - 카테고리 8종 (사용자 제출 7종 + 작품 문의). `privacy`는 개인정보 권리 행사 요청(Policy §30 · 30일 SLA).
 */

const CATEGORY_LABELS: Record<string, string> = {
  account: '계정 관련',
  upload: '업로드/전시',
  report: '신고/저작권',
  privacy: '개인정보 요청',
  workInquiry: '작품 문의',
  suggestion: '제안/피드백',
  bug: '오류 제보',
  other: '기타',
};

// Policy §33.1 작품 문의 세부 카테고리 라벨
const WORK_INQUIRY_DETAIL_LABELS: Record<string, string> = {
  'workInquiry.catPurchase': '구입·소장',
  'workInquiry.catLicense': '라이선스·사용',
  'workInquiry.catCollab': '전시 협업·의뢰',
  'workInquiry.catInfo': '작품 정보',
  'workInquiry.catOther': '그 외',
};

type InquiryStatus = '신규' | '처리 중' | '완료' | '보류';

interface StoredInquiry {
  id: string;
  email: string;
  category: string;
  message: string;
  attachments?: Array<{ name: string; size: number }>;
  createdAt: string;
  // 작품 문의(Policy §33) 전용 필드
  categoryDetail?: string;
  workId?: string;
  workTitle?: string;
  pieceIndex?: number;
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

const SEED_INQUIRIES: StoredInquiry[] = [
  {
    id: 'inq-seed-1',
    email: 'minseo.k@example.com',
    category: 'upload',
    message: '작품을 업로드했는데 검수 대기 중이라고만 나오고 3일째 처리가 안 되고 있습니다. 정상적으로 접수된 건지 확인 부탁드립니다.',
    createdAt: '2026-05-09T10:30:00',
    status: '신규',
    replies: [],
  },
  {
    id: 'inq-seed-2',
    email: 'hajun.lee@example.com',
    category: 'account',
    message: '닉네임을 변경하고 싶은데 설정에서 수정이 안 됩니다. 혹시 닉네임 변경 횟수 제한이 있나요?',
    createdAt: '2026-05-08T15:20:00',
    status: '처리 중',
    replies: [
      {
        text: '안녕하세요, Proud Gallery 운영팀입니다.\n\n닉네임은 가입 후 프로필 설정에서 자유롭게 변경하실 수 있습니다. 현재 설정 화면에서 닉네임 항목을 탭하시면 편집 모드로 진입됩니다. 문제가 지속되면 스크린샷과 함께 다시 문의 주세요.',
        repliedAt: '2026-05-08T17:45:00',
        repliedBy: '운영팀',
      },
    ],
  },
  {
    id: 'inq-seed-3',
    email: 'daeun.j@example.com',
    category: 'workInquiry',
    categoryDetail: '작품 구입·소장 문의',
    message: '"봄날의 기록" 전시 작품 중 두 번째 작품을 구입하고 싶습니다. 판매 가능한지 작가분께 연락을 취할 수 있을까요?',
    workTitle: '봄날의 기록',
    createdAt: '2026-05-08T09:15:00',
    status: '신규',
    replies: [],
  },
  {
    id: 'inq-seed-4',
    email: 'banned_user@example.com',
    category: 'privacy',
    message: '개인정보보호법 제36조에 따라 본인의 계정 및 관련 데이터 전체 삭제를 요청드립니다. 이메일: banned_user@example.com',
    createdAt: '2026-05-07T13:00:00',
    status: '처리 중',
    privacy: { subjectVerified: true },
    replies: [
      {
        text: '안녕하세요. 개인정보 삭제 요청 접수되었습니다. 30일 이내 처리 완료 후 안내드리겠습니다. 본인 확인을 위해 가입 시 사용한 이메일 주소를 회신 부탁드립니다.',
        repliedAt: '2026-05-07T16:30:00',
        repliedBy: '운영팀',
      },
    ],
  },
  {
    id: 'inq-seed-5',
    email: 'sohee.h@example.com',
    category: 'bug',
    message: '갤러리 둘러보기 화면에서 스크롤을 내리면 특정 작품 카드에서 이미지가 로딩되지 않고 빈 화면으로 표시됩니다. 아이폰 15, 사파리 환경입니다.',
    createdAt: '2026-05-06T20:40:00',
    status: '완료',
    replies: [
      {
        text: '안녕하세요! 말씀해 주신 증상 확인 후 이미지 lazy-load 처리 관련 버그를 수정했습니다. 업데이트 후 증상이 해결되었는지 확인 부탁드립니다. 이용에 불편을 드려 죄송합니다.',
        repliedAt: '2026-05-07T11:00:00',
        repliedBy: '운영팀',
      },
    ],
  },
  {
    id: 'inq-seed-6',
    email: 'seoa.y@example.com',
    category: 'suggestion',
    message: '작품에 좋아요를 누른 사용자 목록을 작가가 볼 수 있으면 좋겠습니다. 어떤 분들이 관심 가지는지 알면 교류가 더 활발해질 것 같아요.',
    createdAt: '2026-05-05T14:55:00',
    status: '보류',
    internalNotes: 'Phase 2 기능 후보로 검토 예정. 개인정보 노출 이슈 사전 검토 필요.',
    replies: [
      {
        text: '소중한 의견 감사합니다. 해당 기능은 현재 기획 검토 단계에 있으며, 서비스 개선 시 반영될 수 있도록 하겠습니다.',
        repliedAt: '2026-05-06T09:30:00',
        repliedBy: '운영팀',
      },
    ],
  },
];

function loadInquiries(): StoredInquiry[] {
  if (typeof localStorage === 'undefined') return SEED_INQUIRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INQUIRIES));
      return SEED_INQUIRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_INQUIRIES;
  } catch {
    return SEED_INQUIRIES;
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
    '안녕하세요, Proud Gallery 운영팀입니다. 계정 로그인 문제는 로그아웃 후 다시 로그인 링크를 요청해 주세요.',
    '가입하신 이메일로 발송된 링크는 30분간 유효합니다. 만료되었다면 다시 요청해 주세요.',
  ],
  privacy: [
    '안녕하세요, Proud Gallery 개인정보보호 책임자입니다. 본인 확인을 위해 가입하신 이메일에서 회신 주시면 감사하겠습니다.',
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
    '안녕하세요, Proud Gallery 운영팀입니다. 문의 감사합니다.',
  ],
};

export default function AdminInquiries() {
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
        if (i.category === 'workInquiry') return false;
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

  const updateInquiry = (id: string, patch: Partial<StoredInquiry>) => {
    setInquiries((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
      saveInquiries(next);
      return next;
    });
  };

  const sendReply = async () => {
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
      const proceed = await openConfirm({
        title: '본인 확인이 완료되지 않았습니다.',
        description: '그대로 답변을 전송할까요? 개인정보 요청은 본인 확인 후 처리하는 것을 권장합니다.',
        confirmLabel: '그대로 전송',
        cancelLabel: '취소',
        destructive: true,
      });
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
    appendAuditLog({ action: 'inquiry_answered', targetId: selected.id, targetSnapshot: { category: selected.category }, actorId: 'admin', actorRole: 'admin' });
    toast.success('답변을 저장했습니다. (모의 발송 — 런칭 후 SMTP 연동)');
    setReplyText('');
  };

  const changeStatus = (id: string, next: InquiryStatus) => {
    const prev = inquiries.find((i) => i.id === id)?.status ?? '신규';
    updateInquiry(id, { status: next });
    appendAuditLog({ action: 'inquiry_status_changed', targetId: id, targetSnapshot: { prev, next }, actorId: 'admin', actorRole: 'admin' });
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
        사용자가 보낸 문의를 처리합니다. 개인정보 권리 행사 요청은 상단에 우선 표시돼요.
      </p>

      {/* KPI 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="신규" value={kpi.newCount} />
        <KpiCard label="처리 중" value={kpi.inProgress} />
        <KpiCard label="개인정보 요청" value={kpi.privacyCount} emphasize={kpi.privacyCount > 0} />
        <KpiCard label="SLA 임박·초과" value={kpi.slaBreach} emphasize={kpi.slaBreach > 0} danger={kpi.slaBreach > 0} />
      </div>

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

      {activeTab === 'work' ? (
        /* ── 작품 문의 탭 ── */
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="border border-border rounded-lg overflow-hidden">
            {workFiltered.length === 0 ? (
              <div className="px-3 py-12 text-center text-sm text-muted-foreground">작품 문의가 없습니다.</div>
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
                  {selected.message
                    ? <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                    : <p className="text-sm text-muted-foreground italic">(내용 없음)</p>
                  }
                </div>
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">빠른 답변 템플릿</p>
                  <select onChange={(e) => { if (e.target.value) setReplyText(e.target.value); }} value=""
                    className="w-full border border-border rounded px-2 py-1.5 text-xs bg-white">
                    <option value="">템플릿 선택…</option>
                    {(QUICK_REPLIES[selected.category] ?? QUICK_REPLIES.other).map((tpl, idx) => (
                      <option key={idx} value={tpl}>{tpl.slice(0, 60)}{tpl.length > 60 ? '…' : ''}</option>
                    ))}
                  </select>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변 내용 (최대 5000자)" rows={4} maxLength={5000}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-y min-h-[44px]" />
                  <div className="flex gap-2 items-center">
                    <Button type="button" onClick={sendReply}
                      className="flex-1 text-sm px-3 py-1.5 bg-primary text-white rounded-lg min-h-[44px]">
                      답변 발송 (모의)
                    </Button>
                    <select value={selected.status ?? '신규'}
                      onChange={(e) => changeStatus(selected.id, e.target.value as InquiryStatus)}
                      className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white min-h-[44px]">
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
        /* ── 일반 문의 탭 ── */
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]">
              <option value="전체">카테고리: 전체</option>
              {Object.entries(CATEGORY_LABELS)
                .filter(([k]) => k !== 'workInquiry')
                .map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]">
              <option value="전체">상태: 전체</option>
              <option value="신규">신규</option>
              <option value="처리 중">처리 중</option>
              <option value="완료">완료</option>
              <option value="보류">보류</option>
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm bg-white cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={privacyPriority} onChange={(e) => setPrivacyPriority(e.target.checked)}
                className="accent-primary" />
              개인정보 우선
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-muted text-left text-foreground">
                    <th className="px-3 py-2 font-medium">접수</th>
                    <th className="px-3 py-2 font-medium">카테고리</th>
                    <th className="px-3 py-2 font-medium">이메일</th>
                    <th className="px-3 py-2 font-medium">본문</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {generalFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                        접수된 문의가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    generalFiltered.map((i) => {
                      const isPrivacy = i.category === 'privacy';
                      const status = i.status ?? '신규';
                      const tier = i._slaTier;
                      return (
                        <tr key={i.id} onClick={() => setSelectedId(i.id)}
                          className={`cursor-pointer border-b border-border/40 transition-colors ${
                            selectedId === i.id ? 'bg-primary/5' : 'lg:hover:bg-muted/50'
                          }`}>
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{i.createdAt.slice(0, 10)}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPrivacy ? 'bg-violet-100 text-violet-800 border border-violet-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isPrivacy && '🔐 '}{CATEGORY_LABELS[i.category] ?? i.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[180px]">
                            <div className="truncate text-muted-foreground">{i.email}</div>
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
                                <span className="inline-flex rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 text-[10px] font-semibold">SLA 임박</span>
                              )}
                              {tier === 'exceeded' && (
                                <span className="inline-flex rounded-full bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[10px] font-semibold">SLA 초과</span>
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

            {/* 일반 문의 상세 패널 */}
            {selected && selected.category !== 'workInquiry' ? (
              <aside className="border border-border rounded-lg bg-white p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{selected.createdAt.slice(0, 19).replace('T', ' ')}</p>
                    <p className="text-sm font-semibold text-foreground">{selected.email}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedId(null)}
                    className="p-1 rounded lg:hover:bg-muted/60" aria-label="닫기">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">카테고리</p>
                  <p className="text-sm text-foreground">{CATEGORY_LABELS[selected.category] ?? selected.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">본문</p>
                  {selected.message
                    ? <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                    : <p className="text-sm text-muted-foreground italic">(내용 없음)</p>
                  }
                </div>
                {selected.attachments && selected.attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">첨부 파일</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {selected.attachments.map((f, idx) => (
                        <li key={idx}>· {f.name} ({Math.round(f.size / 1024)}KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.category === 'privacy' && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-900">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      개인정보 권리 행사 요청 (Policy §30)
                    </div>
                    <label className="flex items-start gap-2 text-xs text-violet-900 cursor-pointer">
                      <input type="checkbox" checked={subjectVerified} onChange={(e) => setSubjectVerified(e.target.checked)}
                        className="accent-violet-600 mt-0.5" />
                      본인 확인 완료 (가입 이메일 일치 확인)
                    </label>
                    <p className="text-[11px] text-violet-700">
                      처리 시한: 접수일로부터 30일 ({selected.createdAt.slice(0, 10)} 기준)
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">빠른 답변 템플릿</p>
                  <select onChange={(e) => { if (e.target.value) setReplyText(e.target.value); }} value=""
                    className="w-full border border-border rounded px-2 py-1.5 text-xs bg-white">
                    <option value="">템플릿 선택…</option>
                    {(QUICK_REPLIES[selected.category] ?? QUICK_REPLIES.other).map((tpl, idx) => (
                      <option key={idx} value={tpl}>{tpl.slice(0, 60)}{tpl.length > 60 ? '…' : ''}</option>
                    ))}
                  </select>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변 내용 (최대 5000자)" rows={5} maxLength={5000}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-y min-h-[44px]" />
                  <div className="flex justify-end gap-2">
                    <Button type="button" onClick={sendReply}
                      className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg min-h-[44px]">
                      답변 발송 (모의)
                    </Button>
                  </div>
                  {selected.replies && selected.replies.length > 0 && (
                    <div className="mt-3 space-y-2">
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
                <div className="space-y-1 pt-3 border-t border-border/60">
                  <p className="text-xs font-medium text-muted-foreground">운영 메모 (내부)</p>
                  <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="다른 운영자와 공유하는 메모. 사용자에게 노출되지 않습니다." rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2 text-xs resize-y" />
                  <button type="button" onClick={saveInternalNote}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white text-foreground lg:hover:bg-muted/50 min-h-[44px]">
                    메모 저장
                  </button>
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
        </>
      )}
    </div>
  );
}

// ─── 작품 문의 상세 헤더 컴포넌트 ────────────────────────────────────────────

function inquiryStatusBadgeClass(status: string): string {
  if (status === '신규') return 'bg-violet-100 text-violet-700 border border-violet-200';
  if (status === '처리 중') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (status === '완료') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
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
        <span className="bg-violet-900 text-violet-200 rounded px-2 py-0.5 text-[10px] font-semibold">🖼 작품 문의</span>
        {categoryLabel && (
          <span className="bg-blue-900 text-blue-200 rounded px-2 py-0.5 text-[10px] font-semibold">{categoryLabel}</span>
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
