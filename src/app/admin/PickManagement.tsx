import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Plus, Search, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { workStore, useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import type { Work } from '../data';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { appendAuditLog } from '../utils/adminAuditLog';
import { openConfirm } from '../components/ConfirmDialog';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  pickStore,
  usePickSessions,
  derivePickStatus as deriveStatus,
  type PickSession,
} from '../utils/pickStore';
import { todayLocalIso } from '../utils/localDate';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_PICKS = 10;
const LEGACY_KEY = 'artier_admin_picks_v1';

type PickDraft = {
  title: string;
  startAt: string;
  endAt: string;
  workIds: string[];
};

const emptyDraft: PickDraft = {
  title: '',
  startAt: '',
  endAt: '',
  workIds: [],
};

type PickSessionStatus = 'active' | 'scheduled' | 'ended';

function getPickStatus(e: PickSession): PickSessionStatus {
  const s = deriveStatus(e);
  if (s === 'ended') return 'ended';
  if (s === 'scheduled') return 'scheduled';
  return 'active';
}

const STATUS_LABEL: Record<PickSessionStatus, string> = {
  active: '게시 중',
  scheduled: '게시 예정',
  ended: '게시 종료',
};

const STATUS_COLOR: Record<PickSessionStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  scheduled: 'bg-amber-50 text-amber-800 border border-amber-200',
  ended: 'bg-muted/40 text-muted-foreground border border-border',
};

/** artier_admin_picks_v1 → pickStore 1회 마이그레이션 */
function migrateLegacyPicks(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) { localStorage.removeItem(LEGACY_KEY); return; }
    const ids: string[] = (parsed as unknown[])
      .map((item) =>
        typeof item === 'string' ? item
          : item && typeof item === 'object' && 'id' in item
            ? String((item as { id: string }).id)
            : '',
      )
      .filter(Boolean);
    if (ids.length === 0) { localStorage.removeItem(LEGACY_KEY); return; }
    const today = todayLocalIso();
    const d = new Date(); d.setDate(d.getDate() + 7);
    const endAt = todayLocalIso(d);
    pickStore.add({
      title: '이전 픽 (마이그레이션)',
      description: '',
      startAt: today,
      endAt,
      selectedWorkIds: ids,
      publicationOpen: true,
      status: 'active',
    });
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* ignore */ }
}

/** 픽 세션 게시 — 이전 활성 세션 비활성화(이력 보존) 후 새 세션 활성화 */
function publishPickSession(newSessionId: string): void {
  const all = pickStore.getAll();
  for (const e of all) {
    if (e.id !== newSessionId && e.publicationOpen && deriveStatus(e) !== 'ended') {
      for (const wid of e.selectedWorkIds ?? []) {
        workStore.updateWork(wid, { pick: false });
      }
      pickStore.update(e.id, { status: 'ended' });
    }
  }
  const newSession = pickStore.get(newSessionId);
  if (!newSession) return;
  for (const wid of newSession.selectedWorkIds ?? []) {
    workStore.updateWork(wid, { pick: true, pickBadge: true });
    const work = workStore.getWorks().find((w) => w.id === wid);
    if (work) {
      pushDemoNotification({
        type: 'pick',
        message: `작품 "${displayExhibitionTitle(work, '(제목 없음)')}"이(가) Proud's Pick에 선정되었습니다.`,
        workId: wid,
      });
    }
  }
  pickStore.update(newSessionId, { publicationOpen: true, status: 'active' });
}


