import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { EyeOff, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';

type WorkVisibility = '공개' | '비공개';

type WorkRow = {
  id: string;
  thumb: string;
  exhibitionTitle: string;
  artist: string;
  uploadedAt: string;
  visibility: WorkVisibility;
  category: string;
};

const initialWorks: WorkRow[] = [
  { id: '1', thumb: '1', exhibitionTitle: '봄 전시 2026', artist: '김민서', uploadedAt: '2026-03-20', visibility: '공개', category: '회화' },
  { id: '2', thumb: '2', exhibitionTitle: '디지털 아트 모음', artist: '이하준', uploadedAt: '2026-03-18', visibility: '공개', category: '디지털' },
  { id: '3', thumb: '3', exhibitionTitle: '조각과 공간', artist: '박지우', uploadedAt: '2026-03-15', visibility: '비공개', category: '조각' },
  { id: '4', thumb: '4', exhibitionTitle: '스케치북', artist: '최유나', uploadedAt: '2026-03-10', visibility: '공개', category: '드로잉' },
  { id: '5', thumb: '5', exhibitionTitle: '컬러 스터디', artist: '정다은', uploadedAt: '2026-03-05', visibility: '공개', category: '회화' },
];

function visBadge(v: WorkVisibility) {
  if (v === '공개') return 'bg-muted text-primary border border-border';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function WorkManagement() {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<WorkRow[]>(initialWorks);
  const [category, setCategory] = useState('전체');
  const [artistQ, setArtistQ] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const categories = useMemo(() => ['전체', ...new Set(initialWorks.map((w) => w.category))], []);

  const filtered = useMemo(() => {
    const q = artistQ.trim().toLowerCase();
    return works.filter((w) => {
      if (category !== '전체' && w.category !== category) return false;
      if (q && !w.artist.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [works, category, artistQ]);

  const makePrivate = (id: string) => {
    setWorks((prev) => prev.map((w) => (w.id === id ? { ...w, visibility: '비공개' as const } : w)));
    toast.success('비공개 처리되었습니다.');
  };

  const remove = (id: string) => {
    setWorks((prev) => prev.filter((w) => w.id !== id));
    toast.message('작품이 삭제되었습니다. (목업)');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">작품 관리</h1>
        <div className="rounded-lg border border-[#E4E4E7] bg-white py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-6 text-gray-900">작품 관리</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              카테고리: {c}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="작가 검색"
          value={artistQ}
          onChange={(e) => setArtistQ(e.target.value)}
          className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          조건에 맞는 작품이 없습니다.
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F4F5] text-left text-gray-700">
                <th className="px-4 py-3 font-medium w-20">썸네일</th>
                <th className="px-4 py-3 font-medium">전시명</th>
                <th className="px-4 py-3 font-medium">작가명</th>
                <th className="px-4 py-3 font-medium">업로드일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-[#F0F0F0] lg:hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 border border-[#E4E4E7]">
                      {w.thumb}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{w.exhibitionTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{w.artist}</td>
                  <td className="px-4 py-3 text-gray-600">{w.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${visBadge(w.visibility)}`}>
                      {w.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Button
                      type="button"
                      disabled={w.visibility === '비공개'}
                      onClick={() => makePrivate(w.id)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 lg:hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      비공개
                    </Button>
                    <Button
                      type="button"
                      onClick={() => remove(w.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 lg:hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      삭제
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
