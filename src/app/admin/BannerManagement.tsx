import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

type BannerStatus = '활성' | '비활성';

type Banner = {
  id: string;
  title: string;
  linkUrl: string;
  period: string;
  status: BannerStatus;
  preview: string;
};

const initialBanners: Banner[] = [
  {
    id: 'b1',
    title: '봄 시즌 오픈',
    linkUrl: 'https://example.com/spring',
    period: '2026-03-01 ~ 2026-04-15',
    status: '활성',
    preview: 'BN1',
  },
  {
    id: 'b2',
    title: '신인 작가 특집',
    linkUrl: 'https://example.com/new-artists',
    period: '2026-03-10 ~ 2026-05-01',
    status: '활성',
    preview: 'BN2',
  },
  {
    id: 'b3',
    title: '종료된 캠페인',
    linkUrl: 'https://example.com/old',
    period: '2025-12-01 ~ 2026-01-31',
    status: '비활성',
    preview: 'BN3',
  },
];

function statusBadge(s: BannerStatus) {
  if (s === '활성') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function BannerManagement() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', linkUrl: '', period: '', status: '활성' as BannerStatus });

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const toggleStatus = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: b.status === '활성' ? '비활성' : '활성' } : b))
    );
    toast.success('상태가 변경되었습니다.');
  };

  const submitNew = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.linkUrl.trim()) {
      toast.error('제목과 링크를 입력해 주세요.');
      return;
    }
    const id = `b${Date.now()}`;
    setBanners((prev) => [
      ...prev,
      {
        id,
        title: draft.title.trim(),
        linkUrl: draft.linkUrl.trim(),
        period: draft.period.trim() || '미정',
        status: draft.status,
        preview: `N${prev.length + 1}`,
      },
    ]);
    setDraft({ title: '', linkUrl: '', period: '', status: '활성' });
    setShowForm(false);
    toast.success('배너가 추가되었습니다. (목업)');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-gray-900">배너 관리</h1>
        <div className="rounded-lg border border-[#E4E4E7] py-16 text-center text-sm text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">배너 관리</h1>
        <Button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          새 배너
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submitNew}
          className="mb-6 border border-[#E4E4E7] rounded-lg p-4 space-y-3 bg-[#FAFAFA]"
        >
          <p className="text-sm font-medium text-gray-800">인라인 등록 폼</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="제목"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="링크 URL"
              value={draft.linkUrl}
              onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
              className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="기간 (예: 2026-04-01 ~ 2026-04-30)"
              value={draft.period}
              onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))}
              className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as BannerStatus }))}
              className="border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="활성">활성</option>
              <option value="비활성">비활성</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white">
              저장
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7]"
            >
              취소
            </Button>
          </div>
        </form>
      )}

      {banners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E4E4E7] py-16 text-center text-sm text-gray-500">
          등록된 배너가 없습니다.
        </div>
      ) : (
        <ol className="space-y-3">
          {banners.map((b, idx) => (
            <li
              key={b.id}
              className="border border-[#E4E4E7] rounded-lg p-4 flex flex-col sm:flex-row gap-4 lg:hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="flex items-start gap-2 shrink-0">
                <span className="text-xs text-gray-400 tabular-nums pt-1 w-5">{idx + 1}</span>
                <GripVertical className="w-5 h-5 text-gray-300 mt-0.5" aria-hidden />
                <div className="w-full sm:w-40 h-24 rounded-lg bg-gradient-to-br from-primary/10 to-muted border border-[#E4E4E7] flex items-center justify-center text-sm font-semibold text-primary">
                  {b.preview}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                <p className="text-xs text-primary break-all">{b.linkUrl}</p>
                <p className="text-xs text-gray-500">{b.period}</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(b.status)}`}>
                  {b.status}
                </span>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => toggleStatus(b.id)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-gray-700 lg:hover:bg-white"
                >
                  {b.status === '활성' ? '비활성으로' : '활성으로'}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
