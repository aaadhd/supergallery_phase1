import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { GripVertical, Plus, Search, X, ChevronDown, Star, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { workStore, useWorkStore } from '../store';
import type { Work } from '../data';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { getThumbCover } from '../utils/imageHelper';
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
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PickDraft>(emptyDraft);
  const [showWorkPicker, setShowWorkPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

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

  const activeSessions = useMemo(
    () => sessions.filter((e) => getPickStatus(e) !== 'ended'),
    [sessions],
  );
  const historySessions = useMemo(
    () => sessions.filter((e) => getPickStatus(e) === 'ended'),
    [sessions],
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

  const debouncedPickerSearch = useDebouncedValue(pickerSearch, 300);
  const pickerResults = useMemo(() => {
    const q = debouncedPickerSearch.trim().toLowerCase();
    return works
      .filter((w) => isWorkPublic(w) && !draftWorkIdSet.has(w.id))
      .filter((w) => {
        if (!q) return true;
        return (
          displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
          (w.artist?.name || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [debouncedPickerSearch, works, draftWorkIdSet]);

  const openNew = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowWorkPicker(false);
    setPickerSearch('');
    setShowEditor(true);
  };

  const openEdit = (session: PickSession) => {
    setEditingId(session.id);
    setDraft({
      title: session.title,
      startAt: session.startAt,
      endAt: session.endAt,
      bannerImageUrl: session.bannerImageUrl ?? '',
      workIds: session.selectedWorkIds ?? [],
    });
    setShowWorkPicker(false);
    setPickerSearch('');
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setShowWorkPicker(false);
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

  const saveDraft = (e: FormEvent) => {
    e.preventDefault();
    if (!validateDraft()) return;
    const payload = buildPayload();
    if (editingId) {
      pickStore.update(editingId, payload);
      appendAuditLog({ action: 'event_saved', targetId: editingId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    } else {
      const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
      setEditingId(created.id);
      appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    }
    toast.success('임시저장되었습니다.');
  };

  const handlePublish = async () => {
    if (!validateDraft(true)) return;
    const hasOtherActive = sessions.some((e) => e.id !== editingId && getPickStatus(e) === 'active');
    if (hasOtherActive) {
      const ok = await openConfirm({
        title: '현재 발행 중인 픽 세션이 있습니다',
        description: '기존 세션을 종료하고 새 세션을 발행합니다. 계속할까요?',
        confirmLabel: '발행',
      });
      if (!ok) return;
    }
    const payload = buildPayload();
    let targetId = editingId;
    if (targetId) {
      pickStore.update(targetId, payload);
    } else {
      const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
      targetId = created.id;
    }
    publishPickSession(targetId);
    appendAuditLog({ action: 'event_saved', targetId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('발행되었습니다.');
    closeEditor();
  };

  const handleEndSession = async (session: PickSession) => {
    const ok = await openConfirm({
      title: `"${session.title}" 세션을 종료할까요?`,
      description: '작품의 활성 Pick이 해제됩니다. Pick 배지(이력)는 유지됩니다.',
      confirmLabel: '게시 종료',
      destructive: true,
    });
    if (!ok) return;
    endPickSession(session.id);
    appendAuditLog({ action: 'event_saved', targetId: session.id, targetSnapshot: { title: session.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('게시 종료되었습니다.');
  };

  const handleDeleteSession = async (session: PickSession) => {
    const ok = await openConfirm({
      title: `"${session.title}" 세션을 삭제할까요?`,
      description: '삭제된 픽 세션은 복구할 수 없습니다.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    if (session.publicationOpen) endPickSession(session.id);
    pickStore.remove(session.id);
    appendAuditLog({ action: 'event_deleted', targetId: session.id, targetSnapshot: { title: session.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('삭제되었습니다.');
    if (editingId === session.id) closeEditor();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">Proud&apos;s Pick 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-xl font-bold text-foreground">Proud&apos;s Pick 관리</h1>
        {!showEditor && (
          <Button
            type="button"
            onClick={openNew}
            className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            새 픽 만들기
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        픽 세션에 제목과 기간을 설정하고 작품을 선정합니다. 발행 시 홈 배너에 노출되고 선정 작가에게 알림이 발송됩니다.
      </p>

      {/* ───── 에디터 ───── */}
      {showEditor && (
        <form onSubmit={saveDraft} className="mb-8 border border-border rounded-xl p-5 space-y-5 bg-muted/30">
          <p className="text-sm font-semibold text-foreground">
            {editingId ? 'Pick 세션 편집' : '새 Pick 세션'}
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="세션 제목 * (예: 5월 둘째주 Proud's Pick)"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              시작일 *
              <input
                type="date"
                value={draft.startAt}
                onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              종료일 *
              <input
                type="date"
                value={draft.endAt}
                onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              />
            </label>
            <input
              placeholder="배너 이미지 URL (선택 — Events 페이지 표시용)"
              value={draft.bannerImageUrl}
              onChange={(e) => setDraft((d) => ({ ...d, bannerImageUrl: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
          </div>

          {/* 선정 작품 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">
                선정 작품
                <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  draft.workIds.length >= MAX_PICKS
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {draft.workIds.length} / {MAX_PICKS}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowWorkPicker((v) => !v)}
                disabled={draft.workIds.length >= MAX_PICKS}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-white lg:hover:bg-muted/40 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                작품 추가
              </button>
            </div>

            {draftWorks.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={draft.workIds} strategy={verticalListSortingStrategy}>
                  <ol className="border border-border rounded-lg divide-y divide-border/50 bg-white">
                    {draftWorks.map((work, idx) => (
                      <SortablePickWorkItem
                        key={work.id}
                        work={work}
                        index={idx}
                        onRemove={() => removeWork(work.id)}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="border border-dashed border-border rounded-lg py-8 text-center text-sm text-muted-foreground bg-white">
                작품 추가 버튼으로 선정 작품을 추가하세요
              </div>
            )}

            {/* 작품 피커 */}
            {showWorkPicker && (
              <div className="mt-3 border border-border rounded-lg bg-white overflow-hidden">
                <div className="p-3 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="작품명 또는 작가명으로 검색"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                  {pickerResults.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {pickerSearch ? '검색 결과가 없습니다.' : '검색어를 입력하세요.'}
                    </p>
                  ) : (
                    pickerResults.map((work) => (
                      <button
                        key={work.id}
                        type="button"
                        onClick={() => addWork(work)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 lg:hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                          <ImageWithFallback
                            src={getThumbCover(work)}
                            alt={displayExhibitionTitle(work, '무제')}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {displayExhibitionTitle(work, '무제')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {work.artist?.name || '작가 미상'}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
            <Button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg border border-border bg-white text-foreground lg:hover:bg-muted/40"
            >
              임시저장
            </Button>
            <button
              type="button"
              onClick={handlePublish}
              className="text-sm px-4 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90"
            >
              발행
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* ───── 현재 세션 ───── */}
      {activeSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">현재 세션</h2>
          <div className="space-y-3">
            {activeSessions.map((session) => {
              const status = getPickStatus(session);
              const workCount = session.selectedWorkIds?.length ?? 0;
              const sessionWorks = (session.selectedWorkIds ?? [])
                .slice(0, 5)
                .map((id) => worksById.get(id))
                .filter((w): w is Work => Boolean(w));
              return (
                <div
                  key={session.id}
                  className="border border-border rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{session.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {session.startAt} ~ {session.endAt}
                      </span>
                      <span>선정 작품 {workCount}개</span>
                    </div>
                    {sessionWorks.length > 0 && (
                      <div className="flex gap-1.5">
                        {sessionWorks.map((w) => (
                          <div key={w.id} className="w-9 h-9 rounded-md overflow-hidden bg-muted border border-border/50 shrink-0">
                            <ImageWithFallback
                              src={getThumbCover(w)}
                              alt={displayExhibitionTitle(w, '')}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {workCount > 5 && (
                          <div className="w-9 h-9 rounded-md bg-muted border border-border/50 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                            +{workCount - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openEdit(session)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground bg-white lg:hover:bg-muted/40 whitespace-nowrap"
                    >
                      편집
                    </button>
                    {status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleEndSession(session)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground bg-white lg:hover:bg-muted/40 whitespace-nowrap"
                      >
                        게시 종료
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(session)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 whitespace-nowrap"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ───── 이전 픽 이력 ───── */}
      {historySessions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">이전 픽 이력</h2>
          <div className="space-y-2">
            {historySessions.map((session) => {
              const workCount = session.selectedWorkIds?.length ?? 0;
              const isOpen = viewingHistoryId === session.id;
              return (
                <div key={session.id} className="border border-border rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewingHistoryId((prev) => (prev === session.id ? null : session.id))}
                    className="w-full flex items-center gap-3 px-4 py-3.5 lg:hover:bg-muted/30 transition-colors text-left min-h-[44px]"
                  >
                    <Star className="w-4 h-4 text-[#B8862F] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.startAt} ~ {session.endAt} · 작품 {workCount}개
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/50 px-4 pb-4 pt-3">
                      {workCount === 0 ? (
                        <p className="text-sm text-muted-foreground">선정 작품 없음</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {(session.selectedWorkIds ?? []).map((wid, idx) => {
                            const work = worksById.get(wid);
                            return (
                              <div key={wid} className="relative">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border/50">
                                  {work ? (
                                    <ImageWithFallback
                                      src={getThumbCover(work)}
                                      alt={displayExhibitionTitle(work, '무제')}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                      삭제됨
                                    </div>
                                  )}
                                </div>
                                <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-bold">
                                  {idx + 1}
                                </span>
                                {work && (
                                  <p className="text-xs text-muted-foreground truncate mt-1 leading-snug">
                                    {displayExhibitionTitle(work, '무제')}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 빈 상태 */}
      {activeSessions.length === 0 && historySessions.length === 0 && !showEditor && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Star className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">등록된 픽 세션이 없습니다</p>
          <button
            type="button"
            onClick={openNew}
            className="text-sm px-4 py-2 rounded-lg bg-primary text-white lg:hover:bg-primary/90"
          >
            첫 번째 픽 만들기
          </button>
        </div>
      )}
    </div>
  );
}

interface SortablePickWorkItemProps {
  work: Work;
  index: number;
  onRemove: () => void;
}

function SortablePickWorkItem({ work, index, onRemove }: SortablePickWorkItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isDragging ? 'bg-muted/60 shadow-sm' : 'lg:hover:bg-muted/30'}`}
    >
      <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0 text-right">{index + 1}</span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="순서 드래그"
        className="min-h-[44px] min-w-[24px] flex items-center cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border border-border/50 shrink-0">
        <ImageWithFallback
          src={getThumbCover(work)}
          alt={displayExhibitionTitle(work, '무제')}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(work, '무제')}</p>
        <p className="text-xs text-muted-foreground truncate">{work.artist?.name || '작가 미상'}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="제거"
        className="p-1.5 rounded-md text-muted-foreground lg:hover:text-destructive lg:hover:bg-muted/40 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </li>
  );
}
