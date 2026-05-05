import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Pencil, Check, X, Search, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  curationStore,
  useCuration,
  type CuratedExhibition,
  type CurationPieceRef,
} from '../utils/curationStore';
import { artists } from '../data';
import { workStore, useWorkStore } from '../store';
import { openConfirm } from '../components/ConfirmDialog';
import { isWorkPublic } from '../utils/workVisibility';
import { displayPieceTitleAtIndex, displayExhibitionTitle } from '../utils/workDisplay';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { useI18n } from '../i18n/I18nProvider';
import type { Work } from '../data';
import { appendAuditLog } from '../utils/adminAuditLog';

/**
 * ADM-CUR-01 기획전 관리 (Policy v2.19, PRD v1.23 — piece 단위 큐레이션).
 * - 2단계 piece 선택 UX: 전시 그리드 → piece sub 그리드.
 * - 단일 이미지 전시는 클릭 한 번으로 piece 자동 선택(AC-05).
 * - 같은 전시 piece 다중 선택·다른 기획전과 다중 큐레이션 허용(AC-06).
 * - 비공개·검수 미통과 piece 추가 시도 시 경고 + 저장은 허용(AC-02 — 검수 통과 후 자연 노출).
 * - 저장 시 새로 추가된 piece의 작가에게 알림 발송(B-4c-5, Policy §15.2 정합).
 */

type SelectedPiece = CurationPieceRef & {
  workId: string;
  pieceId: string;
};

type EditorState = {
  mode: 'create' | 'edit';
  editingId?: string;
  title: string;
  subtitle: string;
  pieces: SelectedPiece[];
  /** 어떤 전시 카드가 펼쳐져 piece sub 그리드를 보여줄지 */
  expandedWorkId: string | null;
  search: string;
};

function emptyEditor(): EditorState {
  return { mode: 'create', title: '', subtitle: '', pieces: [], expandedWorkId: null, search: '' };
}

function fromExhibition(c: CuratedExhibition): EditorState {
  return {
    mode: 'edit',
    editingId: c.id,
    title: c.title,
    subtitle: c.subtitle ?? '',
    pieces: c.pieces.map((p) => ({ workId: p.workId, pieceId: p.pieceId })),
    expandedWorkId: null,
    search: '',
  };
}

function pieceKey(p: { workId: string; pieceId: string }): string {
  return `${p.workId}:${p.pieceId}`;
}

function getWorkImages(w: Work): string[] {
  return Array.isArray(w.image) ? w.image : [w.image];
}

function pushCurationSelectedNotification(
  artistId: string | undefined,
  pieceTitle: string,
  curationTitle: string,
  template: string,
  workId: string,
  curationId: string,
) {
  if (!artistId) return;
  const message = template
    .replace('{pieceTitle}', pieceTitle)
    .replace('{curationTitle}', curationTitle);
  pushDemoNotification({
    type: 'curation',
    message,
    workId,
    curationId,
    fromUser: { name: '운영팀', avatar: '', id: 'admin' },
    demo: false,
  });
}

