import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import { AdminImageUpload } from './components/AdminImageUpload';
import { Button } from '../components/ui/button';
import {
  bannerStore,
  useAdminBanners,
  type AdminBanner,
} from '../utils/bannerStore';
import { openConfirm } from '../components/ConfirmDialog';
import { todayLocalIso } from '../utils/localDate';
import { appendAuditLog } from '../utils/adminAuditLog';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type DraftState = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  startAt: string;
  endAt: string;
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  startAt: '',
  endAt: '',
};

function statusBadgeClass(active: boolean, expired: boolean) {
  if (expired) return 'bg-red-50 text-red-700 border border-red-200';
  if (active) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

function isExpired(b: AdminBanner): boolean {
  if (!b.endAt) return false;
  return todayLocalIso() > b.endAt;
}

function formatPeriod(b: AdminBanner): string {
  if (!b.startAt && !b.endAt) return '상시';
  return `${b.startAt || '시작일 미지정'} ~ ${b.endAt || '종료일 미지정'}`;
}

function isUpcoming(b: AdminBanner): boolean {
  if (isExpired(b)) return false;
  if (!b.startAt) return false;
  return todayLocalIso() < b.startAt;
}

function isLive(b: AdminBanner): boolean {
  return b.isActive && !isExpired(b) && !isUpcoming(b);
}

type BannerTab = 'live' | 'upcoming' | 'expired';

export default function BannerManagement() {
  const [loading, setLoading] = useState(true);
  const banners = useAdminBanners();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BannerTab>('live');

  const grouped = useMemo(() => ({
    live: banners.filter((b) => isLive(b)),
    upcoming: banners.filter((b) => !isExpired(b) && !isLive(b)),
    expired: banners.filter((b) => isExpired(b)),
  }), [banners]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    bannerStore.reorder(oldIndex, newIndex);
    toast.success('순서가 변경되었습니다.');
  };

  const toggleActive = (id: string, next: boolean) => {
    bannerStore.update(id, { isActive: next });
    if (!next && activeTab === 'live') {
      setActiveTab('upcoming');
      toast.success('비활성화되었습니다. 예정 탭으로 이동합니다.');
    } else {
      toast.success(next ? '활성화되었습니다.' : '비활성화되었습니다.');
    }
  };

  const handleRemove = async (id: string, title: string) => {
    const ok = await openConfirm({
      title: '배너를 삭제할까요?',
      description: `"${title}" 배너가 즉시 노출에서 제거됩니다.`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    bannerStore.remove(id);
    appendAuditLog({ action: 'banner_deleted', targetId: id, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('배너가 삭제되었습니다.');
  };

  const openEdit = (b: AdminBanner) => {
    setDraft({
      title: b.title,
      subtitle: b.subtitle ?? '',
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? '',
      startAt: b.startAt ?? '',
      endAt: b.endAt ?? '',
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.imageUrl.trim()) {
      toast.error('제목과 이미지를 입력해 주세요.');
      return;
    }
    if (draft.linkUrl.trim() && !isValidUrl(draft.linkUrl.trim())) {
      toast.error('링크 URL 형식이 올바르지 않아요. (http:// 또는 https:// 로 시작해야 해요)');
      return;
    }
    if (draft.startAt && draft.endAt && draft.startAt > draft.endAt) {
      toast.error('게시 기간 시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    const base = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || undefined,
      imageUrl: draft.imageUrl.trim(),
      linkUrl: draft.linkUrl.trim() || undefined,
      startAt: draft.startAt || undefined,
      endAt: draft.endAt || undefined,
    };
    if (editingId) {
      bannerStore.update(editingId, base);
      appendAuditLog({ action: 'banner_saved', targetId: editingId, targetSnapshot: { title: base.title }, actorId: 'admin', actorRole: 'admin' });
      closeForm();
      toast.success('배너가 수정되었습니다.');
    } else {
      const result = bannerStore.add({ ...base, isActive: true });
      if (!result.ok) {
        toast.error('배너 등록에 실패했습니다.');
        return;
      }
      appendAuditLog({ action: 'banner_saved', targetId: result.id ?? 'new', targetSnapshot: { title: base.title }, actorId: 'admin', actorRole: 'admin' });
      closeForm();
      toast.success('배너가 등록되었습니다. 둘러보기에 반영됩니다.');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-base font-semibold mb-4 text-foreground">배너 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-base font-semibold text-foreground">배너 관리</h1>
        <Button
          type="button"
          onClick={() => { setEditingId(null); setDraft(emptyDraft); setShowForm(true); }}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          새 배너
        </Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-border mb-4">
        {([
          { key: 'live', label: '게시 중', count: grouped.live.length },
          { key: 'upcoming', label: '예정', count: grouped.upcoming.length },
          { key: 'expired', label: '기간 종료', count: grouped.expired.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground lg:hover:text-foreground'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {grouped[activeTab].length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {activeTab === 'live' && '게시 중인 배너가 없습니다.'}
          {activeTab === 'upcoming' && '예정된 배너가 없습니다.'}
          {activeTab === 'expired' && '기간 종료된 배너가 없습니다.'}
        </div>
      ) : activeTab === 'expired' ? (
        <ol className="space-y-3">
          {grouped.expired.map((b) => (
            <SortableBannerRow
              key={b.id}
              banner={b}
              index={banners.indexOf(b)}
              isEditing={editingId === b.id}
              onToggleActive={toggleActive}
              onRemove={handleRemove}
              onEdit={openEdit}
            />
          ))}
        </ol>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-3">
              {grouped[activeTab].map((b) => (
                <SortableBannerRow
                  key={b.id}
                  banner={b}
                  index={banners.indexOf(b)}
                  isEditing={editingId === b.id}
                  onToggleActive={toggleActive}
                  onRemove={handleRemove}
                  onEdit={openEdit}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <form onSubmit={submitForm}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  {editingId ? '배너 수정' : '새 배너 등록'}
                </h2>
                <button type="button" onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground lg:hover:bg-muted/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">제목 <span className="text-destructive">*</span></label>
                    <input
                      placeholder="봄의 기억들"
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">부제</label>
                    <input
                      placeholder="봄을 담은 작품들"
                      value={draft.subtitle}
                      onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <AdminImageUpload
                      label="배너 이미지"
                      required
                      value={draft.imageUrl}
                      onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">링크 URL</label>
                    <input
                      placeholder="https://..."
                      value={draft.linkUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        게시 시작일
                        <input type="date" value={draft.startAt} onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        게시 종료일
                        <input type="date" value={draft.endAt} onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
                <button type="button" onClick={closeForm} className="text-sm px-4 py-2 rounded-lg border border-border text-foreground lg:hover:bg-muted/40">
                  취소
                </button>
                <Button type="submit" className="text-sm px-4 py-2 rounded-lg bg-primary text-white">
                  {editingId ? '수정' : '저장'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SortableBannerRowProps {
  banner: AdminBanner;
  index: number;
  isEditing: boolean;
  onToggleActive: (id: string, next: boolean) => void;
  onRemove: (id: string, title: string) => void;
  onEdit: (banner: AdminBanner) => void;
}

function SortableBannerRow({ banner: b, index: idx, isEditing, onToggleActive, onRemove, onEdit }: SortableBannerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id });
  const expired = isExpired(b);
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 flex flex-col sm:flex-row gap-4 transition-colors bg-white ${
        isDragging ? 'border-primary shadow-lg' : isEditing ? 'border-primary ring-2 ring-primary/20' : 'border-border lg:hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-2 shrink-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="순서 드래그"
          className="pt-1.5 min-h-[44px] min-w-[44px] flex items-start justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <span className="text-xs text-muted-foreground tabular-nums pt-1 w-5">{idx + 1}</span>
        <div className="w-full sm:w-40 h-24 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">이미지 없음</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{b.title}</p>
        {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
        {b.linkUrl && <p className="text-xs text-primary break-all">{b.linkUrl}</p>}
        <p className="text-xs text-muted-foreground">게시: {formatPeriod(b)}</p>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(b.isActive, expired)}`}>
          {expired ? '기간 종료' : b.isActive ? '활성' : '비활성'}
        </span>
      </div>
      <div className="flex sm:flex-col gap-2 justify-end shrink-0">
        <button
          type="button"
          onClick={() => onEdit(b)}
          className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground bg-white lg:hover:bg-muted/40 whitespace-nowrap"
        >
          수정
        </button>
        {!expired && (
          <button
            type="button"
            onClick={() => onToggleActive(b.id, !b.isActive)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground bg-white lg:hover:bg-muted/40 whitespace-nowrap"
          >
            {b.isActive ? '비활성으로' : '활성으로'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(b.id, b.title)}
          className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-white lg:hover:bg-red-50 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5" />
          삭제
        </button>
      </div>
    </li>
  );
}
