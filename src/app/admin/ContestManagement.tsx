import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import {
  eventStore,
  useManagedEvents,
  deriveStatus,
  statusLabelKo,
  type ManagedEvent,
  type EventStatus,
  type ContestSubtype,
} from '../utils/eventStore';
import { workStore } from '../store';
import { appendAuditLog } from '../utils/adminAuditLog';

type DraftState = {
  title: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  startAt: string;
  endAt: string;
  worksPublic: boolean;
  subtype: ContestSubtype;
  status: EventStatus | '';
  publicationOpen: boolean;
  publishedAt: string;
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  description: '',
  bannerImageUrl: '',
  startAt: '',
  endAt: '',
  worksPublic: true,
  subtype: 'irregular',
  status: '',
  publicationOpen: false,
  publishedAt: '',
};

function statusBadgeClass(s: EventStatus) {
  if (s === 'active') return 'bg-primary/10 text-primary border border-border';
  if (s === 'scheduled') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

export default function ContestManagement() {
  const [loading, setLoading] = useState(true);
  const allEvents = useManagedEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(t);
  }, []);

  const contests = useMemo(() => allEvents.filter((e) => e.type === 'contest'), [allEvents]);

  const sorted = useMemo(() => {
    const order: Record<EventStatus, number> = { active: 0, scheduled: 1, ended: 2 };
    return [...contests].sort((a, b) => order[deriveStatus(a)] - order[deriveStatus(b)]);
  }, [contests]);

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
      subtype: ev.subtype ?? 'irregular',
      status: ev.status ?? '',
      publicationOpen: ev.publicationOpen ?? false,
      publishedAt: ev.publishedAt ?? '',
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
      title: `"${ev.title}" 응모전을 삭제할까요?`,
      description: '되돌릴 수 없습니다. 유저 목록·상세에서 즉시 제거됩니다.',
      destructive: true,
      confirmLabel: '삭제',
    });
    if (!ok) return;
    eventStore.remove(ev.id);
    workStore.getWorks().forEach((w) => {
      if (w.linkedEventId?.toString() === ev.id) {
        workStore.updateWork(w.id, { linkedEventId: undefined });
      }
    });
    appendAuditLog({ action: 'event_deleted', targetId: ev.id, targetSnapshot: { title: ev.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('응모전이 삭제되었습니다.');
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
    const existing = editingId ? eventStore.get(editingId) : null;
    const selectedCount = existing?.selectedWorkIds?.length ?? 0;
    if (draft.publicationOpen && selectedCount === 0) {
      toast.warning('선정작이 0건이라 발표 페이지가 빈 상태로 표시됩니다. 응모자 현황에서 선정작을 체크해 주세요.');
    }
    const payload: Omit<ManagedEvent, 'id'> = {
      type: 'contest',
      subtype: draft.subtype,
      title,
      subtitle: draft.subtitle.trim() || undefined,
      description: desc,
      bannerImageUrl: img,
      startAt: start,
      endAt: end,
      worksPublic: draft.worksPublic,
      status: draft.status || undefined,
      publicationOpen: draft.publicationOpen,
      publishedAt: draft.publishedAt.trim() || undefined,
    };
    if (editingId) {
      eventStore.update(editingId, payload);
      appendAuditLog({ action: 'event_saved', targetId: editingId, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success('응모전이 수정되었습니다.');
    } else {
      const created = eventStore.add(payload);
      appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success('응모전이 등록되었습니다.');
    }
    cancelEdit();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">응모전 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-xl font-bold text-foreground">응모전 관리</h1>
        <Button
          type="button"
          onClick={() => { setEditingId(null); setDraft(emptyDraft); setShowForm((v) => !v); }}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          새 응모전
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        등록된 응모전은 이벤트 목록(/events)과 상세(/events/:id)에 즉시 반영됩니다.
      </p>

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-6 border border-border rounded-lg p-4 space-y-3 bg-muted/50"
        >
          <p className="text-sm font-medium text-foreground">{editingId ? '응모전 수정' : '새 응모전 등록'}</p>
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
            <select
              value={draft.subtype}
              onChange={(e) => setDraft((d) => ({ ...d, subtype: e.target.value as ContestSubtype }))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="regular">정기 (Regular)</option>
              <option value="irregular">비정기 (Irregular)</option>
            </select>
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
            <label className="flex items-center gap-2 text-sm text-foreground px-1 sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.worksPublic}
                onChange={(e) => setDraft((d) => ({ ...d, worksPublic: e.target.checked }))}
              />
              참여작을 업로드 즉시 공개
            </label>

            <div className="sm:col-span-2 mt-2 pt-3 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-foreground">선정작 발표 페이지</p>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.publicationOpen}
                  onChange={(e) => setDraft((d) => ({ ...d, publicationOpen: e.target.checked }))}
                />
                선정작 발표 페이지를 사용자에게 게시 (USR-EVT-05)
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:max-w-xs">
                발표일 (선택 — 비우면 토글 ON 즉시 노출)
                <input
                  type="date"
                  value={draft.publishedAt}
                  onChange={(e) => setDraft((d) => ({ ...d, publishedAt: e.target.value }))}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
                />
              </label>
              <p className="text-[11px] text-muted-foreground">
                선정작은 응모자 현황에서 선정 체크박스로 입력합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white">
              {editingId ? '수정' : '저장'}
            </Button>
            <button type="button" onClick={cancelEdit} className="text-sm px-3 py-1.5 rounded-lg border border-border">
              취소
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          등록된 응모전이 없습니다. 상단 "새 응모전" 버튼으로 등록해 보세요.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium">응모전명</th>
                <th className="px-4 py-3 font-medium">유형</th>
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ev.subtype === 'regular' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                        {ev.subtype === 'regular' ? '정기' : '비정기'}
                      </span>
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
                      <Link
                        to={`/admin/events?event=${ev.id}`}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30 inline-flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        응모자
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEdit(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30"
                      >
                        <Pencil className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
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