export default function CurationManagement() {
  const { t } = useI18n();
  const { curatedExhibitions, featuredArtistIds } = useCuration();
  useWorkStore(); // subscribe — 작품 변동 시 그리드 갱신

  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const isEditorOpen = editor !== null;

  useEffect(() => {
    const tm = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(tm);
  }, []);

  const allWorks = useMemo(() => workStore.getWorks(), [curatedExhibitions, editor]);
  const filteredWorks = useMemo(() => {
    const q = editor?.search.trim().toLowerCase() ?? '';
    if (!q) return allWorks;
    return allWorks.filter((w) => {
      const title = (w.exhibitionName || w.title || '').toLowerCase();
      const artist = (w.artist?.name || '').toLowerCase();
      return w.id.includes(q) || title.includes(q) || artist.includes(q);
    });
  }, [allWorks, editor?.search]);

  const openCreate = () => setEditor(emptyEditor());
  const openEdit = (c: CuratedExhibition) => setEditor(fromExhibition(c));
  const closeEditor = () => setEditor(null);

  const togglePiece = (workId: string, pieceId: string) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const key = pieceKey({ workId, pieceId });
      const exists = prev.pieces.some((p) => pieceKey(p) === key);
      const pieces = exists
        ? prev.pieces.filter((p) => pieceKey(p) !== key)
        : [...prev.pieces, { workId, pieceId }];
      return { ...prev, pieces };
    });
  };

  const movePiece = (key: string, dir: -1 | 1) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const idx = prev.pieces.findIndex((p) => pieceKey(p) === key);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.pieces.length) return prev;
      const next = [...prev.pieces];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...prev, pieces: next };
    });
  };

  const removeSelected = (key: string) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return { ...prev, pieces: prev.pieces.filter((p) => pieceKey(p) !== key) };
    });
  };

  const handleExpand = (workId: string) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return { ...prev, expandedWorkId: prev.expandedWorkId === workId ? null : workId };
    });
  };

  const saveEditor = () => {
    if (!editor) return;
    const title = editor.title.trim();
    if (!title) {
      toast.error('기획전 제목을 입력해 주세요.');
      return;
    }
    if (editor.pieces.length === 0) {
      toast.error('포함할 작품을 1점 이상 선택해 주세요.');
      return;
    }
    // 같은 제목 중복 체크 (편집 모드는 본인 제외)
    const dup = curatedExhibitions.some(
      (c) => c.title.trim() === title && (editor.mode === 'create' || c.id !== editor.editingId),
    );
    if (dup) {
      toast.error('같은 제목의 기획전이 이미 있어요.');
      return;
    }
    // 비공개·검수 미통과 piece 경고 (AC-02) — 저장은 허용
    const nonPublic = editor.pieces.filter((p) => {
      const w = workStore.getWork(p.workId);
      return !w || !isWorkPublic(w);
    });
    if (nonPublic.length > 0) {
      toast.warning(
        `비공개·검수 미통과 작품 ${nonPublic.length}점이 포함되었어요. 검수 통과 시 자동으로 기획전 페이지에 노출됩니다.`,
      );
    }

    // 저장 + 새 piece 알림 발송
    const pieces: CurationPieceRef[] = editor.pieces.map((p) => ({ workId: p.workId, pieceId: p.pieceId }));
    const template = t('notif.curationSelected');
    const untitled = t('work.untitled');

    if (editor.mode === 'edit' && editor.editingId) {
      const original = curatedExhibitions.find((c) => c.id === editor.editingId);
      const beforeKeys = new Set((original?.pieces ?? []).map((p) => pieceKey(p)));
      curationStore.updateCuratedExhibition(editor.editingId, {
        title,
        subtitle: editor.subtitle.trim() || undefined,
        pieces,
      });
      // 새로 추가된 piece만 알림
      for (const p of pieces) {
        if (beforeKeys.has(pieceKey(p))) continue;
        const w = workStore.getWork(p.workId);
        if (!w) continue;
        const ids = w.imagePieceIds ?? [];
        const idx = ids.indexOf(p.pieceId);
        if (idx < 0) continue;
        const pieceTitle = displayPieceTitleAtIndex(w, idx, untitled);
        pushCurationSelectedNotification(w.artistId, pieceTitle, title, template, p.workId, editor.editingId);
      }
      appendAuditLog({ action: 'curation_saved', targetId: editor.editingId, targetSnapshot: { title, pieceCount: pieces.length }, actorId: 'admin', actorRole: 'admin' });
      toast.success('기획전이 수정되었습니다.');
    } else {
      const created = curationStore.addCuratedExhibition({
        title,
        subtitle: editor.subtitle.trim() || undefined,
        pieces,
      });
      // 모든 piece가 새로 추가됨
      for (const p of pieces) {
        const w = workStore.getWork(p.workId);
        if (!w) continue;
        const ids = w.imagePieceIds ?? [];
        const idx = ids.indexOf(p.pieceId);
        if (idx < 0) continue;
        const pieceTitle = displayPieceTitleAtIndex(w, idx, untitled);
        pushCurationSelectedNotification(w.artistId, pieceTitle, title, template, p.workId, created.id);
      }
      appendAuditLog({ action: 'curation_saved', targetId: created.id, targetSnapshot: { title, pieceCount: pieces.length }, actorId: 'admin', actorRole: 'admin' });
      toast.success('기획전이 추가되었습니다.');
    }
    closeEditor();
  };

  const removeCuratedExhibition = async (c: CuratedExhibition) => {
    const ok = await openConfirm({
      title: `'${c.title}' 기획전을 삭제할까요?`,
      description: '삭제하면 [USR-CUR-01] 기획전 페이지에서 즉시 사라집니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    curationStore.removeCuratedExhibition(c.id);
    appendAuditLog({ action: 'curation_deleted', targetId: c.id, targetSnapshot: { title: c.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('기획전이 삭제되었습니다.');
  };

  const toggleFeatured = (artistId: string) => curationStore.toggleFeaturedArtist(artistId);

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
        둘러보기 피드 노출 순서: <strong>Pick → 추천 작가 → 팔로잉 → 신규(14일) → 일반</strong>. 기획전은 [USR-CUR-01] 기획전 페이지에서만 작품(piece) 단위로 노출되며 일반 피드 부스트 대상이 아닙니다(Policy §15.1).
      </p>

      {/* 기획전 목록 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">기획전 ({curatedExhibitions.length}개)</h2>
          {!isEditorOpen && (
            <Button
              type="button"
              onClick={openCreate}
              className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />새 기획전
            </Button>
          )}
        </div>

        {curatedExhibitions.length === 0 ? (
          <div className="mb-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            아직 운영 중인 기획전이 없습니다. 새 기획전을 추가하세요.
          </div>
        ) : (
          <ul className="mb-4 space-y-3">
            {curatedExhibitions.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    {c.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{c.subtitle}</p>}
                    <p className="text-xs text-muted-foreground mt-1">포함 piece <strong className="text-foreground">{c.pieces.length}</strong>개</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      onClick={() => openEdit(c)}
                      disabled={isEditorOpen}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/50 inline-flex items-center gap-1 disabled:opacity-50"
                      aria-label={`${c.title} 수정`}
                    >
                      <Pencil className="w-3.5 h-3.5" />수정
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeCuratedExhibition(c)}
                      disabled={isEditorOpen}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1 disabled:opacity-50"
                      aria-label={`${c.title} 삭제`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />삭제
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 편집 패널 */}
      {editor && (
        <section className="mb-10 rounded-lg border-2 border-primary/30 bg-primary/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              {editor.mode === 'create' ? '새 기획전 추가' : '기획전 수정'}
            </h3>
            <button
              type="button"
              onClick={closeEditor}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />닫기
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input
              placeholder="기획전 제목 *"
              value={editor.title}
              onChange={(e) => setEditor((prev) => prev && { ...prev, title: e.target.value })}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="부제 (선택)"
              value={editor.subtitle}
              onChange={(e) => setEditor((prev) => prev && { ...prev, subtitle: e.target.value })}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 좌: 전시 그리드 → piece sub 그리드 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="전시·작가·ID 검색"
                  value={editor.search}
                  onChange={(e) => setEditor((prev) => prev && { ...prev, search: e.target.value })}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-white"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                전시를 클릭해서 piece(작품 1장)를 골라 주세요. 다중 이미지 전시는 펼쳐서 piece별로 체크.
              </p>
              <ul className="max-h-[480px] overflow-auto rounded-lg border border-border bg-white divide-y divide-border/60">
                {filteredWorks.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">검색 결과가 없어요.</li>
                ) : (
                  filteredWorks.map((w) => {
                    const images = getWorkImages(w);
                    const pieceIds = w.imagePieceIds ?? [];
                    const isExpanded = editor.expandedWorkId === w.id;
                    const isSingle = images.length === 1 && pieceIds.length === 1;
                    const exhTitle = displayExhibitionTitle(w, t('work.untitled'));
                    const isPublic = isWorkPublic(w);
                    const selectedFromThisWork = editor.pieces.filter((p) => p.workId === w.id).length;
                    return (
                      <li key={w.id}>
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSingle && pieceIds[0]) {
                                togglePiece(w.id, pieceIds[0]);
                              } else {
                                handleExpand(w.id);
                              }
                            }}
                            className="flex-1 min-w-0 flex items-center gap-3 text-left lg:hover:bg-muted/40 rounded-md px-1 py-1"
                          >
                            <img src={images[0]} alt="" className="h-12 w-12 rounded object-cover border border-border" loading="lazy" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{exhTitle}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {w.artist?.name} · {images.length}장 · ID {w.id}
                                {!isPublic && <span className="ml-1 text-amber-600">(비공개·검수 미통과)</span>}
                              </p>
                            </div>
                            {selectedFromThisWork > 0 && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                선택 {selectedFromThisWork}점
                              </span>
                            )}
                          </button>
                        </div>
                        {isExpanded && pieceIds.length > 1 && (
                          <div className="px-3 pb-3 grid grid-cols-3 sm:grid-cols-4 gap-2 bg-muted/20">
                            {images.map((src, i) => {
                              const pid = pieceIds[i];
                              if (!pid) return null;
                              const checked = editor.pieces.some((p) => p.workId === w.id && p.pieceId === pid);
                              return (
                                <label
                                  key={pid}
                                  className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-colors ${checked ? 'border-primary' : 'border-transparent hover:border-border'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePiece(w.id, pid)}
                                    className="sr-only"
                                  />
                                  <img src={src} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{i + 1}</span>
                                  {checked && (
                                    <span className="absolute top-1 right-1 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* 우: 선택된 piece 리스트 + 순서 */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                선택된 작품 <strong className="text-primary">{editor.pieces.length}</strong>점
              </p>
              <ul className="max-h-[480px] overflow-auto rounded-lg border border-border bg-white divide-y divide-border/60">
                {editor.pieces.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">왼쪽에서 작품을 골라 주세요.</li>
                ) : (
                  editor.pieces.map((p, idx) => {
                    const w = workStore.getWork(p.workId);
                    if (!w) {
                      return (
                        <li key={pieceKey(p)} className="px-3 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          삭제된 작품 (ID {p.workId})
                          <button onClick={() => removeSelected(pieceKey(p))} className="ml-auto text-red-700">제거</button>
                        </li>
                      );
                    }
                    const images = getWorkImages(w);
                    const pieceIdx = (w.imagePieceIds ?? []).indexOf(p.pieceId);
                    const src = images[pieceIdx] ?? images[0];
                    const pieceTitle = displayPieceTitleAtIndex(w, pieceIdx, t('work.untitled'));
                    const isPublic = isWorkPublic(w);
                    return (
                      <li key={pieceKey(p)} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="shrink-0 w-6 text-xs text-muted-foreground tabular-nums">{idx + 1}</span>
                        <img src={src} alt="" className="h-12 w-12 rounded object-cover border border-border" loading="lazy" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{pieceTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {w.artist?.name} · {displayExhibitionTitle(w, t('work.untitled'))}
                            {!isPublic && <span className="ml-1 text-amber-600">(비공개)</span>}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePiece(pieceKey(p), -1)}
                            disabled={idx === 0}
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-border lg:hover:bg-muted/40 disabled:opacity-30"
                            aria-label="위로"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePiece(pieceKey(p), 1)}
                            disabled={idx === editor.pieces.length - 1}
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-border lg:hover:bg-muted/40 disabled:opacity-30"
                            aria-label="아래로"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSelected(pieceKey(p))}
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-red-200 text-red-700 lg:hover:bg-red-50"
                            aria-label="제거"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              onClick={saveEditor}
              className="text-sm px-4 py-2 rounded-lg bg-primary text-white inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editor.mode === 'create' ? '기획전 추가' : '저장'}
            </Button>
            <Button
              type="button"
              onClick={closeEditor}
              className="text-sm px-4 py-2 rounded-lg border border-border text-foreground lg:hover:bg-muted/50 inline-flex items-center gap-1.5"
            >
              취소
            </Button>
          </div>
        </section>
      )}

      {/* 추천 작가 */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">추천 작가 (피드 부스트)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          체크한 작가의 작품은 피드 추천 영역에서 부스트됩니다. 현재 <strong>{featuredArtistIds.length}</strong>명 활성.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {artists.map((a) => {
            const active = featuredSet.has(a.id);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  active ? 'border-primary bg-primary/5' : 'border-border lg:hover:bg-muted/40'
                }`}
              >
                <input type="checkbox" checked={active} onChange={() => toggleFeatured(a.id)} className="h-4 w-4" />
                <img src={a.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-border" loading="lazy" />
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
