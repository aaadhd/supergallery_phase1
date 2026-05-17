import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Flag, Megaphone, RotateCcw, ShieldAlert, Star, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useNotices } from '../utils/noticeStore';
import { STATUS_COLORS } from './constants';
import { workStore, useWorkStore } from '../store';
import { loadUserReports, REPORTS_CHANGED_EVENT } from '../utils/reportsStore';
import { isWorkHidden } from '../utils/workVisibility';
import { useManagedEvents, deriveEventStatus } from '../utils/eventsStore';
import { usePickSessions, derivePickStatus } from '../utils/pickStore';

export default function AdminDashboard() {
  useWorkStore(); // workStore 구독 — 작품 변화 시 지표 자동 갱신

  // 콘텐츠 운영 지표 (Policy §22 SLA 기반)
  const allWorks = workStore.getWorks();
  const pendingWorks = allWorks.filter(w => w.feedReviewStatus === 'pending');
  const pendingCount = pendingWorks.length;
  const resubmitCount = pendingWorks.filter(w => (w.rejectionHistory?.length ?? 0) > 0).length;
  const rejectedCount = allWorks.filter(w => w.feedReviewStatus === 'rejected').length;

  // 신고 큐 (신고 처리 변경 이벤트 구독)
  const [reportPendingCount, setReportPendingCount] = useState(() =>
    loadUserReports().filter(r => (r.adminStatus ?? 'pending') === 'pending').length
  );
  useEffect(() => {
    const refresh = () =>
      setReportPendingCount(
        loadUserReports().filter(r => (r.adminStatus ?? 'pending') === 'pending').length,
      );
    window.addEventListener(REPORTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(REPORTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // 비공개 처리된 전시 수 (Policy §12.1 「비공개 유지」 또는 자동 비공개 잔존 — §12.2 v2.20 자동 트리거 폐기)
  const autoHiddenCount = workStore.getWorks().filter((w) => isWorkHidden(w)).length;

  // 공지 지표 (ADM-NTC-01)
  const allNotices = useNotices();
  const noticeDraftCount = allNotices.filter((n) => n.status === 'draft').length;
  const noticePublishedCount = allNotices.filter((n) => n.status === 'published').length;
  const noticePinnedCount = allNotices.filter((n) => n.status === 'published' && n.isPinned).length;

  // 응모전 운영 지표 (PRD ADM-EVT-03 트리거 정합 — 대시보드에서 진입)
  const managedEvents = useManagedEvents();
  const contests = managedEvents.filter((e) => e.type === 'contest');
  const activeEventsCount = contests.filter((e) => deriveEventStatus(e) === 'active').length;
  const pendingPublication = contests.filter(
    (e) => e.publicationOpen === true && (e.selectedWorkIds?.length ?? 0) === 0,
  ).length;

  // Proud's Pick 현황
  const pickSessions = usePickSessions();
  const activePickSession = pickSessions.find((s) => s.publicationOpen === true && derivePickStatus(s) !== 'ended') ?? null;

  // 미답변 문의 건수
  const unansweredInquiryCount = (() => {
    try {
      const raw = localStorage.getItem('artier_inquiries');
      if (!raw) return 0;
      const list = JSON.parse(raw) as Array<{ status?: string }>;
      return list.filter(i => !i.status || i.status === '신규' || i.status === '처리 중').length;
    } catch { return 0; }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">운영 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">Proud Gallery Phase 1 운영 현황 · 런칭 준비</p>
      </div>

      {/* Proud's Pick 현황 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Proud&apos;s Pick</h2>
        <Link to="/admin/picks">
          {activePickSession ? (
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer border-[#B8862F]/30 bg-gradient-to-r from-[#FBF7EE] to-white">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-[#8B6914]">
                  <Star className="w-4 h-4" />
                  이번 픽 세션
                </CardDescription>
                <CardTitle className="text-base font-semibold text-foreground leading-snug">
                  {activePickSession.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {activePickSession.startAt} ~ {activePickSession.endAt}
                  {' · '}
                  {activePickSession.selectedWorkIds?.length ?? 0}개 선정 / 최대 10개
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4" />
                  활성화된 Pick이 없습니다
                </CardDescription>
                <CardTitle className="text-sm font-medium text-amber-900">픽 관리에서 새 세션을 만들어 주세요</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-800">픽이 없으면 홈 배너 및 Browse 피드 상위 노출이 없습니다</p>
              </CardContent>
            </Card>
          )}
        </Link>
      </section>

      {/* 콘텐츠 운영 지표 — 오늘 처리 우선순위 파악용 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">콘텐츠 운영</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/content-review">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  검수 대기
                </CardDescription>
                <CardTitle className="text-3xl">{pendingCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {resubmitCount > 0
                    ? `재검수 ${resubmitCount}건 포함 · SLA 24시간`
                    : 'SLA 24시간 내 처리'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/content-review?status=rejected">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  반려 상태
                </CardDescription>
                <CardTitle className="text-3xl">{rejectedCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">작가 수정 대기 중</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/reports">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  미결 신고
                </CardDescription>
                <CardTitle className="text-3xl">{reportPendingCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">긴급 건은 24시간 SLA</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/reports">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  비공개 전시
                </CardDescription>
                <CardTitle className="text-3xl">{autoHiddenCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">운영팀 비공개 유지 처리된 전시 수</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/notices">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  공지 일감
                </CardDescription>
                <CardTitle className="text-3xl">{noticePublishedCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  게시 중 {noticePublishedCount}건 · 고정 {noticePinnedCount}/2 · 임시저장 {noticeDraftCount}건
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* 응모전 운영 (PRD ADM-EVT-03 트리거 — 대시보드에서 응모자 현황·발표 진입) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">응모전 운영</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link to="/admin/contests">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  진행 중 응모전
                </CardDescription>
                <CardTitle className="text-3xl">{activeEventsCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">기간·발표 토글 관리</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/contests?tab=participants">
            <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  응모자 현황
                </CardDescription>
                <CardTitle className="text-3xl">{contests.reduce((acc, e) => acc + (e.selectedWorkIds?.length ?? 0), 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">선정 처리·일괄 선정·작품 검토</p>
              </CardContent>
            </Card>
          </Link>
          {pendingPublication > 0 && (
            <Link to="/admin/contests">
              <Card className="lg:hover:shadow-md transition-shadow cursor-pointer border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4" />
                    발표 페이지 미작성
                  </CardDescription>
                  <CardTitle className="text-3xl text-amber-900">{pendingPublication}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-amber-800">발표 토글 ON · 선정작 0건 응모전</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </section>

      <h2 className="text-sm font-semibold text-muted-foreground mb-3">운영 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/inquiries">
          <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                미답변 문의
              </CardDescription>
              <CardTitle className="text-3xl">{unansweredInquiryCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">신규·처리 중</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