export default function PickManagement() {
  const allSessions = usePickSessions();
  useWorkStore();

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<1 | 2>(1);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [draft, setDraft] = useState<PickDraft>(emptyDraft);
  const [pickerSearch, setPickerSearch] = useState('');
  const [hoverImg, setHoverImg] = useState<{ src: string; x: number; y: number } | null>(null);
  const [modalImgs, setModalImgs] = useState<{ images: string[]; idx: number } | null>(null);

  useEffect(() => {
    migrateLegacyPicks();
    const t = window.setTimeout(() => {
      setLoading(false);
      const all = pickStore.getAll()
        .filter((s) => s.publicationOpen)
        .sort((a, b) => b.startAt.localeCompare(a.startAt));
      if (all.length > 0) {
        const first = all[0];
        setSelectedId(first.id);
        setDraft({ title: first.title, startAt: first.startAt, endAt: first.endAt, workIds: first.selectedWorkIds ?? [] });
      }
    }, 240);
    return () => window.clearTimeout(t);
  }, []);

  const works = workStore.getWorks();
  const worksById = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);

  const sessions = useMemo(
    () => [...allSessions]
      .filter((s) => s.publicationOpen)
      .sort((a, b) => b.startAt.localeCompare(a.startAt)),
    [allSessions],
  );

  const draftWorks = useMemo(
    () => draft.workIds.map((id) => worksById.get(id)).filter((w): w is Work => Boolean(w)),
    [draft.workIds, worksById],
  );
  const draftWorkIdSet = useMemo(() => new Set(draft.workIds), [draft.workIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openNew = () => {
    setSelectedId('new');
    setNewStep(1);
    setGalleryOpen(false);
    setDraft(emptyDraft);
    setPickerSearch('');
  };

  const openEdit = (session: PickSession) => {
    setSelectedId(session.id);
    setGalleryOpen(false);
    setDraft({
      title: session.title,
      startAt: session.startAt,
      endAt: session.endAt,
      workIds: session.selectedWorkIds ?? [],
    });
    setPickerSearch('');
  };

  const closePanel = () => {
    setSelectedId(null);
    setNewStep(1);
    setGalleryOpen(false);
    setDraft(emptyDraft);
    setPickerSearch('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = draft.workIds.indexOf(String(active.id));
    const newIdx = draft.workIds.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    setDraft((d) => ({ ...d, workIds: arrayMove(d.workIds, oldIdx, newIdx) }));
  };

  const addWork = (work: Work) => {
    if (draftWorkIdSet.has(work.id)) return;
    if (draft.workIds.length >= MAX_PICKS) {
      toast.error(`최대 ${MAX_PICKS}개까지 선정할 수 있습니다.`);
      return;
    }
    setDraft((d) => ({ ...d, workIds: [...d.workIds, work.id] }));
  };

  const removeWork = (workId: string) => {
    setDraft((d) => ({ ...d, workIds: d.workIds.filter((id) => id !== workId) }));
  };

  const toggleWork = (work: Work) => {
    if (draftWorkIdSet.has(work.id)) {
      removeWork(work.id);
    } else {
      addWork(work);
    }
  };

  const buildPayload = () => ({
    title: draft.title.trim(),
    startAt: draft.startAt,
    endAt: draft.endAt,
    selectedWorkIds: draft.workIds,
  });

  const validateDraft = (requireWorks = false): boolean => {
    if (!draft.title.trim()) { toast.error('제목을 입력해 주세요.'); return false; }
    if (!draft.startAt || !draft.endAt) { toast.error('기간을 입력해 주세요.'); return false; }
    if (draft.startAt > draft.endAt) { toast.error('시작일이 종료일보다 늦을 수 없습니다.'); return false; }
    if (requireWorks && draft.workIds.length === 0) { toast.error('선정 작품을 최소 1개 이상 추가해 주세요.'); return false; }
    return true;
  };

  const handlePublish = async () => {
    if (!validateDraft(true)) return;
    const hasOtherActive = sessions.some((e) => e.id !== selectedId && getPickStatus(e) === 'active');
    if (hasOtherActive) {
      const ok = await openConfirm({
        title: '현재 게시 중인 픽 세션이 있습니다',
        description: '기존 세션을 종료하고 새 세션을 게시합니다. 계속할까요?',
        confirmLabel: '게시',
      });
      if (!ok) return;
    }
    const payload = buildPayload();
    let targetId = (selectedId && selectedId !== 'new') ? selectedId : null;
    if (targetId) {
      pickStore.update(targetId, payload);
    } else {
      const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
      targetId = created.id;
      setSelectedId(targetId);
    }
    publishPickSession(targetId);
    appendAuditLog({ action: 'event_saved', targetId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('게시되었습니다.');
  };

  const debouncedGallerySearch = useDebouncedValue(pickerSearch, 300);
  const galleryWorks = useMemo(() => {
    const q = debouncedGallerySearch.trim().toLowerCase();
    return [...works]
      .filter(isWorkPublic)
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
      .filter((w) => {
        if (!q) return true;
        return (
          displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
          (w.artist?.name || '').toLowerCase().includes(q)
        );
      });
  }, [debouncedGallerySearch, works]);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">픽 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-1 text-foreground">픽 관리</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Proud's Pick 세션을 만들고 선정 작품을 관리합니다.
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>

          {/* 좌: 세션 목록 */}
          <div className="border-r border-border bg-muted/30 flex flex-col" style={{ height: '72vh' }}>
            <div className="p-3 border-b border-border flex justify-between items-center">
              <span className="text-sm font-semibold">픽 세션</span>
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-1 bg-primary text-white rounded-md px-2.5 py-1 text-xs font-medium lg:hover:bg-primary/90"
              >
                <Plus className="w-3 h-3" /> 새로
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {sessions.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">세션이 없습니다</div>
              )}
              {sessions.map((session) => {
                const status = getPickStatus(session);
                const isSelected = selectedId === session.id;
                const isEnded = status === 'ended';
                return (
                  <div
                    key={session.id}
                    className={`group relative border-b border-border/40 ${isEnded ? 'opacity-50' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(session)}
                      className={`w-full text-left px-3 py-3 pr-8 transition-colors ${
                        isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-medium text-sm truncate mb-1">{session.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <span>{session.startAt?.slice(5)} ~ {session.endAt?.slice(5)}</span>
                        <span>{(session.selectedWorkIds?.length ?? 0)}개</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await openConfirm({
                          title: '픽 세션 삭제',
                          description: `"${session.title}" 세션을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
                          confirmLabel: '삭제',
                          destructive: true,
                        });
                        if (!ok) return;
                        pickStore.remove(session.id);
                        appendAuditLog({ action: 'event_deleted', targetId: session.id, targetSnapshot: { title: session.title }, actorId: 'admin', actorRole: 'admin' });
                        if (selectedId === session.id) closePanel();
                        toast.success('픽 세션이 삭제되었습니다.');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 lg:hover:text-destructive lg:hover:bg-destructive/10 transition-opacity"
                      aria-label="세션 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우: 폼 또는 갤러리 */}
          <div className="flex flex-col overflow-hidden" style={{ height: '72vh' }}>
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                세션을 선택하거나 새로 만드세요
              </div>
            ) : selectedId === 'new' && newStep === 1 ? (
              /* 신규 세션 1단계: 기본 정보 입력 */
              <div className="p-6 max-w-md">
                <h2 className="text-base font-bold mb-4">새 픽 세션</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">제목 <span className="text-destructive">*</span></label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder={`${new Date().getMonth() + 1}월 ${Math.ceil(new Date().getDate() / 7)}주차 Proud's Pick`}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1">시작일 *</label>
                      <input type="date" value={draft.startAt}
                        onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <span className="mt-4 text-muted-foreground">~</span>
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1">종료일 *</label>
                      <input type="date" value={draft.endAt}
                        onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={closePanel}
                      className="flex-1 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground lg:hover:bg-muted/50">
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (validateDraft()) { setNewStep(2); setGalleryOpen(true); } }}
                      className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium lg:hover:bg-primary/90">
                      다음 → 작품 선정
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* step 2: 리뷰 또는 갤러리 */
              (() => {
                const session = sessions.find((s) => s.id === selectedId);
                const isEnded = session ? getPickStatus(session) === 'ended' : false;
                return (
                  <>
                    {/* 헤더 */}
                    <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                      {galleryOpen ? (
                        <button type="button" onClick={() => setGalleryOpen(false)}
                          className="text-xs text-muted-foreground lg:hover:text-foreground shrink-0">
                          ← 선택 목록
                        </button>
                      ) : selectedId === 'new' ? (
                        <button type="button" onClick={() => setNewStep(1)}
                          className="text-xs text-muted-foreground lg:hover:text-foreground shrink-0">
                          ← 이전
                        </button>
                      ) : null}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                          disabled={isEnded}
                          className="font-semibold text-sm bg-transparent border-b border-transparent focus:border-border focus:outline-none truncate disabled:cursor-default"
                        />
                        {!isEnded && (
                          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                            <input type="date" value={draft.startAt}
                              onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))}
                              className="border border-border rounded px-1.5 py-0.5 text-xs" />
                            <span>~</span>
                            <input type="date" value={draft.endAt}
                              onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))}
                              className="border border-border rounded px-1.5 py-0.5 text-xs" />
                          </div>
                        )}
                        {isEnded && (
                          <span className="text-xs text-muted-foreground shrink-0">{draft.startAt?.slice(5)} ~ {draft.endAt?.slice(5)}</span>
                        )}
                      </div>
                      {galleryOpen && (
                        <div className="relative shrink-0">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            placeholder="작품·작가 검색…"
                            className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm w-40"
                          />
                        </div>
                      )}
                    </div>

                    {/* 메인 콘텐츠: 리뷰 or 갤러리 */}
                    {galleryOpen ? (
                      <div className="flex-1 overflow-y-auto p-3 bg-muted/10">
                        {galleryWorks.length === 0 ? (
                          <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                        ) : (
                          <div className="space-y-1">
                            {galleryWorks.map((w) => {
                              const orderIdx = draft.workIds.indexOf(w.id);
                              const isSelected = orderIdx >= 0;
                              const imgs = (Array.isArray(w.image) ? w.image : [w.image])
                                .filter(Boolean)
                                .map((k: string) => imageUrls[k] || k);
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  disabled={isEnded}
                                  onClick={() => toggleWork(w)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 text-left transition-all disabled:pointer-events-none ${
                                    isSelected ? 'border-primary bg-primary/5' : 'border-transparent lg:hover:border-primary/20 lg:hover:bg-muted/30'
                                  }`}
                                >
                                  <div className="w-5 shrink-0 flex justify-center">
                                    {isSelected ? (
                                      <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{orderIdx + 1}</span>
                                    ) : (
                                      <span className="w-4 h-4 rounded-full border-2 border-border" />
                                    )}
                                  </div>
                                  <div className="w-48 shrink-0 min-w-0">
                                    <p className="text-sm font-medium truncate leading-tight">{displayExhibitionTitle(w, '(제목 없음)')}</p>
                                    <p className="text-xs text-muted-foreground truncate">{w.artist?.name || ''}</p>
                                  </div>
                                  <div className="flex gap-1 overflow-x-auto">
                                    {imgs.map((src, i) => (
                                      <div key={i} className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-muted"
                                        onMouseEnter={(e) => {
                                          e.stopPropagation();
                                          const r = e.currentTarget.getBoundingClientRect();
                                          let x = r.right + 8; let y = r.top + r.height / 2 - 120;
                                          if (x + 240 > window.innerWidth) x = r.left - 248;
                                          y = Math.max(8, Math.min(y, window.innerHeight - 248));
                                          setHoverImg({ src, x, y });
                                        }}
                                        onMouseLeave={(e) => { e.stopPropagation(); setHoverImg(null); }}
                                        onClick={(e) => { e.stopPropagation(); setModalImgs({ images: imgs, idx: i }); }}
                                      >
                                        <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 리뷰: 선정된 전시 목록 */
                      <div className="flex-1 overflow-y-auto p-3 bg-muted/10">
                        {draftWorks.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center h-full py-16 gap-2 text-sm text-muted-foreground">
                            <p>선정된 전시가 없습니다.</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {draftWorks.map((w, i) => {
                              const coverKey = getCoverImage(w.image, w.coverImageIndex);
                              const src = imageUrls[coverKey] || coverKey;
                              return (
                                <div key={w.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                                  <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                                  <div className="w-12 h-12 rounded overflow-hidden border border-border shrink-0">
                                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{displayExhibitionTitle(w, '(제목 없음)')}</p>
                                    <p className="text-xs text-muted-foreground truncate">{w.artist?.name || ''}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 하단 고정 바 */}
                    {!isEnded && (
                      <div className="bg-sky-950 px-4 py-3 flex items-center gap-3 shrink-0">
                        {draftWorks.length > 0 ? (
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={draft.workIds} strategy={verticalListSortingStrategy}>
                              <div className="flex gap-1.5 overflow-x-auto">
                                {draftWorks.map((w) => {
                                  const key = getCoverImage(w.image, w.coverImageIndex);
                                  const src = imageUrls[key] || key;
                                  return <PickBottomBarItem key={w.id} id={w.id} src={src} onRemove={() => removeWork(w.id)} />;
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <span className="text-sky-400 text-xs">전시를 선정하세요 <span className="text-red-400">(필수)</span></span>
                        )}
                        <div className="text-sky-300 text-xs font-semibold shrink-0 ml-1">
                          {draft.workIds.length}개 선정 / 최대 {MAX_PICKS}개
                        </div>
                        <div className="flex-1" />
                        {galleryOpen ? (
                          <button type="button" onClick={handlePublish}
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
                    )}
                  </>
                );
              })()
            )}
          </div>

        </div>
      </div>

      {hoverImg && createPortal(
        <div
          className="fixed z-50 pointer-events-none rounded-lg overflow-hidden shadow-2xl border border-border"
          style={{ left: hoverImg.x, top: hoverImg.y, width: 240, height: 240 }}
        >
          <ImageWithFallback src={hoverImg.src} alt="" className="w-full h-full object-cover" />
        </div>,
        document.body
      )}

      {modalImgs && createPortal(
        <WorkImageModal
          images={modalImgs.images}
          initialIdx={modalImgs.idx}
          onClose={() => setModalImgs(null)}
        />,
        document.body
      )}
    </div>
  );
}

function WorkImageModal({
  images,
  initialIdx,
  onClose,
}: {
  images: string[];
  initialIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-9 right-0 text-white/70 lg:hover:text-white text-sm"
        >
          닫기 ✕
        </button>
        <div className="rounded-xl overflow-hidden bg-black aspect-square">
          <ImageWithFallback src={images[idx]} alt="" className="w-full h-full object-contain" />
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white text-2xl rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/80"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white text-2xl rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/80"
            >
              ›
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === idx ? 'bg-white' : 'bg-white/40 lg:hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PickBottomBarItem({ id, src, onRemove }: { id: string; src: string; onRemove: () => void }) {
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
