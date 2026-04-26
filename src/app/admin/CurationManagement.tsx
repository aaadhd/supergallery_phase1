import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Pencil, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { curationStore, useCuration, type ThemeExhibition } from '../utils/curationStore';
import { artists } from '../data';
import { openConfirm } from '../components/ConfirmDialog';

function parseWorkIds(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CurationManagement() {
  const [loading, setLoading] = useState(true);
  const { themes, featuredArtistIds } = useCuration();
  // 신규 추가 폼
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftWorkIds, setDraftWorkIds] = useState('');
  // 인라인 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editWorkIds, setEditWorkIds] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(t);
  }, []);

  const addTheme = (e: FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      toast.error('기획전 제목을 입력해 주세요.');
      return;
    }
    if (themes.some((t) => t.title.trim() === title)) {
      toast.error('같은 제목의 기획전이 이미 있어요. 다른 제목을 입력해 주세요.');
      return;
    }
    const workIds = parseWorkIds(draftWorkIds);
    if (workIds.length === 0) {
      toast.error('포함할 작품 ID를 1개 이상 입력해 주세요.');
      return;
    }
    curationStore.addTheme({
      title,
      subtitle: draftSubtitle.trim() || undefined,
      workIds,
    });
    setDraftTitle('');
    setDraftSubtitle('');
    setDraftWorkIds('');
    toast.success('기획전이 추가되었습니다.');
  };

  const startEdit = (t: ThemeExhibition) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditSubtitle(t.subtitle ?? '');
    setEditWorkIds(t.workIds.join(', '));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditSubtitle('');
    setEditWorkIds('');
  };

  const saveEdit = (id: string) => {
    const title = editTitle.trim();
    if (!title) {
      toast.error('기획전 제목을 입력해 주세요.');
      return;
    }
    curationStore.updateTheme(id, {
      title,
      subtitle: editSubtitle.trim() || undefined,
      workIds: parseWorkIds(editWorkIds),
    });
    cancelEdit();
    toast.success('기획전이 수정되었습니다.');
  };

  const removeTheme = async (t: ThemeExhibition) => {
    const ok = await openConfirm({
      title: `'${t.title}' 기획전을 삭제할까요?`,
      description: '삭제하면 둘러보기 피드의 해당 기획전 레이어가 즉시 비활성됩니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    curationStore.removeTheme(t.id);
    if (editingId === t.id) cancelEdit();
    toast.success('기획전이 삭제되었습니다.');
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
        둘러보기 피드 노출 순서: <strong>Pick → 기획전 → 추천 작가 → 신규(14일) → 일반</strong>. 여기서 기획전·추천 작가 레이어를 관리합니다. 기획전은 주제·맥락 단위로 다수 운영 가능 (Policy §15.1·15.4).
      </p>

      {/* 기획전 — 다수 운영 */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-3">기획전 ({themes.length}개 활성)</h2>

        {/* 활성 기획전 리스트 */}
        {themes.length === 0 ? (
          <div className="mb-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            아직 운영 중인 기획전이 없습니다. 아래에서 새 기획전을 추가하세요.
          </div>
        ) : (
          <ul className="mb-4 space-y-3">
            {themes.map((t) => {
              const isEditing = editingId === t.id;
              return (
                <li key={t.id} className="rounded-lg border border-border bg-white p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          placeholder="기획전 제목 *"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                        />
                        <input
                          placeholder="부제 (선택)"
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                        />
                      </div>
                      <textarea
                        placeholder="포함할 작품 ID (쉼표·공백·줄바꿈으로 구분)"
                        value={editWorkIds}
                        onChange={(e) => setEditWorkIds(e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => saveEdit(t.id)}
                          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white inline-flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          저장
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelEdit}
                          className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/50 inline-flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{t.title}</p>
                        {t.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          포함 작품 <strong className="text-foreground">{t.workIds.length}</strong>개
                          {t.workIds.length > 0 && (
                            <span className="ml-1 truncate inline-block max-w-[480px] align-bottom">
                              · {t.workIds.slice(0, 6).join(', ')}{t.workIds.length > 6 ? ` 외 ${t.workIds.length - 6}` : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/50 inline-flex items-center gap-1"
                          aria-label={`${t.title} 수정`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          onClick={() => removeTheme(t)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1"
                          aria-label={`${t.title} 삭제`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* 신규 추가 폼 */}
        <form
          onSubmit={addTheme}
          className="rounded-lg border border-border p-4 space-y-3 bg-muted/30"
        >
          <p className="text-sm font-semibold text-foreground">새 기획전 추가</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="기획전 제목 * (예: 봄 수채화 특집)"
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
            전시 ID는 전시 상세 URL `/exhibitions/:id`의 `:id`를 사용합니다. 브라우저 콘솔이나 workStore에서 확인 가능.
          </p>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              기획전 추가
            </Button>
          </div>
        </form>
      </section>

      {/* 추천 작가 */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">추천 작가 (피드 부스트)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          체크한 작가의 작품은 Pick/기획전 다음 우선순위로 노출됩니다. 현재 <strong>{featuredArtistIds.length}</strong>명 활성.
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
