import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useChecklistStore } from './adminStore';
import { CHECKLIST_CATEGORY, CHECKLIST_STATUS, STATUS_COLORS } from './constants';

export default function LaunchChecklist() {
  const store = useChecklistStore();
  const items = store.getAll();
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = Object.values(CHECKLIST_CATEGORY);

  const filteredItems = filterCategory === 'all'
    ? items
    : items.filter(i => i.category === filterCategory);

  // Group by category
  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Overall stats
  const totalDone = items.filter(i => i.status === '완료').length;
  const totalItems = items.length;
  const overallRate = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  const handleToggle = (id: string) => {
    const item = store.get(id);
    if (!item) return;
    const newChecked = !item.checked;
    store.update(id, {
      checked: newChecked,
      status: newChecked ? '완료' : '시작 전',
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    store.update(id, {
      status: newStatus,
      checked: newStatus === '완료',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">런칭 체크리스트</h1>
          <p className="text-sm text-gray-500 mt-1">QA + 오픈 준비 통합 체크리스트</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{overallRate}%</p>
          <p className="text-xs text-gray-500">{totalDone}/{totalItems} 완료</p>
        </div>
      </div>

      <Progress value={overallRate} className="h-3" />

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped checklist */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryItems]) => {
          const catDone = categoryItems.filter(i => i.status === '완료').length;
          const catRate = Math.round((catDone / categoryItems.length) * 100);

          return (
            <div key={category} className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-medium">{category}</Badge>
                  <span className="text-sm text-gray-500">{catDone}/{categoryItems.length} 완료</span>
                </div>
                <div className="w-24">
                  <Progress value={catRate} />
                </div>
              </div>
              <div className="divide-y">
                {categoryItems.map(item => {
                  const isOverdue = item.dueDate < new Date().toISOString().split('T')[0] && item.status !== '완료';
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                        item.status === '완료' ? 'opacity-60' : ''
                      } ${isOverdue ? 'bg-red-50' : ''}`}
                    >
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="mt-0.5 text-gray-400 hover:text-gray-700"
                      >
                        {item.status === '완료' ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.status === '완료' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">담당: {item.owner}</span>
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            기한: {item.dueDate} {isOverdue && '⚠ 초과'}
                          </span>
                        </div>
                      </div>
                      <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CHECKLIST_STATUS).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
