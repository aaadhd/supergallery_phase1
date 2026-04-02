import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useIssueStore } from './adminStore';
import { ISSUE_STATUS, ISSUE_PRIORITY, ISSUE_CATEGORY, STATUS_COLORS } from './constants';

export default function UnresolvedIssues() {
  const store = useIssueStore();
  const issues = store.getAll();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');

  const owners = [...new Set(issues.map(i => i.owner))];

  const filtered = issues.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (filterOwner !== 'all' && i.owner !== filterOwner) return false;
    return true;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    store.update(id, { status: newStatus, updatedAt: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">미결 이슈 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">개발/디자인 착수 전 결정해야 할 항목 관리</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {Object.values(ISSUE_STATUS).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 우선순위</SelectItem>
            {Object.values(ISSUE_PRIORITY).map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {Object.values(ISSUE_CATEGORY).map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="담당자" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 담당자</SelectItem>
            {owners.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="self-center text-sm text-gray-500">
          {filtered.length}건 / 전체 {issues.length}건
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[80px]">카테고리</TableHead>
              <TableHead className="w-[80px]">우선순위</TableHead>
              <TableHead className="w-[80px]">담당자</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead>차단 요소</TableHead>
              <TableHead className="w-[100px]">기한</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  조건에 맞는 이슈가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(issue => {
                const isOverdue = issue.dueDate < new Date().toISOString().split('T')[0] && issue.status !== '해결됨';
                return (
                  <TableRow key={issue.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="text-xs text-gray-500 font-mono">{issue.id}</TableCell>
                    <TableCell className="font-medium text-gray-900 max-w-[240px]">
                      <span className="truncate block">{issue.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[issue.priority] || ''} variant="outline">
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{issue.owner}</TableCell>
                    <TableCell>
                      <Select value={issue.status} onValueChange={(v) => handleStatusChange(issue.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ISSUE_STATUS).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-red-600 max-w-[160px]">
                      <span className="truncate block">{issue.blocker || '-'}</span>
                    </TableCell>
                    <TableCell className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {issue.dueDate}
                      {isOverdue && <span className="text-xs ml-1">⚠</span>}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[200px]">
                      <span className="truncate block">{issue.note}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
