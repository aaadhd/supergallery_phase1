import { Link } from 'react-router-dom';
import { AlertCircle, CheckSquare, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useIssueStore, useChecklistStore, usePartnerStore } from './adminStore';
import { STATUS_COLORS } from './constants';

export default function AdminDashboard() {
  const issueStore = useIssueStore();
  const checklistStore = useChecklistStore();
  const partnerStore = usePartnerStore();

  const issues = issueStore.getAll();
  const checklist = checklistStore.getAll();
  const partners = partnerStore.getAll();

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
        <h1 className="text-2xl font-bold text-gray-900">운영 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">SuperGallery Phase 1 런칭 준비 현황</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/issues">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  <Badge key={status} className={STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'} variant="outline">
                    {status} {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/checklist">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                런칭 체크리스트
              </CardDescription>
              <CardTitle className="text-3xl">{checklistRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={checklistRate} className="mb-2" />
              <p className="text-xs text-gray-500">{checklistDone}/{checklistTotal} 항목 완료</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/partners">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  <Badge key={stage} className={STATUS_COLORS[stage] || 'bg-gray-100 text-gray-600'} variant="outline">
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
            <p className="text-xs text-gray-500">목표: 800~1,000점</p>
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
                    <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                    <p className="text-xs text-red-600 mt-1">차단: {issue.blocker}</p>
                    <p className="text-xs text-gray-500 mt-0.5">담당: {issue.owner} · 기한: {issue.dueDate}</p>
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
                      <span className="text-gray-500">{done}/{total}</span>
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
                    <p className="text-sm text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-500">{issue.updatedAt} · {issue.owner}</p>
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
