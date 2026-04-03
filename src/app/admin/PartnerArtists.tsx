import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { usePartnerStore } from './adminStore';
import { PARTNER_STAGE, PARTNER_SUBMISSION, STATUS_COLORS } from './constants';

export default function PartnerArtists() {
  const store = usePartnerStore();
  const partners = store.getAll();

  const [filterStage, setFilterStage] = useState('all');
  const [filterSubmission, setFilterSubmission] = useState('all');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filtered = partners.filter(p => {
    if (filterStage !== 'all' && p.stage !== filterStage) return false;
    if (filterSubmission !== 'all' && p.submissionStatus !== filterSubmission) return false;
    return true;
  });

  // Stats
  const activeCount = partners.filter(p => p.stage === '활성').length;
  const totalWorks = partners.reduce((acc, p) => acc + p.worksCount, 0);
  const targetArtists = 50;

  const handleStageChange = (id: string, newStage: string) => {
    store.update(id, { stage: newStage });
  };

  const handleSubmissionChange = (id: string, newStatus: string) => {
    store.update(id, { submissionStatus: newStatus });
  };

  const startEditNote = (id: string, currentNote: string) => {
    setEditingNote(id);
    setNoteText(currentNote);
  };

  const saveNote = (id: string) => {
    store.update(id, { notes: noteText });
    setEditingNote(null);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">파트너 작가 관리</h1>
        <p className="text-sm text-gray-500 mt-1">모집/온보딩/관리 및 월간 루틴 추적</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">전체 파트너</p>
          <p className="text-2xl font-bold">{partners.length}명</p>
          <Progress value={(partners.length / targetArtists) * 100} className="mt-2" />
          <p className="text-xs text-gray-400 mt-1">목표: {targetArtists}명</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">활성 작가</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}명</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">제출 작품</p>
          <p className="text-2xl font-bold">{totalWorks}점</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">온보딩 중</p>
          <p className="text-2xl font-bold text-yellow-600">
            {partners.filter(p => p.stage === '온보딩 중').length}명
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="단계" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 단계</SelectItem>
            {Object.values(PARTNER_STAGE).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSubmission} onValueChange={setFilterSubmission}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="제출 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 제출 상태</SelectItem>
            {Object.values(PARTNER_SUBMISSION).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="self-center text-sm text-gray-500">
          {filtered.length}명 표시
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>작가명</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead className="w-[110px]">단계</TableHead>
              <TableHead>연락 상태</TableHead>
              <TableHead className="w-[110px]">제출 상태</TableHead>
              <TableHead className="w-[60px]">작품</TableHead>
              <TableHead>월간 루틴</TableHead>
              <TableHead>메모</TableHead>
              <TableHead className="w-[100px]">마지막 연락</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  조건에 맞는 파트너 작가가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(partner => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium text-gray-900">{partner.name}</TableCell>
                  <TableCell className="text-xs text-gray-500">{partner.email}</TableCell>
                  <TableCell>
                    <Select value={partner.stage} onValueChange={(v) => handleStageChange(partner.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PARTNER_STAGE).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{partner.contactStatus}</TableCell>
                  <TableCell>
                    <Select value={partner.submissionStatus} onValueChange={(v) => handleSubmissionChange(partner.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PARTNER_SUBMISSION).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center font-medium">{partner.worksCount}</TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-[120px]">
                    <span className="truncate block">{partner.monthlyRoutine}</span>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    {editingNote === partner.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveNote(partner.id)}
                          className="text-xs border rounded px-2 py-1 flex-1 min-w-0"
                          autoFocus
                        />
                        <Button
                          onClick={() => saveNote(partner.id)}
                          className="text-xs text-blue-600 lg:hover:text-blue-800 whitespace-nowrap"
                        >
                          저장
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="text-xs text-gray-500 truncate block cursor-pointer lg:hover:text-gray-800"
                        onClick={() => startEditNote(partner.id, partner.notes)}
                        title="클릭하여 편집"
                      >
                        {partner.notes || '메모 추가...'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{partner.lastContactAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
