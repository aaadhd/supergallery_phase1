import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  bannerStore,
  useAdminBanners,
  MAX_BANNERS,
  type AdminBanner,
  type BannerBadge,
} from '../utils/bannerStore';
import { openConfirm } from '../components/ConfirmDialog';
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

const BADGES: BannerBadge[] = ['NEW', 'HOT', 'EVENT', 'PICK'];

type DraftState = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  badge: BannerBadge | '';
  startAt: string;
  endAt: string;
  isActive: boolean;
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  badge: '',
  startAt: '',
  endAt: '',
  isActive: true,
};

function statusBadgeClass(active: boolean, expired: boolean) {
  if (expired) return 'bg-red-50 text-red-700 border border-red-200';
  if (active) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

function isExpired(b: AdminBanner): boolean {
  if (!b.endAt) return false;
  return new Date().toISOString().slice(0, 10) > b.endAt;
}

function formatPeriod(b: AdminBanner): string {
  if (!b.startAt && !b.endAt) return '상시';
  return `${b.startAt || '시작일 미지정'} ~ ${b.endAt || '종료일 미지정'}`;
}

export default function BannerManagement() {
  const [loading, setLoading] = useState(true);
  const banners = useAdminBanners();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

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
    // arrayMove 호출은 store가 이미 처리함. 참조용.
    void arrayMove;
  };

  const toggleActive = (id: string, next: boolean) => {
    bannerStore.update(id, { isActive: next });
    toast.success(next ? '활성화되었습니다.' : '비활성화되었습니다.');
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
    toast.success('배너가 삭제되었습니다.');
  };

  const submitNew = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.imageUrl.trim()) {
      toast.error('제목과 이미지 URL을 입력해 주세요.');
      return;
    }
    const result = bannerStore.add({
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || undefined,
      imageUrl: draft.imageUrl.trim(),
      linkUrl: draft.linkUrl.trim() || undefined,
      badge: draft.badge || undefined,
      startAt: draft.startAt || undefined,
      endAt: draft.endAt || undefined,
      isActive: draft.isActive,
    });
    if (!result.ok) {
      toast.error(`배너는 최대 ${MAX_BANNERS}개까지 등록할 수 있습니다.`);
      return;
    }
    setDraft(emptyDraft);
    setShowForm(false);
    toast.success('배너가 등록되었습니다. 둘러보기에 반영됩니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">배너 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  const atLimit = banners.length >= MAX_BANNERS;

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-xl font-bold text-foreground">배너 관리</h1>
        <Button
          type="button"
          disabled={atLimit}
          onClick={() => setShowForm((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4" />
          새 배너
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        등록한 배너는 둘러보기 히어로 슬라이더에 반영됩니다. 등록 가능 {banners.length} / {MAX_BANNERS}개. 기본 더미 배너는 등록 배너가 없을 때만 노출됩니다.
      </p>

      {showForm && !atLimit && (
        <form
          onSubmit={submitNew}
          className="mb-6 border border-border rounded-lg p-4 space-y-3 bg-muted/50"
        >
          <p className="text-sm font-medium text-foreground">새 배너 등록</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="제목 *"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="부제 (선택)"
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              placeholder="이미지 URL *"
              value={draft.imageUrl}
              onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
            <input
              placeholder="링크 URL (선택)"
              value={draft.linkUrl}
              onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
            <select
              value={draft.badge}
              onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value as BannerBadge | '' }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">배지 없음</option>
              {BADGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-foreground px-1">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
              />
              등록 즉시 활성화
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              시작일
              <input
                type="date"
                value={draft.startAt}
                onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              종료일
              <input
                type="date"
                value={draft.endAt}
                onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white">
              저장
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowForm(false);
                setDraft(emptyDraft);
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-border"
            >
              취소
            </Button>
          </div>
        </form>
      )}

      {banners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          등록된 배너가 없습니다. 둘러보기에는 기본 더미 배너가 노출됩니다.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-3">
              {banners.map((b, idx) => (
                <SortableBannerRow
                  key={b.id}
                  banner={b}
                  index={idx}
                  onToggleActive={toggleActive}
                  onRemove={handleRemove}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface SortableBannerRowProps {
  banner: AdminBanner;
  index: number;
  onToggleActive: (id: string, next: boolean) => void;
  onRemove: (id: string, title: string) => void;
}

function SortableBannerRow({ banner: b, index: idx, onToggleActive, onRemove }: SortableBannerRowProps) {
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
        isDragging ? 'border-primary shadow-lg' : 'border-border lg:hover:bg-muted/50'
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
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{b.title}</p>
          {b.badge && (
            <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {b.badge}
            </span>
          )}
        </div>
        {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
        {b.linkUrl && <p className="text-xs text-primary break-all">{b.linkUrl}</p>}
        <p className="text-xs text-muted-foreground">{formatPeriod(b)}</p>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(b.isActive, expired)}`}>
          {expired ? '기간 종료' : b.isActive ? '활성' : '비활성'}
        </span>
      </div>
      <div className="flex sm:flex-col gap-2 justify-end">
        <Button
          type="button"
          onClick={() => onToggleActive(b.id, !b.isActive)}
          disabled={expired}
          className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-white disabled:opacity-50 disabled:pointer-events-none"
        >
          {b.isActive ? '비활성으로' : '활성으로'}
        </Button>
        <Button
          type="button"
          onClick={() => onRemove(b.id, b.title)}
          className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          삭제
        </Button>
      </div>
    </li>
  );
}
