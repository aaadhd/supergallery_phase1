import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { workStore, useWorkStore } from '../store';
import type { Work } from '../data';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { isWorkPublic } from '../utils/workVisibility';
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
  bannerImageUrl: string;
  workIds: string[];
};

const emptyDraft: PickDraft = {
  title: '',
  startAt: '',
  endAt: '',
  bannerImageUrl: '',
  workIds: [],
};

type PickSessionStatus = 'draft' | 'active' | 'scheduled' | 'ended';

function getPickStatus(e: PickSession): PickSessionStatus {
  if (!e.publicationOpen) return 'draft';
  const s = deriveStatus(e);
  if (s === 'ended') return 'ended';
  if (s === 'scheduled') return 'scheduled';
  return 'active';
}

const STATUS_LABEL: Record<PickSessionStatus, string> = {
  draft: '임시저장',
  active: '발행됨',
  scheduled: '발행 예정',
  ended: '종료됨',
};

const STATUS_COLOR: Record<PickSessionStatus, string> = {
  draft: 'bg-muted/60 text-muted-foreground border border-border',
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
      bannerImageUrl: '',
      startAt: today,
      endAt,
      selectedWorkIds: ids,
      publicationOpen: true,
      status: 'active',
    });
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* ignore */ }
}

/** 픽 세션 발행 — 이전 활성 세션 비활성화(이력 보존) 후 새 세션 활성화 */
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
        message: `작품 "${displayExhibitionTitle(work, '무제')}"이(가) Proud's Pick에 선정되었습니다.`,
        workId: wid,
      });
    }
  }
  pickStore.update(newSessionId, { publicationOpen: true, status: 'active' });
}

/** 픽 세션 게시 종료 — work.pick 플래그 해제, publicationOpen 유지(이력 보존), status='ended' */
function endPickSession(sessionId: string): void {
  const session = pickStore.get(sessionId);
  if (!session) return;
  for (const wid of session.selectedWorkIds ?? []) {
    workStore.updateWork(wid, { pick: false });
  }
  pickStore.update(sessionId, { status: 'ended' });
}

