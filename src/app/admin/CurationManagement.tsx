import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, X, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  curationStore,
  useCuration,
  type CuratedExhibition,
  type CurationPieceRef,
} from '../utils/curationStore';
import { workStore, useWorkStore } from '../store';
import { openConfirm } from '../components/ConfirmDialog';
import { isWorkPublic } from '../utils/workVisibility';
import { displayPieceTitleAtIndex, displayExhibitionTitle } from '../utils/workDisplay';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { useI18n } from '../i18n/I18nProvider';
import type { Work } from '../data';
import { appendAuditLog } from '../utils/adminAuditLog';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


/**
 * ADM-CUR-01 기획전 관리 (Policy v2.19, PRD v1.23 — piece 단위 큐레이션).
 * - 평면 갤러리 piece 선택 UX: 모든 이미지 한 그리드.
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
  startAt: string;
  endAt: string;
  pieces: SelectedPiece[];
  search: string;
};

function emptyEditor(): EditorState {
  return { mode: 'create', title: '', subtitle: '', startAt: '', endAt: '', pieces: [], search: '' };
}

function fromExhibition(c: CuratedExhibition): EditorState {
  return {
    mode: 'edit', editingId: c.id, title: c.title, subtitle: c.subtitle ?? '',
    startAt: c.startAt ?? '', endAt: c.endAt ?? '',
    pieces: c.pieces.map((p) => ({ workId: p.workId, pieceId: p.pieceId })),
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

type PieceItem = {
  workId: string;
  pieceId: string;
  imgKey: string;
  workTitle: string;
  isPublic: boolean;
};

export default function CurationManagement() {
  const { t } = useI18n();
  const { curatedExhibitions } = useCuration();
  useWorkStore(); // subscribe — 작품 변동 시 그리드 갱신

  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [selectedCurationId, setSelectedCurationId] = useState<string | null>(null);

  useEffect(() => {
    const tm = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(tm);
  }, []);

  const allWorks = useMemo(() => workStore.getWorks(), [curatedExhibitions, editor]);

  const openCreate = () => {
    setEditor(emptyEditor());
    setSelectedCurationId('new');
  };

  const openEdit = (c: CuratedExhibition) => {
    setEditor(fromExhibition(c));
    setSelectedCurationId(c.id);
  };

  const closeEditor = () => {
    setEditor(null);
    setSelectedCurationId(null);
  };

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

  const removeSelected = (key: string) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return { ...prev, pieces: prev.pieces.filter((p) => pieceKey(p) !== key) };
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handlePieceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditor((prev) => {
      if (!prev) return prev;
      const oldIdx = prev.pieces.findIndex((p) => pieceKey(p) === active.id);
      const newIdx = prev.pieces.findIndex((p) => pieceKey(p) === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return { ...prev, pieces: arrayMove(prev.pieces, oldIdx, newIdx) };
    });
  };

  const saveEditor = () => {
    if (!editor) return;
    const title = editor.title.trim();
    if (!title) {
      toast.error(t('admin.curation.errTitleRequired'));
      return;
    }
    if (editor.pieces.length === 0) {
      toast.error(t('admin.curation.errPieceRequired'));
      return;
    }
    // 같은 제목 중복 체크 (편집 모드는 본인 제외)
    const dup = curatedExhibitions.some(
      (c) => c.title.trim() === title && (editor.mode === 'create' || c.id !== editor.editingId),
    );
    if (dup) {
      toast.error(t('admin.curation.errDuplicateTitle'));
      return;
    }
    // 비공개·검수 미통과 piece 경고 (AC-02) — 저장은 허용
    const nonPublic = editor.pieces.filter((p) => {
      const w = workStore.getWork(p.workId);
      return !w || !isWorkPublic(w);
    });
    if (nonPublic.length > 0) {
      toast.warning(t('admin.curation.warnNonPublic').replace('{n}', String(nonPublic.length)));
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
        startAt: editor.startAt.trim() || undefined,
        endAt: editor.endAt.trim() || undefined,
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
      toast.success(t('admin.curation.toastUpdated'));
    } else {
      const created = curationStore.addCuratedExhibition({
        title,
        subtitle: editor.subtitle.trim() || undefined,
        startAt: editor.startAt.trim() || undefined,
        endAt: editor.endAt.trim() || undefined,
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
      toast.success(t('admin.curation.toastAdded'));
    }
    closeEditor();
  };

  const removeCuratedExhibition = async (c: CuratedExhibition) => {
    const ok = await openConfirm({
      title: t('admin.curation.confirmDelete').replace('{title}', c.title),
      description: t('admin.curation.confirmDeleteDesc'),
      destructive: true,
      confirmLabel: t('admin.curation.delete'),
    });
    if (!ok) return;
    curationStore.removeCuratedExhibition(c.id);
    appendAuditLog({ action: 'curation_deleted', targetId: c.id, targetSnapshot: { title: c.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success(t('admin.curation.toastDeleted'));
  };

  const allPieces = useMemo((): PieceItem[] => {
    const q = editor?.search.trim().toLowerCase() ?? '';
    return allWorks
      .filter((w) => {
        if (!q) return true;
        const title = (w.exhibitionName || w.title || '').toLowerCase();
        const artist = (w.artist?.name || '').toLowerCase();
        return title.includes(q) || artist.includes(q);
      })
      .flatMap((w) => {
        const images = getWorkImages(w);
        const pieceIds = Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${w.id}_piece${i}`);
        return images.map((imgKey, i) => ({
          workId: w.id,
          pieceId: pieceIds[i] ?? `${w.id}_piece${i}`,
          imgKey,
          workTitle: displayExhibitionTitle(w, ''),
          isPublic: isWorkPublic(w),
        }));
      });
  }, [allWorks, editor?.search]);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">{t('admin.curation.title')}</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">{t('admin.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-1 text-foreground">기획전 관리</h1>
      <p className="text-sm text-muted-foreground mb-4">
        테마 기획전을 만들고 개별 이미지(piece)를 큐레이션합니다.
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>

          {/* 좌: 기획전 목록 */}
          <div className="border-r border-border bg-muted/30 flex flex-col" style={{ minHeight: '72vh' }}>
            <div className="p-3 border-b border-border flex justify-between items-center">
              <span className="text-sm font-semibold">기획전</span>
              <button type="button" onClick={openCreate}
                className="inline-flex items-center gap-1 bg-sky-600 text-white rounded-md px-2.5 py-1 text-xs font-medium lg:hover:bg-sky-700">
                <Plus className="w-3 h-3" /> 새로
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {curatedExhibitions.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">기획전이 없습니다</div>
              )}
              {curatedExhibitions.map((c) => {
                const isSelected = selectedCurationId === c.id;
                const bannerWork = c.pieces[0]
                  ? workStore.getWork(c.pieces[0].workId) : null;
                const bannerKey = bannerWork ? getCoverImage(bannerWork.image, bannerWork.coverImageIndex) : '';
                const bannerSrc = bannerKey ? (imageUrls[bannerKey] || bannerKey) : '';
                return (
                  <div key={c.id} className={`w-full text-left flex gap-3 items-start px-3 py-3 border-b border-border/40 transition-colors ${
                    isSelected ? 'bg-sky-50 border-l-2 border-l-sky-600' : 'lg:hover:bg-muted/50'
                  }`}>
                    <button type="button" onClick={() => openEdit(c)} className="flex gap-3 items-start flex-1 min-w-0 text-left">
                      {bannerSrc ? (
                        <div className="w-10 h-10 rounded overflow-hidden border border-border shrink-0">
                          <ImageWithFallback src={bannerSrc} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{c.title}</div>
                        <div className="text-xs text-muted-foreground">piece {c.pieces.length}개</div>
                      </div>
                    </button>
                    <div className="flex shrink-0 gap-1 items-center">
                      <Link
                        to={`/curations/${c.id}`}
                        target="_blank"
                        className="h-6 w-6 inline-flex items-center justify-center rounded border border-border text-muted-foreground lg:hover:bg-muted/40 lg:hover:text-foreground"
                        aria-label="기획전 미리보기"
                        title="사용자 화면 보기"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeCuratedExhibition(c)}
                        className="h-6 w-6 inline-flex items-center justify-center rounded border border-red-200 text-red-700 lg:hover:bg-red-50"
                        aria-label={`${c.title} ${t('admin.curation.delete')}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우: 편집기 */}
          <div className="flex flex-col" style={{ minHeight: '72vh' }}>
            {!editor ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                기획전을 선택하거나 새로 만드세요
              </div>
            ) : (
              <>
                {/* 기획전 메타 + 검색 */}
                <div className="p-4 border-b border-border space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">제목 *</label>
                      <input value={editor.title}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                        placeholder="봄의 기억들"
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">부제</label>
                      <input value={editor.subtitle}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, subtitle: e.target.value } : prev)}
                        placeholder="봄을 담은 작품 모음"
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">시작일</label>
                      <input type="date" value={editor.startAt}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, startAt: e.target.value } : prev)}
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">종료일</label>
                      <input type="date" value={editor.endAt}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, endAt: e.target.value } : prev)}
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input value={editor.search}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, search: e.target.value } : prev)}
                      placeholder="전시·작가 검색…"
                      className="w-full pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm" />
                  </div>
                </div>

                {/* 평면 이미지 갤러리 */}
                <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                  {allPieces.length === 0 ? (
                    <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                      {allPieces.map((piece) => {
                        const key = `${piece.workId}:${piece.pieceId}`;
                        const src = imageUrls[piece.imgKey] || piece.imgKey;
                        const orderIdx = editor.pieces.findIndex((p) => pieceKey(p) === key);
                        const isSelected = orderIdx >= 0;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!piece.isPublic}
                            onClick={() => togglePiece(piece.workId, piece.pieceId)}
                            title={piece.workTitle}
                            className={`group relative rounded-lg overflow-hidden border-2 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                              isSelected ? 'border-primary shadow-md' : 'border-transparent lg:hover:border-primary/40'
                            }`}
                          >
                            <div className="aspect-square bg-muted">
                              <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {orderIdx + 1}
                              </div>
                            )}
                            {!piece.isPublic && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-[9px] font-medium">비공개</span>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                              {piece.workTitle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 하단 고정 바 */}
                <div className="bg-sky-950 px-4 py-3 flex items-center gap-3 shrink-0">
                  {editor.pieces.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePieceDragEnd}>
                      <SortableContext items={editor.pieces.map(pieceKey)} strategy={verticalListSortingStrategy}>
                        <div className="flex gap-1.5 overflow-x-auto">
                          {editor.pieces.map((p) => {
                            const w = workStore.getWork(p.workId);
                            const images = w ? getWorkImages(w) : [];
                            const pieceIds = w && Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${p.workId}_piece${i}`);
                            const idx = pieceIds.indexOf(p.pieceId);
                            const imgKey = images[idx] ?? '';
                            const src = imageUrls[imgKey] || imgKey;
                            const pKey = pieceKey(p);
                            return (
                              <CurationBottomBarItem
                                key={pKey}
                                id={pKey}
                                src={src}
                                onRemove={() => removeSelected(pKey)}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <span className="text-sky-400 text-xs">갤러리에서 이미지를 클릭해 piece를 선정하세요</span>
                  )}
                  <div className="text-sky-300 text-xs font-semibold shrink-0 ml-1">
                    {editor.pieces.length}개 선정
                  </div>
                  <div className="flex-1" />
                  <button type="button" onClick={closeEditor}
                    className="border border-sky-700 text-sky-300 rounded-md px-3 py-1.5 text-xs lg:hover:bg-sky-900">
                    취소
                  </button>
                  <button type="button" onClick={saveEditor}
                    className="bg-sky-600 text-white rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-sky-700">
                    게시
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function CurationBottomBarItem({ id, src, onRemove }: { id: string; src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative w-10 h-10 rounded overflow-hidden border-2 border-sky-400 shrink-0 cursor-grab"
    >
      <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        className="absolute top-0 right-0 bg-black/60 text-white rounded-bl text-[8px] px-0.5 leading-none lg:hover:bg-red-600"
      >
        ✕
      </button>
    </div>
  );
}
