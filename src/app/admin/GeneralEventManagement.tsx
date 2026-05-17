import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import {
  eventsStore,
  useManagedEvents,
  deriveEventStatus,
  statusLabelKo,
  type ManagedEvent,
  type EventStatus,
} from '../utils/eventsStore';
import { appendAuditLog } from '../utils/adminAuditLog';
import { useI18n } from '../i18n/I18nProvider';
import { AdminImageUpload } from './components/AdminImageUpload';

type DraftState = {
  title: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  startAt: string;
  endAt: string;
  displayStartAt: string;
  displayEndAt: string;
  resultUrl: string;
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  description: '',
  bannerImageUrl: '',
  startAt: '',
  endAt: '',
  displayStartAt: '',
  displayEndAt: '',
  resultUrl: '',
};

function statusBadgeClass(s: EventStatus) {
  if (s === 'active') return 'bg-primary/10 text-primary border border-border';
  if (s === 'scheduled') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

export default function GeneralEventManagement() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const allEvents = useManagedEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, []);

  const generalEvents = useMemo<ManagedEvent[]>(() => {
    const order: Record<EventStatus, number> = { active: 0, scheduled: 1, ended: 2 };
    return allEvents
      .filter((e) => e.type === 'general')
      .sort((a, b) => order[deriveEventStatus(a)] - order[deriveEventStatus(b)]);
  }, [allEvents]);

  const startEdit = (ev: ManagedEvent) => {
    setEditingId(ev.id);
    setDraft({
      title: ev.title,
      subtitle: ev.subtitle ?? '',
      description: ev.description,
      bannerImageUrl: ev.bannerImageUrl ?? '',
      startAt: ev.startAt,
      endAt: ev.endAt,
      displayStartAt: ev.displayStartAt ?? '',
      displayEndAt: ev.displayEndAt ?? '',
      resultUrl: ev.resultUrl ?? '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(false);
  };

  const removeEvent = async (ev: ManagedEvent) => {
    const ok = await openConfirm({
      title: `"${ev.title}"을(를) 삭제하시겠습니까?`,
      description: '삭제 후 복구할 수 없습니다.',
      destructive: true,
      confirmLabel: t('admin.notice.delete'),
    });
    if (!ok) return;
    eventsStore.remove(ev.id);
    appendAuditLog({ action: 'event_deleted', targetId: ev.id, targetSnapshot: { title: ev.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success('일반 이벤트가 삭제되었습니다.');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    const img = draft.bannerImageUrl.trim();
    const start = draft.startAt.trim();
    const end = draft.endAt.trim();
    const desc = draft.description.trim();

    if (!title || !img || !start || !end || !desc) {
      toast.error('제목·이미지·기간·내용은 필수입니다.');
      return;
    }
    if (start > end) {
      toast.error(t('admin.contest.errDateOrder'));
      return;
    }
    const displayStart = draft.displayStartAt.trim();
    const displayEnd = draft.displayEndAt.trim();
    if (!displayStart || !displayEnd) {
      toast.error('게시 기간(이벤트 메뉴 노출 기간)은 필수입니다.');
      return;
    }
    if (displayStart > displayEnd) {
      toast.error('게시 기간 시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    const payload: Omit<ManagedEvent, 'id'> = {
      type: 'general',
      title,
      subtitle: draft.subtitle.trim() || undefined,
      description: desc,
      bannerImageUrl: img,
      startAt: start,
      endAt: end,
      displayStartAt: displayStart,
      displayEndAt: displayEnd,
      resultUrl: draft.resultUrl.trim() || undefined,
    };
    if (editingId) {
      eventsStore.update(editingId, payload);
      appendAuditLog({ action: 'event_saved', targetId: editingId, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success('일반 이벤트가 수정되었습니다.');
    } else {
      const created = eventsStore.add(payload);
      appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success('일반 이벤트가 등록되었습니다.');
    }
    cancelEdit();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-base font-semibold mb-4 text-foreground">일반 이벤트 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">{t('admin.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-base font-semibold text-foreground">일반 이벤트 관리</h1>
        <Button
          type="button"
          onClick={() => { setEditingId(null); setDraft(emptyDraft); setShowForm(true); }}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          새 이벤트
        </Button>
      </div>

      {generalEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          등록된 일반 이벤트가 없습니다.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted text-left text-foreground">
                <th className="px-4 py-3 font-medium">이벤트명</th>
                <th className="px-4 py-3 font-medium">실행 기간</th>
                <th className="px-4 py-3 font-medium">게시 기간</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {generalEvents.map((ev) => {
                const s = deriveEventStatus(ev);
                return (
                  <tr key={ev.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {ev.title}
                      {ev.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{ev.startAt} ~ {ev.endAt}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {ev.displayStartAt || ev.displayEndAt
                        ? `${ev.displayStartAt ?? ev.startAt} ~ ${ev.displayEndAt ?? ev.endAt}`
                        : <span className="text-muted-foreground/40 text-[10px]">미설정</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s)}`}>
                        {statusLabelKo(s)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => startEdit(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30 inline-flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvent(ev)}
                        className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('admin.notice.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <form onSubmit={submit}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  {editingId ? '일반 이벤트 수정' : '새 일반 이벤트 등록'}
                </h2>
                <button type="button" onClick={cancelEdit} className="p-1.5 rounded-lg text-muted-foreground lg:hover:bg-muted/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">이벤트명 <span className="text-destructive">*</span></label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="이벤트명"
                      className="w-full border border-border rounded-lg h-9 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">부제목</label>
                    <input
                      value={draft.subtitle}
                      onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                      placeholder="부제목"
                      className="w-full border border-border rounded-lg h-9 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <AdminImageUpload
                      label="이벤트 대표 이미지"
                      required
                      value={draft.bannerImageUrl}
                      onChange={(url) => setDraft((d) => ({ ...d, bannerImageUrl: url }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">이벤트 내용 <span className="text-destructive">*</span></label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="이벤트 내용을 입력하세요"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-foreground mb-2">실행 기간 <span className="text-destructive">*</span></p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        시작일
                        <input type="date" value={draft.startAt} onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))} className="border border-border rounded-lg h-9 px-3 py-2 text-[14px] text-foreground" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        종료일
                        <input type="date" value={draft.endAt} onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))} className="border border-border rounded-lg h-9 px-3 py-2 text-[14px] text-foreground" />
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-foreground mb-2">게시 기간 <span className="text-destructive">*</span></p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span>게시 시작일 <span className="text-destructive">*</span></span>
                        <input type="date" value={draft.displayStartAt} onChange={(e) => setDraft((d) => ({ ...d, displayStartAt: e.target.value }))} className="border border-border rounded-lg h-9 px-3 py-2 text-[14px] text-foreground" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span>게시 종료일 <span className="text-destructive">*</span></span>
                        <input type="date" value={draft.displayEndAt} onChange={(e) => setDraft((d) => ({ ...d, displayEndAt: e.target.value }))} className="border border-border rounded-lg h-9 px-3 py-2 text-[14px] text-foreground" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">결과 발표 URL</label>
                    <input
                      type="url"
                      value={draft.resultUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, resultUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full border border-border rounded-lg h-9 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
                <button type="button" onClick={cancelEdit} className="text-sm px-4 py-2 rounded-lg border border-border text-foreground lg:hover:bg-muted/40">
                  {t('admin.contest.cancel')}
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
