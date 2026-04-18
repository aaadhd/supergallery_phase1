import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import {
  eventStore,
  useManagedEvents,
  deriveStatus,
  statusLabelKo,
  type ManagedEvent,
  type EventStatus,
} from '../utils/eventStore';
import { workStore } from '../store';

type DraftState = {
  title: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  startAt: string;
  endAt: string;
  worksPublic: boolean;
  participantsLabel: string;
  status: EventStatus | '';
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  description: '',
  bannerImageUrl: '',
  startAt: '',
  endAt: '',
  worksPublic: true,
  participantsLabel: '',
  status: '',
};

function statusBadgeClass(s: EventStatus) {
  if (s === 'active') return 'bg-primary/10 text-primary border border-border';
  if (s === 'scheduled') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

export default function EventManagement() {
  const [loading, setLoading] = useState(true);
  const events = useManagedEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  const sorted = useMemo(() => {
    const order: Record<EventStatus, number> = { active: 0, scheduled: 1, ended: 2 };
    return [...events].sort(
      (a, b) => order[deriveStatus(a)] - order[deriveStatus(b)],
    );
  }, [events]);

  const startEdit = (ev: ManagedEvent) => {
    setEditingId(ev.id);
    setDraft({
      title: ev.title,
      subtitle: ev.subtitle ?? '',
      description: ev.description,
      bannerImageUrl: ev.bannerImageUrl,
      startAt: ev.startAt,
      endAt: ev.endAt,
      worksPublic: ev.worksPublic,
      participantsLabel: ev.participantsLabel ?? '',
      status: ev.status ?? '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(false);
  };

  const remove = async (ev: ManagedEvent) => {
    const ok = await openConfirm({
      title: `"${ev.title}" 이벤트를 삭제할까요?`,
      description: '되돌릴 수 없습니다. 유저 목록·상세에서 즉시 제거됩니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    eventStore.remove(ev.id);
    // Clear linkedEventId from orphaned works
    workStore.getWorks().forEach((w) => {
      if (w.linkedEventId?.toString() === ev.id) {
        workStore.updateWork(w.id, { linkedEventId: undefined });
      }
    });
    toast.success('이벤트가 삭제되었습니다.');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    const desc = draft.description.trim();
    const img = draft.bannerImageUrl.trim();
    const start = draft.startAt.trim();
    const end = draft.endAt.trim();
    if (!title || !desc || !img || !start || !end) {
      toast.error('제목·설명·배너 이미지·기간은 필수입니다.');
      return;
    }
    if (start > end) {
      toast.error('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    const payload: Omit<ManagedEvent, 'id'> = {
      title,
      subtitle: draft.subtitle.trim() || undefined,
      description: desc,
      bannerImageUrl: img,
      startAt: start,
      endAt: end,
      worksPublic: draft.worksPublic,
      participantsLabel: draft.participantsLabel.trim() || undefined,
      status: draft.status || undefined,
    };
    if (editingId) {
      eventStore.update(editingId, payload);
      toast.success('이벤트가 수정되었습니다.');
    } else {
      eventStore.add(payload);
      toast.success('이벤트가 등록되었습니다.');
    }
    cancelEdit();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">이벤트 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-xl font-bold text-foreground">이벤트 관리</h1>
        <Button
          type="button"
          onClick={() => { setEditingId(null); setDraft(emptyDraft); setShowForm((v) => !v); }}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          새 이벤트
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        등록된 이벤트는 유저 목록(/events)과 상세(/events/:id)에 즉시 반영됩니다. 상태값은 시작/종료일 기준 자동 계산되며, 수동으로 덮어쓸 수도 있습니다.
      </p>

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 border border-border rounded-lg p-4 space-y-3 bg-muted/50"
        >
          <p className="text-sm font-medium text-foreground">{editingId ? '이벤트 수정' : '새 이벤트 등록'}</p>
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
              placeholder="배너 이미지 URL *"
              value={draft.bannerImageUrl}
              onChange={(e) => setDraft((d) => ({ ...d, bannerImageUrl: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
            />
            <textarea
              placeholder="상세 설명 *"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2 min-h-[80px]"
            />
            <input
              placeholder="참여자 안내 (예: 선착순 100명)"
              value={draft.participantsLabel}
              onChange={(e) => setDraft((d) => ({ ...d, participantsLabel: e.target.value }))}
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
            <label className="flex items-center gap-2 text-sm text-foreground px-1">
              <input
                type="checkbox"
                checked={draft.worksPublic}
                onChange={(e) => setDraft((d) => ({ ...d, worksPublic: e.target.checked }))}
              />
              참여작을 업로드 즉시 공개
            </label>
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as EventStatus | '' }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">상태: 자동 (기간 기준)</option>
              <option value="scheduled">예정 수동</option>
              <option value="active">진행중 수동</option>
              <option value="ended">종료 수동</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white">
              {editingId ? '수정' : '저장'}
            </Button>
            <Button
              type="button"
              onClick={cancelEdit}
              className="text-sm px-3 py-1.5 rounded-lg border border-border"
            >
              취소
            </Button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          등록된 이벤트가 없습니다. 상단 "새 이벤트" 버튼으로 등록해 보세요.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium">이벤트명</th>
                <th className="px-4 py-3 font-medium">기간</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">참여작 공개</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ev) => {
                const s = deriveStatus(ev);
                return (
                  <tr key={ev.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {ev.title}
                      {ev.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ev.startAt} ~ {ev.endAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s)}`}>
                        {statusLabelKo(s)}
                        {ev.status && <span className="ml-1 text-xs opacity-70">· 수동</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ev.worksPublic ? '즉시' : '종료 후'}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button
                        type="button"
                        onClick={() => startEdit(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30"
                      >
                        <Pencil className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        수정
                      </Button>
                      <Button
                        type="button"
                        onClick={() => remove(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
