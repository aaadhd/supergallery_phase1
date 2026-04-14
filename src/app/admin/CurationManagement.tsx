import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { curationStore, useCuration, type ThemeExhibition } from '../utils/curationStore';
import { artists } from '../data';
import { openConfirm } from '../components/ConfirmDialog';

export default function CurationManagement() {
  const [loading, setLoading] = useState(true);
  const { theme, featuredArtistIds } = useCuration();
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftWorkIds, setDraftWorkIds] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setDraftTitle(theme?.title ?? '');
    setDraftSubtitle(theme?.subtitle ?? '');
    setDraftWorkIds((theme?.workIds ?? []).join(', '));
  }, [theme]);

  const saveTheme = (e: FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      toast.error('테마 제목을 입력해 주세요.');
      return;
    }
    const ids = draftWorkIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const next: ThemeExhibition = {
      title,
      subtitle: draftSubtitle.trim() || undefined,
      workIds: ids,
    };
    curationStore.setTheme(next);
    toast.success('이번 주 테마전이 저장되었습니다.');
  };

  const clearTheme = async () => {
    const ok = await openConfirm({
      title: '이번 주 테마전을 해제할까요?',
      description: '해제하면 둘러보기 피드의 테마 레이어가 비활성됩니다.',
      destructive: true,
      confirmLabel: '해제',
    });
    if (!ok) return;
    curationStore.clearTheme();
    toast.success('테마전이 해제되었습니다.');
  };

  const toggleFeatured = (artistId: string) => {
    curationStore.toggleFeaturedArtist(artistId);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">피드 큐레이션</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  const featuredSet = new Set(featuredArtistIds);

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold text-foreground mb-1">피드 큐레이션</h1>
      <p className="text-sm text-muted-foreground mb-6">
        둘러보기 피드 노출 순서: <strong>Pick → 테마전 → 추천 작가 → 신규(14일) → 일반</strong>. 여기서 테마전·추천 작가 레이어를 관리합니다.
      </p>

      {/* 테마전 */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-3">이번 주 테마전</h2>
        <form
          onSubmit={saveTheme}
          className="rounded-lg border border-border p-4 space-y-3 bg-muted/30"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="테마 제목 * (예: 봄 수채화 특집)"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="부제 (선택)"
              value={draftSubtitle}
              onChange={(e) => setDraftSubtitle(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <textarea
            placeholder="포함할 작품 ID (쉼표·공백·줄바꿈으로 구분)&#10;예: 1, 2, 3, 4"
            value={draftWorkIds}
            onChange={(e) => setDraftWorkIds(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            작품 ID는 작품 상세 URL `/exhibitions/:id`의 `:id`를 사용합니다. 브라우저 콘솔이나 workStore에서 확인 가능.
          </p>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              저장 / 업데이트
            </Button>
            {theme && (
              <Button
                type="button"
                onClick={clearTheme}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                테마 해제
              </Button>
            )}
          </div>
        </form>
        {theme && (
          <div className="mt-3 text-xs text-muted-foreground">
            현재 활성 테마: <strong className="text-foreground">{theme.title}</strong>
            {theme.subtitle ? ` · ${theme.subtitle}` : ''} · 포함 작품 {theme.workIds.length}개
          </div>
        )}
      </section>

      {/* 추천 작가 */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">추천 작가 (피드 부스트)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          체크한 작가의 작품은 Pick/테마전 다음 우선순위로 노출됩니다. 현재 <strong>{featuredArtistIds.length}</strong>명 활성.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {artists.map((a) => {
            const active = featuredSet.has(a.id);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border lg:hover:bg-muted/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleFeatured(a.id)}
                  className="h-4 w-4"
                />
                <img
                  src={a.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-border"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {a.id}</p>
                </div>
                {active && <Star className="w-4 h-4 text-primary fill-primary" />}
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
