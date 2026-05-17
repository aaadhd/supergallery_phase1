import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  curationStore,
  useCuration,
  type CuratedExhibition,
  type CurationPieceRef,
} from '../utils/curationStore';
import { workStore, useWorkStore } from '../store';
import { todayLocalIso } from '../utils/localDate';
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
import { AdminImageUpload } from './components/AdminImageUpload';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


/**
 * ADM-CUR-01 기획전 관리 (Policy v2.19, PRD v1.23 — piece 단위 큐레이션).
 * - 평면 갤러리 piece 선택 UX: 모든 이미지 한 그리드.
 * - 같은 전시 piece 다중 선택·다른 기획전과 다중 큐레이션 허용(AC-06).
 * - 비공개·검수 미통과 piece 추가 시도 시 경고 + 저장은 허용(AC-02 — 검수 통과 후 자연 노출).
 * - 저장 시 새로 추가된 piece의 작가에게 알림 발송(B-4c-5, Policy §15.2 정합).
 */

type CurationStatus = 'active' | 'scheduled' | 'ended';

function deriveCurationStatus(c: CuratedExhibition): CurationStatus {
  const today = todayLocalIso();
  if (today > c.endAt) return 'ended';
  if (today < c.startAt) return 'scheduled';
  return 'active';
}

const CURATION_STATUS_LABEL: Record<CurationStatus, string> = {
  active: '게시 중',
  scheduled: '게시 예정',
  ended: '게시 종료',
};

const CURATION_STATUS_COLOR: Record<CurationStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  scheduled: 'bg-amber-50 text-amber-800 border border-amber-200',
  ended: 'bg-muted/40 text-muted-foreground border border-border',
};

const CURATION_STATUS_ORDER: Record<CurationStatus, number> = {
  active: 0,
  scheduled: 1,
  ended: 2,
};

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
  pageUrl: string;
  bannerImageUrl: string;
  pieces: SelectedPiece[];
  search: string;
};

function emptyEditor(): EditorState {
  return { mode: 'create', title: '', subtitle: '', startAt: '', endAt: '', pageUrl: '', bannerImageUrl: '', pieces: [], search: '' };
}

