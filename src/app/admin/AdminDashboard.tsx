import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckSquare, Users, AlertTriangle, TrendingUp, Eye, Flag, RotateCcw, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useIssueStore, useChecklistStore, usePartnerStore } from './adminStore';
import { STATUS_COLORS } from './constants';
import { workStore, useWorkStore } from '../store';
import { loadUserReports, REPORTS_CHANGED_EVENT } from '../utils/reportsStore';

export default function AdminDashboard() {
  const issueStore = useIssueStore();
  const checklistStore = useChecklistStore();
  const partnerStore = usePartnerStore();
  useWorkStore(); // workStore 구독 — 작품 변화 시 지표 자동 갱신

  const issues = issueStore.getAll();
  const checklist = checklistStore.getAll();
  const partners = partnerStore.getAll();

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

  // 자동 비공개 처리된 전시 수 (Policy §12.2)
  const autoHiddenCount = workStore.getWorks().filter(w => w.isHidden === true).length;
  // SLA 위반 카운트 (Policy §12.2.1 — 자동 비공개 후 72h 경과 + 미처리)
  const slaViolatedCount = (() => {
    const now = Date.now();
    return workStore.getWorks().filter((w) => {
      if (!w.isHidden || !w.autoHiddenAt) return false;
      const hours = (now - new Date(w.autoHiddenAt).getTime()) / (60 * 60 * 1000);
      return hours >= 72;
    }).length;
  })();

  // Issue stats
  const issuesByStatus = issues.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Checklist stats
  const checklistDone = checklist.filter(c => c.status === '완료').length;
  const checklistTotal = checklist.length;
  const checklistRate = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const checklistByCategory = checklist.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = { total: 0, done: 0 };
    acc[c.category].total++;
    if (c.status === '완료') acc[c.category].done++;
    return acc;
  }, {} as Record<string, { total: number; done: number }>);

  // Partner stats
  const partnersByStage = partners.reduce((acc, p) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalWorks = partners.reduce((acc, p) => acc + p.worksCount, 0);

  // Urgent blockers
  const blockers = issues.filter(i => i.blocker && i.status !== '해결됨');

  // Recent updates (sorted by updatedAt)
  const recentIssues = [...issues]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">운영 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">Artier Phase 1 운영 현황 · 런칭 준비</p>
      </div>

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
                <p className="text-xs text-muted-foreground">2회 신고 자동 비공개 + 확정 비공개 합계</p>
                {slaViolatedCount > 0 && (
                  <p className="mt-1 text-xs font-semibold text-red-700">
                    ⚠ SLA 위반 {slaViolatedCount}건 (72h 초과)
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <h2 className="text-sm font-semibold text-muted-foreground mb-3">런칭 준비</h2>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/issues">
          <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                미결 이슈
              </CardDescription>
              <CardTitle className="text-3xl">{issuesByStatus['미결'] || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(issuesByStatus).map(([status, count]) => (
                  <Badge key={status} className={STATUS_COLORS[status] || 'bg-muted/50 text-muted-foreground'} variant="outline">
                    {status} {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/checklist">
          <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                런칭 체크리스트
              </CardDescription>
              <CardTitle className="text-3xl">{checklistRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={checklistRate} className="mb-2" />
              <p className="text-xs text-muted-foreground">{checklistDone}/{checklistTotal} 항목 완료</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/partners">
          <Card className="lg:hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                파트너 작가
              </CardDescription>
              <CardTitle className="text-3xl">{partners.length}명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(partnersByStage).map(([stage, count]) => (
                  <Badge key={stage} className={STATUS_COLORS[stage] || 'bg-muted/50 text-muted-foreground'} variant="outline">
                    {stage} {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              파트너 작품
            </CardDescription>
            <CardTitle className="text-3xl">{totalWorks}점</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">목표: 800~1,000점</p>
            <Progress value={Math.min((totalWorks / 800) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Urgent Blockers */}
      {blockers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              긴급 차단 요소 ({blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockers.map(issue => (
                <div key={issue.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-red-100">
                  <Badge className={STATUS_COLORS[issue.priority] || ''} variant="outline">
                    {issue.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{issue.title}</p>
                    <p className="text-xs text-destructive mt-1">차단: {issue.blocker}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">담당: {issue.owner} · 기한: {issue.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist by Category */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 체크리스트 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(checklistByCategory).map(([category, { total, done }]) => {
                const rate = Math.round((done / total) * 100);
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{category}</span>
                      <span className="text-muted-foreground">{done}/{total}</span>
                    </div>
                    <Progress value={rate} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업데이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIssues.map(issue => (
                <div key={issue.id} className="flex items-center gap-3">
                  <Badge className={STATUS_COLORS[issue.status] || ''} variant="outline">
                    {issue.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.updatedAt} · {issue.owner}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
