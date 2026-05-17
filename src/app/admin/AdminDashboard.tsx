import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Flag, Megaphone, MessageSquare, RotateCcw, ShieldAlert, Star, Trophy, Users } from 'lucide-react';
import { useNotices } from '../utils/noticeStore';
import { workStore, useWorkStore } from '../store';
import { loadUserReports, REPORTS_CHANGED_EVENT } from '../utils/reportsStore';
import { isWorkHidden } from '../utils/workVisibility';
import { useManagedEvents, deriveEventStatus } from '../utils/eventsStore';
import { usePickSessions, derivePickStatus } from '../utils/pickStore';

type StatRowProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  note?: string;
  warn?: boolean;
};

function StatRow({ to, icon, label, value, note, warn }: StatRowProps) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors lg:hover:bg-muted/40 ${
        warn ? 'border-amber-200 bg-amber-50' : 'border-border bg-white'
      }`}
    >
      <span className={`flex items-center gap-2 text-xs ${warn ? 'text-amber-800' : 'text-muted-foreground'}`}>
        {icon}
        <span>{label}</span>
        {note && <span className="hidden sm:inline text-[10px] opacity-60">· {note}</span>}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${warn ? 'text-amber-900' : 'text-foreground'}`}>{value}</span>
    </Link>
  );
}

export default function AdminDashboard() {
  useWorkStore();

  const allWorks = workStore.getWorks();
  const pendingWorks = allWorks.filter(w => w.feedReviewStatus === 'pending');
  const pendingCount = pendingWorks.length;
  const resubmitCount = pendingWorks.filter(w => (w.rejectionHistory?.length ?? 0) > 0).length;
  const rejectedCount = allWorks.filter(w => w.feedReviewStatus === 'rejected').length;

  const [reportPendingCount, setReportPendingCount] = useState(() =>
    loadUserReports().filter(r => (r.adminStatus ?? 'pending') === 'pending').length
  );
  useEffect(() => {
    const refresh = () =>
      setReportPendingCount(loadUserReports().filter(r => (r.adminStatus ?? 'pending') === 'pending').length);
    window.addEventListener(REPORTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(REPORTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const autoHiddenCount = workStore.getWorks().filter((w) => isWorkHidden(w)).length;

  const allNotices = useNotices();
  const noticePublishedCount = allNotices.filter((n) => n.status === 'published').length;
  const noticePinnedCount = allNotices.filter((n) => n.status === 'published' && n.isPinned).length;
  const noticeDraftCount = allNotices.filter((n) => n.status === 'draft').length;

  const managedEvents = useManagedEvents();
  const contests = managedEvents.filter((e) => e.type === 'contest');
  const activeEventsCount = contests.filter((e) => deriveEventStatus(e) === 'active').length;
  const totalSelectedCount = contests.reduce((acc, e) => acc + (e.selectedWorkIds?.length ?? 0), 0);

  const pickSessions = usePickSessions();
  const activePickSession = pickSessions.find((s) => s.publicationOpen === true && derivePickStatus(s) !== 'ended') ?? null;

  const unansweredInquiryCount = (() => {
    try {
      const raw = localStorage.getItem('artier_inquiries');
      if (!raw) return 0;
      const list = JSON.parse(raw) as Array<{ status?: string }>;
      return list.filter(i => !i.status || i.status === '신규' || i.status === '처리 중').length;
    } catch { return 0; }
  })();

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-base font-semibold text-foreground">운영 대시보드</h1>

      {/* Pick 세션 */}
      <Link to="/admin/picks">
        {activePickSession ? (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#B8862F]/30 bg-gradient-to-r from-[#FBF7EE] to-white lg:hover:shadow-sm transition-shadow">
            <span className="flex items-center gap-2 text-xs text-[#8B6914]">
              <Star className="w-3.5 h-3.5" />
              <span className="font-medium">{activePickSession.title}</span>
              <span className="opacity-60">· {activePickSession.startAt} ~ {activePickSession.endAt}</span>
            </span>
            <span className="text-xs text-[#8B6914]">{activePickSession.selectedWorkIds?.length ?? 0} / 10 선정</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 lg:hover:shadow-sm transition-shadow">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            활성화된 Pick이 없습니다 — 홈 배너 및 피드 상위 노출 없음
          </div>
        )}
      </Link>

      {/* 콘텐츠 운영 */}
      <section>
        <p className="text-xs text-muted-foreground font-medium mb-2">콘텐츠 운영</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <StatRow to="/admin/content-review" icon={<Eye className="w-3.5 h-3.5" />}
            label="검수 대기" value={pendingCount}
            note={resubmitCount > 0 ? `재검수 ${resubmitCount}건` : 'SLA 24h'} />
          <StatRow to="/admin/content-review?status=rejected" icon={<RotateCcw className="w-3.5 h-3.5" />}
            label="반려 상태" value={rejectedCount} note="작가 수정 대기" />
          <StatRow to="/admin/reports" icon={<Flag className="w-3.5 h-3.5" />}
            label="미결 신고" value={reportPendingCount} note="SLA 24h" />
          <StatRow to="/admin/reports" icon={<ShieldAlert className="w-3.5 h-3.5" />}
            label="비공개 전시" value={autoHiddenCount} />
          <StatRow to="/admin/notices" icon={<Megaphone className="w-3.5 h-3.5" />}
            label="공지"
            value={`${noticePublishedCount}건`}
            note={`고정 ${noticePinnedCount}/2 · 임시저장 ${noticeDraftCount}`} />
        </div>
      </section>

      {/* 응모전 운영 */}
      <section>
        <p className="text-xs text-muted-foreground font-medium mb-2">응모전 운영</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <StatRow to="/admin/contests" icon={<Trophy className="w-3.5 h-3.5" />}
            label="진행 중" value={activeEventsCount} note="기간·발표 관리" />
          <StatRow to="/admin/contests?tab=participants" icon={<Users className="w-3.5 h-3.5" />}
            label="선정 완료" value={totalSelectedCount} note="전체 응모전 합산" />
        </div>
      </section>

      {/* 운영 현황 */}
      <section>
        <p className="text-xs text-muted-foreground font-medium mb-2">운영 현황</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <StatRow to="/admin/inquiries" icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="미답변 문의" value={unansweredInquiryCount} note="신규·처리 중"
            warn={unansweredInquiryCount > 0} />
        </div>
      </section>
    </div>
  );
}