function fromExhibition(c: CuratedExhibition): EditorState {
  return {
    mode: 'edit', editingId: c.id, title: c.title, subtitle: c.subtitle ?? '',
    startAt: c.startAt ?? '', endAt: c.endAt ?? '',
    pageUrl: c.pageUrl ?? '',
    bannerImageUrl: c.bannerImageUrl ?? '',
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
  const [editorStep, setEditorStep] = useState<1 | 2>(1);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    const tm = window.setTimeout(() => {
      setLoading(false);
      const curations = curationStore.getCuratedExhibitions()
        .sort((a, b) => CURATION_STATUS_ORDER[deriveCurationStatus(a)] - CURATION_STATUS_ORDER[deriveCurationStatus(b)]);
      if (curations.length > 0) {
        const first = curations[0];
        setEditor(fromExhibition(first));
        setSelectedCurationId(first.id);
        setEditorStep(2);
      }
    }, 200);
    return () => window.clearTimeout(tm);
  }, []);

  const allWorks = useMemo(() => workStore.getWorks(), [curatedExhibitions, editor]);

  const openCreate = () => {
    setEditor(emptyEditor());
    setSelectedCurationId('new');
    setEditorStep(1);
    setGalleryOpen(false);
  };

  const openEdit = (c: CuratedExhibition) => {
    setEditor(fromExhibition(c));
    setSelectedCurationId(c.id);
    setEditorStep(2);
    setGalleryOpen(false);
  };

  const closeEditor = () => {
    setEditor(null);
    setSelectedCurationId(null);
    setEditorStep(1);
    setGalleryOpen(false);
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

  const validateStep1 = (): boolean => {
    if (!editor) return false;
    if (!editor.title.trim()) { toast.error(t('admin.curation.errTitleRequired')); return false; }
    if (!editor.startAt.trim() || !editor.endAt.trim()) { toast.error('기획전 시작일과 종료일은 필수입니다.'); return false; }
    if (editor.startAt > editor.endAt) { toast.error('시작일이 종료일보다 늦을 수 없습니다.'); return false; }
    if (!editor.bannerImageUrl.trim()) { toast.error('기획전 대표 이미지를 등록해 주세요.'); return false; }
    const dup = curatedExhibitions.some(
      (c) => c.title.trim() === editor.title.trim() && (editor.mode === 'create' || c.id !== editor.editingId),
    );
    if (dup) { toast.error(t('admin.curation.errDuplicateTitle')); return false; }
    return true;
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
    if (!editor.startAt.trim() || !editor.endAt.trim()) {
      toast.error('기획전 시작일과 종료일은 필수입니다.');
      return;
    }
    if (editor.startAt > editor.endAt) {
      toast.error('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    if (!editor.bannerImageUrl.trim()) {
      toast.error('기획전 대표 이미지를 등록해 주세요.');
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

    const bannerImageUrl = editor.bannerImageUrl.trim();

    if (editor.mode === 'edit' && editor.editingId) {
      const original = curatedExhibitions.find((c) => c.id === editor.editingId);
      const beforeKeys = new Set((original?.pieces ?? []).map((p) => pieceKey(p)));
      curationStore.updateCuratedExhibition(editor.editingId, {
        title,
        subtitle: editor.subtitle.trim() || undefined,
        startAt: editor.startAt.trim(),
        endAt: editor.endAt.trim(),
        pageUrl: editor.pageUrl.trim() || undefined,
        pieces,
        bannerImageUrl,
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
        startAt: editor.startAt.trim(),
        endAt: editor.endAt.trim(),
        pageUrl: editor.pageUrl.trim() || undefined,
        pieces,
        bannerImageUrl,
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
    if (selectedCurationId === c.id) closeEditor();
    appendAuditLog({ action: 'curation_deleted', targetId: c.id, targetSnapshot: { title: c.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success(t('admin.curation.toastDeleted'));
  };

  const [hoverImg, setHoverImg] = useState<{ src: string; x: number; y: number } | null>(null);

  const allWorkGroups = useMemo(() => {
    const q = editor?.search.trim().toLowerCase() ?? '';
    return allWorks
      .filter(isWorkPublic)
      .filter((w) => {
        if (!q) return true;
        const title = (w.exhibitionName || w.title || '').toLowerCase();
        const artist = (w.artist?.name || '').toLowerCase();
        return title.includes(q) || artist.includes(q);
      })
      .map((w) => {
        const images = getWorkImages(w);
        const pieceIds = Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${w.id}_piece${i}`);
        return {
          work: w,
          pieces: images.map((imgKey, i): PieceItem => ({
            workId: w.id,
            pieceId: pieceIds[i] ?? `${w.id}_piece${i}`,
            imgKey,
            workTitle: displayExhibitionTitle(w, ''),
            isPublic: true,
          })),
        };
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
      <h1 className="text-xl font-bold mb-4 text-foreground">기획전 관리</h1>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>

          {/* 좌: 기획전 목록 */}
          <div className="border-r border-border bg-muted/30 flex flex-col" style={{ height: '72vh' }}>
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
              {[...curatedExhibitions]
                .sort((a, b) => CURATION_STATUS_ORDER[deriveCurationStatus(a)] - CURATION_STATUS_ORDER[deriveCurationStatus(b)])
                .map((c) => {
                const isSelected = selectedCurationId === c.id;
                const status = deriveCurationStatus(c);
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${CURATION_STATUS_COLOR[status]}`}>
                            {CURATION_STATUS_LABEL[status]}
                          </span>
                          <span className="text-xs text-muted-foreground">piece {c.pieces.length}개</span>
                        </div>
                        {c.startAt && c.endAt
                          ? <div className="text-[10px] text-muted-foreground/70 mt-0.5">{c.startAt.slice(5)} ~ {c.endAt.slice(5)}</div>
                          : <div className="text-[10px] text-amber-600 mt-0.5">날짜 미설정</div>
                        }
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
          <div className="flex flex-col overflow-hidden" style={{ height: '72vh' }}>
            {!editor ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                기획전을 선택하거나 새로 만드세요
              </div>
            ) : editorStep === 1 ? (
              /* 1단계: 기본 정보 */
              <div className="p-6 overflow-y-auto flex-1">
                <h2 className="text-base font-bold mb-5 text-foreground">
                  {editor.mode === 'create' ? '새 기획전' : '기획전 기본 정보'}
                </h2>
                <div className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">제목 <span className="text-destructive">*</span></label>
                      <input value={editor.title}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                        placeholder="봄의 기억들"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">부제</label>
                      <input value={editor.subtitle}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, subtitle: e.target.value } : prev)}
                        placeholder="봄을 담은 작품 모음"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">시작일 <span className="text-destructive">*</span></label>
                      <input type="date" value={editor.startAt}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, startAt: e.target.value } : prev)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">종료일 <span className="text-destructive">*</span></label>
                      <input type="date" value={editor.endAt}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, endAt: e.target.value } : prev)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">기획전 페이지 URL <span className="text-amber-600">※ 없으면 이벤트 탭 미노출</span></label>
                    <input
                      value={editor.pageUrl}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, pageUrl: e.target.value } : prev)}
                      placeholder="https://notion.so/... 또는 https://..."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <AdminImageUpload
                    label="기획전 대표 이미지"
                    required
                    value={editor.bannerImageUrl}
                    onChange={(url) => setEditor((prev) => prev ? { ...prev, bannerImageUrl: url } : prev)}
                  />
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={closeEditor}
                      className="flex-1 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground lg:hover:bg-muted/50">
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (validateStep1()) { setEditorStep(2); setGalleryOpen(true); } }}
                      className="flex-1 bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-medium lg:hover:bg-sky-700">
                      다음 → piece 선정
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 2단계: 리뷰 또는 갤러리 */
              <>
                {/* 헤더 */}
                <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                  {galleryOpen ? (
                    <button type="button" onClick={() => setGalleryOpen(false)}
                      className="text-xs text-muted-foreground lg:hover:text-foreground shrink-0">
                      ← 선택 목록
                    </button>
                  ) : (
                    <button type="button" onClick={() => setEditorStep(1)}
                      className="text-xs text-muted-foreground lg:hover:text-foreground shrink-0">
                      {editor.mode === 'create' ? '← 이전' : '← 기본 정보'}
                    </button>
                  )}
                  <span className="font-semibold text-sm flex-1 truncate text-foreground">
                    {editor.title || '(제목 없음)'}
                  </span>
                  {galleryOpen && (
                    <div className="relative shrink-0">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input value={editor.search}
                        onChange={(e) => setEditor((prev) => prev ? { ...prev, search: e.target.value } : prev)}
                        placeholder="전시·작가 검색…"
                        className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm w-40" />
                    </div>
                  )}
                </div>

                {/* 메인 콘텐츠: 리뷰 or 갤러리 */}
                {galleryOpen ? (
                  <div className="flex-1 overflow-y-auto p-3 bg-muted/10">
                    {allWorkGroups.length === 0 ? (
                      <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                    ) : (
                      <div className="space-y-1">
                        {allWorkGroups.map(({ work, pieces }) => (
                          <div key={work.id} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                            <div className="w-48 shrink-0 min-w-0">
                              <p className="text-sm font-medium truncate leading-tight">{displayExhibitionTitle(work, '(제목 없음)')}</p>
                              <p className="text-xs text-muted-foreground truncate">{work.artist?.name ?? work.groupName ?? '—'}</p>
                            </div>
                            <div className="flex gap-1 overflow-x-auto flex-1">
                              {pieces.map((piece) => {
                                const key = `${piece.workId}:${piece.pieceId}`;
                                const src = imageUrls[piece.imgKey] || piece.imgKey;
                                const orderIdx = editor.pieces.findIndex((p) => pieceKey(p) === key);
                                const isSelected = orderIdx >= 0;
                                return (
                                  <button key={key} type="button"
                                    onClick={() => togglePiece(piece.workId, piece.pieceId)}
                                    className={`relative w-14 h-14 shrink-0 rounded overflow-hidden border-2 transition-all ${
                                      isSelected ? 'border-sky-500 shadow-sm' : 'border-transparent lg:hover:border-sky-300'
                                    }`}
                                    onMouseEnter={(e) => {
                                      const r = e.currentTarget.getBoundingClientRect();
                                      let x = r.right + 8; let y = r.top + r.height / 2 - 120;
                                      if (x + 240 > window.innerWidth) x = r.left - 248;
                                      y = Math.max(8, Math.min(y, window.innerHeight - 248));
                                      setHoverImg({ src, x, y });
                                    }}
                                    onMouseLeave={() => setHoverImg(null)}
                                  >
                                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                                    {isSelected && (
                                      <div className="absolute top-0.5 right-0.5 bg-sky-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {orderIdx + 1}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 리뷰: 선정된 작품 목록 */
                  <div className="flex-1 overflow-y-auto p-3 bg-muted/10">
                    {editor.pieces.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 gap-2 text-sm text-muted-foreground">
                        <p>선정된 작품이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {editor.pieces.map((p, i) => {
                          const w = workStore.getWork(p.workId);
                          const images = w ? getWorkImages(w) : [];
                          const pieceIds = w && Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, idx) => `${p.workId}_piece${idx}`);
                          const pieceIdx = pieceIds.indexOf(p.pieceId);
                          const imgKey = images[pieceIdx] ?? '';
                          const src = imageUrls[imgKey] || imgKey;
                          return (
                            <div key={pieceKey(p)} className="relative aspect-square rounded-lg overflow-hidden border-2 border-sky-400/60">
                              <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 bg-sky-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {i + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 하단 고정 바 */}
                <div className="bg-sky-950 px-4 py-3 flex items-center gap-3 shrink-0">
                  {editor.pieces.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePieceDragEnd}>
                      <SortableContext items={editor.pieces.map(pieceKey)} strategy={horizontalListSortingStrategy}>
                        <div className="flex gap-1.5 overflow-x-auto">
                          {editor.pieces.map((p) => {
                            const w = workStore.getWork(p.workId);
                            const images = w ? getWorkImages(w) : [];
                            const pieceIds = w && Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${p.workId}_piece${i}`);
                            const idx = pieceIds.indexOf(p.pieceId);
                            const imgKey = images[idx] ?? '';
                            const src = imageUrls[imgKey] || imgKey;
                            const pKey = pieceKey(p);
                            return <CurationBottomBarItem key={pKey} id={pKey} src={src} onRemove={() => removeSelected(pKey)} />;
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <span className="text-sky-400 text-xs">작품을 선정하세요 <span className="text-red-400">(필수)</span></span>
                  )}
                  <div className="text-sky-300 text-xs font-semibold shrink-0 ml-1">
                    {editor.pieces.length}개 선정
                  </div>
                  <div className="flex-1" />
                  {galleryOpen ? (
                    <button type="button" onClick={saveEditor}
                      className="bg-sky-600 text-white rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-sky-700">
                      선택 완료
                    </button>
                  ) : (
                    <button type="button" onClick={() => setGalleryOpen(true)}
                      className="border border-sky-600 text-sky-300 rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-sky-900">
                      선택 수정
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* 호버 이미지 팝업 포털 */}
      {hoverImg && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg overflow-hidden shadow-xl border border-border"
          style={{ left: hoverImg.x, top: hoverImg.y, width: 240, height: 240 }}
        >
          <ImageWithFallback src={hoverImg.src} alt="" className="w-full h-full object-cover" />
        </div>,
        document.body,
      )}
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