export default function PickManagement() {
  const allSessions = usePickSessions();
  useWorkStore();

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PickDraft>(emptyDraft);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    migrateLegacyPicks();
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  const works = workStore.getWorks();
  const worksById = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);

  const sessions = useMemo(
    () => [...allSessions].sort((a, b) => b.startAt.localeCompare(a.startAt)),
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
    setDraft(emptyDraft);
    setPickerSearch('');
  };

  const openEdit = (session: PickSession) => {
    setSelectedId(session.id);
    setDraft({
      title: session.title,
      startAt: session.startAt,
      endAt: session.endAt,
      bannerImageUrl: session.bannerImageUrl ?? '',
      workIds: session.selectedWorkIds ?? [],
    });
    setPickerSearch('');
  };

  const closePanel = () => {
    setSelectedId(null);
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
    bannerImageUrl: draft.bannerImageUrl.trim() || '',
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

  const doSave = () => {
    if (!validateDraft()) return;
    const payload = buildPayload();
    if (selectedId && selectedId !== 'new') {
      pickStore.update(selectedId, payload);
      appendAuditLog({ action: 'event_saved', targetId: selectedId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    } else {
      const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
      setSelectedId(created.id);
      appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    }
    toast.success('임시저장되었습니다.');
  };

  const saveDraft = (e: FormEvent) => { e.preventDefault(); doSave(); };

  const handlePublish = async () => {
    if (!validateDraft(true)) return;
    const hasOtherActive = sessions.some((e) => e.id !== selectedId && getPickStatus(e) === 'active');
    if (hasOtherActive) {
      const ok = await openConfirm({
        title: '현재 발행 중인 픽 세션이 있습니다',
        description: '기존 세션을 종료하고 새 세션을 발행합니다. 계속할까요?',
        confirmLabel: '발행',
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
    toast.success('발행되었습니다.');
  };

  const debouncedGallerySearch = useDebouncedValue(pickerSearch, 300);
  const galleryWorks = useMemo(() => {
    const q = debouncedGallerySearch.trim().toLowerCase();
    return works
      .filter(isWorkPublic)
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
          <div className="border-r border-border bg-muted/30 flex flex-col" style={{ minHeight: '72vh' }}>
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
          <div className="flex flex-col" style={{ minHeight: '72vh' }}>
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                세션을 선택하거나 새로 만드세요
              </div>
            ) : selectedId === 'new' ? (
              /* 신규 세션 생성 폼 */
              <div className="p-6 max-w-md">
                <h2 className="text-base font-bold mb-4">새 픽 세션</h2>
                <form onSubmit={saveDraft} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">제목 <span className="text-destructive">*</span></label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="5월 2주차 Proud's Pick"
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
                  <div>
                    <label className="block text-sm font-medium mb-1">배너 이미지 URL <span className="text-muted-foreground text-xs">(선택)</span></label>
                    <input
                      value={draft.bannerImageUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, bannerImageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={closePanel}
                      className="flex-1 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground lg:hover:bg-muted/50">
                      취소
                    </button>
                    <button type="submit"
                      className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium lg:hover:bg-primary/90">
                      저장 → 작품 선정으로
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* 기존 세션 편집 — 갤러리 + 하단 바 */
              (() => {
                const session = sessions.find((s) => s.id === selectedId);
                const isEnded = session ? getPickStatus(session) === 'ended' : false;
                return (
                  <>
                    {/* 갤러리 영역 */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <h2 className="text-sm font-bold flex-1 truncate">{draft.title}</h2>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          placeholder="작품·작가 검색…"
                          className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm w-48"
                        />
                      </div>
                      {!isEnded && (
                        <form onSubmit={saveDraft}>
                          <button type="submit"
                            className="border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground lg:hover:bg-muted/50">
                            정보 수정
                          </button>
                        </form>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                      {galleryWorks.length === 0 ? (
                        <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                      ) : (
                        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                          {galleryWorks.map((w) => {
                            const key = getCoverImage(w.image, w.coverImageIndex);
                            const src = imageUrls[key] || key;
                            const orderIdx = draft.workIds.indexOf(w.id);
                            const isSelected = orderIdx >= 0;
                            return (
                              <button
                                key={w.id}
                                type="button"
                                disabled={isEnded}
                                onClick={() => toggleWork(w)}
                                className={`group relative rounded-lg overflow-hidden border-2 transition-all disabled:pointer-events-none ${
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
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                  {displayExhibitionTitle(w, '')}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 하단 고정 바 */}
                    {!isEnded && (
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 shrink-0">
                        {draftWorks.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext items={draft.workIds} strategy={verticalListSortingStrategy}>
                              <div className="flex gap-1.5 overflow-x-auto">
                                {draftWorks.map((w) => {
                                  const key = getCoverImage(w.image, w.coverImageIndex);
                                  const src = imageUrls[key] || key;
                                  return (
                                    <PickBottomBarItem
                                      key={w.id}
                                      id={w.id}
                                      src={src}
                                      onRemove={() => removeWork(w.id)}
                                    />
                                  );
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <span className="text-slate-500 text-xs">갤러리에서 작품을 클릭해 선정하세요</span>
                        )}
                        <div className="text-violet-300 text-xs font-semibold shrink-0 ml-1">
                          {draft.workIds.length} / {MAX_PICKS}개
                        </div>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={doSave}
                          className="border border-slate-600 text-slate-300 rounded-md px-3 py-1.5 text-xs lg:hover:bg-slate-700"
                        >
                          임시저장
                        </button>
                        <button
                          type="button"
                          onClick={handlePublish}
                          className="bg-primary text-white rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-primary/90"
                        >
                          발행
                        </button>
                        {session && getPickStatus(session) === 'active' && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await openConfirm({ title: '게시 종료', description: '픽 세션을 종료하면 선정 작품의 픽 배지가 해제됩니다.', confirmLabel: '종료', destructive: true });
                              if (ok) endPickSession(selectedId);
                            }}
                            className="border border-red-800 text-red-400 rounded-md px-3 py-1.5 text-xs lg:hover:bg-red-900/30"
                          >
                            게시 종료
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
      className="relative w-10 h-10 rounded overflow-hidden border-2 border-violet-500 shrink-0 cursor-grab"
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
