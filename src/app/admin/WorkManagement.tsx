import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { EyeOff, Eye, Trash2 } from 'lucide-react';
import { workStore } from '../store';
import type { Work } from '../data';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { getCoverImage } from '../utils/imageHelper';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { useI18n } from '../i18n/I18nProvider';
import { openConfirm } from '../components/ConfirmDialog';

type VisibilityFilter = '전체' | '공개' | '비공개';

function visibilityOf(w: Work): '공개' | '비공개' {
  return w.isHidden ? '비공개' : '공개';
}

function visBadge(v: '공개' | '비공개') {
  if (v === '공개') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

export default function WorkManagement() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<Work[]>(() => workStore.getWorks());
  const [category, setCategory] = useState<string>('전체');
  const [visibility, setVisibility] = useState<VisibilityFilter>('전체');
  const [artistQ, setArtistQ] = useState('');

  useEffect(() => {
    const tm = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(tm);
  }, []);

  useEffect(() => {
    return workStore.subscribe(() => setWorks(workStore.getWorks()));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const w of works) if (w.category) set.add(w.category);
    return ['전체', ...[...set].sort()];
  }, [works]);

  const filtered = useMemo(() => {
    const q = artistQ.trim().toLowerCase();
    return works.filter((w) => {
      if (category !== '전체' && w.category !== category) return false;
      if (visibility !== '전체' && visibilityOf(w) !== visibility) return false;
      if (q && !w.artist.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [works, category, visibility, artistQ]);

  const toggleHidden = (w: Work) => {
    const next = !w.isHidden;
    workStore.updateWork(w.id, { isHidden: next });
    toast.success(next ? '비공개 처리되었습니다.' : '공개로 전환되었습니다.');
  };

  const remove = async (w: Work) => {
    const ok = await openConfirm({
      title: `"${displayExhibitionTitle(w, t('work.untitled'))}" 작품을 삭제할까요?`,
      description: '되돌릴 수 없습니다. 어드민 권한으로 즉시 삭제됩니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    workStore.removeWork(w.id);
    toast.success('작품이 삭제되었습니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">작품 관리</h1>
        <div className="rounded-lg border border-border bg-white py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-1 text-foreground">작품 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">
        실제 유저가 업로드한 작품 전체 목록. 공개/비공개 토글·삭제는 workStore에 즉시 반영됩니다.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              카테고리: {c}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]"
        >
          <option value="전체">상태: 전체</option>
          <option value="공개">공개</option>
          <option value="비공개">비공개</option>
        </select>
        <input
          type="search"
          placeholder="작가 검색"
          value={artistQ}
          onChange={(e) => setArtistQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          조건에 맞는 작품이 없습니다. 신규 작품을 업로드하면 여기에 표시됩니다.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium w-20">썸네일</th>
                <th className="px-4 py-3 font-medium">전시명</th>
                <th className="px-4 py-3 font-medium">작가명</th>
                <th className="px-4 py-3 font-medium">업로드일</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const key = getCoverImage(w.image, w.coverImageIndex);
                const src = imageUrls[key] || key;
                const v = visibilityOf(w);
                return (
                  <tr key={w.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-border bg-muted">
                        <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{displayExhibitionTitle(w, t('work.untitled'))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.artist.name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{w.uploadedAt || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${visBadge(v)}`}>
                        {v}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button
                        type="button"
                        onClick={() => toggleHidden(w)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30"
                      >
                        {w.isHidden ? (
                          <><Eye className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />공개로</>
                        ) : (
                          <><EyeOff className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />비공개로</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => remove(w)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 lg:hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        삭제
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
